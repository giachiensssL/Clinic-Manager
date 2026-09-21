import React from 'react';
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
