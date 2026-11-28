# AURA // DAILY OS

A mobile-first daily discipline OS. One deep dark screen: the week, today's plan, the non-negotiables, an in-page Superfocus mode that dims everything else, and the multi-day challenges that prove you showed up.

The brand comes from `AURALOGO.png`: near-black letters, a deep violet/indigo core, and a luminous golden-yellow aura. The app sits on the same near-black (`#08070b`) as the wordmark's letter core, and a slow ambient layer drifts those indigo and gold lights behind the whole UI. The in-app mark is `AURALOGO-ONLY.png` — the wordmark with its own alpha edge — so the neon rim sits straight on the dark surface in the header and again, small, above the footer line, with no plate or white fringe behind it. The daily progress scale keeps its own red → amber → green language so LOSS and WIN never lose their meaning — the progress card carries a live **WIN / LOSS** pill that flips the moment the 67% threshold is cleared, and every day in the week strip carries the same verdict. A day with nothing scheduled stays neutral: it reads **CLEAR** and gets no red dot.

Built with plain **HTML, CSS and vanilla JavaScript**. No frameworks, no build step, no fonts or CDNs. The app still works from local storage, and a verified AURA account keeps tasks, habits, streaks and progress in sync across devices.

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

The service worker uses cache `aura-v44` (SHELL_VERSION in `sw.js`) and calls `skipWaiting` + `clients.claim`, so an existing Home Screen install picks up the current palette, the new app icons and the in-app mark on the next launch.

**Shell updates can never mix versions.** Every script and stylesheet is requested with the shell version (`app.js?v=42`, `style.css?v=42`), and `sw.js` caches with exact matching, so a new `index.html` can never be paired with an older cached `app.js` — the failure that once left `#authGate` hidden on live installs. The worker precaches with `cache: 'reload'` (GitHub Pages sends `max-age=600`, so the HTTP cache is not trusted), `register()` uses `updateViaCache: 'none'`, and the app checks `registration.update()` on load and whenever it returns to the foreground, takes over a waiting worker immediately, and reloads once when a newer worker claims the page. Bump `SHELL_VERSION` (and the `?v=` queries) together with any shell change.

On mobile the app's background is a fixed layer pinned to the viewport, not a fixed-attachment body gradient: iOS Safari sizes that gradient once, so switching to a shorter tab (Challenges with one track, say) used to leave a bare grey strip under the content. The canvas itself is a flat near-black, the page is at least `100dvh` tall, and a tab switch resets the scroll offset before the new view is painted — so no view, repaint or toolbar collapse can expose an empty block above the tab bar.

---

## Access code + AURA account

AURA opens in two steps:

1. **Access code** — the existing server-verified gate. Nothing changes here.
2. **AURA account** — after a valid code, the branded account screen appears. The user enters an email, AURA mails a **one-time code**, and only that code opens the workspace. There is no password and no account menu to choose from: one screen, one code. A verified session is restored on the next launch, and **Lock** only hides the app; it does not sign you out.

Nothing in the UI or the emails names the account service behind AURA — every string, error and subject line is AURA's own.

The account gate uses the project's **publishable/anon key** only. A `service_role` key must never be shipped to the browser. Configuration lives in one public place:

- `supabase-client.js` — `DEFAULT_URL` and `DEFAULT_KEY`

Both can also be overridden at runtime with `window.AURA_SUPABASE_URL` and `window.AURA_SUPABASE_ANON_KEY` before `supabase-client.js` loads.

### App address (must stay in one place)

The live app is **`https://kyrollll.github.io/AURA/`** — four `l`s, matching the GitHub account `KYROllll`. The three-`l` `kyrolll.github.io/AURA/` does not exist and returns **404**, so it must never be used in a redirect, a template or a mail link.

The address is declared once as `<meta name="aura-app-url">` in `index.html` and as `DEFAULT_APP_URL` in `supabase-client.js` (override with `window.AURA_APP_URL`). The same address must also be set in the account project's dashboard:

- **Authentication → URL Configuration → Site URL**: `https://kyrollll.github.io/AURA/`
- **Redirect URLs**: add `https://kyrollll.github.io/AURA/**` (and `http://localhost:8080/**` for local work)

