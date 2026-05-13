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

    // Combine and sort by date for a unified statement
    const statement = [
      ...purchases.map(p => ({ date: p.purchaseDate, type: 'Purchase', amount: p.totalAmount, ref: p.invoiceNo })),
      ...payments.map(p => ({ date: p.paymentDate, type: 'Payment', amount: -p.amount, ref: p.notes }))
    ].sort((a, b) => a.date.getTime() - b.date.getTime());

    return statement;
  }
}

export const vendorRepo = new VendorRepository();
