import { Card, CardContent } from '@/components/ui/card';
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
          <Card key={i}><CardContent className="p-4"><p className="text-sm font-medium text-slate-500">{s.t}</p><p className={`text-2xl font-bold ${s.c}`}>{s.v}</p></CardContent></Card>
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
                  <TableRow key={b.id} className="cursor-pointer" onClick={() => navigate(`/billing/${b.id}`)}>
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
