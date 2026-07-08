#!/usr/bin/env bash
S="${ANDROID_DEVICE:-192.168.10.192:33789}"
NAME="${1:-dump}"
adb -s "$S" shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1
adb -s "$S" pull /sdcard/ui.xml ".explore/${NAME}.xml" >/dev/null 2>&1
# Print all content-desc, text, resource-id + bounds for clickable nodes
python3 - ".explore/${NAME}.xml" <<'PY'
import sys, re
xml = open(sys.argv[1], encoding='utf-8', errors='ignore').read()
nodes = re.findall(r'<node[^>]*>', xml)
print(f"-- {len(nodes)} nodes --")
for n in nodes:
    cd = re.search(r'content-desc="([^"]*)"', n)
    tx = re.search(r'text="([^"]*)"', n)
    ri = re.search(r'resource-id="([^"]*)"', n)
    cl = re.search(r'clickable="(true)"', n)
    bd = re.search(r'bounds="([^"]*)"', n)
    desc = (cd.group(1) if cd else '') or (tx.group(1) if tx else '')
    rid = ri.group(1) if ri else ''
    if desc or rid or cl:
        flag = '🔘' if cl else '  '
        print(f"{flag} desc={desc!r:40} id={rid:35} {bd.group(1) if bd else ''}")
PY
