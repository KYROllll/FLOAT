/* ==========================================================================
   ARENA // DAILY OS
   Daily discipline, streaks, challenges and programs. Vanilla JS, no deps.
   Storage: localStorage "arena.daily.v2"
   ========================================================================== */
(function () {
  'use strict';

  var STORAGE_KEY = 'arena.daily.v2';
  var LEGACY_KEY = 'arena.daily.v1';
  var MAX_TITLE = 80;
  var MAX_WHY = 120;
  var MAX_ITEMS = 12;
  var MAX_STREAK = 3650;
  var MIN_DAYS = 2;
  var MAX_DAYS = 90;
  var RING_LEN = 552.92;
  var FOCUS_LENGTHS = [15, 25, 45, 60];
  var ACCENTS = [
    ['#8b5cf6', '#22d3ee'],
    ['#f97316', '#fbbf24'],
    ['#22c55e', '#00e676'],
    ['#ec4899', '#8b5cf6']
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
    sheet: document.getElementById('sheet'),
    sheetVeil: document.getElementById('sheetVeil'),
    sheetPanel: document.getElementById('sheetPanel'),
    sheetTitle: document.getElementById('sheetTitle'),
    sheetClose: document.getElementById('sheetClose'),
    sheetCancel: document.getElementById('sheetCancel'),
    sheetDelete: document.getElementById('sheetDelete'),
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
    total: (state.focus.minutes || 25) * 60,
    left: (state.focus.minutes || 25) * 60,
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
      v: 2,
      view: 'today',
      tasks: seedTasks(),
      history: {},
      challenges: seedChallenges(),
      programs: seedPrograms(),
      focus: { sessions: 0, date: keyOf(new Date()), minutes: 25 }
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
      createdAt: Number(raw.createdAt) || Date.now()
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
      var legacy = parse(LEGACY_KEY);
      if (legacy && Array.isArray(legacy.tasks)) {
        raw = { tasks: legacy.tasks, history: legacy.history };
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

    var focusRaw = raw.focus && typeof raw.focus === 'object' ? raw.focus : {};
    var minutes = Number(focusRaw.minutes);
    if (FOCUS_LENGTHS.indexOf(minutes) === -1) minutes = 25;

    return {
      v: 2,
      view: raw.view === 'challenges' || raw.view === 'programs' ? raw.view : 'today',
      tasks: tasks,
      history: history,
      challenges: challenges,
      programs: programs,
      focus: {
        sessions: Math.max(0, Math.min(999, Number(focusRaw.sessions) || 0)),
        date: /^\d{4}-\d{2}-\d{2}$/.test(focusRaw.date) ? focusRaw.date : keyOf(new Date()),
        minutes: minutes
      }
    };
  }

  function save() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      /* Private mode or quota: the session still works. */
    }
  }

  /* ------------------------------- progress ------------------------------ */

  function completionsFor(key) {
    var list = state.history[key];
    return Array.isArray(list) ? list : [];
  }

  function isDone(id, key) {
    return completionsFor(key).indexOf(id) !== -1;
  }

  function doneCount(key) {
    var ids = completionsFor(key);
    var n = 0;
    state.tasks.forEach(function (task) {
      if (ids.indexOf(task.id) !== -1) n += 1;
    });
    return n;
  }

  function allDone(key) {
    if (!state.tasks.length) return false;
    return doneCount(key) === state.tasks.length;
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
    if (!state.tasks.length) return 0;
    var cursor = todayKey;
    if (!allDone(cursor)) cursor = shiftKey(cursor, -1);
    var n = 0;
    while (n < MAX_STREAK && allDone(cursor)) {
      n += 1;
      cursor = shiftKey(cursor, -1);
    }
    return n;
  }

  function toggleTask(id) {
    var key = selectedKey;
    var list = completionsFor(key).slice();
    var index = list.indexOf(id);
    var adding = index === -1;

    if (adding) list.push(id);
    else list.splice(index, 1);

    if (list.length) state.history[key] = list;
    else delete state.history[key];

    save();
    renderAll(adding ? id : null);

    if (adding) {
      chime();
      vibrate(8);
    }
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
      if (!completionsFor(key).length) btn.classList.add('no-dot');
      if (key > todayKey) btn.disabled = true;

      var day = makeEl('span', 'wk-day',
        d.toLocaleDateString(undefined, { weekday: 'short' }).replace(/\.$/, ''));
      var date = makeEl('span', 'wk-date', String(d.getDate()));
      var dot = makeEl('span', 'wk-dot');
      dot.setAttribute('aria-hidden', 'true');

      var label = d.toLocaleDateString(undefined, {
        weekday: 'long', month: 'short', day: 'numeric'
      });
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

  function renderProgress() {
    var total = state.tasks.length;
    var done = doneCount(selectedKey);
    var pct = total ? Math.round((done / total) * 100) : 0;
    var color = pct >= 67 ? '#34d399' : pct >= 34 ? '#fbbf24' : '#ff6b6b';
    var glow = pct >= 67
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

    if (pct >= 67) {
      els.scaleStatus.textContent = 'Win zone · threshold cleared';
      els.scaleStatus.classList.add('is-win');
    } else {
      var need = total ? Math.max(0, Math.ceil(total * 0.67) - done) : 0;
      els.scaleStatus.textContent = total
        ? need + ' to win · 67% threshold'
        : 'Win at 67%';
      els.scaleStatus.classList.remove('is-win');
    }

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

  function buildCard(task, flash) {
    var done = isDone(task.id, selectedKey);

    var li = document.createElement('li');
    li.className = 'task-card';
    li.dataset.id = task.id;
    if (done) li.classList.add('is-done');
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

    var body = document.createElement('button');
    body.type = 'button';
    body.className = 'task-body';
    body.setAttribute('aria-label', 'Edit ' + task.title);
    body.addEventListener('click', function () {
      openTaskSheet(task);
    });

    var top = document.createElement('span');
    top.className = 'task-top';

    if (task.time) {
      top.appendChild(makeEl('span', 'task-time', task.time));
    }

    var title = makeEl('span', 'task-title', task.title);
    title.dir = 'auto';
    top.appendChild(title);
    body.appendChild(top);

    if (task.why) {
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

    var del = document.createElement('button');
    del.type = 'button';
    del.className = 'task-del';
    del.setAttribute('aria-label', 'Delete ' + task.title);
    del.innerHTML = X_SVG;
    del.addEventListener('click', function (event) {
      event.stopPropagation();
      removeTask(task.id);
    });
    side.appendChild(del);

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
    var plan = state.tasks.filter(function (t) { return !t.recurring; });
    var habits = state.tasks.filter(function (t) { return t.recurring; });

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
      var wrap = makeEl('div', 'track-title-wrap');
      var heading = makeEl('h3', 'track-title', ch.title);
      heading.dir = 'auto';
      wrap.appendChild(heading);
      if (ch.why) {
        var why = makeEl('p', 'track-why', ch.why);
        why.dir = 'auto';
        wrap.appendChild(why);
      }
      top.appendChild(wrap);
      top.appendChild(makeEl('span', 'track-status is-' + st.kind, st.label));
      card.appendChild(top);

      var meter = makeEl('div', 'track-meter');
      var fill = makeEl('span');
      fill.style.width = st.pct + '%';
      meter.appendChild(fill);
      card.appendChild(meter);

      var meta = makeEl('div', 'track-meta');
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
          toast(st.kind === 'idle' ? 'Challenge started — day 1' : 'Challenge restarted');
        });
        actions.appendChild(start);
        if (manageChallenges) {
          actions.appendChild(deleteButton('Delete ' + ch.title, function () {
            state.challenges = state.challenges.filter(function (item) { return item.id !== ch.id; });
            save();
            renderAll();
            toast('Challenge deleted');
          }));
        }
        card.appendChild(actions);
      } else if (manageChallenges) {
        var manageRow = makeEl('div', 'track-actions');
        manageRow.appendChild(deleteButton('Delete ' + ch.title, function () {
          state.challenges = state.challenges.filter(function (item) { return item.id !== ch.id; });
          save();
          renderAll();
          toast('Challenge deleted');
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
      chime();
      toast('Challenge won — every day cleared');
    } else if (all) {
      chime();
      toast('Day ' + (daysBetween(ch.startedAt, todayKey) + 1) + ' won');
    } else {
      chime();
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

  function startProgram(p) {
    var added = 0;
    p.items.forEach(function (title) {
      var exists = state.tasks.some(function (task) {
        return task.title.toLowerCase() === title.toLowerCase();
      });
      if (exists) return;
      state.tasks.unshift({
        id: uid(),
        title: title,
        why: p.why,
        time: '',
        recurring: true,
        createdAt: Date.now()
      });
      added += 1;
    });

    p.startedAt = todayKey;
    save();
    renderAll();
    toast(added
      ? 'Program started · ' + added + ' habit' + (added === 1 ? '' : 's') + ' added'
      : 'Program restarted — routine already in place');
  }

  function renderPrograms() {
    els.programList.textContent = '';
    els.programList.classList.toggle('is-managing', managePrograms);

    state.programs.forEach(function (p, index) {
      var st = programStatus(p);
      var accent = ACCENTS[(index + 2) % ACCENTS.length];
      var card = makeEl('article', 'track-card' + (st.kind === 'won' ? ' is-won' : ''));
      card.style.setProperty('--track-a', accent[0]);
      card.style.setProperty('--track-b', accent[1]);

      var top = makeEl('div', 'track-top');
      var wrap = makeEl('div', 'track-title-wrap');
      var heading = makeEl('h3', 'track-title', p.title);
      heading.dir = 'auto';
      wrap.appendChild(heading);
      if (p.why) {
        var why = makeEl('p', 'track-why', p.why);
        why.dir = 'auto';
        wrap.appendChild(why);
      }
      top.appendChild(wrap);
      top.appendChild(makeEl('span', 'track-status is-' + st.kind, st.label));
      card.appendChild(top);

      var meter = makeEl('div', 'track-meter');
      var fill = makeEl('span');
      fill.style.width = st.pct + '%';
      meter.appendChild(fill);
      card.appendChild(meter);

      var meta = makeEl('div', 'track-meta');
      meta.appendChild(makeEl('span', null,
        st.kind === 'idle'
          ? p.duration + ' days · ' + p.items.length + ' routine items'
          : 'Day ' + st.day + ' / ' + p.duration));
      var pctText = makeEl('span');
      var pctNum = makeEl('b', null, st.pct + '%');
      pctText.appendChild(pctNum);
      pctText.appendChild(document.createTextNode(' complete'));
      meta.appendChild(pctText);
      card.appendChild(meta);

      var steps = makeEl('div', 'prog-steps');
      p.items.forEach(function (item, i) {
        var chip = makeEl('span', 'prog-step');
        chip.appendChild(makeEl('i', null, pad(i + 1)));
        var text = makeEl('span', null, item);
        text.dir = 'auto';
        chip.appendChild(text);
        steps.appendChild(chip);
      });
      card.appendChild(steps);

      var actions = makeEl('div', 'track-actions');
      var start = makeEl('button', 'track-btn is-primary',
        st.kind === 'idle' ? 'Start program' : st.kind === 'won' ? 'Start again' : 'Restart');
      start.type = 'button';
      start.addEventListener('click', function () {
        startProgram(p);
      });
      actions.appendChild(start);

      if (managePrograms) {
        actions.appendChild(deleteButton('Delete ' + p.title, function () {
          state.programs = state.programs.filter(function (item) { return item.id !== p.id; });
          save();
          renderAll();
          toast('Program removed — habits kept');
        }));
      }
      card.appendChild(actions);

      els.programList.appendChild(card);
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

  function updateFocusCard() {
    els.focusSub.textContent = state.focus.minutes +
      ' minutes of unbroken work · then a clean break.';
    els.focusSessions.textContent = sessionsLabel();
    els.focusFootSessions.textContent = sessionsLabel();
    els.focusMinutesLabel.textContent = state.focus.minutes + ' min';
  }

  function focusGoalText() {
    if (selectedKey === todayKey) {
      for (var i = 0; i < state.tasks.length; i++) {
        if (!isDone(state.tasks[i].id, todayKey)) return state.tasks[i].title;
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
    els.focusMinutesLabel.textContent = state.focus.minutes + ' min';
  }

  function openFocus() {
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
    focus.total = state.focus.minutes * 60;
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
    toast('Session complete — ' + state.focus.minutes + ' minutes banked');
    updateFocus();
    els.focusState.textContent = 'Session complete';
    els.focusState.className = 'focus-state is-done';
  }

  function cycleFocusLength() {
    var index = FOCUS_LENGTHS.indexOf(state.focus.minutes);
    var next = FOCUS_LENGTHS[(index + 1) % FOCUS_LENGTHS.length];
    state.focus.minutes = next;
    save();
    focus.total = next * 60;
    focus.left = focus.total;
    focus.running = false;
    window.clearInterval(focus.timer);
    focus.timer = 0;
    focus.endAt = 0;
    updateFocus();
    updateFocusCard();
    toast(next + ' minute session ready');
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

  function removeTask(id) {
    state.tasks = state.tasks.filter(function (t) { return t.id !== id; });
    Object.keys(state.history).forEach(function (key) {
      var list = state.history[key].filter(function (taskId) { return taskId !== id; });
      if (list.length) state.history[key] = list;
      else delete state.history[key];
    });
    save();
    renderAll();
    toast('Task deleted');
  }

  function deleteFromSheet() {
    if (!editingId) return;
    var id = editingId;
    closeSheet();
    removeTask(id);
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

  function toast(message) {
    if (toastTimer) {
      window.clearTimeout(toastTimer);
      toastTimer = 0;
    }
    els.toast.textContent = message;
    els.toast.hidden = false;
    toastTimer = window.setTimeout(function () {
      els.toast.hidden = true;
      toastTimer = 0;
    }, 2200);
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
  els.focusChange.addEventListener('click', cycleFocusLength);

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    if (!els.sheet.hidden) closeSheet();
    else if (focus.open) exitFocus();
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) return;
    rollover();
    if (focus.open) updateFocus();
  });

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

  renderAll();
  updateFocus();
  save();
})();
