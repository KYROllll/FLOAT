/* ==========================================================================
   ARENA // DAILY OS
   Daily discipline & streak tracker. Vanilla JS, no dependencies.
   Tasks, daily completions and streaks live in localStorage.
   ========================================================================== */
(function () {
  'use strict';

  var STORAGE_KEY = 'arena.daily.v1';
  var MAX_TITLE = 80;
  var MAX_WHY = 120;
  var MAX_STREAK = 3650;

  var CHECK_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M5.5 12.8 9.8 17.1 18.5 7.6"/></svg>';

  var X_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" aria-hidden="true">' +
    '<path d="M6 6l12 12M18 6 6 18"/></svg>';

  var els = {
    topMeta: document.getElementById('topMeta'),
    perfectPill: document.getElementById('perfectPill'),
    perfectCount: document.getElementById('perfectCount'),
    weekStrip: document.getElementById('weekStrip'),
    progressDate: document.getElementById('progressDate'),
    progressDone: document.getElementById('progressDone'),
    progressTotal: document.getElementById('progressTotal'),
    progressPct: document.getElementById('progressPct'),
    progressPctNum: document.getElementById('progressPctNum'),
    scale: document.getElementById('scale'),
    scaleMarker: document.getElementById('scaleMarker'),
    planList: document.getElementById('planList'),
    planEmpty: document.getElementById('planEmpty'),
    planCount: document.getElementById('planCount'),
    nnList: document.getElementById('nnList'),
    nnEmpty: document.getElementById('nnEmpty'),
    nnCount: document.getElementById('nnCount'),
    addBtn: document.getElementById('addBtn'),
    addHabitBtn: document.getElementById('addHabitBtn'),
    editBtn: document.getElementById('editBtn'),
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
    toast: document.getElementById('toast')
  };

  var state = loadState();
  var todayKey = keyOf(new Date());
  var selectedKey = todayKey;
  var editMode = false;
  var editingId = null;
  var newRecurring = false;
  var toastTimer = 0;
  var audioCtx = null;

  /* ------------------------------- helpers ------------------------------- */

  function uid() {
    return 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function startOfDay(date) {
    var d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
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

  function trimText(value, max) {
    return String(value == null ? '' : value).replace(/\s+/g, ' ').trim().slice(0, max);
  }

  function normalizeTime(value) {
    var t = String(value == null ? '' : value).trim();
    return /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(t) ? t : '';
  }

  /* -------------------------------- state -------------------------------- */

  function seedState() {
    var now = Date.now();
    function task(title, why, time, recurring) {
      return {
        id: uid(),
        title: title,
        why: why,
        time: time,
        recurring: recurring,
        createdAt: now
      };
    }
    return {
      v: 1,
      tasks: [
        task('אימון בוקר', 'בונה משמעת וסיבולת — מתחיל את היום חזק', '06:30', false),
        task('Deep work — 90 minutes', 'Sharpens focus and compounds skill', '09:00', false),
        task('Read 20 pages', 'Feeds the mind and quiets the noise', '21:30', false),
        task('10,000 צעדים', 'תנועה היא שכבת הבסיס של האנרגיה', '', true),
        task('2L מים', 'Keeps energy steady from morning to night', '', true),
        task('No screens after 23:00', 'Protects sleep — tomorrow starts tonight', '23:00', true)
      ],
      history: {}
    };
  }

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

  function loadState() {
    var raw = null;
    try {
      raw = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
    } catch (err) {
      raw = null;
    }

    if (!raw || typeof raw !== 'object' || !Array.isArray(raw.tasks)) {
      return seedState();
    }

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

    return { v: 1, tasks: tasks, history: history };
  }

  function save() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      /* Private mode or full storage: the session still works. */
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

  /* Consecutive days this task was completed, ending today (or yesterday
     when today is still open). */
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
      if (navigator.vibrate) {
        try { navigator.vibrate(8); } catch (err) { /* ignore */ }
      }
    }
  }

  /* -------------------------------- render ------------------------------- */

  function progressColor(pct) {
    if (pct >= 67) return '#34d399';
    if (pct >= 34) return '#fbbf24';
    return '#f87171';
  }

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
      if (completionsFor(key).length) btn.classList.add('has-done');
      else btn.classList.add('no-dot');
      if (key > todayKey) btn.disabled = true;

      var day = document.createElement('span');
      day.className = 'wk-day';
      day.textContent = d.toLocaleDateString(undefined, { weekday: 'short' }).replace(/\.$/, '');

      var date = document.createElement('span');
      date.className = 'wk-date';
      date.textContent = String(d.getDate());

      var dot = document.createElement('span');
      dot.className = 'wk-dot';
      dot.setAttribute('aria-hidden', 'true');

      btn.setAttribute('aria-label', d.toLocaleDateString(undefined, {
        weekday: 'long', month: 'short', day: 'numeric'
      }));
      btn.setAttribute('aria-pressed', key === selectedKey ? 'true' : 'false');
      btn.title = d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });

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
    var color = progressColor(pct);

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
      openSheet(task);
    });

    var top = document.createElement('span');
    top.className = 'task-top';

    if (task.time) {
      var time = document.createElement('span');
      time.className = 'task-time';
      time.textContent = task.time;
      top.appendChild(time);
    }

    var title = document.createElement('span');
    title.className = 'task-title';
    title.dir = 'auto';
    title.textContent = task.title;
    top.appendChild(title);
    body.appendChild(top);

    if (task.why) {
      var why = document.createElement('span');
      why.className = 'task-why';
      why.dir = 'auto';
      why.textContent = task.why;
      body.appendChild(why);
    }

    var side = document.createElement('div');
    side.className = 'task-side';

    var streak = streakFor(task.id, selectedKey);
    if (streak > 0) {
      var badge = document.createElement('span');
      badge.className = 'streak' + (streak >= 3 ? ' is-hot' : '');
      badge.setAttribute('title', streak + ' day streak');
      badge.textContent = '🔥 ' + streak;
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

    function count(items, noun) {
      var done = items.filter(function (t) { return isDone(t.id, selectedKey); }).length;
      return items.length + ' ' + noun + (items.length === 1 ? '' : 's') +
        (items.length ? ' · ' + done + ' done' : '');
    }

    els.planCount.textContent = count(plan, 'task');
    els.nnCount.textContent = count(habits, 'habit');
  }

  function renderAll(flash) {
    todayKey = keyOf(new Date());
    if (selectedKey > todayKey) selectedKey = todayKey;

    renderWeek();
    renderProgress();
    renderLists(flash);
    document.body.classList.toggle('editing', editMode);
    els.editBtn.classList.toggle('is-on', editMode);
    els.editBtn.setAttribute('aria-pressed', editMode ? 'true' : 'false');
  }

  /* -------------------------------- tasks -------------------------------- */

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

  /* --------------------------------- sheet ------------------------------- */

  function openSheet(task, recurringPreset) {
    editingId = task ? task.id : null;
    newRecurring = !!recurringPreset;

    els.sheetTitle.textContent = task ? 'Edit task' : (newRecurring ? 'New non-negotiable' : 'New task');
    els.fieldTitle.value = task ? task.title : '';
    els.fieldWhy.value = task ? task.why : '';
    els.fieldTime.value = task ? task.time : '';
    els.fieldRecurring.checked = task ? !!task.recurring : newRecurring;
    els.sheetDelete.hidden = !task;
    els.formError.hidden = true;

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
  }

  function saveSheet(event) {
    event.preventDefault();
    var wasEditing = !!editingId;

    var title = trimText(els.fieldTitle.value, MAX_TITLE);
    if (!title) {
      els.formError.hidden = false;
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
    }, 1900);
  }

  /* -------------------------------- events ------------------------------- */

  els.addBtn.addEventListener('click', function () {
    openSheet(null, false);
  });

  els.addHabitBtn.addEventListener('click', function () {
    openSheet(null, true);
  });

  els.editBtn.addEventListener('click', function () {
    editMode = !editMode;
    renderAll();
    if (editMode) {
      toast('Tap × to delete, or a task to edit');
    }
  });

  els.taskForm.addEventListener('submit', saveSheet);
  els.sheetDelete.addEventListener('click', deleteFromSheet);
  els.sheetClose.addEventListener('click', closeSheet);
  els.sheetCancel.addEventListener('click', closeSheet);
  els.sheetVeil.addEventListener('click', closeSheet);

  els.fieldTitle.addEventListener('input', function () {
    if (!els.fieldTitle.value.trim()) return;
    els.formError.hidden = true;
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && !els.sheet.hidden) closeSheet();
  });

  /* --------------------------------- boot -------------------------------- */

  function rollover() {
    var key = keyOf(new Date());
    if (key === todayKey) return;
    var followingToday = selectedKey === todayKey;
    todayKey = key;
    if (followingToday) selectedKey = key;
    renderAll();
  }

  window.setInterval(rollover, 60000);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) rollover();
  });

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
  save();
})();
