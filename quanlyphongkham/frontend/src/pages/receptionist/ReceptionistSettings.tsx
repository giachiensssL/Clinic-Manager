import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { useQuery } from '@tanstack/react-query';
import { receptionistApi } from '../../services/receptionist';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

export default function ReceptionistSettings() {
  const { user } = useAuthStore();
  const { data: profile } = useQuery({ queryKey: ['receptionist-me'], queryFn: receptionistApi.getMe });
  
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
            <Label>Họ tên</Label>
            <Input value={profile?.full_name || ''} disabled />
          </div>
          <div className="space-y-2">
            <Label>Email liên hệ</Label>
            <Input value={profile?.email || ''} />
          </div>
          <div className="space-y-2">
            <Label>Số điện thoại</Label>
            <Input value={profile?.phone || ''} />
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
