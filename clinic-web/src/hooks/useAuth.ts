import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';

export function useLogin() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const login = async (email: string, password: string, redirectTo = '/dashboard') => {
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login({ email, password });
      const { user, accessToken } = res.data.data;
      setAuth(user, accessToken);
      navigate(redirectTo, { replace: true });
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Login failed'
      );
    } finally {
      setLoading(false);
    }
  };

  return { login, error, loading };
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  return async () => {
    try {
      await authApi.logout();
    } finally {
      logout();
      navigate('/login', { replace: true });
    }
  };
}
