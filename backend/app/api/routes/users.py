from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.api.deps import get_db, get_current_user, require_roles
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.department import Department
from app.schemas.user import UserCreate, UserUpdate, UserStatusUpdate, UserResponse, UserBrief

router = APIRouter(prefix="/users", tags=["Employees"])


@router.get("", response_model=List[UserResponse])
def list_users(
    department_id: Optional[int] = Query(None, description="Filter by department"),
    role: Optional[UserRole] = Query(None, description="Filter by role"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    search: Optional[str] = Query(None, description="Search by name, email or employee ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve list of employees with optional filtering."""
    query = db.query(User)
    
    if department_id is not None:
        query = query.filter(User.department_id == department_id)
    if role is not None:
        query = query.filter(User.role == role)
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                User.full_name.ilike(search_pattern),
                User.email.ilike(search_pattern),
                User.employee_id.ilike(search_pattern),
                User.designation.ilike(search_pattern),
            )
        )
    
    return query.order_by(User.full_name.asc()).all()


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN))
):
    """Create a new employee account (Admin only)."""
    # Check duplicate email
    if db.query(User).filter(User.email == user_in.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An employee with this email already exists."
        )
    
    # Check duplicate employee_id
    if db.query(User).filter(User.employee_id == user_in.employee_id).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An employee with this Employee ID already exists."
        )

    # Validate department if provided
    if user_in.department_id:
        dept = db.query(Department).filter(Department.id == user_in.department_id).first()
        if not dept:
            raise HTTPException(status_code=404, detail="Department not found.")

    # Validate manager if provided
    if user_in.manager_id:
        mgr = db.query(User).filter(User.id == user_in.manager_id).first()
        if not mgr:
            raise HTTPException(status_code=404, detail="Reporting manager not found.")

    new_user = User(
        employee_id=user_in.employee_id.strip(),
        full_name=user_in.full_name.strip(),
        email=user_in.email.strip().lower(),
        hashed_password=get_password_hash(user_in.password),
        role=user_in.role,
        department_id=user_in.department_id,
        designation=user_in.designation.strip(),
        manager_id=user_in.manager_id,
        is_active=True,
        joining_date=user_in.joining_date or date.today(),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.get("/{user_id}", response_model=UserResponse)
def get_user_detail(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get single employee profile by ID."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found.")
    return user


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER))
):
    """Update employee details (Admin or Manager)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found.")

    # Only admin can change role or active status via PUT
    if user_in.role is not None and user_in.role != user.role:
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Only admins can change employee roles.")
        user.role = user_in.role

    if user_in.full_name is not None:
        user.full_name = user_in.full_name.strip()
    if user_in.designation is not None:
        user.designation = user_in.designation.strip()
    if user_in.department_id is not None:
        user.department_id = user_in.department_id
    if user_in.manager_id is not None:
        user.manager_id = user_in.manager_id
    if user_in.avatar_url is not None:
        user.avatar_url = user_in.avatar_url.strip()
    if user_in.password:
        user.hashed_password = get_password_hash(user_in.password)

    db.commit()
    db.refresh(user)
    return user


@router.patch("/{user_id}/status", response_model=UserResponse)
def toggle_user_status(
    user_id: int,
    status_in: UserStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN))
):
    """Activate or deactivate employee account (Admin only)."""
    if current_user.id == user_id and not status_in.is_active:
        raise HTTPException(status_code=400, detail="Administrators cannot deactivate their own account.")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found.")

    user.is_active = status_in.is_active
    db.commit()
    db.refresh(user)
    return user

