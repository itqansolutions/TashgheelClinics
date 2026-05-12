import { useClinicSettings } from '@/hooks/useSettings';
import { formatDate, formatDateTime, getInitials } from '@/utils/format';
import type { Appointment, Patient, PatientArea } from '@/types';

interface Props {
  appointment: Appointment;
  patient:     Patient;
  notes:       string;
  prescription: string;
  bodyAreas?:  PatientArea[];
}

export function VisitReport({ appointment, patient, notes, prescription, bodyAreas }: Props) {
  const { data: settings } = useClinicSettings();
  
  const clinicName = settings?.clinic_name || 'Tashgheel Clinic';
  const clinicAddress = settings?.clinic_address || 'Address not set';
  const clinicPhone = settings?.clinic_phone || 'Phone not set';

  return (
    <div className="fixed inset-0 z-[100] bg-white p-12 overflow-y-auto print-only hidden">
      {/* Header / Letterhead */}
      <div className="flex flex-col items-center border-b-2 border-gray-900 pb-6 mb-8 text-center">
        <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">{clinicName}</h1>
        <p className="text-sm font-bold text-gray-500 mt-1 uppercase tracking-widest">Medical Consultation Report</p>
      </div>

      {/* Patient & Doctor Info Grid */}
      <div className="grid grid-cols-2 gap-8 mb-10">
        <div className="space-y-3">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Patient Name</span>
            <span className="text-lg font-bold text-gray-900">{patient.fullName}</span>
          </div>
          <div className="flex gap-10">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Patient ID</span>
              <span className="text-sm font-bold text-gray-800">{patient.code}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Gender / Age</span>
              <span className="text-sm font-bold text-gray-800">
                {patient.gender === 'M' ? 'Male' : 'Female'} / {patient.dateOfBirth ? `${new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()}Y` : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3 text-right">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date of Visit</span>
            <span className="text-lg font-bold text-gray-900">{formatDateTime(appointment.startTime)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Attending Doctor</span>
            <span className="text-sm font-bold text-gray-800">Dr. {appointment.doctor?.user?.fullName || appointment.doctor?.fullName}</span>
            <span className="text-[10px] text-gray-500 font-medium">{appointment.doctor?.specialty?.name}</span>
          </div>
        </div>
      </div>

      {/* Treatment Area */}
      <div className="space-y-8">
        {/* Service */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Service Provided</span>
              <p className="text-base font-bold text-brand-700">{appointment.service?.name}</p>
            </div>
          </div>
        </div>

        {/* Clinical Notes */}
        <div>
          <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-3 border-b border-gray-100 pb-1">Clinical Notes & Findings</h3>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap min-h-[100px]">
            {notes || 'No clinical notes provided.'}
          </p>
        </div>

        {/* Body Map Summary (If areas selected) */}
        {bodyAreas && bodyAreas.length > 0 && (
          <div>
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-3 border-b border-gray-100 pb-1">Treated Areas</h3>
            <div className="grid grid-cols-2 gap-4">
              {bodyAreas.map((ba) => (
                <div key={ba.id} className="flex flex-col p-2 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-[11px] font-bold text-gray-900">{ba.area.name} ({ba.area.zone})</span>
                  {ba.notes && <span className="text-[10px] text-gray-500 italic mt-0.5">{ba.notes}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Prescription */}
        <div>
          <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-3 border-b border-gray-100 pb-1">Medications & Instructions</h3>
          <div className="border-2 border-dashed border-gray-200 p-6 rounded-2xl">
            <p className="text-sm text-gray-800 font-medium whitespace-pre-wrap min-h-[80px]">
              {prescription || 'No medications or specific instructions provided.'}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-20 pt-8 border-t border-gray-200 flex justify-between items-end">
        <div className="text-[10px] text-gray-400 space-y-1">
          <p className="font-bold text-gray-600 uppercase tracking-widest">{clinicName}</p>
          <p>{clinicAddress}</p>
          <p>T: {clinicPhone}</p>
        </div>
        
        <div className="flex flex-col items-center">
          <div className="w-32 h-16 border-b border-gray-300 mb-2"></div>
          <p className="text-[10px] font-bold text-gray-400 uppercase">Doctor Signature</p>
        </div>
      </div>

      <style>{`
        @media print {
          .print-only { display: block !important; }
        }
      `}</style>
    </div>
  );
}
