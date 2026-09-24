-- Migration 005: Add AppointmentServices table (Hardened Multi-Tenant)
-- Strictly tenant-scoped: tenantId is NOT NULL with ON DELETE CASCADE
-- Enforces Composite Foreign Key to guarantee Appointment and Service share the exact same tenantId

-- 1. Ensure Appointments has a composite UNIQUE constraint so it can be referenced by composite FK
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Appointments_id_tenantId_key'
    ) THEN
        ALTER TABLE "Appointments" ADD CONSTRAINT "Appointments_id_tenantId_key" UNIQUE ("id", "tenantId");
    END IF;
END $$;

-- 2. Create AppointmentServices table with Composite Foreign Key
CREATE TABLE IF NOT EXISTS "AppointmentServices" (
    "id" SERIAL PRIMARY KEY,
    "tenantId" INTEGER NOT NULL REFERENCES "Tenants"("id") ON DELETE CASCADE,
    "appointmentId" INTEGER NOT NULL,
    "serviceId" INTEGER REFERENCES "Services"("id") ON DELETE SET NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10, 2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Composite FK strictly guarantees at DB engine level that Appointment and Service belong to the SAME tenant
    CONSTRAINT "AppointmentServices_appointment_tenant_fkey"
        FOREIGN KEY ("appointmentId", "tenantId")
        REFERENCES "Appointments"("id", "tenantId")
        ON DELETE CASCADE
);

-- 3. Composite Index for the primary query pattern (WHERE tenantId = ? AND appointmentId = ?)
CREATE INDEX IF NOT EXISTS "AppointmentServices_tenant_appointment_idx" ON "AppointmentServices"("tenantId", "appointmentId");
CREATE INDEX IF NOT EXISTS "AppointmentServices_appointmentId_idx" ON "AppointmentServices"("appointmentId");
