import { useAuthStore } from '@/store/authStore';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users, Calendar, CheckCircle2, DollarSign, Stethoscope, Bot,
  Clock, TrendingUp, AlertTriangle, FileText, UserCog, Shield, ShieldCheck
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { adminKPIs, aiInsights, mockAuditLogs, mockSystemNotifications } from '@/mock/adminData';

const revenueData = [
  { name: 'T2', total: 35 },
  { name: 'T3', total: 42 },
  { name: 'T4', total: 38 },
  { name: 'T5', total: 45 },
  { name: 'T6', total: 55 },
  { name: 'T7', total: 60 },
  { name: 'CN', total: 48 },
];

const appointmentStatusData = [
  { name: 'Hoàn thành', value: 45 },
  { name: 'Đã đặt', value: 25 },
  { name: 'Hủy', value: 10 },
  { name: 'Đang khám', value: 20 },
];
const PIE_COLORS = ['#22c55e', '#3b82f6', '#ef4444', '#a855f7'];

const receptionWaitingList = [
  { name: 'Nguyễn Văn Minh', code: 'BN001234', time: '08:30', wait: '15 phút', doctor: 'BS. Hương', specialty: 'Tim mạch', status: 'waiting' },
  { name: 'Trần Thị Lan', code: 'BN001235', time: '09:00', wait: '5 phút', doctor: 'BS. Bình', specialty: 'Nội khoa', status: 'waiting' },
  { name: 'Lê Quang Hùng', code: 'BN001236', time: '09:30', wait: 'Chưa tới', doctor: 'BS. Phương', specialty: 'Da liễu', status: 'scheduled' },
  { name: 'Phạm Thị Hoa', code: 'BN001237', time: '10:00', wait: 'Chưa tới', doctor: 'BS. Hương', specialty: 'Tim mạch', status: 'scheduled' },
  { name: 'Võ Thanh Tùng', code: 'BN001238', time: '10:30', wait: 'Đang khám', doctor: 'BS. Lan', specialty: 'Nhi khoa', status: 'consultation' },
];

const accountantRecentInvoices = [
  { code: 'HD123456', patient: 'Nguyễn Văn Minh', amount: 550000, status: 'paid', date: '09/09/2026' },
  { code: 'HD123457', patient: 'Trần Thị Lan', amount: 430000, status: 'unpaid', date: '09/09/2026' },
  { code: 'HD123458', patient: 'Phạm Thị Hoa', amount: 215000, status: 'partially_paid', date: '09/09/2026' },
  { code: 'HD123459', patient: 'Lê Quang Hùng', amount: 680000, status: 'paid', date: '08/09/2026' },
  { code: 'HD123460', patient: 'Võ Thanh Tùng', amount: 320000, status: 'unpaid', date: '08/09/2026' },
];

const accountantMonthlyData = [
  { month: 'T6', thu: 42, chua: 8 },
  { month: 'T7', thu: 51, chua: 12 },
  { month: 'T8', thu: 63, chua: 9 },
  { month: 'T9', thu: 15, chua: 6 },
];

