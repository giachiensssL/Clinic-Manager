import { useState, useEffect } from "react";
import { Microscope, Loader2, Calendar, FileText, ChevronDown, ChevronUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { labResultsAPI } from "@/services/api";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";

export default function PatientLabResults() {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await labResultsAPI.list();
      setResults(res.data.items || []);
    } catch (err) {
      console.error(err);
      setError("Không thể tải kết quả xét nghiệm. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center">
        {error}
        <button onClick={fetchResults} className="ml-4 underline font-medium">Thử lại</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#0B3B78] flex items-center gap-2">
          <Microscope className="w-6 h-6 text-blue-600" />
          Kết quả xét nghiệm
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {results.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Microscope className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-lg font-medium text-slate-700">Chưa có kết quả xét nghiệm</p>
            <p className="mt-1">Kết quả của bạn sẽ được cập nhật tại đây sau khi hoàn tất xét nghiệm.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {results.map((lab) => {
              const isExpanded = expandedId === lab.id;
              // Check if any result is abnormal
              const hasAbnormal = lab.result_data && Array.isArray(lab.result_data) 
                ? lab.result_data.some((item: any) => item.is_abnormal)
                : false;

              return (
                <div key={lab.id} className="flex flex-col">
                  {/* Header Row */}
                  <div 
                    onClick={() => toggleExpand(lab.id)}
                    className={`p-5 hover:bg-slate-50 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isExpanded ? 'bg-slate-50' : ''}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${hasAbnormal ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-slate-800 text-lg">{lab.test_name}</h3>
                          {hasAbnormal && (
                            <span className="flex items-center gap-1 text-xs font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                              <AlertCircle className="w-3 h-3" />
                              Bất thường
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            {format(parseISO(lab.test_date || lab.created_at), "dd/MM/yyyy HH:mm", { locale: vi })}
                          </span>
                          <span className="hidden sm:block w-1 h-1 rounded-full bg-slate-300"></span>
                          <span>Mã phiếu: {lab.test_code}</span>
                          <span className="hidden sm:block w-1 h-1 rounded-full bg-slate-300"></span>
                          <span>BS Chỉ định: {lab.doctor?.full_name || lab.doctor?.staff?.full_name || 'Không rõ'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between w-full sm:w-auto">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                        lab.status === 'completed' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {lab.status === 'completed' ? 'Đã có kết quả' : 'Đang xử lý'}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-slate-400 ml-4" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400 ml-4" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="p-6 bg-slate-50 border-t border-slate-100">
                      <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <Microscope className="w-4 h-4 text-slate-500" />
                        Chi tiết các chỉ số
                      </h4>
                      
                      {lab.result_data && Array.isArray(lab.result_data) && lab.result_data.length > 0 ? (
                        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                          <div className="grid grid-cols-12 gap-2 p-3 bg-slate-100 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            <div className="col-span-5 md:col-span-4">Tên chỉ số</div>
                            <div className="col-span-3 md:col-span-3 text-right">Kết quả</div>
                            <div className="col-span-4 md:col-span-3 text-center">CS Bình thường</div>
                            <div className="hidden md:block md:col-span-2 text-center">Đơn vị</div>
                          </div>
                          
                          <div className="divide-y divide-slate-100">
                            {lab.result_data.map((item: any, idx: number) => (
                              <div key={idx} className={`grid grid-cols-12 gap-2 p-3 text-sm items-center hover:bg-slate-50 ${item.is_abnormal ? 'bg-red-50/30' : ''}`}>
                                <div className="col-span-5 md:col-span-4 font-medium text-slate-800 flex items-center gap-2">
                                  {item.is_abnormal ? (
                                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                  ) : (
                                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                  )}
                                  <span className="truncate" title={item.name}>{item.name}</span>
                                </div>
                                <div className={`col-span-3 md:col-span-3 text-right font-bold ${item.is_abnormal ? 'text-red-600' : 'text-slate-800'}`}>
                                  {item.value} <span className="md:hidden text-xs font-normal text-slate-500">{item.unit}</span>
                                </div>
                                <div className="col-span-4 md:col-span-3 text-center text-slate-500 text-xs">
                                  {item.ref}
                                </div>
                                <div className="hidden md:block md:col-span-2 text-center text-slate-500 text-xs">
                                  {item.unit}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-slate-500 bg-white p-4 rounded-lg border border-slate-200 text-center">
                          Đang cập nhật chi tiết các chỉ số...
                        </p>
                      )}

                      {lab.notes && (
                        <div className="mt-4 bg-white p-4 rounded-lg border border-slate-200">
                          <p className="text-sm font-medium text-slate-700 mb-1">Ghi chú / Kết luận:</p>
                          <p className="text-sm text-slate-600">{lab.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