The emailed template is code-only, so there is no callback page to land on. If a link-style template is ever used instead, the app also absorbs a session from the URL fragment and strips it from the address bar, so a callback can never dead-end.

### One-time database setup

Run [`supabase/aura_user_state.sql`](./supabase/aura_user_state.sql) in the Supabase SQL editor. It creates:

```sql
create table public.aura_user_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  state_json jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
```

and enables row-level security with select / insert / update / delete policies for `auth.uid() = user_id`. Without those policies the anon key cannot read or write the row.

### The email code

1. **Email step** — the card asks for an address. **Send code** posts to the project's one-time-code endpoint. A new address gets a pending account at that moment, but it is not active: it has no session, no `aura_user_state` row, and no way into AURA.
2. **Code step** — one gold field takes the whole code. The project decides how many digits it mails (6 to 10), so the field never assumes six: a longer code is typed or pasted in one go, spaces and dashes from the email are dropped, and nothing submits itself on a guessed digit count. **Verify & continue**, or Enter, sends whatever is there.
3. **Verified** — only a successful verification returns a session. That session hydrates the cloud state, opens the workspace and is kept in `localStorage`.

Behaviour worth knowing:

- **Wrong code** — *“That code is not right. Check the email and try again.”* The field clears and takes focus.
- **Expired code** — *“That code has expired. Tap Resend code to get a new one.”*
- **Resend** — available after a 30-second countdown, so it stays inside the project's send interval instead of tripping a rate limit.
- **Too many attempts** — mapped to a wait-a-minute message, never a raw service error.
- **Returning users** — signed out or on a new device, the same two steps; a stored session that is still valid opens AURA directly, because a session only exists after a code was verified.

### One-time email setup (Resend)

AURA needs a real sender. In the account project:

1. **Authentication → Emails → SMTP Settings** → enable custom SMTP:
   - Host `smtp.resend.com`, port `465` (or `587`)
   - Username `resend`, password = a Resend API key with sending access
   - Sender email on a domain verified in Resend, sender name `AURA`
2. **Authentication → Emails** → paste [`supabase/email-templates/aura-code.html`](./supabase/email-templates/aura-code.html) with the subject **“Your AURA code”** into **both** the **Magic Link** and **Confirm signup** templates. A brand-new address is confirmed by the same code, and which of the two templates fires depends on project settings — leaving either one default would send an email with the provider's own branding. Delete the link from any template you do use; the code is the only thing AURA accepts.
3. **Authentication → Providers → Email** → make sure email OTP is on. **Email OTP Length** is the project's own setting (6 to 10); AURA accepts whatever it is set to, so there is nothing to match here. If a delivered code is longer than six digits, that setting — not the app — is why.
4. Raise **Authentication → Rate Limits** if the project is on the default 30 emails per hour.

With custom SMTP the mail is sent by Resend from AURA's own domain, so nothing about the account provider appears in the message. Until SMTP is configured the project's built-in sender is used, which is rate-limited and only meant for testing.

### State sync

On sign-in the app reads the row for `auth.uid()`:

- **No row yet** — the local AURA state is uploaded, so existing work is not lost.
- **Row exists** — the cloud state is hydrated. If this device already had local AURA data, local-only tasks, days and completions are merged in; cloud entries win on conflicts. The merged copy is pushed back up.

Every local save is still written to `localStorage` immediately. Cloud writes are debounced (1.2 s) and upserted with:

```http
POST /rest/v1/aura_user_state?on_conflict=user_id
Prefer: resolution=merge-duplicates
{ "user_id": "...", "state_json": { ... }, "updated_at": "..." }
```

Saves are also flushed when the tab is hidden or the page is closed. If the network or Supabase is unavailable, the app keeps working locally and retries the cloud write. A session whose access token has expired is refreshed before use, and if that refresh only fails because the device is offline the session is kept — an offline launch never throws a signed-in user back to the sign-in screen, it opens their local state with the account card reading **Cloud unavailable · saved locally**. Only a refresh token the server actually rejects ends the session. The footer shows **Saved on this device** when signed out and **Saved to your account** when signed in; the account card above it shows the signed-in email, a live sync status and a **Sign out** button.

