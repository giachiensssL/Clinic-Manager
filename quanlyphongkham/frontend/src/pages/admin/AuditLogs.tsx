import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Download, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

import { mockAuditLogs } from '@/mock/adminData';

const actionConfig: Record<string, { label: string; color: string }> = {
  'Đăng nhập': { label: 'Đăng nhập', color: 'bg-blue-100 text-blue-700' },
  'Cập nhật': { label: 'Cập nhật', color: 'bg-purple-100 text-purple-700' },
  'Thêm mới': { label: 'Thêm mới', color: 'bg-green-100 text-green-700' },
  'Xóa': { label: 'Xóa', color: 'bg-red-100 text-red-700' },
  'Đổi mật khẩu': { label: 'Đổi mật khẩu', color: 'bg-amber-100 text-amber-700' },
  'Xuất báo cáo': { label: 'Xuất báo cáo', color: 'bg-slate-100 text-slate-700' },
  // Fallbacks for older demo data if any
  LOGIN_FAILED: { label: 'Đăng nhập thất bại', color: 'bg-red-100 text-red-700' },
  SIGN_EMR: { label: 'Ký Hồ Sơ', color: 'bg-purple-100 text-purple-700' },
  AI_REQUEST: { label: 'Yêu cầu AI', color: 'bg-violet-100 text-violet-700' },
};

const resultConfig: Record<string, { label: string; variant: 'default' | 'destructive' | 'outline' }> = {
  'Thành công': { label: 'Thành công', variant: 'default' },
  'Thất bại': { label: 'Thất bại', variant: 'destructive' },
  success: { label: 'Thành công', variant: 'default' },
  failed: { label: 'Thất bại', variant: 'destructive' },
  blocked: { label: 'Bị chặn', variant: 'destructive' },
};

export default function AuditLogs() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const filtered = mockAuditLogs.filter(log => {
    const matchSearch =
      log.user.includes(search) ||
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.ip.includes(search);
    const matchAction = actionFilter === 'all' || log.action === actionFilter;
    return matchSearch && matchAction;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nhật ký hệ thống</h1>
          <p className="text-sm text-slate-500 mt-1">Ghi lại toàn bộ hành động trong hệ thống</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" /> Làm mới
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" /> Xuất CSV
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Tổng hôm nay', value: '247', color: 'text-slate-800' },
          { label: 'Thành công', value: '231', color: 'text-green-600' },
          { label: 'Thất bại', value: '4', color: 'text-red-600' },
          { label: 'Bị chặn (AI)', value: '12', color: 'text-amber-600' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm user, chi tiết, IP..."
                className="pl-8"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Loại hành động" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả hành động</SelectItem>
                <SelectItem value="Đăng nhập">Đăng nhập</SelectItem>
                <SelectItem value="Cập nhật">Cập nhật</SelectItem>
                <SelectItem value="Thêm mới">Thêm mới</SelectItem>
                <SelectItem value="Xóa">Xóa</SelectItem>
                <SelectItem value="Đổi mật khẩu">Đổi mật khẩu</SelectItem>
                <SelectItem value="Xuất báo cáo">Xuất báo cáo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Người dùng</TableHead>
                  <TableHead>Hành động</TableHead>
                  <TableHead>Chi tiết</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Kết quả</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(log => {
                  const ac = actionConfig[log.action] || { label: log.action, color: 'bg-slate-100 text-slate-600' };
                  const rc = resultConfig[log.status] || { label: log.status, variant: 'outline' as const };
                  return (
                    <TableRow key={log.id} className={log.status !== 'success' ? 'bg-red-50/30' : ''}>
                      <TableCell className="text-xs text-slate-500 whitespace-nowrap">{log.time}</TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{log.user || '—'}</div>
                        {log.role && <div className="text-xs text-slate-400">{log.role}</div>}
                      </TableCell>
                      <TableCell>
                        <span className={cn('text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap', ac.color)}>
                          {ac.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600 max-w-xs truncate" title={log.details}>
                        {log.details}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-500">{log.ip}</TableCell>
                      <TableCell>
                        <Badge
                          variant={rc.variant}
                          className={log.status === 'success' ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}
                        >
                          {rc.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between mt-4 text-sm text-slate-500">
            <span>Hiển thị {filtered.length} / {mockAuditLogs.length} bản ghi</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>Trước</Button>
              <Button variant="outline" size="sm" className="bg-[#1e3a5f] text-white hover:bg-[#152943]">1</Button>
              <Button variant="outline" size="sm">2</Button>
              <Button variant="outline" size="sm">Sau</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
