import os
import re

js_file = 'js/data-destinations.js'
img_dir = os.path.join(os.getcwd(), 'img', 'destinations')

with open(js_file, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if "{ name: '" in line:
        # First, strip out the broken image insertion if it exists
        line = re.sub(r", image: '[^']+'", "", line)
        
        # Extract the name
        match = re.search(r"name:\s*'([^']+)'", line)
        if match:
            name = match.group(1)
            slug = name.lower()
            slug = re.sub(r'[^a-z0-9]+', '-', slug).strip('-')
            
            # Check local
            local_img = os.path.join(img_dir, f"{slug}.jpg")
            if os.path.exists(local_img):
                img_url = f"img/destinations/{slug}.jpg"
            else:
                import urllib.parse
                img_url = f"https://loremflickr.com/400/250/{urllib.parse.quote(name)},landmark/all"
            
            # Now append it correctly at the end of the object before },
            # Find the last occurrence of }
            last_brace_idx = line.rfind('}')
            if last_brace_idx != -1:
                line = line[:last_brace_idx] + f", image: '{img_url}' " + line[last_brace_idx:]
    new_lines.append(line)

with open(js_file, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
    
print("Fixed syntax errors in js/data-destinations.js")
