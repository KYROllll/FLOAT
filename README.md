# ARENA // DAILY OS

A mobile-first daily discipline and streak tracker. One dark screen: the week, today's plan, the non-negotiables, and the streak that proves you showed up.

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

The service worker uses a new cache (`arena-v1`) and calls `skipWaiting` + `clients.claim`, so an existing Home Screen install picks up this version on the next launch instead of serving the old FLOAT shell.

---

## Using it

| Action | How |
| --- | --- |
| Complete a task | Tap the circle on the left of the card |
| Undo a completion | Tap the same circle again |
| Edit a task or habit | Tap the card text |
| Add a task | **+** in the *Today's Plan* header |
| Add a non-negotiable | **+** in the *Non-Negotiables* header |
| Delete tasks | **Pencil** → tap **×** on any card |
| Review an earlier day | Tap a day in the week strip |
| Change the day's plan | Same as above — every check is written to that date |

The sheet has four fields: **Task**, **Why it matters** (the purpose line under the title), an optional **Time**, and the **Recurring / Non-negotiable** switch that moves a habit into the bottom section.

---

## What's on screen

**Week strip** — the current Sunday-to-Saturday week. Each pill shows the weekday and date; days with completions get a small emerald dot. Today is highlighted, the selected day is the filled green pill, and future days stay disabled.

**Daily Progress Card** — the selected date, `X of Y completed`, a live percentage, and the progress scale. The track runs red → amber → emerald; the filled portion and the glowing marker move with each check, and both shift color as you cross 34 % and 67 %. The marker and percentage change color with the same thresholds.

**Today's Plan** — the non-recurring tasks. Every card carries the tap-to-complete circle, an optional time badge, a bold title, a small "why" line, and a streak pill (`🔥 5`) once a run exists.

**Non-Negotiables** — recurring daily habits in their own section, each with an emerald spine, the same completion control and its own streak.

**Streaks** — a task's streak counts consecutive days ending today, or ending yesterday while today is still open. The pill lights up from three days. The header keeps a *perfect streak*: consecutive days where every task was completed.

Completing a task plays a soft two-note Web Audio chime and a subtle check/card animation. With `prefers-reduced-motion`, transitions collapse.

All titles and purpose lines use `dir="auto"`, so Hebrew and English sit side by side correctly. Starter tasks ship in both languages.

---

## Storage

Key: `arena.daily.v1`

```json
{
  "v": 1,
  "tasks": [
    {
      "id": "t...",
      "title": "אימון בוקר",
      "why": "בונה משמעת וסיבולת",
      "time": "06:30",
      "recurring": false,
      "createdAt": 1764200000000
    }
  ],
  "history": {
    "2026-11-26": ["t...", "t..."]
  }
}
```

Tasks hold their own title, purpose, optional time and recurring flag. `history` maps a local `YYYY-MM-DD` date to the task ids completed that day, which is what both progress and streaks are computed from. Deleting a task removes it from history too. There is no account and no network call.

---

## Files

```
index.html                 Week strip, progress card, task sections, edit sheet
style.css                  Midnight slate theme, cards, progress scale, sheet, motion
app.js                     State, storage, history, streaks, rendering, chime, zoom lock
manifest.json              PWA manifest (ARENA, standalone, portrait)
sw.js                      Offline cache — arena-v1
icons/                     PNG icons (any + maskable) and SVG favicon
tools/make_icons.py        Icon generator (Python + Pillow)
```

---

## Mobile details

- Viewport is locked (`maximum-scale=1.0, user-scalable=no, viewport-fit=cover`), every input is at least `16px` so Safari never zooms on focus, and `touch-action: manipulation` plus `gesture*`, multi-touch and double-tap guards stop pinch and double-tap zoom.
- Safe-area insets pad the header, footer and bottom sheet on notched iPhones.
- The sheet slides up on mobile and becomes a centered dialog on wider screens.
- The theme color, splash background and status bar all use `#070b14`.
