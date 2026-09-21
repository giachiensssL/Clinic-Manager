import { useState, useEffect } from 'react';
import { doctorAPI } from '@/services/api';
import { Calendar, Clock, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const { data } = await doctorAPI.getTodayAppointments();
        setAppointments(data.items || []);
      } catch (error) {
        toast.error('Lỗi khi tải lịch khám');
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  if (loading) {
    return <div className="p-6 text-slate-500 animate-pulse">Đang tải lịch khám...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Lịch khám hôm nay</h1>
          <p className="text-sm text-slate-500 mt-1">Danh sách bệnh nhân đã đặt lịch</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
            <tr>
              <th className="px-6 py-4">Bệnh nhân</th>
              <th className="px-6 py-4">Thời gian</th>
              <th className="px-6 py-4">Lý do khám</th>
              <th className="px-6 py-4">Trạng thái</th>
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {appointments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center">
                    <Calendar className="w-12 h-12 text-slate-300 mb-4" />
                    <p className="text-base font-medium text-slate-600">Không có lịch khám nào hôm nay</p>
                    <p className="text-sm text-slate-400 mt-1">Danh sách bệnh nhân sẽ hiển thị tại đây khi có lịch hẹn mới.</p>
                  </div>
                </td>
              </tr>
            ) : (
              appointments.map((apt: any) => {
                const age = apt.patient?.date_of_birth ? new Date().getFullYear() - new Date(apt.patient.date_of_birth).getFullYear() : '?';
                const gender = apt.patient?.gender === 'male' ? 'Nam' : (apt.patient?.gender === 'female' ? 'Nữ' : 'Khác');
                
                let badgeClass = "bg-slate-100 text-slate-700";
                let statusText = apt.status;
                if (apt.status === 'scheduled') { badgeClass = "bg-blue-100 text-blue-700"; statusText = "Đã xác nhận"; }
                if (apt.status === 'waiting') { badgeClass = "bg-amber-100 text-amber-700"; statusText = "Chờ khám"; }
                if (apt.status === 'in_consultation') { badgeClass = "bg-purple-100 text-purple-700"; statusText = "Đang khám"; }
                if (apt.status === 'completed') { badgeClass = "bg-green-100 text-green-700"; statusText = "Đã khám"; }
                if (apt.status === 'cancelled') { badgeClass = "bg-red-100 text-red-700"; statusText = "Đã hủy"; }

                return (
                  <tr key={apt.id} className="hover:bg-blue-50/50 transition-colors cursor-pointer" onClick={() => window.location.href = `/doctor/emr?appointmentId=${apt.id}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 flex items-center justify-center font-bold text-lg shadow-inner">
                          {apt.patient?.full_name?.charAt(0) || <User className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 text-sm">{apt.patient?.full_name || 'Bệnh nhân ẩn danh'}</div>
                          <div className="text-xs text-slate-500 mt-0.5 font-medium flex items-center gap-1.5">
                            <span className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{apt.patient?.patient_code || '---'}</span> 
                            <span>•</span>
                            <span>{gender}, {age} tuổi</span>
                            <span>•</span>
                            <span>{apt.patient?.phone || '---'}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-sm">
                        <div className="flex items-center gap-2 text-slate-800 font-medium">
                          <Clock className="w-4 h-4 text-blue-500" />
                          <span>{apt.start_time?.slice(0,5) || '--:--'} - {apt.end_time?.slice(0,5) || '--:--'}</span>
                        </div>
                        <div className="text-xs text-slate-500 ml-6">Hôm nay</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-700 max-w-[200px] truncate" title={apt.reason}>
                        {apt.reason || <span className="text-slate-400 italic">Không có ghi chú</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border border-white/20 shadow-sm ${badgeClass}`}>
                        {statusText}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={(e) => { e.stopPropagation(); window.location.href = `/doctor/emr?appointmentId=${apt.id}`; }}
                        className="px-4 py-2 bg-[#0D6EFD] text-white font-medium text-xs rounded-lg hover:bg-blue-700 transition-all shadow-sm shadow-blue-500/20 active:scale-95"
                      >
                        Khám bệnh
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
