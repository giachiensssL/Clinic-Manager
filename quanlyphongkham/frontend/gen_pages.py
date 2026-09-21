import os

base_dir = "src/pages/receptionist"

dashboard_tsx = """import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { receptionistApi } from '../../services/receptionist';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Users, Calendar, Clock, CreditCard, Activity } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function ReceptionistDashboard() {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useQuery({ queryKey: ['receptionist-stats'], queryFn: receptionistApi.getStats });
  const { data: recent, isLoading: recentLoading } = useQuery({ queryKey: ['receptionist-recent'], queryFn: receptionistApi.getRecentActivity });
  const { data: appointments, isLoading: aptsLoading } = useQuery({ queryKey: ['receptionist-apts-today'], queryFn: () => receptionistApi.getAppointments({ date: new Date().toISOString().split('T')[0] }) });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-blue-50 p-6 rounded-lg border border-blue-100">
        <div>
          <h2 className="text-2xl font-bold text-blue-900">Xin chào! Chúc một ngày làm việc hiệu quả.</h2>
          <p className="text-blue-700 mt-1">Tổng quan hoạt động phòng khám hôm nay.</p>
        </div>
        <div className="flex gap-2">
           <Button onClick={() => navigate('/receptionist/appointments/create')}>Đặt lịch khám mới</Button>
           <Button variant="outline" onClick={() => navigate('/receptionist/queue')}>Xem hàng đợi</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Lịch hẹn hôm nay</CardTitle><Calendar className="h-4 w-4 text-slate-500" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats?.todayAppointments || 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Bệnh nhân chờ</CardTitle><Clock className="h-4 w-4 text-orange-500" /></CardHeader>
          <CardContent><div className="text-2xl font-bold text-orange-600">{stats?.waitingPatients || 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Đã tiếp nhận</CardTitle><Users className="h-4 w-4 text-green-500" /></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{stats?.checkedInPatients || 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Thanh toán chờ</CardTitle><CreditCard className="h-4 w-4 text-red-500" /></CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-600">{stats?.pendingPayments || 0}</div></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Lịch hẹn sắp tới</CardTitle></CardHeader>
            <CardContent>
              {aptsLoading ? <p>Đang tải...</p> : (
                <div className="space-y-4">
                  {appointments?.slice(0, 5).map((apt: any) => (
                    <div key={apt.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-slate-50">
                      <div className="flex items-center gap-4">
                         <div className="bg-blue-100 text-blue-800 p-2 rounded-md font-bold text-center w-16">{apt.start_time}</div>
                         <div>
                            <p className="font-semibold text-slate-800">{apt.patient?.full_name}</p>
                            <p className="text-sm text-slate-500">BS: {apt.doctor?.full_name} - {apt.specialty?.name}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-3">
                         <Badge>{apt.status}</Badge>
                         {apt.status === 'scheduled' && <Button size="sm" onClick={() => { receptionistApi.checkInAppointment(apt.id); window.location.reload(); }}>Check-in</Button>}
                      </div>
                    </div>
                  ))}
                  {appointments?.length === 0 && <p className="text-center text-slate-500 py-4">Không có lịch hẹn nào sắp tới.</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader><CardTitle>Hoạt động gần đây</CardTitle></CardHeader>
            <CardContent>
               {recentLoading ? <p>Đang tải...</p> : (
                 <div className="space-y-4">
                   {recent?.map((log: any) => (
                     <div key={log.id} className="flex gap-3">
                       <div className="mt-0.5"><Activity className="h-4 w-4 text-blue-500" /></div>
                       <div>
                         <p className="text-sm text-slate-700">{log.details}</p>
                         <p className="text-xs text-slate-400">{new Date(log.created_at).toLocaleString('vi-VN')}</p>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
"""

with open(f"{base_dir}/ReceptionistDashboard.tsx", "w", encoding="utf-8") as f:
    f.write(dashboard_tsx)


queue_tsx = """import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { receptionistApi } from '../../services/receptionist';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import toast from 'react-hot-toast';

export default function ReceptionistQueue() {
  const queryClient = useQueryClient();
  const { data: queue, isLoading } = useQuery({ queryKey: ['receptionist-queue'], queryFn: receptionistApi.getQueue });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => receptionistApi.updateQueueStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receptionist-queue'] });
      toast.success('Cập nhật trạng thái thành công');
    },
    onError: () => toast.error('Có lỗi xảy ra')
  });

  if (isLoading) return <div>Đang tải...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Hàng Đợi Hôm Nay</h2>
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
    </div>
  );
}
"""
with open(f"{base_dir}/ReceptionistQueue.tsx", "w", encoding="utf-8") as f:
    f.write(queue_tsx)

payments_tsx = """import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { receptionistApi } from '../../services/receptionist';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import toast from 'react-hot-toast';

export default function ReceptionistPayments() {
  const queryClient = useQueryClient();
  const { data: payments, isLoading } = useQuery({ queryKey: ['receptionist-payments'], queryFn: receptionistApi.getPayments });

  const processPay = useMutation({
    mutationFn: ({ id, amount, method }: { id: string, amount: number, method: string }) => receptionistApi.processPayment(id, amount, method),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receptionist-payments'] });
      toast.success('Thanh toán thành công');
    },
    onError: () => toast.error('Lỗi thanh toán')
  });

  if (isLoading) return <div>Đang tải...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Quản lý Thanh toán</h2>
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-3 font-medium">Mã Hóa đơn</th>
                <th className="px-4 py-3 font-medium">Bệnh nhân</th>
                <th className="px-4 py-3 font-medium text-right">Tổng tiền</th>
                <th className="px-4 py-3 font-medium text-right">Còn lại</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {payments?.map((b: any) => (
                <tr key={b.id} className="border-b hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{b.invoice_code}</td>
                  <td className="px-4 py-3">{b.patient?.full_name}</td>
                  <td className="px-4 py-3 text-right font-semibold">{b.total_amount.toLocaleString('vi-VN')} đ</td>
                  <td className="px-4 py-3 text-right font-semibold text-red-600">{b.remaining_amount.toLocaleString('vi-VN')} đ</td>
                  <td className="px-4 py-3">
                    <Badge variant={b.status === 'paid' ? 'default' : 'secondary'}>{b.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {b.remaining_amount > 0 && (
                      <Button size="sm" onClick={() => {
                        if(confirm(`Xác nhận thanh toán ${b.remaining_amount.toLocaleString('vi-VN')}đ?`)) {
                          processPay.mutate({ id: b.id, amount: b.remaining_amount, method: 'cash' });
                        }
                      }}>Thanh toán (TM)</Button>
                    )}
                    {b.remaining_amount === 0 && <Button size="sm" variant="outline">In hóa đơn</Button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
"""
with open(f"{base_dir}/ReceptionistPayments.tsx", "w", encoding="utf-8") as f:
    f.write(payments_tsx)

stub_tsx = """import React from 'react';
export default function StubPage() {
  return <div className="p-6 flex items-center justify-center text-slate-500">Đang được phát triển...</div>;
}
"""

for page in ['ReceptionistAppointments.tsx', 'ReceptionistAppointmentCreate.tsx', 'ReceptionistPatients.tsx', 'ReceptionistPatientProfile.tsx', 'ReceptionistHealthRecords.tsx', 'ReceptionistAI.tsx', 'ReceptionistNotifications.tsx', 'ReceptionistSettings.tsx']:
    with open(f"{base_dir}/{page}", "w", encoding="utf-8") as f:
        f.write(stub_tsx.replace("StubPage", page.replace(".tsx", "")))

print("done")
