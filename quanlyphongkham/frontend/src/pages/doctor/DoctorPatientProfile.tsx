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

      {/* THÔNG TIN HÀNH CHÍNH */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
          <h3 className="font-bold text-slate-800 uppercase tracking-wide text-sm">THÔNG TIN HÀNH CHÍNH</h3>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-500 mb-1">Họ tên</p>
              <p className="font-semibold text-slate-800">{patient.full_name}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Tuổi / Giới tính</p>
              <p className="font-semibold text-slate-800">
                {patient.date_of_birth ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear() : '---'} / {patient.gender === 'male' ? 'Nam' : patient.gender === 'female' ? 'Nữ' : 'Khác'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* TIỀN SỬ BỆNH */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
          <h3 className="font-bold text-slate-800 uppercase tracking-wide text-sm">TIỀN SỬ BỆNH</h3>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex gap-2">
            <span className="text-slate-400">•</span>
            <p className="text-slate-800">{patient.medical_history || 'Không có dữ liệu tiền sử bệnh.'}</p>
          </div>
          <div className="flex gap-2">
            <span className="text-slate-400">•</span>
            <p className="text-slate-800">Dị ứng: {patient.allergies || 'Không ghi nhận'}</p>
          </div>
        </div>
      </div>

      {/* LỊCH SỬ KHÁM GẦN ĐÂY */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
          <h3 className="font-bold text-slate-800 uppercase tracking-wide text-sm">LỊCH SỬ KHÁM GẦN ĐÂY</h3>
        </div>
        <div className="p-5">
          {(!patient.recent_visits || patient.recent_visits.length === 0) ? (
            <p className="text-slate-500 italic">Không có dữ liệu lịch sử khám.</p>
          ) : (
            <div className="space-y-6">
              {patient.recent_visits.map((visit: any) => (
                <div key={visit.id} className="border-l-2 border-blue-500 pl-4 py-1">
                  <p className="text-sm font-semibold text-blue-600 mb-1">
                    {new Date(visit.date).toLocaleDateString('vi-VN')}
                  </p>
                  <p className="font-medium text-slate-800">{visit.department} (Bs. {visit.doctor})</p>
                  <p className="text-slate-600 mt-1">{visit.diagnosis || visit.reason || 'Không có chẩn đoán'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* THUỐC ĐANG SỬ DỤNG */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
          <h3 className="font-bold text-slate-800 uppercase tracking-wide text-sm">THUỐC ĐANG SỬ DỤNG</h3>
        </div>
        <div className="p-5">
          {(!patient.current_medications || patient.current_medications.length === 0) ? (
            <p className="text-slate-500 italic">Không có dữ liệu thuốc.</p>
          ) : (
            <div className="space-y-4">
              {patient.current_medications.map((med: any) => (
                <div key={med.id} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="font-semibold text-slate-800">{med.medicine_name} {med.dosage}</p>
                  <p className="text-sm text-slate-600 mt-1">{med.frequency} {med.instructions ? `(${med.instructions})` : ''}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* GHI CHÚ */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
          <h3 className="font-bold text-slate-800 uppercase tracking-wide text-sm">GHI CHÚ</h3>
        </div>
        <div className="p-5">
          <p className="text-slate-800">Không có thông tin bổ sung.</p>
        </div>
      </div>

    </div>
  );
}

