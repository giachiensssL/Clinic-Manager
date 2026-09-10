import os

files = {
    r'd:\Website_Antigravity\DU_LIEU\Quanlyphongkham\quanlyphongkham\frontend\src\pages\AIAssistant.tsx': '''import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, User, Send, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', content: 'Xin chào! Tôi là Trợ lý AI của phòng khám. Tôi có thể hỗ trợ bạn về:\\n\\n• Đặt lịch khám\\n• Giờ làm việc và quy trình\\n• Kiểm tra lịch trống\\n• Hướng dẫn hành chính\\n\\nBạn cần hỗ trợ gì hôm nay?', isGuardrail: false }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', content: input, isGuardrail: false }]);
    
    const userQuery = input.toLowerCase();
    setInput('');
    
    setTimeout(() => {
      if (userQuery.includes('chẩn đoán') || userQuery.includes('thuốc') || userQuery.includes('bệnh')) {
        setMessages(prev => [...prev, { 
          id: Date.now(), 
          role: 'assistant', 
          content: 'Xin lỗi, tôi là trợ lý hành chính và không có chức năng chẩn đoán hoặc tư vấn điều trị. Vui lòng đặt lịch khám để được bác sĩ tư vấn trực tiếp.',
          isGuardrail: true
        }]);
      } else {
        setMessages(prev => [...prev, { 
          id: Date.now(), 
          role: 'assistant', 
          content: 'Cảm ơn bạn. Để tôi kiểm tra thông tin và phản hồi lại bạn...',
          isGuardrail: false
        }]);
      }
    }, 1000);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col max-w-4xl mx-auto">
      <div className="flex items-center gap-3 p-4 bg-white border rounded-t-xl shadow-sm">
        <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
          <Bot className="w-6 h-6 text-violet-600" />
        </div>
        <div>
          <h2 className="font-bold text-slate-800">AI Clinic Assistant</h2>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-xs text-slate-500">Online • Hỗ trợ hành chính</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50 p-6 space-y-6 border-x">
        {messages.map((m) => (
          <div key={m.id} className={cn("flex gap-3 max-w-[85%]", m.role === 'user' ? "ml-auto flex-row-reverse" : "")}>
            <div className={cn("w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center mt-1", m.role === 'assistant' ? "bg-violet-100 text-violet-600" : "bg-blue-100 text-blue-600")}>
              {m.role === 'assistant' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
            </div>
            
            <div className={cn(
              "p-4 rounded-2xl whitespace-pre-line shadow-sm",
              m.role === 'user' 
                ? "bg-[#0ea5e9] text-white rounded-tr-none" 
                : m.isGuardrail 
                  ? "bg-amber-50 border border-amber-200 text-amber-900 rounded-tl-none"
                  : "bg-white border text-slate-700 rounded-tl-none"
            )}>
              {m.isGuardrail && <div className="flex items-center gap-1.5 text-amber-600 font-bold mb-2 text-sm"><ShieldAlert className="w-4 h-4"/> AI Guardrail Active</div>}
              {m.content}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-white border rounded-b-xl shadow-sm">
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1 hide-scrollbar">
          {['Đặt lịch khám', 'Giờ làm việc', 'Kiểm tra lịch trống'].map(q => (
            <button key={q} onClick={() => setInput(q)} className="whitespace-nowrap px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-sm text-slate-600 transition-colors">
              {q}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Nhập câu hỏi hành chính..." 
            className="flex-1"
          />
          <Button onClick={handleSend} className="bg-violet-600 hover:bg-violet-700"><Send className="w-4 h-4" /></Button>
        </div>
        <p className="text-center text-xs text-slate-400 mt-3">AI chỉ hỗ trợ hành chính, không cung cấp tư vấn y tế hay chẩn đoán bệnh.</p>
      </div>
    </div>
  );
}
''',
    
    r'd:\Website_Antigravity\DU_LIEU\Quanlyphongkham\quanlyphongkham\frontend\src\pages\prescriptions\PrescriptionsList.tsx': '''import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function PrescriptionsList() {
  const mockPrescriptions = [
    { id: 'rx001', code: 'DT001234', patient: 'Nguyễn Văn Minh', doctor: 'BS. Hương', date: '2026-08-25', status: 'active', items: 2 },
    { id: 'rx002', code: 'DT001235', patient: 'Trần Thị Lan', doctor: 'BS. Bình', date: '2026-08-24', status: 'completed', items: 2 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Đơn thuốc</h1>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-sm mb-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Tìm theo mã đơn, bệnh nhân..." className="pl-8" />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã Đơn</TableHead>
                  <TableHead>Bệnh Nhân</TableHead>
                  <TableHead>Bác Sĩ</TableHead>
                  <TableHead>Ngày Kê</TableHead>
                  <TableHead>Số Loại Thuốc</TableHead>
                  <TableHead>Trạng Thái</TableHead>
                  <TableHead className="text-right">Thao Tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockPrescriptions.map((rx) => (
                  <TableRow key={rx.id}>
                    <TableCell className="font-medium">{rx.code}</TableCell>
                    <TableCell>{rx.patient}</TableCell>
                    <TableCell>{rx.doctor}</TableCell>
                    <TableCell>{rx.date}</TableCell>
                    <TableCell>{rx.items}</TableCell>
                    <TableCell><Badge variant={rx.status === 'active' ? 'completed' : 'locked'}>{rx.status === 'active' ? 'Đang dùng' : 'Đã xong'}</Badge></TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="icon"><Eye className="w-4 h-4" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
'''
}

for filepath, content in files.items():
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("Created AIAssistant and Prescriptions pages")
