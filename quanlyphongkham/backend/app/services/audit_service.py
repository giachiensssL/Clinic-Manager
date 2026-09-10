"""
Audit Service — Log mọi action trong hệ thống
"""
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import AuditLog, AuditAction, User
import uuid


async def log_action(
    db: AsyncSession,
    user: Optional[User],
    action: AuditAction,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = None,
    result: str = "success",
) -> None:
    """Ghi audit log cho mọi hành động trong hệ thống"""
    audit = AuditLog(
        id=str(uuid.uuid4()),
        user_id=user.id if user else None,
        username=user.username if user else "system",
        user_role=user.role.value if user else None,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details,
        ip_address=ip_address,
        result=result,
    )
    db.add(audit)
    # Không await commit ở đây — transaction sẽ được commit từ request handler