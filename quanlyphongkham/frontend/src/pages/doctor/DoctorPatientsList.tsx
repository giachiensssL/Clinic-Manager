import { useState, useEffect } from 'react';
import { Search, User, Filter, MoreHorizontal, UserPlus, X, Loader2 } from 'lucide-react';
import { doctorAPI, patientsAPI } from '@/services/api';
import toast from 'react-hot-toast';

export default function DoctorPatientsList() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Add Patient Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    date_of_birth: '',
    gender: 'male',
    email: '',
    address: '',
    identity_number: '',
    insurance_number: '',
    blood_type: 'O+',
    allergies: '',
    emergency_contact_name: '',
    emergency_contact_phone: ''
  });

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const { data } = await doctorAPI.searchPatients(searchTerm.trim() || undefined); 
      setPatients(data.items || []);
    } catch (error) {
      toast.error('Lỗi khi tải danh sách bệnh nhân');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchPatients();
    }, 400);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim() || !formData.phone.trim() || !formData.date_of_birth) {
      toast.error('Vui lòng điền đủ Họ tên, Số điện thoại và Ngày sinh');
      return;
    }

    try {
      setSubmitting(true);
      const res = await patientsAPI.create({
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim(),
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        email: formData.email.trim() || undefined,
        address: formData.address.trim() || undefined,
        identity_number: formData.identity_number.trim() || undefined,
        insurance_number: formData.insurance_number.trim() || undefined,
        blood_type: formData.blood_type || undefined,
        allergies: formData.allergies.trim() || undefined,
        emergency_contact_name: formData.emergency_contact_name.trim() || undefined,
        emergency_contact_phone: formData.emergency_contact_phone.trim() || undefined,
      });

      toast.success(`Thêm bệnh nhân thành công: ${res.data.full_name} (${res.data.patient_code})`);
      setIsAddOpen(false);
      setFormData({
        full_name: '',
        phone: '',
        date_of_birth: '',
        gender: 'male',
        email: '',
        address: '',
        identity_number: '',
        insurance_number: '',
        blood_type: 'O+',
        allergies: '',
        emergency_contact_name: '',
        emergency_contact_phone: ''
      });

      // Immediately prepend into state so patient is instantly visible
      const newCreated = {
        id: res.data.id,
        patient_code: res.data.patient_code,
        full_name: res.data.full_name,
        gender: res.data.gender,
        age: res.data.date_of_birth ? new Date().getFullYear() - new Date(res.data.date_of_birth).getFullYear() : null,
        phone: res.data.phone,
        last_visit: null,
        avatar_url: res.data.avatar_url
      };
      setPatients(prev => [newCreated, ...prev.filter(p => p.id !== res.data.id)]);

      // Refetch from database
      await fetchPatients();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Lỗi khi tạo hồ sơ bệnh nhân');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Danh sách bệnh nhân</h1>
          <p className="text-sm text-slate-500 mt-1">Quản lý và tra cứu hồ sơ bệnh nhân của bạn</p>
        </div>
        <button 
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm text-sm"
        >
          <UserPlus className="w-4 h-4" /> Thêm bệnh nhân mới
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, mã bệnh nhân, SĐT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors text-sm font-medium">
          <Filter className="w-4 h-4" /> Lọc danh sách
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            Đang tải dữ liệu...
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-4">Bệnh nhân</th>
                <th className="px-6 py-4">Mã BN</th>
                <th className="px-6 py-4">Giới tính / Tuổi</th>
                <th className="px-6 py-4">Số điện thoại</th>
                <th className="px-6 py-4">Lần khám cuối</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {patients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <User className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    Không tìm thấy bệnh nhân nào phù hợp.
                  </td>
                </tr>
              ) : (
                patients.map((patient: any) => (
                  <tr key={patient.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                          {patient.avatar_url ? (
                            <img src={patient.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-bold text-slate-500">{patient.full_name?.charAt(0)}</span>
                          )}
                        </div>
                        <div className="font-medium text-slate-800">{patient.full_name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{patient.patient_code}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {patient.gender === 'male' ? 'Nam' : patient.gender === 'female' ? 'Nữ' : 'Khác'} / {patient.age ?? (patient.date_of_birth ? (new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()) : '--')} tuổi
                    </td>
                    <td className="px-6 py-4 text-slate-600">{patient.phone || 'Chưa cập nhật'}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {patient.last_visit ? new Date(patient.last_visit).toLocaleDateString('vi-VN') : 'Chưa có'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => window.location.href = `/doctor/patients/${patient.id}`}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 font-medium text-xs rounded-lg hover:bg-blue-100 transition-colors inline-block"
                      >
                        Hồ sơ
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Thêm bệnh nhân mới */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Thêm hồ sơ bệnh nhân mới</h3>
                <p className="text-xs text-slate-500 mt-0.5">Nhập thông tin hành chính và tiền sử y tế ban đầu của bệnh nhân</p>
              </div>
              <button 
                onClick={() => setIsAddOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPatient} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Họ và tên <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Số điện thoại <span className="text-red-500">*</span></label>
                  <input
                    type="tel"
                    required
                    placeholder="0912345678"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ngày sinh <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    required
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Giới tính <span className="text-red-500">*</span></label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Số CCCD / CMND</label>
                  <input
                    type="text"
                    placeholder="001200001234"
                    value={formData.identity_number}
                    onChange={(e) => setFormData({ ...formData, identity_number: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Số thẻ BHYT</label>
                  <input
                    type="text"
                    placeholder="DN4791234567890"
                    value={formData.insurance_number}
                    onChange={(e) => setFormData({ ...formData, insurance_number: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nhóm máu</label>
                  <select
                    value={formData.blood_type}
                    onChange={(e) => setFormData({ ...formData, blood_type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="patient@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Địa chỉ thường trú</label>
                  <input
                    type="text"
                    placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Dị ứng thuốc / Thực phẩm</label>
                  <input
                    type="text"
                    placeholder="VD: Dị ứng Penicillin, Paracetamol, Hải sản..."
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Người liên hệ khẩn cấp</label>
                  <input
                    type="text"
                    placeholder="Họ tên người thân"
                    value={formData.emergency_contact_name}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">SĐT người liên hệ khẩn cấp</label>
                  <input
                    type="tel"
                    placeholder="0987654321"
                    value={formData.emergency_contact_phone}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {submitting ? 'Đang tạo hồ sơ...' : 'Lưu hồ sơ bệnh nhân'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
