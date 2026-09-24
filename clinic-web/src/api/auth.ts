import api from './client';
import {
  ApiResponse,
  AuthUser,
  LoginRequest,
  LoginResponse,
  RegisterTenantRequest,
  RegisterTenantResponse,
} from '@/types';

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<ApiResponse<LoginResponse>>('/auth/login', data),

  register: (data: RegisterTenantRequest) =>
    api.post<ApiResponse<RegisterTenantResponse>>('/auth/register', data),

  verifyEmail: (token: string) =>
    api.post<ApiResponse<LoginResponse>>('/auth/verify-email', { token }),

  logout: () =>
    api.post<ApiResponse<null>>('/auth/logout'),

  refresh: () =>
    api.post<ApiResponse<{ accessToken: string }>>('/auth/refresh'),

  me: () =>
    api.get<ApiResponse<AuthUser>>('/auth/me'),
};
