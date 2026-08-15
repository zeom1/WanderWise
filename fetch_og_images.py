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
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as response, open(save_path, 'wb') as out_file:
            out_file.write(response.read())
        return True
    except Exception as e:
        print(f"Error downloading {url}: {e}")
        return False

# Mapping of tricky destinations to their exact Wikipedia article titles
wiki_map = {
    'Norway': 'Norway',
    'Swiss Alps': 'Swiss_Alps',
    'Spiti': 'Spiti_Valley',
    'Meghalaya': 'Meghalaya',
    'Auli': 'Auli',
    'Interlaken': 'Interlaken',
    'Queenstown': 'Queenstown,_New_Zealand',
    'Seychelles': 'Seychelles',
    'Jim Corbett': 'Jim_Corbett_National_Park',
    'Luang Prabang': 'Luang_Prabang',
    'Jeju': 'Jeju_Province',
    'Hong Kong': 'Hong_Kong',
    'Paro': 'Paro,_Bhutan',
    'Ella': 'Ella,_Sri_Lanka',
    'Cinque Terre': 'Cinque_Terre',
    'Bruges': 'Bruges',
    'Salzburg': 'Salzburg',
    'Copenhagen': 'Copenhagen',
    'Iguazu Falls': 'Iguazu_Falls',
    'Great Ocean Road': 'Great_Ocean_Road'
}

print(f"Fetching {len(destinations)} images via Wikipedia og:image...")

new_content = content

for dest in destinations:
    name = dest['name']
    slug = slugify(name)
    save_path = os.path.join(img_dir, f"{slug}.jpg")
    
    wiki_title = wiki_map.get(name)
    if not wiki_title:
        wiki_title = urllib.parse.quote(name)
        
    url = f"https://en.wikipedia.org/wiki/{wiki_title}"
    print(f"Checking {url}")
    
    success = False
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            
        og_image_match = re.search(r'<meta property="og:image" content="(.*?)"', html)
        if og_image_match:
            img_url = og_image_match.group(1)
            print(f"  Found image: {img_url}")
            if download_image(img_url, save_path):
                success = True
    except Exception as e:
        print(f"  Failed to scrape {name}: {e}")
        
    if success:
        new_prop = f"image: 'img/destinations/{slug}.jpg'"
        dest_block_pattern = r"(name:\s*'" + re.escape(name) + r"'.*?)" + re.escape(dest['old_prop'])
        new_content = re.sub(dest_block_pattern, r"\1" + new_prop, new_content, count=1, flags=re.DOTALL)
        
    time.sleep(1)

with open(js_file, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Done checking og:images.")
