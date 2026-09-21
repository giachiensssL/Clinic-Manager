import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/v1` : '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const res = await axios.post(`${api.defaults.baseURL}/auth/refresh`, { refresh_token: refreshToken });
          localStorage.setItem('access_token', res.data.access_token);
          localStorage.setItem('refresh_token', res.data.refresh_token);
          originalRequest.headers.Authorization = `Bearer ${res.data.access_token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data: any) => api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

export const patientsAPI = {
  getAll: (params?: any) => api.get('/patients', { params }),
  getById: (id: string) => api.get(`/patients/${id}`),
  getMe: () => api.get('/patients/me'),
  create: (data: any) => api.post('/patients', data),
  update: (id: string, data: any) => api.put(`/patients/${id}`, data),
  delete: (id: string) => api.delete(`/patients/${id}`),
};

export const appointmentsAPI = {
  getAll: (params: any) => api.get('/appointments', { params }),
  create: (data: any) => api.post('/appointments', data),
  updateStatus: (id: string, status: string, reason?: string) => api.patch(`/appointments/${id}/status`, null, { params: { new_status: status, cancellation_reason: reason } }),
};

export const doctorsAPI = {
  getAll: (params?: any) => api.get('/doctors', { params }),
  getById: (id: string) => api.get(`/doctors/${id}`),
  getSlots: (id: string, date: string) => api.get(`/doctors/${id}/slots`, { params: { date } }),
};

export const emrAPI = {
  getConsultation: (id: string) => api.get(`/emr/${id}`),
  getByAppointment: (appointmentId: string) => api.get(`/emr/appointment/${appointmentId}`),
  createConsultation: (data: any) => api.post('/emr', null, { params: data }),
  updateConsultation: (id: string, data: any) => api.put(`/emr/${id}`, null, { params: data }),
  signAndLock: (id: string) => api.post(`/emr/${id}/sign`),
  getByPatient: (patientId: string) => api.get(`/emr/patient/${patientId}`),
};

export const prescriptionsAPI = {
  getAll: (params?: any) => api.get('/prescriptions', { params }),
  getById: (id: string) => api.get(`/prescriptions/${id}`),
  create: (data: any) => api.post('/prescriptions', null, { params: data }),
  addItem: (id: string, data: any) => api.post(`/prescriptions/${id}/items`, null, { params: data }),
  dispense: (id: string) => api.post(`/prescriptions/${id}/dispense`),
};

export const billingAPI = {
  getAll: (params?: any) => api.get('/billing', { params }),
  getById: (id: string) => api.get(`/billing/${id}`),
  create: (data: any) => api.post('/billing', null, { params: data }),
  recordPayment: (id: string, data: any) => api.post(`/billing/${id}/payments`, null, { params: data }),
};

export const aiAPI = {
  chat: (data: { 
    message: string; 
    conversation_id?: string;
    action_confirmed?: boolean;
    pending_tool_call?: any;
  }) => api.post('/ai/chat', data),
  summarize: (patientId: string) => api.post('/ai/summarize', { patient_id: patientId }),
  
  // Conversations
  getConversations: () => api.get('/ai/conversations'),
  getConversationDetail: (id: string) => api.get(`/ai/conversations/${id}`),
  createConversation: (data?: { title: string }) => api.post('/ai/conversations', data || {}),
  deleteConversation: (id: string) => api.delete(`/ai/conversations/${id}`),

  streamChat: async (message: string, conversationId?: string) => {
    const token = localStorage.getItem('access_token');
    const base = import.meta.env.VITE_API_URL || '';
    const params = new URLSearchParams({ message });
    if (conversationId) params.append('conversation_id', conversationId);
    
    return fetch(`${base}/api/v1/ai/chat/stream?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });
  },
};

export const reportsAPI = {
  getStats: (params?: any) => api.get('/reports/stats', { params }),
  getRevenue: (params?: any) => api.get('/reports/revenue', { params }),
};

export const adminAPI = {
  getAuditLogs: (params?: any) => api.get('/admin/audit-logs', { params }),
  getUsers: (params?: any) => api.get('/admin/users', { params }),
  getAISecurity: (params?: any) => api.get('/admin/ai-security', { params }),
  getGuardrails: () => api.get('/admin/guardrails'),
  updateGuardrail: (id: string, data: any) => api.put(`/admin/guardrails/${id}`, data),
  createUser: (data: any) => api.post('/admin/users', data),
  updateUserRole: (id: string, role: string) => api.put(`/admin/users/${id}/role`, { role }),
  toggleUserStatus: (id: string) => api.put(`/admin/users/${id}/status`),
};

export const notificationsAPI = {
  list: (params?: any) => api.get('/notifications', { params }),
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

export const labResultsAPI = {
  list: (params?: any) => api.get('/lab-results', { params }),
  getDetail: (id: string) => api.get(`/lab-results/${id}`),
};

export const doctorAPI = {
  getMe: () => api.get('/doctor/me'),
  getDashboardStats: () => api.get('/doctor/dashboard/stats'),
  getTodayAppointments: () => api.get('/doctor/appointments/today'),
  getRecentActivity: (limit = 10) => api.get('/doctor/dashboard/recent-activity', { params: { limit } }),
  searchPatients: (q: string) => api.get('/doctor/patients/search', { params: { q } }),
};

export const receptionistAPI = {
  getDashboardStats: () => api.get('/receptionist/dashboard/stats'),
  getTodayAppointments: () => api.get('/receptionist/appointments/today'),
  getWaitingPatients: () => api.get('/receptionist/patients/waiting'),
  getRecentActivity: (limit = 10) => api.get('/receptionist/dashboard/recent-activity', { params: { limit } }),
};

export default api;
