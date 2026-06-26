"""Build the raster favicon set from tools/_logo.png (produced by render_svg.js).

Outputs (in assets/):
  apple-touch-icon.png  180x180, logo centered on opaque #0e0e0e
  favicon-32.png        32x32 transparent
  favicon.ico           multi-size 16/32/48 transparent

Run from the project root:  python tools/generate_icons.py
"""
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "assets")
LOGO = os.path.join(os.path.dirname(os.path.abspath(__file__)), "_logo.png")

BG = (14, 14, 14, 255)  # #0e0e0e


def fit(logo, box):
    """Return logo scaled so its largest side == box (keeps aspect, RGBA)."""
    w, h = logo.size
    scale = box / max(w, h)
    return logo.resize((max(1, round(w * scale)), max(1, round(h * scale))), Image.LANCZOS)


def centered(logo, canvas_size, bg=None):
    canvas = Image.new("RGBA", (canvas_size, canvas_size), bg or (0, 0, 0, 0))
    lw, lh = logo.size
    canvas.alpha_composite(logo, ((canvas_size - lw) // 2, (canvas_size - lh) // 2))
    return canvas


logo = Image.open(LOGO).convert("RGBA")

# apple-touch-icon: logo on opaque dark square, comfortable padding
apple = centered(fit(logo, 132), 180, bg=BG).convert("RGB")
apple.save(os.path.join(ASSETS, "apple-touch-icon.png"))

# favicon-32: transparent
fav32 = centered(fit(logo, 30), 32)
fav32.save(os.path.join(ASSETS, "favicon-32.png"))

# favicon.ico: multi-size from a clean 48 render
fav48 = centered(fit(logo, 46), 48)
fav48.save(os.path.join(ASSETS, "favicon.ico"), sizes=[(16, 16), (32, 32), (48, 48)])

print("wrote apple-touch-icon.png, favicon-32.png, favicon.ico")
