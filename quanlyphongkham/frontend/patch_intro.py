import os
import re

file_path = "src/components/ai/unified/UnifiedAIChatSystem.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update getRoleConfig with detailed introMessage
doctor_intro = "Xin chào Bác sĩ! Tôi là AI Trợ lý Y khoa. Tôi có thể hỗ trợ Bác sĩ các công việc sau:\n- **Tóm tắt bệnh án**: Lấy hồ sơ y tế, lịch sử khám, xét nghiệm và đơn thuốc của một bệnh nhân.\n- **Kiểm tra lịch trình**: Xem lịch khám hôm nay và danh sách bệnh nhân đang chờ (hàng đợi).\n- **Gợi ý phác đồ & Tương tác thuốc**: Tra cứu các thông tin y khoa chuyên sâu hỗ trợ ra quyết định lâm sàng."
receptionist_intro = "Xin chào! Tôi là AI Trợ lý Lễ tân. Tôi có thể hỗ trợ bạn:\n- **Tìm kiếm bệnh nhân**: Tra cứu thông tin bệnh nhân qua tên, số điện thoại hoặc email.\n- **Kiểm tra lịch Bác sĩ**: Xem lịch làm việc và hàng đợi hiện tại của bất kỳ bác sĩ nào.\n- **Tạo lịch hẹn**: Đặt lịch hẹn mới cho bệnh nhân."
admin_intro = "Xin chào Quản trị viên! Tôi là AI Cố vấn Quản trị. Tôi có thể giúp bạn:\n- **Thống kê hệ thống**: Tổng hợp số lượng người dùng, lịch hẹn và doanh thu tổng quan.\n- **Quản lý Người dùng**: Truy xuất danh sách tài khoản theo từng vai trò.\n- **Nhật ký hoạt động (Audit Logs)**: Kiểm tra các hành động gần nhất trên hệ thống."
accountant_intro = "Xin chào! Tôi là AI Trợ lý Kế toán. Tôi hỗ trợ xử lý:\n- **Tổng doanh thu**: Kiểm tra doanh thu trong ngày hoặc một ngày cụ thể.\n- **Hóa đơn chưa thanh toán**: Truy xuất danh sách các hóa đơn còn nợ hoặc thanh toán một phần."
patient_intro = "Chào bạn! Tôi là AI Trợ lý Sức khỏe. Tôi có thể giúp bạn:\n- **Quản lý lịch hẹn**: Xem các lịch hẹn sắp tới hoặc hủy lịch hẹn.\n- **Tra cứu Bác sĩ**: Tìm kiếm và xem thông tin các Bác sĩ đang làm việc tại phòng khám để đặt lịch.\n- **Hồ sơ cá nhân**: Xem lại các đơn thuốc và kết quả xét nghiệm gần nhất.\n- **Tư vấn sức khỏe**: Trả lời các thắc mắc y tế cơ bản."

# Replace the configs to include introMessage
content = content.replace("welcomeMessage: 'Tôi hỗ trợ phân tích hồ sơ bệnh án, gợi ý chẩn đoán, tổng hợp kết quả xét nghiệm và tra cứu phác đồ điều trị chuyên sâu.',", f"welcomeMessage: 'Tôi hỗ trợ phân tích hồ sơ bệnh án, gợi ý chẩn đoán, tổng hợp kết quả xét nghiệm và tra cứu phác đồ điều trị chuyên sâu.',\n      introMessage: `{doctor_intro}`,")
content = content.replace("welcomeMessage: 'Tôi có thể hỗ trợ bạn tra cứu lịch khám của bác sĩ, quản lý hàng đợi, xử lý các câu hỏi thường gặp của bệnh nhân, hoặc tạo nhanh lịch hẹn.',", f"welcomeMessage: 'Tôi có thể hỗ trợ bạn tra cứu lịch khám của bác sĩ, quản lý hàng đợi, xử lý các câu hỏi thường gặp của bệnh nhân, hoặc tạo nhanh lịch hẹn.',\n      introMessage: `{receptionist_intro}`,")
content = content.replace("welcomeMessage: 'Tôi giúp phân tích dữ liệu phòng khám, tổng hợp báo cáo doanh thu, đánh giá hiệu suất nhân sự và giám sát hoạt động hệ thống.',", f"welcomeMessage: 'Tôi giúp phân tích dữ liệu phòng khám, tổng hợp báo cáo doanh thu, đánh giá hiệu suất nhân sự và giám sát hoạt động hệ thống.',\n      introMessage: `{admin_intro}`,")
content = content.replace("welcomeMessage: 'Tôi hỗ trợ tra cứu hóa đơn, tổng hợp doanh thu, đối soát thanh toán và quản lý các giao dịch tài chính.',", f"welcomeMessage: 'Tôi hỗ trợ tra cứu hóa đơn, tổng hợp doanh thu, đối soát thanh toán và quản lý các giao dịch tài chính.',\n      introMessage: `{accountant_intro}`,")
content = content.replace("welcomeMessage: 'Hãy hỏi tôi về lịch hẹn, quy trình khám bệnh, theo dõi hồ sơ sức khỏe, thanh toán hoặc các thông tin y tế khác. Tôi luôn sẵn sàng hỗ trợ bạn 24/7.',", f"welcomeMessage: 'Hãy hỏi tôi về lịch hẹn, quy trình khám bệnh, theo dõi hồ sơ sức khỏe, thanh toán hoặc các thông tin y tế khác. Tôi luôn sẵn sàng hỗ trợ bạn 24/7.',\n      introMessage: `{patient_intro}`,")

# Update handleNewChat to push this intro message
old_handleNewChat = """  const handleNewChat = () => {
    setActiveId(undefined);
    setMessages([]);
  };"""

new_handleNewChat = """  const handleNewChat = () => {
    setActiveId(undefined);
    setMessages([{ id: 'intro', role: 'assistant', content: config.introMessage, created_at: new Date().toISOString() }]);
  };"""

content = content.replace(old_handleNewChat, new_handleNewChat)

# Make sure if conversations.length === 0 it also gets the intro message initially
# Find the fetchConversations success logic:
old_fetch = """      if (data.length > 0 && !activeId) {
        loadConversation(data[0].id);
      }"""
new_fetch = """      if (data.length > 0 && !activeId) {
        loadConversation(data[0].id);
      } else if (data.length === 0) {
        handleNewChat();
      }"""
content = content.replace(old_fetch, new_fetch)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("patched frontend UnifiedAIChatSystem.tsx")
