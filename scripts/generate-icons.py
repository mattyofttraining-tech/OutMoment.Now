# OurMoment icon pipeline.
#
# Source of truth: the 3D squircle render on the Desktop ("OurMoment Logo.png",
# 516x516 RGBA). Produces every icon the app + PWA + ads need:
#
#   assets/images/icon.png            1024  full-bleed (gradient to the edges; the
#                                           OS applies its own corner mask)
#   assets/images/adaptive-icon.png   1024  emblem at 66% on transparent (Android
#                                           adaptive foreground; bg color in app.json)
#   assets/images/favicon.png           64  squircle silhouette, transparent
#   public/icons/icon-192.png          192  full-bleed (PWA "any")
#   public/icons/icon-512.png          512  full-bleed (PWA "any")
#   public/icons/icon-maskable-192.png 192  emblem at 66% on brand gradient
#   public/icons/icon-maskable-512.png 512  emblem at 66% on brand gradient
#   public/icons/apple-touch-icon.png  180  full-bleed
#   Desktop/OurMoment-Brand/           ad/brand kit (squircle, full-bleed, lockup)
#
# Run from repo root:  python scripts/generate-icons.py

import os
import shutil
from PIL import Image, ImageOps

DESKTOP = r"C:\Users\Matty\Desktop"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(DESKTOP, "OurMoment Logo.png")
LOCKUP = os.path.join(DESKTOP, "OurMoment pt-1.png")
LOCKUP_T = os.path.join(DESKTOP, "OurMoment Logo PT1.png")

ASSETS = os.path.join(ROOT, "assets", "images")
PUBLIC_ICONS = os.path.join(ROOT, "public", "icons")
BRAND = os.path.join(DESKTOP, "OurMoment-Brand")

os.makedirs(PUBLIC_ICONS, exist_ok=True)
os.makedirs(BRAND, exist_ok=True)

master = Image.open(SRC).convert("RGBA")

