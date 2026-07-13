import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch, FiFilter, FiExternalLink, FiLoader, FiAlertCircle, FiInbox } from 'react-icons/fi';
import { complaintAPI } from '../../utils/api';

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

const ITEMS_PER_PAGE = 10;

export default function MyComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await complaintAPI.getAll({});
      const data = res.data;
      setComplaints(data?.complaints || (Array.isArray(data) ? data : []));
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const filtered = complaints.filter((c) => {
    const matchSearch = !search || c.title?.toLowerCase().includes(search.toLowerCase()) || c.complaint_id?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || c.status === statusFilter;
    const matchCategory = !categoryFilter || c.category === categoryFilter;
    return matchSearch && matchStatus && matchCategory;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  useEffect(() => { setPage(1); }, [search, statusFilter, categoryFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Complaints</h1>
        <span className="text-sm text-gray-500 dark:text-gray-400">{filtered.length} total</span>
      </div>

      {error && (
        <div className="glass-card flex items-center gap-3 p-4 border border-red-400/30 bg-red-500/10 rounded-xl">
          <FiAlertCircle className="text-red-500 shrink-0" />
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="glass-card p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field w-full pl-10"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field">
            <option value="">All Status</option>
            {Object.entries(statusConfig).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="input-field">
            <option value="">All Categories</option>
            {Object.entries(categoryLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3 text-gray-500">
          <FiLoader className="animate-spin text-xl" /> Loading complaints...
        </div>
      ) : paginated.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
          <FiInbox size={48} />
          <p className="text-lg font-medium">No complaints found</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-500 dark:text-gray-400">
                  <th className="p-3">ID</th>
                  <th className="p-3">Title</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Ward</th>
                  <th className="p-3">Date</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((c) => {
                  const st = statusConfig[c.status] || statusConfig.filed;
                  return (
                    <tr key={c.complaint_id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                      <td className="p-3 font-mono text-xs">{c.complaint_id?.slice(0, 8)}...</td>
                      <td className="p-3 font-medium text-gray-900 dark:text-white max-w-[200px] truncate">{c.title}</td>
                      <td className="p-3 text-gray-600 dark:text-gray-300">{categoryLabels[c.category] || c.category}</td>
                      <td className="p-3"><span className={st.className}>{st.label}</span></td>
                      <td className="p-3 text-gray-600 dark:text-gray-300 capitalize">{c.priority || '-'}</td>
                      <td className="p-3 text-gray-600 dark:text-gray-300">{c.ward}</td>
                      <td className="p-3 text-gray-500 dark:text-gray-400 text-xs">{new Date(c.created_at).toLocaleDateString()}</td>
                      <td className="p-3">
                        <Link to={`/dashboard/track/${c.complaint_id}`} className="text-primary-600 hover:text-primary-500">
                          <FiExternalLink />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {paginated.map((c) => {
              const st = statusConfig[c.status] || statusConfig.filed;
              return (
                <Link key={c.complaint_id} to={`/dashboard/track/${c.complaint_id}`} className="card block p-4 space-y-2 hover:ring-2 hover:ring-primary-500/50 transition-all">
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium text-gray-900 dark:text-white">{c.title}</h3>
                    <span className={st.className}>{st.label}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{c.complaint_id?.slice(0, 12)}...</p>
                  <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span>{categoryLabels[c.category] || c.category}</span>
                    <span>Ward {c.ward}</span>
                    <span>{new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                </Link>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="btn-secondary px-3 py-1 text-sm disabled:opacity-40">Prev</button>
              <span className="text-sm text-gray-500 dark:text-gray-400">Page {page} of {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="btn-secondary px-3 py-1 text-sm disabled:opacity-40">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
