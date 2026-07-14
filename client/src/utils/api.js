import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.post('/auth/change-password', data),
};

export const complaintAPI = {
  create: (data) => {
    if (data instanceof FormData) {
      return api.post('/complaints', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.post('/complaints', data);
  },
  getAll: (params) => api.get('/complaints', { params }),
  getById: (id) => api.get(`/complaints/${id}`),
  update: (id, data) => api.put(`/complaints/${id}`, data),
  getStats: () => api.get('/complaints/stats'),
  getTimeline: (id) => api.get(`/complaints/${id}/timeline`),
  uploadImages: (id, data) =>
    api.post(`/complaints/${id}/images`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export const blockchainAPI = {
  connect: () => api.get('/blockchain/connect'),
  status: () => api.get('/blockchain/status'),
  store: (complaintId) => api.post('/blockchain/store', { complaint_id: complaintId }),
  verify: (complaintId) => api.get(`/blockchain/verify/${complaintId}`),
  getRecords: (params) => api.get('/blockchain/records', { params }),
  getComplaint: (complaintId) => api.get(`/blockchain/complaint/${complaintId}`),
};

export const adminAPI = {
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  getWards: () => api.get('/admin/wards'),
  createWard: (data) => api.post('/admin/wards', data),
  updateWard: (id, data) => api.put(`/admin/wards/${id}`, data),
  getOfficials: () => api.get('/admin/officials'),
  createOfficial: (data) => api.post('/admin/officials', data),
  getStats: () => api.get('/admin/stats'),
  getActivityLog: (params) => api.get('/admin/activity-log', { params }),
};

export const analyticsAPI = {
  byCategory: () => api.get('/analytics/complaints-by-category'),
  byWard: () => api.get('/analytics/complaints-by-ward'),
  monthlyTrends: (months) => api.get('/analytics/monthly-trends', { params: { months } }),
  monthlySummary: () => api.get('/analytics/monthly-summary'),
  resolutionTime: () => api.get('/analytics/resolution-time'),
  wardRanking: () => api.get('/analytics/ward-ranking'),
  sentimentAnalysis: () => api.get('/analytics/sentiment-analysis'),
  priorityDistribution: () => api.get('/analytics/priority-distribution'),
  citizenStats: () => api.get('/analytics/citizen-stats'),
  wardMemberStats: () => api.get('/analytics/ward-member-stats'),
  complaintsTrend: () => api.get('/analytics/monthly-trends', { params: { months: 6 } }),
  usersByRole: () => api.get('/admin/stats'),
};

export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markAllRead: () => api.post('/notifications/read-all'),
  markRead: (id) => api.post(`/notifications/${id}/read`),
  unreadCount: () => api.get('/notifications/unread-count'),
  delete: (id) => api.delete(`/notifications/${id}`),
};

export default api;
