import os

files = {
    r'd:\Website_Antigravity\DU_LIEU\Quanlyphongkham\quanlyphongkham\frontend\src\pages\patient\PatientsList.tsx': '''import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Filter, MoreHorizontal, Eye, Edit } from 'lucide-react';

const mockPatients = [
  { id: 'p001', patient_code: 'BN001234', full_name: 'Nguyễn Văn Minh', date_of_birth: '1985-03-15', gender: 'male', phone: '0912345678', insurance_number: 'BH001234567', last_visit: '2026-08-20', is_active: true },
  { id: 'p002', patient_code: 'BN001235', full_name: 'Trần Thị Lan', date_of_birth: '1990-07-22', gender: 'female', phone: '0987654321', insurance_number: null, last_visit: '2026-08-18', is_active: true },
  { id: 'p003', patient_code: 'BN001236', full_name: 'Lê Quang Hùng', date_of_birth: '1978-11-08', gender: 'male', phone: '0901234567', insurance_number: 'BH009876543', last_visit: '2026-08-15', is_active: true },
  { id: 'p004', patient_code: 'BN001237', full_name: 'Phạm Thị Hoa', date_of_birth: '1995-04-30', gender: 'female', phone: '0934567890', insurance_number: 'BH005566778', last_visit: '2026-08-22', is_active: true },
  { id: 'p005', patient_code: 'BN001238', full_name: 'Võ Thanh Tùng', date_of_birth: '1970-12-01', gender: 'male', phone: '0945678901', insurance_number: null, last_visit: '2026-07-30', is_active: true },
  { id: 'p006', patient_code: 'BN001239', full_name: 'Đặng Thị Thu', date_of_birth: '1988-06-14', gender: 'female', phone: '0956789012', insurance_number: 'BH002233445', last_visit: '2026-08-10', is_active: true },
  { id: 'p007', patient_code: 'BN001240', full_name: 'Hoàng Minh Đức', date_of_birth: '1965-09-25', gender: 'male', phone: '0967890123', insurance_number: 'BH007788990', last_visit: '2026-08-05', is_active: true },
  { id: 'p008', patient_code: 'BN001241', full_name: 'Ngô Thị Bích', date_of_birth: '1992-02-18', gender: 'female', phone: '0978901234', insurance_number: null, last_visit: '2026-08-23', is_active: true },
  { id: 'p009', patient_code: 'BN001242', full_name: 'Bùi Văn Khoa', date_of_birth: '1983-08-07', gender: 'male', phone: '0989012345', insurance_number: 'BH003344556', last_visit: '2026-08-19', is_active: false },
  { id: 'p010', patient_code: 'BN001243', full_name: 'Dương Thị Ngọc', date_of_birth: '1997-05-20', gender: 'female', phone: '0990123456', insurance_number: 'BH006677889', last_visit: '2026-08-24', is_active: true },
];

export default function PatientsList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Quản lý Bệnh nhân</h1>
        <Button className="bg-[#0ea5e9] hover:bg-[#0284c7]"><Plus className="mr-2 h-4 w-4" /> Thêm Bệnh Nhân</Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo Tên, Mã BN, SĐT..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline"><Filter className="mr-2 h-4 w-4" /> Lọc</Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã BN</TableHead>
                  <TableHead>Họ Tên</TableHead>
                  <TableHead>Ngày Sinh</TableHead>
                  <TableHead>Giới Tính</TableHead>
                  <TableHead>SĐT</TableHead>
                  <TableHead>Trạng Thái</TableHead>
                  <TableHead className="text-right">Thao Tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockPatients.map((patient) => (
                  <TableRow key={patient.id} className="cursor-pointer hover:bg-slate-50" onClick={() => navigate(/patients/)}>
                    <TableCell className="font-medium text-[#1e3a5f]">{patient.patient_code}</TableCell>
                    <TableCell>{patient.full_name}</TableCell>
                    <TableCell>{patient.date_of_birth}</TableCell>
                    <TableCell>{patient.gender === 'male' ? 'Nam' : 'Nữ'}</TableCell>
                    <TableCell>{patient.phone}</TableCell>
                    <TableCell>
                      <Badge variant={patient.is_active ? 'completed' : 'cancelled'}>
                        {patient.is_active ? 'Hoạt động' : 'Tạm ngừng'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); navigate(/patients/); }}><Eye className="h-4 w-4 text-slate-500" /></Button>
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); }}><Edit className="h-4 w-4 text-blue-500" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
''',

    r'd:\Website_Antigravity\DU_LIEU\Quanlyphongkham\quanlyphongkham\frontend\src\pages\patient\PatientDetail.tsx': '''import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, Calendar, FileText, Pill, CreditCard, Edit, AlertTriangle } from 'lucide-react';

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const mockPatient = { id: 'p001', patient_code: 'BN001234', full_name: 'Nguyễn Văn Minh', date_of_birth: '1985-03-15', gender: 'male', phone: '0912345678', email: 'minh.nguyen@email.com', address: '123 Lê Lợi, Q1, TP.HCM', insurance_number: 'BH001234567', blood_type: 'A+', allergies: 'Penicillin, Sulfa drugs', emergency_contact_name: 'Nguyễn Thị Hoa', emergency_contact_phone: '0987654321', is_active: true };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/patients')}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{mockPatient.full_name}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <span>{mockPatient.patient_code}</span>
              <span>•</span>
              <span>{mockPatient.gender === 'male' ? 'Nam' : 'Nữ'}</span>
              <span>•</span>
              <span>{mockPatient.date_of_birth}</span>
              <Badge variant={mockPatient.is_active ? 'completed' : 'cancelled'} className="ml-2">{mockPatient.is_active ? 'Hoạt động' : 'Tạm ngừng'}</Badge>
            </div>
          </div>
        </div>
        <Button className="bg-[#1e3a5f] hover:bg-[#152943]"><Edit className="mr-2 h-4 w-4" /> Sửa thông tin</Button>
      </div>

      {mockPatient.allergies && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-amber-900">Cảnh báo Dị ứng</h4>
            <p className="text-sm mt-1">{mockPatient.allergies}</p>
          </div>
        </div>
      )}

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-slate-100 p-1 rounded-lg">
          <TabsTrigger value="personal" className="data-[state=active]:bg-white"><User className="mr-2 h-4 w-4" /> Cá nhân</TabsTrigger>
          <TabsTrigger value="appointments" className="data-[state=active]:bg-white"><Calendar className="mr-2 h-4 w-4" /> Lịch hẹn</TabsTrigger>
          <TabsTrigger value="emr" className="data-[state=active]:bg-white"><FileText className="mr-2 h-4 w-4" /> Bệnh án</TabsTrigger>
          <TabsTrigger value="prescriptions" className="data-[state=active]:bg-white"><Pill className="mr-2 h-4 w-4" /> Đơn thuốc</TabsTrigger>
          <TabsTrigger value="billing" className="data-[state=active]:bg-white"><CreditCard className="mr-2 h-4 w-4" /> Hóa đơn</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="mt-6">
          <Card>
            <CardHeader><CardTitle>Thông tin chi tiết</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <div><p className="text-sm text-muted-foreground">Điện thoại</p><p className="font-medium">{mockPatient.phone}</p></div>
                <div><p className="text-sm text-muted-foreground">Email</p><p className="font-medium">{mockPatient.email}</p></div>
                <div><p className="text-sm text-muted-foreground">Địa chỉ</p><p className="font-medium">{mockPatient.address}</p></div>
                <div><p className="text-sm text-muted-foreground">Số thẻ BHYT</p><p className="font-medium">{mockPatient.insurance_number || 'Không có'}</p></div>
                <div><p className="text-sm text-muted-foreground">Nhóm máu</p><p className="font-medium text-red-600 font-bold">{mockPatient.blood_type}</p></div>
                <div><p className="text-sm text-muted-foreground">Người liên hệ khẩn cấp</p><p className="font-medium">{mockPatient.emergency_contact_name} - {mockPatient.emergency_contact_phone}</p></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="appointments" className="mt-6">
          <Card><CardContent className="p-6 flex items-center justify-center text-muted-foreground h-40">Chưa có dữ liệu lịch hẹn</CardContent></Card>
        </TabsContent>
        <TabsContent value="emr" className="mt-6">
          <Card><CardContent className="p-6 flex items-center justify-center text-muted-foreground h-40">Chưa có dữ liệu bệnh án</CardContent></Card>
        </TabsContent>
        <TabsContent value="prescriptions" className="mt-6">
          <Card><CardContent className="p-6 flex items-center justify-center text-muted-foreground h-40">Chưa có dữ liệu đơn thuốc</CardContent></Card>
        </TabsContent>
        <TabsContent value="billing" className="mt-6">
          <Card><CardContent className="p-6 flex items-center justify-center text-muted-foreground h-40">Chưa có dữ liệu hóa đơn</CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
''',

    r'd:\Website_Antigravity\DU_LIEU\Quanlyphongkham\quanlyphongkham\frontend\src\pages\doctors\DoctorsList.tsx': '''import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Calendar, Star, Phone } from 'lucide-react';

const mockDoctors = [
  { id: 'd001', name: 'BS. Nguyễn Thị Hương', specialty: 'Tim mạch', department: 'Khoa Tim mạch', phone: '0912000001', email: 'huong.nguyen@clinic.vn', fee: 300000, rating: 4.9, patients_today: 8, status: 'active', schedule: 'T2-T6: 07:30-11:30' },
  { id: 'd002', name: 'BS. Trần Văn Bình', specialty: 'Da liễu', department: 'Khoa Da liễu', phone: '0912000002', email: 'binh.tran@clinic.vn', fee: 250000, rating: 4.7, patients_today: 6, status: 'active', schedule: 'T2-T7: 08:00-12:00' },
  { id: 'd003', name: 'BS. Lê Thị Phương', specialty: 'Nội khoa', department: 'Khoa Nội tổng hợp', phone: '0912000003', email: 'phuong.le@clinic.vn', fee: 200000, rating: 4.8, patients_today: 10, status: 'active', schedule: 'T2-T6: 07:00-11:00' },
  { id: 'd004', name: 'BS. Phạm Minh Tuấn', specialty: 'Chỉnh hình', department: 'Khoa Chỉnh hình', phone: '0912000004', email: 'tuan.pham@clinic.vn', fee: 350000, rating: 4.6, patients_today: 5, status: 'active', schedule: 'T3-T7: 08:00-12:00' },
  { id: 'd005', name: 'BS. Võ Thị Lan', specialty: 'Nhi khoa', department: 'Khoa Nhi', phone: '0912000005', email: 'lan.vo@clinic.vn', fee: 220000, rating: 4.9, patients_today: 12, status: 'active', schedule: 'T2-T6: 07:30-12:00' },
  { id: 'd006', name: 'BS. Đặng Quốc Huy', specialty: 'Thần kinh', department: 'Khoa Thần kinh', phone: '0912000006', email: 'huy.dang@clinic.vn', fee: 280000, rating: 4.5, patients_today: 0, status: 'off', schedule: 'T2-T5: 08:00-12:00' },
];

export default function DoctorsList() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Danh sách Bác sĩ</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Tìm bác sĩ, chuyên khoa..." className="pl-8 bg-white" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockDoctors.map((doc) => (
          <Card key={doc.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-0">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-[#1e3a5f] text-white flex items-center justify-center font-bold text-xl">
                      {doc.name.split(' ').pop()?.[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-[#1e3a5f]">{doc.name}</h3>
                      <p className="text-sm text-[#0ea5e9] font-medium">{doc.specialty}</p>
                    </div>
                  </div>
                  <Badge variant={doc.status === 'active' ? 'completed' : 'cancelled'}>
                    {doc.status === 'active' ? 'Đang làm việc' : 'Nghỉ'}
                  </Badge>
                </div>
                
                <div className="mt-6 space-y-2 text-sm text-slate-600">
                  <div className="flex justify-between"><span className="flex items-center gap-2"><Star className="w-4 h-4 text-amber-500" /> Đánh giá</span><span className="font-medium text-slate-900">{doc.rating} / 5.0</span></div>
                  <div className="flex justify-between"><span className="flex items-center gap-2"><Phone className="w-4 h-4" /> SĐT</span><span>{doc.phone}</span></div>
                  <div className="flex justify-between"><span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Lịch làm việc</span><span>{doc.schedule}</span></div>
                </div>
              </div>
              <div className="bg-slate-50 p-4 border-t flex items-center justify-between">
                <div><p className="text-xs text-slate-500">Phí khám</p><p className="font-bold text-[#1e3a5f]">{doc.fee.toLocaleString()}đ</p></div>
                <div className="space-x-2">
                  <Button variant="outline" size="sm">Xem lịch</Button>
                  <Button size="sm" className="bg-[#0ea5e9] hover:bg-[#0284c7]">Đặt lịch</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
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

print("Created Patients and Doctors Pages")
