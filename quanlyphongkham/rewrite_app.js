const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf8');

// Add Suspense and lazy
content = content.replace("import { BrowserRouter", "import React, { Suspense, lazy } from 'react';\nimport { BrowserRouter");

// Replace all imports with lazy EXCEPT Login and AppLayout
const pagesToLazy = [
  'Dashboard', 'patient/PatientsList', 'patient/PatientDetail', 
  'AIAssistant', 'appointments/AppointmentsList', 'doctors/DoctorsList',
  'emr/EMRWorkspace', 'prescriptions/PrescriptionsList', 
  'billing/BillingList', 'billing/BillingDetail', 'reports/Reports',
  'admin/AuditLogs', 'admin/AISecurityCenter', 'admin/UserManagement',
  'portal/PatientPortal'
];

for (const page of pagesToLazy) {
  const componentName = page.split('/').pop();
  const importRegex = new RegExp(`import ${componentName} from '\\./pages/${page}';`, 'g');
  content = content.replace(importRegex, `const ${componentName} = lazy(() => import('./pages/${page}'));`);
}

// Wrap Routes in Suspense
content = content.replace(
  "<Routes>",
  "<Suspense fallback={<div className=\"flex h-screen items-center justify-center text-slate-500\">Đang tải trang...</div>}>\n      <Routes>"
);
content = content.replace(
  "</Routes>",
  "</Routes>\n      </Suspense>"
);

fs.writeFileSync('frontend/src/App.tsx', content);
