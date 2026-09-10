"""
Pydantic schemas cho Billing (Hóa đơn) và Payment (Thanh toán)
Bao gồm tạo hóa đơn, ghi nhận thanh toán, thống kê doanh thu
"""
from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import date, datetime

from app.models.models import BillingStatus, PaymentMethod


# ===================== SERVICE IN BILLING =====================

class BillingServiceItem(BaseModel):
    """Dịch vụ đã sử dụng trong hóa đơn"""
    service_id: str
    quantity: int = 1
    unit_price: Optional[float] = None  # Override nếu khác giá mặc định

    @field_validator("quantity")
    @classmethod
    def validate_quantity(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("Số lượng phải lớn hơn 0")
        return v


class BillingServiceItemResponse(BaseModel):
    """Response chi tiết dịch vụ trong hóa đơn"""
    service_id: str
    service_name: Optional[str] = None
    service_code: Optional[str] = None
    quantity: int
    unit_price: float
    total_price: float

    model_config = {"from_attributes": True}


# ===================== BILLING SCHEMAS =====================

class BillingCreate(BaseModel):
    """Schema tạo hóa đơn mới từ appointment"""
    appointment_id: str
    services: List[BillingServiceItem] = []    # Danh sách dịch vụ sử dụng
    consultation_fee: Optional[float] = None   # Override phí khám nếu cần
    medicine_fee: Optional[float] = None       # Phí thuốc (lấy từ prescription)
    insurance_covered: float = 0.0             # Số tiền bảo hiểm chi trả
    discount: float = 0.0                      # Giảm giá (VNĐ)
    due_date: Optional[date] = None
    notes: Optional[str] = None

    @field_validator("insurance_covered", "discount")
    @classmethod
    def validate_non_negative(cls, v: float) -> float:
        if v < 0:
            raise ValueError("Giá trị không được âm")
        return v

    @field_validator("consultation_fee", "medicine_fee")
    @classmethod
    def validate_fee(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and v < 0:
            raise ValueError("Phí không được âm")
        return v


class BillingUpdate(BaseModel):
    """Schema cập nhật hóa đơn"""
    insurance_covered: Optional[float] = None
    discount: Optional[float] = None
    due_date: Optional[date] = None
    notes: Optional[str] = None


class BillingResponse(BaseModel):
    """Response đầy đủ hóa đơn — bao gồm thông tin bệnh nhân, lịch hẹn"""
    id: str
    invoice_code: str
    patient_id: str
    appointment_id: str
    consultation_fee: float
    medicine_fee: float
    service_fee: float
    total_amount: float
    insurance_covered: float
    discount: float
    paid_amount: float
    remaining_amount: float
    status: BillingStatus
    due_date: Optional[date] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    # Nested
    patient_name: Optional[str] = None
    patient_code: Optional[str] = None
    patient_phone: Optional[str] = None
    insurance_number: Optional[str] = None
    appointment_date: Optional[date] = None
    doctor_name: Optional[str] = None
    # Breakdown các khoản
    services: List[BillingServiceItemResponse] = []
    payments: List["PaymentResponse"] = []

    model_config = {"from_attributes": True}


class BillingListResponse(BaseModel):
    """Response danh sách hóa đơn có phân trang"""
    items: List[BillingResponse]
    total: int
    page: int
    size: int
    pages: int

    model_config = {"from_attributes": True}


# ===================== PAYMENT SCHEMAS =====================

class PaymentCreate(BaseModel):
    """Schema ghi nhận thanh toán"""
    billing_id: str
    amount: float
    payment_method: PaymentMethod
    transaction_id: Optional[str] = None   # Mã giao dịch (cho chuyển khoản, thẻ)
    notes: Optional[str] = None

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Số tiền thanh toán phải lớn hơn 0")
        return v


class PaymentResponse(BaseModel):
    """Response thông tin thanh toán"""
    id: str
    billing_id: str
    amount: float
    payment_method: PaymentMethod
    transaction_id: Optional[str] = None
    notes: Optional[str] = None
    created_by: Optional[str] = None
    created_by_name: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# Resolve forward reference
BillingResponse.model_rebuild()


# ===================== REVENUE STATS =====================

class RevenueStatsResponse(BaseModel):
    """Thống kê doanh thu theo khoảng thời gian"""
    date_from: date
    date_to: date
    total_billed: float = 0.0           # Tổng tiền xuất hóa đơn
    total_collected: float = 0.0        # Tổng tiền đã thu
    total_outstanding: float = 0.0      # Tổng tiền còn lại phải thu
    total_insurance: float = 0.0        # Tổng tiền bảo hiểm
    total_discount: float = 0.0
    invoice_count: int = 0
    paid_count: int = 0
    unpaid_count: int = 0
    by_payment_method: Optional[dict] = None   # breakdown theo phương thức
