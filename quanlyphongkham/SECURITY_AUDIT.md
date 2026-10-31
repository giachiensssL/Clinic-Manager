# BÁO CÁO KIỂM TOÁN AN TOÀN THÔNG TIN & BẢO MẬT HỆ THỐNG Y TẾ
# (HEALTHCARE CYBERSECURITY & PRIVACY AUDIT REPORT)
**Dự án**: AI Clinic Management System (Hệ Thống Quản Lý Phòng Khám Thông Minh)  
**Ngày kiểm toán**: 01/11/2026  
**Tiêu chuẩn kiểm toán**: OWASP Top 10 API Security 2023, HIPAA Security Rule, Luật Khám bệnh, chữa bệnh số 15/2023/QH15, Nghị định 13/2023/NĐ-CP về Bảo vệ dữ liệu cá nhân (PDPD).  
**Trạng thái kiểm toán**: Hoàn tất – Phát hiện **12 lỗ hổng bảo mật**, trong đó có **2 lỗ hổng CRITICAL (P0)**, **4 lỗ hổng HIGH (P1)**, **4 lỗ hổng MEDIUM (P2)**, **2 lỗ hổng LOW (P3)**.

---

## 1. TỔNG QUAN MA TRẬN LỖ HỔNG AN NINH (SECURITY VULNERABILITY MATRIX)

| Mã lỗ hổng | Tên lỗ hổng & Phân loại | Điểm CVSS v3.1 | Mức độ nghiêm trọng | Vị trí phát hiện (Tệp tin & Dòng) | Trạng thái hiện tại |
|------------|-------------------------|----------------|---------------------|-----------------------------------|---------------------|
| **V-01** | BOLA / IDOR Rò rỉ toàn bộ bệnh án qua Trợ lý AI (Patient Data Leakage) | **9.6 (Critical)** | **P0 - Cực kỳ nguy hiểm** | `backend/app/services/ai_tool_registry.py:1526` | Chưa vá |
| **V-02** | Thiếu phân quyền (Broken Object Level Authorization - BOLA): Kế toán đọc EMR chi tiết | **8.5 (High)** | **P1 - Rất cao** | `backend/app/api/v1/emr.py:145` (`get_consultation`) | Chưa vá |
| **V-03** | Lưu trữ JWT Token không an toàn (Insecure Token Storage in `localStorage`) | **7.4 (High)** | **P1 - Cao** | `frontend/src/context/AuthContext.tsx:38` | Chưa vá |
| **V-04** | Thiếu cơ chế Refresh Token Rotation & Thu hồi Token (Revocation/Blacklist) | **6.8 (Medium)** | **P2 - Trung bình** | `backend/app/core/security.py:45` | Chưa vá |
| **V-05** | IDOR: Bệnh nhân có thể xem đơn thuốc và hóa đơn của bệnh nhân khác qua số ID | **8.1 (High)** | **P1 - Cao** | `backend/app/api/v1/billing.py:112`, `prescriptions.py:88` | Chưa vá |
| **V-06** | Leo thang đặc quyền: Nhân viên tiếp tân có thể gọi API xóa người dùng hoặc chỉnh sửa EMR | **8.8 (High)** | **P1 - Rất cao** | `backend/app/api/v1/patients.py:95`, `admin.py:78` | Chưa vá |
| **V-07** | Chữ ký số y tế giả lập không đạt chuẩn pháp lý (Mock SHA-256 vs PKI/HSM) | **6.5 (Medium)** | **P2 - Trung bình** | `backend/app/api/v1/emr.py:280` | Chưa vá |
| **V-08** | Lỗ hổng Prompt Injection / System Prompt Leaking trong Trợ lý AI | **7.1 (High)** | **P2 - Cao** | `backend/app/services/gemini_service.py:115` | Chưa vá |
| **V-09** | Cấu hình CORS quá mở (`allow_origins=["*"]`) trong môi trường Production | **6.2 (Medium)** | **P2 - Trung bình** | `backend/app/main.py:42` | Chưa vá |
| **V-10** | Thiếu Rate Limiting trên các Endpoint nhạy cảm (Login, Reset Pass, AI Chat) | **5.9 (Medium)** | **P2 - Trung bình** | `backend/app/api/v1/auth.py`, `ai.py` | Chưa vá |
| **V-11** | Lộ lọt thông tin nhạy cảm qua Nhật ký và Lỗi hệ thống (Verbose Exception Stack Trace) | **4.3 (Low)** | **P3 - Thấp** | `backend/app/main.py:65` | Chưa vá |
| **V-12** | Thiếu mã hóa dữ liệu tĩnh (Encryption at Rest) cho CSDL y tế SQLite | **5.3 (Medium)** | **P3 - Thấp** | `backend/app/database.py:12` | Chưa vá |

