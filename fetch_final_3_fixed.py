import os
import re
import urllib.request
import time

js_file = 'js/data-destinations.js'
img_dir = os.path.join(os.getcwd(), 'img', 'destinations')

manual_urls = {
    'Swiss Alps': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Matterhorn_from_Domh%C3%BCtte_-_2.jpg/1280px-Matterhorn_from_Domh%C3%BCtte_-_2.jpg',
    'Auli': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Auli_in_Winter.jpg/1280px-Auli_in_Winter.jpg',
    'Copenhagen': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Copenhagen_Nyhavn.jpg/1280px-Copenhagen_Nyhavn.jpg'
}

with open(js_file, 'r', encoding='utf-8') as f:
    content = f.read()

def slugify(text):
    return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')

new_content = content

for name, url in manual_urls.items():
    slug = slugify(name)
    save_path = os.path.join(img_dir, f"{slug}.jpg")
    
    print(f"Downloading {name}...")
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as response, open(save_path, 'wb') as out_file:
            out_file.write(response.read())
            
        # Update js
        dest_pattern = r"(name:\s*'" + re.escape(name) + r"'.*?image:\s*')https://loremflickr.com[^']+'"
        new_content = re.sub(dest_pattern, r"\1img/destinations/" + f"{slug}.jpg'", new_content, count=1, flags=re.DOTALL)
        print(f"Updated {name}")
    except Exception as e:
        print(f"Failed {name}: {e}")
        
    time.sleep(2)

with open(js_file, 'w', encoding='utf-8') as f:
    f.write(new_content)
    
print("All done!")
