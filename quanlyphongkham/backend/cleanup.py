import os

file_path = "app/services/ai_tool_registry.py"
with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    new_lines.append(line)
    if "ai_tool_registry = AIToolRegistry()" in line:
        break

with open(file_path, "w", encoding="utf-8") as f:
    f.writelines(new_lines)

print("cleaned up extra code")
