import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Phone, Mail, MapPin, Calendar,
  User, Heart, Map, CalendarDays, Image, Star, Edit, UserX
} from 'lucide-react';
import { usePatient, useDeactivatePatient } from '@/hooks/usePatients';
import { useRole } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/Loader';
import { formatDate, getInitials } from '@/utils/format';
import { PersonalInfoTab }   from './tabs/PersonalInfoTab';
import { MedicalHistoryTab } from './tabs/MedicalHistoryTab';
import { AppointmentsTab }   from './tabs/AppointmentsTab';
import { BodyMapTab }        from './tabs/BodyMapTab';

type TabId = 'personal' | 'medical' | 'appointments' | 'bodymap' | 'images' | 'ratings';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'personal',     label: 'Personal Info',   icon: User        },
  { id: 'medical',      label: 'Medical History', icon: Heart       },
  { id: 'appointments', label: 'Appointments',    icon: CalendarDays},
  { id: 'bodymap',      label: 'Body Map',        icon: Map         },
  { id: 'images',       label: 'Images',          icon: Image       },
  { id: 'ratings',      label: 'Ratings',         icon: Star        },
];

export function PatientProfilePage() {
  const { id }    = useParams<{ id: string }>();
  const navigate  = useNavigate();
  const role      = useRole();
  const canEdit   = role === 'Admin' || role === 'Reception';

  const [activeTab, setActiveTab] = useState<TabId>('personal');
  const { data: patient, isLoading } = usePatient(Number(id));
  const deactivate = useDeactivatePatient();

  if (isLoading) return <PageLoader />;
  if (!patient)  return (
    <div className="text-center py-16 text-sm text-gray-500">
      Patient not found.{' '}
      <button onClick={() => navigate(-1)} className="text-brand-600 hover:underline">Go back</button>
    </div>
  );

  const handleDeactivate = async () => {
    if (!confirm(`Deactivate "${patient.fullName}"?`)) return;
    await deactivate.mutateAsync(patient.id);
    navigate('/patients');
  };

  return (
    <div className="space-y-4">
      {/* Back */}
      <button
        onClick={() => navigate('/patients')}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Patients
      </button>

      <div className="flex gap-4 items-start">
        {/* ── Left sidebar ───────────────────────────────────────────── */}
        <aside className="w-64 shrink-0 space-y-3 sticky top-20">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex flex-col items-center text-center mb-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-50 text-brand-700 text-xl font-bold mb-3">
                {getInitials(patient.fullName)}
              </div>
              <h2 className="text-sm font-semibold text-gray-900 leading-tight">{patient.fullName}</h2>
              <p className="text-[11px] font-mono text-gray-400 mt-0.5">{patient.code}</p>
              <div className="flex items-center gap-1.5 mt-2 flex-wrap justify-center">
                <Badge variant={patient.isActive ? 'green' : 'red'} dot>
                  {patient.isActive ? 'Active' : 'Inactive'}
                </Badge>
                {patient.nationality && (
                  <Badge variant={patient.nationality === 'Egyptian' ? 'blue' : 'purple'}>
                    {patient.nationality}
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-2 text-xs">
              {patient.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  {patient.phone}
                </div>
              )}
              {patient.email && (
                <div className="flex items-center gap-2 text-gray-600 min-w-0">
                  <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="truncate">{patient.email}</span>
                </div>
              )}
              {patient.dateOfBirth && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  {formatDate(patient.dateOfBirth)}
                </div>
              )}
              {patient.country && (
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  {patient.country.name}
                </div>
              )}
              {patient.leadSource && (
                <div className="flex items-center gap-2 text-gray-500">
                  <div className="w-3.5 h-3.5 shrink-0" />
                  via {patient.leadSource.name}
                </div>
              )}
            </div>

            <p className="text-[10px] text-gray-400 text-center mt-4 pt-3 border-t border-gray-100">
              Patient since {formatDate(patient.createdAt, 'MMM yyyy')}
            </p>
          </div>

          {canEdit && (
            <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-1">
              <Button variant="outline" size="sm" className="w-full justify-start"
                leftIcon={<Edit className="w-3.5 h-3.5" />}
                onClick={() => setActiveTab('personal')}
              >
                Edit Info
              </Button>
              <Button variant="ghost" size="sm"
                className="w-full justify-start text-red-500 hover:bg-red-50 hover:text-red-700"
                leftIcon={<UserX className="w-3.5 h-3.5" />}
                onClick={handleDeactivate}
              >
                Deactivate
              </Button>
            </div>
          )}
        </aside>

        {/* ── Right panel ─────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Tab bar */}
          <div className="bg-white rounded-xl border border-gray-200 px-2 py-1 flex items-center gap-0.5 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5 shrink-0" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="bg-white rounded-xl border border-gray-200 min-h-[400px]">
            {activeTab === 'personal'     && <PersonalInfoTab   patient={patient} canEdit={canEdit} />}
            {activeTab === 'medical'      && <MedicalHistoryTab patient={patient} canEdit={canEdit} />}
            {activeTab === 'appointments' && <AppointmentsTab   patientId={patient.id} />}
            {activeTab === 'bodymap'      && <BodyMapTab        patientId={patient.id} canEdit={canEdit} />}
            {activeTab === 'images'       && <ComingSoon label="Image Gallery"  description="Before/after photo management — Sprint 5" />}
            {activeTab === 'ratings'      && <ComingSoon label="Patient Ratings" description="Doctor ratings — Sprint 5" />}
          </div>
        </div>
      </div>
    </div>
  );
}

function ComingSoon({ label, description }: { label: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <p className="text-sm font-semibold text-gray-400">{label}</p>
      <p className="text-xs text-gray-300 mt-1">{description}</p>
    </div>
  );
}
