"""
Auth Service — Business logic cho xac thuc nguoi dung
Xu ly login, register, token refresh va quan ly session
"""
from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.models.models import User, Staff, Patient, UserRole
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)


class AuthService:
    """Service xu ly xac thuc va quan ly nguoi dung"""

    @staticmethod
    async def authenticate_user(
        db: AsyncSession,
        username_or_email: str,
        password: str,
    ) -> User:
        """
        Tim va xac thuc user theo email hoac username.
        Raise HTTPException neu thong tin sai hoac tai khoan bi vo hieu.
        """
        result = await db.execute(
            select(User).where(
                or_(
                    User.email == username_or_email.lower(),
                    User.username == username_or_email,
                ),
                User.deleted_at.is_(None),
            )
        )
        user = result.scalar_one_or_none()

        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is disabled",
            )

        return user

    @staticmethod
    async def create_user(
        db: AsyncSession,
        email: str,
        username: str,
        password: str,
        role: UserRole,
    ) -> User:
        """
        Tao user moi voi hashed password.
        Kiem tra trung lap email/username truoc khi tao.
        """
        # Kiem tra email da ton tai chua
        existing = await db.execute(
            select(User).where(
                or_(User.email == email.lower(), User.username == username),
                User.deleted_at.is_(None),
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email or username already exists",
            )

        user = User(
            email=email.lower().strip(),
            username=username.strip(),
            hashed_password=hash_password(password),
            role=role,
            is_active=True,
            is_verified=False,
        )
        db.add(user)
        await db.flush()  # Lay ID truoc khi commit
        return user

    @staticmethod
    async def refresh_access_token(
        db: AsyncSession,
        refresh_token: str,
    ) -> dict:
        """
        Validate refresh token va tao cap access/refresh token moi.
        Tra ve dict chua access_token va refresh_token moi.
        """
        payload = decode_token(refresh_token)

        # Kiem tra loai token
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type: expected refresh token",
                headers={"WWW-Authenticate": "Bearer"},
            )

        user_id: Optional[str] = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing subject",
            )

        result = await db.execute(
            select(User).where(User.id == user_id, User.deleted_at.is_(None))
        )
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is disabled",
            )

        # Tao cap token moi
        token_data = {"sub": user.id, "role": user.role.value}
        new_access_token = create_access_token(token_data)
        new_refresh_token = create_refresh_token(token_data)

        # Cap nhat last_login
        await AuthService.update_last_login(db, user)

        return {
            "access_token": new_access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
        }

    @staticmethod
    async def get_user_full_name(db: AsyncSession, user: User) -> Optional[str]:
        """
        Lay full name tu bang Staff (doi voi nhan vien) hoac Patient (doi voi benh nhan).
        Tra ve None neu chua co profile.
        """
        if user.role in (
            UserRole.ADMIN,
            UserRole.DOCTOR,
            UserRole.RECEPTIONIST,
            UserRole.ACCOUNTANT,
        ):
            result = await db.execute(
                select(Staff.full_name).where(Staff.user_id == user.id)
            )
            name = result.scalar_one_or_none()
            return name

        if user.role == UserRole.PATIENT:
            result = await db.execute(
                select(Patient.full_name).where(
                    Patient.user_id == user.id,
                    Patient.deleted_at.is_(None),
                )
            )
            name = result.scalar_one_or_none()
            return name

        return None

    @staticmethod
    async def update_last_login(db: AsyncSession, user: User) -> None:
        """Cap nhat timestamp last_login cho user (khong commit ngay — caller tu commit)"""
        user.last_login = datetime.now(timezone.utc)
        db.add(user)