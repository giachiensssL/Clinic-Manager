import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Search, Plus, Edit2, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockDepartments } from '@/mock/adminData';

export default function DepartmentsManagement() {
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newDept, setNewDept] = useState({ name: '', code: '' });
  
  const filteredData = mockDepartments.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) || 
    d.id.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddOpen(false);
    setNewDept({ name: '', code: '' });
    alert('Thêm khoa thành công');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Khoa / Chuyên khoa</h1>
          <p className="text-sm text-slate-500 mt-1">Quản lý cơ cấu chuyên môn của phòng khám</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#1e3a5f] hover:bg-[#152943]">
              <Plus className="mr-2 w-4 h-4" /> Thêm Khoa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm Khoa mới</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Mã khoa</label>
                <Input required value={newDept.code} onChange={e => setNewDept({...newDept, code: e.target.value})} placeholder="VD: KHOA01" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tên khoa</label>
                <Input required value={newDept.name} onChange={e => setNewDept({...newDept, name: e.target.value})} placeholder="Nội tổng quát" />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Hủy</Button>
                <Button type="submit" className="bg-[#1e3a5f] hover:bg-[#152943]">Lưu</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Tìm mã khoa, tên khoa..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã khoa</TableHead>
                  <TableHead>Tên khoa / Chuyên khoa</TableHead>
                  <TableHead className="text-center">Số bác sĩ</TableHead>
                  <TableHead className="text-center">Số phòng</TableHead>
                  <TableHead className="text-center">Lịch hẹn hôm nay</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center h-24">Không tìm thấy dữ liệu.</TableCell></TableRow>
                ) : (
                  filteredData.map(d => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium text-slate-600">{d.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <LayoutGrid className="w-4 h-4 text-blue-500" />
                          <p className="font-medium text-sm text-slate-800">{d.name}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium">{d.doctorCount}</TableCell>
                      <TableCell className="text-center font-medium">{d.roomCount}</TableCell>
                      <TableCell className="text-center text-blue-600 font-bold">{d.todayAppointments}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(d.status === 'Hoạt động' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200')}>
                          {d.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" title="Chỉnh sửa"><Edit2 className="w-4 h-4 text-blue-600" /></Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
