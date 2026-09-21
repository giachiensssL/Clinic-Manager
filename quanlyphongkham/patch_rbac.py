import os
import re

files = [
    ("backend/app/api/v1/appointments.py", "appt"),
    ("backend/app/api/v1/prescriptions.py", "rx"),
    ("backend/app/api/v1/lab_results.py", "lab"),
    ("backend/app/api/v1/billing.py", "bill"),
    ("backend/app/api/v1/emr.py", "cons")
]

rbac_code = """
    if current_user.role.value == "patient":
        from app.models.models import Patient
        from sqlalchemy import select
        pid_result = await db.execute(select(Patient.id).where(Patient.user_id == current_user.id))
        pid = pid_result.scalar_one_or_none()
        if {var_name}.patient_id != pid:
            from fastapi import HTTPException
            raise HTTPException(status_code=403, detail="Không có quyền truy cập dữ liệu của bệnh nhân khác")
"""

for filepath, var_name in files:
    if not os.path.exists(filepath):
        continue
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Find the block:
    # if not var_name:
    #     raise HTTPException(...)
    
    pattern = r"(if not " + var_name + r":\s+raise HTTPException\(.*?\)\n)"
    match = re.search(pattern, content)
    if match and "current_user.role.value" not in content:
        insert_code = rbac_code.format(var_name=var_name)
        new_content = content.replace(match.group(1), match.group(1) + insert_code)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Patched {filepath}")
    else:
        print(f"Could not patch {filepath} or already patched")
