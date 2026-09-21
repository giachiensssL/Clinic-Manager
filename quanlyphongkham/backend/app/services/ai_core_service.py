import google.generativeai as genai
from google.generativeai.types import FunctionDeclaration, Tool
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.models.models import User
from app.services.ai_context_service import ai_context_service
from app.services.ai_tool_registry import ai_tool_registry
from app.services.ai_conversation_service import ai_conversation_service
from typing import Optional

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
            response = await chat.send_message_async(message)
        except Exception as e:
            import traceback
            traceback.print_exc()
            error_msg = f"Lỗi hệ thống: {str(e)}"
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
                response = await chat.send_message_async(
                    {
                        "function_response": {
                            "name": func_name,
                            "response": tool_result
                        }
                    }
                )
            except Exception as e:
                import traceback
                traceback.print_exc()
                error_msg = f"Lỗi hệ thống khi xử lý kết quả chức năng: {str(e)}"
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
                
        await ai_conversation_service.add_message(db, conversation_id, "assistant", final_text)
        
        return {
            "conversation_id": conversation_id,
            "response": final_text,
            "is_tool_call": False
        }

ai_core_service = AICoreService()
