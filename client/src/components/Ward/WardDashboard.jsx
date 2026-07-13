import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiClipboard, FiCheckCircle, FiClock, FiAlertCircle, FiLoader, FiTrendingUp, FiFileText } from 'react-icons/fi';
import { analyticsAPI, complaintAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const statusConfig = {
  filed: { label: 'Filed', className: 'badge bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' },
  assigned: { label: 'Assigned', className: 'badge bg-blue-500/20 text-blue-600 dark:text-blue-400' },
  in_progress: { label: 'In Progress', className: 'badge bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' },
  resolved: { label: 'Resolved', className: 'badge bg-green-500/20 text-green-600 dark:text-green-400' },
  rejected: { label: 'Rejected', className: 'badge bg-red-500/20 text-red-600 dark:text-red-400' },
};

const categoryLabels = {
  road_damage: 'Road Damage',
  garbage_accumulation: 'Garbage Accumulation',
  water_leakage: 'Water Leakage',
  drainage_problem: 'Drainage Problem',
  streetlight_failure: 'Streetlight Failure',
  illegal_dumping: 'Illegal Dumping',
  infrastructure_damage: 'Infrastructure Damage',
  other: 'Other',
};

export default function WardDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ assigned: 0, in_progress: 0, completed: 0 });
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, complaintsRes] = await Promise.all([
        analyticsAPI.wardMemberStats(),
        complaintAPI.getAll({ status: 'assigned', per_page: 5 }),
      ]);
      setStats(statsRes.data);
      setRecentComplaints(complaintsRes.data?.complaints || complaintsRes.data || []);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Assigned', value: stats.assigned, icon: FiClipboard, color: 'blue', bgClass: 'bg-blue-100 dark:bg-blue-900/30', textClass: 'text-blue-600 dark:text-blue-400' },
    { label: 'In Progress', value: stats.in_progress, icon: FiClock, color: 'indigo', bgClass: 'bg-indigo-100 dark:bg-indigo-900/30', textClass: 'text-indigo-600 dark:text-indigo-400' },
    { label: 'Completed', value: stats.completed, icon: FiCheckCircle, color: 'green', bgClass: 'bg-green-100 dark:bg-green-900/30', textClass: 'text-green-600 dark:text-green-400' },
  ];

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Ward Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {user?.ward ? `Ward ${user.ward} - ` : ''}Civic issue management overview
          </p>
        </div>
      </div>

      {error && (
        <div className="glass-card flex items-center gap-3 p-4 border border-red-400/30 bg-red-500/10 rounded-xl">
          <FiAlertCircle className="text-red-500 shrink-0" />
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {statCards.map((card) => (
            <div key={card.label} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
                  <p className="text-3xl font-bold mt-1 text-gray-900 dark:text-white">{card.value}</p>
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Assigned Complaints</h2>
          <Link
            to="/dashboard/assigned"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            View All
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 gap-3 text-gray-500">
            <FiLoader className="animate-spin text-xl" /> Loading complaints...
          </div>
        ) : recentComplaints.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <FiClipboard className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No assigned complaints</p>
          </div>
        ) : (
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-500 dark:text-gray-400">
                  <th className="p-3">ID</th>
                  <th className="p-3">Title</th>
                  <th className="p-3">Citizen</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentComplaints.map((c) => {
                  const st = statusConfig[c.status] || statusConfig.filed;
                  return (
                    <tr
                      key={c.complaint_id || c.id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                    >
                      <td className="p-3 font-mono text-xs text-gray-900 dark:text-gray-300">
                        {c.complaint_id?.slice(0, 8)}...
                      </td>
                      <td className="p-3 font-medium text-gray-900 dark:text-white max-w-[200px] truncate">
                        {c.title}
                      </td>
                      <td className="p-3 text-gray-600 dark:text-gray-300">{c.citizen_name || '-'}</td>
                      <td className="p-3 text-gray-600 dark:text-gray-300">
                        {categoryLabels[c.category] || c.category}
                      </td>
                      <td className="p-3"><span className={st.className}>{st.label}</span></td>
                      <td className="p-3 text-gray-600 dark:text-gray-300 capitalize">{c.priority || '-'}</td>
                      <td className="p-3 text-gray-500 dark:text-gray-400 text-xs">
                        {new Date(c.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && recentComplaints.length > 0 && (
          <div className="md:hidden space-y-3">
            {recentComplaints.map((c) => {
              const st = statusConfig[c.status] || statusConfig.filed;
              return (
                <div
                  key={c.complaint_id || c.id}
                  className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium text-gray-900 dark:text-white">{c.title}</h3>
                    <span className={st.className}>{st.label}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                    {c.complaint_id?.slice(0, 12)}...
                  </p>
                  <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span>{categoryLabels[c.category] || c.category}</span>
                    <span>{c.citizen_name || 'N/A'}</span>
                    <span>{new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/dashboard/assigned" className="card hover:shadow-xl transition-shadow group">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary-100 dark:bg-primary-900/30 group-hover:bg-primary-200 dark:group-hover:bg-primary-900/50 transition-colors">
              <FiTrendingUp className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">View Assigned</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Manage your assigned complaints</p>
            </div>
          </div>
        </Link>

        <Link to="/dashboard/performance" className="card hover:shadow-xl transition-shadow group">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-secondary-100 dark:bg-secondary-900/30 group-hover:bg-secondary-200 dark:group-hover:bg-secondary-900/50 transition-colors">
              <FiFileText className="w-6 h-6 text-secondary-600 dark:text-secondary-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Generate Report</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">View performance metrics & analytics</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
