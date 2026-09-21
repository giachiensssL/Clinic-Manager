import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { receptionistApi } from '../../services/receptionist';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Calendar, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function ReceptionistAppointments() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');

  const { data: appointments, isLoading } = useQuery({ 
    queryKey: ['receptionist-apts', date, search], 
    queryFn: () => receptionistApi.getAppointments({ date, search }) 
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status, reason }: { id: string, status: string, reason?: string }) => receptionistApi.updateAppointmentStatus(id, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receptionist-apts'] });
      queryClient.invalidateQueries({ queryKey: ['receptionist-stats'] });
      toast.success('Cập nhật thành công');
    }
  });

  const checkIn = useMutation({
    mutationFn: (id: string) => receptionistApi.checkInAppointment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receptionist-apts'] });
      queryClient.invalidateQueries({ queryKey: ['receptionist-stats'] });
      toast.success('Check-in thành công');
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Quản lý Lịch hẹn</h2>
        <Button onClick={() => navigate('/receptionist/appointments/create')}>+ Đặt lịch khám</Button>
      </div>

      <div className="flex gap-4 items-center bg-white p-4 rounded-lg border">
         <div className="flex-1 relative">
           <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
           <Input 
             placeholder="Tìm theo tên, SĐT, Mã lịch hẹn..." 
             className="pl-9"
             value={search}
             onChange={(e) => setSearch(e.target.value)}
           />
         </div>
         <div className="w-48 relative">
           <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
           <Input 
             type="date"
             className="pl-9"
             value={date}
             onChange={(e) => setDate(e.target.value)}
           />
         </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-500">Giờ</th>
                <th className="px-4 py-3 font-medium text-slate-500">Bệnh nhân</th>
                <th className="px-4 py-3 font-medium text-slate-500">Bác sĩ / Chuyên khoa</th>
                <th className="px-4 py-3 font-medium text-slate-500">Trạng thái</th>
                <th className="px-4 py-3 font-medium text-slate-500 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center">Đang tải...</td></tr>
              ) : appointments?.map((a: any) => (
                <tr key={a.id} className="border-b hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-blue-600">{a.start_time}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{a.patient?.full_name}</p>
                    <p className="text-xs text-slate-500">{a.patient?.phone}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{a.doctor?.full_name}</p>
                    <p className="text-xs text-slate-500">{a.specialty?.name}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={a.status === 'scheduled' ? 'outline' : a.status === 'waiting' ? 'secondary' : a.status === 'completed' ? 'default' : 'destructive'}>{a.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                       {a.status === 'scheduled' && (
                         <Button size="sm" onClick={() => {
                           if(confirm('Xác nhận bệnh nhân đã đến?')) checkIn.mutate(a.id);
                         }}>Check-in</Button>
                       )}
                       {(a.status === 'scheduled' || a.status === 'waiting') && (
                         <Button size="sm" variant="destructive" onClick={() => {
                           const reason = prompt('Lý do hủy:');
                           if(reason !== null) updateStatus.mutate({ id: a.id, status: 'cancelled', reason });
                         }}>Hủy</Button>
                       )}
                    </div>
                  </td>
                </tr>
              ))}
              {appointments?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">Không tìm thấy lịch hẹn nào.</td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
