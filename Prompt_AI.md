# PROMPT XÂY DỰNG WEBSITE HOÀN CHỈNH — HỆ THỐNG QUẢN LÝ PHÒNG KHÁM CÓ TÍCH HỢP AI

## 1. VAI TRÒ

Bạn là một **Senior Full-Stack Engineer + Software Architect + UI/UX Designer + AI Engineer**, có kinh nghiệm xây dựng hệ thống quản lý phòng khám, HIS/EMR, RBAC, bảo mật dữ liệu y tế và tích hợp AI Agent.

Hãy xây dựng một **website quản lý phòng khám hoàn chỉnh, có thể chạy được**, dựa chính xác trên đặc tả dưới đây.

Đây là một hệ thống phục vụ **phòng khám tư nhân**, gồm:

- Core Clinic Management System
- Patient Management
- Doctor Management
- Appointment Management
- EMR / Medical Record
- Prescription Management
- Billing & Payment
- Dashboard & Statistics
- AI Administrative Assistant
- AI Medical Record Summarization
- AI Guardrails
- Audit Logs
- Role-Based Access Control

**Không được biến hệ thống thành một landing page hoặc prototype tĩnh.**

Mục tiêu là tạo ra một **web application có giao diện chuyên nghiệp + frontend hoạt động + backend/API + database + authentication + RBAC + AI integration + dữ liệu mẫu + xử lý lỗi**.

---

# 2. NGUYÊN TẮC QUAN TRỌNG NHẤT

## AI KHÔNG ĐƯỢC CHẨN ĐOÁN

AI trong hệ thống chỉ được phép hỗ trợ:

1. Trả lời câu hỏi hành chính về phòng khám.
2. Hướng dẫn quy trình đặt lịch.
3. Kiểm tra và đề xuất thời gian còn trống.
4. Hỗ trợ đặt lịch.
5. Tóm tắt lịch sử khám cho bác sĩ.
6. Sinh hướng dẫn sau khám dựa trên nội dung bác sĩ đã nhập và mẫu được phê duyệt.
7. Hỗ trợ điều hướng workflow hành chính.

AI TUYỆT ĐỐI KHÔNG:

- Chẩn đoán bệnh.
- Đưa ra kết luận bệnh lý.
- Đề xuất phác đồ điều trị.
- Tự kê thuốc.
- Tự thay đổi bệnh án.
- Tự ghi dữ liệu lâm sàng vào EMR.
- Thay thế quyết định của bác sĩ.

Nếu người dùng hỏi:

> "Tôi bị đau đầu nên uống thuốc gì?"

AI phải từ chối theo mẫu an toàn:

> "Tôi là trợ lý hành chính của phòng khám và không có chức năng chẩn đoán hoặc tư vấn điều trị. Bạn vui lòng liên hệ bác sĩ để được tư vấn chuyên môn."

---

# 3. KIẾN TRÚC HỆ THỐNG

Thiết kế hệ thống theo mô hình:

```text
Frontend
   │
   ▼
REST API / Backend
   │
   ├── Authentication & RBAC
   ├── Patient Service
   ├── Appointment Service
   ├── EMR Service
   ├── Prescription Service
   ├── Billing Service
   ├── Audit Service
   │
   ▼
PostgreSQL
   │
   ├── Core HIS/EMR data
   └── Audit data

Frontend
   │
   ▼
AI API
   │
   ▼
AI Orchestrator
   │
   ├── Administrative Q&A
   ├── Appointment Agent
   ├── EMR Summary Agent
   └── Post-visit Guidance Agent
          │
          ▼
       Guardrails
          │
          ▼
       LLM / RAG
          │
          ▼
       Vector Database
```

Thiết kế Core HIS và AI thành hai phân hệ riêng biệt nhưng giao tiếp qua API.

Ưu tiên kiến trúc:

- Clean Architecture
- REST API
- Event-oriented design ở các workflow cần thiết
- RBAC
- Audit logging
- AI Guardrails
- Human-in-the-loop

---

# 4. TECH STACK

Nếu môi trường cho phép, sử dụng:

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- React Router
- TanStack Query
- Recharts
- Lucide Icons

### Backend

Ưu tiên:

- FastAPI
- Python
- Pydantic
- SQLAlchemy
- Alembic
- JWT Authentication

### Database

- PostgreSQL

Thiết kế database đạt **3NF**.

### AI

- LangGraph
- RAG
- Qdrant hoặc vector database tương đương
- Function Calling / Tool Calling
- Streaming response

LLM provider phải được thiết kế dạng abstraction để có thể thay đổi giữa:

