-- Migration 005: Add AppointmentServices table
-- For recording services and clinical procedures rendered during an appointment consultation

CREATE TABLE IF NOT EXISTS "AppointmentServices" (
    "id" SERIAL PRIMARY KEY,
    "tenantId" INTEGER REFERENCES "Tenants"("id") ON DELETE SET NULL,
    "appointmentId" INTEGER NOT NULL REFERENCES "Appointments"("id") ON DELETE CASCADE,
    "serviceId" INTEGER REFERENCES "Services"("id") ON DELETE SET NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10, 2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "AppointmentServices_tenantId_idx" ON "AppointmentServices"("tenantId");
CREATE INDEX IF NOT EXISTS "AppointmentServices_appointmentId_idx" ON "AppointmentServices"("appointmentId");
