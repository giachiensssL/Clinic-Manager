import { Card, CardContent } from '@/components/ui/card';
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
