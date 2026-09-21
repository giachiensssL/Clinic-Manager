import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doctorAPI } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Calendar,
  Users,
  FileText,
  FlaskConical,
  Pill,
  ChevronRight,
  Stethoscope,
  Bot,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const chartData = [
  { name: 'T2', patients: 12 },
  { name: 'T3', patients: 19 },
  { name: 'T4', patients: 15 },
  { name: 'T5', patients: 22 },
  { name: 'T6', patients: 28 },
  { name: 'T7', patients: 14 },
  { name: 'CN', patients: 8 },
];

export default function DoctorDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(false);
      const [statsRes, apptRes, activityRes] = await Promise.all([
        doctorAPI.getDashboardStats(),
        doctorAPI.getTodayAppointments(),
        doctorAPI.getRecentActivity()
      ]);
      setStats(statsRes.data);
      setAppointments(apptRes.data?.items || []);
      setRecentActivity(activityRes.data?.items || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const todayStr = format(new Date(), 'EEEE, dd/MM/yyyy', { locale: vi });
  
  const waitingPatients = appointments.filter(a => a.status === 'waiting' || a.status === 'scheduled');
  const inConsultationPatients = appointments.filter(a => a.status === 'in_consultation');
  const completedPatients = appointments.filter(a => a.status === 'completed');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'waiting': return <Badge className="bg-yellow-500 hover:bg-yellow-600">Chờ khám</Badge>;
      case 'in_consultation': return <Badge className="bg-blue-500 hover:bg-blue-600">Đang khám</Badge>;
      case 'completed': return <Badge className="bg-green-500 hover:bg-green-600">Đã khám</Badge>;
      case 'scheduled': return <Badge className="bg-slate-500 hover:bg-slate-600">Chưa đến</Badge>;
      case 'cancelled': return <Badge variant="destructive">Đã hủy</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (error) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <h2 className="text-xl font-semibold text-slate-800">Không thể tải dữ liệu</h2>
        <p className="text-slate-500">Đã xảy ra lỗi khi lấy dữ liệu cho dashboard.</p>
        <Button onClick={fetchData}>Thử lại</Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 pb-24">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#1e3a6e] to-[#2d6cdf] rounded-2xl p-6 md:p-8 text-white flex justify-between items-center shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
          <Stethoscope className="w-64 h-64" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Xin chào, {user?.full_name || 'Bác sĩ'}!</h1>
          <p className="text-blue-100 text-sm md:text-base mb-4">
            Chúc bạn một ngày làm việc hiệu quả. Hãy chăm sóc sức khỏe cho bệnh nhân với sự tận tâm và chuyên nghiệp.
          </p>
          <div className="inline-flex items-center bg-white/20 rounded-full px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
            <Calendar className="w-4 h-4 mr-2" />
            {todayStr}
          </div>
        </div>
        <div className="hidden md:flex bg-white text-blue-900 rounded-full w-24 h-24 items-center justify-center shadow-inner relative z-10">
          <Stethoscope className="w-10 h-10" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/doctor/appointments')}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Lịch khám hôm nay</p>
                {loading ? <Skeleton className="h-8 w-16" /> : <h3 className="text-3xl font-bold text-slate-800">{stats?.today_appointments_count || 0}</h3>}
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-blue-600 font-medium">
              Xem chi tiết <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Bệnh nhân đang khám</p>
                {loading ? <Skeleton className="h-8 w-16" /> : <h3 className="text-3xl font-bold text-slate-800">{stats?.patients_in_consultation_count || 0}</h3>}
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <Users className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-green-600 font-medium cursor-pointer" onClick={() => navigate('/doctor/appointments')}>
              Xem chi tiết <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/doctor/emr')}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Bệnh án cần xử lý</p>
                {loading ? <Skeleton className="h-8 w-16" /> : <h3 className="text-3xl font-bold text-slate-800">{stats?.pending_emr_count || 0}</h3>}
              </div>
              <div className="p-3 bg-amber-100 rounded-xl">
                <FileText className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-amber-600 font-medium">
              Xem chi tiết <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/doctor/lab-results')}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Xét nghiệm chờ KQ</p>
                {loading ? <Skeleton className="h-8 w-16" /> : <h3 className="text-3xl font-bold text-slate-800">{stats?.pending_lab_results_count || 0}</h3>}
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <FlaskConical className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-purple-600 font-medium">
              Xem chi tiết <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column - 60% */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="h-[450px] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Lịch khám hôm nay</CardTitle>
                <CardDescription>{todayStr}</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/doctor/appointments')}>
                Xem tất cả
              </Button>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="w-12 h-12 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : appointments.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                  <Calendar className="w-12 h-12 mb-4 text-slate-300" />
                  <p>Hôm nay chưa có lịch khám</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {appointments.slice(0, 8).map((appt) => (
                    <div 
                      key={appt.id} 
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/doctor/patients/${appt.patient?.id}`)}
                    >
                      <div className="flex items-center mb-3 sm:mb-0">
                        <Avatar className="w-12 h-12 border">
                          <AvatarImage src={appt.patient?.avatar_url} />
                          <AvatarFallback className="bg-slate-100 text-slate-600">
                            {appt.patient?.full_name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <h4 className="font-semibold text-slate-800">{appt.patient?.full_name}</h4>
                            <span className="ml-2 text-xs text-slate-500">{appt.patient?.patient_code}</span>
                          </div>
                          <p className="text-sm text-slate-500 line-clamp-1">{appt.reason || appt.specialty}</p>
                          <p className="text-xs font-medium text-slate-700 mt-1">
                            {appt.start_time?.slice(0, 5) || '--:--'} - {appt.end_time?.slice(0, 5) || '--:--'} • Phòng N/A
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-2">
                        {getStatusBadge(appt.status)}
                        {(appt.status === 'waiting' || appt.status === 'in_consultation') && (
                          <Button 
                            size="sm" 
                            className="bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/doctor/emr?appointmentId=${appt.id}`);
                            }}
                          >
                            Bắt đầu khám
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - 40% */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="h-[250px] flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle>Bệnh nhân của tôi</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-hidden">
              <Tabs defaultValue="in_consultation" className="flex-1 flex flex-col h-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="in_consultation">Đang khám ({inConsultationPatients.length})</TabsTrigger>
                  <TabsTrigger value="waiting">Chờ khám ({waitingPatients.length})</TabsTrigger>
                  <TabsTrigger value="completed">Đã khám ({completedPatients.length})</TabsTrigger>
                </TabsList>
                
                <div className="flex-1 overflow-y-auto mt-4 pr-2">
                  <TabsContent value="in_consultation" className="m-0 space-y-3">
                    {inConsultationPatients.length === 0 && <p className="text-center text-slate-500 py-4 text-sm">Không có bệnh nhân</p>}
                    {inConsultationPatients.map(appt => (
                      <div key={appt.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg cursor-pointer" onClick={() => navigate(`/doctor/patients/${appt.patient?.id}`)}>
                        <div className="flex items-center">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={appt.patient?.avatar_url} />
                            <AvatarFallback>{appt.patient?.full_name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-slate-800">{appt.patient?.full_name}</p>
                            <p className="text-xs text-slate-500">{appt.patient?.age} tuổi • {appt.reason}</p>
                          </div>
                        </div>
                        {getStatusBadge(appt.status)}
                      </div>
                    ))}
                  </TabsContent>
                  
                  <TabsContent value="waiting" className="m-0 space-y-3">
                    {waitingPatients.length === 0 && <p className="text-center text-slate-500 py-4 text-sm">Không có bệnh nhân</p>}
                    {waitingPatients.map(appt => (
                      <div key={appt.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg cursor-pointer" onClick={() => navigate(`/doctor/patients/${appt.patient?.id}`)}>
                         <div className="flex items-center">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={appt.patient?.avatar_url} />
                            <AvatarFallback>{appt.patient?.full_name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-slate-800">{appt.patient?.full_name}</p>
                            <p className="text-xs text-slate-500">{appt.patient?.age} tuổi</p>
                          </div>
                        </div>
                        {getStatusBadge(appt.status)}
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="completed" className="m-0 space-y-3">
                    {completedPatients.length === 0 && <p className="text-center text-slate-500 py-4 text-sm">Không có bệnh nhân</p>}
                    {completedPatients.map(appt => (
                      <div key={appt.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg cursor-pointer" onClick={() => navigate(`/doctor/patients/${appt.patient?.id}`)}>
                        <div className="flex items-center">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={appt.patient?.avatar_url} />
                            <AvatarFallback>{appt.patient?.full_name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-slate-800">{appt.patient?.full_name}</p>
                          </div>
                        </div>
                        {getStatusBadge(appt.status)}
                      </div>
                    ))}
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>

          <Card className="h-[176px] flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle>Hoạt động gần đây</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              {loading ? (
                 <div className="space-y-3">
                   <Skeleton className="h-4 w-full" />
                   <Skeleton className="h-4 w-3/4" />
                 </div>
              ) : recentActivity.length === 0 ? (
                 <p className="text-sm text-slate-500 text-center py-4">Chưa có hoạt động nào</p>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start">
                      <div className="mt-0.5 mr-3">
                        {activity.resource_type === 'emr' && <FileText className="w-4 h-4 text-blue-500" />}
                        {activity.resource_type === 'prescription' && <Pill className="w-4 h-4 text-green-500" />}
                        {activity.resource_type === 'lab' && <FlaskConical className="w-4 h-4 text-purple-500" />}
                        {!['emr', 'prescription', 'lab'].includes(activity.resource_type) && <Calendar className="w-4 h-4 text-slate-400" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-slate-700">{activity.action_text}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{activity.time_ago}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Thống kê nhanh (7 ngày)</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="patients" name="Bệnh nhân" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorPatients)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white border-0 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
             <Bot className="w-32 h-32" />
          </div>
          <CardHeader className="relative z-10">
            <CardTitle className="text-white flex items-center text-xl">
              <Bot className="w-6 h-6 mr-2" />
              AI Assistant Gợi ý
            </CardTitle>
            <CardDescription className="text-violet-100">
              Trợ lý AI sẵn sàng giúp bạn tiết kiệm thời gian. Hãy thử các câu lệnh sau:
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 space-y-3">
            <Button variant="secondary" className="w-full justify-start text-indigo-700 hover:text-indigo-800 bg-white hover:bg-slate-50 transition-colors" onClick={() => navigate('/doctor/ai')}>
              Tóm tắt hồ sơ bệnh án của bệnh nhân Nguyễn Văn A
            </Button>
            <Button variant="secondary" className="w-full justify-start text-indigo-700 hover:text-indigo-800 bg-white hover:bg-slate-50 transition-colors" onClick={() => navigate('/doctor/ai')}>
              Kiểm tra tương tác thuốc Aspirin và Clopidogrel
            </Button>
            <Button variant="secondary" className="w-full justify-start text-indigo-700 hover:text-indigo-800 bg-white hover:bg-slate-50 transition-colors" onClick={() => navigate('/doctor/ai')}>
              Tạo dự thảo ghi chú lâm sàng cho ca khám vừa rồi
            </Button>
            <Button variant="secondary" className="w-full justify-start text-indigo-700 hover:text-indigo-800 bg-white hover:bg-slate-50 transition-colors" onClick={() => navigate('/doctor/ai')}>
              Phân tích chỉ số máu bất thường
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
