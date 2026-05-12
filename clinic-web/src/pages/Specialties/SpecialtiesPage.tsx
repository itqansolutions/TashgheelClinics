import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ChevronDown, ChevronRight, Plus, Edit, Trash2,
  Scissors, PackageOpen, Clock, BadgeDollarSign
} from 'lucide-react';
import {
  useSpecialtyList, useCreateSpecialty, useUpdateSpecialty,
  useDeactivateSpecialty, useCreateService, useUpdateService, useDeactivateService
} from '@/hooks/useSpecialties';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Loader';
import { formatCurrency } from '@/utils/format';
import type { Specialty, Service } from '@/types';
import { clsx } from 'clsx';

// ── Schemas ───────────────────────────────────────────────────────────────
const specialtySchema = z.object({ name: z.string().min(2, 'At least 2 characters').max(100) });
const serviceSchema = z.object({
  name:        z.string().min(2, 'At least 2 characters').max(150),
  price:       z.string().refine((v) => Number(v) > 0, 'Price must be > 0'),
  durationMin: z.string().refine((v) => Number(v) >= 5, 'Min 5 minutes'),
});
type SpecialtyForm = z.infer<typeof specialtySchema>;
type ServiceForm   = z.infer<typeof serviceSchema>;

export function SpecialtiesPage() {
  const [openIds, setOpenIds]         = useState<Set<number>>(new Set());
  const [showInactive, setShowInactive] = useState(false);

  // Specialty modal state
  const [specialtyModal, setSpecialtyModal] = useState<{ open: boolean; editing?: Specialty }>({ open: false });
  // Service modal state
  const [serviceModal, setServiceModal] = useState<{
    open: boolean; specialtyId?: number; editing?: Service
  }>({ open: false });

  const { data: specialties = [], isLoading } = useSpecialtyList(showInactive);
  const createSpecialty    = useCreateSpecialty();
  const updateSpecialty    = useUpdateSpecialty();
  const deactivateSpecialty = useDeactivateSpecialty();
  const createService      = useCreateService();
  const updateService      = useUpdateService();
  const deactivateService  = useDeactivateService();

  const toggleOpen = (id: number) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Specialty form ────────────────────────────────────────────────────
  const {
    register: regSpec, handleSubmit: hsSpec, reset: resetSpec,
    formState: { errors: errSpec, isSubmitting: subSpec }
  } = useForm<SpecialtyForm>({ resolver: zodResolver(specialtySchema) });

  const openSpecialtyModal = (specialty?: Specialty) => {
    resetSpec({ name: specialty?.name ?? '' });
    setSpecialtyModal({ open: true, editing: specialty });
  };

  const submitSpecialty = async (data: SpecialtyForm) => {
    if (specialtyModal.editing) {
      await updateSpecialty.mutateAsync({ id: specialtyModal.editing.id, data: { name: data.name } });
    } else {
      await createSpecialty.mutateAsync(data.name);
    }
    setSpecialtyModal({ open: false });
  };

  // ── Service form ──────────────────────────────────────────────────────
  const {
    register: regSvc, handleSubmit: hsSvc, reset: resetSvc,
    formState: { errors: errSvc, isSubmitting: subSvc }
  } = useForm<ServiceForm>({ resolver: zodResolver(serviceSchema) });

  const openServiceModal = (specialtyId: number, service?: Service) => {
    resetSvc({
      name:        service?.name ?? '',
      price:       service?.price ? String(service.price) : '',
      durationMin: service?.durationMin ? String(service.durationMin) : '',
    });
    setServiceModal({ open: true, specialtyId, editing: service });
  };

  const submitService = async (data: ServiceForm) => {
    if (serviceModal.editing) {
      await updateService.mutateAsync({
        id: serviceModal.editing.id,
        data: { name: data.name, price: Number(data.price), durationMin: Number(data.durationMin) },
      });
    } else {
      await createService.mutateAsync({
        specialtyId: serviceModal.specialtyId!,
        name: data.name, price: Number(data.price), durationMin: Number(data.durationMin),
      });
    }
    setServiceModal({ open: false });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Specialties & Services</h2>
          <p className="text-xs text-gray-500 mt-0.5">Manage your clinic's service catalog</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded border-gray-300"
            />
            Show inactive
          </label>
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => openSpecialtyModal()}>
            New Specialty
          </Button>
        </div>
      </div>

      {/* Tree */}
      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
              <Skeleton className="h-4 w-40 mb-2" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))
        ) : specialties.length === 0 ? (
          <EmptyState
            icon={Scissors}
            title="No specialties yet"
            description="Create your first specialty to start adding services."
            action={
              <Button size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => openSpecialtyModal()}>
                Add Specialty
              </Button>
            }
          />
        ) : (
          specialties.map((specialty: Specialty & { services?: Service[]; _count?: { doctors: number } }) => (
            <div key={specialty.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Specialty header row */}
              <div
                className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-gray-50/60 transition-colors"
                onClick={() => toggleOpen(specialty.id)}
              >
                <div className={clsx(
                  'flex items-center justify-center w-8 h-8 rounded-lg shrink-0 transition-colors',
                  openIds.has(specialty.id) ? 'bg-brand-600' : 'bg-brand-50'
                )}>
                  <Scissors className={clsx(
                    'w-4 h-4',
                    openIds.has(specialty.id) ? 'text-white' : 'text-brand-600'
                  )} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">{specialty.name}</span>
                    {!specialty.isActive && <Badge variant="red">Inactive</Badge>}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {specialty.services?.length ?? 0} services
                    {specialty._count?.doctors ? ` · ${specialty._count.doctors} doctors` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="xs" leftIcon={<Plus className="w-3 h-3" />}
                    onClick={() => { openServiceModal(specialty.id); setOpenIds((p) => new Set([...p, specialty.id])); }}
                  >
                    Add Service
                  </Button>
                  <Button variant="ghost" size="xs" onClick={() => openSpecialtyModal(specialty)}>
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  {specialty.isActive && (
                    <Button variant="ghost" size="xs"
                      className="text-red-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => {
                        if (confirm(`Deactivate "${specialty.name}"?`))
                          deactivateSpecialty.mutate(specialty.id);
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  <div className="text-gray-300 ml-1">
                    {openIds.has(specialty.id)
                      ? <ChevronDown className="w-4 h-4" />
                      : <ChevronRight className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Services list */}
              {openIds.has(specialty.id) && (
                <div className="border-t border-gray-100">
                  {!specialty.services?.length ? (
                    <div className="flex items-center justify-center py-8 text-xs text-gray-400 gap-2">
                      <PackageOpen className="w-4 h-4" />
                      No services yet —{' '}
                      <button
                        className="text-brand-600 hover:underline"
                        onClick={() => openServiceModal(specialty.id)}
                      >
                        add one
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {specialty.services.map((service) => (
                        <ServiceRow
                          key={service.id}
                          service={service}
                          onEdit={() => openServiceModal(specialty.id, service)}
                          onDeactivate={() => {
                            if (confirm(`Deactivate "${service.name}"?`))
                              deactivateService.mutate(service.id);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Specialty modal */}
      <Modal
        open={specialtyModal.open}
        onClose={() => setSpecialtyModal({ open: false })}
        title={specialtyModal.editing ? 'Edit Specialty' : 'New Specialty'}
        size="sm"
      >
        <form onSubmit={hsSpec(submitSpecialty)} noValidate className="space-y-4">
          <Input
            label="Specialty Name"
            placeholder="e.g. Dermatology"
            required
            error={errSpec.name?.message}
            {...regSpec('name')}
            autoFocus
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setSpecialtyModal({ open: false })}>
              Cancel
            </Button>
            <Button type="submit" loading={subSpec}>
              {specialtyModal.editing ? 'Save Changes' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Service modal */}
      <Modal
        open={serviceModal.open}
        onClose={() => setServiceModal({ open: false })}
        title={serviceModal.editing ? 'Edit Service' : 'New Service'}
        size="sm"
      >
        <form onSubmit={hsSvc(submitService)} noValidate className="space-y-4">
          <Input
            label="Service Name"
            placeholder="e.g. Botox Injection"
            required
            error={errSvc.name?.message}
            {...regSvc('name')}
            autoFocus
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Price (EGP)"
              type="number"
              placeholder="2500"
              required
              error={errSvc.price?.message}
              leftElement={<BadgeDollarSign className="w-3.5 h-3.5" />}
              {...regSvc('price')}
            />
            <Input
              label="Duration (min)"
              type="number"
              placeholder="30"
              required
              error={errSvc.durationMin?.message}
              leftElement={<Clock className="w-3.5 h-3.5" />}
              {...regSvc('durationMin')}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setServiceModal({ open: false })}>
              Cancel
            </Button>
            <Button type="submit" loading={subSvc}>
              {serviceModal.editing ? 'Save Changes' : 'Add Service'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function ServiceRow({
  service, onEdit, onDeactivate
}: { service: Service; onEdit: () => void; onDeactivate: () => void }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 pl-16 hover:bg-gray-50/40 transition-colors group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-800 font-medium">{service.name}</span>
          {!service.isActive && <Badge variant="red">Inactive</Badge>}
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />{service.durationMin} min
          </span>
        </div>
      </div>

      <span className="text-sm font-semibold text-gray-700 shrink-0">
        {formatCurrency(service.price)}
      </span>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Button variant="ghost" size="xs" onClick={onEdit}>
          <Edit className="w-3.5 h-3.5" />
        </Button>
        {service.isActive && (
          <Button variant="ghost" size="xs"
            className="text-red-400 hover:text-red-600 hover:bg-red-50"
            onClick={onDeactivate}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