- OpenAI
- Gemini
- Claude
- Ollama

Không hard-code API key.

Sử dụng:

```env
OPENAI_API_KEY=
DATABASE_URL=
JWT_SECRET=
QDRANT_URL=
QDRANT_API_KEY=
```

Nếu chưa có API key, hệ thống phải có **Mock AI Mode** để website vẫn chạy được.

---

# 5. THIẾT KẾ UI/UX

Phong cách:

**Modern Healthcare SaaS + Premium Medical Dashboard + Clean Minimalist + Subtle Futuristic AI**

Không thiết kế theo phong cách website bệnh viện cũ.

Không sử dụng quá nhiều gradient.

Không dùng màu xanh neon quá mức.

Không làm giao diện "AI-generated", màu mè hoặc thiếu tính thực tế.

## Màu sắc

Primary:

- Deep Medical Blue
- Soft Cyan
- White
- Slate
- Light Gray

Accent AI:

- Violet / Indigo nhẹ

Màu trạng thái:

- Green = Completed / Paid
- Amber = Waiting
- Blue = Scheduled
- Red = Cancelled / Warning
- Purple = AI

---

# 6. LAYOUT CHUNG

Desktop:

```text
┌─────────────────────────────────────────────────────────────┐
│ TOPBAR                         Search 🔍   🔔   User Avatar │
├───────────────┬─────────────────────────────────────────────┤
│               │                                             │
│   SIDEBAR     │              MAIN CONTENT                   │
│               │                                             │
│ Dashboard     │                                             │
│ Patients      │                                             │
│ Appointments  │                                             │
│ Doctors       │                                             │
│ EMR           │                                             │
│ Prescriptions │                                             │
│ Billing       │                                             │
│ AI Assistant  │                                             │
│ Reports       │                                             │
│ Audit Logs    │                                             │
│ Settings      │                                             │
│               │                                             │
└───────────────┴─────────────────────────────────────────────┘
```

Sidebar phải thay đổi menu theo Role.

Không hiển thị chức năng mà Role đó không có quyền.

---

# 7. ROLE & RBAC

Hệ thống có 5 Role:

## PATIENT

Có quyền:

- Xem thông tin cá nhân.
- Xem lịch khám.
- Đặt lịch.
- Đổi lịch.
- Hủy lịch.
- Xem lịch sử khám được phép.
- Xem hóa đơn.
- Chat với AI.
- Nhận hướng dẫn sau khám.

Không được:

- Xem dữ liệu bệnh nhân khác.
- Xem dữ liệu nội bộ.
- Truy cập EMR của người khác.
- Truy cập Admin.

---

## RECEPTIONIST

Có quyền:

- Dashboard tiếp đón.
- Quản lý bệnh nhân.
- Tạo bệnh nhân.
- Tìm kiếm bệnh nhân.
- Quản lý lịch hẹn.
- Check-in bệnh nhân.
- Chuyển trạng thái:

```text
Scheduled
    ↓
Waiting
    ↓
In Consultation
    ↓
Completed
    ↓
Paid
```

Lễ tân KHÔNG được truy cập nội dung lâm sàng nhạy cảm của EMR.

---

## DOCTOR

Có quyền:

- Dashboard bác sĩ.
- Lịch khám.
- Patient Queue.
- EMR.
- Medical History.
- Diagnosis.
- Prescription.
- AI Summary.
- Ký số & khóa EMR.

Không được:

- Thay đổi dữ liệu sau khi EMR đã khóa.
- Truy cập chức năng quản trị hệ thống.

---

## ACCOUNTANT

Có quyền:

- Billing Dashboard.
- Invoice.
- Payment.
- Revenue.
- Debt.
- Transaction History.
- Export Invoice.

Không được chỉnh sửa dữ liệu lâm sàng.

---

## ADMIN

Có quyền:

- User Management.
- Role Management.
- System Configuration.
- AI Configuration.
- AI Guardrails.
- Audit Logs.
- Security Dashboard.
- Prompt Injection Monitoring.
- System Statistics.

---

# 8. CÁC TRANG PHẢI XÂY DỰNG

## 8.1 Login

Thiết kế màn hình Login hiện đại:

```text
┌──────────────────────────────┐
│       CLINIC AI              │
│                              │
│ Email / Username             │
│ [________________________]   │
│                              │
│ Password                     │
│ [________________________]   │
│                              │
│ [        ĐĂNG NHẬP        ]  │
│                              │
│ Demo Accounts                │
│ Admin | Doctor | Reception   │
└──────────────────────────────┘
```

Có:

- Remember me
- Forgot password
- Show password
- Loading state
- Error state

---

