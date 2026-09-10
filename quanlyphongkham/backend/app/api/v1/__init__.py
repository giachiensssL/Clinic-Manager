from fastapi import APIRouter
from app.api.v1 import auth, patients, appointments, emr, ai, doctors, billing, prescriptions, admin

router = APIRouter()
router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
router.include_router(patients.router, prefix="/patients", tags=["Patients"])
router.include_router(doctors.router, prefix="/doctors", tags=["Doctors"])
router.include_router(appointments.router, prefix="/appointments", tags=["Appointments"])
router.include_router(emr.router, prefix="/emr", tags=["EMR"])
router.include_router(ai.router, prefix="/ai", tags=["AI"])
router.include_router(billing.router, prefix="/billing", tags=["Billing"])
router.include_router(prescriptions.router, prefix="/prescriptions", tags=["Prescriptions"])
router.include_router(admin.router, prefix="/admin", tags=["Admin"])