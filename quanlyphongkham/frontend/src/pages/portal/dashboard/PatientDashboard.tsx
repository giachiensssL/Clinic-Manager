import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { appointmentsAPI, prescriptionsAPI, emrAPI, patientsAPI } from '@/services/api';
import { 
  CalendarPlus, Calendar, FileText, MessageSquare, 
  ArrowRight, HeartPulse, Pill, Activity, Bell, FileSearch, Send
} from 'lucide-react';

export default function PatientDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const [appointments, setAppointments] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [vitals, setVitals] = useState<any>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        let pId = null;
        let realPatientId = (user as any)?.id; // fallback
        try {
          if (user?.role === 'patient') {
            const pRes = await patientsAPI.getMe();
            pId = pRes.data.id;
            realPatientId = pId;
          }
        } catch (e) {
          console.warn("Could not fetch patient profile");
        }

        const [aptRes, rxRes] = await Promise.all([
          appointmentsAPI.getAll({ size: 5, patient_id: realPatientId }),
          prescriptionsAPI.getAll({ size: 5, patient_id: realPatientId })
        ]);
        setAppointments(aptRes.data.items || []);
        setPrescriptions(rxRes.data.items || []);

        if (pId) {
          const emrRes = await emrAPI.getByPatient(pId);
          const emrItems = emrRes.data?.items || emrRes.data || [];
          if (emrItems.length > 0) {
            // Find latest consultation that has vitals
            const latestWithVitals = emrItems.find((c: any) => c.height || c.weight || c.blood_pressure || c.heart_rate);
            if (latestWithVitals) {
              setVitals(latestWithVitals);
            }
          }
        }
      } catch (err) {
        console.error('Lỗi tải dữ liệu dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const upcomingApt = appointments.find(a => a.status === 'scheduled' || a.status === 'pending');
  const recentVisits = appointments.filter(a => a.status === 'completed').slice(0, 3);
  const latestRx = prescriptions[0];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-[#E2E8F0] relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-2xl font-bold text-[#0B3B78] mb-2">
              Xin chào, {user?.full_name || user?.username}! 👋
            </h1>
            <p className="text-[#64748B] mb-8">Chăm sóc sức khỏe của bạn là ưu tiên hàng đầu của chúng tôi.</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: CalendarPlus, label: 'Đặt lịch khám', sub: 'Chọn bác sĩ, thời gian', path: '/portal/appointments/create', color: 'text-blue-500', bg: 'bg-blue-50' },
                { icon: Calendar, label: 'Xem lịch hẹn', sub: 'Quản lý lịch khám', path: '/portal/appointments', color: 'text-teal-500', bg: 'bg-teal-50' },
                { icon: FileText, label: 'Hồ sơ sức khỏe', sub: 'Xem thông tin y tế', path: '/portal/health-record', color: 'text-purple-500', bg: 'bg-purple-50' },
                { icon: MessageSquare, label: 'Tư vấn AI', sub: 'Hỏi đáp 24/7', path: '/portal/ai-assistant', color: 'text-rose-500', bg: 'bg-rose-50' },
              ].map((item, i) => (
                <button 
                  key={i}
                  onClick={() => navigate(item.path)}
                  className="bg-white border border-[#E2E8F0] p-4 rounded-xl hover:shadow-md hover:border-blue-200 transition-all text-left group"
                >
                  <div className={`w-10 h-10 ${item.bg} ${item.color} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm text-[#0B3B78] mb-1">{item.label}</h3>
                  <p className="text-[10px] text-[#64748B]">{item.sub}</p>
                </button>
              ))}
            </div>
          </div>
          
          {/* Decorative background for Welcome section */}
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-blue-50 to-transparent pointer-events-none hidden md:block" />
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-100 rounded-full blur-3xl opacity-50 pointer-events-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Lịch hẹn sắp tới */}
          <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#0D6EFD]" />
                <h2 className="font-bold text-[#0B3B78]">Lịch hẹn sắp tới</h2>
              </div>
              <button onClick={() => navigate('/portal/appointments')} className="text-xs text-[#0D6EFD] hover:underline font-medium flex items-center gap-1">
                Xem tất cả <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            
            {loading ? (
              <div className="animate-pulse h-24 bg-slate-100 rounded-lg w-full" />
            ) : upcomingApt ? (
              <div className="flex flex-col sm:flex-row gap-4 border border-[#E2E8F0] rounded-lg p-4 bg-slate-50">
                <div className="flex flex-col items-center justify-center min-w-[80px] border-r border-[#E2E8F0] pr-4">
                  <span className="text-xs font-bold text-[#64748B] uppercase">Tháng {upcomingApt.appointment_date ? new Date(upcomingApt.appointment_date).getMonth() + 1 : ''}</span>
                  <span className="text-3xl font-black text-[#0D6EFD]">{upcomingApt.appointment_date ? new Date(upcomingApt.appointment_date).getDate() : ''}</span>
                  <span className="text-xs text-[#64748B]">{upcomingApt.start_time ? upcomingApt.start_time.slice(0, 5) : ''}</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-[#0B3B78] text-lg">{upcomingApt.department?.name || 'Khám tổng quát'}</h3>
                    <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-blue-100 text-blue-700">Đã xác nhận</span>
                  </div>
                  <p className="text-sm text-[#334155] mb-1">Bác sĩ: <span className="font-medium">{upcomingApt.doctor?.staff?.full_name || 'Đang cập nhật'}</span></p>
                  <p className="text-sm text-[#64748B]">Phòng khám: {upcomingApt.room || 'Đang cập nhật'}</p>
                </div>
                <div className="flex flex-col gap-2 justify-center sm:w-28 mt-2 sm:mt-0 border-t sm:border-t-0 border-[#E2E8F0] pt-3 sm:pt-0">
                  <button onClick={() => navigate(`/portal/appointments/${upcomingApt.id}`)} className="w-full py-1.5 bg-[#0D6EFD] text-white text-xs font-medium rounded hover:bg-blue-700 transition">Xem chi tiết</button>
                  <button className="w-full py-1.5 bg-white border border-[#E2E8F0] text-gray-600 hover:text-red-600 text-xs font-medium rounded transition">Hủy lịch</button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed border-[#E2E8F0] rounded-lg bg-slate-50">
                <p className="text-sm text-[#64748B] mb-3">Bạn chưa có lịch hẹn sắp tới nào.</p>
                <button onClick={() => navigate('/portal/appointments/create')} className="text-xs bg-[#0D6EFD] text-white px-4 py-2 rounded shadow-sm hover:bg-blue-700">Đặt lịch ngay</button>
              </div>
            )}
          </div>

          {/* Lần khám gần đây */}
          <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileSearch className="w-5 h-5 text-[#10B981]" />
                <h2 className="font-bold text-[#0B3B78]">Lần khám gần đây</h2>
              </div>
              <button onClick={() => navigate('/portal/health-record')} className="text-xs text-[#0D6EFD] hover:underline font-medium flex items-center gap-1">
                Xem tất cả <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-[#64748B] uppercase bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg rounded-bl-lg font-medium">Ngày khám</th>
                    <th className="px-4 py-3 font-medium">Chuyên khoa</th>
                    <th className="px-4 py-3 font-medium">Bác sĩ</th>
                    <th className="px-4 py-3 font-medium">Kết luận</th>
                    <th className="px-4 py-3 rounded-tr-lg rounded-br-lg"></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                     <tr><td colSpan={5} className="p-4"><div className="animate-pulse h-8 bg-slate-100 rounded w-full"></div></td></tr>
                  ) : recentVisits.length > 0 ? (
                    recentVisits.map((visit) => (
                      <tr key={visit.id} className="border-b border-[#F1F5F9] hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-[#0B3B78]">{visit.appointment_date ? new Date(visit.appointment_date).toLocaleDateString('vi-VN') : ''}</td>
                        <td className="px-4 py-3 text-[#334155]">{visit.department?.name || 'Khám chung'}</td>
                        <td className="px-4 py-3 text-[#334155]">{visit.doctor?.staff?.full_name || '-'}</td>
                        <td className="px-4 py-3 text-[#334155] truncate max-w-[150px]">{visit.diagnosis || 'Đang cập nhật'}</td>
                        <td className="px-4 py-3 text-right">
                          <button className="text-xs text-[#0D6EFD] hover:underline font-medium">Xem chi tiết</button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-[#64748B] text-sm italic">Không có dữ liệu khám bệnh.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Chỉ số sức khỏe */}
            <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#8B5CF6]" />
                  <h2 className="font-bold text-[#0B3B78]">Chỉ số sức khỏe</h2>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-purple-50 p-3 rounded-lg border border-purple-100 flex flex-col items-center justify-center text-center">
                  <span className="text-xs text-[#64748B] mb-1">Chiều cao</span>
                  <span className="text-lg font-bold text-purple-700">{vitals?.height ? `${vitals.height} cm` : '--'}</span>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex flex-col items-center justify-center text-center">
                  <span className="text-xs text-[#64748B] mb-1">Cân nặng</span>
                  <span className="text-lg font-bold text-blue-700">{vitals?.weight ? `${vitals.weight} kg` : '--'}</span>
                </div>
                <div className="bg-green-50 p-3 rounded-lg border border-green-100 flex flex-col items-center justify-center text-center">
                  <span className="text-xs text-[#64748B] mb-1">BMI</span>
                  <span className="text-lg font-bold text-green-700">
                    {vitals?.height && vitals?.weight 
                      ? (vitals.weight / Math.pow(vitals.height / 100, 2)).toFixed(1) 
                      : '--'}
                  </span>
                  <span className="text-[9px] text-green-600 mt-0.5 font-medium">(Bình thường)</span>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 flex flex-col items-center justify-center text-center">
                  <span className="text-xs text-[#64748B] mb-1">Huyết áp</span>
                  <span className="text-lg font-bold text-orange-700">{vitals?.blood_pressure || '--'}</span>
                </div>
              </div>
            </div>

            {/* Đơn thuốc & Điều trị */}
            <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Pill className="w-5 h-5 text-[#F59E0B]" />
                  <h2 className="font-bold text-[#0B3B78]">Đơn thuốc & Điều trị</h2>
                </div>
                <button onClick={() => navigate('/portal/prescriptions')} className="text-xs text-[#0D6EFD] hover:underline font-medium">Xem tất cả</button>
              </div>
              {latestRx ? (
                <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-amber-500 shadow-sm flex-shrink-0">
                    <Pill className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#0B3B78] mb-1">{latestRx.prescription_code}</h3>
                    <p className="text-xs text-[#334155] mb-2 line-clamp-2">Được kê bởi: {latestRx.doctor_name || 'Bác sĩ'}</p>
                    <p className="text-[10px] text-[#64748B] mb-2">Ngày kê: {new Date(latestRx.created_at).toLocaleDateString('vi-VN')}</p>
                    <button onClick={() => navigate(`/portal/prescriptions/${latestRx.id}`)} className="text-xs font-medium text-amber-600 hover:underline">Xem đơn thuốc</button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-[#64748B] text-sm">Chưa có đơn thuốc nào.</div>
              )}
            </div>
          </div>
          
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          
          {/* Hỗ trợ sức khỏe từ AI */}
          <div className="bg-gradient-to-b from-blue-50 to-white rounded-xl shadow-sm border border-blue-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-white p-1.5 rounded shadow-sm">
                <MessageSquare className="w-5 h-5 text-[#0D6EFD]" />
              </div>
              <h2 className="font-bold text-[#0B3B78]">Hỗ trợ sức khỏe từ AI</h2>
            </div>
            
            <div className="space-y-2.5 mb-5">
              <p className="text-sm font-medium text-[#334155]">Bạn có thể hỏi AI về:</p>
              <ul className="text-xs text-[#64748B] space-y-2">
                <li className="flex gap-2"><ArrowRight className="w-3.5 h-3.5 text-[#0D6EFD] flex-shrink-0" /> Đặt lịch khám, tra cứu lịch hẹn</li>
                <li className="flex gap-2"><ArrowRight className="w-3.5 h-3.5 text-[#0D6EFD] flex-shrink-0" /> Giải đáp thắc mắc y tế cơ bản</li>
                <li className="flex gap-2"><ArrowRight className="w-3.5 h-3.5 text-[#0D6EFD] flex-shrink-0" /> Nhắc uống thuốc, chăm sóc sức khỏe</li>
                <li className="flex gap-2"><ArrowRight className="w-3.5 h-3.5 text-[#0D6EFD] flex-shrink-0" /> Xem kết quả xét nghiệm, đơn thuốc</li>
              </ul>
            </div>
            
            <div className="relative">
              <input 
                type="text" 
                placeholder="Nhập câu hỏi của bạn..." 
                className="w-full text-sm pl-4 pr-10 py-3 rounded-lg border border-blue-200 focus:outline-none focus:border-[#0D6EFD] focus:ring-1 focus:ring-[#0D6EFD] shadow-inner bg-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') navigate('/portal/ai-assistant');
                }}
              />
              <button onClick={() => navigate('/portal/ai-assistant')} className="absolute right-2 top-2 bottom-2 w-8 flex items-center justify-center bg-[#0D6EFD] text-white rounded-md hover:bg-blue-700">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Thông báo */}
          <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#3B82F6]" />
                <h2 className="font-bold text-[#0B3B78]">Thông báo mới</h2>
              </div>
              <button onClick={() => navigate('/portal/notifications')} className="text-xs text-[#0D6EFD] hover:underline font-medium">Xem tất cả</button>
            </div>
            
            <div className="space-y-3">
              {[
                { title: 'Nhắc lịch hẹn khám', time: '2 giờ trước', icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50' },
                { title: 'Kết quả xét nghiệm đã có', time: '5 giờ trước', icon: Activity, color: 'text-teal-500', bg: 'bg-teal-50' },
                { title: 'Đơn thuốc đã được phát hành', time: '1 ngày trước', icon: Pill, color: 'text-amber-500', bg: 'bg-amber-50' },
              ].map((n, i) => (
                <div key={i} className="flex gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-slate-100">
                  <div className={`w-8 h-8 rounded-full ${n.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <n.icon className={`w-4 h-4 ${n.color}`} />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[#0B3B78]">{n.title}</h4>
                    <p className="text-[10px] text-[#64748B] mt-0.5">{n.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