# 9. DASHBOARD

Dashboard phải thay đổi theo Role.

## Admin Dashboard

Hiển thị:

- Total Patients
- Today's Appointments
- Completed Consultations
- Revenue
- Active Doctors
- AI Requests
- Blocked AI Requests
- Prompt Injection Attempts

Biểu đồ:

- Patient statistics
- Revenue
- Appointment statistics
- AI usage
- Security events

---

## Doctor Dashboard

Hiển thị:

- Today's appointments
- Waiting patients
- Completed consultations
- Upcoming appointments
- Recent patients

Có:

**Patient Queue**

```text
WAITING
────────────────────────────
Nguyễn Văn A
08:30
Waiting 12 min

Trần Văn B
08:45
Waiting 5 min
```

---

## Receptionist Dashboard

Hiển thị:

- Today's appointments
- Waiting patients
- Checked-in
- Cancelled
- No-show

Có nút:

**+ Đăng ký bệnh nhân**

**+ Đặt lịch**

**Check-in**

---

## Accountant Dashboard

Hiển thị:

- Today's Revenue
- Paid
- Unpaid
- Outstanding Debt
- Number of Invoices

---

# 10. PATIENT MANAGEMENT

Trang:

`/patients`

Có:

- Search
- Filter
- Pagination
- Patient table
- Add patient
- Edit patient
- Patient detail

Columns:

```text
Patient ID
Name
DOB
Gender
Phone
Insurance
Last Visit
Status
Actions
```

Patient Detail:

```text
Patient Profile
├── Personal Information
├── Contact
├── Insurance
├── Appointment History
├── Visit History
├── Prescription History
└── Billing History
```

Không hiển thị thông tin nhạy cảm cho Role không đủ quyền.

---

# 11. DOCTOR MANAGEMENT

Trang:

`/doctors`

Thông tin:

- Doctor ID
- Full Name
- Specialty
- Department
- Phone
- Email
- Working Schedule
- Status

Doctor detail:

- Profile
- Schedule
- Today's appointments
- Statistics

---

# 12. APPOINTMENT MANAGEMENT

Trang:

`/appointments`

Phải có 2 chế độ:

### Calendar View

```text
MON    TUE    WED    THU    FRI
08:00  ─────────────────────────
08:30  Dr A
09:00  Dr B
09:30
10:00  Dr A
```

### Table View

Columns:

- Appointment ID
- Patient
- Doctor
- Specialty
- Date
- Time
- Status
- Actions

Cho phép:

- Create
- Reschedule
- Cancel
- Confirm
- Check-in

Bắt buộc có **Double Booking Prevention**.

Không cho phép hai lịch xung đột cùng bác sĩ và cùng thời gian.

---

# 13. PATIENT PORTAL

Trang dành cho bệnh nhân.

Layout:

```text
┌──────────────────────────────────────────────┐
│ Xin chào, Nguyễn Văn A                       │
├──────────────────────────────────────────────┤
│                                              │
│ Lịch khám tiếp theo                          │
│                                              │
│ 12/09/2026                                   │
│ 08:30                                         │
│ BS. Trần Văn B                               │
│ Da liễu                                      │
│                                              │
│ [Xem lịch] [Đổi lịch] [Hủy lịch]             │
│                                              │
├──────────────────────────────────────────────┤
│ Lịch sử khám                                 │
├──────────────────────────────────────────────┤
│ Hóa đơn                                      │
└──────────────────────────────────────────────┘
```

---

# 14. AI CHATBOT

Đây là một trong những tính năng quan trọng nhất.

Trang:

`/ai-assistant`

Thiết kế chatbot giống một **AI Healthcare Administrative Assistant** cao cấp.

Không làm chatbot như một widget đơn giản.

Giao diện:

```text
┌─────────────────────────────────────────────┐
│ AI Clinic Assistant                         │
│ ● Online                                    │
├─────────────────────────────────────────────┤
│                                             │
│ AI                                          │
│ Xin chào! Tôi có thể hỗ trợ bạn về:        │
│                                             │
│ • Đặt lịch khám                             │
│ • Giờ làm việc                              │
│ • Quy trình khám                            │
│ • Hồ sơ hành chính                          │
│                                             │
│ User                                        │
│ Tôi muốn đặt lịch khám ngày mai.            │
│                                             │
│ AI                                          │
│ Tôi tìm thấy các khung giờ...               │
│                                             │
│ [08:30] [09:30] [14:00]                     │
│                                             │
├─────────────────────────────────────────────┤
│ Nhập câu hỏi...                      [Send] │
└─────────────────────────────────────────────┘
```

