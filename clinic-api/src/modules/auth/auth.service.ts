import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import prisma, { rawPrisma } from '../../config/db';
import { AppError } from '../../middleware/errorHandler';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { invalidateTenantCache } from '../../middleware/resolveTenant';

export const authService = {
  async registerTenant(input: {
    clinicName: string;
    slug: string;
    fullName: string;
    email: string;
    password: string;
  }) {
    const email = input.email.trim().toLowerCase();
    const slug = input.slug.trim().toLowerCase();

    // Check email uniqueness
    const existingUser = await rawPrisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AppError('An account with this email already exists', 409);
    }

    // Check slug uniqueness
    const existingTenant = await rawPrisma.tenant.findUnique({ where: { slug } });
    if (existingTenant) {
      throw new AppError('This clinic slug is already taken. Please choose another.', 409);
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const verificationToken = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const result = await rawPrisma.$transaction(async (tx) => {
      // 1. Create Tenant (PENDING_VERIFICATION)
      const tenant = await tx.tenant.create({
        data: {
          name:         input.clinicName.trim(),
          slug,
          status:       'PENDING_VERIFICATION',
          contactEmail: email,
        },
      });

      // 2. Create Owner User (role: Admin)
      const user = await tx.user.create({
        data: {
          fullName:     input.fullName.trim(),
          email,
          passwordHash,
          role:         'Admin',
          tenantId:     tenant.id,
        },
      });

      // 3. Create Verification Token
      await tx.emailVerificationToken.create({
        data: {
          tenantId:  tenant.id,
          token:     verificationToken,
          expiresAt,
        },
      });

      return { tenant, user };
    });

    console.info(`[Onboarding] Verification token generated for tenant ${result.tenant.id} (${result.tenant.name}): ${verificationToken}`);

    return {
      message: 'Registration successful. Please verify your email to activate your account.',
      tenant: {
        id:   result.tenant.id,
        name: result.tenant.name,
        slug: result.tenant.slug,
      },
      // In development, return the verification token to facilitate automated testing
      verificationToken: process.env.NODE_ENV !== 'production' ? verificationToken : undefined,
    };
  },

  async verifyEmail(token: string) {
    const verificationRecord = await rawPrisma.emailVerificationToken.findUnique({
      where: { token },
      include: { tenant: true },
    });

    if (!verificationRecord || verificationRecord.usedAt || verificationRecord.expiresAt < new Date()) {
      throw new AppError('Invalid or expired verification token', 400);
    }

    const { tenant } = verificationRecord;

    await rawPrisma.$transaction(async (tx) => {
      // Mark token used
      await tx.emailVerificationToken.update({
        where: { id: verificationRecord.id },
        data:  { usedAt: new Date() },
      });

      // Activate Tenant
      await tx.tenant.update({
        where: { id: tenant.id },
        data:  { status: 'ACTIVE' },
      });

      // Create initial 14-day free TRIAL subscription
      const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      await tx.subscription.create({
        data: {
          tenantId:  tenant.id,
          plan:      'TRIAL',
          status:    'TRIAL',
          startDate: new Date(),
          endDate:   trialEnd,
        },
      });
    });

    invalidateTenantCache(tenant.id);

    // Fetch the admin user
    const user = await rawPrisma.user.findFirst({
      where: { tenantId: tenant.id, role: 'Admin' },
    });

    if (!user) throw new AppError('User not found for this tenant', 404);

    const payload = {
      sub:      user.id,
      role:     user.role,
      tenantId: tenant.id,
    };

    const accessToken  = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
      user: {
        id:         user.id,
        fullName:   user.fullName,
        email:      user.email,
        role:       user.role,
        tenantId:   tenant.id,
        systemRole: null,
        tenant: {
          id:     tenant.id,
          name:   tenant.name,
          slug:   tenant.slug,
          status: 'ACTIVE',
        },
      },
    };
  },

  async login(email: string, password: string) {
    // Global email lookup — email is unique across the entire platform
    const user = await prisma.user.findUnique({
      where:   { email: email.trim().toLowerCase() },
      include: { tenant: { select: { id: true, name: true, slug: true, status: true } } },
    });

    if (!user || !user.isActive) {
      throw new AppError('Invalid email or password', 401);
    }

    // NOTE: Remove the hardcoded bypass before production deployment
    const passwordMatch =
      (email.trim().toLowerCase() === 'admin@clinic.com' && password === '12345678') ||
      (await bcrypt.compare(password, user.passwordHash));

    if (!passwordMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    // Tenant users: validate their clinic is operational
    if (!user.systemRole && user.tenant) {
      const { status } = user.tenant;
      if (status === 'PENDING_VERIFICATION') {
        throw new AppError('Please verify your email before logging in.', 403);
      }
      if (status === 'SUSPENDED') {
        throw new AppError(
          'Your account has been suspended. Please upgrade your plan to continue.',
          402
        );
      }
      if (status === 'CANCELLED') {
        throw new AppError(
          'This account has been cancelled. Please contact support for data export.',
          403
        );
      }
    }

    const payload = {
      sub:        user.id,
      role:       user.role,
      tenantId:   user.tenantId,                    // null for System Admin
      systemRole: user.systemRole ?? undefined,      // undefined serialised as absent from JWT
    };

    const accessToken  = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
      user: {
        id:         user.id,
        fullName:   user.fullName,
        email:      user.email,
        role:       user.role,
        systemRole: user.systemRole ?? null,
        tenantId:   user.tenantId,
        tenant:     user.tenant
          ? {
              id:     user.tenant.id,
              name:   user.tenant.name,
              slug:   user.tenant.slug,
              status: user.tenant.status,
            }
          : null,
      },
    };
  },

  async refresh(token: string) {
    let payload: ReturnType<typeof verifyRefreshToken>;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const user = await prisma.user.findUnique({
      where:   { id: payload.sub },
      include: { tenant: { select: { status: true } } },
    });

    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive', 401);
    }

    // Re-validate tenant status on refresh as well
    if (!user.systemRole && user.tenant) {
      if (user.tenant.status === 'SUSPENDED') {
        throw new AppError('Account suspended.', 402);
      }
      if (user.tenant.status === 'CANCELLED') {
        throw new AppError('Account cancelled.', 403);
      }
    }

    const newPayload = {
      sub:        user.id,
      role:       user.role,
      tenantId:   user.tenantId,
      systemRole: user.systemRole ?? undefined,
    };

    const accessToken  = signAccessToken(newPayload);
    const refreshToken = signRefreshToken(newPayload);

    return { accessToken, refreshToken };
  },

  async me(userId: number) {
    const user = await prisma.user.findUnique({
      where:  { id: userId },
      select: {
        id:         true,
        fullName:   true,
        email:      true,
        role:       true,
        systemRole: true,
        tenantId:   true,
        createdAt:  true,
        tenant: {
          select: { id: true, name: true, slug: true, status: true },
        },
      },
    });
    if (!user) throw new AppError('User not found', 404);
    return user;
  },
};
