import os

def insert_import(file_path, import_stmt):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    if import_stmt not in content:
        # Find the first import block and insert after it
        lines = content.split('\n')
        for i, line in enumerate(lines):
            if line.startswith('from ') or line.startswith('import '):
                lines.insert(i, import_stmt)
                break
        with open(file_path, "w", encoding="utf-8") as f:
            f.write('\n'.join(lines))
        print(f"Added to {file_path}: {import_stmt}")

insert_import("app/api/v1/appointments.py", "from app.models.models import Department")
insert_import("app/api/v1/receptionist.py", "import time\nimport random")
insert_import("app/api/v1/doctor_dashboard.py", "from sqlalchemy import func")
insert_import("app/services/ai_tool_registry.py", "from sqlalchemy import update")

print("Done missing imports")
