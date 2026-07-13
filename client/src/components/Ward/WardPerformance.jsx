import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  FiLoader, FiAlertCircle, FiClipboard, FiCheckCircle, FiClock, FiTrendingUp,
} from 'react-icons/fi';
import { analyticsAPI, complaintAPI } from '../../utils/api';

const statusConfig = {
  resolved: { label: 'Resolved', className: 'badge bg-green-500/20 text-green-600 dark:text-green-400' },
  in_progress: { label: 'In Progress', className: 'badge bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' },
  assigned: { label: 'Assigned', className: 'badge bg-blue-500/20 text-blue-600 dark:text-blue-400' },
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card p-3 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg text-sm">
      <p className="font-medium text-gray-900 dark:text-white mb-1">{label}</p>
      {payload.map((entry, idx) => (
        <p key={idx} className="text-gray-600 dark:text-gray-300">
          <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: entry.color }} />
          {entry.name}: <span className="font-semibold">{entry.value}</span>
        </p>
      ))}
    </div>
  );
};

export default function WardPerformance() {
  const [stats, setStats] = useState({ assigned: 0, completed: 0, in_progress: 0, resolution_rate: 0 });
  const [monthlyData, setMonthlyData] = useState([]);
  const [recentResolved, setRecentResolved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const fetchPerformanceData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, trendsRes, complaintsRes] = await Promise.all([
        analyticsAPI.wardMemberStats(),
        analyticsAPI.monthlyTrends(6),
        complaintAPI.getAll({ status: 'resolved', per_page: 10 }),
      ]);

      const s = statsRes.data;
      setStats({
        assigned: s.assigned || 0,
        completed: s.completed || 0,
        in_progress: s.in_progress || 0,
        resolution_rate: s.resolution_rate || 0,
      });

      const trends = trendsRes.data?.trends || [];
      if (Array.isArray(trends)) {
        setMonthlyData(
          trends.map((t) => ({
            month: t._id ? `${t._id.year}-${String(t._id.month).padStart(2, '0')}` : (t.month || t.period || 'N/A'),
            resolved: t.resolved || t.count || 0,
            filed: t.filed || t.total || 0,
          }))
        );
      }

      const complaints = complaintsRes.data?.complaints || complaintsRes.data || [];
      setRecentResolved(
        complaints.slice(0, 10).map((c) => ({
          id: c.complaint_id || c.id,
          title: c.title,
          resolved_at: c.resolved_at || c.updated_at || c.created_at,
          created_at: c.created_at,
          resolution_time: c.resolved_at
            ? Math.round((new Date(c.resolved_at) - new Date(c.created_at)) / (1000 * 60 * 60 * 24))
            : null,
        }))
      );
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Assigned', value: stats.assigned, icon: FiClipboard, bgClass: 'bg-blue-100 dark:bg-blue-900/30', textClass: 'text-blue-600 dark:text-blue-400' },
    { label: 'Completed', value: stats.completed, icon: FiCheckCircle, bgClass: 'bg-green-100 dark:bg-green-900/30', textClass: 'text-green-600 dark:text-green-400' },
    { label: 'In Progress', value: stats.in_progress, icon: FiClock, bgClass: 'bg-indigo-100 dark:bg-indigo-900/30', textClass: 'text-indigo-600 dark:text-indigo-400' },
    {
      label: 'Resolution Rate',
      value: `${stats.resolution_rate}%`,
      icon: FiTrendingUp,
      bgClass: 'bg-emerald-100 dark:bg-emerald-900/30',
      textClass: 'text-emerald-600 dark:text-emerald-400',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Performance Metrics</h1>
        <p className="text-gray-500 dark:text-gray-400">Track your complaint resolution performance</p>
      </div>

      {error && (
        <div className="glass-card flex items-center gap-3 p-4 border border-red-400/30 bg-red-500/10 rounded-xl">
          <FiAlertCircle className="text-red-500 shrink-0" />
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card animate-pulse h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <div key={card.label} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
                  <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">{card.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${card.bgClass}`}>
                  <card.icon className={`w-6 h-6 ${card.textClass}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Monthly Complaints Resolved
        </h2>
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-gray-500">
            <FiLoader className="animate-spin text-xl" /> Loading chart...
          </div>
        ) : monthlyData.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <p>No trend data available</p>
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                />
                <Bar
                  dataKey="filed"
                  name="Filed"
                  fill="#6366f1"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
                <Bar
                  dataKey="resolved"
                  name="Resolved"
                  fill="#22c55e"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recently Resolved Complaints
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">{recentResolved.length} shown</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 gap-3 text-gray-500">
            <FiLoader className="animate-spin text-xl" /> Loading...
          </div>
        ) : recentResolved.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <FiCheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No resolved complaints yet</p>
          </div>
        ) : (
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-500 dark:text-gray-400">
                  <th className="p-3">ID</th>
                  <th className="p-3">Title</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Filed On</th>
                  <th className="p-3">Resolved On</th>
                  <th className="p-3 text-right">Time Taken</th>
                </tr>
              </thead>
              <tbody>
                {recentResolved.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <td className="p-3 font-mono text-xs text-gray-900 dark:text-gray-300">
                      {c.id?.slice(0, 8)}...
                    </td>
                    <td className="p-3 font-medium text-gray-900 dark:text-white max-w-[200px] truncate">
                      {c.title}
                    </td>
                    <td className="p-3">
                      <span className={statusConfig.resolved.className}>{statusConfig.resolved.label}</span>
                    </td>
                    <td className="p-3 text-gray-500 dark:text-gray-400 text-xs">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-gray-500 dark:text-gray-400 text-xs">
                      {c.resolved_at ? new Date(c.resolved_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="p-3 text-right">
                      {c.resolution_time !== null ? (
                        <span className={`font-medium ${
                          c.resolution_time <= 3
                            ? 'text-green-600 dark:text-green-400'
                            : c.resolution_time <= 7
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {c.resolution_time}d
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && recentResolved.length > 0 && (
          <div className="md:hidden space-y-3">
            {recentResolved.map((c) => (
              <div key={c.id} className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 space-y-2">
                <div className="flex items-start justify-between">
                  <h3 className="font-medium text-gray-900 dark:text-white text-sm">{c.title}</h3>
                  <span className={statusConfig.resolved.className}>{statusConfig.resolved.label}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                  {c.id?.slice(0, 12)}...
                </p>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Filed: {new Date(c.created_at).toLocaleDateString()}</span>
                  {c.resolution_time !== null && (
                    <span className={`font-medium ${
                      c.resolution_time <= 3
                        ? 'text-green-600 dark:text-green-400'
                        : c.resolution_time <= 7
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {c.resolution_time} days
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
