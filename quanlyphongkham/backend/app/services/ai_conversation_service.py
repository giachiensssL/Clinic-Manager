from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.models.models import AIConversation, AIMessage
from typing import List, Optional
import uuid

class AIConversationService:
    async def get_user_conversations(self, db: AsyncSession, user_id: str) -> List[AIConversation]:
        """Lấy danh sách hội thoại của user (chỉ lấy active)"""
        stmt = select(AIConversation).where(
            AIConversation.user_id == user_id,
            AIConversation.is_active == True
        ).order_by(AIConversation.updated_at.desc())
        result = await db.execute(stmt)
        return result.scalars().all()

    async def get_conversation(self, db: AsyncSession, conversation_id: str, user_id: str) -> Optional[AIConversation]:
        """Lấy chi tiết một cuộc hội thoại kèm tin nhắn (phải đúng user_id để đảm bảo security)"""
        stmt = select(AIConversation).where(
            AIConversation.id == conversation_id,
            AIConversation.user_id == user_id,
            AIConversation.is_active == True
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_conversation_messages(self, db: AsyncSession, conversation_id: str) -> List[AIMessage]:
        """Lấy toàn bộ tin nhắn của một cuộc hội thoại"""
        stmt = select(AIMessage).where(
            AIMessage.conversation_id == conversation_id
        ).order_by(AIMessage.created_at.asc())
        result = await db.execute(stmt)
        return result.scalars().all()

    async def create_conversation(self, db: AsyncSession, user_id: str, title: str = "New Conversation") -> AIConversation:
        """Tạo cuộc hội thoại mới"""
        conv = AIConversation(
            id=str(uuid.uuid4()),
            user_id=user_id,
            title=title,
            is_active=True
        )
        db.add(conv)
        await db.flush()
        return conv

    async def soft_delete_conversation(self, db: AsyncSession, conversation_id: str, user_id: str) -> bool:
        """Xóa mềm cuộc hội thoại (kiểm tra quyền sở hữu)"""
        stmt = update(AIConversation).where(
            AIConversation.id == conversation_id,
            AIConversation.user_id == user_id
        ).values(is_active=False)
        result = await db.execute(stmt)
        await db.flush()
        return result.rowcount > 0

    async def rename_conversation(self, db: AsyncSession, conversation_id: str, user_id: str, new_title: str) -> bool:
        stmt = update(AIConversation).where(
            AIConversation.id == conversation_id,
            AIConversation.user_id == user_id
        ).values(title=new_title)
        result = await db.execute(stmt)
        await db.flush()
        return result.rowcount > 0

    async def add_message(self, db: AsyncSession, conversation_id: str, role: str, content: str) -> AIMessage:
        """Thêm tin nhắn vào cuộc hội thoại"""
        msg = AIMessage(
            id=str(uuid.uuid4()),
            conversation_id=conversation_id,
            role=role,
            content=content
        )
        db.add(msg)
        
        # Cập nhật thời gian update của conversation
        import datetime
        await db.execute(
            update(AIConversation).where(AIConversation.id == conversation_id).values(updated_at=datetime.datetime.utcnow())
        )
        
        await db.flush()
        return msg

ai_conversation_service = AIConversationService()
