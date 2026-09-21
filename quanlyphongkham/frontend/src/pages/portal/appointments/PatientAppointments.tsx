import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { appointmentsAPI } from '@/services/api';
import { Calendar, Plus, Clock, MapPin, Search } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useAuthStore } from '@/store/authStore';

export default function PatientAppointments() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming'); // upcoming, past, cancelled
  
  const [cancelApt, setCancelApt] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      let realPatientId = (user as any)?.id; // fallback
      if (user?.role === 'patient') {
        const { patientsAPI } = await import('@/services/api');
        const patRes = await patientsAPI.getMe();
        realPatientId = patRes.data.id;
      }

      // Fetch appointments specifically for this patient
      const res = await appointmentsAPI.getAll({ size: 100, patient_id: realPatientId });
      setAppointments(res.data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelApt) return;
    setIsCancelling(true);
    try {
      await appointmentsAPI.updateStatus(cancelApt.id, 'cancelled', cancelReason);
      setCancelApt(null);
      setCancelReason('');
      fetchAppointments();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Lỗi khi hủy lịch hẹn');
    } finally {
      setIsCancelling(false);
    }
  };

  const getFilteredAppointments = () => {
    return appointments.filter(apt => {
      const isUpcoming = apt.status === 'scheduled' || apt.status === 'pending' || apt.status === 'waiting';
      const isPast = apt.status === 'completed' || apt.status === 'paid' || apt.status === 'in_consultation';
      const isCancelled = apt.status === 'cancelled' || apt.status === 'no_show';

      if (activeTab === 'upcoming') return isUpcoming;
      if (activeTab === 'past') return isPast;
      if (activeTab === 'cancelled') return isCancelled;
      return true;
    });
  };

  const filteredList = getFilteredAppointments();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled': return <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-blue-100 text-blue-700">Đã xác nhận</span>;
      case 'pending': return <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-amber-100 text-amber-700">Chờ xác nhận</span>;
      case 'completed': return <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-green-100 text-green-700">Đã khám</span>;
      case 'cancelled': return <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-red-100 text-red-700">Đã hủy</span>;
      case 'no_show': return <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-slate-100 text-slate-700">Không đến</span>;
      default: return <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-[#E2E8F0]">
        <div>
          <h1 className="text-2xl font-bold text-[#0B3B78] mb-1">Lịch hẹn của tôi</h1>
          <p className="text-sm text-[#64748B]">Quản lý lịch khám và theo dõi lịch sử khám bệnh.</p>
        </div>
        <button 
          onClick={() => navigate('/portal/appointments/create')}
          className="flex items-center gap-2 bg-[#0D6EFD] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition shadow-sm shadow-blue-500/30"
        >
          <Plus className="w-5 h-5" />
          Đặt lịch khám mới
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-[#E2E8F0] px-2 overflow-x-auto">
          {[
            { id: 'upcoming', label: 'Sắp tới' },
            { id: 'past', label: 'Đã khám' },
            { id: 'cancelled', label: 'Đã hủy' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'border-[#0D6EFD] text-[#0D6EFD]' 
                  : 'border-transparent text-[#64748B] hover:text-[#0B3B78]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-slate-50 rounded-xl animate-pulse border border-[#E2E8F0]" />
              ))}
            </div>
          ) : filteredList.length > 0 ? (
            <div className="space-y-4">
              {filteredList.map(apt => {
                const aptDate = new Date(apt.appointment_date);
                // start_time is "HH:mm:ss", new Date("HH:mm:ss") is Invalid Date
                const startTimeStr = apt.start_time ? apt.start_time.slice(0, 5) : '';
                
                return (
                  <div key={apt.id} className="flex flex-col md:flex-row gap-4 border border-[#E2E8F0] rounded-xl p-5 hover:border-blue-200 transition-colors bg-white">
                    <div className="flex flex-col items-center justify-center min-w-[100px] border-b md:border-b-0 md:border-r border-[#E2E8F0] pb-4 md:pb-0 md:pr-5">
                      <span className="text-xs font-bold text-[#64748B] uppercase">Tháng {aptDate.getMonth() + 1}</span>
                      <span className="text-4xl font-black text-[#0D6EFD] my-1">{aptDate.getDate()}</span>
                      <span className="text-xs font-medium text-[#64748B]">{format(aptDate, 'EEEE', { locale: vi })}</span>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-[#0B3B78] text-lg">Khám {apt.doctor?.specialty?.name || apt.doctor?.specialty || 'Tổng quát'}</h3>
                        {getStatusBadge(apt.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 mb-4">
                        <div className="flex items-center gap-2 text-sm text-[#334155]">
                          <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center flex-shrink-0 text-[#64748B]">
                            <Clock className="w-3.5 h-3.5" />
                          </div>
                          <span>{startTimeStr}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[#334155]">
                          <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center flex-shrink-0 text-[#64748B]">
                            <MapPin className="w-3.5 h-3.5" />
                          </div>
                          <span>Phòng khám số 1</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[#334155] sm:col-span-2">
                          <img 
                            src={apt.doctor?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(apt.doctor?.full_name || apt.doctor?.staff?.full_name || 'Doc')}&background=F1F5F9&color=0B3B78`}
                            className="w-6 h-6 rounded-full"
                          />
                          <span>Bác sĩ: <span className="font-medium">{apt.doctor?.full_name || apt.doctor?.staff?.full_name || 'Đang cập nhật'}</span></span>
                        </div>
                      </div>
                      
                      {apt.reason && (
                        <div className="text-sm bg-slate-50 p-3 rounded-lg text-[#64748B]">
                          <span className="font-medium text-[#334155]">Lý do khám: </span>
                          {apt.reason}
                        </div>
                      )}
                      
                      {activeTab === 'cancelled' && apt.cancellation_reason && (
                        <div className="mt-2 text-sm bg-red-50 p-3 rounded-lg text-red-600">
                          <span className="font-medium">Lý do hủy: </span>
                          {apt.cancellation_reason}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2 justify-center md:min-w-[140px] mt-2 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-[#E2E8F0]">
                      <button className="w-full py-2 bg-blue-50 text-blue-700 text-sm font-semibold rounded-lg hover:bg-blue-100 transition">
                        Xem chi tiết
                      </button>
                      {activeTab === 'upcoming' && (
                        <button 
                          onClick={() => setCancelApt(apt)}
                          className="w-full py-2 bg-white border border-[#E2E8F0] text-gray-600 hover:text-red-600 text-sm font-medium rounded-lg transition"
                        >
                          Hủy lịch hẹn
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Calendar className="w-8 h-8 text-[#94A3B8]" />
              </div>
              <h3 className="text-lg font-bold text-[#334155] mb-1">Chưa có lịch hẹn nào</h3>
              <p className="text-sm text-[#64748B] mb-6">Bạn chưa có lịch hẹn {activeTab === 'upcoming' ? 'sắp tới' : (activeTab === 'past' ? 'đã khám' : 'đã hủy')} nào trong hệ thống.</p>
              {activeTab === 'upcoming' && (
                <button 
                  onClick={() => navigate('/portal/appointments/create')}
                  className="bg-[#0B3B78] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-900 transition"
                >
                  Đặt lịch khám ngay
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {cancelApt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-[#0B3B78] mb-4">Bạn có chắc muốn hủy lịch khám này?</h3>
            
            <div className="mb-4 text-sm text-[#334155]">
              <p>Ngày khám: <span className="font-bold">{cancelApt.appointment_date ? format(new Date(cancelApt.appointment_date), 'dd/MM/yyyy') : ''}</span></p>
              <p>Giờ khám: <span className="font-bold">{cancelApt.start_time ? cancelApt.start_time.slice(0, 5) : ''}</span></p>
              <p>Bác sĩ: <span className="font-bold">{cancelApt.doctor?.full_name || cancelApt.doctor?.staff?.full_name}</span></p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-[#64748B] mb-2">Lý do hủy (không bắt buộc)</label>
              <textarea 
                className="w-full border border-[#E2E8F0] rounded-lg p-3 text-sm focus:outline-none focus:border-[#0D6EFD]"
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Vui lòng cho biết lý do bạn muốn hủy lịch..."
              />
            </div>

            <div className="flex justify-end gap-3">
              <button 
                disabled={isCancelling}
                onClick={() => { setCancelApt(null); setCancelReason(''); }}
                className="px-4 py-2 border border-[#E2E8F0] text-[#64748B] rounded-lg hover:bg-slate-50 font-medium"
              >
                Quay lại
              </button>
              <button 
                disabled={isCancelling}
                onClick={handleCancel}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center gap-2"
              >
                {isCancelling ? 'Đang xử lý...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
