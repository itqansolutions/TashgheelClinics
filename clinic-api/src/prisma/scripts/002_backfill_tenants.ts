/**
 * Migration 002: SaaS Phase 2a — Backfill all existing records to a seed Tenant.
 *
 * Run this AFTER Migration 001 (001_saas_add_tenant_nullable.sql) succeeds.
 * Run this BEFORE Migration 003 (003_004_saas_not_null_and_unique.sql).
 *
 * This script:
 *   1. Creates the initial "seed" Tenant for the existing clinic.
 *   2. Creates its first Subscription (ACTIVE, no expiry — existing data is permanent).
 *   3. Assigns every existing record to this Tenant via UPDATE ... WHERE tenantId IS NULL.
 *   4. Validates that zero orphan records remain.
 *   5. Exits with code 1 if validation fails (do NOT run Migration 003 in that case).
 *
 * Usage:
 *   Edit SEED_CLINIC_NAME and SEED_CONTACT_EMAIL below.
 *   Then run: npx ts-node src/prisma/scripts/002_backfill_tenants.ts
 */

import prisma from '../../config/db';

// ──────────────────────────────────────────────────────────────────────────────
// EDIT THESE BEFORE RUNNING
// ──────────────────────────────────────────────────────────────────────────────
const SEED_CLINIC_NAME  = 'Default Clinic';    // ← replace with real clinic name
const SEED_CLINIC_SLUG  = 'default';            // ← URL-safe, no spaces
const SEED_CONTACT_EMAIL = 'admin@clinic.com'; // ← replace with real email
// ──────────────────────────────────────────────────────────────────────────────

/** All tenant-scoped tables that need backfilling */
const TENANT_TABLES = [
  'Users',
  'Doctors',
  'DoctorSchedules',
  'Specialties',
  'Services',
  'LeadSources',
  'Patients',
  'PatientAreas',
  'PatientImages',
  'PatientRatings',
  'Appointments',
  'Payments',
  'SessionItems',
  'FinancialTransactions',
  'Vendors',
  'Products',
  'StockTransactions',
  'Purchases',
  'PurchaseItems',
  'StockAdjustments',
  'VendorPayments',
  'AuditLog',
  'ClinicSettings',
  'InvoiceSettings',
] as const;

async function run(): Promise<void> {
  console.log('🚀 SaaS Backfill Script — Starting...\n');

  // ── Step 1: Guard — abort if a tenant already exists ─────────────────────
  const existingTenant = await prisma.tenant.findFirst();
  if (existingTenant) {
    console.log(`⚠️  Tenant already exists (id=${existingTenant.id}, name="${existingTenant.name}").`);
    console.log('   Skipping seed tenant creation.');
    console.log('   If you need to re-run backfill, drop the existing tenants first.\n');
    process.exit(0);
  }

  // ── Step 2: Create seed Tenant ────────────────────────────────────────────
  console.log(`📋 Creating seed tenant: "${SEED_CLINIC_NAME}" (slug: ${SEED_CLINIC_SLUG})`);

  const seedTenant = await prisma.tenant.create({
    data: {
      name:         SEED_CLINIC_NAME,
      slug:         SEED_CLINIC_SLUG,
      status:       'ACTIVE',          // existing clinic is immediately active
      contactEmail: SEED_CONTACT_EMAIL,
    },
  });

  console.log(`✅ Tenant created: id=${seedTenant.id}\n`);

  // ── Step 3: Create ACTIVE subscription (no expiry — existing data) ────────
  await prisma.subscription.create({
    data: {
      tenantId:  seedTenant.id,
      plan:      'TRIAL',              // upgrade manually via Super Admin later
      status:    'ACTIVE',             // NOT trial — no expiry for existing data
      startDate: new Date('2020-01-01'),
      endDate:   null,                 // no expiry
    },
  });

  console.log(`✅ Subscription created: ACTIVE (no expiry)\n`);

  // ── Step 4: Backfill all tables ───────────────────────────────────────────
  console.log('📦 Backfilling all tenant-scoped tables...\n');

  for (const table of TENANT_TABLES) {
    const rowsUpdated = await prisma.$executeRawUnsafe(
      `UPDATE "${table}" SET "tenantId" = $1 WHERE "tenantId" IS NULL`,
      seedTenant.id
    );
    console.log(`   ✅ ${table.padEnd(24)} → ${rowsUpdated} rows updated`);
  }

  console.log('\n🔍 Validating — checking for orphan records...\n');

  // ── Step 5: Validate ──────────────────────────────────────────────────────
  let hasErrors = false;

  for (const table of TENANT_TABLES) {
    // NOTE: Users is special — System Admin users will have tenantId = NULL
    // We only skip Users from the null check after we create System Admin users.
    // At this point, all existing Users should have tenantId set.
    const rows = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT COUNT(*) as count FROM "${table}" WHERE "tenantId" IS NULL`
    );

    const count = rows[0]?.count ?? 0n;
    if (count > 0n) {
      console.error(`   ❌ ${table.padEnd(24)} → ${count} rows still have NULL tenantId!`);
      hasErrors = true;
    } else {
      console.log(`   ✅ ${table.padEnd(24)} → all rows assigned`);
    }
  }

  console.log('');

  if (hasErrors) {
    console.error('❌ VALIDATION FAILED: Some records were not backfilled correctly.');
    console.error('   Do NOT run Migration 003 (NOT NULL constraints) yet.');
    console.error('   Fix the issues above and re-run this script.\n');
    process.exit(1);
  }

  console.log('✅ VALIDATION PASSED: All records assigned to the seed tenant.');
  console.log('');
  console.log('📋 Summary:');
  console.log(`   Tenant ID:     ${seedTenant.id}`);
  console.log(`   Tenant Name:   ${seedTenant.name}`);
  console.log(`   Tenant Slug:   ${seedTenant.slug}`);
  console.log(`   Tenant Status: ${seedTenant.status}`);
  console.log('');
  console.log('👉 Next step: Run Migration 003 to apply NOT NULL constraints.');
  console.log('   File: src/prisma/scripts/003_004_saas_not_null_and_unique.sql\n');
}

run()
  .catch((err) => {
    console.error('💥 Backfill script crashed:\n', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
