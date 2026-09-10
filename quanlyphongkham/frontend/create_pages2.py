import os

files = {
    r'd:\Website_Antigravity\DU_LIEU\Quanlyphongkham\quanlyphongkham\frontend\src\pages\appointments\AppointmentsList.tsx': '''import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, List, Calendar as CalendarIcon, MoreHorizontal } from 'lucide-react';

const mockAppointments = [
  { id: 'a001', code: 'LH123456', patient: 'Nguyễn Văn Minh', doctor: 'BS. Hương', specialty: 'Tim mạch', date: '2026-08-25', time: '08:00', status: 'waiting', reason: 'Đau ngực' },
  { id: 'a002', code: 'LH123457', patient: 'Trần Thị Lan', doctor: 'BS. Bình', specialty: 'Da liễu', date: '2026-08-25', time: '08:30', status: 'consultation', reason: 'Mụn' },
  { id: 'a003', code: 'LH123458', patient: 'Lê Quang Hùng', doctor: 'BS. Phương', specialty: 'Nội khoa', date: '2026-08-25', time: '09:00', status: 'scheduled', reason: 'Khám định kỳ' },
  { id: 'a004', code: 'LH123459', patient: 'Phạm Thị Hoa', doctor: 'BS. Lan', specialty: 'Nhi khoa', date: '2026-08-25', time: '09:30', status: 'completed', reason: 'Sốt' },
  { id: 'a005', code: 'LH123460', patient: 'Võ Thanh Tùng', doctor: 'BS. Hương', specialty: 'Tim mạch', date: '2026-08-25', time: '10:00', status: 'paid', reason: 'Tái khám' },
];

export default function AppointmentsList() {
  const [view, setView] = useState('list');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Lịch hẹn</h1>
        <Button className="bg-[#0ea5e9] hover:bg-[#0284c7]"><Plus className="mr-2 h-4 w-4" /> Đặt lịch mới</Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Tìm mã lịch, bệnh nhân..." className="pl-8" />
              </div>
              <Input type="date" className="w-40" defaultValue="2026-08-25" />
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
                    <TableHead>Chuyên Khoa</TableHead>
                    <TableHead>Trạng Thái</TableHead>
                    <TableHead className="text-right">Thao Tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockAppointments.map((apt) => (
                    <TableRow key={apt.id}>
                      <TableCell className="font-medium">{apt.code}</TableCell>
                      <TableCell className="font-bold text-[#1e3a5f]">{apt.time}</TableCell>
                      <TableCell>{apt.patient}</TableCell>
                      <TableCell>{apt.doctor}</TableCell>
                      <TableCell>{apt.specialty}</TableCell>
                      <TableCell>
                        <Badge variant={apt.status as any}>{apt.status === 'scheduled' ? 'Đã đặt' : apt.status === 'waiting' ? 'Đang chờ' : apt.status === 'consultation' ? 'Đang khám' : apt.status === 'completed' ? 'Hoàn thành' : 'Đã thu'}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="h-[500px] flex items-center justify-center border rounded-md text-muted-foreground bg-slate-50">
              <p>Calendar View đang được xây dựng</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
''',

    r'd:\Website_Antigravity\DU_LIEU\Quanlyphongkham\quanlyphongkham\frontend\src\pages\emr\EMRWorkspace.tsx': '''import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Activity, Clock, FileSignature, AlertCircle, Bot, Lock } from 'lucide-react';

export default function EMRWorkspace() {
  const patient = { name: 'Nguyễn Văn Minh', age: 41, code: 'BN001234', blood: 'A+', gender: 'Nam' };
  
  return (
    <div className="flex h-[calc(100vh-6rem)] gap-4 overflow-hidden -m-2">
      {/* Sidebar Queue */}
      <div className="w-72 bg-white border rounded-xl shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b bg-slate-50"><h3 className="font-bold text-[#1e3a5f]">Hàng Đợi (Hôm nay)</h3></div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg shadow-sm">
            <div className="flex justify-between items-start mb-1">
              <span className="font-bold text-purple-900">{patient.name}</span>
              <span className="text-xs font-medium text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">08:00</span>
            </div>
            <p className="text-xs text-purple-600 mb-2">Đang khám</p>
          </div>
          
          {[ { name: 'Dương Thị Ngọc', time: '09:00', wait: '12p' }, { name: 'Trịnh Văn Nam', time: '10:00', wait: '-' } ].map((p, i) => (
            <div key={i} className="p-3 border rounded-lg hover:bg-slate-50 cursor-pointer">
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium text-slate-800">{p.name}</span>
                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{p.time}</span>
              </div>
              <p className="text-xs text-amber-600 flex items-center gap-1"><Clock className="w-3 h-3" /> Chờ: {p.wait}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main EMR Area */}
      <div className="flex-1 bg-white border rounded-xl shadow-sm flex flex-col overflow-hidden">
        {/* Patient Header */}
        <div className="p-4 border-b flex justify-between items-start bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-[#1e3a5f]">{patient.name} <span className="text-sm font-normal text-slate-500 ml-2">{patient.age} tuổi • {patient.gender} • {patient.code}</span></h2>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">Nhóm máu: {patient.blood}</Badge>
              <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50"><AlertCircle className="w-3 h-3 mr-1"/> Dị ứng: Penicillin</Badge>
            </div>
          </div>
          <Button variant="outline" className="border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100"><Bot className="w-4 h-4 mr-2" /> AI Tóm Tắt BA</Button>
        </div>

        {/* EMR Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1"><label className="text-xs font-medium text-slate-500">Huyết áp (mmHg)</label><Input placeholder="120/80" defaultValue="145/92" className="bg-slate-50" /></div>
            <div className="space-y-1"><label className="text-xs font-medium text-slate-500">Nhịp tim (bpm)</label><Input placeholder="80" defaultValue="78" className="bg-slate-50" /></div>
            <div className="space-y-1"><label className="text-xs font-medium text-slate-500">Nhiệt độ (°C)</label><Input placeholder="37" defaultValue="36.8" className="bg-slate-50" /></div>
            <div className="space-y-1"><label className="text-xs font-medium text-slate-500">SpO2 (%)</label><Input placeholder="98" defaultValue="98" className="bg-slate-50" /></div>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#1e3a5f]">Lý do khám</label>
            <Textarea placeholder="Triệu chứng chính..." defaultValue="Bệnh nhân thấy đau tức ngực nhẹ, mệt mỏi" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#1e3a5f]">Ghi chú lâm sàng</label>
            <Textarea placeholder="Khám thực thể..." className="min-h-[120px]" defaultValue="Tim nhịp đều, T1 T2 rõ. Phổi không ran. Huyết áp cao 145/92." />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#1e3a5f]">Chẩn đoán (ICD-10)</label>
            <div className="flex gap-2 mb-2">
              <Input placeholder="Tìm kiếm mã ICD-10 hoặc tên bệnh..." className="flex-1" />
              <Button variant="secondary">Thêm</Button>
            </div>
            <div className="p-3 border rounded-lg bg-blue-50/50 flex justify-between items-center">
              <div>
                <span className="font-bold text-[#1e3a5f] mr-2">I10</span>
                <span className="text-slate-700">Tăng huyết áp nguyên phát</span>
              </div>
              <Badge variant="default" className="bg-[#0ea5e9]">Bệnh chính</Badge>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#1e3a5f]">Hướng xử trí / Kế hoạch điều trị</label>
            <Textarea placeholder="Kế hoạch..." defaultValue="Tiếp tục uống thuốc huyết áp cũ, điều chỉnh chế độ ăn giảm muối." />
          </div>
        </div>

        {/* Action Bar */}
        <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
          <Button variant="outline">Lưu nháp</Button>
          <Button className="bg-[#1e3a5f] hover:bg-[#152943]"><FileSignature className="w-4 h-4 mr-2"/> Ký Số & Khóa Hồ Sơ</Button>
        </div>
      </div>
    </div>
  );
}
'''
}

for filepath, content in files.items():
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("Created Appointments and EMR Pages")
