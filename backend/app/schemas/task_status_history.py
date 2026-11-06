from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.user import UserBrief


class TaskStatusHistoryResponse(BaseModel):
    id: int
    task_id: int
    changed_by_id: int
    from_status: str
    to_status: str
    comment: Optional[str] = None
    created_at: datetime
    changed_by: Optional[UserBrief] = None

    model_config = ConfigDict(from_attributes=True)
