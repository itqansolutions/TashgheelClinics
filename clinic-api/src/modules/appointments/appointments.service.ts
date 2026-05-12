import { appointmentsRepo, CreateAppointmentInput, UpdateAppointmentInput } from './appointments.repo';
import { AppError } from '../../middleware/errorHandler';
import { paginate, buildMeta } from '../../utils/pagination';

export const appointmentsService = {
  async list(filters: any, page: number, limit: number) {
    const pg = paginate({ page, limit });
    const [data, total] = await appointmentsRepo.findAll(filters, pg);
    return { data, meta: buildMeta(total, pg.page, pg.limit) };
  },

  async getById(id: number) {
    const appointment = await appointmentsRepo.findById(id);
    if (!appointment) throw new AppError('Appointment not found', 404);
    return appointment;
  },

  async create(data: CreateAppointmentInput) {
    // Basic validation: end > start
    if (new Date(data.endTime) <= new Date(data.startTime)) {
      throw new AppError('End time must be after start time', 400);
    }
    
    // TODO: Conflict detection logic can be added here
    
    return appointmentsRepo.create(data);
  },

  async update(id: number, data: UpdateAppointmentInput) {
    const appointment = await this.getById(id);
    
    // Auto-set price if finishing and not set
    if (data.status === 'Done' && !appointment.priceCharged && !data.priceCharged) {
      data.priceCharged = Number(appointment.service.price);
    }
    
    return appointmentsRepo.update(id, data);
  },

  async cancel(id: number) {
    await this.getById(id);
    return appointmentsRepo.update(id, { status: 'Cancelled' });
  },

  async updateStatus(id: number, status: string) {
    const validStatuses = ['Pending', 'Confirmed', 'Done', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      throw new AppError(`Invalid status: ${status}`, 400);
    }
    const appointment = await this.getById(id);
    
    const updateData: any = { status };
    if (status === 'Done' && !appointment.priceCharged) {
      updateData.priceCharged = Number(appointment.service.price);
    }

    return appointmentsRepo.update(id, updateData);
  },

  async getDoctorAppointments(userId: number, filters: any, page: number, limit: number) {
    const doctor = await import('../doctors/doctors.repo').then(m => m.doctorsRepo.findByUserId(userId));
    if (!doctor) throw new AppError('Doctor profile not found', 404);

    return this.list({ ...filters, doctorId: doctor.id }, page, limit);
  }
};
