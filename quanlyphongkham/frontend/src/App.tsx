import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import AppLayout from './components/layout/AppLayout';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
const Dashboard = lazy(() => import('./pages/Dashboard'));
const PatientsList = lazy(() => import('./pages/patient/PatientsList'));
const PatientDetail = lazy(() => import('./pages/patient/PatientDetail'));
const AIAssistant = lazy(() => import('./pages/AIAssistant'));
const AppointmentsList = lazy(() => import('./pages/appointments/AppointmentsList'));
const DoctorsList = lazy(() => import('./pages/doctors/DoctorsList'));
const EMRWorkspace = lazy(() => import('./pages/emr/EMRWorkspace'));
const PrescriptionsList = lazy(() => import('./pages/prescriptions/PrescriptionsList'));
const BillingList = lazy(() => import('./pages/billing/BillingList'));
const BillingDetail = lazy(() => import('./pages/billing/BillingDetail'));
const Reports = lazy(() => import('./pages/reports/Reports'));
const AuditLogs = lazy(() => import('./pages/admin/AuditLogs'));
const AIAdminWorkspace = lazy(() => import('./pages/admin/AIAdminWorkspace'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const RolesManagement = lazy(() => import('./pages/admin/RolesManagement'));
const StaffManagement = lazy(() => import('./pages/admin/StaffManagement'));
const DepartmentsManagement = lazy(() => import('./pages/admin/DepartmentsManagement'));
const RoomsManagement = lazy(() => import('./pages/admin/RoomsManagement'));
const SchedulesManagement = lazy(() => import('./pages/admin/SchedulesManagement'));
const SystemNotifications = lazy(() => import('./pages/admin/SystemNotifications'));
const SystemSettings = lazy(() => import('./pages/admin/SystemSettings'));

// Patient Portal Pages
const PatientLayout = lazy(() => import('./pages/portal/layout/PatientLayout'));
const PatientDashboard = lazy(() => import('./pages/portal/dashboard/PatientDashboard'));
const PatientAppointments = lazy(() => import('./pages/portal/appointments/PatientAppointments'));
const PatientAppointmentCreate = lazy(() => import('./pages/portal/appointments/PatientAppointmentCreate'));
const PatientHealthRecord = lazy(() => import('./pages/portal/health/PatientHealthRecord'));
const PatientPrescriptions = lazy(() => import('./pages/portal/prescriptions/PatientPrescriptions'));
const PatientLabResults = lazy(() => import('./pages/portal/lab-results/PatientLabResults'));
const PatientPayments = lazy(() => import('./pages/portal/payments/PatientPayments'));
const PatientAIAssistant = lazy(() => import('./pages/portal/ai/PatientAIAssistant'));
const PatientNotifications = lazy(() => import('./pages/portal/notifications/PatientNotifications'));
const PatientProfile = lazy(() => import('./pages/portal/profile/PatientProfile'));
const PatientSettings = lazy(() => import('./pages/portal/settings/PatientSettings'));

// Doctor Portal - standalone layout
const DoctorLayout = lazy(() => import('./pages/doctor/layout/DoctorLayout'));
const DoctorDashboard = lazy(() => import('./pages/doctor/DoctorDashboard'));
const DoctorAppointments = lazy(() => import('./pages/doctor/DoctorAppointments'));
const DoctorPatientsList = lazy(() => import('./pages/doctor/DoctorPatientsList'));
const DoctorPatientProfile = lazy(() => import('./pages/doctor/DoctorPatientProfile'));
const DoctorEMR = lazy(() => import('./pages/doctor/DoctorEMR'));
const DoctorPrescriptions = lazy(() => import('./pages/doctor/DoctorPrescriptions'));
const DoctorLabResults = lazy(() => import('./pages/doctor/DoctorLabResults'));
const DoctorAIAssistant = lazy(() => import('./pages/doctor/DoctorAIAssistant'));
const DoctorNotifications = lazy(() => import('./pages/doctor/DoctorNotifications'));
const DoctorSettings = lazy(() => import('./pages/doctor/DoctorSettings'));
const DoctorReports = lazy(() => import('./pages/doctor/DoctorReports'));

// Receptionist Portal - standalone layout
const ReceptionistLayout = lazy(() => import('./pages/receptionist/layout/ReceptionistLayout'));
const ReceptionistDashboard = lazy(() => import('./pages/receptionist/ReceptionistDashboard'));
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


const ProtectedRoute = ({ children, roles }: { children: React.ReactNode; roles?: string[] }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  if (roles && roles.length > 0 && user) {
    const userRole = user.role.toLowerCase();
    if (!roles.map(r => r.toLowerCase()).includes(userRole)) {
      if (userRole === 'doctor') return <Navigate to="/doctor" replace />;
      if (userRole === 'patient') return <Navigate to="/portal" replace />;
      if (userRole === 'receptionist') return <Navigate to="/receptionist" replace />;
      return <Navigate to="/dashboard" replace />;
    }
  }
  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="flex h-screen items-center justify-center text-slate-500">Đang tải trang...</div>}>
      <Routes>
        {/* Public Homepage */}
        <Route path="/" element={<Home />} />

        {/* Login Page */}
        <Route path="/login" element={<Login />} />

        {/* Register Page */}
        <Route path="/register" element={<Register />} />

        {/* Doctor Portal - standalone layout */}
        <Route path="/doctor" element={<ProtectedRoute roles={['doctor']}><DoctorLayout /></ProtectedRoute>}>
          <Route index element={<DoctorDashboard />} />
          <Route path="appointments" element={<DoctorAppointments />} />
          <Route path="patients" element={<DoctorPatientsList />} />
          <Route path="patients/:id" element={<DoctorPatientProfile />} />
          <Route path="emr" element={<DoctorEMR />} />
          <Route path="emr/:id" element={<DoctorEMR />} />
          <Route path="prescriptions" element={<DoctorPrescriptions />} />
          <Route path="lab-results" element={<DoctorLabResults />} />
          <Route path="ai" element={<DoctorAIAssistant />} />
          <Route path="notifications" element={<DoctorNotifications />} />
          <Route path="settings" element={<DoctorSettings />} />
          <Route path="reports" element={<DoctorReports />} />
        </Route>

        {/* Patient Portal - standalone layout */}
        <Route path="/portal" element={<ProtectedRoute roles={['patient']}><PatientLayout /></ProtectedRoute>}>
          <Route index element={<PatientDashboard />} />
          <Route path="appointments" element={<PatientAppointments />} />
          <Route path="appointments/create" element={<PatientAppointmentCreate />} />
          <Route path="health-record" element={<PatientHealthRecord />} />
          <Route path="prescriptions" element={<PatientPrescriptions />} />
          <Route path="lab-results" element={<PatientLabResults />} />
          <Route path="payments" element={<PatientPayments />} />
          <Route path="ai-assistant" element={<PatientAIAssistant />} />
          <Route path="notifications" element={<PatientNotifications />} />
          <Route path="profile" element={<PatientProfile />} />
          <Route path="settings" element={<PatientSettings />} />
        </Route>

        {/* Receptionist Portal - standalone layout */}
        <Route path="/receptionist" element={<ProtectedRoute roles={['receptionist']}><ReceptionistLayout /></ProtectedRoute>}>
          <Route index element={<ReceptionistDashboard />} />
          
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

        </Route>

        {/* Protected Dashboard Routes wrapped in AppLayout */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="dashboard" element={<Dashboard />} />
          
          {/* Patients */}
          <Route path="patients" element={<ProtectedRoute roles={['doctor']}><PatientsList /></ProtectedRoute>} />
          <Route path="patients/:id" element={<ProtectedRoute roles={['doctor']}><PatientDetail /></ProtectedRoute>} />
          
          {/* Appointments */}
          <Route path="appointments" element={<ProtectedRoute roles={['doctor','patient']}><AppointmentsList /></ProtectedRoute>} />
          
          {/* Doctors */}
          <Route path="doctors" element={<ProtectedRoute roles={['admin']}><DoctorsList /></ProtectedRoute>} />
          
          {/* EMR */}
          <Route path="emr" element={<ProtectedRoute roles={['doctor']}><EMRWorkspace /></ProtectedRoute>} />
          <Route path="emr/:id" element={<ProtectedRoute roles={['doctor']}><EMRWorkspace /></ProtectedRoute>} />
          
          {/* Prescriptions */}
          <Route path="prescriptions" element={<ProtectedRoute roles={['doctor']}><PrescriptionsList /></ProtectedRoute>} />
          
          {/* Billing */}
          <Route path="billing" element={<ProtectedRoute roles={['accountant']}><BillingList /></ProtectedRoute>} />
          <Route path="billing/:id" element={<ProtectedRoute roles={['accountant']}><BillingDetail /></ProtectedRoute>} />
          
          {/* AI Assistant */}
          <Route path="ai-assistant" element={<AIAssistant />} />
          
          {/* Reports */}
          <Route path="reports" element={<ProtectedRoute roles={['accountant', 'admin']}><Reports /></ProtectedRoute>} />
          
          {/* Admin */}
          <Route path="admin/audit-logs" element={<ProtectedRoute roles={['admin']}><AuditLogs /></ProtectedRoute>} />
          <Route path="admin/ai" element={<ProtectedRoute roles={['admin']}><AIAdminWorkspace /></ProtectedRoute>} />
          <Route path="admin/users" element={<ProtectedRoute roles={['admin']}><UserManagement /></ProtectedRoute>} />
          <Route path="admin/roles" element={<ProtectedRoute roles={['admin']}><RolesManagement /></ProtectedRoute>} />
          <Route path="admin/staff" element={<ProtectedRoute roles={['admin']}><StaffManagement /></ProtectedRoute>} />
          <Route path="admin/departments" element={<ProtectedRoute roles={['admin']}><DepartmentsManagement /></ProtectedRoute>} />
          <Route path="admin/rooms" element={<ProtectedRoute roles={['admin']}><RoomsManagement /></ProtectedRoute>} />
          <Route path="admin/schedules" element={<ProtectedRoute roles={['admin']}><SchedulesManagement /></ProtectedRoute>} />
          <Route path="admin/notifications" element={<ProtectedRoute roles={['admin']}><SystemNotifications /></ProtectedRoute>} />
          <Route path="admin/settings" element={<ProtectedRoute roles={['admin']}><SystemSettings /></ProtectedRoute>} />
        </Route>
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
