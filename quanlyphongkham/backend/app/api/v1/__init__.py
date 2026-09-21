from fastapi import APIRouter
from app.api.v1 import auth
from app.api.v1 import receptionist, patients, appointments, emr, ai, doctors, billing, prescriptions, admin, notifications, lab_results, doctor_dashboard

router = APIRouter()
router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
router.include_router(patients.router, prefix="/patients", tags=["Patients"])
router.include_router(doctors.router, prefix="/doctors", tags=["Doctors"])
router.include_router(appointments.router, prefix="/appointments", tags=["Appointments"])
router.include_router(emr.router, prefix="/emr", tags=["EMR"])
router.include_router(ai.router, prefix="/ai", tags=["AI"])
router.include_router(billing.router, prefix="/billing", tags=["Billing"])
router.include_router(prescriptions.router, prefix="/prescriptions", tags=["Prescriptions"])
router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
router.include_router(lab_results.router, prefix="/lab-results", tags=["Lab Results"])
router.include_router(admin.router, prefix="/admin", tags=["Admin"])
router.include_router(doctor_dashboard.router, prefix="/doctor", tags=["Doctor Portal"])
router.include_router(receptionist.router, prefix="/receptionist", tags=["Receptionist"])
