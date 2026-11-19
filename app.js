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
  var PAD = 20;
  var MAX_MISSIONS = 80;
  var MAX_TEXT = 120;

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
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  var HINT_IDLE = 'tap two missions to link \u00b7 tap a line to unlink';
  var HINT_SELECTED = 'now tap another mission';

  var missions = [];
  var links = [];
  var linkViews = {};       // "a|b" -> { a, b, path, hit }
  var pendingId = null;      // first mission chosen in link mode
  var linkMode = false;
  var W = 0;
  var H = 0;
  var rafId = 0;
  var lastFrame = 0;
  var saveTimer = 0;
  var dirty = false;

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

  function getMission(id) {
    for (var i = 0; i < missions.length; i++) {
      if (missions[i].id === id) return missions[i];
    }
    return null;
  }

  function isLive(m) {
    return m && !m.completing;
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
      v: 1,
      missions: live.map(function (m) {
        return {
          id: m.id,
          text: m.text,
          nx: round(m.nx, 4),
          ny: round(m.ny, 4),
          vx: round(m.vx, 5),
          vy: round(m.vy, 5),
          phase: round(m.phase, 3)
        };
      }),
      links: links
        .filter(function (l) {
          return ids[l.a] && ids[l.b];
        })
        .map(function (l) {
          return [l.a, l.b];
        })
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

  /* Pick a spot that keeps some air around existing cards. */
  function findSpot() {
    var w = W || window.innerWidth;
    var h = H || window.innerHeight;
    var best = null;
    var bestGap = -1;

    for (var attempt = 0; attempt < 30; attempt++) {
      var nx = rand(0.24, 0.76);
      var ny = rand(0.22, 0.78);
      var gap = Infinity;

      for (var i = 0; i < missions.length; i++) {
        var m = missions[i];
        if (!isLive(m)) continue;
        var d = Math.sqrt(Math.pow((nx - m.nx) * w, 2) + Math.pow((ny - m.ny) * h, 2));
        if (d < gap) gap = d;
      }

      if (gap === Infinity) return { nx: nx, ny: ny };
      if (gap > bestGap) {
        bestGap = gap;
        best = { nx: nx, ny: ny };
      }
      if (gap > 175) return { nx: nx, ny: ny };
    }

    return best || { nx: 0.5, ny: 0.5 };
  }

  /* -------------------------------- render ------------------------------- */

  function paintLinks() {
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
      var bend = Math.min(dist * 0.09, 26);
      var cx = (ax + bx) / 2 - (dy / dist) * bend;
      var cy = (ay + by) / 2 + (dx / dist) * bend;

      var d =
        'M' + ax.toFixed(1) + ' ' + ay.toFixed(1) +
        'Q' + cx.toFixed(1) + ' ' + cy.toFixed(1) +
        ' ' + bx.toFixed(1) + ' ' + by.toFixed(1);

      view.path.setAttribute('d', d);
      view.hit.setAttribute('d', d);

      /* A white pulse travels from the first mission to the second. */
      if (view.pulse) {
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

    links.forEach(function (link) {
      var key = linkKey(link.a, link.b);
      if (linkViews[key]) return;

      var hit = document.createElementNS(SVG_NS, 'path');
      hit.setAttribute('class', 'link-hit');
      hit.addEventListener('click', function (event) {
        event.stopPropagation();
        if (!linkMode) return;
        removeLink(link.a, link.b);
      });

      var path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('class', 'link-line');

      var pulse = document.createElementNS(SVG_NS, 'circle');
      pulse.setAttribute('class', 'link-pulse');
      pulse.setAttribute('r', '2.3');
      pulse.setAttribute('opacity', '0');

      linksEl.appendChild(hit);
      linksEl.appendChild(path);
      linksEl.appendChild(pulse);

      var offset = 0;
      for (var i = 0; i < key.length; i++) offset = (offset * 31 + key.charCodeAt(i)) % 997;

      linkViews[key] = {
        a: link.a,
        b: link.b,
        path: path,
        hit: hit,
        pulse: pulse,
        offset: offset / 997
      };
    });

    paintLinks();
  }

  function updateMeta() {
    var n = missions.filter(isLive).length;
    countEl.textContent = n === 0 ? '' : n + ' floating';
    emptyEl.hidden = n > 0;
  }

  /* ------------------------------ missions ------------------------------- */

  function buildMission(data) {
    var text = String(data.text == null ? '' : data.text).trim().slice(0, MAX_TEXT);
    if (!text) return null;

    var spot = findSpot();
    var speed = rand(0.0045, 0.0085);
    var angle = rand(0, Math.PI * 2);

    var m = {
      id: data.id || makeId(),
      text: text,
      nx: clamp(Number(data.nx) || spot.nx, 0, 1),
      ny: clamp(Number(data.ny) || spot.ny, 0, 1),
      vx: clamp(Number(data.vx) || Math.cos(angle) * speed, -0.02, 0.02),
      vy: clamp(Number(data.vy) || Math.sin(angle) * speed * 0.85, -0.02, 0.02),
      phase: Number(data.phase) || rand(0, Math.PI * 2),
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
    keepInside(m);

    missions.push(m);
    return m;
  }

  function holdSteady(m, ms) {
    m.paused = true;
    if (m.steadyTimer) window.clearTimeout(m.steadyTimer);
    m.steadyTimer = window.setTimeout(function () {
      m.steadyTimer = 0;
      if (pendingId !== m.id) m.paused = false;
    }, ms);
  }

  function addMission(text) {
    var m = buildMission({ text: text });
    if (!m) return null;
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
    else complete(m);
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
    var size = 44;
    var gap = 12;
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
    if (reduceMotion.matches) {
      paint();
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
      if (!composer.hidden) {
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
      composer.hidden &&
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
        phase: item.phase
      });
    });

    var ids = {};
    missions.forEach(function (m) {
      ids[m.id] = true;
    });

    (Array.isArray(data.links) ? data.links : []).forEach(function (pair) {
      if (!Array.isArray(pair) || pair.length !== 2) return;
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

    renderLinks();
  }

  measureCanvas();
  hydrate();
  missions.forEach(keepInside);
  updateMeta();
  paint();
  startMotion();
})();
