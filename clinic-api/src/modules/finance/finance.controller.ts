import { Request, Response } from 'express';
import { financeRepo } from './finance.repo';

export class FinanceController {
  async getQueue(req: Request, res: Response) {
    const queue = await financeRepo.getQueue(req.db!);
    res.json({ success: true, data: queue });
  }

  async getTransactions(req: Request, res: Response) {
    const transactions = await financeRepo.getTransactionLedger(req.db!, req.query);
    res.json({ success: true, data: transactions });
  }

  async createTransaction(req: Request, res: Response) {
    const userId = (req as any).user?.id || (req as any).user?.sub;
    const transaction = await financeRepo.createTransaction(req.db!, {
      ...req.body,
      userId
    });
    res.json({ success: true, data: transaction });
  }

  async collectPayment(req: Request, res: Response) {
    const userId = (req as any).user?.id || (req as any).user?.sub;
    const payment = await financeRepo.collectPayment(req.db!, {
      ...req.body,
      receivedBy: userId
    });
    res.json({ success: true, data: payment });
  }

  async getSettings(req: Request, res: Response) {
    const settings = await financeRepo.getInvoiceSettings(req.db!);
    res.json({ success: true, data: settings });
  }

  async updateSettings(req: Request, res: Response) {
    await financeRepo.updateInvoiceSettings(req.db!, req.body.settings);
    res.json({ success: true, message: 'Settings updated' });
  }
}

export const financeController = new FinanceController();

