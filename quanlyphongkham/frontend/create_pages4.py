import os

files = {
    r'd:\Website_Antigravity\DU_LIEU\Quanlyphongkham\quanlyphongkham\frontend\src\pages\billing\BillingList.tsx': '''import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const mockBillings = [
  { id: 'b001', code: 'HD123456', patient: 'Nguyễn Văn Minh', date: '2026-08-25', total: 550000, paid: 550000, remaining: 0, status: 'paid' },
  { id: 'b002', code: 'HD123457', patient: 'Trần Thị Lan', date: '2026-08-25', total: 430000, paid: 0, remaining: 430000, status: 'unpaid' },
  { id: 'b003', code: 'HD123458', patient: 'Phạm Thị Hoa', date: '2026-08-24', total: 215000, paid: 100000, remaining: 115000, status: 'partially_paid' },
];

export default function BillingList() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Thanh toán & Hóa đơn</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[{t:'Tổng Hôm Nay', v:'1.195.000đ', c:'text-blue-600'}, {t:'Đã Thu', v:'650.000đ', c:'text-green-600'}, {t:'Công Nợ', v:'545.000đ', c:'text-red-600'}].map((s,i)=>(
          <Card key={i}><CardContent className="p-4"><p className="text-sm font-medium text-slate-500">{s.t}</p><p className={	ext-2xl font-bold }>{s.v}</p></CardContent></Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-sm mb-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Tìm mã HD, bệnh nhân..." className="pl-8" />
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Mã HD</TableHead><TableHead>Bệnh Nhân</TableHead><TableHead>Ngày</TableHead><TableHead className="text-right">Tổng Cộng</TableHead><TableHead className="text-right">Đã Thu</TableHead><TableHead className="text-right">Còn Lại</TableHead><TableHead>Trạng Thái</TableHead><TableHead className="text-right">Thao Tác</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {mockBillings.map((b) => (
                  <TableRow key={b.id} className="cursor-pointer" onClick={() => navigate(/billing/)}>
                    <TableCell className="font-medium">{b.code}</TableCell>
                    <TableCell>{b.patient}</TableCell>
                    <TableCell>{b.date}</TableCell>
                    <TableCell className="text-right font-medium">{b.total.toLocaleString()}đ</TableCell>
                    <TableCell className="text-right text-green-600">{b.paid.toLocaleString()}đ</TableCell>
                    <TableCell className="text-right text-red-600">{b.remaining.toLocaleString()}đ</TableCell>
                    <TableCell>
                      <Badge variant={b.status === 'paid' ? 'paid' : b.status === 'unpaid' ? 'destructive' : 'waiting'}>
                        {b.status === 'paid' ? 'Đã thanh toán' : b.status === 'unpaid' ? 'Chưa thanh toán' : 'Thanh toán 1 phần'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="icon"><Eye className="w-4 h-4" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
''',
    r'd:\Website_Antigravity\DU_LIEU\Quanlyphongkham\quanlyphongkham\frontend\src\pages\billing\BillingDetail.tsx': '''import { useParams, useNavigate } from 'react-router-dom';
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
''',
    r'd:\Website_Antigravity\DU_LIEU\Quanlyphongkham\quanlyphongkham\frontend\src\pages\reports\Reports.tsx': '''import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Reports() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Báo cáo & Thống kê</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Bệnh nhân mới</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">145</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Lượt khám</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">892</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Tỷ lệ hoàn thành</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">92%</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Doanh thu</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-[#0ea5e9]">345.5M</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Doanh thu 30 ngày qua</CardTitle></CardHeader>
        <CardContent className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={Array.from({length: 30}, (_, i) => ({ day: i+1, rev: Math.floor(Math.random() * 20) + 10 }))}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="rev" stroke="#1e3a5f" fill="#0ea5e9" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
'''
}

for filepath, content in files.items():
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("Created Billing and Reports pages")
