import urllib.request
import re

url = 'https://vttechsolution.com/chi-tiet-ban-tin/bat-mi-5-cach-giup-ban-van-hanh-va-quan-ly-phong-kham-hieu-qua'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    html = urllib.request.urlopen(req).read().decode('utf-8', errors='ignore')
    match = re.search(r'property=["\']og:image["\']\s+content=["\']([^"\']+)["\']', html)
    if match:
        print(match.group(1))
    else:
        match = re.search(r'content=["\']([^"\']+)["\']\s+property=["\']og:image["\']', html)
        if match:
            print(match.group(1))
        else:
            print("No og:image found")
except Exception as e:
    print(e)
