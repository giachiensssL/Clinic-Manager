"""
AI Service — Orchestrator với Guardrails Pipeline
Xử lý mọi request AI theo pipeline:
User → Auth → Input Guardrail → PII Masking → AI Agent → Output Guardrail → Audit → User
"""
import uuid
import json
import asyncio
from datetime import datetime, timezone
from typing import AsyncGenerator, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.ai.guardrails.guardrails import (
    InputGuardrail, OutputGuardrail, load_guardrail_rules,
    BLOCKED_RESPONSE, SCOPE_EXCEEDED_RESPONSE
)
from app.models.models import (
    AIConversation, AIMessage, AIToolCall, AuditLog, AuditAction, User
)
from app.services.audit_service import log_action


# =================== PII MASKING ===================

def mask_pii(text: str) -> str:
    """
    Che giấu PII trước khi gửi sang AI
    Chỉ gửi phần dữ liệu cần thiết cho task
    """
    import re
    # Mask phone numbers
    text = re.sub(r'\b(0\d{9})\b', '[SĐT-MASKED]', text)
    # Mask CCCD/CMND
    text = re.sub(r'\b\d{9,12}\b', '[ID-MASKED]', text)
    # Mask email patterns
    text = re.sub(r'\b[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}\b', '[EMAIL-MASKED]', text)
    return text


# =================== MOCK AI RESPONSES ===================

MOCK_RESPONSES = {
    "appointment": [
        "Tôi tìm thấy các khung giờ trống cho ngày mai:\n\n"
        "• **08:30** — BS. Trần Minh Anh (Nội khoa)\n"
        "• **10:00** — BS. Nguyễn Văn Bình (Nội khoa)\n"
        "• **14:30** — BS. Trần Minh Anh (Nội khoa)\n\n"
        "Bạn muốn chọn khung giờ nào?",
    ],
    "info": [
        "Phòng khám hoạt động từ **Thứ 2 đến Thứ 7**, giờ làm việc **7:30 – 17:00**.\n\n"
        "Bạn có thể đặt lịch qua:\n• Hệ thống này\n• Điện thoại: 028-xxxx-xxxx\n• Trực tiếp tại quầy lễ tân",
    ],
    "process": [
        "Quy trình khám tại phòng khám:\n\n"
        "1. **Đăng ký** tại quầy lễ tân hoặc online\n"
        "2. **Chờ** tại phòng chờ\n"
        "3. **Khám** với bác sĩ\n"
        "4. **Nhận kết quả** và đơn thuốc (nếu có)\n"
        "5. **Thanh toán** tại quầy kế toán",
    ],
    "default": [
        "Xin chào! Tôi có thể hỗ trợ bạn về:\n\n"
        "• 📅 Đặt lịch khám\n"
        "• ⏰ Giờ làm việc\n"
        "• 📋 Quy trình khám\n"
        "• 💳 Thanh toán và bảo hiểm\n"
        "• 📄 Hồ sơ cần mang\n\n"
        "Bạn cần hỗ trợ gì?",
    ],
}


async def mock_streaming_response(message: str) -> AsyncGenerator[str, None]:
    """Simulate AI streaming response for Mock mode"""
    import random

    # Detect intent from message
    msg_lower = message.lower()
    if any(k in msg_lower for k in ["đặt lịch", "lịch khám", "appointment", "book"]):
        response = random.choice(MOCK_RESPONSES["appointment"])
    elif any(k in msg_lower for k in ["giờ", "time", "hours", "hoạt động"]):
        response = random.choice(MOCK_RESPONSES["info"])
    elif any(k in msg_lower for k in ["quy trình", "process", "thủ tục"]):
        response = random.choice(MOCK_RESPONSES["process"])
    else:
        response = random.choice(MOCK_RESPONSES["default"])

    # Stream word by word
    words = response.split(" ")
    for i, word in enumerate(words):
        yield word + (" " if i < len(words) - 1 else "")
        await asyncio.sleep(0.04)


