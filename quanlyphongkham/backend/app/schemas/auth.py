from typing import Optional
from datetime import date
from pydantic import BaseModel, Field

class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1, description="Email hoac username")
    password: str = Field(..., min_length=1)

class RefreshRequest(BaseModel):
    refresh_token: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str
    user_id: str
    username: str
    full_name: Optional[str] = None

class UserInfo(BaseModel):
    id: str
    email: str
    username: str
    role: str
    is_active: bool
    is_verified: bool
    full_name: Optional[str] = None
    last_login: Optional[str] = None
    model_config = {"from_attributes": True}

class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2)
    gender: str = Field(...)
    date_of_birth: date
    phone: str = Field(..., min_length=10)
    email: str
    password: str = Field(..., min_length=6)
