import bcrypt from 'bcryptjs';
import { usersRepo, Role } from './users.repo';
import { AppError } from '../../middleware/errorHandler';
import { paginate, buildMeta } from '../../utils/pagination';
import { TenantPrismaClient } from '../../utils/tenantPrisma';

export const usersService = {
  async list(db: TenantPrismaClient, search = '', page: number, limit: number) {
    const pg = paginate({ page, limit });
    const [users, total] = await usersRepo.findAll(db, search, pg);
    return { data: users, meta: buildMeta(total, pg.page, pg.limit) };
  },

  async getById(db: TenantPrismaClient, id: number) {
    const user = await usersRepo.findById(db, id);
    if (!user) throw new AppError('User not found', 404);
    return user;
  },

  async create(db: TenantPrismaClient, body: { fullName: string; email: string; password: string; role: Role }) {
    const existing = await usersRepo.findByEmail(db, body.email.toLowerCase());
    if (existing) throw new AppError('Email already in use', 409);
    const passwordHash = await bcrypt.hash(body.password, 12);
    return usersRepo.create(db, {
      fullName: body.fullName,
      email:    body.email.toLowerCase(),
      passwordHash,
      role:     body.role,
    });
  },

  async update(db: TenantPrismaClient, id: number, body: { fullName?: string; email?: string; role?: Role; isActive?: boolean }) {
    await this.getById(db, id); // 404 guard
    if (body.email) {
      const existing = await usersRepo.findByEmail(db, body.email.toLowerCase());
      if (existing && existing.id !== id) throw new AppError('Email already in use', 409);
    }
    return usersRepo.update(db, id, body);
  },

  async changePassword(db: TenantPrismaClient, id: number, currentPassword: string, newPassword: string) {
    const raw = await this.getById(db, id);
    const full = await db.user.findFirst({ where: { id } });
    if (!full) throw new AppError('User not found', 404);
    const match = await bcrypt.compare(currentPassword, full.passwordHash);
    if (!match) throw new AppError('Current password is incorrect', 400);
    const hash = await bcrypt.hash(newPassword, 12);
    return usersRepo.updatePassword(db, id, hash);
  },

  async deactivate(db: TenantPrismaClient, id: number, requestingUserId: number) {
    if (id === requestingUserId) throw new AppError('Cannot deactivate your own account', 400);
    await this.getById(db, id);
    return usersRepo.softDelete(db, id);
  },
};

