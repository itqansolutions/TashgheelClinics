/**
 * Test helpers for isolation tests.
 *
 * Provides:
 *   - mintToken(): generates a signed JWT for a test user without hitting the DB
 *   - mintExpiredToken(): generates an already-expired JWT for T-ISO-06
 *   - mintForgedToken(): generates a JWT with a forged tenantId for T-ISO-05
 *   - TENANT_A_ID, TENANT_B_ID, etc.: typed env accessors
 */

import { signAccessToken } from '../../utils/jwt';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

// ── Env accessors ─────────────────────────────────────────────────────────────

export const getTenantAId       = () => parseInt(process.env.TEST_TENANT_A_ID!);
export const getTenantBId       = () => parseInt(process.env.TEST_TENANT_B_ID!);
export const getTenantSuspId    = () => parseInt(process.env.TEST_TENANT_SUSP_ID!);
export const getUserAId         = () => parseInt(process.env.TEST_USER_A_ID!);
export const getUserBId         = () => parseInt(process.env.TEST_USER_B_ID!);
export const getUserSuspId      = () => parseInt(process.env.TEST_USER_SUSP_ID!);
export const getSysAdminId      = () => parseInt(process.env.TEST_SYS_ADMIN_ID!);
export const getPatientAId      = () => parseInt(process.env.TEST_PATIENT_A_ID!);
export const getPatientBId      = () => parseInt(process.env.TEST_PATIENT_B_ID!);

// ── Token helpers ─────────────────────────────────────────────────────────────

/** Standard valid token for a tenant user */
export function mintToken(userId: number, tenantId: number, role = 'Admin'): string {
  return signAccessToken({ sub: userId, role, tenantId, systemRole: undefined });
}

/** Token claiming to belong to tenantB but signed as tenantA user */
export function mintForgedToken(realUserId: number, realTenantId: number, forgeTenantId: number): string {
  return signAccessToken({ sub: realUserId, role: 'Admin', tenantId: forgeTenantId });
}

/** JWT that is already expired (exp = 1 second ago) */
export function mintExpiredToken(userId: number, tenantId: number): string {
  return jwt.sign(
    { sub: userId, role: 'Admin', tenantId },
    env.JWT_SECRET,
    { expiresIn: '1ms' } // effectively expired immediately
  );
}

/** System Admin token — no tenantId */
export function mintSysAdminToken(userId: number): string {
  return signAccessToken({
    sub:        userId,
    role:       'Admin',
    tenantId:   null,
    systemRole: 'SYSTEM_ADMIN',
  });
}

/** Token for a suspended-tenant user */
export function mintSuspendedToken(userId: number, tenantId: number): string {
  return signAccessToken({ sub: userId, role: 'Admin', tenantId });
}
