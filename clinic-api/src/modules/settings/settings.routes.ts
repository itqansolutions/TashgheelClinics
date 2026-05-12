import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../../config/db';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../middleware/errorHandler';
import { authenticate } from '../../middleware/auth';
import { adminOnly, allRoles } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';

const router = Router();
router.use(authenticate);

// ── Clinic Settings (key-value) ───────────────────────────────────────────
router.get('/clinic', allRoles, async (_req, res, next) => {
  try {
    const settings = await prisma.clinicSetting.findMany();
    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    sendSuccess(res, map);
  } catch (e) { next(e); }
});

router.put('/clinic', adminOnly,
  validate(z.object({ key: z.string(), value: z.string() })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { key, value } = req.body as { key: string; value: string };
      const setting = await prisma.clinicSetting.upsert({
        where: { key }, update: { value }, create: { key, value },
      });
      sendSuccess(res, setting, 'Setting updated');
    } catch (e) { next(e); }
  }
);

// Bulk update multiple settings at once
router.put('/clinic/bulk', adminOnly,
  validate(z.object({ settings: z.record(z.string(), z.string()) })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { settings } = req.body as { settings: Record<string, string> };
      await Promise.all(
        Object.entries(settings).map(([key, value]) =>
          prisma.clinicSetting.upsert({ where: { key }, update: { value }, create: { key, value } })
        )
      );
      sendSuccess(res, null, 'Settings updated');
    } catch (e) { next(e); }
  }
);

// ── Lead Sources ──────────────────────────────────────────────────────────
router.get('/lead-sources', allRoles, async (_req, res, next) => {
  try {
    sendSuccess(res, await prisma.leadSource.findMany({ orderBy: { name: 'asc' } }));
  } catch (e) { next(e); }
});

router.post('/lead-sources', adminOnly,
  validate(z.object({ name: z.string().min(2).max(100) })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ls = await prisma.leadSource.create({ data: { name: req.body.name } });
      sendSuccess(res, ls, 'Lead source created', 201);
    } catch (e) { next(e); }
  }
);

router.put('/lead-sources/:id', adminOnly,
  validate(z.object({ name: z.string().min(2).max(100) })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ls = await prisma.leadSource.update({
        where: { id: Number(req.params.id) },
        data:  { name: req.body.name },
      });
      sendSuccess(res, ls, 'Lead source updated');
    } catch (e) { next(e); }
  }
);

router.delete('/lead-sources/:id', adminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await prisma.patient.count({ where: { leadSourceId: Number(req.params.id) } });
    if (count > 0) throw new AppError('Lead source is in use by patients', 400);
    await prisma.leadSource.delete({ where: { id: Number(req.params.id) } });
    sendSuccess(res, null, 'Lead source deleted');
  } catch (e) { next(e); }
});

// ── Countries ─────────────────────────────────────────────────────────────
router.get('/countries', allRoles, async (_req, res, next) => {
  try {
    sendSuccess(res, await prisma.country.findMany({ orderBy: { name: 'asc' } }));
  } catch (e) { next(e); }
});

// ── Body Areas ────────────────────────────────────────────────────────────
router.get('/body-areas', allRoles, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { zone } = req.query as { zone?: string };
    const areas = await prisma.bodyArea.findMany({
      where: zone ? { zone } : {},
      orderBy: { name: 'asc' },
    });
    sendSuccess(res, areas);
  } catch (e) { next(e); }
});

export default router;