The Auth session is kept in `localStorage` under `aura.supabase.session`, and `aura.state.owner` remembers which account the local copy belongs to. That owner check prevents one account's local data from being merged into a different account on a shared device.

---

## The three tabs

| Tab | What lives there |
| --- | --- |
| **Today** | Week strip, progress card with the LOSS → WIN scale and same-day verdict, in-page Superfocus, Ideal Day, Non-Negotiables, and **Active Challenges** for the selected date while a challenge covers it — or a moon rest panel when the day is a rest day. The header pill shows the same win streak the Calendar counts |
| **Challenges** | Short, high-pressure tracks (`7-Day No Sugar`, `14-Day Deep Work`) that run automatically between their start and end dates, shown with details, dates, progress, day bar, win count and a clear **WIN / LOSS** verdict. Read-only: today's actions are checked off on Today |
| **Calendar** | A month grid of real outcomes: green **WIN** days, red **LOSS** days, quiet grey days with nothing scheduled, and six summary tiles (win, loss, rest, current streak, best streak, win rate). Tap any day to open it on Today |

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
| Review an earlier day | Tap a day in the week strip — it shows that date's own tasks and ticks, and its tasks can be edited or deleted right there |
| Enter Superfocus | Flip the switch on the **Superfocus** card. Today stays put; the logo, week strip, scale and section headers blur back |
| Choose what stays sharp | Tap a task or challenge action on Today — it stays crisp, every other row dims. Tap it again to release it |
| Leave Superfocus | Tap the same switch again (or press Escape) — the rest of Today comes back; there is no separate banner to dismiss |
| Mark a rest day | Tap **Rest day** on the progress card while the day still sits at 0. Once anything is ticked it locks |
| Expand a build plan | On a **Build / Milestone** challenge card, tap **Show all N days** to unfold every day's milestones, and tap again to fold them away |
| Run a challenge | Set its start and end dates when you create or configure it — it starts and finishes on its own, and its daily actions appear on Today while it runs. Tick them on Today; the Challenges tab only reports |
| Add a task while reviewing an earlier day | Tap **+** — the task is added to the date on screen, so any day can be filled in |
| Browse outcomes | Open the **Calendar** tab, step months with the arrows, and tap a day to review it on Today |

The task sheet has four fields: **Task**, **Why it matters** (the purpose line under the title), an optional **Time**, and the **Recurring / Non-negotiable** switch that moves a habit into the bottom section. A regular task belongs to the day it was created on and does not roll into tomorrow; only Non-Negotiables repeat. A challenge form adds explicit **start date** and **end date** fields (the length follows the range) and a **Habit / Streak** or **Build / Milestone** mode. Habit mode repeats one daily checklist; Build mode splits the window into day slots (Day 1, Day 2, …) and lets each day carry its own milestone or checklist. Write `Day 1`, `Day 2:` or a blank line between day blocks — the parser maps each block to its numbered date, and any missing day keeps a winnable `Day N milestone` slot. The exact text you typed is stored with the challenge (`planText`) and loaded back verbatim when you edit it, so no `Day` header, blank line or ordering is stripped or renumbered.

---

## What's on screen

**Week strip** — the current Sunday-to-Saturday week. Each pill shows the weekday and date, then a spaced status marker: an open/current day carries a glowing emerald dot when it is on track (at or above the 67% threshold) and a red dot when it is scheduled but still below it. Once a scheduled day is closed, a winning day becomes a green `✓` and a losing day a red `✕`. A date with nothing scheduled stays neutral — a dim grey dot, no red mark and no LOSS. A rest day carries a violet moon instead of a ✓ or ✕, so it never reads as a missed day. Today is highlighted, the selected day is a dark-glass pill with a soft champagne edge, and future days stay disabled. The marker keeps its own status colour inside the pill, so a won day still reads green.

