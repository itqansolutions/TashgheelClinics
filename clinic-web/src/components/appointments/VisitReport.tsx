import { useClinicSettings } from '@/hooks/useSettings';
import { formatDateTime, getInitials, formatCurrency } from '@/utils/format';
import type { Appointment, Patient, PatientArea } from '@/types';
import { BodySvg } from '@/pages/Patients/tabs/BodyMapTab';
import { Button } from '@/components/ui/Button';
import { Printer, X, Heart, ShieldCheck, Stethoscope, CreditCard, Map } from 'lucide-react';

interface Props {
  appointment: Appointment;
  patient:     Patient;
  notes:       string;
  prescription: string;
  bodyAreas?:  PatientArea[];
  usedItems?:  any[];
  onClose?:    () => void;
}

export function VisitReport({ appointment, patient, notes, prescription, bodyAreas, usedItems = [], onClose }: Props) {
  const { data: settings } = useClinicSettings();
  
  const clinicName = settings?.clinic_name || 'Tashgheel Clinic';
  const clinicAddress = settings?.clinic_address || 'Address not set';
  const clinicPhone = settings?.clinic_phone || 'Phone not set';

  const selectedFrontIds = new Set(bodyAreas?.filter(ba => ba.area.zone === 'front').map(ba => ba.areaId) || []);
  const selectedBackIds = new Set(bodyAreas?.filter(ba => ba.area.zone === 'back').map(ba => ba.areaId) || []);

  const handlePrint = () => {
    window.print();
  };

  // Helper to ensure numeric values for calculations
  const servicePrice = Number(appointment.service?.price || 0);
  const additionalFee = Number(appointment.priceCharged || 0);
  const discountPercent = Number(appointment.discountPct || 0);
  const itemsTotal = usedItems.reduce((sum, i) => sum + (Number(i.quantity) * Number(i.priceAtTime)), 0);
  
  const totalBeforeDiscount = servicePrice + additionalFee;
  const discountAmount = totalBeforeDiscount * (discountPercent / 100);
  const finalTotal = (totalBeforeDiscount - discountAmount) + itemsTotal;

  return (
    <div className="fixed inset-0 z-[100] bg-gray-900/40 backdrop-blur-sm overflow-y-auto pt-6 pb-20 px-4 no-print-overlay">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0 !important; padding: 0 !important; }
          .report-paper { 
            width: 100% !important; 
            max-width: 100% !important; 
            margin: 0 !important; 
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
          }
          @page { size: A4; margin: 10mm; }
        }
      `}</style>

      {/* Action Bar (Non-print only) */}
      <div className="max-w-[800px] mx-auto mb-4 flex items-center justify-between no-print">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white">
            <Heart className="w-4 h-4 fill-white" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-white">Report Preview</h2>
            <p className="text-[9px] text-brand-100 uppercase tracking-widest font-bold opacity-70">A4 Print Ready</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="bg-white/10 text-white border-white/20 hover:bg-white/20" leftIcon={<Printer className="w-3.5 h-3.5" />} onClick={handlePrint}>
            Print Report
          </Button>
          <Button variant="primary" size="sm" leftIcon={<X className="w-3.5 h-3.5" />} onClick={onClose} className="bg-white text-gray-900 hover:bg-gray-100 border-none">
            Close
          </Button>
        </div>
      </div>

      {/* The Paper */}
      <div className="max-w-[750px] mx-auto bg-white shadow-2xl rounded-2xl overflow-hidden report-paper">
        {/* Compact Header */}
        <div className="bg-gray-900 px-8 py-8 text-white flex justify-between items-center relative print:bg-white print:text-black print:border-b print:border-gray-100 print:py-4">
          <div className="relative z-10">
            <h1 className="text-xl font-black uppercase tracking-tight leading-none print:text-gray-900">{clinicName}</h1>
            <p className="text-[10px] font-bold text-brand-400 mt-1 uppercase tracking-[0.15em] print:text-gray-500">Medical Consultation Report</p>
          </div>
          <div className="text-right relative z-10">
            <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Reference No.</p>
            <p className="text-lg font-mono font-bold">#{appointment.id.toString().padStart(6, '0')}</p>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* Patient & Doctor Info Grid - More Compact */}
          <div className="grid grid-cols-2 gap-8 items-start">
            <div className="space-y-4">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Patient Details</span>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700 font-bold text-[10px] border border-gray-200">
                    {getInitials(patient.fullName)}
                  </div>
                  <div>
                    <span className="text-sm font-bold text-gray-900 block leading-tight">{patient.fullName}</span>
                    <span className="text-[10px] font-mono font-bold text-brand-600 uppercase">{patient.code}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex flex-col">
                  <span className="text-[8px] font-bold text-gray-400 uppercase">Gender</span>
                  <span className="text-[11px] font-bold text-gray-700">{patient.gender === 'M' ? 'Male' : 'Female'}</span>
                </div>
                <div className="w-px h-6 bg-gray-100" />
                <div className="flex flex-col">
                  <span className="text-[8px] font-bold text-gray-400 uppercase">Age</span>
                  <span className="text-[11px] font-bold text-gray-700">
                    {patient.dateOfBirth ? `${new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()}Y` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4 text-right">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Date & Time</span>
                <span className="text-sm font-bold text-gray-900">{formatDateTime(appointment.startTime)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Specialist</span>
                <span className="text-sm font-bold text-gray-900">Dr. {appointment.doctor?.user?.fullName || appointment.doctor?.fullName}</span>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">{appointment.doctor?.specialty?.name}</span>
              </div>
            </div>
          </div>

          <hr className="border-gray-50" />

          {/* Compact Layout */}
          <div className="grid grid-cols-3 gap-8">
            <div className="col-span-2 space-y-6">
              {/* Clinical Notes - Compact */}
              <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Stethoscope className="w-3 h-3 text-brand-600" /> Clinical Notes
                </h3>
                <div className="text-[11px] text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {notes || 'No clinical notes provided.'}
                </div>
              </div>

              {/* Financial Summary - Compact & Corrected */}
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <CreditCard className="w-3 h-3 text-green-600" /> Financial Summary
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-gray-500 font-medium">{appointment.service?.name || 'Primary Service'}</span>
                    <span className="font-mono font-bold text-gray-900">{formatCurrency(servicePrice)}</span>
                  </div>
                  {additionalFee > 0 && (
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-gray-500 font-medium">Additional Consultation Fee</span>
                      <span className="font-mono font-bold text-gray-900">{formatCurrency(additionalFee)}</span>
                    </div>
                  )}
                  {discountPercent > 0 && (
                    <div className="flex justify-between items-center text-[11px] text-red-600">
                      <span className="font-medium italic">Applied Discount ({discountPercent}%)</span>
                      <span className="font-mono font-bold">-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  {usedItems.length > 0 && (
                    <div className="pt-1 border-t border-dashed border-gray-100 mt-1">
                      {usedItems.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-[10px] text-gray-500">
                          <span>{item.name} (x{item.quantity})</span>
                          <span className="font-mono font-bold">{formatCurrency(Number(item.quantity) * Number(item.priceAtTime))}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="pt-2 border-t border-gray-200 mt-1 flex justify-between items-center">
                    <span className="text-xs font-black text-gray-900 uppercase">Total Amount</span>
                    <span className="text-base font-mono font-black text-brand-600">
                      {formatCurrency(finalTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Prescription - Compact */}
              <div className="bg-brand-50/30 border border-brand-100 p-4 rounded-xl">
                <h3 className="text-[9px] font-black text-brand-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3" /> Medications & Home Care
                </h3>
                <p className="text-[11px] text-gray-800 font-bold leading-relaxed whitespace-pre-wrap">
                  {prescription || 'No medications or specific instructions provided.'}
                </p>
              </div>
            </div>

            {/* Visual Body Map - Smaller */}
            <div className="col-span-1">
              <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Map className="w-3 h-3 text-brand-600" /> Injection Map
              </h3>
              
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col items-center">
                <div className="grid grid-cols-2 gap-4 justify-center items-center mb-4">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-28">
                      <BodySvg
                        zone="front"
                        areaProps={(id: number) => ({
                          fill: selectedFrontIds.has(id) ? '#2563eb' : '#e5e7eb',
                          stroke: selectedFrontIds.has(id) ? '#1e40af' : '#d1d5db',
                          strokeWidth: selectedFrontIds.has(id) ? 2 : 1,
                        })}
                      />
                    </div>
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Front View</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-28">
                      <BodySvg
                        zone="back"
                        areaProps={(id: number) => ({
                          fill: selectedBackIds.has(id) ? '#2563eb' : '#e5e7eb',
                          stroke: selectedBackIds.has(id) ? '#1e40af' : '#d1d5db',
                          strokeWidth: selectedBackIds.has(id) ? 2 : 1,
                        })}
                      />
                    </div>
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Back View</span>
                  </div>
                </div>

                <div className="w-full space-y-1.5">
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-1">Treated Zones</p>
                  <div className="max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                    {bodyAreas?.map((ba) => (
                      <div key={ba.id} className="py-1.5 border-b border-gray-50 last:border-0">
                        <p className="text-[10px] font-bold text-gray-900 leading-tight">{ba.area.name}</p>
                        {ba.notes && <p className="text-[9px] text-gray-500 leading-tight mt-0.5">{ba.notes}</p>}
                      </div>
                    ))}
                    {(!bodyAreas || bodyAreas.length === 0) && (
                      <p className="text-[8px] text-gray-400 italic text-center py-2">No zones recorded.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Professional Footer */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-end">
            <div className="text-[8px] text-gray-400 space-y-0.5">
              <p className="font-black text-gray-600 uppercase tracking-widest mb-1">{clinicName}</p>
              <p>{clinicAddress}</p>
              <p>Tel: {clinicPhone}</p>
              <p className="mt-2 italic opacity-50 uppercase font-bold tracking-tighter">Computer Generated Medical Record</p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-32 h-12 border-b border-gray-200 mb-1 flex items-center justify-center text-gray-50 text-2xl font-black opacity-20 select-none">
                {getInitials(appointment.doctor?.user?.fullName || appointment.doctor?.fullName || 'Doctor')}
              </div>
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Specialist Signature</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
