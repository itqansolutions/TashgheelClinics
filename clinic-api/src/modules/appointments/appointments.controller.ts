import { Request, Response, NextFunction } from 'express';
import { appointmentsService } from './appointments.service';
import { sendSuccess } from '../../utils/response';

export const appointmentsController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { doctorId, patientId, status, start, end, page, limit } = req.query;
      const filters = {
        ...(doctorId && { doctorId: Number(doctorId) }),
        ...(patientId && { patientId: Number(patientId) }),
        ...(status && { status: String(status) }),
        ...(start && { start: new Date(String(start)) }),
        ...(end && { end: new Date(String(end)) }),
      };
      
      const result = await appointmentsService.list(
        filters,
        Number(page || 1),
        Number(limit || 50)
      );
      sendSuccess(res, result.data, 'Appointments retrieved', 200, result.meta);
    } catch (error) {
      next(error);
    }
  },

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await appointmentsService.getById(Number(req.params.id));
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await appointmentsService.create({
        ...req.body,
        createdBy: (req as any).user?.sub,
      });
      sendSuccess(res, data, 'Appointment booked', 201);
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await appointmentsService.update(Number(req.params.id), req.body);
      sendSuccess(res, data, 'Appointment updated');
    } catch (error) {
      next(error);
    }
  },

  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await appointmentsService.cancel(Number(req.params.id));
      sendSuccess(res, data, 'Appointment cancelled');
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = req.body;
      const data = await appointmentsService.updateStatus(Number(req.params.id), status);
      sendSuccess(res, data, `Appointment ${status}`);
    } catch (error) {
      next(error);
    }
  },

  async getDoctorMe(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, start, end, page, limit } = req.query;
      const filters = {
        ...(status && { status: String(status) }),
        ...(start  && { start: new Date(String(start)) }),
        ...(end    && { end: new Date(String(end)) }),
      };
      const result = await appointmentsService.getDoctorAppointments(
        req.user!.sub,
        filters,
        Number(page || 1),
        Number(limit || 50)
      );
      sendSuccess(res, result.data, 'OK', 200, result.meta);
    } catch (e) { next(e); }
  }
};
