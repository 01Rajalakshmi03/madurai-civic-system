import React, { useState, useEffect } from 'react';
import { FiTrendingUp, FiAward, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { analyticsAPI } from '../../utils/api';

const WardPerformanceView = () => {
  const [wardRankings, setWardRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: 'resolution_rate', direction: 'desc' });

  useEffect(() => {
    const fetchWardRankings = async () => {
      try {
        setLoading(true);
        const data = await analyticsAPI.wardRanking();
        setWardRankings((data.data?.wards || []).map(w => ({
          ward: w._id,
          total_complaints: w.total,
          resolved: w.resolved,
          pending: w.pending,
          resolution_rate: w.total > 0 ? Math.round((w.resolved / w.total) * 1000) / 10 : 0
        })));
      } catch (error) {
        console.error('Error fetching ward rankings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchWardRankings();
  }, []);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const sortedRankings = [...wardRankings].sort((a, b) => {
    if (sortConfig.direction === 'desc') {
      return a[sortConfig.key] > b[sortConfig.key] ? -1 : 1;
    }
    return a[sortConfig.key] < b[sortConfig.key] ? -1 : 1;
  });

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'desc' ? <FiArrowDown size={14} /> : <FiArrowUp size={14} />;
  };

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
            Ward Performance Rankings
          </h1>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>

        <div className={`card rounded-xl overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                  <th className={`text-left py-4 px-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Rank</th>
                  <th 
                    className={`text-left py-4 px-6 cursor-pointer ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                    onClick={() => handleSort('ward')}
                  >
                    <div className="flex items-center gap-2">
                      Ward {getSortIcon('ward')}
                    </div>
                  </th>
                  <th 
                    className={`text-left py-4 px-6 cursor-pointer ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                    onClick={() => handleSort('total_complaints')}
                  >
                    <div className="flex items-center gap-2">
                      Total Complaints {getSortIcon('total_complaints')}
                    </div>
                  </th>
                  <th 
                    className={`text-left py-4 px-6 cursor-pointer ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                    onClick={() => handleSort('resolved')}
                  >
                    <div className="flex items-center gap-2">
                      Resolved {getSortIcon('resolved')}
                    </div>
                  </th>
                  <th 
                    className={`text-left py-4 px-6 cursor-pointer ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                    onClick={() => handleSort('pending')}
                  >
                    <div className="flex items-center gap-2">
                      Pending {getSortIcon('pending')}
                    </div>
                  </th>
                  <th 
                    className={`text-left py-4 px-6 cursor-pointer ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                    onClick={() => handleSort('resolution_rate')}
                  >
                    <div className="flex items-center gap-2">
                      Resolution Rate {getSortIcon('resolution_rate')}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedRankings.map((ward, index) => (
                  <tr 
                    key={ward.ward} 
                    className={`border-t ${
                      darkMode ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-200 hover:bg-gray-50'
                    } ${index < 3 ? (darkMode ? 'bg-blue-900/20' : 'bg-blue-50') : ''}`}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        {index < 3 ? (
                          <FiAward className={`${
                            index === 0 ? 'text-yellow-500' : 
                            index === 1 ? 'text-gray-400' : 
                            'text-amber-600'
                          }`} size={20} />
                        ) : (
                          <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {index + 1}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={`py-4 px-6 font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Ward {ward.ward}
                    </td>
                    <td className={`py-4 px-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {ward.total_complaints}
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-green-500 font-semibold">{ward.resolved}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-amber-500 font-semibold">{ward.pending}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              ward.resolution_rate >= 80 ? 'bg-green-500' :
                              ward.resolution_rate >= 50 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${ward.resolution_rate}%` }}
                          ></div>
                        </div>
                        <span className={`font-semibold ${
                          ward.resolution_rate >= 80 ? 'text-green-500' :
                          ward.resolution_rate >= 50 ? 'text-yellow-500' :
                          'text-red-500'
                        }`}>
                          {ward.resolution_rate.toFixed(1)}%
                        </span>
                      </div>
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

export default WardPerformanceView;