"""
AI Guardrails — Input và Output validation cho AI requests
Đây là lớp bảo vệ quan trọng nhất trong hệ thống AI
"""
import re
from typing import Optional
from dataclasses import dataclass
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.models import AIGuardrailRule


@dataclass
class GuardrailResult:
    is_blocked: bool
    reason: Optional[str] = None
    matched_pattern: Optional[str] = None


# Danh sách từ khóa mặc định cần chặn — Admin có thể thay đổi qua API
DEFAULT_BLOCKED_KEYWORDS = [
    "chẩn đoán", "diagnose", "diagnosis",
    "kê thuốc", "prescribe", "prescription recommendation",
    "điều trị", "treatment plan", "treatment recommendation",
    "phác đồ", "protocol", "regimen",
    "bệnh gì", "tôi bị bệnh",
    "uống thuốc gì", "what medicine", "medicine recommendation",
    "toa thuốc", "drug recommendation",
    "kết luận bệnh", "medical conclusion",
    "xét nghiệm nào", "which test",
    "ignore previous", "ignore instructions",
    "system prompt", "jailbreak",
    "DAN", "do anything now",
    "bypass", "override",
]

# Regex patterns cho prompt injection detection
INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?previous\s+instructions?",
    r"(forget|disregard)\s+(your|all)\s+(previous\s+)?(instructions?|rules?|guidelines?)",
    r"you\s+are\s+now\s+(a|an|the)",
    r"act\s+as\s+(a|an|the)",
    r"pretend\s+(you\s+are|to\s+be)",
    r"system\s*:\s*you\s+are",
    r"\[INST\].*\[/INST\]",
    r"<\|im_start\|>",
    r"###\s*(instruction|human|assistant)",
]

# Từ khóa nhạy cảm về lâm sàng — AI không được xử lý
CLINICAL_KEYWORDS = [
    "diagnose", "chẩn đoán bệnh",
    "prescribe medication", "kê đơn thuốc",
    "treatment protocol", "phác đồ điều trị",
    "medical advice", "tư vấn y tế",
    "drug dosage recommendation",
]


class InputGuardrail:
    """Kiểm tra và lọc input trước khi gửi đến LLM"""

    def __init__(self, custom_rules: list[AIGuardrailRule] = None):
        self.custom_rules = custom_rules or []

    def check(self, text: str) -> GuardrailResult:
        """
        Kiểm tra input:
        1. Keyword matching
        2. Regex pattern matching (injection detection)
        3. Custom rules từ database
        """
        text_lower = text.lower()

        # 1. Check default blocked keywords
        for keyword in DEFAULT_BLOCKED_KEYWORDS:
            if keyword.lower() in text_lower:
                return GuardrailResult(
                    is_blocked=True,
                    reason=f"Yêu cầu liên quan đến chẩn đoán hoặc điều trị y tế",
                    matched_pattern=keyword,
                )

        # 2. Check injection patterns
        for pattern in INJECTION_PATTERNS:
            if re.search(pattern, text_lower, re.IGNORECASE):
                return GuardrailResult(
                    is_blocked=True,
                    reason="Phát hiện prompt injection attempt",
                    matched_pattern=pattern,
                )

        # 3. Check custom rules from DB
        for rule in self.custom_rules:
            if not rule.is_active:
                continue
            if rule.applies_to not in ["input", "both"]:
                continue

            if rule.rule_type == "keyword":
                if rule.pattern.lower() in text_lower:
                    return GuardrailResult(
                        is_blocked=True,
                        reason=f"Vi phạm quy tắc: {rule.name}",
                        matched_pattern=rule.pattern,
                    )
            elif rule.rule_type == "regex":
                try:
                    if re.search(rule.pattern, text, re.IGNORECASE):
                        return GuardrailResult(
                            is_blocked=True,
                            reason=f"Vi phạm quy tắc: {rule.name}",
                            matched_pattern=rule.pattern,
                        )
                except re.error:
                    pass  # Invalid regex, skip

        return GuardrailResult(is_blocked=False)


class OutputGuardrail:
    """Kiểm tra output của LLM trước khi trả về cho user"""

    def check(self, text: str) -> GuardrailResult:
        """
        Kiểm tra output có chứa nội dung lâm sàng nguy hiểm không
        """
        text_lower = text.lower()

        # Phát hiện nếu AI cố tình đưa ra chẩn đoán
        diagnosis_patterns = [
            r"bạn\s+(đang\s+)?bị\s+(bệnh|mắc)",
            r"triệu\s+chứng\s+cho\s+thấy",
            r"khả\s+năng\s+cao\s+là\s+bệnh",
            r"bạn\s+nên\s+uống\s+thuốc",
            r"liều\s+dùng\s+là",
            r"uống\s+\d+\s+(viên|mg|ml)",
            r"tôi\s+chẩn\s+đoán",
            r"i\s+diagnose",
            r"you\s+(have|are\s+suffering\s+from)",
            r"take\s+\d+\s+(mg|ml|tablets?|pills?)",
        ]

        for pattern in diagnosis_patterns:
            if re.search(pattern, text_lower, re.IGNORECASE):
                return GuardrailResult(
                    is_blocked=True,
                    reason="AI đã tạo ra nội dung chẩn đoán/điều trị — đã được chặn",
                    matched_pattern=pattern,
                )

        return GuardrailResult(is_blocked=False)


async def load_guardrail_rules(db: AsyncSession) -> list[AIGuardrailRule]:
    """Tải custom guardrail rules từ database"""
    result = await db.execute(
        select(AIGuardrailRule).where(AIGuardrailRule.is_active == True)
    )
    return result.scalars().all()


# Singleton instances
input_guardrail = InputGuardrail()
output_guardrail = OutputGuardrail()


BLOCKED_RESPONSE = (
    "Tôi là trợ lý hành chính của phòng khám và không có chức năng "
    "chẩn đoán hoặc tư vấn điều trị. Bạn vui lòng liên hệ bác sĩ để "
    "được tư vấn chuyên môn."
)

SCOPE_EXCEEDED_RESPONSE = (
    "Yêu cầu bị giới hạn.\n\n"
    "Trợ lý AI chỉ hỗ trợ các vấn đề hành chính như đặt lịch, "
    "thông tin phòng khám, và quy trình khám. "
    "Tôi không cung cấp chẩn đoán hoặc tư vấn điều trị."
)
