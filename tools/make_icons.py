"""Generate ARENA PWA icons: an emerald progress ring closed by a check."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

OUT = Path(__file__).parent.parent / "icons"
OUT.mkdir(exist_ok=True)

SIZE = 1024
BG_TOP = (12, 22, 42, 255)
BG_BOTTOM = (7, 11, 20, 255)
RING_BACK = (30, 41, 59, 255)
GREEN = (34, 197, 94, 255)
GREEN_BRIGHT = (74, 222, 128, 255)


def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(len(a)))


def vertical_gradient(size, top, bottom):
    img = Image.new("RGBA", (size, size), top)
    draw = ImageDraw.Draw(img)
    for y in range(size):
        draw.line([(0, y), (size, y)], fill=lerp(top, bottom, y / (size - 1)))
    return img


def ring_layer(size, center, radius, width, progress, scale):
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    box = [center[0] - radius, center[1] - radius, center[0] + radius, center[1] + radius]

    draw.arc(box, start=-90, end=270, fill=RING_BACK, width=width)

    start = -90
    sweep = 360 * progress
    steps = 120
    for i in range(steps):
        t0 = i / steps
        t1 = (i + 1) / steps
        color = lerp(GREEN, GREEN_BRIGHT, t0)
        draw.arc(
            box,
            start=start + sweep * t0,
            end=start + sweep * t1 + 1.2,
            fill=color,
            width=width,
        )

    # End cap of the progress arc
    import math
    end_angle = math.radians(start + sweep)
    ex = center[0] + radius * math.cos(end_angle)
    ey = center[1] + radius * math.sin(end_angle)
    cap = width / 2
    draw.ellipse([ex - cap, ey - cap, ex + cap, ey + cap], fill=GREEN_BRIGHT)
    return layer


def check_layer(size, center, scale):
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    cx, cy = center
    pts = [
        (cx - size * 0.145 * scale, cy + size * 0.012 * scale),
        (cx - size * 0.038 * scale, cy + size * 0.118 * scale),
        (cx + size * 0.155 * scale, cy - size * 0.112 * scale),
    ]
    draw.line(pts, fill=(248, 250, 252, 255), width=int(size * 0.055 * scale), joint="curve")
    return layer


def base_icon(size=SIZE, maskable=False):
    if maskable:
        img = vertical_gradient(size, BG_TOP, BG_BOTTOM)
        scale = 0.78
    else:
        img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        body = vertical_gradient(size, BG_TOP, BG_BOTTOM)
        mask = Image.new("L", (size, size), 0)
        ImageDraw.Draw(mask).rounded_rectangle(
            [0, 0, size - 1, size - 1], radius=int(size * 0.225), fill=255
        )
        img = Image.composite(body, img, mask)
        scale = 1.0

    center = (size * 0.5, size * 0.5)

    # Emerald glow behind the mark.
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gr = size * 0.30 * scale
    gd.ellipse(
        [center[0] - gr, center[1] - gr, center[0] + gr, center[1] + gr],
        fill=(34, 197, 94, 52),
    )
    img = Image.alpha_composite(img, glow.filter(ImageFilter.GaussianBlur(size * 0.09)))

    img = Image.alpha_composite(
        img,
        ring_layer(
            size,
            center,
            radius=size * 0.285 * scale,
            width=int(size * 0.048 * scale),
            progress=0.74,
            scale=scale,
        ),
    )

    return Image.alpha_composite(img, check_layer(size, center, scale))


icon = base_icon()
icon.resize((512, 512), Image.LANCZOS).save(OUT / "icon-512.png", optimize=True)
icon.resize((192, 192), Image.LANCZOS).save(OUT / "icon-192.png", optimize=True)
icon.resize((180, 180), Image.LANCZOS).save(OUT / "apple-touch-icon.png", optimize=True)

mask = base_icon(maskable=True)
mask.resize((512, 512), Image.LANCZOS).save(OUT / "icon-maskable-512.png", optimize=True)

svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0c162a"/>
      <stop offset="1" stop-color="#070b14"/>
    </linearGradient>
    <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#22c55e"/>
      <stop offset="1" stop-color="#4ade80"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="14" fill="url(#bg)"/>
  <circle cx="32" cy="32" r="18.5" fill="none" stroke="#1e293b" stroke-width="3.2"/>
  <path d="M32 13.5a18.5 18.5 0 1 1-16.1 9.4" fill="none" stroke="url(#ring)"
        stroke-width="3.2" stroke-linecap="round"/>
  <path d="M23.2 32.6 29.3 38.7 41.4 24.6" fill="none" stroke="#f8fafc"
        stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
"""
(OUT / "favicon.svg").write_text(svg)

print("Icons generated:", ", ".join(p.name for p in sorted(OUT.glob("*"))))
