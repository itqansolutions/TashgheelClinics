import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export class VendorRepository {
  async getAll() {
    return prisma.vendor.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
  }

  async getById(id: number) {
    return prisma.vendor.findUnique({
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

  async create(data: any) {
    return prisma.vendor.create({ data });
  }

  async update(id: number, data: any) {
    return prisma.vendor.update({
      where: { id },
      data
    });
  }

  async createPayment(data: any) {
    return prisma.vendorPayment.create({ data });
  }

  async getStatement(vendorId: number) {
    const [purchases, payments] = await Promise.all([
      prisma.purchase.findMany({ where: { vendorId }, orderBy: { purchaseDate: 'asc' } }),
      prisma.vendorPayment.findMany({ where: { vendorId }, orderBy: { paymentDate: 'asc' } })
    ]);

    const totalPurchases = purchases.reduce((sum, p) => sum + p.totalAmount.toNumber(), 0);
    const totalPaid = payments.reduce((sum, p) => sum + p.amount.toNumber(), 0);
    const balance = totalPurchases - totalPaid;

    return {
      purchases,
      payments,
      balance,
      totalPurchases,
      totalPaid
    };
  }
}

export const vendorRepo = new VendorRepository();
