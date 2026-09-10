"""
SQLAlchemy Models — Clinic Management System
Tất cả models theo chuẩn 3NF với đầy đủ constraints, indexes, timestamps
"""
import enum
import uuid
from datetime import datetime, date, time
from typing import Optional, List
from sqlalchemy import (
    String, Integer, Float, Boolean, DateTime, Date, Time,
    Text, Enum, ForeignKey, UniqueConstraint, Index, CheckConstraint,
    func, JSON
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


# ===================== ENUMS =====================

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    DOCTOR = "doctor"
    RECEPTIONIST = "receptionist"
    ACCOUNTANT = "accountant"
    PATIENT = "patient"


class Gender(str, enum.Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"


class AppointmentStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    WAITING = "waiting"
    IN_CONSULTATION = "in_consultation"
    COMPLETED = "completed"
    PAID = "paid"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"


class BillingStatus(str, enum.Enum):
    UNPAID = "unpaid"
    PARTIALLY_PAID = "partially_paid"
    PAID = "paid"
    REFUNDED = "refunded"


class PaymentMethod(str, enum.Enum):
    CASH = "cash"
    CARD = "card"
    INSURANCE = "insurance"
    TRANSFER = "transfer"


class EMRStatus(str, enum.Enum):
    DRAFT = "draft"
    COMPLETED = "completed"
    LOCKED = "locked"


class AuditAction(str, enum.Enum):
    CREATE = "create"
    READ = "read"
    UPDATE = "update"
    DELETE = "delete"
    LOGIN = "login"
    LOGOUT = "logout"
    SIGN = "sign"
    LOCK = "lock"
    PAYMENT = "payment"
    AI_REQUEST = "ai_request"
    AI_TOOL_CALL = "ai_tool_call"
    GUARDRAIL_BLOCK = "guardrail_block"


# ===================== USERS =====================

class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    # Relationships
    staff: Mapped[Optional["Staff"]] = relationship("Staff", back_populates="user", uselist=False)
    patient: Mapped[Optional["Patient"]] = relationship("Patient", back_populates="user", uselist=False)
    audit_logs: Mapped[List["AuditLog"]] = relationship("AuditLog", back_populates="user")
    ai_conversations: Mapped[List["AIConversation"]] = relationship("AIConversation", back_populates="user")


# ===================== STAFF =====================

class Staff(Base):
    __tablename__ = "staff"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)
    employee_id: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(20))
    address: Mapped[Optional[str]] = mapped_column(Text)
    date_of_birth: Mapped[Optional[date]] = mapped_column(Date)
    gender: Mapped[Optional[Gender]] = mapped_column(Enum(Gender))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship("User", back_populates="staff")
    doctor: Mapped[Optional["Doctor"]] = relationship("Doctor", back_populates="staff", uselist=False)


# ===================== DEPARTMENTS =====================

class Department(Base):
    __tablename__ = "departments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    doctors: Mapped[List["Doctor"]] = relationship("Doctor", back_populates="department")


# ===================== SPECIALTIES =====================

class Specialty(Base):
    __tablename__ = "specialties"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    doctors: Mapped[List["Doctor"]] = relationship("Doctor", back_populates="specialty")


# ===================== DOCTORS =====================

