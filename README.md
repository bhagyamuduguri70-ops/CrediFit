# CrediFit – Admission Stage-Wise Screening Register

**Final-Year BCA Project**  
**Architecture:** Full-Stack Web Application (Node.js + Express + React + TypeScript + MySQL)

---

## 1. Project Overview

**CrediFit** is an enterprise-grade university admission stage-wise screening register designed to automate, audit, and manage undergraduate student admissions. The system enforces strict stage-wise progression across five verification checkpoints:

1. **Stage 1 – Application Submission:** Applicant profile registration, programme selection, qualifying marks entry, and application submission.
2. **Stage 2 – Document Verification:** Document upload (PDF, JPG, PNG) and verification by Admission Officers.
3. **Stage 3 – Eligibility Screening:** Automated and officer-reviewed academic evaluation against minimum cutoffs defined in `eligibility_rules`.
4. **Stage 4 – Department Review:** Merit scoring and criteria-based rubric evaluation by departmental evaluators.
5. **Stage 5 – Final Admission Decision:** Formal recording of final admission decisions (`ADMITTED`, `NOT_ADMITTED`, `WAITLISTED`, `PROVISIONAL`) by authorized administrators.

---

## 2. Technology Stack

### Frontend
- **Framework:** React 19 + Vite 8
- **Language:** TypeScript (`.tsx`, `.ts`)
- **Styling:** Tailwind CSS (Navy Blue `#0f172a` & White theme with light blue accents `#2563eb`)
- **Routing:** React Router v7 with role-guarded routes
- **HTTP Client:** Axios with JWT bearer token injection & refresh token rotation interceptors
- **Icons:** Lucide React

### Backend
- **Runtime:** Node.js (v20+)
- **Framework:** Express.js (ES Modules `"type": "module"`)
- **Database Driver:** `mysql2/promise` with reusable connection pooling
- **Security:** bcryptjs (10-round salted password hashing), JSON Web Tokens (JWT), Helmet, CORS, Rate-Limiting
- **File Uploads:** Multer with file type (PDF/JPG/PNG) & 5MB file-size validation
- **Persistence:** Real MySQL 8 database (`credifit`) — **Zero mock or JSON storage**

---

## 3. Project Directory Structure

```text
CrediFit/
├── backend/
│   ├── scripts/
│   │   └── setup-admin.js       # Safe administrator registration utility
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js            # MySQL2 promise connection pool
│   │   │   └── env.js           # Environment variable configuration
│   │   ├── controllers/
│   │   │   ├── admissionController.js
│   │   │   ├── applicantController.js
│   │   │   ├── applicationController.js
│   │   │   ├── authController.js
│   │   │   ├── clarificationController.js
│   │   │   ├── courseController.js
│   │   │   ├── dashboardController.js
│   │   │   ├── documentController.js
│   │   │   ├── notificationController.js
│   │   │   ├── screeningController.js
│   │   │   └── userController.js
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js
│   │   │   ├── errorMiddleware.js
│   │   │   ├── roleMiddleware.js
│   │   │   └── uploadMiddleware.js
│   │   ├── routes/
│   │   │   ├── admissionRoutes.js
│   │   │   ├── applicantRoutes.js
│   │   │   ├── applicationRoutes.js
│   │   │   ├── authRoutes.js
│   │   │   ├── clarificationRoutes.js
│   │   │   ├── courseRoutes.js
│   │   │   ├── dashboardRoutes.js
│   │   │   ├── documentRoutes.js
│   │   │   ├── notificationRoutes.js
│   │   │   ├── screeningRoutes.js
│   │   │   └── userRoutes.js
│   │   ├── services/
│   │   │   ├── auditService.js
│   │   │   ├── notificationService.js
│   │   │   └── screeningService.js
│   │   ├── utils/
│   │   │   ├── generateToken.js
│   │   │   └── responseHandler.js
│   │   └── server.js            # Express app configuration & server bootstrapper
│   ├── uploads/                 # Storage for uploaded marksheets & ID proofs
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   └── common/          # Badge, Card, ProgressTracker
│   │   ├── context/
│   │   │   └── AuthContext.tsx  # React auth provider & session management
│   │   ├── hooks/
│   │   │   └── useAuth.ts
│   │   ├── layouts/
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── Navbar.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── pages/
│   │   │   ├── admin/           # AdminDashboard, UserManagement, Programmes, Cycles, Decisions, AuditLogs
│   │   │   ├── admission-officer/ # OfficerDashboard, ApplicantList, ApplicationDetail, DocumentVerification, Clarifications
│   │   │   ├── applicant/       # ApplicantDashboard, Profile, Education, Programmes, ApplicationForm, MyApplications, Clarifications
│   │   │   ├── auth/            # LoginPage, RegisterPage
│   │   │   └── evaluator/       # EvaluatorDashboard, AssignedApplications, EvaluationRubric
│   │   ├── routes/
│   │   │   └── AppRoutes.tsx    # Role-based route declarations
│   │   ├── services/
│   │   │   └── api.ts           # Axios instance with interceptors
│   │   ├── types/
│   │   │   └── index.ts         # TypeScript data contracts
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   ├── .env
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── credifit_database.sql        # MySQL 8 Database dump (27 tables)
├── README.md
└── .gitignore
```

