-- Migration 003: SaaS Phase 2b — NOT NULL Constraints + XOR CHECK + Indexes
-- ============================================================================
-- Run ONLY after 002_backfill_tenants.ts completes with zero validation errors.
-- This migration makes tenantId mandatory on all tenant-scoped tables.
-- Users.tenantId remains NULLABLE — protected by the XOR CHECK constraint below.
-- ============================================================================

-- ── Step 1: Users — XOR CHECK (not NOT NULL) ──────────────────────────────────
-- Users.tenantId stays nullable because System Admin has tenantId = NULL.
-- The CHECK enforces mutual exclusivity:
--   Regular user:  tenantId IS NOT NULL  AND systemRole IS NULL
--   System Admin:  tenantId IS NULL      AND systemRole IS NOT NULL
-- Forbidden states prevented:
--   ❌ tenantId = NULL  AND systemRole = NULL   (ghost user)
--   ❌ tenantId = 5    AND systemRole = SYSTEM_ADMIN (conflated identity)

ALTER TABLE "Users"
  ADD CONSTRAINT "Users_tenant_xor_system"
  CHECK (
    ("tenantId" IS NOT NULL AND "systemRole" IS NULL)
    OR
    ("tenantId" IS NULL AND "systemRole" IS NOT NULL)
  );

-- ── Step 2: All other tables — SET NOT NULL ────────────────────────────────────

ALTER TABLE "Doctors"               ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "DoctorSchedules"       ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Specialties"           ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Services"              ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "LeadSources"           ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Patients"              ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "PatientAreas"          ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "PatientImages"         ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "PatientRatings"        ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Appointments"          ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Payments"              ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "SessionItems"          ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "FinancialTransactions" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Vendors"               ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Products"              ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "StockTransactions"     ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Purchases"             ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "PurchaseItems"         ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "StockAdjustments"      ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "VendorPayments"        ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "AuditLog"              ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "ClinicSettings"        ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "InvoiceSettings"       ALTER COLUMN "tenantId" SET NOT NULL;

-- ── DONE ──────────────────────────────────────────────────────────────────────
-- Next step: Run Migration 004 (compound unique constraints).


-- Migration 004: SaaS Phase 2b — Compound Unique Constraints
-- ============================================================================
-- Finalizes per-tenant uniqueness for Patient codes, Product codes,
-- and key-value settings tables.
-- ============================================================================

-- ── Patient.code: unique per tenant (not globally) ────────────────────────────

ALTER TABLE "Patients" DROP CONSTRAINT IF EXISTS "Patients_code_key";
ALTER TABLE "Patients"
  ADD CONSTRAINT "Patients_tenantId_code_key" UNIQUE ("tenantId", "code");

-- ── Product.code: unique per tenant ───────────────────────────────────────────

ALTER TABLE "Products" DROP CONSTRAINT IF EXISTS "Products_code_key";
ALTER TABLE "Products"
  ADD CONSTRAINT "Products_tenantId_code_key" UNIQUE ("tenantId", "code");

-- ── ClinicSettings: composite primary key (tenantId, key) ─────────────────────
-- The original PK was just 'key' (a single string).
-- Now each tenant has its own set of settings keys.

-- First, add a unique constraint (the new logical PK):
ALTER TABLE "ClinicSettings"
  ADD CONSTRAINT "ClinicSettings_tenantId_key_key" UNIQUE ("tenantId", "key");

-- ── InvoiceSettings: composite primary key (tenantId, key) ───────────────────

ALTER TABLE "InvoiceSettings"
  ADD CONSTRAINT "InvoiceSettings_tenantId_key_key" UNIQUE ("tenantId", "key");

-- NOTE: The surrogate integer PK (id) on ClinicSettings/InvoiceSettings remains.
-- The application layer enforces (tenantId, key) uniqueness via the UNIQUE constraint above.
-- The Prisma schema uses @@id([tenantId, key]) in the final state, applied after this migration.