AI phải hỗ trợ streaming response.

Hiển thị:

- Typing indicator
- Streaming text
- Tool execution status
- Error state
- Guardrail warning
- Conversation history

---

# 15. AI APPOINTMENT AGENT

Khi bệnh nhân nói:

> "Tôi muốn khám da liễu vào ngày mai."

AI phải:

1. Phân tích intent.
2. Xác định specialty.
3. Xác định ngày.
4. Gọi tool:

```text
get_available_slots()
```

5. Trả về các slot.

Ví dụ:

```text
Tôi tìm thấy 3 lịch trống:

08:30 — BS. Trần Văn B
10:00 — BS. Nguyễn Văn C
14:30 — BS. Trần Văn B

Bạn muốn chọn khung giờ nào?
```

Khi bệnh nhân chọn:

```text
14:30
```

AI gọi:

```text
book_appointment()
```

Sau đó xác nhận lịch.

---

# 16. AI RAG

Xây dựng kiến trúc:

```text
User Question
      ↓
Input Guardrail
      ↓
Intent Detection
      ↓
Retriever
      ↓
Qdrant
      ↓
Relevant Documents
      ↓
LLM
      ↓
Output Guardrail
      ↓
Response
```

Knowledge Base chứa:

- Giờ làm việc.
- Quy trình khám.
- Quy trình đặt lịch.
- Quy định hủy lịch.
- Hồ sơ giấy tờ cần mang.
- Quy trình thanh toán.
- Quy định bảo hiểm.
- Hướng dẫn sau khám được phê duyệt.

AI không được tự bịa chính sách phòng khám.

Nếu không tìm thấy thông tin:

> "Tôi chưa tìm thấy thông tin chính xác trong cơ sở dữ liệu của phòng khám."

---

# 17. EMR WORKSPACE — GIAO DIỆN QUAN TRỌNG NHẤT CHO BÁC SĨ

Trang:

`/doctor/emr`

Thiết kế theo đúng wireframe trong báo cáo.

```text
┌──────────────┬───────────────────────────────────────┐
│              │ Patient Queue                         │
│ SIDEBAR      ├───────────────────────────────────────┤
│              │ Patient Cards                          │
│ Today's      │                                       │
│ Schedule     │ [Patient A] [Patient B] [Patient C] │
│              │                                       │
│ Medical      ├───────────────────────────────────────┤
│ Records      │ Patient Information                   │
│              │                                       │
│              │ Vitals                                │
│              │ ┌─────────────────────────────────┐   │
│              │ │ BP | Heart Rate | Temperature  │   │
│              │ └─────────────────────────────────┘   │
│              │                                       │
│              │ Medical History       [AI TÓM TẮT]    │
│              │                                       │
│              │ Clinical Notes                        │
│              │                                       │
│              │ Diagnosis                             │
│              │                                       │
│              │ Prescription                          │
│              │                                       │
│              │                                       │
│              │        [KÝ SỐ & KHÓA HỒ SƠ]          │
└──────────────┴───────────────────────────────────────┘
```

---

# 18. AI TÓM TẮT BỆNH ÁN

Trong phần Medical History có nút:

**AI TÓM TẮT**

Khi click:

```text
AI Medical Summary
──────────────────────────────

• Tiền sử khám gần đây: ...
• Lần khám gần nhất: ...
• Nội dung đã được bác sĩ ghi nhận: ...
• Thuốc đã được kê trong các lần trước: ...
• Các thông tin hành chính liên quan: ...

⚠ Đây là bản tóm tắt từ dữ liệu có sẵn.
AI không đưa ra chẩn đoán.

[Đóng]
```

AI chỉ được **summarize dữ liệu đã có**.

Không được tự suy luận.

Phải hiển thị:

- Source records
- Generated time
- AI model
- Disclaimer

---

# 19. DIAGNOSIS

Bác sĩ nhập diagnosis.

Hỗ trợ:

- ICD-10
- Search diagnosis
- Add diagnosis
- Remove diagnosis

AI KHÔNG tự chọn diagnosis.

---

# 20. PRESCRIPTION

Trang kê đơn:

```text
Prescription
────────────────────────────────────

Medicine
[ Search medicine................ ]

Dosage
[________________]

Frequency
[________________]

Duration
[________________]

Quantity
[________________]

[+ Add medicine]

────────────────────────────────────

Medicine A
1 tablet × 2/day × 5 days

Medicine B
1 tablet × 1/day × 7 days
```

Cảnh báo dị ứng và tương tác thuốc phải sử dụng **logic/rule engine**, không sử dụng LLM để quyết định.

Ví dụ:

