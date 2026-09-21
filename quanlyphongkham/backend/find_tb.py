import re

log_path = r'C:\Users\chien\.gemini\antigravity\brain\b72f2494-fe4a-44a5-a278-50c2a727ddff\.system_generated\tasks\task-541.log'
with open(log_path, 'r', encoding='utf-8') as f:
    content = f.read()

# find all tracebacks
tracebacks = re.split(r'Traceback \(most recent call last\):', content)
for i, tb in enumerate(tracebacks):
    if 'POST /api/v1/ai/chat HTTP/1.1" 500' in tb:
        print("TRACEBACK FOR AI CHAT:")
        print(tb.split('INFO:')[0]) # print just the traceback part
