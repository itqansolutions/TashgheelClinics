import { Request, Response, NextFunction } from 'express';
import { LRUCache } from 'lru-cache';
import prisma from '../config/db';
import { sendError } from '../utils/response';
import { JwtPayload } from '../utils/jwt';
import type { Tenant, Subscription } from '@prisma/client';

import { auditSystemAdminAccess } from '../utils/systemAdminAudit';
import { tenantStorage } from '../utils/tenantStorage';
import { tenantPrisma, TenantPrismaClient } from '../utils/tenantPrisma';

// ── Types ──────────────────────────────────────────────────────────────────

/**
 * Unified request context attached to every authenticated request.
 * Replaces scattered req.tenant!.id / req.user!.role calls throughout controllers.
 */
export interface TenantContext {
  tenantId:   number;
  tenantName: string;
  tenantSlug: string;
  plan:       string;    // TenantPlan enum value
  status:     string;    // TenantStatus enum value
  subStatus:  string;    // SubscriptionStatus enum value
  userId:     number;
  userRole:   string;
  systemRole: string | null;
}

/** Minimal public tenant info exposed on unauthenticated booking endpoints */
export interface PublicTenantInfo {
  id:           number;
  name:         string;
  slug:         string;
  logoUrl:      string | null;
  primaryColor: string | null;
}

// Extend Express Request globally
declare global {
  namespace Express {
    interface Request {
      user?:         JwtPayload;
      tenantCtx?:    TenantContext;
      publicTenant?: PublicTenantInfo;
      db?:           TenantPrismaClient;
    }
  }
}

// ── LRU Cache ──────────────────────────────────────────────────────────────
// Caches tenant + active subscription per tenantId for 5 minutes.
// Evicted on: tenant status change (invalidateTenantCache), or TTL expiry.

type CachedTenant = {
  tenant: Tenant;
  sub:    Subscription | null;
};

const tenantCache = new LRUCache<number, CachedTenant>({
  max: 500,
  ttl: 5 * 60 * 1000, // 5 minutes
});

export function invalidateTenantCache(tenantId: number): void {
  tenantCache.delete(tenantId);
}

// ── resolveTenant ──────────────────────────────────────────────────────────

/**
 * Middleware for all authenticated tenant routes.
 * 1. System Admins bypass tenant resolution (with audit log).
 * 2. Resolves Tenant + active Subscription from DB (cached).
 * 3. Validates the access matrix (TenantStatus × SubscriptionStatus).
 * 4. Builds TenantContext and attaches it to req.tenantCtx.
 */
export async function resolveTenant(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // ── System Admin bypass ───────────────────────────────────────────────────
  // System Admin users intentionally cross tenant boundaries.
  // Every such request is audited (see auditSystemAdminAccess).
  if (req.user?.systemRole === 'SYSTEM_ADMIN' || req.user?.systemRole === 'SUPPORT') {
    const targetTenantId = req.params?.tenantId ? parseInt(req.params.tenantId) : undefined;
    await auditSystemAdminAccess(req, `REQUEST_ACCESS:${req.method}`, targetTenantId);
    return next();
  }

  // ── Regular tenant user ───────────────────────────────────────────────────
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    sendError(res, 'No tenant associated with this account.', 403);
    return;
  }

  // ── Load from cache or DB ──────────────────────────────────────────────────
  let cached = tenantCache.get(tenantId);

  if (!cached) {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      sendError(res, 'Tenant not found.', 403);
      return;
    }

    // Load the latest subscription for this tenant
    const sub = await prisma.subscription.findFirst({
      where:   { tenantId },
      orderBy: { startDate: 'desc' },
    });

    cached = { tenant, sub };
    tenantCache.set(tenantId, cached);
  }

  const { tenant, sub } = cached;

  // ── Access Matrix ─────────────────────────────────────────────────────────
  // TenantStatus × SubscriptionStatus → allow / restrict / block

  if (tenant.status === 'PENDING_VERIFICATION') {
    sendError(res, 'Please verify your email address to access your account.', 403);
    return;
  }

  if (tenant.status === 'CANCELLED') {
    sendError(res, 'This account has been cancelled. Contact support to export your data.', 403);
    return;
  }

  if (tenant.status === 'SUSPENDED') {
    sendError(res, 'Your account is suspended. Please upgrade your plan to continue.', 402);
    return;
  }

  // ACTIVE tenant — check subscription status
  if (sub?.status === 'PAST_DUE') {
    // Allow access but attach a warning header (frontend displays a banner)
    res.setHeader('X-Subscription-Warning', 'past_due');
    res.setHeader('X-Subscription-Grace-Days', '3');
  }

  // ── Build TenantContext ────────────────────────────────────────────────────
  req.tenantCtx = {
    tenantId:   tenant.id,
    tenantName: tenant.name,
    tenantSlug: tenant.slug,
    plan:       sub?.plan    ?? 'TRIAL',
    status:     tenant.status,
    subStatus:  sub?.status  ?? 'TRIAL',
    userId:     req.user!.sub,
    userRole:   req.user!.role,
    systemRole: req.user!.systemRole ?? null,
  };

  req.db = tenantPrisma(tenant.id);

  tenantStorage.run(
    { tenantId: tenant.id, systemRole: req.user?.systemRole ?? null },
    () => next()
  );
}

// ── resolvePublicTenant ────────────────────────────────────────────────────

/**
 * Middleware for unauthenticated public routes (e.g. /api/public/booking).
 * Resolves tenant from ?slug=clinic-slug query param or X-Tenant-Slug header.
 * Attaches minimal, safe public tenant info to req.publicTenant.
 *
 * All public queries MUST use tenantPrisma(req.publicTenant.id) to stay isolated.
 */
export async function resolvePublicTenant(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const slug =
    (req.query.slug as string | undefined) ??
    (req.headers['x-tenant-slug'] as string | undefined);

  if (!slug) {
    sendError(res, 'Clinic identifier (slug) is required.', 400);
    return;
  }

  const tenant = await prisma.tenant.findUnique({
    where:  { slug },
    select: {
      id:           true,
      name:         true,
      slug:         true,
      status:       true,
      logoUrl:      true,
      primaryColor: true,
    },
  });

  if (!tenant) {
    sendError(res, 'Clinic not found.', 404);
    return;
  }

  if (tenant.status !== 'ACTIVE') {
    sendError(res, 'This clinic is currently not accepting online bookings.', 403);
    return;
  }

  // Only expose safe public fields — never internal tenant metadata
  req.publicTenant = {
    id:           tenant.id,
    name:         tenant.name,
    slug:         tenant.slug,
    logoUrl:      tenant.logoUrl,
    primaryColor: tenant.primaryColor,
  };

  req.db = tenantPrisma(tenant.id);

  tenantStorage.run(
    { tenantId: tenant.id, systemRole: null },
    () => next()
  );
}
