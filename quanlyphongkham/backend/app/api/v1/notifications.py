from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import Notification, User
from app.schemas.notification import NotificationListResponse, NotificationResponse

router = APIRouter()

@router.get("", response_model=NotificationListResponse)
async def list_notifications(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    is_read: Optional[bool] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Notification).where(Notification.user_id == current_user.id)
    
    if is_read is not None:
        query = query.where(Notification.is_read == is_read)
        
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar_one()
    
    unread_count_query = select(func.count()).where(
        Notification.user_id == current_user.id, 
        Notification.is_read == False
    )
    unread_count = (await db.execute(unread_count_query)).scalar_one()
    
    offset = (page - 1) * size
    query = query.order_by(Notification.created_at.desc()).offset(offset).limit(size)
    items = (await db.execute(query)).scalars().all()
    
    return NotificationListResponse(
        items=[NotificationResponse.model_validate(n) for n in items],
        total=total,
        unread_count=unread_count,
    )

@router.put("/{notification_id}/read", response_model=NotificationResponse)
async def mark_as_read(
    notification_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == current_user.id
        )
    )
    notification = result.scalar_one_or_none()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Khong tim thay thong bao")
        
    notification.is_read = True
    await db.flush()
    return NotificationResponse.model_validate(notification)

@router.put("/read-all", status_code=status.HTTP_204_NO_CONTENT)
async def mark_all_as_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await db.execute(
        update(Notification)
        .where(Notification.user_id == current_user.id, Notification.is_read == False)
        .values(is_read=True)
    )
    await db.flush()
