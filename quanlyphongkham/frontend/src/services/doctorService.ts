import api from './api';

export const doctorService = {
  getMe: () => api.get('/doctor/me'),
  getDashboardStats: () => api.get('/doctor/dashboard/stats'),
  getTodayAppointments: () => api.get('/doctor/appointments/today'),
  getRecentActivity: (limit = 10) => api.get('/doctor/dashboard/recent-activity', { params: { limit } }),
  searchPatients: (q: string, limit = 10) => api.get('/doctor/patients/search', { params: { q, limit } }),
};
