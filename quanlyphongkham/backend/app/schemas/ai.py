"""
Pydantic schemas cho AI Chat & Guardrail
Bao gồm chat request/response, summarization, guardrail rules management
"""
from pydantic import BaseModel, field_validator
from typing import Optional, List, Any, Dict
from datetime import datetime


# ===================== CHAT SCHEMAS =====================

class ChatRequest(BaseModel):
    """Request gửi tin nhắn đến AI assistant"""
    message: str
    conversation_id: Optional[str] = None   # None = tạo conversation mới
    context: Optional[Dict[str, Any]] = None  # Ngữ cảnh bổ sung (patient_id, ...)

    @field_validator("message")
    @classmethod
    def validate_message(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Tin nhắn không được để trống")
        if len(v) > 10000:
            raise ValueError("Tin nhắn quá dài (tối đa 10,000 ký tự)")
        return v


class ChatResponse(BaseModel):
    """Response từ AI assistant"""
    response: str = ""                      # Nội dung trả lời AI
    message: str = ""                       # Alias field (tương thích)
    conversation_id: str
    message_id: str = ""                    # Optional, tạo tự động
    guardrail_blocked: bool = False         # True nếu bị chặn bởi guardrail
    guardrail_reason: Optional[str] = None  # Lý do bị chặn (nếu có)
    tokens_used: Optional[int] = None
    model: Optional[str] = None
    created_at: Optional[datetime] = None

    def model_post_init(self, __context: Any) -> None:
        """Sync response <-> message fields"""
        if self.response and not self.message:
            object.__setattr__(self, 'message', self.response)
        elif self.message and not self.response:
            object.__setattr__(self, 'response', self.message)
        if not self.created_at:
            object.__setattr__(self, 'created_at', datetime.utcnow())
        if not self.message_id:
            import uuid
            object.__setattr__(self, 'message_id', str(uuid.uuid4()))


class ConversationResponse(BaseModel):
    """Response thông tin conversation"""
    id: str
    user_id: str
    title: Optional[str] = None
    is_active: bool
    message_count: int = 0
    created_at: datetime
    updated_at: datetime
    last_message: Optional[str] = None      # Tin nhắn cuối cùng để preview

    model_config = {"from_attributes": True}


class ConversationListResponse(BaseModel):
    """Response danh sách conversations"""
    items: List[ConversationResponse]
    total: int
    page: int
    size: int
    pages: int


class MessageHistoryItem(BaseModel):
    """Một tin nhắn trong lịch sử chat"""
    id: str
    role: str                               # "user" | "assistant" | "system"
    content: str
    guardrail_blocked: bool = False
    guardrail_reason: Optional[str] = None
    tokens_used: Optional[int] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationHistoryResponse(BaseModel):
    """Lịch sử tin nhắn của một conversation"""
    conversation_id: str
    title: Optional[str] = None
    messages: List[MessageHistoryItem]
    total_messages: int


# ===================== SUMMARIZATION SCHEMAS =====================

class SummarizeRequest(BaseModel):
    """Request tóm tắt hồ sơ bệnh nhân bằng AI"""
    patient_id: str
    include_consultations: bool = True
    include_prescriptions: bool = True
    include_diagnoses: bool = True
    max_records: int = 10                   # Số lượng record tối đa đưa vào context

    @field_validator("max_records")
    @classmethod
    def validate_max_records(cls, v: int) -> int:
        if not (1 <= v <= 50):
            raise ValueError("max_records phải từ 1–50")
        return v


class SummarizeSourceRecord(BaseModel):
    """Một record nguồn được dùng để tóm tắt"""
    type: str                               # "consultation" | "prescription" | "diagnosis"
    record_id: str
    date: Optional[str] = None
    summary: Optional[str] = None


class SummarizeResponse(BaseModel):
    """Response tóm tắt hồ sơ bệnh nhân từ AI"""
    patient_id: str
    patient_name: Optional[str] = None
    summary: str                            # Nội dung tóm tắt
    source_records: List[SummarizeSourceRecord] = []
    generated_at: datetime
    model: str
    tokens_used: Optional[int] = None
    disclaimer: str = (
        "Thông tin này được tạo bởi AI và chỉ mang tính tham khảo. "
        "Không thay thế phán đoán lâm sàng của bác sĩ."
    )


# ===================== GUARDRAIL SCHEMAS =====================

class GuardrailRuleCreate(BaseModel):
    """Schema tạo quy tắc guardrail mới"""
    name: str
    rule_type: str          # "keyword" | "regex" | "pattern"
    pattern: str            # Từ khóa hoặc regex pattern
    description: Optional[str] = None
    applies_to: str = "both"   # "input" | "output" | "both"
    is_active: bool = True

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3:
            raise ValueError("Tên quy tắc phải có ít nhất 3 ký tự")
        return v

    @field_validator("rule_type")
    @classmethod
    def validate_rule_type(cls, v: str) -> str:
        valid_types = {"keyword", "regex", "pattern"}
        if v not in valid_types:
            raise ValueError(f"rule_type phải là một trong: {', '.join(valid_types)}")
        return v

    @field_validator("applies_to")
    @classmethod
    def validate_applies_to(cls, v: str) -> str:
        valid_values = {"input", "output", "both"}
        if v not in valid_values:
            raise ValueError(f"applies_to phải là một trong: {', '.join(valid_values)}")
        return v

    @field_validator("pattern")
    @classmethod
    def validate_pattern(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Pattern không được để trống")
        return v.strip()


class GuardrailRuleUpdate(BaseModel):
    """Schema cập nhật guardrail rule"""
    name: Optional[str] = None
    pattern: Optional[str] = None
    description: Optional[str] = None
    applies_to: Optional[str] = None
    is_active: Optional[bool] = None


class GuardrailRuleResponse(BaseModel):
    """Response thông tin guardrail rule"""
    id: str
    name: str
    rule_type: str
    pattern: str
    description: Optional[str] = None
    is_active: bool
    applies_to: str
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class GuardrailRuleListResponse(BaseModel):
    """Response danh sách guardrail rules"""
    items: List[GuardrailRuleResponse]
    total: int
    page: int
    size: int
    pages: int


class GuardrailCheckRequest(BaseModel):
    """Request kiểm tra nội dung với guardrail rules (nội bộ)"""
    content: str
    direction: str = "input"   # "input" | "output"


class GuardrailCheckResponse(BaseModel):
    """Response kết quả kiểm tra guardrail"""
    is_blocked: bool
    matched_rules: List[str] = []   # Danh sách rule_id bị match
    reason: Optional[str] = None


# ===================== AI TOOL CALL SCHEMAS =====================

class AIToolCallResponse(BaseModel):
    """Response log của một AI tool call"""
    id: str
    conversation_id: Optional[str] = None
    tool_name: str
    tool_input: Optional[str] = None
    tool_output: Optional[str] = None
    status: str                              # "success" | "error" | "blocked"
    error_message: Optional[str] = None
    execution_time_ms: Optional[int] = None
    created_at: datetime

    model_config = {"from_attributes": True}
