import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Search, Filter, Plus, Edit2, UserCheck, UserX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockStaff } from '@/mock/adminData';

export default function StaffManagement() {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', position: '', department: '', email: '' });
  
  const filteredStaff = mockStaff.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.id.toLowerCase().includes(search.toLowerCase()) ||
    s.department.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: mockStaff.length,
    doctors: mockStaff.filter(s => s.position.includes('Bác sĩ') || s.position.includes('Trưởng khoa')).length,
    reception: mockStaff.filter(s => s.position.includes('lễ tân')).length,
    others: mockStaff.filter(s => !s.position.includes('Bác sĩ') && !s.position.includes('Trưởng khoa') && !s.position.includes('lễ tân')).length,
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddStaffOpen(false);
    setNewStaff({ name: '', position: '', department: '', email: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý Nhân viên</h1>
          <p className="text-sm text-slate-500 mt-1">Quản lý hồ sơ và thông tin nhân sự phòng khám</p>
        </div>
        <Dialog open={isAddStaffOpen} onOpenChange={setIsAddStaffOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#1e3a5f] hover:bg-[#152943]">
              <Plus className="mr-2 w-4 h-4" /> Thêm nhân viên
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm nhân viên mới</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddStaff} className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Họ và tên</label>
                <Input required value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} placeholder="Nguyễn Văn B" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Chức vụ</label>
                <Input required value={newStaff.position} onChange={e => setNewStaff({...newStaff, position: e.target.value})} placeholder="Bác sĩ chuyên khoa" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Khoa/Phòng</label>
                <Input required value={newStaff.department} onChange={e => setNewStaff({...newStaff, department: e.target.value})} placeholder="Nội tổng quát" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input type="email" required value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})} placeholder="email@example.com" />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddStaffOpen(false)}>Hủy</Button>
                <Button type="submit" className="bg-[#1e3a5f] hover:bg-[#152943]">Lưu</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs text-slate-500">Tổng nhân viên</p><p className="text-2xl font-bold text-slate-800">{stats.total}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-slate-500">Bác sĩ</p><p className="text-2xl font-bold text-blue-600">{stats.doctors}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-slate-500">Lễ tân</p><p className="text-2xl font-bold text-green-600">{stats.reception}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-slate-500">Khác</p><p className="text-2xl font-bold text-purple-600">{stats.others}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Tìm mã NV, tên, khoa..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã NV</TableHead>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>Chức vụ / Khoa</TableHead>
                  <TableHead>Liên hệ</TableHead>
                  <TableHead>Ngày vào làm</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Tài khoản</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center h-24">Không tìm thấy dữ liệu.</TableCell></TableRow>
                ) : (
                  filteredStaff.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium text-slate-600">{s.id}</TableCell>
                      <TableCell>
                        <p className="font-medium text-sm text-slate-800">{s.name}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium text-blue-700">{s.position}</p>
                        <p className="text-xs text-slate-500">{s.department}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-slate-600">{s.phone}</p>
                        <p className="text-xs text-slate-400">{s.email}</p>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">{s.joinDate}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(s.status === 'Đang làm việc' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-500 border-slate-200')}>
                          {s.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {s.hasAccount ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                            <UserCheck className="w-3 h-3" /> Đã cấp
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                            <UserX className="w-3 h-3" /> Chưa cấp
                          </span>
                        )}
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
