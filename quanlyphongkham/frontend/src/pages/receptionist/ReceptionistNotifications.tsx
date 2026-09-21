import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { receptionistApi } from '../../services/receptionist';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Bell, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReceptionistNotifications() {
  const queryClient = useQueryClient();
  const { data: notifications, isLoading } = useQuery({ queryKey: ['receptionist-notifs'], queryFn: receptionistApi.getNotifications });

  const markRead = useMutation({
    mutationFn: (id: string) => receptionistApi.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receptionist-notifs'] });
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2"><Bell className="h-6 w-6 text-blue-600" /> Thông báo hệ thống</h2>
        <Button variant="outline" onClick={() => markRead.mutate('all')}>Đánh dấu tất cả đã đọc</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {isLoading ? <div className="p-8 text-center text-slate-500">Đang tải...</div> : null}
            {notifications?.map((n: any) => (
              <div key={n.id} className={`p-4 flex gap-4 ${n.is_read ? 'bg-white' : 'bg-blue-50/50'}`}>
                <div className={`mt-1 ${n.is_read ? 'text-slate-400' : 'text-blue-500'}`}>
                  <Bell className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h4 className={`font-semibold ${n.is_read ? 'text-slate-700' : 'text-slate-900'}`}>{n.title}</h4>
                  <p className="text-sm text-slate-600 mt-1">{n.message}</p>
                  <p className="text-xs text-slate-400 mt-2">{new Date(n.created_at).toLocaleString('vi-VN')}</p>
                </div>
                {!n.is_read && (
                  <Button variant="ghost" size="icon" onClick={() => markRead.mutate(n.id)}>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </Button>
                )}
              </div>
            ))}
            {notifications?.length === 0 && <div className="p-8 text-center text-slate-500">Bạn không có thông báo nào.</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
