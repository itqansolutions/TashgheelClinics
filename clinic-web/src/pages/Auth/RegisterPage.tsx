import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Eye, EyeOff, Loader2, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { Input } from '@/components/ui/Input';

const registerSchema = z.object({
  clinicName: z.string().min(2, 'Clinic name must be at least 2 characters').max(100),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens (e.g. al-amal)'),
  fullName: z.string().min(2, 'Full name is required').max(100),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type RegisterForm = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [successInfo, setSuccessInfo] = useState<{
    tenantName: string;
    slug: string;
    token?: string;
  } | null>(null);
  const [isActivating, setIsActivating] = useState(false);

  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const slugValue = watch('slug');

  const handleClinicNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue('clinicName', val);
    // Auto-generate clean slug if not manually touched
    const generatedSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setValue('slug', generatedSlug, { shouldValidate: true });
  };

  const onSubmit = async (data: RegisterForm) => {
    setServerError('');
    try {
      const res = await authApi.register(data);
      const resData = res.data.data;
      setSuccessInfo({
        tenantName: resData.tenant.name,
        slug: resData.tenant.slug,
        token: resData.verificationToken,
      });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Registration failed. Please check your data and try again.';
      setServerError(msg);
    }
  };

  const handleAutoVerify = async () => {
    if (!successInfo?.token) return;
    setIsActivating(true);
    try {
      const res = await authApi.verifyEmail(successInfo.token);
      const { user, accessToken } = res.data.data;
      setAuth(user, accessToken);
      navigate('/app/dashboard', { replace: true });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Activation failed. Please try again.';
      setServerError(msg);
      setIsActivating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-gray-50 flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-600 shadow-lg mb-3">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create Clinic Account</h1>
          <p className="text-sm text-gray-500 mt-1 text-center">
            Launch your clinic on Tashgheel SaaS with a 14-day free trial
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
          {successInfo ? (
            <div className="text-center py-4 space-y-5">
              <div className="w-14 h-14 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-green-50/50">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {successInfo.tenantName} is ready!
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Clinic slug:{' '}
                  <span className="font-mono font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                    {successInfo.slug}
                  </span>
                </p>
              </div>

              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-left">
                <div className="flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-amber-900">
                      14-Day Free Trial Activated
                    </p>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      Full access to appointments, patients, medical records, and reports.
                    </p>
                  </div>
                </div>
              </div>

              {successInfo.token ? (
                <div className="space-y-3">
                  <button
                    onClick={handleAutoVerify}
                    disabled={isActivating}
                    className="w-full h-11 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 active:bg-brand-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    {isActivating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Activate & Enter Clinic</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-gray-400">
                    Token verified directly in environment mode
                  </p>
                </div>
              ) : (
                <p className="text-xs text-gray-600">
                  A verification link has been sent to your email. Click the link to activate
                  your clinic.
                </p>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              <Input
                label="Clinic Name"
                placeholder="e.g. Al-Amal Dental Care"
                error={errors.clinicName?.message}
                {...register('clinicName')}
                onChange={handleClinicNameChange}
              />

              <div>
                <Input
                  label="Clinic Slug (Subdomain identifier)"
                  placeholder="e.g. al-amal"
                  error={errors.slug?.message}
                  {...register('slug')}
                />
                {slugValue && !errors.slug && (
                  <p className="text-[11px] text-brand-600 mt-1 font-mono">
                    URL: {slugValue}.tashgheel.com
                  </p>
                )}
              </div>

              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs font-semibold text-gray-700 mb-3">Admin Account Details</p>

                <div className="space-y-3">
                  <Input
                    label="Doctor / Owner Full Name"
                    placeholder="e.g. Dr. Ahmed Mansour"
                    error={errors.fullName?.message}
                    {...register('fullName')}
                  />

                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="doctor@clinic.com"
                    error={errors.email?.message}
                    {...register('email')}
                  />

                  <div className="w-full">
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Password (min 8 characters) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className={`w-full h-9 pl-3 pr-10 rounded-lg border text-sm text-gray-900 placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${
                          errors.password ? 'border-red-400' : 'border-gray-300'
                        }`}
                        {...register('password')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {serverError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-xs text-red-700">{serverError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-10 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 active:bg-brand-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-sm mt-4"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSubmitting ? 'Creating your clinic...' : 'Register Clinic & Start Free Trial'}
              </button>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500">
              Already have a clinic account?{' '}
              <Link to="/login" className="font-semibold text-brand-600 hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-[11px] text-gray-400 mt-6">
          Tashgheel Clinic Management System © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
