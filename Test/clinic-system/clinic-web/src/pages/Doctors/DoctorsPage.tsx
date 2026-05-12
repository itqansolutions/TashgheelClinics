import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Stethoscope, Percent, Edit, UserX, Search } from 'lucide-react';
import {
  useDoctorList, useCreateDoctor, useUpdateDoctor,
  useDeactivateDoctor, useDoctorUsers
} from '@/hooks/useDoctors';
import { useSpecialtyList } from '@/hooks/useSpecialties';
import { Button }      from '@/components/ui/Button';
import { Input }       from '@/components/ui/Input';
import { Select }      from '@/components/ui/Select';
import { Modal }       from '@/components/ui/Modal';
import { Badge }       from '@/components/ui/Badge';
import { Skeleton }    from '@/components/ui/Loader';
import { EmptyState }  from '@/components/ui/EmptyState';
import { Pagination }  from '@/components/ui/Pagination';
import { getInitials } from '@/utils/format';
import { useDebounce } from '@/hooks/useDebounce';
import type { Doctor } from '@/types';

const schema = z.object({
  userId:      z.string().min(1, 'Select a user'),
  specialtyId: z.string().min(1, 'Select a specialty'),
  commission:  z.string().refine((v) => Number(v) >= 0 && Number(v) <= 100, '0–100'),
  discount:    z.string().refine((v) => Number(v) >= 0 && Number(v) <= 100, '0–100'),
});
type FormData = z.infer<typeof schema>;

export function DoctorsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage]     = useState(1);
  const [modal, setModal]   = useState<{ open: boolean; editing?: Doctor }>({ open: false });
  const debouncedSearch     = useDebounce(search, 350);

  const { data, isLoading }   = useDoctorList({ search: debouncedSearch, page, limit: 20 });
  const { data: specialties } = useSpecialtyList();
  const { data: doctorUsers } = useDoctorUsers();
  const createDoctor          = useCreateDoctor();
  const updateDoctor          = useUpdateDoctor(modal.editing?.id ?? 0);
  const deactivateDoctor      = useDeactivateDoctor();

  const doctors = data?.data ?? [];
  const meta    = data?.meta;

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  const openModal = (doctor?: Doctor) => {
    reset({
      userId:      doctor?.userId      ? String(doctor.userId)      : '',
      specialtyId: doctor?.specialtyId ? String(doctor.specialtyId) : '',
      commission:  doctor?.commission  ? String(doctor.commission)  : '0',
      discount:    doctor?.discount    ? String(doctor.discount)    : '0',
    });
    setModal({ open: true, editing: doctor });
  };

  const onSubmit = async (data: FormData) => {
    if (modal.editing) {
      await updateDoctor.mutateAsync({
        specialtyId: Number(data.specialtyId),
        commission:  Number(data.commission),
        discount:    Number(data.discount),
      });
    } else {
      await createDoctor.mutateAsync({
        userId:      Number(data.userId),
        specialtyId: Number(data.specialtyId),
        commission:  Number(data.commission),
        discount:    Number(data.discount),
      });
    }
    setModal({ open: false });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Doctors</h2>
          <p className="text-xs text-gray-500 mt-0.5">{meta ? `${meta.total} registered doctors` : ''}</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => openModal()}>New Doctor</Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search doctors…"
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-300 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-4">
                <Skeleton className="w-11 h-11 rounded-xl mb-3" />
                <Skeleton className="h-4 w-32 mb-2" /><Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        ) : doctors.length === 0 ? (
          <EmptyState icon={Stethoscope} title="No doctors found"
            description="Add a doctor profile linked to a Doctor-role user."
            action={<Button size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => openModal()}>Add Doctor</Button>} />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {(doctors as Doctor[]).map((doc) => (
                <div key={doc.id} className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 hover:shadow-sm transition-all group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-brand-50 text-brand-700 text-sm font-bold shrink-0">
                        {getInitials(doc.user.fullName)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Dr. {doc.user.fullName}</p>
                        <p className="text-xs text-gray-500">{doc.specialty.name}</p>
                      </div>
                    </div>
                    {!doc.isActive && <Badge variant="red">Inactive</Badge>}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1"><Percent className="w-3 h-3 text-gray-400" />{Number(doc.commission)}% commission</span>
                    <span className="text-gray-200">|</span>
                    <span>Max {Number(doc.discount)}% off</span>
                  </div>
                  <p className="text-[11px] text-gray-400 truncate mb-3">{doc.user.email}</p>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="xs" leftIcon={<Edit className="w-3 h-3" />} onClick={() => openModal(doc)}>Edit</Button>
                    {doc.isActive && (
                      <Button variant="ghost" size="xs"
                        className="text-red-400 hover:text-red-600 hover:bg-red-50"
                        leftIcon={<UserX className="w-3 h-3" />}
                        onClick={() => { if (confirm(`Deactivate Dr. ${doc.user.fullName}?`)) deactivateDoctor.mutate(doc.id); }}>
                        Deactivate
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {meta && (
              <div className="px-4 pb-4">
                <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onPageChange={setPage} />
              </div>
            )}
          </>
        )}
      </div>

      <Modal open={modal.open} onClose={() => setModal({ open: false })}
        title={modal.editing ? 'Edit Doctor' : 'New Doctor Profile'}
        subtitle={modal.editing ? `Dr. ${modal.editing.user.fullName}` : 'Link a Doctor-role user'} size="sm">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {!modal.editing && (
            <Select label="User (Doctor role)" required error={errors.userId?.message}
              options={doctorUsers?.map((u) => ({ value: u.id, label: u.fullName })) ?? []}
              placeholder="Select user" {...register('userId')} />
          )}
          <Select label="Specialty" required error={errors.specialtyId?.message}
            options={specialties?.map((s) => ({ value: s.id, label: s.name })) ?? []}
            placeholder="Select specialty" {...register('specialtyId')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Commission %" type="number" hint="% of price" error={errors.commission?.message}
              leftElement={<Percent className="w-3.5 h-3.5" />} {...register('commission')} />
            <Input label="Max Discount %" type="number" hint="Allowed discount" error={errors.discount?.message}
              leftElement={<Percent className="w-3.5 h-3.5" />} {...register('discount')} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setModal({ open: false })}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>{modal.editing ? 'Save' : 'Create Doctor'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
