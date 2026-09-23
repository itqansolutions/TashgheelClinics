/**
 * Global setup — runs ONCE before ALL isolation tests.
 *
 * Creates two isolated test tenants in the real DB:
 *   - TENANT_A (id stored in process.env.TEST_TENANT_A_ID)
 *   - TENANT_B (id stored in process.env.TEST_TENANT_B_ID)
 *
 * Each tenant gets:
 *   - One ACTIVE subscription (no expiry)
 *   - One Admin user with a known password
 *   - One Patient record belonging ONLY to that tenant
 *
 * The global teardown removes all test data after the suite finishes.
 *
 * IMPORTANT: This requires a running PostgreSQL database (uses DATABASE_URL from .env).
 * Run Migration 001 first before running isolation tests.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Unique slug prefix to avoid collision with real data
const TEST_PREFIX = `__iso_test_${Date.now()}`;

export default async function globalSetup(): Promise<void> {
  console.log('\n[ISO-SETUP] Creating test tenants...');

  const hash = await bcrypt.hash('Test@123456', 10);

  // ── Tenant A ──────────────────────────────────────────────────────────────
  const tenantA = await prisma.tenant.create({
    data: {
      name:         'Isolation Test Clinic A',
      slug:         `${TEST_PREFIX}_a`,
      status:       'ACTIVE',
      contactEmail: 'a@iso.test',
      subscriptions: {
        create: { plan: 'TRIAL', status: 'ACTIVE', startDate: new Date() },
      },
      users: {
        create: {
          fullName:     'Admin A',
          email:        `${TEST_PREFIX}_admin_a@iso.test`,
          passwordHash: hash,
          role:         'Admin',
        },
      },
      patients: {
        create: {
          code:     `${TEST_PREFIX}_P001`,
          fullName: 'Patient Belonging to Tenant A',
        },
      },
    },
    include: { users: true, patients: true },
  });

  // ── Tenant B ──────────────────────────────────────────────────────────────
  const tenantB = await prisma.tenant.create({
    data: {
      name:         'Isolation Test Clinic B',
      slug:         `${TEST_PREFIX}_b`,
      status:       'ACTIVE',
      contactEmail: 'b@iso.test',
      subscriptions: {
        create: { plan: 'TRIAL', status: 'ACTIVE', startDate: new Date() },
      },
      users: {
        create: {
          fullName:     'Admin B',
          email:        `${TEST_PREFIX}_admin_b@iso.test`,
          passwordHash: hash,
          role:         'Admin',
        },
      },
      patients: {
        create: {
          code:     `${TEST_PREFIX}_P001`, // Same code — valid because it's per-tenant
          fullName: 'Patient Belonging to Tenant B',
        },
      },
    },
    include: { users: true, patients: true },
  });

  // ── System Admin ──────────────────────────────────────────────────────────
  const sysAdmin = await prisma.user.create({
    data: {
      fullName:     'System Admin (ISO Test)',
      email:        `${TEST_PREFIX}_sysadmin@iso.test`,
      passwordHash: hash,
      role:         'Admin',
      tenantId:     null,
      systemRole:   'SYSTEM_ADMIN',
    },
  });

  // ── Suspended Tenant ──────────────────────────────────────────────────────
  const tenantSuspended = await prisma.tenant.create({
    data: {
      name:         'Suspended Clinic (ISO Test)',
      slug:         `${TEST_PREFIX}_suspended`,
      status:       'SUSPENDED',
      contactEmail: 'suspended@iso.test',
      subscriptions: {
        create: { plan: 'TRIAL', status: 'CANCELLED', startDate: new Date() },
      },
      users: {
        create: {
          fullName:     'Admin Suspended',
          email:        `${TEST_PREFIX}_admin_suspended@iso.test`,
          passwordHash: hash,
          role:         'Admin',
        },
      },
    },
    include: { users: true },
  });

  // Store IDs in env so tests can access them
  process.env.TEST_PREFIX              = TEST_PREFIX;
  process.env.TEST_TENANT_A_ID        = String(tenantA.id);
  process.env.TEST_TENANT_B_ID        = String(tenantB.id);
  process.env.TEST_TENANT_SUSP_ID     = String(tenantSuspended.id);
  process.env.TEST_USER_A_ID          = String(tenantA.users[0].id);
  process.env.TEST_USER_B_ID          = String(tenantB.users[0].id);
  process.env.TEST_USER_SUSP_ID       = String(tenantSuspended.users[0].id);
  process.env.TEST_SYS_ADMIN_ID       = String(sysAdmin.id);
  process.env.TEST_PATIENT_A_ID       = String(tenantA.patients[0].id);
  process.env.TEST_PATIENT_B_ID       = String(tenantB.patients[0].id);

  console.log(`[ISO-SETUP] Tenant A: id=${tenantA.id}`);
  console.log(`[ISO-SETUP] Tenant B: id=${tenantB.id}`);
  console.log(`[ISO-SETUP] Suspended: id=${tenantSuspended.id}`);
  console.log('[ISO-SETUP] Setup complete.\n');

  await prisma.$disconnect();
}
