import { useState, useEffect } from 'react';
import { Microscope, FileText, CheckCircle, Search, Filter, X, Plus, Loader2 } from 'lucide-react';
import { doctorAPI, labResultsAPI } from '@/services/api';
import toast from 'react-hot-toast';

export default function DoctorLabResults() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedLab, setSelectedLab] = useState<any>(null);
  const [labLoading, setLabLoading] = useState(false);

  // Create Lab Order State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    patient_id: '',
    test_name: 'Tổng phân tích tế bào máu ngoại vi',
    priority: 'normal',
    notes: ''
  });

  const fetchResults = async () => {
    try {
      setLoading(true);
      const { data } = await labResultsAPI.list();
      setResults(data.items || []);
    } catch (error) {
      toast.error('Lỗi khi tải kết quả xét nghiệm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
    doctorAPI.searchPatients('')
      .then(res => setPatients(res.data.items || []))
      .catch(() => {});
  }, []);

  const handleCreateLabOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patient_id) {
      toast.error('Vui lòng chọn bệnh nhân');
      return;
    }
    if (!formData.test_name.trim()) {
      toast.error('Vui lòng chọn hoặc nhập loại xét nghiệm');
      return;
    }

    try {
      setCreating(true);
      await labResultsAPI.create({
        patient_id: formData.patient_id,
        test_name: formData.test_name.trim(),
        notes: formData.notes.trim() || `Chỉ định mức độ: ${formData.priority === 'urgent' ? 'Cấp cứu' : 'Bình thường'}`,
        status: 'pending'
      });
      toast.success('Chỉ định xét nghiệm thành công!');
      setIsCreateOpen(false);
      setFormData({
        patient_id: '',
        test_name: 'Tổng phân tích tế bào máu ngoại vi',
        priority: 'normal',
        notes: ''
      });
      fetchResults();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Lỗi khi chỉ định xét nghiệm');
    } finally {
      setCreating(false);
    }
  };

  const markAsReviewed = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/lab-results/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ status: 'completed' })
      });
      if (res.ok) {
        toast.success('Đã đánh dấu là đã xem');
        setResults(prev => prev.map(r => r.id === id ? { ...r, status: 'completed' } : r));
        if (selectedLab && selectedLab.id === id) {
          setSelectedLab({ ...selectedLab, status: 'completed' });
        }
      } else {
        toast.error('Không thể cập nhật trạng thái');
      }
    } catch (error) {
      toast.error('Lỗi mạng');
    }
  };

  const handleView = async (id: string) => {
    try {
      setLabLoading(true);
      const { data } = await labResultsAPI.getDetail(id);
      setSelectedLab(data);
    } catch (e) {
      toast.error('Lỗi khi tải chi tiết xét nghiệm');
    } finally {
      setLabLoading(false);
    }
  };

  const filteredResults = results.filter(r => 
    (r.patient_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (r.test_type || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 relative w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Kết quả xét nghiệm</h1>
          <p className="text-sm text-slate-500 mt-1">Xem và đánh giá các kết quả cận lâm sàng của bệnh nhân</p>
        </div>
        <button 
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm text-sm"
        >
          <Plus className="w-4 h-4" /> Chỉ định xét nghiệm mới
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Tìm theo tên bệnh nhân, loại xét nghiệm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors text-sm font-medium">
          <Filter className="w-4 h-4" /> Trạng thái
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
                <th className="px-6 py-4">Loại xét nghiệm</th>
                <th className="px-6 py-4">Ngày xét nghiệm</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <Microscope className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    Không có kết quả xét nghiệm nào.
                  </td>
                </tr>
              ) : (
                filteredResults.map((res: any) => (
                  <tr key={res.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{res.patient_name || 'Bệnh nhân'}</div>
                      <div className="text-xs text-slate-500">Mã phiếu: {res.id.substring(0,8)}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{res.test_type}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {res.test_date ? new Date(res.test_date).toLocaleDateString('vi-VN') : '---'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        res.status === 'completed' ? 'bg-green-100 text-green-700' :
                        res.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {res.status === 'completed' ? 'Đã có kết quả' : 
                         res.status === 'pending' ? 'Chờ kết quả' : res.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button 
                        onClick={() => handleView(res.id)}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 font-medium text-xs rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        Xem
                      </button>
                      {res.status === 'pending' && (
                        <button 
                          onClick={() => markAsReviewed(res.id)}
                          className="px-3 py-1.5 bg-green-50 text-green-700 font-medium text-xs rounded-lg hover:bg-green-100 transition-colors"
                        >
                          Đã đọc
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {selectedLab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <Microscope className="w-5 h-5 text-blue-600" /> Kết quả xét nghiệm {selectedLab.test_type}
              </h3>
              <button onClick={() => setSelectedLab(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Bệnh nhân</p>
                  <p className="font-medium text-slate-800">{selectedLab.patient_name || '---'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Ngày xét nghiệm</p>
                  <p className="font-medium text-slate-800">{selectedLab.test_date ? new Date(selectedLab.test_date).toLocaleDateString('vi-VN') : '---'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-slate-500 mb-1">Kết luận</p>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 mt-1 whitespace-pre-wrap text-sm text-slate-700">
                    {selectedLab.result_text || 'Chưa có kết luận.'}
                  </div>
                </div>
                {selectedLab.file_url && (
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500 mb-1">File đính kèm</p>
                    <a href={selectedLab.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline">
                      <FileText className="w-4 h-4" /> Xem file PDF / Ảnh
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              {selectedLab.status === 'pending' && (
                <button 
                  onClick={() => markAsReviewed(selectedLab.id)}
                  className="px-6 py-2 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors"
                >
                  Đánh dấu Đã đọc
                </button>
              )}
              <button onClick={() => setSelectedLab(null)} className="px-6 py-2 bg-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-300 transition-colors">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Chỉ định xét nghiệm mới */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Chỉ định xét nghiệm cận lâm sàng</h3>
                <p className="text-xs text-slate-500 mt-0.5">Tạo phiếu yêu cầu xét nghiệm hoặc chẩn đoán hình ảnh cho bệnh nhân</p>
              </div>
              <button 
                onClick={() => setIsCreateOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLabOrder} className="p-6 space-y-4">
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Loại xét nghiệm / Kỹ thuật <span className="text-red-500">*</span></label>
                <select
                  value={formData.test_name}
                  onChange={(e) => setFormData({ ...formData, test_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none mb-2"
                >
                  <option value="Tổng phân tích tế bào máu ngoại vi">Tổng phân tích tế bào máu ngoại vi (Laser)</option>
                  <option value="Sinh hóa máu (Glucose, Creatinin, Men gan GOT/GPT)">Sinh hóa máu (Glucose, Creatinin, Men gan GOT/GPT)</option>
                  <option value="Tổng phân tích nước tiểu 10 thông số">Tổng phân tích nước tiểu 10 thông số</option>
                  <option value="X-Quang ngực thẳng kỹ thuật số (CR/DR)">X-Quang ngực thẳng kỹ thuật số (CR/DR)</option>
                  <option value="Siêu âm ổ bụng tổng quát">Siêu âm ổ bụng tổng quát</option>
                  <option value="Siêu âm tim Doppler màu">Siêu âm tim Doppler màu</option>
                  <option value="Điện tâm đồ ECG 12 chuyển đạo">Điện tâm đồ ECG 12 chuyển đạo</option>
                  <option value="Nội soi thực quản - dạ dày - tá tràng">Nội soi thực quản - dạ dày - tá tràng</option>
                  <option value="custom">-- Nhập tên xét nghiệm khác --</option>
                </select>
                {formData.test_name === 'custom' && (
                  <input
                    type="text"
                    required
                    placeholder="Nhập tên xét nghiệm cụ thể..."
                    onChange={(e) => setFormData({ ...formData, test_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 outline-none"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mức độ ưu tiên</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer text-sm font-medium transition-all ${
                    formData.priority === 'normal' ? 'border-blue-500 bg-blue-50/50 text-blue-700' : 'border-slate-200 text-slate-600'
                  }`}>
                    <input
                      type="radio"
                      name="priority"
                      value="normal"
                      checked={formData.priority === 'normal'}
                      onChange={() => setFormData({ ...formData, priority: 'normal' })}
                      className="hidden"
                    />
                    Bình thường (Thường quy)
                  </label>
                  <label className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer text-sm font-medium transition-all ${
                    formData.priority === 'urgent' ? 'border-red-500 bg-red-50/50 text-red-700' : 'border-slate-200 text-slate-600'
                  }`}>
                    <input
                      type="radio"
                      name="priority"
                      value="urgent"
                      checked={formData.priority === 'urgent'}
                      onChange={() => setFormData({ ...formData, priority: 'urgent' })}
                      className="hidden"
                    />
                    Khẩn cấp / Cấp cứu (STAT)
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Chẩn đoán lâm sàng & Ghi chú kỹ thuật viên</label>
                <textarea
                  rows={3}
                  placeholder="Ghi chú lâm sàng phục vụ định hướng xét nghiệm..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                />
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
                  {creating ? 'Đang gửi chỉ định...' : 'Gửi chỉ định xét nghiệm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
