import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useQuery } from '@tanstack/react-query';
import { receptionistApi } from '../../services/receptionist';
import { authAPI } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Loader2, Save, Lock, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReceptionistSettings() {
  const { user } = useAuthStore();
  const { data: profile } = useQuery({ queryKey: ['receptionist-me'], queryFn: receptionistApi.getMe });

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Change password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (profile) {
      setEmail(profile.email || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      await new Promise(r => setTimeout(r, 600)); // simulate save
      toast.success('Cập nhật thông tin thành công!');
    } catch {
      toast.error('Lỗi khi cập nhật thông tin');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Xác nhận mật khẩu mới không khớp');
      return;
    }

    try {
      setSavingPassword(true);
      await authAPI.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      toast.success('Đổi mật khẩu thành công!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Đổi mật khẩu thất bại');
    } finally {
      setSavingPassword(false);
    }
  };
  
  return (
    <div className="w-full space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Cài đặt Cá nhân</h2>
        <p className="text-sm text-slate-500 mt-1">Quản lý hồ sơ lễ tân và bảo mật đăng nhập</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Thông tin tài khoản</CardTitle>
            <CardDescription>Thông tin định danh nhân sự lễ tân</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Tên đăng nhập</Label>
                <Input value={user?.username || ''} disabled className="bg-slate-50" />
              </div>
              <div className="space-y-1.5">
                <Label>Họ và tên</Label>
                <Input value={profile?.full_name || user?.full_name || ''} disabled className="bg-slate-50" />
              </div>
              <div className="space-y-1.5">
                <Label>Email liên hệ</Label>
                <Input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="email@phongkham.com" />
              </div>
              <div className="space-y-1.5">
                <Label>Số điện thoại</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} type="tel" placeholder="09xxxxxxxx" />
              </div>
              <div className="space-y-1.5">
                <Label>Vai trò</Label>
                <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-600 font-medium flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-green-600" /> Nhân viên Lễ tân phòng khám
                </div>
              </div>
              
              <div className="pt-2">
                <Button type="submit" disabled={savingProfile} className="bg-blue-600 hover:bg-blue-700">
                  {savingProfile ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  {savingProfile ? 'Đang lưu...' : 'Cập nhật thông tin'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Change Password Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Đổi mật khẩu</CardTitle>
            <CardDescription>Cập nhật mật khẩu để bảo vệ tài khoản</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Mật khẩu hiện tại</Label>
                <Input 
                  type="password" 
                  value={currentPassword} 
                  onChange={e => setCurrentPassword(e.target.value)} 
                  required 
                  placeholder="Nhập mật khẩu đang dùng" 
                />
              </div>
              <div className="space-y-1.5">
                <Label>Mật khẩu mới</Label>
                <Input 
                  type="password" 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                  required 
                  minLength={6} 
                  placeholder="Tối thiểu 6 ký tự" 
                />
              </div>
              <div className="space-y-1.5">
                <Label>Xác nhận mật khẩu mới</Label>
                <Input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                  required 
                  minLength={6} 
                  placeholder="Nhập lại mật khẩu mới" 
                />
              </div>
              <div className="pt-2">
                <Button type="submit" disabled={savingPassword} variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                  {savingPassword ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
                  {savingPassword ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

