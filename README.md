# AURA // DAILY OS

A mobile-first daily discipline OS. One deep dark screen: the week, today's plan, the non-negotiables, an in-page Superfocus mode that dims everything else, and the multi-day challenges that prove you showed up.

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

The service worker uses cache `aura-v23` and calls `skipWaiting` + `clients.claim`, so an existing Home Screen install picks up the current palette, the new app icons and the in-app mark on the next launch.

---

## The three tabs

| Tab | What lives there |
| --- | --- |
| **Today** | Week strip, progress card with the LOSS → WIN scale and same-day verdict, in-page Superfocus, Ideal Day, Non-Negotiables, and **Active Challenges** only while a challenge is running |
| **Challenges** | Short, high-pressure tracks (`7-Day No Sugar`, `14-Day Deep Work`) that run automatically between their start and end dates, shown with details, dates, progress, day bar, win count and a clear **WIN / LOSS** verdict. Read-only: today's actions are checked off on Today |
| **Calendar** | A month grid of real outcomes: green **WIN** days, red **LOSS** days, quiet grey days with nothing scheduled, and a monthly win/loss tally. Tap any day to open it on Today |

Every tab has its own header action: **+** on Ideal Day and Non-Negotiables, and **+** plus a pencil on Challenges. Today stays focused on what can be ticked right now.

---

## Using it

| Action | How |
| --- | --- |
| Complete a task | Tap the circle on the left of the card |
| Undo a completion | Tap the same circle again |
| Edit a task or habit | Tap the card text |
| Add a task | **+** in the *Ideal Day* header |
| Add a non-negotiable | **+** in the *Non-Negotiables* header |
| Delete a task, habit or challenge | Reveal **×** (pencil / edit) → tap it → **press and hold** to confirm → `✓` toast |
| Review an earlier day | Tap a day in the week strip — it shows that date's own tasks and ticks, and can only be ticked, never re-edited |
| Enter Superfocus | Flip the switch on the **Superfocus** card. Today stays put; tabs lock and everything except your chosen tasks fades back |
| Choose what stays sharp | Tap **Change** in the focus bar, then pick one or more tasks or challenge actions. **Done** returns to the dimmed day |
| Leave Superfocus | Tap **Exit** in the focus bar (or press Escape) — the tab bar and the rest of Today come back |
| Run a challenge | Set its start and end dates when you create or configure it — it starts and finishes on its own, and its daily actions appear on Today while it runs. Tick them on Today; the Challenges tab only reports |
| Add a task while reviewing an earlier day | Tap **+** — the task is added to the date on screen, so any day can be filled in |
| Browse outcomes | Open the **Calendar** tab, step months with the arrows, and tap a day to review it on Today |

The task sheet has four fields: **Task**, **Why it matters** (the purpose line under the title), an optional **Time**, and the **Recurring / Non-negotiable** switch that moves a habit into the bottom section. A regular task belongs to the day it was created on and does not roll into tomorrow; only Non-Negotiables repeat. A challenge form adds explicit **start date** and **end date** fields (the length follows the range) and a **Habit / Streak** or **Build / Milestone** mode. Habit mode repeats one daily checklist; Build mode splits the window into day slots (Day 1, Day 2, …) and lets each day carry its own milestone or checklist. Write `Day 1`, `Day 2:` or a blank line between day blocks — the parser maps each block to its numbered date, and any missing day keeps a winnable `Day N milestone` slot.

---

## What's on screen

**Week strip** — the current Sunday-to-Saturday week. Each pill shows the weekday and date, then a spaced status marker: an open/current day carries a glowing emerald dot when it is on track (at or above the 67% threshold) and a red dot when it is scheduled but still below it. Once a scheduled day is closed, a winning day becomes a green `✓` and a losing day a red `✕`. A date with nothing scheduled stays neutral — a dim grey dot, no red mark and no LOSS. A rest day carries a violet moon instead of a ✓ or ✕, so it never reads as a missed day. Today is highlighted, the selected day is a dark-glass pill with a soft champagne edge, and future days stay disabled. The marker keeps its own status colour inside the pill, so a won day still reads green.

**Calendar** — a Sunday-first month grid. Each elapsed day is coloured by its real outcome: green for a WIN, red for a LOSS, and a quiet neutral tile when nothing was scheduled; future days are faded and disabled. A monthly tally counts wins, losses and rest days, the arrows step through months, today carries a gold ring, and tapping any day jumps to that date on Today. A rest day is a violet neutral tile marked `R`: never red, never a win, and excluded from the win/loss tally. The same `dayResult` helper feeds the card, the week strip and the calendar, so they can never disagree.