**Calendar** — a Sunday-first month grid. Each elapsed day is coloured by its real outcome: green for a WIN, red for a LOSS, and a quiet neutral tile when nothing was scheduled; future days are faded and disabled. Six summary tiles sit under the grid in the same indigo-glass style: the month's **Win**, **Loss** and **Rest** counts, the **Current streak** and **Best streak** runs, and the month's **Win rate**. Streaks are read straight from the stored day records — consecutive WIN days, where rest days and days that carried nothing scheduled are neutral (they neither add to a run nor break it) and only a LOSS ends it — so they can never drift from the grid. A run only becomes a streak on its **second** day: one standalone win is still `0`, two wins in a row read `1`, and a green run on the 24th, 25th and 26th reads `2` in **Current streak**. The header pill reads the same number because it calls the same `winStreaks()` walk. The arrows step through months, today carries a gold ring, and tapping any day jumps to that date on Today. A rest day is a violet neutral tile marked `R`: never red, never a win, and excluded from the win and win-rate tally. The same `dayResult` helper feeds the card, the week strip and the calendar, so they can never disagree.

**Daily Progress Card** — the selected date, the day’s win goal, a live percentage, and the progress scale. The main line under the date is no longer a raw `X of Y completed` tally: it names the finish line directly as `2 tasks to WIN`, in green from the first check so the target pulls forward while the day is still winnable, and floods bright, vivid green as `WIN cleared` the moment the 67 % threshold is met. The track runs red → amber/gold → emerald/green. The filled portion and glowing marker move with each check and shift color at 34 % and 67 %. The scale is labelled **LOSS** and **WIN** at its ends, carries a physical pin at the **67 % win threshold**, and a live status pill reads either `Threshold at 67%` or `Win zone · threshold cleared`. That line goes quiet grey as `No tasks scheduled` when nothing is scheduled, and a rest day removes it with the rest of the score, so neither ever borrows the win language. An empty day is neutral: it wears a grey **CLEAR** pill, `Nothing scheduled · neutral day`, and a grey marker instead of a false LOSS. **Rest day** in the card marks the selected date as intentional recovery: the card drops to a calm violet state where the count, percentage, scale and legend step out, leaving the date, a violet **REST** pill and a quiet `No score today` line; the verdict becomes a violet **REST**, the scale reads `Rest day · streak frozen` when it is visible, and the day is excluded from wins, losses and the win streak. It is only available while the day sits at **0 completed** — the moment one action is ticked the control locks (dimmed, `Rest day locked`, a lock glyph and a `aria-disabled` state), so recovery can start a day but never rescue one. Any day that falls inside a running challenge's start-to-end window is locked from the start, before a single tick: the control wears a violet locked state, the lock glyph and the same `Rest day locked` label with a `locked on an active challenge day` title, and the tap is refused in the handler — a challenge day can never be declared recovery while its window is open. Tapping an active rest day again clears it. A rest day is strict on Today: Ideal Day, Non-Negotiables, the active-challenge checklists and the **Superfocus** card are all concealed behind a violet moon panel that names how many items are paused, and check-offs are refused in the data layer as well as hidden in the UI, so recovery cannot be bypassed by a stale control or a concealed row.

**Superfocus** — the toggle card turns Today itself into the focus surface. There is no timer screen, no picker sheet and no corner checkmark button: flipping the switch keeps you on Today and everything except the tasks blurs away — logo, week strip, progress card, section headers and footer. Then you choose by tapping: the task or challenge action you tap stays crisp and gold-ringed, every other row dims back (readable and tappable, never blurred), and a second tap releases it. The switch is the only control: there is no separate **Turn off** banner, and its foot names how many tasks are sharp while it is on. It stays live, so tapping it again ends the session instantly, and Escape does the same. Entering focus also clears edit mode, so no delete × or edit control can appear while it is on, and the exact scroll position is held — the page never jumps when the switch flips. While it is active the tab bar is hidden and tab switching is blocked, and tapping a card body picks it for focus instead of opening the task sheet — editing comes back the moment focus is turned off. Chosen tasks stay tickable through their check circle.

**Ideal Day** — the one-day tasks. Each belongs to the date it was created on: it is tickable there and does not follow you into tomorrow. Every card carries the tap-to-complete circle, an optional time badge, a bold title, a small "why" line, and a streak pill (`🔥 5`) once a run exists. A task shown on any day — including one added while reviewing an earlier date — can be edited from its card and deleted from its × (edit mode) or the sheet, and the change lands in that day's own record without touching the others.

