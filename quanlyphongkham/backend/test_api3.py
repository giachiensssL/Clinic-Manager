import sys, json, urllib.request, urllib.error, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
import warnings
warnings.filterwarnings("ignore")

def post_json(url, data_dict):
    data = json.dumps(data_dict).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8', errors='replace')
        return e.code, {"error": body[:300]}

# Try logins
for u, p in [("admin", "Admin@123456"), ("admin", "admin123"), ("patient", "Patient@123456"), ("patient", "patient123")]:
    code, resp = post_json("http://localhost:8000/api/v1/auth/login", {"username": u, "password": p})
    if code == 200:
        token = resp.get("access_token", "")
        print(f"LOGIN OK: {u}/{p}")
        print(f"Token: {token[:50]}...")

        # Test AI chat
        import urllib.parse
        params = urllib.parse.urlencode({"message": "xin chao"})
        req2 = urllib.request.Request(
            f"http://localhost:8000/api/v1/ai/chat/stream?{params}",
            headers={"Authorization": f"Bearer {token}"}
        )
        try:
            with urllib.request.urlopen(req2, timeout=60) as r:
                content = r.read().decode('utf-8', errors='replace')
                print("STREAM RESPONSE:")
                print(content[:3000])
        except urllib.error.HTTPError as e:
            body = e.read().decode('utf-8', errors='replace')
            print(f"AI ERROR {e.code}: {body[:500]}")
        break
    else:
        print(f"FAILED {u}/{p}: {code} - {resp.get('error', '')[:100]}")
