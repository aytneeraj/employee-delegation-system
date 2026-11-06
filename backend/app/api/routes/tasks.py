from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc
from app.api.deps import get_db, get_current_user, require_roles
from app.models.task import Task, TaskPriority, TaskStatus
from app.models.task_assignment import TaskAssignment
from app.models.user import User, UserRole
from app.schemas.task import (
    TaskCreate,
    TaskUpdate,
    TaskStatusUpdate,
    TaskDelegateRequest,
    TaskResponse,
    TaskDetailResponse,
)
from app.schemas.task_assignment import TaskAssignmentResponse
from app.services.task_service import TaskService

router = APIRouter(prefix="/tasks", tags=["Tasks & Delegation"])


def _attach_progress(task: Task) -> TaskResponse:
    """Helper to convert task model to response including latest progress percentage."""
    resp = TaskResponse.model_validate(task)
    if task.updates:
        # Latest update progress
        latest_upd = sorted(task.updates, key=lambda u: u.created_at, reverse=True)
        resp.current_progress = latest_upd[0].progress_percentage
    elif task.status == TaskStatus.COMPLETED:
        resp.current_progress = 100
    else:
        resp.current_progress = 0
    return resp


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    task_in: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new task and assign it to an active employee.
    Admin, Manager, and Employees can create tasks.
    Employees cannot assign tasks to themselves.
    """
    task = TaskService.create_task(db=db, task_in=task_in, creator=current_user)
    return _attach_progress(task)


@router.get("", response_model=List[TaskResponse])
def list_tasks(
    status_filter: Optional[TaskStatus] = Query(None, alias="status"),
    priority: Optional[TaskPriority] = Query(None),
    project_id: Optional[int] = Query(None),
    assignee_id: Optional[int] = Query(None),
    is_overdue: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List company tasks.
    Admin & Manager can view all tasks.
    Employees can view tasks they are assigned to, delegated, or created, or all public project tasks.
    """
    query = db.query(Task)

    # Role visibility filtering
    if current_user.role == UserRole.EMPLOYEE:
        # An employee sees tasks where they are assignee, delegator, or creator
        query = query.filter(
            or_(
                Task.current_assignee_id == current_user.id,
                Task.delegated_by_id == current_user.id,
                Task.created_by_id == current_user.id,
            )
        )

    if status_filter:
        query = query.filter(Task.status == status_filter)
    if priority:
        query = query.filter(Task.priority == priority)
    if project_id:
        query = query.filter(Task.project_id == project_id)
    if assignee_id:
        query = query.filter(Task.current_assignee_id == assignee_id)
    if is_overdue:
        query = query.filter(
            Task.due_date < date.today(),
            Task.status.notin_([TaskStatus.COMPLETED, TaskStatus.CANCELLED])
        )
    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter(or_(Task.title.ilike(pattern), Task.task_code.ilike(pattern)))

    tasks = query.order_by(desc(Task.created_at)).all()
    return [_attach_progress(t) for t in tasks]


