import { TenantPrismaClient } from '../../utils/tenantPrisma';
export type Role = 'Admin' | 'System Admin' | 'Reception' | 'Doctor' | 'Manager' | 'Accountant' | string;
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
  findAll(db: TenantPrismaClient, search: string, { skip, take }: PaginationResult) {
    const where = search
      ? { OR: [
          { fullName: { contains: search } },
          { email:    { contains: search } },
        ]}
      : {};
    return Promise.all([
      db.user.findMany({ where, select: SELECT, orderBy: { createdAt: 'desc' }, skip, take }),
      db.user.count({ where }),
    ]);
  },

  findById(db: TenantPrismaClient, id: number) {
    return db.user.findFirst({ where: { id }, select: SELECT });
  },

  findByEmail(db: TenantPrismaClient, email: string) {
    return db.user.findFirst({ where: { email } });
  },

  create(db: TenantPrismaClient, data: CreateUserInput) {
    return db.user.create({ data, select: SELECT });
  },

  update(db: TenantPrismaClient, id: number, data: UpdateUserInput) {
    return db.user.update({ where: { id }, data, select: SELECT });
  },

  updatePassword(db: TenantPrismaClient, id: number, passwordHash: string) {
    return db.user.update({ where: { id }, data: { passwordHash }, select: SELECT });
  },

  softDelete(db: TenantPrismaClient, id: number) {
    return db.user.update({ where: { id }, data: { isActive: false }, select: SELECT });
  },
};

