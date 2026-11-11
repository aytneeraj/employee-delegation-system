from typing import Any, Dict
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user, require_roles
from app.models.user import User, UserRole
from app.services.report_service import ReportService

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])


@router.get("/dashboard", response_model=Dict[str, Any])
def get_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Return dynamic, role-tailored dashboard metrics and analytics based on actual database data.
    - Admin: Full company overview, workload, department metrics, system activities.
    - Manager: Team workload, delegated tasks under review, department tasks.
    - Employee: Personal assigned tasks, tasks delegated to others, deadlines, personal notifications.
    """
    if current_user.role == UserRole.ADMIN:
        data = ReportService.get_admin_dashboard(db)
        return {"role": "admin", "data": data.model_dump()}
    elif current_user.role == UserRole.MANAGER:
        data = ReportService.get_manager_dashboard(db, manager=current_user)
        return {"role": "manager", "data": data.model_dump()}
    else:
        data = ReportService.get_employee_dashboard(db, employee=current_user)
        return {"role": "employee", "data": data}


@router.get("/employees")
def get_employee_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER))
):
    """Admin/Manager report on employee workloads and completion rates."""
    admin_dash = ReportService.get_admin_dashboard(db)
    return {
        "workloads": admin_dash.employee_workloads,
        "department_distribution": admin_dash.department_distribution
    }


@router.get("/tasks")
def get_task_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER))
):
    """Overall task metrics by status and priority."""
    admin_dash = ReportService.get_admin_dashboard(db)
    return {
        "counts": admin_dash.counts,
        "priority_distribution": admin_dash.priority_distribution,
        "status_distribution": admin_dash.status_distribution
    }

