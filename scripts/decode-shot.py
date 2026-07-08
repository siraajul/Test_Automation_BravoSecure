#!/usr/bin/env python3
"""Decode an appium-mcp screenshot/tool-result JSON file into a PNG.
Usage: decode-shot.py <input.txt> <output.png>
"""
import sys, json, base64, re

f, out = sys.argv[1], sys.argv[2]
data = open(f).read()
b64 = None
try:
    arr = json.loads(data)
    for item in arr:
        t = item.get('text', '') if isinstance(item, dict) else ''
        m = re.search(r'data:image/png;base64,([A-Za-z0-9+/=]+)', t)
        if m:
            b64 = m.group(1); break
        if len(t) > 1000 and re.fullmatch(r'[A-Za-z0-9+/=\s]+', t.strip()):
            b64 = t.strip(); break
except Exception:
    pass
if not b64:
    m = re.search(r'([A-Za-z0-9+/]{500,}={0,2})', data)
    b64 = m.group(1) if m else None
if not b64:
    print("NO_B64"); sys.exit(1)
open(out, 'wb').write(base64.b64decode(b64))
print("WROTE", out)
