import React, { useState, useEffect } from 'react';
import { FiUserPlus, FiRefreshCw } from 'react-icons/fi';
import { complaintAPI, adminAPI } from '../../utils/api';

const CorpAssign = () => {
  const [unassignedComplaints, setUnassignedComplaints] = useState([]);
  const [wardMembers, setWardMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [selectedOfficer, setSelectedOfficer] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [complaintsData, officialsData] = await Promise.all([
        complaintAPI.getAll({ status: 'filed' }),
        adminAPI.getOfficials()
      ]);
      setUnassignedComplaints(complaintsData.data?.complaints || []);
      setWardMembers((officialsData.data?.officials || []).filter(official => official.role === 'ward_member'));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedComplaint || !selectedOfficer) return;
    try {
      setAssigning(true);
      await complaintAPI.update(selectedComplaint.complaint_id, {
        action: 'assign',
        officer_id: selectedOfficer
      });
      setShowAssignModal(false);
      setSelectedComplaint(null);
      setSelectedOfficer('');
      fetchData();
    } catch (error) {
      console.error('Error assigning complaint:', error);
    } finally {
      setAssigning(false);
    }
  };

  const getFilteredMembers = (ward) => {
    return wardMembers.filter(member => member.ward === ward);
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
            Assign Complaints
          </h1>
          <div className="flex gap-4">
            <button
              onClick={fetchData}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              <FiRefreshCw size={16} /> Refresh
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              {darkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        </div>

        {unassignedComplaints.length === 0 ? (
          <div className={`card rounded-xl p-8 text-center ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <FiUserPlus size={48} className={`mx-auto mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              No Unassigned Complaints
            </h3>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              All complaints have been assigned to officers.
            </p>
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
                    <th className={`text-left py-3 px-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Priority</th>
                    <th className={`text-left py-3 px-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Created</th>
                    <th className={`text-left py-3 px-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {unassignedComplaints.map((complaint) => (
                    <tr key={complaint.complaint_id} className={`border-t ${darkMode ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <td className={`py-3 px-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{complaint.complaint_id}</td>
                      <td className={`py-3 px-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{complaint.title}</td>
                      <td className={`py-3 px-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{complaint.citizen_name}</td>
                      <td className={`py-3 px-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Ward {complaint.ward}</td>
                      <td className={`py-3 px-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{complaint.category}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          complaint.priority === 'low' ? 'bg-gray-100 text-gray-800' :
                          complaint.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          complaint.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {complaint.priority}
                        </span>
                      </td>
                      <td className={`py-3 px-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {new Date(complaint.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => {
                            setSelectedComplaint(complaint);
                            setSelectedOfficer('');
                            setShowAssignModal(true);
                          }}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
                        >
                          <FiUserPlus size={16} /> Assign
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showAssignModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`card rounded-xl p-6 w-96 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Assign Complaint
            </h3>
            <div className={`p-4 rounded-lg mb-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Complaint ID</p>
              <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {selectedComplaint.complaint_id}
              </p>
              <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Title</p>
              <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {selectedComplaint.title}
              </p>
              <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Ward</p>
              <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Ward {selectedComplaint.ward}
              </p>
            </div>
            
            <label className={`block text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Select Ward Member
            </label>
            <select
              value={selectedOfficer}
              onChange={(e) => setSelectedOfficer(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border mb-4 ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'
              }`}
            >
              <option value="">Select an officer</option>
              {getFilteredMembers(selectedComplaint.ward).map(member => (
                <option key={member.id} value={member.id}>
                  {member.name} ({member.email})
                </option>
              ))}
            </select>

            {getFilteredMembers(selectedComplaint.ward).length === 0 && (
              <p className={`text-sm mb-4 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                No ward members available for Ward {selectedComplaint.ward}
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleAssign}
                disabled={!selectedOfficer || assigning}
                className={`flex-1 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 ${
                  (!selectedOfficer || assigning) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {assigning ? 'Assigning...' : 'Assign'}
              </button>
              <button
                onClick={() => setShowAssignModal(false)}
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

export default CorpAssign;