**Daily Progress Card** — the selected date, `X of Y completed`, a live percentage, and the progress scale. The track runs red → amber/gold → emerald/green. The filled portion and glowing marker move with each check and shift color at 34 % and 67 %. The scale is labelled **LOSS** and **WIN** at its ends, carries a physical pin at the **67 % win threshold**, and a live status pill reads either `N to win · 67% threshold` or `Win zone · threshold cleared`. An empty day is neutral: it wears a grey **CLEAR** pill, `Nothing scheduled · neutral day`, and a grey marker instead of a false LOSS. **Rest day** in the card marks the selected date as intentional recovery: the verdict becomes a violet **REST**, the scale reads `Rest day · streak frozen`, and the day is excluded from wins, losses and the perfect streak. Tapping it again clears the rest day.

**Superfocus** — the toggle card turns Today itself into the focus surface. There is no separate timer screen: flipping the switch keeps the week, progress card, tasks and challenges in place, then blurs and dims everything except the chosen work. A sticky focus bar at the top names how many tasks are in play, with **Change** and **Exit**. **Change** opens the picker: every task and challenge action on Today gets a checkbox, and only checked rows stay sharp. The first time it is turned on with nothing chosen, the unfinished work is selected automatically, so the screen never opens with everything dimmed. While Superfocus is active the tab bar is hidden and tab switching is blocked — the only ways out are **Exit** or Escape. Turning it off restores the full view instantly. Chosen tasks stay tappable and tickable; unselected cards are blurred, dimmed and inert.

**Ideal Day** — the one-day tasks. Each belongs to the date it was created on: it is tickable there and does not follow you into tomorrow. Every card carries the tap-to-complete circle, an optional time badge, a bold title, a small "why" line, and a streak pill (`🔥 5`) once a run exists.

**Active Challenges** — every challenge whose date window contains today shows its own card on Today with the day number, today's win count and a tap-to-tick checklist. Titles, day counters and action rows follow their own text direction, so Hebrew and English cards both align from the correct edge. The block is rendered only when at least one challenge is running — with none active the section is absent, not an empty placeholder, and it carries no extra category label. Challenges never appear on a date outside their start-to-end window, so a day before the track began or after it closed is not judged against it. This is the only place challenge actions are checked off: the Challenges tab shows the same day's ticks as read-only detail. Those actions are part of the same day score as tasks and habits, so finishing them clears the day, and the WIN / LOSS verdict stays in the Challenges tab when the window closes. Habit challenges repeat their checklist every day; Build challenges show only the current day's milestone on Today, so each day is judged by its own slot. When every item on the card is ticked, the chip flips to a green **✓ DAY WON** in the same green as the check circles. On a rest day the card reads **REST DAY** and no day win is announced.

**Non-Negotiables** — the user's own recurring habits in their own section, each with a golden spine, the same completion control and its own streak. This list stays personal: program items never enter it, so starting a track cannot blur everyday habits with temporary items.

**Challenges** — short, high-pressure tracks that run by their dates alone: no start button, no forgotten beginning. Each card shows its explicit **start** and **end** date, status (Starts … / Day N / Win / Loss), a violet-to-gold progress meter, one mark per challenge day (won = emerald, missed = red, today = gold), and today's checklist as plain read-only lines — there is no check circle or other control in this tab at all; the actual check-off happens on Today. Checking every action for that day wins the day. **Habit / Streak** challenges repeat one checklist across the window; **Build / Milestone** challenges generate a day slot per date, and each slot can hold its own milestone or checklist. When the window closes, a verdict banner declares **WIN** or **LOSS** against the same 67% standard as the daily scale, measured over active days only: the target is at least 67% of the challenge's non-rest days won, and the banner states the days won, the target and how far it landed. Clearing every active day wins early and shows the same banner. Rest days never count as a win or a loss and never break the run. Creating or configuring a challenge takes a start date and an end date (or a start date plus length), and the card always states both.

Starting a challenge and every deletion confirms with a green `✓` toast. Deleting anything is deliberately slow: the **×** opens a confirmation panel whose red button fills only while you keep pressing, and releasing early cancels.

**Streaks** — a task's streak counts consecutive days ending today, or ending yesterday while today is still open, matched by a stable habit key rather than a record id, so renaming or re-adding the same routine keeps its run. The first completion shows no pill; the count starts at `🔥 1` on the **second consecutive day** (two days done), then `2`, `3` and so on. The header keeps a *perfect streak*: consecutive days where every task was completed.

