import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Calendar, Clock, User, Stethoscope, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCreateAppointment } from '@/hooks/useAppointments';
import { usePatientList, useCreatePatient } from '@/hooks/usePatients';
import { useDoctorList } from '@/hooks/useDoctors';
import { useSpecialtyList } from '@/hooks/useSpecialties';
import { useLeadSources } from '@/hooks/useLookups';

const schema = z.object({
  // Appointment Details
  doctorId: z.number().min(1, 'Please select a doctor'),
  serviceId: z.number().min(1, 'Please select a service'),
  date: z.string().min(1, 'Please select a date'),
  time: z.string().min(1, 'Please select a time'),
  notes: z.string().optional(),

  // Patient Logic
  isNewPatient: z.boolean().default(false),
  patientId: z.number().optional(),
  
  // New Patient Fields (Only if isNewPatient is true)
  fullName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  nationality: z.string().optional(),
  leadSourceId: z.number().optional(),
}).refine((data) => {
  if (data.isNewPatient) {
    return !!data.fullName && !!data.phone;
  }
  return !!data.patientId;
}, {
  message: "Please provide patient details",
  path: ["patientId"]
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
  const { data: leadSources } = useLeadSources();
  
  const createMutation = useCreateAppointment();
  const createPatientMutation = useCreatePatient();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      isNewPatient: false,
    }
  });

  const isNewPatient = watch('isNewPatient');
  const selectedPatientId = watch('patientId');
  
  const allServices = specialties?.flatMap((s: any) => 
    s.services.map((svc: any) => ({ ...svc, specialtyName: s.name }))
  ) || [];

  const onSubmit = async (values: FormValues) => {
    let finalPatientId = values.patientId;

    if (values.isNewPatient) {
      try {
        const patientRes = await createPatientMutation.mutateAsync({
          fullName: values.fullName!,
          phone: values.phone!,
          email: values.email || undefined,
          dateOfBirth: values.dateOfBirth ? new Date(values.dateOfBirth).toISOString() : undefined,
          gender: values.gender,
          nationality: values.nationality,
          leadSourceId: values.leadSourceId,
        });
        finalPatientId = patientRes.data.data.id;
      } catch (error) {
        console.error("Failed to create patient", error);
        return;
      }
    }

    if (!finalPatientId) return;

    const startTime = new Date(`${values.date}T${values.time}`);
    const service = allServices.find((s: any) => s.id === values.serviceId);
    const duration = service?.durationMin || 30;
    const endTime = new Date(startTime.getTime() + duration * 60000);

    createMutation.mutate({
      patientId: finalPatientId,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col border border-white/20">
        {/* Header */}
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-brand-600 to-brand-500 text-white relative">
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">Book Appointment</h2>
              <p className="text-brand-100 text-sm font-medium opacity-90 tracking-wide">Schedule a professional visit</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-3 hover:bg-white/20 rounded-2xl transition-all hover:rotate-90 duration-300"
          >
            <X className="w-6 h-6" />
          </button>
          
          {/* Decorative pattern */}
          <div className="absolute top-0 right-0 w-64 h-full bg-white/5 skew-x-[-20deg] translate-x-20" />
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
          
          {/* Patient Section */}
          <div className="bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-brand-500" /> Patient Information
              </h3>
              <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                <button
                  type="button"
                  onClick={() => setValue('isNewPatient', false)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${!isNewPatient ? 'bg-brand-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  Existing
                </button>
                <button
                  type="button"
                  onClick={() => setValue('isNewPatient', true)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${isNewPatient ? 'bg-brand-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  New Patient
                </button>
              </div>
            </div>

            {!isNewPatient ? (
              <div className="space-y-4">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="Search patient name, phone or file number..."
                    className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all shadow-sm"
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                  {patients?.data?.map((p: any) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setValue('patientId', p.id);
                        setPatientSearch(p.fullName);
                      }}
                      className={`flex items-center justify-between p-4 rounded-2xl border text-left transition-all ${
                        selectedPatientId === p.id 
                        ? 'bg-brand-600 border-brand-600 text-white shadow-lg shadow-brand-100' 
                        : 'bg-white border-gray-100 hover:border-brand-200 hover:bg-brand-50/30'
                      }`}
                    >
                      <div>
                        <p className={`text-sm font-bold ${selectedPatientId === p.id ? 'text-white' : 'text-gray-900'}`}>{p.fullName}</p>
                        <p className={`text-[10px] font-medium ${selectedPatientId === p.id ? 'text-brand-100' : 'text-gray-500'}`}>{p.phone} • {p.code}</p>
                      </div>
                      {selectedPatientId === p.id && <div className="w-2 h-2 rounded-full bg-white animate-pulse" />}
                    </button>
                  ))}
                  {patients?.data?.length === 0 && patientSearch && (
                    <div className="col-span-full py-8 text-center text-gray-400">
                      <Search className="w-8 h-8 mx-auto mb-2 opacity-20" />
                      <p className="text-xs font-bold uppercase tracking-widest">No matching patients found</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Full Name *</label>
                  <input 
                    {...register('fullName')}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all text-sm font-medium"
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Phone Number *</label>
                  <input 
                    {...register('phone')}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all text-sm font-medium"
                    placeholder="01xxxxxxxxx"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Email Address</label>
                  <input 
                    {...register('email')}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all text-sm font-medium"
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Date of Birth</label>
                  <input 
                    type="date"
                    {...register('dateOfBirth')}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all text-sm font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Gender</label>
                  <select 
                    {...register('gender')}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all text-sm font-medium"
                  >
                    <option value="">Select Gender</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Nationality</label>
                  <input 
                    {...register('nationality')}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all text-sm font-medium"
                    placeholder="Egyptian"
                  />
                </div>
                <div className="md:col-span-2 lg:col-span-1 space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">How did they hear about us?</label>
                  <select 
                    {...register('leadSourceId', { valueAsNumber: true })}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all text-sm font-medium"
                  >
                    <option value="">Select Source</option>
                    {leadSources?.map((ls: any) => (
                      <option key={ls.id} value={ls.id}>{ls.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            {errors.patientId && <p className="text-xs text-red-500 font-bold ml-1">Please select or register a patient</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Appointment Details Grid */}
            <div className="space-y-6">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Stethoscope className="w-3.5 h-3.5 text-brand-500" /> Medical Service
              </h3>
              
              <div className="grid grid-cols-1 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Select Doctor</label>
                  <select
                    {...register('doctorId', { valueAsNumber: true })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all text-sm font-bold"
                  >
                    <option value="">Choose your specialist</option>
                    {doctors?.data?.map((d: any) => (
                      <option key={d.id} value={d.id}>Dr. {d.user?.fullName || d.fullName} ({d.specialty?.name})</option>
                    ))}
                  </select>
                  {errors.doctorId && <p className="text-xs text-red-500 font-bold">{errors.doctorId.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Procedure / Service</label>
                  <select
                    {...register('serviceId', { valueAsNumber: true })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all text-sm font-bold"
                  >
                    <option value="">Select procedure</option>
                    {allServices.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name} - {s.price} EGP
                      </option>
                    ))}
                  </select>
                  {errors.serviceId && <p className="text-xs text-red-500 font-bold">{errors.serviceId.message}</p>}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-brand-500" /> Scheduling
              </h3>
              
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Date</label>
                  <input
                    type="date"
                    {...register('date')}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all text-sm font-bold"
                  />
                  {errors.date && <p className="text-xs text-red-500 font-bold">{errors.date.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Preferred Time</label>
                  <input
                    type="time"
                    {...register('time')}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all text-sm font-bold"
                  />
                  {errors.time && <p className="text-xs text-red-500 font-bold">{errors.time.message}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Internal Notes</label>
                <textarea
                  {...register('notes')}
                  rows={2}
                  placeholder="Private clinical notes..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all text-sm"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 flex gap-4 border-t border-gray-100">
            <Button 
              type="button" 
              variant="outline" 
              className="px-10 py-6 h-auto text-sm font-black uppercase tracking-widest rounded-[1.5rem] hover:bg-gray-50"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 py-6 h-auto text-sm font-black uppercase tracking-widest rounded-[1.5rem] bg-brand-600 hover:bg-brand-700 shadow-2xl shadow-brand-200 transition-all"
              loading={createMutation.isPending || createPatientMutation.isPending}
            >
              Confirm Appointment & Register
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
