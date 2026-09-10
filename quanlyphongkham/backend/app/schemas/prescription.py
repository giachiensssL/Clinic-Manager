"""
Pydantic schemas cho Prescription (Toa thuốc) và Medicine (Thuốc)
Bao gồm tạo toa, cập nhật, response đầy đủ với chi tiết thuốc
"""
from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime


# ===================== MEDICINE SCHEMAS =====================

class MedicineResponse(BaseModel):
    """Response thông tin thuốc từ danh mục"""
    id: str
    name: str
    generic_name: Optional[str] = None
    brand_name: Optional[str] = None
    drug_class: Optional[str] = None
    form: Optional[str] = None           # Dạng bào chế: tablet, capsule, syrup, ...
    strength: Optional[str] = None       # Hàm lượng: "500mg", "250mg/5ml"
    unit: Optional[str] = None           # Đơn vị: viên, chai, ống
    contraindications: Optional[str] = None
    interactions: Optional[str] = None
    price: float
    is_active: bool

    model_config = {"from_attributes": True}


class MedicineCreate(BaseModel):
    """Schema thêm thuốc vào danh mục"""
    name: str
    generic_name: Optional[str] = None
    brand_name: Optional[str] = None
    drug_class: Optional[str] = None
    form: Optional[str] = None
    strength: Optional[str] = None
    unit: Optional[str] = None
    contraindications: Optional[str] = None
    interactions: Optional[str] = None
    price: float = 0.0
    is_active: bool = True

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Tên thuốc phải có ít nhất 2 ký tự")
        return v

    @field_validator("price")
    @classmethod
    def validate_price(cls, v: float) -> float:
        if v < 0:
            raise ValueError("Giá thuốc không được âm")
        return v


class MedicineUpdate(BaseModel):
    """Schema cập nhật thông tin thuốc"""
    name: Optional[str] = None
    generic_name: Optional[str] = None
    brand_name: Optional[str] = None
    drug_class: Optional[str] = None
    form: Optional[str] = None
    strength: Optional[str] = None
    unit: Optional[str] = None
    contraindications: Optional[str] = None
    interactions: Optional[str] = None
    price: Optional[float] = None
    is_active: Optional[bool] = None


class MedicineListResponse(BaseModel):
    """Response danh sách thuốc có phân trang"""
    items: List[MedicineResponse]
    total: int
    page: int
    size: int
    pages: int

    model_config = {"from_attributes": True}


# ===================== PRESCRIPTION ITEM SCHEMAS =====================

class PrescriptionItemCreate(BaseModel):
    """Schema chi tiết một loại thuốc trong toa"""
    medicine_id: str
    dosage: str            # Liều dùng: "1 viên", "5ml"
    frequency: str         # Tần suất: "3 lần/ngày", "Sáng - Trưa - Tối"
    duration_days: int     # Số ngày dùng
    quantity: int          # Tổng số lượng cấp phát
    instructions: Optional[str] = None   # Hướng dẫn đặc biệt: "uống trước ăn"

    @field_validator("duration_days")
    @classmethod
    def validate_duration(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("Số ngày dùng thuốc phải lớn hơn 0")
        if v > 365:
            raise ValueError("Số ngày dùng thuốc không được vượt quá 365 ngày")
        return v

    @field_validator("quantity")
    @classmethod
    def validate_quantity(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("Số lượng phải lớn hơn 0")
        return v

    @field_validator("dosage", "frequency")
    @classmethod
    def validate_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Không được để trống")
        return v.strip()


class PrescriptionItemResponse(BaseModel):
    """Response chi tiết một thuốc trong toa — bao gồm thông tin thuốc"""
    id: str
    prescription_id: str
    medicine_id: str
    dosage: str
    frequency: str
    duration_days: int
    quantity: int
    instructions: Optional[str] = None
    unit_price: float
    total_price: float = 0.0      # = unit_price * quantity (tính phía service)
    # Nested medicine info
    medicine: Optional[MedicineResponse] = None

    model_config = {"from_attributes": True}


# ===================== PRESCRIPTION SCHEMAS =====================

class PrescriptionCreate(BaseModel):
    """Schema tạo toa thuốc mới cho consultation"""
    consultation_id: str
    items: List[PrescriptionItemCreate]
    notes: Optional[str] = None      # Ghi chú tổng thể toa thuốc

    @field_validator("items")
    @classmethod
    def validate_items(cls, v: List[PrescriptionItemCreate]) -> List[PrescriptionItemCreate]:
        if not v:
            raise ValueError("Toa thuốc phải có ít nhất một loại thuốc")
        # Kiểm tra không có medicine_id trùng nhau
        medicine_ids = [item.medicine_id for item in v]
        if len(medicine_ids) != len(set(medicine_ids)):
            raise ValueError("Không được kê cùng một loại thuốc nhiều lần trong cùng toa")
        return v


class PrescriptionUpdate(BaseModel):
    """Schema cập nhật toa thuốc (chỉ khi chưa cấp phát)"""
    notes: Optional[str] = None
    items: Optional[List[PrescriptionItemCreate]] = None


class PrescriptionResponse(BaseModel):
    """Response đầy đủ toa thuốc — bao gồm chi tiết từng thuốc"""
    id: str
    prescription_code: str
    consultation_id: str
    doctor_id: str
    patient_id: str
    notes: Optional[str] = None
    dispensed_at: Optional[datetime] = None
    is_dispensed: bool = False           # True khi dispensed_at có giá trị
    total_medicine_fee: float = 0.0     # Tổng tiền thuốc (tính phía service)
    created_at: datetime
    updated_at: datetime
    # Nested
    doctor_name: Optional[str] = None
    patient_name: Optional[str] = None
    items: List[PrescriptionItemResponse] = []

    model_config = {"from_attributes": True}


class PrescriptionListResponse(BaseModel):
    """Response danh sách toa thuốc có phân trang"""
    items: List[PrescriptionResponse]
    total: int
    page: int
    size: int
    pages: int

    model_config = {"from_attributes": True}


class DispensePrescriptionRequest(BaseModel):
    """Request cấp phát toa thuốc cho bệnh nhân"""
    prescription_id: str
    notes: Optional[str] = None
