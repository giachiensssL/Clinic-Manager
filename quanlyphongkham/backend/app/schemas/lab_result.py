from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

from app.models.models import LabResultStatus

class ResultItem(BaseModel):
    name: str
    value: float | str
    unit: Optional[str] = None
    ref_range: Optional[str] = None
    is_abnormal: bool = False

class LabResultBase(BaseModel):
    test_code: str = Field(..., max_length=50)
    test_name: str = Field(..., max_length=255)
    test_date: datetime
    status: LabResultStatus = LabResultStatus.PENDING
    result_data: Optional[List[ResultItem]] = None
    notes: Optional[str] = None
    file_url: Optional[str] = None

class LabResultCreate(LabResultBase):
    patient_id: str
    doctor_id: Optional[str] = None
    consultation_id: Optional[str] = None

class LabResultResponse(LabResultBase):
    id: str
    patient_id: str
    doctor_id: Optional[str] = None
    consultation_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    # Optional expanded relations
    patient_name: Optional[str] = None
    doctor_name: Optional[str] = None
    
    model_config = {"from_attributes": True}

class LabResultListResponse(BaseModel):
    items: List[LabResultResponse]
    total: int
