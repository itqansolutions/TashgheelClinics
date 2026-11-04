import { TenantPrismaClient } from '../../utils/tenantPrisma';
import { PaginationResult } from '../../utils/pagination';

const INCLUDE = {
  user:      { select: { id: true, fullName: true, email: true } },
  specialty: { select: { id: true, name: true } },
};

export const doctorsRepo = {
  findAll(db: TenantPrismaClient, search: string, includeInactive: boolean, { skip, take }: PaginationResult) {
    const where: any = {
      ...(!includeInactive && { isActive: true }),
    };

    if (search) {
      where.OR = [
        { user: { fullName: { contains: search } } },
        { fullName: { contains: search } },
      ];
    }
    return Promise.all([
      db.doctor.findMany({ where, include: INCLUDE, orderBy: { id: 'asc' }, skip, take }),
      db.doctor.count({ where }),
    ]);
  },

  findById(db: TenantPrismaClient, id: number) {
    return db.doctor.findFirst({ where: { id }, include: INCLUDE });
  },

  findByUserId(db: TenantPrismaClient, userId: number) {
    return db.doctor.findFirst({ where: { userId }, include: INCLUDE });
  },

  create(db: TenantPrismaClient, data: { userId?: number; fullName?: string; specialtyId: number; commission: number; discount: number }) {
    return db.doctor.create({ data, include: INCLUDE });
  },

  update(db: TenantPrismaClient, id: number, data: { specialtyId?: number; commission?: number; discount?: number; isActive?: boolean }) {
    return db.doctor.update({ where: { id }, data, include: INCLUDE });
  },
};

