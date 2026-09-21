from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import User
from app.schemas.ai_conversation import (
    AIChatRequest, AIChatResponse, AIConversationSchema, 
    AIConversationDetailSchema, AIConversationCreate
)
from app.services.ai_conversation_service import ai_conversation_service
from app.services.ai_core_service import ai_core_service

router = APIRouter()

@router.get("/conversations", response_model=List[AIConversationSchema])
async def list_conversations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lấy danh sách các cuộc hội thoại của user"""
    return await ai_conversation_service.get_user_conversations(db, current_user.id)

@router.post("/conversations", response_model=AIConversationSchema)
async def create_conversation(
    payload: AIConversationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Tạo mới hội thoại"""
    title = payload.title or "Hội thoại mới"
    return await ai_conversation_service.create_conversation(db, current_user.id, title)

@router.get("/conversations/{conversation_id}", response_model=AIConversationDetailSchema)
async def get_conversation_detail(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lấy chi tiết hội thoại kèm tin nhắn"""
    conv = await ai_conversation_service.get_conversation(db, conversation_id, current_user.id)
    if not conv:
        raise HTTPException(status_code=404, detail="Không tìm thấy hội thoại")
    messages = await ai_conversation_service.get_conversation_messages(db, conversation_id)
    
    # Chuẩn bị dữ liệu trả về theo Schema
    conv_dict = {
        "id": conv.id,
        "user_id": conv.user_id,
        "title": conv.title,
        "is_active": conv.is_active,
        "created_at": conv.created_at,
        "updated_at": conv.updated_at,
        "messages": [
            {
                "id": msg.id,
                "conversation_id": msg.conversation_id,
                "role": msg.role,
                "content": msg.content,
                "created_at": msg.created_at
            } for msg in messages
        ]
    }
    return conv_dict

@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    success = await ai_conversation_service.soft_delete_conversation(db, conversation_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Không thể xóa hội thoại")
    return {"success": True}

@router.post("/chat", response_model=AIChatResponse)
async def chat(
    payload: AIChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Gửi tin nhắn AI với cơ chế Function Calling & Confirmation"""
    result = await ai_core_service.process_chat(
        db=db, 
        user=current_user,
        message=payload.message,
        conversation_id=payload.conversation_id,
        pending_tool_call=payload.pending_tool_call,
        action_confirmed=payload.action_confirmed
    )
    return AIChatResponse(**result)