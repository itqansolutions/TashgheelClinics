import { z } from 'zod';

export const createPatientSchema = z.object({
  fullName:      z.string().min(2).max(200),
  phone:         z.string().max(30).optional(),
  email:         z.string().email().optional().or(z.literal('')),
  dateOfBirth:   z.string().optional(), // ISO date string
  gender:        z.enum(['M', 'F']).optional(),
  nationality:   z.enum(['Egyptian', 'Foreigner']).optional(),
  countryId:     z.number().int().positive().optional(),
  leadSourceId:  z.number().int().positive().optional(),
  medicalHistory: z.string().optional(),
  notes:         z.string().optional(),
});

export const updatePatientSchema = createPatientSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const patientQuerySchema = z.object({
  search:       z.string().optional().default(''),
  page:         z.string().optional().default('1'),
  limit:        z.string().optional().default('20'),
  nationality:  z.enum(['Egyptian', 'Foreigner']).optional(),
  leadSourceId: z.string().optional(),
  isActive:     z.string().optional(),
});

export const updateAreasSchema = z.object({
  areas: z.array(z.object({
    areaId: z.number().int().positive(),
    notes:  z.string().optional(),
  })),
});
