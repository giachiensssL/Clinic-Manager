import os

receptionist_msg = """
<div className="space-y-3 text-left bg-blue-50/50 p-4 rounded-xl border border-blue-100">
  <p className="font-semibold text-blue-800 text-center mb-2">Tôi là trợ lý ảo dành riêng cho Lễ tân, được thiết kế để giúp bạn tối ưu hóa công việc hàng ngày:</p>
  <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
    <li><strong>Tra cứu & Đặt lịch:</strong> Kiểm tra lịch làm việc của Bác sĩ, đặt lịch hẹn mới, hoặc dời lịch khám cho Bệnh nhân.</li>
    <li><strong>Quản lý Hàng đợi:</strong> Kiểm tra xem ai đang trong hàng đợi, ưu tiên gọi số tiếp theo vào phòng khám.</li>
    <li><strong>Thông tin Bệnh nhân:</strong> Tra cứu nhanh thông tin cơ bản, mã bệnh nhân và trạng thái thanh toán.</li>
    <li><strong>Hỗ trợ hỏi đáp:</strong> Giải đáp nhanh các quy trình thủ tục tại phòng khám để bạn có thể tư vấn tốt hơn.</li>
  </ul>
</div>
"""

doctor_msg = """
<div className="space-y-3 text-left bg-violet-50/50 p-4 rounded-xl border border-violet-100">
  <p className="font-semibold text-violet-800 text-center mb-2">Tôi là trợ lý Y khoa AI, công cụ đắc lực hỗ trợ quyết định lâm sàng của Bác sĩ:</p>
  <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
    <li><strong>Phân tích bệnh án:</strong> Tóm tắt nhanh hồ sơ sức khỏe và lịch sử khám của bệnh nhân.</li>
    <li><strong>Đề xuất lâm sàng:</strong> Phân tích triệu chứng và gợi ý các chẩn đoán phân biệt khả dĩ (Differential Diagnosis).</li>
    <li><strong>Kết quả Cận lâm sàng:</strong> Giải nghĩa kết quả xét nghiệm, chỉ ra các chỉ số bất thường.</li>
    <li><strong>Kê đơn & Thuốc:</strong> Tra cứu nhanh phác đồ điều trị, liều dùng và cảnh báo tương tác thuốc tự động.</li>
  </ul>
</div>
"""

admin_msg = """
<div className="space-y-3 text-left bg-slate-50 p-4 rounded-xl border border-slate-200">
  <p className="font-semibold text-slate-800 text-center mb-2">Tôi là AI phân tích dữ liệu, đóng vai trò Cố vấn Quản trị Hệ thống:</p>
  <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
    <li><strong>Báo cáo Doanh thu:</strong> Tổng hợp nhanh doanh thu trong ngày, tháng và so sánh biến động.</li>
    <li><strong>Phân tích Hiệu suất:</strong> Đánh giá thời gian chờ trung bình, hiệu suất khám bệnh của các Bác sĩ và phòng ban.</li>
    <li><strong>Giám sát Hệ thống:</strong> Phát hiện các dấu hiệu bất thường trong luồng hoạt động (Audit Logs).</li>
    <li><strong>Tư vấn Vận hành:</strong> Gợi ý các điểm nghẽn trong khâu tiếp đón để cải thiện chất lượng dịch vụ.</li>
  </ul>
</div>
"""

patient_msg = """
<div className="space-y-3 text-left bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
  <p className="font-semibold text-emerald-800 text-center mb-2">Xin chào! Tôi là Trợ lý Y tế Cá nhân, luôn sẵn sàng hỗ trợ bạn 24/7:</p>
  <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
    <li><strong>Đặt khám Dễ dàng:</strong> Hỗ trợ đặt lịch khám mới, xem lịch hẹn sắp tới hoặc nhắc nhở ngày tái khám.</li>
    <li><strong>Giải đáp Y tế:</strong> Trả lời các thắc mắc về triệu chứng nhẹ, quy trình chuẩn bị trước khi xét nghiệm.</li>
    <li><strong>Hồ sơ của bạn:</strong> Xem lại tóm tắt kết quả khám bệnh lần trước một cách dễ hiểu nhất.</li>
    <li><strong>Thủ tục & Thanh toán:</strong> Hướng dẫn quy trình bảo hiểm, cách thanh toán trực tuyến và chi phí dự kiến.</li>
  </ul>
</div>
"""

files = {
    "src/pages/receptionist/ReceptionistAI.tsx": receptionist_msg,
    "src/pages/doctor/DoctorAIAssistant.tsx": doctor_msg,
    "src/pages/admin/AIAdminWorkspace.tsx": admin_msg,
    "src/pages/portal/ai/PatientAIAssistant.tsx": patient_msg
}

for file_path, msg in files.items():
    if not os.path.exists(file_path):
        continue
        
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    import re
    # find welcomeMessage="<something>"
    pattern = r'welcomeMessage="([^"]*)"'
    
    # We will replace it with welcomeMessage={<JSX>}
    new_str = f"welcomeMessage={{\n{msg}\n}}"
    
    new_content = re.sub(pattern, new_str, content)
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_content)

print("done jsx patch")
