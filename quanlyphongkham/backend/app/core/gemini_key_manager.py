"""
Gemini API Key Manager — Tự động xoay vòng API key khi hết quota hoặc bị rate limit.
"""
import logging
import asyncio
from typing import List, Optional
import google.generativeai as genai

logger = logging.getLogger(__name__)


class GeminiKeyManager:
    """
    Quản lý danh sách Gemini API key và tự động chuyển sang key tiếp theo
    khi gặp lỗi 429 (quota exhausted) hoặc rate limit.
    """

    def __init__(self, keys: List[str]):
        if not keys:
            raise ValueError("Cần ít nhất một Gemini API key")
        self._keys = [k.strip() for k in keys if k.strip()]
        self._current_index = 0
        self._failed_keys: set = set()
        logger.info(f"[GeminiKeyManager] Đã nạp {len(self._keys)} API key(s)")

    @property
    def current_key(self) -> str:
        return self._keys[self._current_index]

    def _is_quota_error(self, e: Exception) -> bool:
        err = str(e).lower()
        return (
            "429" in err
            or "quota" in err
            or "exhausted" in err
            or "resource_exhausted" in err
            or "resourceexhausted" in err
        )

    def rotate(self) -> Optional[str]:
        """
        Đánh dấu key hiện tại là failed và chuyển sang key tiếp theo.
        Trả về key mới hoặc None nếu tất cả đã hết quota.
        """
        self._failed_keys.add(self._keys[self._current_index])
        logger.warning(
            f"[GeminiKeyManager] Key #{self._current_index + 1} hết quota. "
            f"Đang chuyển sang key tiếp theo..."
        )

        # Tìm key tiếp theo chưa fail
        for i in range(len(self._keys)):
            next_index = (self._current_index + 1 + i) % len(self._keys)
            if self._keys[next_index] not in self._failed_keys:
                self._current_index = next_index
                logger.info(
                    f"[GeminiKeyManager] Đã chuyển sang key #{self._current_index + 1}"
                )
                return self._keys[self._current_index]

        logger.error("[GeminiKeyManager] Tất cả API key đã hết quota!")
        return None

    def configure_genai(self):
        """Cấu hình genai với key hiện tại."""
        genai.configure(api_key=self.current_key)

    def reset_failed_keys(self):
        """Reset trạng thái failed (dùng khi quota đã được reset sau 24h)."""
        self._failed_keys.clear()
        self._current_index = 0
        logger.info("[GeminiKeyManager] Đã reset trạng thái tất cả API key")

    async def call_with_rotation(self, coro_factory, max_retries: int = None):
        """
        Gọi một async coroutine. Nếu gặp lỗi quota, tự động rotate key và retry.
        
        Args:
            coro_factory: Callable nhận api_key và trả về coroutine cần thực thi
            max_retries: Số lần thử tối đa (mặc định = số lượng key)
        
        Returns:
            Kết quả từ coroutine hoặc raise exception nếu tất cả key đều fail.
        """
        if max_retries is None:
            max_retries = len(self._keys)

        last_error = None
        for attempt in range(max_retries):
            try:
                self.configure_genai()
                result = await coro_factory(self.current_key)
                return result
            except Exception as e:
                if self._is_quota_error(e):
                    last_error = e
                    new_key = self.rotate()
                    if new_key is None:
                        raise RuntimeError(
                            "Tất cả Gemini API key đã hết quota. Vui lòng thử lại sau."
                        ) from e
                    # Ngắn nghỉ nhỏ trước khi retry
                    await asyncio.sleep(1)
                    continue
                else:
                    raise

        raise RuntimeError(
            f"Đã thử {max_retries} API key nhưng vẫn thất bại."
        ) from last_error

    def call_sync_with_rotation(self, func_factory, max_retries: int = None):
        """
        Phiên bản đồng bộ của call_with_rotation, dùng cho các hàm sync.
        """
        if max_retries is None:
            max_retries = len(self._keys)

        last_error = None
        for attempt in range(max_retries):
            try:
                self.configure_genai()
                return func_factory(self.current_key)
            except Exception as e:
                if self._is_quota_error(e):
                    last_error = e
                    new_key = self.rotate()
                    if new_key is None:
                        raise RuntimeError(
                            "Tất cả Gemini API key đã hết quota. Vui lòng thử lại sau."
                        ) from e
                    continue
                else:
                    raise

        raise RuntimeError(
            f"Đã thử {max_retries} API key nhưng vẫn thất bại."
        ) from last_error


def _build_key_manager() -> GeminiKeyManager:
    """Khởi tạo GeminiKeyManager từ config."""
    from app.core.config import settings

    # Ưu tiên GEMINI_API_KEYS (danh sách), fallback về GEMINI_API_KEY (đơn)
    if settings.GEMINI_API_KEYS:
        keys = [k.strip() for k in settings.GEMINI_API_KEYS.split(",") if k.strip()]
    elif settings.GEMINI_API_KEY:
        keys = [settings.GEMINI_API_KEY]
    else:
        keys = []

    if not keys:
        raise ValueError(
            "Chưa cấu hình GEMINI_API_KEY hoặc GEMINI_API_KEYS trong .env"
        )

    return GeminiKeyManager(keys)


# Singleton instance — dùng chung toàn app
gemini_key_manager: GeminiKeyManager = _build_key_manager()
