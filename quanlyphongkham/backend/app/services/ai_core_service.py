import json
import time
import logging
import asyncio
from typing import Optional, AsyncGenerator

import google.generativeai as genai
from google.generativeai import protos
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.gemini_key_manager import gemini_key_manager
from app.models.models import User, UserRole, AuditLog, AuditAction
from app.services.ai_context_service import ai_context_service
from app.services.ai_tool_registry import ai_tool_registry
from app.services.ai_conversation_service import ai_conversation_service
from app.ai.guardrails.guardrails import InputGuardrail, OutputGuardrail, load_guardrail_rules

logger = logging.getLogger(__name__)


def _handle_gemini_error(e: Exception) -> str:
    """Trả về thông báo thân thiện và trung thực khi dịch vụ AI gặp sự cố kết nối thực tế."""
    err_str = str(e).lower()
    if isinstance(e, asyncio.TimeoutError) or "504" in err_str or "deadline" in err_str:
        return "Máy chủ AI phản hồi chậm hoặc kết nối bị quá hạn. Dữ liệu phòng khám của bạn vẫn an toàn; vui lòng thử lại sau giây lát."
    if "429" in err_str or "quota" in err_str or "resource_exhausted" in err_str:
        return "Hệ thống AI đang tiếp nhận nhiều lượt yêu cầu cùng lúc. Vui lòng đợi khoảng 15 giây rồi gửi lại câu hỏi."
    if "503" in err_str or "unavailable" in err_str:
        return "Dịch vụ AI hiện đang tạm thời bảo trì hoặc gián đoạn kết nối. Vui lòng thử lại sau ít phút."
    return "Dịch vụ AI đang tạm thời gián đoạn kết nối. Dữ liệu phòng khám vẫn an toàn; vui lòng thử lại sau ít giây hoặc sử dụng các chức năng tra cứu trực tiếp trong hệ thống."


