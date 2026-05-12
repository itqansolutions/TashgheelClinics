import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, Filter, Users, Phone } from 'lucide-react';
import { usePatientList, usePagination, useDeactivatePatient } from '@/hooks/usePatients';
import { useLeadSources } from '@/hooks/useLookups';
import { useRole } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { Skeleton } from '@/components/ui/Loader';
import { EmptyState } from '@/components/ui/EmptyState';
import { getInitials } from '@/utils/format';
import type { Patient } from '@/types';
import { useDebounce } from '@/hooks/useDebounce';

export function PatientsListPage() {
  const navigate = useNavigate();
  const role = useRole();
  const canCreate = role === 'Admin' || role === 'Reception';

  // ── Filters ───────────────────────────────────────────────────────────
  const [search, setSearch]           = useState('');
  const [nationality, setNationality] = useState('');
  const [leadSourceId, setLeadSourceId] = useState('');
  const { page, limit, setPage }      = usePagination();

  const debouncedSearch = useDebounce(search, 350);

  // ── Data ──────────────────────────────────────────────────────────────
  const { data, isLoading, isFetching } = usePatientList({
    search:      debouncedSearch,
    page,
    limit,
    nationality: nationality || undefined,
    leadSourceId: leadSourceId ? Number(leadSourceId) : undefined,
  });

  const { data: leadSources } = useLeadSources();
  const deactivate = useDeactivatePatient();

  const patients  = data?.data ?? [];
  const meta      = data?.meta;

  const handleDeactivate = useCallback(async (id: number, name: string) => {
    if (!confirm(`Deactivate patient "${name}"? They won't appear in searches.`)) return;
    await deactivate.mutateAsync(id);
  }, [deactivate]);

  // ── Reset page on filter change ───────────────────────────────────────
  const handleSearchChange = (v: string) => { setSearch(v); setPage(1); };
  const handleNatChange    = (v: string) => { setNationality(v); setPage(1); };
  const handleLeadChange   = (v: string) => { setLeadSourceId(v); setPage(1); };

  return (
    <div className="space-y-4">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Patients</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {meta ? `${meta.total.toLocaleString()} total patients` : 'Loading...'}
          </p>
        </div>
        {canCreate && (
          <Button
            leftIcon={<UserPlus className="w-4 h-4" />}
            onClick={() => navigate('/patients/new')}
          >
            New Patient
          </Button>
        )}
      </div>

      {/* ── Filters bar ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone, or code…"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-300 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0" />

            {/* Nationality filter */}
            <select
              value={nationality}
              onChange={(e) => handleNatChange(e.target.value)}
              className="h-9 pl-3 pr-8 rounded-lg border border-gray-300 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white appearance-none"
            >
              <option value="">All nationalities</option>
              <option value="Egyptian">Egyptian</option>
              <option value="Foreigner">Foreigner</option>
            </select>

            {/* Lead source filter */}
            <select
              value={leadSourceId}
              onChange={(e) => handleLeadChange(e.target.value)}
              className="h-9 pl-3 pr-8 rounded-lg border border-gray-300 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white appearance-none"
            >
              <option value="">All sources</option>
              {leadSources?.map((ls) => (
                <option key={ls.id} value={ls.id}>{ls.name}</option>
              ))}
            </select>

            {(search || nationality || leadSourceId) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setSearch(''); setNationality(''); setLeadSourceId(''); setPage(1); }}
              >
                Clear
              </Button>
            )}
          </div>

          {isFetching && !isLoading && (
            <div className="ml-auto">
              <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-3 w-20 hidden sm:block" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : patients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No patients found"
            description={
              search
                ? `No results for "${search}". Try a different search.`
                : 'Add your first patient to get started.'
            }
            action={
              canCreate ? (
                <Button
                  size="sm"
                  leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                  onClick={() => navigate('/patients/new')}
                >
                  Add Patient
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            {/* Table header */}
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
              {['Patient', 'Phone', 'Nationality', 'Source', 'Actions'].map((h) => (
                <span key={h} className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                  {h}
                </span>
              ))}
            </div>

            {/* Rows */}
            <div className="divide-y divide-gray-50">
              {patients.map((patient: Patient) => (
                <PatientRow
                  key={patient.id}
                  patient={patient}
                  canCreate={canCreate}
                  onView={() => navigate(`/patients/${patient.id}`)}
                  onDeactivate={() => handleDeactivate(patient.id, patient.fullName)}
                />
              ))}
            </div>

            {/* Pagination */}
            {meta && (
              <div className="px-4 py-3">
                <Pagination
                  page={meta.page}
                  totalPages={meta.totalPages}
                  total={meta.total}
                  limit={meta.limit}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Patient row component ──────────────────────────────────────────────────
function PatientRow({
  patient,
  canCreate,
  onView,
  onDeactivate,
}: {
  patient: Patient;
  canCreate: boolean;
  onView: () => void;
  onDeactivate: () => void;
}) {
  return (
    <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-4 py-3 items-center hover:bg-gray-50/60 transition-colors">
      {/* Patient name + code */}
      <button onClick={onView} className="flex items-center gap-3 text-left min-w-0 group">
        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold shrink-0">
          {getInitials(patient.fullName)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate group-hover:text-brand-600 transition-colors">
            {patient.fullName}
          </p>
          <p className="text-[11px] text-gray-400 font-mono">{patient.code}</p>
        </div>
      </button>

      {/* Phone */}
      <div className="flex items-center gap-1.5 text-xs text-gray-600">
        {patient.phone ? (
          <>
            <Phone className="w-3 h-3 text-gray-400 shrink-0" />
            <span className="truncate">{patient.phone}</span>
          </>
        ) : (
          <span className="text-gray-300">—</span>
        )}
      </div>

      {/* Nationality */}
      <div>
        {patient.nationality ? (
          <Badge variant={patient.nationality === 'Egyptian' ? 'blue' : 'purple'}>
            {patient.nationality}
          </Badge>
        ) : (
          <span className="text-xs text-gray-300">—</span>
        )}
      </div>

      {/* Lead source */}
      <span className="text-xs text-gray-500 truncate">
        {patient.leadSource?.name ?? <span className="text-gray-300">—</span>}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="xs" onClick={onView}>
          View
        </Button>
        {canCreate && (
          <Button
            variant="ghost"
            size="xs"
            className="text-red-500 hover:bg-red-50 hover:text-red-700"
            onClick={onDeactivate}
          >
            Deactivate
          </Button>
        )}
      </div>
    </div>
  );
}
