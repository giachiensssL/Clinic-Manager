"""
Auth Schemas — Pydantic models cho cac endpoint xac thuc
"""
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    """Du lieu dang nhap — ho tro ca email lan username"""
    username: str = Field(..., min_length=1, description="Email hoac username")
    password: str = Field(..., min_length=1)


class RefreshRequest(BaseModel):
    """Yeu cau cap lai access token tu refresh token"""
    refresh_token: str


class Token(BaseModel):
    """Phan hoi token sau khi dang nhap thanh cong"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str
    user_id: str
    username: str
    full_name: Optional[str] = None


class UserInfo(BaseModel):
    """Thong tin user hien tai — phan hoi cua GET /me"""
    id: str
    email: str
    username: str
    role: str
    is_active: bool
    is_verified: bool
    full_name: Optional[str] = None
    last_login: Optional[str] = None

    model_config = {"from_attributes": True}