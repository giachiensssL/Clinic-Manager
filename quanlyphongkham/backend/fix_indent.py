import os
import re

file_path = "app/services/ai_tool_registry.py"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# The incorrect injection happened after `ai_tool_registry = AIToolRegistry()`
# The string `# --- DOCTOR HANDLERS ---` starts the block we appended.
bad_split = content.split("ai_tool_registry = AIToolRegistry()")
if len(bad_split) == 2:
    good_class_content = bad_split[0]
    bad_handlers_content = bad_split[1]
    
    # We want to insert bad_handlers_content right before `def get_tool_schema`
    
    # Let's just remove the bad handlers content from the end
    content = good_class_content
    
    # and we insert bad_handlers_content inside the class
    # find `def get_tool_schema`
    schema_pattern = r'    def get_tool_schema\(self, tool_name: str\) -> dict:'
    
    new_content = re.sub(schema_pattern, bad_handlers_content.strip() + "\n\n    def get_tool_schema(self, tool_name: str) -> dict:", content)
    
    new_content = new_content + "\n\nai_tool_registry = AIToolRegistry()\n"
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_content)
        
    print("Fixed indentation and placement of handlers.")
else:
    print("Could not find ai_tool_registry = AIToolRegistry() to split.")
