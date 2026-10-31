import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { receptionistApi } from '../../services/receptionist';
import api from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Plus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReceptionistQueue() {
  const queryClient = useQueryClient();
  const { data: queue, isLoading } = useQuery({ queryKey: ['receptionist-queue'], queryFn: receptionistApi.getQueue });

  // Add to Queue State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [formData, setFormData] = useState({
    patient_id: '',
    doctor_id: '',
    notes: ''
  });

  const { data: patients } = useQuery({ queryKey: ['all-patients'], queryFn: () => receptionistApi.getPatients() });
  const { data: doctors } = useQuery({ queryKey: ['all-doctors'], queryFn: () => api.get('/doctors').then(r => r.data) });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => receptionistApi.updateQueueStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receptionist-queue'] });
      toast.success('Cập nhật trạng thái thành công');
    },
    onError: () => toast.error('Có lỗi xảy ra')
  });

  const handleAddToQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patient_id || !formData.doctor_id) {
      toast.error('Vui lòng chọn bệnh nhân và bác sĩ');
      return;
    }

    try {
      setAdding(true);
      const res = await receptionistApi.addToQueue({
        patient_id: formData.patient_id,
        doctor_id: formData.doctor_id,
        notes: formData.notes.trim() || undefined
      });
      toast.success(`Cấp số thứ tự thành công! Số STT: #${res.queue_number}`);
      queryClient.invalidateQueries({ queryKey: ['receptionist-queue'] });
      queryClient.refetchQueries({ queryKey: ['receptionist-queue'] });
      queryClient.invalidateQueries({ queryKey: ['receptionist-stats'] });
      setIsAddOpen(false);
      setFormData({ patient_id: '', doctor_id: '', notes: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Lỗi khi cấp số vào hàng đợi');
    } finally {
      setAdding(false);
    }
  };

  if (isLoading) return <div>Đang tải...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Hàng Đợi Hôm Nay</h2>
          <p className="text-sm text-slate-500 mt-1">Quản lý và gọi số thứ tự bệnh nhân vào phòng khám</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Cấp số / Thêm vào hàng đợi
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-500">STT</th>
                <th className="px-4 py-3 font-medium text-slate-500">Bệnh nhân</th>
                <th className="px-4 py-3 font-medium text-slate-500">Bác sĩ</th>
                <th className="px-4 py-3 font-medium text-slate-500">Thời gian check-in</th>
                <th className="px-4 py-3 font-medium text-slate-500">Trạng thái</th>
                <th className="px-4 py-3 font-medium text-slate-500 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {queue?.map((q: any) => (
                <tr key={q.id} className="border-b hover:bg-slate-50">
                  <td className="px-4 py-3 font-bold text-blue-600">#{q.queue_number}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{q.patient.full_name}</p>
                    <p className="text-xs text-slate-500">{q.patient.patient_code}</p>
                  </td>
                  <td className="px-4 py-3">{q.doctor.full_name}</td>
                  <td className="px-4 py-3">{new Date(q.check_in_time).toLocaleTimeString('vi-VN')}</td>
                  <td className="px-4 py-3">
                    <Badge variant={q.status === 'waiting' ? 'secondary' : q.status === 'called' ? 'default' : q.status === 'in_consultation' ? 'destructive' : 'outline'}>
                      {q.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                       {q.status === 'waiting' && <Button size="sm" onClick={() => updateStatus.mutate({ id: q.id, status: 'called' })}>Gọi tên</Button>}
                       {q.status === 'called' && <Button size="sm" variant="secondary" onClick={() => updateStatus.mutate({ id: q.id, status: 'in_consultation' })}>Vào khám</Button>}
                       {q.status === 'in_consultation' && <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: q.id, status: 'completed' })}>Hoàn tất</Button>}
                    </div>
                  </td>
                </tr>
              ))}
              {queue?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">Không có bệnh nhân trong hàng đợi.</td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Dialog Cấp số / Thêm vào hàng đợi */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cấp số thứ tự vào hàng đợi</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddToQueue} className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Chọn bệnh nhân <span className="text-red-500">*</span></label>
              <select
                required
                value={formData.patient_id}
                onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 outline-none"
              >
                <option value="">-- Chọn bệnh nhân --</option>
                {patients?.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} ({p.patient_code}) - {p.phone || 'SĐT chưa có'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Chọn bác sĩ khám <span className="text-red-500">*</span></label>
              <select
                required
                value={formData.doctor_id}
                onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 outline-none"
              >
                <option value="">-- Chọn bác sĩ phụ trách --</option>
                {doctors?.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    BS. {d.staff?.full_name || d.full_name || 'Bác sĩ'} - {d.specialty?.name || 'Đa khoa'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Ghi chú tiếp đón</label>
              <Input
                placeholder="VD: Khám ưu tiên, đo huyết áp trước..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Hủy</Button>
              <Button type="submit" disabled={adding} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
                {adding && <Loader2 className="w-4 h-4 animate-spin" />}
                {adding ? 'Đang cấp số...' : 'Xác nhận cấp số'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
