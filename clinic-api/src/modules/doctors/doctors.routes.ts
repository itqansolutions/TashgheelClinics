import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { doctorsRepo } from './doctors.repo';
import { AppError } from '../../middleware/errorHandler';
import { sendSuccess } from '../../utils/response';
import { paginate, buildMeta } from '../../utils/pagination';
import { authenticate } from '../../middleware/auth';
import { adminOnly, adminOrReception, allRoles } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import prisma from '../../config/db';

// ── Schemas ───────────────────────────────────────────────────────────────
const createSchema = z.object({
  userId:      z.number().int().positive().optional(),
  fullName:    z.string().min(2).optional(), // Used if userId is missing
  specialtyId: z.number().int().positive(),
  commission:  z.number().min(0).max(100).default(0),
  discount:    z.number().min(0).max(100).default(0),
}).refine(data => data.userId || data.fullName, {
  message: "Either User ID or Full Name must be provided",
  path: ["fullName"]
});
const updateSchema = z.object({
  specialtyId: z.number().int().positive().optional(),
  commission:  z.number().min(0).max(100).optional(),
  discount:    z.number().min(0).max(100).optional(),
  isActive:    z.boolean().optional(),
});
const querySchema = z.object({
  search:          z.string().optional().default(''),
  page:            z.string().optional().default('1'),
  limit:           z.string().optional().default('20'),
  includeInactive: z.string().optional(),
});

// ── Service ───────────────────────────────────────────────────────────────
const svc = {
  async list(search: string, page: number, limit: number, includeInactive: boolean) {
    const pg = paginate({ page, limit });
    const [data, total] = await doctorsRepo.findAll(search, includeInactive, pg);
    return { data, meta: buildMeta(total, pg.page, pg.limit) };
  },

  async getById(id: number) {
    const doc = await doctorsRepo.findById(id);
    if (!doc) throw new AppError('Doctor not found', 404);
    return doc;
  },

  async create(body: z.infer<typeof createSchema>) {
    if (body.userId) {
      // Validate userId is a Doctor-role user
      const user = await prisma.user.findUnique({ where: { id: body.userId } });
      if (!user) throw new AppError('User not found', 404);
      if (user.role !== 'Doctor') throw new AppError('User must have Doctor role', 400);

      // Check not already a doctor
      const existing = await doctorsRepo.findByUserId(body.userId);
      if (existing) throw new AppError('User is already registered as a doctor', 409);
    }

    // Validate specialty
    const specialty = await prisma.specialty.findUnique({ where: { id: body.specialtyId } });
    if (!specialty) throw new AppError('Specialty not found', 404);

    return doctorsRepo.create(body);
  },

  async update(id: number, body: z.infer<typeof updateSchema>) {
    await svc.getById(id);
    if (body.specialtyId) {
      const specialty = await prisma.specialty.findUnique({ where: { id: body.specialtyId } });
      if (!specialty) throw new AppError('Specialty not found', 404);
    }
    return doctorsRepo.update(id, body);
  },

  async deactivate(id: number) {
    await svc.getById(id);
    return doctorsRepo.update(id, { isActive: false });
  },
};

// ── Controller ────────────────────────────────────────────────────────────
const ctrl = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { search = '', page = '1', limit = '20', includeInactive } = req.query as Record<string, string>;
      const result = await svc.list(search, Number(page), Number(limit), includeInactive === 'true');
      sendSuccess(res, result.data, 'OK', 200, result.meta);
    } catch (e) { next(e); }
  },
  async getById(req: Request, res: Response, next: NextFunction) {
    try { sendSuccess(res, await svc.getById(Number(req.params.id))); }
    catch (e) { next(e); }
  },
  async create(req: Request, res: Response, next: NextFunction) {
    try { sendSuccess(res, await svc.create(req.body), 'Doctor created', 201); }
    catch (e) { next(e); }
  },
  async update(req: Request, res: Response, next: NextFunction) {
    try { sendSuccess(res, await svc.update(Number(req.params.id), req.body), 'Doctor updated'); }
    catch (e) { next(e); }
  },
  async deactivate(req: Request, res: Response, next: NextFunction) {
    try { sendSuccess(res, await svc.deactivate(Number(req.params.id)), 'Doctor deactivated'); }
    catch (e) { next(e); }
  },
};

import doctorScheduleRoutes from './doctors.schedule.routes';

// ── Router ────────────────────────────────────────────────────────────────
const router = Router();
router.use(authenticate);

// Mount schedule sub-routes
router.use('/', doctorScheduleRoutes);

router.get('/',    allRoles,         validate(querySchema, 'query'), ctrl.list);
router.get('/:id', allRoles,         ctrl.getById);
router.post('/',   adminOnly,        validate(createSchema), ctrl.create);
router.put('/:id', adminOrReception, validate(updateSchema), ctrl.update);
router.delete('/:id', adminOnly,     ctrl.deactivate);

export default router;
