import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Calendar, FlaskConical, Pill, Settings, AlertCircle, Info } from 'lucide-react';
import { notificationsAPI } from '@/services/api';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  reference_id?: string;
  created_at: string;
}

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  appointment: { icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-100' },
  lab_result: { icon: FlaskConical, color: 'text-purple-600', bg: 'bg-purple-100' },
  prescription: { icon: Pill, color: 'text-green-600', bg: 'bg-green-100' },
  billing: { icon: Info, color: 'text-amber-600', bg: 'bg-amber-100' },
  system: { icon: Settings, color: 'text-slate-600', bg: 'bg-slate-100' },
};

const routeMap: Record<string, string> = {
  appointment: '/doctor/appointments',
  lab_result: '/doctor/lab-results',
  prescription: '/doctor/prescriptions',
  billing: '/doctor/reports',
  system: '/doctor/settings',
};

function timeAgo(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return `${diff} giây trước`;
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
}

export default function DoctorNotifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await notificationsAPI.list({ page: 1, size: 50 });
      setNotifications(res.data.items || []);
    } catch {
      setError('Không thể tải thông báo. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch { /* silent */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch { /* silent */ }
  };

  const handleClick = (notif: Notification) => {
    handleMarkRead(notif.id);
    const route = routeMap[notif.type] || '/doctor';
    navigate(route);
  };

  const filtered = filter === 'unread' ? notifications.filter(n => !n.is_read) : notifications;
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Thông báo</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Tất cả đã đọc'}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Đánh dấu tất cả đã đọc
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        {(['all', 'unread'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
              filter === f ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            {f === 'all' ? 'Tất cả' : `Chưa đọc (${unreadCount})`}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="bg-white rounded-xl p-4 flex gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-red-600 text-sm">{error}</p>
          <button onClick={fetchNotifications} className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
            Thử lại
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">
            {filter === 'unread' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo nào'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
          {filtered.map(notif => {
            const cfg = typeConfig[notif.type] || typeConfig.system;
            const Icon = cfg.icon;
            return (
              <div
                key={notif.id}
                onClick={() => handleClick(notif)}
                className={cn(
                  'flex items-start gap-3 p-4 cursor-pointer transition-colors hover:bg-slate-50',
                  !notif.is_read && 'bg-blue-50/40'
                )}
              >
                {/* Icon */}
                <div className={cn('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0', cfg.bg)}>
                  <Icon className={cn('w-5 h-5', cfg.color)} />
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm', !notif.is_read ? 'font-semibold text-slate-800' : 'font-medium text-slate-700')}>
                    {notif.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.message}</p>
                  <p className="text-xs text-slate-400 mt-1">{timeAgo(notif.created_at)}</p>
                </div>
                {/* Unread dot */}
                {!notif.is_read && (
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
