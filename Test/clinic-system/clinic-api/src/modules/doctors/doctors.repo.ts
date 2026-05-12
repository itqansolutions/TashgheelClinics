import prisma from '../../config/db';
import { PaginationResult } from '../../utils/pagination';

const INCLUDE = {
  user:      { select: { id: true, fullName: true, email: true } },
  specialty: { select: { id: true, name: true } },
};

export const doctorsRepo = {
  findAll(search: string, includeInactive: boolean, { skip, take }: PaginationResult) {
    const where = {
      ...(!includeInactive && { isActive: true }),
      ...(search && {
        user: { fullName: { contains: search } },
      }),
    };
    return Promise.all([
      prisma.doctor.findMany({ where, include: INCLUDE, orderBy: { id: 'asc' }, skip, take }),
      prisma.doctor.count({ where }),
    ]);
  },

  findById(id: number) {
    return prisma.doctor.findUnique({ where: { id }, include: INCLUDE });
  },

  findByUserId(userId: number) {
    return prisma.doctor.findUnique({ where: { userId }, include: INCLUDE });
  },

  create(data: { userId: number; specialtyId: number; commission: number; discount: number }) {
    return prisma.doctor.create({ data, include: INCLUDE });
  },

  update(id: number, data: { specialtyId?: number; commission?: number; discount?: number; isActive?: boolean }) {
    return prisma.doctor.update({ where: { id }, data, include: INCLUDE });
  },
};
