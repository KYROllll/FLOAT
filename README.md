# AURA // DAILY OS

A mobile-first daily discipline OS. One deep dark screen: the week, today's plan, the non-negotiables, a distraction-free focus timer, and the multi-day challenges that prove you showed up.

The brand comes from `AURALOGO.png`: near-black letters, a deep violet/indigo core, and a luminous golden-yellow aura. The app sits on the same near-black (`#08070b`) as the wordmark's letter core, and a slow ambient layer drifts those indigo and gold lights behind the whole UI. The in-app mark is `AURALOGO-ONLY.png` — the wordmark with its own alpha edge — so the neon rim sits straight on the dark surface in the header and again, small, above the footer line, with no plate or white fringe behind it. The daily progress scale keeps its own red → amber → green language so LOSS and WIN never lose their meaning — the progress card carries a live **WIN / LOSS** pill that flips the moment the 67% threshold is cleared, and every day in the week strip carries the same verdict.

Built with plain **HTML, CSS and vanilla JavaScript**. No frameworks, no build step, no fonts or CDNs. Everything is stored on the device.

---

## Run it

```bash
python3 -m http.server 8080
```

Open **http://localhost:8080**. The service worker and Home Screen install need `http://localhost` or HTTPS.

### Install on iPhone

1. Open the app in Safari.
2. **Share → Add to Home Screen**.
3. Launch it from the Home Screen — it runs standalone, respects the notch and home indicator, and works offline.

The service worker uses cache `aura-v9` and calls `skipWaiting` + `clients.claim`, so an existing Home Screen install picks up the current palette, the new app icons and the in-app mark on the next launch.

---

## The three tabs

| Tab | What lives there |
| --- | --- |
| **Today** | Week strip, progress card with the LOSS → WIN scale and same-day verdict, Superfocus, Ideal Day, Non-Negotiables |
| **Challenges** | Multi-day tracks (`7-Day No Sugar`, `14-Day Deep Work`) with a daily checklist, day bar and win count |
| **Programs** | Structured routines (`Morning Protocol`, `Strength Base`, `Focus Reset`) that add their routine items to your Non-Negotiables when started |

Each tab keeps its own **+** button, and Challenges/Programs have a pencil to reveal delete buttons on their cards.

---

## Using it

| Action | How |
| --- | --- |
| Complete a task | Tap the circle on the left of the card |
| Undo a completion | Tap the same circle again |
| Edit a task or habit | Tap the card text |
| Add a task | **+** in the *Ideal Day* header |
| Add a non-negotiable | **+** in the *Non-Negotiables* header |
| Delete a task, habit, challenge or program | Reveal **×** (pencil / edit) → tap it → **press and hold** to confirm |
| Review an earlier day | Tap a day in the week strip |
| Enter Superfocus | Flip the switch on the **Superfocus** card |
| Start a challenge | **Start challenge** on any challenge card |
| Start a program | **Start program** — its routine lands in Non-Negotiables |
| Change focus length | **Change length** inside Superfocus — quick presets (15 / 25 / 45 / 60) or an exact minutes + seconds stepper |

The task sheet has four fields: **Task**, **Why it matters** (the purpose line under the title), an optional **Time**, and the **Recurring / Non-negotiable** switch that moves a habit into the bottom section. The same sheet becomes a challenge/program form — name, purpose, length in days, and one checklist item per line.

---

## What's on screen

**Week strip** — the current Sunday-to-Saturday week. Each pill shows the weekday and date plus that day's own verdict: a glowing emerald dot for a day that cleared the threshold, a green tick circle for a perfect day, a red dot for a day that fell short, and a dim dot when nothing is done yet. Today is highlighted, the selected day is the filled gold pill, and future days stay disabled.

**Daily Progress Card** — the selected date, `X of Y completed`, a live percentage, and the progress scale. The track runs red → amber/gold → emerald/green. The filled portion and glowing marker move with each check and shift color at 34 % and 67 %. The scale is labelled **LOSS** and **WIN** at its ends, carries a physical pin at the **67 % win threshold**, and a live status pill reads either `N to win · 67% threshold` or `Win zone · threshold cleared`.

**Superfocus** — the toggle card opens a full-screen, dimmed focus view headed by the clean AURA mark. It runs a ring timer (25 minutes by default) with start/pause/reset, a session-complete chime, and a note that iOS Focus mode is still needed to block *system* notifications. **Change length** opens a dark glass panel with the four presets plus exact minutes (0–600) and seconds (0–59) steppers, so any length can be set — and a running session restarts at the new length. Sessions are counted per day.

**Ideal Day** — the non-recurring tasks. Every card carries the tap-to-complete circle, an optional time badge, a bold title, a small "why" line, and a streak pill (`🔥 5`) once a run exists.

**Non-Negotiables** — recurring daily habits in their own section, each with a golden spine, the same completion control and its own streak. Starting a program adds its routine items here.

**Challenges** — each card shows status (Not started / Day N / Won / Closed), a violet-to-gold progress meter, one mark per challenge day (won = emerald, missed = red, today = gold), and today's checklist. Checking every daily action wins the day; winning every day wins the challenge.

