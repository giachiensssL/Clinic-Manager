import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download, TrendingUp, TrendingDown, Users, Activity, ShieldAlert, Clock, MousePointerClick } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';
import { cn } from '@/lib/utils';

// --- MOCK DATA ---
const userGrowthData = [
  { month: 'T1', admin: 2, staff: 15, patient: 120 },
  { month: 'T2', admin: 2, staff: 16, patient: 145 },
  { month: 'T3', admin: 2, staff: 18, patient: 190 },
  { month: 'T4', admin: 3, staff: 19, patient: 240 },
  { month: 'T5', admin: 3, staff: 22, patient: 280 },
  { month: 'T6', admin: 3, staff: 24, patient: 350 },
  { month: 'T7', admin: 4, staff: 25, patient: 400 },
];

const userRoleData = [
  { name: 'Bệnh nhân', value: 400 },
  { name: 'Bác sĩ', value: 15 },
  { name: 'Lễ tân', value: 6 },
  { name: 'Kế toán', value: 4 },
  { name: 'Quản trị', value: 4 },
];

const activityTimeData = [
  { time: '00:00', actions: 12 },
  { time: '04:00', actions: 5 },
  { time: '08:00', actions: 145 },
  { time: '12:00', actions: 98 },
  { time: '16:00', actions: 167 },
  { time: '20:00', actions: 45 },
];

const activityTypeData = [
  { name: 'Đăng nhập', value: 350 },
  { name: 'Xem dữ liệu', value: 850 },
  { name: 'Thêm/Sửa', value: 240 },
  { name: 'Xóa', value: 15 },
  { name: 'Lỗi/Cảnh báo', value: 8 },
];

const overviewSystemData = [
  { day: 'T2', cpu: 45, ram: 60, reqs: 1200 },
  { day: 'T3', cpu: 55, ram: 65, reqs: 1450 },
  { day: 'T4', cpu: 40, ram: 58, reqs: 1100 },
  { day: 'T5', cpu: 75, ram: 80, reqs: 2100 },
  { day: 'T6', cpu: 65, ram: 70, reqs: 1800 },
  { day: 'T7', cpu: 85, ram: 85, reqs: 2500 },
  { day: 'CN', cpu: 30, ram: 45, reqs: 800 },
];

const COLORS = ['#0ea5e9', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e'];

// --- COMPONENTS ---
function UserReport() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Tổng người dùng', value: '1,284', change: '+12.5%', up: true, icon: Users, color: 'text-blue-600' },
          { label: 'Người dùng mới (tháng)', value: '145', change: '+5.2%', up: true, icon: TrendingUp, color: 'text-green-600' },
          { label: 'Tỷ lệ hoạt động', value: '82%', change: '-1.5%', up: false, icon: Activity, color: 'text-amber-600' },
          { label: 'Tài khoản bị khóa', value: '12', change: '+2', up: false, icon: ShieldAlert, color: 'text-red-600' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 relative overflow-hidden">
              <s.icon className={cn("absolute right-4 top-4 w-8 h-8 opacity-10", s.color)} />
              <p className="text-xs font-medium text-slate-500 uppercase">{s.label}</p>
              <p className="text-2xl font-bold text-slate-800 mt-2">{s.value}</p>
              <p className={`text-xs mt-1 flex items-center gap-1 ${s.up ? 'text-green-600' : 'text-red-600'}`}>
                {s.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {s.change} so với tháng trước
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Tăng trưởng người dùng (7 tháng)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <RechartsTooltip />
                <Legend />
                <Area type="monotone" dataKey="patient" stackId="1" stroke="#0ea5e9" fill="#38bdf8" name="Bệnh nhân" />
                <Area type="monotone" dataKey="staff" stackId="1" stroke="#6366f1" fill="#818cf8" name="Nhân viên y tế" />
                <Area type="monotone" dataKey="admin" stackId="1" stroke="#8b5cf6" fill="#a78bfa" name="Quản trị" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cơ cấu vai trò</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={userRoleData} cx="50%" cy="45%" innerRadius={60} outerRadius={85} paddingAngle={2} dataKey="value">
                  {userRoleData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ActivityReport() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Tổng lượt tương tác', value: '45,210', change: '+18.2%', up: true },
          { label: 'Thời gian trung bình/phiên', value: '14m 20s', change: '+1m', up: true },
          { label: 'Lượt truy cập lỗi (4xx/5xx)', value: '124', change: '-15%', up: true },
          { label: 'Cảnh báo bảo mật', value: '8', change: '+2', up: false },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-slate-500 uppercase">{s.label}</p>
              <p className="text-2xl font-bold text-slate-800 mt-2">{s.value}</p>
              <p className={`text-xs mt-1 flex items-center gap-1 ${s.up ? 'text-green-600' : 'text-red-600'}`}>
                {s.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {s.change} so với kỳ trước
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mật độ hoạt động theo giờ</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityTimeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <RechartsTooltip cursor={{fill: '#f1f5f9'}} />
                <Bar dataKey="actions" fill="#6366f1" radius={[4, 4, 0, 0]} name="Lượt thao tác" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Phân loại thao tác hệ thống</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={activityTypeData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label>
                  {activityTypeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function OverviewReport() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Trạng thái máy chủ', value: 'Bình thường', text: 'text-green-600' },
          { label: 'Tải CPU trung bình', value: '45%', text: 'text-slate-800' },
          { label: 'Tải RAM trung bình', value: '62%', text: 'text-slate-800' },
          { label: 'Uptime (7 ngày)', value: '99.99%', text: 'text-green-600' },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4 text-center py-6">
              <p className="text-xs font-medium text-slate-500 uppercase mb-2">{s.label}</p>
              <p className={cn("text-2xl font-bold", s.text)}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hiệu suất và Tài nguyên máy chủ (7 ngày)</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={overviewSystemData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} />
              <RechartsTooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="cpu" stroke="#ef4444" name="CPU Usage (%)" strokeWidth={2} />
              <Line yAxisId="left" type="monotone" dataKey="ram" stroke="#eab308" name="RAM Usage (%)" strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="reqs" stroke="#3b82f6" name="Requests/ngày" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Reports() {
  const [period, setPeriod] = useState('month');
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tab = searchParams.get('tab') || 'overview';

  let title = 'Báo cáo tổng quan';
  let desc = 'Theo dõi hiệu suất và trạng thái toàn diện của hệ thống';
  if (tab === 'users') {
    title = 'Báo cáo người dùng';
    desc = 'Thống kê lượng người dùng, vai trò và tình trạng tài khoản';
  } else if (tab === 'activities') {
    title = 'Báo cáo hoạt động';
    desc = 'Phân tích lượng tương tác, phiên đăng nhập và hành vi hệ thống';
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-sm text-slate-500 mt-1">{desc}</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[160px] bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">7 ngày qua</SelectItem>
              <SelectItem value="month">Tháng này</SelectItem>
              <SelectItem value="quarter">Quý này</SelectItem>
              <SelectItem value="year">Năm nay</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-[#1e3a5f] hover:bg-[#152943]">
            <Download className="w-4 h-4 mr-2" /> Xuất báo cáo
          </Button>
        </div>
      </div>

      {tab === 'users' && <UserReport />}
      {tab === 'activities' && <ActivityReport />}
      {tab === 'overview' && <OverviewReport />}
    </div>
  );
}
