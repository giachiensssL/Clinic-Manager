import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Search, Eye, Printer, FileText } from 'lucide-react';

const mockPrescriptions = [
  {
    id: 'rx001', code: 'DT001234', patient: 'Nguyễn Văn Minh', doctor: 'BS. Trần Thị Hương',
    date: '2026-08-25', status: 'active', diagnosis: 'Tăng huyết áp (I10)',
    items: [
      { name: 'Amlodipine 5mg', qty: 30, unit: 'viên', usage: 'Uống 1 viên/ngày vào buổi sáng', note: 'Sau ăn' },
      { name: 'Losartan 50mg', qty: 30, unit: 'viên', usage: 'Uống 1 viên/ngày vào buổi tối', note: 'Sau ăn' },
    ]
  },
  {
    id: 'rx002', code: 'DT001235', patient: 'Trần Thị Lan', doctor: 'BS. Nguyễn Văn Bình',
    date: '2026-08-24', status: 'completed', diagnosis: 'Viêm họng cấp',
    items: [
      { name: 'Amoxicillin 500mg', qty: 21, unit: 'viên', usage: 'Uống 3 lần/ngày, mỗi lần 1 viên', note: 'Sau ăn' },
      { name: 'Paracetamol 500mg', qty: 15, unit: 'viên', usage: 'Khi sốt hoặc đau, tối đa 4 viên/ngày', note: 'Khi cần' },
    ]
  },
  {
    id: 'rx003', code: 'DT001236', patient: 'Lê Quang Hùng', doctor: 'BS. Trần Thị Hương',
    date: '2026-08-23', status: 'active', diagnosis: 'Tiểu đường type 2 (E11)',
    items: [
      { name: 'Metformin 500mg', qty: 60, unit: 'viên', usage: 'Uống 2 lần/ngày, mỗi lần 1 viên', note: 'Trong bữa ăn' },
      { name: 'Glipizide 5mg', qty: 30, unit: 'viên', usage: 'Uống 1 viên/ngày vào buổi sáng', note: 'Trước ăn 30 phút' },
      { name: 'Vitamin D3 1000IU', qty: 30, unit: 'viên', usage: 'Uống 1 viên/ngày', note: 'Bất cứ lúc nào' },
    ]
  },
  {
    id: 'rx004', code: 'DT001237', patient: 'Phạm Thị Hoa', doctor: 'BS. Lê Thị Phương',
    date: '2026-08-22', status: 'completed', diagnosis: 'Viêm mũi dị ứng (J30)',
    items: [
      { name: 'Cetirizine 10mg', qty: 14, unit: 'viên', usage: 'Uống 1 viên/ngày vào buổi tối', note: 'Trước ngủ' },
      { name: 'Fluticasone xịt mũi', qty: 1, unit: 'lọ', usage: 'Xịt 1-2 lần/ngày mỗi bên mũi', note: '' },
    ]
  },
];

export default function PrescriptionsList() {
  const [search, setSearch] = useState('');
  const [selectedRx, setSelectedRx] = useState<typeof mockPrescriptions[0] | null>(null);

  const filtered = mockPrescriptions.filter(rx =>
    rx.patient.toLowerCase().includes(search.toLowerCase()) ||
    rx.code.includes(search) ||
    rx.doctor.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Đơn thuốc</h1>
          <p className="text-sm text-slate-500 mt-1">Quản lý đơn thuốc của bệnh nhân</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span> Đang dùng:
            <strong>{mockPrescriptions.filter(r => r.status === 'active').length}</strong>
            <span className="ml-3 w-3 h-3 rounded-full bg-slate-400 inline-block"></span> Hoàn thành:
            <strong>{mockPrescriptions.filter(r => r.status === 'completed').length}</strong>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-sm mb-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo mã đơn, bệnh nhân, bác sĩ..."
              className="pl-8"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã Đơn</TableHead>
                  <TableHead>Bệnh Nhân</TableHead>
                  <TableHead>Bác Sĩ Kê</TableHead>
                  <TableHead>Chẩn Đoán</TableHead>
                  <TableHead>Ngày Kê</TableHead>
                  <TableHead>Số Thuốc</TableHead>
                  <TableHead>Trạng Thái</TableHead>
                  <TableHead className="text-right">Thao Tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(rx => (
                  <TableRow key={rx.id} className="cursor-pointer hover:bg-slate-50">
                    <TableCell className="font-medium text-[#1e3a5f]">{rx.code}</TableCell>
                    <TableCell>{rx.patient}</TableCell>
                    <TableCell>{rx.doctor}</TableCell>
                    <TableCell className="text-sm text-slate-600 max-w-[180px] truncate" title={rx.diagnosis}>
                      {rx.diagnosis}
                    </TableCell>
                    <TableCell>{rx.date}</TableCell>
                    <TableCell>
                      <span className="font-bold text-[#0ea5e9]">{rx.items.length}</span>
                      <span className="text-slate-400 text-xs ml-1">loại</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          rx.status === 'active'
                            ? 'bg-green-100 text-green-700 hover:bg-green-100'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-100'
                        }
                      >
                        {rx.status === 'active' ? 'Đang dùng' : 'Đã xong'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedRx(rx)}
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedRx} onOpenChange={open => !open && setSelectedRx(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#0ea5e9]" />
              Đơn thuốc {selectedRx?.code}
            </DialogTitle>
          </DialogHeader>
          {selectedRx && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-slate-500">Bệnh nhân:</span> <strong>{selectedRx.patient}</strong></div>
                <div><span className="text-slate-500">Bác sĩ:</span> <strong>{selectedRx.doctor}</strong></div>
                <div><span className="text-slate-500">Ngày kê:</span> <strong>{selectedRx.date}</strong></div>
                <div><span className="text-slate-500">Chẩn đoán:</span> <strong>{selectedRx.diagnosis}</strong></div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold text-[#1e3a5f] mb-3">Danh sách thuốc</h4>
                <div className="space-y-3">
                  {selectedRx.items.map((item, i) => (
                    <div key={i} className="p-3 border rounded-lg bg-teal-50/40 border-teal-100">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-teal-900">
                            {i + 1}. {item.name}
                          </p>
                          <p className="text-sm text-slate-600 mt-1">{item.usage}</p>
                          {item.note && (
                            <p className="text-xs text-amber-700 mt-1 bg-amber-50 px-2 py-0.5 rounded inline-block">
                              ⚠️ {item.note}
                            </p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0 ml-4">
                          <p className="font-bold text-[#0ea5e9]">{item.qty}</p>
                          <p className="text-xs text-slate-500">{item.unit}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setSelectedRx(null)}>Đóng</Button>
                <Button className="bg-[#1e3a5f]">
                  <Printer className="w-4 h-4 mr-2" /> In đơn thuốc
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
