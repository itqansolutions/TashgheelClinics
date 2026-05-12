import { specialtiesRepo } from './specialties.repo';
import { AppError } from '../../middleware/errorHandler';

export const specialtiesService = {
  async list(includeInactive = false) {
    return specialtiesRepo.findAll(includeInactive);
  },

  async getById(id: number) {
    const s = await specialtiesRepo.findById(id);
    if (!s) throw new AppError('Specialty not found', 404);
    return s;
  },

  async create(name: string) {
    return specialtiesRepo.create(name.trim());
  },

  async update(id: number, data: { name?: string; isActive?: boolean }) {
    await this.getById(id);
    return specialtiesRepo.update(id, data);
  },

  async deactivate(id: number) {
    const s = await this.getById(id);
    if ((s._count.doctors ?? 0) > 0) {
      throw new AppError('Cannot deactivate specialty with assigned doctors', 400);
    }
    return specialtiesRepo.update(id, { isActive: false });
  },
};
