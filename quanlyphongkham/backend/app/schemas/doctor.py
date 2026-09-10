"""
Pydantic schemas cho Doctor (Bác sĩ)
Bao gồm doctor info, working schedule, specialty, department
"""
from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import time, datetime

from app.models.models import Gender


# ===================== NESTED SCHEMAS =====================

class SpecialtyBriefResponse(BaseModel):
    """Thông tin chuyên khoa tóm tắt"""
    id: str
    name: str
    description: Optional[str] = None

    model_config = {"from_attributes": True}


class DepartmentBriefResponse(BaseModel):
    """Thông tin khoa/phòng ban tóm tắt"""
    id: str
    name: str
    description: Optional[str] = None

    model_config = {"from_attributes": True}


class StaffBriefResponse(BaseModel):
    """Thông tin nhân viên tóm tắt — dùng trong DoctorResponse"""
    id: str
    employee_id: str
    full_name: str
    phone: Optional[str] = None
    gender: Optional[Gender] = None
    date_of_birth: Optional[str] = None

    model_config = {"from_attributes": True}


# ===================== WORKING SCHEDULE =====================

class WorkingScheduleCreate(BaseModel):
    """Schema tạo lịch làm việc cho bác sĩ"""
    day_of_week: int                  # 0=Thứ 2, 6=Chủ nhật
    start_time: time
    end_time: time
    slot_duration_minutes: int = 30  # Mặc định mỗi slot 30 phút
    is_active: bool = True

    @field_validator("day_of_week")
    @classmethod
    def validate_day(cls, v: int) -> int:
        if not (0 <= v <= 6):
            raise ValueError("day_of_week phải từ 0 (Thứ 2) đến 6 (Chủ nhật)")
        return v

    @field_validator("slot_duration_minutes")
    @classmethod
    def validate_slot_duration(cls, v: int) -> int:
        valid_durations = {15, 20, 30, 45, 60}
        if v not in valid_durations:
            raise ValueError(f"slot_duration_minutes phải là một trong: {valid_durations}")
        return v


class WorkingScheduleUpdate(BaseModel):
    """Schema cập nhật lịch làm việc"""
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    slot_duration_minutes: Optional[int] = None
    is_active: Optional[bool] = None


class WorkingScheduleResponse(BaseModel):
    """Response lịch làm việc"""
    id: str
    doctor_id: str
    day_of_week: int
    day_name: Optional[str] = None   # "Thứ 2", "Thứ 3", ... được tính phía service
    start_time: time
    end_time: time
    slot_duration_minutes: int
    is_active: bool

    model_config = {"from_attributes": True}


# ===================== DOCTOR SCHEMAS =====================

class DoctorCreate(BaseModel):
    """Schema tạo bác sĩ mới — liên kết với Staff có sẵn"""
    staff_id: str
    department_id: str
    specialty_id: str
    license_number: str
    qualification: Optional[str] = None    # Bằng cấp, chứng chỉ
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    consultation_fee: float = 0.0
    is_active: bool = True

    @field_validator("license_number")
    @classmethod
    def validate_license(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 5:
            raise ValueError("Số giấy phép hành nghề phải có ít nhất 5 ký tự")
        return v

    @field_validator("consultation_fee")
    @classmethod
    def validate_fee(cls, v: float) -> float:
        if v < 0:
            raise ValueError("Phí khám không được âm")
        return v


class DoctorUpdate(BaseModel):
    """Schema cập nhật thông tin bác sĩ"""
    department_id: Optional[str] = None
    specialty_id: Optional[str] = None
    license_number: Optional[str] = None
    qualification: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    consultation_fee: Optional[float] = None
    is_active: Optional[bool] = None

    @field_validator("consultation_fee")
    @classmethod
    def validate_fee(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and v < 0:
            raise ValueError("Phí khám không được âm")
        return v


class DoctorResponse(BaseModel):
    """Response thông tin bác sĩ cơ bản — bao gồm nested info"""
    id: str
    staff_id: str
    license_number: str
    qualification: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    consultation_fee: float
    is_active: bool
    created_at: datetime
    updated_at: datetime
    # Nested
    staff: Optional[StaffBriefResponse] = None
    specialty: Optional[SpecialtyBriefResponse] = None
    department: Optional[DepartmentBriefResponse] = None

    model_config = {"from_attributes": True}


class DoctorDetail(DoctorResponse):
    """Response chi tiết bác sĩ — bao gồm lịch làm việc"""
    working_schedules: List[WorkingScheduleResponse] = []
    total_appointments: int = 0

    model_config = {"from_attributes": True}


class DoctorListResponse(BaseModel):
    """Response danh sách bác sĩ có phân trang"""
    items: List[DoctorResponse]
    total: int
    page: int
    size: int
    pages: int

    model_config = {"from_attributes": True}


# ===================== SPECIALTY & DEPARTMENT =====================

class SpecialtyCreate(BaseModel):
    """Tạo chuyên khoa mới"""
    name: str
    description: Optional[str] = None
    is_active: bool = True

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Tên chuyên khoa phải có ít nhất 2 ký tự")
        return v


class SpecialtyResponse(BaseModel):
    """Response thông tin chuyên khoa"""
    id: str
    name: str
    description: Optional[str] = None
    is_active: bool
    created_at: datetime
    doctor_count: Optional[int] = None

    model_config = {"from_attributes": True}


class DepartmentCreate(BaseModel):
    """Tạo khoa/phòng ban mới"""
    name: str
    description: Optional[str] = None
    is_active: bool = True

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Tên khoa phải có ít nhất 2 ký tự")
        return v


class DepartmentResponse(BaseModel):
    """Response thông tin khoa"""
    id: str
    name: str
    description: Optional[str] = None
    is_active: bool
    created_at: datetime
    doctor_count: Optional[int] = None

    model_config = {"from_attributes": True}


class DoctorAvailableSlot(BaseModel):
    """Slot thời gian trống của bác sĩ cho ngày cụ thể"""
    start_time: time
    end_time: time
    is_available: bool = True
