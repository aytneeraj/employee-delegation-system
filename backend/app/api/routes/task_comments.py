from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.task_comment import TaskComment
from app.models.user import User
from app.schemas.task_comment import TaskCommentCreate, TaskCommentResponse
from app.services.task_service import TaskService

router = APIRouter(prefix="/tasks/{task_id}/comments", tags=["Task Comments"])


@router.get("", response_model=List[TaskCommentResponse])
def get_task_comments(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve comments for a task in chronological order."""
    return (
        db.query(TaskComment)
        .filter(TaskComment.task_id == task_id)
        .order_by(TaskComment.created_at.asc())
        .all()
    )


@router.post("", response_model=TaskCommentResponse, status_code=status.HTTP_201_CREATED)
def add_task_comment(
    task_id: int,
    comment_in: TaskCommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a new comment to a task discussion."""
    if not comment_in.comment_text.strip():
        raise HTTPException(status_code=400, detail="Comment text cannot be empty.")
    return TaskService.add_comment(
        db=db,
        task_id=task_id,
        comment_text=comment_in.comment_text.strip(),
        user=current_user
    )

