import urllib.request
import re

req = urllib.request.Request('https://chinhsachcuocsong.vnanet.vn/hieu-qua-tu-so-hoa-benh-an-dien-tu/19842.html', headers={'User-Agent': 'Mozilla/5.0'})
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
