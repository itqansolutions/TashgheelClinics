import bcrypt from 'bcryptjs';
import prisma from '../../config/db';
import { AppError } from '../../middleware/errorHandler';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';

export const authService = {
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || !user.isActive) {
      throw new AppError('Invalid email or password', 401);
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    const payload = { sub: user.id, role: user.role };
    const accessToken  = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
      user: {
        id:       user.id,
        fullName: user.fullName,
        email:    user.email,
        role:     user.role,
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

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive', 401);
    }

    const newPayload    = { sub: user.id, role: user.role };
    const accessToken   = signAccessToken(newPayload);
    const refreshToken  = signRefreshToken(newPayload);

    return { accessToken, refreshToken };
  },

  async me(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, fullName: true, email: true, role: true, createdAt: true },
    });
    if (!user) throw new AppError('User not found', 404);
    return user;
  },
};
