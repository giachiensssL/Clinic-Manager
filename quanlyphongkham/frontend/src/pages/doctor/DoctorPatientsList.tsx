import { useState, useEffect } from 'react';
import { Search, User, Filter, MoreHorizontal, UserPlus } from 'lucide-react';
import { doctorAPI } from '@/services/api';
import toast from 'react-hot-toast';

export default function DoctorPatientsList() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        // Lấy danh sách bệnh nhân dựa trên search hoặc recent
        const { data } = await doctorAPI.searchPatients(searchTerm || 'a'); 
        setPatients(data.items || []);
      } catch (error) {
        toast.error('Lỗi khi tải danh sách bệnh nhân');
      } finally {
        setLoading(false);
      }
    };
    
    const timeoutId = setTimeout(() => {
      fetchPatients();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Danh sách bệnh nhân</h1>
          <p className="text-sm text-slate-500 mt-1">Quản lý và tra cứu hồ sơ bệnh nhân của bạn</p>
        </div>
        <button 
          onClick={() => toast('Chức năng thêm bệnh nhân mới được thực hiện bởi lễ tân.', { icon: 'ℹ️' })}
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
                      {patient.gender === 'male' ? 'Nam' : patient.gender === 'female' ? 'Nữ' : 'Khác'} / {patient.age || '--'} tuổi
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
    </div>
  );
}
