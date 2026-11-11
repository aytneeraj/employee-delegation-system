import logging
from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.department import Department
from app.models.user import User, UserRole
from app.models.project import Project, ProjectStatus
from app.models.task import Task, TaskPriority, TaskStatus
from app.models.task_assignment import TaskAssignment
from app.models.task_status_history import TaskStatusHistory
from app.models.task_update import TaskUpdate
from app.models.task_comment import TaskComment
from app.models.notification import Notification

logger = logging.getLogger(__name__)


DEMO_USERS_SPEC = [
    {
        "employee_id": "EMP001",
        "full_name": "Alexander Hayes (Admin)",
        "email": "admin@company.com",
        "role": UserRole.ADMIN,
        "department_code": "PM-CORP",
        "designation": "System Administrator",
        "manager_id": None,
    },
    {
        "employee_id": "EMP002",
        "full_name": "Marcus Vance",
        "email": "manager@company.com",
        "role": UserRole.MANAGER,
        "department_code": "DEV-BE",
        "designation": "Engineering Manager",
        "manager_id": 1,
    },
    {
        "employee_id": "EMP003",
        "full_name": "Sarah Jenkins",
        "email": "sarah.design@company.com",
        "role": UserRole.MANAGER,
        "department_code": "DES-UI",
        "designation": "Lead UI/UX Designer",
        "manager_id": 1,
    },
    {
        "employee_id": "EMP004",
        "full_name": "Alex Rivera",
        "email": "alex.dev@company.com",
        "role": UserRole.EMPLOYEE,
        "department_code": "DEV-FE",
        "designation": "Senior Frontend Engineer",
        "manager_id": 2,
    },
    {
        "employee_id": "EMP005",
        "full_name": "David Chen",
        "email": "david.backend@company.com",
        "role": UserRole.EMPLOYEE,
        "department_code": "DEV-BE",
        "designation": "Senior Backend Engineer",
        "manager_id": 2,
    },
    {
        "employee_id": "EMP006",
        "full_name": "Priya Sharma",
        "email": "priya.qa@company.com",
        "role": UserRole.EMPLOYEE,
        "department_code": "QA-TEST",
        "designation": "QA Automation Engineer",
        "manager_id": 2,
    },
    {
        "employee_id": "EMP007",
        "full_name": "Elena Rostova",
        "email": "elena.ai@company.com",
        "role": UserRole.EMPLOYEE,
        "department_code": "DEV-AI",
        "designation": "AI/ML Engineer",
        "manager_id": 2,
    },
]


def sync_demo_accounts(db: Session):
    """
    Idempotent synchronization of development demo accounts.
    Ensures standard demo accounts exist, have active status, and use
    the bcrypt hash corresponding to settings.DEMO_ACCOUNT_PASSWORD.
    Preserves all existing task assignments, comments, and project associations.
    """
    logger.info("[Database] Synchronizing demo accounts with configured DEMO_ACCOUNT_PASSWORD...")
    demo_hashed_pwd = get_password_hash(settings.DEMO_ACCOUNT_PASSWORD)
    synced_count = 0

    dept_cache = {d.code: d.id for d in db.query(Department).all()}

    for spec in DEMO_USERS_SPEC:
        email = spec["email"].lower()
        user = db.query(User).filter(func.lower(User.email) == email).first()
        dept_id = dept_cache.get(spec["department_code"])

        if user:
            user.hashed_password = demo_hashed_pwd
            user.is_active = True
            if not user.designation:
                user.designation = spec["designation"]
            if not user.department_id and dept_id:
                user.department_id = dept_id
            synced_count += 1
        else:
            new_user = User(
                employee_id=spec["employee_id"],
                full_name=spec["full_name"],
                email=spec["email"],
                hashed_password=demo_hashed_pwd,
                role=spec["role"],
                department_id=dept_id,
                designation=spec["designation"],
                manager_id=spec["manager_id"],
                is_active=True,
                joining_date=date.today() - timedelta(days=180),
            )
            db.add(new_user)
            synced_count += 1

    db.commit()
    logger.info(f"[Database] Successfully synchronized {synced_count} demo accounts.")


