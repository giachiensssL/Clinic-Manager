import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Save, ShieldAlert } from 'lucide-react';

const initialRoles = ['Admin', 'Bác sĩ', 'Lễ tân', 'Kế toán', 'Bệnh nhân'];
const modules = [
  { id: 'users', name: 'Quản lý người dùng' },
  { id: 'staff', name: 'Quản lý nhân viên' },
  { id: 'clinic', name: 'Cấu trúc phòng khám (Khoa, Phòng)' },
  { id: 'schedule', name: 'Lịch làm việc' },
  { id: 'patient', name: 'Thông tin bệnh nhân' },
  { id: 'appointment', name: 'Lịch hẹn khám' },
  { id: 'emr', name: 'Hồ sơ bệnh án (Chuyên môn)' },
  { id: 'prescription', name: 'Đơn thuốc (Chuyên môn)' },
  { id: 'billing', name: 'Thanh toán & Thu ngân' },
  { id: 'report', name: 'Báo cáo hệ thống' },
  { id: 'audit', name: 'Nhật ký hệ thống (Audit Logs)' },
  { id: 'settings', name: 'Cấu hình hệ thống' },
];

const initialPermissions: Record<string, Record<string, { view: boolean; edit: boolean }>> = {
  'Admin': {
    users: { view: true, edit: true },
    staff: { view: true, edit: true },
    clinic: { view: true, edit: true },
    schedule: { view: true, edit: true },
    patient: { view: true, edit: false }, // Read-only for admin
    appointment: { view: true, edit: true },
    emr: { view: true, edit: false }, // Read-only for admin
    prescription: { view: true, edit: false }, // Read-only for admin
    billing: { view: true, edit: false },
    report: { view: true, edit: true },
    audit: { view: true, edit: false }, // Logs are always read-only
    settings: { view: true, edit: true },
  },
  'Bác sĩ': {
    users: { view: false, edit: false },
    staff: { view: true, edit: false },
    clinic: { view: true, edit: false },
    schedule: { view: true, edit: false },
    patient: { view: true, edit: false },
    appointment: { view: true, edit: false },
    emr: { view: true, edit: true }, // Full access
    prescription: { view: true, edit: true }, // Full access
    billing: { view: false, edit: false },
    report: { view: false, edit: false },
    audit: { view: false, edit: false },
    settings: { view: false, edit: false },
  },
  'Lễ tân': {
    users: { view: false, edit: false },
    staff: { view: true, edit: false },
    clinic: { view: true, edit: false },
    schedule: { view: true, edit: false },
    patient: { view: true, edit: true },
    appointment: { view: true, edit: true },
    emr: { view: false, edit: false },
    prescription: { view: false, edit: false },
    billing: { view: true, edit: false },
    report: { view: false, edit: false },
    audit: { view: false, edit: false },
    settings: { view: false, edit: false },
  },
  'Kế toán': {
    users: { view: false, edit: false },
    staff: { view: false, edit: false },
    clinic: { view: false, edit: false },
    schedule: { view: false, edit: false },
    patient: { view: true, edit: false },
    appointment: { view: false, edit: false },
    emr: { view: false, edit: false },
    prescription: { view: false, edit: false },
    billing: { view: true, edit: true }, // Full access
    report: { view: true, edit: false },
    audit: { view: false, edit: false },
    settings: { view: false, edit: false },
  },
  'Bệnh nhân': {
    users: { view: false, edit: false },
    staff: { view: false, edit: false },
    clinic: { view: true, edit: false },
    schedule: { view: false, edit: false },
    patient: { view: true, edit: true }, // Own profile only
    appointment: { view: true, edit: true }, // Own appointments
    emr: { view: true, edit: false }, // Own EMR
    prescription: { view: true, edit: false }, // Own prescriptions
    billing: { view: true, edit: false }, // Own billing
    report: { view: false, edit: false },
    audit: { view: false, edit: false },
    settings: { view: false, edit: false },
  }
};


