import { useState, useEffect } from 'react';
import { notificationsAPI } from '@/services/api';
import { Bell, Check, Trash2, Calendar, Activity, Pill, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function PatientNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await notificationsAPI.list({ size: 50 });
      setNotifications(res.data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'appointment': return <Calendar className="w-5 h-5 text-blue-500" />;
      case 'lab_result': return <Activity className="w-5 h-5 text-teal-500" />;
      case 'prescription': return <Pill className="w-5 h-5 text-amber-500" />;
      default: return <Info className="w-5 h-5 text-slate-500" />;
    }
  };

  const getBg = (type: string) => {
    switch (type) {
      case 'appointment': return 'bg-blue-50 border-blue-100';
      case 'lab_result': return 'bg-teal-50 border-teal-100';
      case 'prescription': return 'bg-amber-50 border-amber-100';
      default: return 'bg-slate-50 border-slate-200';
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-[#E2E8F0]">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0B3B78] mb-1">Thông báo của bạn</h1>
            <p className="text-sm text-[#64748B]">Bạn có <strong className="text-blue-600">{unreadCount}</strong> thông báo chưa đọc.</p>
          </div>
        </div>
        
        {unreadCount > 0 && (
          <button 
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2 text-sm font-medium text-[#64748B] hover:text-[#0B3B78] bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
          >
            <Check className="w-4 h-4" />
            Đánh dấu đọc tất cả
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {[1,2,3,4].map(i => <div key={i} className="h-20 bg-slate-50 animate-pulse rounded-xl" />)}
          </div>
        ) : notifications.length > 0 ? (
          <div className="divide-y divide-[#F1F5F9]">
            {notifications.map(notif => (
              <div 
                key={notif.id} 
                className={`p-5 flex gap-4 transition-colors hover:bg-slate-50 ${!notif.is_read ? 'bg-blue-50/30' : ''}`}
                onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 border ${getBg(notif.type)}`}>
                  {getIcon(notif.type)}
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={`text-sm ${!notif.is_read ? 'font-bold text-[#0B3B78]' : 'font-medium text-[#334155]'}`}>
                      {notif.title}
                    </h3>
                    <span className="text-xs text-[#94A3B8] whitespace-nowrap ml-4">
                      {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: vi })}
                    </span>
                  </div>
                  <p className={`text-sm ${!notif.is_read ? 'text-[#334155]' : 'text-[#64748B]'}`}>
                    {notif.message}
                  </p>
                </div>
                
                {!notif.is_read && (
                  <div className="flex items-center justify-center px-2">
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-[#94A3B8]" />
            </div>
            <h3 className="text-lg font-bold text-[#334155] mb-1">Không có thông báo nào</h3>
            <p className="text-sm text-[#64748B]">Bạn đã xem hết tất cả thông báo.</p>
          </div>
        )}
      </div>
    </div>
  );
}
