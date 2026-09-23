-- Migration 001: SaaS Phase 1 — Add Tenant Infrastructure + Nullable tenantId
-- ============================================================================
-- SAFE TO RUN ON EXISTING DATA: all new columns are NULLABLE.
-- The existing application continues to work unchanged after this migration.
-- Run BEFORE the backfill script (002_backfill_tenants.ts).
-- ============================================================================

-- ── Step 1: Enums ─────────────────────────────────────────────────────────────

CREATE TYPE "TenantPlan" AS ENUM ('TRIAL', 'BASIC', 'PRO', 'ENTERPRISE');
CREATE TYPE "TenantStatus" AS ENUM (
  'PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'CANCELLED'
);
CREATE TYPE "SubscriptionStatus" AS ENUM (
  'TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED'
);
CREATE TYPE "SystemRole" AS ENUM ('SYSTEM_ADMIN', 'SUPPORT');

-- ── Step 2: New Tables ────────────────────────────────────────────────────────

CREATE TABLE "Tenants" (
  "id"           SERIAL PRIMARY KEY,
  "name"         VARCHAR NOT NULL,
  "slug"         VARCHAR NOT NULL UNIQUE,
  "status"       "TenantStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
  "contactEmail" VARCHAR NOT NULL,
  "logoUrl"      VARCHAR,
  "primaryColor" VARCHAR DEFAULT '#0ea5e9',
  "createdAt"    TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "Subscriptions" (
  "id"                 SERIAL PRIMARY KEY,
  "tenantId"           INTEGER NOT NULL REFERENCES "Tenants"("id") ON DELETE RESTRICT,
  "plan"               "TenantPlan" NOT NULL,
  "status"             "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
  "startDate"          TIMESTAMP NOT NULL DEFAULT NOW(),
  "endDate"            TIMESTAMP,
  "trialWarningSentAt" TIMESTAMP,    -- idempotency: prevents duplicate warning emails
  "externalId"         VARCHAR       -- Stripe / PayMob subscription ID
);

CREATE INDEX "Subscriptions_tenantId_idx"     ON "Subscriptions"("tenantId");
CREATE INDEX "Subscriptions_status_endDate_idx" ON "Subscriptions"("status", "endDate");

CREATE TABLE "PlanLimits" (
  "plan"        "TenantPlan" PRIMARY KEY,
  "maxUsers"    INTEGER NOT NULL,
  "maxPatients" INTEGER NOT NULL,
  "maxDoctors"  INTEGER NOT NULL,
  "storageGb"   INTEGER NOT NULL,
  "hasReports"  BOOLEAN NOT NULL DEFAULT FALSE,
  "hasStock"    BOOLEAN NOT NULL DEFAULT FALSE,
  "hasFinance"  BOOLEAN NOT NULL DEFAULT FALSE,
  "hasApi"      BOOLEAN NOT NULL DEFAULT FALSE
);

-- Seed default plan limits
INSERT INTO "PlanLimits" VALUES
  ('TRIAL',      3,   100,  2,  1, FALSE, FALSE, FALSE, FALSE),
  ('BASIC',      10,  1000, 10, 5, TRUE,  TRUE,  TRUE,  FALSE),
  ('PRO',        50,  10000,50, 50,TRUE,  TRUE,  TRUE,  TRUE),
  ('ENTERPRISE', 999, 999999,999,999,TRUE, TRUE,  TRUE,  TRUE);

CREATE TABLE "EmailVerificationTokens" (
  "id"        SERIAL PRIMARY KEY,
  "tenantId"  INTEGER NOT NULL REFERENCES "Tenants"("id") ON DELETE CASCADE,
  "token"     VARCHAR NOT NULL UNIQUE,
  "expiresAt" TIMESTAMP NOT NULL,
  "usedAt"    TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX "EmailVerificationTokens_token_idx" ON "EmailVerificationTokens"("token");

CREATE TABLE "SystemAdminAuditLogs" (
  "id"                SERIAL PRIMARY KEY,
  "systemAdminUserId" INTEGER NOT NULL,  -- FK to Users added after Users is modified
  "tenantId"          INTEGER,           -- NULL for platform-wide actions
  "action"            VARCHAR NOT NULL,
  "method"            VARCHAR NOT NULL,
  "endpoint"          VARCHAR NOT NULL,
  "targetRecordId"    INTEGER,
  "ipAddress"         VARCHAR NOT NULL,
  "userAgent"         VARCHAR NOT NULL,
  "timestamp"         TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX "SystemAdminAuditLogs_systemAdminUserId_idx" ON "SystemAdminAuditLogs"("systemAdminUserId");
CREATE INDEX "SystemAdminAuditLogs_tenantId_idx"          ON "SystemAdminAuditLogs"("tenantId");
CREATE INDEX "SystemAdminAuditLogs_timestamp_idx"         ON "SystemAdminAuditLogs"("timestamp" DESC);

-- ── Step 3: Modify Users ──────────────────────────────────────────────────────

ALTER TABLE "Users" ADD COLUMN "tenantId"   INTEGER;     -- NULL = System Admin
ALTER TABLE "Users" ADD COLUMN "systemRole" "SystemRole"; -- NULL = regular user

-- FK to Tenants (nullable for System Admin)
ALTER TABLE "Users"
  ADD CONSTRAINT "Users_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenants"("id") ON DELETE RESTRICT;

-- FK for SystemAdminAuditLogs
ALTER TABLE "SystemAdminAuditLogs"
  ADD CONSTRAINT "SystemAdminAuditLogs_systemAdminUserId_fkey"
  FOREIGN KEY ("systemAdminUserId") REFERENCES "Users"("id") ON DELETE RESTRICT;

CREATE INDEX "Users_tenantId_idx" ON "Users"("tenantId");

-- ── Step 4: Add nullable tenantId to all tenant-scoped tables ─────────────────
-- These are NULLABLE in Phase 1. Backfill script sets them.
-- Phase 2b (Migration 003) makes them NOT NULL after backfill succeeds.

ALTER TABLE "Doctors"               ADD COLUMN "tenantId" INTEGER REFERENCES "Tenants"("id");
ALTER TABLE "DoctorSchedules"       ADD COLUMN "tenantId" INTEGER REFERENCES "Tenants"("id");
ALTER TABLE "Specialties"           ADD COLUMN "tenantId" INTEGER REFERENCES "Tenants"("id");
ALTER TABLE "Services"              ADD COLUMN "tenantId" INTEGER REFERENCES "Tenants"("id");
ALTER TABLE "LeadSources"           ADD COLUMN "tenantId" INTEGER REFERENCES "Tenants"("id");
ALTER TABLE "Patients"              ADD COLUMN "tenantId" INTEGER REFERENCES "Tenants"("id");
ALTER TABLE "PatientAreas"          ADD COLUMN "tenantId" INTEGER REFERENCES "Tenants"("id");
ALTER TABLE "PatientImages"         ADD COLUMN "tenantId" INTEGER REFERENCES "Tenants"("id");
ALTER TABLE "PatientRatings"        ADD COLUMN "tenantId" INTEGER REFERENCES "Tenants"("id");
ALTER TABLE "Appointments"          ADD COLUMN "tenantId" INTEGER REFERENCES "Tenants"("id");
ALTER TABLE "Payments"              ADD COLUMN "tenantId" INTEGER REFERENCES "Tenants"("id");
ALTER TABLE "SessionItems"          ADD COLUMN "tenantId" INTEGER REFERENCES "Tenants"("id");
ALTER TABLE "FinancialTransactions" ADD COLUMN "tenantId" INTEGER REFERENCES "Tenants"("id");
ALTER TABLE "Vendors"               ADD COLUMN "tenantId" INTEGER REFERENCES "Tenants"("id");
ALTER TABLE "Products"              ADD COLUMN "tenantId" INTEGER REFERENCES "Tenants"("id");
ALTER TABLE "StockTransactions"     ADD COLUMN "tenantId" INTEGER REFERENCES "Tenants"("id");
ALTER TABLE "Purchases"             ADD COLUMN "tenantId" INTEGER REFERENCES "Tenants"("id");
ALTER TABLE "PurchaseItems"         ADD COLUMN "tenantId" INTEGER REFERENCES "Tenants"("id");
ALTER TABLE "StockAdjustments"      ADD COLUMN "tenantId" INTEGER REFERENCES "Tenants"("id");
ALTER TABLE "VendorPayments"        ADD COLUMN "tenantId" INTEGER REFERENCES "Tenants"("id");
ALTER TABLE "AuditLog"              ADD COLUMN "tenantId" INTEGER REFERENCES "Tenants"("id");

-- ClinicSettings / InvoiceSettings: add tenantId + temp surrogate PK
-- (original PK was 'key' String — composite PK applied in Migration 004)
ALTER TABLE "ClinicSettings"  ADD COLUMN "tenantId" INTEGER REFERENCES "Tenants"("id");
ALTER TABLE "InvoiceSettings" ADD COLUMN "tenantId" INTEGER REFERENCES "Tenants"("id");

-- Partial indexes for performance on tenant-filtered queries
CREATE INDEX "Doctors_tenantId_idx"               ON "Doctors"("tenantId");
CREATE INDEX "DoctorSchedules_tenantId_idx"       ON "DoctorSchedules"("tenantId");
CREATE INDEX "Specialties_tenantId_idx"           ON "Specialties"("tenantId");
CREATE INDEX "Services_tenantId_idx"              ON "Services"("tenantId");
CREATE INDEX "Patients_tenantId_idx"              ON "Patients"("tenantId");
CREATE INDEX "Appointments_tenantId_idx"          ON "Appointments"("tenantId");
CREATE INDEX "Appointments_tenantId_startTime_idx" ON "Appointments"("tenantId", "startTime");
CREATE INDEX "Payments_tenantId_idx"              ON "Payments"("tenantId");
CREATE INDEX "FinancialTransactions_tenantId_idx" ON "FinancialTransactions"("tenantId");
CREATE INDEX "FinancialTransactions_tenantId_date_idx" ON "FinancialTransactions"("tenantId", "date");
CREATE INDEX "Products_tenantId_idx"              ON "Products"("tenantId");
CREATE INDEX "StockTransactions_tenantId_idx"     ON "StockTransactions"("tenantId");
CREATE INDEX "Vendors_tenantId_idx"               ON "Vendors"("tenantId");
CREATE INDEX "AuditLog_tenantId_idx"              ON "AuditLog"("tenantId");
CREATE INDEX "ClinicSettings_tenantId_idx"        ON "ClinicSettings"("tenantId");
CREATE INDEX "InvoiceSettings_tenantId_idx"       ON "InvoiceSettings"("tenantId");

-- ── DONE ──────────────────────────────────────────────────────────────────────
-- Next step: Run 002_backfill_tenants.ts to assign all existing records to the
-- seed tenant, then validate, then run Migration 003 (NOT NULL constraints).
