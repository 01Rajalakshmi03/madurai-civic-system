import React, { useState, useEffect } from 'react';
import {
  FiDatabase, FiCheckCircle, FiXCircle, FiAlertTriangle, FiSearch,
  FiPlus, FiShield, FiClock
} from 'react-icons/fi';
import { blockchainAPI } from '../../utils/api';

const PAGE_SIZE = 10;

export default function BlockchainExplorer() {
  const [status, setStatus] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [storeComplaintId, setStoreComplaintId] = useState('');
  const [storing, setStoring] = useState(false);
  const [verifying, setVerifying] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statusRes, recordsRes] = await Promise.allSettled([
        blockchainAPI.status(),
        blockchainAPI.getRecords(),
      ]);
      if (statusRes.status === 'fulfilled') setStatus(statusRes.value.data);
      if (recordsRes.status === 'fulfilled') setRecords(recordsRes.value.data?.records || []);
      if (statusRes.status === 'rejected' && recordsRes.status === 'rejected') {
        setError('Failed to load blockchain data');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load blockchain data');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setConnecting(true);
      const res = await blockchainAPI.connect();
      setStatus(res.data || { connected: true });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to connect to blockchain');
    } finally {
      setConnecting(false);
    }
  };

  const handleStore = async () => {
    if (!storeComplaintId.trim()) return;
    try {
      setStoring(true);
      await blockchainAPI.store(storeComplaintId.trim());
      setStoreComplaintId('');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to store on blockchain');
    } finally {
      setStoring(false);
    }
  };

  const handleVerify = async (complaintId) => {
    try {
      setVerifying(complaintId);
      await blockchainAPI.verify(complaintId);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Verification failed');
    } finally {
      setVerifying(null);
    }
  };

  const truncateHash = (hash) => {
    if (!hash) return '-';
    if (hash.length <= 16) return hash;
    return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
  };

  const filtered = records.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.complaint_id?.toLowerCase().includes(q) ||
      r.tx_hash?.toLowerCase().includes(q) ||
      r.function_name?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <FiDatabase className="text-purple-500" /> Blockchain Explorer
        </h1>
        <p className="text-gray-500 dark:text-gray-400">Manage and verify blockchain records</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 flex items-center gap-2">
          <FiAlertTriangle /> {error}
          <button onClick={fetchData} className="ml-auto underline text-sm">Retry</button>
        </div>
      )}

      {/* Connection Status */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${status?.connected ? 'bg-green-500' : 'bg-red-500'}`}>
              <FiShield className="text-xl text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Blockchain Connection</p>
              <p className="text-lg font-bold text-gray-800 dark:text-white">
                {loading ? 'Checking...' : status?.connected ? 'Connected' : 'Disconnected'}
              </p>
              {status?.network && (
                <p className="text-xs text-gray-400">Network: {status.network}</p>
              )}
              {status?.contract_address && (
                <p className="text-xs text-gray-400 font-mono">Contract: {truncateHash(status.contract_address)}</p>
              )}
            </div>
          </div>
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="px-5 py-2.5 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
          >
            <FiShield />
            {connecting ? 'Connecting...' : status?.connected ? 'Reconnect' : 'Connect'}
          </button>
        </div>
      </div>

      {/* Store Complaint */}
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
          <FiPlus className="text-green-500" /> Store Complaint on Blockchain
        </h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={storeComplaintId}
            onChange={(e) => setStoreComplaintId(e.target.value)}
            placeholder="Enter Complaint ID"
            className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={handleStore}
            disabled={storing || !storeComplaintId.trim()}
            className="px-5 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
          >
            <FiDatabase />
            {storing ? 'Storing...' : 'Store'}
          </button>
        </div>
      </div>

      {/* Records */}
      <div className="glass-card p-4 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Blockchain Records</h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">{filtered.length} records</span>
        </div>

        <div className="relative mb-4">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by complaint ID, tx hash, or function..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : paginated.length === 0 ? (
          <div className="py-12 text-center">
            <FiDatabase className="text-4xl text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No blockchain records found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left p-3 text-xs font-semibold text-gray-600 dark:text-gray-300">Complaint ID</th>
                    <th className="text-left p-3 text-xs font-semibold text-gray-600 dark:text-gray-300">Tx Hash</th>
                    <th className="text-left p-3 text-xs font-semibold text-gray-600 dark:text-gray-300">Block #</th>
                    <th className="text-left p-3 text-xs font-semibold text-gray-600 dark:text-gray-300">Function</th>
                    <th className="text-left p-3 text-xs font-semibold text-gray-600 dark:text-gray-300">Status</th>
                    <th className="text-left p-3 text-xs font-semibold text-gray-600 dark:text-gray-300">Created At</th>
                    <th className="text-left p-3 text-xs font-semibold text-gray-600 dark:text-gray-300">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((record) => (
                    <tr key={record._id || record.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="p-3 text-sm text-gray-800 dark:text-white font-mono">{record.complaint_id || '-'}</td>
                      <td className="p-3 text-sm text-gray-600 dark:text-gray-300 font-mono" title={record.tx_hash}>
                        {truncateHash(record.tx_hash)}
                      </td>
                      <td className="p-3 text-sm text-gray-600 dark:text-gray-300">{record.block_number || '-'}</td>
                      <td className="p-3 text-sm text-gray-600 dark:text-gray-300">{record.function_name || '-'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          record.status === 'success' || record.status === 'confirmed'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                            : record.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                        }`}>
                          {record.status || 'unknown'}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-gray-500 dark:text-gray-400">
                        {record.created_at ? new Date(record.created_at).toLocaleDateString() : '-'}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => handleVerify(record.complaint_id)}
                          disabled={!record.complaint_id || verifying === record.complaint_id}
                          className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-medium hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors disabled:opacity-50 flex items-center gap-1"
                        >
                          <FiCheckCircle />
                          {verifying === record.complaint_id ? 'Verifying...' : 'Verify'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-40">Prev</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                  return start + i;
                }).filter((p) => p <= totalPages).map((p) => (
                  <button key={p} onClick={() => setPage(p)} className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${p === page ? 'bg-purple-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>{p}</button>
                ))}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-40">Next</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
