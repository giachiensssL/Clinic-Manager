import os

base_dir = "src/pages/receptionist"

# 1. ReceptionistPatients.tsx (update with modal for adding patient)
patients_tsx = """import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { receptionistApi } from '../../services/receptionist';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Search, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Label } from '../../components/ui/label';
import toast from 'react-hot-toast';

export default function ReceptionistPatients() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    full_name: '', phone: '', date_of_birth: '', gender: 'male', email: '', address: ''
  });

  const { data: patients, isLoading } = useQuery({ 
    queryKey: ['receptionist-patients', search], 
    queryFn: () => receptionistApi.getPatients({ search }) 
  });

  const createPatient = useMutation({
    mutationFn: (data: any) => receptionistApi.createPatient(data),
    onSuccess: () => {
      toast.success('Thêm bệnh nhân thành công!');
      queryClient.invalidateQueries({ queryKey: ['receptionist-patients'] });
      setOpen(false);
      setFormData({ full_name: '', phone: '', date_of_birth: '', gender: 'male', email: '', address: '' });
    },
    onError: () => toast.error('Lỗi khi thêm bệnh nhân')
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPatient.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Quản lý Bệnh nhân</h2>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Thêm bệnh nhân mới</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Thêm Bệnh Nhân Mới</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Họ tên *</Label>
                  <Input required value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} placeholder="Nguyễn Văn A" />
                </div>
                <div className="space-y-2">
                  <Label>Số điện thoại *</Label>
                  <Input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="09xxxx" />
                </div>
                <div className="space-y-2">
                  <Label>Ngày sinh *</Label>
                  <Input type="date" required value={formData.date_of_birth} onChange={e => setFormData({...formData, date_of_birth: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Giới tính *</Label>
                  <Select value={formData.gender} onValueChange={v => setFormData({...formData, gender: v})}>
                    <SelectTrigger><SelectValue placeholder="Chọn giới tính" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Nam</SelectItem>
                      <SelectItem value="female">Nữ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Email</Label>
                  <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="email@example.com" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Địa chỉ</Label>
                  <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Hà Nội" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
                <Button type="submit" disabled={createPatient.isPending}>
                  {createPatient.isPending ? 'Đang lưu...' : 'Lưu thông tin'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4 items-center bg-white p-4 rounded-lg border">
         <div className="flex-1 relative">
           <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
           <Input 
             placeholder="Tìm theo tên, SĐT, Mã BN..." 
             className="pl-9"
             value={search}
             onChange={(e) => setSearch(e.target.value)}
           />
         </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-500">Mã BN</th>
                <th className="px-4 py-3 font-medium text-slate-500">Họ tên</th>
                <th className="px-4 py-3 font-medium text-slate-500">Ngày sinh</th>
                <th className="px-4 py-3 font-medium text-slate-500">Giới tính</th>
                <th className="px-4 py-3 font-medium text-slate-500">Số điện thoại</th>
                <th className="px-4 py-3 font-medium text-slate-500 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center">Đang tải...</td></tr>
              ) : patients?.map((p: any) => (
                <tr key={p.id} className="border-b hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{p.patient_code}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{p.full_name}</td>
                  <td className="px-4 py-3">{p.date_of_birth}</td>
                  <td className="px-4 py-3">
                     <span className={`px-2 py-1 rounded text-xs ${p.gender === 'male' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'}`}>
                       {p.gender === 'male' ? 'Nam' : 'Nữ'}
                     </span>
                  </td>
                  <td className="px-4 py-3">{p.phone}</td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="outline" onClick={() => navigate(`/receptionist/patients/${p.id}`)}>Xem hồ sơ</Button>
                  </td>
                </tr>
              ))}
              {patients?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">Không tìm thấy bệnh nhân nào.</td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
"""

with open(f"{base_dir}/ReceptionistPatients.tsx", "w", encoding="utf-8") as f:
    f.write(patients_tsx)

# 2. ReceptionistAppointmentCreate.tsx
apt_create_tsx = """import React, { useState } from 'react';
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
"""

with open(f"{base_dir}/ReceptionistAppointmentCreate.tsx", "w", encoding="utf-8") as f:
    f.write(apt_create_tsx)


# 3. ReceptionistPatientProfile.tsx
profile_tsx = """import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { receptionistApi } from '../../services/receptionist';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { ArrowLeft, User, Phone, MapPin, Calendar, Clock } from 'lucide-react';
import { Badge } from '../../components/ui/badge';

export default function ReceptionistPatientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: patient, isLoading } = useQuery({ 
    queryKey: ['receptionist-patient', id], 
    queryFn: () => receptionistApi.getPatient(id!) 
  });

  if (isLoading) return <div>Đang tải thông tin...</div>;
  if (!patient) return <div>Không tìm thấy bệnh nhân.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
        <h2 className="text-2xl font-bold">Hồ sơ Bệnh nhân</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-24 h-24 bg-slate-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <User className="h-10 w-10 text-slate-500" />
              </div>
              <h3 className="text-xl font-bold">{patient.full_name}</h3>
              <p className="text-slate-500 mb-4">{patient.patient_code}</p>
              
              <div className="space-y-3 text-left border-t pt-4 mt-4">
                <div className="flex items-center text-sm"><Calendar className="h-4 w-4 mr-2 text-slate-400" /> Ngày sinh: {patient.date_of_birth}</div>
                <div className="flex items-center text-sm"><User className="h-4 w-4 mr-2 text-slate-400" /> Giới tính: {patient.gender === 'male' ? 'Nam' : 'Nữ'}</div>
                <div className="flex items-center text-sm"><Phone className="h-4 w-4 mr-2 text-slate-400" /> SĐT: {patient.phone}</div>
                <div className="flex items-center text-sm"><MapPin className="h-4 w-4 mr-2 text-slate-400" /> Địa chỉ: {patient.address || 'Chưa cập nhật'}</div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Lịch sử khám</CardTitle></CardHeader>
            <CardContent>
               <div className="text-center py-8 text-slate-500">
                  <Clock className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                  <p>Tính năng xem lịch sử chi tiết đang được nâng cấp.</p>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
"""

with open(f"{base_dir}/ReceptionistPatientProfile.tsx", "w", encoding="utf-8") as f:
    f.write(profile_tsx)

print("generated create files")
