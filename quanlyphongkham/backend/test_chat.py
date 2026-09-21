import requests
import json

r = requests.post('http://127.0.0.1:8000/api/v1/auth/login', json={'username':'admin','password':'password'})
if 'access_token' not in r.json():
    print("FAILED LOGIN. Trying admin/admin...")
    r = requests.post('http://127.0.0.1:8000/api/v1/auth/login', json={'username':'admin','password':'admin'})

if 'access_token' not in r.json():
    print("FAILED LOGIN. Try admin123...")
    r = requests.post('http://127.0.0.1:8000/api/v1/auth/login', json={'username':'admin','password':'admin123'})

if 'access_token' in r.json():
    token = r.json()['access_token']
    print("LOGIN SUCCESS!")
    res = requests.post('http://127.0.0.1:8000/api/v1/ai/chat', headers={'Authorization': 'Bearer '+token}, json={'message': 'Hôm nay có những bác sĩ nào làm việc?'})
    print('STATUS:', res.status_code)
    try:
        print(res.json())
    except:
        print(res.text)
else:
    print("ALL LOGIN FAILED.")
    print(r.text)
