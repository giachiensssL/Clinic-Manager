import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, DollarSign, Loader2 } from 'lucide-react';
import { billingAPI } from '@/services/api';

export default function BillingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: b, isLoading } = useQuery({
    queryKey: ['billing', id],
    queryFn: async () => {
      const res = await billingAPI.getById(id!);
      return res.data;
    },
    enabled: !!id
  });

  const payMutation = useMutation({
    mutationFn: async () => {
      if (b && b.remaining_amount > 0) {
        await billingAPI.recordPayment(b.id, {
          amount: b.remaining_amount,
          payment_method: 'cash',
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing', id] });
    }
  });

  if (isLoading) return <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (!b) return <div>Không tìm thấy hóa đơn.</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/billing')}><ArrowLeft className="h-4 w-4" /></Button>
          <h1 className="text-2xl font-bold">Hóa Đơn {b.invoice_code}</h1>
          <Badge className={b.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
            {b.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán đủ'}
          </Badge>
        </div>
        <div className="space-x-2">
          <Button variant="outline"><Printer className="w-4 h-4 mr-2" /> In</Button>
          {b.status !== 'paid' && (
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => payMutation.mutate()} disabled={payMutation.isPending}>
              {payMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <DollarSign className="w-4 h-4 mr-2" />} Nhận thanh toán
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-1">Thông tin bệnh nhân</p>
              <p className="font-bold text-lg">Khách hàng ID: {b.patient_id}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-500 mb-1">Ngày lập</p>
              <p className="font-medium">{new Date(b.due_date || Date.now()).toLocaleDateString('vi-VN')}</p>
            </div>
          </div>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="py-3 font-semibold text-slate-600">Mục</th>
                <th className="py-3 font-semibold text-slate-600 text-right">Thành tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {b.consultation_fee > 0 && <tr><td className="py-4">Phí khám</td><td className="py-4 text-right">{b.consultation_fee.toLocaleString()}đ</td></tr>}
              {b.medicine_fee > 0 && <tr><td className="py-4">Tiền thuốc</td><td className="py-4 text-right">{b.medicine_fee.toLocaleString()}đ</td></tr>}
              {b.service_fee > 0 && <tr><td className="py-4">Phí dịch vụ</td><td className="py-4 text-right">{b.service_fee.toLocaleString()}đ</td></tr>}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-bold text-lg border-t-2 border-slate-200">
                <td className="py-4 px-2">Tổng Cộng</td>
                <td className="py-4 px-2 text-right text-[#1e3a5f]">{b.total_amount.toLocaleString()}đ</td>
              </tr>
              <tr className="font-bold text-lg">
                <td className="py-4 px-2">Đã Thanh Toán</td>
                <td className="py-4 px-2 text-right text-green-600">{b.paid_amount.toLocaleString()}đ</td>
              </tr>
              <tr className="font-bold text-xl">
                <td className="py-4 px-2">Còn Lại</td>
                <td className="py-4 px-2 text-right text-red-600">{b.remaining_amount.toLocaleString()}đ</td>
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