```text
⚠ CẢNH BÁO

Bệnh nhân có tiền sử dị ứng với:
Penicillin

Thuốc đang chọn:
Amoxicillin

Vui lòng kiểm tra trước khi tiếp tục.
```

---

# 21. DIGITAL SIGNATURE & LOCK EMR

Nút nổi bật:

**KÝ SỐ & KHÓA HỒ SƠ**

Workflow:

```text
Doctor clicks
      ↓
Confirmation Modal
      ↓
Digital Signature Authentication
      ↓
Generate SHA-256 Hash
      ↓
Sign EMR
      ↓
Lock EMR
      ↓
Status = COMPLETED
```

Sau khi khóa:

- Không được chỉnh sửa EMR.
- Hiển thị Locked badge.
- Hiển thị người ký.
- Thời gian ký.
- Signature status.
- Hash verification status.

---

# 22. BILLING

Trang:

`/billing`

Hiển thị:

- Patient
- Appointment
- Services
- Medicine
- Total
- Insurance
- Paid
- Remaining
- Payment status

Status:

```text
UNPAID
PARTIALLY PAID
PAID
REFUNDED
```

Có:

- Create invoice
- Payment
- Print invoice
- Export invoice

---

# 23. REPORTS

Trang:

`/reports`

Dashboard thống kê:

- Số bệnh nhân.
- Số lượt khám.
- Số lịch hẹn.
- Tỷ lệ hoàn thành.
- Doanh thu.
- Công nợ.
- Hiệu suất bác sĩ.

Có filter:

- Today
- This week
- This month
- Custom range

---

# 24. ADMIN — AI GUARDRAILS

Trang:

`/admin/ai-security`

Đây là màn hình đặc biệt dành cho Admin.

Layout:

```text
AI SECURITY CENTER

┌────────────────┬────────────────┬────────────────┐
│ AI Requests    │ Blocked        │ Injection      │
│ 12,482         │ 328            │ 47             │
└────────────────┴────────────────┴────────────────┘

Prompt Injection Attempts
────────────────────────────────────────

Time       User       Query       Action
10:21      user01     ...         BLOCKED
10:32      user05     ...         BLOCKED
```

---

# 25. GUARDRAILS MANAGEMENT

Admin có thể:

- Add keyword.
- Delete keyword.
- Enable/disable rule.
- Add Regex.
- Test input.
- Test output.

Ví dụ:

```text
Blocked Keywords

diagnose
diagnosis
treatment
prescribe
medicine recommendation
```

Nhưng hệ thống phải thiết kế để Admin có thể thay đổi danh sách này.

---

# 26. AUDIT LOG

Trang:

`/admin/audit-logs`

Lưu:

- Timestamp
- User
- Role
- Action
- Resource
- IP
- Result
- AI action
- Tool call
- Guardrail decision

Ví dụ:

```text
14:32:08
DOCTOR_001
VIEW
PATIENT_001
SUCCESS

14:33:12
AI_AGENT
TOOL_CALL
get_available_slots
SUCCESS

14:35:22
PATIENT_004
AI_REQUEST
Medical diagnosis
BLOCKED
```

---

# 27. DATABASE

Tạo PostgreSQL schema theo mô hình 3NF.

Các entity tối thiểu:

```text
USERS
STAFF
PATIENTS
DEPARTMENTS
DOCTORS
SPECIALTIES
WORKING_SCHEDULES
APPOINTMENTS
CONSULTATIONS
DIAGNOSES
CONSULTATION_DIAGNOSES
MEDICINES
PRESCRIPTIONS
PRESCRIPTION_ITEMS
SERVICES
BILLING
PAYMENTS
AUDIT_LOGS
AI_CONVERSATIONS
AI_MESSAGES
AI_GUARDRAIL_RULES
AI_TOOL_CALLS
```

Thiết lập:

- Primary Keys
- Foreign Keys
- Unique Constraints
- Check Constraints
- Indexes
- Timestamps
- Soft delete khi phù hợp

Đặc biệt:

**Không cho phép double booking ở database/backend.**

---

# 28. API

Xây dựng REST API rõ ràng.

Ví dụ:

```text
POST   /api/auth/login

GET    /api/patients
POST   /api/patients
GET    /api/patients/{id}
PUT    /api/patients/{id}

GET    /api/doctors
GET    /api/doctors/{id}

GET    /api/appointments
POST   /api/appointments
PUT    /api/appointments/{id}
DELETE /api/appointments/{id}

GET    /api/emr/{patient_id}
POST   /api/emr
POST   /api/emr/{id}/sign
POST   /api/emr/{id}/lock

GET    /api/prescriptions
POST   /api/prescriptions

GET    /api/billing
POST   /api/billing/{id}/payment

POST   /api/ai/chat
POST   /api/ai/summarize
POST   /api/ai/appointment

GET    /api/audit-logs

GET    /api/admin/guardrails
POST   /api/admin/guardrails
DELETE /api/admin/guardrails/{id}
```

