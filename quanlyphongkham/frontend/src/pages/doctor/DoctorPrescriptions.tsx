import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pill, Search, Filter, Plus, FileText, X, Trash2, PlusCircle, Loader2 } from 'lucide-react';
import { prescriptionsAPI, doctorAPI, patientsAPI } from '@/services/api';
import toast from 'react-hot-toast';

export default function DoctorPrescriptions() {
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedPx, setSelectedPx] = useState<any>(null);
  const [pxLoading, setPxLoading] = useState(false);

  // Create Prescription Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    patient_id: '',
    notes: '',
    items: [
      { medicine_name: 'Paracetamol 500mg', dosage: '1 viên', frequency: '2 lần/ngày', duration_days: 5, quantity: 10, instructions: 'Uống sau ăn', unit_price: 2000 }
    ]
  });

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

  useEffect(() => {
    fetchPrescriptions();
    // Load patients for prescribing
    patientsAPI.getAll({ size: 100 })
      .then(res => setPatients(res.data.items || []))
      .catch(() => {});
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

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { medicine_name: '', dosage: '1 viên', frequency: '2 lần/ngày', duration_days: 5, quantity: 10, instructions: 'Uống sau ăn', unit_price: 5000 }
      ]
    }));
  };

  const handleRemoveItem = (index: number) => {
    if (formData.items.length <= 1) {
      toast.error('Đơn thuốc phải có ít nhất 1 loại thuốc');
      return;
    }
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((it, i) => i === index ? { ...it, [field]: value } : it)
    }));
  };

  const handleSavePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patient_id) {
      toast.error('Vui lòng chọn bệnh nhân');
      return;
    }
    const invalidItem = formData.items.find(it => !it.medicine_name.trim());
    if (invalidItem) {
      toast.error('Vui lòng nhập tên thuốc cho tất cả các dòng');
      return;
    }

    try {
      setCreating(true);
      const res = await prescriptionsAPI.create({
        patient_id: formData.patient_id,
        notes: formData.notes.trim() || 'Kê đơn thuốc ngoại trú',
        items: formData.items
      });
      const selectedPatient = patients.find(p => p.id === formData.patient_id);
      const newRx = {
        id: res.data.id || res.data.prescription_code,
        prescription_code: res.data.prescription_code,
        patient_name: selectedPatient ? selectedPatient.full_name : 'Bệnh nhân',
        doctor_name: 'Bác sĩ phụ trách',
        created_at: new Date().toISOString(),
        status: 'pending',
        items_count: formData.items.length
      };
      setPrescriptions(prev => [newRx, ...prev]);

      toast.success(`Tạo đơn thuốc thành công! Mã: ${res.data.prescription_code}`);
      setIsCreateOpen(false);
      setFormData({
        patient_id: '',
        notes: '',
        items: [
          { medicine_name: 'Paracetamol 500mg', dosage: '1 viên', frequency: '2 lần/ngày', duration_days: 5, quantity: 10, instructions: 'Uống sau ăn', unit_price: 2000 }
        ]
      });
      await fetchPrescriptions();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Lỗi khi tạo đơn thuốc');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 relative w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quản lý Đơn thuốc</h1>
          <p className="text-sm text-slate-500 mt-1">Danh sách các đơn thuốc đã kê cho bệnh nhân</p>
        </div>
        <button 
          onClick={() => setIsCreateOpen(true)}
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

      {/* Modal Kê đơn thuốc mới */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Kê đơn thuốc mới</h3>
                <p className="text-xs text-slate-500 mt-0.5">Chọn bệnh nhân và chỉ định danh mục thuốc điều trị</p>
              </div>
              <button 
                onClick={() => setIsCreateOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePrescription} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Chọn bệnh nhân <span className="text-red-500">*</span></label>
                  <select
                    required
                    value={formData.patient_id}
                    onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    <option value="">-- Chọn bệnh nhân --</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.full_name} ({p.patient_code}) - {p.phone || 'SĐT chưa có'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lời dặn của bác sĩ / Chẩn đoán</label>
                  <input
                    type="text"
                    placeholder="VD: Viêm phế quản cấp, uống nhiều nước ấm..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Danh sách các dòng thuốc */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Pill className="w-4 h-4 text-blue-600" /> Danh mục thuốc ({formData.items.length})
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <PlusCircle className="w-4 h-4" /> Thêm thuốc
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.items.map((item, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-bold text-slate-500">#{idx + 1}</span>
                        <div className="flex-1">
                          <input
                            type="text"
                            required
                            placeholder="Tên biệt dược / hoạt chất (VD: Augmentin 625mg)"
                            value={item.medicine_name}
                            onChange={(e) => handleItemChange(idx, 'medicine_name', e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none font-medium"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa thuốc"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <label className="text-slate-500 mb-1 block">Số lượng</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-slate-500 mb-1 block">Liều dùng</label>
                          <input
                            type="text"
                            value={item.dosage}
                            onChange={(e) => handleItemChange(idx, 'dosage', e.target.value)}
                            placeholder="1 viên"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-slate-500 mb-1 block">Tần suất</label>
                          <input
                            type="text"
                            value={item.frequency}
                            onChange={(e) => handleItemChange(idx, 'frequency', e.target.value)}
                            placeholder="2 lần/ngày"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-slate-500 mb-1 block">Số ngày dùng</label>
                          <input
                            type="number"
                            min="1"
                            value={item.duration_days}
                            onChange={(e) => handleItemChange(idx, 'duration_days', parseInt(e.target.value) || 1)}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none"
                          />
                        </div>

                        <div className="col-span-2 sm:col-span-4">
                          <label className="text-slate-500 mb-1 block">Cách dùng & Hướng dẫn</label>
                          <input
                            type="text"
                            value={item.instructions}
                            onChange={(e) => handleItemChange(idx, 'instructions', e.target.value)}
                            placeholder="Uống sau khi ăn 30 phút, kiêng đồ chua cay..."
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                  {creating ? 'Đang lưu đơn thuốc...' : 'Lưu và xuất đơn thuốc'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
