import { useState, useEffect } from "react";
import { Pill, Loader2, Calendar, FileText, ChevronRight, X } from "lucide-react";
import { prescriptionsAPI } from "@/services/api";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function PatientPrescriptions() {
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await prescriptionsAPI.getAll();
      setPrescriptions(res.data.items || []);
    } catch (err) {
      console.error(err);
      setError("Không thể tải danh sách đơn thuốc. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (id: string) => {
    try {
      const res = await prescriptionsAPI.getById(id);
      setSelectedPrescription(res.data);
    } catch (err) {
      console.error(err);
      alert("Không thể tải chi tiết đơn thuốc");
    }
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
        <button onClick={fetchPrescriptions} className="ml-4 underline font-medium">Thử lại</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#0B3B78] flex items-center gap-2">
          <Pill className="w-6 h-6 text-blue-600" />
          Đơn thuốc của tôi
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {prescriptions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Pill className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-lg font-medium text-slate-700">Chưa có đơn thuốc nào</p>
            <p className="mt-1">Đơn thuốc của bạn sẽ hiển thị ở đây sau khi khám bệnh.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {prescriptions.map((rx) => (
              <div 
                key={rx.id} 
                onClick={() => handleViewDetails(rx.id)}
                className="p-5 hover:bg-slate-50 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg mb-1">{rx.prescription_code || 'Đơn thuốc'}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {format(parseISO(rx.created_at), "dd/MM/yyyy", { locale: vi })}
                      </span>
                      <span className="hidden sm:block w-1 h-1 rounded-full bg-slate-300"></span>
                      <span>BS: {rx.doctor?.full_name || rx.doctor?.staff?.full_name || 'Không rõ'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto mt-2 sm:mt-0">
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                    rx.dispensed_at 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {rx.dispensed_at ? 'Đã phát thuốc' : 'Chưa phát thuốc'}
                  </span>
                  <ChevronRight className="w-5 h-5 text-slate-400 ml-4 hidden sm:block" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selectedPrescription} onOpenChange={(open) => !open && setSelectedPrescription(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-[#0B3B78]">
              <FileText className="w-6 h-6 text-blue-600" />
              Chi tiết Đơn thuốc {selectedPrescription?.prescription_code ? `- ${selectedPrescription.prescription_code}` : ''}
            </DialogTitle>
          </DialogHeader>

          {selectedPrescription && (
            <div className="mt-6 space-y-6">
              {/* Info grid */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Ngày kê đơn</p>
                  <p className="font-semibold text-slate-800">
                    {format(parseISO(selectedPrescription.created_at || new Date().toISOString()), "dd/MM/yyyy HH:mm")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Trạng thái</p>
                  <p className="font-semibold text-slate-800">
                    {selectedPrescription.dispensed_at ? 'Đã phát thuốc' : 'Chưa phát thuốc'}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-slate-500 mb-1">Ghi chú của bác sĩ</p>
                  <p className="text-slate-800 bg-white p-3 rounded-lg border border-slate-200 mt-1">
                    {selectedPrescription.notes || 'Không có ghi chú'}
                  </p>
                </div>
              </div>

              {/* Medicine List */}
              <div>
                <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
                  <Pill className="w-5 h-5 text-blue-500" />
                  Danh sách thuốc
                </h3>
                
                {selectedPrescription.items && selectedPrescription.items.length > 0 ? (
                  <div className="space-y-3">
                    {selectedPrescription.items.map((item: any, idx: number) => (
                      <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                        <div className="flex gap-4 items-start">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0 mt-1 md:mt-0">
                            {idx + 1}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 text-lg">{item.medicine_name || item.medicine?.name || 'Thuốc'}</h4>
                            <p className="text-sm text-slate-500">{item.generic_name || item.medicine?.generic_name || ''}</p>
                            
                            <div className="mt-2 flex flex-wrap gap-2">
                              <span className="inline-flex px-2 py-1 rounded bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
                                Liều lượng: {item.dosage}
                              </span>
                              <span className="inline-flex px-2 py-1 rounded bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
                                Tần suất: {item.frequency}
                              </span>
                              <span className="inline-flex px-2 py-1 rounded bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
                                Dùng trong: {item.duration_days} ngày
                              </span>
                            </div>
                            
                            {item.instructions && (
                              <p className="mt-2 text-sm text-blue-700 bg-blue-50 px-3 py-2 rounded-md border border-blue-100 flex items-start gap-2">
                                <span className="font-semibold block shrink-0 mt-0.5">HD:</span> 
                                <span>{item.instructions}</span>
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="bg-slate-50 px-4 py-2 rounded-lg text-center border border-slate-100 md:ml-auto w-full md:w-auto">
                          <p className="text-xs text-slate-500 font-medium mb-0.5">Số lượng</p>
                          <p className="text-xl font-bold text-slate-800">{item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-4 bg-slate-50 rounded-lg">Không có chi tiết thuốc trong đơn này.</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
