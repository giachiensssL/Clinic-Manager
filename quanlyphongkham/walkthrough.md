# System Walkthrough

## What has been accomplished so far:

1. **Database and Initial Setup**:
   - We migrated the config from Postgres to `SQLite (aiosqlite)` to make it run effortlessly on your local machine without needing Docker.
   - Built a comprehensive `seed.py` that generates 5 Demo accounts (Admin, Doctor, Receptionist, Accountant, Patient), 5 Doctors, 20 Patients, 30 Appointments, 13 EMR records, Billings, and AI Guardrails.
   - Fixed the `passlib`/`bcrypt` length limit issue.

2. **Backend APIs Completed**:
   - `Auth` (Login, Token Refresh, Me)
   - `Patients` (CRUD, listing)
   - `Doctors` (Listing, Details)
   - `Appointments` (Booking with double-booking prevention)
   - `EMR` (Consultation creation, adding diagnoses, digital signing with SHA-256 and locking)
   - `AI` (Chat endpoint with input/output guardrails and mock mode, Summarize EMR endpoint)
   - `Audit Middleware` and `Audit Service` for comprehensive logging.

3. **Frontend Architecture Started**:
   - Configured `Vite`, `React Router`, `Tailwind CSS v4`.
   - Setup `axios` with JWT interceptors (handling auto-refresh token).
   - Created `AuthStore` with Zustand for state management and RBAC.
   - Designed `AppLayout` with a responsive sidebar and role-based menu filtering.
   - Implemented the `Login` page and `Dashboard` layout.

## Next Steps

To run the application locally:
1. Open a terminal and run the backend:
```bash
cd d:\Website_Antigravity\DU_LIEU\Quanlyphongkham\quanlyphongkham\backend
set PYTHONPATH=.
python -m uvicorn app.main:app --reload --port 8000
```

2. Open another terminal and run the frontend:
```bash
cd d:\Website_Antigravity\DU_LIEU\Quanlyphongkham\quanlyphongkham\frontend
npm run dev
```

You can login with the demo accounts (e.g. `admin` / `Admin123!`).

The next phases will focus on fleshing out the remaining Frontend pages (Patient list, AI chat interface, Calendar) and completing the Billing/Prescription API routes.