Mọi endpoint phải kiểm tra RBAC.

---

# 29. SECURITY

Bắt buộc triển khai:

- JWT Authentication
- Password hashing
- RBAC
- Input validation
- Rate limiting cho AI
- API key không được hard-code
- CORS configuration
- Audit logging
- PII masking
- SQL Injection prevention
- XSS prevention
- Secure headers

Dữ liệu nhạy cảm không được gửi toàn bộ sang AI nếu không cần thiết.

Trước khi gửi AI:

```text
Patient Name → [MASKED]
Identity Number → [MASKED]
Phone → [MASKED]
Address → [MASKED]
```

Chỉ gửi phần dữ liệu cần thiết cho task.

---

# 30. AI GUARDRAIL PIPELINE

Mọi request AI phải đi qua:

```text
User
 ↓
Authentication
 ↓
Authorization
 ↓
Input Guardrail
 ↓
PII Masking
 ↓
Intent Detection
 ↓
AI Agent
 ↓
Tool Permission Check
 ↓
LLM / RAG
 ↓
Output Guardrail
 ↓
PII Masking
 ↓
Audit Log
 ↓
User
```

Nếu AI phát hiện request ngoài phạm vi:

```text
BLOCK
```

Không gọi LLM nếu có thể chặn ngay từ Input Guardrail.

---

# 31. AI TOOL PERMISSION

AI không được gọi API tùy ý.

Chỉ được phép sử dụng tools được cấp quyền.

Ví dụ:

```text
get_clinic_info()
get_available_slots()
book_appointment()
cancel_appointment()
get_patient_administrative_info()
summarize_medical_history()
generate_post_visit_guidance()
```

Mỗi tool phải kiểm tra:

- User role
- User identity
- Permission
- Input
- Resource ownership

Mọi tool call phải ghi Audit Log.

---

# 32. POST-VISIT AI GUIDANCE

AI có thể sinh hướng dẫn sau khám nhưng chỉ dựa trên:

- Ghi chú của bác sĩ.
- Template đã được phòng khám phê duyệt.
- Thông tin hành chính.

Ví dụ:

```text
Hướng dẫn sau khám

• Vui lòng theo dõi lịch tái khám được bác sĩ ghi nhận.
• Mang theo hồ sơ khi quay lại phòng khám.
• Liên hệ phòng khám nếu cần hỗ trợ về lịch hẹn.

⚠ Nội dung do AI hỗ trợ tạo dựa trên thông tin được cung cấp
và không thay thế hướng dẫn chuyên môn của bác sĩ.
```

Không được tự tạo hướng dẫn điều trị mới.

---

# 33. RESPONSIVE DESIGN

Website phải responsive:

- Desktop
- Laptop
- Tablet
- Mobile

Mobile sidebar chuyển thành:

```text
Bottom Navigation
```

Các bảng lớn phải có:

- Horizontal scroll
- Responsive cards

---

# 34. UX STATES

Tất cả component phải có:

- Loading
- Empty
- Error
- Success
- Disabled
- Permission denied
- Skeleton loading
- Confirmation dialog

Không được để màn hình trắng khi API lỗi.

---

# 35. DEMO DATA

Tạo dữ liệu demo thực tế nhưng **không sử dụng dữ liệu bệnh nhân thật**.

Tạo:

### Patients

Ít nhất 20 bệnh nhân.

### Doctors

Ít nhất 5 bác sĩ.

Ví dụ:

```text
Dr. Trần Minh Anh — Nội khoa
Dr. Nguyễn Văn Bình — Da liễu
Dr. Lê Thu Hà — Nhi khoa
Dr. Phạm Minh Đức — Tim mạch
Dr. Hoàng Lan — Tai Mũi Họng
```

### Appointments

Tạo lịch:

- Scheduled
- Waiting
- In Consultation
- Completed
- Cancelled

### Prescriptions

Tạo dữ liệu demo.

### Billing

Tạo invoice:

- Paid
- Unpaid
- Partial

### Audit logs

Tạo dữ liệu demo cho dashboard.

---

# 36. DEMO ACCOUNT

Tạo sẵn:

```text
Admin
admin@clinic.local
Admin123!

Doctor
doctor@clinic.local
Doctor123!

Receptionist
reception@clinic.local
Reception123!

Accountant
accountant@clinic.local
Accountant123!

Patient
patient@clinic.local
Patient123!
```

