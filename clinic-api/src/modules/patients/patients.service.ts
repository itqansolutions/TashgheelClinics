
import { patientsRepo, CreatePatientInput, Nationality, Gender } from './patients.repo';
import { AppError } from '../../middleware/errorHandler';
import { paginate, buildMeta } from '../../utils/pagination';
import { generatePatientCode } from '../../utils/patientCode';

export const patientsService = {
  async list(
    search: string,
    page: number,
    limit: number,
    filters: { nationality?: Nationality; leadSourceId?: number; isActive?: boolean }
  ) {
    const pg = paginate({ page, limit });
    const [data, total] = await patientsRepo.findAll(search, filters, pg);
    return { data, meta: buildMeta(total, pg.page, pg.limit) };
  },

  async getById(id: number) {
    const p = await patientsRepo.findById(id);
    if (!p) throw new AppError('Patient not found', 404);
    return p;
  },

  async create(
    body: {
      fullName: string; phone?: string; email?: string; dateOfBirth?: string;
      gender?: string; nationality?: string; countryId?: number; leadSourceId?: number;
      medicalHistory?: string; notes?: string;
    },
    createdBy: number
  ) {
    // Warn if phone already exists (non-blocking)
    let phoneDuplicate = false;
    if (body.phone) {
      const existing = await patientsRepo.findByPhone(body.phone);
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

    const patient = await patientsRepo.create(data);
    return { patient, phoneDuplicate };
  },

  async update(id: number, body: Record<string, unknown>) {
    await this.getById(id);
    const data = {
      ...body,
      email:       (body.email as string) || undefined,
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth as string) : undefined,
    };
    return patientsRepo.update(id, data);
  },

  async deactivate(id: number) {
    await this.getById(id);
    return patientsRepo.softDelete(id);
  },

  async getAppointments(id: number) {
    await this.getById(id);
    return patientsRepo.findAppointments(id);
  },

  async getAreas(id: number) {
    await this.getById(id);
    return patientsRepo.findAreas(id);
  },

  async updateAreas(id: number, areas: { areaId: number; notes?: string }[]) {
    await this.getById(id);
    // Upsert all submitted areas
    const results = await Promise.all(
      areas.map(({ areaId, notes }) => patientsRepo.upsertArea(id, areaId, notes))
    );
    return results;
  },

  async removeArea(patientId: number, areaId: number) {
    await this.getById(patientId);
    return patientsRepo.deleteArea(patientId, areaId);
  },

  async getRatings(id: number) {
    await this.getById(id);
    return patientsRepo.findRatings(id);
  },

  async getImages(id: number) {
    await this.getById(id);
    return patientsRepo.findImages(id);
  },
};
