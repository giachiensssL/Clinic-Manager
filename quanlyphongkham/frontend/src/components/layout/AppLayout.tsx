import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { 
  LayoutDashboard, Users, Calendar, Stethoscope, FileText, 
  Pill, CreditCard, Bot, BarChart3, ShieldCheck, Shield, UserCog, 
  LogOut, HeartPulse, Search, Bell, ChevronDown,
  User, Menu, X
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

const roleBadgeColor: Record<string, string> = {
  admin: 'bg-red-100 text-red-700',
  doctor: 'bg-blue-100 text-blue-700',
  receptionist: 'bg-green-100 text-green-700',
  accountant: 'bg-amber-100 text-amber-700',
  patient: 'bg-purple-100 text-purple-700',
};

const roleLabel: Record<string, string> = {
  admin: 'Quản trị viên',
  doctor: 'Bác sĩ',
  receptionist: 'Lễ tân',
  accountant: 'Kế toán',
  patient: 'Bệnh nhân',
};

export default function AppLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const allMenuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin','doctor','receptionist','accountant','patient'] },
    { path: '/portal', icon: User, label: 'Portal của tôi', roles: ['patient'] },
    { path: '/patients', icon: Users, label: 'Bệnh nhân', roles: ['admin','doctor','receptionist'] },
    { path: '/appointments', icon: Calendar, label: 'Lịch hẹn', roles: ['admin','doctor','receptionist','patient'] },
    { path: '/doctors', icon: Stethoscope, label: 'Bác sĩ', roles: ['admin','receptionist'] },
    { path: '/emr', icon: FileText, label: 'Hồ sơ bệnh án', roles: ['admin','doctor'] },
    { path: '/prescriptions', icon: Pill, label: 'Đơn thuốc', roles: ['admin','doctor'] },
    { path: '/billing', icon: CreditCard, label: 'Thanh toán', roles: ['admin','accountant'] },
    { path: '/ai-assistant', icon: Bot, label: 'Trợ lý AI', roles: ['admin','doctor','receptionist','accountant','patient'], isAI: true },
    { path: '/reports', icon: BarChart3, label: 'Báo cáo', roles: ['admin','accountant'] },
    { path: '/admin/audit-logs', icon: ShieldCheck, label: 'Nhật ký kiểm toán', roles: ['admin'], group: 'admin' },
    { path: '/admin/ai-security', icon: Shield, label: 'Bảo mật AI', roles: ['admin'], group: 'admin' },
    { path: '/admin/users', icon: UserCog, label: 'Người dùng', roles: ['admin'], group: 'admin' },
  ];

  const menuItems = allMenuItems.filter(item => user && item.roles.includes(user.role));
  const regularItems = menuItems.filter(i => !i.group);
  const adminItems = menuItems.filter(i => i.group === 'admin');

  const currentPage = menuItems.find(i => location.pathname.startsWith(i.path));

  const notifications = [
    { id: 1, text: 'Bệnh nhân Nguyễn Văn A đã check-in', time: '5 phút trước', unread: true },
    { id: 2, text: 'Lịch hẹn LH123456 sắp bắt đầu trong 15 phút', time: '10 phút trước', unread: true },
    { id: 3, text: 'Hóa đơn HD789012 đã được thanh toán', time: '1 giờ trước', unread: false },
  ];
  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className={cn(
        'bg-white border-r border-slate-200 flex flex-col transition-all duration-300',
        sidebarOpen ? 'w-64' : 'w-16'
      )}>
        <div className="h-16 flex items-center px-4 border-b border-slate-200">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-lg bg-[#1e3a5f] flex items-center justify-center flex-shrink-0">
              <HeartPulse className="w-5 h-5 text-[#0ea5e9]" />
            </div>
            {sidebarOpen && (
              <span className="ml-3 font-bold text-lg text-[#1e3a5f] whitespace-nowrap">CLINIC AI</span>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto text-slate-400 hover:text-slate-600 flex-shrink-0"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {regularItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                title={!sidebarOpen ? item.label : undefined}
                className={cn(
                  'flex items-center px-2 py-2.5 rounded-lg text-sm font-medium transition-all group',
                  isActive
                    ? 'bg-[#1e3a5f] text-white shadow-sm'
                    : item.isAI
                    ? 'text-violet-600 hover:bg-violet-50'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )}
              >
                <Icon className={cn('w-5 h-5 flex-shrink-0', isActive ? 'text-[#0ea5e9]' : item.isAI ? 'text-violet-500' : '')} />
                {sidebarOpen && <span className="ml-3 truncate">{item.label}</span>}
                {!sidebarOpen && item.isAI && !isActive && (
                  <span className="absolute left-14 ml-2 px-2 py-1 bg-violet-600 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">{item.label}</span>
                )}
              </Link>
            );
          })}

          {adminItems.length > 0 && sidebarOpen && (
            <>
              <div className="pt-4 pb-1 px-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Quản trị</p>
              </div>
              {adminItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'flex items-center px-2 py-2.5 rounded-lg text-sm font-medium transition-all',
                      isActive
                        ? 'bg-[#1e3a5f] text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    )}
                  >
                    <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-[#0ea5e9]')} />
                    <span className="ml-3 truncate">{item.label}</span>
                  </Link>
                );
              })}
            </>
          )}
        </div>

        <div className="p-3 border-t border-slate-200">
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#1e3a5f] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{user?.full_name || user?.username}</p>
                <span className={cn('text-xs px-1.5 py-0.5 rounded font-medium', roleBadgeColor[user?.role || 'patient'])}>
                  {roleLabel[user?.role || 'patient']}
                </span>
              </div>
              <button onClick={() => { logout(); navigate('/login'); }} className="text-slate-400 hover:text-red-500" title="Đăng xuất">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <button onClick={() => { logout(); navigate('/login'); }} className="text-slate-400 hover:text-red-500" title="Đăng xuất">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 gap-4">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-800">
              {currentPage?.label || 'Clinic AI'}
            </h2>
          </div>

          <div className="hidden md:flex items-center bg-slate-100 rounded-lg px-3 py-2 gap-2 w-64">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm..."
              className="bg-transparent text-sm outline-none w-full text-slate-700 placeholder-slate-400"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              <Bell className="w-5 h-5 text-slate-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-12 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50">
                <div className="p-4 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-800">Thông báo</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {notifications.map(n => (
                    <div key={n.id} className={cn('p-4 hover:bg-slate-50', n.unread && 'bg-blue-50/50')}>
                      <p className="text-sm text-slate-700">{n.text}</p>
                      <p className="text-xs text-slate-400 mt-1">{n.time}</p>
                    </div>
                  ))}
                </div>
                <div className="p-3 text-center border-t border-slate-100">
                  <button className="text-sm text-[#0ea5e9] hover:underline">Xem tất cả</button>
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 hover:bg-slate-100 rounded-lg px-2 py-1.5 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-[#1e3a5f] text-white flex items-center justify-center font-bold text-sm">
                {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
              </div>
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 top-12 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-50">
                <div className="p-3 border-b border-slate-100">
                  <p className="text-sm font-medium text-slate-800">{user?.full_name}</p>
                  <p className="text-xs text-slate-500">{user?.username}</p>
                </div>
                <div className="p-2">
                  <button
                    onClick={() => { logout(); navigate('/login'); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <LogOut className="w-4 h-4" />
                    Đăng xuất
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-slate-50 p-6" onClick={() => { setNotifOpen(false); setUserMenuOpen(false); }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
