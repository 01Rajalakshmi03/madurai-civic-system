import React, { useState, useEffect, useCallback } from 'react';
import {
  FiFileText, FiBarChart2, FiShield, FiClock, FiDownload,
  FiCalendar, FiFilter, FiChevronDown, FiAlertCircle, FiRefreshCw,
} from 'react-icons/fi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area,
} from 'recharts';
import { analyticsAPI, complaintAPI, notificationAPI, blockchainAPI } from '../../utils/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const PIE_COLORS = ['#22c55e', '#f97316', '#3b82f6', '#eab308', '#ef4444'];

const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: 'rgba(17, 24, 39, 0.9)',
    border: 'none',
    borderRadius: '8px',
    color: '#f3f4f6',
    fontSize: '12px',
  },
};

function GlassCard({ children, className = '' }) {
  return (
    <div
      className={`bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg border border-white/20 dark:border-gray-700/50 rounded-2xl shadow-xl ${className}`}
    >
      {children}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      </div>
    </div>
  );
}

function DateRangePicker({ startDate, endDate, onChange }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">
        <FiCalendar size={14} className="text-gray-400" />
        <input
          type="date"
          value={startDate}
          onChange={(e) => onChange({ ...{ startDate, endDate }, startDate: e.target.value })}
          className="bg-transparent text-sm text-gray-700 dark:text-gray-200 outline-none"
        />
      </div>
      <span className="text-gray-400 text-sm">to</span>
      <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">
        <FiCalendar size={14} className="text-gray-400" />
        <input
          type="date"
          value={endDate}
          onChange={(e) => onChange({ ...{ startDate, endDate }, endDate: e.target.value })}
          className="bg-transparent text-sm text-gray-700 dark:text-gray-200 outline-none"
        />
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [wardData, setWardData] = useState([]);
  const [resolutionData, setResolutionData] = useState([]);
  const [monthlyData, setMonthlyData] = useState({ categoryData: [], statusCounts: {}, totalThisMonth: 0 });
  const [blockchainRecords, setBlockchainRecords] = useState([]);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [wardFilter, setWardFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const CATEGORIES = [
    'road_damage', 'garbage_accumulation', 'water_leakage',
    'drainage_problem', 'streetlight_failure', 'illegal_dumping',
    'infrastructure_damage', 'other',
  ];

  const CATEGORY_LABELS = {
    road_damage: 'Road Damage',
    garbage_accumulation: 'Garbage Accumulation',
    water_leakage: 'Water Leakage',
    drainage_problem: 'Drainage Problem',
    streetlight_failure: 'Streetlight Failure',
    illegal_dumping: 'Illegal Dumping',
    infrastructure_damage: 'Infrastructure Damage',
    other: 'Other',
  };

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [wardRes, resolutionRes] = await Promise.allSettled([
        analyticsAPI.wardRanking(),
        analyticsAPI.resolutionTime(),
      ]);

      if (wardRes.status === 'fulfilled') {
        const raw = wardRes.value.data?.wards || wardRes.value.wards || wardRes.value.data || [];
        const mapped = Array.isArray(raw) ? raw.map((w) => ({
          ward: w.ward || w.ward_number || w._id,
          total_complaints: w.total_complaints || w.complaints || w.total || 0,
          resolved: w.resolved || w.total_resolved || 0,
          score: w.score != null ? w.score : Math.round((w.resolution_rate || 0) * 100),
        })) : [];
        setWardData(mapped);
      }

      if (resolutionRes.status === 'fulfilled') {
        const raw = resolutionRes.value.data?.by_category || [];
        const mapped = Array.isArray(raw) ? raw.map((r) => ({
          category: r.category || r.name || r._id || 'Unknown',
          avg_days: parseFloat(r.avg_days || r.average || r.avg_resolution_days || (r.avg_hours != null ? (r.avg_hours / 24).toFixed(1) : 0)),
          count: r.count || r.total || 0,
        })) : [];
        setResolutionData(mapped);
      }

      try {
        const monthRes = await analyticsAPI.monthlySummary();
        const data = monthRes.data || monthRes;
        setMonthlyData({
          categoryData: data.by_category || [],
          statusCounts: (data.by_status || []).reduce((acc, s) => { acc[s.name] = s.value; return acc; }, {}),
          totalThisMonth: data.total || 0,
        });
      } catch {
        setMonthlyData({ categoryData: [], statusCounts: {}, totalThisMonth: 0 });
      }

      try {
        if (blockchainAPI?.getRecords) {
          const records = await blockchainAPI.getRecords();
          setBlockchainRecords(records.data?.records || records.records || []);
        }
      } catch {
        setBlockchainRecords([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleGeneratePDF = (reportType) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const now = new Date().toLocaleString();

    doc.setFontSize(18);
    doc.text('Madurai Smart City - Civic Reports', pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(reportType, pageWidth / 2, 28, { align: 'center' });
    doc.setFontSize(9);
    doc.text(`Generated: ${now}`, pageWidth / 2, 34, { align: 'center' });
    doc.setDrawColor(200);
    doc.line(20, 37, pageWidth - 20, 37);

    let yOffset = 44;

    if (reportType === 'Monthly Complaints Report') {
      doc.setFontSize(14);
      doc.text('Monthly Complaints Summary', 14, yOffset);
      yOffset += 8;
      doc.setFontSize(10);
      doc.text(`Total Complaints This Month: ${totalThisMonth}`, 14, yOffset);
      yOffset += 10;

      if (categoryDataForChart.length > 0) {
        doc.setFontSize(12);
        doc.text('Complaints by Category', 14, yOffset);
        yOffset += 4;
        doc.autoTable({
          startY: yOffset,
          head: [['Category', 'Count']],
          body: categoryDataForChart.map((d) => [
            CATEGORY_LABELS[d.name] || d.name, String(d.value)
          ]),
          theme: 'grid',
          headStyles: { fillColor: [59, 130, 246] },
          margin: { left: 14, right: 14 },
        });
        yOffset = doc.lastAutoTable.finalY + 10;
      }

      if (statusPieData.length > 0) {
        doc.setFontSize(12);
        doc.text('Status Breakdown', 14, yOffset);
        yOffset += 4;
        doc.autoTable({
          startY: yOffset,
          head: [['Status', 'Count']],
          body: statusPieData.map((d) => [d.name, String(d.value)]),
          theme: 'grid',
          headStyles: { fillColor: [59, 130, 246] },
          margin: { left: 14, right: 14 },
        });
      }
    } else if (reportType === 'Ward Performance Report') {
      doc.setFontSize(14);
      doc.text('Ward Performance Rankings', 14, yOffset);
      yOffset += 10;

      if (filteredWardData.length > 0) {
        doc.autoTable({
          startY: yOffset,
          head: [['Rank', 'Ward', 'Complaints', 'Resolved', 'Score']],
          body: filteredWardData.map((w, idx) => [
            String(idx + 1),
            `Ward ${w.ward || w.ward_number}`,
            String(w.total_complaints || w.complaints || 0),
            String(w.resolved || w.total_resolved || 0),
            String(w.score || 0),
          ]),
          theme: 'grid',
          headStyles: { fillColor: [147, 51, 234] },
          margin: { left: 14, right: 14 },
        });
      } else {
        doc.setFontSize(10);
        doc.text('No ward data available', 14, yOffset);
      }
    } else if (reportType === 'Blockchain Verification Report') {
      doc.setFontSize(14);
      doc.text('Blockchain Verification Records', 14, yOffset);
      yOffset += 10;

      if (blockchainRecords.length > 0) {
        doc.autoTable({
          startY: yOffset,
          head: [['Complaint ID', 'Tx Hash', 'Block #', 'Function', 'Status']],
          body: blockchainRecords.map((rec) => [
            rec.complaint_id || '-',
            (rec.tx_hash || '-').slice(0, 20) + '...',
            String(rec.block_number || '-'),
            rec.function_name || '-',
            rec.status || '-',
          ]),
          theme: 'grid',
          headStyles: { fillColor: [34, 197, 94] },
          margin: { left: 14, right: 14 },
        });
      } else {
        doc.setFontSize(10);
        doc.text('No blockchain records found', 14, yOffset);
      }
    } else if (reportType === 'Resolution Analytics') {
      doc.setFontSize(14);
      doc.text('Resolution Time by Category', 14, yOffset);
      yOffset += 10;

      if (resolutionChartData.length > 0) {
        doc.autoTable({
          startY: yOffset,
          head: [['Category', 'Avg Days', 'Complaints']],
          body: resolutionChartData.map((r) => [
            CATEGORY_LABELS[r.category] || r.category,
            String(r.avgDays),
            String(r.count),
          ]),
          theme: 'grid',
          headStyles: { fillColor: [249, 115, 22] },
          margin: { left: 14, right: 14 },
        });
      } else {
        doc.setFontSize(10);
        doc.text('No resolution data available', 14, yOffset);
      }
    }

    const safeName = reportType.replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const filteredWardData = wardData.filter((w) => {
    if (wardFilter && String(w.ward || w.ward_number) !== wardFilter) return false;
    return true;
  });

  const categoryDataForChart = monthlyData.categoryData || [];
  const statusCounts = monthlyData.statusCounts || {};
  const totalThisMonth = monthlyData.totalThisMonth || 0;

  const statusPieData = Object.entries(statusCounts).map(([name, value]) => ({
    name: name.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    value,
  }));

  const resolutionChartData = resolutionData.map((r) => ({
    category: r.category,
    avgDays: parseFloat(r.avg_days) || 0,
    count: r.count,
  }));

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Reports</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Analytics and insights for Madurai Smart City civic issues
          </p>
        </div>
        <button
          onClick={fetchAllData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-medium transition-colors"
        >
          <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onChange={({ startDate: s, endDate: e }) => { setStartDate(s); setEndDate(e); }}
        />
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={wardFilter}
              onChange={(e) => setWardFilter(e.target.value)}
              className="appearance-none bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-200 pr-8 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">All Wards</option>
              {[...Array(30)].map((_, i) => (
                <option key={i + 1} value={String(i + 1)}>Ward {i + 1}</option>
              ))}
            </select>
            <FiChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="appearance-none bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-200 pr-8 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{CATEGORY_LABELS[c] || c}</option>
              ))}
            </select>
            <FiChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Generating reports...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
          <FiAlertCircle className="mx-auto mb-2 text-red-500" size={28} />
          <p className="text-red-700 dark:text-red-300 font-medium">{error}</p>
          <button
            onClick={fetchAllData}
            className="mt-3 text-sm text-red-600 dark:text-red-400 underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={FiFileText}
              label="Total This Month"
              value={totalThisMonth}
              color="bg-blue-500"
            />
            <StatCard
              icon={FiBarChart2}
              label="Wards Tracked"
              value={filteredWardData.length}
              color="bg-purple-500"
            />
            <StatCard
              icon={FiClock}
              label="Avg Resolution Days"
              value={
                resolutionChartData.length > 0
                  ? (resolutionChartData.reduce((s, r) => s + r.avgDays, 0) / resolutionChartData.length).toFixed(1)
                  : '—'
              }
              color="bg-orange-500"
            />
            <StatCard
              icon={FiShield}
              label="Blockchain Records"
              value={blockchainRecords.length || '—'}
              color="bg-green-500"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Monthly Complaints
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Current month overview</p>
                </div>
                <button
                  onClick={() => handleGeneratePDF('Monthly Complaints Report')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
                >
                  <FiDownload size={12} />
                  Generate PDF
                </button>
              </div>

              {categoryDataForChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={categoryDataForChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      angle={-30}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                    <Tooltip {...CHART_TOOLTIP_STYLE} />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-60 text-gray-400 text-sm">
                  No data available for this month
                </div>
              )}

              {statusPieData.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Status Breakdown</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={statusPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {statusPieData.map((_, idx) => (
                          <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip {...CHART_TOOLTIP_STYLE} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Ward Performance
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Rankings by ward</p>
                </div>
                <button
                  onClick={() => handleGeneratePDF('Ward Performance Report')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-medium hover:bg-purple-700 transition-colors"
                >
                  <FiDownload size={12} />
                  Generate PDF
                </button>
              </div>

              {filteredWardData.length > 0 ? (
                <div className="overflow-x-auto max-h-80">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                          Rank
                        </th>
                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                          Ward
                        </th>
                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                          Complaints
                        </th>
                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                          Resolved
                        </th>
                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                          Score
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredWardData.map((w, idx) => (
                        <tr
                          key={w.ward || w.ward_number || idx}
                          className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                        >
                          <td className="py-2.5 px-3 font-medium text-gray-900 dark:text-white">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3 text-gray-700 dark:text-gray-200">
                            Ward {w.ward || w.ward_number}
                          </td>
                          <td className="py-2.5 px-3 text-gray-600 dark:text-gray-300">
                            {w.total_complaints || w.complaints || 0}
                          </td>
                          <td className="py-2.5 px-3 text-green-600 dark:text-green-400 font-medium">
                            {w.resolved || w.total_resolved || 0}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              (w.score || 0) >= 80
                                ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                                : (w.score || 0) >= 50
                                  ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300'
                                  : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                            }`}>
                              {w.score || 0}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex items-center justify-center h-60 text-gray-400 text-sm">
                  No ward data available
                </div>
              )}
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Blockchain Verification
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Immutable complaint records</p>
                </div>
                <button
                  onClick={() => handleGeneratePDF('Blockchain Verification Report')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition-colors"
                >
                  <FiDownload size={12} />
                  Generate PDF
                </button>
              </div>

              {blockchainRecords.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {blockchainRecords.slice(0, 10).map((rec, idx) => (
                    <div
                      key={rec.hash || rec.id || idx}
                      className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <FiShield size={12} className="text-green-500" />
                        <span className="text-xs font-medium text-green-600 dark:text-green-400">
                          Verified
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-200 font-medium">
                        {rec.complaint_id || rec.title || `Record ${idx + 1}`}
                      </p>
                      <p className="text-[11px] text-gray-400 font-mono mt-1 break-all">
                        Hash: {(rec.hash || rec.block_hash || '—').slice(0, 32)}...
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {rec.timestamp || rec.created_at || ''}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-60 text-gray-400">
                  <FiShield size={32} className="mb-2 opacity-50" />
                  <p className="text-sm">No blockchain records found</p>
                </div>
              )}
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Resolution Analytics
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Average resolution time by category</p>
                </div>
                <button
                  onClick={() => handleGeneratePDF('Resolution Analytics')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 text-white text-xs font-medium hover:bg-orange-700 transition-colors"
                >
                  <FiDownload size={12} />
                  Generate PDF
                </button>
              </div>

              {resolutionChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={resolutionChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="category"
                      tick={{ fontSize: 10, fill: '#6b7280' }}
                      angle={-30}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                    <Tooltip {...CHART_TOOLTIP_STYLE} />
                    <Area
                      type="monotone"
                      dataKey="avgDays"
                      stroke="#f97316"
                      fill="rgba(249, 115, 22, 0.15)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-72 text-gray-400 text-sm">
                  No resolution data available
                </div>
              )}
            </GlassCard>
          </div>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Resolution Time Comparison
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Days to resolve by category</p>
              </div>
            </div>
            {resolutionChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={resolutionChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <YAxis
                    type="category"
                    dataKey="category"
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    width={120}
                  />
                  <Tooltip {...CHART_TOOLTIP_STYLE} />
                  <Bar dataKey="avgDays" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-72 text-gray-400 text-sm">
                No data to display
              </div>
            )}
          </GlassCard>
        </>
      )}
    </div>
  );
}
