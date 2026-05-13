// ── Enums ─────────────────────────────────────────────────────────────────

export type Role = 'Admin' | 'Reception' | 'Doctor' | 'Manager' | 'Accountant';
export type AppointmentStatus = 'Pending' | 'Confirmed' | 'Done' | 'Cancelled';
export type Nationality = 'Egyptian' | 'Foreigner';
export type Gender = 'M' | 'F';
export type ImageType = 'Before' | 'After' | 'Other';
export type PaymentMethod = 'Cash' | 'Card' | 'Bank' | 'Online' | 'Insurance' | 'Vodafone Cash' | 'Visa';

// ── API wrapper ────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ── Auth ──────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  clinicId?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

// ── User ──────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

// ── Doctor ────────────────────────────────────────────────────────────────

export interface Doctor {
  id: number;
  userId?: number;
  fullName?: string;
  specialtyId: number;
  commission: number;
  discount: number;
  isActive: boolean;
  user?: Pick<User, 'id' | 'fullName' | 'email'>;
  specialty: Pick<Specialty, 'id' | 'name'>;
}

// ── Specialty & Service ───────────────────────────────────────────────────

export interface Specialty {
  id: number;
  name: string;
  isActive: boolean;
  services?: Service[];
}

export interface Service {
  id: number;
  specialtyId: number;
  name: string;
  price: number;
  durationMin: number;
  isActive: boolean;
  specialty?: Pick<Specialty, 'id' | 'name'>;
}

// ── Patient ───────────────────────────────────────────────────────────────

export interface Patient {
  id: number;
  code: string;
  fullName: string;
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  gender?: Gender;
  nationality?: Nationality;
  countryId?: number;
  leadSourceId?: number;
  medicalHistory?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  country?: Pick<Country, 'id' | 'name'>;
  leadSource?: Pick<LeadSource, 'id' | 'name'>;
}

export interface PatientArea {
  id: number;
  patientId: number;
  areaId: number;
  notes?: string;
  addedAt: string;
  area: BodyArea;
}

export interface PatientImage {
  id: number;
  patientId: number;
  appointmentId?: number;
  imageType: ImageType;
  storagePath: string;
  uploadedAt: string;
}

export interface PatientRating {
  id: number;
  patientId: number;
  doctorId: number;
  appointmentId?: number;
  rating: number;
  notes?: string;
  createdAt: string;
  doctor?: Pick<Doctor, 'id' | 'fullName'> & { user: Pick<User, 'fullName'>; specialty: Pick<Specialty, 'name'> };
}

// ── Appointment ───────────────────────────────────────────────────────────

export interface Appointment {
  id: number;
  patientId: number;
  doctorId: number;
  serviceId: number;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  priceCharged?: number;
  discountPct: number;
  notes?: string;
  prescription?: string;
  createdAt: string;
  patient?: Pick<Patient, 'id' | 'code' | 'fullName' | 'phone'>;
  doctor?: Pick<Doctor, 'id' | 'fullName'> & { user: Pick<User, 'fullName'>; specialty: Pick<Specialty, 'name'> };
  service?: Pick<Service, 'id' | 'name' | 'price' | 'durationMin'>;
  payments?: Payment[];
}

// ── Payment ───────────────────────────────────────────────────────────────

export interface Payment {
  id: number;
  appointmentId: number;
  amount: number;
  method: PaymentMethod;
  paidAt: string;
}

// ── Lookup ────────────────────────────────────────────────────────────────

export interface LeadSource {
  id: number;
  name: string;
}

export interface Country {
  id: number;
  name: string;
  code: string;
}

export interface BodyArea {
  id: number;
  name: string;
  zone: 'front' | 'back';
  svgId: string;
}

// ── Settings ──────────────────────────────────────────────────────────────

export interface ClinicSetting {
  key: string;
  value: string;
}

// ── Finance ───────────────────────────────────────────────────────────────

export type TransactionType = 'Income' | 'Expense';

export interface FinancialTransaction {
  id: number;
  type: TransactionType;
  category: string;
  amount: number;
  method: string;
  description?: string;
  referenceType?: string;
  referenceId?: number;
  userId: number;
  createdAt: string;
  user?: { fullName: string };
}
