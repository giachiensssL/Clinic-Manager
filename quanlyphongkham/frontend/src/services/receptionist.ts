import api from './api';

export const receptionistApi = {
  getMe: () => api.get('/receptionist/me').then(res => res.data),
  getStats: () => api.get('/receptionist/dashboard/stats').then(res => res.data),
  getRecentActivity: () => api.get('/receptionist/dashboard/recent-activity').then(res => res.data),
  
  getAppointments: (params?: any) => api.get('/receptionist/appointments', { params }).then(res => res.data),
  createAppointment: (data: any) => api.post('/receptionist/appointments', data).then(res => res.data),
  checkInAppointment: (id: string) => api.post(`/receptionist/appointments/${id}/check-in`).then(res => res.data),
  updateAppointmentStatus: (id: string, status: string, reason?: string) => api.patch(`/receptionist/appointments/${id}/status`, { status, reason }).then(res => res.data),
  
  getPatients: (params?: any) => api.get('/receptionist/patients', { params }).then(res => res.data),
  getPatient: (id: string) => api.get(`/receptionist/patients/${id}`).then(res => res.data),
  createPatient: (data: any) => api.post('/receptionist/patients', data).then(res => res.data),
  
  getQueue: () => api.get('/receptionist/queue').then(res => res.data),
  updateQueueStatus: (id: string, status: string) => api.patch(`/receptionist/queue/${id}/status`, { status }).then(res => res.data),
  
  getPayments: () => api.get('/receptionist/payments').then(res => res.data),
  processPayment: (billingId: string, amount: number, method: string) => api.post(`/receptionist/payments/${billingId}/pay`, { amount, method }).then(res => res.data),
  
  getNotifications: () => api.get('/receptionist/notifications').then(res => res.data),
  markNotificationRead: (id: string) => api.patch(`/receptionist/notifications/${id}/read`).then(res => res.data),
};
