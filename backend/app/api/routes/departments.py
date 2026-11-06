from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user, require_roles
from app.models.department import Department
from app.models.user import User, UserRole
from app.schemas.department import DepartmentCreate, DepartmentResponse

router = APIRouter(prefix="/departments", tags=["Departments"])


@router.get("", response_model=List[DepartmentResponse])
def list_departments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all corporate departments."""
    return db.query(Department).order_by(Department.name.asc()).all()


@router.post("", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
def create_department(
    dept_in: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN))
):
    """Create a new department (Admin only)."""
    if db.query(Department).filter(Department.name == dept_in.name).first():
        raise HTTPException(status_code=400, detail="Department with this name already exists.")
    if db.query(Department).filter(Department.code == dept_in.code).first():
        raise HTTPException(status_code=400, detail="Department with this code already exists.")

    dept = Department(
        name=dept_in.name.strip(),
        code=dept_in.code.strip().upper(),
        description=dept_in.description
    )
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept
