import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Pill, Eye, Printer, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
 Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { prescriptionsAPI } from '@/services/api';

interface PrescriptionItem {
 id: string;
 medicine: { name: string; form: string; strength: string; };
 dosage: string;
 frequency: string;
 duration_days: number;
 quantity: number;
 instructions?: string;
 unit_price: number;
}

interface Prescription {
 id: string;
 prescription_code: string;
 patient_id: string;
 doctor_id: string;
 notes?: string;
 patient?: { full_name: string; patient_code: string; date_of_birth?: string; };
 doctor?: { staff: { full_name: string; }; };
 items?: PrescriptionItem[];
 created_at: string;
}

const formatCurrency = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';
const formatDate = (s: string) => new Date(s).toLocaleDateString('vi-VN');

export default function PrescriptionsList() {
 const [search, setSearch] = useState('');
 const [selected, setSelected] = useState<Prescription | null>(null);

 const { data, isLoading } = useQuery({
 queryKey: ['prescriptions'],
 queryFn: () => prescriptionsAPI.getAll({ page: 1, size: 100 }).then(r => r.data),
 });

 const prescriptions: Prescription[] = data?.items ?? data ?? [];

 const filtered = prescriptions.filter(p => {
 const q = search.toLowerCase();
 return (
 p.prescription_code.toLowerCase().includes(q) ||
 p.patient?.full_name?.toLowerCase().includes(q) ||
 p.patient?.patient_code?.toLowerCase().includes(q)
 );
 });

 const handlePrint = (p: Prescription) => {
 const win = window.open('', '_blank');
 if (!win) return;
 const items = p.items ?? [];
 const total = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
 win.document.write(`
 <!DOCTYPE html><html lang="vi"><head>
 <meta charset="UTF-8">
 <title>Đơn thuốc — ${p.prescription_code}</title>
 <style>
 body { font-family: Arial, sans-serif; max-width: 700px; margin: 40px auto; color: #111; }
 h1 { text-align: center; font-size: 20px; margin-bottom: 4px; }
 .subtitle { text-align: center; color: #666; margin-bottom: 24px; font-size: 13px; }
 .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 20px; font-size: 14px; }
 table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
 th { background: #f0f4ff; border: 1px solid #ccc; padding: 8px; text-align: left; }
 td { border: 1px solid #ccc; padding: 8px; }
 .total { text-align: right; margin-top: 12px; font-size: 15px; font-weight: bold; }
 .note { margin-top: 16px; font-size: 13px; border: 1px dashed #ccc; padding: 10px; border-radius: 4px; }
 .sig { margin-top: 40px; display: flex; justify-content: space-between; font-size: 13px; }
 @media print { button { display: none; } }
 </style>
 </head><body>
 <h1>🏥 PHÒNG KHÁM CLINIC AI</h1>
 <div class="subtitle">ĐƠN THUỐC — ${p.prescription_code}</div>
 <div class="info-grid">
 <div><b>Bệnh nhân:</b> ${p.patient?.full_name ?? 'N/A'}</div>
 <div><b>Mã BN:</b> ${p.patient?.patient_code ?? 'N/A'}</div>
 <div><b>Bác sĩ:</b> ${p.doctor?.staff?.full_name ?? 'N/A'}</div>
 <div><b>Ngày kê:</b> ${formatDate(p.created_at)}</div>
 </div>
 <table>
 <thead><tr>
 <th>#</th><th>Tên thuốc</th><th>Dạng/Hàm lượng</th>
 <th>Liều dùng</th><th>Tần suất</th><th>Số ngày</th><th>SL</th><th>Đơn giá</th>
 </tr></thead>
 <tbody>
 ${items.map((it, i) => `<tr>
 <td>${i + 1}</td>
 <td><b>${it.medicine?.name ?? 'N/A'}</b></td>
 <td>${it.medicine?.form ?? ''} ${it.medicine?.strength ?? ''}</td>
 <td>${it.dosage}</td><td>${it.frequency}</td>
 <td>${it.duration_days}</td><td>${it.quantity}</td>
 <td>${formatCurrency(it.unit_price)}</td>
 </tr>${it.instructions ? `<tr><td></td><td colspan="7" style="color:#555;font-style:italic">↳ ${it.instructions}</td></tr>` : ''}`).join('')}
 </tbody>
 </table>
 <div class="total">Tổng tiền thuốc: ${formatCurrency(total)}</div>
 ${p.notes ? `<div class="note"><b>Lưu ý:</b> ${p.notes}</div>` : ''}
 <div class="sig">
 <div>Bệnh nhân ký tên<br/><br/><br/>_________________</div>
 <div style="text-align:center">Ngày ${new Date().toLocaleDateString('vi-VN')}<br/><b>Bác sĩ kê đơn</b><br/><br/><br/>_________________<br/>${p.doctor?.staff?.full_name ?? ''}</div>
 </div>
 <script>window.onload = () => window.print();</script>
 </body></html>
 `);
 win.document.close();
 };

 return (
 <div className="space-y-6">
 <div>
 <h1 className="text-2xl font-bold text-slate-900 ">Quản lý Đơn thuốc</h1>
 <p className="text-sm text-slate-500 mt-1">{prescriptions.length} đơn thuốc</p>
 </div>

 {/* Search */}
 <div className="relative max-w-sm">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
 <Input
 placeholder="Tìm mã đơn, tên bệnh nhân..."
 className="pl-9"
 value={search}
 onChange={e => setSearch(e.target.value)}
 />
 </div>

 {/* Table */}
 <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
 {isLoading ? (
 <div className="p-8 text-center text-slate-400">Đang tải...</div>
 ) : filtered.length === 0 ? (
 <div className="p-8 text-center text-slate-400">
 <Pill className="w-10 h-10 mx-auto mb-3 opacity-30" />
 Không có đơn thuốc nào
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead className="bg-slate-50 border-b border-slate-200 ">
 <tr>
 <th className="px-4 py-3 text-left font-medium text-slate-600 ">Mã đơn</th>
 <th className="px-4 py-3 text-left font-medium text-slate-600 ">Bệnh nhân</th>
 <th className="px-4 py-3 text-left font-medium text-slate-600 ">Bác sĩ kê</th>
 <th className="px-4 py-3 text-left font-medium text-slate-600 ">Số thuốc</th>
 <th className="px-4 py-3 text-left font-medium text-slate-600 ">Ngày kê</th>
 <th className="px-4 py-3 text-right font-medium text-slate-600 ">Hành động</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 ">
 {filtered.map(p => (
 <tr key={p.id} className="hover:bg-slate-50 :bg-slate-700/50 transition-colors">
 <td className="px-4 py-3 font-mono font-medium text-slate-900 ">{p.prescription_code}</td>
 <td className="px-4 py-3">
 <div className="font-medium text-slate-900 ">{p.patient?.full_name ?? 'N/A'}</div>
 <div className="text-xs text-slate-400">{p.patient?.patient_code}</div>
 </td>
 <td className="px-4 py-3 text-slate-600 ">{p.doctor?.staff?.full_name ?? 'N/A'}</td>
 <td className="px-4 py-3">
 <Badge variant="secondary">{p.items?.length ?? 0} loại thuốc</Badge>
 </td>
 <td className="px-4 py-3 text-slate-500">{formatDate(p.created_at)}</td>
 <td className="px-4 py-3 text-right">
 <div className="flex items-center justify-end gap-2">
 <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelected(p)}>
 <Eye className="w-4 h-4" />
 </Button>
 <Button variant="outline" size="sm" className="h-8" onClick={() => handlePrint(p)}>
 <Printer className="w-3.5 h-3.5 mr-1.5" />
 In
 </Button>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </div>

 {/* Detail Dialog */}
 <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
 <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
 <DialogHeader>
 <DialogTitle className="flex items-center gap-2">
 <FileText className="w-5 h-5" />
 Đơn thuốc — {selected?.prescription_code}
 </DialogTitle>
 </DialogHeader>
 {selected && (
 <div className="space-y-4">
 <div className="grid grid-cols-2 gap-3 text-sm">
 <div><span className="text-slate-500">Bệnh nhân:</span><br /><span className="font-medium">{selected.patient?.full_name}</span></div>
 <div><span className="text-slate-500">Bác sĩ:</span><br /><span className="font-medium">{selected.doctor?.staff?.full_name}</span></div>
 <div><span className="text-slate-500">Mã BN:</span><br /><span className="font-mono">{selected.patient?.patient_code}</span></div>
 <div><span className="text-slate-500">Ngày kê:</span><br /><span>{formatDate(selected.created_at)}</span></div>
 </div>

 {selected.items && selected.items.length > 0 ? (
 <div>
 <h4 className="font-semibold mb-3 text-sm">Danh sách thuốc</h4>
 <div className="space-y-3">
 {selected.items.map((item, i) => (
 <div key={item.id} className="bg-slate-50 rounded-lg p-3 text-sm">
 <div className="flex justify-between items-start">
 <div>
 <span className="font-semibold text-slate-900 ">
 {i + 1}. {item.medicine?.name}
 </span>
 <span className="text-slate-400 ml-2 text-xs">
 {item.medicine?.form} · {item.medicine?.strength}
 </span>
 </div>
 <Badge variant="outline">{item.quantity} {item.medicine?.form === 'Viên nang' || item.medicine?.form === 'Viên nén' ? 'viên' : 'đơn vị'}</Badge>
 </div>
 <div className="mt-1.5 text-slate-500 grid grid-cols-3 gap-2 text-xs">
 <span>Liều: <b>{item.dosage}</b></span>
 <span>Tần suất: <b>{item.frequency}</b></span>
 <span>Số ngày: <b>{item.duration_days}</b></span>
 </div>
 {item.instructions && (
 <p className="mt-1 text-xs italic text-slate-400">↳ {item.instructions}</p>
 )}
 </div>
 ))}
 </div>
 <div className="text-right text-sm font-bold mt-3">
 Tổng tiền thuốc: {formatCurrency(selected.items.reduce((s, i) => s + i.unit_price * i.quantity, 0))}
 </div>
 </div>
 ) : (
 <p className="text-sm text-slate-400 italic">Chưa có chi tiết thuốc.</p>
 )}

 {selected.notes && (
 <div className="border border-dashed border-slate-300 rounded-lg p-3 text-sm">
 <span className="font-medium">Ghi chú: </span>{selected.notes}
 </div>
 )}
 </div>
 )}
 <DialogFooter>
 <Button variant="outline" onClick={() => setSelected(null)}>Đóng</Button>
 {selected && (
 <Button onClick={() => handlePrint(selected)}>
 <Printer className="w-4 h-4 mr-2" />
 In đơn thuốc
 </Button>
 )}
 </DialogFooter>
 </DialogContent>
 </Dialog>
 </div>
 );
}