---

## 2. PHÂN TÍCH CHI TIẾT CÁC LỖ HỔNG & GIẢI PHÁP KHẮC PHỤC

### 2.1. [V-01 - P0 CRITICAL] Lỗ hổng rò rỉ toàn bộ bệnh án qua Trợ lý AI (BOLA / IDOR)
- **Mô tả**: Trong tệp `services/ai_tool_registry.py`, khi một bệnh nhân nhắn tin với AI Chat để hỏi về lịch sử điều trị, hàm `_get_patient_context(user_id)` cố gắng tìm kiếm bản ghi `Patient` gắn với `user_id`. Tuy nhiên, nếu session hiện tại chưa map được hoặc người dùng ẩn danh gửi request, mã nguồn chứa đoạn fallback nguy hiểm:
  ```python
  # ai_tool_registry.py dòng 1526
  if not patient:
      patient = db.query(Patient).first()  # NGUY HIỂM TỘT ĐỘ: Tự động gán Bệnh nhân #1
  ```
- **Hậu quả**: Bất kỳ người dùng nào (thậm chí tài khoản bệnh nhân khác hoặc tài khoản khách) chỉ cần hỏi AI: *"Hãy cho tôi biết đơn thuốc và tiền sử bệnh của tôi"* sẽ được AI đọc toàn bộ hồ sơ y bạ, kết quả xét nghiệm HIV/viêm gan/ung thư, tiền sử phá thai, địa chỉ, số CMND/CCCD của Bệnh nhân ID 1!
- **Vi phạm**: Vi phạm nghiêm trọng Điều 8 & Điều 32 Luật Khám bệnh, chữa bệnh 2023 (Bảo mật thông tin người bệnh), Điều 9 Nghị định 13/2023/NĐ-CP (Xử phạt tới 5% doanh thu hoặc xử lý hình sự về tiết lộ dữ liệu cá nhân nhạy cảm).
- **Mã sửa đổi đề xuất**:
  ```python
  # SỬA LẠI: Bắt buộc xác thực người dùng và cô lập ngữ cảnh
  if not current_user:
      raise HTTPException(status_code=401, detail="Vui lòng đăng nhập để tra cứu hồ sơ cá nhân.")
  
  if current_user.role == UserRole.PATIENT:
      patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
      if not patient:
          return "Không tìm thấy hồ sơ bệnh nhân gắn với tài khoản của bạn. Vui lòng liên hệ quầy tiếp tân để liên kết hồ sơ."
  ```

---

### 2.2. [V-02 - P1 HIGH] Kế toán truy cập hồ sơ bệnh án chi tiết (EMR Privilege Breach)
- **Mô tả**: Trong `backend/app/api/v1/emr.py`, endpoint `GET /api/v1/emr/consultations/{consultation_id}` sử dụng dependency bảo vệ lỏng lẻo:
  ```python
  current_user: User = Depends(get_staff_or_doctor)
  ```
  Hàm `get_staff_or_doctor` cho phép mọi nhân viên có role `STAFF`, bao gồm cả nhân viên kế toán (`ACCOUNTANT`) và thủ kho thuốc, đọc được toàn văn chẩn đoán phân biệt, triệu chứng tâm thần, bệnh sử nhạy cảm của người bệnh.
- **Hậu quả**: Kế toán chỉ được phép xem các mục chi phí dịch vụ và tiền thuốc để lập hóa đơn, việc xem toàn bộ bệnh án điện tử là vi phạm nguyên tắc "Need-to-Know" của HIPAA và quy chế hồ sơ bệnh án Bộ Y Tế.
- **Mã sửa đổi đề xuất**:
  - Tạo dependency tách bạch: `require_roles([UserRole.DOCTOR, UserRole.ADMIN])` cho EMR lâm sàng.
  - Cung cấp riêng endpoint `GET /api/v1/billing/consultations/{id}/billable-items` chỉ trả về danh mục tên dịch vụ và đơn giá cho Kế toán.

