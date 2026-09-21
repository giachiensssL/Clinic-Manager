import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Calendar, Phone, Mail, Droplet, Activity, FileText, ArrowLeft, Microscope, Pill } from 'lucide-react';
import { patientsAPI } from '@/services/api';
import toast from 'react-hot-toast';

export default function DoctorPatientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        if (!id) return;
        setLoading(true);
        const { data } = await patientsAPI.getById(id);
        setPatient(data);
      } catch (error) {
        toast.error('Lỗi khi tải hồ sơ bệnh nhân');
      } finally {
        setLoading(false);
      }
    };
    fetchPatient();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500">Đang tải hồ sơ bệnh nhân...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Không tìm thấy bệnh nhân</h2>
        <button onClick={() => navigate('/doctor/patients')} className="text-blue-600 hover:underline">
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <button 
          onClick={() => navigate('/doctor/patients')}
          className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Hồ sơ bệnh nhân</h1>
          <p className="text-sm text-slate-500 mt-1">Mã BN: <span className="font-medium text-slate-700">{patient.patient_code}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Cột trái: Thông tin cá nhân */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-md overflow-hidden mb-4">
              {patient.avatar_url ? (
                <img src={patient.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-slate-400">
                  {patient.full_name?.charAt(0)}
                </div>
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-1">{patient.full_name}</h2>
            <p className="text-sm text-slate-500 mb-4">
              {patient.gender === 'male' ? 'Nam' : patient.gender === 'female' ? 'Nữ' : 'Khác'} 
              {patient.date_of_birth && ` • ${new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()} tuổi`}
            </p>
            
            <div className="w-full space-y-3 mt-4 border-t border-slate-100 pt-4 text-left">
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-slate-400" />
                <span className="text-slate-700">{patient.phone || 'Chưa cập nhật'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="text-slate-700">{patient.email || 'Chưa cập nhật'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-slate-700">
                  {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" /> Thông tin y tế
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-xs text-slate-500 flex items-center gap-1 mb-1">
                  <Droplet className="w-3 h-3 text-red-500" /> Nhóm máu
                </p>
                <p className="font-semibold text-slate-800">{patient.blood_type || '---'}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-xs text-slate-500 flex items-center gap-1 mb-1">
                  Cân nặng
                </p>
                <p className="font-semibold text-slate-800">--- kg</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Tiền sử dị ứng</p>
              <p className="text-sm font-medium text-slate-800">{patient.allergies || 'Không ghi nhận dị ứng'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Tiền sử bệnh</p>
              <p className="text-sm font-medium text-slate-800">{patient.medical_history || 'Không có dữ liệu'}</p>
            </div>
          </div>
        </div>

        {/* Cột phải: Lịch sử khám bệnh */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="border-b border-slate-100 p-1 flex">
              <button className="flex-1 py-2.5 text-sm font-medium bg-slate-50 text-blue-600 rounded-lg">
                Lịch sử khám (EMR)
              </button>
              <button className="flex-1 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                Kết quả xét nghiệm
              </button>
              <button className="flex-1 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                Đơn thuốc
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <FileText className="w-12 h-12 text-slate-300 mb-3" />
                <p>Chưa có dữ liệu lịch sử khám bệnh</p>
                <button 
                  onClick={() => {
                    toast('Vui lòng chọn ca khám của bệnh nhân từ danh sách lịch hẹn để tạo bệnh án', { icon: 'ℹ️' });
                    navigate(`/doctor/appointments`);
                  }}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Khám bệnh
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
