import sys, asyncio, json, urllib.request, urllib.error
sys.path.insert(0, '.')
import warnings
warnings.filterwarnings("ignore")

# 1. Login
login_data = json.dumps({"username": "admin", "password": "Admin@123456"}).encode()
req = urllib.request.Request(
    "http://localhost:8000/api/v1/auth/login",
    data=login_data,
    headers={"Content-Type": "application/json"}
)
try:
    with urllib.request.urlopen(req, timeout=10) as r:
        login_resp = json.loads(r.read())
    token = login_resp.get("access_token")
    print(f"Login OK - token: {token[:30]}...")
except Exception as e:
    print(f"Login failed: {e}")
    sys.exit(1)

# 2. Test AI chat stream
import urllib.parse
params = urllib.parse.urlencode({"message": "xin chao"})
req2 = urllib.request.Request(
    f"http://localhost:8000/api/v1/ai/chat/stream?{params}",
    headers={"Authorization": f"Bearer {token}"}
)
try:
    with urllib.request.urlopen(req2, timeout=60) as r:
        content = r.read().decode('utf-8')
        print("STREAM RESPONSE (first 1000 chars):")
        print(content[:1000])
except urllib.error.HTTPError as e:
    body = e.read().decode('utf-8')
    print(f"HTTP Error {e.code}: {body[:500]}")
except Exception as e:
    print(f"Error: {type(e).__name__}: {e}")
