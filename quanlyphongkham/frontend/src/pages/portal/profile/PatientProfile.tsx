import { useState, useEffect } from "react";
import { User, Phone, Mail, MapPin, Heart, Shield, Edit3, Save, X, Loader2, CheckCircle2 } from "lucide-react";
import { patientsAPI } from "@/services/api";
import toast from "react-hot-toast";

export default function PatientProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    date_of_birth: "",
    gender: "male",
    phone: "",
    email: "",
    address: "",
    identity_number: "",
    blood_type: "",
    allergies: "",
    medical_history: "",
    insurance_number: "",
    insurance_provider: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
  });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await patientsAPI.getMe();
      const p = res.data;
      setProfile(p);
      setFormData({
        full_name: p.full_name || "",
        date_of_birth: p.date_of_birth || "",
        gender: p.gender || "male",
        phone: p.phone || "",
        email: p.email || "",
        address: p.address || "",
        identity_number: p.identity_number || "",
        blood_type: p.blood_type || "",
        allergies: p.allergies || "",
        medical_history: p.medical_history || "",
        insurance_number: p.insurance_number || "",
        insurance_provider: p.insurance_provider || "",
        emergency_contact_name: p.emergency_contact_name || "",
        emergency_contact_phone: p.emergency_contact_phone || "",
      });
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Không thể tải thông tin hồ sơ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim()) {
      toast.error("Họ và tên không được để trống");
      return;
    }
    if (!formData.phone.trim()) {
      toast.error("Số điện thoại không được để trống");
      return;
    }

    try {
      setSaving(true);
      await patientsAPI.updateMe(formData);
      toast.success("Cập nhật hồ sơ thành công!");
      setIsEditing(false);
      fetchProfile();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Lỗi khi lưu thông tin");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        date_of_birth: profile.date_of_birth || "",
        gender: profile.gender || "male",
        phone: profile.phone || "",
        email: profile.email || "",
        address: profile.address || "",
        identity_number: profile.identity_number || "",
        blood_type: profile.blood_type || "",
        allergies: profile.allergies || "",
        medical_history: profile.medical_history || "",
        insurance_number: profile.insurance_number || "",
        insurance_provider: profile.insurance_provider || "",
        emergency_contact_name: profile.emergency_contact_name || "",
        emergency_contact_phone: profile.emergency_contact_phone || "",
      });
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] w-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <p className="text-slate-500 text-sm">Đang tải hồ sơ cá nhân...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-[#E2E8F0]">
        <div>
          <h1 className="text-2xl font-bold text-[#0B3B78]">Hồ sơ cá nhân</h1>
          <p className="text-sm text-[#64748B] mt-1">
            Quản lý thông tin hành chính, bảo hiểm y tế và tiền sử sức khỏe của bạn
          </p>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 bg-[#0D6EFD] text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition shadow-sm"
          >
            <Edit3 className="w-4 h-4" /> Chỉnh sửa hồ sơ
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-medium transition"
            >
              <X className="w-4 h-4" /> Hủy
            </button>
            <button
              form="profile-form"
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-green-700 transition shadow-sm disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        )}
      </div>

      {/* Main Content Form */}
      <form id="profile-form" onSubmit={handleSave} className="space-y-6">
        {/* Profile Card Banner */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-[#E2E8F0] flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-3xl font-bold flex items-center justify-center shadow-md">
              {profile?.full_name?.charAt(0) || "BN"}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-green-500 text-white p-1 rounded-full border-2 border-white shadow">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <h2 className="text-2xl font-bold text-slate-800">{profile?.full_name}</h2>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 font-mono text-xs font-semibold rounded-full border border-blue-100">
                Mã BN: {profile?.patient_code}
              </span>
            </div>
            <p className="text-slate-500 text-sm">
              Tài khoản bệnh nhân chính thức tại AI Clinic • Hoạt động tích cực
            </p>
            <div className="flex flex-wrap gap-4 text-xs text-slate-600 pt-1">
              <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                <Phone className="w-3.5 h-3.5 text-blue-500" /> {profile?.phone || "Chưa có SĐT"}
              </span>
              <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                <Mail className="w-3.5 h-3.5 text-blue-500" /> {profile?.email || "Chưa có Email"}
              </span>
              <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                <MapPin className="w-3.5 h-3.5 text-blue-500" /> {profile?.address || "Chưa cập nhật địa chỉ"}
              </span>
            </div>
          </div>
        </div>

        {/* Section 1: Thông tin hành chính */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-[#E2E8F0] space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Thông tin định danh & Hành chính</h3>
              <p className="text-xs text-slate-500">Thông tin pháp lý dùng khi khám chữa bệnh và lưu trữ hồ sơ y tế</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                disabled={!isEditing}
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:border-blue-500 outline-none disabled:bg-slate-100 disabled:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Ngày sinh <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                disabled={!isEditing}
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:border-blue-500 outline-none disabled:bg-slate-100 disabled:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Giới tính
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:border-blue-500 outline-none disabled:bg-slate-100 disabled:text-slate-500"
              >
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Số CCCD / CMND
              </label>
              <input
                type="text"
                name="identity_number"
                value={formData.identity_number}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="00120000xxxx"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:border-blue-500 outline-none disabled:bg-slate-100 disabled:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Số điện thoại <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={!isEditing}
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:border-blue-500 outline-none disabled:bg-slate-100 disabled:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:border-blue-500 outline-none disabled:bg-slate-100 disabled:text-slate-500"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Địa chỉ cư trú
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:border-blue-500 outline-none disabled:bg-slate-100 disabled:text-slate-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Thông tin Y tế & Bảo hiểm */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-[#E2E8F0] space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Thông tin Y tế & Bảo hiểm</h3>
              <p className="text-xs text-slate-500">Giúp bác sĩ đưa ra phác đồ điều trị và chỉ định an toàn nhất</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Nhóm máu
              </label>
              <select
                name="blood_type"
                value={formData.blood_type}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:border-blue-500 outline-none disabled:bg-slate-100 disabled:text-slate-500"
              >
                <option value="">Chưa xác định</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Mã số thẻ BHYT
              </label>
              <input
                type="text"
                name="insurance_number"
                value={formData.insurance_number}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="VD: GD4010123456789"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:border-blue-500 outline-none disabled:bg-slate-100 disabled:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Nơi đăng ký KCB ban đầu
              </label>
              <input
                type="text"
                name="insurance_provider"
                value={formData.insurance_provider}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="VD: Bệnh viện Đa khoa..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:border-blue-500 outline-none disabled:bg-slate-100 disabled:text-slate-500"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Dị ứng (Thuốc, thức ăn, phấn hoa, ...)
              </label>
              <textarea
                name="allergies"
                rows={2}
                value={formData.allergies}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Ghi rõ các loại dị ứng nếu có (Ví dụ: Penicillin, hải sản...)"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:border-blue-500 outline-none disabled:bg-slate-100 disabled:text-slate-500"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Tiền sử bệnh lý bản thân & gia đình
              </label>
              <textarea
                name="medical_history"
                rows={3}
                value={formData.medical_history}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Các bệnh mạn tính, phẫu thuật trước đây, bệnh lý tim mạch, tiểu đường..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:border-blue-500 outline-none disabled:bg-slate-100 disabled:text-slate-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Người liên hệ khẩn cấp */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-[#E2E8F0] space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Liên hệ khẩn cấp</h3>
              <p className="text-xs text-slate-500">Phòng khám sẽ liên hệ người thân trong trường hợp khẩn cấp</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Tên người liên hệ khẩn cấp
              </label>
              <input
                type="text"
                name="emergency_contact_name"
                value={formData.emergency_contact_name}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="VD: Nguyễn Văn A (Cha/Mẹ/Vợ/Chồng)"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:border-blue-500 outline-none disabled:bg-slate-100 disabled:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Số điện thoại khẩn cấp
              </label>
              <input
                type="tel"
                name="emergency_contact_phone"
                value={formData.emergency_contact_phone}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="0912xxxxxx"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:border-blue-500 outline-none disabled:bg-slate-100 disabled:text-slate-500"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

