# FLOAT

A quiet canvas for the things you mean to do.

Missions float gently in the dark. Tap one to focus it, then slide to let it go. If two things belong together, link them and a thin line carries energy between them. Nothing to configure, no account, no feed — the whole app is one screen.

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
| Inspect a mission | Tap it — the card zooms into a focus sheet |
| Complete a mission | In the focus sheet, drag the handle across the track (or use arrow keys) |
| Link two missions | Tap the chain button, then tap two missions (first tapped = source) |
| Re-link / unlink | Same two missions again; or tap a line in link mode |
| Stop floating / hover | Point at a mission, or open its focus sheet; it holds still while you read |
| Everything else | None. That is the app. |

Tapping a mission no longer completes it. The focus sheet shows the full mission text, how long it has been floating, and its energy telemetry — pulses received from upstream missions and pulses sent downstream. The **slide to complete** control unlocks as you drag; reaching the end draws the green check, removes the mission and its lines, and closes the sheet. **Escape** or the close button walks away without completing.

Completed missions disappear for good, along with any lines attached to them. A hint appears while link mode is on, and **Escape** leaves link mode, closes the focus sheet or composer, or clears a half-made link.

Mission text is stored with `dir="auto"`, so Hebrew and English sit side by side without breaking the layout. Motion respects `prefers-reduced-motion` (pulses still travel and still count energy, the cards just stop drifting).

---

## How it works

- Each mission is a normalised bubble of space (`nx`, `ny` between 0 and 1), so the canvas survives resize and rotation.
- Velocity is expressed in screen-fractions per second and slowly turned by a sine wave, which is why paths curve instead of running dead straight.
- Cards bounce softly inside a padded frame; cards never overlap the edges.
- Cards are kept apart by their real measured size plus a 14 px minimum gap. New missions sample up to 52 candidate spots and take the one with the most clear air; while drifting, a small solver nudges overlapping pairs apart on whichever axis needs the least movement and turns their velocity away from each other. Many cards on a very narrow screen can outnumber the available space — the solver does its best, but it cannot invent room.
- Links are quadratic curves drawn in an SVG layer under the cards. The bend is perpendicular to the link (so near-vertical pairs bow sideways instead of stacking) and links sharing a mission are fanned apart, with a small chevron near the target reading source → target.
- A white pulse travels from source to target; each arrival increments that link's pulse count plus the source's `energyOut` and the target's `energyIn`.
- Tapping a card lifts it into the focus sheet; the sheet zooms from the card's position. Slide-to-complete uses pointer capture, so the drag survives leaving the track.
- Completion draws a glowing emerald checkmark on the card before it scales down and fades, so finishing something feels like a small reward.
- Positions, links, creation times and energy totals are saved to `localStorage`, throttled while drifting and flushed when the tab is hidden.

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
| `float.canvas.v1` | `{ v: 2, missions: [{ id, text, nx, ny, vx, vy, phase, createdAt, energyIn, energyOut }], links: [[sourceId, targetId, pulses]] }` |

Saves from before the focus view (`v: 1`, links as `[[a, b]]`) still load; missing energy totals are derived from the per-link pulse counts. Clearing site data is the reset button. There is no export UI by design; the saved JSON is plain and readable if you ever want it.

---

## Design notes

- One screen, `100dvh`, no scrolling, no tabs, no sidebars, no settings.
- Two controls: a faint chain icon and a single light **+**.
- Palette and spacing are CSS variables at the top of `style.css`.
- Every click target is at least 42 px; the plus is 54 px.
