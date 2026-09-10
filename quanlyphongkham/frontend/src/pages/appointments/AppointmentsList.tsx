import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Search, Plus, List, Calendar as CalendarIcon, MoreHorizontal, Loader2, CheckCircle, Clock, XCircle, Play, CreditCard } from 'lucide-react';
import { appointmentsAPI, patientsAPI, doctorsAPI } from '@/services/api';
import { format, addDays, startOfMonth, isSameDay } from 'date-fns';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  scheduled: { label: 'Đã đặt', color: 'bg-blue-100 text-blue-700' },
  waiting: { label: 'Chờ khám', color: 'bg-amber-100 text-amber-700' },
  in_consultation: { label: 'Đang khám', color: 'bg-purple-100 text-purple-700' },
  completed: { label: 'Hoàn thành', color: 'bg-green-100 text-green-700' },
  paid: { label: 'Đã thanh toán', color: 'bg-teal-100 text-teal-700' },
  cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-700' },
  no_show: { label: 'Không đến', color: 'bg-slate-100 text-slate-600' },
};

export default function AppointmentsList() {
  const queryClient = useQueryClient();
  const [view, setView] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: appointmentsResponse, isLoading } = useQuery({
    queryKey: ['appointments', searchTerm, dateFilter],
    queryFn: async () => {
      const res = await appointmentsAPI.getAll({ search: searchTerm, date: dateFilter });
      return res.data;
    },
  });

  const { data: patientsRes } = useQuery({ queryKey: ['patients'], queryFn: async () => (await patientsAPI.getAll({})).data });
  const { data: doctorsRes } = useQuery({ queryKey: ['doctors'], queryFn: async () => (await doctorsAPI.getAll({})).data });

  const appointments = appointmentsResponse?.items || [];
  const patients = patientsRes?.items || [];
  const doctors: any[] = doctorsRes?.items ?? doctorsRes ?? [];

  const { register, handleSubmit, reset, setValue } = useForm();

  const createMutation = useMutation({
    mutationFn: (data: any) => appointmentsAPI.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['appointments'] }); setIsCreateOpen(false); reset(); },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      appointmentsAPI.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  });

  const onSubmit = (data: any) => createMutation.mutate(data);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Lịch hẹn</h1>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#0ea5e9] hover:bg-[#0284c7]"><Plus className="mr-2 h-4 w-4" /> Đặt lịch mới</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Đặt lịch khám mới</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Bệnh nhân</Label>
                <Select onValueChange={(val) => setValue('patient_id', val)}>
                  <SelectTrigger><SelectValue placeholder="Chọn bệnh nhân..." /></SelectTrigger>
                  <SelectContent>
                    {patients.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>{p.full_name} ({p.patient_code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Bác sĩ</Label>
                <Select onValueChange={(val) => setValue('doctor_id', val)}>
                  <SelectTrigger><SelectValue placeholder="Chọn bác sĩ..." /></SelectTrigger>
                  <SelectContent>
                    {doctors.map((d: any) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.staff?.full_name ?? d.full_name ?? 'N/A'} ({d.specialty?.name ?? 'Đa khoa'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Ngày khám</Label><Input type="date" {...register('appointment_date', { required: true })} /></div>
                <div className="space-y-2"><Label>Giờ khám</Label><Input type="time" {...register('start_time', { required: true })} /></div>
              </div>
              <div className="space-y-2"><Label>Lý do khám</Label><Input {...register('reason', { required: true })} placeholder="Đau đầu, chóng mặt..." /></div>
              <Button type="submit" className="w-full bg-[#0ea5e9] hover:bg-[#0284c7]" disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Lưu Lịch Hẹn
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Tìm mã lịch, bệnh nhân..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <Input type="date" className="w-40" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
            </div>
            <Tabs value={view} onValueChange={setView} className="w-[200px]">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="list"><List className="w-4 h-4 mr-2" /> Danh sách</TabsTrigger>
                <TabsTrigger value="calendar"><CalendarIcon className="w-4 h-4 mr-2" /> Lịch</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {view === 'list' ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã Lịch</TableHead>
                    <TableHead>Giờ</TableHead>
                    <TableHead>Bệnh Nhân</TableHead>
                    <TableHead>Bác Sĩ</TableHead>
                    <TableHead>Lý do</TableHead>
                    <TableHead>Trạng Thái</TableHead>
                    <TableHead className="text-right">Thao Tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={7} className="text-center h-24">Đang tải...</TableCell></TableRow>
                  ) : appointments.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center h-24">Không có lịch hẹn nào.</TableCell></TableRow>
                  ) : (
                    appointments.map((apt: any) => {
                      const statusCfg = STATUS_LABELS[apt.status] ?? { label: apt.status, color: 'bg-slate-100 text-slate-600' };
                      const canUpdate = !['cancelled', 'paid'].includes(apt.status);
                      return (
                        <TableRow key={apt.id}>
                          <TableCell className="font-medium font-mono">{apt.appointment_code}</TableCell>
                          <TableCell className="font-bold text-[#1e3a5f] dark:text-blue-300">{apt.start_time?.slice(0, 5)}</TableCell>
                          <TableCell>
                            <div>{apt.patient?.full_name}</div>
                            <div className="text-xs text-slate-400">{apt.patient?.phone}</div>
                          </TableCell>
                          <TableCell>{apt.doctor?.staff?.full_name ?? apt.doctor?.full_name ?? 'N/A'}</TableCell>
                          <TableCell className="text-slate-500 max-w-[120px] truncate">{apt.reason}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusCfg.color}`}>
                              {statusCfg.label}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            {canUpdate ? (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" disabled={updateStatusMutation.isPending}>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: apt.id, status: 'waiting' })}>
                                    <Clock className="mr-2 h-4 w-4 text-amber-500" /> Chờ khám
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: apt.id, status: 'in_consultation' })}>
                                    <Play className="mr-2 h-4 w-4 text-purple-500" /> Vào khám
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: apt.id, status: 'completed' })}>
                                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Hoàn thành
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: apt.id, status: 'paid' })}>
                                    <CreditCard className="mr-2 h-4 w-4 text-teal-500" /> Đã thanh toán
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-red-600" onClick={() => updateStatusMutation.mutate({ id: apt.id, status: 'cancelled' })}>
                                    <XCircle className="mr-2 h-4 w-4" /> Hủy lịch
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            ) : (
                              <span className="text-xs text-slate-400 px-3">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="h-[500px] border rounded-md bg-slate-50 dark:bg-slate-900 p-4 overflow-y-auto">
              <div className="grid grid-cols-7 gap-4 text-center font-semibold mb-4 text-sm text-slate-600 dark:text-slate-400">
                {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => <div key={d}>{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 35 }).map((_, i) => {
                  const currentDay = addDays(startOfMonth(new Date()), i);
                  const formattedDay = format(currentDay, 'yyyy-MM-dd');
                  const dayApts = appointments.filter((a: any) => a.appointment_date === formattedDay);
                  const isToday = isSameDay(currentDay, new Date());
                  return (
                    <div key={i} className={`h-24 border rounded-md p-1 ${isToday ? 'bg-blue-50 border-blue-300 dark:bg-blue-900/30' : 'bg-white dark:bg-slate-800'}`}>
                      <div className={`text-xs font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-slate-500'}`}>{format(currentDay, 'd')}</div>
                      <div className="space-y-0.5 overflow-y-auto max-h-[60px]">
                        {dayApts.map((a: any) => (
                          <div key={a.id} className="text-[10px] bg-[#0ea5e9] text-white p-0.5 rounded truncate" title={`${a.start_time} - ${a.patient?.full_name}`}>
                            {a.start_time?.slice(0, 5)} {a.patient?.full_name}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
