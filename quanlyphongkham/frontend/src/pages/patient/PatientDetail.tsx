import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, Calendar, FileText, Pill, CreditCard, Edit, AlertTriangle, Loader2 } from 'lucide-react';
import { patientsAPI, emrAPI, prescriptionsAPI, billingAPI } from '@/services/api';

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await patientsAPI.getById(id);
      return res.data;
    },
    enabled: !!id
  });

  const { data: emrData } = useQuery({
    queryKey: ['patient-emr', id],
    queryFn: async () => {
      const res = await emrAPI.getByPatient(id!);
      return res.data;
    },
    enabled: !!id
  });

  const { data: prescriptionsData } = useQuery({
    queryKey: ['patient-prescriptions', id],
    queryFn: async () => {
      const res = await prescriptionsAPI.getAll({ patient_id: id });
      return res.data;
    },
    enabled: !!id
  });

  const { data: billingData } = useQuery({
    queryKey: ['patient-billing', id],
    queryFn: async () => {
      const res = await billingAPI.getAll({ patient_id: id });
      return res.data;
    },
    enabled: !!id
  });

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8" /></div>;
  }

  if (!patient) {
    return <div>Không tìm thấy thông tin bệnh nhân.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/patients')}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{patient.full_name}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <span>{patient.patient_code}</span>
              <span>•</span>
              <span>{patient.gender === 'male' ? 'Nam' : patient.gender === 'female' ? 'Nữ' : 'Khác'}</span>
              <span>•</span>
              <span>{patient.date_of_birth}</span>
              <Badge variant={patient.is_active ? 'completed' : 'cancelled' as any} className="ml-2">{patient.is_active ? 'Hoạt động' : 'Tạm ngừng'}</Badge>
            </div>
          </div>
        </div>
        <Button className="bg-[#1e3a5f] hover:bg-[#152943]"><Edit className="mr-2 h-4 w-4" /> Sửa thông tin</Button>
      </div>

      {patient.allergies && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-amber-900">Cảnh báo Dị ứng</h4>
            <p className="text-sm mt-1">{patient.allergies}</p>
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
                <div><p className="text-sm text-muted-foreground">Điện thoại</p><p className="font-medium">{patient.phone}</p></div>
                <div><p className="text-sm text-muted-foreground">Email</p><p className="font-medium">{patient.email}</p></div>
                <div><p className="text-sm text-muted-foreground">Địa chỉ</p><p className="font-medium">{patient.address}</p></div>
                <div><p className="text-sm text-muted-foreground">Số thẻ BHYT</p><p className="font-medium">{patient.insurance_number || 'Không có'}</p></div>
                <div><p className="text-sm text-muted-foreground">Nhóm máu</p><p className="font-medium text-red-600 font-bold">{patient.blood_type}</p></div>
                <div><p className="text-sm text-muted-foreground">Người liên hệ khẩn cấp</p><p className="font-medium">{patient.emergency_contact_name} - {patient.emergency_contact_phone}</p></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="appointments" className="mt-6">
          <Card>
            <CardContent className="p-6">
              {patient.appointments?.length > 0 ? (
                <div className="space-y-4">
                  {patient.appointments.map((apt: any) => (
                    <div key={apt.id} className="p-4 border rounded-lg hover:bg-slate-50 flex justify-between items-center">
                      <div>
                        <div className="font-medium text-[#1e3a5f]">{apt.appointment_date} • {apt.start_time}</div>
                        <div className="text-sm text-slate-500 mt-1">Bác sĩ: {apt.doctor?.full_name || 'Đang cập nhật'}</div>
                        <div className="text-sm text-slate-500">Lý do: {apt.reason}</div>
                      </div>
                      <Badge variant={apt.status === 'completed' || apt.status === 'paid' ? 'completed' : 'outline' as any}>
                        {apt.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center text-muted-foreground h-40">Chưa có dữ liệu lịch hẹn</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="emr" className="mt-6">
          <Card>
            <CardContent className="p-6">
              {emrData?.items?.length > 0 ? (
                <div className="space-y-4">
                  {emrData.items.map((emr: any) => (
                    <div key={emr.id} className="p-4 border rounded-lg hover:bg-slate-50 flex justify-between items-center">
                      <div>
                        <div className="font-medium text-[#1e3a5f]">Ngày khám: {new Date(emr.created_at).toLocaleDateString('vi-VN')}</div>
                        <div className="text-sm text-slate-500 mt-1">Lý do: {emr.chief_complaint || 'Không có'}</div>
                      </div>
                      <Badge variant={emr.status === 'locked' ? 'completed' : 'outline' as any}>
                        {emr.status === 'locked' ? 'Đã khóa' : 'Nháp'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center text-muted-foreground h-40">Chưa có hồ sơ bệnh án</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="prescriptions" className="mt-6">
          <Card>
            <CardContent className="p-6">
              {prescriptionsData?.items?.length > 0 ? (
                <div className="space-y-4">
                  {prescriptionsData.items.map((rx: any) => (
                    <div key={rx.id} className="p-4 border rounded-lg hover:bg-slate-50 flex justify-between items-center">
                      <div>
                        <div className="font-medium text-[#1e3a5f]">Mã đơn: {rx.prescription_code}</div>
                        <div className="text-sm text-slate-500 mt-1">Bác sĩ: {rx.doctor_name} • Ngày: {new Date(rx.created_at).toLocaleDateString('vi-VN')}</div>
                        <div className="text-sm text-slate-500">Số lượng loại thuốc: {rx.items_count}</div>
                      </div>
                      <Badge variant={rx.status === 'dispensed' ? 'completed' : 'outline' as any}>
                        {rx.status === 'dispensed' ? 'Đã phát' : 'Chờ phát'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center text-muted-foreground h-40">Chưa có đơn thuốc</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="billing" className="mt-6">
          <Card>
            <CardContent className="p-6">
              {billingData?.items?.length > 0 ? (
                <div className="space-y-4">
                  {billingData.items.map((b: any) => (
                    <div key={b.id} className="p-4 border rounded-lg hover:bg-slate-50 flex justify-between items-center">
                      <div>
                        <div className="font-medium text-[#1e3a5f]">Hóa đơn: {b.invoice_code}</div>
                        <div className="text-sm text-slate-500 mt-1">Tổng tiền: {b.total_amount.toLocaleString()} VND</div>
                        <div className="text-sm text-slate-500">Còn nợ: {b.remaining_amount.toLocaleString()} VND</div>
                      </div>
                      <Badge className={b.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                        {b.status === 'paid' ? 'Đã thanh toán' : b.status === 'partially_paid' ? 'Thanh toán 1 phần' : 'Chưa thanh toán'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center text-muted-foreground h-40">Chưa có hóa đơn</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
