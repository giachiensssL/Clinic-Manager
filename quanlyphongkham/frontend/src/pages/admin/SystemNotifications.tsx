import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Search, Bell, Check, CheckCircle2, Trash2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockSystemNotifications } from '@/mock/adminData';

export default function SystemNotifications() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [notifications, setNotifications] = useState(mockSystemNotifications);
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [newNotif, setNewNotif] = useState({ title: '', content: '', category: 'Hệ thống' });

  const filtered = notifications.filter(n => {
    const matchSearch = n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || 
                        (filter === 'unread' && !n.read) || 
                        (filter === 'read' && n.read) ||
                        n.category === filter;
    return matchSearch && matchFilter;
  });

  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    alert('Đã đánh dấu tất cả thông báo là đã đọc.');
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    setNotifications([{
      id: Date.now(),
      title: newNotif.title,
      content: newNotif.content,
      time: 'Vừa xong',
      read: false,
      category: newNotif.category,
      priority: 'normal'
    }, ...notifications]);
    setIsSendOpen(false);
    setNewNotif({ title: '', content: '', category: 'Hệ thống' });
    alert('Đã gửi thông báo thành công');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Thông báo hệ thống</h1>
          <p className="text-sm text-slate-500 mt-1">Quản lý và theo dõi các cảnh báo từ hệ thống</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={markAllAsRead} className="border-[#1e3a5f] text-[#1e3a5f]">
            <CheckCircle2 className="mr-2 w-4 h-4" /> Đánh dấu tất cả đã đọc
          </Button>
          <Dialog open={isSendOpen} onOpenChange={setIsSendOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#1e3a5f] hover:bg-[#152943]">
                <Send className="mr-2 w-4 h-4" /> Gửi thông báo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Gửi thông báo hệ thống</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSend} className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tiêu đề</label>
                  <Input required value={newNotif.title} onChange={e => setNewNotif({...newNotif, title: e.target.value})} placeholder="VD: Lịch bảo trì hệ thống" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nội dung</label>
                  <Input required value={newNotif.content} onChange={e => setNewNotif({...newNotif, content: e.target.value})} placeholder="Nhập nội dung thông báo..." />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phân loại</label>
                  <Select value={newNotif.category} onValueChange={v => setNewNotif({...newNotif, category: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Hệ thống">Hệ thống</SelectItem>
                      <SelectItem value="Bảo mật">Bảo mật</SelectItem>
                      <SelectItem value="Người dùng">Người dùng</SelectItem>
                      <SelectItem value="Lịch làm việc">Lịch làm việc</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsSendOpen(false)}>Hủy</Button>
                  <Button type="submit" className="bg-[#1e3a5f] hover:bg-[#152943]">Gửi</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row gap-3 rounded-t-lg">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Tìm thông báo..." className="pl-8 bg-white" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[200px] bg-white">
                <SelectValue placeholder="Tất cả thông báo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="unread">Chưa đọc</SelectItem>
                <SelectItem value="read">Đã đọc</SelectItem>
                <SelectItem value="Hệ thống">Hệ thống</SelectItem>
                <SelectItem value="Bảo mật">Bảo mật</SelectItem>
                <SelectItem value="Người dùng">Người dùng</SelectItem>
                <SelectItem value="Lịch làm việc">Lịch làm việc</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-slate-500">Không có thông báo nào.</div>
            ) : (
              filtered.map(n => (
                <div key={n.id} className={cn("p-4 flex gap-4 transition-colors hover:bg-slate-50", !n.read && "bg-blue-50/30")}>
                  <div className="mt-1 flex-shrink-0">
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", 
                      n.category === 'Bảo mật' ? 'bg-red-100 text-red-600' : 
                      n.category === 'Hệ thống' ? 'bg-blue-100 text-blue-600' : 
                      n.category === 'Người dùng' ? 'bg-green-100 text-green-600' :
                      'bg-purple-100 text-purple-600'
                    )}>
                      <Bell className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        <h4 className={cn("text-sm font-semibold truncate", !n.read ? "text-slate-900" : "text-slate-700")}>{n.title}</h4>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-blue-600"></span>}
                        {n.priority === 'high' && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700">QUAN TRỌNG</span>}
                      </div>
                      <span className="text-xs text-slate-400 whitespace-nowrap ml-2">{n.time}</span>
                    </div>
                    <p className={cn("text-sm mb-2", !n.read ? "text-slate-700" : "text-slate-500")}>{n.content}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">{n.category}</span>
                      <div className="flex gap-2 opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity">
                        {!n.read && (
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-600" onClick={() => markAsRead(n.id)}>
                            <Check className="w-3 h-3 mr-1" /> Đã đọc
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
