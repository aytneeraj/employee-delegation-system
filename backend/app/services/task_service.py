from datetime import datetime, date
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc
from fastapi import HTTPException, status
from app.models.task import Task, TaskPriority, TaskStatus
from app.models.task_assignment import TaskAssignment
from app.models.task_status_history import TaskStatusHistory
from app.models.task_update import TaskUpdate
from app.models.task_comment import TaskComment
from app.models.user import User, UserRole
from app.models.project import Project
from app.schemas.task import TaskCreate, TaskUpdate, TaskStatusUpdate, TaskDelegateRequest
from app.services.notification_service import NotificationService


class TaskService:
    @staticmethod
    def _generate_task_code(db: Session) -> str:
        """Generate a sequential unique task code like TSK-1001."""
        last_task = db.query(Task).order_by(Task.id.desc()).first()
        next_id = 1001 if not last_task else 1001 + last_task.id
        return f"TSK-{next_id}"

    @classmethod
    def create_task(cls, db: Session, task_in: TaskCreate, creator: User) -> Task:
        """Create a new task with initial assignment and status history."""
        # Rule: Employees cannot assign tasks to themselves
        if creator.role == UserRole.EMPLOYEE and task_in.current_assignee_id == creator.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Employees cannot assign tasks to themselves."
            )

        # Verify assignee exists and is active
        assignee = db.query(User).filter(User.id == task_in.current_assignee_id, User.is_active == True).first()
        if not assignee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assigned employee not found or inactive."
            )

        # Verify project if specified
        if task_in.project_id:
            project = db.query(Project).filter(Project.id == task_in.project_id).first()
            if not project:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Project not found."
                )

        task_code = cls._generate_task_code(db)

        task = Task(
            task_code=task_code,
            title=task_in.title,
            description=task_in.description,
            project_id=task_in.project_id,
            created_by_id=creator.id,
            current_assignee_id=assignee.id,
            delegated_by_id=creator.id,
            priority=task_in.priority,
            status=TaskStatus.ASSIGNED,
            start_date=task_in.start_date or date.today(),
            due_date=task_in.due_date,
        )
        db.add(task)
        db.flush()

        # Record initial delegation/assignment in task_assignments
        initial_assignment = TaskAssignment(
            task_id=task.id,
            from_user_id=creator.id,
            to_user_id=assignee.id,
            reassignment_reason="Initial task creation and assignment.",
            is_current=True,
            assigned_at=datetime.utcnow()
        )
        db.add(initial_assignment)

        # Record initial status in task_status_history
        status_history = TaskStatusHistory(
            task_id=task.id,
            changed_by_id=creator.id,
            from_status="none",
            to_status=TaskStatus.ASSIGNED.value,
            comment="Task created and assigned."
        )
        db.add(status_history)

        db.commit()
        db.refresh(task)

        # Notify assignee
        NotificationService.create_notification(
            db=db,
            user_id=assignee.id,
            task_id=task.id,
            title="New Task Assigned",
            message=f"{creator.full_name} assigned you task [{task.task_code}] {task.title}",
            notif_type="task_assigned"
        )

        return task

    @classmethod
    def delegate_task(cls, db: Session, task_id: int, delegate_in: TaskDelegateRequest, current_user: User) -> Task:
        """Controlled reassignment workflow: delegates an assigned task to another employee."""
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found."
            )

        # Permission: Only current assignee, a manager, or admin can delegate
        is_assignee = (task.current_assignee_id == current_user.id)
        is_manager_or_admin = (current_user.role in [UserRole.ADMIN, UserRole.MANAGER])
        if not (is_assignee or is_manager_or_admin):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to delegate this task."
            )

        # Check: Cannot delegate completed or cancelled tasks
        if task.status in [TaskStatus.COMPLETED, TaskStatus.CANCELLED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delegate a task with status '{task.status.value}'."
            )

        # Rule: Cannot assign/delegate to oneself
        if delegate_in.to_user_id == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot delegate a task to yourself."
            )

        # Verify new assignee exists and is active
        new_assignee = db.query(User).filter(User.id == delegate_in.to_user_id, User.is_active == True).first()
        if not new_assignee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Target employee not found or is inactive."
            )

        # Mark previous assignments as not current
        db.query(TaskAssignment).filter(
            TaskAssignment.task_id == task.id,
            TaskAssignment.is_current == True
        ).update({"is_current": False})

        # Insert new assignment record preserving complete delegation history
        new_assignment = TaskAssignment(
            task_id=task.id,
            from_user_id=current_user.id,
            to_user_id=new_assignee.id,
            reassignment_reason=delegate_in.reassignment_reason.strip(),
            is_current=True,
            assigned_at=datetime.utcnow()
        )
        db.add(new_assignment)

        # Update task state: new assignee, delegator set to current user, reset status to ASSIGNED
        previous_status = task.status.value
        task.current_assignee_id = new_assignee.id
        task.delegated_by_id = current_user.id
        task.status = TaskStatus.ASSIGNED

        # Record in status history
        status_entry = TaskStatusHistory(
            task_id=task.id,
            changed_by_id=current_user.id,
            from_status=previous_status,
            to_status=TaskStatus.ASSIGNED.value,
            comment=f"Delegated to {new_assignee.full_name}. Reason: {delegate_in.reassignment_reason.strip()}"
        )
        db.add(status_entry)

        db.commit()
        db.refresh(task)

        # Notify the new assignee
        NotificationService.create_notification(
            db=db,
            user_id=new_assignee.id,
            task_id=task.id,
            title="Task Delegated to You",
            message=f"{current_user.full_name} delegated task [{task.task_code}] {task.title} to you. Reason: {delegate_in.reassignment_reason}",
            notif_type="task_delegated"
        )

        return task

    @classmethod
    def update_task_status(cls, db: Session, task_id: int, status_in: TaskStatusUpdate, current_user: User) -> Task:
        """Execute a validated status transition according to the required workflow."""
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found."
            )

        target_status = status_in.status
        current_status = task.status
        is_assignee = (task.current_assignee_id == current_user.id)
        is_delegator = (task.delegated_by_id == current_user.id)
        is_creator = (task.created_by_id == current_user.id)
        is_admin = (current_user.role == UserRole.ADMIN)
        is_manager = (current_user.role == UserRole.MANAGER)

        # Workflow validation
        if target_status == TaskStatus.ACCEPTED:
            # Assignee accepts task
            if not (is_assignee or is_admin or is_manager):
                raise HTTPException(status_code=403, detail="Only the assigned employee can accept this task.")
            if current_status != TaskStatus.ASSIGNED:
                raise HTTPException(status_code=400, detail=f"Cannot accept task from '{current_status.value}' state.")

        elif target_status == TaskStatus.IN_PROGRESS:
            # Assignee starts work
            if not (is_assignee or is_admin or is_manager):
                raise HTTPException(status_code=403, detail="Only the assigned employee can start this task.")
            if current_status not in [TaskStatus.ASSIGNED, TaskStatus.ACCEPTED, TaskStatus.REVISION_REQUIRED]:
                raise HTTPException(status_code=400, detail=f"Cannot start task from '{current_status.value}' state.")

        elif target_status == TaskStatus.UNDER_REVIEW:
            # Assignee submits work for review
            if not (is_assignee or is_admin or is_manager):
                raise HTTPException(status_code=403, detail="Only the assigned employee can submit task for review.")
            if current_status not in [TaskStatus.IN_PROGRESS, TaskStatus.REVISION_REQUIRED, TaskStatus.ACCEPTED]:
                raise HTTPException(status_code=400, detail=f"Cannot submit for review from '{current_status.value}' state.")

        elif target_status == TaskStatus.COMPLETED:
            # Approval workflow: cannot be completed unilaterally by assignee without review approval
            if is_assignee and not (is_admin or is_manager or is_delegator or is_creator):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Employees cannot directly complete their own tasks. Please submit for review to your delegator/manager."
                )
            # Allowed for delegator, creator, manager, or admin
            if not (is_delegator or is_creator or is_manager or is_admin):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only the delegating person or a manager/admin can approve and mark this task as completed."
                )

        elif target_status == TaskStatus.REVISION_REQUIRED:
            # Revision requested
            if not (is_delegator or is_creator or is_manager or is_admin):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only the delegating person or a manager/admin can request revisions."
                )

        elif target_status == TaskStatus.CANCELLED:
            if not (is_delegator or is_creator or is_manager or is_admin):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only managers, admins, or the creator can cancel this task."
                )

        # Apply transition
        old_status_val = task.status.value
        task.status = target_status
        if target_status == TaskStatus.COMPLETED:
            task.completed_at = datetime.utcnow()
        elif old_status_val == TaskStatus.COMPLETED.value and target_status != TaskStatus.COMPLETED:
            task.completed_at = None

        # Log status history
        history = TaskStatusHistory(
            task_id=task.id,
            changed_by_id=current_user.id,
            from_status=old_status_val,
            to_status=target_status.value,
            comment=status_in.comment.strip() if status_in.comment else f"Status changed from {old_status_val} to {target_status.value}."
        )
        db.add(history)
        db.commit()
        db.refresh(task)

        # Send appropriate notifications
        if target_status == TaskStatus.ACCEPTED:
            NotificationService.create_notification(
                db=db,
                user_id=task.delegated_by_id,
                task_id=task.id,
                title="Task Accepted",
                message=f"{current_user.full_name} accepted task [{task.task_code}] {task.title}",
                notif_type="task_accepted"
            )
        elif target_status == TaskStatus.UNDER_REVIEW:
            NotificationService.create_notification(
                db=db,
                user_id=task.delegated_by_id,
                task_id=task.id,
                title="Task Submitted for Review",
                message=f"{current_user.full_name} submitted task [{task.task_code}] {task.title} for your review.",
                notif_type="review_submitted"
            )
        elif target_status == TaskStatus.COMPLETED:
            NotificationService.create_notification(
                db=db,
                user_id=task.current_assignee_id,
                task_id=task.id,
                title="Task Approved & Completed",
                message=f"{current_user.full_name} approved and marked task [{task.task_code}] {task.title} as completed!",
                notif_type="task_approved"
            )
        elif target_status == TaskStatus.REVISION_REQUIRED:
            NotificationService.create_notification(
                db=db,
                user_id=task.current_assignee_id,
                task_id=task.id,
                title="Revision Requested",
                message=f"{current_user.full_name} requested revisions for task [{task.task_code}] {task.title}. Feedback: {status_in.comment or 'See details'}",
                notif_type="revision_requested"
            )

        return task

    @staticmethod
    def get_task_by_id(db: Session, task_id: int) -> Optional[Task]:
        """Fetch task by ID with relations."""
        return db.query(Task).filter(Task.id == task_id).first()

    @staticmethod
    def add_progress_update(db: Session, task_id: int, update_text: str, progress_percentage: int, user: User) -> TaskUpdate:
        """Add a progress update to a task."""
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found.")

        # Ensure user is assignee or authorized participant
        if task.current_assignee_id != user.id and user.role not in [UserRole.ADMIN, UserRole.MANAGER] and task.delegated_by_id != user.id:
            raise HTTPException(status_code=403, detail="You are not authorized to post progress updates for this task.")

        update = TaskUpdate(
            task_id=task_id,
            user_id=user.id,
            update_text=update_text,
            progress_percentage=progress_percentage
        )
        db.add(update)
        db.commit()
        db.refresh(update)
        return update

    @staticmethod
    def add_comment(db: Session, task_id: int, comment_text: str, user: User) -> TaskComment:
        """Add a comment to a task."""
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found.")

        comment = TaskComment(
            task_id=task_id,
            user_id=user.id,
            comment_text=comment_text
        )
        db.add(comment)
        db.commit()
        db.refresh(comment)

        # Notify counterpart if commenting
        counterpart_id = task.delegated_by_id if user.id == task.current_assignee_id else task.current_assignee_id
        if counterpart_id != user.id:
            NotificationService.create_notification(
                db=db,
                user_id=counterpart_id,
                task_id=task.id,
                title="New Comment on Task",
                message=f"{user.full_name} commented on [{task.task_code}] {task.title}",
                notif_type="comment_added"
            )

        return comment
