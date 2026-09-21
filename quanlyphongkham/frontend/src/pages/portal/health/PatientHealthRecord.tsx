import { useState, useEffect } from "react";
import { FileText, Activity, Thermometer, Weight, Ruler, HeartPulse, Loader2, Calendar } from "lucide-react";
import { emrAPI, patientsAPI } from "@/services/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";

export default function PatientHealthRecord() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<any[]>([]);
  const [vitalsData, setVitalsData] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      // Get patient profile first to get the patient_id
      const meRes = await patientsAPI.getMe();
      const patientId = meRes.data.id;

      // Fetch EMR records
      const emrRes = await emrAPI.getByPatient(patientId);
      const data = emrRes.data?.items || emrRes.data || [];
      
      // Sort desc by date
      const sorted = [...data].sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setRecords(sorted);

      // Prepare vitals for chart (Sort asc for chart)
      const chartData = [...data]
        .filter((r: any) => r.blood_pressure || r.heart_rate || r.weight || r.height)
        .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map((r: any) => {
          let sys = null;
          let dia = null;
          if (r.blood_pressure) {
            const parts = r.blood_pressure.split('/');
            if (parts.length === 2) {
              sys = parseInt(parts[0]);
              dia = parseInt(parts[1]);
            }
          }
          return {
            date: format(parseISO(r.created_at), 'dd/MM/yyyy'),
            timestamp: r.created_at,
            weight: r.weight,
            height: r.height,
            heart_rate: r.heart_rate,
            sys: sys,
            dia: dia,
            temp: r.temperature
          };
        });
      setVitalsData(chartData);
    } catch (err) {
      console.error(err);
      setError("Không thể tải dữ liệu hồ sơ sức khỏe. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center">
        {error}
        <button onClick={fetchData} className="ml-4 underline font-medium">Thử lại</button>
      </div>
    );
  }

  const latestVitals = vitalsData.length > 0 ? vitalsData[vitalsData.length - 1] : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#0B3B78]">Hồ sơ sức khỏe</h1>
      </div>

      {/* Vitals Summary Cards */}
      {latestVitals ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
              <Ruler className="w-5 h-5" />
            </div>
            <p className="text-sm text-slate-500 mb-1">Chiều cao</p>
            <p className="text-xl font-bold text-slate-800">{latestVitals.height ? `${latestVitals.height} cm` : '--'}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-2">
              <Weight className="w-5 h-5" />
            </div>
            <p className="text-sm text-slate-500 mb-1">Cân nặng</p>
            <p className="text-xl font-bold text-slate-800">{latestVitals.weight ? `${latestVitals.weight} kg` : '--'}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-2">
              <Activity className="w-5 h-5" />
            </div>
            <p className="text-sm text-slate-500 mb-1">Huyết áp</p>
            <p className="text-xl font-bold text-slate-800">{latestVitals.sys && latestVitals.dia ? `${latestVitals.sys}/${latestVitals.dia}` : '--'}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center mb-2">
              <HeartPulse className="w-5 h-5" />
            </div>
            <p className="text-sm text-slate-500 mb-1">Nhịp tim</p>
            <p className="text-xl font-bold text-slate-800">{latestVitals.heart_rate ? `${latestVitals.heart_rate} bpm` : '--'}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-2">
              <Thermometer className="w-5 h-5" />
            </div>
            <p className="text-sm text-slate-500 mb-1">Nhiệt độ</p>
            <p className="text-xl font-bold text-slate-800">{latestVitals.temp ? `${latestVitals.temp} °C` : '--'}</p>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl border border-slate-200 text-center text-slate-500">
          Chưa có dữ liệu sinh hiệu.
        </div>
      )}

      {/* Charts */}
      {vitalsData.length > 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Xu hướng Huyết áp
            </h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={vitalsData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="date" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                  <YAxis tick={{fontSize: 12}} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" name="Tâm thu (Sys)" dataKey="sys" stroke="#EF4444" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" name="Tâm trương (Dia)" dataKey="dia" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-pink-500" />
              Nhịp tim & Cân nặng
            </h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={vitalsData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="date" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  <Line yAxisId="left" type="monotone" name="Nhịp tim (bpm)" dataKey="heart_rate" stroke="#EC4899" strokeWidth={2} dot={{ r: 4 }} />
                  <Line yAxisId="right" type="monotone" name="Cân nặng (kg)" dataKey="weight" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* History List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">Lịch sử khám bệnh</h2>
        </div>
        
        {records.length === 0 ? (
          <div className="p-8 text-center text-slate-500 flex flex-col items-center">
            <FileText className="w-12 h-12 text-slate-300 mb-3" />
            <p>Chưa có lịch sử khám bệnh nào.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {records.map((record) => (
              <div key={record.id} className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800">
                        {format(parseISO(record.created_at), "dd/MM/yyyy 'lúc' HH:mm", { locale: vi })}
                      </h4>
                      <p className="text-sm text-slate-500">
                        Bác sĩ: {record.doctor?.full_name || record.doctor?.staff?.full_name || 'Không rõ'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      {record.status === 'completed' ? 'Đã hoàn thành' : record.status}
                    </span>
                  </div>
                </div>

                <div className="pl-13 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-1">Lý do khám / Triệu chứng:</p>
                    <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                      {record.chief_complaint || 'Không có ghi chú'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-1">Hướng dẫn điều trị:</p>
                    <p className="text-sm text-slate-600 bg-blue-50 p-2 rounded border border-blue-100">
                      {record.treatment_plan || 'Không có hướng dẫn'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
