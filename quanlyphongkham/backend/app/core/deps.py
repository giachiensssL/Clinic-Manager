"""
FastAPI Dependencies — Authentication + RBAC
"""
from typing import Optional, List
from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import decode_token, oauth2_scheme
from app.models.models import User, UserRole

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> User:
    """Get currently authenticated user from JWT"""
    payload = decode_token(token)
    user_id: str = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    result = await db.execute(select(User).where(User.id == user_id, User.deleted_at.is_(None)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")
    return user

def require_roles(*roles: UserRole):
    """RBAC: require one of the specified roles"""
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {[r.value for r in roles]}"
            )
        return current_user
    return role_checker

# Convenience dependencies
get_admin = require_roles(UserRole.ADMIN)
get_doctor = require_roles(UserRole.DOCTOR, UserRole.ADMIN)
get_receptionist = require_roles(UserRole.RECEPTIONIST, UserRole.ADMIN)
get_accountant = require_roles(UserRole.ACCOUNTANT, UserRole.ADMIN)
get_staff = require_roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST, UserRole.ACCOUNTANT)
get_any_user = require_roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST, UserRole.ACCOUNTANT, UserRole.PATIENT)