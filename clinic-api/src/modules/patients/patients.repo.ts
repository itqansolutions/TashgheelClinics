import { TenantPrismaClient } from '../../utils/tenantPrisma';
export type Nationality = 'Egyptian' | 'Foreigner' | string;
export type Gender = 'M' | 'F' | string;
import { PaginationResult } from '../../utils/pagination';

export interface CreatePatientInput {
  code:          string;
  fullName:      string;
  phone?:        string;
  email?:        string;
  dateOfBirth?:  Date;
  gender?:       Gender;
  nationality?:  Nationality;
  countryId?:    number;
  leadSourceId?: number;
  medicalHistory?: string;
  notes?:        string;
  createdBy?:    number;
}

export type UpdatePatientInput = Partial<Omit<CreatePatientInput, 'code' | 'createdBy'>>;

// Fields returned in list view
const LIST_SELECT = {
  id: true, code: true, fullName: true, phone: true, email: true,
  gender: true, nationality: true, isActive: true, createdAt: true,
  leadSource: { select: { id: true, name: true } },
  country:    { select: { id: true, name: true } },
};

// Full profile include
const FULL_INCLUDE = {
  country:    { select: { id: true, name: true, code: true } },
  leadSource: { select: { id: true, name: true } },
};

export const patientsRepo = {
  findAll(
    db: TenantPrismaClient,
    search: string,
    filters: { nationality?: Nationality; leadSourceId?: number; isActive?: boolean },
    { skip, take }: PaginationResult
  ) {
    const where = {
      ...(filters.isActive !== undefined && { isActive: filters.isActive }),
      ...(filters.nationality && { nationality: filters.nationality }),
      ...(filters.leadSourceId && { leadSourceId: filters.leadSourceId }),
      ...(search && {
        OR: [
          { fullName: { contains: search } },
          { phone:    { contains: search } },
          { code:     { contains: search } },
          { email:    { contains: search } },
        ],
      }),
    };
    return Promise.all([
      db.patient.findMany({
        where,
        select: LIST_SELECT,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      db.patient.count({ where }),
    ]);
  },

  findById(db: TenantPrismaClient, id: number) {
    return db.patient.findFirst({ where: { id }, include: FULL_INCLUDE });
  },

  findByCode(db: TenantPrismaClient, code: string) {
    // code is per-tenant (not globally unique)
    return db.patient.findFirst({ where: { code }, include: FULL_INCLUDE });
  },

  findByPhone(db: TenantPrismaClient, phone: string) {
    return db.patient.findFirst({ where: { phone } });
  },

  create(db: TenantPrismaClient, data: CreatePatientInput) {
    return db.patient.create({ data, include: FULL_INCLUDE });
  },

  update(db: TenantPrismaClient, id: number, data: UpdatePatientInput) {
    return db.patient.update({ where: { id }, data, include: FULL_INCLUDE });
  },

  softDelete(db: TenantPrismaClient, id: number) {
    return db.patient.update({ where: { id }, data: { isActive: false }, include: FULL_INCLUDE });
  },

  // Appointments history
  findAppointments(db: TenantPrismaClient, patientId: number, limit = 20) {
    return db.appointment.findMany({
      where:   { patientId },
      include: {
        doctor:  { include: { user: { select: { fullName: true } } } },
        service: { select: { id: true, name: true, price: true } },
        payments: true,
      },
      orderBy: { startTime: 'desc' },
      take: limit,
    });
  },

  // Body areas
  findAreas(db: TenantPrismaClient, patientId: number) {
    return db.patientArea.findMany({
      where:   { patientId },
      include: { area: true },
      orderBy: { addedAt: 'asc' },
    });
  },

  upsertArea(db: TenantPrismaClient, patientId: number, areaId: number, notes?: string) {
    return db.patientArea.upsert({
      where:  { patientId_areaId: { patientId, areaId } },
      create: { patientId, areaId, notes },
      update: { notes },
      include: { area: true },
    });
  },

  deleteArea(db: TenantPrismaClient, patientId: number, areaId: number) {
    return db.patientArea.deleteMany({
      where: { patientId, areaId },
    });
  },

  // Ratings
  findRatings(db: TenantPrismaClient, patientId: number) {
    return db.patientRating.findMany({
      where:   { patientId },
      include: {
        doctor: { include: { user: { select: { fullName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  // Images
  findImages(db: TenantPrismaClient, patientId: number) {
    return db.patientImage.findMany({
      where:   { patientId },
      orderBy: { uploadedAt: 'desc' },
    });
  },
};
