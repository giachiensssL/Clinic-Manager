import { useState, useEffect } from 'react';
import { doctorAPI, appointmentsAPI } from '@/services/api';
import { Calendar, Clock, User, Plus, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Appointment State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctorId, setDoctorId] = useState<string>('');
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    patient_id: '',
    appointment_date: new Date().toISOString().split('T')[0],
    time: '09:00',
    reason: 'Hẹn tái khám định kỳ'
  });

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

  useEffect(() => {
    fetchAppointments();
    doctorAPI.getMe()
      .then(res => setDoctorId(res.data.id))
      .catch(() => {});

    doctorAPI.searchPatients('')
      .then(res => setPatients(res.data.items || []))
      .catch(() => {});
  }, []);

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patient_id) {
      toast.error('Vui lòng chọn bệnh nhân');
      return;
    }
    if (!doctorId) {
      toast.error('Không tìm thấy thông tin bác sĩ đăng nhập');
      return;
    }

    try {
      setCreating(true);
      const [h, m] = formData.time.split(':').map(Number);
      const endH = m === 30 ? h + 1 : h;
      const endM = m === 30 ? '00' : '30';
      const start_time = `${formData.time}:00`;
      const end_time = `${endH.toString().padStart(2, '0')}:${endM}:00`;

      await appointmentsAPI.create({
        patient_id: formData.patient_id,
        doctor_id: doctorId,
        appointment_date: formData.appointment_date,
        start_time,
        end_time,
        reason: formData.reason.trim() || 'Hẹn tái khám'
      });

      toast.success('Đặt lịch hẹn khám thành công!');
      setIsCreateOpen(false);
      setFormData({
        patient_id: '',
        appointment_date: new Date().toISOString().split('T')[0],
        time: '09:00',
        reason: 'Hẹn tái khám định kỳ'
      });
      fetchAppointments();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Lỗi khi đặt lịch khám');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-slate-500 animate-pulse">Đang tải lịch khám...</div>;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Lịch khám hôm nay</h1>
          <p className="text-sm text-slate-500 mt-1">Danh sách bệnh nhân đã đặt lịch</p>
        </div>
        <button 
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm text-sm"
        >
          <Plus className="w-4 h-4" /> Hẹn khám / Tái khám
        </button>
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

      {/* Modal Hẹn khám / Tái khám mới */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Đặt lịch hẹn khám / Tái khám</h3>
                <p className="text-xs text-slate-500 mt-0.5">Xếp lịch hẹn cho bệnh nhân với bác sĩ phụ trách</p>
              </div>
              <button 
                onClick={() => setIsCreateOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Chọn bệnh nhân <span className="text-red-500">*</span></label>
                <select
                  required
                  value={formData.patient_id}
                  onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  <option value="">-- Chọn bệnh nhân --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} ({p.patient_code}) - {p.phone || 'SĐT chưa có'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ngày hẹn khám <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    required
                    value={formData.appointment_date}
                    onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Giờ khám <span className="text-red-500">*</span></label>
                  <select
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    {['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lý do khám / Chỉ định tái khám</label>
                <textarea
                  rows={3}
                  placeholder="VD: Tái khám định kỳ sau 7 ngày uống thuốc, theo dõi huyết áp..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                  {creating ? 'Đang xếp lịch...' : 'Xác nhận đặt lịch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
