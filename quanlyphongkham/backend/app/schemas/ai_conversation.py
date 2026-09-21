from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class AIMessageSchema(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class AIConversationBase(BaseModel):
    title: Optional[str] = None

class AIConversationCreate(AIConversationBase):
    pass

class AIConversationSchema(AIConversationBase):
    id: str
    user_id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AIConversationDetailSchema(AIConversationSchema):
    messages: List[AIMessageSchema] = []

class AIChatToolResponse(BaseModel):
    tool_name: str
    requires_confirmation: bool
    confirmation_message: Optional[str] = None
    data: Optional[dict] = None

class AIChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    action_confirmed: Optional[bool] = False # True if the user just confirmed a high-risk action
    pending_tool_call: Optional[dict] = None # Data of the tool waiting for confirmation

class AIChatResponse(BaseModel):
    conversation_id: str
    response: str
    is_tool_call: bool = False
    tool_call_details: Optional[AIChatToolResponse] = None
