# FLOAT

A quiet canvas for the things you mean to do.

Missions float gently in the dark. Tap one to focus it, then slide to let it go. If two things belong together, link them and a thin line carries a pulse between them. A three-tab bar keeps the rest out of the way: the canvas, a week of completions, and a one-line calorie log. Nothing to configure, no account, no feed.

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
| Change view | Tap **Missions**, **Stats**, or **Calories** at the bottom |
| Log calories | In **Calories**, type an amount and an optional note, press **Enter** |
| Remove a calorie entry | Tap **×** on its row; **clear today** wipes the day (two taps) |
| Everything else | None. That is the app. |

Tapping a mission no longer completes it. The focus sheet shows the full mission text and how long it has been floating, nothing else. The **slide to complete** control unlocks as you drag; the lock becomes a small green tick at the end of the track, the card gets a matching tick, and the mission and its lines disappear. **Escape** or the close button walks away without completing.

**Stats** shows completions today, a seven-day bar chart, the seven-day total, what is still floating, and the all-time count. **Calories** keeps today's entries — amount, optional note, daily total, and an optional target with a hairline progress bar. Entries can be deleted one by one, and **clear today** asks for a second tap.

Completed missions disappear for good, along with any lines attached to them. A hint appears while link mode is on, and **Escape** leaves link mode, closes the focus sheet or composer, or clears a half-made link.

Mission text and calorie notes are stored with `dir="auto"`, so Hebrew and English sit side by side without breaking the layout. Motion respects `prefers-reduced-motion` (pulses still travel, the cards just stop drifting).

---

## How it works

- Each mission is a normalised bubble of space (`nx`, `ny` between 0 and 1), so the canvas survives resize and rotation.
- Velocity is expressed in screen-fractions per second and slowly turned by a sine wave, which is why paths curve instead of running dead straight.
- Cards bounce softly inside a padded frame; cards never overlap the edges.
- Cards are kept apart by their real measured size plus a 14 px minimum gap. New missions sample up to 52 candidate spots and take the one with the most clear air; while drifting, a small solver nudges overlapping pairs apart on whichever axis needs the least movement and turns their velocity away from each other. Many cards on a very narrow screen can outnumber the available space — the solver does its best, but it cannot invent room.
- Links are quadratic curves drawn in an SVG layer under the cards. The bend is perpendicular to the link (so near-vertical pairs bow sideways instead of stacking) and links sharing a mission are fanned apart, with a small chevron near the target reading source → target.
- A white pulse travels from source to target and loops forever. It is only light — no counters, no totals, nothing to read.
- Tapping a card lifts it into the focus sheet; the sheet zooms from the card's position. Slide-to-complete uses pointer capture, so the drag survives leaving the track.
- Completing records a timestamp (for **Stats**) and draws a small green tick beside the card before it fades.
- The canvas area stops above the tab bar, so cards never drift under it. Only the canvas view animates; the other views idle at zero cost.
- Positions, links, creation times, completion timestamps and calorie entries are saved to `localStorage`, throttled while drifting and flushed when the tab is hidden.

Everything is local. There are no network calls.

---

## Files

```
index.html                 Shell: canvas, links layer, composer, focus sheet, stats, calories, tabs
style.css                  Dark canvas, glass cards, link lines, views, motion, safe areas
app.js                     State, drift, links, completion, stats, calories, storage, PWA
manifest.json              PWA manifest
sw.js                      Offline cache (network-first shell, cache-first assets)
icons/                     PNG icons and SVG favicon
tools/make_icons.py        Icon generator (Python + Pillow)
```

---

## Storage

| Key | Contents |
| --- | --- |
| `float.canvas.v1` | `{ v: 3, missions: [{ id, text, nx, ny, vx, vy, phase, createdAt }], links: [[sourceId, targetId]], done: [timestamp], meals: [{ id, ts, kcal, note }], kcalTarget }` |

Older saves still load: `v: 1` and `v: 2` files keep their missions, links and positions, and the retired energy fields and pulse counts are simply ignored. Clearing site data is the reset button. There is no export UI by design; the saved JSON is plain and readable if you ever want it.

---

## Design notes

- Three views behind one minimal tab bar: the canvas never scrolls, stats and calories do.
- On the canvas: two controls only, a faint chain icon and a single light **+**.
- Palette and spacing are CSS variables at the top of `style.css`. Monochrome throughout; green appears only in the completion tick.
- Every click target is at least 42 px; the plus is 54 px.
