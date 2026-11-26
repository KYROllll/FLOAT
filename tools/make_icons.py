"""Generate the AURA PWA icons from the official logo artwork.

The source is `assets/aura-logo.png` (deep-indigo "AURA" wordmark wrapped in a
golden aura). The first "A" is lifted out of the wordmark as an alpha mask, then
re-lit in warm ivory on a deep indigo plate with the logo's indigo -> gold aura
glow. Run: `python3 tools/make_icons.py`.
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).parent.parent
SRC = ROOT / "assets" / "aura-logo.png"
OUT = ROOT / "icons"
OUT.mkdir(exist_ok=True)

# Window around the first "A" of the wordmark (excludes the "U" that follows).
LETTER_BOX = (250, 1195, 852, 1690)

# Logo palette, sampled from the artwork.
PLATE_TOP = (26, 16, 56)
PLATE_MID = (13, 8, 32)
PLATE_BOTTOM = (5, 3, 15)
VIOLET = (124, 74, 214)
GOLD = (255, 205, 92)
GOLD_HOT = (255, 232, 168)
IVORY_TOP = (255, 253, 248)
IVORY_BOTTOM = (255, 242, 208)

WORK = 1024


def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(len(a)))


def vertical_gradient(size, stops):
    """stops: [(pos, rgb), ...] with pos ascending 0..1."""
    img = Image.new("RGB", (size, size))
    px = img.load()
    for y in range(size):
        t = y / (size - 1)
        for i in range(len(stops) - 1):
            p0, c0 = stops[i]
            p1, c1 = stops[i + 1]
            if p0 <= t <= p1:
                k = 0 if p1 == p0 else (t - p0) / (p1 - p0)
                color = lerp(c0, c1, k)
                break
        else:
            color = stops[-1][1]
        for x in range(size):
            px[x, y] = color
    return img


def radial_layer(size, center, radius, color, falloff=2.4, opacity=1.0):
    """Soft radial light as an RGBA layer."""
    yy, xx = np.mgrid[0:size, 0:size]
    d = np.sqrt((xx - center[0]) ** 2 + (yy - center[1]) ** 2) / radius
    alpha = np.clip(np.exp(-(d**2) * falloff) - 0.02, 0, 1) * opacity
    rgba = np.zeros((size, size, 4), dtype=np.uint8)
    rgba[..., 0], rgba[..., 1], rgba[..., 2] = color
    rgba[..., 3] = (alpha * 255).astype(np.uint8)
    return Image.fromarray(rgba, "RGBA")


def glyph_mask():
    """Alpha coverage of the first letter, cropped to its own bounding box."""
    src = Image.open(SRC).convert("RGB")
    l, t, r, b = LETTER_BOX
    crop = np.asarray(src.crop((l, t, r, b))).astype(np.float32)
    lum = crop @ np.array([0.299, 0.587, 0.114], dtype=np.float32)
    alpha = np.clip((150.0 - lum) / 50.0, 0.0, 1.0)
    alpha[alpha < 0.3] = 0.0

    mask = Image.fromarray((alpha * 255).astype(np.uint8), "L")
    mask = (
        mask.point(lambda v: min(255, int(v * 1.25)))
        .filter(ImageFilter.MedianFilter(5))
        .filter(ImageFilter.GaussianBlur(1.6))
        .point(lambda v: 0 if v < 90 else min(255, int((v - 90) * 1.55)))
        .filter(ImageFilter.GaussianBlur(0.7))
    )
    box = mask.point(lambda v: 255 if v > 80 else 0).getbbox()
    return mask.crop(box)


def scaled_mask(target_width):
    g = glyph_mask()
    w, h = g.size
    width = int(target_width)
    height = int(round(h * width / w))
    return g.resize((width, height), Image.LANCZOS)


def plate(size, maskable=False, rounded=True):
    bg = vertical_gradient(size, [(0.0, PLATE_TOP), (0.55, PLATE_MID), (1.0, PLATE_BOTTOM)])
    img = bg.convert("RGBA")

    # Violet core light, then the golden aura that wraps the light.
    for layer in (
        radial_layer(size, (size * 0.5, size * 0.24), size * 0.74, VIOLET, 2.8, opacity=0.42),
        radial_layer(size, (size * 0.5, size * 0.60), size * 0.46, (78, 38, 150), 3.6, opacity=0.5),
    ):
        img = Image.alpha_composite(img, layer)

    if rounded and not maskable:
        mask = Image.new("L", (size, size), 0)
        ImageDraw.Draw(mask).rounded_rectangle(
            [0, 0, size - 1, size - 1], radius=int(size * 0.225), fill=255
        )
        img.putalpha(mask)

    return img


def add_glow(base, alpha, color, strength):
    """Additive light so the halo brightens the plate instead of muddying it."""
    rgb = np.asarray(base.convert("RGB")).astype(np.float32)
    a = (np.asarray(alpha).astype(np.float32) / 255.0)[..., None] * strength
    rgb = np.clip(rgb + np.array(color, dtype=np.float32) * a, 0, 255)
    out = Image.fromarray(rgb.astype(np.uint8), "RGB").convert("RGBA")
    out.putalpha(base.getchannel("A"))
    return out


def build(size=WORK, maskable=False, rounded=True):
    img = plate(size, maskable, rounded)

    glyph_w = size * (0.46 if maskable else 0.575)
    glyph = scaled_mask(glyph_w)
    gw, gh = glyph.size
    gx = (size - gw) // 2
    gy = int(round((size - gh) / 2 - size * 0.01))

    # Golden aura: wide bloom, tight bloom, then the crisp ivory letterform.
    for radius, color, strength in (
        (size * 0.055, (255, 140, 24), 0.4),
        (size * 0.022, (255, 186, 48), 0.75),
        (size * 0.008, (255, 214, 96), 0.85),
        (size * 0.003, GOLD_HOT, 0.35),
    ):
        halo = Image.new("L", (size, size), 0)
        halo.paste(glyph, (gx, gy))
        img = add_glow(img, halo.filter(ImageFilter.GaussianBlur(radius)), color, strength)

    fill = Image.new("RGB", glyph.size)
    fp = fill.load()
    for y in range(gh):
        color = lerp(IVORY_TOP, IVORY_BOTTOM, y / max(1, gh - 1))
        for x in range(gw):
            fp[x, y] = color
    img.paste(fill.convert("RGBA"), (gx, gy), glyph)

    return img


icon = build()
icon.resize((512, 512), Image.LANCZOS).save(OUT / "icon-512.png", optimize=True)
icon.resize((192, 192), Image.LANCZOS).save(OUT / "icon-192.png", optimize=True)
build(rounded=False).resize((180, 180), Image.LANCZOS).save(
    OUT / "apple-touch-icon.png", optimize=True
)
build(maskable=True).resize((512, 512), Image.LANCZOS).save(
    OUT / "icon-maskable-512.png", optimize=True
)

print("Icons generated:", ", ".join(p.name for p in sorted(OUT.glob("*.png"))))
