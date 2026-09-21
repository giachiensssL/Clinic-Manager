import sqlite3
conn = sqlite3.connect('clinic.db')
cursor = conn.cursor()
cursor.execute("SELECT username, hashed_password FROM users WHERE username='admin'")
row = cursor.fetchone()
print(row)
