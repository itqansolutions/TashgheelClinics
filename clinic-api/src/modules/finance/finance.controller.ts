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
    const appointmentId = Number(req.body.appointmentId);
    const amount = Number(req.body.amount);
    if (!Number.isInteger(appointmentId) || appointmentId <= 0) {
      return res.status(400).json({ success: false, message: 'A valid appointmentId is required' });
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Payment amount must be greater than zero' });
    }
    const appt = await req.db!.appointment.findFirst({ where: { id: appointmentId } });
    if (!appt) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    const due = Number(appt.priceCharged ?? 0);
    const paidAgg = await req.db!.payment.findMany({ where: { appointmentId } });
    const paid = paidAgg.reduce((s: number, p: any) => s + Number(p.amount), 0);
    if (due > 0 && paid + amount > due + 0.001) {
      return res.status(400).json({ success: false, message: `Payment exceeds the remaining balance (${(due - paid).toFixed(2)})` });
    }
    const payment = await financeRepo.collectPayment(req.db!, {
      ...req.body,
      appointmentId,
      amount,
      receivedBy: userId
    });
    res.json({ success: true, data: payment });
  }

  async voidTransaction(req: Request, res: Response) {
    const id = Number(req.params.id);
    const reason = String(req.body?.reason || '').trim();
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ success: false, message: 'A valid transaction id is required' });
    }
    if (!reason) {
      return res.status(400).json({ success: false, message: 'A void reason is required' });
    }
    const userId = (req as any).user?.id || (req as any).user?.sub;
    const existing = await req.db!.financialTransaction.findFirst({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    if ((existing as any).voidedAt) {
      return res.status(400).json({ success: false, message: 'Transaction is already voided' });
    }
    const tx = await financeRepo.voidTransaction(req.db!, id, userId, reason);
    res.json({ success: true, data: tx });
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