**Active Challenges** — every challenge whose date window contains the selected date shows its own card on Today with the day number, that day's win count and a tap-to-tick checklist. Titles, day counters and action rows follow their own text direction, so Hebrew and English cards both align from the correct edge. The block is rendered only when at least one challenge covers the date — with none the section is absent, not an empty placeholder, and it carries no extra category label. Challenges never appear on a date outside their start-to-end window, so a day before the track began or after it closed is not judged against it. Stepping back onto an earlier date inside a challenge keeps that day on screen: its actions, its ticks and its own **✓ WON** / **DAY LOST** chip, with `Day N of D` and, once the window has closed, a `challenge won` / `challenge lost` note in the same line — so a finished track never feels disconnected from the Challenges tab. Any date inside the window stays checkable, past dates included: their actions keep a live check circle, and a tick updates that day's chip and win count immediately, so completing an old day can still turn its LOSS into a WIN and the Calendar follows with it. Rest days are the one exception — their tick is refused in the data layer and the row reads as paused. Those actions are part of the same day score as tasks and habits, so finishing them clears the day, and the WIN / LOSS verdict stays in the Challenges tab when the window closes. Habit challenges repeat their checklist every day; Build challenges show only the current day's milestone on Today, so each day is judged by its own slot. When every item on the card is ticked, the chip flips to a green **✓ WON** in the same green as the check circles. On a rest day the card reads **REST DAY** and no day win is announced.

**Non-Negotiables** — the user's own recurring habits in their own section, each with a golden spine, the same completion control and its own streak. This list stays personal: program items never enter it, so starting a track cannot blur everyday habits with temporary items.

**Challenges** — short, high-pressure tracks that run by their dates alone: no start button, no forgotten beginning. Each card states its own `start → end` range and length on one quiet line, a status pill (Starts … / **Active** / Win / Loss), where a running challenge wears a solid gold **Active** badge with a live dot so it is unmistakably in play right now, a slim accent timeline bar that fills a little more with each day of the window and sits full on the final day — it measures elapsed time only, so it keeps the card's own violet-to-gold gradient whether the challenge is live, won or lost, and a **WIN** or **LOSS** never recolours it — one mark per challenge day (won = emerald, missed = red, today = gold), and today's checklist as plain read-only lines — there is no check circle or other control in this tab at all; the actual check-off happens on Today. A **Build / Milestone** card also carries a **Show all N days** toggle that smoothly unfolds every day slot — day number, date, rest/won tag and its milestones, with each milestone already checked off that day carrying a green tick and a strike-through — below the card, and folds it back on a second tap; the open state survives repaints. Checking every action for that day wins the day. **Habit / Streak** challenges repeat one checklist across the window; **Build / Milestone** challenges generate a day slot per date, and each slot can hold its own milestone or checklist. When the window closes, the card carries a single **WIN** or **LOSS** badge in its header, judged against the same 67% standard as the daily scale, measured over active days only: the target is at least 67% of the challenge's non-rest days won, and the meta line keeps it legible as `3 / 7 won · need 5` without a second paragraph. Clearing every active day wins early and shows the same banner. Rest days never count as a win or a loss and never break the run. Creating or configuring a challenge takes a start date and an end date (or a start date plus length), and the card always states both.

Starting a challenge and every deletion confirms with a green `✓` toast. Deleting anything is deliberately slow: the **×** opens a confirmation panel whose red button fills only while you keep pressing, and releasing early cancels.

**Streaks** — a task's streak counts consecutive days ending today, or ending yesterday while today is still open, matched by a stable habit key rather than a record id, so renaming or re-adding the same routine keeps its run. The first completion shows no pill; the count starts at `🔥 1` on the **second consecutive day** (two days done), then `2`, `3` and so on. The header keeps the same *win streak* the Calendar reports — one `winStreaks()` walk over the stored day records: consecutive WIN days, rest and nothing-scheduled days neutral, only a LOSS ending the run, and the run's second day reading `1` (a lone win day is never a streak) — so the header pill and the Calendar's **Current streak** and **Best streak** tiles are always the same numbers, never a second implementation. It carries the 🔥 mark and turns hot the moment the run is above zero.

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
      "planText": "",
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

