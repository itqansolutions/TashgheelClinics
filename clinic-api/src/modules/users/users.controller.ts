import { Request, Response, NextFunction } from 'express';
import { usersService } from './users.service';
import { sendSuccess } from '../../utils/response';

export const usersController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, page, limit } = req.query as Record<string, string>;
      const result = await usersService.list(req.db!, search, Number(page), Number(limit));
      sendSuccess(res, result.data, 'OK', 200, result.meta);
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await usersService.getById(req.db!, Number(req.params.id));
      sendSuccess(res, user);
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await usersService.create(req.db!, req.body);
      sendSuccess(res, user, 'User created', 201);
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await usersService.update(req.db!, Number(req.params.id), req.body);
      sendSuccess(res, user, 'User updated');
    } catch (err) { next(err); }
  },

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };
      await usersService.changePassword(req.db!, Number(req.params.id), currentPassword, newPassword);
      sendSuccess(res, null, 'Password updated');
    } catch (err) { next(err); }
  },

  async deactivate(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await usersService.deactivate(req.db!, Number(req.params.id), req.user!.sub);
      sendSuccess(res, user, 'User deactivated');
    } catch (err) { next(err); }
  },
};

