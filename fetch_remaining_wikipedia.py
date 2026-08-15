import os
import re
import urllib.request
import urllib.parse
import json
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
        req = urllib.request.Request(url, headers={'User-Agent': 'WanderwiseBot/3.0 (Windows)'})
        with urllib.request.urlopen(req, timeout=15) as response, open(save_path, 'wb') as out_file:
            out_file.write(response.read())
        return True
    except Exception as e:
        print(f"Error downloading {url}: {e}")
        return False

new_content = content
print(f"Fetching images for {len(destinations)} remaining destinations from Wikipedia...")

for dest in destinations:
    name = dest['name']
    country = dest['country']
    slug = slugify(name)
    save_path = os.path.join(img_dir, f"{slug}.jpg")
    
    # Search for the best Wikipedia page
    query = urllib.parse.quote(f"{name} {country}")
    search_url = f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={query}&utf8=&format=json&srlimit=1"
    
    try:
        req = urllib.request.Request(search_url, headers={'User-Agent': 'WanderwiseBot/3.0'})
        with urllib.request.urlopen(req) as resp:
            search_data = json.loads(resp.read().decode())
            
        if search_data['query']['search']:
            title = search_data['query']['search'][0]['title']
            
            # Get the high res image for that page
            img_url_api = f"https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&titles={urllib.parse.quote(title)}&pithumbsize=1000&format=json"
            req2 = urllib.request.Request(img_url_api, headers={'User-Agent': 'WanderwiseBot/3.0'})
            with urllib.request.urlopen(req2) as resp2:
                img_data = json.loads(resp2.read().decode())
                
            pages = img_data.get('query', {}).get('pages', {})
            img_url = None
            for pid, pdata in pages.items():
                if 'thumbnail' in pdata:
                    img_url = pdata['thumbnail']['source']
                    break
            
            if img_url:
                print(f"Found image for {name} ({title})")
                if download_image(img_url, save_path):
                    # Update js content
                    new_prop = f"image: 'img/destinations/{slug}.jpg'"
                    dest_block_pattern = r"(name:\s*'" + re.escape(name) + r"'.*?)" + re.escape(dest['old_prop'])
                    new_content = re.sub(dest_block_pattern, r"\1" + new_prop, new_content, count=1, flags=re.DOTALL)
            else:
                print(f"No image on page for {name}")
        else:
            print(f"No search results for {name}")
            
    except Exception as e:
        print(f"API Error for {name}: {e}")
        
    time.sleep(2) # 2 seconds to avoid 429 Too Many Requests

with open(js_file, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Finished fetching remaining images.")
