# AURA // DAILY OS

A mobile-first daily discipline OS. One deep dark screen: the week, today's plan, the non-negotiables, a distraction-free focus timer, and the multi-day challenges that prove you showed up.

The brand comes from `AURALOGO.png`: near-black letters, a deep violet/indigo core, and a luminous golden-yellow aura. The app sits on the same near-black (`#08070b`) as the wordmark's letter core, and a slow ambient layer drifts those indigo and gold lights behind the whole UI. The in-app mark is `AURALOGO-ONLY.png` — the wordmark with its own alpha edge — so the neon rim sits straight on the dark surface in the header and again, small, above the footer line, with no plate or white fringe behind it. The daily progress scale keeps its own red → amber → green language so LOSS and WIN never lose their meaning — the progress card carries a live **WIN / LOSS** pill that flips the moment the 67% threshold is cleared, and every day in the week strip carries the same verdict. A day with nothing scheduled stays neutral: it reads **CLEAR** and gets no red dot.

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

The service worker uses cache `aura-v17` and calls `skipWaiting` + `clients.claim`, so an existing Home Screen install picks up the current palette, the new app icons and the in-app mark on the next launch.

---

## The three tabs

| Tab | What lives there |
| --- | --- |
| **Today** | Week strip, progress card with the LOSS → WIN scale and same-day verdict, Superfocus, Ideal Day, Non-Negotiables, today's Workout (with the studio behind a **+**), the running Challenge checklists, and legacy Program Routine |
| **Challenges** | Short, high-pressure tracks (`7-Day No Sugar`, `14-Day Deep Work`) that run automatically between their start and end dates, with a daily checklist, day bar, win count and a clear **WIN / LOSS** verdict when the window closes |
| **Calendar** | A month grid of real outcomes: green **WIN** days, red **LOSS** days, quiet grey days with nothing scheduled, and a monthly win/loss tally. Tap any day to open it on Today |

Every tab has its own header action: **+** on Ideal Day and Non-Negotiables, **+** plus a pencil on Challenges, and **+** plus the manage pencil on Today's Workout. Workouts have no page of their own — the studio opens from Today, and today's session lives there.

---

## Using it

| Action | How |
| --- | --- |
| Complete a task | Tap the circle on the left of the card |
| Undo a completion | Tap the same circle again |
| Edit a task or habit | Tap the card text |
| Add a task | **+** in the *Ideal Day* header |
| Add a non-negotiable | **+** in the *Non-Negotiables* header |
| Delete a task, habit, challenge or workout | Reveal **×** (pencil / edit) → tap it → **press and hold** to confirm → `✓` toast. Workouts: pencil in the *Today's Workout* header lists every saved session with its **✎** / **×** |
| Review an earlier day | Tap a day in the week strip — it shows that date's own tasks and ticks, and can only be ticked, never re-edited |
| Enter Superfocus | Flip the switch on the **Superfocus** card |
| Run a challenge | Set its start and end dates when you create or configure it — it starts and finishes on its own, and its daily actions appear on Today while it runs |
| Start a workout | **+** in the *Today's Workout* header opens the builder; choose training days and program weeks, watch the dates and balance update, then **Save** or **Start workout**. Tick each exercise on Today as you finish it |
| Complete today's workout | Tick **Mark workout complete** in Today's Workout block — every exercise is ticked with it, and the main scale moves |
| Browse outcomes | Open the **Calendar** tab, step months with the arrows, and tap a day to review it on Today |
| See how a movement is done | Tap any exercise name in the library, plan, session or session card — the guide opens with an animated figure and the muscles it targets |
| Change focus length | **Change length** inside Superfocus — quick presets (15 / 25 / 45 / 60) or an exact minutes + seconds stepper |

The task sheet has four fields: **Task**, **Why it matters** (the purpose line under the title), an optional **Time**, and the **Recurring / Non-negotiable** switch that moves a habit into the bottom section. A challenge form adds explicit **start date** and **end date** fields (the length follows the range). The workout builder takes a name, training days, a program length in weeks, a target duration, and exercises from the bodyweight library or a custom entry with its own muscle group and sets/reps.

---

## What's on screen

**Week strip** — the current Sunday-to-Saturday week. Each pill shows the weekday and date, then a spaced status marker: an open/current day carries a glowing emerald dot when it is on track (at or above the 67% threshold) and a red dot when it is scheduled but still below it. Once a scheduled day is closed, a winning day becomes a green `✓` and a losing day a red `✕`. A date with nothing scheduled stays neutral — a dim grey dot, no red mark and no LOSS. Today is highlighted, the selected day is the filled gold pill, and future days stay disabled. On the gold pill the marker is a bare, darker dot — no white disc or halo behind it.

**Calendar** — a Sunday-first month grid. Each elapsed day is coloured by its real outcome: green for a WIN, red for a LOSS, and a quiet neutral tile when nothing was scheduled; future days are faded and disabled. A monthly tally counts wins and losses, the arrows step through months, today carries a gold ring, and tapping any day jumps to that date on Today. The same `dayResult` helper feeds the card, the week strip and the calendar, so they can never disagree.

