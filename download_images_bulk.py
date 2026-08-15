import os
import re
import urllib.request
import urllib.parse
import json
import time

def slugify(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')

# Read destinations from the JS file
js_file_path = 'js/data-destinations.js'
with open(js_file_path, 'r', encoding='utf-8') as f:
    content = f.read()

destinations = []
for item_match in re.finditer(r"\{\s*name:\s*'([^']+)',\s*country:\s*'([^']+)'", content):
    name = item_match.group(1)
    country = item_match.group(2)
    destinations.append({'name': name, 'country': country, 'slug': slugify(name)})

img_dir = os.path.join(os.getcwd(), 'img', 'destinations')
os.makedirs(img_dir, exist_ok=True)

def download_image(url, save_path):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
        with urllib.request.urlopen(req) as response, open(save_path, 'wb') as out_file:
            out_file.write(response.read())
        return True
    except Exception as e:
        print(f"Error downloading {url}: {e}")
        return False

# Group into chunks of 40
chunks = [destinations[i:i + 40] for i in range(0, len(destinations), 40)]

for chunk in chunks:
    titles = [d['name'] for d in chunk]
    titles_str = "|".join(titles)
    encoded_titles = urllib.parse.quote(titles_str)
    
    api_url = f"https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&titles={encoded_titles}&pithumbsize=600&format=json&redirects=1"
    
    try:
        req = urllib.request.Request(api_url, headers={'User-Agent': 'WanderwiseBot/2.0'})
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            
        pages = data.get('query', {}).get('pages', {})
        
        # Create a mapping of normalized titles
        normalized = {}
        for n in data.get('query', {}).get('normalized', []):
            normalized[n['to']] = n['from']
        for r in data.get('query', {}).get('redirects', []):
            normalized[r['to']] = r['from']
            
        for page_id, page_data in pages.items():
            title = page_data.get('title')
            # Map back to original name if it was normalized/redirected
            original_title = title
            while original_title in normalized:
                original_title = normalized[original_title]
                
            # Find the destination
            dest = next((d for d in chunk if d['name'].lower() == original_title.lower()), None)
            if not dest:
                # Try direct title match just in case
                dest = next((d for d in chunk if d['name'].lower() == title.lower()), None)
            
            if dest and 'thumbnail' in page_data:
                img_url = page_data['thumbnail']['source']
                save_path = os.path.join(img_dir, f"{dest['slug']}.jpg")
                if not os.path.exists(save_path):
                    print(f"Downloading {dest['name']}...")
                    download_image(img_url, save_path)
                    time.sleep(0.3)
            elif dest:
                print(f"No image found for {dest['name']}")
                
    except Exception as e:
        print(f"Error fetching chunk: {e}")
        
    time.sleep(1)

# For any missing ones, try searching by name + country
missing = [d for d in destinations if not os.path.exists(os.path.join(img_dir, f"{d['slug']}.jpg"))]
print(f"Missing images for {len(missing)} destinations. Attempting search fallback...")

for dest in missing:
    query = urllib.parse.quote(f"{dest['name']} {dest['country']}")
    api_url = f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={query}&utf8=&format=json&srlimit=1"
    try:
        req = urllib.request.Request(api_url, headers={'User-Agent': 'WanderwiseBot/2.0'})
        with urllib.request.urlopen(req) as response:
            search_data = json.loads(response.read().decode())
            if search_data['query']['search']:
                title = search_data['query']['search'][0]['title']
                img_api = f"https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&titles={urllib.parse.quote(title)}&pithumbsize=600&format=json"
                
                req2 = urllib.request.Request(img_api, headers={'User-Agent': 'WanderwiseBot/2.0'})
                with urllib.request.urlopen(req2) as resp2:
                    img_data = json.loads(resp2.read().decode())
                    pages = img_data.get('query', {}).get('pages', {})
                    for pid, pdata in pages.items():
                        if 'thumbnail' in pdata:
                            print(f"Fallback downloaded {dest['name']}")
                            download_image(pdata['thumbnail']['source'], os.path.join(img_dir, f"{dest['slug']}.jpg"))
                            break
    except Exception as e:
        print(f"Fallback failed for {dest['name']}: {e}")
    time.sleep(0.5)

print("Done getting real images!")
