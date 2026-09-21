import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FileText, Save, CheckCircle, AlertTriangle, Activity, Pill, History, User } from 'lucide-react';
import { emrAPI, patientsAPI, appointmentsAPI, doctorAPI } from '@/services/api';
import toast from 'react-hot-toast';

export default function DoctorEMR() {
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get('appointmentId');
  const navigate = useNavigate();
  
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<any>(null);
  const [consultationId, setConsultationId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('DRAFT');
  const [history, setHistory] = useState<any[]>([]);

  const [emrData, setEmrData] = useState({
    chief_complaint: '',
    clinical_notes: '',
    treatment_plan: '',
  });

  useEffect(() => {
    const initEMR = async () => {
      if (!appointmentId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Lấy thông tin EMR qua appointmentId
        let consId = null;
        let pId = null;
        try {
          const res = await emrAPI.getByAppointment(appointmentId);
          const data = res.data;
          consId = data.id;
          setConsultationId(consId);
          setStatus(data.status);
          pId = data.patient_id;
          
          setEmrData({
            chief_complaint: data.chief_complaint || '',
            clinical_notes: data.clinical_notes || '',
            treatment_plan: data.treatment_plan || '',
          });
        } catch (err: any) {
          if (err.response?.status === 404) {
            // Chưa có, tạo mới
            const createRes = await emrAPI.createConsultation({ appointment_id: appointmentId });
            consId = createRes.data.id;
            setConsultationId(consId);
            setStatus(createRes.data.status);
            
            // Tìm patient ID từ appointment
            const apptsRes = await doctorAPI.getTodayAppointments();
            const apt = apptsRes.data.items?.find((a:any) => a.id === appointmentId);
            if (apt) pId = apt.patient?.id;
          } else {
            throw err;
          }
        }

        if (pId) {
          const pRes = await patientsAPI.getById(pId);
          setPatient(pRes.data);
          
          try {
            const hRes = await emrAPI.getByPatient(pId);
            setHistory(hRes.data.items?.filter((h:any) => h.id !== consId) || []);
          } catch(e) {}
        }
      } catch (error) {
        toast.error('Lỗi khi tải bệnh án');
      } finally {
        setLoading(false);
      }
    };
    initEMR();
  }, [appointmentId]);

  const handleSave = async () => {
    if (!consultationId) return;
    setSaving(true);
    try {
      await emrAPI.updateConsultation(consultationId, emrData);
      toast.success('Đã lưu bệnh án thành công');
    } catch (error) {
      toast.error('Lỗi khi lưu bệnh án');
    } finally {
      setSaving(false);
    }
  };

  const handleSign = async () => {
    if (!consultationId) return;
    if (!emrData.chief_complaint || !emrData.clinical_notes) {
      toast.error('Vui lòng nhập lý do khám và chẩn đoán trước khi ký');
      return;
    }
    
    if (!window.confirm('Sau khi ký, bệnh án sẽ bị khóa và không thể sửa chữa. Bạn có chắc chắn?')) {
      return;
    }

    try {
      await handleSave(); // Luu nhap truoc
      const res = await emrAPI.signAndLock(consultationId);
      setStatus(res.data.status);
      toast.success('Đã ký và khóa bệnh án');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Lỗi khi ký bệnh án');
    }
  };
  
  const isLocked = status === 'LOCKED' || status === 'locked';

  const [recentAppointments, setRecentAppointments] = useState<any[]>([]);

  useEffect(() => {
    if (!appointmentId) {
      doctorAPI.getTodayAppointments()
        .then(res => setRecentAppointments(res.data.items || []))
        .catch(() => {});
    }
  }, [appointmentId]);

  if (!appointmentId) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Bệnh án điện tử (EMR)</h1>
          <p className="text-sm text-slate-500 mt-1">Chọn một ca khám để xem hoặc tạo bệnh án</p>
        </div>
        
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-4">Bệnh nhân</th>
                <th className="px-6 py-4">Giờ khám</th>
                <th className="px-6 py-4">Lý do</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentAppointments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    Không có ca khám nào hôm nay.
                  </td>
                </tr>
              ) : (
                recentAppointments.map(apt => (
                  <tr key={apt.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-800">{apt.patient?.full_name || 'Bệnh nhân'}</td>
                    <td className="px-6 py-4 text-slate-600">{apt.start_time?.slice(0,5) || '--:--'} - {apt.end_time?.slice(0,5) || '--:--'}</td>
                    <td className="px-6 py-4 text-slate-600">{apt.reason || '---'}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                        {apt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => navigate(`/doctor/emr?appointmentId=${apt.id}`)}
                        className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                      >
                        Mở bệnh án
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="p-12 text-center text-slate-500 flex flex-col items-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>Đang tải dữ liệu...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Hồ sơ bệnh án điện tử (EMR)</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-sm text-slate-500">
              Mã BA: <span className="font-medium text-slate-700">{consultationId?.substring(0,8).toUpperCase()}</span>
            </p>
            {isLocked ? (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Đã ký</span>
            ) : (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">Bản nháp</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSave}
            disabled={saving || isLocked}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm text-sm disabled:opacity-50"
          >
            {saving ? <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            Lưu nháp
          </button>
          <button 
            onClick={handleSign}
            disabled={isLocked}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm text-sm disabled:opacity-50 disabled:bg-slate-300"
          >
            <CheckCircle className="w-4 h-4" /> Ký bệnh án
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Thông tin lâm sàng */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
              <Activity className="w-5 h-5 text-blue-600" />
              <h2 className="font-semibold text-slate-800">Khám lâm sàng & Chẩn đoán</h2>
            </div>
            <div className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Lý do khám bệnh</label>
                <textarea
                  value={emrData.chief_complaint}
                  onChange={e => setEmrData({...emrData, chief_complaint: e.target.value})}
                  disabled={isLocked}
                  placeholder="Mô tả triệu chứng và lý do bệnh nhân đến khám..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all min-h-[80px] resize-y disabled:opacity-70"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Khám lâm sàng / Chẩn đoán</label>
                <textarea
                  value={emrData.clinical_notes}
                  onChange={e => setEmrData({...emrData, clinical_notes: e.target.value})}
                  disabled={isLocked}
                  placeholder="Kết quả khám lâm sàng, kết luận chẩn đoán bệnh..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all min-h-[120px] resize-y disabled:opacity-70"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Hướng điều trị / Lời dặn</label>
                <textarea
                  value={emrData.treatment_plan}
                  onChange={e => setEmrData({...emrData, treatment_plan: e.target.value})}
                  disabled={isLocked}
                  placeholder="Ghi chú, hướng dẫn điều trị, đơn thuốc..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all min-h-[100px] resize-y disabled:opacity-70"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Thông tin bệnh nhân ngắn gọn */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2"><User className="w-4 h-4 text-blue-600" /> Bệnh nhân</span>
              <button onClick={() => patient && navigate(`/doctor/patients/${patient.id}`)} className="text-xs text-blue-600 hover:underline font-medium">Chi tiết</button>
            </h3>
            {patient ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100">
                    {patient.avatar_url ? <img src={patient.avatar_url} alt="avatar" /> : <User className="w-6 h-6 m-3 text-slate-400"/>}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">{patient.full_name}</div>
                    <div className="text-xs text-slate-500">{patient.patient_code}</div>
                  </div>
                </div>
                <div className="flex justify-between text-sm py-1 border-b border-slate-50">
                  <span className="text-slate-500">Giới tính:</span>
                  <span className="font-medium text-slate-800">{patient.gender === 'male' ? 'Nam' : 'Nữ'}</span>
                </div>
                <div className="flex justify-between text-sm py-1 border-b border-slate-50">
                  <span className="text-slate-500">Điện thoại:</span>
                  <span className="font-medium text-slate-800">{patient.phone || '---'}</span>
                </div>
                <div className="flex justify-between text-sm py-1">
                  <span className="text-slate-500">Nhóm máu:</span>
                  <span className="font-medium text-red-600">{patient.blood_type || '---'}</span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-500">Đang tải...</div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <History className="w-4 h-4 text-blue-600" /> Lịch sử khám gần đây
            </h3>
            {history.length > 0 ? (
              <div className="space-y-3">
                {history.slice(0, 3).map((h: any) => (
                  <div key={h.id} className="p-3 bg-slate-50 rounded-lg text-sm">
                    <div className="font-medium text-slate-800 mb-1">{new Date(h.created_at).toLocaleDateString('vi-VN')}</div>
                    <div className="text-slate-600 truncate">{h.chief_complaint || 'Không rõ lý do'}</div>
                  </div>
                ))}
                {history.length > 3 && (
                  <button className="w-full text-center text-sm text-blue-600 font-medium hover:underline pt-2">
                    Xem tất cả ({history.length})
                  </button>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">Không có dữ liệu khám bệnh trước đó.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
