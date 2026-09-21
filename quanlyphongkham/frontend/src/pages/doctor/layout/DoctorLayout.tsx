import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import { doctorAPI } from '@/services/api';
import {
  HeartPulse,
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  Pill,
  FlaskConical,
  Bot,
  Bell,
  Settings,
  BarChart3,
  Search,
  Menu,
  X,
  ChevronDown,
  LogOut,
  User,
  PanelRightClose,
  PanelRightOpen
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export default function DoctorLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [doctorInfo, setDoctorInfo] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuthStore();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const [meRes, statsRes] = await Promise.all([
          doctorAPI.getMe(),
          doctorAPI.getDashboardStats()
        ]);
        setDoctorInfo(meRes.data);
        setStats(statsRes.data);
      } catch (err) {
        console.error('Failed to load doctor info', err);
      }
    };
    fetchInfo();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { name: 'Trang chủ', path: '/doctor', icon: LayoutDashboard },
    { name: 'Lịch khám', path: '/doctor/appointments', icon: Calendar },
    { name: 'Bệnh nhân', path: '/doctor/patients', icon: Users },
    { name: 'Bệnh án điện tử', path: '/doctor/emr', icon: FileText },
    { name: 'Đơn thuốc', path: '/doctor/prescriptions', icon: Pill },
    { name: 'Kết quả xét nghiệm', path: '/doctor/lab-results', icon: FlaskConical },
    { name: 'Tư vấn AI', path: '/doctor/ai', icon: Bot, color: 'text-violet-400' },
    { name: 'Thông báo', path: '/doctor/notifications', icon: Bell, badge: stats?.unread_notifications_count },
    { name: 'Cài đặt', path: '/doctor/settings', icon: Settings },
    { name: 'Báo cáo', path: '/doctor/reports', icon: BarChart3 },
  ];

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-[240px] bg-[#0f2447] text-slate-300 flex flex-col transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-16 flex items-center px-4 shrink-0 bg-[#0a1931]">
          <HeartPulse className="w-8 h-8 text-blue-500 mr-2" />
          <span className="text-xl font-bold text-white">AI Clinic</span>
          <Button variant="ghost" size="icon" className="ml-auto lg:hidden text-white" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path !== '/doctor' && location.pathname.startsWith(item.path));
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors relative",
                    isActive 
                      ? "bg-[#1e3a6e] text-white" 
                      : "hover:bg-[#1e3a6e]/50 hover:text-white"
                  )}
                >
                  {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r-md" />}
                  <Icon className={cn("w-5 h-5 mr-3", item.color, isActive && !item.color && "text-blue-400")} />
                  {item.name}
                  {item.badge ? (
                    <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  ) : null}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="p-4 shrink-0 border-t border-slate-700/50">
          <Button 
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white border-0"
            onClick={() => {
              if (window.innerWidth >= 1024) {
                setAiPanelOpen(true);
              } else {
                navigate('/doctor/ai');
              }
            }}
          >
            <Bot className="w-4 h-4 mr-2" />
            AI Assistant
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header */}
        <header className="h-16 bg-white shrink-0 flex items-center justify-between px-4 lg:px-6 shadow-sm border-b border-slate-200 z-10">
          <div className="flex items-center flex-1">
            <Button variant="ghost" size="icon" className="lg:hidden mr-2" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
            
            <div className="relative max-w-md w-full hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Tìm kiếm bệnh nhân, lịch khám..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-full text-sm outline-none transition-all"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    navigate(`/doctor/patients?search=${e.currentTarget.value}`);
                  }
                }}
              />
            </div>
          </div>

          <div className="flex items-center space-x-3 lg:space-x-4">
            <Button variant="ghost" size="icon" className="relative text-slate-500 hover:text-slate-700">
              <Bell className="w-5 h-5" />
              {stats?.unread_notifications_count > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
              )}
            </Button>

            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 p-1 hover:bg-slate-100 rounded-full pr-3">
                  <Avatar className="w-8 h-8 border border-slate-200">
                    <AvatarImage src={doctorInfo?.avatar_url} />
                    <AvatarFallback className="bg-blue-100 text-blue-700">
                      {doctorInfo?.full_name?.charAt(0) || 'BS'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-slate-700 leading-none">{doctorInfo?.full_name || 'Đang tải...'}</p>
                    <p className="text-xs text-slate-500 mt-1">{doctorInfo?.specialty || 'Bác sĩ'}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => navigate('/doctor/profile')}>
                  <User className="w-4 h-4 mr-2" />
                  Xem hồ sơ
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/doctor/settings')}>
                  <Settings className="w-4 h-4 mr-2" />
                  Cài đặt
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                  <LogOut className="w-4 h-4 mr-2" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button 
              variant="ghost" 
              size="icon" 
              className="hidden lg:flex text-slate-500"
              onClick={() => setAiPanelOpen(!aiPanelOpen)}
            >
              {aiPanelOpen ? <PanelRightClose className="w-5 h-5" /> : <PanelRightOpen className="w-5 h-5" />}
            </Button>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* AI Panel Desktop */}
      {aiPanelOpen && (
        <div className="hidden lg:flex flex-col w-[340px] shrink-0 border-l border-slate-200 bg-white shadow-xl z-20 transition-all duration-300">
          <div className="h-16 border-b border-slate-200 flex items-center justify-between px-4">
            <div className="flex items-center space-x-2">
              <div className="bg-violet-100 p-1.5 rounded-lg">
                <Bot className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 text-sm">AI Assistant</h3>
                <div className="flex items-center text-xs text-slate-500">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                  Trợ lý dành cho bác sĩ
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setAiPanelOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-hidden relative">
            <div className="absolute inset-0 p-4">
               {/* Embed AIAssistant widget or iframe. For now we will just instruct the user it's here, or we can use the DoctorAIAssistant component later if we export it as a widget, but based on requirements, we can just say "Widget AI" */}
               <div className="h-full border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center flex-col text-slate-400 p-6 text-center space-y-4">
                 <Bot className="w-12 h-12 text-slate-300" />
                 <p>Chatbot AI sẽ hiển thị ở đây. Bạn có thể sử dụng chức năng AI bằng cách truy cập menu Tư vấn AI.</p>
                 <Button variant="outline" onClick={() => navigate('/doctor/ai')}>Mở trang Tư vấn AI</Button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
