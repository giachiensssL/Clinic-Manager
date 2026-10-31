import { useState } from "react";
import { Settings, Shield, Bell, Lock, Globe, Smartphone, Check, Loader2, LogOut } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { authAPI } from "@/services/api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function PatientSettings() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  // Change password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Notifications state
  const [notifConfig, setNotifConfig] = useState(() => {
    const saved = localStorage.getItem("patient_notif_prefs");
    return saved ? JSON.parse(saved) : {
      appointment_reminder_sms: true,
      appointment_reminder_email: true,
      lab_results_ready: true,
      prescription_renewal: true,
      clinic_promotions: false
    };
  });

  const handleToggleNotif = (key: string) => {
    const updated = { ...notifConfig, [key]: !notifConfig[key] };
    setNotifConfig(updated);
    localStorage.setItem("patient_notif_prefs", JSON.stringify(updated));
    toast.success("Đã lưu tùy chọn thông báo");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error("Vui lòng nhập mật khẩu hiện tại");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Xác nhận mật khẩu mới không trùng khớp");
      return;
    }

    try {
      setSavingPassword(true);
      await authAPI.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      toast.success("Đổi mật khẩu thành công!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Đổi mật khẩu thất bại");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = () => {
    if (confirm("Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?")) {
      logout();
      navigate("/login");
    }
  };

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E2E8F0]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0B3B78]">Cài đặt tài khoản</h1>
            <p className="text-sm text-[#64748B] mt-0.5">
              Quản lý bảo mật đăng nhập, thông báo và trải nghiệm sử dụng
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Security & Password */}
        <div className="lg:col-span-2 space-y-6">
          {/* Change Password Card */}
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-[#E2E8F0]">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-6">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Đổi mật khẩu</h2>
                <p className="text-xs text-slate-500">Nên cập nhật mật khẩu định kỳ để bảo vệ hồ sơ y tế của bạn</p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Mật khẩu hiện tại <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Nhập mật khẩu đang dùng"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Mật khẩu mới (Tối thiểu 6 ký tự) <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới"
                  required
                  minLength={6}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  required
                  minLength={6}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:border-blue-500 outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="flex items-center gap-2 bg-[#0D6EFD] text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition shadow-sm disabled:opacity-50"
                >
                  {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                  {savingPassword ? "Đang xử lý..." : "Cập nhật mật khẩu"}
                </button>
              </div>
            </form>
          </div>

          {/* Notification Preferences */}
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-[#E2E8F0]">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-6">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Tùy chọn nhận thông báo</h2>
                <p className="text-xs text-slate-500">Chọn các kênh bạn muốn phòng khám gửi nhắc nhở</p>
              </div>
            </div>

            <div className="space-y-4 divide-y divide-slate-100">
              {[
                { key: "appointment_reminder_sms", label: "Nhắc nhở lịch khám qua SMS", desc: "Nhận tin nhắn nhắc hẹn trước 24 giờ và 2 giờ" },
                { key: "appointment_reminder_email", label: "Gửi thông tin lịch khám qua Email", desc: "Nhận email xác nhận, lịch hẹn và hướng dẫn chuẩn bị" },
                { key: "lab_results_ready", label: "Thông báo khi có kết quả xét nghiệm", desc: "Nhận tin báo ngay khi bác sĩ hoàn thành đánh giá kết quả" },
                { key: "prescription_renewal", label: "Nhắc nhở tái khám và đơn thuốc", desc: "Báo nhắc khi gần hết ngày uống thuốc hoặc đến hẹn tái khám" },
                { key: "clinic_promotions", label: "Tin tức sức khỏe & Chương trình ưu đãi", desc: "Nhận các lời khuyên y tế bổ ích từ bác sĩ phòng khám" },
              ].map((item, idx) => (
                <div key={item.key} className={`flex items-center justify-between pt-3 ${idx === 0 ? "pt-0" : ""}`}>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleNotif(item.key)}
                    className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out ${
                      (notifConfig as any)[item.key] ? "bg-blue-600 justify-end" : "bg-slate-300 justify-start"
                    }`}
                  >
                    <div className="w-4 h-4 bg-white rounded-full shadow-md" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Account Info & Quick Actions */}
        <div className="space-y-6">
          {/* Account Overview */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E2E8F0]">
            <h3 className="font-bold text-slate-800 mb-4 pb-3 border-b border-slate-100">
              Thông tin tài khoản
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-xs text-slate-500 block">Tên người dùng / Email</span>
                <span className="font-medium text-slate-800">{(user as any)?.email || user?.username}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Vai trò trong hệ thống</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full font-semibold text-xs mt-1">
                  Bệnh nhân (Patient)
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Trạng thái</span>
                <span className="inline-flex items-center gap-1 text-green-600 font-medium text-xs mt-1">
                  <Check className="w-3.5 h-3.5" /> Đang hoạt động bình thường
                </span>
              </div>
            </div>
          </div>

          {/* Language & Regional */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E2E8F0]">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-4 h-4 text-slate-500" />
              <h3 className="font-bold text-slate-800">Ngôn ngữ & Vùng</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Ngôn ngữ hiển thị</label>
                <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm outline-none">
                  <option value="vi">Tiếng Việt (Mặc định)</option>
                  <option value="en">English (US)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Múi giờ</label>
                <div className="px-3 py-2 bg-slate-100 rounded-xl text-slate-600 text-xs font-mono">
                  Asia/Ho_Chi_Minh (UTC+7)
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50/50 p-6 rounded-2xl border border-red-100">
            <h3 className="font-bold text-red-800 mb-2">Phiên đăng nhập</h3>
            <p className="text-xs text-red-600 mb-4">
              Đăng xuất khỏi thiết bị này để đảm bảo an toàn nếu bạn dùng chung máy tính.
            </p>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-medium rounded-xl text-sm transition"
            >
              <LogOut className="w-4 h-4" /> Đăng xuất tài khoản
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

