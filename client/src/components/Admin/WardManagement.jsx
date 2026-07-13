import React, { useState, useEffect } from 'react';
import {
  FiGrid, FiPlus, FiEdit2, FiAlertTriangle, FiXCircle, FiClipboard
} from 'react-icons/fi';
import { adminAPI, analyticsAPI } from '../../utils/api';

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

const defaultForm = { ward_number: '', ward_name: '', zone: '', population: '', area: '', ward_member: '' };

export default function WardManagement() {
  const [wards, setWards] = useState([]);
  const [complaintCounts, setComplaintCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editWard, setEditWard] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [wardsRes, analyticsRes] = await Promise.allSettled([
        adminAPI.getWards(),
        analyticsAPI.byWard(),
      ]);

      const wardList = wardsRes.status === 'fulfilled' ? (wardsRes.value.data?.wards || []) : [];
      setWards(wardList);

      if (analyticsRes.status === 'fulfilled') {
        const counts = {};
        (analyticsRes.value.data?.wards || []).forEach((item) => {
          counts[item.ward || item.ward_number] = item.count || item.total || 0;
        });
        setComplaintCounts(counts);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load wards');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditWard(null);
    setForm(defaultForm);
    setShowModal(true);
  };

  const openEdit = (ward) => {
    setEditWard(ward);
    setForm({
      ward_number: ward.ward_number || '',
      ward_name: ward.ward_name || '',
      zone: ward.zone || '',
      population: ward.population || '',
      area: ward.area || '',
      ward_member: ward.ward_member || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      const payload = {
        ward_number: Number(form.ward_number),
        ward_name: form.ward_name,
        zone: form.zone,
        population: Number(form.population) || 0,
        area_sq_km: Number(form.area) || 0,
      };
      if (editWard) {
        await adminAPI.updateWard(editWard.id, payload);
      } else {
        await adminAPI.createWard(payload);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save ward');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <FiGrid className="text-green-500" /> Ward Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400">{wards.length} wards</p>
        </div>
        <button onClick={openCreate} className="px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors flex items-center gap-2 text-sm">
          <FiPlus /> Add Ward
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 flex items-center gap-2">
          <FiAlertTriangle /> {error}
          <button onClick={fetchData} className="ml-auto underline text-sm">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-44 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : wards.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl text-center">
          <FiGrid className="text-4xl text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No wards found. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {wards.map((ward) => (
            <div key={ward._id || ward.id} className="glass-card p-5 rounded-2xl hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                    Ward {ward.ward_number}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{ward.ward_name}</p>
                </div>
                <button onClick={() => openEdit(ward)} className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors" title="Edit">
                  <FiEdit2 className="text-blue-500" />
                </button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>Zone</span>
                  <span className="font-medium">{ward.zone || '-'}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>Population</span>
                  <span className="font-medium">{ward.population ? Number(ward.population).toLocaleString() : '-'}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>Area</span>
                  <span className="font-medium">{ward.area || '-'}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>Ward Member</span>
                  <span className="font-medium">{ward.ward_member || '-'}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <FiClipboard className="text-xs" /> Complaints
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-semibold text-sm">
                    {complaintCounts[ward.ward_number] || complaintCounts[ward.ward_name] || 0}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editWard ? 'Edit Ward' : 'Create Ward'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ward Number</label>
              <input
                type="text"
                value={form.ward_number}
                onChange={(e) => updateField('ward_number', e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g. 1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ward Name</label>
              <input
                type="text"
                value={form.ward_name}
                onChange={(e) => updateField('ward_name', e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g. Anna Nagar"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Zone</label>
            <input
              type="text"
              value={form.zone}
              onChange={(e) => updateField('zone', e.target.value)}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g. Central"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Population</label>
              <input
                type="number"
                value={form.population}
                onChange={(e) => updateField('population', e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g. 50000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Area (sq km)</label>
              <input
                type="text"
                value={form.area}
                onChange={(e) => updateField('area', e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g. 12.5"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ward Member</label>
            <input
              type="text"
              value={form.ward_member}
              onChange={(e) => updateField('ward_member', e.target.value)}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g. Ramesh Kumar"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || !form.ward_number || !form.ward_name}
              className="flex-1 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : editWard ? 'Update Ward' : 'Create Ward'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
