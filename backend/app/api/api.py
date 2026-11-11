from fastapi import APIRouter
from app.api.routes import (
    auth,
    users,
    departments,
    projects,
    tasks,
    task_updates,
    task_comments,
    notifications,
    reports,
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(departments.router)
api_router.include_router(projects.router)
api_router.include_router(tasks.router)
api_router.include_router(task_updates.router)
api_router.include_router(task_comments.router)
api_router.include_router(notifications.router)
api_router.include_router(reports.router)

