"""
Patient Schemas — Pydantic models cho quan ly benh nhan
"""
from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel, Field


class PatientCreate(BaseModel):
    """Du lieu tao moi benh nhan"""
    full_name: str = Field(..., min_length=1, max_length=255)
    date_of_birth: date
    gender: str = Field(..., pattern="^(male|female|other)$")
    phone: str = Field(..., min_length=8, max_length=20)
    email: Optional[str] = None
    address: Optional[str] = None
    identity_number: Optional[str] = Field(None, max_length=20)
    blood_type: Optional[str] = Field(None, max_length=10)
    allergies: Optional[str] = None
    insurance_number: Optional[str] = Field(None, max_length=50)
    insurance_provider: Optional[str] = Field(None, max_length=255)
    emergency_contact_name: Optional[str] = Field(None, max_length=255)
    emergency_contact_phone: Optional[str] = Field(None, max_length=20)


class PatientUpdate(BaseModel):
    """Du lieu cap nhat benh nhan — tat ca optional"""
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    date_of_birth: Optional[date] = None
    gender: Optional[str] = Field(None, pattern="^(male|female|other)$")
    phone: Optional[str] = Field(None, min_length=8, max_length=20)
    email: Optional[str] = None
    address: Optional[str] = None
    identity_number: Optional[str] = Field(None, max_length=20)
    blood_type: Optional[str] = Field(None, max_length=10)
    allergies: Optional[str] = None
    insurance_number: Optional[str] = Field(None, max_length=50)
    insurance_provider: Optional[str] = Field(None, max_length=255)
    emergency_contact_name: Optional[str] = Field(None, max_length=255)
    emergency_contact_phone: Optional[str] = Field(None, max_length=20)
    is_active: Optional[bool] = None


class PatientResponse(BaseModel):
    """Thong tin benh nhan co ban — dung trong danh sach"""
    id: str
    patient_code: str
    full_name: str
    date_of_birth: date
    gender: str
    phone: str
    email: Optional[str] = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class RecentVisitSchema(BaseModel):
    id: str
    date: date
    department: str
    doctor: str
    reason: Optional[str] = None
    diagnosis: Optional[str] = None
    treatment: Optional[str] = None
    notes: Optional[str] = None
    
    model_config = {"from_attributes": True}

class CurrentMedicationSchema(BaseModel):
    id: str
    medicine_name: str
    dosage: str
    frequency: str
    instructions: Optional[str] = None
    
    model_config = {"from_attributes": True}

class PatientDetail(PatientResponse):
    """Thong tin benh nhan day du — dung khi xem chi tiet"""
    address: Optional[str] = None
    identity_number: Optional[str] = None
    blood_type: Optional[str] = None
    allergies: Optional[str] = None
    medical_history: Optional[str] = None
    insurance_number: Optional[str] = None
    insurance_provider: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    updated_at: datetime
    recent_visits: List[RecentVisitSchema] = []
    current_medications: List[CurrentMedicationSchema] = []


class PatientListResponse(BaseModel):
    """Phan hoi danh sach benh nhan co phan trang"""
    items: List[PatientResponse]
    total: int
    page: int
    size: int
    pages: int