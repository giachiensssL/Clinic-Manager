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
        # 1. Guardrail check first
        input_guard = InputGuardrail(await load_guardrail_rules(db))
        result = input_guard.check(message)

        if result.is_blocked:
            await log_action(db, user, AuditAction.GUARDRAIL_BLOCK, "ai_chat", None,
                           f"BLOCKED: {result.reason}", result="blocked")
            yield f"data: {json.dumps({'type': 'guardrail', 'content': BLOCKED_RESPONSE, 'blocked': True})}\n\n"
            yield "data: [DONE]\n\n"
            return

        masked = mask_pii(message)

        # 2. Get or create conversation
        if not conversation_id:
            conversation = AIConversation(
                id=str(uuid.uuid4()),
                user_id=user.id,
                title=message[:50] + "..." if len(message) > 50 else message,
            )
            db.add(conversation)
            await db.flush()
            conversation_id = conversation.id

        yield f"data: {json.dumps({'type': 'start', 'conversation_id': conversation_id})}\n\n"

        # 3. Stream AI response
        full_response = []
        if self.is_mock:
            async for chunk in mock_streaming_response(masked):
                full_response.append(chunk)
                yield f"data: {json.dumps({'type': 'chunk', 'content': chunk})}\n\n"
        else:
            if settings.LLM_PROVIDER == "gemini":
                async for chunk in self._stream_gemini(db, user, masked, conversation_id):
                    full_response.append(chunk)
                    yield f"data: {json.dumps({'type': 'chunk', 'content': chunk})}\n\n"
            else:
                yield f"data: {json.dumps({'type': 'chunk', 'content': 'Tính năng AI thật chỉ hỗ trợ Gemini trong bản này.'})}\n\n"
                full_response.append("Tính năng AI thật chỉ hỗ trợ Gemini trong bản này.")

        response_text = "".join(full_response)

        # 4. Save messages to DB
        user_msg = AIMessage(
            id=str(uuid.uuid4()),
            conversation_id=conversation_id,
            role="user",
            content=message,
        )
        ai_msg = AIMessage(
            id=str(uuid.uuid4()),
            conversation_id=conversation_id,
            role="assistant",
            content=response_text,
        )
        db.add_all([user_msg, ai_msg])
        await db.commit()

        # 5. Output guardrail
        out_result = OutputGuardrail().check(response_text)
        if out_result.is_blocked:
            yield f"data: {json.dumps({'type': 'guardrail', 'content': SCOPE_EXCEEDED_RESPONSE, 'blocked': True})}\n\n"
        else:
            yield f"data: {json.dumps({'type': 'done'})}\n\n"

        yield "data: [DONE]\n\n"

    async def _stream_gemini(self, db: AsyncSession, user: User, message: str, conversation_id: str) -> AsyncGenerator[str, None]:
        """Stream từ Gemini với tính năng Memory và Tool Calling (Agentic)"""
        try:
            import google.generativeai as genai
            from sqlalchemy import select
            
            genai.configure(api_key=settings.GEMINI_API_KEY)
            
            from app.ai.tools.appointment_tools import check_availability, book_appointment
            
            # Khai báo schema tools cho Gemini
            tools = [
                {
                    "function_declarations": [
                        {
                            "name": "check_availability",
                            "description": "Kiểm tra danh sách bác sĩ có lịch trống trong một ngày cụ thể.",
                            "parameters": {
                                "type": "OBJECT",
                                "properties": {
                                    "appointment_date": {"type": "STRING", "description": "Ngày cần kiểm tra định dạng YYYY-MM-DD"},
                                    "specialty_name": {"type": "STRING", "description": "Tên chuyên khoa (vd: 'Nội khoa', 'Nha khoa'). Có thể bỏ trống nếu không rõ."}
                                },
                                "required": ["appointment_date"]
                            }
                        },
                        {
                            "name": "book_appointment",
                            "description": "Trực tiếp đặt lịch khám mới cho người dùng. CHỈ GỌI khi người dùng đã chốt bác sĩ, ngày và giờ.",
                            "parameters": {
                                "type": "OBJECT",
                                "properties": {
                                    "doctor_id": {"type": "STRING", "description": "ID của bác sĩ"},
                                    "date_str": {"type": "STRING", "description": "Ngày khám YYYY-MM-DD"},
                                    "time_str": {"type": "STRING", "description": "Giờ khám HH:MM"},
                                    "reason": {"type": "STRING", "description": "Lý do khám bệnh"}
                                },
                                "required": ["doctor_id", "date_str", "time_str", "reason"]
                            }
                        }
                    ]
                }
            ]

            system_instruction = (
                "Bạn là trợ lý AI thông minh của Phòng khám Clinic AI.\n"
                "Bạn có quyền tự động dùng công cụ check_availability để tra cứu lịch, "
                "và book_appointment để đặt lịch ngay lập tức khi user yêu cầu.\n"
                "Khi đặt lịch xong, trả về thông báo kèm mã lịch hẹn cho user.\n"
                "LUÔN HỎI LẠI TRƯỚC KHI ĐẶT LỊCH nếu thiếu giờ, bác sĩ hoặc lý do khám.\n"
                "Bạn CÓ THỂ trò chuyện, giao tiếp cơ bản (small talk) và hỏi han thân thiện với người dùng.\n"
                "TUYỆT ĐỐI KHÔNG chẩn đoán bệnh. Luôn trả lời thân thiện bằng tiếng Việt."
            )

            model = genai.GenerativeModel(
                model_name="gemini-2.5-flash",
                system_instruction=system_instruction,
                tools=tools
            )

            # Tải lịch sử trò chuyện
            stmt = select(AIMessage).where(AIMessage.conversation_id == conversation_id).order_by(AIMessage.created_at.asc())
            result = await db.execute(stmt)
            history_msgs = result.scalars().all()
            
            gemini_history = []
            for msg in history_msgs:
                role = "user" if msg.role == "user" else "model"
                gemini_history.append({"role": role, "parts": [msg.content]})
                
            chat = model.start_chat(history=gemini_history)
            
            # Gửi tin nhắn đầu tiên
            response = await chat.send_message_async(message)
            
            # Vòng lặp xử lý Function Calling
            while True:
                func_calls = [part.function_call for part in response.parts if part.function_call]
                if not func_calls:
                    break
                    
                fc = func_calls[0]
                func_name = fc.name
                args = {k: v for k, v in fc.args.items()}
                
                tool_result = ""
                if func_name == "check_availability":
                    yield f"\\n*(AI đang tra cứu lịch trống ngày {args.get('appointment_date')}...)*\\n\\n"
                    tool_result = await check_availability(db, args.get("appointment_date", ""), args.get("specialty_name"))
                elif func_name == "book_appointment":
                    yield f"\\n*(AI đang tiến hành đặt lịch với bác sĩ {args.get('doctor_id')}...)*\\n\\n"
                    tool_result = await book_appointment(db, user.id, args.get("doctor_id", ""), args.get("date_str", ""), args.get("time_str", ""), args.get("reason", ""))
                
                # Trả kết quả tool về cho LLM
                from google.generativeai import protos
                response = await chat.send_message_async(
                    protos.Part(
                        function_response=protos.FunctionResponse(
                            name=func_name,
                            response={"result": str(tool_result)}
                        )
                    )
                )

            # LLM đã có text response cuối cùng
            # Stream text cuối cùng ra nhanh hơn
            words = response.text.split(" ")
            chunk_size = 5
            for i in range(0, len(words), chunk_size):
                chunk_words = words[i:i+chunk_size]
                if chunk_words:
                    yield " ".join(chunk_words) + (" " if i + chunk_size < len(words) else "")
                    await asyncio.sleep(0.01)
                    
        except Exception as e:
            yield f"Xin lỗi, hệ thống AI gặp lỗi khi xử lý: {str(e)}"

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
                model_name="gemini-2.5-flash",
                system_instruction=system_instruction
            )
            response = await asyncio.to_thread(model.generate_content, message)
            return response.text
        except Exception as e:
            return f"Xin lỗi, hệ thống AI tạm thời không khả dụng. Vui lòng liên hệ lễ tân để được hỗ trợ trực tiếp."

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
