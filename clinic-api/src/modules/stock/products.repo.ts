import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export class ProductRepository {
  async getAll(filters: any = {}) {
    return prisma.product.findMany({
      where: {
        isActive: true,
        ...(filters.vendorId && { vendorId: Number(filters.vendorId) }),
        ...(filters.category && { category: filters.category })
      },
      include: {
        vendor: { select: { name: true } }
      },
      orderBy: { name: 'asc' }
    });
  }

  async getById(id: number) {
    return prisma.product.findUnique({
      where: { id },
      include: {
        vendor: { select: { name: true } },
        transactions: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  async create(data: any) {
    return prisma.product.create({
      data: {
        ...data,
        averageCost: data.averageCost || 0,
        sellingPrice: data.sellingPrice || 0,
        currentStock: 0 // Initial stock should be through a purchase or adjustment
      }
    });
  }

  async update(id: number, data: any) {
    return prisma.product.update({
      where: { id },
      data
    });
  }
}

export const productRepo = new ProductRepository();
