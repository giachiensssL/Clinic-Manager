// Enums
export type UserRole = 'admin' | 'doctor' | 'receptionist' | 'accountant' | 'patient';
export type Gender = 'male' | 'female' | 'other';
export type AppointmentStatus = 'scheduled' | 'waiting' | 'in_consultation' | 'completed' | 'paid' | 'cancelled' | 'no_show';
export type BillingStatus = 'unpaid' | 'partially_paid' | 'paid' | 'refunded';
export type PaymentMethod = 'cash' | 'card' | 'insurance' | 'transfer';
export type EMRStatus = 'draft' | 'completed' | 'locked';

// Auth
export interface AuthToken {
  access_token: string;
  refresh_token: string;
  token_type: string;
  role: UserRole;
  user_id: string;
  username: string;
  full_name?: string;
}

// Patient
export interface Patient {
  id: string; patient_code: string; full_name: string; date_of_birth: string;
  gender: Gender; phone: string; email?: string; address?: string;
  identity_number?: string; blood_type?: string; allergies?: string;
  insurance_number?: string; insurance_provider?: string;
  emergency_contact_name?: string; emergency_contact_phone?: string;
  is_active: boolean; created_at: string;
}

// Doctor + Staff
export interface Doctor {
  id: string; license_number: string; qualification?: string; bio?: string;
  consultation_fee: number; is_active: boolean;
  staff: { full_name: string; phone?: string; email?: string; };
  department: { id: string; name: string; };
  specialty: { id: string; name: string; };
}

// Appointment
export interface Appointment {
  id: string; appointment_code: string; patient_id: string; doctor_id: string;
  specialty_id: string; appointment_date: string; start_time: string; end_time: string;
  status: AppointmentStatus; reason?: string; notes?: string;
  patient?: { full_name: string; phone: string; patient_code: string; };
  doctor?: { staff: { full_name: string; }; specialty: { name: string; }; };
  specialty?: { name: string; };
  created_at: string;
}

// EMR / Consultation
export interface ConsultationDiagnosis {
  id: string; consultation_id: string; diagnosis_id: string;
  is_primary: boolean; notes?: string;
  diagnosis: { icd10_code: string; name: string; };
}

export interface Consultation {
  id: string; appointment_id: string; patient_id: string; doctor_id: string;
  blood_pressure?: string; heart_rate?: number; temperature?: number;
  weight?: number; height?: number; oxygen_saturation?: number;
  chief_complaint?: string; clinical_notes?: string; physical_examination?: string;
  treatment_plan?: string; follow_up_date?: string; follow_up_notes?: string;
  status: EMRStatus;
  signed_by?: string; signed_at?: string; signature_hash?: string; locked_at?: string;
  diagnoses: ConsultationDiagnosis[];
  created_at: string;
}

// Paginated
export interface PaginatedResponse<T> {
  items: T[]; total: number; page: number; size: number; pages: number;
}