`days` maps a local `YYYY-MM-DD` date to a full snapshot of that date: the exact `items` scheduled on it (title, why, time, recurrence and program link) and the `done` ids ticked on it. Every day keeps its own copy, so adding, editing or deleting a task on one date never rewrites another: switching to an earlier day shows what that day actually held, what was checked (✓), and that day's score. The current day is the only snapshot kept in step with the live task list; past days are sealed and can be ticked but not re-edited. A non-recurring task carries `date`, the one day it belongs to; only tasks with `recurring: true` are rebuilt into every new day. A new task gets the `date` of the day on screen, and is also written into that day's own record, so an earlier date can still be filled in and shows the task immediately. Editing a card on any day updates the live task and that day's frozen copy together; deleting it there drops it from the live list and from that day's record, while every other day keeps what it held. Empty days have no record, which is why they stay neutral — no LOSS and no red dot. Days stored by older builds as `history` (a bare list of completed ids) are migrated once into best-effort snapshots, so no logged tick is lost. Tasks and day items carry a stable `key` derived from the habit name; the streak follows that key across renames and re-adds. Challenge `log` keeps its own date-keyed shape, one entry per checklist item completed that day; `startDate`/`endDate` are the challenge's beginning and finish, and `duration` always matches that range. A challenge carries `mode` (`habit` or `build`): habit mode stores its recurring checklist in `daily`, while build mode stores one `plan` slot per day, each with its own `items`; a build challenge also keeps `planText`, the raw day plan exactly as typed, so re-opening it never loses a day header. `restDays` is a date-keyed map of intentional recovery days; it sits beside `days` so a rest day can never be mistaken for a win, a loss or an empty day. The window runs on its own — there is no separate started flag. Workout `log` is date-keyed too: `started` marks an active session, `done` holds the exercise ids ticked that day, and `finished` closes the session. `weeks` plus `startDate` define the program window, so only dates inside it are scheduled sessions. `createdAt` dates the template, so weekdays before it existed stay rest days instead of being counted as missed sessions. `focus.targets` holds the ids of the tasks and challenge actions kept sharp in Superfocus (`task:<id>` or `challenge:<challengeId>:<itemId>`); `focus.active` is the on/off state, and targets that no longer exist on Today are ignored. Workout and program records from earlier builds stay in storage, but neither is rendered on Today anymore. A task created by a program carries `programId` (the program), `programItem` (the routine line it fills) and, inside a day snapshot, `programTitle` so a past day still reads correctly after that program is deleted. A linked task counts toward a day only while its program covers that date, so a finished track retires its items without erasing them. Local storage remains the instant, offline copy; when a Supabase user is signed in, the same state is debounced into `public.aura_user_state` and hydrated back on sign-in.

Every tick is written to `localStorage` immediately and read back to confirm the write stuck; if the device refuses to save (private mode, full quota) the app says so once instead of pretending. The day is also re-read from storage whenever the app comes back to the foreground or is restored from the back/forward cache, so a returning view can never show stale or missing checkmarks, and the win threshold is computed from one shared helper used by both the progress card and the week strip.

---

## Files

```
index.html                 Three views, in-page Superfocus, scale, sheet, studio, guide
style.css                  Near-black palette, ambient indigo/gold aura, header and
                           footer wordmark, cards, motion, tab bar
app.js                     State, migration, per-day snapshots, verdicts, streaks,
                           challenges, workouts, body map, calendar, demos, Superfocus,
                           auth gate and debounced cloud sync
supabase-client.js         Tiny Supabase Auth + PostgREST client (publishable key only)
supabase/aura_user_state.sql  Table + RLS policies for the per-user cloud state
supabase/email-templates/   Branded AURA code email (no provider branding)
manifest.json              PWA manifest (AURA, standalone, portrait)
sw.js                      Offline cache — aura-v44, versioned shell assets
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
- Safe-area insets pad the header, tab bar and bottom sheet on notched iPhones.
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
