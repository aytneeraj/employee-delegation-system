# Database Design Specification

## 1. Relational ER Diagram

```
                 ┌──────────────────┐
                 │   departments    │
                 └────────┬─────────┘
                          │ 1
                          │
                          │ *
                 ┌────────┴─────────┐
       ┌─────────┤      users       ├────────┐
       │         └────────┬─────────┘        │
       │                  │                  │
       │ (delegates)      │ (assigns)        │ (reports to)
       │                  │                  │
       │ *                │ *                │ 1
┌──────┴──────────────────┴──────────────────┴──────┐
│                       tasks                       │
└──────┬──────────────────┬──────────────────┬──────┘
       │ 1                │ 1                │ 1
       │                  │                  │
       │ *                │ *                │ *
┌──────┴──────────┐┌──────┴───────────┐┌─────┴──────────┐
│ task_assignments││task_status_history│task_updates   │
└─────────────────┘└──────────────────┘└────────────────┘
```

---

## 2. Table Specifications

### `users`
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `employee_id`: VARCHAR(50) UNIQUE NOT NULL (Indexed)
- `full_name`: VARCHAR(150) NOT NULL
- `email`: VARCHAR(150) UNIQUE NOT NULL (Indexed)
- `hashed_password`: VARCHAR(255) NOT NULL
- `role`: ENUM('admin', 'manager', 'employee') NOT NULL
- `department_id`: INT NULL (FK -> departments.id)
- `designation`: VARCHAR(100) NOT NULL
- `manager_id`: INT NULL (FK -> users.id, reporting hierarchy)
- `is_active`: BOOLEAN DEFAULT TRUE (Indexed)
- `joining_date`: DATE NOT NULL
- `avatar_url`: VARCHAR(255) NULL
- `created_at`, `updated_at`: DATETIME

### `tasks`
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `task_code`: VARCHAR(50) UNIQUE NOT NULL (Indexed, e.g. TSK-1001)
- `title`: VARCHAR(255) NOT NULL (Indexed)
- `description`: LONGTEXT NOT NULL
- `project_id`: INT NULL (FK -> projects.id)
- `created_by_id`: INT NOT NULL (FK -> users.id)
- `current_assignee_id`: INT NOT NULL (FK -> users.id, Indexed)
- `delegated_by_id`: INT NOT NULL (FK -> users.id, Indexed)
- `priority`: ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium' (Indexed)
- `status`: ENUM('assigned', 'accepted', 'in_progress', 'under_review', 'revision_required', 'completed', 'cancelled') (Indexed)
- `start_date`: DATE NULL
- `due_date`: DATE NOT NULL (Indexed)
- `completed_at`: DATETIME NULL
- `created_at`, `updated_at`: DATETIME

### `task_assignments` (Immutable Delegation History)
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `task_id`: INT NOT NULL (FK -> tasks.id ON DELETE CASCADE)
- `from_user_id`: INT NOT NULL (FK -> users.id)
- `to_user_id`: INT NOT NULL (FK -> users.id)
- `reassignment_reason`: TEXT NULL
- `assigned_at`: DATETIME DEFAULT CURRENT_TIMESTAMP
- `is_current`: BOOLEAN DEFAULT TRUE (Indexed)

### `task_status_history`
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `task_id`: INT NOT NULL (FK -> tasks.id ON DELETE CASCADE)
- `changed_by_id`: INT NOT NULL (FK -> users.id)
- `from_status`: VARCHAR(30) NOT NULL
- `to_status`: VARCHAR(30) NOT NULL
- `comment`: TEXT NULL
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

### `task_updates`
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `task_id`: INT NOT NULL (FK -> tasks.id ON DELETE CASCADE)
- `user_id`: INT NOT NULL (FK -> users.id)
- `update_text`: TEXT NOT NULL
- `progress_percentage`: INT DEFAULT 0
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

### `task_comments`
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `task_id`: INT NOT NULL (FK -> tasks.id ON DELETE CASCADE)
- `user_id`: INT NOT NULL (FK -> users.id)
- `comment_text`: TEXT NOT NULL
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

### `notifications`
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `user_id`: INT NOT NULL (FK -> users.id ON DELETE CASCADE)
- `task_id`: INT NULL (FK -> tasks.id ON DELETE CASCADE)
- `title`: VARCHAR(200) NOT NULL
- `message`: TEXT NOT NULL
- `type`: VARCHAR(50) NOT NULL
- `is_read`: BOOLEAN DEFAULT FALSE (Indexed)
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP
