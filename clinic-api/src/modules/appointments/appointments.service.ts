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

  async cancel(db: TenantPrismaClient, id: number) {
    await this.getById(db, id);
    return appointmentsRepo.update(db, id, { status: 'Cancelled' });
  },

  async updateStatus(db: TenantPrismaClient, id: number, status: string) {
    const validStatuses = ['Pending', 'Confirmed', 'Done', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      throw new AppError(`Invalid status: ${status}`, 400);
    }
    const appointment = await this.getById(db, id);
    
    const updateData: any = { status };
    if (status === 'Done' && !appointment.priceCharged) {
      updateData.priceCharged = Number(appointment.service?.price || 0);
    }

    return appointmentsRepo.update(db, id, updateData);
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

