from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

from app.models.models import NotificationType

class NotificationBase(BaseModel):
    title: str = Field(..., max_length=255)
    message: str
    type: NotificationType
    reference_id: Optional[str] = None

class NotificationCreate(NotificationBase):
    user_id: str

class NotificationResponse(NotificationBase):
    id: str
    is_read: bool
    created_at: datetime
    
    model_config = {"from_attributes": True}

class NotificationListResponse(BaseModel):
    items: List[NotificationResponse]
    total: int
    unread_count: int
