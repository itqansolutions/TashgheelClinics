import { PrismaClient, Product, StockTransaction } from '@prisma/client';
const prisma = new PrismaClient();

export class StockRepository {
  async getProductBalance(productId: number) {
    return prisma.product.findUnique({
      where: { id: productId },
      select: { currentStock: true, averageCost: true }
    });
  }

  async getAllBalances() {
    return prisma.product.findMany({
      include: {
        vendor: { select: { name: true } }
      }
    });
  }

  async createTransaction(data: {
    productId: number;
    type: 'Purchase' | 'Usage' | 'Adjustment' | 'Return';
    quantity: number;
    cost: number;
    referenceId?: number;
    notes?: string;
    userId?: number;
  }) {
    return prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
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
      const transaction = await tx.stockTransaction.create({
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

      await tx.product.update({
        where: { id: data.productId },
        data: {
          currentStock: balanceAfter,
          averageCost: newAverageCost
        }
      });

      return transaction;
    });
  }

  async getProductLedger(productId: number) {
    return prisma.stockTransaction.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' }
    });
  }
}

export const stockRepo = new StockRepository();
