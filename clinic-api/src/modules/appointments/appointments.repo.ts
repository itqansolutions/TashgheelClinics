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

export interface UsedItemInput {
  productId: number;
  quantity: number;
  costAtTime: number;
  priceAtTime: number;
}

export interface UpdateAppointmentInput extends Partial<CreateAppointmentInput> {
  usedItems?: UsedItemInput[];
}

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

  async update(id: number, input: UpdateAppointmentInput) {
    const { usedItems, ...data } = input;

    if (!usedItems) {
      return prisma.appointment.update({
        where: { id },
        data,
        include: FULL_INCLUDE
      });
    }

    return prisma.$transaction(async (tx) => {
      // 1. Update basic appointment info
      const appointment = await tx.appointment.update({
        where: { id },
        data,
        include: FULL_INCLUDE
      });

      // 2. Handle used items
      for (const item of usedItems) {
        // Record usage in SessionItem
        await tx.sessionItem.create({
          data: {
            appointmentId: id,
            productId: item.productId,
            quantity: item.quantity,
            costAtTime: item.costAtTime,
            priceAtTime: item.priceAtTime,
          }
        });

        // Deduct from stock
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) throw new Error(`Product ${item.productId} not found`);

        const balanceBefore = product.currentStock;
        const balanceAfter = balanceBefore - item.quantity;

        // Update product balance
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: balanceAfter }
        });

        // Create transaction record
        await tx.stockTransaction.create({
          data: {
            productId: item.productId,
            type: 'Usage',
            quantity: -item.quantity,
            balanceBefore,
            balanceAfter,
            cost: item.costAtTime,
            referenceId: id,
            notes: `Used in Appointment #${id}`
          }
        });
      }

      return appointment;
    });
  },

  delete(id: number) {
    return prisma.appointment.delete({ where: { id } });
  }
};
