import { TenantPrismaClient } from '../../utils/tenantPrisma';
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
    db: TenantPrismaClient,
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
      db.appointment.findMany({
        where,
        include: FULL_INCLUDE,
        orderBy: { startTime: 'asc' },
        skip,
        take,
      }),
      db.appointment.count({ where }),
    ]);
  },

  findById(db: TenantPrismaClient, id: number) {
    return db.appointment.findFirst({
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

  create(db: TenantPrismaClient, data: CreateAppointmentInput) {
    return db.appointment.create({
      data,
      include: FULL_INCLUDE
    });
  },

  async update(db: TenantPrismaClient, id: number, input: UpdateAppointmentInput) {
    const { usedItems, services, ...data } = input;

    // 1. Fetch current appointment with details
    const existing = await db.appointment.findFirst({
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
    const appointment = await db.appointment.update({
      where: { id },
      data: {
        ...data,
        ...(calculatedPrice !== undefined && { priceCharged: calculatedPrice }),
      },
      include: FULL_INCLUDE
    });


      // 4. Handle Services / Procedures
      if (services !== undefined) {
        await db.appointmentService.deleteMany({
          where: { appointmentId: id }
        });

        for (const s of services) {
          if (s.name && s.name.trim()) {
            await db.appointmentService.create({
              data: {
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
          const batches = await db.purchaseItem.findMany({
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
            
            await db.purchaseItem.update({
              where: { id: batch.id },
              data: { remainingQuantity: currentBatchQty - deduct }
            });
            
            remainingToDeduct -= deduct;
          }

          // Record usage in SessionItem
          await db.sessionItem.create({
            data: {
              appointmentId: id,
              productId: item.productId,
              quantity: item.quantity,
              costAtTime: item.costAtTime,
              priceAtTime: item.priceAtTime,
            }
          });

          // Deduct from total stock
          const product = await db.product.findFirst({ where: { id: item.productId } });
          if (!product) throw new Error(`Product ${item.productId} not found`);

          const balanceBefore = Number(product.currentStock);
          const balanceAfter = balanceBefore - item.quantity;

          await db.product.update({
            where: { id: item.productId },
            data: { currentStock: balanceAfter }
          });

          // Create transaction record
          await db.stockTransaction.create({
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

      const existingFinTx = await db.financialTransaction.findFirst({
        where: {
          referenceType: 'Appointment',
          referenceId: id
        }
      });

      const patientName = appointment.patient?.fullName || '';
      const txDescription = `Appointment #${id} - ${patientName}`;

      if (finalStatus === 'Done' && totalAmount > 0) {
        if (existingFinTx) {
          await db.financialTransaction.update({
            where: { id: existingFinTx.id },
            data: {
              amount: totalAmount,
              type: 'Income',
              category: 'Service',
              description: txDescription,
            }
          });
        } else {
          await db.financialTransaction.create({
            data: {
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
        await db.financialTransaction.delete({
          where: { id: existingFinTx.id }
        });
      }

      // Return fully hydrated appointment
      return db.appointment.findFirst({
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
  },

  delete(db: TenantPrismaClient, id: number) {
    return db.appointment.delete({ where: { id } });
  },

  async getAvailableSlots(db: TenantPrismaClient, doctorId: number, date: string) {
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getUTCDay();

    // 1. Get Doctor Schedule for this day
    const schedules = await db.doctorSchedule.findMany({
      where: { doctorId, dayOfWeek, isActive: true }
    });

    if (schedules.length === 0) return [];

    // 2. Get existing appointments for this doctor on this day
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0,0,0,0);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23,59,59,999);

    const appointments = await db.appointment.findMany({
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

  async getAvailableDoctors(db: TenantPrismaClient, date: string) {
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getUTCDay();

    return db.doctor.findMany({
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

