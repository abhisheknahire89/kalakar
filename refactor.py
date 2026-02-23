import os

app_js_path = '/Users/abhishekpravinnahire/Desktop/kalakar.in/app.js'
with open(app_js_path, 'r') as f:
    lines = f.readlines()

def get_lines(start, end):
    # 1-indexed to 0-indexed slicing
    return "".join(lines[start-1:end])

core_js = """// js/components/core.js
""" + get_lines(1, 157) + """
export const translations = """ + get_lines(169, 318)[18:] + """
export """ + get_lines(973, 988) + """
export """ + get_lines(1144, 1182) + """
export const StorageServiceInstance = StorageService;
"""

# Modify StorageService to have export
core_js = core_js.replace("class StorageService", "export class StorageService")

with open('/Users/abhishekpravinnahire/Desktop/kalakar.in/js/components/core.js', 'w') as f:
    f.write(core_js)

print("Created core.js")
