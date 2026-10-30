import re

with open('app/services/ai_core_service.py', 'r', encoding='utf-8') as f:
    content = f.read()

stream_func = '''
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
            response = await chat.send_message_async(safe_message)
            
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
                
                response = await chat.send_message_async({"function_response": {"name": func_name, "response": tool_result}})

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
            yield {"error": str(e)}

'''

# Insert before 'ai_core_service = AICoreService()'
content = content.replace('ai_core_service = AICoreService()', stream_func + '\nai_core_service = AICoreService()')

with open('app/services/ai_core_service.py', 'w', encoding='utf-8') as f:
    f.write(content)

