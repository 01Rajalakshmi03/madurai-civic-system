import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiUsers, FiClipboard, FiGrid, FiDatabase, FiActivity,
  FiTrendingUp, FiSettings, FiAlertTriangle, FiShield, FiBarChart2,
  FiClock, FiCheckCircle
} from 'react-icons/fi';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { adminAPI, analyticsAPI } from '../../utils/api';

const StatCard = ({ icon: Icon, label, value, color, loading }) => (
  <div className="glass-card p-6 rounded-2xl">
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="text-xl text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        {loading ? (
          <div className="h-7 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1" />
        ) : (
          <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
        )}
      </div>
    </div>
  </div>
);

const QuickLink = ({ icon: Icon, label, to, onClick }) => (
  <button
    onClick={() => onClick(to)}
    className="glass-card p-4 rounded-xl flex flex-col items-center gap-2 hover:scale-105 transition-transform cursor-pointer"
  >
    <Icon className="text-2xl text-blue-500" />
    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
  </button>
);

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [trend, setTrend] = useState([]);
  const [roleDistribution, setRoleDistribution] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, trendRes, rolesRes, activityRes] = await Promise.allSettled([
        adminAPI.getStats(),
        analyticsAPI.complaintsTrend ? analyticsAPI.complaintsTrend() : Promise.resolve({ data: [] }),
        analyticsAPI.usersByRole ? analyticsAPI.usersByRole() : Promise.resolve({ data: [] }),
        adminAPI.getActivityLog(),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (trendRes.status === 'fulfilled') {
        const trends = trendRes.value.data?.trends || [];
        setTrend(trends.map(t => ({
          date: `${t._id?.year}-${String(t._id?.month).padStart(2, '0')}`,
          count: t.count || 0
        })));
      }
      if (rolesRes.status === 'fulfilled') {
        const d = rolesRes.value.data;
        setRoleDistribution([
          { role: 'citizens', count: d?.citizens || 0 },
          { role: 'ward_members', count: d?.ward_members || 0 },
          { role: 'corporation_officials', count: d?.corporation_officials || 0 },
        ]);
      }
      if (activityRes.status === 'fulfilled') setActivityLog(activityRes.value.data?.logs || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const quickLinks = [
    { icon: FiUsers, label: 'Users', to: '/dashboard/users' },
    { icon: FiClipboard, label: 'Complaints', to: '/dashboard/complaints' },
    { icon: FiGrid, label: 'Wards', to: '/dashboard/wards' },
    { icon: FiShield, label: 'Officials', to: '/dashboard/officials' },
    { icon: FiDatabase, label: 'Blockchain', to: '/dashboard/blockchain' },
    { icon: FiBarChart2, label: 'AI Analytics', to: '/dashboard/analytics' },
    { icon: FiSettings, label: 'Settings', to: '/dashboard/settings' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Admin Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">Super admin overview</p>
        </div>
        <button onClick={fetchData} className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors text-sm">
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 flex items-center gap-2">
          <FiAlertTriangle /> {error}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FiUsers} label="Total Users" value={stats?.total_users ?? 0} color="bg-blue-500" loading={loading} />
        <StatCard icon={FiClipboard} label="Total Complaints" value={stats?.total_complaints ?? 0} color="bg-amber-500" loading={loading} />
        <StatCard icon={FiGrid} label="Total Wards" value={stats?.total_wards ?? 0} color="bg-green-500" loading={loading} />
        <StatCard icon={FiDatabase} label="Blockchain Records" value={stats?.blockchain_records ?? 0} color="bg-purple-500" loading={loading} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Complaints Trend */}
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <FiTrendingUp className="text-blue-500" /> Complaints Trend
          </h3>
          {loading ? (
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#F3F4F6' }} />
                <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Users by Role */}
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <FiUsers className="text-green-500" /> Users by Role
          </h3>
          {loading ? (
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          ) : roleDistribution.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-400">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={roleDistribution} dataKey="count" nameKey="role" cx="50%" cy="50%" outerRadius={90} label={({ role, percent }) => `${role} (${(percent * 100).toFixed(0)}%)`}>
                  {roleDistribution.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#F3F4F6' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Quick Links</h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {quickLinks.map((link) => (
            <QuickLink key={link.to} icon={link.icon} label={link.label} to={link.to} onClick={navigate} />
          ))}
        </div>
      </div>

      {/* Activity Log */}
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <FiActivity className="text-purple-500" /> Recent Activity
        </h3>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : activityLog.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No recent activity</p>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {activityLog.map((item, idx) => (
              <div key={item.id || idx} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div className={`p-2 rounded-full ${item.type === 'create' ? 'bg-green-100 dark:bg-green-900/30' : item.type === 'update' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                  {item.type === 'create' ? <FiCheckCircle className="text-green-500" /> : item.type === 'update' ? <FiActivity className="text-blue-500" /> : <FiAlertTriangle className="text-red-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{item.description || item.action}</p>
                  <p className="text-xs text-gray-400">{item.user || item.admin_name} &middot; {item.timestamp || item.created_at}</p>
                </div>
                <FiClock className="text-gray-400 text-sm flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
