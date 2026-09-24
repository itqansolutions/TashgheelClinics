import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ShieldAlert,
  UserX,
  Lock,
  Clock,
  AlertOctagon,
  Home,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useRole, useTenant, useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/auth';

export function ForbiddenPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reason = searchParams.get('reason');
  const required = searchParams.get('required');
  const feature = searchParams.get('feature');

  const role = useRole();
  const tenant = useTenant();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      logout();
      navigate('/login', { replace: true });
    }
  };

  // State 1: Platform Boundary (Clinic User tried to access /superadmin)
  if (reason === 'platform_boundary') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-4">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
          <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
            Platform Boundary
          </span>
          <h1 className="text-xl font-bold text-gray-900 mt-2">Platform Admin Access Required</h1>
          <p className="text-xs text-gray-600 mt-2 mb-6 leading-relaxed">
            This area (<code className="font-mono text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded">/superadmin</code>) is restricted strictly to Tashgheel Platform Engineers.
            <br />
            Your account is currently registered as staff for:
            <span className="block mt-2 font-semibold text-gray-900 bg-gray-50 border border-gray-200 py-1.5 px-3 rounded-lg text-xs">
              🏥 {tenant?.name || 'Clinic Workspace'} ({role || 'Staff'})
            </span>
          </p>

          <div className="space-y-2">
            <Button
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={() => navigate('/app/dashboard')}
              leftIcon={<Home className="w-4 h-4" />}
            >
              Return to Clinic Workspace
            </Button>
            <button
              onClick={handleLogout}
              className="w-full py-2 text-xs font-medium text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign in with another account</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // State 2: Role Mismatch
  if (reason === 'role_mismatch') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md bg-white rounded-2xl border border-amber-200 shadow-sm p-8 text-center">
          <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-600">
            <UserX className="w-7 h-7" />
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-amber-50 text-amber-700 border border-amber-200">
            Role Restriction
          </span>
          <h1 className="text-xl font-bold text-gray-900 mt-2">Permission Required</h1>
          <p className="text-xs text-gray-600 mt-2 mb-6 leading-relaxed">
            You are signed in as <span className="font-semibold text-gray-900">{role || 'Staff'}</span>,
            which does not have permission to access this module.
            {required && (
              <span className="block mt-1 text-gray-400">
                Required role: <span className="font-mono text-gray-600">{required}</span>
              </span>
            )}
          </p>
          <Button onClick={() => navigate('/app/dashboard')} leftIcon={<Home className="w-4 h-4" />}>
            Back to Clinic Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // State 3: Feature Gated
  if (reason === 'feature_gated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50/40 via-white to-brand-50/30 p-4">
        <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
          <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-600">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Feature Locked</h1>
          <p className="text-xs text-gray-600 mt-2 mb-6 leading-relaxed">
            {feature ? `The ${feature} module` : 'This feature'} is available on the{' '}
            <span className="font-semibold text-brand-600">Pro Plan</span>. Upgrade your clinic
            subscription to unlock it.
          </p>
          <div className="space-y-2">
            <Button
              className="w-full bg-brand-600 hover:bg-brand-700 text-white"
              onClick={() => navigate('/app/settings')}
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              Explore Plans & Upgrade
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/app/dashboard')}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // State 4: Trial Ended
  if (reason === 'trial_ended') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50/40 via-white to-gray-50 p-4">
        <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
          <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-rose-600">
            <Clock className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Your 14-Day Free Trial Has Ended</h1>
          <p className="text-xs text-gray-600 mt-2 mb-6 leading-relaxed">
            All your clinic patients, appointments, and medical records are safely stored.
            Choose a subscription plan to continue clinic operations without interruption.
          </p>
          <div className="space-y-2">
            <Button
              className="w-full bg-brand-600 hover:bg-brand-700 text-white"
              onClick={() => navigate('/app/settings')}
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              Choose a Subscription Plan
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // State 5: Account Suspended
  if (reason === 'suspended') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50/40 via-white to-gray-50 p-4">
        <div className="w-full max-w-md bg-white rounded-2xl border border-red-200 shadow-sm p-8 text-center">
          <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-red-600">
            <AlertOctagon className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Clinic Workspace Suspended</h1>
          <p className="text-xs text-gray-600 mt-2 mb-6 leading-relaxed">
            This clinic workspace has been suspended. Please contact platform support or your clinic
            owner to restore operational access.
          </p>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleLogout}
            leftIcon={<LogOut className="w-4 h-4" />}
          >
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

  // Default fallback
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center max-w-sm">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-red-50 text-red-500 mx-auto mb-4">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Access Denied</h1>
        <p className="text-xs text-gray-500 mt-2 mb-6">
          You don't have permission to view this page.
        </p>
        <Button onClick={() => navigate('/app/dashboard')} leftIcon={<Home className="w-4 h-4" />}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center max-w-sm">
        <p className="text-6xl font-black text-gray-200 mb-2">404</p>
        <h1 className="text-xl font-bold text-gray-900">Page not found</h1>
        <p className="text-xs text-gray-500 mt-2 mb-6">
          The page you're looking for doesn't exist or has moved.
        </p>
        <Button onClick={() => navigate('/app/dashboard')} leftIcon={<Home className="w-4 h-4" />}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
