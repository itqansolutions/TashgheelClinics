
import { patientsRepo, CreatePatientInput, Nationality, Gender } from './patients.repo';
import { AppError } from '../../middleware/errorHandler';
import { paginate, buildMeta } from '../../utils/pagination';
import { generatePatientCode } from '../../utils/patientCode';
import { TenantPrismaClient } from '../../utils/tenantPrisma';

export const patientsService = {
  async list(
    db: TenantPrismaClient,
    search: string,
    page: number,
    limit: number,
    filters: { nationality?: Nationality; leadSourceId?: number; isActive?: boolean }
  ) {
    const pg = paginate({ page, limit });
    const [data, total] = await patientsRepo.findAll(db, search, filters, pg);
    return { data, meta: buildMeta(total, pg.page, pg.limit) };
  },

  async getById(db: TenantPrismaClient, id: number) {
    const p = await patientsRepo.findById(db, id);
    if (!p) throw new AppError('Patient not found', 404);
    return p;
  },

  async create(
    db: TenantPrismaClient,
    body: {
      fullName: string; phone?: string; email?: string; dateOfBirth?: string;
      gender?: string; nationality?: string; countryId?: number; leadSourceId?: number;
      medicalHistory?: string; notes?: string;
    },
    createdBy: number
  ) {
    // Warn if phone already exists within this tenant (non-blocking)
    let phoneDuplicate = false;
    if (body.phone) {
      const existing = await patientsRepo.findByPhone(db, body.phone);
      if (existing) phoneDuplicate = true;
    }

    const code = await generatePatientCode();

    const data: CreatePatientInput = {
      code,
      fullName:      body.fullName,
      phone:         body.phone,
      email:         body.email || undefined,
      dateOfBirth:   body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
      gender:        body.gender as Gender | undefined,
      nationality:   body.nationality as Nationality | undefined,
      countryId:     body.countryId,
      leadSourceId:  body.leadSourceId,
      medicalHistory: body.medicalHistory,
      notes:         body.notes,
      createdBy,
    };

    const patient = await patientsRepo.create(db, data);
    return { patient, phoneDuplicate };
  },

  async update(db: TenantPrismaClient, id: number, body: Record<string, unknown>) {
    await this.getById(db, id);
    const data = {
      ...body,
      email:       (body.email as string) || undefined,
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth as string) : undefined,
    };
    return patientsRepo.update(db, id, data);
  },

  async deactivate(db: TenantPrismaClient, id: number) {
    await this.getById(db, id);
    return patientsRepo.softDelete(db, id);
  },

  async getAppointments(db: TenantPrismaClient, id: number) {
    await this.getById(db, id);
    return patientsRepo.findAppointments(db, id);
  },

  async getAreas(db: TenantPrismaClient, id: number) {
    await this.getById(db, id);
    return patientsRepo.findAreas(db, id);
  },

  async updateAreas(db: TenantPrismaClient, id: number, areas: { areaId: number; notes?: string }[]) {
    await this.getById(db, id);
    // Upsert all submitted areas
    const results = await Promise.all(
      areas.map(({ areaId, notes }) => patientsRepo.upsertArea(db, id, areaId, notes))
    );
    return results;
  },

  async removeArea(db: TenantPrismaClient, patientId: number, areaId: number) {
    await this.getById(db, patientId);
    return patientsRepo.deleteArea(db, patientId, areaId);
  },

  async getRatings(db: TenantPrismaClient, id: number) {
    await this.getById(db, id);
    return patientsRepo.findRatings(db, id);
  },

  async getImages(db: TenantPrismaClient, id: number) {
    await this.getById(db, id);
    return patientsRepo.findImages(db, id);
  },
};
