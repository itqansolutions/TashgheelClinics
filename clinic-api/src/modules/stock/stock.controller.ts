import { Request, Response } from 'express';
import { stockRepo } from './stock.repo';
import { productRepo } from './products.repo';
import { vendorRepo } from './vendors.repo';

export class StockController {
  async getBalances(req: Request, res: Response) {
    const balances = await stockRepo.getAllBalances(req.db!);
    res.json({ success: true, data: balances });
  }

  async recordPurchase(req: Request, res: Response) {
    const { vendorId, invoiceNo, items, purchaseDate, notes, attachment } = req.body;
    const userId = (req as any).user?.id || (req as any).user?.sub;
    const db = req.db!;

    try {
      if (!Array.isArray(items) || items.length === 0) throw new Error('At least one purchase item is required');
      for (const it of items) {
        if (!(Number(it.quantity) > 0)) throw new Error('Item quantity must be greater than zero');
        if (!(Number(it.costPerUnit) >= 0)) throw new Error('Item cost must be zero or more');
      }
      const vendor = await db.vendor.findFirst({ where: { id: Number(vendorId) } });
      if (!vendor) throw new Error('Vendor not found');
      for (const it of items) {
        const p = await db.product.findFirst({ where: { id: Number(it.productId) } });
        if (!p) throw new Error(`Product ${it.productId} not found`);
      }
      // 1. Create Purchase Record using tenant-scoped client
      const totalAmount = items.reduce((sum: number, item: any) => sum + (item.quantity * item.costPerUnit), 0);
      
      const purchase = await db.purchase.create({
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
        const product = await db.product.findFirst({ where: { id: Number(item.productId) } });
        if (!product) throw new Error(`Product ${item.productId} not found`);

        const balanceBefore = Number(product.currentStock);
        const balanceAfter = balanceBefore + Number(item.quantity);

        // Calculate new average cost
        const currentTotalCost = product.averageCost.toNumber() * balanceBefore;
        const purchaseTotalCost = Number(item.costPerUnit) * Number(item.quantity);
        const newAverageCost = (currentTotalCost + purchaseTotalCost) / balanceAfter;

        // Update Product
        await db.product.update({
          where: { id: product.id },
          data: {
            currentStock: balanceAfter,
            averageCost: newAverageCost
          }
        });

        // Create Transaction Record
        await db.stockTransaction.create({
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

      res.json({ success: true, data: purchase });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Vendors
  async getVendors(req: Request, res: Response) {
    const vendors = await vendorRepo.getAll(req.db!);
    res.json({ success: true, data: vendors });
  }

  async createVendor(req: Request, res: Response) {
    const vendor = await vendorRepo.create(req.db!, req.body);
    res.json({ success: true, data: vendor });
  }

  // Products
  async getProducts(req: Request, res: Response) {
    const products = await productRepo.getAll(req.db!, req.query);
    res.json({ success: true, data: products });
  }

  async createProduct(req: Request, res: Response) {
    if (req.body.code) {
      const dup = await req.db!.product.findFirst({ where: { code: String(req.body.code) } });
      if (dup) return res.status(409).json({ success: false, message: 'A product with this code already exists' });
    }
    const product = await productRepo.create(req.db!, req.body);
    res.json({ success: true, data: product });
  }

  async updateProduct(req: Request, res: Response) {
    const { id } = req.params;
    const product = await productRepo.update(req.db!, Number(id), req.body);
    res.json({ success: true, data: product });
  }

  async getVendorStatement(req: Request, res: Response) {
    const { id } = req.params;
    const statement = await vendorRepo.getStatement(req.db!, Number(id));
    res.json({ success: true, data: statement });
  }

  async recordVendorPayment(req: Request, res: Response) {
    const userId = (req as any).user?.id || (req as any).user?.sub;
    const payAmount = Number(req.body.amount);
    if (!Number.isFinite(payAmount) || payAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Payment amount must be greater than zero' });
    }
    const payVendor = await req.db!.vendor.findFirst({ where: { id: Number(req.body.vendorId) } });
    if (!payVendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
    const payment = await vendorRepo.createPayment(req.db!, {
      ...req.body,
      userId,
      vendorId: Number(req.body.vendorId),
      amount: Number(req.body.amount)
    });
    res.json({ success: true, data: payment });
  }

  async getProductLedger(req: Request, res: Response) {
    const { id } = req.params;
    const ledger = await stockRepo.getProductLedger(req.db!, Number(id));
    res.json({ success: true, data: ledger });
  }
}

export const stockController = new StockController();

