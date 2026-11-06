from datetime import date, datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_
from app.models.task import Task, TaskStatus, TaskPriority
from app.models.task_status_history import TaskStatusHistory
from app.models.task_assignment import TaskAssignment
from app.models.user import User, UserRole
from app.models.department import Department
from app.models.project import Project
from app.schemas.report import (
    AdminDashboardResponse,
    ManagerDashboardResponse,
    EmployeeDashboardResponse,
    DashboardCounts,
    PriorityDistributionItem,
    StatusDistributionItem,
    DepartmentDistributionItem,
    EmployeeWorkloadItem,
    RecentActivityItem,
)
from app.schemas.user import UserBrief


class ReportService:
    @staticmethod
    def get_admin_dashboard(db: Session) -> AdminDashboardResponse:
        today = date.today()
        
        # User counts
        total_employees = db.query(User).filter(User.is_active == True).count()
        total_projects = db.query(Project).count()
        total_tasks = db.query(Task).count()

        # Status counts
        assigned_count = db.query(Task).filter(Task.status == TaskStatus.ASSIGNED).count()
        accepted_count = db.query(Task).filter(Task.status == TaskStatus.ACCEPTED).count()
        in_progress_count = db.query(Task).filter(Task.status == TaskStatus.IN_PROGRESS).count()
        under_review_count = db.query(Task).filter(Task.status == TaskStatus.UNDER_REVIEW).count()
        revision_required_count = db.query(Task).filter(Task.status == TaskStatus.REVISION_REQUIRED).count()
        completed_count = db.query(Task).filter(Task.status == TaskStatus.COMPLETED).count()
        
        # Overdue tasks
        overdue_count = db.query(Task).filter(
            Task.due_date < today,
            Task.status.notin_([TaskStatus.COMPLETED, TaskStatus.CANCELLED])
        ).count()

        counts = DashboardCounts(
            total_employees=total_employees,
            total_projects=total_projects,
            total_tasks=total_tasks,
            assigned_tasks=assigned_count,
            accepted_tasks=accepted_count,
            in_progress_tasks=in_progress_count,
            under_review_tasks=under_review_count,
            revision_required_tasks=revision_required_count,
            completed_tasks=completed_count,
            overdue_tasks=overdue_count,
        )

        # Priority distribution
        priority_rows = db.query(Task.priority, func.count(Task.id)).group_by(Task.priority).all()
        priority_dist = [
            PriorityDistributionItem(priority=p.value if hasattr(p, "value") else str(p), count=c)
            for p, c in priority_rows
        ]

        # Status distribution
        status_rows = db.query(Task.status, func.count(Task.id)).group_by(Task.status).all()
        status_dist = [
            StatusDistributionItem(status=s.value if hasattr(s, "value") else str(s), count=c)
            for s, c in status_rows
        ]

        # Department distribution
        dept_rows = db.query(Department).all()
        dept_dist = []
        for d in dept_rows:
            emp_ids = [u.id for u in d.users]
            t_count = db.query(Task).filter(Task.current_assignee_id.in_(emp_ids)).count() if emp_ids else 0
            dept_dist.append(
                DepartmentDistributionItem(
                    department_name=d.name,
                    task_count=t_count,
                    employee_count=len(emp_ids)
                )
            )

        # Employee workloads (top active employees)
        active_users = db.query(User).filter(User.is_active == True).limit(10).all()
        workloads = []
        for u in active_users:
            active_t = db.query(Task).filter(
                Task.current_assignee_id == u.id,
                Task.status.notin_([TaskStatus.COMPLETED, TaskStatus.CANCELLED])
            ).count()
            comp_t = db.query(Task).filter(
                Task.current_assignee_id == u.id,
                Task.status == TaskStatus.COMPLETED
            ).count()
            over_t = db.query(Task).filter(
                Task.current_assignee_id == u.id,
                Task.due_date < today,
                Task.status.notin_([TaskStatus.COMPLETED, TaskStatus.CANCELLED])
            ).count()
            workloads.append(
                EmployeeWorkloadItem(
                    user=UserBrief.model_validate(u),
                    active_tasks=active_t,
                    completed_tasks=comp_t,
                    overdue_tasks=over_t
                )
            )

        # Recent activities from TaskStatusHistory
        recent_hist = (
            db.query(TaskStatusHistory)
            .order_by(TaskStatusHistory.created_at.desc())
            .limit(10)
            .all()
        )
        recent_activities = []
        for h in recent_hist:
            user_name = h.changed_by.full_name if h.changed_by else "System"
            task_title = h.task.title if h.task else "Task"
            recent_activities.append(
                RecentActivityItem(
                    id=h.id,
                    type="status_change",
                    task_id=h.task_id,
                    task_title=task_title,
                    user_name=user_name,
                    description=h.comment or f"Status changed to {h.to_status}",
                    timestamp=h.created_at.isoformat()
                )
            )

        return AdminDashboardResponse(
            counts=counts,
            priority_distribution=priority_dist,
            status_distribution=status_dist,
            department_distribution=dept_dist,
            employee_workloads=workloads,
            recent_activities=recent_activities,
        )

    @staticmethod
    def get_manager_dashboard(db: Session, manager: User) -> ManagerDashboardResponse:
        today = date.today()

        # Tasks created or delegated by this manager
        my_delegated_count = db.query(Task).filter(Task.delegated_by_id == manager.id).count()
        under_review_count = db.query(Task).filter(
            Task.delegated_by_id == manager.id,
            Task.status == TaskStatus.UNDER_REVIEW
        ).count()

        # Overall company task metrics
        total_tasks = db.query(Task).count()
        in_progress_count = db.query(Task).filter(Task.status == TaskStatus.IN_PROGRESS).count()
        completed_count = db.query(Task).filter(Task.status == TaskStatus.COMPLETED).count()
        overdue_count = db.query(Task).filter(
            Task.due_date < today,
            Task.status.notin_([TaskStatus.COMPLETED, TaskStatus.CANCELLED])
        ).count()

        counts = DashboardCounts(
            total_tasks=total_tasks,
            in_progress_tasks=in_progress_count,
            under_review_tasks=under_review_count,
            completed_tasks=completed_count,
            overdue_tasks=overdue_count,
        )

        # Department or team members workload
        team_members = db.query(User).filter(
            User.is_active == True,
            or_(User.department_id == manager.department_id, User.manager_id == manager.id)
        ).limit(10).all()
        if not team_members:
            team_members = db.query(User).filter(User.is_active == True).limit(8).all()

        team_workloads = []
        for u in team_members:
            active_t = db.query(Task).filter(
                Task.current_assignee_id == u.id,
                Task.status.notin_([TaskStatus.COMPLETED, TaskStatus.CANCELLED])
            ).count()
            comp_t = db.query(Task).filter(
                Task.current_assignee_id == u.id,
                Task.status == TaskStatus.COMPLETED
            ).count()
            over_t = db.query(Task).filter(
                Task.current_assignee_id == u.id,
                Task.due_date < today,
                Task.status.notin_([TaskStatus.COMPLETED, TaskStatus.CANCELLED])
            ).count()
            team_workloads.append(
                EmployeeWorkloadItem(
                    user=UserBrief.model_validate(u),
                    active_tasks=active_t,
                    completed_tasks=comp_t,
                    overdue_tasks=over_t
                )
            )

        # Priority distribution of delegated tasks
        priority_rows = (
            db.query(Task.priority, func.count(Task.id))
            .filter(Task.delegated_by_id == manager.id)
            .group_by(Task.priority)
            .all()
        )
        priority_dist = [
            PriorityDistributionItem(priority=p.value if hasattr(p, "value") else str(p), count=c)
            for p, c in priority_rows
        ]

        # Recent activities related to manager's tasks
        recent_hist = (
            db.query(TaskStatusHistory)
            .join(Task)
            .filter(or_(Task.delegated_by_id == manager.id, Task.created_by_id == manager.id))
            .order_by(TaskStatusHistory.created_at.desc())
            .limit(10)
            .all()
        )
        recent_activities = []
        for h in recent_hist:
            user_name = h.changed_by.full_name if h.changed_by else "System"
            task_title = h.task.title if h.task else "Task"
            recent_activities.append(
                RecentActivityItem(
                    id=h.id,
                    type="status_change",
                    task_id=h.task_id,
                    task_title=task_title,
                    user_name=user_name,
                    description=h.comment or f"Status changed to {h.to_status}",
                    timestamp=h.created_at.isoformat()
                )
            )

        return ManagerDashboardResponse(
            counts=counts,
            my_delegated_count=my_delegated_count,
            under_review_count=under_review_count,
            team_workloads=team_workloads,
            priority_distribution=priority_dist,
            recent_activities=recent_activities,
        )

    @staticmethod
    def get_employee_dashboard(db: Session, employee: User) -> Dict[str, Any]:
        today = date.today()

        assigned_to_me = db.query(Task).filter(Task.current_assignee_id == employee.id).count()
        delegated_by_me = db.query(Task).filter(
            Task.delegated_by_id == employee.id,
            Task.current_assignee_id != employee.id
        ).count()
        in_progress = db.query(Task).filter(
            Task.current_assignee_id == employee.id,
            Task.status == TaskStatus.IN_PROGRESS
        ).count()
        under_review = db.query(Task).filter(
            Task.current_assignee_id == employee.id,
            Task.status == TaskStatus.UNDER_REVIEW
        ).count()
        completed = db.query(Task).filter(
            Task.current_assignee_id == employee.id,
            Task.status == TaskStatus.COMPLETED
        ).count()
        overdue = db.query(Task).filter(
            Task.current_assignee_id == employee.id,
            Task.due_date < today,
            Task.status.notin_([TaskStatus.COMPLETED, TaskStatus.CANCELLED])
        ).count()

        # Upcoming deadlines (active tasks sorted by due_date ascending)
        upcoming_tasks = (
            db.query(Task)
            .filter(
                Task.current_assignee_id == employee.id,
                Task.status.notin_([TaskStatus.COMPLETED, TaskStatus.CANCELLED])
            )
            .order_by(Task.due_date.asc())
            .limit(5)
            .all()
        )

        # Recent assigned tasks
        recent_assigned = (
            db.query(Task)
            .filter(Task.current_assignee_id == employee.id)
            .order_by(Task.created_at.desc())
            .limit(5)
            .all()
        )

        return {
            "assigned_to_me_count": assigned_to_me,
            "delegated_by_me_count": delegated_by_me,
            "in_progress_count": in_progress,
            "under_review_count": under_review,
            "completed_count": completed,
            "overdue_count": overdue,
            "recent_assigned_tasks": [
                {
                    "id": t.id,
                    "task_code": t.task_code,
                    "title": t.title,
                    "status": t.status.value,
                    "priority": t.priority.value,
                    "due_date": t.due_date.isoformat(),
                    "delegated_by": t.delegated_by.full_name if t.delegated_by else "Unknown",
                }
                for t in recent_assigned
            ],
            "upcoming_deadlines": [
                {
                    "id": t.id,
                    "task_code": t.task_code,
                    "title": t.title,
                    "status": t.status.value,
                    "priority": t.priority.value,
                    "due_date": t.due_date.isoformat(),
                    "is_overdue": t.due_date < today,
                }
                for t in upcoming_tasks
            ],
        }
