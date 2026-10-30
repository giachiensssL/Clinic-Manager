import sys
sys.path.insert(0, '.')
from app.services.ai_tool_registry import ai_tool_registry
from app.services.ai_context_service import ai_context_service
from app.models.models import UserRole

for role in [UserRole.PATIENT, UserRole.DOCTOR, UserRole.RECEPTIONIST, UserRole.ACCOUNTANT, UserRole.ADMIN]:
    allowed = ai_context_service.get_allowed_tools(role)
    missing = [t for t in allowed if t not in ai_tool_registry.tools]
    missing_str = "none" if not missing else str(missing)
    print(f'Role {role.value}: {len(allowed)} tools, missing: {missing_str}')
