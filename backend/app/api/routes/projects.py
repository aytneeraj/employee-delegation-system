from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user, require_roles
from app.models.project import Project, ProjectStatus
from app.models.user import User, UserRole
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.get("", response_model=List[ProjectResponse])
def list_projects(
    status_filter: Optional[ProjectStatus] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List projects with optional filtering."""
    query = db.query(Project)
    if status_filter:
        query = query.filter(Project.status == status_filter)
    if search:
        query = query.filter(Project.name.ilike(f"%{search.strip()}%"))
    return query.order_by(Project.created_at.desc()).all()


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    project_in: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER))
):
    """Create a new project (Admin or Manager)."""
    if db.query(Project).filter(Project.code == project_in.code).first():
        raise HTTPException(status_code=400, detail="Project with this code already exists.")

    project = Project(
        name=project_in.name.strip(),
        code=project_in.code.strip().upper(),
        description=project_in.description,
        manager_id=project_in.manager_id or current_user.id,
        status=project_in.status,
        start_date=project_in.start_date,
        end_date=project_in.end_date,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get project details by ID."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")
    return project


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    project_in: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER))
):
    """Update project details (Admin or Manager)."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    if project_in.name is not None:
        project.name = project_in.name.strip()
    if project_in.description is not None:
        project.description = project_in.description
    if project_in.status is not None:
        project.status = project_in.status
    if project_in.manager_id is not None:
        project.manager_id = project_in.manager_id
    if project_in.start_date is not None:
        project.start_date = project_in.start_date
    if project_in.end_date is not None:
        project.end_date = project_in.end_date

    db.commit()
    db.refresh(project)
    return project
