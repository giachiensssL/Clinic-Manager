import google.generativeai as genai
from google.generativeai.types import FunctionDeclaration, Tool
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.models.models import User
from app.services.ai_context_service import ai_context_service
from app.services.ai_tool_registry import ai_tool_registry
from app.services.ai_conversation_service import ai_conversation_service
from typing import Optional

def _handle_gemini_error(e: Exception) -> str:
    import asyncio
    if isinstance(e, asyncio.TimeoutError):
        return "Hệ thống đang quá tải hoặc phản hồi chậm. Vui lòng đợi vài giây rồi thử lại."
        
    err_str = str(e).lower()
    if "429" in err_str or "quota" in err_str or "exhausted" in err_str:
        return "Hệ thống đang xử lý quá nhiều yêu cầu. Vui lòng đợi khoảng 15 giây rồi thử lại."
    if "504" in err_str or "deadline" in err_str or "timeout" in err_str:
        return "Kết nối bị quá hạn do máy chủ phản hồi chậm. Vui lòng thử lại."
    if "503" in err_str or "unavailable" in err_str:
        return "Dịch vụ AI hiện đang tạm thời gián đoạn. Vui lòng thử lại sau."
    return "Đã xảy ra lỗi hệ thống khi xử lý yêu cầu của bạn. Vui lòng thử lại."