Chỉ dùng cho môi trường demo/local.

---

# 37. AI MOCK MODE

Nếu không có API key:

```text
AI_MODE=mock
```

Website vẫn phải chạy.

Mock AI phải mô phỏng:

- Chat streaming.
- Appointment recommendation.
- Appointment booking.
- EMR summary.
- Guardrail block.

Khi có API key:

```text
AI_MODE=production
```

hệ thống chuyển sang AI thật.

---

# 38. ERROR HANDLING

Ví dụ:

### Appointment conflict

```text
Không thể đặt lịch.

Khung giờ này vừa được đặt bởi bệnh nhân khác.
Vui lòng chọn một khung giờ khác.
```

### Unauthorized

```text
Bạn không có quyền truy cập chức năng này.
```

### AI unavailable

```text
Trợ lý AI hiện không khả dụng.

Bạn vẫn có thể sử dụng các chức năng quản lý
của phòng khám bình thường.
```

### Guardrail

```text
Yêu cầu bị giới hạn.

Trợ lý AI chỉ hỗ trợ các vấn đề hành chính
và không cung cấp chẩn đoán hoặc tư vấn điều trị.
```

---

# 39. SEARCH

Tạo global search.

Cho phép tìm:

```text
Patient
Appointment
Doctor
Invoice
EMR
Prescription
```

Search phải tôn trọng RBAC.

---

# 40. NOTIFICATION

Tạo notification center:

- Appointment reminder
- Appointment cancelled
- Payment successful
- EMR completed
- AI warning
- Security warning

---

# 41. DARK MODE

Hỗ trợ:

- Light
- Dark

Dark mode phải giữ tính chuyên nghiệp của Healthcare SaaS.

Không dùng màu neon quá mạnh.

---

# 42. COMPONENT SYSTEM

Tạo reusable components:

```text
Sidebar
Topbar
DashboardCard
PatientCard
AppointmentCard
StatusBadge
DataTable
Modal
Drawer
Form
DatePicker
Calendar
SearchBar
NotificationCenter
AIChat
AISummary
GuardrailAlert
AuditLogTable
MedicalRecord
PrescriptionForm
BillingTable
SignatureModal
```

Không copy-paste component ở nhiều nơi.

---

# 43. ROUTING

Tạo routing đầy đủ:

```text
/login

/dashboard

/patients
/patients/:id

/doctors
/doctors/:id

/appointments

/emr
/emr/:patientId

/prescriptions

/billing
/billing/:id

/reports

/ai-assistant

/admin/users
/admin/ai-security
/admin/audit-logs
/admin/settings

/patient/dashboard
/patient/appointments
/patient/medical-records
/patient/billing
```

Protected routes phải kiểm tra Role.

---

# 44. CODE QUALITY

Code phải:

- Type-safe.
- Modular.
- Maintainable.
- Reusable.
- Có comments ở logic phức tạp.
- Không có API key hard-code.
- Không có password hard-code trong production.
- Không tạo fake functionality nếu có thể triển khai thật.
- Không dùng localStorage để giả lập toàn bộ database.
- Không làm frontend-only nếu backend có thể triển khai.

---

# 45. TEST

Tạo test cho:

```text
Authentication
RBAC
Patient CRUD
Appointment creation
Double booking prevention
Appointment cancellation
EMR creation
EMR locking
Prescription
Billing
AI Summary
AI Guardrail
PII Masking
Audit Log
AI failure
```

Đặc biệt phải test:

```text
Doctor A cannot access unauthorized patient data.

Receptionist cannot access clinical EMR.

Patient cannot access another patient's EMR.

AI cannot diagnose.

AI cannot modify EMR directly.

Two users cannot book the same doctor/time slot.
```

---

# 46. SEED DATABASE

Tạo:

```text
seed.py
```

hoặc cơ chế tương đương để tạo toàn bộ dữ liệu demo.

Sau khi chạy seed, website phải có thể demo ngay.

---

# 47. DOCKER

Tạo:

```text
docker-compose.yml
```

bao gồm:

```text
frontend
backend
postgres
qdrant
```

Nếu AI provider không cấu hình thì backend tự động sử dụng Mock AI.

Có:

```text
.env.example
README.md
```

---

# 48. README

README phải hướng dẫn:

1. Clone project.
2. Cài dependency.
3. Cấu hình `.env`.
4. Khởi động PostgreSQL.
5. Migration.
6. Seed database.
7. Khởi động backend.
8. Khởi động frontend.
9. Cấu hình AI.
10. Chạy test.
11. Docker deployment.

