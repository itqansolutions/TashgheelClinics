import prisma from '../../config/db';

export const specialtiesRepo = {
  findAll(includeInactive = false) {
    return prisma.specialty.findMany({
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

  findById(id: number) {
    return prisma.specialty.findUnique({
      where: { id },
      include: {
        services: { orderBy: { name: 'asc' } },
        _count: { select: { doctors: true } },
      },
    });
  },

  create(name: string) {
    return prisma.specialty.create({ data: { name } });
  },

  update(id: number, data: { name?: string; isActive?: boolean }) {
    return prisma.specialty.update({ where: { id }, data });
  },
};
