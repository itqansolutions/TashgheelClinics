import { specialtiesRepo } from './specialties.repo';
import { AppError } from '../../middleware/errorHandler';
import { TenantPrismaClient } from '../../utils/tenantPrisma';

export const specialtiesService = {
  async list(db: TenantPrismaClient, includeInactive = false) {
    return specialtiesRepo.findAll(db, includeInactive);
  },

  async getById(db: TenantPrismaClient, id: number) {
    const s = await specialtiesRepo.findById(db, id);
    if (!s) throw new AppError('Specialty not found', 404);
    return s;
  },

  async create(db: TenantPrismaClient, name: string) {
    return specialtiesRepo.create(db, name.trim());
  },

  async update(db: TenantPrismaClient, id: number, data: { name?: string; isActive?: boolean }) {
    await this.getById(db, id);
    return specialtiesRepo.update(db, id, data);
  },

  async deactivate(db: TenantPrismaClient, id: number) {
    const s = await this.getById(db, id);
    if ((s._count.doctors ?? 0) > 0) {
      throw new AppError('Cannot deactivate specialty with assigned doctors', 400);
    }
    return specialtiesRepo.update(db, id, { isActive: false });
  },
};