class Doctor(Base):
    __tablename__ = "doctors"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    staff_id: Mapped[str] = mapped_column(ForeignKey("staff.id"), unique=True, nullable=False)
    department_id: Mapped[str] = mapped_column(ForeignKey("departments.id"), nullable=False)
    specialty_id: Mapped[str] = mapped_column(ForeignKey("specialties.id"), nullable=False)
    license_number: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    qualification: Mapped[Optional[str]] = mapped_column(String(255))
    bio: Mapped[Optional[str]] = mapped_column(Text)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500))
    consultation_fee: Mapped[float] = mapped_column(Float, default=0.0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    staff: Mapped["Staff"] = relationship("Staff", back_populates="doctor")
    department: Mapped["Department"] = relationship("Department", back_populates="doctors")
    specialty: Mapped["Specialty"] = relationship("Specialty", back_populates="doctors")
    working_schedules: Mapped[List["WorkingSchedule"]] = relationship("WorkingSchedule", back_populates="doctor")
    appointments: Mapped[List["Appointment"]] = relationship("Appointment", back_populates="doctor")

    __table_args__ = (
        Index("ix_doctors_specialty_id", "specialty_id"),
        Index("ix_doctors_department_id", "department_id"),
    )


# ===================== WORKING SCHEDULES =====================

class WorkingSchedule(Base):
    __tablename__ = "working_schedules"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    doctor_id: Mapped[str] = mapped_column(ForeignKey("doctors.id"), nullable=False)
    day_of_week: Mapped[int] = mapped_column(Integer, nullable=False)  # 0=Mon, 6=Sun
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    slot_duration_minutes: Mapped[int] = mapped_column(Integer, default=30)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    doctor: Mapped["Doctor"] = relationship("Doctor", back_populates="working_schedules")

    __table_args__ = (
        CheckConstraint("day_of_week >= 0 AND day_of_week <= 6", name="ck_working_schedules_day_of_week"),
        CheckConstraint("end_time > start_time", name="ck_working_schedules_time_range"),
        UniqueConstraint("doctor_id", "day_of_week", name="uq_working_schedules_doctor_day"),
    )


# ===================== PATIENTS =====================

class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[Optional[str]] = mapped_column(ForeignKey("users.id"), unique=True)
    patient_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    date_of_birth: Mapped[date] = mapped_column(Date, nullable=False)
    gender: Mapped[Gender] = mapped_column(Enum(Gender), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255))
    address: Mapped[Optional[str]] = mapped_column(Text)
    identity_number: Mapped[Optional[str]] = mapped_column(String(20))
    blood_type: Mapped[Optional[str]] = mapped_column(String(10))
    allergies: Mapped[Optional[str]] = mapped_column(Text)  # JSON list of allergies
    insurance_number: Mapped[Optional[str]] = mapped_column(String(50))
    insurance_provider: Mapped[Optional[str]] = mapped_column(String(255))
    emergency_contact_name: Mapped[Optional[str]] = mapped_column(String(255))
    emergency_contact_phone: Mapped[Optional[str]] = mapped_column(String(20))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    user: Mapped[Optional["User"]] = relationship("User", back_populates="patient")
    appointments: Mapped[List["Appointment"]] = relationship("Appointment", back_populates="patient")
    consultations: Mapped[List["Consultation"]] = relationship("Consultation", back_populates="patient")
    billings: Mapped[List["Billing"]] = relationship("Billing", back_populates="patient")

    __table_args__ = (
        Index("ix_patients_phone", "phone"),
        Index("ix_patients_identity_number", "identity_number"),
    )


# ===================== APPOINTMENTS =====================

class Appointment(Base):
    __tablename__ = "appointments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    appointment_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.id"), nullable=False)
    doctor_id: Mapped[str] = mapped_column(ForeignKey("doctors.id"), nullable=False)
    specialty_id: Mapped[str] = mapped_column(ForeignKey("specialties.id"), nullable=False)
    appointment_date: Mapped[date] = mapped_column(Date, nullable=False)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    status: Mapped[AppointmentStatus] = mapped_column(
        Enum(AppointmentStatus), default=AppointmentStatus.SCHEDULED, nullable=False
    )
    reason: Mapped[Optional[str]] = mapped_column(Text)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    checked_in_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    cancelled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    cancellation_reason: Mapped[Optional[str]] = mapped_column(Text)
    created_by: Mapped[Optional[str]] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    patient: Mapped["Patient"] = relationship("Patient", back_populates="appointments")
    doctor: Mapped["Doctor"] = relationship("Doctor", back_populates="appointments")
    specialty: Mapped["Specialty"] = relationship("Specialty")
    consultation: Mapped[Optional["Consultation"]] = relationship("Consultation", back_populates="appointment", uselist=False)
    billing: Mapped[Optional["Billing"]] = relationship("Billing", back_populates="appointment", uselist=False)

    __table_args__ = (
        # DOUBLE BOOKING PREVENTION: unique constraint at DB level
        UniqueConstraint(
            "doctor_id", "appointment_date", "start_time",
            name="uq_appointments_doctor_date_time"
        ),
        Index("ix_appointments_patient_id", "patient_id"),
        Index("ix_appointments_doctor_date", "doctor_id", "appointment_date"),
        Index("ix_appointments_status", "status"),
    )


