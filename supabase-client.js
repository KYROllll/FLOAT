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
    if (!c.url || !c.key) throw new Error('Supabase is not configured.');

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

  async function getSession() {
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

  async function signIn(email, password) {
    var data = await request('/auth/v1/token?grant_type=password', {
      method: 'POST',
      body: { email: email, password: password }
    });
    var session = sessionFrom(data);
    if (!session) throw new Error('Sign in failed. Try again.');
    writeSession(session);
    return session;
  }

  async function signUp(email, password) {
    var data = await request('/auth/v1/signup', {
      method: 'POST',
      body: { email: email, password: password }
    });
    var session = sessionFrom(data);
    if (session) {
      writeSession(session);
      return { session: session, user: session.user, needsConfirmation: false };
    }
    return {
      session: null,
      user: data && (data.user || data),
      needsConfirmation: true
    };
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
    getSession: getSession,
    getUser: getUser,
    signIn: signIn,
    signUp: signUp,
    signOut: signOut,
    loadState: loadState,
    saveState: saveState,
    readSession: readSession,
    clearSession: clearSession
  };
})();
