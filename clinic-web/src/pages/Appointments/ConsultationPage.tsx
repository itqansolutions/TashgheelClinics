import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, User, Calendar, Scissors, Phone, FileText, 
  Save, Printer, Info, Heart, ChevronRight, Activity,
  AlertCircle
} from 'lucide-react';
import { useAppointment, useUpdateAppointment } from '@/hooks/useAppointments';
import { usePatient, usePatientAreas } from '@/hooks/usePatients';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/Loader';
import { formatDateTime, formatDate, formatCurrency, getInitials } from '@/utils/format';
import { BodyMapTab } from '@/pages/Patients/tabs/BodyMapTab';
import { clsx } from 'clsx';
import { VisitReport } from '@/components/appointments/VisitReport';

type TabId = 'notes' | 'bodymap' | 'prescription';

export function ConsultationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('notes');
  const [isPrinting, setIsPrinting] = useState(false);
  const [showReview, setShowReview] = useState(false);
  
  const { data: appointment, isLoading: apptLoading } = useAppointment(Number(id));
  const { data: patient, isLoading: patientLoading } = usePatient(appointment?.patientId as number);
  const { data: patientAreas } = usePatientAreas(appointment?.patientId as number);
  
  const [notes, setNotes] = useState(appointment?.notes || '');
  const [prescription, setPrescription] = useState(appointment?.prescription || '');
  
  // Sync state when data is loaded
  useEffect(() => {
    if (appointment) {
      if (appointment.notes) setNotes(appointment.notes);
      if (appointment.prescription) setPrescription(appointment.prescription);
    }
  }, [appointment]);
  
  const updateMutation = useUpdateAppointment();

  if (apptLoading || patientLoading) return <PageLoader />;
  if (!appointment || !patient) return <div className="text-center py-20 text-gray-500">Appointment not found.</div>;

  const handleSave = async (finish = false) => {
    try {
      await updateMutation.mutateAsync({
        id: appointment.id,
        data: {
          notes: notes,
          prescription: prescription,
          status: finish ? 'Done' : appointment.status
        }
      });
      if (finish) {
        setShowReview(true);
      }
    } catch (err) {
      alert('Failed to save consultation data');
    }
  };

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 500);
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-4">
      {/* Report Review & Print Overlay */}
      {(isPrinting || showReview) && (
        <VisitReport 
          appointment={appointment} 
          patient={patient} 
          notes={notes} 
          prescription={prescription}
          bodyAreas={patientAreas}
          onClose={() => showReview ? navigate('/appointments') : setIsPrinting(false)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm no-print">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900">Consultation Session</h1>
              <Badge variant="blue">In Progress</Badge>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Ref: {appointment.patient?.code} · {formatDateTime(appointment.startTime)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Save className="w-3.5 h-3.5" />} onClick={() => handleSave()}>
            Save Draft
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Printer className="w-3.5 h-3.5" />} onClick={handlePrint}>
            Print Report
          </Button>
          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleSave(true)}>
            Finish Visit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 no-print">
        {/* Left: Patient History Sidebar */}
        <aside className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-20 h-20 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-700 text-2xl font-bold mb-3 border border-brand-100">
                {getInitials(patient.fullName)}
              </div>
              <h2 className="text-base font-bold text-gray-900">{patient.fullName}</h2>
              <p className="text-[11px] font-mono text-gray-400 mt-0.5">{patient.code}</p>
              
              <div className="grid grid-cols-2 gap-2 w-full mt-4">
                <div className="bg-gray-50 p-2 rounded-xl border border-gray-100">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase">Age</p>
                  <p className="text-xs font-bold text-gray-700">
                    {patient.dateOfBirth ? `${new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()} Years` : 'N/A'}
                  </p>
                </div>
                <div className="bg-gray-50 p-2 rounded-xl border border-gray-100">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase">Gender</p>
                  <p className="text-xs font-bold text-gray-700">{patient.gender === 'M' ? 'Male' : 'Female'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Heart className="w-3 h-3 text-red-400" /> Medical History
                </h3>
                <div className="text-xs text-gray-600 leading-relaxed bg-red-50/50 p-3 rounded-xl border border-red-100">
                  {patient.medicalHistory || 'No medical history recorded.'}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Phone className="w-3 h-3" /> {patient.phone || 'No phone'}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <User className="w-3 h-3" /> {patient.gender === 'M' ? 'Male' : 'Female'}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" /> Joined {formatDate(patient.createdAt)}
                </div>
              </div>

              <div>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Activity className="w-3 h-3 text-blue-400" /> Last Visit
                </h3>
                <div className="text-xs text-gray-600 p-3 rounded-xl border border-gray-100">
                  <p className="font-semibold text-gray-900">Botox Session</p>
                  <p className="text-[10px] text-gray-400">
                    {formatDate('2024-04-12')} · {formatCurrency(2500)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-800">Doctor Note</p>
              <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                Patient reported sensitivity in the forehead area during last session.
              </p>
            </div>
          </div>
        </aside>

        {/* Right: Work Area */}
        <main className="lg:col-span-3 space-y-4">
          {/* Tabs */}
          <div className="bg-white rounded-2xl border border-gray-200 p-1.5 flex gap-1 shadow-sm">
            {[
              { id: 'notes', label: 'Clinical Notes', icon: FileText },
              { id: 'bodymap', label: 'Body Mapping', icon: Activity },
              { id: 'prescription', label: 'Prescription & Instructions', icon: Scissors },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabId)}
                className={clsx(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all',
                  activeTab === tab.id 
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-200' 
                    : 'text-gray-500 hover:bg-gray-50'
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm min-h-[500px] overflow-hidden">
            {activeTab === 'notes' && (
              <div className="p-8 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-gray-900">Treatment Details</h3>
                  <span className="text-[11px] text-gray-400">Autosaved just now</span>
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Describe the treatment, findings, and procedure..."
                  className="w-full h-[400px] p-6 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-brand-500 text-sm leading-relaxed text-gray-700 placeholder:text-gray-300 resize-none"
                />
              </div>
            )}

            {activeTab === 'bodymap' && (
              <div className="h-full">
                <BodyMapTab patientId={patient.id} canEdit={true} />
              </div>
            )}

            {activeTab === 'prescription' && (
              <div className="p-8 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-brand-600" /> Medications
                  </h3>
                  <textarea
                    value={prescription}
                    onChange={(e) => setPrescription(e.target.value)}
                    placeholder="Enter medications, dosage, and duration..."
                    className="w-full h-40 p-4 rounded-2xl bg-gray-50 border border-gray-100 focus:ring-2 focus:ring-brand-500 text-sm"
                  />
                </div>
                
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Info className="w-4 h-4 text-brand-600" /> After-Care Instructions
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      "Avoid direct sunlight for 24 hours",
                      "Keep the area clean and moisturized",
                      "Do not use harsh chemicals",
                      "Apply ice pack if swelling occurs"
                    ].map((hint, i) => (
                      <button 
                        key={i}
                        className="p-3 text-left rounded-xl bg-white border border-gray-200 text-xs text-gray-600 hover:border-brand-500 hover:bg-brand-50 transition-all flex items-center gap-2 group"
                      >
                        <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-brand-500" />
                        {hint}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }

          /* Force hide everything except report */
          body * { visibility: hidden !important; }
          .no-print { display: none !important; }
          
          .no-print-overlay, .no-print-overlay * { visibility: visible !important; }
          
          .no-print-overlay { 
            position: absolute !important; 
            left: 0 !important; 
            top: 0 !important; 
            width: 100% !important; 
            height: auto !important; 
            background: white !important; 
            z-index: 9999 !important; 
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important; 
          }
          
          .report-paper { 
            border: none !important; 
            box-shadow: none !important; 
            width: 100% !important; 
            max-width: none !important;
            margin: 0 !important; 
            border-radius: 0 !important;
          }
          
          /* Hide the action bar inside overlay */
          .no-print-overlay .no-print { display: none !important; }
          
          body { 
            background: white !important; 
            margin: 0 !important; 
            padding: 0 !important; 
            overflow: visible !important; 
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}