---

# 49. TRÌNH TỰ THỰC HIỆN

Không cố tạo tất cả trong một file.

Hãy triển khai theo thứ tự:

### Phase 1
Project architecture.

### Phase 2
Database + migrations + seed.

### Phase 3
Authentication + RBAC.

### Phase 4
Patient Management.

### Phase 5
Doctor Management.

### Phase 6
Appointment Management + double-booking prevention.

### Phase 7
EMR.

### Phase 8
Prescription.

### Phase 9
Billing.

### Phase 10
Dashboard + Reports.

### Phase 11
AI Chatbot.

### Phase 12
RAG.

### Phase 13
AI Appointment Agent.

### Phase 14
AI EMR Summary.

### Phase 15
AI Guardrails.

### Phase 16
Audit Logs.

### Phase 17
Testing.

### Phase 18
Docker + README.

---

# 50. QUY TẮC KHI CODE

Trước khi viết code:

1. Phân tích toàn bộ yêu cầu.
2. Tạo cấu trúc thư mục.
3. Tạo database schema.
4. Xác định API.
5. Xác định RBAC.
6. Xác định AI boundaries.
7. Sau đó mới triển khai.

Mỗi phase phải đảm bảo ứng dụng vẫn chạy được.

Không phá vỡ chức năng của phase trước.

Không tạo placeholder như:

```text
TODO
Coming soon
Lorem ipsum
```

trừ khi thực sự cần thiết.

---

# 51. KẾT QUẢ CUỐI CÙNG

Sau khi hoàn thành, tôi muốn có một **Clinic Management System hoàn chỉnh** với flow:

```text
PATIENT
   │
   ▼
AI CHATBOT
   │
   ├── Hỏi thông tin
   ├── Kiểm tra lịch
   └── Đặt lịch
          │
          ▼
      APPOINTMENT
          │
          ▼
     RECEPTIONIST
          │
          ▼
        WAITING
          │
          ▼
        DOCTOR
          │
          ▼
        EMR
          │
     ┌────┴────┐
     │         │
 AI SUMMARY  PRESCRIPTION
     │         │
     └────┬────┘
          ▼
   DIGITAL SIGNATURE
          │
          ▼
      LOCK EMR
          │
          ▼
       BILLING
          │
          ▼
       PAYMENT
          │
          ▼
      COMPLETED
```

Toàn bộ workflow phải có dữ liệu liên kết thực sự.

---

# 52. TIÊU CHÍ ĐÁNH GIÁ

Ưu tiên theo thứ tự:

1. **Đúng nghiệp vụ phòng khám.**
2. **Đúng phân quyền.**
3. **Đúng giới hạn AI.**
4. **Giao diện chuyên nghiệp.**
5. **Database có quan hệ thực tế.**
6. **API hoạt động thật.**
7. **AI có Guardrails.**
8. **Có Audit Logs.**
9. **Có dữ liệu demo.**
10. **Có Docker và README.**

Không ưu tiên hiệu ứng animation hơn tính đúng đắn của nghiệp vụ.

---

# 53. PHONG CÁCH GIAO DIỆN

Hãy lấy cảm hứng từ các sản phẩm:

- Modern Healthcare SaaS
- Enterprise Dashboard
- EMR Dashboard
- AI Assistant Interface

Nhưng **không sao chép nguyên mẫu thương hiệu nào**.

Thiết kế phải có cảm giác:

**Professional — Clean — Trustworthy — Modern — Medical — Intelligent**

AI chỉ xuất hiện ở những nơi nó thực sự có ích.

Không biến toàn bộ website thành giao diện chatbot.

---

# 54. CUỐI CÙNG

Sau khi hoàn thành, hãy kiểm tra toàn bộ project như một **Senior Software Engineer và QA Engineer**.

Kiểm tra:

- Frontend build.
- Backend startup.
- Database connection.
- Migration.
- Seed.
- Login.
- RBAC.
- CRUD.
- Appointment.
- Double booking.
- EMR.
- Prescription.
- Billing.
- AI.
- Guardrails.
- PII masking.
- Audit logs.
- Error handling.
- Responsive UI.

Nếu phát hiện lỗi, hãy tự sửa trước khi kết thúc.

**Không chỉ mô tả cách làm. Hãy trực tiếp tạo mã nguồn và cấu trúc project hoàn chỉnh.**

Bắt đầu từ **Phase 1 — Architecture → Database → Backend → Frontend**, sau đó tiếp tục triển khai tuần tự cho đến khi hệ thống có thể chạy và demo end-to-end.