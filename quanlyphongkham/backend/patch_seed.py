import os
import re

with open("seed_patient_demo.py", "r", encoding="utf-8") as f:
    content = f.read()

# Replace the target username
content = content.replace('User.username == "patient"', 'User.username == "minh.doan@ictu.edu.vn"')

with open("seed_patient_demo.py", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated seed_patient_demo.py to use user minh.doan@ictu.edu.vn")
