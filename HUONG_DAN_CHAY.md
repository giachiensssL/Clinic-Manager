# Hướng dẫn chạy dự án Quản lý phòng khám (Chạy thủ công)

Dự án này bao gồm 2 phần chính: **Backend** (Python / FastAPI) và **Frontend** (Node.js / Vite). Dưới đây là các bước để cài đặt và chạy dự án thủ công trên môi trường Windows.

## 1. Yêu cầu hệ thống
- **Python** (phiên bản 3.9 trở lên).
- **Node.js** (phiên bản 18 trở lên) và `npm`.

## 2. Thiết lập biến môi trường
Kiểm tra và đảm bảo rằng bạn đã có file `.env` được tạo ra từ file `.env.example`.
Các thư mục `backend/` và `frontend/` đều cần có file `.env` của riêng chúng (bạn có thể copy nội dung từ `.env.example` vào).
- Trong đó, chú ý thiết lập các thông số cơ sở dữ liệu `DATABASE_URL` (mặc định dùng SQLite) và các cấu hình AI `AI_MODE`, API Keys (nếu cần).

---

## 3. Khởi chạy Backend (Python / FastAPI)

Mở một cửa sổ Terminal (Command Prompt hoặc PowerShell) mới và làm theo các bước sau:

**Bước 1:** Di chuyển vào thư mục `backend`:
```cmd
cd quanlyphongkham/backend
```

**Bước 2:** Tạo môi trường ảo (Virtual Environment):
```cmd
python -m venv venv
```

**Bước 3:** Kích hoạt môi trường ảo:
```cmd
venv\Scripts\activate
```
*(Sau khi kích hoạt, bạn sẽ thấy chữ `(venv)` ở đầu dòng lệnh).*

**Bước 4:** Cài đặt các thư viện phụ thuộc (Dependencies):
```cmd
pip install -r requirements.txt
```

**Bước 5:** (Tùy chọn) Chạy Migrations để tạo bảng trong Database:
```cmd
alembic upgrade head
```

**Bước 6:** (Tùy chọn) Khởi tạo dữ liệu mẫu:
```cmd
python seed.py
```

**Bước 7:** Khởi chạy server backend:
```cmd
python -m uvicorn app.main:app --reload --port 8000
```
Backend của bạn lúc này sẽ hoạt động tại địa chỉ: **http://localhost:8000**

---

## 4. Khởi chạy Frontend (Node.js / Vite)

Mở **một cửa sổ Terminal khác** (giữ nguyên cửa sổ chạy backend) và thực hiện:

**Bước 1:** Di chuyển vào thư mục `frontend`:
```cmd
cd quanlyphongkham/frontend
```

**Bước 2:** Cài đặt các gói thư viện (Packages):
```cmd
npm install
```

**Bước 3:** Khởi chạy giao diện Frontend:
```cmd
npm run dev
```
Giao diện frontend của bạn sẽ chạy tại địa chỉ: **http://localhost:5173** (hoặc một port khác được hiển thị trên màn hình console).

---

## 5. Cách chạy nhanh (Sau khi đã cài đặt)
Sau khi bạn đã hoàn tất việc cài đặt các thư viện cho Backend (`pip install...`) và Frontend (`npm install`) ở các lần chạy đầu tiên, trong những lần tiếp theo, bạn chỉ cần chạy file script có sẵn:

Nhấn đúp chuột vào file **`run.bat`** (nằm ở thư mục `quanlyphongkham/run.bat`).
Script này sẽ tự động mở 2 cửa sổ cmd để chạy đồng thời cả Backend và Frontend cho bạn.
