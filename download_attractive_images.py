import os
import re
import urllib.request
import urllib.parse
from duckduckgo_search import DDGS
import time

js_file = 'js/data-destinations.js'
img_dir = os.path.join(os.getcwd(), 'img', 'destinations')
os.makedirs(img_dir, exist_ok=True)

with open(js_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Find all destinations that still use loremflickr
# Format: { name: '...', ..., image: 'https://loremflickr.com/...' }
destinations = []
for match in re.finditer(r"name:\s*'([^']+)',\s*country:\s*'([^']+)'(.*?)(image:\s*'https://loremflickr.com[^']+')", content):
    name = match.group(1)
    country = match.group(2)
    img_prop = match.group(4)
    destinations.append({'name': name, 'country': country, 'img_prop': img_prop})

def slugify(text):
    text = text.lower()
    return re.sub(r'[^a-z0-9]+', '-', text).strip('-')

ddgs = DDGS()

def download_image(url, save_path):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as response, open(save_path, 'wb') as out_file:
            out_file.write(response.read())
        return True
    except Exception as e:
        print(f"Error downloading {url}: {e}")
        return False

print(f"Found {len(destinations)} places missing local images.")

new_content = content
count = 0
for dest in destinations:
    name = dest['name']
    country = dest['country']
    slug = slugify(name)
    save_path = os.path.join(img_dir, f"{slug}.jpg")
    
    print(f"Searching for {name}, {country}...")
    query = f"{name} {country} beautiful travel photography landmark"
    
    success = False
    try:
        results = list(ddgs.images(query, max_results=3))
        for res in results:
            img_url = res.get('image')
            if img_url:
                print(f"  Found image: {img_url}")
                if download_image(img_url, save_path):
                    success = True
                    break
    except Exception as e:
        print(f"Search failed for {name}: {e}")
        
    if success:
        # Update js/data-destinations.js content in memory
        old_prop = dest['img_prop']
        new_prop = f"image: 'img/destinations/{slug}.jpg'"
        
        # Be careful to only replace this specific destination's property
        # Find the block for this destination
        dest_block_pattern = r"(name:\s*'" + re.escape(name) + r"'.*?)" + re.escape(old_prop)
        new_content = re.sub(dest_block_pattern, r"\1" + new_prop, new_content, count=1, flags=re.DOTALL)
        count += 1
    
    time.sleep(1.5) # Be gentle to DDG

with open(js_file, 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f"Successfully downloaded and updated {count} images.")