export default function Dashboard() {
  const user = useAuthStore(state => state.user);

  if (user?.role === 'patient') {
    return <Navigate to="/portal" replace />;
  }
  if (user?.role === 'doctor') {
    return <Navigate to="/doctor" replace />;
  }
  if (user?.role === 'receptionist') {
    return <Navigate to="/receptionist" replace />;
  }

  // ── ADMIN DASHBOARD ──────────────────────────────────
  const renderAdminDashboard = () => (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tổng người dùng', value: adminKPIs.totalUsers.value, sub: `${adminKPIs.totalUsers.change} so với tuần trước`, icon: Users, color: 'text-blue-600', link: '/admin/users' },
          { label: 'Nhân viên', value: adminKPIs.totalStaff.value, sub: `${adminKPIs.totalStaff.change} nhân viên mới`, icon: UserCog, color: 'text-sky-600', link: '/admin/staff' },
          { label: 'Lịch khám hôm nay', value: adminKPIs.todayAppointments.value, sub: `${adminKPIs.todayAppointments.change} so với hôm qua`, icon: Calendar, color: 'text-indigo-600', link: '/admin/schedules' },
          { label: 'Doanh thu hôm nay', value: adminKPIs.todayRevenue.value, sub: `${adminKPIs.todayRevenue.change} so với hôm qua`, icon: DollarSign, color: 'text-green-600', link: '/reports?tab=overview' },
        ].map(s => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{s.label}</CardTitle>
              <div className={`p-2 rounded-lg bg-slate-50 ${s.color}`}>
                <s.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-emerald-600 font-medium">{s.sub}</p>
                <Link to={s.link} className="text-xs text-blue-600 hover:underline">Xem chi tiết &rarr;</Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Charts */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Thống kê hoạt động hệ thống</CardTitle>
              <select className="text-sm border border-slate-200 rounded-lg px-2 py-1 outline-none"><option>7 ngày gần đây</option></select>
            </CardHeader>
            <CardContent className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip />
                  <Area type="monotone" dataKey="total" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" name="Lượt truy cập" />
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Phân bổ người dùng</CardTitle></CardHeader>
              <CardContent className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={[{name: 'Bệnh nhân', value: 855}, {name: 'Bác sĩ', value: 154}, {name: 'Lễ tân', value: 127}, {name: 'Kế toán', value: 76}]} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                      <Cell fill="#3b82f6" />
                      <Cell fill="#10b981" />
                      <Cell fill="#f59e0b" />
                      <Cell fill="#8b5cf6" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader><CardTitle>Nhật ký hệ thống gần đây</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockAuditLogs.slice(0, 4).map(log => (
                    <div key={log.id} className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-800">{log.user} <span className="text-slate-400 font-normal">({log.role})</span></span>
                        <span className="text-xs text-slate-500">{log.action} - {log.module}</span>
                      </div>
                      <span className="text-xs text-slate-400">{log.time.split(' ')[1]}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* AI Sidebar & Alerts */}
        <div className="space-y-6">
          <Card className="border-[#0D6EFD]/20 shadow-md shadow-[#0D6EFD]/5">
            <CardHeader className="bg-[#0D6EFD]/5 pb-4 border-b border-[#0D6EFD]/10 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#0D6EFD] flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <CardTitle className="text-[#0B3B78]">Phân tích AI quản trị</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                {aiInsights.slice(0, 5).map(insight => (
                  <div key={insight.id} className="flex gap-3 text-sm">
                    <div className="mt-0.5 flex-shrink-0">
                      {insight.type === 'error' ? <Shield className="w-4 h-4 text-red-500" /> :
                       insight.type === 'warning' ? <ShieldCheck className="w-4 h-4 text-amber-500" /> :
                       insight.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> :
                       <Bot className="w-4 h-4 text-blue-500" />}
                    </div>
                    <div>
                      <p className={cn("font-medium", 
                        insight.type === 'error' ? 'text-red-700' :
                        insight.type === 'warning' ? 'text-amber-700' : 'text-slate-700'
                      )}>{insight.message}</p>
                      <p className="text-xs text-slate-400 mt-1">{insight.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-6 bg-[#0D6EFD] hover:bg-blue-600 text-white text-sm font-medium py-2 rounded-lg transition-colors">
                Xem báo cáo chi tiết
              </button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row justify-between items-center pb-2 border-b border-slate-100">
              <CardTitle>Thông báo hệ thống</CardTitle>
              <Link to="/admin/notifications" className="text-xs text-blue-600 hover:underline">Xem tất cả</Link>
            </CardHeader>
            <CardContent className="pt-4 p-0">
              <div className="divide-y divide-slate-100">
                {mockSystemNotifications.slice(0, 4).map(n => (
                  <div key={n.id} className="p-4 flex gap-3 hover:bg-slate-50 transition-colors">
                    <div className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", n.priority === 'high' ? 'bg-red-500' : 'bg-blue-500')} />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{n.content}</p>
                      <p className="text-xs text-slate-400 mt-1">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  // ── DOCTOR DASHBOARD ──────────────────────────────────
  const renderDoctorDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Lịch Khám Hôm Nay', value: '12', icon: Calendar, color: 'text-sky-600' },
          { label: 'Đang Chờ', value: '4', icon: Users, color: 'text-amber-600' },
          { label: 'Đã Khám Xong', value: '6', icon: CheckCircle2, color: 'text-green-600' },
        ].map(s => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{s.label}</CardTitle>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Hàng chờ bệnh nhân</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'Nguyễn Văn Minh', time: '08:30', wait: '15 phút', reason: 'Đau tức ngực', status: 'waiting' },
                { name: 'Trần Thị Lan', time: '09:00', wait: '5 phút', reason: 'Mụn da mặt', status: 'waiting' },
                { name: 'Lê Quang Hùng', time: '09:30', wait: 'Chưa tới', reason: 'Tái khám', status: 'scheduled' },
                { name: 'Phạm Thị Hoa', time: '10:00', wait: 'Chưa tới', reason: 'Sốt cao', status: 'scheduled' },
              ].map((p, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg hover:bg-slate-50 gap-3">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-sm text-muted-foreground">Lịch: {p.time} • {p.reason}</p>
                  </div>
                  <div className="text-left sm:text-right flex items-center sm:block gap-2">
                    <Badge className={p.status === 'waiting' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}>
                      {p.status === 'waiting' ? `Chờ ${p.wait}` : 'Chưa tới'}
                    </Badge>
                    {p.status === 'waiting' && (
                      <Button size="sm" className="h-7 text-xs bg-[#0ea5e9] hover:bg-[#0284c7] sm:mt-1">
                        Gọi khám
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Hoạt động gần đây</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { text: 'Ký hồ sơ bệnh án EMR0018 — Nguyễn Văn Minh', time: '30 phút trước', icon: FileText, color: 'text-purple-600' },
                { text: 'AI tóm tắt EMR bệnh nhân BN001230', time: '1 giờ trước', icon: Bot, color: 'text-violet-600' },
                { text: 'Kê đơn thuốc DT001240 — Lê Quang Hùng', time: '2 giờ trước', icon: Stethoscope, color: 'text-blue-600' },
              ].map((a, i) => (
                <div key={i} className="flex items-start gap-3 p-3 border rounded-lg">
                  <a.icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${a.color}`} />
                  <div>
                    <p className="text-sm font-medium">{a.text}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // ── RECEPTIONIST DASHBOARD ──────────────────────────
  const renderReceptionistDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Hôm Nay', value: '24', sub: 'Tổng lịch hẹn', color: 'text-slate-800' },
          { label: 'Chờ Khám', value: '5', sub: 'Đang chờ được gọi', color: 'text-amber-600' },
          { label: 'Đang Khám', value: '3', sub: 'Đang trong phòng', color: 'text-blue-600' },
          { label: 'Đã Hoàn Thành', value: '14', sub: 'Hôm nay', color: 'text-green-600' },
        ].map(s => (
          <Card key={s.label}>
            <CardHeader className="pb-2"><CardTitle className="text-sm">{s.label}</CardTitle></CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <p className="text-xs text-slate-500 mt-1">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Danh sách chờ hôm nay</CardTitle>
            <Button size="sm" className="bg-[#0ea5e9] hover:bg-[#0284c7]">+ Đặt lịch mới</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {receptionWaitingList.map((p, i) => (
              <div key={i} className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-3 ${
                p.status === 'consultation' ? 'bg-purple-50 border-purple-200' :
                p.status === 'waiting' ? 'bg-amber-50 border-amber-200' : 'hover:bg-slate-50'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#1e3a5f] text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.code} • {p.doctor} • {p.specialty}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:ml-auto">
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-[#1e3a5f]">{p.time}</p>
                    <p className="text-xs text-amber-600">{p.wait}</p>
                  </div>
                  <Badge className={
                    p.status === 'consultation' ? 'bg-purple-100 text-purple-700' :
                    p.status === 'waiting' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                  }>
                    {p.status === 'consultation' ? 'Đang khám' : p.status === 'waiting' ? 'Chờ khám' : 'Chưa tới'}
                  </Badge>
                  {p.status === 'scheduled' && (
                    <Button size="sm" variant="outline" className="h-7 text-xs">Check-in</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ── ACCOUNTANT DASHBOARD ──────────────────────────────
  const renderAccountantDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Doanh Thu Hôm Nay', value: '1.195M', sub: 'Tổng hóa đơn', color: 'text-blue-600' },
          { label: 'Đã Thu', value: '770K', sub: '2 hóa đơn đã thanh toán', color: 'text-green-600' },
          { label: 'Chưa Thu', value: '425K', sub: '3 hóa đơn còn lại', color: 'text-amber-600' },
          { label: 'Công Nợ Tháng', value: '8.5M', sub: 'Cần thu trước 30/09', color: 'text-red-600' },
        ].map(s => (
          <Card key={s.label}>
            <CardHeader className="pb-2"><CardTitle className="text-sm">{s.label}</CardTitle></CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <p className="text-xs text-slate-500 mt-1">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Thu & Chưa thu theo tháng (triệu đồng)</CardTitle></CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={accountantMonthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(v) => `${v}M đ`} />
                <Legend />
                <Bar dataKey="thu" fill="#22c55e" name="Đã thu" radius={[4, 4, 0, 0]} />
                <Bar dataKey="chua" fill="#f59e0b" name="Chưa thu" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Hóa đơn gần đây</CardTitle>
              <Button variant="outline" size="sm">Xem tất cả</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {accountantRecentInvoices.map(inv => (
                <div key={inv.code} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg hover:bg-slate-50 gap-3">
                  <div>
                    <p className="font-medium text-sm">{inv.code}</p>
                    <p className="text-xs text-slate-500">{inv.patient} • {inv.date}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className="font-bold text-sm">{inv.amount.toLocaleString()}đ</span>
                    <Badge
                      className={
                        inv.status === 'paid'
                          ? 'bg-green-100 text-green-700 hover:bg-green-100'
                          : inv.status === 'partially_paid'
                          ? 'bg-amber-100 text-amber-700 hover:bg-amber-100'
                          : 'bg-red-100 text-red-700 hover:bg-red-100'
                      }
                    >
                      {inv.status === 'paid' ? 'Đã thu' : inv.status === 'partially_paid' ? 'Một phần' : 'Chưa thu'}
                    </Badge>
                    {inv.status !== 'paid' && (
                      <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700">Thu tiền</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Xin chào, {user?.full_name}!</h1>
        <p className="text-slate-500">
          Chào mừng bạn quay lại hệ thống quản lý phòng khám với vai trò{' '}
          <span className="font-semibold text-[#0ea5e9] uppercase">{user?.role}</span>.
        </p>
      </div>

      {(user?.role as string) === 'admin' && renderAdminDashboard()}
      {(user?.role as string) === 'doctor' && renderDoctorDashboard()}
      {(user?.role as string) === 'receptionist' && renderReceptionistDashboard()}
      {(user?.role as string) === 'accountant' && renderAccountantDashboard()}
    </div>
  );
}
