import prisma from '../../config/db';
import { Role } from '@prisma/client';
import { PaginationResult } from '../../utils/pagination';

export interface CreateUserInput {
  fullName: string;
  email:    string;
  passwordHash: string;
  role:     Role;
}

export interface UpdateUserInput {
  fullName?: string;
  email?:    string;
  role?:     Role;
  isActive?: boolean;
}

const SELECT = {
  id: true, fullName: true, email: true,
  role: true, isActive: true, createdAt: true,
};

export const usersRepo = {
  findAll(search: string, { skip, take }: PaginationResult) {
    const where = search
      ? { OR: [
          { fullName: { contains: search } },
          { email:    { contains: search } },
        ]}
      : {};
    return Promise.all([
      prisma.user.findMany({ where, select: SELECT, orderBy: { createdAt: 'desc' }, skip, take }),
      prisma.user.count({ where }),
    ]);
  },

  findById(id: number) {
    return prisma.user.findUnique({ where: { id }, select: SELECT });
  },

  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  create(data: CreateUserInput) {
    return prisma.user.create({ data, select: SELECT });
  },

  update(id: number, data: UpdateUserInput) {
    return prisma.user.update({ where: { id }, data, select: SELECT });
  },

  updatePassword(id: number, passwordHash: string) {
    return prisma.user.update({ where: { id }, data: { passwordHash }, select: SELECT });
  },

  softDelete(id: number) {
    return prisma.user.update({ where: { id }, data: { isActive: false }, select: SELECT });
  },
};
