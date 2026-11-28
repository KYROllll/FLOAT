/* ==========================================================================
   AURA // Supabase client
   Minimal Supabase Auth + PostgREST client. No CDN, no build step, no deps.
   Only the project's public publishable/anon key belongs here. Never put a
   service_role key in this file or anywhere else the browser can read.
   ========================================================================== */
(function () {
  'use strict';

  var DEFAULT_URL = 'https://vxmonbjokwcsmboblupd.supabase.co';
  var DEFAULT_KEY = 'sb_publishable_EzCAne8B3Qiq7MfRSMVFGA_qzXjC7j3';
  /* The one place AURA's own address lives. Every link, redirect and callback
     must land here. This is the canonical GitHub Pages project URL — the
     three-l kyrolll.github.io/AURA does not exist and returns 404. */
  var DEFAULT_APP_URL = 'https://kyrollll.github.io/AURA/';
  var SESSION_KEY = 'aura.supabase.session';
  var TABLE = 'aura_user_state';
  var REFRESH_MARGIN = 60;

  function meta(name) {
    var tag = document.querySelector('meta[name="' + name + '"]');
    return tag && tag.content ? String(tag.content).trim() : '';
  }

  function config() {
    var url = window.AURA_SUPABASE_URL || meta('aura-supabase-url') || DEFAULT_URL;
    var key = window.AURA_SUPABASE_ANON_KEY || meta('aura-supabase-anon-key') || DEFAULT_KEY;
    return {
      url: String(url || '').replace(/\/+$/, ''),
      key: String(key || '').trim()
    };
  }

  function configured() {
    var c = config();
    return !!(c.url && c.key);
  }

  function appUrl() {
    var url = String(window.AURA_APP_URL || meta('aura-app-url') || DEFAULT_APP_URL || '').trim();
    if (!url) url = DEFAULT_APP_URL;
    return url.charAt(url.length - 1) === '/' ? url : url + '/';
  }

  function readSession() {
    try {
      var raw = window.localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      var session = JSON.parse(raw);
      if (!session || !session.access_token) return null;
      return session;
    } catch (err) {
      return null;
    }
  }

  function writeSession(session) {
    try {
      if (session) window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      else window.localStorage.removeItem(SESSION_KEY);
    } catch (err) {}
  }

  function clearSession() {
    writeSession(null);
  }

  function sessionFrom(data) {
    if (!data || !data.access_token) return null;
    var expiresIn = Number(data.expires_in) || 3600;
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token || '',
      expires_at: Number(data.expires_at) || (Math.floor(Date.now() / 1000) + expiresIn),
      token_type: data.token_type || 'bearer',
      user: data.user || null
    };
  }

  async function request(path, options) {
    var c = config();
    if (!c.url || !c.key) throw new Error('AURA accounts are unavailable right now.');

    options = options || {};
    var headers = Object.assign({ apikey: c.key, Accept: 'application/json' }, options.headers || {});
    if (options.body != null && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    var response;
    try {
      response = await fetch(c.url + path, {
        method: options.method || 'GET',
        headers: headers,
        body: options.body != null ? JSON.stringify(options.body) : undefined,
        keepalive: !!options.keepalive
      });
    } catch (err) {
      var network = new Error('Network error. Check your connection and try again.');
      network.cause = err;
      throw network;
    }

    var text = await response.text();
    var data = null;
    if (text) {
      try { data = JSON.parse(text); } catch (err) { data = text; }
    }

    if (!response.ok) {
      var message = (data && (data.msg || data.error_description || data.message || data.error)) ||
        ('Request failed (' + response.status + ')');
      var failure = new Error(String(message));
      failure.status = response.status;
      failure.code = data && (data.error_code || data.code);
      failure.data = data;
      throw failure;
    }

    return data;
  }

  async function refreshSession(session) {
    if (!session || !session.refresh_token) return null;
    var data = await request('/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      body: { refresh_token: session.refresh_token }
    });
    var next = sessionFrom(data);
    if (next) writeSession(next);
    return next;
  }

  /* A token the server actually rejected (4xx, typically an expired refresh
     token) is dead and the session goes. A refresh that only failed on the
     network is not: an offline launch must keep the signed-in user inside
     their local AURA data instead of asking them to sign in with no network. */
  function rejectedByServer(err) {
    /* 4xx: the server refused the token. 5xx is the server's own trouble, and
       no status at all is a network failure — neither ends a session. */
    return !!(err && err.status >= 400 && err.status < 500);
  }

  /* A link-style sign-in can hand the app its session in the URL fragment
     (#access_token=...). Absorb it once, strip it out of the address bar, and
     keep it as the ordinary stored session so the app never dead-ends on a
     callback URL. AURA's own emails carry a code instead, so this is only a
     safety net for link templates. */
  async function absorbLinkSession() {
    var hash = String(window.location.hash || '');
    if (hash.indexOf('access_token=') === -1) return null;

    var params = {};
    hash.replace(/^#/, '').split('&').forEach(function (pair) {
      var cut = pair.indexOf('=');
      if (cut < 1) return;
      try {
        params[decodeURIComponent(pair.slice(0, cut))] = decodeURIComponent(pair.slice(cut + 1));
      } catch (err) {}
    });
    if (!params.access_token) return null;

    var session = sessionFrom(params);
    if (!session) return null;

    try {
      var user = await request('/auth/v1/user', {
        headers: { Authorization: 'Bearer ' + session.access_token }
      });
      if (user) session.user = { id: user.id || user.sub, email: user.email };
    } catch (err) {
      /* The token is still usable even if the profile call failed. */
    }

    writeSession(session);
    try {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    } catch (err) {}
    return session;
  }

  async function getSession() {
    var linked = await absorbLinkSession();
    if (linked) return linked;

    var session = readSession();
    if (!session) return null;
    var now = Math.floor(Date.now() / 1000);
    if (session.expires_at && session.expires_at - REFRESH_MARGIN > now) return session;
    try {
      return await refreshSession(session);
    } catch (err) {
      if (rejectedByServer(err)) {
        clearSession();
        return null;
      }
      return session;
    }
  }

  /* ------------------------- email one-time code -------------------------- */

  /* Ask AURA to email a sign-in code. A new address gets a pending account
     here, but nothing about it is active: no session exists, no state row is
     written, and AURA's workspace stays closed until verifyCode() succeeds. */
  async function sendCode(email) {
    var address = String(email || '').trim().toLowerCase();
    if (!address) throw new Error('Enter your email address.');
    await request('/auth/v1/otp', {
      method: 'POST',
      body: { email: address, create_user: true }
    });
    return true;
  }

  /* The code is the only thing that can open a session. The project decides the
     code length (6 to 10 digits), so any length in that range is sent through
     untouched instead of being rejected for not being six. */
  async function verifyCode(email, token) {
    var address = String(email || '').trim().toLowerCase();
    var code = String(token || '').replace(/\D/g, '');
    if (code.length < 6 || code.length > 10) throw new Error('Enter the full code from the email.');

    var data = await request('/auth/v1/verify', {
      method: 'POST',
      body: { email: address, token: code, type: 'email' }
    });
    var session = sessionFrom(data);
    if (!session) throw new Error('That code could not be verified. Try again.');
    writeSession(session);
    return session;
  }

  async function signOut() {
    var session = readSession();
    if (session && session.access_token) {
      try {
        await request('/auth/v1/logout', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + session.access_token }
        });
      } catch (err) {
        /* The local session is cleared even if the network call fails. */
      }
    }
    clearSession();
  }

  async function getUser() {
    var session = await getSession();
    return session && session.user ? session.user : null;
  }

  async function authedRequest(path, options, session, retried) {
    var active = session || await getSession();
    if (!active) throw new Error('Sign in required.');

    var headers = Object.assign({}, options && options.headers, {
      Authorization: 'Bearer ' + active.access_token
    });
    var nextOptions = Object.assign({}, options, { headers: headers });

    try {
      return await request(path, nextOptions);
    } catch (err) {
      if (err.status === 401 && !retried) {
        var refreshed = null;
        var refreshErr = null;
        try { refreshed = await refreshSession(active); } catch (refreshFailure) { refreshErr = refreshFailure; }
        if (refreshed) return authedRequest(path, options, refreshed, true);
        /* Offline is not a sign-out: keep the session when the refresh only
           failed on the network. A rejected refresh token, or none at all,
           ends it. */
        if (!refreshErr || rejectedByServer(refreshErr)) clearSession();
      }
      throw err;
    }
  }

  async function loadState(userId) {
    if (!userId) throw new Error('Sign in required.');
    var path = '/rest/v1/' + TABLE +
      '?user_id=eq.' + encodeURIComponent(userId) +
      '&select=state_json,updated_at';
    var rows = await authedRequest(path, { method: 'GET' });
    return Array.isArray(rows) && rows.length ? rows[0] : null;
  }

  async function saveState(userId, state, options) {
    if (!userId) throw new Error('Sign in required.');
    var path = '/rest/v1/' + TABLE + '?on_conflict=user_id';
    return authedRequest(path, {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: [{
        user_id: userId,
        state_json: state,
        updated_at: new Date().toISOString()
      }],
      keepalive: !!(options && options.keepalive)
    });
  }

  window.AuraSupabase = {
    configured: configured,
    config: config,
    appUrl: appUrl,
    getSession: getSession,
    getUser: getUser,
    sendCode: sendCode,
    verifyCode: verifyCode,
    signOut: signOut,
    loadState: loadState,
    saveState: saveState,
    readSession: readSession,
    clearSession: clearSession
  };
})();
