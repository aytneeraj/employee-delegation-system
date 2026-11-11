# Database Schema Notes

## Database: `employee_delegation_db` (MySQL 8.0+)
Default Character Set: `utf8mb4`  
Collation: `utf8mb4_unicode_ci`

---

## 1. Core Philosophy: Task Delegation Traceability
In this system, task delegation is not merely a replacement of the `assigned_to` field. It represents an immutable chain of custody and accountability.

1. **`tasks` Table**:
   - `created_by_id`: The employee or manager who originally created the task.
   - `current_assignee_id`: The current employee responsible for completing the task.
   - `delegated_by_id`: The person who handed off the task to the current assignee (either the creator or a subsequent delegator).
2. **`task_assignments` Table (Delegation History)**:
   - Every time a task is created or delegated, a record is written with `from_user_id`, `to_user_id`, `reassignment_reason`, and `assigned_at`.
   - `is_current` is set to `TRUE` for the latest assignment and `FALSE` for previous ones.
   - **No history is ever deleted or overwritten.**
3. **`task_status_history` Table**:
   - Captures status transitions: `from_status` -> `to_status`, `changed_by_id`, timestamp, and review/override comments.
   - Ensures full auditability for compliance and workflow reviews.
4. **`task_updates` & `task_comments`**:
   - Updates record explicit progress percentage (0-100%) and work summaries.
   - Comments allow threaded collaborative discussion between assignees, delegators, and managers.

---

## 2. Status Lifecycle State Machine
```
[Assigned] 
   │
   ▼ (Assignee accepts)
[Accepted]
   │
   ▼ (Work begins)
[In Progress]
   │
   ▼ (Assignee submits work)
[Under Review]
   │
   ├───────────► (Delegator requests changes) ──► [Revision Required]
   │                                                     │
   │                                                     ▼ (Assignee re-submits)
   │                                              [Under Review]
   │
   ▼ (Delegator/Manager approves)
[Completed]
```
*(Any authorized Manager/Admin can override or mark `Cancelled` if necessary).*

---

## 3. Delegation Constraints & Rules
- **No Self-Assignment**: An employee cannot delegate a task to themselves.
- **Active Employee Validation**: Both delegator and assignee must be active (`is_active = TRUE`).
- **Role Verification**:
  - `Admin`: Can assign to anyone.
  - `Manager`: Can assign to team members or peers.
  - `Employee`: Can delegate tasks assigned to them to another active employee with a documented reason.
- **Review Authority**: Only the delegator who assigned the task (or a manager/admin) can approve submission or request revisions.

