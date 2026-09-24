import prisma from '../../config/db';
import { PaginationResult } from '../../utils/pagination';
import { AppError } from '../../middleware/errorHandler';

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

export interface AppointmentServiceInput {
  serviceId?: number;
  name: string;
  description?: string;
  price: number;
}

export interface UpdateAppointmentInput extends Partial<CreateAppointmentInput> {
  usedItems?: UsedItemInput[];
  services?: AppointmentServiceInput[];
}

const FULL_INCLUDE = {
  patient: { select: { id: true, fullName: true, phone: true, code: true } },
  doctor:  { select: { id: true, fullName: true, specialty: { select: { name: true } }, user: { select: { fullName: true } } } },
  service: { select: { id: true, name: true, price: true } },
  services: true,
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
    return prisma.appointment.findFirst({
      where: { id },
      include: {
        ...FULL_INCLUDE,
        payments: true,
        ratings: true,
        sessionItems: {
          include: {
            product: { select: { id: true, name: true, code: true, unit: true } }
          }
        },
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
    const { usedItems, services, ...data } = input;

    return prisma.$transaction(async (tx) => {
      // 1. Fetch current appointment with details
      const existing = await tx.appointment.findUnique({
        where: { id },
        include: FULL_INCLUDE
      });
      if (!existing) {
        throw new AppError('Appointment not found', 404);
      }

      // 2. Calculate priceCharged if services are provided or status is being finished
      let calculatedPrice: number | undefined = undefined;
      const baseServicePrice = Number(existing.service?.price || 0);

      if (services !== undefined) {
        const servicesSum = services.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
        calculatedPrice = baseServicePrice + servicesSum;
      } else if (data.priceCharged !== undefined) {
        calculatedPrice = Number(data.priceCharged);
      } else if (data.status === 'Done' && !existing.priceCharged) {
        calculatedPrice = baseServicePrice;
      }

      // 3. Update appointment core data
      const appointment = await tx.appointment.update({
        where: { id },
        data: {
          ...data,
          ...(calculatedPrice !== undefined && { priceCharged: calculatedPrice }),
        },
        include: FULL_INCLUDE
      });

      // 4. Handle Services / Procedures
      if (services !== undefined) {
        await tx.appointmentService.deleteMany({
          where: { appointmentId: id }
        });

        for (const s of services) {
          if (s.name && s.name.trim()) {
            await tx.appointmentService.create({
              data: {
                tenantId: existing.tenantId || 1,
                appointmentId: id,
                serviceId: s.serviceId || null,
                name: s.name.trim(),
                description: s.description?.trim() || null,
                price: Number(s.price) || 0,
              }
            });
          }
        }
      }

      // 5. Handle used inventory items
      if (usedItems && usedItems.length > 0) {
        for (const item of usedItems) {
          // Find suitable batches (FEFO)
          const batches = await tx.purchaseItem.findMany({
            where: { 
              productId: item.productId, 
              remainingQuantity: { gt: 0 } 
            },
            orderBy: [
              { expiryDate: 'asc' },
              { id: 'asc' }
            ]
          });

          let remainingToDeduct = item.quantity;
          
          for (const batch of batches) {
            if (remainingToDeduct <= 0) break;
            const currentBatchQty = Number(batch.remainingQuantity);
            const deduct = Math.min(currentBatchQty, remainingToDeduct);
            
            await tx.purchaseItem.update({
              where: { id: batch.id },
              data: { remainingQuantity: currentBatchQty - deduct }
            });
            
            remainingToDeduct -= deduct;
          }

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

          // Deduct from total stock
          const product = await tx.product.findFirst({ where: { id: item.productId } });
          if (!product) throw new Error(`Product ${item.productId} not found`);

          const balanceBefore = Number(product.currentStock);
          const balanceAfter = balanceBefore - item.quantity;

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
      }

      // 6. Financial Transaction (Sales/Revenue) Sync - Atomic & Idempotent
      const finalStatus = appointment.status;
      const totalAmount = Number(appointment.priceCharged || 0);

      const existingFinTx = await tx.financialTransaction.findFirst({
        where: {
          referenceType: 'Appointment',
          referenceId: id
        }
      });

      const patientName = appointment.patient?.fullName || '';
      const txDescription = `Appointment #${id} - ${patientName}`;

      if (finalStatus === 'Done' && totalAmount > 0) {
        if (existingFinTx) {
          await tx.financialTransaction.update({
            where: { id: existingFinTx.id },
            data: {
              amount: totalAmount,
              type: 'Income',
              category: 'Service',
              description: txDescription,
            }
          });
        } else {
          await tx.financialTransaction.create({
            data: {
              tenantId: existing.tenantId || 1,
              type: 'Income',
              category: 'Service',
              amount: totalAmount,
              method: 'Cash',
              referenceType: 'Appointment',
              referenceId: id,
              description: txDescription,
              date: new Date(),
            }
          });
        }
      } else if (finalStatus === 'Cancelled' && existingFinTx) {
        await tx.financialTransaction.delete({
          where: { id: existingFinTx.id }
        });
      }

      // Return fully hydrated appointment
      return tx.appointment.findUnique({
        where: { id },
        include: {
          ...FULL_INCLUDE,
          payments: true,
          ratings: true,
          sessionItems: {
            include: {
              product: { select: { id: true, name: true, code: true, unit: true } }
            }
          }
        }
      });
    });
  },

  delete(id: number) {
    return prisma.appointment.delete({ where: { id } });
  },

  async getAvailableSlots(doctorId: number, date: string) {
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getUTCDay();

    // 1. Get Doctor Schedule for this day
    const schedules = await prisma.doctorSchedule.findMany({
      where: { doctorId, dayOfWeek, isActive: true }
    });

    if (schedules.length === 0) return [];

    // 2. Get existing appointments for this doctor on this day
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0,0,0,0);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23,59,59,999);

    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        startTime: { gte: startOfDay, lte: endOfDay },
        status: { not: 'Cancelled' }
      },
      select: { startTime: true, endTime: true }
    });

    const slots: any[] = [];
    const slotDuration = 30; // default 30 mins

    for (const schedule of schedules) {
      const [startH, startM] = schedule.startTime.split(':').map(Number);
      const [endH, endM] = schedule.endTime.split(':').map(Number);

      let current = new Date(date);
      current.setUTCHours(startH, startM, 0, 0);

      const end = new Date(date);
      end.setUTCHours(endH, endM, 0, 0);

      while (current < end) {
        const slotEnd = new Date(current.getTime() + slotDuration * 60000);
        
        // Check if this slot overlaps with any appointment
        const isTaken = appointments.some(apt => {
          const aptStart = new Date(apt.startTime);
          const aptEnd = new Date(apt.endTime);
          return (current < aptEnd && slotEnd > aptStart);
        });

        if (!isTaken) {
          slots.push({
            time: current.toISOString(),
            label: current.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
          });
        }

        current = new Date(current.getTime() + slotDuration * 60000);
      }
    }

    return slots;
  },

  async getAvailableDoctors(date: string) {
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getUTCDay();

    return prisma.doctor.findMany({
      where: {
        isActive: true,
        schedules: {
          some: { dayOfWeek, isActive: true }
        }
      },
      include: {
        user: { select: { fullName: true } },
        specialty: { select: { name: true } }
      }
    });
  }
};