---

## 4. Database Schema (27 Tables)

The backend connects directly to MySQL database `credifit` without modifying or destroying existing tables:

| # | Table Name | Purpose |
|---|---|---|
| 1 | `roles` | System roles (`APPLICANT`, `ADMISSION_OFFICER`, `EVALUATOR`, `ADMIN`) |
| 2 | `users` | User credentials, emails, bcrypt password hashes, and account statuses |
| 3 | `refresh_sessions` | Opaque rotating refresh token sessions |
| 4 | `applicant_profiles` | Candidate personal details (DOB, address, city, state, nationality) |
| 5 | `staff_profiles` | Staff designation and department information |
| 6 | `programmes` | University offerings (`BCA`, `BBA`, `BCOM`) |
| 7 | `admission_cycles` | Academic admission terms (e.g. `2026-2027`) |
| 8 | `document_types` | Allowed document categories (`SSLC`, `PUC`, `ID_PROOF`, etc.) |
| 9 | `programme_document_requirements` | Mandatory document mapping per degree programme |
| 10 | `education_records` | Academic marks card history with stored percentage computation |
| 11 | `application_stages` | The 5 screening stages definition |
| 12 | `applications` | Main admission application records |
| 13 | `application_documents` | File metadata linked to applications |
| 14 | `document_reviews` | Officer verification decisions (`VERIFIED`, `REJECTED`, `CLARIFICATION_REQUESTED`) |
| 15 | `eligibility_rules` | Programme cutoff rules (e.g. 50% minimum) |
| 16 | `eligibility_evaluations` | Stage 3 automated / manual check results (`ELIGIBLE`, `NOT_ELIGIBLE`) |
| 17 | `eligibility_evaluation_checks` | Itemized check records |
| 18 | `evaluation_rubrics` | Programme evaluation rubrics |
| 19 | `rubric_criteria` | Weighted scoring criteria per rubric |
| 20 | `evaluator_assignments` | Application assignment to faculty evaluators |
| 21 | `department_reviews` | Stage 4 evaluator merit reviews (`RECOMMEND`, `DO_NOT_RECOMMEND`) |
| 22 | `department_review_scores` | Scores per criterion awarded by evaluators |
| 23 | `final_decisions` | Stage 5 admission decision (`ADMITTED`, `NOT_ADMITTED`, `WAITLISTED`) |
| 24 | `application_stage_history` | Complete historical audit trail of stage transitions |
| 25 | `clarification_requests` | Two-way communication between staff and candidates |
| 26 | `notifications` | In-app user notifications |
| 27 | `audit_logs` | Comprehensive security and administrative audit trail |

---

## 5. Setup & Running Instructions

### Prerequisites
- Node.js (v20 or higher)
- MySQL Server 8 (running on `localhost:3306`)

### Step 1: Start MySQL Database
Ensure your MySQL service is started. In Windows PowerShell:
```powershell
net start MySQL80
```
*(Or start MySQL via XAMPP / MySQL Workbench / Services)*

If you need to load the database dump for the first time:
```powershell
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS credifit;"
mysql -u root -p credifit < credifit_database.sql
```

### Step 2: Configure Backend Environment
Navigate to `backend/`:
```powershell
cd D:\CrediFit\backend
```
Verify `backend/.env` has your correct MySQL password:
```dotenv
PORT=5000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD
DB_NAME=credifit
JWT_SECRET=credifit_super_secret_jwt_key_admission_screening_register_2026
CLIENT_URL=http://localhost:5173
```

