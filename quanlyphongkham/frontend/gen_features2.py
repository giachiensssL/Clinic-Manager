import os

base_dir = "src/pages/receptionist"

notif_tsx = """import React from 'react';
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
"""

ai_tsx = """import React from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Bot, MessageSquare } from 'lucide-react';
import { Button } from '../../components/ui/button';

export default function ReceptionistAI() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center py-6">
         <Bot className="h-16 w-16 mx-auto text-blue-500 mb-4" />
         <h2 className="text-2xl font-bold text-slate-800">Trợ lý AI Lễ Tân</h2>
         <p className="text-slate-500 mt-2">Hỗ trợ trả lời thắc mắc của bệnh nhân, tra cứu lịch làm việc của bác sĩ...</p>
      </div>
      
      <Card className="h-[500px] flex flex-col">
         <CardContent className="flex-1 p-0 flex flex-col">
            <div className="flex-1 bg-slate-50 p-6 overflow-y-auto">
               <div className="flex gap-4 mb-4">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center"><Bot className="h-4 w-4 text-blue-600" /></div>
                  <div className="bg-white p-3 rounded-lg border shadow-sm max-w-[80%]">
                     <p className="text-sm">Xin chào, tôi là trợ lý AI. Bạn cần tra cứu thông tin gì về lịch hẹn hay bác sĩ hôm nay?</p>
                  </div>
               </div>
            </div>
            <div className="p-4 border-t bg-white flex gap-2">
               <input type="text" placeholder="Nhập câu hỏi..." className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
               <Button><MessageSquare className="h-4 w-4 mr-2"/> Gửi</Button>
            </div>
         </CardContent>
      </Card>
    </div>
  );
}
"""

settings_tsx = """import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

export default function ReceptionistSettings() {
  const { user } = useAuthStore();
  
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">Cài đặt Cá nhân</h2>
      
      <Card>
        <CardHeader>
          <CardTitle>Thông tin tài khoản</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tên đăng nhập</Label>
            <Input value={user?.username || ''} disabled />
          </div>
          <div className="space-y-2">
            <Label>Email liên hệ</Label>
            <Input value={user?.email || ''} />
          </div>
          <div className="space-y-2">
            <Label>Vai trò</Label>
            <Input value="Lễ tân" disabled />
          </div>
          
          <div className="pt-4">
            <Button>Cập nhật thông tin</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
"""

with open(f"{base_dir}/ReceptionistNotifications.tsx", "w", encoding="utf-8") as f:
    f.write(notif_tsx)

with open(f"{base_dir}/ReceptionistAI.tsx", "w", encoding="utf-8") as f:
    f.write(ai_tsx)

with open(f"{base_dir}/ReceptionistSettings.tsx", "w", encoding="utf-8") as f:
    f.write(settings_tsx)

with open(f"{base_dir}/ReceptionistHealthRecords.tsx", "w", encoding="utf-8") as f:
    f.write("import React from 'react';\nimport { Card } from '../../components/ui/card';\nexport default function ReceptionistHealthRecords() { return <div className='p-8'><Card className='p-8 text-center text-slate-500'>Tính năng đang được tích hợp.</Card></div>; }")

print("done gen_features2")
