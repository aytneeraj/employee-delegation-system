# Employee Task Delegation & Management System

An enterprise-grade, full-stack application for managing and tracking task delegation workflows in software development organizations. Designed to support both **Manager → Employee** task assignments and peer-to-peer **Employee → Employee** task delegation with immutable audit trails, controlled reassignment workflows, multi-stage approval processes, and real-time analytics.

---

## 1. Key Features

- **Bidirectional Delegation Architecture:**
  - Manager → Employee task delegation.
  - Employee → Employee peer delegation with mandatory reassignment reasons.
  - Strict prevention of employee self-assignment.
- **Immutable Delegation & Audit History:**
  - Full chain-of-custody tracking (`task_assignments` and `task_status_history`).
  - Prior assignments and historical assignees are never overwritten.
  - Transparent visibility of the original creator, previous delegator, and current assignee.
- **Enforced Status Lifecycle & Sign-Off Workflow:**
  - State machine: `Assigned` → `Accepted` → `In Progress` → `Under Review` → `Revision Required` / `Completed`.
  - Employees cannot unilaterally complete their own tasks without delegator or manager review approval.
  - Delegators and managers can request revisions with structured feedback.
- **Role-Based Access Control (RBAC):**
  - Granular backend authorization across `Admin`, `Manager`, and `Employee` roles.
  - Dynamic, role-tailored dashboards with real metrics derived from actual database data.
- **In-App Notification Engine:**
  - Real-time notifications for task delegations, status updates, review submissions, and revisions.
- **Reports & Visual Analytics:**
  - Interactive charts powered by Recharts (Volume by Priority, Status distribution, Department performance, Employee workload).
- **Projects & Employee Directory:**
  - Corporate department and project tracking.
  - Employee activation/deactivation controls.

---

## 2. Technology Stack

- **Frontend:**
  - React 18+ (JavaScript) with Vite
  - Tailwind CSS
  - React Router DOM v6
  - Axios (with JWT interceptors)
  - Lucide React Icons
  - Recharts (Data Visualizations)
- **Backend:**
  - Python 3.11+
  - FastAPI
  - SQLAlchemy 2.0 ORM
  - Pydantic v2 & Pydantic-Settings
  - Alembic (Database Migrations)
  - PyMySQL (MySQL 8 Connectivity)
  - PyJWT & Bcrypt (Cryptographic security)
  - Pytest (Automated test suite)
- **Database:**
  - MySQL 8.0+ (`employee_delegation_db` with `utf8mb4` character set)
  - SQLite dev fallback supported for rapid testing when MySQL password is pending.

---

## 3. Project Structure

```
employee-delegation-system/
├── backend/
│   ├── alembic/              # Alembic database migrations
│   ├── app/
│   │   ├── api/              # API routes and dependencies
│   │   │   ├── routes/       # Auth, Users, Tasks, Updates, Comments, Reports, Notifications
│   │   │   ├── deps.py       # RBAC & JWT dependencies
│   │   │   └── api.py        # Central APIRouter
│   │   ├── core/             # Configuration & security (JWT, Bcrypt)
│   │   ├── db/               # Database session, models Base, seed script
│   │   ├── models/           # SQLAlchemy models
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── services/         # Delegation logic, task state machine, reports
│   │   └── main.py           # FastAPI entrypoint
│   ├── tests/                # Pytest automated test suite
│   ├── requirements.txt      # Python dependencies
│   ├── .env.example          # Backend environment template
│   └── .env                  # Local backend environment
├── frontend/
│   ├── src/
│   │   ├── components/       # Common, Dashboard, Tasks components
│   │   ├── context/          # AuthContext & NotificationContext
│   │   ├── layouts/          # AppLayout & Navigation
│   │   ├── pages/            # Role dashboards, Tasks, Directory, Reports, Profile
│   │   ├── services/         # Axios API clients
│   │   ├── App.jsx           # Routing & Route Guards
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── .env.example
├── database/
│   ├── init.sql              # MySQL 8 database schema initialization
│   └── schema_notes.md       # Architectural database notes
├── docs/
│   ├── architecture.md       # High-level system architecture
│   ├── api_documentation.md  # Complete REST API reference
│   └── database_design.md    # Relational ER and schema specifications
└── README.md
```

