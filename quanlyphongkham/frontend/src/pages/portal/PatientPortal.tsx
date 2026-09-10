import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { Calendar, FileText, Pill, LogOut, Bot, MessageCircle, Bell, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { patientsAPI, appointmentsAPI, emrAPI, prescriptionsAPI } from '@/services/api';

export default function PatientPortal() {
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const navigate = useNavigate();

  const { data: patientProfile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['patient-me'],
    queryFn: async () => {
      const res = await patientsAPI.getMe();
      return res.data;
    }
  });

  const patientId = patientProfile?.id;

  const { data: aptsRes } = useQuery({
    queryKey: ['my-appointments'],
    queryFn: async () => {
      const res = await appointmentsAPI.getAll({});
      return res.data;
    }
  });

  const { data: emrRes } = useQuery({
    queryKey: ['my-emr', patientId],
    queryFn: async () => {
      const res = await emrAPI.getByPatient(patientId!);
      return res.data;
    },
    enabled: !!patientId
  });

  const { data: rxRes } = useQuery({
    queryKey: ['my-prescriptions', patientId],
    queryFn: async () => {
      const res = await prescriptionsAPI.getAll({ patient_id: patientId });
      return res.data;
    },
    enabled: !!patientId
  });

  if (isProfileLoading) return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  const upcomingAppointments = aptsRes?.items?.filter((a: any) => a.status === 'scheduled' || a.status === 'waiting') || [];
  const recentHistory = emrRes?.items?.slice(0, 3) || [];
  const currentPrescriptions = rxRes?.items?.slice(0, 2) || [];

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
          {upcomingAppointments.map((apt: any) => (
            <div
              key={apt.id}
              className={`p-4 border rounded-lg flex justify-between items-center bg-blue-50 border-blue-100`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#0ea5e9]/20 text-[#0ea5e9]">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-[#1e3a5f]">{apt.reason || 'Khám bệnh'} — {apt.doctor?.full_name}</p>
                  <p className="text-slate-600 text-sm mt-0.5">
                    <Clock className="w-3.5 h-3.5 inline mr-1" />
                    {apt.appointment_date} • {apt.start_time}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={apt.status === 'scheduled' ? 'bg-[#0ea5e9]' : 'bg-amber-500'}>
                  {apt.status === 'scheduled' ? 'Đã xác nhận' : 'Chờ xác nhận'}
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
            {recentHistory.map((h: any) => (
              <div key={h.id} className="p-3 border rounded-lg hover:bg-slate-50">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm text-[#1e3a5f]">Ngày khám: {new Date(h.created_at).toLocaleDateString('vi-VN')}</p>
                    <p className="text-xs text-slate-500 mt-1">Triệu chứng: {h.chief_complaint || 'Không có'}</p>
                  </div>
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">{h.status === 'locked' ? 'Hoàn thành' : 'Đang xử lý'}</Badge>
                </div>
              </div>
            ))}
            {recentHistory.length === 0 && <p className="text-sm text-slate-500 text-center py-4">Chưa có lịch sử khám</p>}
          </CardContent>
        </Card>

        {/* Current Prescriptions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Pill className="w-5 h-5 text-teal-500" />
              Đơn Thuốc Mới Nhất
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {currentPrescriptions.map((rx: any, i: number) => (
              <div key={rx.id} className="p-3 border border-teal-100 rounded-lg bg-teal-50/40">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-sm text-teal-900">Mã đơn: {rx.prescription_code}</p>
                    <p className="text-xs text-teal-700 mt-1">Bác sĩ: {rx.doctor_name}</p>
                    <p className="text-xs text-slate-500 mt-1">Số lượng loại thuốc: {rx.items_count}</p>
                  </div>
                  <span className="text-xs text-teal-600 bg-teal-100 px-2 py-1 rounded-full">{rx.status === 'dispensed' ? 'Đã lấy thuốc' : 'Chờ lấy'}</span>
                </div>
              </div>
            ))}
            {currentPrescriptions.length === 0 && <p className="text-sm text-slate-500 text-center py-4">Chưa có đơn thuốc nào</p>}
            {currentPrescriptions.length > 0 && (
              <Button variant="outline" className="w-full mt-2 border-teal-200 text-teal-700">
                <Pill className="w-4 h-4 mr-2" /> Xem tất cả đơn thuốc
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