Completing a task is silent — no chime — with only the subtle check/card animation (and a short haptic where the device supports it). With `prefers-reduced-motion`, transitions collapse.

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
      "date": "2026-11-26",
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
      "mode": "habit",
      "daily": [{ "id": "t...", "title": "No added sugar" }],
      "plan": [],
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
  "focus": {
    "active": false,
    "targets": ["task:t...", "challenge:t...:t..."]
  }
}
```

`days` maps a local `YYYY-MM-DD` date to a full snapshot of that date: the exact `items` scheduled on it (title, why, time, recurrence and program link) and the `done` ids ticked on it. Every day keeps its own copy, so adding, editing or deleting a task on one date never rewrites another: switching to an earlier day shows what that day actually held, what was checked (✓), and that day's score. The current day is the only snapshot kept in step with the live task list; past days are sealed and can be ticked but not re-edited. A non-recurring task carries `date`, the one day it belongs to; only tasks with `recurring: true` are rebuilt into every new day. A new task gets the `date` of the day on screen, and is also written into that day's own record, so an earlier date can still be filled in and shows the task immediately. Empty days have no record, which is why they stay neutral — no LOSS and no red dot. Days stored by older builds as `history` (a bare list of completed ids) are migrated once into best-effort snapshots, so no logged tick is lost. Tasks and day items carry a stable `key` derived from the habit name; the streak follows that key across renames and re-adds. Challenge `log` keeps its own date-keyed shape, one entry per checklist item completed that day; `startDate`/`endDate` are the challenge's beginning and finish, and `duration` always matches that range. A challenge carries `mode` (`habit` or `build`): habit mode stores its recurring checklist in `daily`, while build mode stores one `plan` slot per day, each with its own `items`. `restDays` is a date-keyed map of intentional recovery days; it sits beside `days` so a rest day can never be mistaken for a win, a loss or an empty day. The window runs on its own — there is no separate started flag. Workout `log` is date-keyed too: `started` marks an active session, `done` holds the exercise ids ticked that day, and `finished` closes the session. `weeks` plus `startDate` define the program window, so only dates inside it are scheduled sessions. `createdAt` dates the template, so weekdays before it existed stay rest days instead of being counted as missed sessions. `focus.targets` holds the ids of the tasks and challenge actions kept sharp in Superfocus (`task:<id>` or `challenge:<challengeId>:<itemId>`); `focus.active` is the on/off state, and targets that no longer exist on Today are ignored. Workout and program records from earlier builds stay in storage, but neither is rendered on Today anymore. A task created by a program carries `programId` (the program), `programItem` (the routine line it fills) and, inside a day snapshot, `programTitle` so a past day still reads correctly after that program is deleted. A linked task counts toward a day only while its program covers that date, so a finished track retires its items without erasing them. There is no account and no network call.

Every tick is written to `localStorage` immediately and read back to confirm the write stuck; if the device refuses to save (private mode, full quota) the app says so once instead of pretending. The day is also re-read from storage whenever the app comes back to the foreground or is restored from the back/forward cache, so a returning view can never show stale or missing checkmarks, and the win threshold is computed from one shared helper used by both the progress card and the week strip.

---

## Files

```
index.html                 Three views, in-page Superfocus, scale, sheet, studio, guide
style.css                  Near-black palette, ambient indigo/gold aura, header and
                           footer wordmark, cards, motion, tab bar
app.js                     State, migration, per-day snapshots, verdicts, streaks,
                           challenges, workouts, body map, calendar, demos, Superfocus
manifest.json              PWA manifest (AURA, standalone, portrait)
sw.js                      Offline cache — aura-v23
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
- Safe-area insets pad the header, tab bar, focus bar and bottom sheet on notched iPhones.
- The sheet slides up on mobile and becomes a centered dialog on wider screens; Superfocus hides the tab bar and blocks tab switching while it is on.
- The theme color and splash background use `#08070b`, the status bar is `black-translucent` so the dark surface runs under it, and `color-scheme: dark` keeps native controls, date/time pickers and form fields dark.

---

## Rebranding the icons

All icons are generated from `AURALOGO.png`, and the in-app mark from `AURALOGO-ONLY.png`:

```bash
python3 tools/make_icons.py
```

The tile keeps its own dark plate: the script lifts the letter rows out (mirroring the background above and below them, so the plate joins without a seam) and lays the wordmark on top at 86% of the edge, 68% for the maskable icon so it stays inside Android's 80% safe circle, and 96% for the 64px favicon. It writes `icon-512.png`, `icon-192.png`, `apple-touch-icon.png`, `icon-maskable-512.png` and `favicon.png`.

It also writes `assets/aura-mark.png` — the wordmark trimmed to its visible alpha and scaled with premultiplied alpha, so the neon edge stays clean on the dark header and footer. The mark is never redrawn, recut or recoloured — only scaled and placed.
