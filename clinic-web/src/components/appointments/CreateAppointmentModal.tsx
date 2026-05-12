import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Calendar, Clock, User, Scissors, Info } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCreateAppointment } from '@/hooks/useAppointments';
import { usePatientList } from '@/hooks/usePatients';
import { useDoctorList } from '@/hooks/useDoctors';
import { useSpecialtyList } from '@/hooks/useSpecialties';

const schema = z.object({
  patientId: z.number().min(1, 'Please select a patient'),
  doctorId: z.number().min(1, 'Please select a doctor'),
  serviceId: z.number().min(1, 'Please select a service'),
  date: z.string().min(1, 'Please select a date'),
  time: z.string().min(1, 'Please select a time'),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateAppointmentModal({ isOpen, onClose }: Props) {
  const [patientSearch, setPatientSearch] = useState('');
  const { data: patients } = usePatientList({ search: patientSearch, limit: 10 });
  const { data: doctors } = useDoctorList({ limit: 100 });
  const { data: specialties } = useSpecialtyList();
  
  const createMutation = useCreateAppointment();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
    }
  });

  const selectedDoctorId = watch('doctorId');
  
  // Flatten all services from all specialties
  const allServices = specialties?.flatMap((s: any) => 
    s.services.map((svc: any) => ({ ...svc, specialtyName: s.name }))
  ) || [];

  const onSubmit = (values: FormValues) => {
    const startTime = new Date(`${values.date}T${values.time}`);
    const service = allServices.find((s: any) => s.id === values.serviceId);
    const duration = service?.durationMin || 30;
    const endTime = new Date(startTime.getTime() + duration * 60000);

    createMutation.mutate({
      patientId: values.patientId,
      doctorId: values.doctorId,
      serviceId: values.serviceId,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      notes: values.notes,
      priceCharged: service?.price,
      status: 'Pending',
    }, {
      onSuccess: () => {
        onClose();
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-brand-600 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Book Appointment</h2>
              <p className="text-brand-100 text-xs">Schedule a new visit for a patient</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 overflow-y-auto space-y-6">
          
          {/* Patient Selection */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <User className="w-4 h-4 text-brand-500" />
              Patient
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search patient name or phone..."
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                onChange={(e) => setPatientSearch(e.target.value)}
              />
              <div className="mt-2 grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                {patients?.data?.map((p: any) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setValue('patientId', p.id);
                      setPatientSearch(p.fullName);
                    }}
                    className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all ${
                      watch('patientId') === p.id 
                      ? 'bg-brand-50 border-brand-200 text-brand-700' 
                      : 'bg-white border-gray-100 hover:border-brand-200'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-bold">{p.fullName}</p>
                      <p className="text-[10px] text-gray-500">{p.phone} • {p.code}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            {errors.patientId && <p className="text-xs text-red-500">{errors.patientId.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Doctor Selection */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-brand-500" />
                Doctor
              </label>
              <select
                {...register('doctorId', { valueAsNumber: true })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="">Select Doctor</option>
                {doctors?.data?.map((d: any) => (
                  <option key={d.id} value={d.id}>Dr. {d.user?.fullName || d.fullName}</option>
                ))}
              </select>
              {errors.doctorId && <p className="text-xs text-red-500">{errors.doctorId.message}</p>}
            </div>

            {/* Service Selection */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Scissors className="w-4 h-4 text-brand-500" />
                Service
              </label>
              <select
                {...register('serviceId', { valueAsNumber: true })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="">Select Service</option>
                {allServices.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.specialtyName}) - {s.price} EGP
                  </option>
                ))}
              </select>
              {errors.serviceId && <p className="text-xs text-red-500">{errors.serviceId.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date Selection */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-500" />
                Date
              </label>
              <input
                type="date"
                {...register('date')}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
              {errors.date && <p className="text-xs text-red-500">{errors.date.message}</p>}
            </div>

            {/* Time Selection */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-500" />
                Time
              </label>
              <input
                type="time"
                {...register('time')}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
              {errors.time && <p className="text-xs text-red-500">{errors.time.message}</p>}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Info className="w-4 h-4 text-brand-500" />
              Notes
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              placeholder="Any special instructions..."
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1 py-3 h-auto text-lg rounded-xl"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 py-3 h-auto text-lg rounded-xl shadow-lg shadow-brand-500/20"
              loading={createMutation.isPending}
            >
              Confirm Booking
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Missing Lucide import in snippet fix
import { Stethoscope } from 'lucide-react';
