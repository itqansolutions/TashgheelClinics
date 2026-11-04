import { TenantPrismaClient } from '../../utils/tenantPrisma';

export interface CreateServiceInput {
  specialtyId: number;
  name:        string;
  price:       number;
  durationMin: number;
}

export const servicesRepo = {
  findAll(db: TenantPrismaClient, specialtyId?: number, includeInactive = false) {
    return db.service.findMany({
      where: {
        ...(specialtyId && { specialtyId }),
        ...(!includeInactive && { isActive: true }),
      },
      include: { specialty: { select: { id: true, name: true } } },
      orderBy: [{ specialtyId: 'asc' }, { name: 'asc' }],
    });
  },

  findById(db: TenantPrismaClient, id: number) {
    return db.service.findFirst({
      where: { id },
      include: { specialty: { select: { id: true, name: true } } },
    });
  },

  create(db: TenantPrismaClient, data: CreateServiceInput) {
    return db.service.create({
      data,
      include: { specialty: { select: { id: true, name: true } } },
    });
  },

  update(db: TenantPrismaClient, id: number, data: Partial<CreateServiceInput> & { isActive?: boolean }) {
    return db.service.update({
      where: { id },
      data,
      include: { specialty: { select: { id: true, name: true } } },
    });
  },
};

