import React, { useState, useEffect } from 'react';
import {
  FiShield, FiPlus, FiEdit2, FiXCircle, FiCheckCircle, FiAlertTriangle
} from 'react-icons/fi';
import { adminAPI } from '../../utils/api';

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

const defaultForm = { name: '', email: '', role: 'ward_member', ward: '', phone: '' };

export default function OfficerManagement() {
  const [officials, setOfficials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editOfficial, setEditOfficial] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchOfficials();
  }, []);

  const fetchOfficials = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminAPI.getOfficials();
      setOfficials(res.data?.officials || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load officials');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditOfficial(null);
    setForm(defaultForm);
    setShowModal(true);
  };

  const openEdit = (official) => {
    setEditOfficial(official);
    setForm({
      name: official.name || '',
      email: official.email || '',
      role: official.role || 'ward_member',
      ward: official.ward || '',
      phone: official.phone || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      if (editOfficial) {
        await adminAPI.updateUser(editOfficial._id || editOfficial.id, form);
      } else {
        await adminAPI.createOfficial(form);
      }
      setShowModal(false);
      fetchOfficials();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save official');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (official) => {
    const newIsActive = official.is_active === false ? true : false;
    try {
      await adminAPI.updateUser(official._id || official.id, { is_active: newIsActive });
      setOfficials((prev) =>
        prev.map((o) => ((o._id || o.id) === (official._id || official.id) ? { ...o, is_active: newIsActive } : o))
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <FiShield className="text-purple-500" /> Officer Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400">{officials.length} officials</p>
        </div>
        <button onClick={openCreate} className="px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors flex items-center gap-2 text-sm">
          <FiPlus /> Add Official
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 flex items-center gap-2">
          <FiAlertTriangle /> {error}
          <button onClick={fetchOfficials} className="ml-auto underline text-sm">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : officials.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl text-center">
          <FiShield className="text-4xl text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No officials found. Add one to get started.</p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Name</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Email</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Role</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Ward</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Phone</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Status</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {officials.map((official) => (
                  <tr key={official._id || official.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="p-4 text-sm text-gray-800 dark:text-white font-medium">{official.name}</td>
                    <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{official.email}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${official.role === 'ward_member'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                          : 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                        }`}>
                        {official.role?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{official.ward || '-'}</td>
                    <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{official.phone || '-'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${official.is_active !== false
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                        }`}>
                        {official.is_active !== false ? 'active' : 'inactive'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(official)} className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors" title="Edit">
                          <FiEdit2 className="text-blue-500" />
                        </button>
                        <button
                          onClick={() => toggleStatus(official)}
                          className={`p-1.5 rounded-lg transition-colors ${official.is_active !== false
                              ? 'hover:bg-red-100 dark:hover:bg-red-900/30'
                              : 'hover:bg-green-100 dark:hover:bg-green-900/30'
                            }`}
                          title={official.is_active !== false ? 'Deactivate' : 'Activate'}
                        >
                          {official.is_active !== false ? (
                            <FiXCircle className="text-red-500" />
                          ) : (
                            <FiCheckCircle className="text-green-500" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editOfficial ? 'Edit Official' : 'Create Official'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Full name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              disabled={!!editOfficial}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
              placeholder="email@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
            <select
              value={form.role}
              onChange={(e) => updateField('role', e.target.value)}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="ward_member">Ward Member</option>
              <option value="corporation_official">Corporation Official</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ward</label>
            <input
              type="text"
              value={form.ward}
              onChange={(e) => updateField('ward', e.target.value)}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="e.g. 5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Phone number"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || !form.name || !form.email}
              className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : editOfficial ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
