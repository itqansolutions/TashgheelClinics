import prisma from '../../config/db';
import { PaginationResult } from '../../utils/pagination';

export type AppointmentStatus = 'Pending' | 'Confirmed' | 'Done' | 'Cancelled' | string;

export interface CreateAppointmentInput {
  patientId:    number;
  doctorId:     number;
  serviceId:    number;
  startTime:    Date;
  endTime:      Date;
  status?:      AppointmentStatus;
  priceCharged?: number;
  discountPct?:  number;
  notes?:       string;
  prescription?: string;
  createdBy?:    number;
}

export type UpdateAppointmentInput = Partial<CreateAppointmentInput>;

const FULL_INCLUDE = {
  patient: { select: { id: true, fullName: true, phone: true, code: true } },
  doctor:  { select: { id: true, fullName: true, specialty: { select: { name: true } }, user: { select: { fullName: true } } } },
  service: { select: { id: true, name: true, price: true } },
};

export const appointmentsRepo = {
  findAll(
    filters: { doctorId?: number; patientId?: number; status?: string; start?: Date; end?: Date },
    { skip, take }: PaginationResult
  ) {
    const where = {
      ...(filters.doctorId && { doctorId: filters.doctorId }),
      ...(filters.patientId && { patientId: filters.patientId }),
      ...(filters.status && { status: filters.status }),
      ...(filters.start && {
        startTime: { 
          gte: filters.start, 
          ...(filters.end && { lte: filters.end }) 
        } 
      }),
    };

    return Promise.all([
      prisma.appointment.findMany({
        where,
        include: FULL_INCLUDE,
        orderBy: { startTime: 'asc' },
        skip,
        take,
      }),
      prisma.appointment.count({ where }),
    ]);
  },

  findById(id: number) {
    return prisma.appointment.findUnique({
      where: { id },
      include: {
        ...FULL_INCLUDE,
        payments: true,
        ratings: true,
      }
    });
  },

  create(data: CreateAppointmentInput) {
    return prisma.appointment.create({
      data,
      include: FULL_INCLUDE
    });
  },

  update(id: number, data: UpdateAppointmentInput) {
    return prisma.appointment.update({
      where: { id },
      data,
      include: FULL_INCLUDE
    });
  },

  delete(id: number) {
    return prisma.appointment.delete({ where: { id } });
  }
};
