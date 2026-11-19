"""Generate FLOAT PWA icons: a floating orb above a trajectory arc."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

OUT = Path(__file__).parent.parent / "icons"
OUT.mkdir(exist_ok=True)

SIZE = 1024
BG = (7, 8, 10, 255)
CARD = (13, 15, 19, 255)
ORB = (244, 244, 246, 255)
SILVER = (161, 161, 170, 165)


def layer(size, draw_fn):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw_fn(ImageDraw.Draw(img))
    return img


def base_icon(size=SIZE, maskable=False):
    if maskable:
        # Full-bleed background; keep the mark well inside the safe zone.
        img = Image.new("RGBA", (size, size), BG)
        scale = 0.8
    else:
        img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        ImageDraw.Draw(img).rounded_rectangle(
            [0, 0, size - 1, size - 1], radius=int(size * 0.22), fill=CARD
        )
        scale = 1.0

    cx, cy = int(size * 0.5), int(size * 0.455)
    rx = int(size * 0.31 * scale)
    ry = int(size * 0.155 * scale)
    orb_r = int(size * 0.098 * scale)

    # Soft halo above the arc.
    def draw_glow(d):
        d.ellipse(
            [cx - orb_r * 2, cy - orb_r * 2, cx + orb_r * 2, cy + orb_r * 2],
            fill=(255, 255, 255, 58),
        )

    img = Image.alpha_composite(
        img, layer(size, draw_glow).filter(ImageFilter.GaussianBlur(size * 0.055))
    )

    # Trajectory arc: the lower half of a wide ellipse, passing beneath the orb.
    def draw_arc(d):
        d.arc(
            [cx - rx, cy - ry, cx + rx, cy + ry],
            start=0,
            end=180,
            fill=SILVER,
            width=max(2, int(size * 0.011 * scale)),
        )

    img = Image.alpha_composite(img, layer(size, draw_arc))

    # The floating orb.
    def draw_orb(d):
        d.ellipse([cx - orb_r, cy - orb_r, cx + orb_r, cy + orb_r], fill=ORB)

    img = Image.alpha_composite(img, layer(size, draw_orb))

    # A small white node riding the arc, echoing the link pulse.
    node_r = max(3, int(size * 0.016 * scale))
    node_x = cx + int(rx * 0.72)
    node_y = cy + int(ry * 0.694)

    def draw_node(d):
        d.ellipse(
            [node_x - node_r, node_y - node_r, node_x + node_r, node_y + node_r],
            fill=(255, 255, 255, 235),
        )

    return Image.alpha_composite(img, layer(size, draw_node))


icon = base_icon()

# Rounded for iOS/desktop, downscale smoothly.
icon.resize((512, 512), Image.LANCZOS).save(OUT / "icon-512.png", optimize=True)
icon.resize((192, 192), Image.LANCZOS).save(OUT / "icon-192.png", optimize=True)
icon.resize((180, 180), Image.LANCZOS).save(OUT / "apple-touch-icon.png", optimize=True)

# Maskable: full-bleed, safe-zone-friendly.
mask = base_icon(maskable=True)
mask.resize((512, 512), Image.LANCZOS).save(OUT / "icon-maskable-512.png", optimize=True)

# Favicon SVG — the same mark, drawn by hand.
svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <radialGradient id="halo" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#ffffff" stop-opacity=".22"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="64" height="64" rx="14" fill="#0d0f13"/>
  <circle cx="32" cy="29.1" r="12.5" fill="url(#halo)"/>
  <path d="M12.2 29.1 Q 32 48.9 51.8 29.1" fill="none" stroke="#a1a1aa" stroke-opacity=".7" stroke-width="1.4" stroke-linecap="round"/>
  <circle cx="32" cy="29.1" r="6.3" fill="#f4f4f6"/>
  <circle cx="40.7" cy="37.1" r="1.25" fill="#ffffff"/>
</svg>
"""
(OUT / "favicon.svg").write_text(svg)

print("Icons generated:", ", ".join(p.name for p in sorted(OUT.glob("*")) if p.suffix in {".png", ".svg"}))
