import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiClipboard, FiCheckCircle, FiClock, FiXCircle, FiTrendingUp } from 'react-icons/fi';
import { complaintAPI, analyticsAPI } from '../../utils/api';

export default function CitizenDashboard() {
  const [stats, setStats] = useState({ total: 0, resolved: 0, pending: 0, rejected: 0 });
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, complaintsRes] = await Promise.all([
          analyticsAPI.citizenStats(),
          complaintAPI.getAll({ per_page: 5 }),
        ]);
        setStats(statsRes.data);
        setRecentComplaints(complaintsRes.data.complaints || []);
      } catch (err) {
        console.error('Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statCards = [
    { label: 'Total Complaints', value: stats.total, icon: FiClipboard, bgClass: 'bg-blue-100 dark:bg-blue-900/30', textClass: 'text-blue-600 dark:text-blue-400' },
    { label: 'Resolved', value: stats.resolved, icon: FiCheckCircle, bgClass: 'bg-green-100 dark:bg-green-900/30', textClass: 'text-green-600 dark:text-green-400' },
    { label: 'Pending', value: stats.pending, icon: FiClock, bgClass: 'bg-yellow-100 dark:bg-yellow-900/30', textClass: 'text-yellow-600 dark:text-yellow-400' },
    { label: 'Rejected', value: stats.rejected, icon: FiXCircle, bgClass: 'bg-red-100 dark:bg-red-900/30', textClass: 'text-red-600 dark:text-red-400' },
  ];

  const statusColors = {
    filed: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    assigned: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    in_progress: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
    resolved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">Track your civic issue complaints</p>
        </div>
        <Link to="/dashboard/new-complaint" className="btn-primary inline-flex items-center gap-2">
          <FiPlus className="w-4 h-4" />
          Report New Issue
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card animate-pulse h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <div key={card.label} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
                  <p className="text-2xl font-bold mt-1">{card.value}</p>
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
          <h2 className="text-lg font-semibold">Recent Complaints</h2>
          <Link to="/dashboard/my-complaints" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            View All
          </Link>
        </div>

        {recentComplaints.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <FiClipboard className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No complaints yet</p>
            <Link to="/dashboard/new-complaint" className="text-primary-600 text-sm hover:underline">Report your first issue</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentComplaints.map((complaint) => (
              <Link
                key={complaint.id}
                to={`/dashboard/track/${complaint.complaint_id}`}
                className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{complaint.title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    #{complaint.complaint_id} - {new Date(complaint.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`badge capitalize ${statusColors[complaint.status] || 'bg-gray-100 text-gray-800'}`}>
                  {complaint.status.replace('_', ' ')}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Link to="/dashboard/track" className="card hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary-100 dark:bg-primary-900/30">
              <FiTrendingUp className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold">Track Complaint</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Enter complaint ID to track status</p>
            </div>
          </div>
        </Link>

        <Link to="/dashboard/map" className="card hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-secondary-100 dark:bg-secondary-900/30">
              <FiCheckCircle className="w-6 h-6 text-secondary-600" />
            </div>
            <div>
              <h3 className="font-semibold">View Issue Map</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">See complaints across Madurai</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
