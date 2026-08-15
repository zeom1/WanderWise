import os
import re
import urllib.request
import urllib.parse
import time

js_file = 'js/data-destinations.js'
img_dir = os.path.join(os.getcwd(), 'img', 'destinations')

with open(js_file, 'r', encoding='utf-8') as f:
    content = f.read()

destinations = []
for match in re.finditer(r"name:\s*'([^']+)',\s*country:\s*'([^']+)'(.*?)(image:\s*'https://loremflickr.com[^']+')", content):
    destinations.append({
        'name': match.group(1),
        'country': match.group(2),
        'old_prop': match.group(4)
    })

def slugify(text):
    return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')

def download_image(url, save_path):
    try:
        # LoremFlickr redirects to the actual image
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=15) as response, open(save_path, 'wb') as out_file:
            out_file.write(response.read())
        return True
    except Exception as e:
        print(f"Error downloading {url}: {e}")
        return False

new_content = content
print(f"Fetching {len(destinations)} remaining images from LoremFlickr...")

for dest in destinations:
    name = dest['name']
    country = dest['country']
    slug = slugify(name)
    save_path = os.path.join(img_dir, f"{slug}.jpg")
    
    # Use 1000x600 for high quality
    encoded_name = urllib.parse.quote(name)
    img_url = f"https://loremflickr.com/1000/600/{encoded_name},travel/all"
    
    print(f"Downloading {name}...")
    if download_image(img_url, save_path):
        # Update js content
        new_prop = f"image: 'img/destinations/{slug}.jpg'"
        dest_block_pattern = r"(name:\s*'" + re.escape(name) + r"'.*?)" + re.escape(dest['old_prop'])
        new_content = re.sub(dest_block_pattern, r"\1" + new_prop, new_content, count=1, flags=re.DOTALL)
    
    time.sleep(1) # Be gentle

with open(js_file, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Finished fetching remaining images.")
