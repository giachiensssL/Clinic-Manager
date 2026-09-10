import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download, TrendingUp, TrendingDown } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const revenueData = [
  { month: 'T1', revenue: 285, patients: 420 },
  { month: 'T2', revenue: 310, patients: 465 },
  { month: 'T3', revenue: 278, patients: 398 },
  { month: 'T4', revenue: 335, patients: 512 },
  { month: 'T5', revenue: 362, patients: 550 },
  { month: 'T6', revenue: 318, patients: 480 },
  { month: 'T7', revenue: 345, patients: 525 },
  { month: 'T8', revenue: 390, patients: 590 },
  { month: 'T9', revenue: 125, patients: 185 },
];

const specialtyData = [
  { name: 'Nội khoa', value: 35 },
  { name: 'Tim mạch', value: 22 },
  { name: 'Da liễu', value: 18 },
  { name: 'Nhi khoa', value: 15 },
  { name: 'Khác', value: 10 },
];

const COLORS = ['#0ea5e9', '#1e3a5f', '#7c3aed', '#22c55e', '#94a3b8'];

const topDoctors = [
  { name: 'BS. Trần Thị Hương', specialty: 'Tim mạch', patients: 198, revenue: '89.5M' },
  { name: 'BS. Nguyễn Văn Bình', specialty: 'Nội khoa', patients: 175, revenue: '72.3M' },
  { name: 'BS. Lê Thị Phương', specialty: 'Da liễu', patients: 142, revenue: '68.1M' },
  { name: 'BS. Phạm Văn Đức', specialty: 'Nhi khoa', patients: 134, revenue: '55.8M' },
  { name: 'BS. Trần Văn Lan', specialty: 'Nội khoa', patients: 121, revenue: '51.2M' },
];

export default function Reports() {
  const [period, setPeriod] = useState('year');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Báo cáo & Thống kê</h1>
          <p className="text-sm text-slate-500 mt-1">Tổng quan hiệu suất hoạt động phòng khám</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">7 ngày qua</SelectItem>
              <SelectItem value="month">Tháng này</SelectItem>
              <SelectItem value="quarter">Quý này</SelectItem>
              <SelectItem value="year">Năm 2026</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" /> Xuất báo cáo
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Bệnh nhân mới', value: '1,284', change: '+12%', up: true },
          { label: 'Tổng lượt khám', value: '4,892', change: '+8%', up: true },
          { label: 'Tỷ lệ hoàn thành', value: '94.2%', change: '+2.1%', up: true },
          { label: 'Tổng doanh thu', value: '2.748M', change: '+15%', up: true },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className="text-2xl font-bold text-slate-800">{s.value}</p>
              <p className={`text-xs mt-1 flex items-center gap-1 ${s.up ? 'text-green-600' : 'text-red-600'}`}>
                {s.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {s.change} so với kỳ trước
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue + Specialty Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Doanh thu & Lượt khám theo tháng (triệu đồng)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="revenue" fill="#0ea5e9" name="Doanh thu (tr.đ)" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="patients" fill="#1e3a5f" name="Lượt khám" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Phân bổ theo chuyên khoa</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={specialtyData}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {specialtyData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `${v}%`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Doctors */}
      <Card>
        <CardHeader>
          <CardTitle>Top Bác Sĩ (Năm 2026)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topDoctors.map((doc, i) => (
              <div key={i} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-slate-50">
                <div className="w-8 h-8 rounded-full bg-[#1e3a5f] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{doc.name}</p>
                  <p className="text-xs text-slate-500">{doc.specialty}</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-[#0ea5e9]">{doc.patients}</p>
                  <p className="text-xs text-slate-500">Lượt khám</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">{doc.revenue}</p>
                  <p className="text-xs text-slate-500">Doanh thu</p>
                </div>
                <div className="w-32">
                  <div className="h-2 bg-slate-100 rounded-full">
                    <div
                      className="h-2 bg-[#0ea5e9] rounded-full"
                      style={{ width: `${(doc.patients / 198) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
