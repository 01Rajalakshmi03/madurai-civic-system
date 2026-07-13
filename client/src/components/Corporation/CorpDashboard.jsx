import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiAlertCircle, FiCheckCircle, FiClock, FiBarChart2, FiArrowRight } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { analyticsAPI, complaintAPI } from '../../utils/api';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const CorpDashboard = () => {
  const [stats, setStats] = useState(null);
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [resolutionData, trendsData, categoryStats, complaintsData] = await Promise.all([
          analyticsAPI.resolutionTime(),
          analyticsAPI.monthlyTrends(12),
          analyticsAPI.byCategory(),
          complaintAPI.getAll({ per_page: 5 })
        ]);
        setStats(resolutionData.data);
        setMonthlyTrends((trendsData.data?.trends || []).map(t => ({ month: `${t._id.year}-${String(t._id.month).padStart(2, '0')}`, count: t.count })));
        setCategoryData((categoryStats.data?.categories || []).map(c => ({ name: c._id, count: c.count })));
        setRecentComplaints(complaintsData.data?.complaints || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statCards = [
    { title: 'Categories Tracked', value: stats?.by_category?.length || 0, icon: <FiAlertCircle size={24} />, color: 'from-blue-500 to-blue-600' },
    { title: 'Resolved Categories', value: (stats?.by_category || []).filter(c => c.count > 0).length, icon: <FiCheckCircle size={24} />, color: 'from-green-500 to-green-600' },
    { title: 'Total Resolved', value: (stats?.by_category || []).reduce((sum, c) => sum + (c.count || 0), 0), icon: <FiClock size={24} />, color: 'from-amber-500 to-amber-600' },
    { title: 'Avg Resolution Time', value: `${Math.round(stats?.overall_avg_hours || 0)}h`, icon: <FiBarChart2 size={24} />, color: 'from-purple-500 to-purple-600' }
  ];

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Corporation Dashboard
          </h1>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <div key={index} className={`glass-card rounded-xl p-6 ${darkMode ? 'bg-gray-800/50' : 'bg-white'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{stat.title}</p>
                  <p className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg bg-gradient-to-r ${stat.color}`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className={`card rounded-xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Monthly Complaint Trends
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#E5E7EB'} />
                <XAxis dataKey="month" stroke={darkMode ? '#9CA3AF' : '#6B7280'} />
                <YAxis stroke={darkMode ? '#9CA3AF' : '#6B7280'} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                    border: `1px solid ${darkMode ? '#374151' : '#E5E7EB'}`,
                    borderRadius: '8px'
                  }}
                />
                <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className={`card rounded-xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Complaints by Category
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                    border: `1px solid ${darkMode ? '#374151' : '#E5E7EB'}`,
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`card rounded-xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Recent Complaints
            </h2>
            <Link to="/dashboard/complaints" className="text-blue-500 hover:text-blue-600 flex items-center gap-1">
              View All <FiArrowRight size={16} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                  <th className="text-left py-3 px-4">ID</th>
                  <th className="text-left py-3 px-4">Title</th>
                  <th className="text-left py-3 px-4">Ward</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Created</th>
                </tr>
              </thead>
              <tbody>
                {recentComplaints.map((complaint) => (
                  <tr key={complaint.complaint_id} className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <td className={`py-3 px-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{complaint.complaint_id}</td>
                    <td className={`py-3 px-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{complaint.title}</td>
                    <td className={`py-3 px-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{complaint.ward}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        complaint.status === 'resolved' ? 'bg-green-100 text-green-800' :
                        complaint.status === 'filed' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {complaint.status}
                      </span>
                    </td>
                    <td className={`py-3 px-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {new Date(complaint.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CorpDashboard;