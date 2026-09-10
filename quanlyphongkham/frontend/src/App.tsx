import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import AppLayout from './components/layout/AppLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PatientsList from './pages/patient/PatientsList';
import PatientDetail from './pages/patient/PatientDetail';
import AIAssistant from './pages/AIAssistant';
import AppointmentsList from './pages/appointments/AppointmentsList';
import DoctorsList from './pages/doctors/DoctorsList';
import EMRWorkspace from './pages/emr/EMRWorkspace';
import PrescriptionsList from './pages/prescriptions/PrescriptionsList';
import BillingList from './pages/billing/BillingList';
import BillingDetail from './pages/billing/BillingDetail';
import Reports from './pages/reports/Reports';
import AuditLogs from './pages/admin/AuditLogs';
import AISecurityCenter from './pages/admin/AISecurityCenter';
import UserManagement from './pages/admin/UserManagement';
import PatientPortal from './pages/portal/PatientPortal';

const ProtectedRoute = ({ children, roles }: { children: React.ReactNode; roles?: string[] }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && roles.length > 0 && user && !roles.includes(user.role))
    return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          
          {/* Patients */}
          <Route path="patients" element={<ProtectedRoute roles={['admin','doctor','receptionist']}><PatientsList /></ProtectedRoute>} />
          <Route path="patients/:id" element={<ProtectedRoute roles={['admin','doctor','receptionist']}><PatientDetail /></ProtectedRoute>} />
          
          {/* Appointments */}
          <Route path="appointments" element={<ProtectedRoute roles={['admin','doctor','receptionist', 'patient']}><AppointmentsList /></ProtectedRoute>} />
          
          {/* Doctors */}
          <Route path="doctors" element={<ProtectedRoute roles={['admin','receptionist']}><DoctorsList /></ProtectedRoute>} />
          
          {/* EMR */}
          <Route path="emr" element={<ProtectedRoute roles={['admin','doctor']}><EMRWorkspace /></ProtectedRoute>} />
          <Route path="emr/:id" element={<ProtectedRoute roles={['admin','doctor']}><EMRWorkspace /></ProtectedRoute>} />
          
          {/* Prescriptions */}
          <Route path="prescriptions" element={<ProtectedRoute roles={['admin','doctor']}><PrescriptionsList /></ProtectedRoute>} />
          
          {/* Billing */}
          <Route path="billing" element={<ProtectedRoute roles={['admin','accountant']}><BillingList /></ProtectedRoute>} />
          <Route path="billing/:id" element={<ProtectedRoute roles={['admin','accountant']}><BillingDetail /></ProtectedRoute>} />
          
          {/* AI Assistant */}
          <Route path="ai-assistant" element={<AIAssistant />} />
          
          {/* Reports */}
          <Route path="reports" element={<ProtectedRoute roles={['admin','accountant']}><Reports /></ProtectedRoute>} />
          
          {/* Admin */}
          <Route path="admin/audit-logs" element={<ProtectedRoute roles={['admin']}><AuditLogs /></ProtectedRoute>} />
          <Route path="admin/ai-security" element={<ProtectedRoute roles={['admin']}><AISecurityCenter /></ProtectedRoute>} />
          <Route path="admin/users" element={<ProtectedRoute roles={['admin']}><UserManagement /></ProtectedRoute>} />
          
          {/* Patient Portal */}
          <Route path="portal" element={<ProtectedRoute roles={['patient']}><PatientPortal /></ProtectedRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
