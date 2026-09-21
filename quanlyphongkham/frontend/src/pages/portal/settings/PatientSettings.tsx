import { Settings } from "lucide-react";

export default function PatientSettings() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-8 min-h-[500px]">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#F1F5F9]">
        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#0B3B78]">Cài đặt hệ thống</h1>
          <p className="text-sm text-[#64748B]">Chức năng đang được phát triển hoặc cập nhật dữ liệu.</p>
        </div>
      </div>
      
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <Settings className="w-16 h-16 mb-4 opacity-20" />
        <p>Tính năng Cài đặt hệ thống đang được hoàn thiện.</p>
      </div>
    </div>
  );
}