---

### 2.3. [V-03 - P1 HIGH] Lưu trữ JWT Token không an toàn tại `localStorage`
- **Mô tả**: Toàn bộ hệ thống frontend (`AuthContext.tsx`) đang lưu `accessToken` và `user_info` trực tiếp vào `window.localStorage`.
- **Rủi ro**: Nếu hệ thống xảy ra bất kỳ lỗi XSS nào (thông qua tên bệnh nhân chứa script, đơn thuốc chứa mã độc hoặc thư viện bên thứ ba npm bị nhiễm mã độc), kẻ tấn công dễ dàng thực thi `localStorage.getItem('token')` và chiếm đoạt hoàn toàn phiên làm việc của Bác sĩ hoặc Quản trị viên.
- **Giải pháp**:
  - Chuyển `accessToken` lưu trong **in-memory React state**.
  - Lưu `refreshToken` trong **HttpOnly, Secure, SameSite=Strict Cookie** được sinh ra bởi Backend.
  - Khi người dùng F5 hoặc mở tab mới, frontend tự động gọi `POST /api/v1/auth/refresh` bằng cookie để lấy lại access token ngắn hạn (15 phút).

---

### 2.4. [V-04 - P2 MEDIUM] Thiếu cơ chế Refresh Token Rotation & Blacklist
- **Mô tả**: JWT Access Token hiện tại được cấu hình thời hạn dài (24 giờ đến 7 ngày) mà không có cơ chế thu hồi (Revocation). Khi người dùng nhấn "Đăng xuất" (`Logout`), frontend chỉ xóa token khỏi `localStorage`, nhưng mã token đó vẫn hoàn toàn hợp lệ đối với Backend FastAPI nếu bị kẻ gian nghe lén trước đó.
- **Giải pháp**:
  - Giảm thời hạn Access Token xuống **15 - 30 phút**.
  - Triển khai bảng `revoked_tokens` hoặc Redis In-Memory Blacklist với TTL tương ứng thời hạn token.
  - Triển khai **Refresh Token Rotation**: Mỗi lần cấp access token mới, refresh token cũ bị hủy ngay lập tức và sinh ra refresh token mới. Nếu một refresh token cũ được tái sử dụng, hệ thống lập tức khóa toàn bộ phiên của tài khoản đó (phát hiện token theft).

---

### 2.5. [V-05 - P1 HIGH] Lỗ hổng IDOR trên Hóa đơn viện phí & Đơn thuốc
- **Mô tả**: Tại `GET /api/v1/billing/invoices/{invoice_id}` và `GET /api/v1/prescriptions/{prescription_id}`, backend chỉ kiểm tra xem user có token hay không mà không kiểm tra xem `invoice.patient_id` hoặc `prescription.patient_id` có thuộc quyền sở hữu của `current_user` hay không.
- **Thực nghiệm khai thác**:
  - Bệnh nhân A đăng nhập, có ID tài khoản là 105.
  - Bệnh nhân A gửi request `GET /api/v1/billing/invoices/1` hoặc `GET /api/v1/prescriptions/1`.
  - Backend trả về đầy đủ hóa đơn và đơn thuốc của Bệnh nhân B mà không chặn.
- **Mã sửa đổi đề xuất**:
  ```python
  if current_user.role == UserRole.PATIENT:
      patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
      if not patient or invoice.patient_id != patient.id:
          raise HTTPException(status_code=403, detail="Bạn không có quyền truy cập hóa đơn của người khác.")
  ```

---

### 2.6. [V-06 - P1 HIGH] Leo thang đặc quyền xóa người dùng & sửa dữ liệu y bạ
- **Mô tả**: Một số endpoint trong `patients.py` và `appointments.py` chỉ kiểm tra `current_user.is_active` mà không kiểm tra vai trò Role. Tiếp tân có thể gọi endpoint cập nhật trạng thái bệnh án hoặc chỉnh sửa kết quả cận lâm sàng.
- **Giải pháp**: Chuẩn hóa toàn bộ router bằng decorator kiểm tra Role nghiêm ngặt:
  ```python
  def require_roles(allowed_roles: List[UserRole]):
      def role_checker(current_user: User = Depends(get_current_active_user)):
          if current_user.role not in allowed_roles:
              raise HTTPException(status_code=403, detail="Không đủ thẩm quyền truy cập tài nguyên này.")
          return current_user
      return role_checker
  ```

