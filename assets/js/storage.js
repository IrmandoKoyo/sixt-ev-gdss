/*!
 * Sixt EV GDSS — Dual-Engine Persistence & Realtime Sync (storage.js)
 * Mendukung:
 *   1. Google Firebase Cloud Firestore (onSnapshot real-time antar HP/laptop)
 *   2. LocalStorage + BroadcastChannel (instan 0ms antar-tab & 100% tahan offline)
 */
(function (root) {
  'use strict';

  var LS_STATE_KEY = 'sixt_ev_gdss_state_v3_clean';
  var LS_FB_CFG_KEY = 'sixt_ev_gdss_firebase_cfg_v1';
  var LS_SESSION_KEY = 'sixt_ev_gdss_role_session_v1';
  var CHANNEL_NAME = 'sixt_ev_gdss_bc_v1';

  var listeners = [];
  var statusListeners = [];
  var bc = null;
  var firestoreDb = null;
  var firestoreUnsub = null;
  var isApplyingRemote = false;
  var syncStatus = {
    mode: 'local', // 'cloud' | 'connecting' | 'local' | 'error'
    label: 'Local + Multi-Tab Sync Aktif',
    projectId: '',
    lastSync: null,
    errorMsg: ''
  };

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function fnv1a(s) {
    var h = 0x811c9dc5;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return ('00000000' + h.toString(16)).slice(-8);
  }

  function pinHash(pin) {
    return fnv1a('sixt-ev-gdss:' + String(pin || '').trim());
  }

  function setStatus(patch) {
    syncStatus = Object.assign({}, syncStatus, patch);
    statusListeners.forEach(function (fn) {
      try { fn(syncStatus); } catch (e) { /* ignore */ }
    });
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(LS_STATE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.schema === 'sixt-ev-gdss/v1' && parsed.criteria && parsed.alternatives && parsed.dms) {
          return parsed;
        }
      }
    } catch (e) { /* fallback to seed */ }
    var fresh = clone(root.GDSS_SEED);
    saveLocalOnly(fresh);
    return fresh;
  }

  function saveLocalOnly(state) {
    try {
      localStorage.setItem(LS_STATE_KEY, JSON.stringify(state));
    } catch (e) { /* quota ignore */ }
  }

  function saveState(state, opts) {
    opts = opts || {};
    state.meta = state.meta || {};
    state.meta.updatedAt = new Date().toISOString();
    saveLocalOnly(state);

    if (bc && !opts.fromBroadcast) {
      try { bc.postMessage({ type: 'state_update', state: state, ts: Date.now() }); } catch (e) { /* ignore */ }
    }
    if (firestoreDb && !opts.fromCloud && !isApplyingRemote) {
      pushToFirestore(state);
    }
    if (!opts.silent) {
      notifyListeners(state, opts.source || 'local');
    }
    return state;
  }

  function resetToSeed() {
    var fresh = clone(root.GDSS_SEED);
    fresh.meta.updatedAt = new Date().toISOString();
    saveState(fresh, { source: 'reset' });
    return fresh;
  }

  function notifyListeners(state, source) {
    listeners.forEach(function (fn) {
      try { fn(state, source); } catch (e) { console.error(e); }
    });
  }

  function onStateChange(fn) {
    listeners.push(fn);
    return function () { listeners = listeners.filter(function (x) { return x !== fn; }); };
  }

  function onStatusChange(fn) {
    statusListeners.push(fn);
    fn(syncStatus);
    return function () { statusListeners = statusListeners.filter(function (x) { return x !== fn; }); };
  }

  /* ------------------------------------ Multi-tab BroadcastChannel & storage */
  function initCrossTab() {
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        bc = new BroadcastChannel(CHANNEL_NAME);
        bc.onmessage = function (ev) {
          if (ev && ev.data && ev.data.type === 'state_update' && ev.data.state) {
            saveLocalOnly(ev.data.state);
            notifyListeners(ev.data.state, 'tab');
          }
        };
      } catch (e) { bc = null; }
    }
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('storage', function (ev) {
        if (ev.key === LS_STATE_KEY && ev.newValue) {
          try {
            var st = JSON.parse(ev.newValue);
            notifyListeners(st, 'storage');
          } catch (e) { /* ignore */ }
        }
      });
    }
  }

  /* ---------------------------------------- Firebase Cloud Firestore Engine */
  function getSavedFirebaseConfig() {
    try {
      var saved = localStorage.getItem(LS_FB_CFG_KEY);
      if (saved) {
        var parsed = JSON.parse(saved);
        if (parsed && parsed.apiKey && parsed.projectId) return parsed;
      }
    } catch (e) { /* ignore */ }
    var fileCfg = root.GDSS_FIREBASE_CONFIG || {};
    if (fileCfg.apiKey && fileCfg.projectId) return fileCfg;
    return null;
  }

  function saveFirebaseConfig(cfg) {
    if (!cfg || !cfg.apiKey || !cfg.projectId) {
      localStorage.removeItem(LS_FB_CFG_KEY);
      disconnectFirestore();
      setStatus({ mode: 'local', label: 'Local + Multi-Tab Sync Aktif', projectId: '', errorMsg: '' });
      return;
    }
    var clean = {
      apiKey: String(cfg.apiKey).trim(),
      authDomain: String(cfg.authDomain || (cfg.projectId + '.firebaseapp.com')).trim(),
      projectId: String(cfg.projectId).trim(),
      storageBucket: String(cfg.storageBucket || (cfg.projectId + '.appspot.com')).trim(),
      messagingSenderId: String(cfg.messagingSenderId || '').trim(),
      appId: String(cfg.appId || '').trim(),
      collectionName: String(cfg.collectionName || 'gdss_sixt_sessions').trim(),
      documentId: String(cfg.documentId || 'master_room_konoha').trim()
    };
    localStorage.setItem(LS_FB_CFG_KEY, JSON.stringify(clean));
    connectFirestore(clean);
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[src="' + src + '"]');
      if (existing) return resolve();
      var s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error('Gagal memuat SDK Firebase: ' + src)); };
      document.head.appendChild(s);
    });
  }

  function ensureFirebaseSDK() {
    if (root.firebase && root.firebase.firestore) return Promise.resolve();
    var base = 'https://www.gstatic.com/firebasejs/10.12.2/';
    return loadScript(base + 'firebase-app-compat.js')
      .then(function () { return loadScript(base + 'firebase-firestore-compat.js'); });
  }

  function disconnectFirestore() {
    if (firestoreUnsub) {
      try { firestoreUnsub(); } catch (e) { /* ignore */ }
      firestoreUnsub = null;
    }
    firestoreDb = null;
  }

  function connectFirestore(cfg) {
    if (typeof document === 'undefined') return;
    disconnectFirestore();
    setStatus({ mode: 'connecting', label: 'Menghubungkan ke Firebase (' + cfg.projectId + ')...', projectId: cfg.projectId, errorMsg: '' });

    ensureFirebaseSDK()
      .then(function () {
        var app;
        if (!root.firebase.apps || !root.firebase.apps.length) {
          app = root.firebase.initializeApp(cfg);
        } else {
          app = root.firebase.app();
        }
        firestoreDb = root.firebase.firestore(app);
        var col = cfg.collectionName || 'gdss_sixt_sessions';
        var docId = cfg.documentId || 'master_room_konoha';
        var docRef = firestoreDb.collection(col).doc(docId);

        firestoreUnsub = docRef.onSnapshot(function (snap) {
          setStatus({
            mode: 'cloud',
            label: 'Cloud Firestore Live (' + cfg.projectId + ')',
            projectId: cfg.projectId,
            lastSync: new Date().toLocaleTimeString('id-ID'),
            errorMsg: ''
          });
          if (snap.exists) {
            var data = snap.data();
            if (data && data.payload) {
              try {
                var remoteState = typeof data.payload === 'string' ? JSON.parse(data.payload) : data.payload;
                var localState = loadState();
                if (!localState.meta || !remoteState.meta || remoteState.meta.updatedAt !== localState.meta.updatedAt) {
                  isApplyingRemote = true;
                  saveState(remoteState, { fromCloud: true, source: 'cloud' });
                  isApplyingRemote = false;
                }
              } catch (e) { isApplyingRemote = false; }
            }
          } else {
            // Inisialisasi dokumen pertama kali di Firestore dari state lokal
            pushToFirestore(loadState());
          }
        }, function (err) {
          setStatus({
            mode: 'error',
            label: 'Fallback LocalStorage Aktif (Cloud terkunci/offline)',
            projectId: cfg.projectId,
            errorMsg: err && err.message ? err.message : 'Periksa Firestore Rules / Koneksi'
          });
        });
      })
      .catch(function (err) {
        setStatus({
          mode: 'local',
          label: 'Local + Multi-Tab Sync Aktif (Offline Mode)',
          projectId: cfg.projectId,
          errorMsg: err && err.message ? err.message : ''
        });
      });
  }

  function pushToFirestore(state) {
    if (!firestoreDb) return Promise.resolve(false);
    var cfg = getSavedFirebaseConfig() || {};
    var col = cfg.collectionName || 'gdss_sixt_sessions';
    var docId = cfg.documentId || 'master_room_konoha';
    return firestoreDb.collection(col).doc(docId).set({
      updatedAt: state.meta && state.meta.updatedAt ? state.meta.updatedAt : new Date().toISOString(),
      payload: JSON.stringify(state)
    }).then(function () {
      setStatus({ lastSync: new Date().toLocaleTimeString('id-ID') });
      return true;
    }).catch(function (err) {
      setStatus({
        mode: 'error',
        label: 'Fallback LocalStorage Aktif',
        errorMsg: err && err.message ? err.message : 'Gagal menulis ke Firestore'
      });
      return false;
    });
  }

  /* ------------------------------------------------ Role / Session Manager */
  function loadSession() {
    try {
      var raw = sessionStorage.getItem(LS_SESSION_KEY) || localStorage.getItem(LS_SESSION_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return { role: 'facilitator', dmId: 'dm1', quickSwitch: true };
  }

  function saveSession(sess) {
    try {
      sessionStorage.setItem(LS_SESSION_KEY, JSON.stringify(sess));
      localStorage.setItem(LS_SESSION_KEY, JSON.stringify(sess));
    } catch (e) { /* ignore */ }
    return sess;
  }

  function init() {
    initCrossTab();
    var cfg = getSavedFirebaseConfig();
    if (cfg) connectFirestore(cfg);
    return loadState();
  }

  var API = {
    init: init,
    loadState: loadState,
    saveState: saveState,
    resetToSeed: resetToSeed,
    onStateChange: onStateChange,
    onStatusChange: onStatusChange,
    getSavedFirebaseConfig: getSavedFirebaseConfig,
    saveFirebaseConfig: saveFirebaseConfig,
    pushToFirestore: pushToFirestore,
    loadSession: loadSession,
    saveSession: saveSession,
    pinHash: pinHash,
    clone: clone
  };

  root.GDSSStorage = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
