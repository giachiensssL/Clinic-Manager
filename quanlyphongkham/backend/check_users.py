import sys, asyncio, sqlite3
sys.path.insert(0, '.')
import warnings
warnings.filterwarnings("ignore")

# Read users from SQLite
conn = sqlite3.connect('clinic.db')
cur = conn.cursor()
cur.execute("SELECT username, role, is_active FROM users LIMIT 20")
rows = cur.fetchall()
conn.close()

print("Users in database:")
for row in rows:
    username, role, active = row
    print(f"  username={username!r}, role={role!r}, active={active}")
