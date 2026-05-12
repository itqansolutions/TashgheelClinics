import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Edit, Save, X, CheckCircle } from 'lucide-react';
import { useUpdatePatient } from '@/hooks/usePatients';
import { useLeadSources, useCountries } from '@/hooks/useLookups';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { formatDate } from '@/utils/format';
import type { Patient } from '@/types';

const schema = z.object({
  fullName:     z.string().min(2).max(200),
  phone:        z.string().max(30).optional().or(z.literal('')),
  email:        z.string().email().optional().or(z.literal('')),
  dateOfBirth:  z.string().optional(),
  gender:       z.enum(['M', 'F', '']).optional(),
  nationality:  z.enum(['Egyptian', 'Foreigner', '']).optional(),
  countryId:    z.string().optional(),
  leadSourceId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function PersonalInfoTab({ patient, canEdit }: { patient: Patient; canEdit: boolean }) {
  const [editing, setEditing]   = useState(false);
  const [saved, setSaved]       = useState(false);
  const update = useUpdatePatient(patient.id);
  const { data: leadSources }   = useLeadSources();
  const { data: countries }     = useCountries();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: {
        fullName:     patient.fullName,
        phone:        patient.phone ?? '',
        email:        patient.email ?? '',
        dateOfBirth:  patient.dateOfBirth ? patient.dateOfBirth.split('T')[0] : '',
        gender:       (patient.gender as 'M' | 'F') ?? '',
        nationality:  patient.nationality ?? '',
        countryId:    patient.countryId ? String(patient.countryId) : '',
        leadSourceId: patient.leadSourceId ? String(patient.leadSourceId) : '',
      },
    });

  const handleCancel = () => { reset(); setEditing(false); };

  const onSubmit = async (data: FormData) => {
    await update.mutateAsync({
      fullName:     data.fullName,
      phone:        data.phone || undefined,
      email:        data.email || undefined,
      dateOfBirth:  data.dateOfBirth || undefined,
      gender:       (data.gender as 'M' | 'F') || undefined,
      nationality:  (data.nationality as 'Egyptian' | 'Foreigner') || undefined,
      countryId:    data.countryId ? Number(data.countryId) : undefined,
      leadSourceId: data.leadSourceId ? Number(data.leadSourceId) : undefined,
    });
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Personal Information</h3>
          <p className="text-xs text-gray-500 mt-0.5">Contact details and demographics</p>
        </div>
        {canEdit && !editing && (
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Edit className="w-3.5 h-3.5" />}
            onClick={() => setEditing(true)}
          >
            Edit
          </Button>
        )}
        {saved && (
          <div className="flex items-center gap-1.5 text-xs text-green-600">
            <CheckCircle className="w-3.5 h-3.5" />
            Saved
          </div>
        )}
      </div>

      {/* View mode */}
      {!editing && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          <InfoField label="Full Name"    value={patient.fullName} />
          <InfoField label="Phone"        value={patient.phone} />
          <InfoField label="Email"        value={patient.email} />
          <InfoField label="Date of Birth"
            value={patient.dateOfBirth ? formatDate(patient.dateOfBirth) : undefined}
          />
          <InfoField label="Gender"
            value={patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : undefined}
          />
          <InfoField label="Nationality"  value={patient.nationality} />
          <InfoField label="Country"      value={patient.country?.name} />
          <InfoField label="Lead Source"  value={patient.leadSource?.name} />
        </div>
      )}

      {/* Edit mode */}
      {editing && (
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div className="sm:col-span-2">
              <Input
                label="Full Name"
                required
                error={errors.fullName?.message}
                {...register('fullName')}
              />
            </div>
            <Input
              label="Phone"
              type="tel"
              error={errors.phone?.message}
              {...register('phone')}
            />
            <Input
              label="Email"
              type="email"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Date of Birth"
              type="date"
              {...register('dateOfBirth')}
            />
            <Select
              label="Gender"
              options={[{ value: 'M', label: 'Male' }, { value: 'F', label: 'Female' }]}
              placeholder="Select gender"
              {...register('gender')}
            />
            <Select
              label="Nationality"
              options={[
                { value: 'Egyptian',  label: 'Egyptian' },
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
            <div className="sm:col-span-2">
              <Select
                label="Lead Source"
                options={leadSources?.map((ls) => ({ value: ls.id, label: ls.name })) ?? []}
                placeholder="Select lead source"
                {...register('leadSourceId')}
              />
            </div>
          </div>

          {update.error && (
            <p className="text-xs text-red-600 mb-3">
              {(update.error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Save failed.'}
            </p>
          )}

          <div className="flex items-center gap-2 justify-end pt-4 border-t border-gray-100">
            <Button variant="ghost" size="sm" type="button" leftIcon={<X className="w-3.5 h-3.5" />} onClick={handleCancel}>
              Cancel
            </Button>
            <Button size="sm" type="submit" loading={isSubmitting} disabled={!isDirty}
              leftIcon={<Save className="w-3.5 h-3.5" />}
            >
              Save Changes
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

function InfoField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-gray-900">{value || <span className="text-gray-300">—</span>}</p>
    </div>
  );
}
