import sqlite3

db = sqlite3.connect("backend/clinic.db")
try:
    db.execute("ALTER TABLE patients ADD COLUMN medical_history TEXT;")
    print("Added medical_history to patients")
except Exception as e:
    print(e)
    
db.commit()
db.close()
