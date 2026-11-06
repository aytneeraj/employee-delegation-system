from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.user import UserBrief


class TaskUpdateCreate(BaseModel):
    update_text: str
    progress_percentage: int = Field(ge=0, le=100)


class TaskUpdateResponse(BaseModel):
    id: int
    task_id: int
    user_id: int
    update_text: str
    progress_percentage: int
    created_at: datetime
    user: Optional[UserBrief] = None

    model_config = ConfigDict(from_attributes=True)
