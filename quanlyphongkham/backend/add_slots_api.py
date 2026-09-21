import os

file_path = "app/api/v1/doctors.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

new_endpoint = """
@router.get("/{doctor_id}/slots")
async def get_doctor_slots(
    doctor_id: str,
    date: str, # YYYY-MM-DD
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    import datetime
    from app.models.models import WorkingSchedule, Appointment, AppointmentStatus
    
    try:
        target_date = datetime.date.fromisoformat(date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Ngày không hợp lệ")
        
    day_of_week = target_date.weekday() # 0=Mon, 6=Sun
    
    # 1. Get working schedule
    sched_result = await db.execute(
        select(WorkingSchedule)
        .where(WorkingSchedule.doctor_id == doctor_id)
        .where(WorkingSchedule.day_of_week == day_of_week)
        .where(WorkingSchedule.is_active == True)
    )
    schedules = sched_result.scalars().all()
    
    if not schedules:
        return {"date": date, "slots": []}
        
    # 2. Get existing appointments
    apt_result = await db.execute(
        select(Appointment)
        .where(Appointment.doctor_id == doctor_id)
        .where(Appointment.appointment_date == target_date)
        .where(Appointment.status.in_([
            AppointmentStatus.SCHEDULED,
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.CHECKED_IN,
            AppointmentStatus.IN_PROGRESS,
            AppointmentStatus.COMPLETED
        ]))
    )
    appointments = apt_result.scalars().all()
    booked_times = [apt.start_time.strftime("%H:%M") for apt in appointments if apt.start_time]
    
    # 3. Generate slots
    slots = []
    now = datetime.datetime.now()
    
    for sched in schedules:
        current_time = datetime.datetime.combine(target_date, sched.start_time)
        end_time = datetime.datetime.combine(target_date, sched.end_time)
        
        while current_time < end_time:
            time_str = current_time.strftime("%H:%M")
            
            # If the date is today and the time has already passed, it's not available
            is_past = False
            if target_date == now.date() and current_time.time() < now.time():
                is_past = True
                
            slots.append({
                "time": time_str,
                "is_available": time_str not in booked_times and not is_past
            })
            current_time += datetime.timedelta(minutes=sched.slot_duration_minutes)
            
    # Sort slots
    slots.sort(key=lambda x: x["time"])
    
    return {"date": date, "slots": slots}
"""

content = content + new_endpoint

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Added get_doctor_slots endpoint")
