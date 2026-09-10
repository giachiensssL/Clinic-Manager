import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Edit2, Lock, Unlock, UserCog } from 'lucide-react';
import { cn } from '@/lib/utils';

const mockUsers = [
  { id: 'u001', username: 'admin', fullName: 'Super Admin', email: 'admin@clinicai.vn', role: 'admin', status: 'active', lastLogin: '09/09/2026 15:42', phone: '0901234567' },
  { id: 'u002', username: 'doctor1', fullName: 'BS. Trần Thị Hương', email: 'huong.doctor@clinicai.vn', role: 'doctor', status: 'active', lastLogin: '09/09/2026 14:58', phone: '0912345678' },
  { id: 'u003', username: 'doctor2', fullName: 'BS. Nguyễn Văn Bình', email: 'binh.doctor@clinicai.vn', role: 'doctor', status: 'active', lastLogin: '09/09/2026 13:22', phone: '0923456789' },
  { id: 'u004', username: 'doctor3', fullName: 'BS. Lê Thị Phương', email: 'phuong.doctor@clinicai.vn', role: 'doctor', status: 'active', lastLogin: '08/09/2026 16:30', phone: '0934567890' },
  { id: 'u005', username: 'reception1', fullName: 'Lễ tân Trần Thị Ngọc', email: 'ngoc.reception@clinicai.vn', role: 'receptionist', status: 'active', lastLogin: '09/09/2026 08:15', phone: '0945678901' },
  { id: 'u006', username: 'reception2', fullName: 'Lễ tân Phạm Văn Đức', email: 'duc.reception@clinicai.vn', role: 'receptionist', status: 'inactive', lastLogin: '05/09/2026 17:45', phone: '0956789012' },
  { id: 'u007', username: 'accountant1', fullName: 'Kế toán Nguyễn Thị Lan', email: 'lan.accountant@clinicai.vn', role: 'accountant', status: 'active', lastLogin: '09/09/2026 09:30', phone: '0967890123' },
  { id: 'u008', username: 'patient001', fullName: 'Nguyễn Văn Minh', email: 'minh.patient@gmail.com', role: 'patient', status: 'active', lastLogin: '07/09/2026 10:00', phone: '0978901234' },
  { id: 'u009', username: 'patient002', fullName: 'Trần Thị Lan', email: 'lan.patient@gmail.com', role: 'patient', status: 'active', lastLogin: '06/09/2026 14:22', phone: '0989012345' },
];

const roleBadge: Record<string, string> = {
  admin: 'bg-red-100 text-red-700',
  doctor: 'bg-blue-100 text-blue-700',
  receptionist: 'bg-green-100 text-green-700',
  accountant: 'bg-amber-100 text-amber-700',
  patient: 'bg-purple-100 text-purple-700',
};
const roleLabel: Record<string, string> = {
  admin: 'Quản trị viên',
  doctor: 'Bác sĩ',
  receptionist: 'Lễ tân',
  accountant: 'Kế toán',
  patient: 'Bệnh nhân',
};

export default function UserManagement() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [users, setUsers] = useState(mockUsers);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', fullName: '', email: '', role: 'doctor', phone: '' });

  const filtered = users.filter(u => {
    const matchSearch =
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.username.includes(search) ||
      u.email.includes(search);
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const toggleStatus = (id: string) => {
    setUsers(prev =>
      prev.map(u =>
        u.id === id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u
      )
    );
  };

  const handleAddUser = () => {
    if (!newUser.username || !newUser.fullName) return;
    setUsers(prev => [
      ...prev,
      {
        id: `u${Date.now()}`,
        ...newUser,
        status: 'active',
        lastLogin: '—',
      },
    ]);
    setNewUser({ username: '', fullName: '', email: '', role: 'doctor', phone: '' });
    setIsAddOpen(false);
  };

  const roleCounts = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    doctor: users.filter(u => u.role === 'doctor').length,
    patient: users.filter(u => u.role === 'patient').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý Người dùng</h1>
          <p className="text-sm text-slate-500 mt-1">Quản lý tài khoản và phân quyền trong hệ thống</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#1e3a5f] hover:bg-[#152943]">
              <Plus className="mr-2 w-4 h-4" /> Thêm User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Thêm người dùng mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Tài khoản (username) *</label>
                <Input value={newUser.username} onChange={e => setNewUser(p => ({ ...p, username: e.target.value }))} placeholder="vd: doctor5" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Họ và tên *</label>
                <Input value={newUser.fullName} onChange={e => setNewUser(p => ({ ...p, fullName: e.target.value }))} placeholder="vd: BS. Nguyễn Văn A" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Email</label>
                <Input value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} placeholder="email@clinicai.vn" type="email" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Số điện thoại</label>
                <Input value={newUser.phone} onChange={e => setNewUser(p => ({ ...p, phone: e.target.value }))} placeholder="09xxxxxxxx" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Vai trò</label>
                <Select value={newUser.role} onValueChange={v => setNewUser(p => ({ ...p, role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Quản trị viên</SelectItem>
                    <SelectItem value="doctor">Bác sĩ</SelectItem>
                    <SelectItem value="receptionist">Lễ tân</SelectItem>
                    <SelectItem value="accountant">Kế toán</SelectItem>
                    <SelectItem value="patient">Bệnh nhân</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>Hủy</Button>
                <Button className="bg-[#1e3a5f]" onClick={handleAddUser}>Thêm user</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Tổng users', value: roleCounts.total, color: 'text-slate-800' },
          { label: 'Đang hoạt động', value: roleCounts.active, color: 'text-green-600' },
          { label: 'Bác sĩ', value: roleCounts.doctor, color: 'text-blue-600' },
          { label: 'Bệnh nhân', value: roleCounts.patient, color: 'text-purple-600' },
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
              <Input placeholder="Tìm tên, username, email..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Lọc theo role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả vai trò</SelectItem>
                <SelectItem value="admin">Quản trị viên</SelectItem>
                <SelectItem value="doctor">Bác sĩ</SelectItem>
                <SelectItem value="receptionist">Lễ tân</SelectItem>
                <SelectItem value="accountant">Kế toán</SelectItem>
                <SelectItem value="patient">Bệnh nhân</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Người dùng</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Đăng nhập gần nhất</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(u => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1e3a5f] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {u.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{u.fullName}</p>
                          <p className="text-xs text-slate-400">@{u.username}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">{u.email || '—'}</TableCell>
                    <TableCell>
                      <span className={cn('text-xs font-medium px-2 py-1 rounded-full', roleBadge[u.role])}>
                        {roleLabel[u.role]}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.status === 'active' ? 'default' : 'outline'}
                        className={u.status === 'active' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'text-slate-500'}>
                        {u.status === 'active' ? 'Hoạt động' : 'Tạm khóa'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">{u.lastLogin}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" title="Chỉnh sửa">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleStatus(u.id)}
                          title={u.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa'}
                          className={u.status === 'active' ? 'text-red-500 hover:text-red-700' : 'text-green-600 hover:text-green-800'}
                        >
                          {u.status === 'active' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-sm text-slate-500 mt-3">Hiển thị {filtered.length} / {users.length} người dùng</p>
        </CardContent>
      </Card>
    </div>
  );
}
