import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Edit2, Lock, Unlock, KeyRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockUsers } from '@/mock/adminData';

const roleBadge: Record<string, string> = {
  'Admin': 'bg-red-100 text-red-700',
  'Bác sĩ': 'bg-blue-100 text-blue-700',
  'Lễ tân': 'bg-green-100 text-green-700',
  'Kế toán': 'bg-amber-100 text-amber-700',
  'Bệnh nhân': 'bg-purple-100 text-purple-700',
};

export default function UserManagement() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [users, setUsers] = useState(mockUsers);
  const [confirmLockId, setConfirmLockId] = useState<string | null>(null);
  
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', phone: '', role: 'Bác sĩ' });

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    setUsers([{
      id: 'US' + Math.floor(Math.random() * 10000),
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
      status: 'Đang hoạt động',
      lastLogin: 'Chưa đăng nhập',
      registeredAt: 'Hôm nay'
    }, ...users]);
    setIsAddUserOpen(false);
    setNewUser({ name: '', email: '', phone: '', role: 'Bác sĩ' });
    alert('Thêm người dùng thành công');
  };

  const filteredUsers = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || 
                       u.email.toLowerCase().includes(search.toLowerCase()) || 
                       u.id.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const toggleUserStatus = (id: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        const newStatus = u.status === 'Đang hoạt động' ? 'Bị khóa' : 'Đang hoạt động';
        alert(`Đã ${newStatus === 'Bị khóa' ? 'khóa' : 'mở khóa'} tài khoản thành công.`);
        return { ...u, status: newStatus };
      }
      return u;
    }));
    setConfirmLockId(null);
  };

  const roleCounts = {
    total: users.length,
    active: users.filter(u => u.status === 'Đang hoạt động').length,
    locked: users.filter(u => u.status === 'Bị khóa').length,
    pending: users.filter(u => u.status === 'Chờ kích hoạt').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý Người dùng</h1>
          <p className="text-sm text-slate-500 mt-1">Quản lý tài khoản và phân quyền trong hệ thống</p>
        </div>
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#1e3a5f] hover:bg-[#152943]">
              <Plus className="mr-2 w-4 h-4" /> Thêm người dùng
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm người dùng mới</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddUser} className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Họ và tên</label>
                <Input required value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} placeholder="Nguyễn Văn A" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input type="email" required value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} placeholder="email@example.com" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Số điện thoại</label>
                <Input required value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})} placeholder="0901234567" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Vai trò</label>
                <Select value={newUser.role} onValueChange={v => setNewUser({...newUser, role: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Bác sĩ">Bác sĩ</SelectItem>
                    <SelectItem value="Lễ tân">Lễ tân</SelectItem>
                    <SelectItem value="Kế toán">Kế toán</SelectItem>
                    <SelectItem value="Bệnh nhân">Bệnh nhân</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddUserOpen(false)}>Hủy</Button>
                <Button type="submit" className="bg-[#1e3a5f] hover:bg-[#152943]">Lưu</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Tổng người dùng', value: roleCounts.total, color: 'text-slate-800' },
          { label: 'Đang hoạt động', value: roleCounts.active, color: 'text-green-600' },
          { label: 'Bị khóa', value: roleCounts.locked, color: 'text-red-600' },
          { label: 'Chờ kích hoạt', value: roleCounts.pending, color: 'text-amber-600' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Tìm ID, tên, email..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Vai trò" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả vai trò</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Bác sĩ">Bác sĩ</SelectItem>
                <SelectItem value="Lễ tân">Lễ tân</SelectItem>
                <SelectItem value="Kế toán">Kế toán</SelectItem>
                <SelectItem value="Bệnh nhân">Bệnh nhân</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="Đang hoạt động">Đang hoạt động</SelectItem>
                <SelectItem value="Bị khóa">Bị khóa</SelectItem>
                <SelectItem value="Chờ kích hoạt">Chờ kích hoạt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border overflow-x-auto w-full">
      <Table className="w-full min-w-[800px]">
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>Liên hệ</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Ngày đăng ký</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center h-24">Không tìm thấy người dùng.</TableCell></TableRow>
                ) : (
                  filteredUsers.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium text-slate-600">{u.id}</TableCell>
                      <TableCell>
                        <p className="font-medium text-sm text-slate-800">{u.name}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-slate-600">{u.email}</p>
                        <p className="text-xs text-slate-400">{u.phone}</p>
                      </TableCell>
                      <TableCell>
                        <span className={cn('text-xs font-medium px-2 py-1 rounded-full', roleBadge[u.role] || 'bg-slate-100 text-slate-700')}>
                          {u.role}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        <p>{u.registeredAt}</p>
                        <p className="text-xs text-slate-400">ĐN: {u.lastLogin}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(
                          u.status === 'Đang hoạt động' ? 'bg-green-50 text-green-700 border-green-200' : 
                          u.status === 'Bị khóa' ? 'bg-red-50 text-red-700 border-red-200' : 
                          'bg-amber-50 text-amber-700 border-amber-200'
                        )}>
                          {u.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" title="Chỉnh sửa"><Edit2 className="w-4 h-4 text-blue-600" /></Button>
                          <Button variant="ghost" size="icon" title="Đặt lại mật khẩu"><KeyRound className="w-4 h-4 text-amber-600" /></Button>
                          <Button 
                            variant="ghost" size="icon" title={u.status === 'Bị khóa' ? 'Mở khóa' : 'Khóa'}
                            onClick={() => setConfirmLockId(u.id)}
                            className={u.status === 'Bị khóa' ? 'text-green-600' : 'text-red-600'}
                          >
                            {u.status === 'Bị khóa' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!confirmLockId} onOpenChange={(open) => !open && setConfirmLockId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận hành động</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-600">Bạn có chắc chắn muốn thay đổi trạng thái hoạt động của tài khoản này?</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmLockId(null)}>Hủy</Button>
            <Button variant="destructive" onClick={() => confirmLockId && toggleUserStatus(confirmLockId)}>Xác nhận</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
