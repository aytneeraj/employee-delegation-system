from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict
from app.models.user import UserRole
from app.schemas.department import DepartmentResponse


class UserBase(BaseModel):
    employee_id: str
    full_name: str
    email: EmailStr
    role: UserRole = UserRole.EMPLOYEE
    department_id: Optional[int] = None
    designation: str
    manager_id: Optional[int] = None
    is_active: bool = True
    joining_date: date = date.today()
    avatar_url: Optional[str] = None


class UserCreate(BaseModel):
    employee_id: str
    full_name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.EMPLOYEE
    department_id: Optional[int] = None
    designation: str
    manager_id: Optional[int] = None
    joining_date: Optional[date] = None


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    department_id: Optional[int] = None
    designation: Optional[str] = None
    manager_id: Optional[int] = None
    is_active: Optional[bool] = None
    avatar_url: Optional[str] = None
    password: Optional[str] = None


class UserStatusUpdate(BaseModel):
    is_active: bool


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None


class UserBrief(BaseModel):
    id: int
    employee_id: str
    full_name: str
    email: EmailStr
    role: UserRole
    designation: str
    avatar_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class UserResponse(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime
    department: Optional[DepartmentResponse] = None
    reporting_manager: Optional[UserBrief] = None

    model_config = ConfigDict(from_attributes=True)
