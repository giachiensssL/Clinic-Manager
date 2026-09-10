import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { Calendar, FileText, Pill, LogOut, Bot, MessageCircle, Bell, CheckCircle2, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const upcomingAppointments = [
  { id: 'a1', doctor: 'BS. Trần Thị Hương', specialty: 'Tim mạch', date: '10/09/2026', time: '09:30 AM', status: 'confirmed' },
  { id: 'a2', doctor: 'BS. Nguyễn Văn Bình', specialty: 'Nội khoa', date: '18/09/2026', time: '08:00 AM', status: 'pending' },
];

const recentHistory = [
  { id: 'h1', date: '25/08/2026', doctor: 'BS. Trần Thị Hương', specialty: 'Tim mạch', diagnosis: 'Tăng huyết áp nguyên phát (I10)', status: 'completed' },
  { id: 'h2', date: '10/07/2026', doctor: 'BS. Lê Thị Phương', specialty: 'Nội khoa', diagnosis: 'Viêm họng cấp', status: 'completed' },
  { id: 'h3', date: '15/05/2026', doctor: 'BS. Nguyễn Văn Bình', specialty: 'Nội khoa', diagnosis: 'Khám sức khỏe tổng quát', status: 'completed' },
];

const currentPrescriptions = [
  { name: 'Amlodipine 5mg', usage: '1 viên/ngày', morning: true, duration: 'Dùng dài hạn', remain: '30 ngày còn lại' },
  { name: 'Losartan 50mg', usage: '1 viên/ngày', morning: false, duration: 'Dùng dài hạn', remain: '30 ngày còn lại' },
];

export default function PatientPortal() {
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const navigate = useNavigate();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#1e3a5f]">Xin chào, {user?.full_name}!</h1>
          <p className="text-slate-500 mt-1">Chào mừng bạn đến với Cổng thông tin Bệnh nhân — Clinic AI</p>
        </div>
        <Button
          variant="outline"
          onClick={() => { logout(); navigate('/login'); }}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <LogOut className="w-4 h-4 mr-2" /> Đăng xuất
        </Button>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className="hover:shadow-md transition-shadow cursor-pointer border-[#0ea5e9]/20"
          onClick={() => navigate('/appointments')}
        >
          <CardContent className="p-6 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-[#0ea5e9]/10 flex items-center justify-center mx-auto text-[#0ea5e9]">
              <Calendar className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold">Lịch Hẹn</h3>
            <p className="text-slate-500 text-sm">Xem và đặt lịch khám với bác sĩ</p>
            <Button className="w-full bg-[#0ea5e9] hover:bg-[#0284c7]">Đặt lịch ngay</Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer border-purple-200">
          <CardContent className="p-6 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center mx-auto text-purple-600">
              <FileText className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold">Hồ Sơ Sức Khỏe</h3>
            <p className="text-slate-500 text-sm">Xem kết quả khám và lịch sử bệnh án</p>
            <Button variant="outline" className="w-full border-purple-300 text-purple-700">Xem hồ sơ</Button>
          </CardContent>
        </Card>

        <Card
          className="hover:shadow-md transition-shadow cursor-pointer border-violet-200"
          onClick={() => navigate('/ai-assistant')}
        >
          <CardContent className="p-6 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-violet-100 flex items-center justify-center mx-auto text-violet-600">
              <Bot className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold">Trợ lý AI</h3>
            <p className="text-slate-500 text-sm">Hỏi đáp hành chính và đặt lịch nhanh</p>
            <Button variant="outline" className="w-full border-violet-300 text-violet-700">
              <MessageCircle className="w-4 h-4 mr-2" /> Chat ngay
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Appointments */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#0ea5e9]" />
            Lịch Hẹn Sắp Tới
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {upcomingAppointments.map(apt => (
            <div
              key={apt.id}
              className={`p-4 border rounded-lg flex justify-between items-center ${
                apt.status === 'confirmed' ? 'bg-blue-50 border-blue-100' : 'bg-amber-50 border-amber-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  apt.status === 'confirmed' ? 'bg-[#0ea5e9]/20 text-[#0ea5e9]' : 'bg-amber-200 text-amber-700'
                }`}>
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-[#1e3a5f]">{apt.specialty} — {apt.doctor}</p>
                  <p className="text-slate-600 text-sm mt-0.5">
                    <Clock className="w-3.5 h-3.5 inline mr-1" />
                    {apt.date} • {apt.time}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={apt.status === 'confirmed' ? 'bg-[#0ea5e9]' : 'bg-amber-500'}>
                  {apt.status === 'confirmed' ? 'Đã xác nhận' : 'Chờ xác nhận'}
                </Badge>
                <Button variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50">Hủy</Button>
              </div>
            </div>
          ))}
          {upcomingAppointments.length === 0 && (
            <p className="text-center text-slate-400 py-4">Không có lịch hẹn sắp tới</p>
          )}
        </CardContent>
      </Card>

      {/* Recent History + Prescriptions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Visit History */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Lịch Sử Khám Gần Đây
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentHistory.map(h => (
              <div key={h.id} className="p-3 border rounded-lg hover:bg-slate-50">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm text-[#1e3a5f]">{h.specialty} — {h.doctor}</p>
                    <p className="text-xs text-slate-500 mt-1">{h.date}</p>
                    <p className="text-xs text-slate-600 mt-1 bg-slate-100 px-2 py-0.5 rounded inline-block">{h.diagnosis}</p>
                  </div>
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">Hoàn thành</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Current Prescriptions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Pill className="w-5 h-5 text-teal-500" />
              Đơn Thuốc Hiện Tại
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {currentPrescriptions.map((rx, i) => (
              <div key={i} className="p-3 border border-teal-100 rounded-lg bg-teal-50/40">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-sm text-teal-900">{rx.name}</p>
                    <p className="text-xs text-teal-700 mt-1">{rx.usage} • {rx.morning ? '☀️ Buổi sáng' : '🌙 Buổi tối'}</p>
                    <p className="text-xs text-slate-500 mt-1">{rx.duration}</p>
                  </div>
                  <span className="text-xs text-teal-600 bg-teal-100 px-2 py-1 rounded-full">{rx.remain}</span>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full mt-2 border-teal-200 text-teal-700">
              <Pill className="w-4 h-4 mr-2" /> Xem tất cả đơn thuốc
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
