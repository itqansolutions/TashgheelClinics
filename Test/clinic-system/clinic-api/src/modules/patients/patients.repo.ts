import prisma from '../../config/db';
import { Nationality, Gender } from '@prisma/client';
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
      prisma.patient.findMany({
        where,
        select: LIST_SELECT,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.patient.count({ where }),
    ]);
  },

  findById(id: number) {
    return prisma.patient.findUnique({ where: { id }, include: FULL_INCLUDE });
  },

  findByCode(code: string) {
    return prisma.patient.findUnique({ where: { code }, include: FULL_INCLUDE });
  },

  findByPhone(phone: string) {
    return prisma.patient.findFirst({ where: { phone } });
  },

  create(data: CreatePatientInput) {
    return prisma.patient.create({ data, include: FULL_INCLUDE });
  },

  update(id: number, data: UpdatePatientInput) {
    return prisma.patient.update({ where: { id }, data, include: FULL_INCLUDE });
  },

  softDelete(id: number) {
    return prisma.patient.update({ where: { id }, data: { isActive: false }, include: FULL_INCLUDE });
  },

  // Appointments history
  findAppointments(patientId: number, limit = 20) {
    return prisma.appointment.findMany({
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
  findAreas(patientId: number) {
    return prisma.patientArea.findMany({
      where:   { patientId },
      include: { area: true },
      orderBy: { addedAt: 'asc' },
    });
  },

  upsertArea(patientId: number, areaId: number, notes?: string) {
    return prisma.patientArea.upsert({
      where:  { patientId_areaId: { patientId, areaId } },
      create: { patientId, areaId, notes },
      update: { notes },
      include: { area: true },
    });
  },

  deleteArea(patientId: number, areaId: number) {
    return prisma.patientArea.deleteMany({
      where: { patientId, areaId },
    });
  },

  // Ratings
  findRatings(patientId: number) {
    return prisma.patientRating.findMany({
      where:   { patientId },
      include: {
        doctor: { include: { user: { select: { fullName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  // Images
  findImages(patientId: number) {
    return prisma.patientImage.findMany({
      where:   { patientId },
      orderBy: { uploadedAt: 'desc' },
    });
  },
};
