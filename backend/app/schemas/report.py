from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.schemas.user import UserBrief


class DashboardCounts(BaseModel):
    total_employees: int = 0
    total_projects: int = 0
    total_tasks: int = 0
    assigned_tasks: int = 0
    accepted_tasks: int = 0
    in_progress_tasks: int = 0
    under_review_tasks: int = 0
    revision_required_tasks: int = 0
    completed_tasks: int = 0
    overdue_tasks: int = 0


class PriorityDistributionItem(BaseModel):
    priority: str
    count: int


class StatusDistributionItem(BaseModel):
    status: str
    count: int


class DepartmentDistributionItem(BaseModel):
    department_name: str
    task_count: int
    employee_count: int


class EmployeeWorkloadItem(BaseModel):
    user: UserBrief
    active_tasks: int
    completed_tasks: int
    overdue_tasks: int


class RecentActivityItem(BaseModel):
    id: int
    type: str  # 'status_change', 'delegation', 'update', 'comment'
    task_id: int
    task_title: str
    user_name: str
    description: str
    timestamp: str


class AdminDashboardResponse(BaseModel):
    counts: DashboardCounts
    priority_distribution: List[PriorityDistributionItem]
    status_distribution: List[StatusDistributionItem]
    department_distribution: List[DepartmentDistributionItem]
    employee_workloads: List[EmployeeWorkloadItem]
    recent_activities: List[RecentActivityItem]


class ManagerDashboardResponse(BaseModel):
    counts: DashboardCounts
    my_delegated_count: int
    under_review_count: int
    team_workloads: List[EmployeeWorkloadItem]
    priority_distribution: List[PriorityDistributionItem]
    recent_activities: List[RecentActivityItem]


class EmployeeDashboardResponse(BaseModel):
    assigned_to_me_count: int
    delegated_by_me_count: int
    in_progress_count: int
    under_review_count: int
    completed_count: int
    overdue_count: int
    recent_assigned_tasks: List[Any]
    upcoming_deadlines: List[Any]
    recent_notifications: List[Any]

