import os

wrapper = """import React from 'react';
import { UnifiedAIChatSystem } from '@/components/ai/unified';

export default function {COMPONENT_NAME}() {
  return <UnifiedAIChatSystem />;
}
"""

targets = {
    "src/pages/receptionist/ReceptionistAI.tsx": "ReceptionistAI",
    "src/pages/doctor/DoctorAIAssistant.tsx": "DoctorAIAssistant",
    "src/pages/admin/AIAdminWorkspace.tsx": "AIAdminWorkspace",
    "src/pages/portal/ai/PatientAIAssistant.tsx": "PatientAIAssistant"
}

for path, component_name in targets.items():
    if os.path.exists(path):
        with open(path, "w", encoding="utf-8") as f:
            f.write(wrapper.replace("{COMPONENT_NAME}", component_name))

print("done wrapping components")
