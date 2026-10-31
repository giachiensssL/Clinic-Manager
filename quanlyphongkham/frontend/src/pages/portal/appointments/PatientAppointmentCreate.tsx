import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doctorsAPI, appointmentsAPI } from '@/services/api';
import { Calendar, User, Clock, CheckCircle2, ChevronRight, MapPin, Stethoscope } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function PatientAppointmentCreate() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [step, setStep] = useState(1); // 1: Khoa, 2: Bác sĩ, 3: Ngày giờ, 4: Xác nhận, 5: Thành công
  const [doctors, setDoctors] = useState<any[]>([]);
  const [specialtiesList, setSpecialtiesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState<string>('');
  
  // Form State
  const [selectedSpecialty, setSelectedSpecialty] = useState<any>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  
  const [slots, setSlots] = useState<{time: string, is_available: boolean}[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [doctorSchedules, setDoctorSchedules] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedDoctor) {
      doctorsAPI.getById(selectedDoctor.id).then(res => {
        setDoctorSchedules(res.data.working_schedules || []);
      }).catch(err => console.error(err));
    } else {
      setDoctorSchedules([]);
    }

    if (selectedDoctor && selectedDate) {
      fetchSlots(selectedDoctor.id, selectedDate);
    } else {
      setSlots([]);
    }
    setSelectedTime('');
  }, [selectedDoctor, selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    setDataError('');
    try {
      const [docRes, specRes] = await Promise.allSettled([
        doctorsAPI.getAll(),
        doctorsAPI.getSpecialties(),
      ]);

      let loadedDocs: any[] = [];
      if (docRes.status === 'fulfilled') {
        loadedDocs = Array.isArray(docRes.value.data) ? docRes.value.data : (docRes.value.data?.items || []);
        setDoctors(loadedDocs);
      }

      let loadedSpecs: any[] = [];
      if (specRes.status === 'fulfilled') {
        loadedSpecs = Array.isArray(specRes.value.data) ? specRes.value.data : (specRes.value.data?.items || []);
      }

      // If specialties endpoint wasn't reached or returned empty, extract from doctors
      if (loadedSpecs.length === 0 && loadedDocs.length > 0) {
        loadedSpecs = Array.from(
          new Map(
            loadedDocs
              .filter(d => d.specialty)
              .map(d => [d.specialty.id, d.specialty])
          ).values()
        );
      }

      // Fallback standard clinic specialties if server returned empty
      if (loadedSpecs.length === 0) {
        loadedSpecs = [
          { id: 'd9a2b5a3-1499-423f-a6b2-0a831cf48980', name: 'Nội khoa', description: 'Khám và điều trị các bệnh lý nội tổng quát' },
          { id: 'a9097453-9b9e-4dbb-882c-7d1041b11277', name: 'Da liễu', description: 'Chuyên khoa da liễu, thẩm mỹ và dị ứng da' },
          { id: '0e53b66d-e6b1-49f3-8f75-daa5a4f7fb7f', name: 'Nhi khoa', description: 'Khám, tầm soát và tư vấn sức khỏe cho trẻ em' },
          { id: '35142b1e-128a-4606-a79c-520ce29510a6', name: 'Tim mạch', description: 'Tầm soát, chẩn đoán và điều trị bệnh lý tim mạch' },
          { id: '308ae6d4-7376-4abe-8c48-2edcc79f03a7', name: 'Tai Mũi Họng', description: 'Khám và điều trị các bệnh lý tai mũi họng người lớn và trẻ nhỏ' },
          { id: 'd87055f8-46b5-4bf8-8142-b1fae514fdb4', name: 'Nhãn khoa', description: 'Khám và điều trị các bệnh về mắt và thị lực' },
          { id: '51552edc-9626-4765-b83d-d55bc90ab007', name: 'Cơ xương khớp', description: 'Chẩn đoán và điều trị bệnh lý cơ, xương, khớp, cột sống' },
          { id: '4fc26cf0-f759-4fe8-82be-0923bbe1295a', name: 'Sản phụ khoa', description: 'Chăm sóc sức khỏe sinh sản, khám thai định kỳ' }
        ];
      }

      setSpecialtiesList(loadedSpecs);

      if (docRes.status === 'rejected' && specRes.status === 'rejected') {
        setDataError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại.');
      }
    } catch (err) {
      console.error('Lỗi tải dữ liệu', err);
      setDataError('Có lỗi xảy ra khi tải dữ liệu chuyên khoa.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSlots = async (doctorId: string, date: string) => {
    setLoadingSlots(true);
    try {
      const res = await doctorsAPI.getSlots(doctorId, date);
      setSlots(res.data.slots || []);
    } catch (err) {
      console.error('Lỗi tải danh sách giờ khám', err);
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTime) return;
    setSubmitting(true);
    try {
      let realPatientId = (user as any)?.id; // fallback
      if (user?.role === 'patient') {
        const { patientsAPI } = await import('@/services/api');
        const patRes = await patientsAPI.getMe();
        realPatientId = patRes.data.id;
      }

      const [hour, min] = selectedTime.split(':').map(Number);
      const startD = new Date(); startD.setHours(hour, min);
      const endD = new Date(startD.getTime() + 30 * 60000);
      const endTime = `${endD.getHours().toString().padStart(2, '0')}:${endD.getMinutes().toString().padStart(2, '0')}`;

      await appointmentsAPI.create({
        patient_id: realPatientId,
        doctor_id: selectedDoctor.id,
        specialty_id: selectedDoctor.specialty?.id || selectedDoctor.specialty_id || selectedSpecialty?.id || 'general',
        appointment_date: selectedDate,
        start_time: selectedTime,
        end_time: endTime,
        reason: reason
      });
      
      setStep(5); // Success step
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail : (Array.isArray(detail) ? JSON.stringify(detail) : 'Lỗi khi đặt lịch');
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const specialties = specialtiesList;

  const filteredDoctors = selectedSpecialty 
    ? doctors.filter(d => 
        (d.specialty?.id && d.specialty.id === selectedSpecialty.id) ||
        (d.specialty_id && d.specialty_id === selectedSpecialty.id) ||
        (d.specialty?.name && selectedSpecialty.name && d.specialty.name.toLowerCase() === selectedSpecialty.name.toLowerCase())
      )
    : doctors;

  return (
    <div className="w-full space-y-6 pb-20">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E2E8F0]">
        <h1 className="text-2xl font-bold text-[#0B3B78] mb-1">Đặt lịch khám mới</h1>
        <p className="text-sm text-[#64748B]">Vui lòng làm theo các bước dưới đây để đặt lịch khám.</p>
        
        {/* Progress steps */}
        <div className="flex items-center mt-8 mb-4 max-w-lg mx-auto pl-2">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                step >= s ? 'bg-[#0D6EFD] text-white' : 'bg-slate-100 text-[#94A3B8]'
              }`}>
                {s}
              </div>
              {s < 4 && (
                <div className={`w-10 sm:w-20 h-1 mx-1 sm:mx-2 transition-colors ${
                  step > s ? 'bg-[#0D6EFD]' : 'bg-slate-100'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex text-xs font-medium text-[#64748B] justify-between px-2 w-full max-w-lg mx-auto">
          <span className={step >= 1 ? 'text-[#0D6EFD]' : ''}>Chọn khoa</span>
          <span className={step >= 2 ? 'text-[#0D6EFD]' : ''}>Bác sĩ</span>
          <span className={step >= 3 ? 'text-[#0D6EFD]' : ''}>Thời gian</span>
          <span className={step >= 4 ? 'text-[#0D6EFD]' : ''}>Xác nhận</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-6 md:p-8">
        
        {/* STEP 1: Select Specialty */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-lg font-bold text-[#0B3B78] mb-6 flex items-center gap-2">
               <Stethoscope className="w-5 h-5" /> Vui lòng chọn Chuyên khoa
            </h2>
            
            {dataError && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-sm flex items-center justify-between">
                <span>{dataError}</span>
                <button 
                  onClick={fetchData} 
                  className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 transition-colors"
                >
                  Thử lại
                </button>
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-20 bg-slate-50 animate-pulse rounded-xl border border-[#E2E8F0]" />)}
              </div>
            ) : specialties.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {specialties.map((spec: any) => {
                  const docCount = doctors.filter(d => 
                    (d.specialty?.id && d.specialty.id === spec.id) ||
                    (d.specialty_id && d.specialty_id === spec.id) ||
                    (d.specialty?.name && d.specialty.name.toLowerCase() === spec.name?.toLowerCase())
                  ).length;

                  return (
                    <div 
                      key={spec.id}
                      onClick={() => { setSelectedSpecialty(spec); setSelectedDoctor(null); }}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-2 min-h-[96px] ${
                        selectedSpecialty?.id === spec.id 
                          ? 'border-[#0D6EFD] bg-blue-50/50 shadow-sm ring-1 ring-[#0D6EFD]' 
                          : 'border-[#E2E8F0] hover:border-blue-200 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-[#0B3B78] text-base">{spec.name}</h3>
                        {docCount > 0 && (
                          <span className="text-[11px] font-medium bg-blue-100/70 text-[#0B3B78] px-2 py-0.5 rounded-full shrink-0">
                            {docCount} bác sĩ
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#64748B] line-clamp-2">{spec.description || 'Khám và tư vấn chuyên khoa'}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
               <div className="text-center py-10 text-[#64748B]">
                 <p className="mb-3">Không có chuyên khoa nào khả dụng.</p>
                 <button onClick={fetchData} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100">
                   Tải lại danh sách
                 </button>
               </div>
            )}
            
            <div className="mt-8 flex justify-end">
              <button 
                disabled={!selectedSpecialty}
                onClick={() => setStep(2)}
                className="bg-[#0B3B78] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-sm"
              >
                Tiếp tục <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Select Doctor */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-lg font-bold text-[#0B3B78] mb-6 flex items-center gap-2">
              <User className="w-5 h-5" /> Vui lòng chọn Bác sĩ ({selectedSpecialty?.name})
            </h2>
            
            {filteredDoctors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredDoctors.map(doc => {
                  const fullName = doc.staff?.full_name || doc.full_name || 'Bác sĩ';
                  
                  return (
                  <div 
                    key={doc.id}
                    onClick={() => setSelectedDoctor(doc)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-4 ${
                      selectedDoctor?.id === doc.id 
                        ? 'border-[#0D6EFD] bg-blue-50/50 shadow-sm ring-1 ring-[#0D6EFD]' 
                        : 'border-[#E2E8F0] hover:border-blue-200'
                    }`}
                  >
                    <img 
                      src={doc.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=F1F5F9&color=0B3B78`}
                      className="w-14 h-14 object-cover rounded-full border border-slate-200 shadow-sm"
                      alt={fullName}
                    />
                    <div>
                      <h3 className="font-bold text-[#0B3B78]">{fullName}</h3>
                      <p className="text-xs text-[#0D6EFD] mt-1 font-medium bg-blue-50 inline-block px-2 py-1 rounded">
                        Phí khám: {doc.consultation_fee?.toLocaleString()}đ
                      </p>
                    </div>
                  </div>
                )})}
              </div>
            ) : doctors.length > 0 ? (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 text-[#0B3B78] rounded-xl text-sm">
                  Hiện chưa có bác sĩ trực tiếp của khoa <strong>{selectedSpecialty?.name}</strong>. Bạn có thể chọn khám với một trong các bác sĩ đang trực dưới đây:
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {doctors.map(doc => {
                    const fullName = doc.staff?.full_name || doc.full_name || 'Bác sĩ';
                    return (
                      <div 
                        key={doc.id}
                        onClick={() => setSelectedDoctor(doc)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-4 ${
                          selectedDoctor?.id === doc.id 
                            ? 'border-[#0D6EFD] bg-blue-50/50 shadow-sm ring-1 ring-[#0D6EFD]' 
                            : 'border-[#E2E8F0] hover:border-blue-200'
                        }`}
                      >
                        <img 
                          src={doc.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=F1F5F9&color=0B3B78`}
                          className="w-14 h-14 object-cover rounded-full border border-slate-200 shadow-sm"
                          alt={fullName}
                        />
                        <div>
                          <h3 className="font-bold text-[#0B3B78]">{fullName}</h3>
                          <p className="text-xs text-slate-500">{doc.specialty?.name || 'Bác sĩ trực'}</p>
                          <p className="text-xs text-[#0D6EFD] mt-1 font-medium bg-blue-50 inline-block px-2 py-1 rounded">
                            Phí khám: {doc.consultation_fee?.toLocaleString()}đ
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
               <div className="text-center py-10 text-[#64748B]">Không có bác sĩ nào khả dụng.</div>
            )}
            
            <div className="mt-8 flex justify-between">
              <button 
                onClick={() => setStep(1)}
                className="bg-white border border-[#E2E8F0] text-[#64748B] px-6 py-2.5 rounded-lg font-medium hover:bg-slate-50 transition-colors"
              >
                Quay lại
              </button>
              <button 
                disabled={!selectedDoctor}
                onClick={() => {
                  if (!selectedDate) {
                    const now = new Date();
                    const target = (now.getHours() > 16 || (now.getHours() === 16 && now.getMinutes() >= 30))
                      ? new Date(now.getTime() + 86400000)
                      : now;
                    const y = target.getFullYear();
                    const m = (target.getMonth() + 1).toString().padStart(2, '0');
                    const d = target.getDate().toString().padStart(2, '0');
                    setSelectedDate(`${y}-${m}-${d}`);
                  }
                  setStep(3);
                }}
                className="bg-[#0B3B78] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Tiếp tục <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Select Date & Time */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-lg font-bold text-[#0B3B78] mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5" /> Chọn Ngày và Giờ khám
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-bold text-[#334155] mb-2">Ngày khám</label>
                <input 
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-[#E2E8F0] focus:outline-none focus:border-[#0D6EFD] focus:ring-1 focus:ring-blue-100 text-[#334155] shadow-sm"
                />
                
                {doctorSchedules.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-[#64748B] mb-2 font-medium">Bác sĩ có lịch làm việc giờ hành chính vào các ngày:</p>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(new Set(doctorSchedules.map(s => s.day_of_week)))
                        .sort((a: any, b: any) => a - b)
                        .map(day => {
                        const nextDate = new Date();
                        // Find next occurrence of this day of week
                        const targetDay = day === 6 ? 0 : day + 1; // back to JS day
                        nextDate.setDate(nextDate.getDate() + ((targetDay - nextDate.getDay() + 7) % 7));
                        if (nextDate < new Date()) nextDate.setDate(nextDate.getDate() + 7);
                        
                        // Format in local timezone instead of UTC to avoid timezone shift
                        const y = nextDate.getFullYear();
                        const m = (nextDate.getMonth() + 1).toString().padStart(2, '0');
                        const d = nextDate.getDate().toString().padStart(2, '0');
                        const dateStr = `${y}-${m}-${d}`;
                        
                        const dateFormatted = nextDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
                        const dayName = targetDay === 0 ? 'CN' : `T${targetDay + 1}`;
                        
                        return (
                          <button
                            key={day}
                            onClick={() => setSelectedDate(dateStr)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                              selectedDate === dateStr 
                                ? 'bg-blue-100 border-blue-300 text-[#0B3B78]' 
                                : 'bg-white border-[#E2E8F0] text-[#64748B] hover:border-blue-300'
                            }`}
                          >
                            {dayName} ({dateFormatted})
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {selectedDate && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100 text-[#0B3B78]">
                    <p className="text-sm font-medium">Bác sĩ phụ trách:</p>
                    <div className="flex items-center gap-3 mt-2">
                      <img src={selectedDoctor?.avatar_url} className="w-10 h-10 rounded-full object-cover border border-white shadow-sm" />
                      <div>
                        <p className="font-bold">{selectedDoctor?.staff?.full_name}</p>
                        <p className="text-xs opacity-80">{selectedSpecialty?.name}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-bold text-[#334155]">Giờ khám (Giờ hành chính)</label>
                  <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                    Sáng 08:00 - 12:00 | Chiều 13:30 - 17:00
                  </span>
                </div>
                {!selectedDate ? (
                   <p className="text-sm text-[#64748B] italic">Vui lòng chọn ngày khám ở cột bên trái.</p>
                ) : loadingSlots ? (
                   <div className="flex items-center gap-2 text-sm text-[#64748B] py-6 justify-center">
                     <div className="w-4 h-4 border-2 border-[#0D6EFD] border-t-transparent rounded-full animate-spin"></div> 
                     Đang tải danh sách khung giờ hành chính...
                   </div>
                ) : slots.length === 0 ? (
                   <div className="p-4 bg-amber-50 text-amber-700 rounded-xl border border-amber-200 text-sm">
                      Không có khung giờ khám khả dụng vào ngày này. Vui lòng chọn ngày khác.
                   </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {slots.map((slot) => {
                      const h = parseInt(slot.time.split(':')[0]);
                      const ca = h < 12 ? 'Ca sáng' : 'Ca chiều';
                      return (
                      <button
                        key={slot.time}
                        onClick={() => setSelectedTime(slot.time)}
                        disabled={!slot.is_available}
                        title={!slot.is_available ? 'Đã đặt' : ''}
                        className={`py-2 flex flex-col items-center justify-center rounded-xl border transition-colors ${
                          !slot.is_available 
                            ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed line-through'
                            : selectedTime === slot.time
                              ? 'bg-[#0D6EFD] border-[#0D6EFD] text-white shadow-sm'
                              : 'bg-white border-[#E2E8F0] text-[#334155] hover:border-blue-300 hover:text-blue-600'
                        }`}
                      >
                        <span className="font-bold text-sm sm:text-base">{slot.time}</span>
                        <span className="text-[10px] opacity-80 font-medium">{ca}</span>
                      </button>
                    )})}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <button 
                onClick={() => setStep(2)}
                className="bg-white border border-[#E2E8F0] text-[#64748B] px-6 py-2.5 rounded-lg font-medium hover:bg-slate-50 transition-colors"
              >
                Quay lại
              </button>
              <button 
                disabled={!selectedDate || !selectedTime}
                onClick={() => setStep(4)}
                className="bg-[#0B3B78] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Tiếp tục <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Confirm */}
        {step === 4 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-lg font-bold text-[#0B3B78] mb-6 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" /> Xác nhận thông tin đặt lịch
            </h2>
            
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                <div>
                  <p className="text-xs text-[#64748B] mb-1 uppercase font-bold">Bệnh nhân</p>
                  <p className="font-bold text-[#334155] text-lg">{user?.full_name}</p>
                  <p className="text-sm text-[#64748B]">Tài khoản: {user?.username}</p>
                </div>
                <div>
                  <p className="text-xs text-[#64748B] mb-1 uppercase font-bold">Bác sĩ phụ trách</p>
                  <div className="flex items-center gap-3 mt-1">
                    <img src={selectedDoctor?.avatar_url} className="w-12 h-12 rounded-full object-cover border border-[#E2E8F0]" />
                    <div>
                      <p className="font-bold text-[#334155]">{selectedDoctor?.staff?.full_name || selectedDoctor?.full_name}</p>
                      <p className="text-sm text-[#0D6EFD] font-medium">{selectedSpecialty?.name}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-[#64748B] mb-1 uppercase font-bold">Thời gian</p>
                  <div className="bg-white border border-[#E2E8F0] inline-block px-4 py-2 rounded-lg mt-1">
                    <p className="font-bold text-[#0D6EFD] flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {selectedTime} ({parseInt(selectedTime.split(':')[0]) < 12 ? 'Ca sáng' : 'Ca chiều'})
                    </p>
                    <p className="text-sm text-[#334155] mt-1 font-medium">Ngày {new Date(selectedDate).toLocaleDateString('vi-VN')}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-[#64748B] mb-1 uppercase font-bold">Địa điểm</p>
                  <p className="font-bold text-[#334155] flex items-center gap-2 mt-1">
                    <MapPin className="w-4 h-4 text-red-500" />
                    Phòng khám số 1
                  </p>
                  <p className="text-sm text-[#64748B]">AI Clinic Cơ sở 1</p>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-bold text-[#334155] mb-2">Ghi chú cho bác sĩ / Triệu chứng (Tùy chọn)</label>
              <textarea 
                rows={3}
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Ví dụ: Đau đầu, chóng mặt 2 ngày nay..."
                className="w-full px-4 py-3 rounded-lg border border-[#E2E8F0] focus:outline-none focus:border-[#0D6EFD] focus:ring-1 focus:ring-blue-100 text-[#334155]"
              />
            </div>

            <div className="flex justify-between">
              <button 
                disabled={submitting}
                onClick={() => setStep(3)}
                className="bg-white border border-[#E2E8F0] text-[#64748B] px-6 py-2.5 rounded-lg font-medium hover:bg-slate-50 transition-colors"
              >
                Quay lại
              </button>
              <button 
                disabled={submitting}
                onClick={handleSubmit}
                className="bg-[#0D6EFD] text-white px-8 py-2.5 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-70 flex items-center gap-2 shadow-lg shadow-blue-500/30 transition-all"
              >
                {submitting ? 'Đang xử lý...' : 'Xác nhận đặt lịch'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Success */}
        {step === 5 && (
          <div className="text-center py-12 animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-[#0B3B78] mb-2">Đặt lịch thành công!</h2>
            <p className="text-[#64748B] mb-8 max-w-md mx-auto">
              Cảm ơn bạn đã tin tưởng AI Clinic. Lịch hẹn của bạn đã được ghi nhận trên hệ thống. 
              Vui lòng đến trước 15 phút để làm thủ tục.
            </p>
            
            <div className="flex justify-center gap-4">
              <button 
                onClick={() => navigate('/portal')}
                className="bg-white border border-[#E2E8F0] text-[#334155] px-6 py-2.5 rounded-lg font-medium hover:bg-slate-50 transition-colors"
              >
                Về trang chủ
              </button>
              <button 
                onClick={() => navigate('/portal/appointments')}
                className="bg-[#0B3B78] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-900 transition-colors shadow-sm"
              >
                Xem lịch hẹn
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
