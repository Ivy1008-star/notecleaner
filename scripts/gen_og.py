"""
Generate the NoteCleaner Open Graph / Twitter share image (1200x630).

Why this exists: next/og (ImageResponse) crashes on Windows when the project
path contains spaces or non-ASCII characters, because @vercel/og fails to
resolve its bundled default font file URL. A static, hand-rendered PNG is
rock-solid on every deploy and keeps brand text pixel-accurate.

Run:  python scripts/gen_og.py   ->  writes public/og.png
"""
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT = os.path.join(
    BASE, "node_modules", "next", "dist", "compiled", "@vercel", "og",
    "noto-sans-v27-latin-regular.ttf",
)
OUT = os.path.join(BASE, "public", "og.png")

W, H = 1200, 630

# ---- fonts (faux-bold via stroke on headings) ----
def font(size):
    return ImageFont.truetype(FONT, size)

f_logo = font(34)
f_pill = font(16)
f_h1 = font(76)
f_sub = font(28)
f_small = font(20)

# ---- background: diagonal gradient ----
xs = np.linspace(0.0, 1.0, W)
ys = np.linspace(0.0, 1.0, H)
X, Y = np.meshgrid(xs, ys)
t = 0.55 * X + 0.45 * Y
top = np.array([11, 18, 32])      # #0b1220
bottom = np.array([37, 99, 235])  # #2563eb
arr = (top * (1 - t)[..., None] + bottom * t[..., None]).astype(np.uint8)
img = Image.fromarray(arr, "RGB").convert("RGBA")
draw = ImageDraw.Draw(img)

# ---- soft glow, top-right ----
glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
gd = ImageDraw.Draw(glow)
gd.ellipse([680, -180, 1240, 400], fill=(96, 165, 250, 255))
glow = glow.filter(ImageFilter.GaussianBlur(95))
gr, gg, gb, ga = glow.split()
ga = ga.point(lambda a: int(a * 0.5))
glow = Image.merge("RGBA", (gr, gg, gb, ga))
img = Image.alpha_composite(img, glow)
draw = ImageDraw.Draw(img)

WHITE = (255, 255, 255)
BLUE = (147, 197, 253)    # #93c5fd
SUB = (203, 213, 225)     # #cbd5e1
LIGHT = (226, 232, 240)   # #e2e8f0
MUTED = (148, 163, 184)   # #94a3b8
PILL_BORDER = (191, 219, 254)


def text(img_draw, xy, s, fnt, fill, stroke=0, anchor=None):
    img_draw.text(xy, s, font=fnt, fill=fill, stroke_width=stroke,
                  stroke_fill=fill, anchor=anchor)


# ---- top bar: logo + pill ----
draw.ellipse([80, 84, 104, 108], fill=(96, 165, 250))
draw.text((118, 82), "NoteCleaner", font=f_logo, fill=WHITE, stroke_width=1, stroke_fill=WHITE)

pill = "AI TEXT HUMANIZER"
pw = draw.textlength(pill, font=f_pill)
px0, py0, px1, py1 = W - 80 - pw - 34, 80, W - 80, 116
draw.rounded_rectangle([px0, py0, px1, py1], radius=18, outline=PILL_BORDER, width=2)
draw.text(((px0 + px1) / 2, (py0 + py1) / 2), pill, font=f_pill, fill=BLUE, anchor="mm")

# ---- center tagline ----
draw.text((80, 250), "Make AI text sound", font=f_h1, fill=WHITE, stroke_width=2, stroke_fill=WHITE)
draw.text((80, 338), "human.", font=f_h1, fill=BLUE, stroke_width=2, stroke_fill=BLUE)
draw.text((80, 424), "In one click.", font=f_h1, fill=WHITE, stroke_width=2, stroke_fill=WHITE)
draw.text((82, 516), "Bypass AI detectors. Keep your voice.", font=f_sub, fill=SUB)

# ---- bottom bar ----
draw.text((80, 588), "AI draft", font=f_small, fill=MUTED)
draw.text((184, 588), "→", font=f_small, fill=(96, 165, 250))
draw.text((214, 588), "Natural human writing", font=f_small, fill=LIGHT)
draw.text((W - 80, 588), "notecleaner.app", font=f_small, fill=MUTED, anchor="ra")

os.makedirs(os.path.dirname(OUT), exist_ok=True)
img.convert("RGB").save(OUT, "PNG")
print("wrote", OUT)
