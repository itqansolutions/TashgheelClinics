import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Building2, Tag, Globe, Plus, Edit, Trash2, Save, Check, User, Search, Key } from 'lucide-react';
import { useClinicSettings, useUpdateClinicSettings, useLeadSourcesAdmin, useLeadSourceMutations } from '@/hooks/useSettings';
import { useCountries } from '@/hooks/useLookups';
import { useUsers, useCreateUser, useDeactivateUser } from '@/hooks/useUsers';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Loader';
import { Modal } from '@/components/ui/Modal';
import { clsx } from 'clsx';
import { Badge } from '@/components/ui/Badge';

type Tab = 'clinic' | 'lead-sources' | 'countries' | 'users';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'clinic',        label: 'Clinic Info',    icon: Building2 },
  { id: 'users',         label: 'System Users',   icon: User      },
  { id: 'lead-sources',  label: 'Lead Sources',   icon: Tag       },
  { id: 'countries',     label: 'Countries',      icon: Globe     },
];

export function SettingsPage() {
  const [tab, setTab] = useState<Tab>('clinic');

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
        <p className="text-xs text-gray-500 mt-0.5">Manage clinic configuration and lookup data</p>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-200 p-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors',
              tab === t.id ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
            )}
          >
            <t.icon className="w-3.5 h-3.5 shrink-0" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'clinic'       && <ClinicInfoPanel />}
      {tab === 'users'        && <UsersPanel />}
      {tab === 'lead-sources' && <LeadSourcesPanel />}
      {tab === 'countries'    && <CountriesPanel />}
    </div>
  );
}

