import os

files = {
    "src/pages/receptionist/ReceptionistAI.tsx": {
        "welcomeTitle": "Trợ lý AI Lễ Tân",
        "welcomeMessage": "Tôi có thể hỗ trợ bạn tra cứu lịch khám của bác sĩ, quản lý hàng đợi, xử lý các câu hỏi thường gặp của bệnh nhân, hoặc tạo nhanh lịch hẹn.",
        "quickActions": "['Lịch làm việc của Bác sĩ', 'Tình trạng hàng đợi', 'Tìm bệnh nhân']",
        "warningText": "undefined"
    },
    "src/pages/doctor/DoctorAIAssistant.tsx": {
        "welcomeTitle": "Trợ lý Y khoa (AI Bác sĩ)",
        "welcomeMessage": "Tôi hỗ trợ phân tích hồ sơ bệnh án, gợi ý chẩn đoán, tổng hợp kết quả xét nghiệm và tra cứu phác đồ điều trị chuyên sâu.",
        "quickActions": "['Tóm tắt bệnh án', 'Gợi ý phác đồ', 'Tra cứu tương tác thuốc']",
        "warningText": "'AI chỉ cung cấp thông tin hỗ trợ, không thay thế quyết định lâm sàng của bác sĩ.'"
    },
    "src/pages/admin/AIAdminWorkspace.tsx": {
        "welcomeTitle": "AI Quản trị viên (Admin)",
        "welcomeMessage": "Tôi giúp phân tích dữ liệu phòng khám, tổng hợp báo cáo doanh thu, đánh giá hiệu suất nhân sự và giám sát hoạt động hệ thống.",
        "quickActions": "['Báo cáo doanh thu', 'Lịch sử hoạt động', 'Thống kê lượng bệnh nhân']",
        "warningText": "undefined"
    },
    "src/pages/portal/ai/PatientAIAssistant.tsx": {
        "welcomeTitle": "Trợ lý sức khỏe của bạn",
        "welcomeMessage": "Hãy hỏi tôi về lịch hẹn, quy trình khám bệnh, theo dõi hồ sơ sức khỏe, thanh toán hoặc các thông tin y tế khác. Tôi luôn sẵn sàng hỗ trợ bạn 24/7.",
        "quickActions": "['Đặt lịch khám mới', 'Xem hồ sơ sức khỏe', 'Hỏi đáp y tế cơ bản']",
        "warningText": "undefined"
    }
}

for file_path, props in files.items():
    if not os.path.exists(file_path):
        continue
        
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # We need to find the AIChatWindow component call and inject the props
    # It currently looks like:
    # <AIChatWindow 
    #   conversationId={activeId}
    #   messages={messages}
    #   loading={loading}
    #   onSendMessage={handleSendMessage}
    #   onToggleMobileSidebar={() => setMobileOpen(true)}
    # />
    
    # We will replace the self-closing tag with the one containing new props
    
    old_tag = "onToggleMobileSidebar={() => setMobileOpen(true)}\n              />"
    new_tag = f"""onToggleMobileSidebar={{() => setMobileOpen(true)}}
                welcomeTitle="{props['welcomeTitle']}"
                welcomeMessage="{props['welcomeMessage']}"
                quickActions={{{props['quickActions']}}}
                warningText={{{props['warningText']}}}
              />"""
              
    content = content.replace(old_tag, new_tag)
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

print("done")
