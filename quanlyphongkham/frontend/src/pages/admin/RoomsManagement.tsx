import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Search, Plus, Edit2, DoorOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockRooms, mockDepartments } from '@/mock/adminData';

export default function RoomsManagement() {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newRoom, setNewRoom] = useState({ id: '', department: '', type: 'Phòng khám' });
  
  const filteredData = mockRooms.filter(r => {
    const matchSearch = r.id.toLowerCase().includes(search.toLowerCase()) || r.staff.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === 'all' || r.department === deptFilter;
    return matchSearch && matchDept;
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddOpen(false);
    setNewRoom({ id: '', department: '', type: 'Phòng khám' });
    alert('Thêm phòng thành công');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Phòng khám</h1>
          <p className="text-sm text-slate-500 mt-1">Quản lý không gian khám chữa bệnh</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#1e3a5f] hover:bg-[#152943]">
              <Plus className="mr-2 w-4 h-4" /> Thêm Phòng
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm Phòng mới</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Mã phòng</label>
                <Input required value={newRoom.id} onChange={e => setNewRoom({...newRoom, id: e.target.value})} placeholder="VD: P.101" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Khoa/Chuyên khoa</label>
                <Select value={newRoom.department} onValueChange={v => setNewRoom({...newRoom, department: v})}>
                  <SelectTrigger><SelectValue placeholder="Chọn khoa" /></SelectTrigger>
                  <SelectContent>
                    {mockDepartments.map(d => (
                      <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Loại phòng</label>
                <Select value={newRoom.type} onValueChange={v => setNewRoom({...newRoom, type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Phòng khám">Phòng khám</SelectItem>
                    <SelectItem value="Phòng xét nghiệm">Phòng xét nghiệm</SelectItem>
                    <SelectItem value="Phòng siêu âm">Phòng siêu âm</SelectItem>
                    <SelectItem value="Phòng X-Quang">Phòng X-Quang</SelectItem>
                  </SelectContent>
                </Select>
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
              <Input placeholder="Tìm mã phòng, người phụ trách..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Chọn khoa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả khoa</SelectItem>
                {mockDepartments.map(d => (
                  <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã phòng</TableHead>
                  <TableHead>Khoa / Chuyên khoa</TableHead>
                  <TableHead>Loại phòng</TableHead>
                  <TableHead>Phụ trách hiện tại</TableHead>
                  <TableHead className="text-center">Lượt khám hôm nay</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center h-24">Không tìm thấy dữ liệu.</TableCell></TableRow>
                ) : (
                  filteredData.map(r => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DoorOpen className="w-4 h-4 text-slate-400" />
                          <span className="font-bold text-slate-700">{r.id}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-slate-700">{r.department}</TableCell>
                      <TableCell className="text-sm text-slate-600">{r.type}</TableCell>
                      <TableCell className="text-sm text-blue-700 font-medium">{r.staff}</TableCell>
                      <TableCell className="text-center font-bold text-slate-700">{r.todayCount}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(
                          r.status === 'Đang sử dụng' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                          r.status === 'Đang hoạt động' ? 'bg-green-50 text-green-700 border-green-200' :
                          r.status === 'Bảo trì' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-slate-50 text-slate-500 border-slate-200'
                        )}>
                          {r.status}
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
