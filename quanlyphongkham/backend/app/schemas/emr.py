"""
Pydantic schemas cho EMR / Consultation (Hồ sơ bệnh án điện tử)
Bao gồm vitals, clinical notes, diagnoses, chữ ký số
"""
from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import date, datetime

from app.models.models import EMRStatus


# ===================== VITALS =====================

class VitalsUpdate(BaseModel):
    """Cập nhật dấu hiệu sinh tồn của bệnh nhân"""
    blood_pressure: Optional[str] = None      # Ví dụ: "120/80" mmHg
    heart_rate: Optional[int] = None           # Nhịp tim (bpm)
    temperature: Optional[float] = None        # Nhiệt độ (°C)
    weight: Optional[float] = None             # Cân nặng (kg)
    height: Optional[float] = None             # Chiều cao (cm)
    oxygen_saturation: Optional[float] = None  # SpO2 (%)

    @field_validator("blood_pressure")
    @classmethod
    def validate_bp(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        # Validate format "120/80"
        parts = v.strip().split("/")
        if len(parts) != 2:
            raise ValueError("Huyết áp phải theo định dạng 'systolic/diastolic', ví dụ: '120/80'")
        try:
            systolic, diastolic = int(parts[0]), int(parts[1])
            if not (50 <= systolic <= 300):
                raise ValueError("Huyết áp tâm thu phải từ 50–300 mmHg")
            if not (30 <= diastolic <= 200):
                raise ValueError("Huyết áp tâm trương phải từ 30–200 mmHg")
        except ValueError as e:
            if "phải" in str(e):
                raise
            raise ValueError("Huyết áp phải là số nguyên") from e
        return v.strip()

    @field_validator("heart_rate")
    @classmethod
    def validate_heart_rate(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and not (20 <= v <= 300):
            raise ValueError("Nhịp tim phải từ 20–300 bpm")
        return v

    @field_validator("temperature")
    @classmethod
    def validate_temperature(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and not (30.0 <= v <= 45.0):
            raise ValueError("Nhiệt độ phải từ 30–45°C")
        return v

    @field_validator("oxygen_saturation")
    @classmethod
    def validate_spo2(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and not (50.0 <= v <= 100.0):
            raise ValueError("SpO2 phải từ 50–100%")
        return v

    @field_validator("weight")
    @classmethod
    def validate_weight(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and not (0.5 <= v <= 500.0):
            raise ValueError("Cân nặng phải từ 0.5–500 kg")
        return v

    @field_validator("height")
    @classmethod
    def validate_height(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and not (20.0 <= v <= 300.0):
            raise ValueError("Chiều cao phải từ 20–300 cm")
        return v


# ===================== DIAGNOSIS =====================

class DiagnosisAdd(BaseModel):
    """Thêm chẩn đoán vào consultation"""
    diagnosis_id: str
    is_primary: bool = False      # Chẩn đoán chính hay phụ
    notes: Optional[str] = None   # Ghi chú về chẩn đoán cụ thể này


class DiagnosisResponse(BaseModel):
    """Response thông tin chẩn đoán trong consultation"""
    id: str                        # ConsultationDiagnosis.id
    diagnosis_id: str
    icd10_code: Optional[str] = None
    diagnosis_name: Optional[str] = None
    is_primary: bool
    notes: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ===================== CONSULTATION (EMR) SCHEMAS =====================

class ConsultationCreate(BaseModel):
    """Schema tạo hồ sơ khám bệnh mới từ appointment"""
    appointment_id: str
    # Vitals (có thể điền sau)
    blood_pressure: Optional[str] = None
    heart_rate: Optional[int] = None
    temperature: Optional[float] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    oxygen_saturation: Optional[float] = None
    # Clinical notes
    chief_complaint: Optional[str] = None      # Lý do chính đến khám
    clinical_notes: Optional[str] = None       # Ghi chú lâm sàng
    physical_examination: Optional[str] = None # Kết quả khám lâm sàng
    treatment_plan: Optional[str] = None       # Kế hoạch điều trị
    follow_up_date: Optional[date] = None      # Ngày tái khám
    follow_up_notes: Optional[str] = None      # Hướng dẫn tái khám


class ConsultationUpdate(BaseModel):
    """Schema cập nhật EMR — không được update sau khi đã lock"""
    blood_pressure: Optional[str] = None
    heart_rate: Optional[int] = None
    temperature: Optional[float] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    oxygen_saturation: Optional[float] = None
    chief_complaint: Optional[str] = None
    clinical_notes: Optional[str] = None
    physical_examination: Optional[str] = None
    treatment_plan: Optional[str] = None
    follow_up_date: Optional[date] = None
    follow_up_notes: Optional[str] = None


class SignEMRRequest(BaseModel):
    """Request ký số và khóa hồ sơ EMR"""
    consultation_id: str
    confirmation: bool = False    # Bác sĩ xác nhận ký

    @field_validator("confirmation")
    @classmethod
    def must_confirm(cls, v: bool) -> bool:
        if not v:
            raise ValueError("Bạn phải xác nhận để ký hồ sơ EMR")
        return v


class ConsultationResponse(BaseModel):
    """Response đầy đủ của hồ sơ EMR"""
    id: str
    appointment_id: str
    patient_id: str
    doctor_id: str
    # Vitals
    blood_pressure: Optional[str] = None
    heart_rate: Optional[int] = None
    temperature: Optional[float] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    oxygen_saturation: Optional[float] = None
    # BMI — tính từ weight/height nếu có
    bmi: Optional[float] = None
    # Clinical
    chief_complaint: Optional[str] = None
    clinical_notes: Optional[str] = None
    physical_examination: Optional[str] = None
    treatment_plan: Optional[str] = None
    follow_up_date: Optional[date] = None
    follow_up_notes: Optional[str] = None
    # EMR Status
    status: EMRStatus
    signed_at: Optional[datetime] = None
    locked_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    # Nested
    patient_name: Optional[str] = None
    doctor_name: Optional[str] = None
    diagnoses: List[DiagnosisResponse] = []
    prescription_id: Optional[str] = None    # Liên kết toa thuốc
    prescription_code: Optional[str] = None

    model_config = {"from_attributes": True}


class ConsultationListResponse(BaseModel):
    """Response danh sách EMR có phân trang"""
    items: List[ConsultationResponse]
    total: int
    page: int
    size: int
    pages: int

    model_config = {"from_attributes": True}
