import React, { useState, useEffect, useMemo } from 'react';
import {
  FiUsers, FiSearch, FiEdit2, FiAlertTriangle, FiCheckCircle,
  FiXCircle, FiClock, FiGrid
} from 'react-icons/fi';
import { adminAPI } from '../../utils/api';

const ROLES = ['citizen', 'ward_member', 'corporation_official', 'admin'];
const PAGE_SIZE = 10;

function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="glass-card rounded-2xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
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

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', role: '', ward: '', phone: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminAPI.getUsers();
      setUsers(res.data?.users || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchRole = !roleFilter || u.role === roleFilter;
      const q = search.toLowerCase();
      const matchSearch = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
      return matchRole && matchSearch;
    });
  }, [users, search, roleFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter]);

  const openEdit = (user) => {
    setEditUser(user);
    setEditForm({ name: user.name || '', role: user.role || '', ward: user.ward || '', phone: user.phone || '' });
  };

  const handleUpdate = async () => {
    try {
      setSaving(true);
      await adminAPI.updateUser(editUser._id || editUser.id, editForm);
      setUsers((prev) => prev.map((u) => (u._id === editUser._id || u.id === editUser.id ? { ...u, ...editForm } : u)));
      setEditUser(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (user) => {
    const newIsActive = user.is_active === false ? true : false;
    try {
      await adminAPI.updateUser(user._id || user.id, { is_active: newIsActive });
      setUsers((prev) => prev.map((u) => (u._id === user._id || u.id === user.id ? { ...u, is_active: newIsActive } : u)));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const roleBadge = (role) => {
    const colors = {
      citizen: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
      ward_member: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
      corporation_official: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
      admin: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[role] || 'bg-gray-100 text-gray-600'}`}>
        {role?.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <FiUsers className="text-blue-500" /> User Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400">{filtered.length} users found</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 flex items-center gap-2">
          <FiAlertTriangle /> {error}
          <button onClick={fetchUsers} className="ml-auto underline text-sm">Retry</button>
        </div>
      )}

      {/* Filters */}
      <div className="glass-card p-4 rounded-xl flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{r.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl text-center">
          <FiUsers className="text-4xl text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No users found</p>
        </div>
      ) : (
        <>
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Name</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Email</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Role</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Phone</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Ward</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Status</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Created At</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((user) => (
                    <tr key={user._id || user.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="p-4 text-sm text-gray-800 dark:text-white font-medium">{user.name}</td>
                      <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{user.email}</td>
                      <td className="p-4">{roleBadge(user.role)}</td>
                      <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{user.phone || '-'}</td>
                      <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{user.ward || '-'}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.is_active !== false ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'}`}>
                          {user.is_active !== false ? 'active' : 'inactive'}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-500 dark:text-gray-400">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(user)} className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors" title="Edit">
                            <FiEdit2 className="text-blue-500" />
                          </button>
                          <button
                            onClick={() => toggleStatus(user)}
                            className={`p-1.5 rounded-lg transition-colors ${user.is_active !== false ? 'hover:bg-red-100 dark:hover:bg-red-900/30' : 'hover:bg-green-100 dark:hover:bg-green-900/30'}`}
                            title={user.is_active !== false ? 'Deactivate' : 'Activate'}
                          >
                            {user.is_active !== false ? <FiXCircle className="text-red-500" /> : <FiCheckCircle className="text-green-500" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${p === page ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Edit Modal */}
      <Modal isOpen={!!editUser} onClose={() => setEditUser(null)} title="Edit User">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
            <select
              value={editForm.role}
              onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ward</label>
            <input
              type="text"
              value={editForm.ward}
              onChange={(e) => setEditForm({ ...editForm, ward: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
            <input
              type="text"
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setEditUser(null)} className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleUpdate}
              disabled={saving}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
