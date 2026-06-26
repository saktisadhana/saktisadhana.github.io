"""Generate a centered default OG card (1200x630) in the site's dark/green style.

Logo is placed at the true center so platforms that square-crop (WhatsApp,
iMessage) still show it centered. Depends on tools/_logo.png (render_svg.js).

Run from the project root:
  node tools/render_svg.js && python tools/generate_og.py
"""
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = 1200, 630
BG = (14, 14, 14, 255)
GRID = (26, 26, 26, 255)
GREEN = (61, 220, 132)

img = Image.new("RGBA", (W, H), BG)

# faint grid
g = ImageDraw.Draw(img)
for x in range(0, W + 1, 40):
    g.line([(x, 0), (x, H)], fill=GRID)
for y in range(0, H + 1, 40):
    g.line([(0, y), (W, y)], fill=GRID)

cx, cy = W // 2, 280

# soft green glow behind the logo
glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
ImageDraw.Draw(glow).ellipse(
    [cx - 175, cy - 175, cx + 175, cy + 175], fill=GREEN + (95,)
)
img = Image.alpha_composite(img, glow.filter(ImageFilter.GaussianBlur(110)))

# centered logo
logo = Image.open(os.path.join(ROOT, "tools", "_logo.png")).convert("RGBA")
target_h = 250
scale = target_h / logo.height
logo = logo.resize((round(logo.width * scale), target_h), Image.LANCZOS)
img.alpha_composite(logo, ((W - logo.width) // 2, cy - logo.height // 2))

draw = ImageDraw.Draw(img)


def mono(size, bold=False):
    name = "consolab.ttf" if bold else "consola.ttf"
    try:
        return ImageFont.truetype(f"C:/Windows/Fonts/{name}", size)
    except OSError:
        return ImageFont.truetype("C:/Windows/Fonts/cour.ttf", size)


def centered_text(text, y, font, fill):
    b = draw.textbbox((0, 0), text, font=font)
    draw.text(((W - (b[2] - b[0])) // 2 - b[0], y), text, font=font, fill=fill)


# centered tagline + url
centered_text("blogs · writeups · projects", 470, mono(24), (136, 136, 136))
# divider
draw.line([(cx - 90, 515), (cx + 90, 515)], fill=GREEN + (110,), width=1)
centered_text("saktisadhana.github.io", 535, mono(28, bold=True), GREEN)

img.convert("RGB").save(os.path.join(ROOT, "assets", "og-default.png"))
print("wrote assets/og-default.png")
