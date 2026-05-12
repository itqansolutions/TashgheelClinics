import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { usersRepo } from './users.repo';
import { AppError } from '../../middleware/errorHandler';
import { paginate, buildMeta } from '../../utils/pagination';

export const usersService = {
  async list(search = '', page: number, limit: number) {
    const pg = paginate({ page, limit });
    const [users, total] = await usersRepo.findAll(search, pg);
    return { data: users, meta: buildMeta(total, pg.page, pg.limit) };
  },

  async getById(id: number) {
    const user = await usersRepo.findById(id);
    if (!user) throw new AppError('User not found', 404);
    return user;
  },

  async create(body: { fullName: string; email: string; password: string; role: Role }) {
    const existing = await usersRepo.findByEmail(body.email.toLowerCase());
    if (existing) throw new AppError('Email already in use', 409);
    const passwordHash = await bcrypt.hash(body.password, 12);
    return usersRepo.create({
      fullName: body.fullName,
      email:    body.email.toLowerCase(),
      passwordHash,
      role:     body.role,
    });
  },

  async update(id: number, body: { fullName?: string; email?: string; role?: Role; isActive?: boolean }) {
    await this.getById(id); // 404 guard
    if (body.email) {
      const existing = await usersRepo.findByEmail(body.email.toLowerCase());
      if (existing && existing.id !== id) throw new AppError('Email already in use', 409);
    }
    return usersRepo.update(id, body);
  },

  async changePassword(id: number, currentPassword: string, newPassword: string) {
    const raw = await usersRepo.findById(id);
    if (!raw) throw new AppError('User not found', 404);
    // Need passwordHash — fetch full record
    const full = await import('../../config/db').then(m => m.default.user.findUnique({ where: { id } }));
    const match = await bcrypt.compare(currentPassword, full!.passwordHash);
    if (!match) throw new AppError('Current password is incorrect', 400);
    const hash = await bcrypt.hash(newPassword, 12);
    return usersRepo.updatePassword(id, hash);
  },

  async deactivate(id: number, requestingUserId: number) {
    if (id === requestingUserId) throw new AppError('Cannot deactivate your own account', 400);
    await this.getById(id);
    return usersRepo.softDelete(id);
  },
};
