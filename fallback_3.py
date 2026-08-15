import os
import re

js_file = 'js/data-destinations.js'

with open(js_file, 'r', encoding='utf-8') as f:
    content = f.read()

def update_dest(name, slug):
    global content
    dest_pattern = r"(name:\s*'" + re.escape(name) + r"'.*?image:\s*')https://loremflickr.com[^']+'"
    content = re.sub(dest_pattern, r"\1img/destinations/" + f"{slug}.jpg'", content, count=1, flags=re.DOTALL)

update_dest('Swiss Alps', 'swiss-alps')
update_dest('Auli', 'auli')
update_dest('Copenhagen', 'copenhagen')

with open(js_file, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated JS file")
