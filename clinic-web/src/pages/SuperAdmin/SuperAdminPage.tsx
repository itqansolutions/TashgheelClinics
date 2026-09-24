import { useEffect, useState, useMemo } from 'react';
import {
  Building2,
  ShieldCheck,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { superadminApi } from '@/api/superadmin';
import { TenantListItem, SystemAdminAuditLogItem, TenantStatus } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useAuthStore } from '@/store/authStore';

export function SuperAdminPage() {
  const [activeTab, setActiveTab] = useState<'tenants' | 'audit'>('tenants');
  const [tenants, setTenants] = useState<TenantListItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<SystemAdminAuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Search & filter for tenants
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TenantStatus>('ALL');

  // Selected tenant for detail modal
  const [selectedTenant, setSelectedTenant] = useState<TenantListItem | null>(null);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const currentUser = useAuthStore((s) => s.user);

  const fetchData = async () => {
    setError('');
    try {
      const [tenantsRes, auditRes] = await Promise.all([
        superadminApi.getTenants(),
        superadminApi.getAuditLogs(100, 0),
      ]);
      setTenants(tenantsRes.data.data || []);
      setAuditLogs(auditRes.data.data || []);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to load Super Admin data. Make sure you have SYSTEM_ADMIN permissions.';
      setError(msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  // Filtered tenants
  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      const matchesSearch =
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.contactEmail && t.contactEmail.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tenants, searchQuery, statusFilter]);

  // Platform metrics
  const stats = useMemo(() => {
    const totalTenants = tenants.length;
    const activeTenants = tenants.filter((t) => t.status === 'ACTIVE').length;
    const suspendedTenants = tenants.filter((t) => t.status === 'SUSPENDED').length;
    const totalUsers = tenants.reduce((acc, t) => acc + (t._count?.users || 0), 0);
    const totalPatients = tenants.reduce((acc, t) => acc + (t._count?.patients || 0), 0);
    const totalAppointments = tenants.reduce((acc, t) => acc + (t._count?.appointments || 0), 0);

    return {
      totalTenants,
      activeTenants,
      suspendedTenants,
      totalUsers,
      totalPatients,
      totalAppointments,
    };
  }, [tenants]);

  const handleStatusChange = async (tenantId: number, newStatus: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED') => {
    setStatusUpdateLoading(true);
    setStatusFeedback(null);
    try {
      const res = await superadminApi.updateTenantStatus(tenantId, newStatus);
      const updated = res.data.data;
      setTenants((prev) => prev.map((t) => (t.id === tenantId ? { ...t, status: updated.status } : t)));
      if (selectedTenant && selectedTenant.id === tenantId) {
        setSelectedTenant((prev) => (prev ? { ...prev, status: updated.status } : null));
      }
      setStatusFeedback({
        type: 'success',
        message: `Tenant status successfully updated to ${newStatus}`,
      });
      // Also reload audit logs to capture the business action
      const logsRes = await superadminApi.getAuditLogs(100, 0);
      setAuditLogs(logsRes.data.data || []);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to update status';
      setStatusFeedback({ type: 'error', message: msg });
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const getStatusBadge = (status: TenantStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="green" dot>ACTIVE</Badge>;
      case 'SUSPENDED':
        return <Badge variant="red" dot>SUSPENDED</Badge>;
      case 'PENDING_VERIFICATION':
        return <Badge variant="yellow" dot>PENDING</Badge>;
      case 'CANCELLED':
        return <Badge variant="gray" dot>CANCELLED</Badge>;
      default:
        return <Badge variant="gray">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 shadow-md border border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
              </div>
              <h1 className="text-xl font-bold">Platform Super Admin</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {currentUser?.systemRole || 'SYSTEM_ADMIN'}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Cross-tenant control center, operational status enforcement, and forensic audit logging.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-600 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Data</span>
            </button>
          </div>
        </div>

        {/* Global KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-slate-700/60">
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700">
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Total Clinics</p>
            <p className="text-xl font-bold text-white mt-1">{stats.totalTenants}</p>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700">
            <p className="text-[10px] font-medium text-green-400 uppercase tracking-wide">Active Clinics</p>
            <p className="text-xl font-bold text-green-400 mt-1">{stats.activeTenants}</p>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700">
            <p className="text-[10px] font-medium text-rose-400 uppercase tracking-wide">Suspended</p>
            <p className="text-xl font-bold text-rose-400 mt-1">{stats.suspendedTenants}</p>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700">
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Platform Users</p>
            <p className="text-xl font-bold text-slate-200 mt-1">{stats.totalUsers}</p>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700">
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Total Patients</p>
            <p className="text-xl font-bold text-slate-200 mt-1">{stats.totalPatients}</p>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700">
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Appointments</p>
            <p className="text-xl font-bold text-slate-200 mt-1">{stats.totalAppointments}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-700">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p className="text-xs font-medium">{error}</p>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab('tenants')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === 'tenants'
              ? 'bg-brand-50 text-brand-700 border border-brand-200'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Clinics & Subscriptions ({tenants.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === 'audit'
              ? 'bg-brand-50 text-brand-700 border border-brand-200'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Forensic Audit Logs ({auditLogs.length})</span>
        </button>
      </div>

      {/* Tab 1: Clinics Management */}
      {activeTab === 'tenants' && (
        <div className="space-y-4">
          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search clinics by name, slug or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-300 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'ALL' | TenantStatus)}
                className="h-9 px-3 rounded-lg border border-gray-300 text-xs text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
                <option value="PENDING_VERIFICATION">PENDING_VERIFICATION</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          </div>

          {/* Tenants Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Clinic / Tenant</th>
                    <th className="py-3 px-4">Slug / Domain</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Subscription</th>
                    <th className="py-3 px-4 text-center">Usage Metrics</th>
                    <th className="py-3 px-4">Registered Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-gray-400">
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-brand-600" />
                          <span>Loading platform clinics...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredTenants.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-gray-400">
                        No clinics match the search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredTenants.map((t) => {
                      const latestSub = t.subscriptions?.[0];
                      return (
                        <tr key={t.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-xs">
                                {t.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{t.name}</p>
                                <p className="text-[11px] text-gray-400">{t.contactEmail || 'No contact email'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-brand-700">
                            {t.slug}.tashgheel.com
                          </td>
                          <td className="py-3.5 px-4">{getStatusBadge(t.status)}</td>
                          <td className="py-3.5 px-4">
                            {latestSub ? (
                              <div className="space-y-0.5">
                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700">
                                  {latestSub.plan} ({latestSub.status})
                                </span>
                                {latestSub.endDate && (
                                  <p className="text-[10px] text-gray-400">
                                    Ends: {new Date(latestSub.endDate).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-[11px] text-gray-400">No active sub</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center justify-center gap-3 text-[11px] text-gray-600">
                              <span title="Users">👥 {t._count?.users || 0}</span>
                              <span title="Doctors">🩺 {t._count?.doctors || 0}</span>
                              <span title="Patients">🧑‍⚕️ {t._count?.patients || 0}</span>
                              <span title="Appointments">📅 {t._count?.appointments || 0}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-gray-500 text-[11px]">
                            {new Date(t.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedTenant(t);
                                setStatusFeedback(null);
                              }}
                              className="px-2.5 py-1 rounded-lg border border-gray-300 hover:bg-gray-100 text-[11px] font-medium text-gray-700 transition-colors"
                            >
                              Manage
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Persistent Forensic Audit Trail</h3>
              <p className="text-xs text-gray-500">
                Immutable record of all Super Admin operational actions, status mutations, and cross-tenant access.
              </p>
            </div>
            <span className="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-1 rounded">
              Showing last {auditLogs.length} events
            </span>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Operator</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Target Tenant</th>
                    <th className="py-3 px-4">Endpoint</th>
                    <th className="py-3 px-4">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-gray-400 font-sans text-xs">
                        No audit records recorded yet.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => {
                      const isBusinessAction = log.action.startsWith('BUSINESS_ACTION');
                      return (
                        <tr key={log.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-3 px-4 text-gray-500">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 font-sans">
                            <span className="font-semibold text-gray-900">
                              {log.systemAdmin?.fullName || `Admin #${log.systemAdminId}`}
                            </span>
                            <span className="block text-[10px] text-gray-400 font-mono">
                              {log.systemAdmin?.email}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                                isBusinessAction
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : 'bg-blue-50 text-blue-700'
                              }`}
                            >
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {log.targetTenantId ? (
                              <span className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded font-semibold">
                                Tenant #{log.targetTenantId}
                              </span>
                            ) : (
                              <span className="text-gray-400 font-sans italic">GLOBAL</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-gray-700">
                            <span className="font-bold text-gray-500 mr-1.5">{log.httpMethod}</span>
                            <span>{log.endpoint}</span>
                          </td>
                          <td className="py-3 px-4 text-gray-400">
                            {log.ipAddress || 'unknown'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tenant Management Modal */}
      {selectedTenant && (
        <Modal
          open={true}
          onClose={() => setSelectedTenant(null)}
          title={`Manage Clinic: ${selectedTenant.name}`}
          size="lg"
        >
          <div className="space-y-5 text-xs text-gray-700">
            {statusFeedback && (
              <div
                className={`p-3 rounded-lg border text-xs font-medium flex items-center gap-2 ${
                  statusFeedback.type === 'success'
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}
              >
                {statusFeedback.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{statusFeedback.message}</span>
              </div>
            )}

            {/* Overview Grid */}
            <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-semibold">Clinic Identifier</p>
                <p className="font-bold text-sm text-gray-900 mt-0.5">{selectedTenant.name}</p>
                <p className="text-gray-500 font-mono text-[11px]">{selectedTenant.slug}.tashgheel.com</p>
              </div>

              <div>
                <p className="text-[10px] text-gray-400 uppercase font-semibold">Current State</p>
                <div className="mt-1">{getStatusBadge(selectedTenant.status)}</div>
              </div>

              <div>
                <p className="text-[10px] text-gray-400 uppercase font-semibold">Contact Email</p>
                <p className="font-medium text-gray-800 mt-0.5">
                  {selectedTenant.contactEmail || 'Not configured'}
                </p>
              </div>

              <div>
                <p className="text-[10px] text-gray-400 uppercase font-semibold">Tenant ID</p>
                <p className="font-mono font-semibold text-gray-800 mt-0.5">#{selectedTenant.id}</p>
              </div>
            </div>

            {/* Usage Stats Breakdown */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Workspace Resources Count</h4>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-2xs">
                  <p className="text-lg font-bold text-brand-600">{selectedTenant._count?.users || 0}</p>
                  <p className="text-[10px] text-gray-400 uppercase mt-0.5">Users</p>
                </div>
                <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-2xs">
                  <p className="text-lg font-bold text-brand-600">{selectedTenant._count?.doctors || 0}</p>
                  <p className="text-[10px] text-gray-400 uppercase mt-0.5">Doctors</p>
                </div>
                <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-2xs">
                  <p className="text-lg font-bold text-brand-600">{selectedTenant._count?.patients || 0}</p>
                  <p className="text-[10px] text-gray-400 uppercase mt-0.5">Patients</p>
                </div>
                <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-2xs">
                  <p className="text-lg font-bold text-brand-600">
                    {selectedTenant._count?.appointments || 0}
                  </p>
                  <p className="text-[10px] text-gray-400 uppercase mt-0.5">Appointments</p>
                </div>
              </div>
            </div>

            {/* Operational Actions */}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-semibold text-gray-900 mb-2">Operational State Mutation</h4>
              <p className="text-[11px] text-gray-500 mb-3">
                Changing status takes effect immediately via LRU cache invalidation. All actions are
                logged in the persistent audit trail.
              </p>

              <div className="flex items-center gap-2">
                {selectedTenant.status !== 'ACTIVE' && (
                  <button
                    onClick={() => handleStatusChange(selectedTenant.id, 'ACTIVE')}
                    disabled={statusUpdateLoading}
                    className="flex-1 py-2 px-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    Activate Clinic (ACTIVE)
                  </button>
                )}

                {selectedTenant.status !== 'SUSPENDED' && (
                  <button
                    onClick={() => handleStatusChange(selectedTenant.id, 'SUSPENDED')}
                    disabled={statusUpdateLoading}
                    className="flex-1 py-2 px-3 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-700 transition-colors disabled:opacity-50"
                  >
                    Suspend Clinic (SUSPENDED)
                  </button>
                )}

                {selectedTenant.status !== 'CANCELLED' && (
                  <button
                    onClick={() => handleStatusChange(selectedTenant.id, 'CANCELLED')}
                    disabled={statusUpdateLoading}
                    className="flex-1 py-2 px-3 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700 transition-colors disabled:opacity-50"
                  >
                    Cancel Clinic (CANCELLED)
                  </button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
