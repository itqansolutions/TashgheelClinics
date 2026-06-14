import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Info, StickyNote } from 'lucide-react';
import { usePatientAreas } from '@/hooks/usePatients';
import { useBodyAreas } from '@/hooks/useLookups';
import { patientsApi } from '@/api/index';
import { PATIENTS_KEY } from '@/hooks/usePatients';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/Loader';
import { clsx } from 'clsx';
import type { PatientArea } from '@/types';

export type Zone = 'front' | 'back';

export function BodyMapTab({ patientId, canEdit }: { patientId: number; canEdit: boolean }) {
  const { data: patientAreas = [], isLoading: areasLoading } = usePatientAreas(patientId);
  const [selectedIds, setSelectedIds]   = useState<Set<number>>(new Set());
  const [initialized, setInitialized]   = useState(false);
  const [zone, setZone]                 = useState<Zone>('front');
  const [activeAreaId, setActiveAreaId] = useState<number | null>(null);
  const [areaNote, setAreaNote]         = useState('');
  // Track notes per area locally so edits aren't lost when switching areas
  const [localNotes, setLocalNotes]     = useState<Record<number, string>>({});
  const [dirty, setDirty]               = useState(false);

  // Initialise selections from DB on first load — also seed localNotes from saved data
  if (!initialized && patientAreas.length > 0) {
    setSelectedIds(new Set(patientAreas.map((a: PatientArea) => a.areaId)));
    const notes: Record<number, string> = {};
    patientAreas.forEach((a: PatientArea) => { if (a.notes) notes[a.areaId] = a.notes; });
    setLocalNotes(notes);
    setInitialized(true);
  }

  const { data: bodyAreas = [], isLoading: bodyLoading } = useBodyAreas(zone);
  const qc = useQueryClient();

  const savedIds = new Set(patientAreas.map((a: PatientArea) => a.areaId));

  const updateAreasMutation = useMutation({
    mutationFn: (areas: { areaId: number; notes?: string }[]) =>
      patientsApi.updateAreas(patientId, areas),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PATIENTS_KEY, patientId, 'areas'] });
      setDirty(false);
    },
  });

  const toggleArea = useCallback((areaId: number) => {
    if (!canEdit) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(areaId)) {
        next.delete(areaId);
        if (activeAreaId === areaId) { setActiveAreaId(null); setAreaNote(''); }
      } else {
        next.add(areaId);
        setActiveAreaId(areaId);
        // Use localNotes first, fall back to saved data
        const savedNote = localNotes[areaId]
          ?? patientAreas.find((a: PatientArea) => a.areaId === areaId)?.notes
          ?? '';
        setAreaNote(savedNote);
      }
      setDirty(true);
      return next;
    });
  }, [canEdit, activeAreaId, patientAreas, localNotes]);

  const handleAreaClick = (areaId: number) => {
    // Save current note to localNotes before switching
    if (activeAreaId !== null) {
      setLocalNotes((prev) => ({ ...prev, [activeAreaId]: areaNote }));
    }
    setActiveAreaId(areaId);
    // Use the latest local note, fall back to saved DB value
    const note = localNotes[areaId]
      ?? patientAreas.find((a: PatientArea) => a.areaId === areaId)?.notes
      ?? '';
    setAreaNote(note);
  };

  const handleNoteChange = (value: string) => {
    setAreaNote(value);
    if (activeAreaId !== null) {
      setLocalNotes((prev) => ({ ...prev, [activeAreaId]: value }));
    }
    setDirty(true);
  };

  const handleSave = () => {
    // Flush current areaNote into localNotes before saving
    const mergedNotes = activeAreaId !== null
      ? { ...localNotes, [activeAreaId]: areaNote }
      : { ...localNotes };

    const areas = Array.from(allSelected).map((areaId) => ({
      areaId,
      notes: mergedNotes[areaId] || undefined,
    }));
    updateAreasMutation.mutate(areas);
  };

  const allSelected = new Set([...savedIds, ...selectedIds]);

  if (areasLoading || bodyLoading) return <div className="p-5"><PageLoader /></div>;

  // Compute effective note for a given areaId (local override > saved DB)
  const getNote = (areaId: number): string =>
    localNotes[areaId] ?? patientAreas.find((a: PatientArea) => a.areaId === areaId)?.notes ?? '';

  return (
    <div className="p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Body Map</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {allSelected.size} area{allSelected.size !== 1 ? 's' : ''} selected
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Zone toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
            {(['front', 'back'] as Zone[]).map((z) => (
              <button
                key={z}
                onClick={() => setZone(z)}
                className={clsx(
                  'px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors',
                  zone === z ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                )}
              >
                {z}
              </button>
            ))}
          </div>
          {canEdit && dirty && (
            <Button
              size="sm"
              leftIcon={<Save className="w-3.5 h-3.5" />}
              loading={updateAreasMutation.isPending}
              onClick={handleSave}
            >
              Save
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-5">
        {/* SVG Body Map */}
        <div className="flex-1 flex items-center justify-center">
          <BodySvg
            zone={zone}
            bodyAreas={bodyAreas}
            selectedIds={allSelected}
            activeAreaId={activeAreaId}
            onToggle={canEdit ? toggleArea : handleAreaClick}
            canEdit={canEdit}
          />
        </div>

        {/* Area list + note panel */}
        <div className="w-60 shrink-0 space-y-3">
          {/* Selected areas list */}
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Selected Areas
            </p>
            {allSelected.size === 0 ? (
              <p className="text-xs text-gray-400 text-center py-3">
                {canEdit ? 'Click on the body to select areas' : 'No areas marked'}
              </p>
            ) : (
              <div className="space-y-1 max-h-56 overflow-y-auto">
                {bodyAreas
                  .filter((a) => allSelected.has(a.id))
                  .map((area) => {
                    const note = getNote(area.id);
                    return (
                      <div
                        key={area.id}
                        onClick={() => handleAreaClick(area.id)}
                        className={clsx(
                          'px-2 py-1.5 rounded-lg cursor-pointer text-xs transition-colors',
                          activeAreaId === area.id
                            ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-200'
                            : 'hover:bg-white text-gray-700'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
                          <span className="font-medium">{area.name}</span>
                          {note && (
                            <StickyNote className="w-3 h-3 text-amber-400 ml-auto shrink-0" />
                          )}
                        </div>
                        {/* Show note preview in the list */}
                        {note && activeAreaId !== area.id && (
                          <p className="text-[10px] text-gray-400 mt-0.5 ml-3.5 line-clamp-1">
                            {note}
                          </p>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Note panel for active area — visible in BOTH edit and view modes */}
          {activeAreaId !== null && allSelected.has(activeAreaId) && (
            <div className={clsx(
              'rounded-xl p-3 border',
              canEdit
                ? 'bg-brand-50 border-brand-100'
                : 'bg-amber-50 border-amber-100'
            )}>
              <p className={clsx(
                'text-[11px] font-semibold mb-1.5',
                canEdit ? 'text-brand-700' : 'text-amber-700'
              )}>
                {bodyAreas.find((a) => a.id === activeAreaId)?.name} — Note
              </p>
              {canEdit ? (
                <textarea
                  value={areaNote}
                  onChange={(e) => handleNoteChange(e.target.value)}
                  placeholder="Add clinical note for this area…"
                  rows={3}
                  className="w-full text-xs px-2 py-1.5 rounded-lg border border-brand-200 bg-white resize-none focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              ) : (
                /* READ-ONLY: display saved note */
                <p className="text-xs text-amber-800 leading-relaxed whitespace-pre-wrap">
                  {getNote(activeAreaId) || (
                    <span className="text-amber-400 italic">No note added for this area.</span>
                  )}
                </p>
              )}
            </div>
          )}

          {/* Hint */}
          <div className="flex items-start gap-1.5 text-[11px] text-gray-400">
            <Info className="w-3 h-3 mt-0.5 shrink-0" />
            <span>
              {canEdit
                ? 'Click a highlighted area to view or add clinical notes.'
                : 'Click a highlighted area to view its clinical notes.'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── SVG Body Diagram ──────────────────────────────────────────────────────
export function BodySvg({
  zone, 
  bodyAreas = [], 
  selectedIds = new Set(), 
  activeAreaId = null, 
  onToggle = () => {}, 
  areaProps: customAreaProps
}: {
  zone: Zone;
  bodyAreas?: { id: number; name: string; svgId: string }[];
  selectedIds?: Set<number>;
  activeAreaId?: number | null;
  onToggle?: (id: number) => void;
  canEdit?: boolean; // kept in type for backwards compat but unused internally
  areaProps?: (id: number) => React.SVGProps<SVGPathElement>;
}) {
  // Build a lookup: svgId → areaId
  const svgIdMap = Object.fromEntries(bodyAreas.map((a) => [a.svgId, a.id]));

  const getInternalAreaProps = (svgId: string): React.SVGProps<SVGPathElement> => {
    const areaId = svgIdMap[svgId];
    if (!areaId) return { fill: '#e5e7eb', stroke: '#d1d5db' };
    
    if (customAreaProps) return customAreaProps(areaId);
    
    return {
      fill: activeAreaId === areaId ? '#2563eb' : (selectedIds.has(areaId) ? '#93c5fd' : '#e5e7eb'),
      stroke: activeAreaId === areaId ? '#1d4ed8' : (selectedIds.has(areaId) ? '#3b82f6' : '#d1d5db'),
      strokeWidth: 1.5,
      // Always allow clicking to view notes, but only show pointer cursor in edit mode for toggling
      className: `transition-colors duration-200 cursor-pointer hover:opacity-80`,
      onClick: () => onToggle(areaId),
      style: { transition: 'fill 0.15s, stroke 0.15s' }
    };
  };

  return (
    <svg
      viewBox="0 0 200 480"
      className="w-full max-w-[180px] select-none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {zone === 'front' ? (
        <FrontBody areaProps={getInternalAreaProps} />
      ) : (
        <BackBody areaProps={getInternalAreaProps} />
      )}
    </svg>
  );
}

/* ── Front body schematic ── */
function FrontBody({ areaProps }: { areaProps: (id: string) => any }) {
  return (
    <g>
      {/* Head */}
      <ellipse cx="100" cy="30" rx="22" ry="26" {...areaProps('area-forehead')} />
      {/* Neck */}
      <rect x="88" y="54" width="24" height="16" rx="4" {...areaProps('area-neck-front')} />
      {/* Chest */}
      <rect x="66" y="70" width="68" height="56" rx="6" {...areaProps('area-chest')} />
      {/* Left Arm */}
      <rect x="32" y="72" width="28" height="90" rx="10" {...areaProps('area-arms-front')} />
      {/* Right Arm */}
      <rect x="140" y="72" width="28" height="90" rx="10" {...areaProps('area-arms-front')} />
      {/* Abdomen */}
      <rect x="66" y="130" width="68" height="60" rx="6" {...areaProps('area-abdomen')} />
      {/* Left Thigh */}
      <rect x="66" y="196" width="30" height="80" rx="10" {...areaProps('area-thighs-front')} />
      {/* Right Thigh */}
      <rect x="104" y="196" width="30" height="80" rx="10" {...areaProps('area-thighs-front')} />
      {/* Left Leg */}
      <rect x="68" y="282" width="26" height="90" rx="8" {...areaProps('area-legs-front')} />
      {/* Right Leg */}
      <rect x="106" y="282" width="26" height="90" rx="8" {...areaProps('area-legs-front')} />
      {/* Eye area */}
      <ellipse cx="89" cy="22" rx="8" ry="5" {...areaProps('area-eyes')} />
      <ellipse cx="111" cy="22" rx="8" ry="5" {...areaProps('area-eyes')} />
      {/* Lips */}
      <ellipse cx="100" cy="42" rx="9" ry="5" {...areaProps('area-lips')} />
      {/* Nose */}
      <ellipse cx="100" cy="32" rx="4" ry="5" {...areaProps('area-nose')} />
      {/* Cheeks */}
      <ellipse cx="82" cy="32" rx="7" ry="6" {...areaProps('area-cheeks')} />
      <ellipse cx="118" cy="32" rx="7" ry="6" {...areaProps('area-cheeks')} />
      {/* Chin */}
      <ellipse cx="100" cy="50" rx="10" ry="5" {...areaProps('area-chin')} />
    </g>
  );
}

/* ── Back body schematic ── */
function BackBody({ areaProps }: { areaProps: (id: string) => any }) {
  return (
    <g>
      {/* Scalp / Head back */}
      <ellipse cx="100" cy="30" rx="22" ry="26" {...areaProps('area-scalp')} />
      {/* Neck back */}
      <rect x="88" y="54" width="24" height="16" rx="4" {...areaProps('area-neck-back')} />
      {/* Upper back */}
      <rect x="66" y="70" width="68" height="50" rx="6" {...areaProps('area-upper-back')} />
      {/* Left Arm back */}
      <rect x="32" y="72" width="28" height="90" rx="10" {...areaProps('area-arms-back')} />
      {/* Right Arm back */}
      <rect x="140" y="72" width="28" height="90" rx="10" {...areaProps('area-arms-back')} />
      {/* Lower back */}
      <rect x="66" y="124" width="68" height="50" rx="6" {...areaProps('area-lower-back')} />
      {/* Buttocks */}
      <rect x="66" y="178" width="68" height="44" rx="10" {...areaProps('area-buttocks')} />
      {/* Left Thigh back */}
      <rect x="66" y="226" width="30" height="76" rx="10" {...areaProps('area-thighs-back')} />
      {/* Right Thigh back */}
      <rect x="104" y="226" width="30" height="76" rx="10" {...areaProps('area-thighs-back')} />
      {/* Left Leg back */}
      <rect x="68" y="308" width="26" height="88" rx="8" {...areaProps('area-legs-back')} />
      {/* Right Leg back */}
      <rect x="106" y="308" width="26" height="88" rx="8" {...areaProps('area-legs-back')} />
    </g>
  );
}
