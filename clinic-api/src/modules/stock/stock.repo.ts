import { TenantPrismaClient } from '../../utils/tenantPrisma';

export class StockRepository {
  async getProductBalance(db: TenantPrismaClient, productId: number) {
    return db.product.findFirst({
      where: { id: productId },
      select: { currentStock: true, averageCost: true }
    });
  }

  async getAllBalances(db: TenantPrismaClient) {
    return db.product.findMany({
      include: {
        vendor: { select: { name: true } }
      }
    });
  }

  async createTransaction(db: TenantPrismaClient, data: {
    productId: number;
    type: 'Purchase' | 'Usage' | 'Adjustment' | 'Return';
    quantity: number;
    cost: number;
    referenceId?: number;
    notes?: string;
    userId?: number;
  }) {
    const product = await db.product.findFirst({
      where: { id: data.productId }
    });

    if (!product) throw new Error('Product not found');

    const balanceBefore = Number(product.currentStock);
    const balanceAfter = balanceBefore + data.quantity;

    // Negative stock protection
    if (balanceAfter < 0) {
      throw new Error(`Insufficient stock for ${product.name}. Available: ${balanceBefore}`);
    }

    // Create transaction record
    const transaction = await db.stockTransaction.create({
      data: {
        productId: data.productId,
        type: data.type,
        quantity: data.quantity,
        balanceBefore,
        balanceAfter,
        cost: data.cost,
        referenceId: data.referenceId,
        notes: data.notes,
        userId: data.userId
      }
    });

    // Update product balance and average cost if it's a purchase
    let newAverageCost = product.averageCost;
    if (data.type === 'Purchase' && data.quantity > 0) {
      const currentTotalCost = product.averageCost.toNumber() * Number(balanceBefore);
      const purchaseTotalCost = data.cost * data.quantity;
      newAverageCost = (currentTotalCost + purchaseTotalCost) / balanceAfter as any;
    }

    await db.product.update({
      where: { id: data.productId },
      data: {
        currentStock: balanceAfter,
        averageCost: newAverageCost
      }
    });

    return transaction;
  }

  async getProductLedger(db: TenantPrismaClient, productId: number) {
    return db.stockTransaction.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' }
    });
  }
}

export const stockRepo = new StockRepository();

