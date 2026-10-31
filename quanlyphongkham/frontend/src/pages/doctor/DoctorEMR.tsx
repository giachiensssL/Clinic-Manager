import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FileText, Save, CheckCircle, AlertTriangle, Activity, Pill, History, User, PlusCircle, Trash2, Sparkles, X, Loader2, ShieldCheck } from 'lucide-react';
import { emrAPI, patientsAPI, appointmentsAPI, doctorAPI, prescriptionsAPI } from '@/services/api';
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

  // Prescription State inside EMR
  const [prescription, setPrescription] = useState<any>(null);
  const [isPrescribeOpen, setIsPrescribeOpen] = useState(false);
  const [catalogMedicines, setCatalogMedicines] = useState<any[]>([]);
  const [activeSuggestionRow, setActiveSuggestionRow] = useState<number | null>(null);
  const [prescribing, setPrescribing] = useState(false);
  const [checkingInteractions, setCheckingInteractions] = useState(false);
  const [interactionResult, setInteractionResult] = useState<{
    risk_level: 'safe' | 'warning' | 'danger';
    warnings: string[];
    recommendations: string[];
  } | null>(null);

  const [prescriptionForm, setPrescriptionForm] = useState({
    notes: '',
    items: [
      { medicine_name: 'Paracetamol 500mg', dosage: '1 viên', frequency: '2 lần/ngày', duration_days: 5, quantity: 10, instructions: 'Uống sau khi ăn', unit_price: 2000 }
    ]
  });

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
          setPrescription(data.prescription || null);
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

  useEffect(() => {
    prescriptionsAPI.getMedicines({ limit: 100 })
      .then(res => setCatalogMedicines(res.data.items || []))
      .catch(() => {});
  }, []);

  const handleAddItem = () => {
    setPrescriptionForm(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { medicine_name: '', dosage: '1 viên', frequency: '2 lần/ngày', duration_days: 5, quantity: 10, instructions: 'Uống sau khi ăn', unit_price: 5000 }
      ]
    }));
  };

  const handleRemoveItem = (index: number) => {
    if (prescriptionForm.items.length <= 1) {
      toast.error('Đơn thuốc phải có ít nhất 1 loại thuốc');
      return;
    }
    setPrescriptionForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setPrescriptionForm(prev => ({
      ...prev,
      items: prev.items.map((it, i) => i === index ? { ...it, [field]: value } : it)
    }));
  };

  const handleCheckInteractions = async () => {
    const medNames = prescriptionForm.items.map(it => it.medicine_name.trim()).filter(Boolean);
    if (medNames.length === 0) {
      toast.error('Vui lòng nhập tên thuốc');
      return;
    }
    try {
      setCheckingInteractions(true);
      const res = await prescriptionsAPI.checkInteractions({
        medicine_names: medNames,
        patient_id: patient?.id,
      });
      setInteractionResult(res.data);
      if (res.data.risk_level === 'safe') {
        toast.success('Đơn thuốc an toàn!');
      } else if (res.data.risk_level === 'warning') {
        toast('Cảnh báo tương tác cần lưu ý!', { icon: '⚠️' });
      } else {
        toast.error('CẢNH BÁO NGUY HIỂM: Có nguy cơ dị ứng hoặc chống chỉ định!');
      }
    } catch {
      toast.error('Lỗi khi kiểm tra tương tác');
    } finally {
      setCheckingInteractions(false);
    }
  };

  const handleSavePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultationId || !patient) return;
    const invalidItem = prescriptionForm.items.find(it => !it.medicine_name.trim());
    if (invalidItem) {
      toast.error('Vui lòng nhập tên thuốc cho tất cả các dòng');
      return;
    }

    try {
      setPrescribing(true);
      const res = await prescriptionsAPI.create({
        consultation_id: consultationId,
        patient_id: patient.id,
        notes: prescriptionForm.notes.trim() || 'Kê đơn theo phác đồ khám bệnh',
        items: prescriptionForm.items
      });
      
      const cRes = await emrAPI.getConsultation(consultationId);
      setPrescription(cRes.data.prescription || {
        prescription_code: res.data.prescription_code,
        notes: prescriptionForm.notes,
        items: prescriptionForm.items
      });
      
      toast.success(`Đã kê đơn thuốc thành công! Mã: ${res.data.prescription_code}`);
      setIsPrescribeOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Lỗi khi kê đơn thuốc');
    } finally {
      setPrescribing(false);
    }
  };

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
      <div className="p-4 md:p-6 lg:p-8 space-y-6 w-full">
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
    <div className="p-4 md:p-6 lg:p-8 space-y-6 w-full">
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
            onClick={() => setIsPrescribeOpen(true)}
            disabled={isLocked}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors shadow-sm text-sm disabled:opacity-50"
          >
            <Pill className="w-4 h-4" /> Kê đơn thuốc
          </button>
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

          {/* Đơn thuốc điều trị */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Pill className="w-5 h-5 text-emerald-600" />
                <h2 className="font-semibold text-slate-800">Đơn thuốc điều trị</h2>
              </div>
              {prescription ? (
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                    prescription.dispensed_at ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {prescription.dispensed_at ? 'Đã phát thuốc' : 'Chưa phát thuốc'}
                  </span>
                  <button
                    onClick={() => navigate('/doctor/prescriptions')}
                    className="text-xs text-blue-600 hover:underline font-medium ml-2"
                  >
                    Xem chi tiết
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsPrescribeOpen(true)}
                  disabled={isLocked}
                  className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> Kê đơn ngay
                </button>
              )}
            </div>

            <div className="p-5">
              {prescription ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span>Mã đơn: <strong className="text-slate-800">{prescription.prescription_code}</strong></span>
                    {prescription.notes && <span>Lời dặn: <em className="text-slate-700">{prescription.notes}</em></span>}
                  </div>

                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                    {prescription.items?.map((it: any, idx: number) => (
                      <div key={idx} className="p-3 bg-white flex items-center justify-between text-xs hover:bg-slate-50/60 transition-colors">
                        <div>
                          <div className="font-bold text-slate-800 text-sm">
                            {idx + 1}. {it.medicine_name}
                          </div>
                          <div className="text-slate-500 mt-0.5">
                            Liều: <span className="font-medium text-slate-700">{it.dosage}</span> • Tần suất: <span className="font-medium text-slate-700">{it.frequency}</span> • {it.instructions}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded font-semibold text-xs">
                            SL: {it.quantity}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-slate-400">
                  <Pill className="w-10 h-10 mx-auto text-slate-300 mb-2 opacity-70" />
                  <p className="text-sm font-medium text-slate-600">Chưa có đơn thuốc cho cuộc khám này</p>
                  <p className="text-xs text-slate-400 mt-1">Bác sĩ có thể bấm nút "Kê đơn thuốc" để chỉ định thuốc cho bệnh nhân.</p>
                  <button
                    onClick={() => setIsPrescribeOpen(true)}
                    disabled={isLocked}
                    className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
                  >
                    <Pill className="w-3.5 h-3.5" /> Kê đơn thuốc mới
                  </button>
                </div>
              )}
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

      {/* Modal Kê đơn thuốc ngay trong EMR */}
      {isPrescribeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Pill className="w-5 h-5 text-emerald-600" /> Kê đơn thuốc điều trị
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bệnh nhân: <strong className="text-slate-800">{patient?.full_name}</strong> ({patient?.patient_code})
                </p>
              </div>
              <button 
                onClick={() => setIsPrescribeOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePrescription} className="p-6 space-y-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lời dặn của bác sĩ / Chẩn đoán</label>
                <input
                  type="text"
                  placeholder="VD: Viêm họng cấp, uống nhiều nước ấm, nghỉ ngơi..."
                  value={prescriptionForm.notes}
                  onChange={(e) => setPrescriptionForm({ ...prescriptionForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 outline-none"
                />
              </div>

              {/* Danh sách các dòng thuốc */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Pill className="w-4 h-4 text-emerald-600" /> Danh mục thuốc ({prescriptionForm.items.length})
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <PlusCircle className="w-4 h-4" /> Thêm thuốc
                  </button>
                </div>

                <div className="space-y-3">
                  {prescriptionForm.items.map((item, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-bold text-slate-500">#{idx + 1}</span>
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            required
                            placeholder="Tên biệt dược / hoạt chất (VD: Paracetamol, Amoxicillin...)"
                            value={item.medicine_name}
                            onFocus={() => setActiveSuggestionRow(idx)}
                            onChange={(e) => {
                              handleItemChange(idx, 'medicine_name', e.target.value);
                              setActiveSuggestionRow(idx);
                            }}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none font-medium"
                          />
                          {activeSuggestionRow === idx && item.medicine_name.trim().length > 0 && (
                            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 max-h-48 overflow-y-auto">
                              {catalogMedicines
                                .filter(m => m.name.toLowerCase().includes(item.medicine_name.toLowerCase()) || (m.generic_name && m.generic_name.toLowerCase().includes(item.medicine_name.toLowerCase())))
                                .slice(0, 6)
                                .map(med => (
                                  <div
                                    key={med.id}
                                    onMouseDown={() => {
                                      handleItemChange(idx, 'medicine_name', med.name);
                                      handleItemChange(idx, 'unit_price', med.price || 5000);
                                      if (med.strength) handleItemChange(idx, 'dosage', `1 ${med.unit || 'viên'}`);
                                      setActiveSuggestionRow(null);
                                    }}
                                    className="p-2.5 hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-0 flex items-center justify-between text-xs transition-colors"
                                  >
                                    <div>
                                      <span className="font-semibold text-slate-800">{med.name}</span>
                                      {med.generic_name && <span className="text-slate-400 block text-[11px]">{med.generic_name}</span>}
                                    </div>
                                    <div className="text-right">
                                      <span className="text-blue-600 font-semibold">{(med.price || 0).toLocaleString()}đ</span>
                                      <span className="text-slate-400 text-[10px] block">{med.form || 'Viên'}</span>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa thuốc"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <label className="text-slate-500 mb-1 block">Số lượng</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-slate-500 mb-1 block">Liều dùng</label>
                          <input
                            type="text"
                            value={item.dosage}
                            onChange={(e) => handleItemChange(idx, 'dosage', e.target.value)}
                            placeholder="1 viên"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-slate-500 mb-1 block">Tần suất</label>
                          <input
                            type="text"
                            value={item.frequency}
                            onChange={(e) => handleItemChange(idx, 'frequency', e.target.value)}
                            placeholder="2 lần/ngày"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-slate-500 mb-1 block">Số ngày dùng</label>
                          <input
                            type="number"
                            min="1"
                            value={item.duration_days}
                            onChange={(e) => handleItemChange(idx, 'duration_days', parseInt(e.target.value) || 1)}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none"
                          />
                        </div>

                        <div className="col-span-2 sm:col-span-4">
                          <label className="text-slate-500 mb-1 block">Cách dùng & Hướng dẫn</label>
                          <input
                            type="text"
                            value={item.instructions}
                            onChange={(e) => handleItemChange(idx, 'instructions', e.target.value)}
                            placeholder="Uống sau khi ăn 30 phút..."
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Drug interaction check button & banner */}
              <div className="space-y-3">
                <div className="bg-purple-50/60 p-4 rounded-xl border border-purple-200/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-600" /> AI Kiểm tra tương tác thuốc & Chống chỉ định
                    </h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">Tự động phân tích tương tác giữa các loại thuốc và đối chiếu dị ứng của bệnh nhân</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCheckInteractions}
                    disabled={checkingInteractions}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors whitespace-nowrap disabled:opacity-50"
                  >
                    {checkingInteractions ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    Kiểm tra tương tác
                  </button>
                </div>

                {interactionResult && (
                  <div className={`p-4 rounded-xl border text-xs space-y-2.5 ${
                    interactionResult.risk_level === 'danger'
                      ? 'bg-red-50 border-red-200 text-red-900'
                      : interactionResult.risk_level === 'warning'
                        ? 'bg-amber-50 border-amber-200 text-amber-900'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  }`}>
                    <div className="flex items-center gap-2 font-bold text-sm">
                      {interactionResult.risk_level === 'safe' ? (
                        <><ShieldCheck className="w-4 h-4 text-emerald-600" /> Đơn thuốc an toàn - Không phát hiện tương tác nguy hiểm</>
                      ) : interactionResult.risk_level === 'warning' ? (
                        <><AlertTriangle className="w-4 h-4 text-amber-600" /> Cảnh báo tương tác thuốc cần lưu ý</>
                      ) : (
                        <><AlertTriangle className="w-4 h-4 text-red-600" /> NGUY CƠ DỊ ỨNG / CHỐNG CHỈ ĐỊNH CAO</>
                      )}
                    </div>
                    {interactionResult.warnings.length > 0 && (
                      <ul className="list-disc pl-5 space-y-1">
                        {interactionResult.warnings.map((w, idx) => (
                          <li key={idx} className="font-semibold">{w}</li>
                        ))}
                      </ul>
                    )}
                    {interactionResult.recommendations.length > 0 && (
                      <div className="pt-2 border-t border-black/5">
                        <span className="font-bold block mb-1">Khuyến nghị chuyên môn:</span>
                        <ul className="list-disc pl-5 space-y-1">
                          {interactionResult.recommendations.map((r, idx) => (
                            <li key={idx}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="text-xs text-slate-500">
                  Tổng tiền thuốc dự kiến: <span className="font-bold text-emerald-600 text-sm">
                    {prescriptionForm.items.reduce((sum, it) => sum + (it.quantity * (it.unit_price || 0)), 0).toLocaleString()}đ
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPrescribeOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={prescribing}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {prescribing && <Loader2 className="w-4 h-4 animate-spin" />}
                    {prescribing ? 'Đang lưu đơn thuốc...' : 'Lưu và đính kèm đơn thuốc'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