# ===================== CONSULTATIONS (EMR) =====================

class Consultation(Base):
    __tablename__ = "consultations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    appointment_id: Mapped[str] = mapped_column(ForeignKey("appointments.id"), unique=True, nullable=False)
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.id"), nullable=False)
    doctor_id: Mapped[str] = mapped_column(ForeignKey("doctors.id"), nullable=False)
    # Vitals
    blood_pressure: Mapped[Optional[str]] = mapped_column(String(20))  # e.g. "120/80"
    heart_rate: Mapped[Optional[int]] = mapped_column(Integer)
    temperature: Mapped[Optional[float]] = mapped_column(Float)
    weight: Mapped[Optional[float]] = mapped_column(Float)
    height: Mapped[Optional[float]] = mapped_column(Float)
    oxygen_saturation: Mapped[Optional[float]] = mapped_column(Float)
    # Clinical
    chief_complaint: Mapped[Optional[str]] = mapped_column(Text)
    clinical_notes: Mapped[Optional[str]] = mapped_column(Text)
    physical_examination: Mapped[Optional[str]] = mapped_column(Text)
    treatment_plan: Mapped[Optional[str]] = mapped_column(Text)
    follow_up_date: Mapped[Optional[date]] = mapped_column(Date)
    follow_up_notes: Mapped[Optional[str]] = mapped_column(Text)
    # EMR Status
    status: Mapped[EMRStatus] = mapped_column(Enum(EMRStatus), default=EMRStatus.DRAFT)
    # Digital Signature
    signed_by: Mapped[Optional[str]] = mapped_column(ForeignKey("users.id"))
    signed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    signature_hash: Mapped[Optional[str]] = mapped_column(String(64))  # SHA-256
    locked_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    appointment: Mapped["Appointment"] = relationship("Appointment", back_populates="consultation")
    patient: Mapped["Patient"] = relationship("Patient", back_populates="consultations")
    doctor: Mapped["Doctor"] = relationship("Doctor")
    diagnoses: Mapped[List["ConsultationDiagnosis"]] = relationship("ConsultationDiagnosis", back_populates="consultation")
    prescription: Mapped[Optional["Prescription"]] = relationship("Prescription", back_populates="consultation", uselist=False)

    __table_args__ = (
        Index("ix_consultations_patient_id", "patient_id"),
        Index("ix_consultations_doctor_id", "doctor_id"),
    )


# ===================== DIAGNOSES =====================

class Diagnosis(Base):
    """ICD-10 Diagnosis reference table"""
    __tablename__ = "diagnoses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    icd10_code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    category: Mapped[Optional[str]] = mapped_column(String(255))


class ConsultationDiagnosis(Base):
    """Link table between Consultation and Diagnosis"""
    __tablename__ = "consultation_diagnoses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    consultation_id: Mapped[str] = mapped_column(ForeignKey("consultations.id"), nullable=False)
    diagnosis_id: Mapped[str] = mapped_column(ForeignKey("diagnoses.id"), nullable=False)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    consultation: Mapped["Consultation"] = relationship("Consultation", back_populates="diagnoses")
    diagnosis: Mapped["Diagnosis"] = relationship("Diagnosis")

    __table_args__ = (
        UniqueConstraint("consultation_id", "diagnosis_id", name="uq_consultation_diagnoses"),
    )


