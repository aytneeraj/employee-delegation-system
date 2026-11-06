from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.models.task import TaskPriority, TaskStatus
from app.schemas.user import UserBrief
from app.schemas.project import ProjectResponse
from app.schemas.task_assignment import TaskAssignmentResponse
from app.schemas.task_status_history import TaskStatusHistoryResponse
from app.schemas.task_update import TaskUpdateResponse
from app.schemas.task_comment import TaskCommentResponse


class TaskBase(BaseModel):
    title: str
    description: str
    project_id: Optional[int] = None
    priority: TaskPriority = TaskPriority.MEDIUM
    start_date: Optional[date] = None
    due_date: date


class TaskCreate(TaskBase):
    current_assignee_id: int


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    project_id: Optional[int] = None
    priority: Optional[TaskPriority] = None
    start_date: Optional[date] = None
    due_date: Optional[date] = None


class TaskStatusUpdate(BaseModel):
    status: TaskStatus
    comment: Optional[str] = None


class TaskDelegateRequest(BaseModel):
    to_user_id: int
    reassignment_reason: str


class TaskResponse(TaskBase):
    id: int
    task_code: str
    created_by_id: int
    current_assignee_id: int
    delegated_by_id: int
    status: TaskStatus
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    # Nested relations
    project: Optional[ProjectResponse] = None
    created_by: Optional[UserBrief] = None
    current_assignee: Optional[UserBrief] = None
    delegated_by: Optional[UserBrief] = None
    
    # Progress indicator
    current_progress: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)


class TaskDetailResponse(TaskResponse):
    assignments: List[TaskAssignmentResponse] = []
    status_history: List[TaskStatusHistoryResponse] = []
    updates: List[TaskUpdateResponse] = []
    comments: List[TaskCommentResponse] = []

    model_config = ConfigDict(from_attributes=True)
