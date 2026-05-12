import { useClinicSettings } from '@/hooks/useSettings';
import { formatDateTime, getInitials } from '@/utils/format';
import type { Appointment, Patient, PatientArea } from '@/types';
import { BodySvg } from '@/pages/Patients/tabs/BodyMapTab';
import { useBodyAreas } from '@/hooks/useLookups';
import { Button } from '@/components/ui/Button';
import { Printer, X, Heart, ShieldCheck } from 'lucide-react';

interface Props {
  appointment: Appointment;
  patient:     Patient;
  notes:       string;
  prescription: string;
  bodyAreas?:  PatientArea[];
  onClose?:    () => void;
}

export function VisitReport({ appointment, patient, notes, prescription, bodyAreas, onClose }: Props) {
  const { data: settings } = useClinicSettings();
  
  const clinicName = settings?.clinic_name || 'Tashgheel Clinic';
  const clinicAddress = settings?.clinic_address || 'Address not set';
  const clinicPhone = settings?.clinic_phone || 'Phone not set';

  const selectedFrontIds = new Set(bodyAreas?.filter(ba => ba.area.zone === 'front').map(ba => ba.areaId) || []);
  const selectedBackIds = new Set(bodyAreas?.filter(ba => ba.area.zone === 'back').map(ba => ba.areaId) || []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-gray-50/95 backdrop-blur-md overflow-y-auto pt-10 pb-20 px-4 sm:px-6 no-print-overlay">
      {/* Action Bar (Non-print only) */}
      <div className="max-w-[800px] mx-auto mb-6 flex items-center justify-between no-print" style={{ display: typeof window !== 'undefined' && window.matchMedia('print').matches ? 'none' : 'flex' }}>
        <style>{`
          @media print {
            .no-print-bar { display: none !important; }
          }
        `}</style>
        <div className="flex items-center gap-3 no-print-bar">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-lg">
            <Heart className="w-5 h-5 fill-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">Visit Summary</h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Review & Print</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Printer className="w-4 h-4" />} onClick={handlePrint}>
            Reprint Report
          </Button>
          <Button variant="primary" size="sm" leftIcon={<X className="w-4 h-4" />} onClick={onClose} className="bg-gray-900 hover:bg-black">
            Close Review
          </Button>
        </div>
      </div>

      {/* The Paper */}
      <div className="max-w-[800px] mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden border border-gray-200 print:shadow-none print:border-none print:rounded-none report-paper">
        {/* Header / Letterhead */}
        <div className="bg-brand-600 px-10 py-12 text-white flex justify-between items-start relative overflow-hidden print:bg-white print:text-black print:border-b-2 print:border-gray-900 print:py-6">
          <div className="relative z-10">
            <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">{clinicName}</h1>
            <p className="text-[11px] font-bold text-brand-100 mt-2 uppercase tracking-[0.2em] opacity-80 print:text-gray-500">Medical Consultation Report</p>
          </div>
          <div className="text-right relative z-10">
            <p className="text-[10px] font-bold text-brand-200 uppercase tracking-widest print:text-gray-400">Report Reference</p>
            <p className="text-xl font-mono font-bold">#{appointment.id.toString().padStart(6, '0')}</p>
          </div>
          {/* Decorative heart icon */}
          <Heart className="absolute -bottom-10 -right-10 w-48 h-48 text-white/5 fill-white/5 no-print" />
        </div>

        <div className="p-10 space-y-10">
          {/* Patient & Doctor Info Grid */}
          <div className="grid grid-cols-2 gap-10">
            <div className="space-y-6">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Patient Details</span>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 font-bold text-xs">
                    {getInitials(patient.fullName)}
                  </div>
                  <div>
                    <span className="text-base font-bold text-gray-900 block">{patient.fullName}</span>
                    <span className="text-[11px] font-mono font-bold text-brand-600 uppercase">{patient.code}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  <span className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">Gender</span>
                  <span className="text-xs font-bold text-gray-800">{patient.gender === 'M' ? 'Male' : 'Female'}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  <span className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">Age</span>
                  <span className="text-xs font-bold text-gray-800">
                    {patient.dateOfBirth ? `${new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()}Y` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-6 text-right">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Consultation Time</span>
                <span className="text-base font-bold text-gray-900">{formatDateTime(appointment.startTime)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Attending Specialist</span>
                <span className="text-base font-bold text-gray-900">Dr. {appointment.doctor?.user?.fullName || appointment.doctor?.fullName}</span>
                <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wide">{appointment.doctor?.specialty?.name}</span>
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Treatment Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="md:col-span-2 space-y-8">
              {/* Clinical Notes */}
              <div className="relative">
                <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-600" /> Clinical Notes & Procedure
                </h3>
                <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap pl-3 border-l-2 border-gray-100 min-h-[120px]">
                  {notes || 'No clinical notes provided.'}
                </div>
              </div>

              {/* Prescription */}
              <div className="relative pt-4">
                <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-600" /> Medications & Home Care
                </h3>
                <div className="bg-gray-50/50 border-2 border-dashed border-gray-200 p-6 rounded-3xl relative">
                  <p className="text-sm text-gray-800 font-bold leading-relaxed whitespace-pre-wrap min-h-[80px]">
                    {prescription || 'No medications or specific instructions provided.'}
                  </p>
                  <div className="absolute top-4 right-4 opacity-5 no-print">
                    <ShieldCheck className="w-12 h-12" />
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Body Map */}
            <div className="md:col-span-1 space-y-6">
              <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-600" /> Injection Map
              </h3>
              
              <div className="flex gap-4 justify-center items-center bg-gray-50/50 rounded-3xl p-4 border border-gray-100">
                <div className="flex flex-col items-center gap-1">
                  <BodySvg
                    zone="front"
                    areaProps={(id: number) => ({
                      fill: selectedFrontIds.has(id) ? '#3b82f6' : '#e5e7eb',
                    })}
                  />
                  <span className="text-[8px] font-black text-gray-400 uppercase">Front</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <BodySvg
                    zone="back"
                    areaProps={(id: number) => ({
                      fill: selectedBackIds.has(id) ? '#3b82f6' : '#e5e7eb',
                    })}
                  />
                  <span className="text-[8px] font-black text-gray-400 uppercase">Back</span>
                </div>
              </div>

              {/* List of areas */}
              <div className="space-y-1.5">
                {bodyAreas?.map((ba) => (
                  <div key={ba.id} className="flex flex-col px-3 py-2 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <span className="text-[10px] font-bold text-gray-900">{ba.area.name}</span>
                    {ba.notes && <span className="text-[9px] text-gray-500 italic leading-tight mt-0.5">{ba.notes}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Signature Footer */}
          <div className="mt-16 pt-10 border-t border-gray-100 flex justify-between items-end">
            <div className="text-[10px] text-gray-400 space-y-1">
              <p className="font-black text-gray-600 uppercase tracking-widest mb-1">{clinicName}</p>
              <p className="font-medium">{clinicAddress}</p>
              <p className="font-medium">Tel: {clinicPhone}</p>
              <p className="mt-4 italic opacity-75">This is a computer-generated medical report.</p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-40 h-16 border-b-2 border-gray-200 mb-2 flex items-center justify-center text-gray-100 text-3xl font-black opacity-30 select-none">
                {getInitials(appointment.doctor?.user?.fullName || appointment.doctor?.fullName || 'Doctor')}
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Medical Specialist Signature</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
