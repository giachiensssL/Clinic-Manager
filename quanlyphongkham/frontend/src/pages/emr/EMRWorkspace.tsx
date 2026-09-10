import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Activity, Clock, FileSignature, AlertCircle, Bot, Lock } from 'lucide-react';
import { appointmentsAPI, patientsAPI, emrAPI } from '@/services/api';
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
  const [selectedApt, setSelectedApt] = useState<any>(null);

  const { data: aptsRes } = useQuery({
    queryKey: ['appointments-today'],
    queryFn: async () => {
      const res = await appointmentsAPI.getAll({ date: format(new Date(), 'yyyy-MM-dd') });
      return res.data;
    }
  });

  const appointments = aptsRes?.items || [];
  
  // Auto select first appointment if none selected
  if (appointments.length > 0 && !selectedApt) {
    setSelectedApt(appointments[0]);
  }

  const patient = selectedApt?.patient;

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
                <h2 className="text-xl font-bold text-[#1e3a5f]">{patient.full_name} <span className="text-sm font-normal text-slate-500 ml-2">{patient.gender === 'male' ? 'Nam' : 'Nữ'} • {patient.patient_code}</span></h2>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">Nhóm máu: {patient.blood_type || 'Chưa rõ'}</Badge>
                  {patient.allergies && <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50"><AlertCircle className="w-3 h-3 mr-1"/> Dị ứng: {patient.allergies}</Badge>}
                </div>
              </div>
              <Button variant="outline" className="border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100"><Bot className="w-4 h-4 mr-2" /> AI Tóm Tắt BA</Button>
            </div>

            {/* EMR Form */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1"><label className="text-xs font-medium text-slate-500">Huyết áp (mmHg)</label><Input placeholder="120/80" className="bg-slate-50" /></div>
                <div className="space-y-1"><label className="text-xs font-medium text-slate-500">Nhịp tim (bpm)</label><Input placeholder="80" className="bg-slate-50" /></div>
                <div className="space-y-1"><label className="text-xs font-medium text-slate-500">Nhiệt độ (°C)</label><Input placeholder="37" className="bg-slate-50" /></div>
                <div className="space-y-1"><label className="text-xs font-medium text-slate-500">SpO2 (%)</label><Input placeholder="98" className="bg-slate-50" /></div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#1e3a5f]">Lý do khám</label>
                <Textarea placeholder="Triệu chứng chính..." defaultValue={selectedApt?.reason} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#1e3a5f]">Ghi chú lâm sàng</label>
                <Textarea placeholder="Khám thực thể..." className="min-h-[120px]" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#1e3a5f]">Chẩn đoán (ICD-10)</label>
                <div className="flex gap-2 mb-2">
                  <Input placeholder="Tìm kiếm mã ICD-10 hoặc tên bệnh..." className="flex-1" />
                  <Button variant="secondary">Thêm</Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#1e3a5f]">Hướng xử trí / Kế hoạch điều trị</label>
                <Textarea placeholder="Kế hoạch..." />
              </div>
            </div>

            {/* Action Bar */}
            <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
              <Button variant="outline">Lưu nháp</Button>
              <Button className="bg-[#1e3a5f] hover:bg-[#152943]"><FileSignature className="w-4 h-4 mr-2"/> Ký Số & Khóa Hồ Sơ</Button>
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
