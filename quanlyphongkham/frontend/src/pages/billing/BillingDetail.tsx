import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, DollarSign } from 'lucide-react';

export default function BillingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/billing')}><ArrowLeft className="h-4 w-4" /></Button>
          <h1 className="text-2xl font-bold">Hóa Đơn HD123456</h1>
          <Badge variant="destructive">Chưa thanh toán</Badge>
        </div>
        <div className="space-x-2">
          <Button variant="outline"><Printer className="w-4 h-4 mr-2" /> In</Button>
          <Button className="bg-green-600 hover:bg-green-700"><DollarSign className="w-4 h-4 mr-2" /> Nhận thanh toán</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-1">Thông tin bệnh nhân</p>
              <p className="font-bold text-lg">Nguyễn Văn Minh</p>
              <p className="text-slate-600">BN001234 | 0912345678</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-500 mb-1">Ngày lập</p>
              <p className="font-medium">25/08/2026 08:30</p>
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
              <tr><td className="py-4">Khám chuyên khoa Tim mạch</td><td className="py-4 text-right">300,000đ</td></tr>
              <tr><td className="py-4">Thuốc theo đơn DT001234</td><td className="py-4 text-right">250,000đ</td></tr>
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-bold text-lg border-t-2 border-slate-200">
                <td className="py-4 px-2">Tổng Cộng</td>
                <td className="py-4 px-2 text-right text-[#1e3a5f]">550,000đ</td>
              </tr>
              <tr className="font-bold text-lg">
                <td className="py-4 px-2">Đã Thanh Toán</td>
                <td className="py-4 px-2 text-right text-green-600">0đ</td>
              </tr>
              <tr className="font-bold text-xl">
                <td className="py-4 px-2">Còn Lại</td>
                <td className="py-4 px-2 text-right text-red-600">550,000đ</td>
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
