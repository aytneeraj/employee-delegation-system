# Architecture Overview

## Employee Task Delegation & Management System

### 1. High-Level System Architecture

```
┌────────────────────────────────────────────────────────┐
│                   React + Vite SPA                     │
│  (Tailwind CSS, React Router, Recharts, Lucide Icons)  │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTP / JSON REST APIs
                           ▼
┌────────────────────────────────────────────────────────┐
│                   FastAPI Backend                      │
│                                                        │
│  ┌───────────────┐ ┌────────────────┐ ┌──────────────┐ │
│  │  Auth Router  │ │  Tasks Router  │ │ Users Router │ │
│  └──────┬────────┘ └───────┬────────┘ └──────┬───────┘ │
│         │                  │                 │         │
│  ┌──────┴──────────────────┴─────────────────┴───────┐ │
│  │           Security & RBAC Middleware              │ │
│  │              (JWT + Role Checks)                  │ │
│  └─────────────────────────┬─────────────────────────┘ │
│                            │                           │
│  ┌─────────────────────────┴─────────────────────────┐ │
│  │                  Service Layer                    │ │
│  │     (Delegation Logic, State Transitions, Logs)   │ │
│  └─────────────────────────┬─────────────────────────┘ │
│                            │                           │
│  ┌─────────────────────────┴─────────────────────────┐ │
│  │         SQLAlchemy ORM + Pydantic Schemas         │ │
│  └─────────────────────────┬─────────────────────────┘ │
└────────────────────────────┼───────────────────────────┘
                             │ PyMySQL (MySQL 8)
                             ▼
┌────────────────────────────────────────────────────────┐
│                MySQL Database 8.0                      │
│            (`employee_delegation_db`)                  │
└────────────────────────────────────────────────────────┘
```

---

### 2. Multi-Tier Security Model
- **Authentication**: Stateless Bearer JWT tokens with HS256 signature and configurable expiry.
- **Authorization**: Granular backend RBAC (`Admin`, `Manager`, `Employee`) enforced at endpoint and service levels:
  - Role decorators: `@require_roles("admin")`, `@require_roles("admin", "manager")`.
  - Resource-level checks: Assignees and Delegators can view/update their respective tasks; only delegators/managers/admins can approve or reject reviews.
- **Data Protection**:
  - Salting and hashing with Bcrypt.
  - Parameterized queries via SQLAlchemy preventing SQL injection.
  - Pydantic models validating all payload structures and inputs.

---

### 3. Delegation Engine
When an employee delegates task $T$ to another employee:
1. Verify task is in an actionable status (`assigned`, `accepted`, `in_progress`, or `revision_required`).
2. Verify target employee is active and NOT the delegator themselves.
3. Archive current assignment record in `task_assignments` (`is_current = FALSE`).
4. Insert new assignment record with `from_user_id`, `to_user_id`, reason, and timestamp (`is_current = TRUE`).
5. Update `tasks` row: `current_assignee_id = new_assignee`, `delegated_by_id = current_user_id`, `status = 'assigned'`.
6. Record entry in `task_status_history`.
7. Dispatch in-app notification to the new assignee.

