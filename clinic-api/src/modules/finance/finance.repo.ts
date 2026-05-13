import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export class FinanceRepository {
  async getQueue() {
    return prisma.appointment.findMany({
      where: {
        status: 'Done',
        payments: {
          none: {} // Or handle partial payments logic
        }
      },
      include: {
        patient: { select: { id: true, fullName: true, code: true } },
        doctor: { select: { id: true, fullName: true, user: { select: { fullName: true } } } },
        service: { select: { id: true, name: true, price: true } },
        sessionItems: {
          include: { product: { select: { name: true } } }
        },
        payments: true
      },
      orderBy: { startTime: 'desc' }
    });
  }

  async getTransactionLedger(filters: any = {}) {
    return prisma.financialTransaction.findMany({
      where: filters,
      include: { user: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createTransaction(data: any) {
    return prisma.financialTransaction.create({
      data: {
        ...data,
        amount: Number(data.amount)
      }
    });
  }

  async collectPayment(data: {
    appointmentId: number;
    amount: number;
    method: string;
    receivedBy: number;
    notes?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      // 1. Create Payment record
      const payment = await tx.payment.create({
        data: {
          appointmentId: data.appointmentId,
          amount: data.amount,
          method: data.method,
          receivedBy: data.receivedBy,
        }
      });

      // 2. Create Financial Transaction (Ledger)
      await tx.financialTransaction.create({
        data: {
          type: 'Income',
          category: 'Medical Services',
          amount: data.amount,
          method: data.method,
          description: `Payment for Appointment #${data.appointmentId}. ${data.notes || ''}`,
          referenceType: 'Appointment',
          referenceId: data.appointmentId,
          userId: data.receivedBy
        }
      });

      // 3. Optional: Update Appointment status if fully paid? 
      // The user said "Done" marks medical end, payment marks financial end.
      // We can add a 'paymentStatus' field to Appointment or just rely on payments sum.
      
      return payment;
    });
  }

  async getInvoiceSettings() {
    const settings = await prisma.invoiceSetting.findMany();
    return settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {});
  }

  async updateInvoiceSettings(settings: Record<string, string>) {
    return prisma.$transaction(
      Object.entries(settings).map(([key, value]) =>
        prisma.invoiceSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value }
        })
      )
    );
  }
}

export const financeRepo = new FinanceRepository();
