from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.deps import get_current_user, get_doctor
from app.models.models import User
from app.schemas.ai import ChatRequest, ChatResponse, SummarizeRequest, SummarizeResponse
from app.services.ai_service import ai_service

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
async def chat(
    payload: ChatRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """AI Chat — đi qua full guardrail pipeline"""
    ip = request.client.host if request.client else None
    result = await ai_service.process_chat(
        db=db, user=current_user,
        message=payload.message,
        conversation_id=payload.conversation_id,
        ip_address=ip,
    )
    return ChatResponse(**result)

@router.get("/chat/stream")
async def chat_stream(
    message: str,
    conversation_id: str = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Streaming AI Chat — SSE"""
    async def generate():
        async for chunk in ai_service.stream_chat(db, current_user, message, conversation_id):
            yield chunk
    
    return StreamingResponse(generate(), media_type="text/event-stream")

@router.post("/summarize", response_model=SummarizeResponse)
async def summarize_emr(
    payload: SummarizeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_doctor),  # Doctor only
):
    """AI tóm tắt lịch sử EMR — Doctor only, PII masking"""
    from sqlalchemy.orm import selectinload
    from app.models.models import Consultation, ConsultationDiagnosis
    
    result = await db.execute(
        select(Consultation)
        .options(
            selectinload(Consultation.diagnoses).selectinload(ConsultationDiagnosis.diagnosis),
            selectinload(Consultation.prescription),
        )
        .where(Consultation.patient_id == payload.patient_id)
        .order_by(Consultation.created_at.desc())
        .limit(10)  # Chỉ lấy 10 lần khám gần nhất
    )
    consultations = result.scalars().all()
    
    summary_result = await ai_service.summarize_emr(
        db=db, user=current_user,
        patient_id=payload.patient_id,
        consultations=consultations,
    )
    return SummarizeResponse(**summary_result)