class AICoreService:
    def __init__(self):
        gemini_key_manager.configure_genai()
        self._cached_rules = None
        self._rules_time = 0

    async def _get_guardrail_rules(self, db: AsyncSession):
        now = time.time()
        if self._cached_rules is None or self._rules_time < now - 60:
            self._cached_rules = await load_guardrail_rules(db)
            self._rules_time = now
        return self._cached_rules

    def _prepare_history(self, messages: list) -> list:
        """Đảm bảo các lượt lịch sử xen kẽ 'user' và 'model' theo yêu cầu Gemini SDK."""
        gemini_history = []
        last_role = None

        for m in messages:
            role = "user" if m.role == "user" else "model"
            if role == last_role:
                continue
            gemini_history.append({"role": role, "parts": [m.content]})
            last_role = role

        if gemini_history and gemini_history[-1]["role"] == "user":
            gemini_history.pop()

        return gemini_history

    def _build_model(self, user: User, allowed_tool_names: list) -> genai.GenerativeModel:
        """Khởi tạo GenerativeModel kèm system instruction và danh sách tools được phép."""
        system_prompt = ai_context_service.get_system_prompt(user)

        tools = []
        if allowed_tool_names:
            gemini_tools = []
            for t_name in allowed_tool_names:
                schema = ai_tool_registry.get_tool_schema(t_name)
                if schema:
                    gemini_tools.append(schema)
            if gemini_tools:
                tools = [{"function_declarations": gemini_tools}]

        return genai.GenerativeModel(
            model_name=gemini_key_manager.get_model_name(),
            system_instruction=system_prompt,
            tools=tools if tools else None,
        )

    async def process_chat(
        self,
        db: AsyncSession,
        user: User,
        message: str,
        conversation_id: Optional[str] = None,
        pending_tool_call: dict = None,
        action_confirmed: bool = False,
    ) -> dict:
        """
        Xử lý hội thoại AI đồng bộ (REST API) với cơ chế Tool Calling tự nhiên.
        """
        # 1. Quản lý Conversation
        if not conversation_id:
            title = message[:35] + "..." if len(message) > 35 else message
            conv = await ai_conversation_service.create_conversation(db, user.id, title)
            conversation_id = conv.id
        else:
            conv = await ai_conversation_service.get_conversation(db, conversation_id, user.id)
            if not conv:
                raise Exception("Không tìm thấy hội thoại hoặc bạn không có quyền truy cập.")

        # 2. Xử lý xác nhận hành động nguy cơ cao (Confirmation)
        if pending_tool_call and action_confirmed:
            tool_name = pending_tool_call.get("tool_name")
            args = pending_tool_call.get("pending_args", {})
            result = await ai_tool_registry.execute_tool(db, user, tool_name, args, action_confirmed=True)

            msg_content = f"Đã thực hiện xong: {result.get('message', 'Thành công')}"
            await ai_conversation_service.add_message(db, conversation_id, "user", "(Đã xác nhận thực hiện hành động)")
            await ai_conversation_service.add_message(db, conversation_id, "assistant", msg_content)

            return {
                "conversation_id": conversation_id,
                "response": msg_content,
                "is_tool_call": False,
            }

        # 3. Lưu tin nhắn User vào lịch sử
        await ai_conversation_service.add_message(db, conversation_id, "user", message)

        # 4. Kiểm tra Input Guardrail
        rules = await self._get_guardrail_rules(db)
        input_guard = InputGuardrail(rules)
        input_result = input_guard.check(message, user_role=user.role.value)

        safe_message = message
        if input_result.is_blocked:
            try:
                audit = AuditLog(
                    user_id=user.id,
                    username=user.username,
                    user_role=user.role.value,
                    action=AuditAction.GUARDRAIL_BLOCK,
                    resource_type="rbac_policy",
                    details=f"Yêu cầu bị từ chối: {input_result.reason} (mẫu: {input_result.matched_pattern})",
                    result="blocked",
                )
                db.add(audit)
                await db.commit()
            except Exception:
                pass
            safe_message = (
                f"[SYSTEM_DIRECTIVE_HIDDEN: Yêu cầu của người dùng vi phạm quy tắc an toàn: {input_result.reason}. "
                f"Hãy từ chối lịch sự, ân cần và giải thích giới hạn quyền hạn theo vai trò của bạn.]\n"
                f"Tin nhắn người dùng: {message}"
            )

        # 5. Khởi tạo Model và Chat Session
        allowed_tool_names = ai_context_service.get_allowed_tools(user.role)
        model = self._build_model(user, allowed_tool_names)

        history_msgs = await ai_conversation_service.get_conversation_messages(db, conversation_id)
        # Bỏ tin nhắn vừa thêm ở bước 3 khỏi history ban đầu để tránh trùng
        gemini_history = self._prepare_history(history_msgs[:-1])
        chat = model.start_chat(history=gemini_history)

        # 6. Gửi tin nhắn tới Gemini kèm Key Rotation
        response = None
        for attempt in range(len(gemini_key_manager._keys)):
            try:
                gemini_key_manager.configure_genai()
                response = await asyncio.wait_for(chat.send_message_async(safe_message), timeout=25.0)
                break
            except Exception as e:
                logger.warning(f"Gemini API attempt {attempt + 1} failed: {e}")
                if gemini_key_manager._is_quota_error(e) or isinstance(e, asyncio.TimeoutError):
                    new_key = gemini_key_manager.rotate()
                    if new_key is None:
                        error_msg = _handle_gemini_error(e)
                        await ai_conversation_service.add_message(db, conversation_id, "assistant", error_msg)
                        return {"conversation_id": conversation_id, "response": error_msg, "is_tool_call": False}
                    model = self._build_model(user, allowed_tool_names)
                    chat = model.start_chat(history=gemini_history)
                    await asyncio.sleep(0.5)
                else:
                    error_msg = _handle_gemini_error(e)
                    await ai_conversation_service.add_message(db, conversation_id, "assistant", error_msg)
                    return {"conversation_id": conversation_id, "response": error_msg, "is_tool_call": False}

        if not response:
            fallback = "Dịch vụ AI đang tạm thời không phản hồi. Vui lòng thử lại sau ít giây."
            await ai_conversation_service.add_message(db, conversation_id, "assistant", fallback)
            return {"conversation_id": conversation_id, "response": fallback, "is_tool_call": False}

        # 7. Vòng lặp Function Calling đa lượt (tối đa 5 lượt)
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

            if func_name not in allowed_tool_names:
                refusal_msg = f"Tôi không có thẩm quyền truy cập chức năng '{func_name}' theo phân quyền tài khoản của bạn."
                await ai_conversation_service.add_message(db, conversation_id, "assistant", refusal_msg)
                return {"conversation_id": conversation_id, "response": refusal_msg, "is_tool_call": False}

            # Thực thi tool trên Database thực tế
            try:
                tool_result = await ai_tool_registry.execute_tool(db, user, func_name, args, action_confirmed=False)
            except Exception as e:
                logger.error(f"Error executing tool {func_name}: {e}")
                err_msg = f"Đã xảy ra lỗi khi truy xuất dữ liệu từ hệ thống ({func_name}). Vui lòng thử lại."
                await ai_conversation_service.add_message(db, conversation_id, "assistant", err_msg)
                return {"conversation_id": conversation_id, "response": err_msg, "is_tool_call": False}

            # Nếu hành động yêu cầu xác nhận từ người dùng
            if isinstance(tool_result, dict) and tool_result.get("requires_confirmation"):
                return {
                    "conversation_id": conversation_id,
                    "response": tool_result["confirmation_message"],
                    "is_tool_call": True,
                    "tool_call_details": {
                        "tool_name": func_name,
                        "requires_confirmation": True,
                        "confirmation_message": tool_result["confirmation_message"],
                        "data": tool_result,
                    },
                }

            # Gửi kết quả tool về cho Gemini để tổng hợp câu trả lời (kèm retry và rotation)
            part = protos.Part(
                function_response=protos.FunctionResponse(
                    name=func_name,
                    response={"result": str(tool_result)}
                )
            )
            tool_response_ok = False
            for attempt in range(len(gemini_key_manager._keys)):
                try:
                    response = await asyncio.wait_for(chat.send_message_async(part), timeout=30.0)
                    tool_response_ok = True
                    break
                except Exception as e:
                    logger.warning(f"Error returning tool response attempt {attempt + 1}: {e}")
                    new_key = gemini_key_manager.rotate()
                    if new_key:
                        gemini_key_manager.configure_genai()
                        await asyncio.sleep(0.5)

            if not tool_response_ok:
                fallback_msg = _handle_gemini_error(Exception("quota exhausted"))
                await ai_conversation_service.add_message(db, conversation_id, "assistant", fallback_msg)
                return {"conversation_id": conversation_id, "response": fallback_msg, "is_tool_call": False}

        # 8. Trích xuất phản hồi văn bản cuối cùng
        try:
            final_text = response.text
        except Exception:
            final_text = ""
            if response.parts:
                for part in response.parts:
                    if part.text:
                        final_text += part.text

        if not final_text or not final_text.strip():
            final_text = "Tôi đã xử lý yêu cầu nhưng chưa nhận được phản hồi phù hợp từ hệ thống. Vui lòng diễn đạt lại câu hỏi."

        # 9. Kiểm tra Output Guardrail
        out_res = OutputGuardrail().check(final_text, user_role=user.role.value)
        if out_res.is_blocked:
            final_text = (
                "Xin lỗi, nội dung phản hồi có chứa thông tin vượt giới hạn tư vấn y tế tự động. "
                "Vui lòng liên hệ trực tiếp bác sĩ chuyên khoa hoặc nhân viên y tế để được tư vấn chính xác."
            )

        # 10. Lưu tin nhắn Assistant vào Database
        await ai_conversation_service.add_message(db, conversation_id, "assistant", final_text)

        return {
            "conversation_id": conversation_id,
            "response": final_text,
            "is_tool_call": False,
        }

    async def process_chat_stream(
        self,
        db: AsyncSession,
        user: User,
        message: str,
        conversation_id: Optional[str] = None,
    ) -> AsyncGenerator[dict, None]:
        """
        Xử lý hội thoại AI dạng Streaming (Server-Sent Events) với cơ chế Tool Calling tự nhiên.
        """
        # 1. Quản lý Conversation
        if not conversation_id:
            title = message[:35] + "..." if len(message) > 35 else message
            conv = await ai_conversation_service.create_conversation(db, user.id, title)
            conversation_id = conv.id
        else:
            conv = await ai_conversation_service.get_conversation(db, conversation_id, user.id)
            if not conv:
                yield {"error": "Không tìm thấy hội thoại."}
                return

        # 2. Lưu tin nhắn User
        await ai_conversation_service.add_message(db, conversation_id, "user", message)

        # 3. Kiểm tra Input Guardrail
        rules = await self._get_guardrail_rules(db)
        input_guard = InputGuardrail(rules)
        input_result = input_guard.check(message, user_role=user.role.value)

        safe_message = message
        if input_result.is_blocked:
            try:
                audit = AuditLog(
                    user_id=user.id,
                    username=user.username,
                    user_role=user.role.value,
                    action=AuditAction.GUARDRAIL_BLOCK,
                    resource_type="rbac_policy",
                    details=f"Yêu cầu bị từ chối: {input_result.reason} (mẫu: {input_result.matched_pattern})",
                    result="blocked",
                )
                db.add(audit)
                await db.commit()
            except Exception:
                pass
            safe_message = (
                f"[SYSTEM_DIRECTIVE_HIDDEN: Yêu cầu của người dùng vi phạm quy tắc an toàn: {input_result.reason}. "
                f"Hãy từ chối lịch sự, ân cần và giải thích giới hạn quyền hạn theo vai trò của bạn.]\n"
                f"Tin nhắn người dùng: {message}"
            )

        # 4. Context & Tools
        allowed_tool_names = ai_context_service.get_allowed_tools(user.role)
        model = self._build_model(user, allowed_tool_names)

        history_msgs = await ai_conversation_service.get_conversation_messages(db, conversation_id)
        gemini_history = self._prepare_history(history_msgs[:-1])
        chat = model.start_chat(history=gemini_history)

        yield {"conversation_id": conversation_id, "status": "started"}

        try:
            # 5. Gửi message đầu tiên có streaming
            response_generator = None
            for attempt in range(len(gemini_key_manager._keys)):
                try:
                    gemini_key_manager.configure_genai()
                    response_generator = await asyncio.wait_for(
                        chat.send_message_async(safe_message, stream=True),
                        timeout=30.0
                    )
                    break
                except Exception as e:
                    logger.warning(f"Stream attempt {attempt + 1} failed: {e}")
                    if gemini_key_manager._is_quota_error(e) or isinstance(e, asyncio.TimeoutError):
                        new_key = gemini_key_manager.rotate()
                        if new_key is None:
                            error_text = _handle_gemini_error(e)
                            yield {"chunk": error_text}
                            yield {"status": "done"}
                            await ai_conversation_service.add_message(db, conversation_id, "assistant", error_text)
                            return
                        model = self._build_model(user, allowed_tool_names)
                        chat = model.start_chat(history=gemini_history)
                        await asyncio.sleep(0.5)
                    else:
                        error_text = _handle_gemini_error(e)
                        yield {"chunk": error_text}
                        yield {"status": "done"}
                        await ai_conversation_service.add_message(db, conversation_id, "assistant", error_text)
                        return

            turn_count = 0
            final_text = ""

            # 6. Vòng lặp xử lý Function Calling trong Streaming
            while turn_count < 5:
                turn_count += 1
                func_calls = []

                async for chunk in response_generator:
                    try:
                        for part in chunk.parts:
                            if part.function_call:
                                func_calls.append(part.function_call)
                            elif part.text:
                                final_text += part.text
                                yield {"chunk": part.text}
                    except ValueError:
                        pass

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
                    yield {"status": "done"}
                    return

                tool_result = await ai_tool_registry.execute_tool(db, user, func_name, args, action_confirmed=False)

                # Kiểm tra yêu cầu xác nhận
                if isinstance(tool_result, dict) and tool_result.get("requires_confirmation"):
                    confirmation = {
                        "is_tool_call": True,
                        "tool_call_details": {
                            "tool_name": func_name,
                            "requires_confirmation": True,
                            "confirmation_message": tool_result["confirmation_message"],
                            "data": tool_result,
                        },
                        "conversation_id": conversation_id,
                        "status": "awaiting_confirmation",
                    }
                    yield confirmation
                    return

                # Đóng gói và trả kết quả tool về cho Gemini (kèm retry và rotation)
                part = protos.Part(
                    function_response=protos.FunctionResponse(
                        name=func_name,
                        response={"result": str(tool_result)}
                    )
                )
                tool_stream_ok = False
                for attempt in range(len(gemini_key_manager._keys)):
                    try:
                        response_generator = await asyncio.wait_for(
                            chat.send_message_async(part, stream=True),
                            timeout=30.0
                        )
                        tool_stream_ok = True
                        break
                    except Exception as e:
                        logger.warning(f"Error returning tool stream attempt {attempt + 1}: {e}")
                        new_key = gemini_key_manager.rotate()
                        if new_key:
                            gemini_key_manager.configure_genai()
                            await asyncio.sleep(0.5)

                if not tool_stream_ok:
                    fallback_msg = _handle_gemini_error(Exception("quota exhausted"))
                    yield {"chunk": fallback_msg}
                    yield {"status": "done"}
                    await ai_conversation_service.add_message(db, conversation_id, "assistant", fallback_msg)
                    return

            if not final_text.strip():
                final_text = "Tôi đã xử lý yêu cầu nhưng chưa nhận được phản hồi phù hợp. Vui lòng thử lại hoặc diễn đạt yêu cầu cụ thể hơn."

            # Kiểm tra Output Guardrail
            out_res = OutputGuardrail().check(final_text, user_role=user.role.value)
            if out_res.is_blocked:
                final_text = (
                    "Xin lỗi, nội dung phản hồi có chứa thông tin vượt giới hạn tư vấn y tế tự động. "
                    "Vui lòng liên hệ trực tiếp bác sĩ chuyên khoa để được hỗ trợ chuyên môn."
                )
                yield {"chunk": f"\n\n{final_text}"}

            await ai_conversation_service.add_message(db, conversation_id, "assistant", final_text)
            yield {"status": "done"}

        except Exception as e:
            logger.error(f"Error in process_chat_stream: {e}")
            fallback_msg = _handle_gemini_error(e)
            yield {"chunk": fallback_msg}
            yield {"status": "done"}
            await ai_conversation_service.add_message(db, conversation_id, "assistant", fallback_msg)


ai_core_service = AICoreService()
