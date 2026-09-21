import re

file_path = "app/services/ai_core_service.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

old_tool = """            # Thực thi tool
            tool_result = await ai_tool_registry.execute_tool(db, user, func_name, args, action_confirmed=False)
            
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
            response = await chat.send_message_async(
                {
                    "function_response": {
                        "name": func_name,
                        "response": tool_result
                    }
                }
            )"""

new_tool = """            # Thực thi tool
            try:
                tool_result = await ai_tool_registry.execute_tool(db, user, func_name, args, action_confirmed=False)
            except Exception as e:
                import traceback
                traceback.print_exc()
                error_msg = f"Lỗi hệ thống khi thực thi chức năng: {str(e)}"
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
                return {"conversation_id": conversation_id, "response": error_msg}"""

content = content.replace(old_tool, new_tool)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Patched ai_core_service.py")
