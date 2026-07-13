import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiSearch, FiMapPin, FiCalendar, FiShield, FiStar, FiLoader, FiAlertCircle, FiCheck, FiClock, FiHash, FiChevronRight } from 'react-icons/fi';
import { complaintAPI } from '../../utils/api';

const statusConfig = {
  filed: { label: 'Filed', className: 'badge bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' },
  assigned: { label: 'Assigned', className: 'badge bg-blue-500/20 text-blue-600 dark:text-blue-400' },
  in_progress: { label: 'In Progress', className: 'badge bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' },
  resolved: { label: 'Resolved', className: 'badge bg-green-500/20 text-green-600 dark:text-green-400' },
  rejected: { label: 'Rejected', className: 'badge bg-red-500/20 text-red-600 dark:text-red-400' },
};

const categoryLabels = {
  road_damage: 'Road Damage',
  garbage_accumulation: 'Garbage Accumulation',
  water_leakage: 'Water Leakage',
  drainage_problem: 'Drainage Problem',
  streetlight_failure: 'Streetlight Failure',
  illegal_dumping: 'Illegal Dumping',
  infrastructure_damage: 'Infrastructure Damage',
  other: 'Other',
};

const timelineSteps = ['filed', 'assigned', 'in_progress', 'resolved'];

export default function TrackComplaint() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [searchId, setSearchId] = useState(id || '');
  const [complaint, setComplaint] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    if (id) {
      setSearchId(id);
      loadComplaint(id);
    }
  }, [id]);

  const loadComplaint = async (complaintId) => {
    setLoading(true);
    setError(null);
    setComplaint(null);
    setTimeline([]);
    setFeedbackSuccess(false);
    try {
      const [compRes, tlRes] = await Promise.all([
        complaintAPI.getById(complaintId),
        complaintAPI.getTimeline(complaintId).catch(() => ({ data: [] })),
      ]);
      const comp = compRes.data?.complaint || compRes;
      setComplaint(comp);
      setTimeline(tlRes.data?.timeline || []);
      if (comp.feedback?.rating) {
        setRating(comp.feedback.rating);
        setFeedbackComment(comp.feedback.comment || '');
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Complaint not found');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchId.trim()) {
      navigate(`/dashboard/track/${searchId.trim()}`);
      loadComplaint(searchId.trim());
    }
  };

  const submitFeedback = async () => {
    if (!rating) return;
    setFeedbackLoading(true);
    try {
      await complaintAPI.update(complaint.complaint_id, { action: 'feedback', rating, comment: feedbackComment });
      setFeedbackSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit feedback');
    } finally {
      setFeedbackLoading(false);
    }
  };

  const getStepIndex = (status) => timelineSteps.indexOf(status);

  const currentStepIndex = complaint ? getStepIndex(complaint.status) : -1;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Track Complaint</h1>

      <form onSubmit={handleSearch} className="glass-card p-4 flex gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder="Enter Complaint ID..."
            className="input-field w-full pl-10"
          />
        </div>
        <button type="submit" className="btn-primary px-6">Search</button>
      </form>

      {error && (
        <div className="glass-card flex items-center gap-3 p-4 border border-red-400/30 bg-red-500/10 rounded-xl">
          <FiAlertCircle className="text-red-500 shrink-0" />
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-20 gap-3 text-gray-500">
          <FiLoader className="animate-spin text-xl" /> Loading complaint details...
        </div>
      )}

      {!loading && complaint && (
        <div className="space-y-6">
          {/* Header */}
          <div className="card p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{complaint.title}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-mono flex items-center gap-1 mt-1">
                  <FiHash size={12} /> {complaint.complaint_id}
                </p>
              </div>
              <span className={(statusConfig[complaint.status] || statusConfig.filed).className + ' text-sm'}>
                {(statusConfig[complaint.status] || statusConfig.filed).label}
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4">{complaint.description}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="glass-card p-3 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Category</p>
                <p className="font-medium text-gray-900 dark:text-white">{categoryLabels[complaint.category] || complaint.category}</p>
              </div>
              <div className="glass-card p-3 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Ward</p>
                <p className="font-medium text-gray-900 dark:text-white">{complaint.ward}</p>
              </div>
              <div className="glass-card p-3 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Priority</p>
                <p className="font-medium text-gray-900 dark:text-white capitalize">{complaint.priority || 'medium'}</p>
              </div>
              <div className="glass-card p-3 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Filed</p>
                <p className="font-medium text-gray-900 dark:text-white">{new Date(complaint.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            {complaint.location?.coordinates && (
              <div className="flex items-center gap-2 mt-3 text-xs text-gray-500 dark:text-gray-400">
                <FiMapPin /> {complaint.location.coordinates[1]}, {complaint.location.coordinates[0]}
              </div>
            )}
          </div>

          {/* Status Timeline */}
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-6">Status Progress</h3>
            <div className="flex items-center justify-between relative">
              <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700" />
              <div className="absolute top-4 left-0 h-0.5 bg-primary-500 transition-all duration-500" style={{ width: `${Math.max(0, (currentStepIndex / (timelineSteps.length - 1)) * 100)}%` }} />
              {timelineSteps.map((step, idx) => {
                const completed = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                return (
                  <div key={step} className="relative z-10 flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                      completed ? 'bg-primary-600 border-primary-600 text-white' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400'
                    } ${isCurrent ? 'ring-4 ring-primary-500/20' : ''}`}>
                      {completed ? <FiCheck size={14} /> : <FiClock size={14} />}
                    </div>
                    <span className={`text-xs mt-2 capitalize ${completed ? 'text-primary-600 font-medium' : 'text-gray-400'}`}>
                      {step.replace('_', ' ')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timeline */}
          {timeline.length > 0 && (
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Activity Timeline</h3>
              <div className="space-y-4">
                {timeline.map((entry, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-primary-500 mt-1" />
                      {idx < timeline.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 dark:bg-gray-700 mt-1" />}
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{entry.action || entry.status || 'Update'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{entry.description || entry.message || ''}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1">
                        <FiCalendar size={10} /> {new Date(entry.timestamp || entry.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Images */}
          {complaint.images && complaint.images.length > 0 && (
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Attached Images</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {complaint.images.map((img, idx) => (
                  <button key={idx} onClick={() => setSelectedImage(img)} className="rounded-xl overflow-hidden aspect-square bg-gray-100 dark:bg-gray-800">
                    <img src={img} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedImage && (
            <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
              <img src={selectedImage} alt="" className="max-w-full max-h-[90vh] rounded-xl" />
            </div>
          )}

          {/* Blockchain Verification */}
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <FiShield className="text-primary-600" /> Blockchain Verification
            </h3>
            <div className="glass-card p-4 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Status</span>
                <span className={complaint.blockchain_tx_hash ? 'badge-success' : 'badge bg-gray-500/20 text-gray-600'}>
                  {complaint.blockchain_tx_hash ? 'Recorded on Chain' : 'Pending Verification'}
                </span>
              </div>
              {complaint.blockchain_tx_hash && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Hash</span>
                  <span className="font-mono text-xs text-gray-700 dark:text-gray-300 truncate max-w-[60%] text-right">{complaint.blockchain_tx_hash}</span>
                </div>
              )}
              {complaint.blockchain_block_number && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Block Number</span>
                  <span className="text-gray-700 dark:text-gray-300">{complaint.blockchain_block_number}</span>
                </div>
              )}
            </div>
          </div>

          {/* Feedback */}
          {complaint.status === 'resolved' && (
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Rate Your Experience</h3>
              {feedbackSuccess ? (
                <div className="glass-card p-4 rounded-xl text-center text-green-600 dark:text-green-400 font-medium">
                  Thank you for your feedback!
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(star)}
                        className="text-2xl transition-colors"
                      >
                        <FiStar
                          className={`${(hoverRating || rating) >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                        />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    placeholder="Leave a comment (optional)..."
                    rows={3}
                    className="input-field w-full resize-none"
                  />
                  <button onClick={submitFeedback} disabled={!rating || feedbackLoading} className="btn-primary flex items-center gap-2 disabled:opacity-50">
                    {feedbackLoading ? <FiLoader className="animate-spin" /> : <FiStar />}
                    Submit Feedback
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