### Step 3: Run the Safe Admin Setup Utility
To create an administrator account without overwriting existing users:
```powershell
npm run admin:setup
```
Follow the interactive prompts to register your admin user.

### Step 4: Start the Backend Server
```powershell
cd D:\CrediFit\backend
npm run dev
```
The backend starts at **`http://localhost:5000`**.  
Health check endpoint: **`http://localhost:5000/health`**

### Step 5: Start the Frontend Application
Open a new terminal window:
```powershell
cd D:\CrediFit\frontend
npm run dev
```
The frontend starts at **`http://localhost:5173`**.

---

## 6. Key API Endpoints Summary

All routes are available under both `/api/v1` and `/api`:

### Authentication (`/api/v1/auth`)
- `POST /register` – Register new applicant
- `POST /login` – Sign in & receive access token + refresh cookie
- `POST /refresh` – Rotate refresh token & get new access token
- `POST /logout` – Revoke session & clear cookies
- `GET /me` – Retrieve currently logged-in user profile

### Applicants & Education (`/api/v1/applicants`)
- `GET /profile` – Get applicant profile & education records
- `PUT /profile` – Update candidate profile
- `GET /education` – List education marks cards
- `POST /education` – Add new education record
- `DELETE /education/:id` – Delete education record
- `GET /` – Directory of registered applicants (Staff only)

### Courses & Catalog (`/api/v1/courses`)
- `GET /programmes` – List active degree programmes (BCA, BBA, BCOM)
- `GET /programmes/:id` – Programme details & document checklist
- `POST /programmes` – Add degree programme (Admin)
- `GET /cycles` – List academic admission terms

### Applications (`/api/v1/applications`)
- `POST /` – Create new application draft (Stage 1)
- `POST /:id/submit` – Submit draft for Stage 2 Document Verification
- `GET /my` – Get all applications submitted by logged-in applicant
- `GET /` – Get all applications across university (Staff)
- `GET /:id` – Get comprehensive application file with documents, stage history, and reviews

### Documents (`/api/v1/documents`)
- `GET /types` – List required document types
- `POST /upload` – Multer file upload (PDF/JPG/PNG up to 5MB)
- `GET /:id/download` – Secure file download stream
- `POST /:id/review` – Officer decision: `VERIFIED`, `REJECTED`, or `CLARIFICATION_REQUESTED`

### Screening & Evaluation (`/api/v1/screening`)
- `POST /eligibility/:applicationId` – Run automated academic eligibility check (Stage 3)
- `GET /eligibility/:applicationId` – View eligibility calculation & criteria checks
- `POST /assign-evaluator` – Assign faculty evaluator to candidate (Stage 4)
- `GET /evaluator/assignments` – Evaluator's assigned application queue
- `GET /rubrics/programme/:programmeId` – Load degree scoring rubric & criteria
- `POST /department-review/:applicationId` – Submit department review scores & recommendation

### Final Admission Decision (`/api/v1/admission`)
- `POST /:applicationId/decision` – Award final admission decision (`ADMITTED`, `NOT_ADMITTED`) (Stage 5)
- `GET /:applicationId` – View final decision certificate details

### Dashboard & Auditing (`/api/v1/dashboard` & `/api/v1/users`)
- `GET /dashboard/admin` – High-level admission funnel metrics & statistics
- `GET /dashboard/officer` – Pending verification & review queue counts
- `GET /dashboard/evaluator` – Evaluator assignment status
- `GET /dashboard/applicant` – Candidate application tracking summary
- `GET /users/audit-logs` – Tamper-evident system activity audit trail
- `GET /users` – User account directory

---

## 7. Final-Year BCA Project Defense Highlights

When demonstrating this project for your final-year project evaluation:

1. **Database Rigour:** Emphasize that all 27 tables are normalized with relational foreign keys, stored computed columns (percentage generation in `education_records`), and status check constraints.
2. **Automated Stage Gating:** Highlight that candidates cannot jump stages — they must advance systematically through Application Submission &rarr; Document Verification &rarr; Eligibility Screening &rarr; Department Review &rarr; Final Admission.
3. **Role-Based Access Control (RBAC):** Demonstrate how Applicants, Admission Officers, Evaluators, and Admins experience tailored interfaces with backend authorization enforcement.
4. **Security Best Practices:** Show that passwords use salted bcrypt hashes, JWT tokens are cryptographically signed, file uploads are validated by MIME type, and all SQL statements use parameterized bindings.
