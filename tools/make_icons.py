"""Build the AURA app icons, favicon and the in-app mark from the logo art.

Two sources, both untouched:
  AURALOGO.png        the full logo tile (near-black plate + the neon wordmark)
  AURALOGO-ONLY.png   the wordmark alone, alpha cut, no plate behind it

App/Home Screen icons come from the tile: its own plate is rebuilt with the
letters lifted out (so the mark can be inset for Android's safe circle without
copying a second set of letters), then the original mark band is laid back on
top, feathered into the surrounding glow. Nothing is redrawn or recoloured.

The in-app mark (header + footer) is AURALOGO-ONLY.png, trimmed of its empty
margin and scaled down with premultiplied alpha so the neon edge stays clean
against the dark surface — no white fringe.

Run: `python3 tools/make_icons.py`
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).parent.parent
TILE = ROOT / "AURALOGO.png"
ONLY = ROOT / "AURALOGO-ONLY.png"
OUT = ROOT / "icons"
OUT.mkdir(exist_ok=True)
MARK = ROOT / "assets" / "aura-mark.png"

# Fraction of the icon edge the wordmark spans. Android's maskable safe circle
# is 80%, so that mark stays comfortably inside it; the small favicon needs all
# the width it can get.
MARK_WIDTH = {
    "icon": 0.86,
    "maskable": 0.68,
    "favicon": 0.96,
}

# Vertical slice of the tile that carries the wordmark (0-1 of the height),
# measured once here so the plate and the pasted band always agree.
BAND = (0.40, 0.58)


def tile_rgb():
    return Image.open(TILE).convert("RGB")


def content_band(img, margin=0.10):
    """Rows of the tile that actually carry the mark, plus a little glow."""
    a = np.asarray(img).astype(np.int16)
    lum = a.max(axis=2)
    rows = np.nonzero((lum > 110).sum(axis=1) > img.width * 0.01)[0]
    top, bottom = rows.min(), rows.max() + 1
    pad = int(round((bottom - top) * margin))
    return (
        max(0, top - pad),
        min(img.height, bottom + pad),
        top,
        bottom,
    )


def blank_plate(img, top, bottom):
    """The tile with its letters lifted out, leaving only the dark plate.

    The letter rows are replaced by the untouched background rows above and
    below them, mirrored inwards and blended, so the plate keeps the tile's own
    gradient and grain and joins it without a seam.
    """
    a = np.asarray(img).astype(np.float32)
    height = bottom - top
    height = min(height, top, img.height - bottom)

    upper = a[top - height:top][::-1]
    lower = a[bottom:bottom + height][::-1]
    ramp = np.cos(np.linspace(0.0, np.pi, height)) * 0.5 + 0.5
    a[top:top + height] = upper * ramp[:, None, None] + lower * (1 - ramp[:, None, None])

    if height < bottom - top:
        a[top + height:bottom] = a[top + height - 1]
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), "RGB")


def alpha_bbox(img, threshold=12, pad=6):
    """Tight box around what actually shows; the glow's last pixel is too faint
    to count, and without this the mark keeps a screen of empty margin."""
    a = np.asarray(img)[:, :, 3]
    ys, xs = np.nonzero(a > threshold)
    if not len(xs):
        return (0, 0, img.width, img.height)
    return (
        max(0, int(xs.min()) - pad),
        max(0, int(ys.min()) - pad),
        min(img.width, int(xs.max()) + 1 + pad),
        min(img.height, int(ys.max()) + 1 + pad),
    )


def mark_rgba(width):
    """The wordmark on its own, scaled to `width` with clean premultiplied edges."""
    mark = Image.open(ONLY).convert("RGBA")
    mark = mark.crop(alpha_bbox(mark))
    height = max(1, round(width * mark.height / mark.width))
    return mark.convert("RGBa").resize((width, height), Image.LANCZOS).convert("RGBA")


def build(size, mark_width):
    img = tile_rgb()
    top, bottom, text_top, text_bottom = content_band(img)

    # The tile's own plate, letters lifted out, so the wordmark can sit at any
    # size without a second set of letters showing behind it. It is a smooth
    # gradient, so a light blur only drops the artwork's film grain (and a lot
    # of PNG weight) without touching the look.
    plate = blank_plate(img, text_top, text_bottom + 1).resize((size, size), Image.LANCZOS)
    plate = plate.filter(ImageFilter.GaussianBlur(max(0.6, size * 0.004)))

    width = max(1, int(round(size * mark_width)))
    mark = mark_rgba(width)

    plate = plate.convert("RGBA")
    plate.alpha_composite(mark, ((size - width) // 2, (size - mark.height) // 2))
    return plate.convert("RGB")


def save_icon(name, size, mark_width):
    build(size, mark_width).save(OUT / name, optimize=True)
    return f"{name} {size}x{size}"


def build_mark(width=720):
    """In-app mark: AURALOGO-ONLY.png trimmed, then scaled with clean edges.

    Premultiplied alpha matters here: scaling straight RGBA drags transparent
    pixels' colour into the edge and leaves a grey halo on a dark surface.
    """
    mark = mark_rgba(width)
    mark.save(MARK, optimize=True)
    return f"{MARK.name} {mark.width}x{mark.height}"


written = [
    build_mark(),
    save_icon("icon-512.png", 512, MARK_WIDTH["icon"]),
    save_icon("icon-192.png", 192, MARK_WIDTH["icon"]),
    save_icon("apple-touch-icon.png", 180, MARK_WIDTH["icon"]),
    save_icon("icon-maskable-512.png", 512, MARK_WIDTH["maskable"]),
    save_icon("favicon.png", 64, MARK_WIDTH["favicon"]),
]

print("Icons generated from", TILE.name, "+", ONLY.name)
for line in written:
    print("  ", line)