# ── Trim to the solid squircle (drop the soft shadow margin) ────────────────
# Threshold the alpha hard so the bbox hugs the opaque squircle, not the shadow.
alpha = master.split()[3].point(lambda a: 255 if a > 230 else 0)
bbox = alpha.getbbox()
squircle = master.crop(bbox)
# Square it up (renders can be off by a pixel or two).
side = max(squircle.size)
sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
sq.paste(squircle, ((side - squircle.size[0]) // 2, (side - squircle.size[1]) // 2))

print(f"master {master.size}, squircle bbox {bbox} -> {sq.size}")

# ── Sample brand colors from the gradient for synthesized backgrounds ───────
probe = sq.resize((100, 100), Image.LANCZOS).convert("RGB")
c_top = probe.getpixel((50, 12))      # upper gradient (lavender/blue)
c_mid = probe.getpixel((10, 50))      # mid tone — sampled at the edge, clear of the gold emblem
c_bottom = probe.getpixel((50, 88))   # lower gradient (peach/coral)
print(f"brand colors top={c_top} mid={c_mid} bottom={c_bottom}")


def gradient_bg(size: int) -> Image.Image:
    """Vertical brand gradient matching the icon artwork."""
    col = Image.new("RGB", (1, 256))
    for y in range(256):
        t = y / 255
        if t < 0.5:
            a, b, f = c_top, c_mid, t * 2
        else:
            a, b, f = c_mid, c_bottom, (t - 0.5) * 2
        col.putpixel((0, y), tuple(round(a[i] + (b[i] - a[i]) * f) for i in range(3)))
    return col.resize((size, size), Image.LANCZOS).convert("RGBA")


def full_bleed(size: int) -> Image.Image:
    """Zoom the squircle so its rounded corners bleed past the canvas: the
    gradient reaches every edge and the OS/manifest mask does the rounding.
    iOS-style corner radius is ~22.5% of the side -> zoom ~1.16 covers the
    square's corners with margin."""
    zoom = 1.18
    big = sq.resize((round(size * zoom),) * 2, Image.LANCZOS)
    off = (big.size[0] - size) // 2
    out = big.crop((off, off, off + size, off + size))
    # Belt and braces: composite over the gradient so any residual corner
    # transparency is brand color, never black.
    bg = gradient_bg(size)
    bg.alpha_composite(out)
    return bg


def maskable(size: int, scale: float = 0.66) -> Image.Image:
    """Emblem centered inside the 80% safe zone on the brand gradient."""
    bg = gradient_bg(size)
    emblem = sq.resize((round(size * scale),) * 2, Image.LANCZOS)
    off = (size - emblem.size[0]) // 2
    bg.alpha_composite(emblem, (off, off))
    return bg


def adaptive_foreground(size: int = 1024, scale: float = 0.66) -> Image.Image:
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    emblem = sq.resize((round(size * scale),) * 2, Image.LANCZOS)
    off = (size - emblem.size[0]) // 2
    out.alpha_composite(emblem, (off, off))
    return out


# ── App assets ───────────────────────────────────────────────────────────────
full_bleed(1024).save(os.path.join(ASSETS, "icon.png"))
adaptive_foreground().save(os.path.join(ASSETS, "adaptive-icon.png"))
ImageOps.contain(sq, (64, 64), Image.LANCZOS).save(os.path.join(ASSETS, "favicon.png"))

# ── PWA icons ────────────────────────────────────────────────────────────────
full_bleed(192).save(os.path.join(PUBLIC_ICONS, "icon-192.png"))
full_bleed(512).save(os.path.join(PUBLIC_ICONS, "icon-512.png"))
maskable(192).save(os.path.join(PUBLIC_ICONS, "icon-maskable-192.png"))
maskable(512).save(os.path.join(PUBLIC_ICONS, "icon-maskable-512.png"))
full_bleed(180).save(os.path.join(PUBLIC_ICONS, "apple-touch-icon.png"))

# ── Brand / ad kit on the Desktop ────────────────────────────────────────────
up = sq.resize((1024, 1024), Image.LANCZOS)
up.save(os.path.join(BRAND, "ourmoment-icon-squircle-1024.png"))
full_bleed(1024).save(os.path.join(BRAND, "ourmoment-icon-fullbleed-1024.png"))
maskable(1024, 0.62).save(os.path.join(BRAND, "ourmoment-social-avatar-1024.png"))
for name, path in (("ourmoment-lockup-light.png", LOCKUP), ("ourmoment-lockup-transparent.png", LOCKUP_T)):
    if os.path.exists(path):
        shutil.copy(path, os.path.join(BRAND, name))

hexc = lambda c: "#%02X%02X%02X" % c
with open(os.path.join(BRAND, "README.md"), "w", encoding="utf-8") as f:
    f.write(f"""# OurMoment brand kit

Generated from the master squircle render by `scripts/generate-icons.py`.

| File | Use |
|---|---|
| `ourmoment-icon-squircle-1024.png` | Ads/print on any background — transparent, keeps the squircle shape |
| `ourmoment-icon-fullbleed-1024.png` | App-store icon, contexts that apply their own corner mask |
| `ourmoment-social-avatar-1024.png` | Social profile avatars (circle-crop safe) |
| `ourmoment-lockup-light.png` | Icon + wordmark on light background (display ads, web) |
| `ourmoment-lockup-transparent.png` | Icon + wordmark, transparent (overlays, video) |

Brand colors (sampled from the gradient): top {hexc(c_top)}, mid {hexc(c_mid)}, bottom {hexc(c_bottom)}.
Gold emblem: infinity ("our") merging into a camera aperture ("moment").
Clear space: keep at least 1/8 of the icon's width around the mark. Don't recolor the gold mark.
""")

print("OK — icons written to assets/images, public/icons, and", BRAND)
print("Adaptive icon backgroundColor for app.json:", hexc(c_mid))
