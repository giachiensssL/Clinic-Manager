import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientsAPI, appointmentsAPI, emrAPI, prescriptionsAPI, aiAPI } from '@/services/api';
import { cn } from '@/lib/utils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  Home, Calendar, FileText, Pill, CreditCard, Bot, Bell, Settings,
  Search, ChevronDown, LogOut, Send, RefreshCw, Loader2, ShieldAlert,
  User, Plus, Eye, X, Menu, Activity, Heart, Clock, CheckCircle2,
  AlertCircle, ChevronRight, Stethoscope, HeartPulse, Sparkles,
  FlaskConical, Phone, MapPin, Star, ArrowRight, Shield,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
  id: number;
  role: 'assistant' | 'user';
  content: string;
  isGuardrail?: boolean;
  isLoading?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const SIDEBAR_NAV = [
  { id: 'home',          label: 'Trang chủ',           icon: Home,        path: '/portal' },
  { id: 'book',          label: 'Đặt lịch khám',       icon: Plus,        path: '/appointments' },
  { id: 'appointments',  label: 'Lịch hẹn của tôi',    icon: Calendar,    path: '/appointments' },
  { id: 'health',        label: 'Hồ sơ sức khỏe',     icon: FileText,    path: '/portal' },
  { id: 'prescriptions', label: 'Đơn thuốc',           icon: Pill,        path: '/portal' },
  { id: 'lab',           label: 'Kết quả xét nghiệm',  icon: FlaskConical, path: '/portal' },
  { id: 'billing',       label: 'Thanh toán',           icon: CreditCard,  path: '/portal' },
  { id: 'ai',            label: 'Tư vấn AI',            icon: Bot,         path: '/portal', isAI: true },
  { id: 'notifications', label: 'Thông báo',            icon: Bell,        path: '/portal' },
  { id: 'settings',      label: 'Cài đặt',              icon: Settings,    path: '/portal' },
];

const QUICK_AI = ['Đặt lịch khám', 'Tra cứu lịch hẹn', 'Nhắc thuốc', 'Hướng dẫn khám'];

const AI_WELCOME: Message = {
  id: 1, role: 'assistant',
  content: 'Xin chào! Tôi là **Trợ lý AI** của AI Clinic.\n\nTôi có thể hỗ trợ bạn:\n• 📅 Đặt lịch & kiểm tra lịch trống\n• 💊 Nhắc thuốc và đơn thuốc\n• 📋 Tra cứu kết quả xét nghiệm\n• 🏥 Thông tin bác sĩ & chuyên khoa\n\nBạn cần hỗ trợ gì?',
};

const SERVICES = [
  { icon: User,        color: '#0D6EFD', bg: '#EBF3FF', label: 'Quản lý bệnh nhân',   desc: 'Lưu trữ hồ sơ, tra cứu nhanh' },
  { icon: Calendar,   color: '#10B981', bg: '#ECFDF5', label: 'Đặt & Tiếp đón',       desc: 'Lịch hẹn, giảm thời gian chờ' },
  { icon: FileText,   color: '#8B5CF6', bg: '#F5F3FF', label: 'Khám bệnh & Bệnh án',  desc: 'Hồ sơ điện tử, chia sẻ kết quả' },
  { icon: Activity,   color: '#F59E0B', bg: '#FFFBEB', label: 'Báo cáo & Thống kê',   desc: 'Doanh thu, hiệu suất, báo cáo' },
  { icon: Pill,        color: '#EF4444', bg: '#FEF2F2', label: 'Nhà thuốc & Kê đơn',   desc: 'Quản lý thuốc, đơn thuốc số' },
  { icon: CreditCard, color: '#0EA5E9', bg: '#F0F9FF', label: 'Thanh toán & Bảo hiểm', desc: 'Tích hợp thanh toán, BHYT số' },
  { icon: Bot,         color: '#7C3AED', bg: '#F5F3FF', label: 'AI Hỗ trợ',            desc: 'Chatbot, tóm tắt bệnh án AI' },
  { icon: Phone,       color: '#06B6D4', bg: '#ECFEFF', label: 'Ứng dụng di động',     desc: 'Đặt lịch, kết quả mọi nơi' },
];

const HEALTH_NEWS = [
  { date: '12/09/2026', title: 'Cách phòng ngừa bệnh cúm mùa hiệu quả', tag: 'Sức khỏe', img: '' },
  { date: '08/09/2026', title: 'AI trong y tế: Tương lai của khám chữa bệnh', tag: 'Công nghệ', img: '' },
  { date: '05/09/2026', title: 'Những thói quen giúp bảo vệ sức khỏe tim mạch', tag: 'Tư vấn', img: '' },
];

const PIE_COLORS = ['#22C55E', '#3B82F6', '#F59E0B', '#EF4444'];

// ─── Status helpers ──────────────────────────────────────────────────────────
function aptStatusLabel(s: string) {
  return ({ scheduled: 'Đã đặt lịch', waiting: 'Đang chờ', in_consultation: 'Đang khám', completed: 'Hoàn thành', paid: 'Đã thanh toán', cancelled: 'Đã hủy', no_show: 'Vắng mặt' } as any)[s] ?? s;
}
function aptStatusCls(s: string) {
  return ({ scheduled: 'bg-blue-100 text-blue-700', waiting: 'bg-amber-100 text-amber-700', in_consultation: 'bg-violet-100 text-violet-700', completed: 'bg-green-100 text-green-700', paid: 'bg-emerald-100 text-emerald-700', cancelled: 'bg-red-100 text-red-700', no_show: 'bg-slate-100 text-slate-500' } as any)[s] ?? 'bg-slate-100 text-slate-500';
}

