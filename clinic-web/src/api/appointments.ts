import api from './client';

export interface Appointment {
  id: number;
  patientId: number;
  doctorId: number;
  serviceId: number;
  startTime: string;
  endTime: string;
  status: string;
  priceCharged?: number;
  discountPct?: number;
  notes?: string;
  patient?: { id: number; fullName: string; phone: string; code: string };
  doctor?: { id: number; user: { fullName: string } };
  service?: { id: number; name: string; price: number };
}

export const appointmentsApi = {
  getAll: (params?: any) => 
    api.get('/appointments', { params }).then(res => res.data),
    
  getById: (id: number) => 
    api.get(`/appointments/${id}`).then(res => res.data),
    
  create: (data: any) => 
    api.post('/appointments', data).then(res => res.data),
    
  update: (id: number, data: any) => 
    api.patch(`/appointments/${id}`, data).then(res => res.data),
    
  cancel: (id: number) => 
    api.delete(`/appointments/${id}`).then(res => res.data),
    
  getDoctorMe: (params?: any) =>
    api.get('/appointments/doctor-me', { params }).then(res => res.data),

  getAvailableSlots: (doctorId: number, date: string) =>
    api.get('/appointments/available-slots', { params: { doctorId, date } }).then(res => res.data),

  getAvailableDoctors: (date: string) =>
    api.get('/appointments/available-doctors', { params: { date } }).then(res => res.data),
};