def seed_database(db: Session):
    """Seed initial company departments, users, projects, and sample delegation workflows."""
    # Check if already seeded
    if db.query(User).first():
        logger.info("[Database] Database already has users. Skipping full seed.")
        return

    logger.info("[Database] Seeding initial data...")

    # 1. Departments
    departments_data = [
        {"name": "Frontend Development", "code": "DEV-FE", "description": "Client applications, web and mobile frontends"},
        {"name": "Backend Development", "code": "DEV-BE", "description": "Core APIs, microservices and data pipelines"},
        {"name": "AI/ML Development", "code": "DEV-AI", "description": "Machine learning models and intelligent workflows"},
        {"name": "DevOps & Infrastructure", "code": "DEV-OPS", "description": "Cloud hosting, CI/CD and system security"},
        {"name": "UI/UX Design", "code": "DES-UI", "description": "Product design, user research and design systems"},
        {"name": "Quality Assurance", "code": "QA-TEST", "description": "Manual testing, test automation and QA"},
        {"name": "Project Management", "code": "PM-CORP", "description": "Agile project delivery and sprint management"},
    ]
    dept_map = {}
    for d in departments_data:
        dept = Department(name=d["name"], code=d["code"], description=d["description"])
        db.add(dept)
        db.flush()
        dept_map[d["code"]] = dept

    # 2. Users with unified DEMO_ACCOUNT_PASSWORD
    default_hash = get_password_hash(settings.DEMO_ACCOUNT_PASSWORD)
    user_objs = {}
    for u in DEMO_USERS_SPEC:
        dept = dept_map.get(u["department_code"])
        user = User(
            employee_id=u["employee_id"],
            full_name=u["full_name"],
            email=u["email"],
            hashed_password=default_hash,
            role=u["role"],
            department_id=dept.id if dept else None,
            designation=u["designation"],
            manager_id=u["manager_id"],
            is_active=True,
            joining_date=date.today() - timedelta(days=180),
        )
        db.add(user)
        db.flush()
        user_objs[u["email"]] = user

    # 3. Projects
    projects_data = [
        {
            "name": "Enterprise Cloud Portal 2.0",
            "code": "PRJ-CLOUD",
            "description": "Next-generation customer self-service cloud infrastructure portal.",
            "manager_email": "manager@company.com",
            "status": ProjectStatus.ACTIVE,
            "start_date": date.today() - timedelta(days=60),
            "end_date": date.today() + timedelta(days=90),
        },
        {
            "name": "AI Intelligent Assistant Integration",
            "code": "PRJ-AICOP",
            "description": "Enterprise contextual retrieval and automated assistant service.",
            "manager_email": "manager@company.com",
            "status": ProjectStatus.ACTIVE,
            "start_date": date.today() - timedelta(days=30),
            "end_date": date.today() + timedelta(days=120),
        },
        {
            "name": "Mobile Design System Overhaul",
            "code": "PRJ-DES",
            "description": "Unified React and mobile design tokens, components and accessibility specs.",
            "manager_email": "sarah.design@company.com",
            "status": ProjectStatus.ACTIVE,
            "start_date": date.today() - timedelta(days=45),
            "end_date": date.today() + timedelta(days=45),
        },
    ]

    project_objs = {}
    for p in projects_data:
        mgr = user_objs.get(p["manager_email"])
        proj = Project(
            name=p["name"],
            code=p["code"],
            description=p["description"],
            manager_id=mgr.id if mgr else None,
            status=p["status"],
            start_date=p["start_date"],
            end_date=p["end_date"],
        )
        db.add(proj)
        db.flush()
        project_objs[p["code"]] = proj

    # 4. Realistic Tasks showcasing the delegation system
    # Task 1: Manager -> Alex (In Progress)
    t1 = Task(
        task_code="TSK-1001",
        title="Develop Authentication & Role-Based Navigation UI",
        description="Build responsive sidebar and header with role switching, user avatar dropdown, and unread notification counter badge.",
        project_id=project_objs["PRJ-CLOUD"].id,
        created_by_id=user_objs["manager@company.com"].id,
        current_assignee_id=user_objs["alex.dev@company.com"].id,
        delegated_by_id=user_objs["manager@company.com"].id,
        priority=TaskPriority.HIGH,
        status=TaskStatus.IN_PROGRESS,
        start_date=date.today() - timedelta(days=5),
        due_date=date.today() + timedelta(days=3),
    )
    db.add(t1)
    db.flush()

    a1 = TaskAssignment(
        task_id=t1.id,
        from_user_id=user_objs["manager@company.com"].id,
        to_user_id=user_objs["alex.dev@company.com"].id,
        reassignment_reason="Assigned to lead frontend engineer for UI scaffolding.",
        is_current=True,
        assigned_at=datetime.utcnow() - timedelta(days=5)
    )
    db.add(a1)
    db.add(TaskStatusHistory(
        task_id=t1.id,
        changed_by_id=user_objs["manager@company.com"].id,
        from_status="none",
        to_status="assigned",
        comment="Task created and assigned."
    ))
    db.add(TaskStatusHistory(
        task_id=t1.id,
        changed_by_id=user_objs["alex.dev@company.com"].id,
        from_status="assigned",
        to_status="accepted",
        comment="Accepted the assignment and reviewed technical requirements."
    ))
    db.add(TaskStatusHistory(
        task_id=t1.id,
        changed_by_id=user_objs["alex.dev@company.com"].id,
        from_status="accepted",
        to_status="in_progress",
        comment="Started frontend layout components development."
    ))
    db.add(TaskUpdate(
        task_id=t1.id,
        user_id=user_objs["alex.dev@company.com"].id,
        update_text="Completed sidebar navigation and responsive hamburger drawer. Connecting notification API.",
        progress_percentage=65
    ))

    # Task 2: Employee -> Employee Delegation (Alex -> David) (Under Review)
    # Demonstrating the core requirement: Employee delegating to another employee with complete history!
    t2 = Task(
        task_code="TSK-1002",
        title="Implement Secure JWT Refresh Flow & Session Middleware",
        description="Alex delegated backend session management and refresh token endpoints to David Chen for specialized PyMySQL and JWT middleware handling.",
        project_id=project_objs["PRJ-CLOUD"].id,
        created_by_id=user_objs["alex.dev@company.com"].id,
        current_assignee_id=user_objs["david.backend@company.com"].id,
        delegated_by_id=user_objs["alex.dev@company.com"].id,
        priority=TaskPriority.URGENT,
        status=TaskStatus.UNDER_REVIEW,
        start_date=date.today() - timedelta(days=4),
        due_date=date.today() + timedelta(days=2),
    )
    db.add(t2)
    db.flush()

    # Initial assignment: Alex was working on it
    a2_old = TaskAssignment(
        task_id=t2.id,
        from_user_id=user_objs["manager@company.com"].id,
        to_user_id=user_objs["alex.dev@company.com"].id,
        reassignment_reason="Initial assignment for full-stack auth implementation.",
        is_current=False,
        assigned_at=datetime.utcnow() - timedelta(days=4)
    )
    db.add(a2_old)
    # Reassignment: Alex delegates to David
    a2_curr = TaskAssignment(
        task_id=t2.id,
        from_user_id=user_objs["alex.dev@company.com"].id,
        to_user_id=user_objs["david.backend@company.com"].id,
        reassignment_reason="Delegating backend JWT refresh logic to David to handle database session validation.",
        is_current=True,
        assigned_at=datetime.utcnow() - timedelta(days=2)
    )
    db.add(a2_curr)
    db.add(TaskStatusHistory(
        task_id=t2.id,
        changed_by_id=user_objs["alex.dev@company.com"].id,
        from_status="in_progress",
        to_status="assigned",
        comment="Delegated to David Chen for backend security review."
    ))
    db.add(TaskStatusHistory(
        task_id=t2.id,
        changed_by_id=user_objs["david.backend@company.com"].id,
        from_status="assigned",
        to_status="accepted",
        comment="Accepted delegation from Alex."
    ))
    db.add(TaskStatusHistory(
        task_id=t2.id,
        changed_by_id=user_objs["david.backend@company.com"].id,
        from_status="accepted",
        to_status="in_progress",
        comment="Implemented backend token hashing and test cases."
    ))
    db.add(TaskStatusHistory(
        task_id=t2.id,
        changed_by_id=user_objs["david.backend@company.com"].id,
        from_status="in_progress",
        to_status="under_review",
        comment="Code completed with unit tests. Submitted to Alex Rivera for delegation review."
    ))
    db.add(TaskUpdate(
        task_id=t2.id,
        user_id=user_objs["david.backend@company.com"].id,
        update_text="JWT refresh token rotation implemented and tested against SQLite and MySQL.",
        progress_percentage=95
    ))
    db.add(TaskComment(
        task_id=t2.id,
        user_id=user_objs["david.backend@company.com"].id,
        comment_text="Ready for your review, Alex! Added full test coverage in test_auth.py."
    ))

    # Task 3: Overdue Task
    t3 = Task(
        task_code="TSK-1003",
        title="Legacy PyMySQL Connection Pool Profiling",
        description="Profile connection pool latency under high concurrent queries in MySQL 8.0.",
        project_id=project_objs["PRJ-CLOUD"].id,
        created_by_id=user_objs["manager@company.com"].id,
        current_assignee_id=user_objs["david.backend@company.com"].id,
        delegated_by_id=user_objs["manager@company.com"].id,
        priority=TaskPriority.HIGH,
        status=TaskStatus.IN_PROGRESS,
        start_date=date.today() - timedelta(days=10),
        due_date=date.today() - timedelta(days=2),  # Past due date!
    )
    db.add(t3)
    db.flush()
    db.add(TaskAssignment(
        task_id=t3.id,
        from_user_id=user_objs["manager@company.com"].id,
        to_user_id=user_objs["david.backend@company.com"].id,
        reassignment_reason="Performance profiling requirement.",
        is_current=True,
        assigned_at=datetime.utcnow() - timedelta(days=10)
    ))
    db.add(TaskStatusHistory(
        task_id=t3.id,
        changed_by_id=user_objs["david.backend@company.com"].id,
        from_status="accepted",
        to_status="in_progress",
        comment="Work is continuing on bench testing."
    ))

    # Task 4: Completed Task (Full review and approval workflow)
    t4 = Task(
        task_code="TSK-1004",
        title="Design System Color Palette & Dark Mode Tokens",
        description="Create comprehensive Tailwind CSS token specifications and accessibility contrast matrix.",
        project_id=project_objs["PRJ-DES"].id,
        created_by_id=user_objs["admin@company.com"].id,
        current_assignee_id=user_objs["sarah.design@company.com"].id,
        delegated_by_id=user_objs["admin@company.com"].id,
        priority=TaskPriority.MEDIUM,
        status=TaskStatus.COMPLETED,
        start_date=date.today() - timedelta(days=14),
        due_date=date.today() - timedelta(days=4),
        completed_at=datetime.utcnow() - timedelta(days=4)
    )
    db.add(t4)
    db.flush()
    db.add(TaskAssignment(
        task_id=t4.id,
        from_user_id=user_objs["admin@company.com"].id,
        to_user_id=user_objs["sarah.design@company.com"].id,
        reassignment_reason="Assigned to Lead Designer.",
        is_current=True,
        assigned_at=datetime.utcnow() - timedelta(days=14)
    ))
    db.add(TaskStatusHistory(
        task_id=t4.id,
        changed_by_id=user_objs["sarah.design@company.com"].id,
        from_status="in_progress",
        to_status="under_review",
        comment="Figma design tokens exported and integrated into Tailwind config."
    ))
    db.add(TaskStatusHistory(
        task_id=t4.id,
        changed_by_id=user_objs["admin@company.com"].id,
        from_status="under_review",
        to_status="completed",
        comment="Approved design system color tokens. Great work!"
    ))

    # Notifications
    db.add(Notification(
        user_id=user_objs["alex.dev@company.com"].id,
        task_id=t1.id,
        title="Task Assigned to You",
        message="Marcus Vance assigned you [TSK-1001] Develop Authentication & Role-Based Navigation UI",
        type="task_assigned",
        is_read=False
    ))
    db.add(Notification(
        user_id=user_objs["alex.dev@company.com"].id,
        task_id=t2.id,
        title="Task Submitted for Review",
        message="David Chen submitted task [TSK-1002] for your review.",
        type="review_submitted",
        is_read=False
    ))
    db.add(Notification(
        user_id=user_objs["david.backend@company.com"].id,
        task_id=t2.id,
        title="Task Delegated to You",
        message="Alex Rivera delegated [TSK-1002] to you.",
        type="task_delegated",
        is_read=True
    ))

    db.commit()
    logger.info("[Database] Seeding complete! Initial administrator, managers, employees, and sample workflows loaded.")


if __name__ == "__main__":
    from app.db.session import SessionLocal
    logging.basicConfig(level=logging.INFO)
    db = SessionLocal()
    try:
        seed_database(db)
        sync_demo_accounts(db)
    finally:
        db.close()