// ── System Users ───────────────────────────────────────────────────────────
function UsersPanel() {
  const { data: usersData, isLoading } = useUsers();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const createUser = useCreateUser();
  const deactivateUser = useDeactivateUser();

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { fullName: '', email: '', password: '', role: 'Doctor' }
  });

  const onAddUser = async (data: any) => {
    try {
      await createUser.mutateAsync(data);
      reset();
      setIsAddOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create user');
    }
  };

  return (
    <>
      <Card padding="none">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">System Users</h3>
            <p className="text-xs text-gray-500 mt-0.5">Manage staff access and roles</p>
          </div>
          <Button size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setIsAddOpen(true)}>
            Add User
          </Button>
        </div>

        <div className="divide-y divide-gray-50">
          {isLoading ? (
             <div className="p-4 space-y-3">
               <Skeleton className="h-8 w-full" />
               <Skeleton className="h-8 w-full" />
             </div>
          ) : (
            usersData?.data.data.map((user: any) => (
              <div key={user.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 font-bold text-xs">
                    {user.fullName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{user.fullName}</p>
                    <p className="text-[11px] text-gray-500">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={user.role === 'Admin' ? 'purple' : user.role === 'Doctor' ? 'blue' : 'gray'}>
                    {user.role}
                  </Badge>
                  <Button variant="ghost" size="xs" className="text-red-400 hover:text-red-600" 
                    onClick={() => { if(confirm('Deactivate user?')) deactivateUser.mutate(user.id); }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Modal open={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create New User" size="sm">
        <form onSubmit={handleSubmit(onAddUser)} className="space-y-4">
          <Input 
            label="Full Name" 
            required 
            error={errors.fullName?.message as string}
            {...register('fullName', { required: 'Name is required' })} 
          />
          <Input 
            label="Email Address" 
            type="email" 
            required 
            error={errors.email?.message as string}
            {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' } })} 
          />
          <Input 
            label="Password" 
            type="password" 
            required 
            hint="Min. 8 characters"
            error={errors.password?.message as string}
            {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Min 8 characters' } })} 
          />
          <Select 
            label="Role" 
            options={[
              { value: 'Admin', label: 'Admin' },
              { value: 'Doctor', label: 'Doctor' },
              { value: 'Receptionist', label: 'Receptionist' },
            ]} 
            {...register('role')} 
          />
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" loading={createUser.isPending}>Create Account</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

// ── Clinic Info ───────────────────────────────────────────────────────────
function ClinicInfoPanel() {
  const { data: settings, isLoading } = useClinicSettings();
  const updateSettings = useUpdateClinicSettings();
  const [saved, setSaved] = useState(false);

  const { register, handleSubmit, formState: { isDirty, isSubmitting } } = useForm<Record<string, string>>({
    values: settings ?? {},
  });

  const onSubmit = async (data: Record<string, string>) => {
    await updateSettings.mutateAsync(data);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (isLoading) return (
    <Card>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="mb-4"><Skeleton className="h-3 w-24 mb-1.5" /><Skeleton className="h-9 w-full" /></div>
      ))}
    </Card>
  );

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div className="sm:col-span-2">
            <Input label="Clinic Name" {...register('clinic_name')} />
          </div>
          <Input label="Phone"   type="tel"   {...register('clinic_phone')} />
          <Input label="Email"   type="email" {...register('clinic_email')} />
          <div className="sm:col-span-2">
            <Input label="Address" {...register('clinic_address')} />
          </div>
          <Input label="Currency Symbol" {...register('currency_symbol')}
            hint="Shown next to prices (e.g. ج.م)" />
          <Input label="Default Appointment Duration (min)" type="number"
            {...register('appointment_slot_minutes')} />
          <Input label="Working Hours Start" type="time" {...register('working_hours_start')} />
          <Input label="Working Hours End"   type="time" {...register('working_hours_end')} />
          <Input label="Advance Booking Days" type="number"
            hint="How many days ahead patients can book"
            {...register('booking_advance_days')} />
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          {saved && (
            <span className="flex items-center gap-1.5 text-xs text-green-600">
              <Check className="w-3.5 h-3.5" /> Settings saved
            </span>
          )}
          <div className="ml-auto">
            <Button type="submit" loading={isSubmitting} disabled={!isDirty}
              leftIcon={<Save className="w-3.5 h-3.5" />}
            >
              Save Settings
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}

// ── Lead Sources ──────────────────────────────────────────────────────────
function LeadSourcesPanel() {
  const { data: sources = [], isLoading } = useLeadSourcesAdmin();
  const { create, update, remove }        = useLeadSourceMutations();

  const [newName, setNewName]       = useState('');
  const [editId, setEditId]         = useState<number | null>(null);
  const [editName, setEditName]     = useState('');

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await create.mutateAsync(newName.trim());
    setNewName('');
  };

  const handleUpdate = async (id: number) => {
    if (!editName.trim()) return;
    await update.mutateAsync({ id, name: editName.trim() });
    setEditId(null);
  };

  return (
    <Card padding="none">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Lead Sources</h3>
          <p className="text-xs text-gray-500 mt-0.5">How patients find the clinic</p>
        </div>
        <span className="text-xs text-gray-400">{sources.length} sources</span>
      </div>

      <div className="divide-y divide-gray-50">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="px-4 py-3 flex items-center gap-3">
                <Skeleton className="h-4 w-48" />
              </div>
            ))
          : sources.map((src) => (
              <div key={src.id} className="px-4 py-3 flex items-center gap-3 group">
                {editId === src.id ? (
                  <>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleUpdate(src.id); if (e.key === 'Escape') setEditId(null); }}
                      autoFocus
                      className="flex-1 h-8 px-3 text-sm rounded-lg border border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <Button size="xs" onClick={() => handleUpdate(src.id)} loading={update.isPending}>Save</Button>
                    <Button size="xs" variant="ghost" onClick={() => setEditId(null)}>Cancel</Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-gray-700">{src.name}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="xs" onClick={() => { setEditId(src.id); setEditName(src.name); }}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="xs"
                        className="text-red-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => { if (confirm(`Delete "${src.name}"?`)) remove.mutate(src.id); }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
      </div>

      {/* Add row */}
      <div className="p-4 border-t border-gray-100 flex items-center gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
          placeholder="New lead source name…"
          className="flex-1 h-9 px-3 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <Button size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}
          onClick={handleAdd} loading={create.isPending} disabled={!newName.trim()}
        >
          Add
        </Button>
      </div>
    </Card>
  );
}

// ── Countries (read-only list) ────────────────────────────────────────────
function CountriesPanel() {
  const { data: countries = [], isLoading } = useCountries();

  return (
    <Card padding="none">
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">Countries</h3>
        <p className="text-xs text-gray-500 mt-0.5">{countries.length} countries seeded from database</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-0 divide-y divide-gray-50">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="px-4 py-3"><Skeleton className="h-4 w-24" /></div>
            ))
          : countries.map((c) => (
              <div key={c.id} className="px-4 py-3 flex items-center gap-2">
                <span className="text-[11px] font-mono text-gray-400 w-8 shrink-0">{c.code}</span>
                <span className="text-sm text-gray-700">{c.name}</span>
              </div>
            ))}
      </div>
    </Card>
  );
}
