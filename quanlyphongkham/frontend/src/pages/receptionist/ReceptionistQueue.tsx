import React, { useState } from 'react';
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
