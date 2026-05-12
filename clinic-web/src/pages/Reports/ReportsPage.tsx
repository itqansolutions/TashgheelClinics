import { useState, useEffect } from 'react';
import { reportsApi } from '@/api/reports';
import { PageLoader } from '@/components/ui/Loader';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/format';
import { 
  BarChart3, TrendingUp, Users, Calendar, 
  DollarSign, PieChart, ArrowUpRight, ArrowDownRight 
} from 'lucide-react';
import { SimpleBarChart, SimpleDonutChart } from '@/components/ui/Charts';

export function ReportsPage() {
  const [summary, setSummary] = useState<any>(null);
  const [aptStats, setAptStats] = useState<any[]>([]);
  const [revenueDoctor, setRevenueDoctor] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      reportsApi.getSummary(),
      reportsApi.getAppointmentsStatus(),
      reportsApi.getRevenueByDoctor()
    ]).then(([sumRes, aptRes, revRes]) => {
      setSummary(sumRes.data);
      setAptStats(aptRes.data);
      setRevenueDoctor(revRes.data);
      setLoading(false);
    }).catch(err => {
      console.error('Failed to fetch reports', err);
      setLoading(false);
    });
  }, []);

  if (loading) return <PageLoader />;

  const stats = [
    { label: 'Total Revenue', value: formatCurrency(summary.totalRevenue), icon: DollarSign, color: 'bg-green-500', trend: '+12.5%', isUp: true },
    { label: 'Total Patients', value: summary.patientsCount, icon: Users, color: 'bg-blue-500', trend: '+5.2%', isUp: true },
    { label: 'Appointments', value: summary.appointmentsCount, icon: Calendar, color: 'bg-purple-500', trend: '+18.1%', isUp: true },
    { label: 'Active Doctors', value: summary.doctorsCount, icon: TrendingUp, color: 'bg-orange-500', trend: 'Stable', isUp: true },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-500 text-sm">Real-time overview of clinic performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${s.color} text-white shadow-lg`}>
                <s.icon className="w-6 h-6" />
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold ${s.isUp ? 'text-green-600' : 'text-red-600'}`}>
                {s.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {s.trend}
              </div>
            </div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">{s.label}</p>
            <h3 className="text-2xl font-black text-gray-900">{s.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm min-h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Revenue by Doctor</h3>
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-end pb-4">
            {revenueDoctor.length > 0 ? (
              <SimpleBarChart 
                data={revenueDoctor.map(d => ({ label: d.doctorName, value: d.revenue }))} 
                height={250} 
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-300 text-sm italic">No revenue data available</div>
            )}
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm min-h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
                <PieChart className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Appointment Status</h3>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            {aptStats.length > 0 ? (
              <SimpleDonutChart 
                data={aptStats.map((s, i) => ({ 
                  label: s.status, 
                  value: s._count.id, 
                  color: ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444'][i % 4] 
                }))} 
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-300 text-sm italic">No appointment data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
