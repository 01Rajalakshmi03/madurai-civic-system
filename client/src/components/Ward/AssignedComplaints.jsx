import { useState, useEffect, useRef } from 'react';
import {
  FiSearch, FiFilter, FiLoader, FiAlertCircle, FiInbox,
  FiCheck, FiPlay, FiCheckCircle, FiX, FiUpload, FiCamera,
} from 'react-icons/fi';
import { complaintAPI } from '../../utils/api';

const statusConfig = {
  filed: { label: 'Filed', className: 'badge bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' },
  assigned: { label: 'Assigned', className: 'badge bg-blue-500/20 text-blue-600 dark:text-blue-400' },
  in_progress: { label: 'In Progress', className: 'badge bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' },
  resolved: { label: 'Resolved', className: 'badge bg-green-500/20 text-green-600 dark:text-green-400' },
  rejected: { label: 'Rejected', className: 'badge bg-red-500/20 text-red-600 dark:text-red-400' },
};

const priorityConfig = {
  low: 'text-gray-500 dark:text-gray-400',
  medium: 'text-yellow-600 dark:text-yellow-400',
  high: 'text-orange-600 dark:text-orange-400',
  emergency: 'text-red-600 dark:text-red-400',
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

export default function AssignedComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [resolveModal, setResolveModal] = useState(null);
  const [resolveNotes, setResolveNotes] = useState('');
  const [resolveImages, setResolveImages] = useState([]);
  const [resolveLoading, setResolveLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await complaintAPI.getAll({});
      setComplaints(res.data?.complaints || res.data || []);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action, extra = {}) => {
    setActionLoading(id);
    try {
      await complaintAPI.update(id, { action, ...extra });
      await fetchComplaints();
    } catch (err) {
      setError(err.response?.data?.detail || `Failed to ${action} complaint`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolve = async () => {
    if (!resolveModal) return;
    setResolveLoading(true);
    try {
      await complaintAPI.update(resolveModal.complaint_id || resolveModal.id, {
        action: 'resolve',
        notes: resolveNotes,
      });

      if (resolveImages.length > 0) {
        const formData = new FormData();
        resolveImages.forEach((file) => formData.append('images', file));
        await complaintAPI.uploadImages(resolveModal.complaint_id || resolveModal.id, formData);
      }

      setResolveModal(null);
      setResolveNotes('');
      setResolveImages([]);
      await fetchComplaints();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to resolve complaint');
    } finally {
      setResolveLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    setResolveImages((prev) => [...prev, ...files].slice(0, 5));
  };

  const removeImage = (index) => {
    setResolveImages((prev) => prev.filter((_, i) => i !== index));
  };

  const filtered = complaints.filter((c) => {
    const matchSearch =
      !search ||
      c.title?.toLowerCase().includes(search.toLowerCase()) ||
      c.complaint_id?.toLowerCase().includes(search.toLowerCase()) ||
      c.citizen_name?.toLowerCase().includes(search.toLowerCase());
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Assigned Complaints</h1>
        <span className="text-sm text-gray-500 dark:text-gray-400">{filtered.length} total</span>
      </div>

      {error && (
        <div className="glass-card flex items-center gap-3 p-4 border border-red-400/30 bg-red-500/10 rounded-xl">
          <FiAlertCircle className="text-red-500 shrink-0" />
          <p className="text-red-600 dark:text-red-400 text-sm flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-600">
            <FiX className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="glass-card p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title, ID, or citizen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field w-full pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field"
          >
            <option value="">All Status</option>
            {Object.entries(statusConfig).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input-field"
          >
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
          <div className="hidden lg:block card overflow-x-auto">
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
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((c) => {
                  const st = statusConfig[c.status] || statusConfig.filed;
                  const isBusy = actionLoading === (c.complaint_id || c.id);
                  return (
                    <tr
                      key={c.complaint_id || c.id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                    >
                      <td className="p-3 font-mono text-xs text-gray-900 dark:text-gray-300">
                        {c.complaint_id?.slice(0, 8)}...
                      </td>
                      <td className="p-3 font-medium text-gray-900 dark:text-white max-w-[180px] truncate">
                        {c.title}
                      </td>
                      <td className="p-3 text-gray-600 dark:text-gray-300">{c.citizen_name || '-'}</td>
                      <td className="p-3 text-gray-600 dark:text-gray-300">
                        {categoryLabels[c.category] || c.category}
                      </td>
                      <td className="p-3"><span className={st.className}>{st.label}</span></td>
                      <td className="p-3">
                        <span className={`capitalize font-medium ${priorityConfig[c.priority] || priorityConfig.low}`}>
                          {c.priority || 'low'}
                        </span>
                      </td>
                      <td className="p-3 text-gray-500 dark:text-gray-400 text-xs">
                        {new Date(c.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-2">
                          {c.status === 'assigned' && (
                            <>
                              <button
                                onClick={() => handleAction(c.complaint_id || c.id, 'accept')}
                                disabled={isBusy}
                                className="btn-primary px-3 py-1.5 text-xs inline-flex items-center gap-1 disabled:opacity-50"
                              >
                                <FiCheck className="w-3 h-3" />
                                Accept
                              </button>
                              <button
                                onClick={() => handleAction(c.complaint_id || c.id, 'start_work')}
                                disabled={isBusy}
                                className="btn-secondary px-3 py-1.5 text-xs inline-flex items-center gap-1 disabled:opacity-50"
                              >
                                <FiPlay className="w-3 h-3" />
                                Start Work
                              </button>
                            </>
                          )}
                          {c.status === 'in_progress' && (
                            <button
                              onClick={() => {
                                setResolveModal(c);
                                setResolveNotes('');
                                setResolveImages([]);
                              }}
                              disabled={isBusy}
                              className="btn-primary px-3 py-1.5 text-xs inline-flex items-center gap-1 disabled:opacity-50 bg-green-600 hover:bg-green-700"
                            >
                              <FiCheckCircle className="w-3 h-3" />
                              Mark Resolved
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="lg:hidden space-y-3">
            {paginated.map((c) => {
              const st = statusConfig[c.status] || statusConfig.filed;
              const isBusy = actionLoading === (c.complaint_id || c.id);
              return (
                <div
                  key={c.complaint_id || c.id}
                  className="card p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-white">{c.title}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                        {c.complaint_id?.slice(0, 12)}...
                      </p>
                    </div>
                    <span className={st.className}>{st.label}</span>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{categoryLabels[c.category] || c.category}</span>
                    <span>|</span>
                    <span>{c.citizen_name || 'N/A'}</span>
                    <span>|</span>
                    <span className={`capitalize font-medium ${priorityConfig[c.priority] || priorityConfig.low}`}>
                      {c.priority || 'low'}
                    </span>
                    <span>|</span>
                    <span>{new Date(c.created_at).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    {c.status === 'assigned' && (
                      <>
                        <button
                          onClick={() => handleAction(c.complaint_id || c.id, 'accept')}
                          disabled={isBusy}
                          className="btn-primary px-3 py-1.5 text-xs inline-flex items-center gap-1 disabled:opacity-50"
                        >
                          {isBusy ? <FiLoader className="animate-spin w-3 h-3" /> : <FiCheck className="w-3 h-3" />}
                          Accept
                        </button>
                        <button
                          onClick={() => handleAction(c.complaint_id || c.id, 'start_work')}
                          disabled={isBusy}
                          className="btn-secondary px-3 py-1.5 text-xs inline-flex items-center gap-1 disabled:opacity-50"
                        >
                          {isBusy ? <FiLoader className="animate-spin w-3 h-3" /> : <FiPlay className="w-3 h-3" />}
                          Start Work
                        </button>
                      </>
                    )}
                    {c.status === 'in_progress' && (
                      <button
                        onClick={() => {
                          setResolveModal(c);
                          setResolveNotes('');
                          setResolveImages([]);
                        }}
                        disabled={isBusy}
                        className="btn-primary px-3 py-1.5 text-xs inline-flex items-center gap-1 disabled:opacity-50 bg-green-600 hover:bg-green-700"
                      >
                        <FiCheckCircle className="w-3 h-3" />
                        Mark Resolved
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="btn-secondary px-3 py-1 text-sm disabled:opacity-40"
              >
                Prev
              </button>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="btn-secondary px-3 py-1 text-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {resolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              if (!resolveLoading) {
                setResolveModal(null);
                setResolveNotes('');
                setResolveImages([]);
              }
            }}
          />
          <div className="relative glass-card w-full max-w-lg p-6 space-y-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resolve Complaint</h2>
              <button
                onClick={() => {
                  if (!resolveLoading) {
                    setResolveModal(null);
                    setResolveNotes('');
                    setResolveImages([]);
                  }
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5">
              <p className="font-medium text-gray-900 dark:text-white text-sm">{resolveModal.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                #{resolveModal.complaint_id || resolveModal.id}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Resolution Notes <span className="text-red-500">*</span>
              </label>
              <textarea
                value={resolveNotes}
                onChange={(e) => setResolveNotes(e.target.value)}
                rows={4}
                placeholder="Describe the resolution steps taken..."
                className="input-field w-full resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Completion Images (optional, max 5)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={resolveImages.length >= 5}
                className="btn-secondary px-4 py-2 text-sm inline-flex items-center gap-2 disabled:opacity-40"
              >
                <FiCamera className="w-4 h-4" />
                Add Images ({resolveImages.length}/5)
              </button>

              {resolveImages.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {resolveImages.map((file, idx) => (
                    <div
                      key={idx}
                      className="relative group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-300"
                    >
                      <FiUpload className="w-3 h-3" />
                      <span className="max-w-[120px] truncate">{file.name}</span>
                      <button
                        onClick={() => removeImage(idx)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <FiX className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setResolveModal(null);
                  setResolveNotes('');
                  setResolveImages([]);
                }}
                disabled={resolveLoading}
                className="btn-secondary px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                disabled={!resolveNotes.trim() || resolveLoading}
                className="btn-primary px-4 py-2 text-sm inline-flex items-center gap-2 disabled:opacity-50 bg-green-600 hover:bg-green-700"
              >
                {resolveLoading ? (
                  <FiLoader className="animate-spin w-4 h-4" />
                ) : (
                  <FiCheckCircle className="w-4 h-4" />
                )}
                {resolveLoading ? 'Resolving...' : 'Confirm Resolution'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
