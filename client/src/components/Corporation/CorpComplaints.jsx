import React, { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiChevronLeft, FiChevronRight, FiArrowUp, FiAlertTriangle } from 'react-icons/fi';
import { complaintAPI } from '../../utils/api';

const CorpComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    ward: '',
    priority: '',
    dateFrom: '',
    dateTo: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [newPriority, setNewPriority] = useState('');

  const statusOptions = ['filed', 'assigned', 'in_progress', 'resolved', 'rejected'];
  const categoryOptions = ['road_damage', 'garbage_accumulation', 'water_leakage', 'drainage_problem', 'streetlight_failure', 'illegal_dumping', 'infrastructure_damage', 'other'];
  const priorityOptions = ['low', 'medium', 'high', 'emergency'];

  useEffect(() => {
    fetchComplaints();
  }, [currentPage, filters, searchQuery]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        ...filters,
        search: searchQuery
      };
      const response = await complaintAPI.getAll(params);
      setComplaints(response.data?.complaints || []);
      setTotalPages(response.data?.pages || 1);
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handlePriorityChange = async () => {
    if (!selectedComplaint || !newPriority) return;
    try {
      await complaintAPI.update(selectedComplaint.complaint_id, {
        action: 'update_priority',
        priority: newPriority
      });
      setShowPriorityModal(false);
      setSelectedComplaint(null);
      setNewPriority('');
      fetchComplaints();
    } catch (error) {
      console.error('Error updating priority:', error);
    }
  };

  const handleEscalate = async (complaint) => {
    try {
      await complaintAPI.update(complaint.complaint_id, { action: 'escalate' });
      fetchComplaints();
    } catch (error) {
      console.error('Error escalating complaint:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      filed: 'bg-blue-100 text-blue-800',
      assigned: 'bg-purple-100 text-purple-800',
      in_progress: 'bg-indigo-100 text-indigo-800',
      resolved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      emergency: 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className={`min-h-screen p-6 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Complaints Management
          </h1>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>

        <div className={`card rounded-xl p-4 mb-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <FiSearch className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                type="text"
                placeholder="Search by ID or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`flex-1 px-4 py-2 rounded-lg border ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'
                }`}
              />
            </div>
            
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className={`px-4 py-2 rounded-lg border ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'
              }`}
            >
              <option value="">All Status</option>
              {statusOptions.map(status => (
                <option key={status} value={status}>{status.replace('_', ' ').toUpperCase()}</option>
              ))}
            </select>

            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className={`px-4 py-2 rounded-lg border ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'
              }`}
            >
              <option value="">All Categories</option>
              {categoryOptions.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <select
              value={filters.ward}
              onChange={(e) => handleFilterChange('ward', e.target.value)}
              className={`px-4 py-2 rounded-lg border ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'
              }`}
            >
              <option value="">All Wards</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(ward => (
                <option key={ward} value={ward}>Ward {ward}</option>
              ))}
            </select>

            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className={`px-4 py-2 rounded-lg border ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'
              }`}
            >
              <option value="">All Priorities</option>
              {priorityOptions.map(priority => (
                <option key={priority} value={priority}>{priority}</option>
              ))}
            </select>

            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className={`px-4 py-2 rounded-lg border ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'
              }`}
            />
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className={`px-4 py-2 rounded-lg border ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'
              }`}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className={`card rounded-xl overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                    <th className={`text-left py-3 px-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>ID</th>
                    <th className={`text-left py-3 px-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Title</th>
                    <th className={`text-left py-3 px-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Citizen</th>
                    <th className={`text-left py-3 px-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Ward</th>
                    <th className={`text-left py-3 px-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Category</th>
                    <th className={`text-left py-3 px-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Status</th>
                    <th className={`text-left py-3 px-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Priority</th>
                    <th className={`text-left py-3 px-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Created</th>
                    <th className={`text-left py-3 px-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.map((complaint) => (
                    <tr key={complaint.complaint_id} className={`border-t ${darkMode ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <td className={`py-3 px-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{complaint.complaint_id}</td>
                      <td className={`py-3 px-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{complaint.title}</td>
                      <td className={`py-3 px-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{complaint.citizen_name}</td>
                      <td className={`py-3 px-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Ward {complaint.ward}</td>
                      <td className={`py-3 px-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{complaint.category}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(complaint.status)}`}>
                          {complaint.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(complaint.priority)}`}>
                          {complaint.priority}
                        </span>
                      </td>
                      <td className={`py-3 px-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {new Date(complaint.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedComplaint(complaint);
                              setNewPriority(complaint.priority);
                              setShowPriorityModal(true);
                            }}
                            className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200"
                          >
                            <FiArrowUp size={16} />
                          </button>
                          <button
                            onClick={() => handleEscalate(complaint)}
                            className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200"
                          >
                            <FiAlertTriangle size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={`flex justify-between items-center p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''
                } ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                <FiChevronLeft /> Previous
              </button>
              <span className={darkMode ? 'text-white' : 'text-gray-900'}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''
                } ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Next <FiChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>

      {showPriorityModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`card rounded-xl p-6 w-96 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Change Priority
            </h3>
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border mb-4 ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'
              }`}
            >
              {priorityOptions.map(priority => (
                <option key={priority} value={priority}>{priority}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={handlePriorityChange}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
              >
                Update
              </button>
              <button
                onClick={() => setShowPriorityModal(false)}
                className={`flex-1 px-4 py-2 rounded-lg ${
                  darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CorpComplaints;