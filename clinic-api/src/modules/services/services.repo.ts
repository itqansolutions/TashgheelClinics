import prisma from '../../config/db';

export interface CreateServiceInput {
  specialtyId: number;
  name:        string;
  price:       number;
  durationMin: number;
}

export const servicesRepo = {
  findAll(specialtyId?: number, includeInactive = false) {
    return prisma.service.findMany({
      where: {
        ...(specialtyId && { specialtyId }),
        ...(!includeInactive && { isActive: true }),
      },
      include: { specialty: { select: { id: true, name: true } } },
      orderBy: [{ specialtyId: 'asc' }, { name: 'asc' }],
    });
  },

  findById(id: number) {
    return prisma.service.findUnique({
      where: { id },
      include: { specialty: { select: { id: true, name: true } } },
    });
  },

  create(data: CreateServiceInput) {
    return prisma.service.create({
      data,
      include: { specialty: { select: { id: true, name: true } } },
    });
  },

  update(id: number, data: Partial<CreateServiceInput> & { isActive?: boolean }) {
    return prisma.service.update({
      where: { id },
      data,
      include: { specialty: { select: { id: true, name: true } } },
    });
  },
};
