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
  async list(specialtyId?: number, includeInactive = false) {
    return servicesRepo.findAll(specialtyId, includeInactive);
  },
  async getById(id: number) {
    const s = await servicesRepo.findById(id);
    if (!s) throw new AppError('Service not found', 404);
    return s;
  },
  async create(body: z.infer<typeof createSchema>) {
    const specialty = await prisma.specialty.findUnique({ where: { id: body.specialtyId } });
    if (!specialty) throw new AppError('Specialty not found', 404);
    return servicesRepo.create(body);
  },
  async update(id: number, body: z.infer<typeof updateSchema>) {
    await svc.getById(id);
    if (body.specialtyId) {
      const specialty = await prisma.specialty.findUnique({ where: { id: body.specialtyId } });
      if (!specialty) throw new AppError('Specialty not found', 404);
    }
    return servicesRepo.update(id, body);
  },
  async deactivate(id: number) {
    await svc.getById(id);
    return servicesRepo.update(id, { isActive: false });
  },
};

// ── Controller ────────────────────────────────────────────────────────────
const ctrl = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { specialtyId, includeInactive } = req.query as Record<string, string>;
      const data = await svc.list(
        specialtyId ? Number(specialtyId) : undefined,
        includeInactive === 'true'
      );
      sendSuccess(res, data);
    } catch (e) { next(e); }
  },
  async getById(req: Request, res: Response, next: NextFunction) {
    try { sendSuccess(res, await svc.getById(Number(req.params.id))); }
    catch (e) { next(e); }
  },
  async create(req: Request, res: Response, next: NextFunction) {
    try { sendSuccess(res, await svc.create(req.body), 'Service created', 201); }
    catch (e) { next(e); }
  },
  async update(req: Request, res: Response, next: NextFunction) {
    try { sendSuccess(res, await svc.update(Number(req.params.id), req.body), 'Service updated'); }
    catch (e) { next(e); }
  },
  async deactivate(req: Request, res: Response, next: NextFunction) {
    try { sendSuccess(res, await svc.deactivate(Number(req.params.id)), 'Service deactivated'); }
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
