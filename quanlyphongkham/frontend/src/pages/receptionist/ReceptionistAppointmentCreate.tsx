import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { receptionistApi } from '../../services/receptionist';
import api from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';

export default function ReceptionistAppointmentCreate() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    patient_id: '',
    doctor_id: '',
    date: new Date().toISOString().split('T')[0],
    time: '08:00',
    reason: ''
  });

  // Fetch lists
  const { data: patients } = useQuery({ queryKey: ['all-patients'], queryFn: () => receptionistApi.getPatients() });
  const { data: doctors } = useQuery({ queryKey: ['all-doctors'], queryFn: () => api.get('/doctors').then(r => r.data) });

  const createApt = useMutation({
    mutationFn: (data: any) => receptionistApi.createAppointment(data),
    onSuccess: (res) => {
      toast.success(`Tạo lịch hẹn thành công! Mã: ${res.appointment_code}`);
      queryClient.invalidateQueries({ queryKey: ['receptionist-apts'] });
      navigate('/receptionist/appointments');
    },
    onError: () => toast.error('Có lỗi xảy ra, không thể tạo lịch')
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patient_id || !formData.doctor_id) {
      toast.error('Vui lòng chọn Bệnh nhân và Bác sĩ');
      return;
    }
    createApt.mutate(formData);
  };

  const timeSlots = [];
  for (let h = 8; h <= 17; h++) {
    timeSlots.push(`${h.toString().padStart(2, '0')}:00`);
    timeSlots.push(`${h.toString().padStart(2, '0')}:30`);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
        <h2 className="text-2xl font-bold">Đặt lịch khám mới</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin lịch hẹn</CardTitle>
          <CardDescription>Điền thông tin để tạo lịch hẹn mới cho bệnh nhân</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Bệnh nhân *</Label>
              <Select value={formData.patient_id} onValueChange={v => setFormData({...formData, patient_id: v})}>
                <SelectTrigger><SelectValue placeholder="-- Chọn bệnh nhân --" /></SelectTrigger>
                <SelectContent>
                  {patients?.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.full_name} ({p.phone} - {p.patient_code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Bác sĩ *</Label>
              <Select value={formData.doctor_id} onValueChange={v => setFormData({...formData, doctor_id: v})}>
                <SelectTrigger><SelectValue placeholder="-- Chọn bác sĩ --" /></SelectTrigger>
                <SelectContent>
                  {doctors?.map((d: any) => (
                    <SelectItem key={d.id} value={d.id}>{d.staff.full_name} ({d.specialty.name})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Ngày khám *</Label>
                <Input type="date" min={new Date().toISOString().split('T')[0]} value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Giờ khám *</Label>
                <Select value={formData.time} onValueChange={v => setFormData({...formData, time: v})}>
                  <SelectTrigger><SelectValue placeholder="Chọn giờ" /></SelectTrigger>
                  <SelectContent>
                    {timeSlots.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Lý do khám (Triệu chứng)</Label>
              <Textarea 
                placeholder="Mô tả triệu chứng bệnh nhân..." 
                value={formData.reason} 
                onChange={e => setFormData({...formData, reason: e.target.value})} 
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>Hủy</Button>
              <Button type="submit" disabled={createApt.isPending}>
                {createApt.isPending ? 'Đang tạo...' : 'Xác nhận Đặt lịch'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
