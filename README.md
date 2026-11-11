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

## 4. Local Execution & Terminal Guide (Windows PowerShell)

> [!IMPORTANT]
> **Terminal Directory Awareness:**
> Pay close attention to your current working directory in PowerShell. Do **not** run `cd backend` if your terminal prompt is already inside `backend`.
> - Check your prompt path with `pwd` or `(Get-Location).Path`.
> - If you are at `c:\...\employee-delegation-system`, navigate using `cd backend`.
> - If you are already at `c:\...\employee-delegation-system\backend`, stay in place and execute the commands directly.

---

## 5. Local Setup Instructions

### Terminal 1: Backend Server (FastAPI & MySQL)

#### Option 1: From the Project Root (`employee-delegation-system/`)
```powershell
# 1. Activate existing virtual environment
.\backend\.venv\Scripts\Activate.ps1

# 2. Set PYTHONPATH to backend directory
$env:PYTHONPATH="backend"

# 3. (Optional) Run Alembic migrations
.\backend\.venv\Scripts\alembic.exe -c backend/alembic.ini upgrade head

# 4. (Optional) Synchronize/Seed demo accounts with DEMO_ACCOUNT_PASSWORD
.\backend\.venv\Scripts\python.exe -m app.db.seed

# 5. Start the FastAPI development server with hot reload
.\backend\.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
```

#### Option 2: From the Backend Directory (`employee-delegation-system\backend/`)
```powershell
# 1. Ensure you are inside the backend folder
cd backend  # Run only if currently at project root!

# 2. Activate virtual environment
.\.venv\Scripts\Activate.ps1

# 3. (Optional) Run Alembic migrations
.\.venv\Scripts\alembic.exe upgrade head

# 4. (Optional) Synchronize/Seed demo accounts with DEMO_ACCOUNT_PASSWORD
.\.venv\Scripts\python.exe -m app.db.seed

# 5. Start the FastAPI development server with hot reload
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Interactive API documentation and endpoints:
- **Root Service Info:** [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- **Swagger UI:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc:** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- **Health Check:** [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

---

### Terminal 2: Frontend Client (React & Vite)

#### From the Project Root (`employee-delegation-system/`)
```powershell
# Navigate to frontend (only if at project root)
cd frontend

# Start Vite development server
npm run dev
```

The frontend application will be live at: **[http://localhost:5173](http://localhost:5173)**.  
Requests to `/api/*` are automatically proxied to the backend at `http://127.0.0.1:8000`.

---

## 6. Database Configuration (MySQL 8.0)

The backend connects directly to MySQL 8.0 running locally on port 3306.

1. Ensure the Windows MySQL service is active:
   ```powershell
   Get-Service MySQL80
   ```
2. Configuration in `backend/.env`:
   ```env
   DATABASE_URL=mysql+pymysql://root:YOUR_PASSWORD@localhost:3306/employee_delegation_db
   SQLITE_FALLBACK=false
   DEMO_ACCOUNT_PASSWORD=Password@123
   ```
3. To verify the live MySQL connection:
   ```powershell
   $env:PYTHONPATH="backend"
   .\backend\.venv\Scripts\python.exe -c "from app.db.session import engine; from sqlalchemy import text; conn = engine.connect(); print(conn.execute(text('SELECT VERSION(), DATABASE();')).fetchall()); conn.close()"
   ```

---

## 7. Development Demo Accounts

All demo accounts use the unified development password configured via `DEMO_ACCOUNT_PASSWORD` in `backend/.env`:  
**Default Password:** `Password@123`

| Role | Email | Password | Designation / Department |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@company.com` | `Password@123` | System Administrator / Project Management |
| **Manager** | `manager@company.com` | `Password@123` | Engineering Manager / Backend Development |
| **Manager** | `sarah.design@company.com` | `Password@123` | Lead UI/UX Designer / UI/UX Design |
| **Employee** | `alex.dev@company.com` | `Password@123` | Senior Frontend Engineer / Frontend Development |
| **Employee** | `david.backend@company.com` | `Password@123` | Senior Backend Engineer / Backend Development |
| **Employee** | `priya.qa@company.com` | `Password@123` | QA Automation Engineer / Quality Assurance |
| **Employee** | `elena.ai@company.com` | `Password@123` | AI/ML Engineer / AI/ML Development |

> [!TIP]
> The login page at `http://localhost:5173/login` includes quick-prefill buttons for Admin, Manager, Frontend Dev, and Backend Dev roles. Clicking a role automatically loads its email address, ready for sign-in with `Password@123`.

---

## 8. Running Automated Tests

Run the complete test suite (20 tests covering authentication, JSON and OAuth2 login, state machine transitions, delegation history, and RBAC):

#### From Project Root:
```powershell
$env:PYTHONPATH="backend"
.\backend\.venv\Scripts\pytest.exe -v
```

#### From `backend/` directory:
```powershell
$env:PYTHONPATH="."
.\.venv\Scripts\pytest.exe -v
```

# employee-delegation-system
