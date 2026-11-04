import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../middleware/errorHandler';
import { authenticate } from '../../middleware/auth';
import { adminOnly, allRoles } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';

const router = Router();
router.use(authenticate);

// ── Clinic Settings (key-value) ───────────────────────────────────────────
router.get('/clinic', allRoles, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = req.db!;
    const settings = await db.clinicSetting.findMany();
    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    sendSuccess(res, map);
  } catch (e) { next(e); }
});

router.put('/clinic', adminOnly,
  validate(z.object({ key: z.string(), value: z.string() })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const db = req.db!;
      const { key, value } = req.body as { key: string; value: string };
      // Phase 1 bridge: key is no longer @id — use findFirst + update/create
      const existing = await db.clinicSetting.findFirst({ where: { key } });
      const setting = existing
        ? await db.clinicSetting.update({ where: { id: existing.id }, data: { value } })
        : await db.clinicSetting.create({ data: { key, value } });
      sendSuccess(res, setting, 'Setting updated');
    } catch (e) { next(e); }
  }
);

// Bulk update multiple settings at once
router.put('/clinic/bulk', adminOnly,
  validate(z.object({ settings: z.record(z.string(), z.string()) })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const db = req.db!;
      const { settings } = req.body as { settings: Record<string, string> };
      await Promise.all(
        Object.entries(settings).map(async ([key, value]) => {
          const existing = await db.clinicSetting.findFirst({ where: { key } });
          return existing
            ? db.clinicSetting.update({ where: { id: existing.id }, data: { value } })
            : db.clinicSetting.create({ data: { key, value } });
        })
      );
      sendSuccess(res, null, 'Settings updated');
    } catch (e) { next(e); }
  }
);

// ── Lead Sources ──────────────────────────────────────────────────────────
router.get('/lead-sources', allRoles, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = req.db!;
    sendSuccess(res, await db.leadSource.findMany({ orderBy: { name: 'asc' } }));
  } catch (e) { next(e); }
});

router.post('/lead-sources', adminOnly,
  validate(z.object({ name: z.string().min(2).max(100) })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const db = req.db!;
      const ls = await db.leadSource.create({ data: { name: req.body.name } });
      sendSuccess(res, ls, 'Lead source created', 201);
    } catch (e) { next(e); }
  }
);

router.put('/lead-sources/:id', adminOnly,
  validate(z.object({ name: z.string().min(2).max(100) })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const db = req.db!;
      const ls = await db.leadSource.update({
        where: { id: Number(req.params.id) },
        data:  { name: req.body.name },
      });
      sendSuccess(res, ls, 'Lead source updated');
    } catch (e) { next(e); }
  }
);

router.delete('/lead-sources/:id', adminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = req.db!;
    const count = await db.patient.count({ where: { leadSourceId: Number(req.params.id) } });
    if (count > 0) throw new AppError('Lead source is in use by patients', 400);
    await db.leadSource.delete({ where: { id: Number(req.params.id) } });
    sendSuccess(res, null, 'Lead source deleted');
  } catch (e) { next(e); }
});

// ── Countries ─────────────────────────────────────────────────────────────
router.get('/countries', allRoles, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = req.db!;
    sendSuccess(res, await db.country.findMany({ orderBy: { name: 'asc' } }));
  } catch (e) { next(e); }
});

// ── Body Areas ────────────────────────────────────────────────────────────
router.get('/body-areas', allRoles, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = req.db!;
    const { zone } = req.query as { zone?: string };
    const areas = await db.bodyArea.findMany({
      where: zone ? { zone } : {},
      orderBy: { name: 'asc' },
    });
    sendSuccess(res, areas);
  } catch (e) { next(e); }
});

export default router;
