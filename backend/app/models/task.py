from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum
from app.db.base import Base


class TaskPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class TaskStatus(str, enum.Enum):
    ASSIGNED = "assigned"
    ACCEPTED = "accepted"
    IN_PROGRESS = "in_progress"
    UNDER_REVIEW = "under_review"
    REVISION_REQUIRED = "revision_required"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    task_code = Column(String(50), unique=True, nullable=False, index=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True)
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    current_assignee_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    delegated_by_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    priority = Column(SQLEnum(TaskPriority, values_callable=lambda x: [e.value for e in x]), default=TaskPriority.MEDIUM, nullable=False, index=True)
    status = Column(SQLEnum(TaskStatus, values_callable=lambda x: [e.value for e in x]), default=TaskStatus.ASSIGNED, nullable=False, index=True)
    start_date = Column(Date, nullable=True)
    due_date = Column(Date, nullable=False, index=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    project = relationship("Project", back_populates="tasks")
    created_by = relationship("User", foreign_keys=[created_by_id], back_populates="created_tasks")
    current_assignee = relationship("User", foreign_keys=[current_assignee_id], back_populates="assigned_tasks")
    delegated_by = relationship("User", foreign_keys=[delegated_by_id], back_populates="delegated_tasks")

    # History and Activity relationships
    assignments = relationship("TaskAssignment", back_populates="task", cascade="all, delete-orphan", order_by="desc(TaskAssignment.assigned_at)")
    status_history = relationship("TaskStatusHistory", back_populates="task", cascade="all, delete-orphan", order_by="desc(TaskStatusHistory.created_at)")
    updates = relationship("TaskUpdate", back_populates="task", cascade="all, delete-orphan", order_by="desc(TaskUpdate.created_at)")
    comments = relationship("TaskComment", back_populates="task", cascade="all, delete-orphan", order_by="TaskComment.created_at")
    notifications = relationship("Notification", back_populates="task", cascade="all, delete-orphan")
