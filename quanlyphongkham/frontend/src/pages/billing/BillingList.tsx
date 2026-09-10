import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Eye, CreditCard, Clock, CheckCircle2, AlertCircle, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { billingAPI } from '@/services/api';

interface Billing {
  id: string;
  invoice_code: string;
  patient_id: string;
  appointment_id?: string;
  consultation_fee: number;
  medicine_fee: number;
  service_fee: number;
  total_amount: number;
  insurance_covered: number;
  paid_amount: number;
  remaining_amount: number;
  status: 'unpaid' | 'partially_paid' | 'paid' | 'refunded';
  patient?: { full_name: string; patient_code: string; phone: string; };
  created_at: string;
}

const STATUS_CONFIG = {
  unpaid: { label: 'Chưa thanh toán', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: AlertCircle },
  partially_paid: { label: 'Thanh toán một phần', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock },
  paid: { label: 'Đã thanh toán', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle2 },
  refunded: { label: 'Hoàn tiền', color: 'bg-slate-100 text-slate-600', icon: CreditCard },
};

const formatCurrency = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';
const formatDate = (s: string) => new Date(s).toLocaleDateString('vi-VN');

export default function BillingList() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Billing | null>(null);
  const [payDialog, setPayDialog] = useState(false);
  const [payMethod, setPayMethod] = useState('cash');
  const [payAmount, setPayAmount] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['billing'],
    queryFn: () => billingAPI.getAll({ page: 1, size: 100 }).then(r => r.data),
  });

  const billings: Billing[] = data?.items ?? data ?? [];

  const filtered = billings.filter(b => {
    const q = search.toLowerCase();
    return (
      b.invoice_code.toLowerCase().includes(q) ||
      b.patient?.full_name?.toLowerCase().includes(q) ||
      b.patient?.patient_code?.toLowerCase().includes(q)
    );
  });

  // Stats
  const stats = useMemo(() => ({
    total: billings.reduce((s, b) => s + b.total_amount, 0),
    paid: billings.filter(b => b.status === 'paid').reduce((s, b) => s + b.total_amount, 0),
    unpaid: billings.filter(b => b.status !== 'paid' && b.status !== 'refunded').reduce((s, b) => s + b.remaining_amount, 0),
  }), [billings]);

  const payMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      billingAPI.recordPayment(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['billing'] });
      setPayDialog(false);
      setSelected(null);
    },
  });

  const handlePay = () => {
    if (!selected) return;
    payMutation.mutate({
      id: selected.id,
      data: {
        amount: parseFloat(payAmount) || selected.remaining_amount,
        payment_method: payMethod,
      },
    });
  };

  const openPayDialog = (b: Billing) => {
    setSelected(b);
    setPayAmount(b.remaining_amount.toString());
    setPayDialog(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Quản lý Thanh toán</h1>
        <p className="text-sm text-slate-500 mt-1">{billings.length} hóa đơn</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Tổng doanh thu', value: stats.total, icon: DollarSign, color: 'text-blue-600' },
          { label: 'Đã thu', value: stats.paid, icon: CheckCircle2, color: 'text-green-600' },
          { label: 'Còn lại', value: stats.unpaid, icon: AlertCircle, color: 'text-red-500' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <s.icon className={`w-8 h-8 ${s.color}`} />
              <div>
                <p className="text-xs text-slate-500">{s.label}</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(s.value)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Tìm mã hóa đơn, tên bệnh nhân..."
          className="pl-9"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400">Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400">Không có hóa đơn nào</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-300">Mã hóa đơn</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-300">Bệnh nhân</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-300">Tổng tiền</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-300">Còn nợ</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-300">Trạng thái</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-300">Ngày tạo</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-300">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filtered.map(b => {
                  const cfg = STATUS_CONFIG[b.status] ?? STATUS_CONFIG.unpaid;
                  const Icon = cfg.icon;
                  return (
                    <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-slate-900 dark:text-white">{b.invoice_code}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900 dark:text-white">{b.patient?.full_name ?? 'N/A'}</div>
                        <div className="text-xs text-slate-400">{b.patient?.patient_code}</div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{formatCurrency(b.total_amount)}</td>
                      <td className="px-4 py-3 text-red-600 font-medium">
                        {b.remaining_amount > 0 ? formatCurrency(b.remaining_amount) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
                          <Icon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(b.created_at)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setSelected(b)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {(b.status === 'unpaid' || b.status === 'partially_paid') && (
                            <Button
                              size="sm"
                              className="h-8"
                              onClick={() => openPayDialog(b)}
                            >
                              <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                              Thanh toán
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selected && !payDialog} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chi tiết hóa đơn — {selected?.invoice_code}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-slate-500">Bệnh nhân:</span><br /><span className="font-medium">{selected.patient?.full_name ?? 'N/A'}</span></div>
                <div><span className="text-slate-500">Ngày tạo:</span><br /><span className="font-medium">{formatDate(selected.created_at)}</span></div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span>Phí khám:</span><span>{formatCurrency(selected.consultation_fee)}</span></div>
                <div className="flex justify-between"><span>Thuốc:</span><span>{formatCurrency(selected.medicine_fee)}</span></div>
                <div className="flex justify-between"><span>Dịch vụ:</span><span>{formatCurrency(selected.service_fee)}</span></div>
                <div className="flex justify-between text-green-600"><span>Bảo hiểm:</span><span>-{formatCurrency(selected.insurance_covered)}</span></div>
                <div className="flex justify-between font-bold border-t pt-2 text-base"><span>Tổng:</span><span>{formatCurrency(selected.total_amount)}</span></div>
                <div className="flex justify-between text-blue-600"><span>Đã trả:</span><span>{formatCurrency(selected.paid_amount)}</span></div>
                <div className="flex justify-between text-red-600 font-medium"><span>Còn lại:</span><span>{formatCurrency(selected.remaining_amount)}</span></div>
              </div>
            </div>
          )}
          {selected && (selected.status === 'unpaid' || selected.status === 'partially_paid') && (
            <DialogFooter>
              <Button onClick={() => openPayDialog(selected)}>
                <CreditCard className="w-4 h-4 mr-2" />
                Ghi nhận thanh toán
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Pay Dialog */}
      <Dialog open={payDialog} onOpenChange={v => { if (!v) { setPayDialog(false); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Ghi nhận thanh toán</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Số tiền (đ)</label>
              <Input
                type="number"
                value={payAmount}
                onChange={e => setPayAmount(e.target.value)}
                className="mt-1"
                placeholder="Nhập số tiền..."
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phương thức</label>
              <Select value={payMethod} onValueChange={setPayMethod}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Tiền mặt</SelectItem>
                  <SelectItem value="card">Thẻ ngân hàng</SelectItem>
                  <SelectItem value="insurance">Bảo hiểm y tế</SelectItem>
                  <SelectItem value="transfer">Chuyển khoản</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialog(false)}>Hủy</Button>
            <Button onClick={handlePay} disabled={payMutation.isPending}>
              {payMutation.isPending ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
