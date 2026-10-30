import re

with open('app/services/ai_core_service.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Change model name to gemini-1.5-flash for reliability and speed
content = content.replace('"gemini-flash-lite-latest"', '"gemini-1.5-flash"')

# Replace the try/except block ONLY in process_chat_stream
new_try_block = """        try:
            import asyncio
            response_generator = await asyncio.wait_for(chat.send_message_async(safe_message, stream=True), timeout=60.0)
            
            turn_count = 0
            final_text = ""
            
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
                    return
                    
                tool_result = await ai_tool_registry.execute_tool(db, user, func_name, args, action_confirmed=False)
                
                response_generator = await asyncio.wait_for(
                    chat.send_message_async({"function_response": {"name": func_name, "response": tool_result}}, stream=True), 
                    timeout=60.0
                )
                
            out_res = OutputGuardrail().check(final_text, user_role=user.role.value)
            if out_res.is_blocked:
                warning = "\\n\\n[Hệ thống: Thông tin trên có thể chứa nội dung nhạy cảm. Vui lòng tham khảo ý kiến bác sĩ.]"
                yield {"chunk": warning}
                final_text += warning
                
            await ai_conversation_service.add_message(db, conversation_id, "assistant", final_text)
            yield {"status": "done"}
            
        except Exception as e:"""

# Split file at `def process_chat_stream`
parts = content.split('def process_chat_stream')

# Only apply regex to the second part
pattern = re.compile(r'        try:\n            import asyncio\n            response = await asyncio\.wait_for\(chat\.send_message_async.*?        except Exception as e:', re.DOTALL)
parts[1] = pattern.sub(new_try_block, parts[1], count=1)

content = parts[0] + 'def process_chat_stream' + parts[1]

# Also patch the guardrail calls
content = content.replace('input_result = input_guard.check(message)', 'input_result = input_guard.check(message, user_role=user.role.value)')
content = content.replace('out_res = output_guard.check(final_text)', 'out_res = output_guard.check(final_text, user_role=user.role.value)')

with open('app/services/ai_core_service.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patched successfully")
