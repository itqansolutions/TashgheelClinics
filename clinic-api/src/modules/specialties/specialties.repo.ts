import { TenantPrismaClient } from '../../utils/tenantPrisma';

export const specialtiesRepo = {
  findAll(db: TenantPrismaClient, includeInactive = false) {
    return db.specialty.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        services: {
          where: includeInactive ? {} : { isActive: true },
          orderBy: { name: 'asc' },
        },
        _count: { select: { doctors: true } },
      },
      orderBy: { name: 'asc' },
    });
  },

  findById(db: TenantPrismaClient, id: number) {
    return db.specialty.findFirst({
      where: { id },
      include: {
        services: { orderBy: { name: 'asc' } },
        _count: { select: { doctors: true } },
      },
    });
  },

  create(db: TenantPrismaClient, name: string) {
    return db.specialty.create({ data: { name } });
  },

  update(db: TenantPrismaClient, id: number, data: { name?: string; isActive?: boolean }) {
    return db.specialty.update({ where: { id }, data });
  },
};

