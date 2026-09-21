import { useState, useEffect } from "react";
import { CreditCard, Loader2, Calendar, Receipt, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";
import { billingAPI } from "@/services/api";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function PatientPayments() {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await billingAPI.getAll();
      setInvoices(res.data.items || []);
    } catch (err) {
      console.error(err);
      setError("Không thể tải danh sách hóa đơn. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (id: string) => {
    try {
      const res = await billingAPI.getById(id);
      setSelectedInvoice(res.data);
    } catch (err) {
      console.error(err);
      alert("Không thể tải chi tiết hóa đơn");
    }
  };

  const handlePay = async () => {
    if (!selectedInvoice) return;
    
    // Simulate payment process
    setPaying(true);
    try {
      await billingAPI.recordPayment(selectedInvoice.id, {
        amount: selectedInvoice.remaining_amount,
        payment_method: "card",
        notes: "Thanh toán trực tuyến qua Patient Portal"
      });
      alert("Thanh toán thành công!");
      setSelectedInvoice(null);
      fetchInvoices();
    } catch (err) {
      console.error(err);
      alert("Thanh toán thất bại. Vui lòng thử lại.");
    } finally {
      setPaying(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
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
        <button onClick={fetchInvoices} className="ml-4 underline font-medium">Thử lại</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#0B3B78] flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-blue-600" />
          Lịch sử thanh toán
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {invoices.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Receipt className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-lg font-medium text-slate-700">Chưa có hóa đơn nào</p>
            <p className="mt-1">Hóa đơn thanh toán của bạn sẽ hiển thị ở đây.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {invoices.map((inv) => (
              <div 
                key={inv.id} 
                onClick={() => handleViewDetails(inv.id)}
                className="p-5 hover:bg-slate-50 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    inv.status === 'unpaid' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'
                  }`}>
                    {inv.status === 'unpaid' ? <AlertCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg mb-1">{inv.invoice_code || 'Hóa đơn'}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {format(parseISO(inv.created_at), "dd/MM/yyyy", { locale: vi })}
                      </span>
                      <span className="hidden sm:block w-1 h-1 rounded-full bg-slate-300"></span>
                      <span className="font-medium text-slate-700">{formatCurrency(inv.total_amount)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto mt-2 sm:mt-0">
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                    inv.status === 'paid' 
                      ? 'bg-green-100 text-green-700' 
                      : inv.status === 'unpaid'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                  }`}>
                    {inv.status === 'paid' ? 'Đã thanh toán' : inv.status === 'unpaid' ? 'Chưa thanh toán' : 'Thanh toán 1 phần'}
                  </span>
                  <ChevronRight className="w-5 h-5 text-slate-400 ml-4 hidden sm:block" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selectedInvoice} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-[#0B3B78]">
              <Receipt className="w-5 h-5 text-blue-600" />
              Chi tiết Hóa đơn {selectedInvoice?.invoice_code ? `- ${selectedInvoice.invoice_code}` : ''}
            </DialogTitle>
          </DialogHeader>

          {selectedInvoice && (
            <div className="mt-4 space-y-6">
              <div className="text-center pb-6 border-b border-dashed border-slate-200">
                <p className="text-sm text-slate-500 mb-2">Tổng thanh toán</p>
                <h2 className="text-4xl font-bold text-slate-800 tracking-tight">
                  {formatCurrency(selectedInvoice.total_amount)}
                </h2>
                <div className="mt-3">
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                    selectedInvoice.status === 'paid' 
                      ? 'bg-green-100 text-green-700' 
                      : selectedInvoice.status === 'unpaid'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                  }`}>
                    {selectedInvoice.status === 'paid' ? 'Đã thanh toán' : selectedInvoice.status === 'unpaid' ? 'Chưa thanh toán' : 'Thanh toán 1 phần'}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Mã hóa đơn</span>
                  <span className="font-medium text-slate-800">{selectedInvoice.invoice_code}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Ngày lập</span>
                  <span className="font-medium text-slate-800">
                    {format(parseISO(selectedInvoice.created_at || new Date().toISOString()), "dd/MM/yyyy HH:mm")}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Phí khám bệnh</span>
                  <span className="font-medium text-slate-800">{formatCurrency(selectedInvoice.consultation_fee)}</span>
                </div>
                {selectedInvoice.medicine_fee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Tiền thuốc</span>
                    <span className="font-medium text-slate-800">{formatCurrency(selectedInvoice.medicine_fee)}</span>
                  </div>
                )}
                {selectedInvoice.service_fee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Phí dịch vụ (XN, CĐHA)</span>
                    <span className="font-medium text-slate-800">{formatCurrency(selectedInvoice.service_fee)}</span>
                  </div>
                )}
                {selectedInvoice.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Giảm giá</span>
                    <span className="font-medium text-green-600">-{formatCurrency(selectedInvoice.discount)}</span>
                  </div>
                )}
                
                <div className="pt-3 border-t border-slate-100 flex justify-between font-semibold">
                  <span className="text-slate-700">Đã thanh toán</span>
                  <span className="text-slate-800">{formatCurrency(selectedInvoice.paid_amount)}</span>
                </div>
                {selectedInvoice.remaining_amount > 0 && (
                  <div className="flex justify-between font-semibold text-red-600">
                    <span>Còn lại cần thanh toán</span>
                    <span>{formatCurrency(selectedInvoice.remaining_amount)}</span>
                  </div>
                )}
              </div>

              {selectedInvoice.status !== 'paid' && selectedInvoice.remaining_amount > 0 && (
                <button
                  onClick={handlePay}
                  disabled={paying}
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
                >
                  {paying ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                  Thanh toán ngay ({formatCurrency(selectedInvoice.remaining_amount)})
                </button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
