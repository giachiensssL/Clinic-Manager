import re

file_path = "app/api/v1/emr.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace get_doctor with get_clinical_doctor in the router decorators
content = content.replace("current_user: User = Depends(get_doctor)", "current_user: User = Depends(get_clinical_doctor)")

# Add IDOR check to update_consultation
old_update = """    if c.status == EMRStatus.LOCKED:
        raise HTTPException(status_code=403, detail="Ho so benh an da bi khoa, khong the sua")"""

new_update = """    if c.status == EMRStatus.LOCKED:
        raise HTTPException(status_code=403, detail="Ho so benh an da bi khoa, khong the sua")
        
    from app.models.models import Doctor, Staff
    d_res = await db.execute(select(Doctor.id).join(Staff, Doctor.staff_id == Staff.id).where(Staff.user_id == current_user.id))
    doc_id = d_res.scalar_one_or_none()
    if not doc_id or c.doctor_id != doc_id:
        raise HTTPException(status_code=403, detail="Khong co quyen sua benh an cua bac si khac")"""
        
content = content.replace(old_update, new_update)

# Add IDOR check to sign_and_lock_consultation
old_sign = """    if c.status == EMRStatus.LOCKED:
        raise HTTPException(status_code=400, detail="Ho so da duoc khoa truoc do")"""

new_sign = """    if c.status == EMRStatus.LOCKED:
        raise HTTPException(status_code=400, detail="Ho so da duoc khoa truoc do")
        
    from app.models.models import Doctor, Staff
    d_res = await db.execute(select(Doctor.id).join(Staff, Doctor.staff_id == Staff.id).where(Staff.user_id == current_user.id))
    doc_id = d_res.scalar_one_or_none()
    if not doc_id or c.doctor_id != doc_id:
        raise HTTPException(status_code=403, detail="Khong co quyen ky benh an cua bac si khac")"""
        
content = content.replace(old_sign, new_sign)

# Also check create_consultation
old_create = """    # Cap nhat trang thai appointment -> IN_CONSULTATION
    appt.status = AppointmentStatus.IN_CONSULTATION"""

new_create = """    from app.models.models import Doctor, Staff
    d_res = await db.execute(select(Doctor.id).join(Staff, Doctor.staff_id == Staff.id).where(Staff.user_id == current_user.id))
    doc_id = d_res.scalar_one_or_none()
    if not doc_id or appt.doctor_id != doc_id:
        raise HTTPException(status_code=403, detail="Khong co quyen tao benh an cho lich hen cua bac si khac")

    # Cap nhat trang thai appointment -> IN_CONSULTATION
    appt.status = AppointmentStatus.IN_CONSULTATION"""

content = content.replace(old_create, new_create)


with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Patched emr.py")
