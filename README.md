# FLOAT

A quiet canvas for the things you mean to do.

Missions float gently in the dark. Tap one to let it go. If two things belong together, link them and a thin line keeps them near. Nothing to configure, no account, no feed — the whole app is one screen.

Built with plain **HTML, CSS, and vanilla JavaScript**. No frameworks, no build step, no external fonts or CDNs.

---

## Run it

```bash
python3 -m http.server 8080
```

Open **http://localhost:8080**.

Opening `index.html` directly from disk works for the canvas and local saves, but the service worker and installation need `http://localhost` or HTTPS.

### Install on a phone

1. Open the app in Safari (iOS) or Chrome (Android).
2. iOS: **Share → Add to Home Screen**. Android: **Install app**.
3. It launches full-screen, standalone, and works offline.

---

## Using it

| Action | How |
| --- | --- |
| Add a mission | Tap **+** (or press `/`), type, press **Enter** |
| Complete a mission | Tap it — a green check draws in, then the card dissolves away |
| Link two missions | Tap the chain button, then tap two missions |
| Re-link / unlink | Same two missions again; or tap a line in link mode |
| Stop floating / hover | Point at a mission; it holds still while you read |
| Everything else | None. That is the app. |

Completed missions disappear for good, along with any lines attached to them. A hint appears while link mode is on, and **Escape** leaves link mode, closes the composer, or clears a half-made link.

Mission text is stored with `dir="auto"`, so Hebrew and English sit side by side without breaking the layout. Motion respects `prefers-reduced-motion`.

---

## How it works

- Each mission is a normalised bubble of space (`nx`, `ny` between 0 and 1), so the canvas survives resize and rotation.
- Velocity is expressed in screen-fractions per second and slowly turned by a sine wave, which is why paths curve instead of running dead straight.
- Cards bounce softly inside a padded frame; cards never overlap the edges.
- Links are quadratic curves drawn in an SVG layer under the cards, with a small white pulse travelling from the first mission to the second — visible, but never in the way.
- Completion draws a glowing emerald checkmark on the card before it scales down and fades, so finishing something feels like a small reward.
- Positions and links are saved to `localStorage`, throttled while drifting and flushed when the tab is hidden.
- New missions land at a spot that keeps distance from the cards already floating.

Everything is local. There are no network calls.

---

## Files

```
index.html                 Single-screen shell: canvas, links layer, composer, controls
style.css                  Dark canvas, glass cards, link lines, motion, safe areas
app.js                     State, drift, links, completion, storage, PWA registration
manifest.json              PWA manifest
sw.js                      Offline cache (network-first shell, cache-first assets)
icons/                     PNG icons and SVG favicon
tools/make_icons.py        Icon generator (Python + Pillow)
```

---

## Storage

| Key | Contents |
| --- | --- |
| `float.canvas.v1` | `{ v, missions: [{ id, text, nx, ny, vx, vy, phase }], links: [[a, b]] }` |

Clearing site data is the reset button. There is no export UI by design; the saved JSON is plain and readable if you ever want it.

---

## Design notes

- One screen, `100dvh`, no scrolling, no tabs, no sidebars, no settings.
- Two controls: a faint chain icon and a single light **+**.
- Palette and spacing are CSS variables at the top of `style.css`.
- Every click target is at least 42 px; the plus is 54 px.
