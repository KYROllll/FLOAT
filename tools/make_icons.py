"""Build the AURA PWA icons and favicon from the official logo artwork.

The mark is never redrawn: `assets/aura-logo.png` is cropped to the wordmark
(its baked-in violet/gold aura included) and centred, untouched, on the same
off-white canvas the logo sits on. Run: `python3 tools/make_icons.py`.
"""
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).parent.parent
SRC = ROOT / "assets" / "aura-logo.png"
OUT = ROOT / "icons"
OUT.mkdir(exist_ok=True)

# Background sampled from the logo's own canvas, so the crop blends in.
PAPER = (246, 244, 243)

# Width of the wordmark relative to the icon edge. Maskable keeps the mark
# inside Android's 80% safe circle.
MARK_WIDTH = {"any": 0.92, "maskable": 0.78}


def mark_crop():
    """Everything in the artwork that is not blank canvas (letters + aura)."""
    img = Image.open(SRC).convert("RGB")
    a = np.asarray(img).astype(np.int16)
    diff = np.abs(a - np.array(PAPER, dtype=np.int16)).max(axis=2)
    ys, xs = np.nonzero(diff > 8)
    left, top, right, bottom = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1

    # A little breathing room around the glow.
    pad = int(round((right - left) * 0.012))
    left = max(0, left - pad)
    top = max(0, top - pad)
    right = min(img.width, right + pad)
    bottom = min(img.height, bottom + pad)

    return flatten_paper(img.crop((left, top, right, bottom)))


def flatten_paper(crop):
    """Flat paper behind the mark: the scan's faint canvas noise is leveled out.

    Only near-white, desaturated pixels are touched, so the letters and the
    violet/gold aura keep their exact pixels.
    """
    a = np.asarray(crop).astype(np.int16)
    spread = a.max(axis=2) - a.min(axis=2)
    lum = a.mean(axis=2)
    flat_bg = (spread <= 6) & (lum >= 232)

    a[flat_bg] = PAPER
    return Image.fromarray(a.astype(np.uint8), "RGB")


def build(size, mark_width):
    plate = Image.new("RGB", (size, size), PAPER)
    mark = mark_crop()

    width = max(1, int(round(size * mark_width)))
    height = max(1, int(round(mark.height * width / mark.width)))
    scaled = mark.resize((width, height), Image.LANCZOS)

    plate.paste(scaled, ((size - width) // 2, (size - height) // 2))
    return plate


def save(name, size, mark_width):
    icon = build(size, mark_width)
    icon.save(OUT / name, optimize=True)
    return f"{name} {size}x{size}"


written = [
    save("icon-512.png", 512, MARK_WIDTH["any"]),
    save("icon-192.png", 192, MARK_WIDTH["any"]),
    save("apple-touch-icon.png", 180, MARK_WIDTH["any"]),
    save("icon-maskable-512.png", 512, MARK_WIDTH["maskable"]),
    save("favicon.png", 64, 0.98),
]

print("Icons generated from", SRC.name)
for line in written:
    print("  ", line)
