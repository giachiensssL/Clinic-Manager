import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Edit, Eye, Trash2, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { patientsAPI } from '@/services/api';

export default function PatientsList() {
 const navigate = useNavigate();
 const queryClient = useQueryClient();
 const [searchTerm, setSearchTerm] = useState('');
 const [isCreateOpen, setIsCreateOpen] = useState(false);
 const [editPatient, setEditPatient] = useState<any>(null);
 const [deletePatient, setDeletePatient] = useState<any>(null);

 const { data: patientsResponse, isLoading } = useQuery({
 queryKey: ['patients', searchTerm],
 queryFn: async () => {
 const res = await patientsAPI.getAll({ search: searchTerm });
 return res.data;
 },
 });

 const patients = patientsResponse?.items || [];
 const { register, handleSubmit, reset, setValue } = useForm();
 const { register: regEdit, handleSubmit: handleEditSubmit, reset: resetEdit, setValue: setEditValue } = useForm();

 const createMutation = useMutation({
 mutationFn: (data: any) => patientsAPI.create(data),
 onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['patients'] }); setIsCreateOpen(false); reset(); },
 });

 const updateMutation = useMutation({
 mutationFn: ({ id, data }: { id: string; data: any }) => patientsAPI.update(id, data),
 onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['patients'] }); setEditPatient(null); },
 });

 const deleteMutation = useMutation({
 mutationFn: (id: string) => patientsAPI.delete(id),
 onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['patients'] }); setDeletePatient(null); },
 });

 const openEdit = (patient: any, e: React.MouseEvent) => {
 e.stopPropagation();
 setEditPatient(patient);
 resetEdit({ full_name: patient.full_name, date_of_birth: patient.date_of_birth, gender: patient.gender, phone: patient.phone, address: patient.address || '' });
 };

 return (
 <div className="space-y-6">
 <div className="flex items-center justify-between">
 <h1 className="text-2xl font-bold tracking-tight">Quản lý Bệnh nhân</h1>
 <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
 <DialogTrigger asChild>
 <Button className="bg-[#0ea5e9] hover:bg-[#0284c7]"><Plus className="mr-2 h-4 w-4" /> Thêm Bệnh Nhân</Button>
 </DialogTrigger>
 <DialogContent>
 <DialogHeader><DialogTitle>Thêm bệnh nhân mới</DialogTitle></DialogHeader>
 <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
 <div className="space-y-2"><Label>Họ Tên</Label><Input {...register('full_name', { required: true })} placeholder="Nguyễn Văn A" /></div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2"><Label>Ngày sinh</Label><Input type="date" {...register('date_of_birth', { required: true })} /></div>
 <div className="space-y-2">
 <Label>Giới tính</Label>
 <Select onValueChange={(val) => setValue('gender', val)} defaultValue="male">
 <SelectTrigger><SelectValue /></SelectTrigger>
 <SelectContent>
 <SelectItem value="male">Nam</SelectItem>
 <SelectItem value="female">Nữ</SelectItem>
 <SelectItem value="other">Khác</SelectItem>
 </SelectContent>
 </Select>
 </div>
 </div>
 <div className="space-y-2"><Label>Số điện thoại</Label><Input {...register('phone')} placeholder="0901234567" /></div>
 <div className="space-y-2"><Label>Địa chỉ</Label><Input {...register('address')} placeholder="123 Đường ABC, Q.1, TP.HCM" /></div>
 <Button type="submit" className="w-full bg-[#0ea5e9] hover:bg-[#0284c7]" disabled={createMutation.isPending}>
 {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Lưu Bệnh Nhân
 </Button>
 </form>
 </DialogContent>
 </Dialog>
 </div>

 <Card>
 <CardContent className="p-4">
 <div className="flex items-center gap-4 mb-4">
 <div className="relative flex-1 max-w-md">
 <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
 <Input placeholder="Tìm kiếm theo Tên, Mã BN, SĐT..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
 </div>
 </div>
 <div className="rounded-md border">
 <Table>
 <TableHeader>
 <TableRow>
 <TableHead>Mã BN</TableHead><TableHead>Họ Tên</TableHead><TableHead>Ngày Sinh</TableHead>
 <TableHead>Giới Tính</TableHead><TableHead>SĐT</TableHead><TableHead>Trạng Thái</TableHead>
 <TableHead className="text-right">Thao Tác</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {isLoading ? (
 <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">Đang tải dữ liệu...</TableCell></TableRow>
 ) : patients.length === 0 ? (
 <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">Không tìm thấy bệnh nhân nào.</TableCell></TableRow>
 ) : (
 patients.map((patient: any) => (
 <TableRow key={patient.id} className="cursor-pointer hover:bg-slate-50 :bg-slate-800" onClick={() => navigate(`/patients/${patient.id}`)}>
 <TableCell className="font-medium text-[#1e3a5f] ">{patient.patient_code}</TableCell>
 <TableCell>{patient.full_name}</TableCell>
 <TableCell>{patient.date_of_birth}</TableCell>
 <TableCell>{patient.gender === 'male' ? 'Nam' : patient.gender === 'female' ? 'Nữ' : 'Khác'}</TableCell>
 <TableCell>{patient.phone}</TableCell>
 <TableCell>
 <Badge variant={patient.is_active ? 'completed' : 'cancelled' as any}>
 {patient.is_active ? 'Hoạt động' : 'Tạm ngừng'}
 </Badge>
 </TableCell>
 <TableCell className="text-right">
 <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); navigate(`/patients/${patient.id}`); }}><Eye className="h-4 w-4 text-slate-500" /></Button>
 <Button variant="ghost" size="icon" onClick={(e) => openEdit(patient, e)}><Edit className="h-4 w-4 text-blue-500" /></Button>
 <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDeletePatient(patient); }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
 </TableCell>
 </TableRow>
 ))
 )}
 </TableBody>
 </Table>
 </div>
 </CardContent>
 </Card>

 {/* Edit Dialog */}
 <Dialog open={!!editPatient} onOpenChange={() => setEditPatient(null)}>
 <DialogContent>
 <DialogHeader><DialogTitle>Chỉnh sửa bệnh nhân</DialogTitle></DialogHeader>
 <form onSubmit={handleEditSubmit(d => updateMutation.mutate({ id: editPatient.id, data: d }))} className="space-y-4">
 <div className="space-y-2"><Label>Họ Tên</Label><Input {...regEdit('full_name', { required: true })} /></div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2"><Label>Ngày sinh</Label><Input type="date" {...regEdit('date_of_birth')} /></div>
 <div className="space-y-2">
 <Label>Giới tính</Label>
 <Select onValueChange={(val) => setEditValue('gender', val)} defaultValue={editPatient?.gender}>
 <SelectTrigger><SelectValue /></SelectTrigger>
 <SelectContent>
 <SelectItem value="male">Nam</SelectItem><SelectItem value="female">Nữ</SelectItem><SelectItem value="other">Khác</SelectItem>
 </SelectContent>
 </Select>
 </div>
 </div>
 <div className="space-y-2"><Label>Số điện thoại</Label><Input {...regEdit('phone')} /></div>
 <div className="space-y-2"><Label>Địa chỉ</Label><Input {...regEdit('address')} /></div>
 <DialogFooter>
 <Button type="button" variant="outline" onClick={() => setEditPatient(null)}>Hủy</Button>
 <Button type="submit" disabled={updateMutation.isPending}>
 {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Lưu thay đổi
 </Button>
 </DialogFooter>
 </form>
 </DialogContent>
 </Dialog>

 {/* Delete Confirm */}
 <Dialog open={!!deletePatient} onOpenChange={() => setDeletePatient(null)}>
 <DialogContent className="max-w-sm">
 <DialogHeader><DialogTitle>Xác nhận xóa</DialogTitle></DialogHeader>
 <p className="text-sm text-slate-600 ">
 Bạn có chắc muốn xóa bệnh nhân <strong>{deletePatient?.full_name}</strong>? Hành động này không thể hoàn tác.
 </p>
 <DialogFooter>
 <Button variant="outline" onClick={() => setDeletePatient(null)}>Hủy</Button>
 <Button variant="destructive" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(deletePatient.id)}>
 {deleteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />} Xóa
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 </div>
 );
}