// ─── Markdown renderer ───────────────────────────────────────────────────────
function renderMd(content: string) {
  return content.split('\n').map((line, i, arr) => (
    <span key={i}>
      <span dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
      {i < arr.length - 1 && <br />}
    </span>
  ));
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function PatientPortal() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeNav, setActiveNav] = useState('home');
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [aiPanelOpen, setAiPanelOpen] = useState(true);
  const [showAllApts, setShowAllApts] = useState(false);

  const [messages, setMessages] = useState<Message[]>([AI_WELCOME]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const aiBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { aiBottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // ── API queries ──────────────────────────────────────────────────────────────
  const { data: patientProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['patient-me'],
    queryFn: async () => (await patientsAPI.getMe()).data,
  });
  const patientId = patientProfile?.id;

  const { data: aptsRes, isLoading: aptsLoading } = useQuery({
    queryKey: ['my-appointments'],
    queryFn: async () => (await appointmentsAPI.getAll({})).data,
  });

  const { data: emrRes, isLoading: emrLoading } = useQuery({
    queryKey: ['my-emr', patientId],
    queryFn: async () => (await emrAPI.getByPatient(patientId!)).data,
    enabled: !!patientId,
  });

  const { data: rxRes } = useQuery({
    queryKey: ['my-prescriptions', patientId],
    queryFn: async () => (await prescriptionsAPI.getAll({ patient_id: patientId })).data,
    enabled: !!patientId,
  });

  const cancelAptMutation = useMutation({
    mutationFn: (id: string) => appointmentsAPI.updateStatus(id, 'cancelled'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-appointments'] }),
  });

  // ── Derived ──────────────────────────────────────────────────────────────────
  const allApts: any[] = aptsRes?.items ?? [];
  const upcomingApts = allApts.filter((a: any) => ['scheduled', 'waiting'].includes(a.status));
  const allEmr: any[] = emrRes?.items ?? [];
  const allRx: any[] = rxRes?.items ?? [];
  const latestEmr = allEmr[0] ?? null;

  // Chart data derived from real data (or illustrative if none)
  const aptStatusCounts = [
    { name: 'Hoàn thành', value: allApts.filter((a: any) => a.status === 'completed' || a.status === 'paid').length || 5 },
    { name: 'Đã đặt', value: allApts.filter((a: any) => a.status === 'scheduled').length || 3 },
    { name: 'Đang chờ', value: allApts.filter((a: any) => a.status === 'waiting').length || 2 },
    { name: 'Đã hủy', value: allApts.filter((a: any) => a.status === 'cancelled').length || 1 },
  ];

  const visitTrend = allEmr.length > 1
    ? allEmr.slice(0, 7).reverse().map((e: any, i: number) => ({
        name: `Lần ${i + 1}`,
        value: 1,
      })).reduce((acc: any[], _: any, i: number) => {
        acc.push({ name: `T${i + 1}`, visits: i + 1 });
        return acc;
      }, [])
    : [
        { name: 'T3', visits: 1 }, { name: 'T4', visits: 2 }, { name: 'T5', visits: 1 },
        { name: 'T6', visits: 3 }, { name: 'T7', visits: 2 }, { name: 'T8', visits: 4 },
        { name: 'T9', visits: allEmr.length || 3 },
      ];

  const notifications = [
    { id: 1, text: 'Lịch hẹn của bạn vào ngày mai lúc 08:30', time: '1 giờ trước', unread: true, icon: Calendar, color: 'text-blue-500' },
    { id: 2, text: 'Kết quả xét nghiệm máu đã có sẵn', time: '3 giờ trước', unread: true, icon: Activity, color: 'text-green-500' },
    { id: 3, text: 'Nhắc nhở uống thuốc: 20:00 tối nay', time: '5 giờ trước', unread: false, icon: Pill, color: 'text-violet-500' },
  ];
  const unreadCount = notifications.filter(n => n.unread).length;

  // ── AI Chat ──────────────────────────────────────────────────────────────────
  const handleAISend = async (text?: string) => {
    const msg = text || aiInput;
    if (!msg.trim() || aiLoading) return;
    const userMsg: Message = { id: Date.now(), role: 'user', content: msg };
    setMessages(prev => [...prev, userMsg]);
    setAiInput('');
    setAiLoading(true);
    const loadingId = Date.now() + 1;
    setMessages(prev => [...prev, { id: loadingId, role: 'assistant', content: '', isLoading: true }]);
    try {
      const response = await aiAPI.streamChat(msg, conversationId);
      if (!response.ok) { if (response.status === 401) { localStorage.clear(); window.location.href = '/login'; return; } throw new Error(`${response.status}`); }
      if (!response.body) throw new Error('No body');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      setMessages(prev => prev.map(m => m.id === loadingId ? { ...m, isLoading: false } : m));
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const d = line.replace('data: ', '').trim();
          if (d === '[DONE]') break;
          try {
            const data = JSON.parse(d);
            if (data.type === 'start') setConversationId(data.conversation_id);
            else if (data.type === 'chunk') setMessages(prev => prev.map(m => m.id === loadingId ? { ...m, content: m.content + data.content } : m));
            else if (data.type === 'guardrail') setMessages(prev => prev.map(m => m.id === loadingId ? { ...m, content: data.content, isGuardrail: true } : m));
          } catch { /* skip */ }
        }
      }
    } catch (err: any) {
      setMessages(prev => prev.map(m => m.id === loadingId ? { ...m, content: `Lỗi: ${err.message}`, isLoading: false } : m));
    } finally { setAiLoading(false); }
  };

  const handleAIReset = () => { setMessages([AI_WELCOME]); setConversationId(undefined); };

  const handleNav = (item: typeof SIDEBAR_NAV[0]) => {
    setActiveNav(item.id);
    if (item.path !== '/portal') navigate(item.path);
  };

  const firstLetter = (user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U').toUpperCase();
  const displayName = user?.full_name?.split(' ').pop() || user?.username || 'bạn';

  // ── RENDER ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-[#F0F5FC] font-sans overflow-hidden" onClick={() => { setNotifOpen(false); setUserMenuOpen(false); }}>

      {/* ══════════════════ SIDEBAR ══════════════════ */}
      <aside
        className={cn('flex-shrink-0 flex flex-col transition-all duration-300 z-30 h-screen', sidebarOpen ? 'w-[220px]' : 'w-[60px]')}
        style={{ background: 'linear-gradient(180deg, #0B3B78 0%, #0D4F9E 100%)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-2.5 px-4 border-b border-white/10 flex-shrink-0">
          <div className="w-8 h-8 bg-white rounded flex items-center justify-center flex-shrink-0">
            <HeartPulse className="w-5 h-5 text-[#0D6EFD]" />
          </div>
          {sidebarOpen && (
            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm text-white leading-tight">AI Clinic</p>
              <p className="text-[10px] text-white/50 leading-tight truncate">Vì sức khỏe của bạn</p>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white/40 hover:text-white flex-shrink-0 ml-auto">
            <Menu className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {SIDEBAR_NAV.map(item => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button key={item.id} onClick={() => handleNav(item)} title={!sidebarOpen ? item.label : undefined}
                className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-all text-left',
                  isActive ? 'bg-[#0D6EFD] text-white shadow-md shadow-blue-900/40'
                  : item.isAI ? 'text-[#90CAF9] hover:bg-white/10 hover:text-white'
                  : 'text-white/65 hover:bg-white/10 hover:text-white'
                )}>
                <Icon className={cn('w-4 h-4 flex-shrink-0', isActive && 'text-white')} />
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Profile */}
        <div className="flex-shrink-0 p-3 border-t border-white/10">
          {sidebarOpen ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#0D6EFD] flex items-center justify-center font-bold text-sm flex-shrink-0 text-white">{firstLetter}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user?.full_name || user?.username}</p>
                <p className="text-[10px] text-white/50">Bệnh nhân</p>
              </div>
              <button onClick={() => { logout(); navigate('/login'); }} className="text-white/40 hover:text-red-400 flex-shrink-0" title="Đăng xuất">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <button onClick={() => { logout(); navigate('/login'); }} className="text-white/40 hover:text-red-400"><LogOut className="w-4 h-4" /></button>
            </div>
          )}
        </div>
      </aside>

      {/* ══════════════════ MAIN AREA ══════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── HEADER ── */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-5 gap-3 flex-shrink-0 z-20" onClick={e => e.stopPropagation()}>
          <div className="flex items-center bg-gray-100 rounded px-3 py-1.5 gap-2 flex-1 max-w-sm border border-gray-200">
            <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm bác sĩ, chuyên khoa, bệnh viện..."
              className="bg-transparent text-xs outline-none w-full text-gray-700 placeholder-gray-400" />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* AI toggle */}
            <button onClick={() => setAiPanelOpen(!aiPanelOpen)}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold border transition-all',
                aiPanelOpen ? 'bg-[#0D6EFD] text-white border-[#0D6EFD]' : 'bg-white text-[#0D6EFD] border-[#0D6EFD]/40 hover:border-[#0D6EFD]')}>
              <Bot className="w-3.5 h-3.5" /> Trợ lý AI
            </button>

            {/* Notifications */}
            <div className="relative">
              <button onClick={e => { e.stopPropagation(); setNotifOpen(!notifOpen); setUserMenuOpen(false); }}
                className="relative w-8 h-8 rounded border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center">
                <Bell className="w-4 h-4 text-gray-500" />
                {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">{unreadCount}</span>}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-10 w-72 bg-white border border-gray-200 rounded-md shadow-xl z-50">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <p className="font-semibold text-gray-800 text-sm">Thông báo</p>
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">{unreadCount} mới</span>
                  </div>
                  {notifications.map(n => {
                    const Icon = n.icon;
                    return (
                      <div key={n.id} className={cn('px-4 py-3 flex gap-3 hover:bg-gray-50', n.unread && 'bg-blue-50/60')}>
                        <div className={cn('w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0', n.unread ? 'bg-blue-100' : 'bg-gray-100')}>
                          <Icon className={cn('w-3.5 h-3.5', n.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-700 leading-snug">{n.text}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{n.time}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div className="px-4 py-2 border-t border-gray-100 text-center">
                    <button className="text-xs text-[#0D6EFD] hover:underline font-medium">Xem tất cả</button>
                  </div>
                </div>
              )}
            </div>

            {/* User */}
            <div className="relative">
              <button onClick={e => { e.stopPropagation(); setUserMenuOpen(!userMenuOpen); setNotifOpen(false); }}
                className="flex items-center gap-2 hover:bg-gray-50 rounded px-2 py-1 border border-transparent hover:border-gray-200">
                <div className="w-7 h-7 rounded-full bg-[#0B3B78] text-white flex items-center justify-center font-bold text-xs">{firstLetter}</div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-gray-800 leading-tight">{user?.full_name || user?.username}</p>
                  <p className="text-[10px] text-gray-400">Bệnh nhân</p>
                </div>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-10 w-44 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  <div className="px-3 py-2.5 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-800">{user?.full_name}</p>
                    <p className="text-[10px] text-gray-400">{user?.username}</p>
                  </div>
                  <div className="p-1.5">
                    <button onClick={() => { logout(); navigate('/login'); }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded">
                      <LogOut className="w-3.5 h-3.5" /> Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── CONTENT ROW ── */}
        <div className="flex-1 flex min-h-0 overflow-hidden">

          {/* ── SCROLLABLE MAIN ── */}
          <div className="flex-1 overflow-y-auto">

            {/* ═══════════ HERO SECTION ═══════════ */}
            <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0B3B78 0%, #1565C0 60%, #1E88E5 100%)' }}>
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)`,
                backgroundSize: '40px 40px'
              }} />
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
              <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-white/5 rounded-full translate-y-1/2" />

              <div className="relative z-10 px-8 py-8 flex items-center justify-between gap-6">
                <div className="flex-1 max-w-lg">
                  <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20 rounded-full px-3 py-1 mb-4">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-white/90 text-xs font-medium">Hệ thống quản lý phòng khám thông minh</span>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-2">
                    Xin chào, {displayName}! 👋
                  </h1>
                  <p className="text-white/75 text-sm mb-5 leading-relaxed">
                    Chăm sóc sức khỏe của bạn là ưu tiên hàng đầu của chúng tôi.
                    Theo dõi lịch hẹn, hồ sơ bệnh án và đơn thuốc của bạn dễ dàng.
                  </p>

                  {/* Quick actions */}
                  <div className="flex flex-wrap gap-2.5">
                    <button onClick={() => navigate('/appointments')}
                      className="flex items-center gap-2 bg-white text-[#0B3B78] px-5 py-2.5 rounded font-semibold text-sm hover:bg-blue-50 transition-all shadow-lg">
                      <Plus className="w-4 h-4" /> Đặt lịch khám
                    </button>
                    <button onClick={() => navigate('/appointments')}
                      className="flex items-center gap-2 bg-white/15 border border-white/25 text-white px-4 py-2.5 rounded font-medium text-sm hover:bg-white/25 transition-all">
                      <Calendar className="w-4 h-4" /> Xem lịch hẹn
                    </button>
                    <button onClick={() => setAiPanelOpen(true)}
                      className="flex items-center gap-2 bg-white/15 border border-white/25 text-white px-4 py-2.5 rounded font-medium text-sm hover:bg-white/25 transition-all">
                      <Bot className="w-4 h-4" /> Tư vấn AI
                    </button>
                  </div>
                </div>

                {/* Doctor illustration area */}
                <div className="hidden lg:flex flex-shrink-0 items-end justify-center">
                  <div className="relative">
                    {/* Main image placeholder - professional medical look */}
                    <div className="w-48 h-48 rounded-full bg-gradient-to-br from-white/20 to-white/5 border-2 border-white/20 flex items-center justify-center">
                      <Stethoscope className="w-20 h-20 text-white/40" />
                    </div>
                    {/* Floating cards */}
                    <div className="absolute -top-4 -left-8 bg-white rounded-lg px-3 py-2 shadow-xl">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500">Lịch hẹn</p>
                          <p className="text-xs font-bold text-gray-800">Đã xác nhận</p>
                        </div>
                      </div>
                    </div>
                    <div className="absolute -bottom-2 -right-6 bg-white rounded-lg px-3 py-2 shadow-xl">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <Bot className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500">AI Assistant</p>
                          <p className="text-xs font-bold text-gray-800">Luôn sẵn sàng</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom stats bar */}
              <div className="relative z-10 border-t border-white/10 bg-white/5 px-8 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: User, value: '12.568+', label: 'Bệnh nhân đã sử dụng' },
                  { icon: MapPin, value: '48', label: 'Phòng khám tin dùng' },
                  { icon: Stethoscope, value: '320+', label: 'Bác sĩ & nhân viên y tế' },
                  { icon: Star, value: '99.9%', label: 'Thời gian hoạt động hệ thống' },
                ].map(s => {
                  const Icon = s.icon;
                  return (
                    <div key={s.label} className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-white/15 rounded flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4.5 h-4.5 text-white/80 w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-white font-bold text-lg leading-tight">{s.value}</p>
                        <p className="text-white/60 text-[10px] leading-tight">{s.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ═══════════ BODY CONTENT ═══════════ */}
            <div className="p-5 space-y-5">

              {/* ── DASHBOARD OVERVIEW ROW ── */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-gray-800 text-base">Tổng quan của bạn</h2>
                  <span className="text-xs text-gray-400">Cập nhật theo thời gian thực</span>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { label: 'Lịch hẹn sắp tới', value: aptsLoading ? '—' : upcomingApts.length, icon: Calendar, color: '#0D6EFD', bg: '#EBF3FF', change: '+2 tuần này' },
                    { label: 'Tổng lần khám', value: emrLoading ? '—' : allEmr.length, icon: Stethoscope, color: '#10B981', bg: '#ECFDF5', change: 'Lần cuối hôm nay' },
                    { label: 'Đơn thuốc hiện tại', value: allRx.filter((r: any) => r.status !== 'dispensed').length || 0, icon: Pill, color: '#8B5CF6', bg: '#F5F3FF', change: 'Cần lấy thuốc' },
                    { label: 'Thông báo mới', value: unreadCount, icon: Bell, color: '#F59E0B', bg: '#FFFBEB', change: 'Chưa đọc' },
                  ].map(s => {
                    const Icon = s.icon;
                    return (
                      <div key={s.label} className="bg-white rounded border border-gray-200 p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}>
                            <Icon className="w-5 h-5" style={{ color: s.color }} />
                          </div>
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{s.value}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                        <p className="text-[10px] mt-1 font-medium" style={{ color: s.color }}>{s.change}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── CHARTS + APPOINTMENTS ── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* Area chart - visit trend */}
                <div className="lg:col-span-2 bg-white rounded border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-800 text-sm">Thống kê lịch khám</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Số lần khám theo tháng</p>
                    </div>
                    <div className="flex gap-1">
                      {['Năm nay', 'Tuần này'].map((t, i) => (
                        <button key={t} className={cn('px-3 py-1 text-xs rounded font-medium', i === 0 ? 'bg-[#0D6EFD] text-white' : 'text-gray-500 hover:bg-gray-100')}>{t}</button>
                      ))}
                    </div>
                  </div>
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={visitTrend}>
                        <defs>
                          <linearGradient id="visitGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0D6EFD" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#0D6EFD" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F4F8" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #E2E8F0' }} />
                        <Area type="monotone" dataKey="visits" stroke="#0D6EFD" strokeWidth={2} fill="url(#visitGrad)" name="Lượt khám" dot={{ fill: '#0D6EFD', r: 3 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Pie chart - appointment status */}
                <div className="bg-white rounded border border-gray-200 p-4">
                  <h3 className="font-semibold text-gray-800 text-sm mb-1">Cơ cấu lịch hẹn</h3>
                  <p className="text-xs text-gray-400 mb-3">Phân loại theo trạng thái</p>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={aptStatusCounts} cx="50%" cy="50%" innerRadius={42} outerRadius={62} paddingAngle={3} dataKey="value">
                          {aptStatusCounts.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-1.5 mt-1">
                    {aptStatusCounts.map((d, i) => (
                      <div key={d.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i] }} />
                          <span className="text-xs text-gray-600">{d.name}</span>
                        </div>
                        <span className="text-xs font-semibold text-gray-800">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── UPCOMING APPOINTMENTS ── */}
              <div className="bg-white rounded border border-gray-200">
                <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#0D6EFD]" />
                    <h3 className="font-semibold text-gray-800 text-sm">Lịch hẹn sắp tới</h3>
                    {upcomingApts.length > 0 && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{upcomingApts.length}</span>}
                  </div>
                  <button onClick={() => navigate('/appointments')} className="text-xs text-[#0D6EFD] hover:underline font-medium flex items-center gap-1">
                    Xem tất cả <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                {aptsLoading ? (
                  <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
                ) : upcomingApts.length === 0 ? (
                  <div className="py-10 text-center">
                    <Calendar className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Không có lịch hẹn sắp tới</p>
                    <button onClick={() => navigate('/appointments')} className="mt-3 text-xs text-[#0D6EFD] hover:underline font-medium">Đặt lịch khám ngay →</button>
                  </div>
                ) : (
                  <>
                    <div className="divide-y divide-gray-50">
                      {(showAllApts ? upcomingApts : upcomingApts.slice(0, 3)).map((apt: any) => (
                        <div key={apt.id} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                          {/* Date block */}
                          <div className="flex-shrink-0 w-14 text-center bg-blue-50 border border-blue-100 rounded p-2">
                            <p className="text-[10px] text-blue-400 font-medium uppercase leading-tight">
                              {apt.appointment_date ? new Date(apt.appointment_date + 'T00:00:00').toLocaleDateString('vi-VN', { weekday: 'short' }) : '—'}
                            </p>
                            <p className="text-xl font-bold text-[#0B3B78] leading-tight">
                              {apt.appointment_date ? new Date(apt.appointment_date + 'T00:00:00').getDate() : '—'}
                            </p>
                            <p className="text-[10px] text-blue-400 leading-tight">
                              {apt.appointment_date ? String(new Date(apt.appointment_date + 'T00:00:00').getMonth() + 1).padStart(2, '0') : '—'}
                            </p>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-gray-800 text-sm">{apt.reason || 'Khám tổng quát'}</p>
                              <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', aptStatusCls(apt.status))}>
                                {aptStatusLabel(apt.status)}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-3 mt-1.5">
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />{apt.start_time} – {apt.end_time}
                              </span>
                              {(apt.doctor?.staff?.full_name || apt.doctor?.full_name) && (
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <User className="w-3 h-3" />{apt.doctor?.staff?.full_name || apt.doctor?.full_name}
                                </span>
                              )}
                              {apt.specialty?.name && (
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <Stethoscope className="w-3 h-3" />{apt.specialty.name}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button onClick={() => navigate('/appointments')}
                              className="text-xs px-3 py-1.5 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded font-medium">
                              Xem chi tiết
                            </button>
                            {['scheduled', 'waiting'].includes(apt.status) && (
                              <button
                                onClick={() => { if (window.confirm('Bạn có chắc muốn hủy lịch hẹn này?')) cancelAptMutation.mutate(apt.id); }}
                                disabled={cancelAptMutation.isPending}
                                className="text-xs px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded font-medium disabled:opacity-50">
                                Hủy lịch
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {upcomingApts.length > 3 && (
                      <div className="px-5 py-3 border-t border-gray-100 text-center">
                        <button onClick={() => setShowAllApts(!showAllApts)} className="text-xs text-[#0D6EFD] hover:underline font-medium">
                          {showAllApts ? 'Thu gọn' : `Xem thêm ${upcomingApts.length - 3} lịch hẹn`}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* ── SERVICES GRID ── */}
              <div>
                <div className="mb-3">
                  <p className="text-xs text-[#0D6EFD] font-semibold uppercase tracking-wider mb-1">TÍNH NĂNG NỔI BẬT</p>
                  <h2 className="font-bold text-gray-800 text-base">Giải pháp toàn diện cho sức khỏe của bạn</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {SERVICES.map(s => {
                    const Icon = s.icon;
                    return (
                      <div key={s.label} className="bg-white rounded border border-gray-200 p-4 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group">
                        <div className="w-10 h-10 rounded flex items-center justify-center mb-3" style={{ background: s.bg }}>
                          <Icon className="w-5 h-5" style={{ color: s.color }} />
                        </div>
                        <p className="font-semibold text-gray-800 text-xs leading-tight mb-1">{s.label}</p>
                        <p className="text-[10px] text-gray-400 leading-relaxed">{s.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── HEALTH SUMMARY + PRESCRIPTIONS ── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                {/* Health Vitals */}
                <div className="bg-white rounded border border-gray-200">
                  <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#0D6EFD]" />
                    <h3 className="font-semibold text-gray-800 text-sm">Chỉ số sức khỏe của bạn</h3>
                  </div>
                  <div className="p-5">
                    {emrLoading ? (
                      <div className="flex items-center justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
                    ) : latestEmr ? (
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: 'Cân nặng', value: latestEmr.weight ? `${latestEmr.weight} kg` : null, color: '#0D6EFD', bg: '#EBF3FF', icon: User },
                          { label: 'Chiều cao', value: latestEmr.height ? `${latestEmr.height} cm` : null, color: '#10B981', bg: '#ECFDF5', icon: User },
                          { label: 'Huyết áp', value: latestEmr.blood_pressure || null, color: '#EF4444', bg: '#FEF2F2', icon: Heart },
                          { label: 'Nhịp tim', value: latestEmr.heart_rate ? `${latestEmr.heart_rate} bpm` : null, color: '#8B5CF6', bg: '#F5F3FF', icon: HeartPulse },
                          { label: 'Nhiệt độ', value: latestEmr.temperature ? `${latestEmr.temperature}°C` : null, color: '#F59E0B', bg: '#FFFBEB', icon: Activity },
                          { label: 'SpO2', value: latestEmr.oxygen_saturation ? `${latestEmr.oxygen_saturation}%` : null, color: '#06B6D4', bg: '#ECFEFF', icon: Activity },
                        ].map(v => {
                          if (!v.value) return null;
                          const Icon = v.icon;
                          return (
                            <div key={v.label} className="flex items-center gap-3 p-3 rounded border" style={{ background: v.bg, borderColor: v.bg }}>
                              <Icon className="w-4 h-4 flex-shrink-0" style={{ color: v.color }} />
                              <div>
                                <p className="font-bold text-base leading-tight" style={{ color: v.color }}>{v.value}</p>
                                <p className="text-[10px] text-gray-500">{v.label}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-6 text-center">
                        <Activity className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">Chưa có dữ liệu chỉ số sức khỏe</p>
                        <p className="text-xs text-gray-400 mt-1">Dữ liệu sẽ được cập nhật sau mỗi lần khám</p>
                      </div>
                    )}
                    {latestEmr && (
                      <p className="text-[10px] text-gray-400 mt-3 pt-3 border-t border-gray-100">
                        Cập nhật: {new Date(latestEmr.created_at).toLocaleDateString('vi-VN')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Prescriptions */}
                <div className="bg-white rounded border border-gray-200">
                  <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
                    <Pill className="w-4 h-4 text-[#0D6EFD]" />
                    <h3 className="font-semibold text-gray-800 text-sm">Đơn thuốc & Điều trị</h3>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {allRx.length === 0 ? (
                      <div className="py-10 text-center">
                        <Pill className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">Chưa có đơn thuốc</p>
                      </div>
                    ) : (
                      allRx.slice(0, 3).map((rx: any) => (
                        <div key={rx.id} className="px-5 py-4 flex items-start justify-between gap-3 hover:bg-gray-50">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-gray-800">Mã đơn: {rx.prescription_code}</p>
                            <p className="text-xs text-gray-500 mt-1">BS: {rx.doctor_name || '—'} • {rx.items_count} loại thuốc</p>
                          </div>
                          <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0',
                            rx.status === 'dispensed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700')}>
                            {rx.status === 'dispensed' ? 'Đã lấy thuốc' : 'Chờ lấy'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* ── RECENT VISITS TABLE ── */}
              <div className="bg-white rounded border border-gray-200">
                <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#0D6EFD]" />
                  <h3 className="font-semibold text-gray-800 text-sm">Lịch sử khám bệnh</h3>
                </div>
                {emrLoading ? (
                  <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
                ) : allEmr.length === 0 ? (
                  <div className="py-10 text-center">
                    <FileText className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Chưa có lịch sử khám bệnh</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          {['Ngày khám', 'Chuyên khoa', 'Bác sĩ', 'Kết luận', 'Trạng thái', 'Thao tác'].map(h => (
                            <th key={h} className="px-4 py-3 text-left font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {allEmr.slice(0, 5).map((h: any) => (
                          <tr key={h.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{new Date(h.created_at).toLocaleDateString('vi-VN')}</td>
                            <td className="px-4 py-3 text-gray-600">—</td>
                            <td className="px-4 py-3 text-gray-600">—</td>
                            <td className="px-4 py-3 text-gray-600 max-w-[140px] truncate">{h.chief_complaint || 'Không có'}</td>
                            <td className="px-4 py-3">
                              <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium',
                                h.status === 'locked' ? 'bg-green-100 text-green-700' : h.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700')}>
                                {h.status === 'locked' ? 'Hoàn thành' : h.status === 'completed' ? 'Đã xong' : 'Đang xử lý'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <button className="text-[#0D6EFD] hover:underline font-medium flex items-center gap-1">
                                <Eye className="w-3 h-3" /> Xem
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* ── AI SUPPORT SECTION (blue card like reference) ── */}
              <div className="rounded overflow-hidden grid grid-cols-1 lg:grid-cols-3 gap-0">
                {/* Left: AI card */}
                <div className="lg:col-span-1 p-6 flex flex-col justify-between" style={{ background: 'linear-gradient(135deg, #1565C0 0%, #0B3B78 100%)' }}>
                  <div>
                    <div className="w-12 h-12 bg-white/15 rounded-full flex items-center justify-center mb-4">
                      <Bot className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="font-bold text-white text-base mb-2">Trợ lý AI thông minh</h3>
                    <p className="text-white/70 text-xs leading-relaxed mb-4">
                      Hỗ trợ phân tích triệu chứng, đề xuất chẩn đoán, tóm tắt bệnh án và tư vấn sức khỏe 24/7.
                    </p>
                    <div className="flex items-center gap-1.5 mb-4">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-white/60 text-[10px]">Luôn sẵn sàng hỗ trợ bạn 24/7</span>
                    </div>
                    <button onClick={() => setAiPanelOpen(true)}
                      className="flex items-center gap-2 bg-white text-[#0B3B78] px-4 py-2 rounded font-semibold text-xs hover:bg-blue-50 transition-all">
                      <Sparkles className="w-3.5 h-3.5" /> Trò chuyện với AI
                    </button>
                  </div>
                </div>

                {/* Right: Services */}
                <div className="lg:col-span-2 bg-white border border-l-0 border-gray-200 p-6">
                  <p className="font-semibold text-gray-800 text-sm mb-4">Các dịch vụ chính</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { icon: Calendar, label: 'Khám tổng quát', color: '#0D6EFD', bg: '#EBF3FF' },
                      { icon: Stethoscope, label: 'Khám chuyên khoa', color: '#10B981', bg: '#ECFDF5' },
                      { icon: FlaskConical, label: 'Xét nghiệm', color: '#8B5CF6', bg: '#F5F3FF' },
                      { icon: Shield, label: 'Chẩn đoán hình ảnh', color: '#F59E0B', bg: '#FFFBEB' },
                    ].map(s => {
                      const Icon = s.icon;
                      return (
                        <button key={s.label} onClick={() => navigate('/appointments')}
                          className="flex flex-col items-center gap-2 p-4 rounded border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all text-center">
                          <div className="w-10 h-10 rounded flex items-center justify-center" style={{ background: s.bg }}>
                            <Icon className="w-5 h-5" style={{ color: s.color }} />
                          </div>
                          <p className="text-xs font-medium text-gray-700 leading-tight">{s.label}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ── HEALTH TIPS / NEWS ── */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-gray-800 text-base">Tin tức & Tư vấn sức khỏe</h2>
                  <button className="text-xs text-[#0D6EFD] hover:underline font-medium flex items-center gap-1">
                    Xem tất cả <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {HEALTH_NEWS.map(n => (
                    <div key={n.title} className="bg-white rounded border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group">
                      <div className="h-32 bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                        <HeartPulse className="w-12 h-12 text-blue-200" />
                      </div>
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{n.tag}</span>
                          <span className="text-[10px] text-gray-400">{n.date}</span>
                        </div>
                        <p className="text-xs font-semibold text-gray-800 leading-snug group-hover:text-[#0D6EFD] transition-colors">{n.title}</p>
                        <button className="mt-2 text-[10px] text-[#0D6EFD] font-medium hover:underline flex items-center gap-1">
                          Xem thêm <ArrowRight className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── FOOTER ── */}
              <div className="rounded overflow-hidden" style={{ background: 'linear-gradient(135deg, #0B3B78 0%, #0D4F9E 100%)' }}>
                <div className="px-8 py-8 grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 bg-white rounded flex items-center justify-center"><HeartPulse className="w-4 h-4 text-[#0D6EFD]" /></div>
                      <div><p className="font-bold text-white text-sm">AI Clinic</p><p className="text-[10px] text-white/50">Vì sức khỏe cộng đồng</p></div>
                    </div>
                    <p className="text-white/60 text-xs leading-relaxed">Hệ thống quản lý phòng khám thông minh với công nghệ AI tiên tiến.</p>
                  </div>
                  {[
                    { title: 'Liên hệ', items: ['📍 Số 123 Đường ABC, Q.XY, Hà Nội', '📞 0123 456 789', '✉️ support@aiclinic.vn'] },
                    { title: 'Liên kết nhanh', items: ['Trang chủ', 'Đặt lịch', 'Tin tức', 'Liên hệ'] },
                    { title: 'Hỗ trợ', items: ['Hướng dẫn sử dụng', 'Câu hỏi thường gặp', 'Chính sách bảo mật', 'Điều khoản dịch vụ'] },
                  ].map(col => (
                    <div key={col.title}>
                      <p className="font-semibold text-white text-xs mb-3">{col.title}</p>
                      <div className="space-y-1.5">
                        {col.items.map(item => (
                          <p key={item} className="text-white/60 text-xs hover:text-white cursor-pointer transition-colors">{item}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-white/10 px-8 py-3 flex items-center justify-between">
                  <p className="text-white/40 text-[10px]">© 2026 AI Clinic. Tất cả quyền được bảo lưu.</p>
                  <p className="text-white/40 text-[10px]">Chính sách bảo mật • Điều khoản sử dụng</p>
                </div>
              </div>

              <div className="h-4" />
            </div>
          </div>

          {/* ══════════════════ AI PANEL ══════════════════ */}
          {aiPanelOpen && (
            <div className="flex-shrink-0 w-[300px] xl:w-[320px] flex flex-col bg-white border-l border-gray-200 h-full" onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0" style={{ background: 'linear-gradient(135deg, #0B3B78, #1565C0)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-white text-sm">AI Assistant</p>
                        <span className="text-[9px] bg-white/20 text-white/90 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <Sparkles className="w-2.5 h-2.5" />Gemini
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-[10px] text-white/60">Luôn sẵn sàng 24/7</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={handleAIReset} className="w-7 h-7 rounded hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white"><RefreshCw className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setAiPanelOpen(false)} className="w-7 h-7 rounded hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white"><X className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                {/* Capability pills */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {['Đặt lịch', 'Lịch hẹn', 'Nhắc thuốc', 'Hướng dẫn khám'].map(t => (
                    <span key={t} className="text-[9px] bg-white/15 text-white/80 px-2 py-0.5 rounded border border-white/20">{t}</span>
                  ))}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
                {messages.map(m => (
                  <div key={m.id} className={cn('flex gap-2 max-w-[92%]', m.role === 'user' ? 'ml-auto flex-row-reverse' : '')}>
                    <div className={cn('w-6 h-6 flex-shrink-0 rounded flex items-center justify-center mt-0.5',
                      m.role === 'assistant' ? 'bg-[#0D6EFD] text-white' : 'bg-[#0B3B78] text-white')}>
                      {m.role === 'assistant' ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3 h-3" />}
                    </div>
                    <div className={cn('px-3 py-2 rounded text-xs leading-relaxed shadow-sm',
                      m.role === 'user' ? 'bg-[#0D6EFD] text-white rounded-tr-none'
                      : m.isGuardrail ? 'bg-amber-50 border border-amber-200 text-amber-900 rounded-tl-none'
                      : 'bg-white border border-gray-200 text-gray-700 rounded-tl-none')}>
                      {m.isGuardrail && (
                        <div className="flex items-center gap-1 text-amber-600 font-bold mb-1 text-[10px]">
                          <ShieldAlert className="w-3 h-3" /> AI Guardrail Active
                        </div>
                      )}
                      {m.isLoading || (m.role === 'assistant' && !m.content) ? (
                        <div className="flex items-center gap-1 py-0.5">
                          {[0, 150, 300].map(d => <span key={d} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                        </div>
                      ) : (
                        <div className="whitespace-pre-line">{renderMd(m.content)}</div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={aiBottomRef} />
              </div>

              {/* Quick chips */}
              <div className="flex-shrink-0 px-3 pt-2 flex gap-1.5 overflow-x-auto pb-1 border-t border-gray-100 bg-white">
                {QUICK_AI.map(q => (
                  <button key={q} onClick={() => handleAISend(q)} disabled={aiLoading}
                    className="whitespace-nowrap px-2.5 py-1 rounded text-[10px] bg-blue-50 border border-blue-100 text-[#0D6EFD] hover:bg-blue-100 transition-colors disabled:opacity-50 flex-shrink-0">
                    {q}
                  </button>
                ))}
              </div>

              {/* Input */}
              <div className="flex-shrink-0 p-3 bg-white border-t border-gray-100">
                <div className="flex gap-2">
                  <input value={aiInput} onChange={e => setAiInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAISend()}
                    placeholder="Nhập câu hỏi của bạn..."
                    disabled={aiLoading}
                    className="flex-1 text-xs px-3 py-2 border border-gray-200 rounded outline-none focus:border-[#0D6EFD] focus:ring-1 focus:ring-blue-200 bg-gray-50 text-gray-700 placeholder-gray-400 disabled:opacity-50" />
                  <button onClick={() => handleAISend()} disabled={aiLoading || !aiInput.trim()}
                    className="w-8 h-8 flex-shrink-0 bg-[#0D6EFD] hover:bg-[#0B5ED7] text-white rounded flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed">
                    {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-center text-[10px] text-gray-400 mt-2">🛡️ AI chỉ hỗ trợ hành chính • Không tư vấn y tế</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
