import { TenantPrismaClient } from '../../utils/tenantPrisma';

export class ProductRepository {
  async getAll(db: TenantPrismaClient, filters: any = {}) {
    return db.product.findMany({
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

  async getById(db: TenantPrismaClient, id: number) {
    return db.product.findFirst({
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

  async create(db: TenantPrismaClient, data: any) {
    return db.product.create({
      data: {
        ...data,
        averageCost: data.averageCost || 0,
        sellingPrice: data.sellingPrice || 0,
        currentStock: 0 // Initial stock should be through a purchase or adjustment
      }
    });
  }

  async update(db: TenantPrismaClient, id: number, data: any) {
    return db.product.update({
      where: { id },
      data
    });
  }
}

export const productRepo = new ProductRepository();

