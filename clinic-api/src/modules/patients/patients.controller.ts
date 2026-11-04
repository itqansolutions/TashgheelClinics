import { Request, Response, NextFunction } from 'express';
import { patientsService } from './patients.service';
import { sendSuccess } from '../../utils/response';
import { Nationality } from './patients.repo';

export const patientsController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { search = '', page = '1', limit = '20', nationality, leadSourceId, isActive } =
        req.query as Record<string, string>;
      const result = await patientsService.list(req.db!, search, Number(page), Number(limit), {
        nationality: nationality as Nationality | undefined,
        leadSourceId: leadSourceId ? Number(leadSourceId) : undefined,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
      });
      sendSuccess(res, result.data, 'OK', 200, result.meta);
    } catch (e) { next(e); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, await patientsService.getById(req.db!, Number(req.params.id)));
    } catch (e) { next(e); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { patient, phoneDuplicate } = await patientsService.create(req.db!, req.body, req.user!.sub);
      sendSuccess(
        res, patient,
        phoneDuplicate ? 'Patient created (phone already exists in system)' : 'Patient created',
        201
      );
    } catch (e) { next(e); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, await patientsService.update(req.db!, Number(req.params.id), req.body), 'Patient updated');
    } catch (e) { next(e); }
  },

  async deactivate(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, await patientsService.deactivate(req.db!, Number(req.params.id)), 'Patient deactivated');
    } catch (e) { next(e); }
  },

  async getAppointments(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, await patientsService.getAppointments(req.db!, Number(req.params.id)));
    } catch (e) { next(e); }
  },

  async getAreas(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, await patientsService.getAreas(req.db!, Number(req.params.id)));
    } catch (e) { next(e); }
  },

  async updateAreas(req: Request, res: Response, next: NextFunction) {
    try {
      const areas = (req.body as { areas: { areaId: number; notes?: string }[] }).areas;
      sendSuccess(res, await patientsService.updateAreas(req.db!, Number(req.params.id), areas), 'Areas updated');
    } catch (e) { next(e); }
  },

  async removeArea(req: Request, res: Response, next: NextFunction) {
    try {
      await patientsService.removeArea(req.db!, Number(req.params.id), Number(req.params.areaId));
      sendSuccess(res, null, 'Area removed');
    } catch (e) { next(e); }
  },

  async getRatings(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, await patientsService.getRatings(req.db!, Number(req.params.id)));
    } catch (e) { next(e); }
  },

  async getImages(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, await patientsService.getImages(req.db!, Number(req.params.id)));
    } catch (e) { next(e); }
  },
};

