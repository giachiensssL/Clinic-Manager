import { NavLink } from 'react-router-dom';
import { 
  Home, CalendarPlus, Calendar, FileText, Pill, 
  Activity, CreditCard, MessageSquare, Bell, Settings,
  HeartPulse, ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const MENU_ITEMS = [
  { icon: Home, label: 'Trang chủ', path: '/portal', exact: true },
  { icon: CalendarPlus, label: 'Đặt lịch khám', path: '/portal/appointments/create' },
  { icon: Calendar, label: 'Lịch hẹn của tôi', path: '/portal/appointments', exact: true },
  { icon: FileText, label: 'Hồ sơ sức khỏe', path: '/portal/health-record' },
  { icon: Pill, label: 'Đơn thuốc', path: '/portal/prescriptions' },
  { icon: Activity, label: 'Kết quả xét nghiệm', path: '/portal/lab-results' },
  { icon: CreditCard, label: 'Thanh toán', path: '/portal/payments' },
  { icon: MessageSquare, label: 'Tư vấn sức khỏe (AI)', path: '/portal/ai-assistant' },
  { icon: Bell, label: 'Thông báo', path: '/portal/notifications' },
  { icon: Settings, label: 'Cài đặt', path: '/portal/settings' },
];

export default function PatientSidebar({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();

  return (
    <div className="w-full h-full bg-white flex flex-col border-r border-[#E2E8F0] shadow-sm relative">
      {/* Brand */}
      <div className="flex-shrink-0 px-6 py-6 border-b border-[#F1F5F9]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#0D6EFD] rounded-lg flex items-center justify-center">
            <HeartPulse className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xl text-[#0B3B78] leading-tight">AI Clinic</h1>
            <p className="text-xs text-[#64748B]">Vì sức khỏe của bạn</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin">
        {MENU_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.exact}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              isActive 
                ? "bg-[#0D6EFD] text-white shadow-md shadow-blue-500/20" 
                : "text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0B3B78]"
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </div>

      {/* AI Assistant Banner */}
      <div className="flex-shrink-0 p-4 m-4 bg-gradient-to-br from-[#0D6EFD] to-[#0B5ED7] rounded-xl text-white relative overflow-hidden shadow-lg shadow-blue-500/30">
        <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-white/20 rounded-md">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-bold text-sm">AI Assistant</h3>
          </div>
          <p className="text-xs text-blue-100 mb-3 opacity-90">Luôn bên bạn 24/7</p>
          <button 
            onClick={() => navigate('/portal/ai-assistant')}
            className="w-full py-2 bg-white text-[#0D6EFD] rounded-lg text-xs font-bold hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5"
          >
            Nhắn tin ngay
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
