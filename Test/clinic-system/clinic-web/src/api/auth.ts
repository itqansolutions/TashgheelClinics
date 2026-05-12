import api from './client';
import { ApiResponse, AuthUser, LoginRequest, LoginResponse } from '@/types';

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<ApiResponse<LoginResponse>>('/auth/login', data),

  logout: () =>
    api.post<ApiResponse<null>>('/auth/logout'),

  refresh: () =>
    api.post<ApiResponse<{ accessToken: string }>>('/auth/refresh'),

  me: () =>
    api.get<ApiResponse<AuthUser>>('/auth/me'),
};
