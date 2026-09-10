import { useAuthStore } from '@/store/authStore';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users, Calendar, CheckCircle2, DollarSign, Stethoscope, Bot,
  Clock, TrendingUp, AlertTriangle, FileText
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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

  // ── ADMIN DASHBOARD ──────────────────────────────────
  const renderAdminDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tổng Bệnh Nhân', value: '1,284', sub: '+12% so với tháng trước', icon: Users, color: 'text-blue-600' },
          { label: 'Lịch Hẹn Hôm Nay', value: '24', sub: '4 đang chờ • 5 đang khám', icon: Calendar, color: 'text-sky-600' },
          { label: 'Doanh Thu (Ngày)', value: '45.6M', sub: '+8% so với hôm qua', icon: DollarSign, color: 'text-green-600' },
          { label: 'Yêu Cầu AI (Tháng)', value: '3,456', sub: '28 bị chặn bởi guardrail', icon: Bot, color: 'text-violet-600' },
        ].map(s => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{s.label}</CardTitle>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Doanh thu 7 ngày qua (triệu đồng)</CardTitle></CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(v) => `${v}M đ`} />
                <Area type="monotone" dataKey="total" stroke="#0ea5e9" fill="#e0f2fe" name="Doanh thu" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Trạng thái lịch hẹn hôm nay</CardTitle></CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={appointmentStatusData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {appointmentStatusData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
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
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-sm text-muted-foreground">Lịch: {p.time} • {p.reason}</p>
                  </div>
                  <div className="text-right">
                    <Badge className={p.status === 'waiting' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}>
                      {p.status === 'waiting' ? `Chờ ${p.wait}` : 'Chưa tới'}
                    </Badge>
                    {p.status === 'waiting' && (
                      <Button size="sm" className="mt-1 h-7 text-xs bg-[#0ea5e9] hover:bg-[#0284c7] ml-2">
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              <div key={i} className={`flex items-center justify-between p-3 border rounded-lg ${
                p.status === 'consultation' ? 'bg-purple-50 border-purple-200' :
                p.status === 'waiting' ? 'bg-amber-50 border-amber-200' : 'hover:bg-slate-50'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#1e3a5f] text-white flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.code} • {p.doctor} • {p.specialty}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                <div key={inv.code} className="flex items-center justify-between p-2.5 border rounded-lg hover:bg-slate-50">
                  <div>
                    <p className="font-medium text-sm">{inv.code}</p>
                    <p className="text-xs text-slate-500">{inv.patient} • {inv.date}</p>
                  </div>
                  <div className="flex items-center gap-3">
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

      {user?.role === 'admin' && renderAdminDashboard()}
      {user?.role === 'doctor' && renderDoctorDashboard()}
      {user?.role === 'receptionist' && renderReceptionistDashboard()}
      {user?.role === 'accountant' && renderAccountantDashboard()}
    </div>
  );
}