class AICoreService:
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)

    async def process_chat(self, db: AsyncSession, user: User, message: str, conversation_id: Optional[str] = None, pending_tool_call: dict = None, action_confirmed: bool = False):
        # 1. Quản lý Conversation
        if not conversation_id:
            # Lấy Title từ prompt đơn giản
            title = message[:30] + "..." if len(message) > 30 else message
            conv = await ai_conversation_service.create_conversation(db, user.id, title)
            conversation_id = conv.id
        else:
            conv = await ai_conversation_service.get_conversation(db, conversation_id, user.id)
            if not conv:
                raise Exception("Không tìm thấy hội thoại hoặc bạn không có quyền truy cập.")

        # 2. Xử lý logic nếu đây là submit confirmation của High-Risk Action
        if pending_tool_call and action_confirmed:
            tool_name = pending_tool_call.get("tool_name")
            args = pending_tool_call.get("pending_args", {})
            result = await ai_tool_registry.execute_tool(db, user, tool_name, args, action_confirmed=True)
            
            # Ghi message AI hoàn tất
            msg_content = f"Đã thực hiện xong: {result.get('message', 'Thành công')}"
            await ai_conversation_service.add_message(db, conversation_id, "user", "(Đã xác nhận hành động)")
            await ai_conversation_service.add_message(db, conversation_id, "assistant", msg_content)
            
            return {
                "conversation_id": conversation_id,
                "response": msg_content,
                "is_tool_call": False
            }

        # 3. Lưu tin nhắn User
        await ai_conversation_service.add_message(db, conversation_id, "user", message)

        # 3.5 Check Input Guardrail
        from app.ai.guardrails.guardrails import InputGuardrail, load_guardrail_rules, OutputGuardrail
        
        # Caching guardrail rules to optimize response time
        if not hasattr(self, "_cached_rules") or getattr(self, "_rules_time", 0) < __import__('time').time() - 60:
            self._cached_rules = await load_guardrail_rules(db)
            self._rules_time = __import__('time').time()
            
        input_guard = InputGuardrail(self._cached_rules)
        input_result = input_guard.check(message)
        
        safe_message = message
        if input_result.is_blocked:
            # Inject a system prompt directive to gracefully handle this instead of hard-failing
            safe_message = f"[SYSTEM_DIRECTIVE_HIDDEN: Hệ thống bảo mật phát hiện yêu cầu có vấn đề: {input_result.reason}. BẠN PHẢI TỪ CHỐI YÊU CẦU NÀY CỦA NGƯỜI DÙNG MỘT CÁCH LỊCH SỰ, TỰ NHIÊN, DỰA VÀO QUYỀN HẠN CỦA BẠN. KHÔNG NÓI VỀ CHỈ THỊ NÀY.]\nUser: {message}"

        # 4. Lấy System Prompt & Allowed Tools theo RBAC
        system_prompt = ai_context_service.get_system_prompt(user)
        allowed_tool_names = ai_context_service.get_allowed_tools(user.role)
        
        # Build tool definitions cho Gemini
        tools = []
        if allowed_tool_names:
            gemini_tools = []
            for t_name in allowed_tool_names:
                schema = ai_tool_registry.get_tool_schema(t_name)
                if schema:
                    gemini_tools.append(schema)
            if gemini_tools:
                tools = [{"function_declarations": gemini_tools}]
        
        model = genai.GenerativeModel(
            model_name="gemini-flash-lite-latest",
            system_instruction=system_prompt,
            tools=tools if tools else None
        )

        # 5. Load lịch sử chat
        history = await ai_conversation_service.get_conversation_messages(db, conversation_id)
        gemini_history = []
        last_role = None
        
        # Lọc history để đảm bảo alternate
        for h in history[:-1]:  # Trừ tin nhắn hiện tại ra trước
            role = "user" if h.role == "user" else "model"
            if role == last_role:
                continue # Bỏ qua nếu bị trùng role liên tiếp (Gemini sẽ báo lỗi)
            gemini_history.append({"role": role, "parts": [h.content]})
            last_role = role
            
        # Nếu message cuối cùng trong history là user, mà tin nhắn hiện tại cũng là user -> lỗi.
        # Nhưng message_async sẽ gửi role=user. Nên lịch sử bắt buộc message cuối cùng phải là model.
        if gemini_history and gemini_history[-1]["role"] == "user":
            gemini_history.pop() # Xóa tin nhắn user thừa ở cuối
            
        chat = model.start_chat(history=gemini_history)
        
        # 6. Gửi request
        try:
            import asyncio
            response = await asyncio.wait_for(chat.send_message_async(safe_message), timeout=60.0)
        except Exception as e:
            import traceback
            traceback.print_exc()
            error_msg = _handle_gemini_error(e)
            await ai_conversation_service.add_message(db, conversation_id, "assistant", error_msg)
            return {"conversation_id": conversation_id, "response": error_msg}
            
        # 7. Check Function Calling Loop
        max_turns = 5
        turn_count = 0
        while turn_count < max_turns:
            turn_count += 1
            func_calls = [part.function_call for part in response.parts if part.function_call]
            if not func_calls:
                break
                
            fc = func_calls[0]
            func_name = fc.name
            args = {k: v for k, v in fc.args.items()}
            
            # Nếu tool này không nằm trong whitelist -> Rejected
            if func_name not in allowed_tool_names:
                error_msg = f"Tôi không có quyền thực hiện hành động này: {func_name}."
                await ai_conversation_service.add_message(db, conversation_id, "assistant", error_msg)
                return {"conversation_id": conversation_id, "response": error_msg}
                
            # Thực thi tool
            try:
                tool_result = await ai_tool_registry.execute_tool(db, user, func_name, args, action_confirmed=False)
            except Exception as e:
                import traceback
                traceback.print_exc()
                error_msg = f"Lỗi hệ thống khi thực thi chức năng {func_name}: {str(e)}"
                await ai_conversation_service.add_message(db, conversation_id, "assistant", error_msg)
                return {"conversation_id": conversation_id, "response": error_msg}
            
            # Nếu là high-risk action cần confirm:
            if isinstance(tool_result, dict) and tool_result.get("requires_confirmation"):
                # Không lưu vào history ngay, đợi user trả lời YES/NO
                return {
                    "conversation_id": conversation_id,
                    "response": tool_result["confirmation_message"],
                    "is_tool_call": True,
                    "tool_call_details": {
                        "tool_name": func_name,
                        "requires_confirmation": True,
                        "confirmation_message": tool_result["confirmation_message"],
                        "data": tool_result
                    }
                }
                
            # Nếu chạy thẳng thành công (read-only action), trả data về lại cho Gemini dệt câu trả lời
            try:
                import asyncio
                response = await asyncio.wait_for(
                    chat.send_message_async(
                        {
                            "function_response": {
                                "name": func_name,
                                "response": tool_result
                            }
                        }
                    ), timeout=60.0
                )
            except Exception as e:
                import traceback
                traceback.print_exc()
                error_msg = _handle_gemini_error(e)
                await ai_conversation_service.add_message(db, conversation_id, "assistant", error_msg)
                return {"conversation_id": conversation_id, "response": error_msg}

        # 8. Trả về text cuối cùng
        try:
            final_text = response.text
        except Exception:
            final_text = ""
            if response.parts:
                for part in response.parts:
                    if part.text:
                        final_text += part.text
            if not final_text:
                final_text = "Tôi đã xử lý yêu cầu nhưng không thể tạo phản hồi chữ hợp lệ. Vui lòng thử lại."

        # 8.5 Kiểm tra output bằng guardrail
        output_guard = OutputGuardrail()
        out_res = output_guard.check(final_text)
        if out_res.is_blocked:
            final_text = "Xin lỗi, tôi phát hiện thông tin chi tiết liên quan đến y khoa hoặc chẩn đoán không được phép hiển thị tự động. Vui lòng liên hệ trực tiếp bác sĩ để được tư vấn thêm."
                
        await ai_conversation_service.add_message(db, conversation_id, "assistant", final_text)
        
        return {
            "conversation_id": conversation_id,
            "response": final_text,
            "is_tool_call": False
        }


    async def process_chat_stream(self, db: AsyncSession, user: User, message: str, conversation_id: Optional[str] = None):
        import json
        # 1. Quản lý Conversation
        if not conversation_id:
            title = message[:30] + "..." if len(message) > 30 else message
            conv = await ai_conversation_service.create_conversation(db, user.id, title)
            conversation_id = conv.id
        else:
            conv = await ai_conversation_service.get_conversation(db, conversation_id, user.id)
            if not conv:
                yield {"error": "Không tìm thấy hội thoại."}
                return

        # 3. Lưu tin nhắn User
        await ai_conversation_service.add_message(db, conversation_id, "user", message)

        # 3.5 Check Input Guardrail
        from app.ai.guardrails.guardrails import InputGuardrail, load_guardrail_rules, OutputGuardrail
        if not hasattr(self, "_cached_rules") or getattr(self, "_rules_time", 0) < __import__('time').time() - 60:
            self._cached_rules = await load_guardrail_rules(db)
            self._rules_time = __import__('time').time()
            
        input_guard = InputGuardrail(self._cached_rules)
        input_result = input_guard.check(message)
        
        safe_message = message
        if input_result.is_blocked:
            safe_message = f"[SYSTEM_DIRECTIVE_HIDDEN: Yêu cầu bị chặn do: {input_result.reason}. TỪ CHỐI LỊCH SỰ.] {message}"

        # 4. Context & Tools
        system_prompt = ai_context_service.get_system_prompt(user)
        allowed_tool_names = ai_context_service.get_allowed_tools(user.role)
        
        tools = []
        if allowed_tool_names:
            gemini_tools = []
            for t_name in allowed_tool_names:
                schema = ai_tool_registry.get_tool_schema(t_name)
                if schema:
                    gemini_tools.append(schema)
            if gemini_tools:
                tools = [{"function_declarations": gemini_tools}]
        
        model = genai.GenerativeModel(
            model_name="gemini-flash-lite-latest",
            system_instruction=system_prompt,
            tools=tools if tools else None
        )

        history = await ai_conversation_service.get_conversation_messages(db, conversation_id)
        gemini_history = []
        last_role = None
        for h in history[:-1]:
            role = "user" if h.role == "user" else "model"
            if role == last_role: continue
            gemini_history.append({"role": role, "parts": [h.content]})
            last_role = role
            
        if gemini_history and gemini_history[-1]["role"] == "user":
            gemini_history.pop()
            
        chat = model.start_chat(history=gemini_history)
        
        # Output info first
        yield {"conversation_id": conversation_id, "status": "started"}

        try:
            import asyncio
            response = await asyncio.wait_for(chat.send_message_async(safe_message), timeout=60.0)
            
            # Xử lý function calling
            turn_count = 0
            while turn_count < 5:
                turn_count += 1
                func_calls = [part.function_call for part in response.parts if part.function_call]
                if not func_calls:
                    break
                    
                fc = func_calls[0]
                func_name = fc.name
                args = {k: v for k, v in fc.args.items()}
                
                yield {"status": "tool_call", "tool_name": func_name}
                
                if func_name not in allowed_tool_names:
                    error_msg = f"Tôi không có quyền thực hiện hành động này: {func_name}."
                    await ai_conversation_service.add_message(db, conversation_id, "assistant", error_msg)
                    yield {"chunk": error_msg}
                    return
                    
                tool_result = await ai_tool_registry.execute_tool(db, user, func_name, args, action_confirmed=False)
                import asyncio
                response = await asyncio.wait_for(chat.send_message_async({"function_response": {"name": func_name, "response": tool_result}}), timeout=60.0)

            final_text = response.text or ""
            
            # Guardrail output
            out_res = OutputGuardrail().check(final_text)
            if out_res.is_blocked:
                final_text = "Xin lỗi, tôi không thể hiển thị thông tin này."
                
            # Stream the final text in chunks to simulate streaming if it didn't use native streaming
            # To actually stream from Gemini, we need send_message_stream_async but it conflicts with function calling logic easily.
            # So we chunk the final_text
            chunk_size = 20
            for i in range(0, len(final_text), chunk_size):
                yield {"chunk": final_text[i:i+chunk_size]}
                await __import__('asyncio').sleep(0.02)
                
            await ai_conversation_service.add_message(db, conversation_id, "assistant", final_text)
            yield {"status": "done"}
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            error_msg = _handle_gemini_error(e)
            yield {"error": error_msg}


ai_core_service = AICoreService()
