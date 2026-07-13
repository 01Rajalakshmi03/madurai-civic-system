import React, { useState, useEffect } from 'react';
import {
  FiBarChart2, FiAlertTriangle, FiTrendingUp, FiShield, FiClipboard
} from 'react-icons/fi';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { analyticsAPI } from '../../utils/api';

const PIE_COLORS_SENTIMENT = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6'];
const PIE_COLORS_PRIORITY = ['#6B7280', '#3B82F6', '#F59E0B', '#EF4444'];
const BAR_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

function ChartCard({ title, icon: Icon, iconColor, children, loading }) {
  return (
    <div className="glass-card p-6 rounded-2xl">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <Icon className={iconColor} /> {title}
      </h3>
      {loading ? (
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
      ) : (
        children
      )}
    </div>
  );
}

export default function AIAnalytics() {
  const [sentiment, setSentiment] = useState([]);
  const [priority, setPriority] = useState([]);
  const [category, setCategory] = useState([]);
  const [confidence, setConfidence] = useState(null);
  const [duplicates, setDuplicates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [sentRes, priRes, catRes, confRes, dupRes] = await Promise.allSettled([
        analyticsAPI.sentimentAnalysis(),
        analyticsAPI.priorityDistribution(),
        analyticsAPI.byCategory(),
        analyticsAPI.confidenceMetrics ? analyticsAPI.confidenceMetrics() : Promise.resolve({ data: null }),
        analyticsAPI.duplicateAlerts ? analyticsAPI.duplicateAlerts() : Promise.resolve({ data: [] }),
      ]);

      if (sentRes.status === 'fulfilled') setSentiment(sentRes.value.data?.sentiments || []);
      if (priRes.status === 'fulfilled') setPriority(priRes.value.data?.priorities || []);
      if (catRes.status === 'fulfilled') setCategory(catRes.value.data?.categories || []);
      if (confRes.status === 'fulfilled') setConfidence(confRes.value.data);
      if (dupRes.status === 'fulfilled') setDuplicates(dupRes.value.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <FiBarChart2 className="text-blue-500" /> AI Analytics
          </h1>
          <p className="text-gray-500 dark:text-gray-400">Intelligent insights and metrics</p>
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

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentiment Distribution */}
        <ChartCard title="Sentiment Distribution" icon={FiTrendingUp} iconColor="text-green-500" loading={loading}>
          {sentiment.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-400">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={sentiment} dataKey="count" nameKey="sentiment" cx="50%" cy="50%" outerRadius={100} label={({ sentiment, percent }) => `${sentiment} (${(percent * 100).toFixed(0)}%)`}>
                  {sentiment.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS_SENTIMENT[i % PIE_COLORS_SENTIMENT.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#F3F4F6' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Priority Distribution */}
        <ChartCard title="Priority Distribution" icon={FiShield} iconColor="text-orange-500" loading={loading}>
          {priority.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-400">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={priority} dataKey="count" nameKey="priority" cx="50%" cy="50%" outerRadius={100} label={({ priority, percent }) => `${priority} (${(percent * 100).toFixed(0)}%)`}>
                  {priority.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS_PRIORITY[i % PIE_COLORS_PRIORITY.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#F3F4F6' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Category Distribution */}
        <ChartCard title="Complaints by Category" icon={FiClipboard} iconColor="text-blue-500" loading={loading}>
          {category.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-400">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={category}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#9CA3AF' }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#F3F4F6' }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {category.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* AI Confidence Metrics */}
        <ChartCard title="AI Confidence Metrics" icon={FiBarChart2} iconColor="text-purple-500" loading={loading}>
          {!confidence ? (
            <div className="h-64 flex items-center justify-center text-gray-400">No data available</div>
          ) : (
            <div className="space-y-5 h-64 flex flex-col justify-center">
              {[
                { label: 'Sentiment Accuracy', value: confidence.sentiment_accuracy || confidence.sentimentAccuracy || 0, color: 'bg-green-500' },
                { label: 'Priority Prediction', value: confidence.priority_prediction || confidence.priorityPrediction || 0, color: 'bg-blue-500' },
                { label: 'Category Classification', value: confidence.category_classification || confidence.categoryClassification || 0, color: 'bg-purple-500' },
                { label: 'Duplicate Detection', value: confidence.duplicate_detection || confidence.duplicateDetection || 0, color: 'bg-amber-500' },
              ].map((metric) => {
                const pct = Math.min(100, Math.max(0, metric.value));
                return (
                  <div key={metric.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-300">{metric.label}</span>
                      <span className="font-semibold text-gray-800 dark:text-white">{pct.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${metric.color} transition-all duration-500`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ChartCard>
      </div>

      {/* Duplicate Alerts */}
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <FiAlertTriangle className="text-amber-500" /> Duplicate Complaint Alerts
        </h3>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : duplicates.length === 0 ? (
          <div className="py-8 text-center">
            <FiShield className="text-3xl text-green-400 mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400">No duplicate alerts detected</p>
            <p className="text-xs text-gray-400 mt-1">All complaints appear to be unique</p>
          </div>
        ) : (
          <div className="space-y-3">
            {duplicates.map((dup, idx) => (
              <div key={dup._id || dup.id || idx} className="flex items-center gap-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/40">
                  <FiAlertTriangle className="text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-white">
                    {dup.message || `Potential duplicate: ${dup.complaint_1 || ''} & ${dup.complaint_2 || ''}`}
                  </p>
                  {dup.similarity && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Similarity: {(dup.similarity * 100).toFixed(0)}%
                    </p>
                  )}
                </div>
                <span className="px-2.5 py-1 bg-amber-200 dark:bg-amber-800/40 text-amber-800 dark:text-amber-200 text-xs font-medium rounded-full flex-shrink-0">
                  {dup.status || 'flagged'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
