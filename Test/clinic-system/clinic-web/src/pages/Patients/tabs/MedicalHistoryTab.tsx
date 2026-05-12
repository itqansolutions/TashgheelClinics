import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Edit, Save, X, CheckCircle, ShieldAlert, StickyNote } from 'lucide-react';
import { useUpdatePatient } from '@/hooks/usePatients';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { formatDateTime } from '@/utils/format';
import type { Patient } from '@/types';

interface FormData {
  medicalHistory: string;
  notes: string;
}

export function MedicalHistoryTab({ patient, canEdit }: { patient: Patient; canEdit: boolean }) {
  const [editing, setEditing] = useState(false);
  const [saved, setSaved]     = useState(false);
  const update = useUpdatePatient(patient.id);

  const { register, handleSubmit, reset, watch, formState: { isSubmitting, isDirty } } =
    useForm<FormData>({
      defaultValues: {
        medicalHistory: patient.medicalHistory ?? '',
        notes:          patient.notes ?? '',
      },
    });

  const medicalValue = watch('medicalHistory');
  const notesValue   = watch('notes');

  const handleCancel = () => { reset(); setEditing(false); };

  const onSubmit = async (data: FormData) => {
    await update.mutateAsync({
      medicalHistory: data.medicalHistory || undefined,
      notes:          data.notes || undefined,
    });
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Medical History</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Last updated {formatDateTime(patient.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="flex items-center gap-1 text-xs text-green-600">
              <CheckCircle className="w-3.5 h-3.5" />
              Saved
            </span>
          )}
          {canEdit && !editing && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Edit className="w-3.5 h-3.5" />}
              onClick={() => setEditing(true)}
            >
              Edit
            </Button>
          )}
        </div>
      </div>

      {!editing ? (
        <div className="space-y-5">
          {/* Medical history block */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Medical History & Allergies
              </p>
            </div>
            {patient.medicalHistory ? (
              <div className="bg-red-50/50 border border-red-100 rounded-xl p-4">
                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {patient.medicalHistory}
                </p>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-4 border border-dashed border-gray-200">
                <p className="text-sm text-gray-400 text-center">No medical history recorded</p>
              </div>
            )}
          </div>

          {/* Internal notes block */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <StickyNote className="w-3.5 h-3.5 text-amber-400" />
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Internal Notes
              </p>
            </div>
            {patient.notes ? (
              <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4">
                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {patient.notes}
                </p>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-4 border border-dashed border-gray-200">
                <p className="text-sm text-gray-400 text-center">No internal notes</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div>
            <Textarea
              label="Medical History & Allergies"
              hint="Include allergies, chronic conditions, previous surgeries, current medications."
              rows={6}
              {...register('medicalHistory')}
            />
            <p className="text-[11px] text-gray-400 mt-1 text-right">
              {medicalValue.length} characters
            </p>
          </div>

          <div>
            <Textarea
              label="Internal Notes"
              hint="Reception notes, preferences, follow-up reminders. Not visible to patients."
              rows={4}
              {...register('notes')}
            />
            <p className="text-[11px] text-gray-400 mt-1 text-right">
              {notesValue.length} characters
            </p>
          </div>

          {update.error && (
            <p className="text-xs text-red-600">
              {(update.error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Save failed.'}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
            <Button variant="ghost" size="sm" type="button" leftIcon={<X className="w-3.5 h-3.5" />} onClick={handleCancel}>
              Cancel
            </Button>
            <Button size="sm" type="submit" loading={isSubmitting} disabled={!isDirty}
              leftIcon={<Save className="w-3.5 h-3.5" />}
            >
              Save Changes
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
