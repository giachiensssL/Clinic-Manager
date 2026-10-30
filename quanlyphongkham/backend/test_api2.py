import sys, asyncio, json, urllib.request, urllib.error
sys.path.insert(0, '.')
import warnings
warnings.filterwarnings("ignore")

# Try different credentials
credentials = [
    ("admin", "Admin@123456"),
    ("admin", "admin123"),
    ("admin", "Admin123"),
    ("admin", "password"),
    ("admin", "123456"),
]

token = None
for username, password in credentials:
    login_data = json.dumps({"username": username, "password": password}).encode()
    req = urllib.request.Request(
        "http://localhost:8000/api/v1/auth/login",
        data=login_data,
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            login_resp = json.loads(r.read())
        token = login_resp.get("access_token")
        print(f"Login OK with {username}/{password} - token: {token[:30]}...")
        break
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8', errors='replace')
        print(f"Failed {username}/{password}: {e.code} {body[:100]}")
    except Exception as e:
        print(f"Error: {e}")

if not token:
    print("All credentials failed!")
    sys.exit(1)

# Test AI chat stream
import urllib.parse
params = urllib.parse.urlencode({"message": "xin chao"})
req2 = urllib.request.Request(
    f"http://localhost:8000/api/v1/ai/chat/stream?{params}",
    headers={"Authorization": f"Bearer {token}"}
)
print("\nTesting AI chat stream...")
try:
    with urllib.request.urlopen(req2, timeout=60) as r:
        content = r.read().decode('utf-8', errors='replace')
        print("STREAM RESPONSE (first 2000 chars):")
        print(content[:2000])
except urllib.error.HTTPError as e:
    body = e.read().decode('utf-8', errors='replace')
    print(f"HTTP Error {e.code}: {body[:500]}")
except Exception as e:
    print(f"Error: {type(e).__name__}: {e}")
