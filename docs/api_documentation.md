# API Documentation

## Employee Task Delegation & Management System
**Base API Prefix:** `/api/v1`  
**Authentication Scheme:** Bearer JWT in `Authorization` header (`Authorization: Bearer <token>`)

---

## 1. Authentication Endpoints

### `POST /api/v1/auth/login`
Authenticates an employee and issues a JWT token.
- **Request Body:**
  ```json
  {
    "email": "alex.dev@company.com",
    "password": "AlexPassword@123"
  }
  ```
- **Response:** `200 OK`
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "user": {
      "id": 4,
      "employee_id": "EMP004",
      "full_name": "Alex Rivera",
      "email": "alex.dev@company.com",
      "role": "employee",
      "designation": "Senior Frontend Engineer"
    }
  }
  ```

### `GET /api/v1/auth/me`
Fetches the currently authenticated employee's full profile.

### `PUT /api/v1/auth/profile`
Updates current user's profile details (`full_name`, `avatar_url`).

### `POST /api/v1/auth/change-password`
Changes account password. Requires verification of `current_password`.

---

## 2. Employee Management Endpoints

### `GET /api/v1/users`
Lists employees. Supports filtering:
- Query parameters: `department_id`, `role`, `is_active`, `search`.

### `POST /api/v1/users` *(Admin Only)*
Registers a new company employee account.
- **Request Body:**
  ```json
  {
    "employee_id": "EMP010",
    "full_name": "Jessica Morgan",
    "email": "jessica@company.com",
    "password": "SecurePassword123",
    "role": "employee",
    "department_id": 1,
    "designation": "Frontend Developer",
    "manager_id": 2
  }
  ```

### `PATCH /api/v1/users/{id}/status` *(Admin Only)*
Activates or deactivates an employee account.

---

## 3. Tasks & Delegation Endpoints

### `POST /api/v1/tasks`
Creates a task and assigns it to an employee.
- **Rules:**
  - Admin, Manager, and Employee can create tasks.
  - Employees cannot assign tasks to themselves.
- **Request Body:**
  ```json
  {
    "title": "Build Webhook Integration",
    "description": "Develop retry logic and HMAC signing for outbound webhooks.",
    "current_assignee_id": 5,
    "project_id": 1,
    "priority": "high",
    "due_date": "2026-11-20"
  }
  ```

### `GET /api/v1/tasks/my-tasks`
Returns all tasks where `current_assignee_id` matches the current logged-in user.

### `GET /api/v1/tasks/delegated-by-me`
Returns all tasks where `delegated_by_id` matches the current logged-in user and `current_assignee_id != current_user.id`.

### `GET /api/v1/tasks/{id}`
Returns complete task information, including:
- Stakeholder cards (`created_by`, `delegated_by`, `current_assignee`).
- Full immutable delegation chain (`assignments`).
- Full state transition audit history (`status_history`).
- Progress reports (`updates`).
- Collaborative comments (`comments`).

### `POST /api/v1/tasks/{id}/delegate` *(Controlled Reassignment)*
Reassigns an active task to another employee.
- **Rules:**
  - Can only be invoked by current assignee, manager, or admin.
  - Previous assignment is flagged as `is_current: false` (never overwritten).
  - New assignment record created with `reassignment_reason`.
  - Task status resets to `assigned`.
- **Request Body:**
  ```json
  {
    "to_user_id": 6,
    "reassignment_reason": "Delegating QA integration testing to specialist."
  }
  ```

### `PATCH /api/v1/tasks/{id}/status` *(Workflow Transition)*
Moves a task through the enforced state machine:
- `assigned` -> `accepted` (by Assignee)
- `accepted` -> `in_progress` (by Assignee)
- `in_progress` -> `under_review` (by Assignee)
- `under_review` -> `completed` (Approval by Delegator / Manager / Admin)
- `under_review` -> `revision_required` (Feedback by Delegator / Manager / Admin)

---

## 4. Updates & Comments Endpoints

### `POST /api/v1/tasks/{id}/updates`
Posts a progress update with milestone completion percentage (`0-100`).

### `POST /api/v1/tasks/{id}/comments`
Adds a collaborative comment to the task discussion.

---

## 5. Notifications Endpoints

### `GET /api/v1/notifications`
Retrieves in-app notifications and unread counter for current user.

### `PATCH /api/v1/notifications/{id}/read`
Marks single notification as read.

### `POST /api/v1/notifications/read-all`
Marks all notifications for current user as read.

---

## 6. Reports & Analytics Endpoints

### `GET /api/v1/reports/dashboard`
Returns tailored analytics based on authenticated user's role (Admin, Manager, or Employee).

### `GET /api/v1/reports/employees`
Returns employee workload and throughput matrix.

### `GET /api/v1/reports/tasks`
Returns task distributions by priority and status.

