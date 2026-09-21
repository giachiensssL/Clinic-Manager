import React, { useState } from 'react';
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
