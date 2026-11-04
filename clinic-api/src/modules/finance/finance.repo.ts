import { TenantPrismaClient } from '../../utils/tenantPrisma';

export class FinanceRepository {
  async getQueue(db: TenantPrismaClient) {
    return db.appointment.findMany({
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

  async getTransactionLedger(db: TenantPrismaClient, filters: any = {}) {
    return db.financialTransaction.findMany({
      where: filters,
      include: { user: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createTransaction(db: TenantPrismaClient, data: any) {
    return db.financialTransaction.create({
      data: {
        ...data,
        amount: Number(data.amount)
      }
    });
  }

  async collectPayment(db: TenantPrismaClient, data: {
    appointmentId: number;
    amount: number;
    method: string;
    receivedBy: number;
    notes?: string;
  }) {
    // Create Payment record via tenant-scoped client
    const payment = await db.payment.create({
      data: {
        appointmentId: data.appointmentId,
        amount: data.amount,
        method: data.method,
        receivedBy: data.receivedBy,
      }
    });

    // Create Financial Transaction (Ledger) via tenant-scoped client
    await db.financialTransaction.create({
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

    return payment;
  }

  async getInvoiceSettings(db: TenantPrismaClient) {
    const settings = await db.invoiceSetting.findMany();
    return settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {});
  }

  async updateInvoiceSettings(db: TenantPrismaClient, settings: Record<string, string>) {
    await Promise.all(
      Object.entries(settings).map(async ([key, value]) => {
        const existing = await db.invoiceSetting.findFirst({ where: { key } });
        return existing
          ? db.invoiceSetting.update({ where: { id: existing.id }, data: { value } })
          : db.invoiceSetting.create({ data: { key, value } });
      })
    );
  }
}

export const financeRepo = new FinanceRepository();

