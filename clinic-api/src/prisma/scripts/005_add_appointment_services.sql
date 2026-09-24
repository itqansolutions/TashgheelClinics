-- Migration 005: Add AppointmentServices table (Hardened Multi-Tenant)
-- Strictly tenant-scoped: tenantId is NOT NULL with ON DELETE CASCADE
-- Prevents any orphaned records and strictly enforces tenant boundaries

CREATE TABLE IF NOT EXISTS "AppointmentServices" (
    "id" SERIAL PRIMARY KEY,
    "tenantId" INTEGER NOT NULL REFERENCES "Tenants"("id") ON DELETE CASCADE,
    "appointmentId" INTEGER NOT NULL REFERENCES "Appointments"("id") ON DELETE CASCADE,
    "serviceId" INTEGER REFERENCES "Services"("id") ON DELETE SET NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10, 2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "AppointmentServices_tenantId_idx" ON "AppointmentServices"("tenantId");
CREATE INDEX IF NOT EXISTS "AppointmentServices_appointmentId_idx" ON "AppointmentServices"("appointmentId");
