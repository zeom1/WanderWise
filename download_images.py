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

# Extract destinations using regex
destinations = []
match = re.search(r'const\s+DESTINATIONS\s*=\s*\[(.*?)\];', content, re.DOTALL)
if match:
    # A bit hacky but works for the format
    dest_str = match.group(1)
    # Find all { name: '...' } blocks
    for item_match in re.finditer(r"\{\s*name:\s*'([^']+)',\s*country:\s*'([^']+)'", dest_str):
        name = item_match.group(1)
        country = item_match.group(2)
        destinations.append({'name': name, 'country': country, 'slug': slugify(name)})

print(f"Found {len(destinations)} destinations.")

# Create images directory
img_dir = os.path.join(os.getcwd(), 'img', 'destinations')
os.makedirs(img_dir, exist_ok=True)

def search_wikipedia_image(query):
    try:
        search_url = f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={urllib.parse.quote(query)}&utf8=&format=json&srlimit=1"
        req = urllib.request.Request(search_url, headers={'User-Agent': 'WanderwiseBot/1.0'})
        with urllib.request.urlopen(req) as response:
            search_data = json.loads(response.read().decode())
            if search_data['query']['search']:
                title = search_data['query']['search'][0]['title']
                summary_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{urllib.parse.quote(title)}"
                req2 = urllib.request.Request(summary_url, headers={'User-Agent': 'WanderwiseBot/1.0'})
                with urllib.request.urlopen(req2) as response2:
                    summary_data = json.loads(response2.read().decode())
                    if 'originalimage' in summary_data:
                        return summary_data['originalimage']['source']
    except Exception as e:
        print(f"Error fetching image for {query}: {e}")
    return None

def download_image(url, save_path):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response, open(save_path, 'wb') as out_file:
            data = response.read()
            out_file.write(data)
        return True
    except Exception as e:
        print(f"Error downloading {url}: {e}")
        return False

# Download images
for dest in destinations:
    slug = dest['slug']
    save_path = os.path.join(img_dir, f"{slug}.jpg")
    
    if os.path.exists(save_path):
        print(f"[{dest['name']}] Image already exists.")
        continue
        
    print(f"Fetching image for {dest['name']} ({dest['country']})...")
    
    # Try name + country first
    img_url = search_wikipedia_image(f"{dest['name']} {dest['country']}")
    if not img_url:
        # Try just the name
        img_url = search_wikipedia_image(dest['name'])
        
    if img_url:
        print(f"Found image: {img_url}")
        success = download_image(img_url, save_path)
        if success:
            print(f"Successfully downloaded {slug}.jpg")
        else:
            print(f"Failed to download image for {dest['name']}")
    else:
        print(f"No image found on Wikipedia for {dest['name']}")
    
    time.sleep(0.5) # Be nice to the API

print("Finished downloading images!")
