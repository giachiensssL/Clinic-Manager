import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Stethoscope, Star, Clock, Calendar, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { doctorsAPI } from '@/services/api';
import { Doctor } from '@/types';

const DAY_NAMES = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

export default function DoctorsList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [scheduleDoctor, setScheduleDoctor] = useState<Doctor | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => doctorsAPI.getAll().then(r => r.data),
  });

  const doctors: Doctor[] = data?.items ?? data ?? [];

  const filtered = doctors.filter(d => {
    const name = d.staff?.full_name ?? '';
    const specialty = d.specialty?.name ?? '';
    const dept = d.department?.name ?? '';
    const q = search.toLowerCase();
    return name.toLowerCase().includes(q) || specialty.toLowerCase().includes(q) || dept.toLowerCase().includes(q);
  });

  const formatCurrency = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

  const handleBooking = (doctor: Doctor) => {
    navigate('/appointments', { state: { preselectedDoctorId: doctor.id } });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Danh sách Bác sĩ</h1>
          <p className="text-sm text-slate-500 mt-1">
            {filtered.length} bác sĩ đang hoạt động
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Tìm bác sĩ, chuyên khoa..."
          className="pl-9"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 animate-pulse h-64" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Stethoscope className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>Không tìm thấy bác sĩ nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(doctor => (
            <div
              key={doctor.id}
              className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow"
            >
              {/* Avatar */}
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                  <Stethoscope className="w-7 h-7 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                    {doctor.staff?.full_name ?? 'N/A'}
                  </h3>
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {doctor.specialty?.name ?? 'Chưa phân chuyên khoa'}
                  </Badge>
                </div>
              </div>

              {/* Info */}
              <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300 mb-4">
                <div className="flex items-center gap-2">
                  <Star className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                  <span>{doctor.qualification ?? 'Bác sĩ'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span>{doctor.department?.name ?? 'Khoa chưa rõ'}</span>
                </div>
                {doctor.staff?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>{doctor.staff.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {formatCurrency(doctor.consultation_fee)} / lần khám
                  </span>
                </div>
              </div>

              {/* Status */}
              <div className="mb-4">
                <Badge className={doctor.is_active
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-700'
                }>
                  {doctor.is_active ? '● Đang làm việc' : '● Nghỉ'}
                </Badge>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setScheduleDoctor(doctor)}
                >
                  <Clock className="w-3.5 h-3.5 mr-1.5" />
                  Xem lịch
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  disabled={!doctor.is_active}
                  onClick={() => handleBooking(doctor)}
                >
                  <Calendar className="w-3.5 h-3.5 mr-1.5" />
                  Đặt lịch
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule Dialog */}
      <Dialog open={!!scheduleDoctor} onOpenChange={() => setScheduleDoctor(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Lịch làm việc — {scheduleDoctor?.staff?.full_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="text-sm text-slate-500 mb-4">
              <span className="font-medium text-slate-700 dark:text-slate-200">Chuyên khoa:</span>{' '}
              {scheduleDoctor?.specialty?.name} · {scheduleDoctor?.department?.name}
            </div>
            {[0, 1, 2, 3, 4, 5].map(day => (
              <div
                key={day}
                className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0"
              >
                <span className="font-medium text-sm text-slate-700 dark:text-slate-200 w-20">
                  {DAY_NAMES[day]}
                </span>
                <span className="text-sm text-green-600 dark:text-green-400">
                  07:30 – 17:00
                </span>
              </div>
            ))}
            <p className="text-xs text-slate-400 pt-2">
              * Lịch cụ thể có thể thay đổi. Vui lòng liên hệ lễ tân để xác nhận.
            </p>
          </div>
          <Button className="w-full mt-2" onClick={() => {
            setScheduleDoctor(null);
            if (scheduleDoctor) handleBooking(scheduleDoctor);
          }}>
            <Calendar className="w-4 h-4 mr-2" />
            Đặt lịch với bác sĩ này
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
