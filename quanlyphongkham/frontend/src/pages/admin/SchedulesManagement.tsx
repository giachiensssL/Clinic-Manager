import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Search, Plus, Calendar, Clock, Edit2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockSchedules, mockDepartments, mockStaff, mockRooms } from '@/mock/adminData';

export default function SchedulesManagement() {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('2026-09-17'); // Demo date
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newSchedule, setNewSchedule] = useState({ doctor: '', department: '', room: '', shift: 'Sáng (08:00 - 12:00)' });

  const filteredData = mockSchedules.filter(s => {
    const matchSearch = s.doctor.toLowerCase().includes(search.toLowerCase()) || s.room.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === 'all' || s.department === deptFilter;
    const matchDate = s.date === dateFilter;
    return matchSearch && matchDept && matchDate;
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddOpen(false);
    setNewSchedule({ doctor: '', department: '', room: '', shift: 'Sáng (08:00 - 12:00)' });
    alert('Thêm lịch thành công');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lịch làm việc</h1>
          <p className="text-sm text-slate-500 mt-1">Sắp xếp lịch trực và làm việc của nhân sự</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-[#1e3a5f] text-[#1e3a5f]">Phân ca tự động (AI)</Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#1e3a5f] hover:bg-[#152943]">
                <Plus className="mr-2 w-4 h-4" /> Tạo lịch mới
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tạo lịch làm việc</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Bác sĩ / Nhân viên</label>
                  <Input required value={newSchedule.doctor} onChange={e => setNewSchedule({...newSchedule, doctor: e.target.value})} placeholder="VD: BS. Nguyễn Văn A" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Khoa</label>
                  <Select value={newSchedule.department} onValueChange={v => setNewSchedule({...newSchedule, department: v})}>
                    <SelectTrigger><SelectValue placeholder="Chọn khoa" /></SelectTrigger>
                    <SelectContent>
                      {mockDepartments.map(d => (
                        <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phòng</label>
                  <Input required value={newSchedule.room} onChange={e => setNewSchedule({...newSchedule, room: e.target.value})} placeholder="VD: P.101" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ca làm việc</label>
                  <Select value={newSchedule.shift} onValueChange={v => setNewSchedule({...newSchedule, shift: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sáng (08:00 - 12:00)">Sáng (08:00 - 12:00)</SelectItem>
                      <SelectItem value="Chiều (13:00 - 17:00)">Chiều (13:00 - 17:00)</SelectItem>
                      <SelectItem value="Tối (17:30 - 21:00)">Tối (17:30 - 21:00)</SelectItem>
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-3 mb-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Tìm bác sĩ, phòng..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <Select value={deptFilter} onValueChange={setDeptFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Chọn khoa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả khoa</SelectItem>
                    {mockDepartments.map(d => (
                      <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-md bg-white">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-700 font-medium">Hôm nay ({dateFilter})</span>
                </div>
              </div>

              {/* Alert for conflicts demo */}
              <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-amber-800">Cảnh báo trùng lịch (Phát hiện bởi AI)</h4>
                  <p className="text-xs text-amber-700 mt-0.5">BS. Phạm Thị Hoa được phân công ở cả phòng P201 và P202 trong ca sáng. Vui lòng kiểm tra lại.</p>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã lịch</TableHead>
                      <TableHead>Bác sĩ / Nhân viên</TableHead>
                      <TableHead>Khoa</TableHead>
                      <TableHead>Phòng</TableHead>
                      <TableHead>Ca làm việc</TableHead>
                      <TableHead className="text-center">Số lịch hẹn</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.length === 0 ? (
                      <TableRow><TableCell colSpan={8} className="text-center h-24">Không tìm thấy dữ liệu.</TableCell></TableRow>
                    ) : (
                      filteredData.map(s => (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium text-slate-500">{s.id}</TableCell>
                          <TableCell className="font-semibold text-blue-700">{s.doctor}</TableCell>
                          <TableCell className="text-sm text-slate-700">{s.department}</TableCell>
                          <TableCell>
                            <span className="font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">{s.room}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-sm text-slate-600">
                              <Clock className="w-4 h-4" /> {s.shift}
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-bold text-slate-700">{s.appointments}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn(s.status === 'Bình thường' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200')}>
                              {s.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" title="Sửa đổi"><Edit2 className="w-4 h-4 text-blue-600" /></Button>
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
      </div>
    </div>
  );
}
