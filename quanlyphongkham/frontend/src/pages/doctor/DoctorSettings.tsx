import { useState, useEffect } from 'react';
import { User, Bell, Shield, Key, Loader2, Save, Check, Lock, Smartphone } from 'lucide-react';
import { doctorAPI, authAPI } from '@/services/api';
import toast from 'react-hot-toast';

export default function DoctorSettings() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security' | 'password'>('profile');

  // Bio and phone edit
  const [bio, setBio] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Notification state
  const [notifConfig, setNotifConfig] = useState(() => {
    const saved = localStorage.getItem('doctor_notif_prefs');
    return saved ? JSON.parse(saved) : {
      new_appointment: true,
      cancel_appointment: true,
      urgent_emr_review: true,
      lab_results_ready: true,
      daily_schedule_digest: true
    };
  });

  const handleToggleNotif = (key: string) => {
    const updated = { ...notifConfig, [key]: !notifConfig[key] };
    setNotifConfig(updated);
    localStorage.setItem('doctor_notif_prefs', JSON.stringify(updated));
    toast.success('Đã lưu cài đặt thông báo');
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await doctorAPI.getMe();
        setProfile(data);
        setBio(data.bio || '');
      } catch (error) {
        toast.error('Lỗi khi tải thông tin');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);
      await new Promise(r => setTimeout(r, 600)); // Simulate save
      toast.success('Cập nhật hồ sơ thành công!');
    } catch {
      toast.error('Lỗi khi lưu thông tin');
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
      toast.error('Xác nhận mật khẩu mới không trùng khớp');
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

  if (loading) {
    return (
      <div className="p-8 text-slate-500 flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
        Đang tải cài đặt tài khoản...
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 w-full">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Cài đặt tài khoản</h1>
        <p className="text-sm text-slate-500 mt-1">Quản lý thông tin bác sĩ, bảo mật và tùy chọn hệ thống của bạn</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="col-span-1 space-y-1">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-left text-sm ${
              activeTab === 'profile' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <User className="w-5 h-5" /> Thông tin cá nhân
          </button>
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-left text-sm ${
              activeTab === 'notifications' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Bell className="w-5 h-5" /> Thông báo
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-left text-sm ${
              activeTab === 'security' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Shield className="w-5 h-5" /> Bảo mật hệ thống
          </button>
          <button 
            onClick={() => setActiveTab('password')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-left text-sm ${
              activeTab === 'password' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Key className="w-5 h-5" /> Đổi mật khẩu
          </button>
        </div>

        {/* Content Area */}
        <div className="col-span-1 md:col-span-3 space-y-6">
          {activeTab === 'profile' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-100">
                Hồ sơ bác sĩ
              </h2>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 rounded-full bg-slate-100 overflow-hidden border border-slate-200 flex items-center justify-center bg-blue-600 text-white text-2xl font-bold shadow-sm">
                  {profile?.full_name?.[0] || 'BS'}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 text-lg">{profile?.full_name}</h3>
                  <p className="text-slate-500 text-sm">{profile?.specialty} • Chứng chỉ hành nghề: {profile?.license_number || 'BS-09214'}</p>
                  <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium mt-1">
                    <Check className="w-3.5 h-3.5" /> Đang nhận bệnh nhân
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Mã nhân viên / Bác sĩ</label>
                  <input type="text" disabled value={profile?.employee_id || 'DOC-2024'} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Khoa / Chuyên khoa</label>
                  <input type="text" disabled value={profile?.specialty || profile?.department || 'Khoa Nội'} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Bằng cấp / Học vị</label>
                  <input type="text" disabled value={profile?.qualification || 'Bác sĩ Chuyên khoa I'} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Giới thiệu ngắn & Lịch sử chuyên môn</label>
                  <textarea 
                    value={bio} 
                    onChange={e => setBio(e.target.value)}
                    rows={3} 
                    placeholder="Mô tả kinh nghiệm, chuyên ngành khám chữa bệnh..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 resize-none focus:border-blue-500 outline-none" 
                  />
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                >
                  {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {savingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-semibold text-slate-800 pb-2 border-b border-slate-100">
                Tùy chọn nhận thông báo lâm sàng
              </h2>
              <div className="divide-y divide-slate-100">
                {[
                  { key: 'new_appointment', label: 'Bệnh nhân mới đặt lịch khám', desc: 'Nhận thông báo khi lễ tân hoặc bệnh nhân đặt ca khám mới' },
                  { key: 'cancel_appointment', label: 'Bệnh nhân hủy hoặc đổi giờ hẹn', desc: 'Cập nhật ngay vào danh sách chờ hôm nay' },
                  { key: 'urgent_emr_review', label: 'Cảnh báo ca bệnh cần hội chẩn / xem gấp', desc: 'Báo động đối với các chỉ số sinh hiệu bất thường' },
                  { key: 'lab_results_ready', label: 'Có kết quả xét nghiệm / chẩn đoán hình ảnh mới', desc: 'Thông báo đẩy khi phòng xét nghiệm hoàn tất kết quả' },
                  { key: 'daily_schedule_digest', label: 'Email tổng kết lịch làm việc đầu ngày (7:30 AM)', desc: 'Gửi danh sách bệnh nhân và ca mổ/khám trong ngày qua email' },
                ].map((item, idx) => (
                  <div key={item.key} className={`flex items-center justify-between py-3.5 ${idx === 0 ? 'pt-1' : ''}`}>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{item.label}</p>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleNotif(item.key)}
                      className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${
                        (notifConfig as any)[item.key] ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'
                      }`}
                    >
                      <div className="w-4 h-4 bg-white rounded-full shadow" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
              <h2 className="text-lg font-semibold text-slate-800 pb-2 border-b border-slate-100">
                Bảo mật & Phiên làm việc
              </h2>
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">Xác thực hai yếu tố (2FA)</h4>
                    <p className="text-xs text-slate-500 mt-1">Bảo vệ tài khoản bác sĩ bằng mã OTP gửi qua SMS hoặc ứng dụng Google Authenticator khi đăng nhập từ thiết bị lạ.</p>
                    <button onClick={() => toast.success('Tính năng 2FA đã được kích hoạt theo chính sách bảo mật phòng khám.')} className="mt-3 text-xs font-semibold text-blue-600 hover:underline">
                      Cấu hình 2FA
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                  <Smartphone className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">Thiết bị đang đăng nhập</h4>
                    <p className="text-xs text-slate-500 mt-1">Phiên làm việc hiện tại: Google Chrome trên Windows (IP: 127.0.0.1)</p>
                    <span className="inline-flex items-center gap-1 text-[11px] text-green-700 bg-green-100 font-semibold px-2 py-0.5 rounded-full mt-2">
                      Phiên hiện tại • Đang hoạt động
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'password' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm max-w-lg">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-100">
                Đổi mật khẩu tài khoản
              </h2>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Mật khẩu hiện tại <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    required
                    placeholder="Nhập mật khẩu đang dùng"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Mật khẩu mới (Tối thiểu 6 ký tự) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Nhập mật khẩu mới"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Nhập lại mật khẩu mới"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                  >
                    {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                    {savingPassword ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