**Daily Progress Card** — the selected date, `X of Y completed`, a live percentage, and the progress scale. The track runs red → amber/gold → emerald/green. The filled portion and glowing marker move with each check and shift color at 34 % and 67 %. The scale is labelled **LOSS** and **WIN** at its ends, carries a physical pin at the **67 % win threshold**, and a live status pill reads either `N to win · 67% threshold` or `Win zone · threshold cleared`. An empty day is neutral: it wears a grey **CLEAR** pill, `Nothing scheduled · neutral day`, and a grey marker instead of a false LOSS.

**Superfocus** — the toggle card opens a full-screen, dimmed focus view headed by the clean AURA mark. It runs a ring timer (25 minutes by default) with start/pause/reset, a session-complete chime, and a note that iOS Focus mode is still needed to block *system* notifications. **Change length** opens a dark glass panel with the four presets plus exact minutes (0–600) and seconds (0–59) steppers, so any length can be set — and a running session restarts at the new length. Sessions are counted per day.

**Ideal Day** — the non-recurring tasks. Every card carries the tap-to-complete circle, an optional time badge, a bold title, a small "why" line, and a streak pill (`🔥 5`) once a run exists.

**Today's Workout** — a session scheduled for today appears on the main Today view without opening the studio: its title, focus and exercise list, a big **Mark workout complete** check, and one tap-to-tick row per movement with its own movement guide. Ticking the master check completes every exercise, writes today's workout log and moves the main scale; opening the studio from a card keeps the same log.

**Active Challenges** — every challenge whose date window contains today shows its own card on Today with the day number, today's win count and a tap-to-tick checklist. Those actions are part of the same day score as tasks and workouts, so finishing them clears the day, and the WIN / LOSS verdict stays in the Challenges tab when the window closes.

**Non-Negotiables** — the user's own recurring habits in their own section, each with a golden spine, the same completion control and its own streak. This list stays personal: program items never enter it, so starting a track cannot blur everyday habits with temporary items.

**Program Routine** — legacy routines that were already running keep working: shows the selected day's program items, grouped under a violet **◆ Program name** header with `Day N of length · X of Y done`. Each card carries the program badge, cannot be opened or deleted as a standalone ad-hoc task, and checks off in step with that day's record. Program cards are retired, so these routines are read-only history plus today's check-off. Checking a day writes only that date's record, so a new calendar day starts with every routine item unchecked while earlier days keep their own ticks. When the program ends, its items retire from Today and the day's totals (they are not deleted), while past days keep them.

**Challenges** — short, high-pressure tracks that run by their dates alone: no start button, no forgotten beginning. Each card shows its explicit **start** and **end** date, status (Starts … / Day N / Win / Loss), a violet-to-gold progress meter, one mark per challenge day (won = emerald, missed = red, today = gold), and today's checklist. Checking every daily action wins the day. When the window closes, a verdict banner declares **WIN** or **LOSS** against the same 67% standard as the daily scale: the target is at least 67% of the challenge's days won (5 of 7, 10 of 14), and the banner states the days won, the target and how far it landed. Clearing every day wins early and shows the same banner. Creating or configuring a challenge takes a start date and an end date (or a start date plus length), and the card always states both.

**Workouts** — one clean studio reached from **+** in Today's Workout header, with no page or tab of its own. The builder opens preloaded with today's scheduled session (or empty when nothing is scheduled). The library holds 23 equipment-free movements — push-up variations, pike and diamond push-ups, dips, squats, lunges, glute bridges, planks, hollow holds, supermans, bird dogs and more — filterable by muscle, plus a custom entry with its own group and sets/reps. Every movement has a **sets × reps/secs** stepper in the plan.

The builder keeps two live, visual readings instead of a pile of scores. **Balance** is the same red → amber → green scale as the day progress bar: it moves right as the plan covers more muscle groups, spreads volume across them, approaches the target time and adds variety, then names the next fix in one plain sentence (`Add chest work to round it out`). **Muscles** is a straight, front-view body map: each covered group lights green while the rest stay dim, with a count (`3 / 5`), compact group tags and a **Full Body** flag at 4 of 5 groups with 3+ movements. **Program** sets the length in weeks (2 / 4 / 6 / 8 or any 1–12) and immediately reveals the dated grid: every training day is green, every rest day stays quiet, and days before the program starts are faded. **Target time** offers 30m and 45m presets plus any custom minutes, and the estimate (`≈ 31 min planned`) sits beside it.

