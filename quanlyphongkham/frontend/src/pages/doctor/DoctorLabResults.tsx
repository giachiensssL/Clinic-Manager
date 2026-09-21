import { useState, useEffect } from 'react';
import { Microscope, FileText, CheckCircle, Search, Filter, X } from 'lucide-react';
import { doctorAPI, labResultsAPI } from '@/services/api';
import toast from 'react-hot-toast';

export default function DoctorLabResults() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedLab, setSelectedLab] = useState<any>(null);
  const [labLoading, setLabLoading] = useState(false);

  useEffect(() => {
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
    fetchResults();
  }, []);

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
    <div className="max-w-7xl mx-auto space-y-6 relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Kết quả xét nghiệm</h1>
          <p className="text-sm text-slate-500 mt-1">Xem và đánh giá các kết quả cận lâm sàng của bệnh nhân</p>
        </div>
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
    </div>
  );
}
