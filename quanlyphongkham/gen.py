import os

pages = [
  {'path': 'appointments/PatientAppointments.tsx', 'title': 'Lịch hẹn của tôi', 'icon': 'Calendar'},
  {'path': 'appointments/PatientAppointmentCreate.tsx', 'title': 'Đặt lịch khám', 'icon': 'CalendarPlus'},
  {'path': 'health/PatientHealthRecord.tsx', 'title': 'Hồ sơ sức khỏe', 'icon': 'FileText'},
  {'path': 'prescriptions/PatientPrescriptions.tsx', 'title': 'Đơn thuốc của tôi', 'icon': 'Pill'},
  {'path': 'lab-results/PatientLabResults.tsx', 'title': 'Kết quả xét nghiệm', 'icon': 'Activity'},
  {'path': 'payments/PatientPayments.tsx', 'title': 'Thanh toán & Hóa đơn', 'icon': 'CreditCard'},
  {'path': 'ai/PatientAIAssistant.tsx', 'title': 'Tư vấn sức khỏe AI', 'icon': 'MessageSquare'},
  {'path': 'notifications/PatientNotifications.tsx', 'title': 'Thông báo', 'icon': 'Bell'},
  {'path': 'profile/PatientProfile.tsx', 'title': 'Hồ sơ cá nhân', 'icon': 'User'},
  {'path': 'settings/PatientSettings.tsx', 'title': 'Cài đặt hệ thống', 'icon': 'Settings'}
]

for p in pages:
    comp_name = p['path'].split('/')[-1].replace('.tsx', '')
    content = f'''import {{ {p['icon']} }} from "lucide-react";

export default function {comp_name}() {{
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-8 min-h-[500px]">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#F1F5F9]">
        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
          <{p['icon']} className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#0B3B78]">{p['title']}</h1>
          <p className="text-sm text-[#64748B]">Chức năng đang được phát triển hoặc cập nhật dữ liệu.</p>
        </div>
      </div>
      
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <{p['icon']} className="w-16 h-16 mb-4 opacity-20" />
        <p>Tính năng {p['title']} đang được hoàn thiện.</p>
      </div>
    </div>
  );
}}
'''
    with open('frontend/src/pages/portal/' + p['path'], 'w', encoding='utf-8') as f:
        f.write(content)
