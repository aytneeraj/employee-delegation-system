from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.api.deps import get_db, get_current_user
from app.models.task_update import TaskUpdate
from app.models.user import User
from app.schemas.task_update import TaskUpdateCreate, TaskUpdateResponse
from app.services.task_service import TaskService

router = APIRouter(prefix="/tasks/{task_id}/updates", tags=["Task Updates"])


@router.get("", response_model=List[TaskUpdateResponse])
def get_task_updates(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve progress updates for a task."""
    return (
        db.query(TaskUpdate)
        .filter(TaskUpdate.task_id == task_id)
        .order_by(desc(TaskUpdate.created_at))
        .all()
    )


@router.post("", response_model=TaskUpdateResponse, status_code=status.HTTP_201_CREATED)
def add_task_update(
    task_id: int,
    update_in: TaskUpdateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit a progress update with percentage completed."""
    return TaskService.add_progress_update(
        db=db,
        task_id=task_id,
        update_text=update_in.update_text.strip(),
        progress_percentage=update_in.progress_percentage,
        user=current_user
    )
