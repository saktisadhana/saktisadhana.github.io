"""Download latin-subset woff2 files for the site's fonts (self-hosting).

Source: google-webfonts-helper (gwfh) API, which serves clean per-weight
latin woff2 slices. Files land in assets/fonts/.

Run from the project root:  python tools/fetch_fonts.py
"""
import json
import os
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "fonts")
os.makedirs(OUT, exist_ok=True)

# (gwfh font id, family slug for filenames, [weights])
FONTS = [
    ("inter", "inter", ["regular", "500", "600", "700"]),
    ("jetbrains-mono", "jetbrains-mono", ["regular", "500"]),
]

UA = {"User-Agent": "Mozilla/5.0"}


def get(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


for font_id, slug, weights in FONTS:
    api = f"https://gwfh.mranftl.com/api/fonts/{font_id}?subsets=latin"
    data = json.loads(get(api))
    by_id = {v["id"]: v for v in data["variants"]}
    for w in weights:
        v = by_id[w]
        weight_num = "400" if w == "regular" else w
        fn = f"{slug}-{weight_num}.woff2"
        with open(os.path.join(OUT, fn), "wb") as f:
            f.write(get(v["woff2"]))
        print("wrote", fn)

print("done")
