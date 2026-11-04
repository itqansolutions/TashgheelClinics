import { TenantPrismaClient } from '../../utils/tenantPrisma';

export class VendorRepository {
  async getAll(db: TenantPrismaClient) {
    return db.vendor.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
  }

  async getById(db: TenantPrismaClient, id: number) {
    return db.vendor.findFirst({
      where: { id },
      include: {
        purchases: {
          orderBy: { purchaseDate: 'desc' }
        },
        payments: {
          orderBy: { paymentDate: 'desc' }
        }
      }
    });
  }

  async create(db: TenantPrismaClient, data: any) {
    return db.vendor.create({ data });
  }

  async update(db: TenantPrismaClient, id: number, data: any) {
    return db.vendor.update({
      where: { id },
      data
    });
  }

  async createPayment(db: TenantPrismaClient, data: any) {
    return db.vendorPayment.create({ data });
  }

  async getStatement(db: TenantPrismaClient, vendorId: number) {
    const [purchases, payments] = await Promise.all([
      db.purchase.findMany({ where: { vendorId }, orderBy: { purchaseDate: 'asc' } }),
      db.vendorPayment.findMany({ where: { vendorId }, orderBy: { paymentDate: 'asc' } })
    ]);

    const totalPurchases = purchases.reduce((sum, p) => sum + p.totalAmount.toNumber(), 0);
    const totalPaid = payments.reduce((sum, p) => sum + p.amount.toNumber(), 0);
    const balance = totalPurchases - totalPaid;

    const allTransactions = [
      ...purchases.map(p => ({ date: p.purchaseDate, type: 'Purchase', amount: p.totalAmount, ref: p.invoiceNo, id: p.id })),
      ...payments.map(p => ({ date: p.paymentDate, type: 'Payment', amount: -p.amount, ref: p.notes, id: p.id }))
    ].sort((a, b) => {
      const diff = a.date.getTime() - b.date.getTime();
      if (diff !== 0) return diff;
      return a.type === 'Purchase' ? -1 : 1;
    });

    return {
      purchases,
      payments,
      balance,
      totalPurchases,
      totalPaid,
      transactions: allTransactions
    };
  }
}

export const vendorRepo = new VendorRepository();

