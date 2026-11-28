import { appointmentsRepo, CreateAppointmentInput, UpdateAppointmentInput } from './appointments.repo';
import { AppError } from '../../middleware/errorHandler';
import { paginate, buildMeta } from '../../utils/pagination';
import { TenantPrismaClient } from '../../utils/tenantPrisma';

async function assertRefsInTenant(db: TenantPrismaClient, d: any) {
  // Every referenced record must belong to the caller's tenant (db is tenant-scoped).
  if (d.patientId !== undefined && !(await db.patient.findFirst({ where: { id: Number(d.patientId) } }))) throw new AppError('Patient not found', 404);
  if (d.doctorId !== undefined && !(await db.doctor.findFirst({ where: { id: Number(d.doctorId) } }))) throw new AppError('Doctor not found', 404);
  if (d.serviceId !== undefined && d.serviceId !== null && !(await db.service.findFirst({ where: { id: Number(d.serviceId) } }))) throw new AppError('Service not found', 404);
  for (const it of (d.usedItems || [])) {
    if (!(await db.product.findFirst({ where: { id: Number(it.productId) } }))) throw new AppError('Product not found', 404);
  }
}

// Cancelling a PAID appointment is admin-only (Ali's rule, Nov 28 2026).
// Unpaid appointments cancel as before, with no ledger impact.
function isAdminRole(role?: string) {
  const r = (role || '').trim().toLowerCase();
  return r === 'admin' || r === 'system admin';
}

async function assertPaidCancelAllowed(db: TenantPrismaClient, id: number, user?: { role?: string }) {
  const paidAgg = await db.payment.aggregate({ where: { appointmentId: id }, _sum: { amount: true } });
  const paid = Number(paidAgg._sum?.amount || 0);
  if (paid > 0 && !isAdminRole(user?.role)) {
    throw new AppError('Only an admin can cancel an appointment that has a collected payment', 403);
  }
}

// Void (never delete) the income ledger entries tied to a cancelled appointment
async function voidAppointmentIncome(db: TenantPrismaClient, id: number, userId?: number) {
  await db.financialTransaction.updateMany({
    where: { referenceType: 'Appointment', referenceId: id, type: 'Income', voidedAt: null },
    data: {
      voidedAt: new Date(),
      voidedById: userId ?? null,
      voidReason: `Appointment #${id} cancelled`
    }
  });
}

export const appointmentsService = {
  async list(db: TenantPrismaClient, filters: any, page: number, limit: number) {
    const pg = paginate({ page, limit });
    const [data, total] = await appointmentsRepo.findAll(db, filters, pg);
    return { data, meta: buildMeta(total, pg.page, pg.limit) };
  },

  async getById(db: TenantPrismaClient, id: number) {
    const appointment = await appointmentsRepo.findById(db, id);
    if (!appointment) throw new AppError('Appointment not found', 404);
    return appointment;
  },

  async create(db: TenantPrismaClient, data: CreateAppointmentInput) {
    // Basic validation: end > start
    if (new Date(data.endTime) <= new Date(data.startTime)) {
      throw new AppError('End time must be after start time', 400);
    }
    
    await assertRefsInTenant(db, data);
    // Prevent double-booking the same doctor in an overlapping slot
    const overlap = await db.appointment.findFirst({
      where: {
        doctorId: Number(data.doctorId),
        status: { notIn: ['Cancelled'] },
        startTime: { lt: new Date(data.endTime) },
        endTime: { gt: new Date(data.startTime) },
      },
    });
    if (overlap) throw new AppError('This doctor already has an appointment in that time slot', 409);

    return appointmentsRepo.create(db, data);
  },

  async update(db: TenantPrismaClient, id: number, data: UpdateAppointmentInput) {
    const appointment = await this.getById(db, id);
    await assertRefsInTenant(db, data);
    
    // Auto-set price if finishing and not set
    if (data.status === 'Done' && !appointment.priceCharged && !data.priceCharged) {
      data.priceCharged = Number(appointment.service?.price || 0);
    }
    
    return appointmentsRepo.update(db, id, data);
  },

  async cancel(db: TenantPrismaClient, id: number, user?: { id?: number; sub?: number; role?: string }) {
    await this.getById(db, id);
    await assertPaidCancelAllowed(db, id, user);
    const updated = await appointmentsRepo.update(db, id, { status: 'Cancelled' });
    await voidAppointmentIncome(db, id, user?.id ?? user?.sub);
    return updated;
  },

  async updateStatus(db: TenantPrismaClient, id: number, status: string, user?: { id?: number; sub?: number; role?: string }) {
    const validStatuses = ['Pending', 'Confirmed', 'Done', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      throw new AppError(`Invalid status: ${status}`, 400);
    }
    const appointment = await this.getById(db, id);

    if (status === 'Cancelled') {
      await assertPaidCancelAllowed(db, id, user);
    }

    const updateData: any = { status };
    if (status === 'Done' && !appointment.priceCharged) {
      updateData.priceCharged = Number(appointment.service?.price || 0);
    }

    const updated = await appointmentsRepo.update(db, id, updateData);
    if (status === 'Cancelled') {
      await voidAppointmentIncome(db, id, user?.id ?? user?.sub);
    }
    return updated;
  },

  async getDoctorAppointments(db: TenantPrismaClient, userId: number, filters: any, page: number, limit: number) {
    const doctor = await db.doctor.findFirst({
      where: { userId },
      select: { id: true }
    });
    if (!doctor) throw new AppError('Doctor profile not found', 404);

    return this.list(db, { ...filters, doctorId: doctor.id }, page, limit);
  }
};

