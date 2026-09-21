import os

base_dir = "src/pages/receptionist"
os.makedirs(f"{base_dir}", exist_ok=True)
os.makedirs(f"{base_dir}/layout", exist_ok=True)

# 1. Update App.tsx
app_tsx_path = "src/App.tsx"
with open(app_tsx_path, "r", encoding="utf-8") as f:
    app_tsx = f.read()

# Add imports
imports = """
const ReceptionistAppointments = lazy(() => import('./pages/receptionist/ReceptionistAppointments'));
const ReceptionistAppointmentCreate = lazy(() => import('./pages/receptionist/ReceptionistAppointmentCreate'));
const ReceptionistPatients = lazy(() => import('./pages/receptionist/ReceptionistPatients'));
const ReceptionistPatientProfile = lazy(() => import('./pages/receptionist/ReceptionistPatientProfile'));
const ReceptionistQueue = lazy(() => import('./pages/receptionist/ReceptionistQueue'));
const ReceptionistPayments = lazy(() => import('./pages/receptionist/ReceptionistPayments'));
const ReceptionistHealthRecords = lazy(() => import('./pages/receptionist/ReceptionistHealthRecords'));
const ReceptionistAI = lazy(() => import('./pages/receptionist/ReceptionistAI'));
const ReceptionistNotifications = lazy(() => import('./pages/receptionist/ReceptionistNotifications'));
const ReceptionistSettings = lazy(() => import('./pages/receptionist/ReceptionistSettings'));
"""

if "ReceptionistQueue" not in app_tsx:
    app_tsx = app_tsx.replace("const ReceptionistDashboard = lazy(() => import('./pages/receptionist/ReceptionistDashboard'));", 
                              "const ReceptionistDashboard = lazy(() => import('./pages/receptionist/ReceptionistDashboard'));" + imports)

# Add routes
routes = """
          <Route path="appointments" element={<ReceptionistAppointments />} />
          <Route path="appointments/create" element={<ReceptionistAppointmentCreate />} />
          <Route path="patients" element={<ReceptionistPatients />} />
          <Route path="patients/:id" element={<ReceptionistPatientProfile />} />
          <Route path="queue" element={<ReceptionistQueue />} />
          <Route path="payments" element={<ReceptionistPayments />} />
          <Route path="health-records" element={<ReceptionistHealthRecords />} />
          <Route path="ai" element={<ReceptionistAI />} />
          <Route path="notifications" element={<ReceptionistNotifications />} />
          <Route path="settings" element={<ReceptionistSettings />} />
"""

if "path=\"queue\" element={<ReceptionistQueue />}" not in app_tsx:
    app_tsx = app_tsx.replace(
        "{/* We will add other routes later if needed */}", 
        routes
    )

with open(app_tsx_path, "w", encoding="utf-8") as f:
    f.write(app_tsx)


# 2. Receptionist Layout
layout_tsx = """import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { LayoutDashboard, Calendar, Users, ListOrdered, CreditCard, FileText, Bot, Bell, Settings, LogOut, HeartPulse } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import toast from 'react-hot-toast';

export default function ReceptionistLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Đã đăng xuất');
  };

  const navItems = [
    { name: 'Trang chủ', path: '/receptionist', end: true, icon: LayoutDashboard },
    { name: 'Đặt lịch khám', path: '/receptionist/appointments/create', end: false, icon: Calendar },
    { name: 'Lịch hẹn', path: '/receptionist/appointments', end: true, icon: Calendar },
    { name: 'Quản lý bệnh nhân', path: '/receptionist/patients', end: false, icon: Users },
    { name: 'Hàng đợi', path: '/receptionist/queue', end: false, icon: ListOrdered },
    { name: 'Thanh toán', path: '/receptionist/payments', end: false, icon: CreditCard },
    { name: 'Hồ sơ sức khỏe', path: '/receptionist/health-records', end: false, icon: FileText },
    { name: 'Tư vấn sức khỏe (AI)', path: '/receptionist/ai', end: false, icon: Bot },
    { name: 'Thông báo', path: '/receptionist/notifications', end: false, icon: Bell },
    { name: 'Cài đặt', path: '/receptionist/settings', end: false, icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col fixed inset-y-0 z-10">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <HeartPulse className="h-6 w-6 text-blue-500 mr-2" />
          <span className="text-white font-bold text-lg">AI Clinic Lễ Tân</span>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
        
        {/* AI Assistant Banner */}
        <div className="p-4 mx-3 mb-4 bg-slate-800 rounded-lg">
          <div className="flex items-center mb-2">
            <Bot className="h-5 w-5 text-blue-400 mr-2" />
            <span className="text-sm font-semibold text-white">AI Assistant</span>
          </div>
          <p className="text-xs text-slate-400 mb-3">Trợ lý hỗ trợ lễ tân</p>
          <Button variant="secondary" size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white border-0" onClick={() => navigate('/receptionist/ai')}>
            Nói chuyện ngay
          </Button>
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-slate-700 text-slate-300">LT</AvatarFallback>
            </Avatar>
            <div className="ml-3 flex-1 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user?.username}</p>
              <p className="text-xs text-slate-400 truncate">Lễ tân</p>
            </div>
            <button onClick={handleLogout} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pl-64 flex flex-col min-h-screen">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10">
          <h1 className="text-xl font-semibold text-slate-800">Lễ Tân Portal</h1>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="relative text-slate-500" onClick={() => navigate('/receptionist/notifications')}>
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500"></span>
            </Button>
            <div className="flex items-center gap-2">
               <Avatar className="h-8 w-8">
                 <AvatarFallback>LT</AvatarFallback>
               </Avatar>
               <span className="text-sm font-medium">{user?.username}</span>
            </div>
          </div>
        </header>
        <div className="flex-1 p-6 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
"""

with open(f"{base_dir}/layout/ReceptionistLayout.tsx", "w", encoding="utf-8") as f:
    f.write(layout_tsx)

# Create API Service
api_service = """import api from './api';

export const receptionistApi = {
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
"""
with open("src/services/receptionist.ts", "w", encoding="utf-8") as f:
    f.write(api_service)

print("done")
