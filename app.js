/* ==========================================================================
   AURA // DAILY OS
   Daily discipline, streaks, challenges and programs. Vanilla JS, no deps.
   Storage: localStorage "aura.daily.v3" (reads the old ARENA keys once)
   ========================================================================== */
(function () {
  'use strict';

  var STORAGE_KEY = 'aura.daily.v3';
  var LEGACY_KEYS = ['arena.daily.v2', 'arena.daily.v1'];
  var MAX_TITLE = 80;
  var MAX_WHY = 120;
  var MAX_ITEMS = 12;
  var MAX_STREAK = 3650;
  var MIN_DAYS = 2;
  var MAX_DAYS = 90;
  var RING_LEN = 552.92;
  var WON_AT = 67;
  var MAX_FOCUS_MINUTES = 600;
  var MIN_FOCUS_TOTAL = 10;
  var ACCENTS = [
    ['#8b5cf6', '#f5c94e'],
    ['#f5c94e', '#ff9f1c'],
    ['#ef7ac0', '#8b5cf6'],
    ['#22c55e', '#00e676']
  ];

  var CHECK_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M5.5 12.8 9.8 17.1 18.5 7.6"/></svg>';

  var X_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" ' +
    'stroke-linecap="round" aria-hidden="true">' +
    '<path d="M6 6l12 12M18 6 6 18"/></svg>';

  var els = {
    topMeta: document.getElementById('topMeta'),
    perfectPill: document.getElementById('perfectPill'),
    perfectCount: document.getElementById('perfectCount'),
    weekStrip: document.getElementById('weekStrip'),
    progressGlow: document.getElementById('progressGlow'),
    progressDate: document.getElementById('progressDate'),
    progressDone: document.getElementById('progressDone'),
    progressTotal: document.getElementById('progressTotal'),
    progressPct: document.getElementById('progressPct'),
    progressPctNum: document.getElementById('progressPctNum'),
    progressVerdict: document.getElementById('progressVerdict'),
    scale: document.getElementById('scale'),
    scaleFill: document.getElementById('scaleFill'),
    scaleMarker: document.getElementById('scaleMarker'),
    scaleStatus: document.getElementById('scaleStatus'),
    focusSub: document.getElementById('focusSub'),
    focusSessions: document.getElementById('focusSessions'),
    focusSwitch: document.getElementById('focusSwitch'),
    focusSwitchText: document.getElementById('focusSwitchText'),
    planList: document.getElementById('planList'),
    planEmpty: document.getElementById('planEmpty'),
    planCount: document.getElementById('planCount'),
    nnList: document.getElementById('nnList'),
    nnEmpty: document.getElementById('nnEmpty'),
    nnCount: document.getElementById('nnCount'),
    progTodaySection: document.getElementById('programTodaySection'),
    progTodayList: document.getElementById('progTodayList'),
    progTodayCount: document.getElementById('progTodayCount'),
    addBtn: document.getElementById('addBtn'),
    addHabitBtn: document.getElementById('addHabitBtn'),
    editBtn: document.getElementById('editBtn'),
    viewToday: document.getElementById('viewToday'),
    viewChallenges: document.getElementById('viewChallenges'),
    viewPrograms: document.getElementById('viewPrograms'),
    challengeList: document.getElementById('challengeList'),
    challengesEmpty: document.getElementById('challengesEmpty'),
    addChallengeBtn: document.getElementById('addChallengeBtn'),
    editChallenges: document.getElementById('editChallenges'),
    programList: document.getElementById('programList'),
    programsEmpty: document.getElementById('programsEmpty'),
    addProgramBtn: document.getElementById('addProgramBtn'),
    editPrograms: document.getElementById('editPrograms'),
    tabbar: document.getElementById('tabbar'),
    focusView: document.getElementById('focusView'),
    focusExit: document.getElementById('focusExit'),
    focusState: document.getElementById('focusState'),
    focusRing: document.getElementById('focusRing'),
    focusTime: document.getElementById('focusTime'),
    focusMinutesLabel: document.getElementById('focusMinutesLabel'),
    focusGoal: document.getElementById('focusGoal'),
    focusToggle: document.getElementById('focusToggle'),
    focusReset: document.getElementById('focusReset'),
    focusChange: document.getElementById('focusChange'),
    focusFootSessions: document.getElementById('focusFootSessions'),
    focusLength: document.getElementById('focusLength'),
    lengthClose: document.getElementById('lengthClose'),
    lengthCancel: document.getElementById('lengthCancel'),
    lengthSet: document.getElementById('lengthSet'),
    lengthMinutes: document.getElementById('lengthMinutes'),
    lengthSeconds: document.getElementById('lengthSeconds'),
    lengthError: document.getElementById('lengthError'),
    boot: document.getElementById('boot'),
    ptr: document.getElementById('ptr'),
    ptrText: document.getElementById('ptrText'),
    sheet: document.getElementById('sheet'),
    sheetVeil: document.getElementById('sheetVeil'),
    sheetPanel: document.getElementById('sheetPanel'),
    sheetTitle: document.getElementById('sheetTitle'),
    sheetClose: document.getElementById('sheetClose'),
    sheetCancel: document.getElementById('sheetCancel'),
    sheetDelete: document.getElementById('sheetDelete'),
    confirm: document.getElementById('confirm'),
    confirmVeil: document.getElementById('confirmVeil'),
    confirmTitle: document.getElementById('confirmTitle'),
    confirmItem: document.getElementById('confirmItem'),
    confirmNote: document.getElementById('confirmNote'),
    confirmHold: document.getElementById('confirmHold'),
    confirmHoldText: document.getElementById('confirmHoldText'),
    confirmCancel: document.getElementById('confirmCancel'),
    taskForm: document.getElementById('taskForm'),
    fieldTitle: document.getElementById('fieldTitle'),
    fieldWhy: document.getElementById('fieldWhy'),
    fieldTime: document.getElementById('fieldTime'),
    fieldRecurring: document.getElementById('fieldRecurring'),
    formError: document.getElementById('formError'),
    labelTitle: document.getElementById('labelTitle'),
    labelWhy: document.getElementById('labelWhy'),
    labelItems: document.getElementById('labelItems'),
    taskExtras: document.getElementById('taskExtras'),
    trackExtras: document.getElementById('trackExtras'),
    fieldDuration: document.getElementById('fieldDuration'),
    fieldItems: document.getElementById('fieldItems'),
    toast: document.getElementById('toast')
  };

  var state = loadState();
  var todayKey = keyOf(new Date());
  var selectedKey = todayKey;
  var view = state.view || 'today';
  var editMode = false;
  var manageChallenges = false;
  var managePrograms = false;
  var editingId = null;
  var sheetMode = 'task';
  var newRecurring = false;
  var toastTimer = 0;
  var audioCtx = null;

  var focus = {
    open: false,
    running: false,
    total: focusDuration(),
    left: focusDuration(),
    endAt: 0,
    timer: 0
  };

  /* ------------------------------- helpers ------------------------------- */

  function uid() {
    return 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function keyOf(date) {
    var d = new Date(date);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function fromKey(key) {
    var parts = String(key).split('-');
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }

  function shiftKey(key, days) {
    var d = fromKey(key);
    d.setDate(d.getDate() + days);
    return keyOf(d);
  }

  function daysBetween(a, b) {
    var A = fromKey(a);
    var B = fromKey(b);
    var utcA = Date.UTC(A.getFullYear(), A.getMonth(), A.getDate());
    var utcB = Date.UTC(B.getFullYear(), B.getMonth(), B.getDate());
    return Math.round((utcB - utcA) / 86400000);
  }

  function trimText(value, max) {
    return String(value == null ? '' : value).replace(/\s+/g, ' ').trim().slice(0, max);
  }

  function normalizeTime(value) {
    var t = String(value == null ? '' : value).trim();
    return /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(t) ? t : '';
  }

  function clampDays(value) {
    var n = parseInt(value, 10);
    if (!n || n < MIN_DAYS) n = 7;
    return Math.min(MAX_DAYS, Math.max(MIN_DAYS, n));
  }

  function makeEl(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  /* Direction of the first strong character, so a Hebrew card lays out RTL
     and an English one lays out LTR — mirrors dir="auto" for container order. */
  var RTL_CHAR = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;
  var STRONG_CHAR = /[A-Za-z\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;

  function textDir(text) {
    var strong = String(text || '').match(STRONG_CHAR);
    return strong && RTL_CHAR.test(strong[0]) ? 'rtl' : 'ltr';
  }

  function mmss(seconds) {
    var s = Math.max(0, seconds);
    return pad(Math.floor(s / 60)) + ':' + pad(s % 60);
  }

  /* -------------------------------- seed --------------------------------- */

  function seedTasks() {
    var now = Date.now();
    function task(title, why, time, recurring) {
      return { id: uid(), title: title, why: why, time: time, recurring: recurring, createdAt: now };
    }
    return [
      task('Morning workout', 'Builds discipline and stamina — starts the day strong', '06:30', false),
      task('Deep work — 90 minutes', 'Sharpens focus and compounds skill', '09:00', false),
      task('Read 20 pages', 'Feeds the mind and quiets the noise', '21:30', false),
      task('10,000 steps', 'Movement is the base layer of energy', '', true),
      task('2L water', 'Keeps energy steady from morning to night', '', true),
      task('No screens after 23:00', 'Protects sleep — tomorrow starts tonight', '23:00', true)
    ];
  }

  function seedChallenges() {
    return [
      {
        id: uid(),
        title: '7-Day No Sugar',
        why: 'Reset the dopamine baseline and hold steady energy all week.',
        duration: 7,
        daily: [
          { id: uid(), title: 'No added sugar' },
          { id: uid(), title: '2L water' },
          { id: uid(), title: '20 minute walk' }
        ],
        startedAt: null,
        log: {}
      },
      {
        id: uid(),
        title: '14-Day Deep Work',
        why: 'Two weeks of protected focus to prove you can ship without noise.',
        duration: 14,
        daily: [
          { id: uid(), title: '90 min deep work' },
          { id: uid(), title: 'Phone in another room' },
          { id: uid(), title: 'Shutdown ritual at 18:00' }
        ],
        startedAt: null,
        log: {}
      }
    ];
  }

  function seedPrograms() {
    return [
      {
        id: uid(),
        title: 'Morning Protocol',
        why: 'Win the first hour and the rest of the day follows.',
        duration: 21,
        items: ['Wake at 06:00', '10 min sunlight', 'Cold shower', 'Journal 5 min'],
        startedAt: null
      },
      {
        id: uid(),
        title: 'Strength Base',
        why: 'A stronger body raises the ceiling on everything else.',
        duration: 28,
        items: ['Train 45 min', 'Protein 150g', '8,000 steps'],
        startedAt: null
      },
      {
        id: uid(),
        title: 'Focus Reset',
        why: 'Rebuild attention span after a scattered season.',
        duration: 14,
        items: ['90 min deep work', 'No phone first hour', 'Read 20 pages'],
        startedAt: null
      }
    ];
  }

  function seedState() {
    return {
      v: 3,
      view: 'today',
      tasks: seedTasks(),
      history: {},
      challenges: seedChallenges(),
      programs: seedPrograms(),
      focus: { sessions: 0, date: keyOf(new Date()), minutes: 25, seconds: 0 }
    };
  }

  /* ------------------------------- storage ------------------------------- */

  function normalizeTask(raw) {
    if (!raw || typeof raw !== 'object') return null;
    var title = trimText(raw.title, MAX_TITLE);
    if (!title) return null;
    return {
      id: typeof raw.id === 'string' && raw.id ? raw.id : uid(),
      title: title,
      why: trimText(raw.why, MAX_WHY),
      time: normalizeTime(raw.time),
      recurring: !!raw.recurring,
      createdAt: Number(raw.createdAt) || Date.now(),
      programId: typeof raw.programId === 'string' ? raw.programId : '',
      programItem: trimText(raw.programItem, MAX_TITLE)
    };
  }

  function normalizeDaily(raw) {
    var out = [];
    var seen = {};
    if (!Array.isArray(raw)) return out;
    for (var i = 0; i < raw.length && out.length < MAX_ITEMS; i++) {
      var item = raw[i];
      var title = trimText(typeof item === 'string' ? item : item && item.title, MAX_TITLE);
      if (!title) continue;
      var id = item && typeof item.id === 'string' && item.id ? item.id : uid();
      if (seen[id]) id = uid();
      seen[id] = true;
      out.push({ id: id, title: title });
    }
    return out;
  }

  function normalizeChallenge(raw) {
    if (!raw || typeof raw !== 'object') return null;
    var title = trimText(raw.title, MAX_TITLE);
    if (!title) return null;
    var daily = normalizeDaily(raw.daily);
    var seen = {};
    daily.forEach(function (item) { seen[item.id] = true; });

    var log = {};
    if (raw.log && typeof raw.log === 'object') {
      Object.keys(raw.log).forEach(function (key) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return;
        var list = raw.log[key];
        if (!Array.isArray(list)) return;
        var ids = [];
        list.forEach(function (id) {
          if (typeof id === 'string' && seen[id] && ids.indexOf(id) === -1) ids.push(id);
        });
        if (ids.length) log[key] = ids;
      });
    }

    return {
      id: typeof raw.id === 'string' && raw.id ? raw.id : uid(),
      title: title,
      why: trimText(raw.why, MAX_WHY),
      duration: clampDays(raw.duration),
      daily: daily,
      startedAt: /^\d{4}-\d{2}-\d{2}$/.test(raw.startedAt) ? raw.startedAt : null,
      log: log
    };
  }

  function normalizeProgram(raw) {
    if (!raw || typeof raw !== 'object') return null;
    var title = trimText(raw.title, MAX_TITLE);
    if (!title) return null;
    var items = [];
    if (Array.isArray(raw.items)) {
      for (var i = 0; i < raw.items.length && items.length < MAX_ITEMS; i++) {
        var text = trimText(raw.items[i], MAX_TITLE);
        if (text) items.push(text);
      }
    }
    return {
      id: typeof raw.id === 'string' && raw.id ? raw.id : uid(),
      title: title,
      why: trimText(raw.why, MAX_WHY),
      duration: clampDays(raw.duration),
      items: items,
      startedAt: /^\d{4}-\d{2}-\d{2}$/.test(raw.startedAt) ? raw.startedAt : null
    };
  }

  function loadState() {
    function parse(key) {
      try {
        return JSON.parse(window.localStorage.getItem(key) || 'null');
      } catch (err) {
        return null;
      }
    }

    var raw = parse(STORAGE_KEY);
    if (!raw || typeof raw !== 'object' || !Array.isArray(raw.tasks)) {
      for (var i = 0; i < LEGACY_KEYS.length; i += 1) {
        var legacy = parse(LEGACY_KEYS[i]);
        if (legacy && Array.isArray(legacy.tasks)) {
          raw = legacy;
          break;
        }
      }
    }
    if (!raw || typeof raw !== 'object' || !Array.isArray(raw.tasks)) return seedState();

    var tasks = [];
    var seen = {};
    raw.tasks.forEach(function (item) {
      var task = normalizeTask(item);
      if (!task) return;
      if (seen[task.id]) task.id = uid();
      seen[task.id] = true;
      tasks.push(task);
    });

    var history = {};
    if (raw.history && typeof raw.history === 'object') {
      Object.keys(raw.history).forEach(function (key) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return;
        var list = raw.history[key];
        if (!Array.isArray(list)) return;
        var ids = [];
        list.forEach(function (id) {
          if (typeof id === 'string' && seen[id] && ids.indexOf(id) === -1) ids.push(id);
        });
        if (ids.length) history[key] = ids;
      });
    }

    var challenges = [];
    if (Array.isArray(raw.challenges)) {
      raw.challenges.forEach(function (item) {
        var ch = normalizeChallenge(item);
        if (ch) challenges.push(ch);
      });
    } else {
      challenges = seedChallenges();
    }

    var programs = [];
    if (Array.isArray(raw.programs)) {
      raw.programs.forEach(function (item) {
        var pg = normalizeProgram(item);
        if (pg) programs.push(pg);
      });
    } else {
      programs = seedPrograms();
    }

    /* A link to a program that no longer exists would lock an orphaned task,
       so drop the link (the task itself stays) instead of carrying it on. */
    var programIds = {};
    programs.forEach(function (pg) { programIds[pg.id] = true; });
    tasks.forEach(function (task) {
      if (task.programId && !programIds[task.programId]) {
        task.programId = '';
        task.programItem = '';
      }
    });

    var focusRaw = raw.focus && typeof raw.focus === 'object' ? raw.focus : {};
    var minutes = Math.round(Number(focusRaw.minutes));
    var seconds = Math.round(Number(focusRaw.seconds));
    if (!isFinite(minutes)) minutes = 25;
    if (!isFinite(seconds)) seconds = 0;
    minutes = Math.max(0, Math.min(MAX_FOCUS_MINUTES, minutes));
    seconds = Math.max(0, Math.min(59, seconds));
    /* An exact length is allowed; a zero (or nonsense) one is not. */
    if (minutes * 60 + seconds < MIN_FOCUS_TOTAL) {
      minutes = 25;
      seconds = 0;
    }

    return {
      v: 3,
      view: raw.view === 'challenges' || raw.view === 'programs' ? raw.view : 'today',
      tasks: tasks,
      history: history,
      challenges: challenges,
      programs: programs,
      focus: {
        sessions: Math.max(0, Math.min(999, Number(focusRaw.sessions) || 0)),
        date: /^\d{4}-\d{2}-\d{2}$/.test(focusRaw.date) ? focusRaw.date : keyOf(new Date()),
        minutes: minutes,
        seconds: seconds
      }
    };
  }

  var saveWarned = false;

  function save() {
    var payload;
    try {
      payload = JSON.stringify(state);
      window.localStorage.setItem(STORAGE_KEY, payload);
      if (window.localStorage.getItem(STORAGE_KEY) !== payload) {
        throw new Error('storage write did not stick');
      }
    } catch (err) {
      /* Private mode or quota: the session still works, but say so once. */
      if (!saveWarned && els.toast) {
        saveWarned = true;
        toast('This device isn’t saving progress');
      }
    }
  }

  /* Re-read the saved day before repainting, so a second tab (or a page
     restored from the back/forward cache) can never show stale checkmarks. */
  function syncFromStorage() {
    var raw = null;
    var stored;
    try {
      raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      stored = loadState();
    } catch (err) {
      return;
    }
    var sameHistory = JSON.stringify(stored.history) === JSON.stringify(state.history);
    var sameTasks = JSON.stringify(stored.tasks) === JSON.stringify(state.tasks);
    if (sameHistory && sameTasks) return;
    state.tasks = stored.tasks;
    state.history = stored.history;
    renderAll();
  }

  /* ------------------------------- progress ------------------------------ */

  function completionsFor(key) {
    var list = state.history[key];
    return Array.isArray(list) ? list : [];
  }

  function isDone(id, key) {
    return completionsFor(key).indexOf(id) !== -1;
  }

  /* A program item belongs to its program, not to the user's everyday
     habits. It only counts while the track covers that day; once the program
     ends it retires from Today and the day's math without being deleted. */
  function programCoversDay(p, key) {
    if (!p || !p.startedAt) return false;
    return key >= p.startedAt && key <= shiftKey(p.startedAt, p.duration - 1);
  }

  function programById(id) {
    for (var i = 0; i < state.programs.length; i++) {
      if (state.programs[i].id === id) return state.programs[i];
    }
    return null;
  }

  function taskActiveOn(task, key) {
    if (!task.programId) return true;
    return programCoversDay(programById(task.programId), key);
  }

  function activeTasksOn(key) {
    return state.tasks.filter(function (task) { return taskActiveOn(task, key); });
  }

  function doneCount(key) {
    var ids = completionsFor(key);
    var n = 0;
    activeTasksOn(key).forEach(function (task) {
      if (ids.indexOf(task.id) !== -1) n += 1;
    });
    return n;
  }

  function allDone(key) {
    var tasks = activeTasksOn(key);
    if (!tasks.length) return false;
    return doneCount(key) === tasks.length;
  }

  function streakFor(taskId, key) {
    var cursor = key;
    if (!isDone(taskId, cursor)) cursor = shiftKey(cursor, -1);
    var n = 0;
    while (n < MAX_STREAK && isDone(taskId, cursor)) {
      n += 1;
      cursor = shiftKey(cursor, -1);
    }
    return n;
  }

  function perfectStreak() {
    if (!activeTasksOn(todayKey).length) return 0;
    var cursor = todayKey;
    if (!allDone(cursor)) cursor = shiftKey(cursor, -1);
    var n = 0;
    while (n < MAX_STREAK && allDone(cursor)) {
      n += 1;
      cursor = shiftKey(cursor, -1);
    }
    return n;
  }

  // Smallest completed count whose rounded percentage clears the win bar.
  function winTarget(total) {
    if (!total) return 0;
    for (var k = 1; k <= total; k++) {
      if (Math.round((k / total) * 100) >= WON_AT) return k;
    }
    return total;
  }

  function toggleTask(id, dayKey) {
    var key = dayKey || selectedKey;
    var list = completionsFor(key).slice();
    var index = list.indexOf(id);
    var adding = index === -1;

    if (adding) list.push(id);
    else list.splice(index, 1);

    if (list.length) state.history[key] = list;
    else delete state.history[key];

    save();
    renderAll(adding ? id : null);

    /* Silent on purpose: completing a task makes no sound. */
    if (adding) vibrate(8);
  }

  function vibrate(ms) {
    if (!navigator.vibrate) return;
    try { navigator.vibrate(ms); } catch (err) { /* ignore */ }
  }

  /* -------------------------------- render ------------------------------- */

  function renderWeek() {
    els.weekStrip.textContent = '';

    var today = fromKey(todayKey);
    var weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());

    for (var i = 0; i < 7; i++) {
      var d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      var key = keyOf(d);

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'wk';
      btn.dataset.key = key;

      if (key === todayKey) btn.classList.add('is-today');
      if (key === selectedKey) btn.classList.add('is-selected');
      if (key > todayKey) btn.disabled = true;

      var day = makeEl('span', 'wk-day',
        d.toLocaleDateString(undefined, { weekday: 'short' }).replace(/\.$/, ''));
      var date = makeEl('span', 'wk-date', String(d.getDate()));
      var result = dayResult(key);
      var dot = makeEl('span', 'wk-dot');
      dot.setAttribute('aria-hidden', 'true');
      if (result.perfect) {
        dot.classList.add('is-perfect');
        dot.innerHTML = CHECK_SVG;
      } else if (result.won) {
        dot.classList.add('is-win');
      } else if (result.total && key <= todayKey) {
        dot.classList.add('is-loss');
      }

      var label = d.toLocaleDateString(undefined, {
        weekday: 'long', month: 'short', day: 'numeric'
      });
      if (key <= todayKey && result.total) {
        label += ' — ' + (result.perfect ? 'perfect day' : result.won ? 'WIN' : 'LOSS') +
          ', ' + result.done + ' of ' + result.total;
      }
      btn.setAttribute('aria-label', label);
      btn.setAttribute('aria-pressed', key === selectedKey ? 'true' : 'false');
      btn.title = label;

      btn.appendChild(day);
      btn.appendChild(date);
      btn.appendChild(dot);

      btn.addEventListener('click', function (event) {
        var target = event.currentTarget;
        if (target.disabled) return;
        selectedKey = target.dataset.key;
        renderAll();
      });

      els.weekStrip.appendChild(btn);
    }
  }

  /* One verdict for a day, shared by the scale and the week strip, so both
     always agree on WIN vs LOSS. */
  function dayResult(key) {
    var total = activeTasksOn(key).length;
    var done = doneCount(key);
    var pct = total ? Math.round((done / total) * 100) : 0;
    return {
      total: total,
      done: done,
      pct: pct,
      won: total > 0 && pct >= WON_AT,
      perfect: total > 0 && done === total
    };
  }

  function renderProgress() {
    var result = dayResult(selectedKey);
    var total = result.total;
    var done = result.done;
    var pct = result.pct;
    var color = pct >= WON_AT ? '#34d399' : pct >= 34 ? '#fbbf24' : '#ff6b6b';
    var glow = pct >= WON_AT
      ? 'rgba(34, 197, 94, 0.24)'
      : pct >= 34 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)';

    els.progressDone.textContent = String(done);
    els.progressTotal.textContent = String(total);
    els.progressPctNum.textContent = String(pct);
    els.progressPct.style.color = color;
    els.progressDate.textContent =
      (selectedKey === todayKey ? 'Today · ' : '') +
      fromKey(selectedKey).toLocaleDateString(undefined, {
        weekday: 'long', month: 'short', day: 'numeric'
      });

    els.scale.style.setProperty('--p', pct + '%');
    els.scaleMarker.style.color = color;
    els.scale.setAttribute('aria-valuenow', String(pct));
    els.scale.setAttribute('aria-valuetext', done + ' of ' + total + ' completed');
    els.progressGlow.style.background =
      'radial-gradient(circle, ' + glow + ' 0%, transparent 68%)';

    var won = result.won;

    if (won) {
      els.scaleStatus.textContent = 'Win zone · threshold cleared';
      els.scaleStatus.classList.add('is-win');
    } else {
      var need = total ? Math.max(0, winTarget(total) - done) : 0;
      els.scaleStatus.textContent = total
        ? need + ' to win · ' + WON_AT + '% threshold'
        : 'Win at ' + WON_AT + '%';
      els.scaleStatus.classList.remove('is-win');
    }

    els.progressVerdict.textContent = won ? 'WIN' : 'LOSS';
    els.progressVerdict.dataset.state = won ? 'win' : 'loss';
    els.progressVerdict.setAttribute(
      'aria-label',
      'Day status: ' + (won ? 'WIN' : 'LOSS') + ' — ' + done + ' of ' + total +
        ' tasks done, ' + WON_AT + '% needed to win'
    );

    if (selectedKey !== todayKey) {
      els.topMeta.textContent = 'Reviewing an earlier day.';
    } else if (!total) {
      els.topMeta.textContent = 'Add tasks and set the standard.';
    } else if (done === total) {
      els.topMeta.textContent = 'Perfect day. Every box closed.';
    } else {
      els.topMeta.textContent = 'Today’s standard, executed.';
    }

    var streak = perfectStreak();
    els.perfectCount.textContent = String(streak);
    els.perfectPill.classList.toggle('is-hot', streak > 0);
  }

  function programOf(task) {
    return task.programId ? programById(task.programId) : null;
  }

  function buildCard(task, flash) {
    var done = isDone(task.id, selectedKey);
    var program = programOf(task);

    var li = document.createElement('li');
    li.className = 'task-card';
    li.dataset.id = task.id;
    if (done) li.classList.add('is-done');
    if (program) li.classList.add('is-program');
    if (flash && flash === task.id) li.classList.add('just-done');

    var check = document.createElement('button');
    check.type = 'button';
    check.className = 'check';
    check.setAttribute('role', 'checkbox');
    check.setAttribute('aria-checked', done ? 'true' : 'false');
    check.setAttribute('aria-label', (done ? 'Mark not done: ' : 'Complete: ') + task.title);
    check.innerHTML = CHECK_SVG;
    check.addEventListener('click', function () {
      toggleTask(task.id);
    });

    /* A program task keeps its structure: it is checked off here but never
       opened as a standalone ad-hoc task. */
    var body;
    if (program) {
      body = document.createElement('div');
      body.className = 'task-body is-locked';
    } else {
      body = document.createElement('button');
      body.type = 'button';
      body.className = 'task-body';
      body.setAttribute('aria-label', 'Edit ' + task.title);
      body.addEventListener('click', function () {
        openTaskSheet(task);
      });
    }

    var top = document.createElement('span');
    top.className = 'task-top';

    if (task.time) {
      top.appendChild(makeEl('span', 'task-time', task.time));
    }

    if (program) {
      var tag = makeEl('span', 'task-prog', '◆ ' + program.title);
      tag.dir = 'auto';
      tag.setAttribute('title', 'Part of the ' + program.title + ' program');
      top.appendChild(tag);
    }

    var title = makeEl('span', 'task-title', task.title);
    title.dir = 'auto';
    top.appendChild(title);
    body.appendChild(top);

    /* A program task repeats the track's purpose on every card; the program
       card already says it once, so keep the routine rows quiet. */
    var repeatWhy = program && task.why === program.why;
    if (task.why && !repeatWhy) {
      var why = makeEl('span', 'task-why', task.why);
      why.dir = 'auto';
      body.appendChild(why);
    }

    var side = document.createElement('div');
    side.className = 'task-side';

    var streak = streakFor(task.id, selectedKey);
    if (streak > 0) {
      var badge = makeEl('span', 'streak' + (streak >= 3 ? ' is-hot' : ''), '🔥 ' + streak);
      badge.setAttribute('title', streak + ' day streak');
      side.appendChild(badge);
    }

    /* Deleting a linked task alone would leave the program short an item;
       it leaves with the program instead. */
    if (!program) {
      var del = document.createElement('button');
      del.type = 'button';
      del.className = 'task-del';
      del.setAttribute('aria-label', 'Delete ' + task.title);
      del.innerHTML = X_SVG;
      del.addEventListener('click', function (event) {
        event.stopPropagation();
        askDelete(task.recurring ? 'habit' : 'task', task.title, function () {
          removeTask(task.id);
        });
      });
      side.appendChild(del);
    }

    li.appendChild(check);
    li.appendChild(body);
    li.appendChild(side);
    return li;
  }

  function fillList(listEl, items, emptyEl, flash) {
    listEl.textContent = '';
    items.forEach(function (task) {
      listEl.appendChild(buildCard(task, flash));
    });
    emptyEl.hidden = items.length > 0;
  }

  function renderLists(flash) {
    /* Program items are not personal habits: they never enter Ideal Day or
       Non-Negotiables, so starting a track cannot blur the user's own list. */
    var plan = state.tasks.filter(function (t) { return !t.recurring && !t.programId; });
    var habits = state.tasks.filter(function (t) { return t.recurring && !t.programId; });

    fillList(els.planList, plan, els.planEmpty, flash);
    fillList(els.nnList, habits, els.nnEmpty, flash);

    function countLabel(items, noun) {
      var done = items.filter(function (t) { return isDone(t.id, selectedKey); }).length;
      return items.length + ' ' + noun + (items.length === 1 ? '' : 's') +
        (items.length ? ' · ' + done + ' done' : '');
    }

    els.planCount.textContent = countLabel(plan, 'task');
    els.nnCount.textContent = countLabel(habits, 'habit');
  }

  /* Program items get their own Today block, grouped by track, instead of
     being mixed into the user's Non-Negotiables. */
  function renderProgramToday(flash) {
    var groups = [];
    if (selectedKey === todayKey) {
      state.programs.forEach(function (p) {
        if (!programCoversDay(p, todayKey)) return;
        var tasks = state.tasks.filter(function (t) { return t.programId === p.id; });
        if (!tasks.length) return;
        groups.push({ program: p, tasks: tasks });
      });
    }

    els.progTodaySection.hidden = groups.length === 0;
    els.progTodayList.textContent = '';

    var total = 0;
    var doneTotal = 0;

    groups.forEach(function (group) {
      var st = programStatus(group.program);
      var done = group.tasks.filter(function (t) {
        return isDone(t.id, selectedKey);
      }).length;
      total += group.tasks.length;
      doneTotal += done;

      /* Creation unshifts newest first; show the program's own item order. */
      var order = {};
      group.program.items.forEach(function (title, i) {
        order[String(title).toLowerCase()] = i;
      });
      group.tasks.sort(function (a, b) {
        var ai = order[String(a.programItem || a.title).toLowerCase()];
        var bi = order[String(b.programItem || b.title).toLowerCase()];
        if (ai === undefined) ai = 999;
        if (bi === undefined) bi = 999;
        return ai - bi;
      });

      var box = makeEl('div', 'prog-today-group');
      var head = makeEl('div', 'prog-today-head');
      var name = makeEl('span', 'prog-today-name', '◆ ' + group.program.title);
      name.dir = 'auto';
      var meta = makeEl('span', 'prog-today-meta',
        'Day ' + st.day + ' of ' + group.program.duration + ' · ' +
        done + ' of ' + group.tasks.length + ' done');
      meta.dir = 'ltr';
      head.appendChild(name);
      head.appendChild(meta);
      box.appendChild(head);

      var list = makeEl('ul', 'task-list task-list-prog');
      group.tasks.forEach(function (task) {
        list.appendChild(buildCard(task, flash));
      });
      box.appendChild(list);
      els.progTodayList.appendChild(box);
    });

    els.progTodayCount.textContent = total
      ? total + ' program item' + (total === 1 ? '' : 's') + ' · ' + doneTotal + ' done'
      : '0 program items';
  }

  /* ------------------------------ challenges ----------------------------- */

  function challengeWonDays(ch) {
    if (!ch.startedAt || !ch.daily.length) return 0;
    var n = 0;
    for (var i = 0; i < ch.duration; i++) {
      var key = shiftKey(ch.startedAt, i);
      if (key > todayKey) break;
      var list = ch.log[key] || [];
      var complete = true;
      for (var j = 0; j < ch.daily.length; j++) {
        if (list.indexOf(ch.daily[j].id) === -1) { complete = false; break; }
      }
      if (complete) n += 1;
    }
    return n;
  }

  function challengeStatus(ch) {
    var won = challengeWonDays(ch);
    if (!ch.startedAt) {
      return { kind: 'idle', label: 'Not started', day: 0, won: 0, pct: 0 };
    }
    var day = daysBetween(ch.startedAt, todayKey) + 1;
    var pct = Math.round((won / ch.duration) * 100);
    if (won >= ch.duration) {
      return { kind: 'won', label: 'Won', day: Math.min(day, ch.duration), won: won, pct: 100 };
    }
    if (day > ch.duration) {
      return { kind: 'over', label: 'Closed', day: ch.duration, won: won, pct: pct };
    }
    return { kind: 'live', label: 'Day ' + Math.max(1, day), day: Math.max(1, day), won: won, pct: pct };
  }

  function deleteButton(label, handler) {
    var btn = makeEl('button', 'track-del');
    btn.type = 'button';
    btn.setAttribute('aria-label', label);
    btn.innerHTML = X_SVG;
    btn.addEventListener('click', handler);
    return btn;
  }

  function removeChallenge(ch) {
    state.challenges = state.challenges.filter(function (item) { return item.id !== ch.id; });
    save();
    renderAll();
    toast('✓ Challenge deleted');
  }

  function renderChallenges() {
    els.challengeList.textContent = '';
    els.challengeList.classList.toggle('is-managing', manageChallenges);

    state.challenges.forEach(function (ch, index) {
      var st = challengeStatus(ch);
      var accent = ACCENTS[index % ACCENTS.length];
      var card = makeEl('article', 'track-card' + (st.kind === 'won' ? ' is-won' : ''));
      card.style.setProperty('--track-a', accent[0]);
      card.style.setProperty('--track-b', accent[1]);

      var top = makeEl('div', 'track-top');
      top.dir = textDir(ch.title);
      var wrap = makeEl('div', 'track-title-wrap');
      wrap.dir = 'auto';
      var heading = makeEl('h3', 'track-title', ch.title);
      heading.dir = 'auto';
      wrap.appendChild(heading);
      if (ch.why) {
        var why = makeEl('p', 'track-why', ch.why);
        why.dir = 'auto';
        wrap.appendChild(why);
      }
      top.appendChild(wrap);
      var statusEl = makeEl('span', 'track-status is-' + st.kind, st.label);
      statusEl.dir = 'auto';
      top.appendChild(statusEl);
      card.appendChild(top);

      var meter = makeEl('div', 'track-meter');
      var fill = makeEl('span');
      fill.style.width = st.pct + '%';
      meter.appendChild(fill);
      card.appendChild(meter);

      var meta = makeEl('div', 'track-meta');
      meta.dir = 'ltr';
      meta.appendChild(makeEl('span', null,
        st.kind === 'idle'
          ? ch.duration + ' days · ' + ch.daily.length + ' daily actions'
          : 'Day ' + st.day + ' / ' + ch.duration));
      var wins = makeEl('span');
      var winsNum = makeEl('b', null, String(st.won));
      wins.appendChild(winsNum);
      wins.appendChild(document.createTextNode(' wins'));
      meta.appendChild(wins);
      card.appendChild(meta);

      if (st.kind !== 'idle') {
        var daysRow = makeEl('div', 'track-days');
        daysRow.setAttribute('aria-hidden', 'true');
        var todayIndex = ch.startedAt ? daysBetween(ch.startedAt, todayKey) : -1;
        for (var i = 0; i < ch.duration; i++) {
          var mark = makeEl('span', 'day-mark');
          var key = ch.startedAt ? shiftKey(ch.startedAt, i) : null;
          var complete = false;
          if (key && key <= todayKey) {
            var list = ch.log[key] || [];
            complete = ch.daily.length > 0;
            for (var j = 0; j < ch.daily.length; j++) {
              if (list.indexOf(ch.daily[j].id) === -1) { complete = false; break; }
            }
          }
          if (complete) mark.classList.add('is-won');
          else if (i === todayIndex) mark.classList.add('is-today');
          else if (key && key < todayKey) mark.classList.add('is-missed');
          daysRow.appendChild(mark);
        }
        card.appendChild(daysRow);
      }

      if (!ch.startedAt) {
        var preview = makeEl('div', 'track-check');
        preview.appendChild(makeEl('p', 'track-check-label', 'Daily checklist'));
        var previewList = makeEl('ul', 'mini-list');
        ch.daily.forEach(function (item) {
          var li = makeEl('li', 'mini-item');
          li.dir = textDir(item.title);
          var dot = makeEl('span', 'mini-check');
          var text = makeEl('span', 'mini-text', item.title);
          text.dir = 'auto';
          li.appendChild(dot);
          li.appendChild(text);
          previewList.appendChild(li);
        });
        preview.appendChild(previewList);
        card.appendChild(preview);
      } else if (st.kind === 'live') {
        var block = makeEl('div', 'track-check');
        block.appendChild(makeEl('p', 'track-check-label', 'Today · day ' + st.day));
        var listEl = makeEl('ul', 'mini-list');
        var doneIds = ch.log[todayKey] || [];
        ch.daily.forEach(function (item) {
          var done = doneIds.indexOf(item.id) !== -1;
          var li = makeEl('li', 'mini-item' + (done ? ' is-done' : ''));
          li.dir = textDir(item.title);
          var btn = makeEl('button', 'mini-check');
          btn.type = 'button';
          btn.setAttribute('role', 'checkbox');
          btn.setAttribute('aria-checked', done ? 'true' : 'false');
          btn.setAttribute('aria-label', (done ? 'Undo: ' : 'Complete: ') + item.title);
          btn.innerHTML = CHECK_SVG;
          btn.addEventListener('click', function () {
            toggleChallengeItem(ch, item.id);
          });
          var text = makeEl('span', 'mini-text', item.title);
          text.dir = 'auto';
          li.appendChild(btn);
          li.appendChild(text);
          listEl.appendChild(li);
        });
        block.appendChild(listEl);
        card.appendChild(block);
      } else if (st.kind === 'won') {
        card.appendChild(makeEl('p', 'track-check-label', 'Every day won. Run it back?'));
      } else {
        card.appendChild(makeEl('p', 'track-check-label',
          'Closed with ' + st.won + ' of ' + ch.duration + ' days won.'));
      }

      if (st.kind === 'idle' || st.kind === 'won' || st.kind === 'over') {
        var actions = makeEl('div', 'track-actions');
        var start = makeEl('button', 'track-btn is-primary',
          st.kind === 'idle' ? 'Start challenge' : 'Run it again');
        start.type = 'button';
        start.addEventListener('click', function () {
          ch.startedAt = todayKey;
          ch.log = {};
          save();
          renderAll();
          toast(st.kind === 'idle' ? '✓ Challenge started · day 1' : '✓ Challenge restarted');
        });
        actions.appendChild(start);
        if (manageChallenges) {
          actions.appendChild(deleteButton('Delete ' + ch.title, function () {
            askDelete('challenge', ch.title, function () { removeChallenge(ch); });
          }));
        }
        card.appendChild(actions);
      } else if (manageChallenges) {
        var manageRow = makeEl('div', 'track-actions');
        manageRow.appendChild(deleteButton('Delete ' + ch.title, function () {
          askDelete('challenge', ch.title, function () { removeChallenge(ch); });
        }));
        card.appendChild(manageRow);
      }

      els.challengeList.appendChild(card);
    });

    els.challengesEmpty.hidden = state.challenges.length > 0;
  }

  function toggleChallengeItem(ch, itemId) {
    if (!ch.log) ch.log = {};
    var list = (ch.log[todayKey] || []).slice();
    var index = list.indexOf(itemId);
    var adding = index === -1;

    if (adding) list.push(itemId);
    else list.splice(index, 1);

    if (list.length) ch.log[todayKey] = list;
    else delete ch.log[todayKey];

    save();
    renderChallenges();

    if (!adding) return;

    var all = ch.daily.every(function (item) {
      return (ch.log[todayKey] || []).indexOf(item.id) !== -1;
    });

    if (challengeWonDays(ch) >= ch.duration) {
      toast('Challenge won — every day cleared');
    } else if (all) {
      toast('Day ' + (daysBetween(ch.startedAt, todayKey) + 1) + ' won');
    } else {
      vibrate(8);
    }
  }

  /* -------------------------------- programs ----------------------------- */

  function programDay(p) {
    if (!p.startedAt) return 0;
    return Math.min(p.duration, Math.max(1, daysBetween(p.startedAt, todayKey) + 1));
  }

  function programStatus(p) {
    if (!p.startedAt) return { kind: 'idle', label: 'Not started', day: 0, pct: 0 };
    var raw = daysBetween(p.startedAt, todayKey) + 1;
    var day = Math.min(p.duration, Math.max(1, raw));
    var pct = Math.min(100, Math.round((day / p.duration) * 100));
    if (raw > p.duration) return { kind: 'won', label: 'Completed', day: p.duration, pct: 100 };
    return { kind: 'live', label: 'Day ' + day, day: day, pct: pct };
  }

  /* The task that carries a program item. Matched on the item title the task
     was created with, so the link survives even if the title is re-rendered. */
  function linkedTaskFor(p, title) {
    var key = String(title || '').toLowerCase();
    for (var i = 0; i < state.tasks.length; i++) {
      var task = state.tasks[i];
      if (task.programId !== p.id) continue;
      if (String(task.programItem || task.title).toLowerCase() === key) return task;
    }
    return null;
  }

  function linkTaskToProgram(task, p, title) {
    task.programId = p.id;
    task.programItem = title;
    /* Program items are owned by the track: they appear only in Today's
       Program Routine block, never among the user's Non-Negotiables. */
    task.recurring = true;
  }

  function startProgram(p) {
    var added = 0;
    var linked = 0;

    p.items.forEach(function (title) {
      if (linkedTaskFor(p, title)) return;

      /* Adopt a matching standalone task instead of duplicating it. */
      var existing = null;
      for (var i = 0; i < state.tasks.length; i++) {
        var task = state.tasks[i];
        if (!task.programId && task.title.toLowerCase() === title.toLowerCase()) {
          existing = task;
          break;
        }
      }

      if (existing) {
        linkTaskToProgram(existing, p, title);
        linked += 1;
        return;
      }

      state.tasks.unshift({
        id: uid(),
        title: title,
        why: p.why,
        time: '',
        recurring: true,
        createdAt: Date.now(),
        programId: p.id,
        programItem: title
      });
      added += 1;
    });

    p.startedAt = todayKey;
    save();
    renderAll();

    var parts = [];
    if (added) parts.push(added + ' item' + (added === 1 ? '' : 's') + ' added');
    if (linked) parts.push(linked + ' linked');
    toast('✓ Program started' + (parts.length ? ' · ' + parts.join(' · ') : ' · routine in place'));
  }

  /* One-time repair for programs started before tasks carried a link: bind
     the matching task that is already in the list, never invent new ones. */
  function ensureProgramLinks() {
    var changed = false;
    state.programs.forEach(function (p) {
      if (!p.startedAt) return;
      p.items.forEach(function (title) {
        if (linkedTaskFor(p, title)) return;
        for (var i = 0; i < state.tasks.length; i++) {
          var task = state.tasks[i];
          if (task.programId) continue;
          if (task.title.toLowerCase() !== title.toLowerCase()) continue;
          linkTaskToProgram(task, p, title);
          changed = true;
          break;
        }
      });
    });
    if (changed) save();
  }

  var PROGRAM_PHASES = ['Foundation', 'Build', 'Peak'];

  function programPhases(p) {
    var count = Math.min(3, p.duration);
    var names = count >= 3 ? PROGRAM_PHASES : ['Foundation', 'Finish'];
    var base = Math.floor(p.duration / count);
    var extra = p.duration % count;
    var out = [];
    var start = 1;
    for (var i = 0; i < count; i++) {
      var len = base + (i < extra ? 1 : 0);
      out.push({
        index: i + 1,
        name: names[i],
        start: start,
        end: start + len - 1,
        len: len
      });
      start += len;
    }
    return out;
  }

  function programPhaseAt(p, day) {
    var list = programPhases(p);
    var active = list[0];
    for (var i = 0; i < list.length; i++) {
      if (day <= list[i].end) { active = list[i]; break; }
      active = list[i];
    }
    return { list: list, active: active };
  }

  /* Roadmap rail: one segment per phase, filled by the days covered so far. */
  function buildProgramRail(p, st) {
    var info = programPhaseAt(p, st.day);
    var rail = makeEl('div', 'prog-rail');
    rail.setAttribute('aria-hidden', 'true');

    info.list.forEach(function (phase) {
      var seg = makeEl('span', 'prog-seg');
      seg.style.flex = String(phase.len);
      if (st.kind === 'live' && phase.index === info.active.index) seg.classList.add('is-now');
      var covered = st.kind === 'won'
        ? phase.len
        : Math.max(0, Math.min(phase.len, st.day - phase.start + 1));
      var fill = makeEl('i');
      fill.style.width = Math.round((covered / phase.len) * 100) + '%';
      seg.appendChild(fill);
      rail.appendChild(seg);
    });

    return rail;
  }

  /* Programs are a track with a timeline, not a checklist card: the day and
     phase are the headline, completion is the score, and today's items sit in
     their own labelled block. */
  function buildProgramCard(p, index) {
    var st = programStatus(p);
    var info = programPhaseAt(p, st.day);
    var accent = ACCENTS[(index + 2) % ACCENTS.length];
    var card = makeEl('article', 'track-card program-card' +
      (st.kind === 'won' ? ' is-won' : '') +
      (st.kind === 'live' ? ' is-live' : ''));
    card.style.setProperty('--track-a', accent[0]);
    card.style.setProperty('--track-b', accent[1]);

    var top = makeEl('div', 'track-top');
    top.dir = textDir(p.title);
    var wrap = makeEl('div', 'track-title-wrap');
    wrap.dir = 'auto';
    wrap.appendChild(makeEl('span', 'program-kicker', 'Program track'));
    var heading = makeEl('h3', 'track-title', p.title);
    heading.dir = 'auto';
    wrap.appendChild(heading);
    if (p.why) {
      var why = makeEl('p', 'track-why', p.why);
      why.dir = 'auto';
      wrap.appendChild(why);
    }
    top.appendChild(wrap);
    var statusEl = makeEl('span', 'track-status is-' + st.kind, st.label);
    statusEl.dir = 'auto';
    top.appendChild(statusEl);
    card.appendChild(top);

    var road = makeEl('div', 'prog-road');
    var dayBox = makeEl('div', 'prog-day');
    dayBox.appendChild(makeEl('span', 'prog-day-num',
      st.kind === 'idle' ? String(p.duration) : String(st.day)));
    dayBox.appendChild(makeEl('span', 'prog-day-of',
      st.kind === 'idle' ? 'days' : '/ ' + p.duration + ' days'));
    dayBox.appendChild(makeEl('span', 'prog-phase',
      st.kind === 'idle'
        ? info.list.length + ' phases · ' + p.items.length + ' daily items'
        : 'Phase ' + info.active.index + ' of ' + info.list.length + ' · ' + info.active.name));
    road.appendChild(dayBox);

    var overall = makeEl('div', 'prog-overall');
    overall.appendChild(makeEl('b', null, st.pct + '%'));
    overall.appendChild(makeEl('span', null, 'of track'));
    road.appendChild(overall);
    card.appendChild(road);
    card.appendChild(buildProgramRail(p, st));

    var legend = makeEl('div', 'prog-legend');
    info.list.forEach(function (phase) {
      var chip = makeEl('span', 'prog-legend-chip' +
        (st.kind === 'live' && phase.index === info.active.index ? ' is-now' : ''));
      chip.appendChild(makeEl('i', null, 'P' + phase.index));
      chip.appendChild(document.createTextNode(phase.name + ' · ' + phase.len + 'd'));
      legend.appendChild(chip);
    });
    card.appendChild(legend);

    if (st.kind === 'live') {
      /* Today's scheduled items. Each row checks the linked task, so the
         Program card and the Today view stay in step in both directions. */
      var block = makeEl('div', 'track-check prog-today-block');
      var labelRow = makeEl('div', 'prog-today-row');
      labelRow.appendChild(makeEl('p', 'track-check-label', 'Today in Program'));
      var doneNow = 0;
      p.items.forEach(function (item) {
        var linked = linkedTaskFor(p, item);
        if (linked && isDone(linked.id, todayKey)) doneNow += 1;
      });
      labelRow.appendChild(makeEl('span', 'prog-today-tally',
        doneNow + ' of ' + p.items.length));
      block.appendChild(labelRow);

      var listEl = makeEl('ul', 'mini-list');
      p.items.forEach(function (item) {
        var task = linkedTaskFor(p, item);
        var done = task ? isDone(task.id, todayKey) : false;
        var li = makeEl('li', 'mini-item' + (done ? ' is-done' : ''));
        li.dir = textDir(item);

        var btn;
        if (task) {
          btn = makeEl('button', 'mini-check');
          btn.type = 'button';
          btn.setAttribute('role', 'checkbox');
          btn.setAttribute('aria-checked', done ? 'true' : 'false');
          btn.setAttribute('aria-label', (done ? 'Undo: ' : 'Complete: ') + item);
          btn.innerHTML = CHECK_SVG;
          btn.addEventListener('click', function () {
            toggleTask(task.id, todayKey);
          });
        } else {
          btn = makeEl('span', 'mini-check');
          btn.setAttribute('aria-hidden', 'true');
        }

        var text = makeEl('span', 'mini-text', item);
        text.dir = 'auto';
        li.appendChild(btn);
        li.appendChild(text);
        listEl.appendChild(li);
      });
      block.appendChild(listEl);
      card.appendChild(block);
    } else {
      var plan = makeEl('div', 'prog-plan');
      plan.appendChild(makeEl('p', 'track-check-label',
        st.kind === 'won'
          ? 'Track complete · daily routine'
          : 'Daily routine · ' + p.items.length + ' items'));
      var steps = makeEl('div', 'prog-steps');
      p.items.forEach(function (item, i) {
        var chip = makeEl('span', 'prog-step');
        chip.dir = 'auto';
        chip.appendChild(makeEl('i', null, pad(i + 1)));
        var text = makeEl('span', null, item);
        text.dir = 'auto';
        chip.appendChild(text);
        steps.appendChild(chip);
      });
      plan.appendChild(steps);
      card.appendChild(plan);
    }

    /* A live program has no one-tap reset: restarting it would wipe the day
       count, so the only action left is the managed delete. */
    if (st.kind !== 'live' || managePrograms) {
      var actions = makeEl('div', 'track-actions');
      if (st.kind !== 'live') {
        var start = makeEl('button', 'track-btn is-primary',
          st.kind === 'idle' ? 'Start program' : 'Start again');
        start.type = 'button';
        start.addEventListener('click', function () {
          startProgram(p);
        });
        actions.appendChild(start);
      }

      if (managePrograms) {
        actions.appendChild(deleteButton('Delete ' + p.title, function () {
          askDelete('program', p.title, function () {
            removeProgram(p);
          });
        }));
      }
      card.appendChild(actions);
    }

    return card;
  }

  function renderPrograms() {
    els.programList.textContent = '';
    els.programList.classList.toggle('is-managing', managePrograms);

    state.programs.forEach(function (p, index) {
      els.programList.appendChild(buildProgramCard(p, index));
    });

    els.programsEmpty.hidden = state.programs.length > 0;
  }

  /* --------------------------------- focus ------------------------------- */

  function sessionsLabel() {
    var n = state.focus.sessions;
    return n + ' session' + (n === 1 ? '' : 's') + ' today';
  }

  function ensureFocusDay() {
    if (state.focus.date === todayKey) return;
    state.focus.date = todayKey;
    state.focus.sessions = 0;
    save();
  }

  /* The timer supports an exact length, not just the four presets: minutes
     0–600 plus 0–59 seconds, stored alongside the legacy minutes field. */
  function focusDuration() {
    var total = (state.focus.minutes * 60) + (state.focus.seconds || 0);
    return total >= MIN_FOCUS_TOTAL ? total : 25 * 60;
  }

  function durationLabel(long) {
    var minutes = state.focus.minutes;
    var seconds = state.focus.seconds || 0;
    if (!seconds) {
      return long ? minutes + ' minute' + (minutes === 1 ? '' : 's') : minutes + ' min';
    }
    if (!minutes) return seconds + ' sec';
    return minutes + ' min ' + seconds + ' sec';
  }

  function updateFocusCard() {
    els.focusSub.textContent = durationLabel(false) +
      ' of unbroken work · then a clean break.';
    els.focusSessions.textContent = sessionsLabel();
    els.focusFootSessions.textContent = sessionsLabel();
    els.focusMinutesLabel.textContent = durationLabel(false);
  }

  function focusGoalText() {
    if (selectedKey === todayKey) {
      var tasks = activeTasksOn(todayKey);
      for (var i = 0; i < tasks.length; i++) {
        if (!isDone(tasks[i].id, todayKey)) return tasks[i].title;
      }
    }
    return 'Clear the next thing.';
  }

  function updateFocus() {
    var progress = focus.total ? (focus.total - focus.left) / focus.total : 0;
    els.focusTime.textContent = mmss(focus.left);
    els.focusRing.style.strokeDashoffset = String(RING_LEN * progress);
    els.focusToggle.textContent = focus.running
      ? 'Pause'
      : focus.left <= 0 ? 'Start again' : focus.left < focus.total ? 'Resume' : 'Start';

    var statusText = focus.running
      ? 'Focus running'
      : focus.left <= 0 ? 'Session complete'
        : focus.left < focus.total ? 'Paused' : 'Ready when you are';

    els.focusState.textContent = statusText;
    els.focusState.className = 'focus-state' +
      (focus.running ? ' is-live' : '') +
      (!focus.running && focus.left <= 0 ? ' is-done' : '');
    els.focusSessions.textContent = sessionsLabel();
    els.focusFootSessions.textContent = sessionsLabel();
    els.focusMinutesLabel.textContent = durationLabel(false);
  }

  function openFocus() {
    closeLengthPanel();
    focus.open = true;
    els.focusView.hidden = false;
    document.body.classList.add('focus-open');
    if (focus.left <= 0) focus.left = focus.total;
    els.focusGoal.textContent = focusGoalText();
    els.focusGoal.dir = 'auto';
    els.focusSwitch.checked = true;
    els.focusSwitchText.textContent = 'ON';
    updateFocus();
  }

  function exitFocus() {
    pauseFocus();
    closeLengthPanel();
    focus.open = false;
    els.focusView.hidden = true;
    document.body.classList.remove('focus-open');
    els.focusSwitch.checked = false;
    els.focusSwitchText.textContent = 'OFF';
  }

  function startFocus() {
    if (focus.running) return;
    if (focus.left <= 0) focus.left = focus.total;
    focus.running = true;
    focus.endAt = Date.now() + focus.left * 1000;
    window.clearInterval(focus.timer);
    focus.timer = window.setInterval(tickFocus, 250);
    updateFocus();
  }

  function pauseFocus() {
    if (focus.running && focus.endAt) {
      focus.left = Math.max(0, Math.round((focus.endAt - Date.now()) / 1000));
    }
    focus.running = false;
    focus.endAt = 0;
    window.clearInterval(focus.timer);
    focus.timer = 0;
    if (focus.open) updateFocus();
  }

  function resetFocus() {
    window.clearInterval(focus.timer);
    focus.timer = 0;
    focus.running = false;
    focus.endAt = 0;
    focus.total = focusDuration();
    focus.left = focus.total;
    updateFocus();
  }

  function tickFocus() {
    if (!focus.running) return;
    focus.left = Math.max(0, Math.round((focus.endAt - Date.now()) / 1000));
    if (focus.left <= 0) {
      finishFocus();
      return;
    }
    updateFocus();
  }

  function finishFocus() {
    window.clearInterval(focus.timer);
    focus.timer = 0;
    focus.running = false;
    focus.endAt = 0;
    focus.left = 0;

    ensureFocusDay();
    state.focus.sessions += 1;
    save();

    chime();
    window.setTimeout(chime, 420);
    vibrate(22);
    toast('Session complete — ' + durationLabel(true) + ' banked');
    updateFocus();
    els.focusState.textContent = 'Session complete';
    els.focusState.className = 'focus-state is-done';
  }

  function stopFocusClock() {
    window.clearInterval(focus.timer);
    focus.timer = 0;
    focus.running = false;
    focus.endAt = 0;
  }

  function clampInt(value, min, max, fallback) {
    var n = Math.round(Number(value));
    if (!isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, n));
  }

  function readLengthInputs() {
    return {
      minutes: clampInt(els.lengthMinutes.value, 0, MAX_FOCUS_MINUTES, state.focus.minutes),
      seconds: clampInt(els.lengthSeconds.value, 0, 59, state.focus.seconds)
    };
  }

  function syncPresetMarks(picked) {
    var minutes = picked ? picked.minutes : state.focus.minutes;
    var seconds = picked ? picked.seconds : (state.focus.seconds || 0);
    var presets = els.focusLength.querySelectorAll('[data-preset]');
    Array.prototype.forEach.call(presets, function (btn) {
      var on = !seconds && Number(btn.dataset.preset) === minutes;
      btn.classList.toggle('is-current', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  function openLengthPanel() {
    els.focusLength.hidden = false;
    els.focusChange.setAttribute('aria-expanded', 'true');
    els.lengthMinutes.value = String(state.focus.minutes);
    els.lengthSeconds.value = String(state.focus.seconds);
    els.lengthError.hidden = true;
    syncPresetMarks();
  }

  function closeLengthPanel() {
    if (els.focusLength.hidden) return;
    els.focusLength.hidden = true;
    els.focusChange.setAttribute('aria-expanded', 'false');
  }

  function applyFocusLength(minutes, seconds) {
    stopFocusClock();
    state.focus.minutes = minutes;
    state.focus.seconds = seconds;
    save();
    focus.total = focusDuration();
    focus.left = focus.total;
    updateFocus();
    updateFocusCard();
    closeLengthPanel();
    toast(durationLabel(false) + ' session ready');
  }

  function commitLengthInputs() {
    var picked = readLengthInputs();
    if (picked.minutes * 60 + picked.seconds < MIN_FOCUS_TOTAL) {
      els.lengthError.hidden = false;
      return;
    }
    els.lengthError.hidden = true;
    applyFocusLength(picked.minutes, picked.seconds);
  }

  function stepLength(step) {
    var picked = readLengthInputs();
    if (step === 'min-up') picked.minutes = clampInt(picked.minutes + 1, 0, MAX_FOCUS_MINUTES, picked.minutes);
    else if (step === 'min-down') picked.minutes = clampInt(picked.minutes - 1, 0, MAX_FOCUS_MINUTES, picked.minutes);
    else if (step === 'sec-up') picked.seconds = clampInt(picked.seconds + 5, 0, 59, picked.seconds);
    else if (step === 'sec-down') picked.seconds = clampInt(picked.seconds - 5, 0, 59, picked.seconds);
    else return;

    els.lengthMinutes.value = String(picked.minutes);
    els.lengthSeconds.value = String(picked.seconds);
    els.lengthError.hidden = true;
    syncPresetMarks(picked);
  }

  function onLengthInput() {
    els.lengthError.hidden = true;
    syncPresetMarks(readLengthInputs());
  }

  /* -------------------------------- render all ---------------------------- */

  function applyView() {
    els.viewToday.hidden = view !== 'today';
    els.viewChallenges.hidden = view !== 'challenges';
    els.viewPrograms.hidden = view !== 'programs';

    var tabs = els.tabbar.querySelectorAll('.tab');
    Array.prototype.forEach.call(tabs, function (tab) {
      var on = tab.dataset.view === view;
      tab.classList.toggle('is-active', on);
      if (on) tab.setAttribute('aria-current', 'page');
      else tab.removeAttribute('aria-current');
    });
  }

  function renderAll(flash) {
    todayKey = keyOf(new Date());
    if (selectedKey > todayKey) selectedKey = todayKey;

    ensureFocusDay();
    renderWeek();
    renderProgress();
    renderLists(flash);
    renderProgramToday(flash);
    renderChallenges();
    renderPrograms();
    updateFocusCard();

    document.body.classList.toggle('editing', editMode);
    els.editBtn.classList.toggle('is-on', editMode);
    els.editBtn.setAttribute('aria-pressed', editMode ? 'true' : 'false');
    els.editChallenges.classList.toggle('is-on', manageChallenges);
    els.editChallenges.setAttribute('aria-pressed', manageChallenges ? 'true' : 'false');
    els.editPrograms.classList.toggle('is-on', managePrograms);
    els.editPrograms.setAttribute('aria-pressed', managePrograms ? 'true' : 'false');

    applyView();
  }

  function setView(next) {
    view = next === 'challenges' || next === 'programs' ? next : 'today';
    state.view = view;
    save();
    renderAll();
    window.scrollTo(0, 0);
  }

  /* --------------------------------- sheet ------------------------------- */

  function showError(message) {
    els.formError.textContent = message;
    els.formError.hidden = false;
  }

  function clearError() {
    els.formError.hidden = true;
  }

  function applySheetMode() {
    var isTask = sheetMode === 'task';
    els.taskExtras.hidden = !isTask;
    els.trackExtras.hidden = isTask;

    if (isTask) {
      els.sheetTitle.textContent = editingId ? 'Edit task' : (newRecurring ? 'New non-negotiable' : 'New task');
      els.labelTitle.textContent = 'Task';
      els.labelWhy.textContent = 'Why it matters';
      els.fieldTitle.placeholder = 'What are you doing?';
      els.fieldWhy.placeholder = 'Where does this take you?';
      return;
    }

    var isChallenge = sheetMode === 'challenge';
    els.sheetTitle.textContent = isChallenge ? 'New challenge' : 'New program';
    els.labelTitle.textContent = isChallenge ? 'Challenge name' : 'Program name';
    els.labelWhy.textContent = 'Why it takes you forward';
    els.fieldTitle.placeholder = isChallenge ? 'e.g. 7-Day No Sugar' : 'e.g. Morning Protocol';
    els.fieldWhy.placeholder = 'What does finishing this change?';
    els.labelItems.innerHTML = isChallenge
      ? 'Daily checklist <span class="optional">one per line</span>'
      : 'Routine items <span class="optional">one per line</span>';
    els.fieldItems.placeholder = isChallenge
      ? 'No added sugar\n2L water\n20 minute walk'
      : 'Wake at 06:00\n10 min sunlight\nCold shower';
    els.fieldDuration.value = isChallenge ? '7' : '21';
  }

  function openTaskSheet(task, recurringPreset) {
    if (task && task.programId) return;
    sheetMode = 'task';
    editingId = task ? task.id : null;
    newRecurring = !!recurringPreset;

    els.fieldTitle.value = task ? task.title : '';
    els.fieldWhy.value = task ? task.why : '';
    els.fieldTime.value = task ? task.time : '';
    els.fieldRecurring.checked = task ? !!task.recurring : newRecurring;
    els.sheetDelete.hidden = !task;
    clearError();
    applySheetMode();
    showSheet();
  }

  function openTrackSheet(mode) {
    sheetMode = mode;
    editingId = null;
    els.fieldTitle.value = '';
    els.fieldWhy.value = '';
    els.fieldItems.value = '';
    els.fieldDuration.value = mode === 'challenge' ? '7' : '21';
    els.sheetDelete.hidden = true;
    clearError();
    applySheetMode();
    showSheet();
  }

  function showSheet() {
    els.sheet.hidden = false;
    document.body.classList.add('sheet-open');

    var finePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
    if (finePointer) {
      window.setTimeout(function () {
        if (!els.sheet.hidden) els.fieldTitle.focus();
      }, 60);
    }
  }

  function closeSheet() {
    els.sheet.hidden = true;
    document.body.classList.remove('sheet-open');
    editingId = null;
    sheetMode = 'task';
  }

  function saveTask() {
    var wasEditing = !!editingId;
    var title = trimText(els.fieldTitle.value, MAX_TITLE);
    if (!title) {
      showError('Give the task a name first.');
      els.fieldTitle.focus();
      return;
    }

    var data = {
      title: title,
      why: trimText(els.fieldWhy.value, MAX_WHY),
      time: normalizeTime(els.fieldTime.value),
      recurring: els.fieldRecurring.checked
    };

    if (editingId) {
      state.tasks.forEach(function (task) {
        if (task.id !== editingId) return;
        task.title = data.title;
        task.why = data.why;
        task.time = data.time;
        task.recurring = data.recurring;
      });
    } else {
      state.tasks.unshift({
        id: uid(),
        title: data.title,
        why: data.why,
        time: data.time,
        recurring: data.recurring,
        createdAt: Date.now()
      });
    }

    save();
    closeSheet();
    renderAll();
    toast(wasEditing ? 'Task updated' : 'Task added');
  }

  function saveTrack() {
    var mode = sheetMode;
    var title = trimText(els.fieldTitle.value, MAX_TITLE);
    if (!title) {
      showError('Give it a name first.');
      els.fieldTitle.focus();
      return;
    }

    var duration = clampDays(els.fieldDuration.value);
    var items = els.fieldItems.value.split('\n').map(function (line) {
      return trimText(line, MAX_TITLE);
    }).filter(Boolean).slice(0, MAX_ITEMS);

    if (!items.length) {
      showError(sheetMode === 'challenge'
        ? 'Add at least one daily action.'
        : 'Add at least one routine item.');
      els.fieldItems.focus();
      return;
    }

    var why = trimText(els.fieldWhy.value, MAX_WHY);

    if (mode === 'challenge') {
      state.challenges.unshift({
        id: uid(),
        title: title,
        why: why,
        duration: duration,
        daily: items.map(function (text) {
          return { id: uid(), title: text };
        }),
        startedAt: null,
        log: {}
      });
    } else {
      state.programs.unshift({
        id: uid(),
        title: title,
        why: why,
        duration: duration,
        items: items,
        startedAt: null
      });
    }

    save();
    closeSheet();
    renderAll();
    toast(mode === 'challenge' ? 'Challenge added' : 'Program added');
  }

  function saveSheet(event) {
    event.preventDefault();
    if (sheetMode === 'task') saveTask();
    else saveTrack();
  }

  /* ------------------------- hold-to-confirm delete ----------------------- */

  /* Deleting is permanent, so every × opens this dialog instead of firing at
     once: the action only runs after a deliberate press-and-hold. Releasing
     early cancels, and the fill shows how much of the hold is left. */

  var CONFIRM_HOLD_MS = 900;
  var confirmCallback = null;
  var confirmOpener = null;
  var confirmStartAt = 0;
  var confirmRaf = 0;
  var confirmDone = false;

  var CONFIRM_COPY = {
    task: {
      title: 'Delete this task?',
      note: 'It leaves today’s plan and its streak history is cleared.'
    },
    habit: {
      title: 'Delete this non-negotiable?',
      note: 'Its daily ticks and streak are cleared with it.'
    },
    challenge: {
      title: 'Delete this challenge?',
      note: 'Every logged win goes with it.'
    },
    program: {
      title: 'Delete this program?',
      note: 'Its routine items are removed from your list with it.'
    }
  };

  function askDelete(kind, title, onConfirm) {
    var copy = CONFIRM_COPY[kind] || CONFIRM_COPY.task;
    confirmCallback = onConfirm;
    confirmOpener = document.activeElement;
    if (confirmOpener && typeof confirmOpener.blur === 'function') confirmOpener.blur();
    els.confirmTitle.textContent = copy.title;
    els.confirmItem.textContent = title || '';
    els.confirmNote.textContent = copy.note;
    resetConfirmHold();
    confirmDone = false;
    els.confirm.hidden = false;
    document.body.classList.add('confirm-open');
    window.setTimeout(function () {
      if (!els.confirm.hidden) els.confirmHold.focus();
    }, 40);
  }

  function closeConfirm(restoreFocus) {
    resetConfirmHold();
    confirmCallback = null;
    els.confirm.hidden = true;
    document.body.classList.remove('confirm-open');
    var opener = confirmOpener;
    confirmOpener = null;
    if (!restoreFocus || !opener) return;
    if (!document.contains(opener) || opener.offsetParent === null) return;
    try { opener.focus({ preventScroll: true }); } catch (err) { /* ignore */ }
  }

  function resetConfirmHold() {
    if (confirmRaf) {
      window.cancelAnimationFrame(confirmRaf);
      confirmRaf = 0;
    }
    confirmStartAt = 0;
    els.confirmHold.classList.remove('is-holding');
    els.confirmHold.style.setProperty('--hold', '0');
    els.confirmHoldText.textContent = 'Hold to delete';
  }

  function startConfirmHold(event) {
    if (event) event.preventDefault();
    if (els.confirm.hidden || confirmRaf || confirmDone) return;
    confirmStartAt = 0;
    els.confirmHold.classList.add('is-holding');
    els.confirmHoldText.textContent = 'Keep holding…';
    vibrate(6);
    confirmRaf = window.requestAnimationFrame(stepConfirmHold);
  }

  function stepConfirmHold(now) {
    confirmRaf = 0;
    if (!confirmStartAt) confirmStartAt = now;
    var ratio = Math.min(1, (now - confirmStartAt) / CONFIRM_HOLD_MS);
    els.confirmHold.style.setProperty('--hold', ratio.toFixed(4));
    if (ratio >= 1) {
      finishConfirmHold();
      return;
    }
    confirmRaf = window.requestAnimationFrame(stepConfirmHold);
  }

  function finishConfirmHold() {
    if (confirmDone) return;
    confirmDone = true;
    if (confirmRaf) {
      window.cancelAnimationFrame(confirmRaf);
      confirmRaf = 0;
    }
    els.confirmHold.style.setProperty('--hold', '1');
    els.confirmHold.classList.remove('is-holding');
    vibrate(18);
    var run = confirmCallback;
    closeConfirm(false);
    if (run) run();
  }

  /* Drop tasks and every completion that pointed at them, so no stale ids
     keep a day's count or a streak alive after the task is gone. */
  function purgeTasks(ids) {
    if (!ids.length) return;
    state.tasks = state.tasks.filter(function (t) { return ids.indexOf(t.id) === -1; });
    Object.keys(state.history).forEach(function (key) {
      var list = state.history[key].filter(function (taskId) {
        return ids.indexOf(taskId) === -1;
      });
      if (list.length) state.history[key] = list;
      else delete state.history[key];
    });
  }

  function removeTask(id) {
    purgeTasks([id]);
    save();
    renderAll();
    toast('✓ Task deleted');
  }

  function removeProgram(p) {
    var ids = state.tasks.filter(function (t) { return t.programId === p.id; })
      .map(function (t) { return t.id; });
    state.programs = state.programs.filter(function (item) { return item.id !== p.id; });
    purgeTasks(ids);
    save();
    renderAll();
    toast('✓ Program deleted' +
      (ids.length ? ' · ' + ids.length + ' linked item' + (ids.length === 1 ? '' : 's') + ' removed' : ''));
  }

  function deleteFromSheet() {
    if (!editingId) return;
    var id = editingId;
    var task = state.tasks.filter(function (t) { return t.id === id; })[0];
    if (!task || task.programId) return;
    askDelete(task.recurring ? 'habit' : 'task', task.title, function () {
      closeSheet();
      removeTask(id);
    });
  }

  /* --------------------------------- audio ------------------------------- */

  function chime() {
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtx) audioCtx = new Ctx();
      if (audioCtx.state === 'suspended') audioCtx.resume();

      var t0 = audioCtx.currentTime;
      [[880, 0], [1174.66, 0.08]].forEach(function (note) {
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = note[0];
        gain.gain.setValueAtTime(0.0001, t0 + note[1]);
        gain.gain.exponentialRampToValueAtTime(0.12, t0 + note[1] + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + note[1] + 0.24);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(t0 + note[1]);
        osc.stop(t0 + note[1] + 0.3);
      });
    } catch (err) {
      /* Audio is a nicety; never let it block the check. */
    }
  }

  /* --------------------------------- toast ------------------------------- */

  /* A leading ✓ is rendered as its own green glyph, so confirmations read as
     a success at a glance rather than as plain status text. */
  function toast(message) {
    if (toastTimer) {
      window.clearTimeout(toastTimer);
      toastTimer = 0;
    }

    var text = String(message == null ? '' : message);
    var success = text.charAt(0) === '✓';
    els.toast.textContent = '';
    els.toast.classList.toggle('is-success', success);

    if (success) {
      var mark = makeEl('span', 'toast-check', '✓');
      mark.setAttribute('aria-hidden', 'true');
      els.toast.appendChild(mark);
      els.toast.appendChild(makeEl('span', 'toast-msg', text.slice(1).trim()));
    } else {
      els.toast.textContent = text;
    }

    els.toast.hidden = false;
    toastTimer = window.setTimeout(function () {
      els.toast.hidden = true;
      toastTimer = 0;
    }, 2400);
  }

  /* -------------------------------- events ------------------------------- */

  els.addBtn.addEventListener('click', function () { openTaskSheet(null, false); });
  els.addHabitBtn.addEventListener('click', function () { openTaskSheet(null, true); });
  els.addChallengeBtn.addEventListener('click', function () { openTrackSheet('challenge'); });
  els.addProgramBtn.addEventListener('click', function () { openTrackSheet('program'); });

  els.editBtn.addEventListener('click', function () {
    editMode = !editMode;
    renderAll();
    if (editMode) toast('Tap × to delete, or a task to edit');
  });

  els.editChallenges.addEventListener('click', function () {
    manageChallenges = !manageChallenges;
    renderChallenges();
    els.editChallenges.classList.toggle('is-on', manageChallenges);
    els.editChallenges.setAttribute('aria-pressed', manageChallenges ? 'true' : 'false');
  });

  els.editPrograms.addEventListener('click', function () {
    managePrograms = !managePrograms;
    renderPrograms();
    els.editPrograms.classList.toggle('is-on', managePrograms);
    els.editPrograms.setAttribute('aria-pressed', managePrograms ? 'true' : 'false');
  });

  Array.prototype.forEach.call(els.tabbar.querySelectorAll('.tab'), function (tab) {
    tab.addEventListener('click', function () {
      setView(tab.dataset.view);
    });
  });

  els.taskForm.addEventListener('submit', saveSheet);
  els.sheetDelete.addEventListener('click', deleteFromSheet);
  els.sheetClose.addEventListener('click', closeSheet);
  els.sheetCancel.addEventListener('click', closeSheet);
  els.sheetVeil.addEventListener('click', closeSheet);

  els.confirmCancel.addEventListener('click', function () { closeConfirm(true); });
  els.confirmVeil.addEventListener('click', function () { closeConfirm(true); });

  els.confirmHold.addEventListener('pointerdown', startConfirmHold);
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (type) {
    els.confirmHold.addEventListener(type, function () {
      if (!confirmDone) resetConfirmHold();
    });
  });
  els.confirmHold.addEventListener('contextmenu', function (event) {
    event.preventDefault();
  });
  els.confirmHold.addEventListener('keydown', function (event) {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    if (event.repeat) {
      event.preventDefault();
      return;
    }
    startConfirmHold(event);
  });
  els.confirmHold.addEventListener('keyup', function (event) {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    event.preventDefault();
    if (!confirmDone) resetConfirmHold();
  });

  els.fieldTitle.addEventListener('input', function () {
    if (!els.fieldTitle.value.trim()) return;
    clearError();
  });

  els.focusSwitch.addEventListener('change', function () {
    if (els.focusSwitch.checked) openFocus();
    else exitFocus();
  });

  els.focusExit.addEventListener('click', exitFocus);

  els.focusToggle.addEventListener('click', function () {
    if (focus.running) pauseFocus();
    else startFocus();
  });

  els.focusReset.addEventListener('click', resetFocus);

  els.focusChange.addEventListener('click', function () {
    if (els.focusLength.hidden) openLengthPanel();
    else closeLengthPanel();
  });

  els.lengthClose.addEventListener('click', closeLengthPanel);
  els.lengthCancel.addEventListener('click', closeLengthPanel);
  els.lengthSet.addEventListener('click', commitLengthInputs);
  els.lengthMinutes.addEventListener('input', onLengthInput);
  els.lengthSeconds.addEventListener('input', onLengthInput);

  els.focusLength.addEventListener('click', function (event) {
    var preset = event.target.closest('[data-preset]');
    if (preset) {
      applyFocusLength(Number(preset.dataset.preset), 0);
      return;
    }
    var step = event.target.closest('[data-step]');
    if (step) stepLength(step.dataset.step);
  });

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    if (!els.confirm.hidden) closeConfirm(true);
    else if (!els.sheet.hidden) closeSheet();
    else if (!els.focusLength.hidden) closeLengthPanel();
    else if (focus.open) exitFocus();
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) return;
    syncFromStorage();
    rollover();
    if (focus.open) updateFocus();
  });

  /* iOS can restore a standalone page from the back/forward cache. Repaint
     from storage so the day's ticks are never lost on the way back. */
  window.addEventListener('pageshow', function (event) {
    if (!event.persisted) return;
    resetPull();
    syncFromStorage();
    renderAll();
  });

  /* ------------------------ pull to refresh + veil ------------------------ */

  /* There is no native pull-to-refresh here (overscroll is contained), so this
     replaces the grey sheet with AURA's own: dark glass, indigo/gold glow and a
     gold → violet spinner. Releasing past the trigger reloads the shell. */

  var PULL_MAX = 76;
  var PULL_TRIGGER = 52;
  var PULL_SLIDE = 64;
  var pull = { startY: 0, active: false, armed: false, loading: false };

  function setPull(distance) {
    if (!els.ptr) return;
    var d = Math.max(0, Math.min(PULL_MAX, distance));
    els.ptr.style.setProperty('--ptr', Math.min(d, PULL_SLIDE) + 'px');
    els.ptr.style.setProperty('--ptr-o', (d / PULL_MAX).toFixed(3));
    pull.armed = d >= PULL_TRIGGER;
    els.ptr.classList.toggle('is-armed', pull.armed);
    if (!pull.loading) els.ptrText.textContent = pull.armed ? 'Release to refresh' : 'Pull to refresh';
  }

  function canPull() {
    if (pull.loading || focus.open || !els.sheet.hidden || !els.confirm.hidden) return false;
    return (window.scrollY || document.documentElement.scrollTop || 0) <= 0;
  }

  function resetPull() {
    pull.active = false;
    pull.loading = false;
    if (!els.ptr) return;
    els.ptr.classList.remove('is-loading', 'is-armed');
    setPull(0);
  }

  function beginReload() {
    if (!els.ptr) {
      window.location.reload();
      return;
    }
    setPull(PULL_MAX);
    pull.loading = true;
    els.ptr.classList.add('is-loading');
    els.ptrText.textContent = 'Refreshing';
    window.setTimeout(function () {
      window.location.reload();
    }, 420);
  }

  document.addEventListener('touchstart', function (event) {
    if (event.touches.length !== 1 || !canPull()) return;
    pull.startY = event.touches[0].clientY;
    pull.active = true;
  }, { passive: true });

  document.addEventListener('touchmove', function (event) {
    if (!pull.active) return;
    var dy = event.touches[0].clientY - pull.startY;
    if (dy <= 0) {
      setPull(0);
      if (dy < -8) pull.active = false;
      return;
    }
    if (!canPull()) {
      pull.active = false;
      setPull(0);
      return;
    }
    if (event.cancelable) event.preventDefault();
    setPull(dy * 0.55);
  }, { passive: false });

  document.addEventListener('touchend', function () {
    if (!pull.active) return;
    pull.active = false;
    if (pull.armed && !pull.loading) beginReload();
    else if (!pull.loading) setPull(0);
  }, { passive: true });

  document.addEventListener('touchcancel', function () {
    pull.active = false;
    if (!pull.loading) setPull(0);
  }, { passive: true });

  if (els.boot) {
    var dismissBoot = function () { els.boot.classList.add('is-gone'); };
    window.addEventListener('load', dismissBoot);
    window.setTimeout(dismissBoot, 900);
  }

  /* --------------------------------- boot -------------------------------- */

  function rollover() {
    var key = keyOf(new Date());
    if (key === todayKey) return;
    var followingToday = selectedKey === todayKey;
    todayKey = key;
    if (followingToday) selectedKey = key;
    ensureFocusDay();
    renderAll();
  }

  window.setInterval(rollover, 60000);

  /* iOS ignores user-scalable=no, so also close the gesture gaps. */
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(function (type) {
    document.addEventListener(type, function (event) {
      event.preventDefault();
    }, { passive: false });
  });

  document.addEventListener('touchmove', function (event) {
    if (event.touches.length > 1) event.preventDefault();
  }, { passive: false });

  document.addEventListener('dblclick', function (event) {
    event.preventDefault();
  }, { passive: false });

  if ('serviceWorker' in navigator && window.isSecureContext) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./sw.js').catch(function () {
        /* Registration is optional; the app runs without it. */
      });
    });
  }

  ensureProgramLinks();
  renderAll();
  updateFocus();
  save();
})();
