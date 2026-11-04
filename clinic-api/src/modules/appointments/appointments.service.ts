import { appointmentsRepo, CreateAppointmentInput, UpdateAppointmentInput } from './appointments.repo';
import { AppError } from '../../middleware/errorHandler';
import { paginate, buildMeta } from '../../utils/pagination';
import { TenantPrismaClient } from '../../utils/tenantPrisma';

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
    
    return appointmentsRepo.create(db, data);
  },

  async update(db: TenantPrismaClient, id: number, data: UpdateAppointmentInput) {
    const appointment = await this.getById(db, id);
    
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