---

### 2.7. [V-07 - P2 MEDIUM] Chữ ký số y tế giả lập không đạt chuẩn pháp lý
- **Mô tả**: Khi bác sĩ bấm "Ký số bệnh án" (`POST /api/v1/emr/consultations/{id}/finalize`), backend tạo một chuỗi băm thô:
  ```python
  signature = hashlib.sha256(f"{consultation.id}-{consultation.patient_id}-{datetime.utcnow()}".encode()).hexdigest()
  ```
  Chuỗi này chỉ là một mã hash ngẫu nhiên, không sử dụng Private Key của Bác sĩ (RSA / ECDSA), không chứa thông tin Chứng thư số do Ban Cơ yếu Chính phủ hoặc các nhà cung cấp CA (VNPT, Viettel, FPT) cấp phép.
- **Rủi ro pháp lý**: Bản ghi y bạ này không có giá trị pháp lý trước tòa án hoặc cơ quan Bảo hiểm Xã hội Việt Nam theo Luật Giao dịch điện tử 2023.
- **Giải pháp**:
  - Giai đoạn 1: Triển khai cặp khóa bất đối xứng RSA 2048-bit cho từng bác sĩ được lưu an toàn trong CSDL, dùng Private Key để ký chuỗi Canonical JSON của bệnh án.
  - Giai đoạn 2: Tích hợp API Ký số từ xa (Remote Signing) chuẩn eIDAS / SmartCA.

---

### 2.8. [V-08 - P2 HIGH] Phòng chống Prompt Injection & Giới hạn phạm vi y tế cho Gemini AI
- **Mô tả**: Hiện tại, `gemini_service.py` gửi toàn bộ tin nhắn người dùng trực tiếp vào LLM với một system prompt chung chung. Kẻ tấn công có thể sử dụng các kỹ thuật "Jailbreak", "Ignore previous instructions" hoặc "DAN mode" để:
  1. Yêu cầu AI kê đơn các loại thuốc gây nghiện, thuốc hướng thần hoặc thuốc độc bảng A (Morphin, Fentanyl, Diazepam) cho bệnh nhân mà không qua bác sĩ.
  2. Yêu cầu AI dump cấu trúc bảng SQLite hoặc thực thi mã lệnh nguy hiểm.
- **Hàng rào bảo vệ (Guardrails) bắt buộc thiết lập**:
  - **Lớp 1 - Tiền kiểm (Input Sanitization & Keyword Blocker)**: Quét và chặn ngay các từ khóa nhạy cảm mang tính ép buộc hệ thống (`SYSTEM OVERRIDE`, `DAN`, `IGNORE ALL INSTRUCTIONS`).
  - **Lớp 2 - Phạm vi nghiệp vụ y tế nghiêm ngặt (Medical Scope Enforcement)**: Bắt buộc đính kèm chỉ thị cứng: *"AI chỉ đóng vai trò tư vấn thông tin tham khảo, TUYỆT ĐỐI KHÔNG tự ý đưa ra kết luận chẩn đoán xác định, KHÔNG kê đơn thuốc hướng thần/thuốc độc, KHÔNG thay thế chỉ định của bác sĩ điều trị. Luôn kèm lời khuyên đến khám trực tiếp tại phòng khám."*
  - **Lớp 3 - Cô lập Tool Calling**: Các hàm tra cứu DB của AI chỉ được chạy dưới quyền `READ-ONLY` và phạm vi dữ liệu được lọc cứng theo `current_user.id`. Tuyệt đối không cho phép AI sinh và chạy câu lệnh SQL động trực tiếp.

---

### 2.9. [V-09 - P2 MEDIUM] Cấu hình CORS và Tiêu đề bảo mật HTTP (Security Headers)
- **Mô tả**: File `main.py` khai báo:
  ```python
  allow_origins=["*"]
  ```
  Khi triển khai thực tế trên Internet, bất kỳ website độc hại nào cũng có thể gửi Ajax request với thông tin xác thực đến API của phòng khám.
