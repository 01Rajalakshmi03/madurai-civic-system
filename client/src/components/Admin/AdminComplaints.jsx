import React, { useState, useEffect, useMemo } from 'react';
import {
  FiClipboard, FiSearch, FiEdit2, FiTrash2, FiAlertTriangle,
  FiCheckCircle, FiXCircle, FiClock, FiDatabase, FiTrendingUp
} from 'react-icons/fi';
import { complaintAPI, adminAPI } from '../../utils/api';

const STATUSES = ['filed', 'assigned', 'in_progress', 'resolved', 'rejected'];
const CATEGORIES = ['road_damage', 'garbage_accumulation', 'water_leakage', 'drainage_problem', 'streetlight_failure', 'illegal_dumping', 'infrastructure_damage', 'other'];
const PRIORITIES = ['low', 'medium', 'high', 'emergency'];

function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="glass-card rounded-2xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <FiXCircle className="text-xl text-gray-500" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const PAGE_SIZE = 10;

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [wardFilter, setWardFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const [reassignModal, setReassignModal] = useState(null);
  const [reassignWard, setReassignWard] = useState('');
  const [priorityModal, setPriorityModal] = useState(null);
  const [newPriority, setNewPriority] = useState('');
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await complaintAPI.getAll({});
      setComplaints(res.data?.complaints || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return complaints.filter((c) => {
      const q = search.toLowerCase();
      if (q && !c.complaint_id?.toLowerCase().includes(q) && !c.title?.toLowerCase().includes(q) && !c.citizen_name?.toLowerCase().includes(q) && !c.citizen?.toLowerCase().includes(q)) return false;
      if (statusFilter && c.status !== statusFilter) return false;
      if (categoryFilter && c.category !== categoryFilter) return false;
      if (wardFilter && String(c.ward) !== String(wardFilter)) return false;
      if (priorityFilter && c.priority !== priorityFilter) return false;
      if (dateFrom && new Date(c.created_at) < new Date(dateFrom)) return false;
      if (dateTo && new Date(c.created_at) > new Date(dateTo + 'T23:59:59')) return false;
      return true;
    });
  }, [complaints, search, statusFilter, categoryFilter, wardFilter, priorityFilter, dateFrom, dateTo]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search, statusFilter, categoryFilter, wardFilter, priorityFilter, dateFrom, dateTo]);

  const handleReassign = async () => {
    try {
      setActionLoading(true);
      await complaintAPI.update(reassignModal.complaint_id, { action: 'reassign', ward: reassignWard });
      setComplaints((prev) => prev.map((c) => (c.complaint_id === reassignModal.complaint_id ? { ...c, ward: Number(reassignWard) } : c)));
      setReassignModal(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reassign');
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangePriority = async () => {
    try {
      setActionLoading(true);
      await complaintAPI.update(priorityModal.complaint_id, { action: 'update_priority', priority: newPriority });
      setComplaints((prev) => prev.map((c) => (c.complaint_id === priorityModal.complaint_id ? { ...c, priority: newPriority } : c)));
      setPriorityModal(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update priority');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setActionLoading(true);
      await complaintAPI.update(rejectModal.complaint_id, { action: 'reject', reason: rejectReason });
      setComplaints((prev) => prev.map((c) => (c.complaint_id === rejectModal.complaint_id ? { ...c, status: 'rejected' } : c)));
      setRejectModal(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reject');
    } finally {
      setActionLoading(false);
    }
  };

  const statusBadge = (status) => {
    const colors = {
      filed: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
      assigned: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
      in_progress: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
      resolved: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
      rejected: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
        {status?.replace('_', ' ')}
      </span>
    );
  };

  const priorityBadge = (priority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
      medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
      high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
      emergency: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[priority] || 'bg-gray-100 text-gray-600'}`}>
        {priority}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <FiClipboard className="text-amber-500" /> Complaint Monitoring
          </h1>
          <p className="text-gray-500 dark:text-gray-400">{filtered.length} complaints</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 flex items-center gap-2">
          <FiAlertTriangle /> {error}
          <button onClick={fetchComplaints} className="ml-auto underline text-sm">Retry</button>
        </div>
      )}

      {/* Filters */}
      <div className="glass-card p-4 rounded-xl space-y-3">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by ID, title, or citizen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500">
            <option value="">All Status</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500">
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
          </select>
          <input type="text" placeholder="Ward" value={wardFilter} onChange={(e) => setWardFilter(e.target.value)} className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500" />
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500">
            <option value="">All Priority</option>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <div className="flex gap-2">
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="flex-1 px-2 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-white focus:outline-none" />
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="flex-1 px-2 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-white focus:outline-none" />
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl text-center">
          <FiClipboard className="text-4xl text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No complaints match your filters</p>
        </div>
      ) : (
        <>
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left p-3 text-xs font-semibold text-gray-600 dark:text-gray-300">ID</th>
                    <th className="text-left p-3 text-xs font-semibold text-gray-600 dark:text-gray-300">Title</th>
                    <th className="text-left p-3 text-xs font-semibold text-gray-600 dark:text-gray-300">Citizen</th>
                    <th className="text-left p-3 text-xs font-semibold text-gray-600 dark:text-gray-300">Category</th>
                    <th className="text-left p-3 text-xs font-semibold text-gray-600 dark:text-gray-300">Ward</th>
                    <th className="text-left p-3 text-xs font-semibold text-gray-600 dark:text-gray-300">Priority</th>
                    <th className="text-left p-3 text-xs font-semibold text-gray-600 dark:text-gray-300">Status</th>
                    <th className="text-left p-3 text-xs font-semibold text-gray-600 dark:text-gray-300">Blockchain</th>
                    <th className="text-left p-3 text-xs font-semibold text-gray-600 dark:text-gray-300">Date</th>
                    <th className="text-left p-3 text-xs font-semibold text-gray-600 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((complaint) => (
                    <tr key={complaint._id || complaint.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="p-3 text-xs text-gray-500 dark:text-gray-400 font-mono">{complaint.complaint_id || (complaint._id || complaint.id)?.slice(-8)}</td>
                      <td className="p-3 text-sm text-gray-800 dark:text-white font-medium max-w-[200px] truncate">{complaint.title}</td>
                      <td className="p-3 text-sm text-gray-600 dark:text-gray-300">{complaint.citizen_name || complaint.citizen || '-'}</td>
                      <td className="p-3 text-sm text-gray-600 dark:text-gray-300">{complaint.category?.replace('_', ' ')}</td>
                      <td className="p-3 text-sm text-gray-600 dark:text-gray-300">{complaint.ward}</td>
                      <td className="p-3">{priorityBadge(complaint.priority)}</td>
                      <td className="p-3">{statusBadge(complaint.status)}</td>
                      <td className="p-3">
                        {complaint.tx_hash || complaint.blockchain_tx ? (
                          <span title="On blockchain" className="inline-flex items-center gap-1 text-green-500">
                            <FiCheckCircle className="text-sm" />
                          </span>
                        ) : (
                          <span title="Not on blockchain" className="inline-flex items-center gap-1 text-gray-400">
                            <FiXCircle className="text-sm" />
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-xs text-gray-500 dark:text-gray-400">
                        {complaint.created_at ? new Date(complaint.created_at).toLocaleDateString() : '-'}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setReassignModal(complaint); setReassignWard(complaint.ward || ''); }} className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors" title="Reassign">
                            <FiEdit2 className="text-blue-500 text-sm" />
                          </button>
                          <button onClick={() => { setPriorityModal(complaint); setNewPriority(complaint.priority || 'medium'); }} className="p-1.5 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors" title="Change Priority">
                            <FiTrendingUp className="text-orange-500 text-sm" />
                          </button>
                          <button onClick={() => { setRejectModal(complaint); setRejectReason(''); }} className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors" title="Reject">
                            <FiXCircle className="text-red-500 text-sm" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Prev</button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 3, totalPages - 6));
                return start + i;
              }).filter((p) => p <= totalPages).map((p) => (
                <button key={p} onClick={() => setPage(p)} className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${p === page ? 'bg-amber-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>{p}</button>
              ))}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Next</button>
            </div>
          )}
        </>
      )}

      {/* Reassign Modal */}
      <Modal isOpen={!!reassignModal} onClose={() => setReassignModal(null)} title="Reassign Complaint">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">Reassigning complaint: <strong>{reassignModal?.title}</strong></p>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Ward</label>
            <input type="text" value={reassignWard} onChange={(e) => setReassignWard(e.target.value)} className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ward number" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setReassignModal(null)} className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Cancel</button>
            <button onClick={handleReassign} disabled={actionLoading || !reassignWard} className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50">{actionLoading ? 'Saving...' : 'Reassign'}</button>
          </div>
        </div>
      </Modal>

      {/* Priority Modal */}
      <Modal isOpen={!!priorityModal} onClose={() => setPriorityModal(null)} title="Change Priority">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">Changing priority for: <strong>{priorityModal?.title}</strong></p>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Priority</label>
            <select value={newPriority} onChange={(e) => setNewPriority(e.target.value)} className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500">
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setPriorityModal(null)} className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Cancel</button>
            <button onClick={handleChangePriority} disabled={actionLoading} className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50">{actionLoading ? 'Saving...' : 'Update'}</button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal isOpen={!!rejectModal} onClose={() => setRejectModal(null)} title="Reject Complaint">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">Rejecting complaint: <strong>{rejectModal?.title}</strong></p>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rejection Reason</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              placeholder="Provide a reason for rejection..."
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setRejectModal(null)} className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Cancel</button>
            <button onClick={handleReject} disabled={actionLoading || !rejectReason.trim()} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50">{actionLoading ? 'Rejecting...' : 'Reject'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
