import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pill, Search, Filter, Plus, FileText, X } from 'lucide-react';
import { prescriptionsAPI } from '@/services/api';
import toast from 'react-hot-toast';

export default function DoctorPrescriptions() {
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedPx, setSelectedPx] = useState<any>(null);
  const [pxLoading, setPxLoading] = useState(false);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        setLoading(true);
        const { data } = await prescriptionsAPI.getAll();
        setPrescriptions(data.items || []);
      } catch (error) {
        toast.error('Lỗi khi tải danh sách đơn thuốc');
      } finally {
        setLoading(false);
      }
    };
    fetchPrescriptions();
  }, []);

  const handleView = async (id: string) => {
    try {
      setPxLoading(true);
      const { data } = await prescriptionsAPI.getById(id);
      setSelectedPx(data);
    } catch (e) {
      toast.error('Lỗi khi tải chi tiết đơn thuốc');
    } finally {
      setPxLoading(false);
    }
  };

  const handleCreateNew = () => {
    toast('Vui lòng chọn một ca khám để kê đơn thuốc mới.', { icon: 'ℹ️' });
    navigate('/doctor/appointments');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quản lý Đơn thuốc</h1>
          <p className="text-sm text-slate-500 mt-1">Danh sách các đơn thuốc đã kê cho bệnh nhân</p>
        </div>
        <button 
          onClick={handleCreateNew}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm text-sm"
        >
          <Plus className="w-4 h-4" /> Kê đơn mới
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Tìm theo mã đơn thuốc, tên bệnh nhân..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors text-sm font-medium">
          <Filter className="w-4 h-4" /> Bộ lọc
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
                <th className="px-6 py-4">Mã Đơn Thuốc</th>
                <th className="px-6 py-4">Bệnh nhân</th>
                <th className="px-6 py-4">Ngày kê</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {prescriptions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <Pill className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    Không tìm thấy đơn thuốc nào.
                  </td>
                </tr>
              ) : (
                prescriptions.map((px: any) => (
                  <tr key={px.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {px.prescription_code || px.id.substring(0,8)}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{px.patient_name || 'Bệnh nhân'}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {px.created_at ? new Date(px.created_at).toLocaleDateString('vi-VN') : '---'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        px.status === 'dispensed' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {px.status === 'dispensed' ? 'Đã phát' : 'Chưa phát'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button 
                        onClick={() => handleView(px.id)}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 font-medium text-xs rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        Xem chi tiết
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {selectedPx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <Pill className="w-5 h-5 text-blue-600" /> Chi tiết đơn thuốc {selectedPx.prescription_code}
              </h3>
              <button onClick={() => setSelectedPx(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-6 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <h4 className="font-semibold text-slate-800 mb-2">Ghi chú của bác sĩ:</h4>
                <p className="text-slate-700 text-sm">{selectedPx.notes || 'Không có ghi chú'}</p>
              </div>

              <h4 className="font-semibold text-slate-800 mb-3">Danh sách thuốc ({selectedPx.items?.length || 0}):</h4>
              <div className="space-y-3">
                {selectedPx.items?.map((item: any) => (
                  <div key={item.id} className="p-4 border border-slate-200 rounded-xl bg-white shadow-sm flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-600">
                      <Pill className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h5 className="font-bold text-slate-800">{item.medicine_name}</h5>
                        <span className="text-sm font-medium bg-slate-100 px-2 py-1 rounded text-slate-700">SL: {item.quantity}</span>
                      </div>
                      <p className="text-xs text-slate-500 mb-2">{item.generic_name}</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                        <div>
                          <span className="text-xs text-slate-500 block">Liều dùng:</span>
                          <span className="text-sm font-medium text-slate-700">{item.dosage}</span>
                        </div>
                        <div>
                          <span className="text-xs text-slate-500 block">Tần suất:</span>
                          <span className="text-sm font-medium text-slate-700">{item.frequency}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-xs text-slate-500 block">Cách dùng:</span>
                          <span className="text-sm font-medium text-slate-700">{item.instructions || 'Theo chỉ định của bác sĩ'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 text-right">
              <button onClick={() => setSelectedPx(null)} className="px-6 py-2 bg-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-300 transition-colors">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
