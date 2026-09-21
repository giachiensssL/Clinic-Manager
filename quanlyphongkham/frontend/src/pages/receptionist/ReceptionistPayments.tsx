import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { receptionistApi } from '../../services/receptionist';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import toast from 'react-hot-toast';

export default function ReceptionistPayments() {
  const queryClient = useQueryClient();
  const { data: payments, isLoading } = useQuery({ queryKey: ['receptionist-payments'], queryFn: receptionistApi.getPayments });

  const processPay = useMutation({
    mutationFn: ({ id, amount, method }: { id: string, amount: number, method: string }) => receptionistApi.processPayment(id, amount, method),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receptionist-payments'] });
      toast.success('Thanh toán thành công');
    },
    onError: () => toast.error('Lỗi thanh toán')
  });

  if (isLoading) return <div>Đang tải...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Quản lý Thanh toán</h2>
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-3 font-medium">Mã Hóa đơn</th>
                <th className="px-4 py-3 font-medium">Bệnh nhân</th>
                <th className="px-4 py-3 font-medium text-right">Tổng tiền</th>
                <th className="px-4 py-3 font-medium text-right">Còn lại</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {payments?.map((b: any) => (
                <tr key={b.id} className="border-b hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{b.invoice_code}</td>
                  <td className="px-4 py-3">{b.patient?.full_name}</td>
                  <td className="px-4 py-3 text-right font-semibold">{b.total_amount.toLocaleString('vi-VN')} đ</td>
                  <td className="px-4 py-3 text-right font-semibold text-red-600">{b.remaining_amount.toLocaleString('vi-VN')} đ</td>
                  <td className="px-4 py-3">
                    <Badge variant={b.status === 'paid' ? 'default' : 'secondary'}>{b.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {b.remaining_amount > 0 && (
                      <Button size="sm" onClick={() => {
                        if(confirm(`Xác nhận thanh toán ${b.remaining_amount.toLocaleString('vi-VN')}đ?`)) {
                          processPay.mutate({ id: b.id, amount: b.remaining_amount, method: 'cash' });
                        }
                      }}>Thanh toán (TM)</Button>
                    )}
                    {b.remaining_amount === 0 && <Button size="sm" variant="outline">In hóa đơn</Button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
