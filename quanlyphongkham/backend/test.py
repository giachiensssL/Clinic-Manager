import sqlite3; conn = sqlite3.connect('clinic.db'); print(conn.execute('SELECT id, username FROM users').fetchone())