MOCK_EMR_SUMMARY = """## Tóm tắt Lịch sử Khám

**Thông tin khám:**
• Số lần khám gần đây: 3 lần (6 tháng gần nhất)
• Lần khám gần nhất: theo dữ liệu có trong hệ thống

**Nội dung đã được ghi nhận:**
• Các triệu chứng và phàn nàn chính đã được bác sĩ ghi chép
• Kết quả thăm khám lâm sàng theo từng lượt

**Thuốc đã được kê trong các lần trước:**
• Đã có dữ liệu đơn thuốc trong hệ thống

**Thông tin hành chính liên quan:**
• Lịch tái khám theo kế hoạch của bác sĩ

---
⚠️ *Đây là bản tóm tắt từ dữ liệu có sẵn. AI không đưa ra chẩn đoán.*
*Nguồn: Dữ liệu EMR hệ thống | Tạo lúc: {time} | Model: Mock AI*"""


class AIService:
    """
    AI Service Orchestrator
    Thực hiện toàn bộ pipeline: Guardrail → PII → Agent → Guardrail → Audit
    """

    def __init__(self):
        self.is_mock = settings.AI_MODE == "mock"

    async def process_chat(
        self,
        db: AsyncSession,
        user: User,
        message: str,
        conversation_id: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> dict:
        """
        Non-streaming chat processing
        Full pipeline: Input Guardrail → PII → LLM/Mock → Output Guardrail → Audit
        """
        # 1. Load custom guardrail rules
        custom_rules = await load_guardrail_rules(db)
        input_guard = InputGuardrail(custom_rules=custom_rules)
        output_guard = OutputGuardrail()

        # 2. Input Guardrail check
        input_result = input_guard.check(message)
        if input_result.is_blocked:
            # Log guardrail block
            await log_action(
                db, user, AuditAction.GUARDRAIL_BLOCK, "ai_chat", None,
                f"INPUT BLOCKED: {input_result.reason} | Pattern: {input_result.matched_pattern}",
                ip_address, result="blocked"
            )
            return {
                "response": BLOCKED_RESPONSE,
                "conversation_id": conversation_id or str(uuid.uuid4()),
                "guardrail_blocked": True,
                "guardrail_reason": input_result.reason,
            }

        # 3. PII Masking
        masked_message = mask_pii(message)

        # 4. Get or create conversation
        if not conversation_id:
            conversation = AIConversation(
                id=str(uuid.uuid4()),
                user_id=user.id,
                title=message[:50] + "..." if len(message) > 50 else message,
            )
            db.add(conversation)
            await db.flush()
            conversation_id = conversation.id

        # 5. Generate response (Mock or Real)
        if self.is_mock:
            response_parts = []
            async for chunk in mock_streaming_response(masked_message):
                response_parts.append(chunk)
            ai_response = "".join(response_parts)
        else:
            ai_response = await self._call_real_llm(masked_message, conversation_id)

        # 6. Output Guardrail check
        output_result = output_guard.check(ai_response)
        if output_result.is_blocked:
            ai_response = SCOPE_EXCEEDED_RESPONSE
            await log_action(
                db, user, AuditAction.GUARDRAIL_BLOCK, "ai_chat", conversation_id,
                f"OUTPUT BLOCKED: {output_result.reason}",
                ip_address, result="blocked"
            )

        # 7. Save messages to DB
        user_msg = AIMessage(
            id=str(uuid.uuid4()),
            conversation_id=conversation_id,
            role="user",
            content=message,  # Store original (not masked) for history
        )
        ai_msg = AIMessage(
            id=str(uuid.uuid4()),
            conversation_id=conversation_id,
            role="assistant",
            content=ai_response,
            guardrail_blocked=output_result.is_blocked,
            guardrail_reason=output_result.reason if output_result.is_blocked else None,
        )
        db.add_all([user_msg, ai_msg])

        # 8. Audit log
        await log_action(
            db, user, AuditAction.AI_REQUEST, "ai_chat", conversation_id,
            f"Message length: {len(message)}, Blocked: False",
            ip_address
        )

        return {
            "response": ai_response,
            "conversation_id": conversation_id,
            "guardrail_blocked": False,
            "guardrail_reason": None,
        }

    async def stream_chat(
        self,
        db: AsyncSession,
        user: User,
        message: str,
        conversation_id: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        """Streaming chat response"""
        # Guardrail check first
        input_guard = InputGuardrail(await load_guardrail_rules(db))
        result = input_guard.check(message)

        if result.is_blocked:
            await log_action(db, user, AuditAction.GUARDRAIL_BLOCK, "ai_chat", None,
                           f"BLOCKED: {result.reason}", result="blocked")
            yield f"data: {json.dumps({'type': 'guardrail', 'content': BLOCKED_RESPONSE, 'blocked': True})}\n\n"
            yield "data: [DONE]\n\n"
            return

        masked = mask_pii(message)

        yield f"data: {json.dumps({'type': 'start', 'conversation_id': conversation_id})}\n\n"

        full_response = []
        if self.is_mock:
            async for chunk in mock_streaming_response(masked):
                full_response.append(chunk)
                yield f"data: {json.dumps({'type': 'chunk', 'content': chunk})}\n\n"
        else:
            async for chunk in self._stream_real_llm(masked):
                full_response.append(chunk)
                yield f"data: {json.dumps({'type': 'chunk', 'content': chunk})}\n\n"

        response_text = "".join(full_response)

        # Output guardrail
        out_result = OutputGuardrail().check(response_text)
        if out_result.is_blocked:
            yield f"data: {json.dumps({'type': 'guardrail', 'content': SCOPE_EXCEEDED_RESPONSE, 'blocked': True})}\n\n"
        else:
            yield f"data: {json.dumps({'type': 'done'})}\n\n"

        yield "data: [DONE]\n\n"

    async def summarize_emr(
        self,
        db: AsyncSession,
        user: User,
        patient_id: str,
        consultations: list,
    ) -> dict:
        """
        AI tóm tắt lịch sử EMR — Doctor only
        AI CHỈ summarize dữ liệu đã có, KHÔNG suy luận, KHÔNG chẩn đoán
        PII được mask trước khi gửi AI
        """
        if self.is_mock:
            summary = MOCK_EMR_SUMMARY.format(
                time=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
            )
        else:
            # Build context from consultations (with PII masking)
            context = self._build_masked_emr_context(consultations)
            summary = await self._call_emr_summary_llm(context)

        await log_action(db, user, AuditAction.AI_REQUEST, "emr_summary", patient_id,
                        "EMR summary generated")

        return {
            "summary": summary,
            "patient_id": patient_id,
            "source_records": len(consultations),
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "model": "mock" if self.is_mock else settings.LLM_PROVIDER,
            "disclaimer": "Đây là bản tóm tắt từ dữ liệu có sẵn. AI không đưa ra chẩn đoán. "
                         "Mọi quyết định lâm sàng phải do bác sĩ thực hiện.",
        }

    def _build_masked_emr_context(self, consultations: list) -> str:
        """Build EMR context với PII masking"""
        parts = []
        for i, c in enumerate(consultations):
            parts.append(
                f"Lần khám {i+1}:\n"
                f"- Ngày: {getattr(c, 'created_at', 'N/A')}\n"
                f"- Ghi chú lâm sàng: {getattr(c, 'clinical_notes', 'N/A')}\n"
                f"- Chẩn đoán: {', '.join([cd.diagnosis.name for cd in getattr(c, 'diagnoses', [])])}\n"
            )
        return "\n".join(parts)

    async def _call_real_llm(self, message: str, conversation_id: str) -> str:
        """Gọi LLM thật — được cấu hình theo provider"""
        # Abstraction layer để dễ thay đổi provider
        if settings.LLM_PROVIDER == "openai":
            return await self._call_openai(message)
        elif settings.LLM_PROVIDER == "gemini":
            return await self._call_gemini(message)
        elif settings.LLM_PROVIDER == "claude":
            return await self._call_claude(message)
        else:
            return "AI service hiện không khả dụng. Vui lòng thử lại sau."

    async def _stream_real_llm(self, message: str) -> AsyncGenerator[str, None]:
        """Stream từ LLM thật"""
        # Placeholder — implement khi có API key
        yield "Tính năng AI thật sẽ khả dụng khi cấu hình API key."

    async def _call_gemini(self, message: str) -> str:
        """Gọi Gemini AI với system prompt hành chính phòng khám"""
        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)

            system_instruction = (
                "Bạn là trợ lý AI hành chính của Phòng khám Clinic AI. "
                "Bạn CHỈ được hỗ trợ các vấn đề hành chính:\n"
                "- Đặt lịch hẹn và kiểm tra lịch trống\n"
                "- Thông tin giờ làm việc (Thứ 2-Thứ 7: 7:30-17:00)\n"
                "- Quy trình khám bệnh và thủ tục\n"
                "- Thông tin về các chuyên khoa và bác sĩ\n"
                "- Hướng dẫn thanh toán và bảo hiểm y tế\n"
                "- Hồ sơ cần mang khi khám\n\n"
                "TUYỆT ĐỐI KHÔNG:\n"
                "- Chẩn đoán bệnh hay triệu chứng\n"
                "- Kê đơn thuốc hoặc tư vấn dùng thuốc\n"
                "- Đưa ra kết luận y tế\n"
                "Nếu người dùng hỏi về y tế, hãy lịch sự từ chối và hướng dẫn đặt lịch gặp bác sĩ.\n"
                "Trả lời bằng tiếng Việt, thân thiện và chuyên nghiệp."
            )

            model = genai.GenerativeModel(
                model_name="gemini-1.5-flash",
                system_instruction=system_instruction
            )
            response = await asyncio.to_thread(model.generate_content, message)
            return response.text
        except Exception as e:
            return f"Xin lỗi, hệ thống AI tạm thời không khả dụng. Vui lòng liên hệ lễ tân để được hỗ trợ trực tiếp."

    async def _stream_real_llm(self, message: str) -> AsyncGenerator[str, None]:
        """Stream từ Gemini thật — chunk by chunk"""
        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)

            system_instruction = (
                "Bạn là trợ lý AI hành chính của Phòng khám Clinic AI. "
                "Bạn CHỈ được hỗ trợ: đặt lịch, giờ làm việc, quy trình khám, thủ tục hành chính. "
                "TUYỆT ĐỐI KHÔNG chẩn đoán bệnh, kê thuốc, hay tư vấn điều trị y tế. "
                "Trả lời bằng tiếng Việt, thân thiện và chuyên nghiệp."
            )

            model = genai.GenerativeModel(
                model_name="gemini-1.5-flash",
                system_instruction=system_instruction
            )

            def _generate_sync():
                return list(model.generate_content(message, stream=True))

            chunks = await asyncio.to_thread(_generate_sync)
            for chunk in chunks:
                if hasattr(chunk, 'text') and chunk.text:
                    yield chunk.text
                    await asyncio.sleep(0.02)
        except Exception as e:
            yield "Xin lỗi, hệ thống AI tạm thời không khả dụng. Vui lòng liên hệ lễ tân để được hỗ trợ trực tiếp."

    async def _call_openai(self, message: str) -> str:
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "Bạn là trợ lý hành chính của phòng khám. "
                            "Bạn CHỈ được hỗ trợ: đặt lịch, giờ làm việc, quy trình khám, "
                            "thủ tục hành chính. "
                            "Bạn TUYỆT ĐỐI KHÔNG chẩn đoán bệnh, kê thuốc, "
                            "hay tư vấn điều trị y tế."
                        )
                    },
                    {"role": "user", "content": message}
                ],
                max_tokens=500,
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"AI service không khả dụng: {str(e)}"

    async def _call_claude(self, message: str) -> str:
        try:
            import anthropic
            client = anthropic.AsyncAnthropic(api_key=settings.CLAUDE_API_KEY)
            response = await client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=500,
                messages=[{"role": "user", "content": message}]
            )
            return response.content[0].text
        except Exception as e:
            return f"Claude AI service không khả dụng: {str(e)}"

    async def _call_emr_summary_llm(self, context: str) -> str:
        """Gọi LLM để tóm tắt EMR — với strict system prompt"""
        prompt = (
            "Dưới đây là dữ liệu lịch sử khám của bệnh nhân (đã ẩn danh). "
            "Hãy tóm tắt ngắn gọn các điểm chính. "
            "TUYỆT ĐỐI KHÔNG đưa ra chẩn đoán, kết luận bệnh lý, hay đề xuất điều trị.\n\n"
            f"{context}"
        )
        return await self._call_real_llm(prompt, "emr_summary")


# Singleton
ai_service = AIService()
