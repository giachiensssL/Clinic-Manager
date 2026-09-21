import { BarChart3, TrendingUp, Users, Calendar, AlertCircle, CheckCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DoctorReports() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Báo cáo & Thống kê</h1>
          <p className="text-sm text-slate-500 mt-1">Tổng quan hoạt động khám chữa bệnh của bạn</p>
        </div>
        <div className="flex gap-2">
          <select className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-blue-400">
            <option>7 ngày qua</option>
            <option>30 ngày qua</option>
            <option>Tháng này</option>
            <option>Năm nay</option>
          </select>
          <button 
            onClick={() => toast.success('Đang xuất báo cáo ra file Excel...')}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            Xuất báo cáo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Tổng lượt khám', value: '142', icon: Users, trend: '+12%', trendUp: true },
          { label: 'Hoàn thành', value: '128', icon: CheckCheck, trend: '+8%', trendUp: true },
          { label: 'Hủy hẹn', value: '14', icon: AlertCircle, trend: '-2%', trendUp: false },
          { label: 'Doanh thu khám', value: '28.4M', icon: TrendingUp, trend: '+15%', trendUp: true },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">{stat.label}</p>
                  <h3 className="text-2xl font-bold text-slate-800">{stat.value}</h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${stat.trendUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {stat.trend}
                </span>
                <span className="text-xs text-slate-400">so với kỳ trước</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 min-h-[300px] flex flex-col">
          <h3 className="font-semibold text-slate-800 mb-6">Lượt khám theo ngày</h3>
          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-100 rounded-lg bg-slate-50">
            <div className="text-center text-slate-400">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Biểu đồ đang được cập nhật</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-slate-200 min-h-[300px] flex flex-col">
          <h3 className="font-semibold text-slate-800 mb-6">Phân bố bệnh nhân theo độ tuổi</h3>
          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-100 rounded-lg bg-slate-50">
            <div className="text-center text-slate-400">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Biểu đồ đang được cập nhật</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