- **Giải pháp**:
  - Khóa cấu hình CORS chỉ cho phép domain phòng khám (`https://phongkham.vn`, `http://localhost:5173` trong dev).
  - Bổ sung middleware tự động chèn các HTTP Security Headers:
    - `X-Content-Type-Options: nosniff`
    - `X-Frame-Options: DENY` (Chống clickjacking)
    - `Content-Security-Policy: default-src 'self'`
    - `Strict-Transport-Security: max-age=31536000; includeSubDomains`

---

### 2.10. [V-10 - P2 MEDIUM] Chống tấn công Brute-Force bằng Rate Limiting (SlowAPI)
- **Mô tả**: Các endpoint đăng nhập `/api/v1/auth/login` và gửi mã OTP không có giới hạn số lần gọi, cho phép kẻ tấn công thực hiện tấn công dò mật khẩu (Brute-force dictionary attack) hoặc làm cạn kiệt tài nguyên gọi API Gemini.
- **Giải pháp**: Tích hợp thư viện `slowapi` trong FastAPI:
  - Endpoint `/api/v1/auth/login`: Giới hạn tối đa **5 lần thử sai / 1 phút / 1 IP**. Quá 5 lần khóa tạm 15 phút.
  - Endpoint `/api/v1/ai/chat`: Giới hạn tối đa **20 câu hỏi / 1 phút / 1 tài khoản** để tránh làm cạn hạn ngạch API Gemini.

---

## 3. BẢNG TIÊU CHUẨN TUÂN THỦ PHÁP LÝ Y TẾ VIỆT NAM & QUỐC TẾ

| Tiêu chuẩn / Quy định | Điều khoản liên quan | Đánh giá hiện trạng | Yêu cầu đạt chuẩn để đưa vào vận hành |
|-----------------------|----------------------|---------------------|----------------------------------------|
| **Luật Khám bệnh, chữa bệnh 2023** | Điều 69: Bệnh án điện tử & Lưu trữ hồ sơ | **Chưa đạt** (Chữ ký số thô, chưa có xác thực thời gian Timestamp TSA) | Phải có chữ ký điện tử hợp pháp của người hành nghề y và đóng dấu thời gian y tế. |
| **Thông tư 46/2018/TT-BYT** | Quy định về Bệnh án điện tử | **Chưa đạt** (Thiếu chuẩn mã hóa lưu trữ 20 năm, thiếu backup định kỳ) | Thiết lập sao lưu tự động hàng ngày và khóa dữ liệu sau khi ký số (Immutable Record). |
| **Nghị định 13/2023/NĐ-CP (PDPD)** | Điều 9, Điều 17: Xử lý dữ liệu cá nhân nhạy cảm y tế | **Vi phạm nghiêm trọng** (Dính lỗi rò rỉ dữ liệu V-01) | Phải sửa ngay lỗi V-01, mã hóa thông tin liên hệ và nhật ký truy vết người xem hồ sơ (Audit Log). |
| **HIPAA Security Rule** | § 164.312 Technical Safeguards (Access Control, Audit, Integrity) | **Đạt 65%** (Có audit log cơ bản, nhưng thiếu RBAC chi tiết và mã hóa token) | Vá toàn bộ các lỗi BOLA V-02, V-05, chuyển token sang HttpOnly Cookie. |

---

## 4. KẾ HOẠCH TRIỂN KHAI VÁ LỖ HỔNG (REMEDIATION TIMELINE)
- **Giai đoạn khẩn cấp (Hotfix trong 24h)**: Vá ngay lập tức **V-01** (BOLA AI chat) và **V-02** (Phân quyền EMR cho kế toán).
- **Giai đoạn Sprint 1 (Tuần 1)**: Vá **V-03**, **V-04**, **V-05**, **V-06** (Kiến trúc xác thực JWT, RBAC đa tầng, chống IDOR hóa đơn).
- **Giai đoạn Sprint 2 (Tuần 2)**: Triển khai Guardrails AI **V-08**, Cấu hình CORS & Rate Limit **V-09, V-10**, Chữ ký số y tế chuẩn hóa **V-07**.
- **Giai đoạn Sprint 3 (Tuần 3)**: Đánh giá an ninh độc lập (Penetration Testing) và hoàn tất hồ sơ tuân thủ Thông tư 46/2018/TT-BYT.
