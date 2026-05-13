import { Request, Response } from 'express';
import { stockRepo } from './stock.repo';
import { productRepo } from './products.repo';
import { vendorRepo } from './vendors.repo';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class StockController {
  async getBalances(req: Request, res: Response) {
    const balances = await stockRepo.getAllBalances();
    res.json({ success: true, data: balances });
  }

  async recordPurchase(req: Request, res: Response) {
    const { vendorId, invoiceNo, items, purchaseDate, notes, attachment } = req.body;
    const userId = (req as any).user?.id;

    try {
      const result = await prisma.$transaction(async (tx) => {
        // 1. Create Purchase Record
        const totalAmount = items.reduce((sum: number, item: any) => sum + (item.quantity * item.costPerUnit), 0);
        
        const purchase = await tx.purchase.create({
          data: {
            vendorId: Number(vendorId),
            invoiceNo,
            totalAmount,
            purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
            notes,
            attachment,
            userId,
            items: {
              create: items.map((item: any) => ({
                productId: Number(item.productId),
                quantity: Number(item.quantity),
                remainingQuantity: Number(item.quantity),
                costPerUnit: Number(item.costPerUnit),
                batchNo: item.batchNo,
                expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
                totalCost: Number(item.quantity) * Number(item.costPerUnit)
              }))
            }
          },
          include: { items: true }
        });

        // 2. For each item, update stock and average cost
        for (const item of items) {
          const product = await tx.product.findUnique({ where: { id: Number(item.productId) } });
          if (!product) throw new Error(`Product ${item.productId} not found`);

          const balanceBefore = product.currentStock;
          const balanceAfter = balanceBefore + Number(item.quantity);

          // Calculate new average cost
          const currentTotalCost = product.averageCost.toNumber() * balanceBefore;
          const purchaseTotalCost = Number(item.costPerUnit) * Number(item.quantity);
          const newAverageCost = (currentTotalCost + purchaseTotalCost) / balanceAfter;

          // Update Product
          await tx.product.update({
            where: { id: product.id },
            data: {
              currentStock: balanceAfter,
              averageCost: newAverageCost
            }
          });

          // Create Transaction Record
          await tx.stockTransaction.create({
            data: {
              productId: product.id,
              type: 'Purchase',
              quantity: Number(item.quantity),
              balanceBefore,
              balanceAfter,
              cost: Number(item.costPerUnit),
              referenceId: purchase.id,
              userId
            }
          });
        }

        return purchase;
      });

      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Vendors
  async getVendors(req: Request, res: Response) {
    const vendors = await vendorRepo.getAll();
    res.json({ success: true, data: vendors });
  }

  async createVendor(req: Request, res: Response) {
    const vendor = await vendorRepo.create(req.body);
    res.json({ success: true, data: vendor });
  }

  // Products
  async getProducts(req: Request, res: Response) {
    const products = await productRepo.getAll(req.query);
    res.json({ success: true, data: products });
  }

  async createProduct(req: Request, res: Response) {
    const product = await productRepo.create(req.body);
    res.json({ success: true, data: product });
  }

  async getVendorStatement(req: Request, res: Response) {
    const { id } = req.params;
    const statement = await vendorRepo.getStatement(Number(id));
    res.json({ success: true, data: statement });
  }

  async recordVendorPayment(req: Request, res: Response) {
    const userId = (req as any).user?.id;
    const payment = await vendorRepo.createPayment({
      ...req.body,
      userId,
      vendorId: Number(req.body.vendorId),
      amount: Number(req.body.amount)
    });
    res.json({ success: true, data: payment });
  }

  async getProductLedger(req: Request, res: Response) {
    const { id } = req.params;
    const ledger = await stockRepo.getProductLedger(Number(id));
    res.json({ success: true, data: ledger });
  }
}

export const stockController = new StockController();
