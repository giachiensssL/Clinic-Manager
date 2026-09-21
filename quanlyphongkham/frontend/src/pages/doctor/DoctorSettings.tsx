import { useState, useEffect } from 'react';
import { User, Bell, Shield, Key } from 'lucide-react';
import { doctorAPI } from '@/services/api';
import toast from 'react-hot-toast';

export default function DoctorSettings() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await doctorAPI.getMe();
        setProfile(data);
      } catch (error) {
        toast.error('Lỗi khi tải thông tin');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return <div className="p-6 text-slate-500 animate-pulse">Đang tải cài đặt...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Cài đặt tài khoản</h1>
        <p className="text-sm text-slate-500 mt-1">Quản lý thông tin cá nhân và tùy chọn hệ thống của bạn</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 font-medium rounded-xl">
            <User className="w-5 h-5" /> Thông tin cá nhân
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 font-medium rounded-xl transition-colors">
            <Bell className="w-5 h-5" /> Thông báo
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 font-medium rounded-xl transition-colors">
            <Shield className="w-5 h-5" /> Bảo mật
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 font-medium rounded-xl transition-colors">
            <Key className="w-5 h-5" /> Đổi mật khẩu
          </button>
        </div>

        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Hồ sơ bác sĩ</h2>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white text-2xl font-bold">
                    {profile?.full_name?.[0] || 'D'}
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-medium text-slate-800 text-lg">{profile?.full_name}</h3>
                <p className="text-slate-500 text-sm">{profile?.specialty} • {profile?.license_number}</p>
                <button className="text-blue-600 text-sm font-medium mt-1 hover:underline">Thay đổi ảnh đại diện</button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Mã nhân viên</label>
                <input type="text" disabled value={profile?.employee_id || ''} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Khoa / Phòng</label>
                <input type="text" disabled value={profile?.department || ''} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">Bằng cấp / Học hàm</label>
                <input type="text" disabled value={profile?.qualification || ''} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">Giới thiệu ngắn</label>
                <textarea disabled value={profile?.bio || ''} rows={3} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500 resize-none" />
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 flex justify-end gap-3">
              <button className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                Hủy bỏ
              </button>
              <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm">
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
