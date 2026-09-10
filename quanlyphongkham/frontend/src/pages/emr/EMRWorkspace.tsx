import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Clock, FileSignature, AlertCircle, Bot, Loader2, Save } from 'lucide-react';
import { appointmentsAPI, emrAPI } from '@/services/api';
import { format } from 'date-fns';

const STATUS_MAP: Record<string, { label: string; class: string }> = {
  scheduled: { label: 'Đã đặt', class: 'text-blue-600 bg-blue-50' },
  waiting: { label: 'Chờ khám', class: 'text-amber-600 bg-amber-50' },
  in_consultation: { label: 'Đang khám', class: 'text-purple-600 bg-purple-50' },
  completed: { label: 'Hoàn thành', class: 'text-green-600 bg-green-50' },
  paid: { label: 'Đã thanh toán', class: 'text-teal-600 bg-teal-50' },
  cancelled: { label: 'Đã hủy', class: 'text-red-600 bg-red-50' },
};

export default function EMRWorkspace() {
  const queryClient = useQueryClient();
  const [selectedApt, setSelectedApt] = useState<any>(null);

  const { data: aptsRes } = useQuery({
    queryKey: ['appointments-today'],
    queryFn: async () => {
      const res = await appointmentsAPI.getAll({ date: format(new Date(), 'yyyy-MM-dd') });
      return res.data;
    }
  });

  const appointments = aptsRes?.items || [];
  
  if (appointments.length > 0 && !selectedApt) {
    setSelectedApt(appointments[0]);
  }

  // Load EMR for selected appointment
  const { data: emrData, isLoading: isLoadingEMR, refetch: refetchEMR } = useQuery({
    queryKey: ['emr', selectedApt?.id],
    queryFn: async () => {
      if (!selectedApt) return null;
      try {
        const res = await emrAPI.getByAppointment(selectedApt.id);
        return res.data;
      } catch (err: any) {
        if (err.response?.status === 404) return null;
        throw err;
      }
    },
    enabled: !!selectedApt?.id,
  });

  // Form state
  const [formData, setFormData] = useState({
    blood_pressure: '',
    heart_rate: '',
    temperature: '',
    oxygen_saturation: '',
    chief_complaint: '',
    clinical_notes: '',
    treatment_plan: '',
  });

  useEffect(() => {
    if (emrData) {
      setFormData({
        blood_pressure: emrData.vitals?.blood_pressure || '',
        heart_rate: emrData.vitals?.heart_rate || '',
        temperature: emrData.vitals?.temperature || '',
        oxygen_saturation: emrData.vitals?.oxygen_saturation || '',
        chief_complaint: emrData.chief_complaint || selectedApt?.reason || '',
        clinical_notes: emrData.clinical_notes || '',
        treatment_plan: emrData.treatment_plan || '',
      });
    } else {
      setFormData({
        blood_pressure: '',
        heart_rate: '',
        temperature: '',
        oxygen_saturation: '',
        chief_complaint: selectedApt?.reason || '',
        clinical_notes: '',
        treatment_plan: '',
      });
    }
  }, [emrData, selectedApt]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      let consultationId = emrData?.id;
      if (!consultationId) {
        const createRes = await emrAPI.createConsultation({
          appointment_id: selectedApt.id,
          chief_complaint: data.chief_complaint,
          blood_pressure: data.blood_pressure,
          heart_rate: data.heart_rate ? Number(data.heart_rate) : undefined,
          temperature: data.temperature ? Number(data.temperature) : undefined,
          oxygen_saturation: data.oxygen_saturation ? Number(data.oxygen_saturation) : undefined,
        });
        consultationId = createRes.data.id;
      }
      
      await emrAPI.updateConsultation(consultationId, {
        clinical_notes: data.clinical_notes,
        treatment_plan: data.treatment_plan,
        chief_complaint: data.chief_complaint,
      });

      return consultationId;
    },
    onSuccess: () => {
      refetchEMR();
      queryClient.invalidateQueries({ queryKey: ['appointments-today'] });
    }
  });

  const lockMutation = useMutation({
    mutationFn: async () => {
      if (emrData?.id) {
        await emrAPI.signAndLock(emrData.id);
      }
    },
    onSuccess: () => {
      refetchEMR();
    }
  });

  const handleChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleSave = () => saveMutation.mutate(formData);
  const handleLock = () => {
    if (confirm("Sau khi ký và khóa, bạn sẽ không thể chỉnh sửa hồ sơ này. Bạn có chắc chắn?")) {
      lockMutation.mutate();
    }
  };

  const patient = selectedApt?.patient;
  const isLocked = emrData?.status === 'locked';

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-4 overflow-hidden -m-2">
      {/* Sidebar Queue */}
      <div className="w-72 bg-white border rounded-xl shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b bg-slate-50"><h3 className="font-bold text-[#1e3a5f]">Hàng Đợi (Hôm nay)</h3></div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {appointments.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-500">Không có lịch khám hôm nay</div>
          ) : appointments.map((apt: any) => {
            const st = STATUS_MAP[apt.status] || { label: apt.status, class: 'text-slate-600 bg-slate-50' };
            return (
            <div 
              key={apt.id} 
              onClick={() => setSelectedApt(apt)}
              className={`p-3 border rounded-lg cursor-pointer ${selectedApt?.id === apt.id ? 'bg-purple-50 border-purple-200 shadow-sm' : 'hover:bg-slate-50'}`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={`font-medium ${selectedApt?.id === apt.id ? 'text-purple-900 font-bold' : 'text-slate-800'}`}>{apt.patient?.full_name}</span>
                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{apt.start_time?.slice(0, 5)}</span>
              </div>
              <p className={`text-xs flex items-center gap-1 w-fit px-1.5 py-0.5 rounded ${st.class}`}>
                <Clock className="w-3 h-3" /> {st.label}
              </p>
            </div>
            );
          })}
        </div>
      </div>

      {/* Main EMR Area */}
      <div className="flex-1 bg-white border rounded-xl shadow-sm flex flex-col overflow-hidden">
        {patient ? (
          <>
            {/* Patient Header */}
            <div className="p-4 border-b flex justify-between items-start bg-slate-50">
              <div>
                <h2 className="text-xl font-bold text-[#1e3a5f]">
                  {patient.full_name} 
                  <span className="text-sm font-normal text-slate-500 ml-2">{patient.gender === 'male' ? 'Nam' : 'Nữ'} • {patient.patient_code}</span>
                  {isLocked && <Badge className="ml-2 bg-green-100 text-green-700">Đã khóa</Badge>}
                </h2>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">Nhóm máu: {patient.blood_type || 'Chưa rõ'}</Badge>
                  {patient.allergies && <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50"><AlertCircle className="w-3 h-3 mr-1"/> Dị ứng: {patient.allergies}</Badge>}
                </div>
              </div>
              <Button variant="outline" className="border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100"><Bot className="w-4 h-4 mr-2" /> AI Tóm Tắt BA</Button>
            </div>

            {/* EMR Form */}
            {isLoadingEMR ? (
              <div className="flex-1 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1"><label className="text-xs font-medium text-slate-500">Huyết áp (mmHg)</label><Input name="blood_pressure" value={formData.blood_pressure} onChange={handleChange} disabled={isLocked} placeholder="120/80" className="bg-slate-50" /></div>
                  <div className="space-y-1"><label className="text-xs font-medium text-slate-500">Nhịp tim (bpm)</label><Input name="heart_rate" value={formData.heart_rate} onChange={handleChange} disabled={isLocked} placeholder="80" className="bg-slate-50" /></div>
                  <div className="space-y-1"><label className="text-xs font-medium text-slate-500">Nhiệt độ (°C)</label><Input name="temperature" value={formData.temperature} onChange={handleChange} disabled={isLocked} placeholder="37" className="bg-slate-50" /></div>
                  <div className="space-y-1"><label className="text-xs font-medium text-slate-500">SpO2 (%)</label><Input name="oxygen_saturation" value={formData.oxygen_saturation} onChange={handleChange} disabled={isLocked} placeholder="98" className="bg-slate-50" /></div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#1e3a5f]">Lý do khám</label>
                  <Textarea name="chief_complaint" value={formData.chief_complaint} onChange={handleChange} disabled={isLocked} placeholder="Triệu chứng chính..." />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#1e3a5f]">Ghi chú lâm sàng</label>
                  <Textarea name="clinical_notes" value={formData.clinical_notes} onChange={handleChange} disabled={isLocked} placeholder="Khám thực thể..." className="min-h-[120px]" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#1e3a5f]">Hướng xử trí / Kế hoạch điều trị</label>
                  <Textarea name="treatment_plan" value={formData.treatment_plan} onChange={handleChange} disabled={isLocked} placeholder="Kế hoạch..." />
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
              {!isLocked && (
                <>
                  <Button variant="outline" onClick={handleSave} disabled={saveMutation.isPending || isLoadingEMR}>
                    {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Lưu nháp
                  </Button>
                  <Button className="bg-[#1e3a5f] hover:bg-[#152943]" onClick={handleLock} disabled={lockMutation.isPending || !emrData || isLoadingEMR}>
                    {lockMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileSignature className="w-4 h-4 mr-2"/>} Ký Số & Khóa Hồ Sơ
                  </Button>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            Vui lòng chọn một lịch hẹn trong hàng đợi
          </div>
        )}
      </div>
    </div>
  );
}