# ===================== MEDICINES =====================

class Medicine(Base):
    __tablename__ = "medicines"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    generic_name: Mapped[Optional[str]] = mapped_column(String(255))
    brand_name: Mapped[Optional[str]] = mapped_column(String(255))
    drug_class: Mapped[Optional[str]] = mapped_column(String(255))
    form: Mapped[Optional[str]] = mapped_column(String(100))  # tablet, capsule, etc.
    strength: Mapped[Optional[str]] = mapped_column(String(100))
    unit: Mapped[Optional[str]] = mapped_column(String(50))
    contraindications: Mapped[Optional[str]] = mapped_column(Text)
    interactions: Mapped[Optional[str]] = mapped_column(Text)
    price: Mapped[float] = mapped_column(Float, default=0.0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# ===================== PRESCRIPTIONS =====================

class Prescription(Base):
    __tablename__ = "prescriptions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    prescription_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    consultation_id: Mapped[str] = mapped_column(ForeignKey("consultations.id"), unique=True, nullable=False)
    doctor_id: Mapped[str] = mapped_column(ForeignKey("doctors.id"), nullable=False)
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.id"), nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    dispensed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    consultation: Mapped["Consultation"] = relationship("Consultation", back_populates="prescription")
    items: Mapped[List["PrescriptionItem"]] = relationship("PrescriptionItem", back_populates="prescription")


class PrescriptionItem(Base):
    __tablename__ = "prescription_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    prescription_id: Mapped[str] = mapped_column(ForeignKey("prescriptions.id"), nullable=False)
    medicine_id: Mapped[str] = mapped_column(ForeignKey("medicines.id"), nullable=False)
    dosage: Mapped[str] = mapped_column(String(100), nullable=False)
    frequency: Mapped[str] = mapped_column(String(100), nullable=False)
    duration_days: Mapped[int] = mapped_column(Integer, nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    instructions: Mapped[Optional[str]] = mapped_column(Text)
    unit_price: Mapped[float] = mapped_column(Float, default=0.0)

    prescription: Mapped["Prescription"] = relationship("Prescription", back_populates="items")
    medicine: Mapped["Medicine"] = relationship("Medicine")

    __table_args__ = (
        CheckConstraint("quantity > 0", name="ck_prescription_items_quantity"),
        CheckConstraint("duration_days > 0", name="ck_prescription_items_duration"),
    )


# ===================== SERVICES =====================

class Service(Base):
    """Medical services offered by the clinic"""
    __tablename__ = "services"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# ===================== BILLING =====================

class Billing(Base):
    __tablename__ = "billing"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    invoice_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.id"), nullable=False)
    appointment_id: Mapped[str] = mapped_column(ForeignKey("appointments.id"), unique=True, nullable=False)
    consultation_fee: Mapped[float] = mapped_column(Float, default=0.0)
    medicine_fee: Mapped[float] = mapped_column(Float, default=0.0)
    service_fee: Mapped[float] = mapped_column(Float, default=0.0)
    total_amount: Mapped[float] = mapped_column(Float, nullable=False)
    insurance_covered: Mapped[float] = mapped_column(Float, default=0.0)
    discount: Mapped[float] = mapped_column(Float, default=0.0)
    paid_amount: Mapped[float] = mapped_column(Float, default=0.0)
    remaining_amount: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[BillingStatus] = mapped_column(Enum(BillingStatus), default=BillingStatus.UNPAID)
    due_date: Mapped[Optional[date]] = mapped_column(Date)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    patient: Mapped["Patient"] = relationship("Patient", back_populates="billings")
    appointment: Mapped["Appointment"] = relationship("Appointment", back_populates="billing")
    payments: Mapped[List["Payment"]] = relationship("Payment", back_populates="billing")

    __table_args__ = (
        CheckConstraint("total_amount >= 0", name="ck_billing_total_amount"),
        CheckConstraint("paid_amount >= 0", name="ck_billing_paid_amount"),
        Index("ix_billing_patient_id", "patient_id"),
        Index("ix_billing_status", "status"),
    )


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    billing_id: Mapped[str] = mapped_column(ForeignKey("billing.id"), nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    payment_method: Mapped[PaymentMethod] = mapped_column(Enum(PaymentMethod), nullable=False)
    transaction_id: Mapped[Optional[str]] = mapped_column(String(255))
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_by: Mapped[Optional[str]] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    billing: Mapped["Billing"] = relationship("Billing", back_populates="payments")

    __table_args__ = (
        CheckConstraint("amount > 0", name="ck_payments_amount"),
    )


# ===================== AUDIT LOGS =====================

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[Optional[str]] = mapped_column(ForeignKey("users.id"))
    username: Mapped[Optional[str]] = mapped_column(String(100))
    user_role: Mapped[Optional[str]] = mapped_column(String(50))
    action: Mapped[AuditAction] = mapped_column(Enum(AuditAction), nullable=False)
    resource_type: Mapped[Optional[str]] = mapped_column(String(100))
    resource_id: Mapped[Optional[str]] = mapped_column(String(255))
    details: Mapped[Optional[str]] = mapped_column(Text)
    ip_address: Mapped[Optional[str]] = mapped_column(String(50))
    user_agent: Mapped[Optional[str]] = mapped_column(String(500))
    result: Mapped[str] = mapped_column(String(50), default="success")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped[Optional["User"]] = relationship("User", back_populates="audit_logs")

    __table_args__ = (
        Index("ix_audit_logs_user_id", "user_id"),
        Index("ix_audit_logs_action", "action"),
        Index("ix_audit_logs_created_at", "created_at"),
        Index("ix_audit_logs_resource_type", "resource_type"),
    )


# ===================== AI CONVERSATIONS =====================

class AIConversation(Base):
    __tablename__ = "ai_conversations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    title: Mapped[Optional[str]] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship("User", back_populates="ai_conversations")
    messages: Mapped[List["AIMessage"]] = relationship("AIMessage", back_populates="conversation")


class AIMessage(Base):
    __tablename__ = "ai_messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id: Mapped[str] = mapped_column(ForeignKey("ai_conversations.id"), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False)  # user | assistant | system
    content: Mapped[str] = mapped_column(Text, nullable=False)
    guardrail_blocked: Mapped[bool] = mapped_column(Boolean, default=False)
    guardrail_reason: Mapped[Optional[str]] = mapped_column(Text)
    tokens_used: Mapped[Optional[int]] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    conversation: Mapped["AIConversation"] = relationship("AIConversation", back_populates="messages")


# ===================== AI GUARDRAIL RULES =====================

class AIGuardrailRule(Base):
    __tablename__ = "ai_guardrail_rules"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    rule_type: Mapped[str] = mapped_column(String(50), nullable=False)  # keyword | regex | pattern
    pattern: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    applies_to: Mapped[str] = mapped_column(String(20), default="both")  # input | output | both
    created_by: Mapped[Optional[str]] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


# ===================== AI TOOL CALLS =====================

class AIToolCall(Base):
    __tablename__ = "ai_tool_calls"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id: Mapped[Optional[str]] = mapped_column(ForeignKey("ai_conversations.id"))
    user_id: Mapped[Optional[str]] = mapped_column(ForeignKey("users.id"))
    tool_name: Mapped[str] = mapped_column(String(100), nullable=False)
    tool_input: Mapped[Optional[str]] = mapped_column(Text)
    tool_output: Mapped[Optional[str]] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default="success")  # success | error | blocked
    error_message: Mapped[Optional[str]] = mapped_column(Text)
    execution_time_ms: Mapped[Optional[int]] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_ai_tool_calls_user_id", "user_id"),
        Index("ix_ai_tool_calls_tool_name", "tool_name"),
    )
