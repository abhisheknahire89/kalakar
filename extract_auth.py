import os
import re

app_js_path = '/Users/abhishekpravinnahire/Desktop/kalakar.in/app.js'
with open(app_js_path, 'r') as f:
    content = f.read()

# Lines to extract for auth.js:
# 1047 - 1141: ONBOARDING WIZARD
# 1359 - 1487: Supabase Authentication Flow

# Function to extract lines
def extract_lines(start, end):
    lines = content.split('\n')
    return "\n".join(lines[start-1:end]) + "\n"

auth_js = """import { StorageServiceInstance as StorageService, setView } from './core.js';
import { renderStage } from './feed.js';

"""

auth_js += extract_lines(1047, 1141)
auth_js += extract_lines(1359, 1487)

# We want to export checkOnboarding
auth_js = auth_js.replace("function checkOnboarding()", "export function checkOnboarding()")

with open('/Users/abhishekpravinnahire/Desktop/kalakar.in/js/components/auth.js', 'w') as f:
    f.write(auth_js)

print("Created auth.js")