---

## 4. Prerequisites

Verify installed tools using PowerShell:
```powershell
python --version   # Python 3.11+
node --version     # Node.js 18+
npm --version      # npm 9+
```

---

## 5. Local Setup Instructions

### Step 1: Backend Virtual Environment & Dependencies

From the repository root:
```powershell
# Navigate to backend
cd backend

# Create virtual environment
py -3.11 -m venv .venv

# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Upgrade pip and install dependencies
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### Step 2: Database Configuration

#### Option A: Local MySQL 8 Server (Default Production Setup)
1. Ensure your local MySQL 8 service is running (`MySQL80`).
2. Run the initialization script in MySQL Workbench or via CLI:
   ```powershell
   & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p < ..\database\init.sql
   ```
3. Update `backend/.env` with your local MySQL password:
   ```env
   DATABASE_URL=mysql+pymysql://root:YOUR_ACTUAL_PASSWORD@localhost:3306/employee_delegation_db
   ```

#### Option B: Automatic Dev Fallback
If MySQL credentials are not yet configured, the system automatically uses `SQLITE_FALLBACK=true` (storing development data in `backend/employee_delegation_dev.db`), ensuring immediate local testing without blockers.

### Step 3: Run Database Migrations

Apply Alembic migrations to generate and sync all tables:
```powershell
cd backend
.\.venv\Scripts\alembic.exe upgrade head
```

### Step 4: Seed Initial Data

Populate default corporate departments, initial users across all roles, projects, and sample delegation workflows:
```powershell
$env:PYTHONPATH="backend"
.\.venv\Scripts\python.exe -c "from app.db.session import SessionLocal; from app.db.seed import seed_database; db = SessionLocal(); seed_database(db); db.close()"
```

### Step 5: Start Backend API Server

```powershell
cd backend
$env:PYTHONPATH="."
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
Interactive API documentation will be available at:
- **Swagger UI:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc:** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## 6. Frontend Setup & Execution

Open a separate PowerShell terminal:
```powershell
# Navigate to frontend
cd frontend

# Install dependencies (already prepared)
npm install

# Start Vite development server
npm run dev
```
Open your browser at: **[http://localhost:5173](http://localhost:5173)**

---

## 7. Demo Accounts & Initial Access

The initial database seed provides the following accounts for immediate testing:

| Role | Email | Password | Purpose |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@company.com` | `AdminPassword@123` | System admin, creates/deactivates employees, company analytics |
| **Manager** | `manager@company.com` | `ManagerPassword@123` | Engineering Manager, assigns tasks, reviews deliverables |
| **Manager (UI/UX)** | `sarah.design@company.com` | `SarahPassword@123` | Design Lead, projects and department task monitoring |
| **Employee (Frontend)** | `alex.dev@company.com` | `AlexPassword@123` | Senior Frontend Dev, delegates to peers, submits work |
| **Employee (Backend)** | `david.backend@company.com` | `DavidPassword@123` | Senior Backend Dev, receives delegations, posts updates |
| **Employee (QA)** | `priya.qa@company.com` | `PriyaPassword@123` | QA Engineer, accepts task hand-offs |

> [!TIP]
> The login page includes convenient **1-click quick login buttons** for each role to facilitate pair-testing between assignees and delegators.

---

## 8. Running Automated Tests

Run the comprehensive pytest test suite covering authentication, permissions, task delegation, status transitions, and audit trail preservation:
```powershell
cd backend
$env:PYTHONPATH="."
.\.venv\Scripts\pytest.exe -v
```
All tests run against an isolated in-memory test database with 100% pass rate.
