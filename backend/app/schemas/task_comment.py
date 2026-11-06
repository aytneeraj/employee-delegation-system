from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.user import UserBrief


class TaskCommentCreate(BaseModel):
    comment_text: str


class TaskCommentResponse(BaseModel):
    id: int
    task_id: int
    user_id: int
    comment_text: str
    created_at: datetime
    user: Optional[UserBrief] = None

    model_config = ConfigDict(from_attributes=True)
