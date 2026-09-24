import { PrismaClient } from '@prisma/client';
import { tenantPrisma } from '../../utils/tenantPrisma';
import { appointmentsRepo } from '../../modules/appointments/appointments.repo';
import {
  getTenantAId,
  getTenantBId,
  getUserAId,
  getPatientAId,
} from './helpers';

const prisma = new PrismaClient();

describe('Clinical Workflow & Services Isolation Tests', () => {
  let doctorAId: number;
  let appointmentAId: number;
  let serviceAId: number;

  beforeAll(async () => {
    const tenantAId = getTenantAId();
    const userAId = getUserAId();
    const patientAId = getPatientAId();

    // 1. Create Specialty for Tenant A
    const specialtyA = await prisma.specialty.create({
      data: {
        tenantId: tenantAId,
        name: `Test Spec ${Date.now()}`,
      },
    });

    // 2. Create Doctor for Tenant A
    const doctorA = await prisma.doctor.create({
      data: {
        tenantId: tenantAId,
        userId: userAId,
        specialtyId: specialtyA.id,
        fullName: 'Doctor Tenant A',
        commission: 10,
        discount: 0,
      },
    });
    doctorAId = doctorA.id;

    // 3. Create Appointment for Tenant A
    const appointmentA = await prisma.appointment.create({
      data: {
        tenantId: tenantAId,
        patientId: patientAId,
        doctorId: doctorAId,
        startTime: new Date(),
        endTime: new Date(Date.now() + 30 * 60 * 1000),
        status: 'Confirmed',
        priceCharged: 0,
      },
    });
    appointmentAId = appointmentA.id;
  });

  afterAll(async () => {
    // Cleanup
    if (appointmentAId) {
      await prisma.financialTransaction.deleteMany({
        where: { referenceType: 'Appointment', referenceId: appointmentAId },
      });
      await prisma.appointmentService.deleteMany({
        where: { appointmentId: appointmentAId },
      });
      await prisma.appointment.deleteMany({
        where: { id: appointmentAId },
      });
    }
    if (doctorAId) {
      await prisma.doctor.deleteMany({ where: { id: doctorAId } });
    }
    await prisma.$disconnect();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 1: Tenant Isolation — AppointmentService
  // ───────────────────────────────────────────────────────────────────────────
  describe('Test 1: AppointmentService Tenant Isolation', () => {
    it('Tenant A can create and read AppointmentService', async () => {
      const dbA = tenantPrisma(getTenantAId());

      const created = await dbA.appointmentService.create({
        data: {
          appointmentId: appointmentAId,
          name: 'Botox Procedure',
          description: 'Forehead 20 units',
          price: 4500,
        },
      });

      expect(created).toBeDefined();
      expect(created.name).toBe('Botox Procedure');
      expect(Number(created.price)).toBe(4500);
      expect(created.tenantId).toBe(getTenantAId());
      serviceAId = created.id;

      // Verify Tenant A can read it
      const readA = await dbA.appointmentService.findFirst({
        where: { id: serviceAId },
      });
      expect(readA).not.toBeNull();
      expect(readA?.id).toBe(serviceAId);
    });

    it('Tenant B CANNOT read Tenant A AppointmentService by ID (returns null)', async () => {
      const dbB = tenantPrisma(getTenantBId());

      const readB = await dbB.appointmentService.findFirst({
        where: { id: serviceAId },
      });

      expect(readB).toBeNull();
    });

    it('Tenant B CANNOT list Tenant A AppointmentServices by appointmentId', async () => {
      const dbB = tenantPrisma(getTenantBId());

      const listB = await dbB.appointmentService.findMany({
        where: { appointmentId: appointmentAId },
      });

      expect(listB).toHaveLength(0);
    });

    it('Tenant B CANNOT update Tenant A AppointmentService (fails with record not found)', async () => {
      const dbB = tenantPrisma(getTenantBId());

      await expect(
        dbB.appointmentService.update({
          where: { id: serviceAId },
          data: { price: 10 },
        })
      ).rejects.toThrow();
    });

    it('Tenant B CANNOT delete Tenant A AppointmentService (fails with record not found)', async () => {
      const dbB = tenantPrisma(getTenantBId());

      await expect(
        dbB.appointmentService.delete({
          where: { id: serviceAId },
        })
      ).rejects.toThrow();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 2: Financial Idempotency & Services Pricing
  // ───────────────────────────────────────────────────────────────────────────
  describe('Test 2: Financial Idempotency & Sales Sync', () => {
    it('Finishing visit creates exactly 1 FinancialTransaction with correct amount', async () => {
      await appointmentsRepo.update(appointmentAId, {
        status: 'Done',
        services: [
          { name: 'Botox Procedure', description: '20 units', price: 4500 },
        ],
      });

      const transactions = await prisma.financialTransaction.findMany({
        where: {
          referenceType: 'Appointment',
          referenceId: appointmentAId,
        },
      });

      expect(transactions).toHaveLength(1);
      expect(Number(transactions[0].amount)).toBe(4500);
      expect(transactions[0].type).toBe('Income');
      expect(transactions[0].category).toBe('Service');
    });

    it('Re-finishing/saving visit again does NOT create duplicate transactions (idempotent)', async () => {
      // Trigger second finish/save with same payload
      await appointmentsRepo.update(appointmentAId, {
        status: 'Done',
        services: [
          { name: 'Botox Procedure', description: '20 units', price: 4500 },
        ],
      });

      const transactions = await prisma.financialTransaction.findMany({
        where: {
          referenceType: 'Appointment',
          referenceId: appointmentAId,
        },
      });

      // Must remain exactly 1, amount must remain 4500 (NOT 9000)
      expect(transactions).toHaveLength(1);
      expect(Number(transactions[0].amount)).toBe(4500);
    });

    it('Updating service price from 4500 to 5000 updates the existing transaction without duplicating', async () => {
      // Doctor or receptionist edits service price to 5000
      await appointmentsRepo.update(appointmentAId, {
        status: 'Done',
        services: [
          { name: 'Botox Procedure + Touchup', description: 'Updated', price: 5000 },
        ],
      });

      const transactions = await prisma.financialTransaction.findMany({
        where: {
          referenceType: 'Appointment',
          referenceId: appointmentAId,
        },
      });

      // Still exactly 1 transaction, with updated amount 5000
      expect(transactions).toHaveLength(1);
      expect(Number(transactions[0].amount)).toBe(5000);
    });
  });
});
