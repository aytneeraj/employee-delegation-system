from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.user import UserBrief


class TaskAssignmentResponse(BaseModel):
    id: int
    task_id: int
    from_user_id: int
    to_user_id: int
    reassignment_reason: Optional[str] = None
    assigned_at: datetime
    is_current: bool
    from_user: Optional[UserBrief] = None
    to_user: Optional[UserBrief] = None

    model_config = ConfigDict(from_attributes=True)

