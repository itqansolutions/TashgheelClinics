import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { servicesRepo } from './services.repo';
import { AppError } from '../../middleware/errorHandler';
import { sendSuccess } from '../../utils/response';
import { authenticate } from '../../middleware/auth';
import { adminOnly, allRoles } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import prisma from '../../config/db';

// ── Schemas ───────────────────────────────────────────────────────────────
const createSchema = z.object({
  specialtyId: z.number().int().positive(),
  name:        z.string().min(2).max(150),
  price:       z.number().positive(),
  durationMin: z.number().int().min(5).max(480),
});
const updateSchema = createSchema.partial().extend({ isActive: z.boolean().optional() });
const querySchema  = z.object({
  specialtyId:     z.string().optional(),
  includeInactive: z.string().optional(),
});

// ── Service ───────────────────────────────────────────────────────────────
const svc = {
  async list(db: any, specialtyId?: number, includeInactive = false) {
    return servicesRepo.findAll(db, specialtyId, includeInactive);
  },
  async getById(db: any, id: number) {
    const s = await servicesRepo.findById(db, id);
    if (!s) throw new AppError('Service not found', 404);
    return s;
  },
  async create(db: any, body: z.infer<typeof createSchema>) {
    const specialty = await db.specialty.findFirst({ where: { id: body.specialtyId } });
    if (!specialty) throw new AppError('Specialty not found', 404);
    return servicesRepo.create(db, body);
  },
  async update(db: any, id: number, body: z.infer<typeof updateSchema>) {
    await svc.getById(db, id);
    if (body.specialtyId) {
      const specialty = await db.specialty.findFirst({ where: { id: body.specialtyId } });
      if (!specialty) throw new AppError('Specialty not found', 404);
    }
    return servicesRepo.update(db, id, body);
  },
  async deactivate(db: any, id: number) {
    await svc.getById(db, id);
    return servicesRepo.update(db, id, { isActive: false });
  },
};

// ── Controller ────────────────────────────────────────────────────────────
const ctrl = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { specialtyId, includeInactive } = req.query as Record<string, string>;
      const data = await svc.list(
        req.db!,
        specialtyId ? Number(specialtyId) : undefined,
        includeInactive === 'true'
      );
      sendSuccess(res, data);
    } catch (e) { next(e); }
  },
  async getById(req: Request, res: Response, next: NextFunction) {
    try { sendSuccess(res, await svc.getById(req.db!, Number(req.params.id))); }
    catch (e) { next(e); }
  },
  async create(req: Request, res: Response, next: NextFunction) {
    try { sendSuccess(res, await svc.create(req.db!, req.body), 'Service created', 201); }
    catch (e) { next(e); }
  },
  async update(req: Request, res: Response, next: NextFunction) {
    try { sendSuccess(res, await svc.update(req.db!, Number(req.params.id), req.body), 'Service updated'); }
    catch (e) { next(e); }
  },
  async deactivate(req: Request, res: Response, next: NextFunction) {
    try { sendSuccess(res, await svc.deactivate(req.db!, Number(req.params.id)), 'Service deactivated'); }
    catch (e) { next(e); }
  },
};


// ── Router ────────────────────────────────────────────────────────────────
const router = Router();
router.use(authenticate);

router.get('/',    allRoles,  validate(querySchema, 'query'), ctrl.list);
router.get('/:id', allRoles,  ctrl.getById);
router.post('/',   adminOnly, validate(createSchema), ctrl.create);
router.put('/:id', adminOnly, validate(updateSchema), ctrl.update);
router.delete('/:id', adminOnly, ctrl.deactivate);

export default router;
