import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { specialtiesService } from './specialties.service';
import { sendSuccess } from '../../utils/response';
import { authenticate } from '../../middleware/auth';
import { adminOnly, allRoles } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';

// ── Schemas ───────────────────────────────────────────────────────────────
const createSchema = z.object({ name: z.string().min(2).max(100) });
const updateSchema = z.object({
  name:     z.string().min(2).max(100).optional(),
  isActive: z.boolean().optional(),
});
const querySchema  = z.object({ includeInactive: z.string().optional() });

// ── Controller ────────────────────────────────────────────────────────────
const ctrl = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await specialtiesService.list(req.query.includeInactive === 'true');
      sendSuccess(res, data);
    } catch (e) { next(e); }
  },
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, await specialtiesService.getById(Number(req.params.id)));
    } catch (e) { next(e); }
  },
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, await specialtiesService.create(req.body.name), 'Specialty created', 201);
    } catch (e) { next(e); }
  },
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, await specialtiesService.update(Number(req.params.id), req.body), 'Specialty updated');
    } catch (e) { next(e); }
  },
  async deactivate(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, await specialtiesService.deactivate(Number(req.params.id)), 'Specialty deactivated');
    } catch (e) { next(e); }
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
