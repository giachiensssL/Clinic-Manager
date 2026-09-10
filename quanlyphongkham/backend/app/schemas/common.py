"""
Pydantic schemas dùng chung — Common Schemas
Cung cấp các base schemas tái sử dụng trên toàn hệ thống
"""
from typing import Generic, List, TypeVar, Optional, Any
from pydantic import BaseModel

# Generic type cho pagination
T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    """Schema phân trang dùng chung cho tất cả danh sách"""
    items: List[T]
    total: int          # Tổng số bản ghi
    page: int           # Trang hiện tại (1-indexed)
    size: int           # Số item mỗi trang
    pages: int          # Tổng số trang

    model_config = {"from_attributes": True}


class MessageResponse(BaseModel):
    """Response đơn giản chứa thông điệp thành công"""
    message: str


class ErrorResponse(BaseModel):
    """Schema chuẩn trả về lỗi từ API"""
    error: str
    detail: Optional[Any] = None


class DeleteResponse(BaseModel):
    """Response khi xóa thành công"""
    message: str
    deleted_id: str


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    database: str
    version: str