**Programs** — each card lists its routine items as numbered chips and tracks `Day N / length` plus a completion percentage. **Start** adds any missing routine items to Non-Negotiables (deduped by title) and stamps the start date. A running program has no restart control, so its day count cannot be reset by accident; only a completed program offers **Start again**.

Deleting anything is deliberately slow: the **×** opens a confirmation panel whose red button fills only while you keep pressing, and releasing early cancels.

**Streaks** — a task's streak counts consecutive days ending today, or ending yesterday while today is still open. The pill lights up from three days. The header keeps a *perfect streak*: consecutive days where every task was completed.

Completing a task plays a soft two-note Web Audio chime and a subtle check/card animation. With `prefers-reduced-motion`, transitions collapse.

All titles and purpose lines use `dir="auto"`, so Hebrew and English sit side by side correctly.

---

## Storage

Key: `aura.daily.v3` (the app reads the old `arena.daily.v2` — or `arena.daily.v1` — state once and migrates it).

```json
{
  "v": 3,
  "view": "today",
  "tasks": [
    {
      "id": "t...",
      "title": "Morning workout",
      "why": "Builds discipline and stamina",
      "time": "06:30",
      "recurring": false,
      "createdAt": 1764200000000
    }
  ],
  "history": { "2026-11-26": ["t...", "t..."] },
  "challenges": [
    {
      "id": "t...",
      "title": "7-Day No Sugar",
      "why": "Reset the dopamine baseline",
      "duration": 7,
      "daily": [{ "id": "t...", "title": "No added sugar" }],
      "startedAt": "2026-11-26",
      "log": { "2026-11-26": ["t..."] }
    }
  ],
  "programs": [
    {
      "id": "t...",
      "title": "Morning Protocol",
      "why": "Win the first hour",
      "duration": 21,
      "items": ["Wake at 06:00", "10 min sunlight"],
      "startedAt": null
    }
  ],
  "focus": { "sessions": 2, "date": "2026-11-26", "minutes": 25, "seconds": 0 }
}
```

`history` maps a local `YYYY-MM-DD` date to completed task ids, which is what progress, verdicts and streaks are computed from. Challenge `log` follows the same date-keyed shape, one entry per checklist item completed that day. There is no account and no network call.

Every tick is written to `localStorage` immediately and read back to confirm the write stuck; if the device refuses to save (private mode, full quota) the app says so once instead of pretending. The day is also re-read from storage whenever the app comes back to the foreground or is restored from the back/forward cache, so a returning view can never show stale or missing checkmarks, and the win threshold is computed from one shared helper used by both the progress card and the week strip.

---

## Files

```
index.html                 Three views, superfocus overlay, scale, sheet
style.css                  Near-black palette, ambient indigo/gold aura, header and
                           footer wordmark, cards, motion, tab bar
app.js                     State, migration, history, verdicts, streaks, challenges,
                           programs, focus timer, chime, zoom lock
manifest.json              PWA manifest (AURA, standalone, portrait)
sw.js                      Offline cache — aura-v9
AURALOGO.png               Official logo tile (source for every app icon)
AURALOGO-ONLY.png          Wordmark alone, alpha cut (source for the in-app mark)
assets/aura-mark.png       Header/footer mark, trimmed and scaled from AURALOGO-ONLY
icons/                     PNG icons (any + maskable), apple-touch icon and favicon
                            built from AURALOGO
tools/make_icons.py        Icon + mark generator (Python + Pillow)
```

---

## Mobile details

- Viewport is locked (`maximum-scale=1.0, user-scalable=no, viewport-fit=cover`), every input and textarea is at least `16px` so Safari never zooms on focus, and `touch-action: manipulation` plus `gesture*`, multi-touch and double-tap guards stop pinch and double-tap zoom.
- Pulling down at the top of the page shows AURA's own refresh indicator (dark glass, indigo/gold glow, gold → violet spinner) instead of the browser's grey sheet; releasing past the trigger reloads. Every load is covered by a dark AURA veil with the mark and the same spinner, and `html` paints `#08070b` in the overscroll area, so no blank/grey frame is ever visible.
- Safe-area insets pad the header, tab bar, focus view and bottom sheet on notched iPhones.
- The sheet slides up on mobile and becomes a centered dialog on wider screens; Superfocus hides the tab bar and locks background scroll while open.
- The theme color and splash background use `#08070b`, the status bar is `black-translucent` so the dark surface runs under it, and `color-scheme: dark` keeps native controls, date/time pickers and form fields dark.

---

## Rebranding the icons

All icons are generated from `AURALOGO.png`, and the in-app mark from `AURALOGO-ONLY.png`:

```bash
python3 tools/make_icons.py
```

The tile keeps its own dark plate: the script lifts the letter rows out (mirroring the background above and below them, so the plate joins without a seam) and lays the wordmark on top at 86% of the edge, 68% for the maskable icon so it stays inside Android's 80% safe circle, and 96% for the 64px favicon. It writes `icon-512.png`, `icon-192.png`, `apple-touch-icon.png`, `icon-maskable-512.png` and `favicon.png`.

It also writes `assets/aura-mark.png` — the wordmark trimmed to its visible alpha and scaled with premultiplied alpha, so the neon edge stays clean on the dark header and footer. The mark is never redrawn, recut or recoloured — only scaled and placed.