Tapping any exercise name (library, plan, session or Today's Workout) opens the **movement guide**: an upright animated human figure demonstrates the motion, a small upright body map lights only the muscles it targets, and a one-line cue explains the setup and the rep. Floor work faces left, matching the push-up tab icon. The figure is drawn in SVG and animated with SMIL, so it works offline with no video files. `prefers-reduced-motion` shows the still pose and cue instead.

**Save** stores the session as a reusable template; **Start workout** saves and opens the session view, where tapping an exercise ticks it, the meter and `N of M done` tally update, and ticking the last exercise or tapping **Finish workout** logs the session, closes the studio and clears the builder so the next session starts clean. The manage pencil on Today's Workout lists every saved template with its training days and exercise count, and opens **✎** (edit) or **×** (delete, hold to confirm) for each one.

Starting a challenge, saving or finishing a workout, and every deletion confirms with a green `✓` toast. Deleting anything is deliberately slow: the **×** opens a confirmation panel whose red button fills only while you keep pressing, and releasing early cancels.

**Streaks** — a task's streak counts consecutive days ending today, or ending yesterday while today is still open, matched by a stable habit key rather than a record id, so renaming or re-adding the same routine keeps its run. The first completion shows no pill; the count starts at `🔥 1` on the **second consecutive day** (two days done), then `2`, `3` and so on. The header keeps a *perfect streak*: consecutive days where every task was completed.

Completing a task is silent — no chime — with only the subtle check/card animation (and a short haptic where the device supports it). The Superfocus timer keeps its session-complete chime. With `prefers-reduced-motion`, transitions collapse.

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
      "createdAt": 1764200000000,
      "programId": "",
      "programItem": ""
    }
  ],
  "days": {
    "2026-11-26": {
      "items": [
        {
          "id": "t...",
          "title": "Morning workout",
          "why": "Builds discipline and stamina",
          "time": "06:30",
          "recurring": false,
          "programId": "",
          "programItem": "",
          "programTitle": ""
        }
      ],
      "done": ["t..."]
    }
  },
  "challenges": [
    {
      "id": "t...",
      "title": "7-Day No Sugar",
      "why": "Reset the dopamine baseline",
      "duration": 7,
      "startDate": "2026-11-26",
      "endDate": "2026-12-02",
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
  "workouts": [
    {
      "id": "t...",
      "title": "Push Day",
      "why": "Drive pressing volume",
      "focus": "Chest · Shoulders · Triceps",
      "days": [1, 4],
      "weeks": 4,
      "startDate": "2026-11-26",
      "target": 40,
      "exercises": [
        { "id": "t...", "name": "Push-Up", "sets": 3, "reps": 12,
          "group": "chest", "unit": "reps" }
      ],
      "createdAt": 1764200000000,
      "log": {
        "2026-11-26": { "started": true, "done": ["t..."], "finished": true }
      }
    }
  ],
  "focus": { "sessions": 2, "date": "2026-11-26", "minutes": 25, "seconds": 0 }
}
```

`days` maps a local `YYYY-MM-DD` date to a full snapshot of that date: the exact `items` scheduled on it (title, why, time, recurrence and program link) and the `done` ids ticked on it. Every day keeps its own copy, so adding, editing or deleting a task on one date never rewrites another: switching to an earlier day shows what that day actually held, what was checked (✓), and that day's score. The current day is the only snapshot kept in step with the live task list; past days are sealed and can be ticked but not re-edited. Empty days have no record, which is why they stay neutral — no LOSS and no red dot. Days stored by older builds as `history` (a bare list of completed ids) are migrated once into best-effort snapshots, so no logged tick is lost. Tasks and day items carry a stable `key` derived from the habit name; the streak follows that key across renames and re-adds. Challenge `log` keeps its own date-keyed shape, one entry per checklist item completed that day; `startDate`/`endDate` are the challenge's beginning and finish, and `duration` always matches that range. The window runs on its own — there is no separate started flag. Workout `log` is date-keyed too: `started` marks an active session, `done` holds the exercise ids ticked that day, and `finished` closes the session. `weeks` plus `startDate` define the program window, so only dates inside it are scheduled sessions. `createdAt` dates the template, so weekdays before it existed stay rest days instead of being counted as missed sessions. A task created by a program carries `programId` (the program), `programItem` (the routine line it fills) and, inside a day snapshot, `programTitle` so a past day still reads correctly after that program is deleted. A linked task counts toward a day only while its program covers that date, so a finished track retires its items without erasing them. There is no account and no network call.

Every tick is written to `localStorage` immediately and read back to confirm the write stuck; if the device refuses to save (private mode, full quota) the app says so once instead of pretending. The day is also re-read from storage whenever the app comes back to the foreground or is restored from the back/forward cache, so a returning view can never show stale or missing checkmarks, and the win threshold is computed from one shared helper used by both the progress card and the week strip.

---

## Files

```
index.html                 Three views, superfocus overlay, scale, sheet, studio, guide
style.css                  Near-black palette, ambient indigo/gold aura, header and
                           footer wordmark, cards, motion, tab bar
app.js                     State, migration, per-day snapshots, verdicts, streaks,
                           challenges, workouts, body map, calendar, demos, focus timer
manifest.json              PWA manifest (AURA, standalone, portrait)
sw.js                      Offline cache — aura-v17
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
