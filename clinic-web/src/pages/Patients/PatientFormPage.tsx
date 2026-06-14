import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, ChevronRight, User, HeartPulse, ClipboardCheck } from 'lucide-react';
import { useCreatePatient } from '@/hooks/usePatients';
import { useLeadSources, useCountries } from '@/hooks/useLookups';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Card } from '@/components/ui/Card';
import { clsx } from 'clsx';

// ── Schema ────────────────────────────────────────────────────────────────
const schema = z.object({
  // Step 1
  fullName:        z.string().min(2, 'Name must be at least 2 characters').max(200),
  phone:           z.string().max(30).optional().or(z.literal('')),
  email:           z.string().email('Invalid email').optional().or(z.literal('')),
  dateOfBirth:     z.string().optional(),
  gender:          z.enum(['M', 'F', '']).optional(),
  nationality:     z.enum(['Egyptian', 'Foreigner', '']).optional(),
  countryId:       z.string().optional(),
  leadSourceId:    z.string().optional(),
  otherLeadSource: z.string().optional(),
  // Step 2
  medicalHistory: z.string().optional(),
  notes:          z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const STEPS = [
  { id: 1, label: 'Personal Info',    icon: User },
  { id: 2, label: 'Medical History',  icon: HeartPulse },
  { id: 3, label: 'Confirm',          icon: ClipboardCheck },
];

export function PatientFormPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const create = useCreatePatient();

  const { data: leadSources } = useLeadSources();
  const { data: countries }   = useCountries();

  const methods = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '', phone: '', email: '', dateOfBirth: '',
      gender: '', nationality: '', countryId: '', leadSourceId: '',
      otherLeadSource: '',
      medicalHistory: '', notes: '',
    },
  });

  const { register, handleSubmit, trigger, watch, formState: { errors, isSubmitting } } = methods;
  const values = watch();

  const selectedLeadSource = leadSources?.find((ls) => String(ls.id) === values.leadSourceId);
  const isOtherLeadSource = selectedLeadSource?.name?.toLowerCase() === 'other';

  // Validate only step 1 fields before advancing
  const handleNext = async () => {
    if (step === 1) {
      const valid = await trigger(['fullName', 'email', 'phone']);
      if (!valid) return;
    }
    setStep((s) => s + 1);
  };

  const onSubmit = async (data: FormData) => {
    const payload = {
      fullName:     data.fullName,
      phone:        data.phone || undefined,
      email:        data.email || undefined,
      dateOfBirth:  data.dateOfBirth || undefined,
      gender:       (data.gender as 'M' | 'F') || undefined,
      nationality:  (data.nationality as 'Egyptian' | 'Foreigner') || undefined,
      countryId:    data.countryId ? Number(data.countryId) : undefined,
      leadSourceId: data.leadSourceId ? Number(data.leadSourceId) : undefined,
      medicalHistory: data.medicalHistory || undefined,
      notes:        data.otherLeadSource
        ? `[Lead Source Other: ${data.otherLeadSource}]${data.notes ? ' ' + data.notes : ''}`
        : data.notes || undefined,
    };
    const res = await create.mutateAsync(payload);
    navigate(`/patients/${(res.data.data as { id: number }).id}`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Page title */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">New Patient</h2>
        <p className="text-xs text-gray-500 mt-0.5">Fill in the details to register a new patient.</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center flex-1">
            <div className="flex items-center gap-2">
              <div
                className={clsx(
                  'flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold transition-colors shrink-0',
                  step > s.id
                    ? 'bg-green-500 text-white'
                    : step === s.id
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-100 text-gray-400'
                )}
              >
                {step > s.id ? <Check className="w-4 h-4" /> : s.id}
              </div>
              <span
                className={clsx(
                  'text-xs font-medium hidden sm:block',
                  step === s.id ? 'text-brand-700' : step > s.id ? 'text-green-600' : 'text-gray-400'
                )}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={clsx('flex-1 h-px mx-3 transition-colors', step > s.id ? 'bg-green-300' : 'bg-gray-200')} />
            )}
          </div>
        ))}
      </div>

      {/* Form card */}
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Card>
            {/* ── Step 1: Personal Info ─────────────────────────────────── */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-4 h-4 text-brand-600" />
                  <h3 className="text-sm font-semibold text-gray-900">Personal Information</h3>
                </div>

                <Input
                  label="Full Name"
                  placeholder="e.g. Nour Mostafa"
                  required
                  error={errors.fullName?.message}
                  {...register('fullName')}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Phone"
                    type="tel"
                    placeholder="+20 1xx xxx xxxx"
                    error={errors.phone?.message}
                    {...register('phone')}
                  />
                  <Input
                    label="Email"
                    type="email"
                    placeholder="patient@email.com"
                    error={errors.email?.message}
                    {...register('email')}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Date of Birth"
                    type="date"
                    error={errors.dateOfBirth?.message}
                    {...register('dateOfBirth')}
                  />
                  <Select
                    label="Gender"
                    options={[{ value: 'M', label: 'Male' }, { value: 'F', label: 'Female' }]}
                    placeholder="Select gender"
                    error={errors.gender?.message}
                    {...register('gender')}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Nationality"
                    options={[
                      { value: 'Egyptian', label: 'Egyptian' },
                      { value: 'Foreigner', label: 'Foreigner' },
                    ]}
                    placeholder="Select nationality"
                    {...register('nationality')}
                  />
                  <Select
                    label="Country"
                    options={countries?.map((c) => ({ value: c.id, label: c.name })) ?? []}
                    placeholder="Select country"
                    {...register('countryId')}
                  />
                </div>

                <Select
                  label="Lead Source"
                  hint="How did the patient hear about us?"
                  options={leadSources?.map((ls) => ({ value: ls.id, label: ls.name })) ?? []}
                  placeholder="Select lead source"
                  {...register('leadSourceId')}
                />

                {isOtherLeadSource && (
                  <Input
                    label="Please specify the source"
                    placeholder="e.g. Referred by a friend, Radio, etc."
                    {...register('otherLeadSource')}
                  />
                )}
              </div>
            )}

            {/* ── Step 2: Medical History ───────────────────────────────── */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <HeartPulse className="w-4 h-4 text-brand-600" />
                  <h3 className="text-sm font-semibold text-gray-900">Medical History</h3>
                </div>

                <Textarea
                  label="Medical History"
                  placeholder="Allergies, chronic conditions, previous surgeries, medications…"
                  rows={5}
                  hint="This information is visible to doctors only."
                  {...register('medicalHistory')}
                />

                <Textarea
                  label="Internal Notes"
                  placeholder="Reception notes, preferences, follow-up reminders…"
                  rows={3}
                  {...register('notes')}
                />
              </div>
            )}

            {/* ── Step 3: Confirm ───────────────────────────────────────── */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <ClipboardCheck className="w-4 h-4 text-brand-600" />
                  <h3 className="text-sm font-semibold text-gray-900">Confirm Details</h3>
                </div>

                <div className="bg-gray-50 rounded-xl divide-y divide-gray-100">
                  <ConfirmRow label="Full Name"    value={values.fullName} />
                  <ConfirmRow label="Phone"        value={values.phone || '—'} />
                  <ConfirmRow label="Email"        value={values.email || '—'} />
                  <ConfirmRow label="Gender"       value={values.gender === 'M' ? 'Male' : values.gender === 'F' ? 'Female' : '—'} />
                  <ConfirmRow label="Nationality"  value={values.nationality || '—'} />
                  <ConfirmRow label="Date of Birth" value={values.dateOfBirth || '—'} />
                  <ConfirmRow
                    label="Lead Source"
                    value={
                      isOtherLeadSource
                        ? `Other — ${values.otherLeadSource || '(not specified)'}`
                        : selectedLeadSource?.name ?? '—'
                    }
                  />
                  {values.medicalHistory && (
                    <ConfirmRow label="Medical History" value={values.medicalHistory} multiline />
                  )}
                </div>

                {create.error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-xs text-red-700">
                      {(create.error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to create patient.'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* ── Navigation buttons ─────────────────────────────────────── */}
          <div className="flex items-center justify-between mt-4">
            <div>
              {step > 1 && (
                <Button variant="outline" onClick={() => setStep((s) => s - 1)} type="button">
                  Back
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => navigate('/patients')} type="button">
                Cancel
              </Button>

              {step < 3 ? (
                <Button
                  onClick={handleNext}
                  type="button"
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                >
                  Next
                </Button>
              ) : (
                <Button type="submit" loading={isSubmitting}>
                  Create Patient
                </Button>
              )}
            </div>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}

function ConfirmRow({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className={clsx('flex gap-4 px-4 py-3', multiline ? 'flex-col' : 'items-start')}>
      <span className="text-xs font-medium text-gray-500 w-32 shrink-0">{label}</span>
      <span className="text-xs text-gray-900">{value}</span>
    </div>
  );
}