@router.get("/my-tasks", response_model=List[TaskResponse])
def get_my_tasks(
    status_filter: Optional[TaskStatus] = Query(None, alias="status"),
    priority: Optional[TaskPriority] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve all tasks currently assigned to the logged-in user."""
    query = db.query(Task).filter(Task.current_assignee_id == current_user.id)
    if status_filter:
        query = query.filter(Task.status == status_filter)
    if priority:
        query = query.filter(Task.priority == priority)

    tasks = query.order_by(Task.due_date.asc()).all()
    return [_attach_progress(t) for t in tasks]


@router.get("/delegated-by-me", response_model=List[TaskResponse])
def get_tasks_delegated_by_me(
    status_filter: Optional[TaskStatus] = Query(None, alias="status"),
    priority: Optional[TaskPriority] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve tasks that the logged-in user assigned/delegated to other employees.
    Preserves delegation visibility!
    """
    query = db.query(Task).filter(
        Task.delegated_by_id == current_user.id,
        Task.current_assignee_id != current_user.id
    )
    if status_filter:
        query = query.filter(Task.status == status_filter)
    if priority:
        query = query.filter(Task.priority == priority)

    tasks = query.order_by(desc(Task.updated_at)).all()
    return [_attach_progress(t) for t in tasks]


@router.get("/{task_id}", response_model=TaskDetailResponse)
def get_task_detail(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get full task details including:
    - Delegator and assignee info
    - Complete assignment / delegation history
    - Complete status transition history
    - Progress updates
    - Comments
    """
    task = TaskService.get_task_by_id(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")

    # Authorization check for employee
    if current_user.role == UserRole.EMPLOYEE:
        involved_ids = [task.current_assignee_id, task.delegated_by_id, task.created_by_id]
        past_assignees = [a.to_user_id for a in task.assignments] + [a.from_user_id for a in task.assignments]
        if current_user.id not in involved_ids and current_user.id not in past_assignees:
            raise HTTPException(status_code=403, detail="You do not have access to view this task.")

    detail = TaskDetailResponse.model_validate(task)
    if task.updates:
        latest_upd = sorted(task.updates, key=lambda u: u.created_at, reverse=True)
        detail.current_progress = latest_upd[0].progress_percentage
    elif task.status == TaskStatus.COMPLETED:
        detail.current_progress = 100
    else:
        detail.current_progress = 0

    return detail


@router.patch("/{task_id}", response_model=TaskResponse)
def update_task_metadata(
    task_id: int,
    task_in: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update task metadata (title, description, project, priority, due date)."""
    task = TaskService.get_task_by_id(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")

    # Only creator, manager, or admin can modify metadata
    can_edit = (
        current_user.id == task.created_by_id
        or current_user.id == task.delegated_by_id
        or current_user.role in [UserRole.ADMIN, UserRole.MANAGER]
    )
    if not can_edit:
        raise HTTPException(status_code=403, detail="You are not authorized to edit task details.")

    if task_in.title is not None:
        task.title = task_in.title.strip()
    if task_in.description is not None:
        task.description = task_in.description.strip()
    if task_in.project_id is not None:
        task.project_id = task_in.project_id
    if task_in.priority is not None:
        task.priority = task_in.priority
    if task_in.start_date is not None:
        task.start_date = task_in.start_date
    if task_in.due_date is not None:
        task.due_date = task_in.due_date

    db.commit()
    db.refresh(task)
    return _attach_progress(task)


@router.patch("/{task_id}/status", response_model=TaskResponse)
def update_task_status(
    task_id: int,
    status_in: TaskStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Execute controlled status transition:
    - Assigned -> Accepted
    - Accepted -> In Progress
    - In Progress -> Under Review
    - Under Review -> Completed (Approval by delegator/manager/admin)
    - Under Review -> Revision Required (By delegator/manager/admin)
    """
    updated_task = TaskService.update_task_status(
        db=db,
        task_id=task_id,
        status_in=status_in,
        current_user=current_user
    )
    return _attach_progress(updated_task)


@router.post("/{task_id}/delegate", response_model=TaskResponse)
def delegate_task(
    task_id: int,
    delegate_in: TaskDelegateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delegate an assigned task to another employee:
    - Controlled reassignment workflow.
    - Preserves previous assignment history.
    - Sets new assignee and updates delegator identity.
    - Resets status to 'assigned'.
    - Dispatches notification to the new assignee.
    """
    delegated_task = TaskService.delegate_task(
        db=db,
        task_id=task_id,
        delegate_in=delegate_in,
        current_user=current_user
    )
    return _attach_progress(delegated_task)


@router.get("/{task_id}/history", response_model=List[TaskAssignmentResponse])
def get_task_assignment_history(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetch complete immutable delegation history for a task."""
    task = TaskService.get_task_by_id(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")

    assignments = (
        db.query(TaskAssignment)
        .filter(TaskAssignment.task_id == task_id)
        .order_by(desc(TaskAssignment.assigned_at))
        .all()
    )
    return assignments
