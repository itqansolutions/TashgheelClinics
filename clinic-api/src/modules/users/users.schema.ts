import { z } from 'zod';

export const createUserSchema = z.object({
  fullName: z.string().min(2).max(150),
  email:    z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role:     z.enum(['Admin', 'Reception', 'Doctor', 'Receptionist']),
});

export const updateUserSchema = z.object({
  fullName: z.string().min(2).max(150).optional(),
  email:    z.string().email().optional(),
  role:     z.enum(['Admin', 'Reception', 'Doctor', 'Receptionist']).optional(),
  isActive: z.boolean().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword:     z.string().min(8, 'New password must be at least 8 characters'),
});

export const listQuerySchema = z.object({
  search: z.string().optional().default(''),
  page:   z.string().optional().default('1'),
  limit:  z.string().optional().default('20'),
});
