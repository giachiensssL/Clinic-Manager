from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

class AuditMiddleware(BaseHTTPMiddleware):
    SKIP_PATHS = ["/health", "/api/docs", "/api/redoc", "/api/openapi.json", "/api/v1/auth/login"]
    
    async def dispatch(self, request: Request, call_next) -> Response:
        # Skip logging for certain paths
        if any(request.url.path.startswith(p) for p in self.SKIP_PATHS):
            return await call_next(request)
        
        # In a real-world scenario, we would extract the user from the token here
        # and log every request to the database. For this implementation,
        # we rely on explicit log_action calls in the API endpoints to capture
        # more specific context (like resource IDs and precise actions).
        
        response = await call_next(request)
        return response