/* ==========================================================================
   FLOAT — floating missions, gently adrift.
   Vanilla JS, no dependencies. State lives in localStorage.
   ========================================================================== */
(function () {
  'use strict';

  var STORAGE_KEY = 'float.canvas.v1';
  var SAVE_DELAY = 1200;
  var COMPLETE_MS = 940;
  var PULSE_MS = 2600;
  var PAD = 20;             // breathing room between a card and the screen edge
  var GAP = 14;             // minimum clear space between two cards
  var MAX_MISSIONS = 80;
  var MAX_TEXT = 120;
  var FOCUS_EXIT_MS = 240;
  var SLIDE_RESET = 0.9;    // release past this and the mission lets go

  var SVG_NS = 'http://www.w3.org/2000/svg';

  var canvas = document.getElementById('canvas');
  var missionsEl = document.getElementById('missions');
  var linksEl = document.getElementById('links');
  var emptyEl = document.getElementById('emptyState');
  var countEl = document.getElementById('count');
  var hintEl = document.getElementById('linkHint');
  var composer = document.getElementById('composer');
  var composerForm = document.getElementById('composerForm');
  var input = document.getElementById('missionInput');
  var addBtn = document.getElementById('addBtn');
  var linkBtn = document.getElementById('linkBtn');

  var focusEl = document.getElementById('focus');
  var focusVeil = document.getElementById('focusVeil');
  var focusSheet = document.getElementById('focusSheet');
  var focusClose = document.getElementById('focusClose');
  var focusText = document.getElementById('focusText');
  var focusAge = document.getElementById('focusAge');

  var slide = document.getElementById('slide');
  var slideHandle = document.getElementById('slideHandle');
  var slideLabel = document.getElementById('slideLabel');

  var viewStats = document.getElementById('viewStats');
  var viewCalories = document.getElementById('viewCalories');
  var statToday = document.getElementById('statToday');
  var statWeek = document.getElementById('statWeek');
  var statActive = document.getElementById('statActive');
  var statAll = document.getElementById('statAll');
  var statChart = document.getElementById('statChart');

  var kcalToday = document.getElementById('kcalToday');
  var kcalBar = document.getElementById('kcalBar');
  var kcalBarFill = document.getElementById('kcalBarFill');
  var kcalTargetInput = document.getElementById('kcalTarget');
  var kcalForm = document.getElementById('kcalForm');
  var kcalValue = document.getElementById('kcalValue');
  var kcalNote = document.getElementById('kcalNote');
  var kcalList = document.getElementById('kcalList');
  var kcalClear = document.getElementById('kcalClear');

  var tabs = [
    document.getElementById('tabCanvas'),
    document.getElementById('tabStats'),
    document.getElementById('tabCalories')
  ];

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  var HINT_IDLE = 'tap two missions to link \u00b7 tap a line to unlink';
  var HINT_SELECTED = 'now tap another mission';

  var missions = [];
  var links = [];           // { a: sourceId, b: targetId }
  var linkViews = {};       // "a|b" -> { a, b, link, path, hit, arrow, pulse, ... }
  var pendingId = null;     // first mission chosen in link mode
  var linkMode = false;
  var focusMission = null;
  var focusTimer = 0;
  var focusHideTimer = 0;
  var W = 0;
  var H = 0;
  var rafId = 0;
  var slowTimer = 0;
  var lastFrame = 0;
  var saveTimer = 0;
  var dirty = false;

  var currentView = '';     // 'canvas' | 'stats' | 'calories'
  var doneLog = [];         // completion timestamps
  var meals = [];           // { id, ts, kcal, note }
  var kcalTarget = 0;
  var clearArmed = 0;

  var slideState = {
    active: false,
    id: null,
    p: 0,
    startX: 0,
    startP: 0,
    max: 1,
    done: false
  };

  /* ------------------------------- helpers ------------------------------- */

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function makeId() {
    return 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function clamp(n, lo, hi) {
    return n < lo ? lo : n > hi ? hi : n;
  }

  function round(n, digits) {
    var f = Math.pow(10, digits);
    return Math.round(n * f) / f;
  }

  function linkKey(a, b) {
    return a < b ? a + '|' + b : b + '|' + a;
  }

  function hashString(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 997;
    return h;
  }

  /* Stable direction for cards that land exactly on top of each other. */
  function stableSign(a, b) {
    return hashString(linkKey(a, b)) % 2 ? 1 : -1;
  }

  function getMission(id) {
    for (var i = 0; i < missions.length; i++) {
      if (missions[i].id === id) return missions[i];
    }
    return null;
  }

  function isLive(m) {
    return m && !m.completing;
  }

  function formatAge(ms) {
    var s = Math.floor((ms || 0) / 1000);
    if (s < 45) return 'a moment';
    var m = Math.floor(s / 60);
    if (m < 60) return m + 'm';
    var h = Math.floor(m / 60);
    if (h < 24) return h + 'h ' + (m % 60) + 'm';
    var d = Math.floor(h / 24);
    return d + 'd ' + (h % 24) + 'h';
  }

  /* -------------------------------- state -------------------------------- */

  function serialize() {
    var live = missions.filter(function (m) {
      return !m.completing;
    });
    var ids = {};
    live.forEach(function (m) {
      ids[m.id] = true;
    });

    return {
      v: 3,
      missions: live.map(function (m) {
        return {
          id: m.id,
          text: m.text,
          nx: round(m.nx, 4),
          ny: round(m.ny, 4),
          vx: round(m.vx, 5),
          vy: round(m.vy, 5),
          phase: round(m.phase, 3),
          createdAt: m.createdAt
        };
      }),
      links: links
        .filter(function (l) {
          return ids[l.a] && ids[l.b];
        })
        .map(function (l) {
          return [l.a, l.b];
        }),
      done: doneLog.slice(-3000),
      meals: meals.slice(-400),
      kcalTarget: kcalTarget || 0
    };
  }

  function save() {
    dirty = false;
    if (saveTimer) {
      window.clearTimeout(saveTimer);
      saveTimer = 0;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serialize()));
    } catch (err) {
      /* Storage full or unavailable: the canvas still works this session. */
    }
  }

  /* Throttled write so drifting positions don't hammer storage. */
  function touchSave() {
    dirty = true;
    if (saveTimer) return;
    saveTimer = window.setTimeout(function () {
      saveTimer = 0;
      if (dirty) save();
    }, SAVE_DELAY);
  }

  /* -------------------------------- layout ------------------------------- */

  function measureCanvas() {
    W = canvas.clientWidth || window.innerWidth || 1;
    H = canvas.clientHeight || window.innerHeight || 1;
  }

  function bounds(m) {
    return {
      x: (m.w / 2 + PAD) / W,
      y: (m.h / 2 + PAD) / H
    };
  }

  function keepInside(m) {
    var b = bounds(m);
    if (b.x > 0.5) b.x = 0.5;
    if (b.y > 0.5) b.y = 0.5;
    m.nx = clamp(m.nx, b.x, 1 - b.x);
    m.ny = clamp(m.ny, b.y, 1 - b.y);
  }

  /* How free is a candidate spot? >= 1 means nothing overlaps. */
  function clearance(nx, ny, m, live) {
    var min = Infinity;
    for (var i = 0; i < live.length; i++) {
      var o = live[i];
      var needX = (m.w + o.w) / 2 + GAP;
      var needY = (m.h + o.h) / 2 + GAP;
      var rx = Math.abs((nx - o.nx) * W) / needX;
      var ry = Math.abs((ny - o.ny) * H) / needY;
      var s = rx > ry ? rx : ry;
      if (s < min) min = s;
    }
    return min === Infinity ? 99 : min;
  }

  /* Pick a spot that keeps real clear air (both card sizes) around the card. */
  function findSpot(m) {
    var b = bounds(m);
    var loX = Math.max(b.x, 0.04);
    var hiX = Math.min(1 - b.x, 0.96);
    var loY = Math.max(b.y, 0.06);
    var hiY = Math.min(1 - b.y, 0.94);
    if (hiX <= loX) loX = hiX = 0.5;
    if (hiY <= loY) loY = hiY = 0.5;

    var live = missions.filter(isLive);
    var best = { nx: (loX + hiX) / 2, ny: (loY + hiY) / 2 };
    var bestScore = -1;

    for (var attempt = 0; attempt < 52; attempt++) {
      var nx = rand(loX, hiX);
      var ny = rand(loY, hiY);
      var score = clearance(nx, ny, m, live);
      if (score > bestScore) {
        bestScore = score;
        best = { nx: nx, ny: ny };
      }
      if (score > 1.35) break;
    }

    return best;
  }

  /* Cards are axis-aligned boxes, so keep the boxes apart on whichever axis
     needs the smaller nudge, then steer the drift away from the collision. */
  function settleOverlaps() {
    var live = missions.filter(isLive);
    if (live.length < 2) return false;

    var moved = false;

    for (var pass = 0; pass < 3; pass++) {
      var adjusted = false;

      for (var i = 0; i < live.length; i++) {
        var a = live[i];
        for (var j = i + 1; j < live.length; j++) {
          var b = live[j];
          var dxp = (b.nx - a.nx) * W;
          var dyp = (b.ny - a.ny) * H;
          var needX = (a.w + b.w) / 2 + GAP;
          var needY = (a.h + b.h) / 2 + GAP;
          var overX = needX - Math.abs(dxp);
          var overY = needY - Math.abs(dyp);

          if (overX <= 0 || overY <= 0) continue;

          if (overX <= overY) {
            var usx = dxp === 0 ? stableSign(a.id, b.id) : dxp > 0 ? 1 : -1;
            var shiftX = overX / 2 / W;
            a.nx -= usx * shiftX;
            b.nx += usx * shiftX;
            /* Flip only the component moving them together, so speed holds. */
            if (a.vx * usx > 0) a.vx = -a.vx * 0.9;
            if (b.vx * usx < 0) b.vx = -b.vx * 0.9;
          } else {
            var usy = dyp === 0 ? stableSign(b.id, a.id) : dyp > 0 ? 1 : -1;
            var shiftY = overY / 2 / H;
            a.ny -= usy * shiftY;
            b.ny += usy * shiftY;
            if (a.vy * usy > 0) a.vy = -a.vy * 0.9;
            if (b.vy * usy < 0) b.vy = -b.vy * 0.9;
          }

          adjusted = true;
          moved = true;
        }
      }

      if (!adjusted) break;
      for (var k = 0; k < live.length; k++) keepInside(live[k]);
    }

    return moved;
  }

  /* --------------------------------- days -------------------------------- */

  function startOfDay(ts) {
    var d = new Date(ts);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }

  var DAY_MS = 86400000;

  /* Calendar days back from today. Both ends are local midnight, so the
     rounding absorbs daylight-saving hours. */
  function dayOffset(ts) {
    return Math.round((startOfDay(Date.now()) - startOfDay(ts)) / DAY_MS);
  }

  /* -------------------------------- render ------------------------------- */

  function paintLinks() {
    if (!W || !H) return;
    var now = window.performance.now();

    for (var key in linkViews) {
      if (!Object.prototype.hasOwnProperty.call(linkViews, key)) continue;
      var view = linkViews[key];
      var a = getMission(view.a);
      var b = getMission(view.b);
      if (!a || !b || a.completing || b.completing) continue;

      var ax = a.nx * W;
      var ay = a.ny * H;
      var bx = b.nx * W;
      var by = b.ny * H;
      var dx = bx - ax;
      var dy = by - ay;
      var dist = Math.sqrt(dx * dx + dy * dy) || 1;
      var ux = dx / dist;
      var uy = dy / dist;

      /* Bend perpendicular to the link. Near-vertical pairs therefore bulge
         sideways instead of stacking on top of each other, and the fan
         offset spreads links that share a mission apart. */
      var base = clamp(dist * 0.12, 18, 52);
      var mag = base + view.fan;
      if (Math.abs(mag) < 8) mag = mag < 0 ? -8 : 8;
      if (Math.abs(mag) > 120) mag = mag < 0 ? -120 : 120;
      var bend = view.side * mag;

      var cx = (ax + bx) / 2 - uy * bend;
      var cy = (ay + by) / 2 + ux * bend;

      var d =
        'M' + ax.toFixed(1) + ' ' + ay.toFixed(1) +
        'Q' + cx.toFixed(1) + ' ' + cy.toFixed(1) +
        ' ' + bx.toFixed(1) + ' ' + by.toFixed(1);

      view.path.setAttribute('d', d);
      view.hit.setAttribute('d', d);

      /* A small chevron near the target reads the direction source -> target. */
      var tt = 0.72;
      var ut = 1 - tt;
      var mx = ut * ut * ax + 2 * ut * tt * cx + tt * tt * bx;
      var my = ut * ut * ay + 2 * ut * tt * cy + tt * tt * by;
      var tx = 2 * ut * (cx - ax) + 2 * tt * (bx - cx);
      var ty = 2 * ut * (cy - ay) + 2 * tt * (by - cy);
      var ang = Math.atan2(ty, tx) * 180 / Math.PI;
      view.arrow.setAttribute(
        'transform',
        'translate(' + mx.toFixed(1) + ',' + my.toFixed(1) + ') rotate(' + ang.toFixed(1) + ')'
      );

      /* A white pulse travels source -> target, never stopping. */
      var t = ((now / PULSE_MS) + view.offset) % 1;
      var u = 1 - t;
      var px = u * u * ax + 2 * u * t * cx + t * t * bx;
      var py = u * u * ay + 2 * u * t * cy + t * t * by;
      var fade = Math.min(1, Math.min(t, 1 - t) * 7);
      view.pulse.setAttribute('cx', px.toFixed(1));
      view.pulse.setAttribute('cy', py.toFixed(1));
      view.pulse.setAttribute('opacity', fade.toFixed(2));
    }
  }

  function paint() {
    if (!W || !H) return;

    for (var i = 0; i < missions.length; i++) {
      var m = missions[i];
      if (!m.el) continue;
      var bob = Math.sin(m.life * 1.05 + m.phase) * 2.6;
      var x = m.nx * W - m.w / 2;
      var y = m.ny * H - m.h / 2;
      m.el.style.transform =
        'translate3d(' + x.toFixed(2) + 'px,' + (y + bob).toFixed(2) + 'px,0)';
    }

    paintLinks();
  }

  function renderLinks() {
    linksEl.textContent = '';
    linkViews = {};

    /* Node degree decides how far a link is fanned away from its neighbours. */
    var degree = {};

    links.forEach(function (link) {
      var key = linkKey(link.a, link.b);
      if (linkViews[key]) return;

      var da = degree[link.a] || 0;
      var db = degree[link.b] || 0;
      degree[link.a] = da + 1;
      degree[link.b] = db + 1;

      var k = da + db;
      var side = hashString(key) % 2 ? 1 : -1;
      var fan = Math.ceil(k / 2) * 16 * (k % 2 ? -1 : 1);

      var hit = document.createElementNS(SVG_NS, 'path');
      hit.setAttribute('class', 'link-hit');
      hit.addEventListener('click', function (event) {
        event.stopPropagation();
        if (!linkMode) return;
        removeLink(link.a, link.b);
      });

      var path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('class', 'link-line');

      var arrow = document.createElementNS(SVG_NS, 'path');
      arrow.setAttribute('class', 'link-arrow');
      arrow.setAttribute('d', 'M-4.2 -3.4 L4.2 0 L-4.2 3.4 Z');

      var pulse = document.createElementNS(SVG_NS, 'circle');
      pulse.setAttribute('class', 'link-pulse');
      pulse.setAttribute('r', '2.3');
      pulse.setAttribute('opacity', '0');

      linksEl.appendChild(hit);
      linksEl.appendChild(path);
      linksEl.appendChild(arrow);
      linksEl.appendChild(pulse);

      var offset = hashString(key) / 997;

      linkViews[key] = {
        a: link.a,
        b: link.b,
        path: path,
        hit: hit,
        arrow: arrow,
        pulse: pulse,
        offset: offset,
        side: side,
        fan: fan
      };
    });

    paintLinks();
  }

  function updateMeta() {
    var n = missions.filter(isLive).length;
    countEl.textContent = n === 0 ? '' : n + ' floating';
    emptyEl.hidden = n > 0 || !focusEl.hidden;
  }

  /* ------------------------------ missions ------------------------------- */

  function buildMission(data) {
    var text = String(data.text == null ? '' : data.text).trim().slice(0, MAX_TEXT);
    if (!text) return null;

    var hasSpot =
      typeof data.nx === 'number' && isFinite(data.nx) &&
      typeof data.ny === 'number' && isFinite(data.ny);

    var speed = rand(0.0045, 0.0085);
    var angle = rand(0, Math.PI * 2);

    var m = {
      id: data.id || makeId(),
      text: text,
      nx: 0.5,
      ny: 0.5,
      vx: clamp(Number(data.vx) || Math.cos(angle) * speed, -0.02, 0.02),
      vy: clamp(Number(data.vy) || Math.sin(angle) * speed * 0.85, -0.02, 0.02),
      phase: Number(data.phase) || rand(0, Math.PI * 2),
      createdAt: Number(data.createdAt) || Date.now(),
      life: rand(0, 12),
      paused: false,
      completing: false,
      w: 120,
      h: 44,
      el: null
    };

    var el = document.createElement('div');
    el.className = 'mission';
    el.dataset.id = m.id;

    var card = document.createElement('button');
    card.type = 'button';
    card.className = 'card';
    card.dir = 'auto';
    card.textContent = m.text;

    card.addEventListener('click', function (event) {
      event.stopPropagation();
      activate(m);
    });

    card.addEventListener('pointerdown', function () {
      holdSteady(m, 1500);
    });

    el.addEventListener('pointerenter', function (event) {
      if (event.pointerType !== 'touch') m.paused = true;
    });

    el.addEventListener('pointerleave', function (event) {
      if (event.pointerType !== 'touch' && pendingId !== m.id) m.paused = false;
    });

    card.addEventListener('focus', function () {
      m.paused = true;
    });

    card.addEventListener('blur', function () {
      if (pendingId !== m.id) m.paused = false;
    });

    var done = document.createElement('span');
    done.className = 'done';
    done.setAttribute('aria-hidden', 'true');
    done.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M5.2 12.6 10 17.3l8.8-10" />' +
      '</svg>';

    el.appendChild(card);
    el.appendChild(done);
    missionsEl.appendChild(el);

    m.el = el;
    m.w = card.offsetWidth || 120;
    m.h = card.offsetHeight || 44;

    var spot = hasSpot
      ? { nx: clamp(data.nx, 0, 1), ny: clamp(data.ny, 0, 1) }
      : findSpot(m);

    m.nx = spot.nx;
    m.ny = spot.ny;
    keepInside(m);

    missions.push(m);
    return m;
  }

  function holdSteady(m, ms) {
    m.paused = true;
    if (m.steadyTimer) window.clearTimeout(m.steadyTimer);
    m.steadyTimer = window.setTimeout(function () {
      m.steadyTimer = 0;
      if (pendingId !== m.id && focusMission !== m) m.paused = false;
    }, ms);
  }

  function addMission(text) {
    var m = buildMission({ text: text });
    if (!m) return null;
    settleOverlaps();
    updateMeta();
    paint();
    save();
    return m;
  }

  /* Tap in link mode: first selects, second connects. */
  function chooseForLink(m) {
    if (pendingId === m.id) {
      clearPending();
      return;
    }

    if (pendingId) {
      var first = getMission(pendingId);
      clearPending();
      if (first && isLive(first)) toggleLink(first.id, m.id);
      return;
    }

    pendingId = m.id;
    m.paused = true;
    m.el.classList.add('is-target');
    hintEl.textContent = HINT_SELECTED;
  }

  function clearPending() {
    if (pendingId) {
      var m = getMission(pendingId);
      if (m) {
        m.el.classList.remove('is-target');
        if (!m.completing) m.paused = false;
      }
    }
    pendingId = null;
    hintEl.textContent = HINT_IDLE;
  }

  function activate(m) {
    if (!composer.hidden) closeComposer(false);
    if (linkMode) chooseForLink(m);
    else openFocus(m);
  }

  /* -------------------------------- links -------------------------------- */

  function toggleLink(a, b) {
    if (a === b) return;
    var key = linkKey(a, b);
    var existing = links.some(function (l) {
      return linkKey(l.a, l.b) === key;
    });

    if (existing) {
      links = links.filter(function (l) {
        return linkKey(l.a, l.b) !== key;
      });
    } else {
      /* Direction runs from the first mission tapped to the second. */
      links.push({ a: a, b: b });
    }

    renderLinks();
    save();
  }

  function removeLink(a, b) {
    var key = linkKey(a, b);
    links = links.filter(function (l) {
      return linkKey(l.a, l.b) !== key;
    });
    renderLinks();
    save();
  }

  function setLinkMode(on) {
    linkMode = on;
    document.body.classList.toggle('link-mode', on);
    linkBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    if (!on) clearPending();
    hintEl.textContent = HINT_IDLE;
  }

  /* -------------------------------- focus -------------------------------- */

  function slideMax() {
    var w = slide.clientWidth || 0;
    var size = slideHandle.offsetWidth || 48;
    var max = w - size - 10;
    return max > 4 ? max : 1;
  }

  function setSlide(p) {
    p = clamp(p, 0, 1);
    slideState.p = p;
    var max = slideState.max || slideMax();
    slideHandle.style.transform = 'translate3d(' + (p * max).toFixed(2) + 'px,0,0)';
    slide.style.setProperty('--p', p.toFixed(3));
    slide.setAttribute('aria-valuenow', String(Math.round(p * 100)));
    slide.classList.toggle('is-unlocked', p > 0.06);
  }

  function resetSlide() {
    slideState.active = false;
    slideState.done = false;
    slideState.id = null;
    slideState.p = 0;
    slideState.startP = 0;
    slide.classList.remove('is-grabbing', 'is-done');
    slideLabel.textContent = 'slide to complete';
    slideHandle.style.transform = 'translate3d(0,0,0)';
    slide.style.setProperty('--p', '0');
    slide.setAttribute('aria-valuenow', '0');
    slide.classList.remove('is-unlocked');
    slideState.max = slideMax();
  }

  function updateFocusAge() {
    var m = focusMission;
    if (!m) return;
    focusAge.textContent = 'floating for ' + formatAge(Date.now() - (m.createdAt || Date.now()));
  }

  function openFocus(m) {
    if (!m || m.completing || focusMission) return;
    if (pendingId) clearPending();

    focusMission = m;
    m.paused = true;
    m.el.classList.add('is-resting');

    focusText.textContent = m.text;
    resetSlide();
    updateFocusAge();

    if (focusHideTimer) {
      window.clearTimeout(focusHideTimer);
      focusHideTimer = 0;
    }

    focusEl.hidden = false;
    document.body.classList.add('focus-open');
    emptyEl.hidden = true;

    var rect = m.el.getBoundingClientRect();
    var ox = clamp(((rect.left + rect.width / 2) / (window.innerWidth || 1)) * 100, 0, 100);
    var oy = clamp(((rect.top + rect.height / 2) / (window.innerHeight || 1)) * 100, 0, 100);
    focusSheet.style.transformOrigin = ox.toFixed(1) + '% ' + oy.toFixed(1) + '%';

    focusEl.classList.remove('is-open');
    window.requestAnimationFrame(function () {
      if (!focusEl.hidden) {
        focusEl.classList.add('is-open');
        slideState.max = slideMax();
      }
    });

    if (focusTimer) window.clearInterval(focusTimer);
    focusTimer = window.setInterval(updateFocusAge, 15000);

    focusClose.focus({ preventScroll: true });
  }

  function closeFocus(opts) {
    if (!focusMission) return;
    var m = focusMission;

    focusMission = null;
    if (focusTimer) {
      window.clearInterval(focusTimer);
      focusTimer = 0;
    }

    focusEl.classList.remove('is-open');
    document.body.classList.remove('focus-open');
    m.el.classList.remove('is-resting');
    if (!m.completing) m.paused = false;

    resetSlide();
    updateMeta();

    var delay = opts && opts.immediate ? 0 : FOCUS_EXIT_MS;
    if (focusHideTimer) window.clearTimeout(focusHideTimer);
    focusHideTimer = window.setTimeout(function () {
      focusHideTimer = 0;
      /* A different mission may already have taken the stage. */
      if (!focusMission) focusEl.hidden = true;
    }, delay);
  }

  function finishSlide() {
    if (slideState.done || !focusMission) return;
    var m = focusMission;

    slideState.done = true;
    slideState.active = false;
    slide.classList.remove('is-grabbing');
    slide.classList.add('is-done');
    setSlide(1);
    slideLabel.textContent = 'letting go';

    window.setTimeout(function () {
      if (focusMission === m) closeFocus({ immediate: true });
      complete(m);
    }, 260);
  }

  /* ------------------------ slide-to-complete input ----------------------- */

  slideHandle.addEventListener('pointerdown', function (event) {
    if (!focusMission || slideState.done) return;
    if (event.button !== undefined && event.button > 0) return;

    slideState.active = true;
    slideState.id = event.pointerId;
    slideState.startX = event.clientX;
    slideState.startP = slideState.p;
    slideState.max = slideMax();

    slide.classList.add('is-grabbing');
    try {
      slide.focus({ preventScroll: true });
    } catch (err) {
      /* Older Safari: focus options are optional. */
    }
    try {
      slideHandle.setPointerCapture(event.pointerId);
    } catch (err) {
      /* Older Safari: move/up still arrive on the handle. */
    }
    event.preventDefault();
  });

  slideHandle.addEventListener('pointermove', function (event) {
    if (!slideState.active || event.pointerId !== slideState.id) return;
    var dx = event.clientX - slideState.startX;
    var p = (slideState.startP * slideState.max + dx) / (slideState.max || 1);
    setSlide(p);
    if (p >= 0.995) finishSlide();
  });

  function endSlide(event) {
    if (!slideState.active) return;
    if (event && event.pointerId !== undefined && event.pointerId !== slideState.id) return;

    slideState.active = false;
    slide.classList.remove('is-grabbing');

    if (slideState.p >= SLIDE_RESET) finishSlide();
    else setSlide(0);
  }

  slideHandle.addEventListener('pointerup', endSlide);
  slideHandle.addEventListener('pointercancel', endSlide);
  slideHandle.addEventListener('lostpointercapture', endSlide);

  slide.addEventListener('keydown', function (event) {
    if (!focusMission || slideState.done) return;

    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault();
      slide.classList.remove('is-grabbing');
      setSlide(slideState.p + 0.12);
      if (slideState.p >= 0.995) finishSlide();
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault();
      slide.classList.remove('is-grabbing');
      setSlide(slideState.p - 0.12);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      slide.classList.remove('is-grabbing');
      if (slideState.p >= SLIDE_RESET) finishSlide();
      else setSlide(slideState.p + 0.25);
    }
  });

  focusClose.addEventListener('click', function () {
    closeFocus();
  });

  focusVeil.addEventListener('click', function () {
    closeFocus();
  });

  /* ------------------------------- complete ------------------------------ */

  /* Park the check beside the card, on whichever side has more room, and
     clamp it into the viewport so it never gets cut off at a screen edge. */
  function placeDone(m) {
    var card = m.el && m.el.querySelector('.card');
    var done = m.el && m.el.querySelector('.done');
    if (!card || !done) return;

    var rect = card.getBoundingClientRect();
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var size = 26;
    var gap = 10;
    var spaceRight = vw - rect.right;
    var spaceLeft = rect.left;
    var offsetX =
      spaceRight >= spaceLeft
        ? rect.right + gap + size / 2 - rect.left
        : -(gap + size / 2);

    var centerX = clamp(
      rect.left + offsetX,
      PAD + size / 2,
      vw - PAD - size / 2
    );
    var centerY = clamp(
      rect.top + rect.height / 2,
      PAD + size / 2,
      vh - PAD - size / 2
    );

    done.style.left = centerX - rect.left + 'px';
    done.style.top = centerY - rect.top + 'px';
  }

  function complete(m) {
    if (m.completing) return;
    m.completing = true;
    m.el.classList.add('is-completing');

    var card = m.el.querySelector('.card');
    if (card) card.disabled = true;
    placeDone(m);

    if (pendingId === m.id) clearPending();

    var hadLinks = links.some(function (l) {
      return l.a === m.id || l.b === m.id;
    });

    links = links.filter(function (l) {
      return l.a !== m.id && l.b !== m.id;
    });
    if (hadLinks) renderLinks();

    doneLog.push(Date.now());
    if (doneLog.length > 3000) doneLog = doneLog.slice(-3000);

    save();

    window.setTimeout(function () {
      if (m.el && m.el.parentNode) m.el.parentNode.removeChild(m.el);
      missions = missions.filter(function (x) {
        return x !== m;
      });
      updateMeta();
      save();
    }, COMPLETE_MS);
  }

  /* -------------------------------- motion ------------------------------- */

  function step(dt) {
    if (focusMission || currentView !== 'canvas') return;

    var moved = false;

    for (var i = 0; i < missions.length; i++) {
      var m = missions[i];
      if (m.completing || m.paused || m.id === pendingId) continue;

      m.life += dt;

      /* A slow turn keeps paths organic instead of pure straight lines. */
      var turn = Math.sin(m.life * 0.42 + m.phase) * 0.55 * dt;
      var cos = Math.cos(turn);
      var sin = Math.sin(turn);
      var vx = m.vx * cos - m.vy * sin;
      var vy = m.vx * sin + m.vy * cos;
      m.vx = vx;
      m.vy = vy;

      m.nx += vx * dt;
      m.ny += vy * dt;

      var b = bounds(m);
      if (b.x > 0.5) b.x = 0.5;
      if (b.y > 0.5) b.y = 0.5;

      if (m.nx < b.x) {
        m.nx = b.x;
        m.vx = Math.abs(m.vx);
      } else if (m.nx > 1 - b.x) {
        m.nx = 1 - b.x;
        m.vx = -Math.abs(m.vx);
      }

      if (m.ny < b.y) {
        m.ny = b.y;
        m.vy = Math.abs(m.vy);
      } else if (m.ny > 1 - b.y) {
        m.ny = 1 - b.y;
        m.vy = -Math.abs(m.vy);
      }

      moved = true;
    }

    if (settleOverlaps()) moved = true;
    if (moved) touchSave();
  }

  function frame(now) {
    var dt = Math.min((now - lastFrame) / 1000, 0.05);
    lastFrame = now;
    step(dt);
    paint();
    rafId = window.requestAnimationFrame(frame);
  }

  function startMotion() {
    if (rafId) window.cancelAnimationFrame(rafId);
    rafId = 0;
    if (slowTimer) {
      window.clearInterval(slowTimer);
      slowTimer = 0;
    }

    /* Other views have nothing to animate; switching back restarts this. */
    if (currentView !== 'canvas' || canvas.hidden) return;

    if (reduceMotion.matches) {
      paint();
      /* Pulses still arrive (and still book energy), just without drift. */
      slowTimer = window.setInterval(function () {
        paintLinks();
      }, 400);
      return;
    }

    lastFrame = window.performance.now();
    rafId = window.requestAnimationFrame(frame);
  }

  /* ------------------------------- composer ------------------------------ */

  function openComposer() {
    if (linkMode) setLinkMode(false);
    composer.hidden = false;
    addBtn.setAttribute('aria-expanded', 'true');
    input.value = '';
    window.setTimeout(function () {
      input.focus();
    }, 20);
  }

  function closeComposer(refocus) {
    if (composer.hidden) return;
    composer.hidden = true;
    addBtn.setAttribute('aria-expanded', 'false');
    input.value = '';
    if (refocus) addBtn.focus();
  }

  function placeMission() {
    var text = input.value.trim();
    if (!text) {
      closeComposer(true);
      return;
    }
    addMission(text);
    input.value = '';
    closeComposer(false);
  }

  /* -------------------------------- views -------------------------------- */

  function setView(name) {
    if (name !== 'stats' && name !== 'calories') name = 'canvas';
    if (name === currentView) return;

    if (linkMode) setLinkMode(false);
    closeComposer(false);
    if (focusMission) closeFocus({ immediate: true });

    currentView = name;
    canvas.hidden = name !== 'canvas';
    viewStats.hidden = name !== 'stats';
    viewCalories.hidden = name !== 'calories';

    document.body.classList.remove('view-canvas', 'view-stats', 'view-calories');
    document.body.classList.add('view-' + name);

    tabs.forEach(function (tab) {
      if (tab.dataset.view === name) tab.setAttribute('aria-current', 'page');
      else tab.removeAttribute('aria-current');
    });

    if (name === 'stats') renderStats();
    if (name === 'calories') openCalories();

    if (name === 'canvas') {
      measureCanvas();
      missions.forEach(keepInside);
      settleOverlaps();
      paint();
    }

    startMotion();
  }

  /* -------------------------------- stats -------------------------------- */

  function renderStats() {
    var counts = [0, 0, 0, 0, 0, 0, 0];

    doneLog.forEach(function (ts) {
      var d = dayOffset(ts);
      if (d >= 0 && d < 7) counts[6 - d] += 1;
    });

    var week = 0;
    var max = 1;
    counts.forEach(function (c) {
      week += c;
      if (c > max) max = c;
    });

    statToday.textContent = String(counts[6]);
    statWeek.textContent = String(week);
    statActive.textContent = String(missions.filter(isLive).length);
    statAll.textContent = String(doneLog.length);

    var today = startOfDay(Date.now());
    statChart.textContent = '';

    counts.forEach(function (c, idx) {
      var col = document.createElement('div');
      col.className = 'bar-col' + (idx === 6 ? ' is-today' : '');
      col.title = c === 1 ? '1 mission' : c + ' missions';

      var bar = document.createElement('span');
      bar.className = 'bar';
      bar.style.height = (c ? Math.max(8, Math.round((c / max) * 100)) : 3) + '%';

      var day = document.createElement('span');
      day.className = 'bar-day';
      day.textContent = new Date(today - (6 - idx) * DAY_MS).toLocaleDateString(undefined, {
        weekday: 'narrow'
      });

      col.appendChild(bar);
      col.appendChild(day);
      statChart.appendChild(col);
    });
  }

  /* ------------------------------- calories ------------------------------ */

  function todayMeals() {
    var today = startOfDay(Date.now());
    return meals.filter(function (m) {
      return startOfDay(m.ts) === today;
    });
  }

  function kcalTotalToday() {
    var total = 0;
    todayMeals().forEach(function (m) {
      total += m.kcal;
    });
    return total;
  }

  function paintKcalBar(total) {
    if (kcalTarget > 0) {
      kcalBar.hidden = false;
      kcalBarFill.style.transform = 'scaleX(' + clamp(total / kcalTarget, 0, 1).toFixed(3) + ')';
    } else {
      kcalBar.hidden = true;
    }
  }

  function disarmClear() {
    clearArmed = 0;
    if (!kcalClear) return;
    kcalClear.textContent = 'clear today';
    kcalClear.classList.remove('is-armed');
  }

  function renderCalories() {
    var list = todayMeals();
    var total = kcalTotalToday();

    kcalToday.textContent = String(total);
    paintKcalBar(total);

    /* Never overwrite the field while it has the caret. */
    if (document.activeElement !== kcalTargetInput) {
      kcalTargetInput.value = kcalTarget > 0 ? String(kcalTarget) : '';
    }

    kcalList.textContent = '';

    list
      .slice()
      .reverse()
      .forEach(function (entry) {
        var li = document.createElement('li');
        li.className = 'kcal-row';

        if (entry.note) {
          var note = document.createElement('span');
          note.className = 'kcal-note';
          note.dir = 'auto';
          note.textContent = entry.note;
          li.appendChild(note);
        }

        var num = document.createElement('span');
        num.className = 'kcal-num';
        num.textContent = String(entry.kcal);
        li.appendChild(num);

        var del = document.createElement('button');
        del.type = 'button';
        del.className = 'kcal-del';
        del.setAttribute('aria-label', 'Remove ' + entry.kcal + ' kcal');
        del.innerHTML =
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" ' +
          'stroke-linecap="round" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>';
        del.addEventListener('click', function () {
          meals = meals.filter(function (x) {
            return x !== entry;
          });
          renderCalories();
          save();
        });
        li.appendChild(del);

        kcalList.appendChild(li);
      });

    kcalClear.hidden = list.length === 0;
    if (!list.length) disarmClear();
  }

  function openCalories() {
    disarmClear();
    renderCalories();
  }

  kcalForm.addEventListener('submit', function (event) {
    event.preventDefault();
    var value = Math.round(Number(kcalValue.value));
    if (!isFinite(value) || value <= 0) {
      kcalValue.focus();
      return;
    }

    meals.push({
      id: makeId(),
      ts: Date.now(),
      kcal: clamp(value, 1, 9999),
      note: kcalNote.value.trim().slice(0, 40)
    });

    kcalValue.value = '';
    kcalNote.value = '';
    renderCalories();
    save();
    kcalValue.focus();
  });

  kcalTargetInput.addEventListener('input', function () {
    var value = Math.round(Number(kcalTargetInput.value));
    kcalTarget = isFinite(value) && value > 0 ? clamp(value, 1, 20000) : 0;
    paintKcalBar(kcalTotalToday());
    touchSave();
  });

  kcalClear.addEventListener('click', function () {
    if (!todayMeals().length) return;

    if (!clearArmed) {
      clearArmed = 1;
      kcalClear.textContent = 'tap again';
      kcalClear.classList.add('is-armed');
      window.setTimeout(disarmClear, 2600);
      return;
    }

    disarmClear();
    var today = startOfDay(Date.now());
    meals = meals.filter(function (m) {
      return startOfDay(m.ts) !== today;
    });
    renderCalories();
    save();
  });

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      setView(tab.dataset.view);
    });
  });

  /* -------------------------------- events ------------------------------- */

  /* iOS ignores user-scalable=no for accessibility, so close the gaps: the
     proprietary gesture events and any two-finger touchmove. */
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(function (type) {
    document.addEventListener(
      type,
      function (event) {
        event.preventDefault();
      },
      { passive: false }
    );
  });

  document.addEventListener(
    'touchmove',
    function (event) {
      if (event.touches.length > 1) event.preventDefault();
    },
    { passive: false }
  );

  /* Double-tap zoom in older Safari. touch-action: manipulation covers the rest. */
  document.addEventListener(
    'dblclick',
    function (event) {
      event.preventDefault();
    },
    { passive: false }
  );

  addBtn.addEventListener('click', function () {
    if (composer.hidden) openComposer();
    else closeComposer(true);
  });

  composerForm.addEventListener('submit', function (event) {
    event.preventDefault();
    placeMission();
  });

  linkBtn.addEventListener('click', function () {
    closeComposer(false);
    if (focusMission) closeFocus({ immediate: true });
    setLinkMode(!linkMode);
  });

  canvas.addEventListener('click', function (event) {
    if (composer.hidden === false) {
      var inComposer = composer.contains(event.target);
      if (!inComposer && event.target !== addBtn) closeComposer(false);
    }
    if (pendingId) clearPending();
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      if (focusMission) {
        closeFocus();
      } else if (!composer.hidden) {
        closeComposer(true);
      } else if (linkMode) {
        setLinkMode(false);
      } else if (pendingId) {
        clearPending();
      }
      return;
    }

    /* "/" jumps straight into the composer. */
    if (
      event.key === '/' &&
      currentView === 'canvas' &&
      composer.hidden &&
      !focusMission &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey
    ) {
      var tag = (document.activeElement && document.activeElement.tagName) || '';
      if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
        event.preventDefault();
        openComposer();
      }
    }
  });

  window.addEventListener('resize', function () {
    measureCanvas();
    missions.forEach(function (m) {
      if (!m.el) return;
      var card = m.el.querySelector('.card');
      if (card) {
        m.w = card.offsetWidth || m.w;
        m.h = card.offsetHeight || m.h;
      }
      keepInside(m);
    });
    settleOverlaps();
    slideState.max = slideMax();
    paint();
  });

  window.addEventListener('pagehide', function () {
    if (dirty) save();
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden && dirty) save();
  });

  if (reduceMotion.addEventListener) {
    reduceMotion.addEventListener('change', startMotion);
  }

  /* Offline shell — only over http(s). */
  if ('serviceWorker' in navigator && window.isSecureContext) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./sw.js').catch(function () {
        /* Registration is optional; the canvas works without it. */
      });
    });
  }

  /* --------------------------------- boot -------------------------------- */

  function hydrate() {
    var data = null;
    try {
      data = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
    } catch (err) {
      data = null;
    }
    if (!data || !Array.isArray(data.missions)) return;

    var seen = {};

    data.missions.slice(0, MAX_MISSIONS).forEach(function (item) {
      if (!item || typeof item.text !== 'string') return;
      var text = item.text.trim().slice(0, MAX_TEXT);
      if (!text) return;

      var id = typeof item.id === 'string' && item.id ? item.id : makeId();
      if (seen[id]) id = makeId();
      seen[id] = true;

      buildMission({
        id: id,
        text: text,
        nx: item.nx,
        ny: item.ny,
        vx: item.vx,
        vy: item.vy,
        phase: item.phase,
        createdAt: item.createdAt
      });
    });

    var ids = {};
    missions.forEach(function (m) {
      ids[m.id] = true;
    });

    (Array.isArray(data.links) ? data.links : []).forEach(function (pair) {
      if (!Array.isArray(pair) || pair.length < 2) return;
      var a = pair[0];
      var b = pair[1];
      if (a === b || !ids[a] || !ids[b]) return;
      var key = linkKey(a, b);
      var dup = links.some(function (l) {
        return linkKey(l.a, l.b) === key;
      });
      if (dup) return;

      links.push({ a: a, b: b });
    });

    doneLog = (Array.isArray(data.done) ? data.done : [])
      .map(function (ts) {
        return Number(ts);
      })
      .filter(function (ts) {
        return isFinite(ts) && ts > 0;
      })
      .slice(-3000);

    meals = [];
    (Array.isArray(data.meals) ? data.meals : []).slice(-400).forEach(function (item) {
      if (!item) return;
      var kcal = Math.round(Number(item.kcal));
      var ts = Number(item.ts);
      if (!isFinite(kcal) || kcal <= 0 || !isFinite(ts) || ts <= 0) return;
      meals.push({
        id: typeof item.id === 'string' && item.id ? item.id : makeId(),
        ts: ts,
        kcal: clamp(kcal, 1, 9999),
        note: String(item.note == null ? '' : item.note).trim().slice(0, 40)
      });
    });

    kcalTarget = clamp(Math.round(Number(data.kcalTarget) || 0), 0, 20000);

    renderLinks();
  }

  measureCanvas();
  hydrate();
  missions.forEach(keepInside);
  settleOverlaps();
  updateMeta();
  paint();
  setView('canvas');
  startMotion();
})();
