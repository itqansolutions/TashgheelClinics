import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, Building2 } from 'lucide-react';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>(
    token ? 'verifying' : 'error'
  );
  const [errorMessage, setErrorMessage] = useState(
    token ? '' : 'No verification token provided in URL.'
  );

  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    authApi
      .verifyEmail(token)
      .then((res) => {
        if (!isMounted) return;
        const { user, accessToken } = res.data.data;
        setAuth(user, accessToken);
        setStatus('success');
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 2000);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data
            ?.message ?? 'Invalid or expired verification token.';
        setErrorMessage(msg);
        setStatus('error');
      });

    return () => {
      isMounted = false;
    };
  }, [token, navigate, setAuth]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-600 shadow-lg mx-auto mb-4">
          <Building2 className="w-6 h-6 text-white" />
        </div>

        {status === 'verifying' && (
          <div className="py-6 space-y-4">
            <Loader2 className="w-10 h-10 text-brand-600 animate-spin mx-auto" />
            <h2 className="text-lg font-bold text-gray-900">Verifying Clinic Account...</h2>
            <p className="text-xs text-gray-500">
              Please wait while we activate your account and provision your database workspace.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-6 space-y-4">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-green-50/50">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Account Activated!</h2>
            <p className="text-xs text-gray-600">
              Your 14-day free trial is now active. Redirecting to your dashboard...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="py-6 space-y-4">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-red-50/50">
              <XCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Verification Failed</h2>
            <p className="text-xs text-red-600">{errorMessage}</p>
            <div className="pt-2">
              <Link
                to="/login"
                className="inline-block px-4 py-2 rounded-lg bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition-colors"
              >
                Go to Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
