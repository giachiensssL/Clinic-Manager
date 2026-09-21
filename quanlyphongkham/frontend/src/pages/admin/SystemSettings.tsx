import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Building2, Calendar, Bell, Shield, Bot, Database } from 'lucide-react';

export default function SystemSettings() {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert('Cấu hình hệ thống đã được cập nhật.');
    }, 800);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cấu hình hệ thống</h1>
          <p className="text-sm text-slate-500 mt-1">Tùy chỉnh các thông số hoạt động cốt lõi của Clinic AI</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="bg-[#1e3a5f] hover:bg-[#152943]">
          <Save className="mr-2 w-4 h-4" /> {isSaving ? 'Đang lưu...' : 'Lưu cài đặt'}
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid grid-cols-3 md:grid-cols-6 h-auto p-1 bg-slate-100">
          <TabsTrigger value="general" className="py-2 text-xs md:text-sm data-[state=active]:bg-white"><Building2 className="w-4 h-4 mr-2 hidden md:block" /> Chung</TabsTrigger>
          <TabsTrigger value="schedule" className="py-2 text-xs md:text-sm data-[state=active]:bg-white"><Calendar className="w-4 h-4 mr-2 hidden md:block" /> Lịch hẹn</TabsTrigger>
          <TabsTrigger value="notify" className="py-2 text-xs md:text-sm data-[state=active]:bg-white"><Bell className="w-4 h-4 mr-2 hidden md:block" /> Thông báo</TabsTrigger>
          <TabsTrigger value="security" className="py-2 text-xs md:text-sm data-[state=active]:bg-white"><Shield className="w-4 h-4 mr-2 hidden md:block" /> Bảo mật</TabsTrigger>
          <TabsTrigger value="ai" className="py-2 text-xs md:text-sm data-[state=active]:bg-white"><Bot className="w-4 h-4 mr-2 hidden md:block" /> Trợ lý AI</TabsTrigger>
          <TabsTrigger value="backup" className="py-2 text-xs md:text-sm data-[state=active]:bg-white"><Database className="w-4 h-4 mr-2 hidden md:block" /> Sao lưu</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="general" className="m-0 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin phòng khám</CardTitle>
                <CardDescription>Thông tin hiển thị trên báo cáo, hóa đơn và email gửi khách hàng.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2"><label className="text-sm font-medium">Tên phòng khám</label><Input defaultValue="Clinic AI - Phòng khám Thông Minh" /></div>
                  <div className="space-y-2"><label className="text-sm font-medium">Mã số thuế</label><Input defaultValue="0101234567" /></div>
                  <div className="space-y-2 md:col-span-2"><label className="text-sm font-medium">Địa chỉ</label><Input defaultValue="123 Đường Y Tế, Phường Đa Kao, Quận 1, TP.HCM" /></div>
                  <div className="space-y-2"><label className="text-sm font-medium">Số điện thoại CSKH</label><Input defaultValue="1900 1234" /></div>
                  <div className="space-y-2"><label className="text-sm font-medium">Email liên hệ</label><Input defaultValue="contact@clinicai.vn" /></div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="m-0 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cấu hình lịch khám</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold">Cho phép bệnh nhân tự đặt lịch</h4>
                    <p className="text-sm text-slate-500">Hiển thị tính năng đặt lịch trên Portal của bệnh nhân</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold">Tự động duyệt lịch khám</h4>
                    <p className="text-sm text-slate-500">Lịch hẹn tự động chuyển sang Đã xác nhận nếu còn slot trống</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><label className="text-sm font-medium">Thời gian mỗi ca khám (phút)</label><Input type="number" defaultValue="15" /></div>
                  <div className="space-y-2"><label className="text-sm font-medium">Số ca tối đa / bác sĩ / ngày</label><Input type="number" defaultValue="40" /></div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai" className="m-0 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Trợ lý AI & Guardrails</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold">Kích hoạt AI tự động phân tích hồ sơ</h4>
                    <p className="text-sm text-slate-500">AI sẽ tự động đọc hồ sơ cũ trước khi bác sĩ bắt đầu ca khám</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold">Kích hoạt Medical Guardrails</h4>
                    <p className="text-sm text-slate-500">Bắt buộc bộ lọc an toàn y tế đối với các câu trả lời của AI cho bệnh nhân</p>
                  </div>
                  <Switch defaultChecked disabled /> {/* Always on for safety */}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">LLM Model mặc định (Backend)</label>
                  <Select defaultValue="gemini-1.5-flash">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash (Nhanh, khuyên dùng)</SelectItem>
                      <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro (Nâng cao)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="backup" className="m-0 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sao lưu & Phục hồi</CardTitle>
                <CardDescription>Cấu hình sao lưu dữ liệu tự động cho Database</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold">Sao lưu tự động mỗi ngày</h4>
                    <p className="text-sm text-slate-500">Thực hiện vào lúc 02:00 sáng</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="pt-4 border-t border-slate-100 flex gap-3">
                  <Button variant="outline">Sao lưu ngay bây giờ</Button>
                  <Button variant="outline" className="text-red-600 hover:text-red-700">Khôi phục từ bản sao lưu</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
