import api from './client';
import type {
  ApiResponse, User, Doctor, Specialty, Service,
  Patient, PatientArea, PatientRating, PatientImage,
  LeadSource, Country, BodyArea,
  PaginationMeta,
} from '@/types';

// ── Users ──────────────────────────────────────────────────────────────────
export const usersApi = {
  list: (params?: { search?: string; page?: number; limit?: number }) =>
    api.get<ApiResponse<User[]> & { meta: PaginationMeta }>('/users', { params }),
  getById: (id: number) =>
    api.get<ApiResponse<User>>(`/users/${id}`),
  create: (data: { fullName: string; email: string; password: string; role: string }) =>
    api.post<ApiResponse<User>>('/users', data),
  update: (id: number, data: Partial<User>) =>
    api.put<ApiResponse<User>>(`/users/${id}`, data),
  changePassword: (id: number, data: { currentPassword: string; newPassword: string }) =>
    api.patch<ApiResponse<null>>(`/users/${id}/password`, data),
  deactivate: (id: number) =>
    api.delete<ApiResponse<User>>(`/users/${id}`),
};

// ── Specialties ───────────────────────────────────────────────────────────
export const specialtiesApi = {
  list: (includeInactive = false) =>
    api.get<ApiResponse<Specialty[]>>('/specialties', { params: { includeInactive } }),
  getById: (id: number) =>
    api.get<ApiResponse<Specialty>>(`/specialties/${id}`),
  create: (name: string) =>
    api.post<ApiResponse<Specialty>>('/specialties', { name }),
  update: (id: number, data: { name?: string; isActive?: boolean }) =>
    api.put<ApiResponse<Specialty>>(`/specialties/${id}`, data),
  deactivate: (id: number) =>
    api.delete<ApiResponse<Specialty>>(`/specialties/${id}`),
};

// ── Services ──────────────────────────────────────────────────────────────
export const servicesApi = {
  list: (params?: { specialtyId?: number; includeInactive?: boolean }) =>
    api.get<ApiResponse<Service[]>>('/services', { params }),
  getById: (id: number) =>
    api.get<ApiResponse<Service>>(`/services/${id}`),
  create: (data: { specialtyId: number; name: string; price: number; durationMin: number }) =>
    api.post<ApiResponse<Service>>('/services', data),
  update: (id: number, data: Partial<{ specialtyId: number; name: string; price: number; durationMin: number; isActive: boolean }>) =>
    api.put<ApiResponse<Service>>(`/services/${id}`, data),
  deactivate: (id: number) =>
    api.delete<ApiResponse<Service>>(`/services/${id}`),
};

// ── Doctors ───────────────────────────────────────────────────────────────
export const doctorsApi = {
  list: (params?: { search?: string; page?: number; limit?: number; includeInactive?: boolean }) =>
    api.get<ApiResponse<Doctor[]> & { meta: PaginationMeta }>('/doctors', { params }),
  getById: (id: number) =>
    api.get<ApiResponse<Doctor>>(`/doctors/${id}`),
  create: (data: { userId?: number; fullName?: string; specialtyId: number; commission: number; discount: number }) =>
    api.post<ApiResponse<Doctor>>('/doctors', data),
  update: (id: number, data: Partial<{ specialtyId: number; commission: number; discount: number; isActive: boolean }>) =>
    api.put<ApiResponse<Doctor>>(`/doctors/${id}`, data),
  deactivate: (id: number) =>
    api.delete<ApiResponse<Doctor>>(`/doctors/${id}`),
  getMe: () =>
    api.get<ApiResponse<Doctor>>('/doctors/me'),
};

// ── Patients ──────────────────────────────────────────────────────────────
export const patientsApi = {
  list: (params?: {
    search?: string; page?: number; limit?: number;
    nationality?: string; leadSourceId?: number; isActive?: boolean;
  }) => api.get<ApiResponse<Patient[]> & { meta: PaginationMeta }>('/patients', { params }),

  getById: (id: number) =>
    api.get<ApiResponse<Patient>>(`/patients/${id}`),

  create: (data: {
    fullName: string; phone?: string; email?: string; dateOfBirth?: string;
    gender?: string; nationality?: string; countryId?: number; leadSourceId?: number;
    medicalHistory?: string; notes?: string;
  }) => api.post<ApiResponse<Patient>>('/patients', data),

  update: (id: number, data: Partial<Patient>) =>
    api.put<ApiResponse<Patient>>(`/patients/${id}`, data),

  deactivate: (id: number) =>
    api.delete<ApiResponse<Patient>>(`/patients/${id}`),

  getAppointments: (id: number) =>
    api.get<ApiResponse<unknown[]>>(`/patients/${id}/appointments`),

  getAreas: (id: number) =>
    api.get<ApiResponse<PatientArea[]>>(`/patients/${id}/areas`),

  updateAreas: (id: number, areas: { areaId: number; notes?: string }[]) =>
    api.put<ApiResponse<PatientArea[]>>(`/patients/${id}/areas`, { areas }),

  removeArea: (patientId: number, areaId: number) =>
    api.delete<ApiResponse<null>>(`/patients/${patientId}/areas/${areaId}`),

  getRatings: (id: number) =>
    api.get<ApiResponse<PatientRating[]>>(`/patients/${id}/ratings`),

  getImages: (id: number) =>
    api.get<ApiResponse<PatientImage[]>>(`/patients/${id}/images`),
};

// ── Settings ──────────────────────────────────────────────────────────────
export const settingsApi = {
  getClinic: () =>
    api.get<ApiResponse<Record<string, string>>>('/settings/clinic'),
  updateClinicBulk: (settings: Record<string, string>) =>
    api.put<ApiResponse<null>>('/settings/clinic/bulk', { settings }),
  getLeadSources: () =>
    api.get<ApiResponse<LeadSource[]>>('/settings/lead-sources'),
  createLeadSource: (name: string) =>
    api.post<ApiResponse<LeadSource>>('/settings/lead-sources', { name }),
  updateLeadSource: (id: number, name: string) =>
    api.put<ApiResponse<LeadSource>>(`/settings/lead-sources/${id}`, { name }),
  deleteLeadSource: (id: number) =>
    api.delete<ApiResponse<null>>(`/settings/lead-sources/${id}`),
  getCountries: () =>
    api.get<ApiResponse<Country[]>>('/settings/countries'),
  getBodyAreas: (zone?: 'front' | 'back') =>
    api.get<ApiResponse<BodyArea[]>>('/settings/body-areas', { params: zone ? { zone } : {} }),
};
