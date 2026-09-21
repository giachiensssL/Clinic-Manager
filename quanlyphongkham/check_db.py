import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.abspath("backend"))

from app.core.database import AsyncSessionLocal
from app.models.models import User, Patient, Appointment, Consultation, LabResult, Prescription, Billing
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as db:
        user = (await db.execute(select(User).where(User.username == 'patient'))).scalar_one_or_none()
        if not user:
            print("User 'patient' not found")
            return
        
        print(f"User ID: {user.id}")
        patient = (await db.execute(select(Patient).where(Patient.user_id == user.id))).scalar_one_or_none()
        
        if not patient:
            print("Patient profile not found")
            return
            
        print(f"Patient ID: {patient.id}")
        print(f"Patient Name: {patient.full_name}")
        
        appts = (await db.execute(select(Appointment).where(Appointment.patient_id == patient.id))).scalars().all()
        print(f"Appointments: {len(appts)}")
        
        consults = (await db.execute(select(Consultation).where(Consultation.patient_id == patient.id))).scalars().all()
        print(f"Consultations: {len(consults)}")
        
        labs = (await db.execute(select(LabResult).where(LabResult.patient_id == patient.id))).scalars().all()
        print(f"Lab Results: {len(labs)}")
        
        rxs = (await db.execute(select(Prescription).where(Prescription.patient_id == patient.id))).scalars().all()
        print(f"Prescriptions: {len(rxs)}")
        
        invoices = (await db.execute(select(Billing).where(Billing.patient_id == patient.id))).scalars().all()
        print(f"Invoices: {len(invoices)}")

if __name__ == "__main__":
    asyncio.run(main())
