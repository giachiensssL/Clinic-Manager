import re

file_path = "app/services/ai_tool_registry.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Remove the misplaced search_doctors registration
misplaced_pattern = r'        # --- COMMON TOOLS ---[\s\S]*?self\._handle_search_doctors,\s*False\s*\)\s*'
content = re.sub(misplaced_pattern, '', content)

# 2. Insert search_doctors registration inside _register_tools
correct_registration = """        # --- COMMON TOOLS ---
        self.tools["search_doctors"] = (
            {
                "name": "search_doctors",
                "description": "Tìm kiếm và lấy thông tin chi tiết của các Bác sĩ đang làm việc tại phòng khám (chuyên khoa, số điện thoại, v.v) để gợi ý cho bệnh nhân.",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "specialty": {"type": "STRING", "description": "Chuyên khoa cần tìm (VD: 'Nội khoa', 'Nhi khoa', 'Tim mạch'). Để trống nếu muốn lấy tất cả."}
                    }
                }
            },
            self._handle_search_doctors,
            False
        )
"""
# find the end of _register_tools
# It ends with `self._handle_get_unpaid_invoices,\n            False\n        )\n`
target_pattern = r'self\._handle_get_unpaid_invoices,\s*False\s*\)'
content = re.sub(target_pattern, 'self._handle_get_unpaid_invoices,\n            False\n        )\n\n' + correct_registration, content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("fixed search_doctors registration")
