import os
import re

file_path = "app/api/v1/appointments.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

old_logic = """    try:
        appt.status = AppointmentStatus(new_status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Trang thai khong hop le: {new_status}")"""

new_logic = """    if appt.status in [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW]:
        raise HTTPException(status_code=400, detail=f"Khong the doi trang thai lich hen da ket thuc hoac da huy")

    try:
        appt.status = AppointmentStatus(new_status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Trang thai khong hop le: {new_status}")"""

content = content.replace(old_logic, new_logic)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Patched appointment logic")
