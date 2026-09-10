"""
Pydantic schemas cho Appointment (Lịch hẹn)
Bao gồm booking, update status, calendar view
"""
from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import date, time, datetime

from app.models.models import AppointmentStatus


# ===================== APPOINTMENT SCHEMAS =====================

class AppointmentCreate(BaseModel):
    """Schema đặt lịch hẹn mới"""
    patient_id: str
    doctor_id: str
    specialty_id: str
    appointment_date: date
    start_time: time
    end_time: time
    reason: Optional[str] = None         # Lý do khám

    @field_validator("appointment_date")
    @classmethod
    def validate_date(cls, v: date) -> date:
        if v < date.today():
            raise ValueError("Ngày hẹn không được là ngày trong quá khứ")
        return v

    @field_validator("end_time")
    @classmethod
    def validate_time_range(cls, v: time, info) -> time:
        start = info.data.get("start_time")
        if start and v <= start:
            raise ValueError("Giờ kết thúc phải sau giờ bắt đầu")
        return v


class AppointmentUpdate(BaseModel):
    """Schema cập nhật lịch hẹn — chủ yếu là trạng thái và ghi chú"""
    status: Optional[AppointmentStatus] = None
    notes: Optional[str] = None
    cancellation_reason: Optional[str] = None   # Bắt buộc khi status = CANCELLED


class AppointmentCheckIn(BaseModel):
    """Schema check-in bệnh nhân tại quầy"""
    appointment_id: str
    notes: Optional[str] = None


class AppointmentResponse(BaseModel):
    """Response thông tin lịch hẹn đầy đủ — bao gồm thông tin nested"""
    id: str
    appointment_code: str
    patient_id: str
    doctor_id: str
    specialty_id: str
    appointment_date: date
    start_time: time
    end_time: time
    status: AppointmentStatus
    reason: Optional[str] = None
    notes: Optional[str] = None
    checked_in_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    cancellation_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    # Nested — được join từ relationships
    patient_name: Optional[str] = None
    patient_code: Optional[str] = None
    patient_phone: Optional[str] = None
    doctor_name: Optional[str] = None
    specialty_name: Optional[str] = None
    has_consultation: bool = False        # Đã có EMR chưa
    has_billing: bool = False             # Đã có hóa đơn chưa

    model_config = {"from_attributes": True}


class AppointmentDetail(AppointmentResponse):
    """Response chi tiết lịch hẹn — bao gồm consultation_id và billing_id"""
    consultation_id: Optional[str] = None
    billing_id: Optional[str] = None
    billing_status: Optional[str] = None

    model_config = {"from_attributes": True}


class AppointmentListResponse(BaseModel):
    """Response danh sách lịch hẹn có phân trang"""
    items: List[AppointmentResponse]
    total: int
    page: int
    size: int
    pages: int

    model_config = {"from_attributes": True}


class AppointmentCalendarEvent(BaseModel):
    """Schema cho calendar view — dạng FullCalendar events"""
    id: str
    title: str                            # "{patient_name} - {doctor_name}"
    start: str                            # ISO datetime: "2024-01-15T09:00:00"
    end: str                              # ISO datetime: "2024-01-15T09:30:00"
    status: AppointmentStatus
    backgroundColor: Optional[str] = None  # Màu theo status
    patient_id: str
    doctor_id: str
    patient_name: Optional[str] = None
    doctor_name: Optional[str] = None
    specialty_name: Optional[str] = None
    reason: Optional[str] = None

    model_config = {"from_attributes": True}


class AppointmentCalendarResponse(BaseModel):
    """Response danh sách events cho calendar"""
    events: List[AppointmentCalendarEvent]
    date_from: date
    date_to: date
    total_count: int


class AppointmentStatsResponse(BaseModel):
    """Thống kê lịch hẹn theo ngày/tuần/tháng"""
    scheduled: int = 0
    waiting: int = 0
    in_consultation: int = 0
    completed: int = 0
    paid: int = 0
    cancelled: int = 0
    no_show: int = 0
    total: int = 0
    date_from: Optional[date] = None
    date_to: Optional[date] = None
