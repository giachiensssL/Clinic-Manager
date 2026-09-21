import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { receptionistApi } from '../../services/receptionist';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { ArrowLeft, User, Phone, MapPin, Calendar, Clock } from 'lucide-react';
import { Badge } from '../../components/ui/badge';

export default function ReceptionistPatientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: patient, isLoading } = useQuery({ 
    queryKey: ['receptionist-patient', id], 
    queryFn: () => receptionistApi.getPatient(id!) 
  });

  if (isLoading) return <div>Đang tải thông tin...</div>;
  if (!patient) return <div>Không tìm thấy bệnh nhân.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
        <h2 className="text-2xl font-bold">Hồ sơ Bệnh nhân</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-24 h-24 bg-slate-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <User className="h-10 w-10 text-slate-500" />
              </div>
              <h3 className="text-xl font-bold">{patient.full_name}</h3>
              <p className="text-slate-500 mb-4">{patient.patient_code}</p>
              
              <div className="space-y-3 text-left border-t pt-4 mt-4">
                <div className="flex items-center text-sm"><Calendar className="h-4 w-4 mr-2 text-slate-400" /> Ngày sinh: {patient.date_of_birth}</div>
                <div className="flex items-center text-sm"><User className="h-4 w-4 mr-2 text-slate-400" /> Giới tính: {patient.gender === 'male' ? 'Nam' : 'Nữ'}</div>
                <div className="flex items-center text-sm"><Phone className="h-4 w-4 mr-2 text-slate-400" /> SĐT: {patient.phone}</div>
                <div className="flex items-center text-sm"><MapPin className="h-4 w-4 mr-2 text-slate-400" /> Địa chỉ: {patient.address || 'Chưa cập nhật'}</div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Lịch sử khám</CardTitle></CardHeader>
            <CardContent>
               <div className="text-center py-8 text-slate-500">
                  <Clock className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                  <p>Tính năng xem lịch sử chi tiết đang được nâng cấp.</p>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