export default function RolesManagement() {
  const [roles, setRoles] = useState(initialRoles);
  const [selectedRole, setSelectedRole] = useState('Admin');
  const [permissions, setPermissions] = useState(initialPermissions);
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');

  const handleToggle = (module: string, type: 'view' | 'edit') => {
    // Admin cannot edit EMR, Prescription, Audit Logs
    if (selectedRole === 'Admin' && type === 'edit' && ['emr', 'prescription', 'patient', 'billing', 'audit'].includes(module)) {
      alert("Không thể cấp quyền: Quản trị viên (Admin) không được phép can thiệp vào dữ liệu chuyên môn y khoa hoặc kế toán.");
      return;
    }

    setPermissions(prev => ({
      ...prev,
      [selectedRole]: {
        ...prev[selectedRole],
        [module]: {
          ...prev[selectedRole]?.[module],
          [type]: !prev[selectedRole]?.[module]?.[type]
        }
      }
    }));
  };

  const handleAddRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim() || roles.includes(newRoleName)) return;
    
    setRoles([...roles, newRoleName]);
    setPermissions(prev => ({
      ...prev,
      [newRoleName]: modules.reduce((acc, mod) => ({...acc, [mod.id]: {view: false, edit: false}}), {})
    }));
    setIsAddRoleOpen(false);
    setSelectedRole(newRoleName);
    setNewRoleName('');
    alert('Thêm vai trò thành công');
  };

  const handleSave = () => {
    alert(`Lưu thành công: Đã cập nhật phân quyền cho vai trò ${selectedRole}.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vai trò & Phân quyền</h1>
          <p className="text-sm text-slate-500 mt-1">Cấu hình quyền truy cập cho từng nhóm người dùng</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddRoleOpen} onOpenChange={setIsAddRoleOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="text-[#1e3a5f]">
                Thêm vai trò
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Thêm vai trò mới</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddRole} className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tên vai trò</label>
                  <Input required value={newRoleName} onChange={e => setNewRoleName(e.target.value)} placeholder="VD: Quản lý chi nhánh" />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddRoleOpen(false)}>Hủy</Button>
                  <Button type="submit" className="bg-[#1e3a5f] hover:bg-[#152943]">Lưu</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Button onClick={handleSave} className="bg-[#1e3a5f] hover:bg-[#152943]">
            <Save className="mr-2 w-4 h-4" /> Lưu thay đổi
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-2">
          <h3 className="font-semibold text-slate-800 mb-3 px-2">Danh sách vai trò</h3>
          {roles.map(role => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                selectedRole === role 
                  ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {role}
            </button>
          ))}
          <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-start gap-2 text-amber-800">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-semibold mb-1">Lưu ý bảo mật:</p>
                <p>Theo quy định, Admin hệ thống không được cấp quyền chỉnh sửa hồ sơ bệnh án, đơn thuốc và thanh toán để đảm bảo tính minh bạch.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-3">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-lg">Chi tiết quyền hạn: <span className="text-blue-600">{selectedRole}</span></CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="w-[300px]">Phân hệ (Module)</TableHead>
                    <TableHead className="text-center">Xem (Read)</TableHead>
                    <TableHead className="text-center">Thao tác (Create/Edit/Delete)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modules.map(module => {
                    const hasView = permissions[selectedRole]?.[module.id]?.view || false;
                    const hasEdit = permissions[selectedRole]?.[module.id]?.edit || false;
                    
                    return (
                      <TableRow key={module.id}>
                        <TableCell className="font-medium text-slate-700">{module.name}</TableCell>
                        <TableCell className="text-center">
                          <input
                            type="checkbox"
                            checked={hasView} 
                            onChange={() => handleToggle(module.id, 'view')}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <input
                            type="checkbox"
                            checked={hasEdit} 
                            onChange={() => handleToggle(module.id, 'edit')}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
