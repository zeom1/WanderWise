import os
import re

js_file = 'js/data-destinations.js'
img_dir = os.path.join(os.getcwd(), 'img', 'destinations')

with open(js_file, 'r', encoding='utf-8') as f:
    content = f.read()

def replacer(match):
    name = match.group(1)
    slug = name.lower()
    slug = re.sub(r'[^a-z0-9]+', '-', slug).strip('-')
    
    # Check if local image exists
    local_img = os.path.join(img_dir, f"{slug}.jpg")
    if os.path.exists(local_img):
        img_url = f"img/destinations/{slug}.jpg"
    else:
        # Use LoremFlickr for real photos as a fallback
        import urllib.parse
        encoded_name = urllib.parse.quote(name)
        img_url = f"https://loremflickr.com/400/250/{encoded_name},landmark/all"
        
    # Append the image property to the object
    original = match.group(0)
    return original + f", image: '{img_url}'"

# Match { name: '...', ... } up to the tip
new_content = re.sub(r"\{\s*name:\s*'([^']+)'(.*?tip:\s*'[^']+')", replacer, content, flags=re.DOTALL)

with open(js_file, 'w', encoding='utf-8') as f:
    f.write(new_content)
    
print("Updated js/data-destinations.js with image URLs")
