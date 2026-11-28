import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import QRCode from 'qrcode';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../middleware/errorHandler';
import { authenticate } from '../../middleware/auth';
import { adminOnly } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import {
  getWhatsAppStatus,
  updateWhatsAppToggles,
  connectWhatsApp,
  disconnectWhatsApp,
  sendWhatsAppText,
  isWhatsAppEnabled,
} from './whatsapp.service';

const router = Router();
router.use(authenticate);

function guard(req: Request) {
  if (!isWhatsAppEnabled()) throw new AppError('WhatsApp feature is not enabled', 403);
  return req.tenantCtx!.tenantId;
}

// ── Status (polled by the Settings UI; includes QR while pairing) ────────────
router.get('/status', adminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = guard(req);
    const status = await getWhatsAppStatus(tenantId);
    let qrDataUrl: string | null = null;
    if (status.qr) {
      qrDataUrl = await QRCode.toDataURL(status.qr, { margin: 1, width: 320 });
    }
    sendSuccess(res, { ...status, qr: undefined, qrDataUrl });
  } catch (e) { next(e); }
});

// ── Pairing lifecycle ────────────────────────────────────────────────────────
router.post('/connect', adminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = guard(req);
    // Fire and forget: connection is async; client polls /status for the QR
    connectWhatsApp(tenantId).catch((e) =>
      console.warn(`[WA] connect failed (tenant ${tenantId}):`, e?.message)
    );
    sendSuccess(res, null, 'WhatsApp connection started');
  } catch (e) { next(e); }
});

router.post('/disconnect', adminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = guard(req);
    await disconnectWhatsApp(tenantId);
    sendSuccess(res, null, 'WhatsApp disconnected');
  } catch (e) { next(e); }
});

// ── Toggles ──────────────────────────────────────────────────────────────────
router.put('/settings', adminOnly,
  validate(z.object({
    sendBookingConfirmation: z.boolean().optional(),
    sendDayBeforeReminder: z.boolean().optional(),
  })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = guard(req);
      const status = await updateWhatsAppToggles(tenantId, req.body);
      sendSuccess(res, status, 'Settings updated');
    } catch (e) { next(e); }
  }
);

// ── Test message (admin enters the target explicitly, e.g. the clinic's own number) ──
router.post('/test', adminOnly,
  validate(z.object({ phone: z.string().min(6) })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = guard(req);
      const { phone } = req.body as { phone: string };
      await sendWhatsAppText(
        tenantId,
        phone,
        'رسالة تجريبية من نظام تشغيل للعيادات ✅ - الربط بالواتساب شغال.'
      );
      sendSuccess(res, null, 'Test message sent');
    } catch (e) { next(e); }
  }
);

export default router;
