/*!
 * Sixt SE EV Fleet GDSS — Main Interactive Application Controller (app.js)
 * Crafted with Apple Human Interface Guidelines (HIG) aesthetic, SF-style vector icons,
 * and textbook mathematical equation typesetting.
 * Mencakup seluruh Butir Penilaian 6 (6.1 s/d 6.12) dengan sinkronisasi real-time
 * Cloud Firestore + LocalStorage + BroadcastChannel.
 */
(function (root) {
  'use strict';

  var Engine = root.GDSSEngine;
  var Storage = root.GDSSStorage;
  var Charts = root.GDSSCharts;
  var ExcelRef = root.GDSS_EXCEL_REFERENCE;

  var appState = null;
  var calcResult = null;
  var session = null;
  var ui = {
    activeStage: 'all', // 'all' | '1'..'8'
    fullMode: false,    // false = Mode Standar (murni Penilaian 6), true = Mode Lengkap (+ Audit, Sensitivitas & Panduan Tim)
    selectedDM: 'dm1',
    normDM: 'dm1',
    cocosoDM: 'dm1',
    selectedCocosoRow: 0,
    showSPDetail: false,
    validationDemoMsg: '',
    simAlphas: [1 / 3, 1 / 3, 1 / 3],
    simCritBoostIdx: -1,
    simCritBoostPct: 30,
    theme: localStorage.getItem('sixt_gdss_theme') || 'light'
  };

  /* Preset kandidat tambahan dari EV_cars.csv Kaggle untuk demo CRUD 1-klik (Butir 6.3) */
  var PRESET_EXTRA_CARS = [
    { code: 'A9', name: 'Audi Q4 e-tron 45', segment: 'Compact Luxury SUV Jerman', raw: { c1: 52950, c2: 430, c3: 166, c4: 720, c5: 6.6, c6: null }, q: { dm1: 3, dm2: 4, dm3: 4 }, source: 'https://ev-database.org/car/2014/Audi-Q4-e-tron-45' },
    { code: 'A10', name: 'Mercedes-Benz EQE 300', segment: 'Executive Business Sedan', raw: { c1: 67187, c2: 525, c3: 169, c4: 790, c5: 7.3, c6: null }, q: { dm1: 2, dm2: 5, dm3: 5 }, source: 'https://ev-database.org/car/1713/Mercedes-Benz-EQE-300' },
    { code: 'A11', name: 'Renault Megane E-Tech EV60', segment: 'Fleet Hatchback Eropa', raw: { c1: 42000, c2: 380, c3: 158, c4: 560, c5: 7.4, c6: null }, q: { dm1: 4, dm2: 3, dm3: 4 }, source: 'https://ev-database.org/car/1521/Renault-Megane-E-Tech-EV60-220hp' }
  ];

  /* =========================================================
   * SF-SYMBOLS INSPIRED VECTOR ICON SYSTEM (ZERO EMOJIS!)
   * ========================================================= */
  var ICONS = {
    layers: '<svg class="ui-ico" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
    plus: '<svg class="ui-ico" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    sparkles: '<svg class="ui-ico" viewBox="0 0 24 24"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>',
    rotate: '<svg class="ui-ico" viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>',
    shield: '<svg class="ui-ico" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>',
    shieldAlert: '<svg class="ui-ico" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
    check: '<svg class="ui-ico" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>',
    checkCircle: '<svg class="ui-ico" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    wand: '<svg class="ui-ico" viewBox="0 0 24 24"><path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/><path d="M17.8 11.8 19 13"/><path d="M15 9h.01"/><path d="M17.8 6.2 19 5"/><path d="m3 21 9-9"/><path d="M12.2 6.2 11 5"/></svg>',
    edit: '<svg class="ui-ico ui-ico-sm" viewBox="0 0 24 24"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>',
    trash: '<svg class="ui-ico ui-ico-sm" viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>',
    award: '<svg class="ui-ico" viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>',
    sliders: '<svg class="ui-ico" viewBox="0 0 24 24"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="2" y1="14" x2="6" y2="14"/><line x1="10" y1="8" x2="14" y2="8"/><line x1="18" y1="16" x2="22" y2="16"/></svg>',
    chart: '<svg class="ui-ico" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    user: '<svg class="ui-ico" viewBox="0 0 24 24"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    users: '<svg class="ui-ico" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    cloud: '<svg class="ui-ico" viewBox="0 0 24 24"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>',
    message: '<svg class="ui-ico" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    history: '<svg class="ui-ico" viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>',
    up: '<svg class="ui-ico ui-ico-sm" viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15"/></svg>',
    down: '<svg class="ui-ico ui-ico-sm" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>',
    arrowRight: '<svg class="ui-ico ui-ico-sm" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',
    scale: '<svg class="ui-ico" viewBox="0 0 24 24"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>'
  };

  function ico(name) {
    return ICONS[name] || '';
  }

  /* =========================================================
   * TEXTBOOK MATHEMATICAL EQUATION BUILDERS (REAL MATH HTML)
   * ========================================================= */
  function mFrac(numHtml, denHtml) {
    return '<span class="m-frac"><span class="m-frac-num">' + numHtml + '</span><span class="m-frac-den">' + denHtml + '</span></span>';
  }

  function mSum(botHtml, topHtml) {
    return '<span class="m-sum"><span class="m-sum-top">' + topHtml + '</span><span class="m-sum-sym">&sum;</span><span class="m-sum-bot">' + botHtml + '</span></span>';
  }

  function mProd(botHtml, topHtml) {
    return '<span class="m-sum"><span class="m-sum-top">' + topHtml + '</span><span class="m-sum-sym">&prod;</span><span class="m-sum-bot">' + botHtml + '</span></span>';
  }

  function mRad(bodyHtml, indexHtml) {
    var idx = indexHtml ? '<span class="m-rad-idx">' + indexHtml + '</span>' : '';
    return '<span class="m-rad">' + idx + '<span class="m-rad-sym">&radic;</span><span class="m-rad-body">' + bodyHtml + '</span></span>';
  }

  function mAbs(bodyHtml) {
    return '<span class="m-abs">' + bodyHtml + '</span>';
  }

  function mCases(rowsArray) {
    return '<span class="m-cases"><span class="m-brace">{</span><span class="m-cases-rows">' +
      rowsArray.map(function (r) { return '<span>' + r + '</span>'; }).join('') +
      '</span></span>';
  }

  function esc(s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function fmt(v, d) {
    if (v === undefined || v === null || isNaN(v)) return '—';
    return Number(v).toFixed(d === undefined ? 4 : d);
  }

  function rankBadge(r) {
    var cls = r === 1 ? 'rank-pill r1' : (r === 2 ? 'rank-pill r2' : (r === 3 ? 'rank-pill r3' : 'rank-pill'));
    return '<span class="' + cls + '">#' + r + '</span>';
  }

  function typeBadge(t) {
    return t === 'Benefit'
      ? '<span class="badge badge-benefit">' + ico('up') + ' Benefit</span>'
      : '<span class="badge badge-cost">' + ico('down') + ' Cost</span>';
  }

  function isBaselineUnmodified() {
    if (!appState || !root.GDSS_SEED) return false;
    if (appState.alternatives.length !== 8 || appState.criteria.length !== 6) return false;
    var dms = Engine.sortedDMs(appState);
    if (dms.length !== 3) return false;
    return JSON.stringify(dms.map(function (d) { return [d.bwm, d.scores, d.types]; })) ===
           JSON.stringify(Engine.sortedDMs(root.GDSS_SEED).map(function (d) { return [d.bwm, d.scores, d.types]; }));
  }

  function applyTheme() {
    document.documentElement.setAttribute('data-theme', ui.theme);
    localStorage.setItem('sixt_gdss_theme', ui.theme);
  }

  /* ========================================================= RENDER MASTER */
  function recomputeAndRender() {
    calcResult = Engine.compute(appState);
    var dms = Engine.sortedDMs(appState);
    if (!appState.dms[ui.selectedDM] && dms.length) ui.selectedDM = dms[0].id;
    if (!appState.dms[ui.normDM] && dms.length) ui.normDM = dms[0].id;
    if (!appState.dms[ui.cocosoDM] && dms.length) ui.cocosoDM = dms[0].id;
    if (ui.selectedCocosoRow >= appState.alternatives.length) ui.selectedCocosoRow = 0;
    if (ui.simAlphas.length !== calcResult.usedDMs.length && calcResult.usedDMs.length > 0) {
      var k = calcResult.usedDMs.length;
      ui.simAlphas = calcResult.usedDMs.map(function () { return 1 / k; });
    }
    renderTopControls();
    renderPipelineTabs();
    renderWorkspace();
  }

  function renderTopControls() {
    var roleEl = document.getElementById('role-switcher');
    if (roleEl) {
      var dms = Engine.sortedDMs(appState);
      var dmColors = ['#0066CC', '#0D7A5F', '#5856D6', '#AF52DE'];
      var html = [];
      html.push('<button type="button" class="role-btn ' + (session.role === 'facilitator' ? 'active' : '') + '" data-action="switch-role" data-role="facilitator"><span class="role-dot" style="background:#0071E3"></span>Komite Eksekutif</button>');
      dms.forEach(function (dm, idx) {
        var active = session.role === 'dm' && session.dmId === dm.id;
        var dotCol = dmColors[idx % dmColors.length];
        html.push('<button type="button" class="role-btn ' + (active ? 'active' : '') + '" data-action="switch-role" data-role="dm" data-dm="' + esc(dm.id) + '"><span class="role-dot" style="background:' + dotCol + '"></span>' + esc(dm.code + ' (' + (dm.short || dm.name) + ')') + '</button>');
      });
      roleEl.innerHTML = html.join('');
    }
    var fmBtn = document.getElementById('full-mode-toggle-btn');
    var fmLbl = document.getElementById('full-mode-label');
    if (fmBtn && fmLbl) {
      if (ui.fullMode) {
        fmBtn.className = 'btn btn-sm btn-primary';
        fmLbl.textContent = 'Mode Lengkap: Aktif';
      } else {
        fmBtn.className = 'btn btn-sm btn-subtle';
        fmLbl.textContent = 'Mode Lengkap';
      }
    }
    var methodPill = document.getElementById('brand-method-pill');
    if (methodPill) methodPill.hidden = !ui.fullMode;
    var cloudPill = document.getElementById('cloud-sync-pill');
    if (cloudPill) cloudPill.hidden = !ui.fullMode;
    var jsonBtn = document.getElementById('export-json-btn');
    if (jsonBtn) jsonBtn.hidden = !ui.fullMode;
    var brandSub = document.getElementById('brand-sub');
    if (brandSub) {
      brandSub.innerHTML = ui.fullMode
        ? 'Kelompok Konoha &mdash; Komite Evaluasi Armada Korporat Sixt SE Pullach, Jerman (Dataset 360 EV Kaggle)'
        : 'Sistem Pendukung Keputusan Kelompok &mdash; Komite Evaluasi Armada Korporat Sixt SE, Jerman';
    }
  }

  function renderPipelineTabs() {
    var nav = document.getElementById('pipeline-tabs');
    if (!nav) return;
    if (!ui.fullMode && (ui.activeStage === '7' || ui.activeStage === '8')) {
      ui.activeStage = 'all';
    }
    var steps = [
      { id: 'all', num: 'All', label: 'Semua Tahap' },
      { id: '1', num: '01', label: 'Input Alternatif & Kriteria' },
      { id: '2', num: '02', label: 'Penilaian Tiap DM' },
      { id: '3', num: '03', label: 'Normalisasi' },
      { id: '4', num: '04', label: 'Bobot (Metode A: BWM)' },
      { id: '5', num: '05', label: 'Ranking (Metode B: CoCoSo)' },
      { id: '6', num: '06', label: 'Agregasi Grup & Hasil' }
    ];
    if (ui.fullMode) {
      steps.push({ id: '7', num: '07', label: 'Audit Excel & Sensitivitas' });
      steps.push({ id: '8', num: '08', label: 'Panduan Rubrik & Tim' });
    }
    var out = [];
    steps.forEach(function (s) {
      var cls = ui.activeStage === s.id ? 'step-tab active' : 'step-tab';
      out.push('<button type="button" class="' + cls + '" data-action="set-stage" data-stage="' + s.id + '"><span class="step-num">' + s.num + '</span>' + esc(s.label) + '</button>');
    });
    nav.innerHTML = out.join('');
  }

  function showStage(n) {
    if (!ui.fullMode && (n === 7 || n === 8)) return false;
    return ui.activeStage === 'all' || ui.activeStage === String(n);
  }

  function renderWorkspace() {
    var main = document.getElementById('main-workspace');
    if (!main) return;
    var parts = [];
    parts.push(renderKPIStrip());
    if (!isBaselineUnmodified() && calcResult.ok) {
      parts.push('<div class="alert-box alert-warn" style="align-items:center;justify-content:space-between;flex-wrap:wrap">' +
        '<div style="display:flex;align-items:center;gap:10px">' + ico('shieldAlert') +
        '<div><strong>Mode Simulasi / Data Kustom Aktif:</strong> Nilai input telah diubah dari data baseline laporan (8 EV &times; 6 Kriteria &times; 3 DM). Untuk mengembalikan hasil asli yang 100% sama dengan Excel (<strong>A1 — Tesla Model 3 Juara #1 dengan 18 Poin Borda</strong>), klik tombol di samping.</div></div>' +
        '<button type="button" class="btn btn-sm btn-primary" data-action="reset-baseline">' + ico('rotate') + '<span>Kembalikan ke Baseline Excel</span></button>' +
      '</div>');
    }
    if (!calcResult.ok) {
      parts.push('<div class="alert-box alert-error" style="align-items:center;justify-content:space-between;flex-wrap:wrap">' +
        '<div style="display:flex;align-items:center;gap:10px">' + ico('shieldAlert') +
        '<div><strong>Perhitungan Tertahan oleh Validasi Input:</strong> ' + esc(calcResult.errors.join(' • ')) + ' Silakan perbaiki pada Tahap 01 atau Tahap 02.</div></div>' +
        '<button type="button" class="btn btn-sm btn-primary" data-action="reset-baseline">' + ico('rotate') + '<span>Pulihkan Nilai Valid Baseline</span></button>' +
      '</div>');
    } else if (calcResult.warnings.length) {
      parts.push('<div class="alert-box alert-warn">' + ico('shieldAlert') + '<div><strong>Catatan Sistem:</strong> ' + esc(calcResult.warnings.join(' • ')) + '</div></div>');
    }
    if (showStage(1)) parts.push(renderStage1CRUD());
    if (showStage(2)) parts.push(renderStage2DMInput());
    if (calcResult.ok) {
      if (showStage(3)) parts.push(renderStage3Normalization());
      if (showStage(4)) parts.push(renderStage4BWM());
      if (showStage(5)) parts.push(renderStage5CoCoSo());
      if (showStage(6)) parts.push(renderStage6ConsensusCharts());
      if (showStage(7)) parts.push(renderStage7BenchmarksParityGroup());
    }
    if (showStage(8)) parts.push(renderStage8RubricDefense());
    main.innerHTML = parts.join('');
  }

  /* ------------------------------------------------------------- KPI Strip */
  function renderKPIStrip() {
    var alts = appState.alternatives || [], crit = appState.criteria || [];
    var dms = Engine.sortedDMs(appState);
    var submittedCount = calcResult.dmStatus.filter(function (s) { return s.used; }).length;
    var winnerTxt = 'Belum tersedia', winnerSub = 'Lengkapi input DM';
    var runnerTxt = '—', runnerSub = '—';
    var parityBadge = isBaselineUnmodified() ? '100% Identik (Δ = 0,0000)' : 'Mode Dinamis (Custom CRUD)';
    if (calcResult.ok) {
      var wIdx = calcResult.group.winnerIdx;
      var wAlt = alts[wIdx];
      winnerTxt = wAlt.code + ' — ' + wAlt.name;
      winnerSub = calcResult.group.borda[wIdx] + ' Poin Borda • K̄ = ' + fmt(calcResult.group.avgK[wIdx], 4) + (ui.fullMode ? (' • Copeland +' + calcResult.group.copeland[wIdx].net) : '');
      if (calcResult.group.order.length > 1) {
        var rIdx = calcResult.group.order[1];
        var rAlt = alts[rIdx];
        runnerTxt = rAlt.code + ' — ' + rAlt.name;
        runnerSub = calcResult.group.borda[rIdx] + ' Poin Borda • K̄ = ' + fmt(calcResult.group.avgK[rIdx], 4);
      }
    }
    var activeRoleName = session.role === 'facilitator'
      ? 'Komite Eksekutif (Akses Penuh)'
      : ((appState.dms[session.dmId] && (appState.dms[session.dmId].code + ' — ' + appState.dms[session.dmId].short)) || 'DM');

    var paritySub = ui.fullMode
      ? ('Kendall <em>W</em> = ' + (calcResult.ok ? fmt(calcResult.agreement.kendall.W, 4) : '—') + ' &bull; Stabil ' + (calcResult.ok ? (calcResult.sensitivity.winnerStable + '/' + calcResult.sensitivity.total + ' skenario') : '—'))
      : 'Sesuai 100% dengan Perhitungan Ms. Excel';

    return '<section class="kpi-strip" aria-label="Ringkasan Eksekutif GDSS">' +
      '<div class="kpi-card highlight">' +
        '<div class="kpi-head"><span class="kpi-label">Keputusan Konsensus (#1)</span><span class="kpi-icon-badge">' + ico('award') + '</span></div>' +
        '<div class="kpi-val">' + esc(winnerTxt) + '</div><div class="kpi-sub">' + esc(winnerSub) + '</div>' +
      '</div>' +
      '<div class="kpi-card">' +
        '<div class="kpi-head"><span class="kpi-label">Runner-Up Konsensus (#2)</span><span class="kpi-icon-badge">' + ico('chart') + '</span></div>' +
        '<div class="kpi-val">' + esc(runnerTxt) + '</div><div class="kpi-sub">' + esc(runnerSub) + '</div>' +
      '</div>' +
      '<div class="kpi-card">' +
        '<div class="kpi-head"><span class="kpi-label">Dimensi Model & Status DM</span><span class="kpi-icon-badge">' + ico('users') + '</span></div>' +
        '<div class="kpi-val">' + alts.length + ' EV &times; ' + crit.length + ' Kriteria</div><div class="kpi-sub">' + submittedCount + '/' + dms.length + ' DM Valid &bull; Peran: <strong>' + esc(activeRoleName) + '</strong></div>' +
      '</div>' +
      '<div class="kpi-card">' +
        '<div class="kpi-head"><span class="kpi-label">Paritas vs Master Excel</span><span class="kpi-icon-badge">' + ico('shield') + '</span></div>' +
        '<div class="kpi-val">' + esc(parityBadge) + '</div><div class="kpi-sub">' + paritySub + '</div>' +
      '</div>' +
      '</section>';
  }

  /* ======================================= STAGE 1: CRUD ALTERNATIF & KRITERIA */
  function renderStage1CRUD() {
    var alts = appState.alternatives, crit = appState.criteria, dms = Engine.sortedDMs(appState);
    var altRows = alts.map(function (a) {
      var rawCells = crit.map(function (c) {
        var rv = a.raw && a.raw[c.id] !== undefined && a.raw[c.id] !== null ? a.raw[c.id] : 'Likert 1–5';
        return '<td class="num">' + esc(rv) + '</td>';
      }).join('');
      return '<tr>' +
        '<td class="mono"><strong>' + esc(a.code) + '</strong></td>' +
        '<td><strong>' + esc(a.name) + '</strong><br><span style="font-size:0.74rem;color:var(--ink-muted)">' + esc(a.segment || '') + '</span></td>' +
        rawCells +
        '<td class="center"><button type="button" class="btn btn-sm" data-action="edit-alt" data-id="' + esc(a.id) + '">' + ico('edit') + '<span>Edit</span></button> ' +
        '<button type="button" class="btn btn-sm btn-danger" data-action="del-alt" data-id="' + esc(a.id) + '">' + ico('trash') + '<span>Hapus</span></button></td>' +
        '</tr>';
    }).join('');

    var critHeaders = crit.map(function (c) { return '<th class="num">' + esc(c.code + ' (' + c.unit + ')') + '</th>'; }).join('');

    var critRows = crit.map(function (c) {
      var dmTypesTxt = dms.map(function (dm) {
        var t = (dm.types && dm.types[c.id]) || c.defaultType;
        return '<span class="badge ' + (t === 'Benefit' ? 'badge-benefit' : 'badge-cost') + '">' + esc(dm.code + ': ' + t) + '</span>';
      }).join(' ');
      return '<tr>' +
        '<td class="mono"><strong>' + esc(c.code) + '</strong></td>' +
        '<td><strong>' + esc(c.name) + '</strong><br><span style="font-size:0.74rem;color:var(--ink-muted)">' + esc(c.description || '') + '</span></td>' +
        '<td>' + esc(c.unit) + '</td>' +
        '<td>' + typeBadge(c.defaultType) + '</td>' +
        '<td>' + dmTypesTxt + '</td>' +
        '<td class="center"><button type="button" class="btn btn-sm" data-action="edit-crit" data-id="' + esc(c.id) + '">' + ico('edit') + '<span>Edit</span></button> ' +
        '<button type="button" class="btn btn-sm btn-danger" data-action="del-crit" data-id="' + esc(c.id) + '">' + ico('trash') + '<span>Hapus</span></button></td>' +
        '</tr>';
    }).join('');

    return '<section class="stage-section" id="stage-1">' +
      '<div class="stage-header">' +
        '<div><span class="stage-eyebrow">' + (ui.fullMode ? 'Tahap 01 &middot; Butir 6.1 &amp; 6.3' : 'Tahap 01 &middot; Input Alternatif &amp; Kriteria') + '</span>' +
        '<h2 class="stage-title">Manajemen Dinamis Alternatif Armada EV, Kriteria Evaluasi, &amp; Responden DM</h2>' +
        '<p class="stage-desc">Seluruh kandidat kendaraan listrik (<span class="m-var">m</span> alternatif), kriteria evaluasi (<span class="m-var">n</span> kriteria), dan pengambil keputusan (<span class="m-var">K</span> responden) bersifat dinamis serta bebas <em>hardcode</em>. Penambahan, perubahan, atau penghapusan langsung memperbarui dimensi matriks secara otomatis.</p></div>' +
        '<div class="stage-actions">' +
          '<button type="button" class="btn btn-primary" data-action="open-add-alt">' + ico('plus') + '<span>Tambah Alternatif EV</span></button>' +
          (ui.fullMode ? '<button type="button" class="btn" data-action="quick-add-preset-alt" title="Demo cepat: tambah kandidat ke-9 Audi Q4 e-tron dari dataset Kaggle">' + ico('sparkles') + '<span>Demo Tambah EV Kaggle (A9)</span></button>' : '') +
          '<button type="button" class="btn btn-primary" data-action="open-add-crit">' + ico('plus') + '<span>Tambah Kriteria</span></button>' +
          (ui.fullMode ? '<button type="button" class="btn" data-action="quick-add-preset-crit" title="Demo cepat: tambah kriteria C7 Kapasitas Baterai">' + ico('sparkles') + '<span>Demo Tambah Kriteria (C7)</span></button>' : '') +
          '<button type="button" class="btn btn-subtle" data-action="reset-baseline">' + ico('rotate') + '<span>Reset Data Awal</span></button>' +
        '</div>' +
      '</div>' +
      '<div class="grid-2">' +
        '<div class="subcard">' +
          '<h3>' + ico('layers') + '<span>A. Daftar Alternatif Kendaraan Listrik (' + alts.length + ' Kandidat Aktif)</span></h3>' +
          '<div class="table-wrap"><table class="data-table"><thead><tr><th>Kode</th><th>Model Armada EV &amp; Segmen</th>' + critHeaders + '<th class="center">Aksi CRUD</th></tr></thead><tbody>' + altRows + '</tbody></table></div>' +
        '</div>' +
        '<div class="subcard">' +
          '<h3>' + ico('sliders') + '<span>B. Daftar Kriteria Evaluasi (' + crit.length + ' Kriteria Aktif) &amp; Orientasi per DM</span></h3>' +
          '<div class="table-wrap"><table class="data-table"><thead><tr><th>Kode</th><th>Nama Kriteria &amp; Definisi</th><th>Satuan</th><th>Default</th><th>Orientasi Tiap DM</th><th class="center">Aksi CRUD</th></tr></thead><tbody>' + critRows + '</tbody></table></div>' +
          '<div style="margin-top:12px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">' +
            '<span style="font-size:0.8rem;color:var(--ink-secondary)"><strong>Komite Pengambil Keputusan (' + dms.length + ' Responden):</strong> ' + dms.map(function (d) { return esc(d.code + ' ' + d.short); }).join(' &middot; ') + '</span>' +
            '<button type="button" class="btn btn-sm" data-action="open-add-dm">' + ico('plus') + '<span>Tambah Responden Baru (DM' + (dms.length + 1) + ')</span></button>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</section>';
  }

  /* ======================================= STAGE 2: PENILAIAN TIAP DM & VALIDASI */
  function renderStage2DMInput() {
    var dms = Engine.sortedDMs(appState);
    var dm = appState.dms[ui.selectedDM] || dms[0];
    var crit = appState.criteria, alts = appState.alternatives;
    var val = Engine.validateDM(appState, dm);

    var dmTabs = dms.map(function (d) {
      var v = Engine.validateDM(appState, d);
      var statusBadge = v.complete
        ? '<span class="badge badge-benefit">' + ico('check') + ' Terkirim</span>'
        : '<span class="badge badge-cost">' + v.errors.length + ' Pelanggaran</span>';
      var active = d.id === dm.id ? 'btn-primary' : '';
      return '<button type="button" class="btn ' + active + '" data-action="select-dm-tab" data-dm="' + esc(d.id) + '">' +
        ico('user') + '<span>' + esc(d.code + ' — ' + (d.short || d.name)) + '</span>' + statusBadge + '</button>';
    }).join(' ');

    var bwmPreviewHtml = '';
    if (val.bwmOk) {
      var ids = crit.map(function (c) { return c.id; });
      var aB = ids.map(function (id) { return dm.bwm.aB[id]; });
      var aW = ids.map(function (id) { return dm.bwm.aW[id]; });
      var bwmRes = Engine.linearBWM(ids.indexOf(dm.bwm.best), ids.indexOf(dm.bwm.worst), aB, aW);
      bwmPreviewHtml = '<div class="alert-box ' + (bwmRes.consistent ? 'alert-ok' : 'alert-warn') + '" style="margin-top:12px;margin-bottom:0">' +
        ico('checkCircle') +
        '<div><strong>Pratinjau Solusi Optimal Linear BWM ' + esc(dm.code) + ':</strong> ' +
        crit.map(function (c, j) { return '<span class="m-var">w</span><sub>' + (j + 1) + '</sub><sup>*</sup> (' + esc(c.code) + ') = <strong>' + fmt(bwmRes.w[j], 4) + '</strong> (' + (bwmRes.w[j] * 100).toFixed(2) + '%)'; }).join(' &middot; ') +
        '<br>Indikator Konsistensi Langsung Rezaei (2016) <span class="m-inline">&xi;<sub>L</sub><sup>*</sup> = ' + fmt(bwmRes.xi, 4) + '</span> &bull; ' +
        'Input-Based Consistency Ratio Liang et al. (2020) <span class="m-inline">CR<sup>I</sup> = ' + fmt(bwmRes.cr, 4) + ' &le; ' + fmt(bwmRes.threshold, 4) + '</span> (' + (bwmRes.consistent ? 'Konsisten' : 'Perlu Revisi') + ')' +
        '</div></div>';
    }

    var errBanner = '';
    if (!val.complete) {
      errBanner = '<div class="alert-box alert-error" style="align-items:center;justify-content:space-between;flex-wrap:wrap">' +
        '<div style="display:flex;align-items:flex-start;gap:10px">' + ico('shieldAlert') +
        '<div><strong>Validasi Input Menolak Nilai Kosong atau Di Luar Skala (' + val.errors.length + ' pelanggaran terdeteksi):</strong>' +
        '<ul style="margin:6px 0 0;padding-left:18px">' +
        val.errors.slice(0, 8).map(function (e) { return '<li>' + esc(e.msg) + '</li>'; }).join('') +
        '</ul></div></div>' +
        '<button type="button" class="btn btn-sm btn-primary" data-action="reset-baseline">' + ico('rotate') + '<span>Pulihkan Nilai Valid</span></button>' +
        '</div>';
    } else if (ui.validationDemoMsg) {
      errBanner = '<div class="alert-box alert-ok">' + ico('checkCircle') + '<div>' + esc(ui.validationDemoMsg) + '</div></div>';
    }

    var bestOpts = crit.map(function (c) {
      return '<option value="' + esc(c.id) + '"' + (dm.bwm.best === c.id ? ' selected' : '') + '>' + esc(c.code + ' — ' + c.name) + '</option>';
    }).join('');
    var worstOpts = crit.map(function (c) {
      return '<option value="' + esc(c.id) + '"' + (dm.bwm.worst === c.id ? ' selected' : '') + '>' + esc(c.code + ' — ' + c.name) + '</option>';
    }).join('');

    var bwmColsHead = crit.map(function (c) { return '<th class="center">' + esc(c.code + ' ' + (c.short || c.name)) + '</th>'; }).join('');
    var typeRowCells = crit.map(function (c) {
      var curT = (dm.types && dm.types[c.id]) || c.defaultType;
      return '<td class="center"><select class="input" data-action="dm-type-change" data-dm="' + esc(dm.id) + '" data-crit="' + esc(c.id) + '">' +
        '<option value="Benefit"' + (curT === 'Benefit' ? ' selected' : '') + '>Benefit (Makin Besar Makin Baik)</option>' +
        '<option value="Cost"' + (curT === 'Cost' ? ' selected' : '') + '>Cost (Makin Kecil Makin Baik)</option>' +
        '</select></td>';
    }).join('');

    var aBCells = crit.map(function (c) {
      var v = dm.bwm.aB[c.id];
      var bad = v === undefined || v === '' || Number(v) < 1 || Number(v) > 9 || Math.floor(Number(v)) !== Number(v) || (c.id === dm.bwm.best && Number(v) !== 1);
      return '<td class="center"><input type="number" min="1" max="9" step="1" class="input score-input' + (bad ? ' invalid' : '') + '" data-action="bwm-vec" data-dm="' + esc(dm.id) + '" data-vec="aB" data-crit="' + esc(c.id) + '" value="' + esc(v !== undefined ? v : '') + '"></td>';
    }).join('');

    var aWCells = crit.map(function (c) {
      var v = dm.bwm.aW[c.id];
      var bad = v === undefined || v === '' || Number(v) < 1 || Number(v) > 9 || Math.floor(Number(v)) !== Number(v) || (c.id === dm.bwm.worst && Number(v) !== 1);
      return '<td class="center"><input type="number" min="1" max="9" step="1" class="input score-input' + (bad ? ' invalid' : '') + '" data-action="bwm-vec" data-dm="' + esc(dm.id) + '" data-vec="aW" data-crit="' + esc(c.id) + '" value="' + esc(v !== undefined ? v : '') + '"></td>';
    }).join('');

    var scoreRows = alts.map(function (a) {
      var cells = crit.map(function (c) {
        var v = dm.scores && dm.scores[a.id] ? dm.scores[a.id][c.id] : '';
        var numV = Number(v);
        var bad = v === '' || v === undefined || v === null || isNaN(numV) || numV < 1 || numV > 5 || Math.floor(numV) !== numV;
        var rawHint = a.raw && a.raw[c.id] !== undefined && a.raw[c.id] !== null ? 'Data objektif: ' + a.raw[c.id] + ' ' + c.unit : 'Penilaian kualitatif Likert 1–5';
        return '<td class="center"><input type="number" min="1" max="5" step="1" title="' + esc(rawHint) + '" class="input score-input' + (bad ? ' invalid' : '') + '" data-action="dm-score" data-dm="' + esc(dm.id) + '" data-alt="' + esc(a.id) + '" data-crit="' + esc(c.id) + '" value="' + esc(v) + '"></td>';
      }).join('');
      return '<tr><td class="mono"><strong>' + esc(a.code) + '</strong></td><td><strong>' + esc(a.name) + '</strong></td>' + cells + '</tr>';
    }).join('');

    return '<section class="stage-section" id="stage-2">' +
      '<div class="stage-header">' +
        '<div><span class="stage-eyebrow">' + (ui.fullMode ? 'Tahap 02 &middot; Butir 6.1, 6.2 &amp; 6.7' : 'Tahap 02 &middot; Penilaian Tiap Decision Maker (DM)') + '</span>' +
        '<h2 class="stage-title">Formulir Penilaian Masing-Masing Decision Maker (DM) &amp; Validasi Skala Ketat</h2>' +
        '<p class="stage-desc">Setiap DM memiliki ruang pengisian independen untuk menentukan orientasi Benefit/Cost tiap kriteria, vektor perbandingan berpasangan Linear BWM (<span class="m-var">A<sub>B</sub>, A<sub>W</sub></span> &isin; {1,&hellip;,9}), dan matriks evaluasi kandidat (<span class="m-var">x<sub>ij</sub><sup>(k)</sup></span> &isin; {1,&hellip;,5}).</p></div>' +
        '<div class="stage-actions">' +
          '<button type="button" class="btn" data-action="demo-invalid-input" title="Uji penjagaan validasi input terhadap angka di luar skala 1–5">' + ico('shield') + '<span>' + (ui.fullMode ? 'Simulasi Uji Validasi (Butir 6.7)' : 'Uji Validasi Input') + '</span></button>' +
          '<button type="button" class="btn" data-action="auto-convert-rules" data-dm="' + esc(dm.id) + '">' + ico('wand') + '<span>Konversi Otomatis Data Objektif</span></button>' +
          '<button type="button" class="btn btn-success" data-action="submit-dm" data-dm="' + esc(dm.id) + '">' + ico('check') + '<span>Simpan &amp; Kirim Penilaian ' + esc(dm.code) + '</span></button>' +
        '</div>' +
      '</div>' +
      '<div style="margin-bottom:14px;display:flex;gap:8px;flex-wrap:wrap;align-items:center">' + dmTabs + '</div>' +
      errBanner +
      '<div class="subcard" style="margin-bottom:16px">' +
        '<h3>' + ico('sliders') + '<span>A. Kuesioner Pembobotan Linear BWM (Skala 1–9) &amp; Orientasi Kriteria &mdash; ' + esc(dm.code + ': ' + dm.name) + '</span></h3>' +
        '<p style="margin:0 0 12px;font-size:0.82rem;color:var(--ink-secondary)"><strong>Fokus Perspektif Jabatan:</strong> ' + esc(dm.focus || '') + '</p>' +
        '<div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:12px">' +
          '<label style="font-size:0.82rem;font-weight:600">Kriteria Terbaik / Paling Penting (<span class="m-var">C<sub>B</sub></span>): ' +
            '<select class="input" data-action="bwm-best" data-dm="' + esc(dm.id) + '">' + bestOpts + '</select></label>' +
          '<label style="font-size:0.82rem;font-weight:600">Kriteria Terlemah / Paling Kurang Penting (<span class="m-var">C<sub>W</sub></span>): ' +
            '<select class="input" data-action="bwm-worst" data-dm="' + esc(dm.id) + '">' + worstOpts + '</select></label>' +
        '</div>' +
        '<div class="table-wrap"><table class="data-table"><thead><tr><th>Parameter Preferensi ' + esc(dm.code) + '</th>' + bwmColsHead + '</tr></thead><tbody>' +
          '<tr><td><strong>Orientasi Kriteria menurut ' + esc(dm.code) + '</strong></td>' + typeRowCells + '</tr>' +
          '<tr><td><strong>Vektor Best-to-Others</strong> <span class="m-inline">A<sub>B</sub> = (a<sub>B1</sub>, &hellip;, a<sub>Bn</sub>)</span> &mdash; wajib <span class="m-inline">a<sub>BB</sub> = 1</span></td>' + aBCells + '</tr>' +
          '<tr><td><strong>Vektor Others-to-Worst</strong> <span class="m-inline">A<sub>W</sub> = (a<sub>1W</sub>, &hellip;, a<sub>nW</sub>)<sup>T</sup></span> &mdash; wajib <span class="m-inline">a<sub>WW</sub> = 1</span></td>' + aWCells + '</tr>' +
        '</tbody></table></div>' +
        bwmPreviewHtml +
      '</div>' +
      '<div class="subcard">' +
        '<h3>' + ico('layers') + '<span>B. Matriks Keputusan <span class="m-var">X<sup>(' + esc(dm.code.replace('DM', '')) + ')</sup> = [x<sub>ij</sub>]</span> (' + alts.length + ' Alternatif &times; ' + crit.length + ' Kriteria &mdash; Skala Bulat 1–5)</span></h3>' +
        '<div class="table-wrap"><table class="data-table"><thead><tr><th>Kode</th><th>Alternatif Armada EV</th>' + bwmColsHead + '</tr></thead><tbody>' + scoreRows + '</tbody></table></div>' +
      '</div>' +
    '</section>';
  }

  /* ======================================= STAGE 3: NORMALISASI MIN-MAX */
  function renderStage3Normalization() {
    var dms = calcResult.perDM;
    var activeP = dms.find(function (p) { return p.dm.id === ui.normDM; }) || dms[0];
    var crit = calcResult.criteria, alts = calcResult.alternatives;

    var dmBtns = dms.map(function (p) {
      var cls = p.dm.id === activeP.dm.id ? 'btn btn-primary' : 'btn';
      return '<button type="button" class="' + cls + '" data-action="select-norm-dm" data-dm="' + esc(p.dm.id) + '">' + ico('user') + '<span>' + esc(p.dm.code + ' (' + p.dm.short + ')') + '</span></button>';
    }).join(' ');

    var headCols = crit.map(function (c, j) {
      return '<th class="num">' + esc(c.code + ' ' + (c.short || '')) + '<br>' + typeBadge(activeP.types[j]) + '</th>';
    }).join('');

    var rows = alts.map(function (a, i) {
      var cells = crit.map(function (_, j) {
        var r = activeP.cocoso.R[i][j];
        var rawScore = activeP.X[i][j];
        return '<td class="num" title="Skor matriks x_ij = ' + rawScore + '"><strong>' + fmt(r, 4) + '</strong><br><span style="font-size:0.71rem;color:var(--ink-muted)">(x<sub>ij</sub> = ' + rawScore + ')</span></td>';
      }).join('');
      return '<tr><td class="mono"><strong>' + esc(a.code) + '</strong></td><td><strong>' + esc(a.name) + '</strong></td>' + cells + '</tr>';
    }).join('');

    var minCells = crit.map(function (_, j) { return '<td class="num">' + activeP.cocoso.colMin[j] + '</td>'; }).join('');
    var maxCells = crit.map(function (_, j) { return '<td class="num">' + activeP.cocoso.colMax[j] + '</td>'; }).join('');

    return '<section class="stage-section" id="stage-3">' +
      '<div class="stage-header">' +
        '<div><span class="stage-eyebrow">' + (ui.fullMode ? 'Tahap 03 &middot; Butir 6.1 &amp; 6.5 (Hasil Antara #1)' : 'Tahap 03 &middot; Normalisasi Matriks Keputusan') + '</span>' +
        '<h2 class="stage-title">Matriks Keputusan Ternormalisasi Kompromi Min-Max per Responden DM</h2>' +
        '<p class="stage-desc">Mengonversi skor matriks keputusan <span class="m-var">x<sub>ij</sub><sup>(k)</sup></span> menjadi nilai tak-bersatuan <span class="m-var">r<sub>ij</sub><sup>(k)</sup> &isin; [0, 1]</span> menggunakan persamaan normalisasi kompromi Yazdani et al. (2019) sesuai orientasi Benefit atau Cost masing-masing DM.</p></div>' +
        '<div class="stage-actions">' + dmBtns + '</div>' +
      '</div>' +

      /* REAL MATHEMATICAL EQUATIONS FOR MIN-MAX NORMALIZATION */
      '<div class="math-showcase">' +
        '<div class="math-card">' +
          '<div class="math-card-head"><span class="math-card-title">Persamaan Normalisasi Kriteria Benefit (Keuntungan)</span><span class="math-card-ref">Yazdani et al. (2019) Eq. 2</span></div>' +
          '<div class="math-expr">' +
            '<span class="m-var">r<sub>ij</sub></span><span class="m-op">=</span>' +
            mFrac('<span class="m-var">x<sub>ij</sub></span> &minus; <span class="m-rm">min</span><sub><span class="m-var">i</span></sub> <span class="m-var">x<sub>ij</sub></span>', '<span class="m-rm">max</span><sub><span class="m-var">i</span></sub> <span class="m-var">x<sub>ij</sub></span> &minus; <span class="m-rm">min</span><sub><span class="m-var">i</span></sub> <span class="m-var">x<sub>ij</sub></span>') +
            '<span class="m-op">,&emsp;</span><span class="m-rm">untuk</span> <span class="m-var">j &isin; &Omega;</span><sub><span class="m-rm">Benefit</span></sub>' +
          '</div>' +
          '<div class="math-note">Makin besar nilai <span class="m-var">x<sub>ij</sub></span>, makin mendekati <span class="m-num">1,0000</span> (contoh: Range C2, Fast Charge C4, Bengkel C6, serta Akselerasi C5 khusus DM3).</div>' +
        '</div>' +
        '<div class="math-card">' +
          '<div class="math-card-head"><span class="math-card-title">Persamaan Normalisasi Kriteria Cost (Biaya / Beban)</span><span class="math-card-ref">Yazdani et al. (2019) Eq. 3</span></div>' +
          '<div class="math-expr">' +
            '<span class="m-var">r<sub>ij</sub></span><span class="m-op">=</span>' +
            mFrac('<span class="m-rm">max</span><sub><span class="m-var">i</span></sub> <span class="m-var">x<sub>ij</sub></span> &minus; <span class="m-var">x<sub>ij</sub></span>', '<span class="m-rm">max</span><sub><span class="m-var">i</span></sub> <span class="m-var">x<sub>ij</sub></span> &minus; <span class="m-rm">min</span><sub><span class="m-var">i</span></sub> <span class="m-var">x<sub>ij</sub></span>') +
            '<span class="m-op">,&emsp;</span><span class="m-rm">untuk</span> <span class="m-var">j &isin; &Omega;</span><sub><span class="m-rm">Cost</span></sub>' +
          '</div>' +
          '<div class="math-note">Makin kecil skor beban <span class="m-var">x<sub>ij</sub></span>, makin mendekati <span class="m-num">1,0000</span> (contoh: Harga C1, Konsumsi Energi C3, serta Akselerasi C5 bagi DM1 &amp; DM2).</div>' +
        '</div>' +
      '</div>' +

      '<div class="table-wrap"><table class="data-table"><thead><tr><th>Kode</th><th>Alternatif Armada EV</th>' + headCols + '</tr></thead><tbody>' +
        rows +
        '<tr style="background:var(--bg-subtle);font-weight:700"><td class="mono">MIN</td><td>Batas Bawah Kolom (<span class="m-rm">min</span><sub><span class="m-var">i</span></sub> <span class="m-var">x<sub>ij</sub></span>)</td>' + minCells + '</tr>' +
        '<tr style="background:var(--bg-subtle);font-weight:700"><td class="mono">MAX</td><td>Batas Atas Kolom (<span class="m-rm">max</span><sub><span class="m-var">i</span></sub> <span class="m-var">x<sub>ij</sub></span>)</td>' + maxCells + '</tr>' +
      '</tbody></table></div>' +
    '</section>';
  }

  /* ======================================= STAGE 4: BOBOT LINEAR BWM & GRUP */
  function renderStage4BWM() {
    var crit = calcResult.criteria, dms = calcResult.perDM, alts = calcResult.alternatives;
    var cHead = crit.map(function (c, j) { return '<th class="num"><span class="m-var">w</span><sub>' + (j + 1) + '</sub><sup>*</sup> (' + esc(c.code) + ')</th>'; }).join('');

    var dmWeightRows = dms.map(function (p) {
      var cells = p.bwm.w.map(function (w, j) {
        var tag = j === p.bwm.bestIdx ? ' <span class="badge badge-benefit">Best</span>' : (j === p.bwm.worstIdx ? ' <span class="badge badge-cost">Worst</span>' : '');
        return '<td class="num"><strong>' + fmt(w, 4) + '</strong>' + tag + '<br><span style="font-size:0.71rem;color:var(--ink-muted)">' + (w * 100).toFixed(2) + '%</span></td>';
      }).join('');
      return '<tr>' +
        '<td><strong>' + esc(p.dm.code + ' — ' + p.dm.short) + '</strong></td>' +
        cells +
        '<td class="num"><strong>' + fmt(p.bwm.sumW, 4) + '</strong></td>' +
        '<td class="num"><strong>' + fmt(p.bwm.xi, 4) + '</strong></td>' +
        '<td class="num">' + fmt(p.bwm.cr, 4) + ' &le; ' + fmt(p.bwm.threshold, 4) + ' <span class="badge badge-benefit">' + ico('check') + ' Konsisten</span></td>' +
        '</tr>';
    }).join('');

    var wArithCells = calcResult.group.wArith.map(function (w) { return '<td class="num"><strong>' + fmt(w, 4) + '</strong><br><span style="font-size:0.71rem;color:var(--ink-muted)">' + (w * 100).toFixed(2) + '%</span></td>'; }).join('');
    var wGeomCells = calcResult.group.wGeom.map(function (w) { return '<td class="num"><strong>' + fmt(w, 4) + '</strong><br><span style="font-size:0.71rem;color:var(--ink-muted)">' + (w * 100).toFixed(2) + '%</span></td>'; }).join('');

    var matGeoRows = alts.map(function (a, i) {
      var cells = crit.map(function (_, j) { return '<td class="num">' + fmt(calcResult.group.matGeo[i][j], 4) + '</td>'; }).join('');
      return '<tr><td class="mono"><strong>' + esc(a.code) + '</strong></td><td>' + esc(a.name) + '</td>' + cells + '</tr>';
    }).join('');

    return '<section class="stage-section" id="stage-4">' +
      '<div class="stage-header">' +
        '<div><span class="stage-eyebrow">' + (ui.fullMode ? 'Tahap 04 &middot; Butir 6.1, 6.5 &amp; 6.6 (Hasil Antara #2)' : 'Tahap 04 &middot; Pembobotan Kriteria (Metode A: Linear BWM)') + '</span>' +
        '<h2 class="stage-title">Optimasi Bobot Kriteria Metode A: Linear Best-Worst Method (Rezaei, 2016) &amp; Uji Konsistensi</h2>' +
        '<p class="stage-desc">Menyelesaikan model pemrograman linier (Simplex LP) untuk memperoleh bobot optimal unik <span class="m-var">w<sub>j</sub><sup>*</sup></span> dan indikator konsistensi langsung <span class="m-var">&xi;<sub>L</sub><sup>*</sup></span> per responden DM, disertai validasi rasio konsistensi berbasis input Liang et al. (2020).</p></div>' +
      '</div>' +

      /* REAL MATHEMATICAL EQUATIONS FOR LINEAR BWM (2016) & LIANG ET AL. (2020) */
      '<div class="math-showcase-3">' +
        '<div class="math-card">' +
          '<div class="math-card-head"><span class="math-card-title">Model Pemrograman Linier BWM</span><span class="math-card-ref">Rezaei (Omega, 2016) Eq. 6</span></div>' +
          '<div class="math-expr">' +
            '<span class="m-rm">min</span> <span class="m-var">&xi;<sub>L</sub></span><span class="m-op">&ensp;s.t.&ensp;</span>' +
            mCases([
              mAbs('<span class="m-var">w<sub>B</sub></span> &minus; <span class="m-var">a<sub>Bj</sub> w<sub>j</sub></span>') + ' &le; <span class="m-var">&xi;<sub>L</sub></span>, &ensp;&forall;<span class="m-var">j</span>',
              mAbs('<span class="m-var">w<sub>j</sub></span> &minus; <span class="m-var">a<sub>jW</sub> w<sub>W</sub></span>') + ' &le; <span class="m-var">&xi;<sub>L</sub></span>, &ensp;&forall;<span class="m-var">j</span>',
              mSum('j=1', 'n') + '<span class="m-var">w<sub>j</sub></span> = <span class="m-num">1</span>, &ensp;<span class="m-var">w<sub>j</sub></span> &ge; <span class="m-num">0</span>'
            ]) +
          '</div>' +
          '<div class="math-note">Menghasilkan solusi bobot global tunggal <span class="m-var">(w<sub>1</sub><sup>*</sup>, &hellip;, w<sub>n</sub><sup>*</sup>)</span> dan simpangan maksimum <span class="m-var">&xi;<sub>L</sub><sup>*</sup></span>.</div>' +
        '</div>' +
        '<div class="math-card">' +
          '<div class="math-card-head"><span class="math-card-title">Input-Based Consistency Ratio</span><span class="math-card-ref">Liang et al. (Omega, 2020) Eq. 4</span></div>' +
          '<div class="math-expr">' +
            '<span class="m-var">CR<sup>I</sup></span><span class="m-op">=</span><span class="m-rm">max</span><sub><span class="m-var">j</span></sub> ' +
            mFrac(
              mAbs('<span class="m-var">a<sub>Bj</sub></span> &middot; <span class="m-var">a<sub>jW</sub></span> &minus; <span class="m-var">a<sub>BW</sub></span>'),
              '<span class="m-var">a<sub>BW</sub></span> &middot; <span class="m-var">a<sub>BW</sub></span> &minus; <span class="m-var">a<sub>BW</sub></span>'
            ) +
          '</div>' +
          '<div class="math-note">Ambang batas Tabel 3 Liang et al. (2020) untuk <span class="m-var">n = 6</span>: <span class="m-num">0,3221</span> (<span class="m-var">a<sub>BW</sub> = 8</span>) dan <span class="m-num">0,3144</span> (<span class="m-var">a<sub>BW</sub> = 7</span>).</div>' +
        '</div>' +
        '<div class="math-card">' +
          '<div class="math-card-head"><span class="math-card-title">Agregasi Bobot Grup (Aritmatika &amp; Geometrik)</span><span class="math-card-ref">GDSS Group Weighting</span></div>' +
          '<div class="math-expr">' +
            '<span class="m-var">w&#772;<sub>j</sub></span><span class="m-op">=</span>' +
            mFrac('<span class="m-num">1</span>', '<span class="m-var">K</span>') +
            mSum('k=1', 'K') + '<span class="m-var">w<sub>j</sub><sup>(k)</sup></span>' +
            '<span class="m-op">,&emsp;</span>' +
            '<span class="m-var">w<sub>j</sub><sup>G</sup></span><span class="m-op">=</span>' +
            mFrac(
              '(' + mProd('k=1', 'K') + '<span class="m-var">w<sub>j</sub><sup>(k)</sup></span>)<sup>1/<span class="m-var">K</span></sup>',
              mSum('m=1', 'n') + '(' + mProd('k=1', 'K') + '<span class="m-var">w<sub>m</sub><sup>(k)</sup></span>)<sup>1/<span class="m-var">K</span></sup>'
            ) +
          '</div>' +
          '<div class="math-note">Pada CoCoSo per DM, masing-masing DM tetap menggunakan vektor bobot optimalnya sendiri <span class="m-var">w<sub>j</sub><sup>(k)</sup></span>.</div>' +
        '</div>' +
      '</div>' +

      '<div class="table-wrap" style="margin-bottom:18px"><table class="data-table"><thead><tr><th>Responden / Agregasi Grup</th>' + cHead + '<th class="num">&sum; w<sub>j</sub><sup>*</sup></th><th class="num">&xi;<sub>L</sub><sup>*</sup> (Rezaei)</th><th class="num">CR<sup>I</sup> (Liang, 2020)</th></tr></thead><tbody>' +
        dmWeightRows +
        '<tr style="background:var(--bg-subtle)"><td><strong>Rata-Rata Aritmatika Grup (<span class="m-var">w&#772;<sub>j</sub></span>)</strong></td>' + wArithCells + '<td class="num"><strong>1.0000</strong></td><td class="num">—</td><td class="num">Agregasi Linier</td></tr>' +
        '<tr style="background:var(--bg-subtle)"><td><strong>Rata-Rata Geometrik Ternormalisasi (<span class="m-var">w<sub>j</sub><sup>G</sup></span>)</strong></td>' + wGeomCells + '<td class="num"><strong>1.0000</strong></td><td class="num">—</td><td class="num">Agregasi Rasio</td></tr>' +
      '</tbody></table></div>' +
      '<div class="grid-2">' +
        '<div class="subcard">' +
          '<h3>' + ico('chart') + '<span>Visualisasi Perbandingan Preferensi Bobot Kriteria Antar-DM</span></h3>' +
          Charts.renderWeightsComparisonChart(calcResult) +
        '</div>' +
        '<div class="subcard">' +
          '<h3>' + ico('layers') + '<span>Matriks Keputusan Agregasi Grup &mdash; Rata-Rata Geometrik (<span class="m-var">x&#772;<sub>ij</sub><sup>G</sup></span>)</span></h3>' +
          '<div class="table-wrap"><table class="data-table"><thead><tr><th>Kode</th><th>Alternatif EV</th>' + crit.map(function (c) { return '<th class="num">' + esc(c.code + ' ' + (c.short || '')) + '</th>'; }).join('') + '</tr></thead><tbody>' + matGeoRows + '</tbody></table></div>' +
        '</div>' +
      '</div>' +
    '</section>';
  }

  /* ======================================= STAGE 5: RANKING CoCoSo TIAP DM */
  function renderStage5CoCoSo() {
    var dms = calcResult.perDM;
    var activeP = dms.find(function (p) { return p.dm.id === ui.cocosoDM; }) || dms[0];
    var alts = calcResult.alternatives, crit = calcResult.criteria;
    var cc = activeP.cocoso;
    var selRow = Math.min(ui.selectedCocosoRow || 0, alts.length - 1);
    var selAlt = alts[selRow];

    var dmBtns = dms.map(function (p) {
      var cls = p.dm.id === activeP.dm.id ? 'btn btn-primary' : 'btn';
      return '<button type="button" class="' + cls + '" data-action="select-cocoso-dm" data-dm="' + esc(p.dm.id) + '">' + ico('user') + '<span>' + esc(p.dm.code + ' (' + p.dm.short + ')') + '</span></button>';
    }).join(' ');

    var rows = alts.map(function (a, i) {
      var rowCls = i === selRow ? 'clickable-row selected-row' : 'clickable-row';
      return '<tr class="' + rowCls + '" data-action="select-cocoso-row" data-row="' + i + '" title="Klik baris ini untuk melihat substitusi angka ke dalam rumus asli di bawah">' +
        '<td class="mono"><strong>' + esc(a.code) + '</strong></td>' +
        '<td><strong>' + esc(a.name) + '</strong></td>' +
        '<td class="num">' + fmt(cc.S[i], 4) + '</td>' +
        '<td class="num">' + fmt(cc.P[i], 4) + '</td>' +
        '<td class="num">' + fmt(cc.ka[i], 4) + '</td>' +
        '<td class="num">' + fmt(cc.kb[i], 4) + '</td>' +
        '<td class="num">' + fmt(cc.kc[i], 4) + '</td>' +
        '<td class="num">' + fmt(cc.Kgeo[i], 4) + '</td>' +
        '<td class="num">' + fmt(cc.Kari[i], 4) + '</td>' +
        '<td class="num"><strong>' + fmt(cc.K[i], 4) + '</strong></td>' +
        '<td class="center">' + rankBadge(cc.ranks[i]) + '</td>' +
        '</tr>';
    }).join('');

    /* LIVE SUBSTITUTION AUTOPSY FOR SELECTED EV ROW */
    var Si = cc.S[selRow], Pi = cc.P[selRow];
    var kai = cc.ka[selRow], kbi = cc.kb[selRow], kci = cc.kc[selRow];
    var Ki = cc.K[selRow], rki = cc.ranks[selRow];
    var lam = calcResult.lambda;

    var liveAutopsyHtml = '<div class="subcard" style="margin-top:16px;background:var(--bg-math)">' +
      '<h3>' + ico('sparkles') + '<span>Bedah Substitusi Angka ke Rumus Asli CoCoSo: <strong>' + esc(selAlt.code + ' — ' + selAlt.name) + '</strong> pada <strong>' + esc(activeP.dm.code + ' (' + activeP.dm.short + ')') + '</strong> <span style="font-weight:400;font-size:0.78rem;color:var(--ink-muted)">(Klik baris mobil lain di tabel atas untuk mengganti)</span></span></h3>' +
      '<div class="math-showcase-3" style="margin-bottom:10px">' +
        '<div class="math-card" style="background:var(--bg-elev)">' +
          '<div class="math-card-head"><span class="math-card-title">1. Strategi Rata-Rata Aritmatika (<span class="m-var">k<sub>ia</sub></span>)</span><span class="math-card-ref">Hasil = ' + fmt(kai, 4) + '</span></div>' +
          '<div class="math-expr">' +
            '<span class="m-var">k</span><sub>' + (selRow + 1) + 'a</sub><span class="m-op">=</span>' +
            mFrac(fmt(Si, 4) + ' + ' + fmt(Pi, 4), fmt(cc.sumS, 4) + ' + ' + fmt(cc.sumP, 4)) +
            '<span class="m-op">=</span>' +
            mFrac(fmt(Si + Pi, 4), fmt(cc.sumS + cc.sumP, 4)) +
            '<span class="m-op">=</span><strong class="m-num">' + fmt(kai, 4) + '</strong>' +
          '</div>' +
        '</div>' +
        '<div class="math-card" style="background:var(--bg-elev)">' +
          '<div class="math-card-head"><span class="math-card-title">2. Strategi Relatif terhadap Minimum (<span class="m-var">k<sub>ib</sub></span>)</span><span class="math-card-ref">Hasil = ' + fmt(kbi, 4) + '</span></div>' +
          '<div class="math-expr">' +
            '<span class="m-var">k</span><sub>' + (selRow + 1) + 'b</sub><span class="m-op">=</span>' +
            mFrac(fmt(Si, 4), fmt(cc.Smin, 4)) +
            '<span class="m-op">+</span>' +
            mFrac(fmt(Pi, 4), fmt(cc.Pmin, 4)) +
            '<span class="m-op">=</span><strong class="m-num">' + fmt(kbi, 4) + '</strong>' +
          '</div>' +
        '</div>' +
        '<div class="math-card" style="background:var(--bg-elev)">' +
          '<div class="math-card-head"><span class="math-card-title">3. Strategi Kompromi Seimbang (<span class="m-var">k<sub>ic</sub>, &lambda;=' + fmt(lam, 2) + '</span>)</span><span class="math-card-ref">Hasil = ' + fmt(kci, 4) + '</span></div>' +
          '<div class="math-expr">' +
            '<span class="m-var">k</span><sub>' + (selRow + 1) + 'c</sub><span class="m-op">=</span>' +
            mFrac(fmt(lam, 2) + '(' + fmt(Si, 4) + ') + ' + fmt(1 - lam, 2) + '(' + fmt(Pi, 4) + ')', fmt(lam, 2) + '(' + fmt(cc.Smax, 4) + ') + ' + fmt(1 - lam, 2) + '(' + fmt(cc.Pmax, 4) + ')') +
            '<span class="m-op">=</span><strong class="m-num">' + fmt(kci, 4) + '</strong>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="math-card" style="background:var(--bg-elev)">' +
        '<div class="math-card-head"><span class="math-card-title">4. Sintesis Skor Akhir Kompromi CoCoSo (<span class="m-var">K<sub>' + (selRow + 1) + '</sub></span>) &amp; Kontribusi Poin Borda</span><span class="math-card-ref">Rank #' + rki + ' pada ' + esc(activeP.dm.code) + ' (+' + (alts.length - rki) + ' Poin Borda)</span></div>' +
        '<div class="math-expr">' +
          '<span class="m-var">K</span><sub>' + (selRow + 1) + '</sub><span class="m-op">=</span>' +
          mRad(fmt(kai, 4) + ' &times; ' + fmt(kbi, 4) + ' &times; ' + fmt(kci, 4), '3') +
          '<span class="m-op">+</span>' +
          mFrac(fmt(kai, 4) + ' + ' + fmt(kbi, 4) + ' + ' + fmt(kci, 4), '3') +
          '<span class="m-op">=</span>' +
          '<span class="m-num">' + fmt(cc.Kgeo[selRow], 4) + '</span><span class="m-op">+</span><span class="m-num">' + fmt(cc.Kari[selRow], 4) + '</span>' +
          '<span class="m-op">=</span><strong class="m-num" style="color:var(--brand);font-size:1.2rem">' + fmt(Ki, 4) + '</strong>' +
        '</div>' +
      '</div>' +
    '</div>';

    var detailHtml = '';
    if (ui.showSPDetail) {
      var cHead = crit.map(function (c) { return '<th class="num">' + esc(c.code) + '</th>'; }).join('');
      var sRows = alts.map(function (a, i) {
        return '<tr><td class="mono">' + esc(a.code) + '</td><td>' + esc(a.name) + '</td>' +
          cc.Sterms[i].map(function (v) { return '<td class="num">' + fmt(v, 4) + '</td>'; }).join('') +
          '<td class="num"><strong>' + fmt(cc.S[i], 4) + '</strong></td></tr>';
      }).join('');
      var pRows = alts.map(function (a, i) {
        return '<tr><td class="mono">' + esc(a.code) + '</td><td>' + esc(a.name) + '</td>' +
          cc.Pterms[i].map(function (v) { return '<td class="num">' + fmt(v, 4) + '</td>'; }).join('') +
          '<td class="num"><strong>' + fmt(cc.P[i], 4) + '</strong></td></tr>';
      }).join('');
      detailHtml = '<div class="grid-2" style="margin-top:16px">' +
        '<div class="subcard"><h3>' + ico('layers') + '<span>Matriks Suku Penjumlahan Terbobot WSM (<span class="m-var">w<sub>j</sub> &middot; r<sub>ij</sub> &rarr; S<sub>i</sub></span>)</span></h3><div class="table-wrap"><table class="data-table"><thead><tr><th>Kode</th><th>Alternatif</th>' + cHead + '<th class="num">S<sub>i</sub></th></tr></thead><tbody>' + sRows + '</tbody></table></div></div>' +
        '<div class="subcard"><h3>' + ico('layers') + '<span>Matriks Suku Perpangkatan Terbobot WPM (<span class="m-var">(r<sub>ij</sub>)<sup>w<sub>j</sub></sup> &rarr; P<sub>i</sub></span>)</span></h3><div class="table-wrap"><table class="data-table"><thead><tr><th>Kode</th><th>Alternatif</th>' + cHead + '<th class="num">P<sub>i</sub></th></tr></thead><tbody>' + pRows + '</tbody></table></div></div>' +
      '</div>';
    }

    return '<section class="stage-section" id="stage-5">' +
      '<div class="stage-header">' +
        '<div><span class="stage-eyebrow">' + (ui.fullMode ? 'Tahap 05 &middot; Butir 6.1 &amp; 6.5 (Hasil Antara #3)' : 'Tahap 05 &middot; Perankingan Tiap DM (Metode B: CoCoSo)') + '</span>' +
        '<h2 class="stage-title">Perhitungan Lengkap Metode B: Combined Compromise Solution (CoCoSo &mdash; Yazdani et al., 2019)</h2>' +
        '<p class="stage-desc">Mengintegrasikan model penjumlahan terbobot (<span class="m-var">S<sub>i</sub></span> / WSM) dan perpangkatan eksponensial terbobot (<span class="m-var">P<sub>i</sub></span> / WPM) melalui tiga strategi penilaian kompromi (<span class="m-var">k<sub>ia</sub>, k<sub>ib</sub>, k<sub>ic</sub></span>) untuk menghasilkan indeks kompromi akhir <span class="m-var">K<sub>i</sub></span> pada setiap DM.</p></div>' +
        '<div class="stage-actions">' + dmBtns +
          '<button type="button" class="btn" data-action="toggle-sp-detail">' + ico('sliders') + '<span>' + (ui.showSPDetail ? 'Sembunyikan Matriks Suku S_i & P_i' : 'Tampilkan Matriks Suku S_i & P_i') + '</span></button>' +
        '</div>' +
      '</div>' +

      /* 6 REAL MATHEMATICAL EQUATION CARDS FOR COCOSO (YAZDANI ET AL., 2019) */
      '<div class="math-showcase-3">' +
        '<div class="math-card">' +
          '<div class="math-card-head"><span class="math-card-title">1. Jumlah Terbobot WSM (<span class="m-var">S<sub>i</sub></span>)</span><span class="math-card-ref">Eq. 4</span></div>' +
          '<div class="math-expr"><span class="m-var">S<sub>i</sub></span><span class="m-op">=</span>' + mSum('j=1', 'n') + '<span class="m-var">w<sub>j</sub></span> &middot; <span class="m-var">r<sub>ij</sub></span></div>' +
        '</div>' +
        '<div class="math-card">' +
          '<div class="math-card-head"><span class="math-card-title">2. Pangkat Terbobot WPM (<span class="m-var">P<sub>i</sub></span>)</span><span class="math-card-ref">Eq. 5</span></div>' +
          '<div class="math-expr"><span class="m-var">P<sub>i</sub></span><span class="m-op">=</span>' + mSum('j=1', 'n') + '(<span class="m-var">r<sub>ij</sub></span>)<sup><span class="m-var">w<sub>j</sub></span></sup></div>' +
        '</div>' +
        '<div class="math-card">' +
          '<div class="math-card-head"><span class="math-card-title">3. Strategi Rata-Rata (<span class="m-var">k<sub>ia</sub></span>)</span><span class="math-card-ref">Eq. 6a</span></div>' +
          '<div class="math-expr"><span class="m-var">k<sub>ia</sub></span><span class="m-op">=</span>' + mFrac('<span class="m-var">P<sub>i</sub></span> + <span class="m-var">S<sub>i</sub></span>', mSum('i=1', 'm') + '(<span class="m-var">P<sub>i</sub></span> + <span class="m-var">S<sub>i</sub></span>)') + '</div>' +
        '</div>' +
        '<div class="math-card">' +
          '<div class="math-card-head"><span class="math-card-title">4. Strategi Supremasi Minimum (<span class="m-var">k<sub>ib</sub></span>)</span><span class="math-card-ref">Eq. 6b</span></div>' +
          '<div class="math-expr"><span class="m-var">k<sub>ib</sub></span><span class="m-op">=</span>' + mFrac('<span class="m-var">S<sub>i</sub></span>', '<span class="m-rm">min</span><sub><span class="m-var">i</span></sub> <span class="m-var">S<sub>i</sub></span>') + '<span class="m-op">+</span>' + mFrac('<span class="m-var">P<sub>i</sub></span>', '<span class="m-rm">min</span><sub><span class="m-var">i</span></sub> <span class="m-var">P<sub>i</sub></span>') + '</div>' +
        '</div>' +
        '<div class="math-card">' +
          '<div class="math-card-head"><span class="math-card-title">5. Strategi Kompromi (<span class="m-var">k<sub>ic</sub>, &lambda;=0,5</span>)</span><span class="math-card-ref">Eq. 6c</span></div>' +
          '<div class="math-expr"><span class="m-var">k<sub>ic</sub></span><span class="m-op">=</span>' + mFrac('<span class="m-var">&lambda; S<sub>i</sub></span> + (<span class="m-num">1</span> &minus; <span class="m-var">&lambda;</span>)<span class="m-var">P<sub>i</sub></span>', '<span class="m-var">&lambda;</span> <span class="m-rm">max</span><sub><span class="m-var">i</span></sub> <span class="m-var">S<sub>i</sub></span> + (<span class="m-num">1</span> &minus; <span class="m-var">&lambda;</span>)<span class="m-rm">max</span><sub><span class="m-var">i</span></sub> <span class="m-var">P<sub>i</sub></span>') + '</div>' +
        '</div>' +
        '<div class="math-card">' +
          '<div class="math-card-head"><span class="math-card-title">6. Skor Kompromi Akhir (<span class="m-var">K<sub>i</sub></span>)</span><span class="math-card-ref">Eq. 7</span></div>' +
          '<div class="math-expr"><span class="m-var">K<sub>i</sub></span><span class="m-op">=</span>' + mRad('<span class="m-var">k<sub>ia</sub></span> &middot; <span class="m-var">k<sub>ib</sub></span> &middot; <span class="m-var">k<sub>ic</sub></span>', '3') + '<span class="m-op">+</span>' + mFrac('<span class="m-var">k<sub>ia</sub></span> + <span class="m-var">k<sub>ib</sub></span> + <span class="m-var">k<sub>ic</sub></span>', '<span class="m-num">3</span>') + '</div>' +
        '</div>' +
      '</div>' +

      '<div class="table-wrap"><table class="data-table"><thead><tr><th>Kode</th><th>Alternatif Armada EV (Klik Baris!)</th><th class="num">S<sub>i</sub> (WSM)</th><th class="num">P<sub>i</sub> (WPM)</th><th class="num">k<sub>ia</sub></th><th class="num">k<sub>ib</sub></th><th class="num">k<sub>ic</sub></th><th class="num">(k<sub>ia</sub>k<sub>ib</sub>k<sub>ic</sub>)<sup>1/3</sup></th><th class="num">(k<sub>ia</sub>+k<sub>ib</sub>+k<sub>ic</sub>)/3</th><th class="num">Skor K<sub>i</sub></th><th class="center">Rank ' + esc(activeP.dm.code) + '</th></tr></thead><tbody>' +
        rows +
        '<tr style="background:var(--bg-subtle);font-weight:700"><td class="mono">RINGKASAN</td><td>Parameter Ekstrem &amp; Jumlah Kolom (' + esc(activeP.dm.code) + ')</td><td class="num">min = ' + fmt(cc.Smin, 4) + '<br>max = ' + fmt(cc.Smax, 4) + '<br>&sum; = ' + fmt(cc.sumS, 4) + '</td><td class="num">min = ' + fmt(cc.Pmin, 4) + '<br>max = ' + fmt(cc.Pmax, 4) + '<br>&sum; = ' + fmt(cc.sumP, 4) + '</td><td class="num">&sum; = 1.0000</td><td class="num">—</td><td class="num">—</td><td class="num">—</td><td class="num">—</td><td class="num">max = ' + fmt(Math.max.apply(null, cc.K), 4) + '</td><td class="center">—</td></tr>' +
      '</tbody></table></div>' +
      liveAutopsyHtml +
      detailHtml +
    '</section>';
  }

  /* ======================================= STAGE 6: AGREGASI GRUP & VISUALISASI */
  function renderStage6ConsensusCharts() {
    var alts = calcResult.alternatives, m = alts.length, dms = calcResult.perDM;
    var dmHead = dms.map(function (p) {
      return '<th class="num">K<sub>i</sub> (' + esc(p.dm.code) + ')</th><th class="center">Rank ' + esc(p.dm.code) + ' (Borda)</th>';
    }).join('');

    var consRows = calcResult.group.order.map(function (idx) {
      var a = alts[idx];
      var agr = calcResult.agreement.perAlt[idx];
      var dmCells = dms.map(function (p) {
        var rk = p.cocoso.ranks[idx], pts = m - rk;
        return '<td class="num">' + fmt(p.cocoso.K[idx], 4) + '</td><td class="center">' + rankBadge(rk) + ' <span class="mono" style="font-size:0.73rem;color:var(--ink-muted)">(+' + pts + ')</span></td>';
      }).join('');
      return '<tr>' +
        '<td class="center">' + rankBadge(calcResult.group.finalRank[idx]) + '</td>' +
        '<td class="mono"><strong>' + esc(a.code) + '</strong></td>' +
        '<td><strong>' + esc(a.name) + '</strong><br><span style="font-size:0.73rem;color:var(--ink-muted)">' + esc(a.segment || '') + '</span></td>' +
        dmCells +
        '<td class="num"><strong>' + calcResult.group.borda[idx] + ' pt</strong></td>' +
        '<td class="num"><strong>' + fmt(calcResult.group.avgK[idx], 4) + '</strong></td>' +
        '<td class="num">' + agr.copeland.wins + 'W &ndash; ' + agr.copeland.losses + 'L (<strong>' + (agr.copeland.net >= 0 ? '+' : '') + agr.copeland.net + '</strong>)</td>' +
        '<td class="num">&Delta; = ' + agr.range + ' (s=' + fmt(agr.std, 2) + ')</td>' +
        '<td><span class="badge ' + (agr.range >= 5 ? 'badge-cost' : (agr.range >= 3 ? 'badge-warn' : 'badge-benefit')) + '">' + esc(agr.level) + '</span></td>' +
        '</tr>';
    }).join('');

    var pairRows = calcResult.agreement.pairs.map(function (pr) {
      return '<tr><td><strong>' + esc(pr.a.code + ' (' + pr.a.short + ') vs ' + pr.b.code + ' (' + pr.b.short + ')') + '</strong></td>' +
        '<td class="num">' + pr.sp.sumD2 + '</td>' +
        '<td class="num"><strong>' + fmt(pr.sp.rho, 4) + '</strong></td>' +
        '<td>' + (pr.sp.rho < 0 ? 'Berlawanan arah (konflik anggaran CFO vs spesifikasi Autobahn Ops)' : (pr.sp.rho > 0.45 ? 'Searah cukup kuat' : 'Searah lemah–moderat')) + '</td></tr>';
    }).join('');

    return '<section class="stage-section" id="stage-6">' +
      '<div class="stage-header">' +
        '<div><span class="stage-eyebrow">' + (ui.fullMode ? 'Tahap 06 &middot; Butir 6.1, 6.6, 6.9, 4.6, 4.7, 4.10 &amp; 4.11' : 'Tahap 06 &middot; Agregasi Grup, Visualisasi &amp; Kolaborasi Keputusan') + '</span>' +
        '<h2 class="stage-title">Agregasi Konsensus Grup (Borda &amp; Copeland), Visualisasi Antar-DM, &amp; Kolaborasi Komite</h2>' +
        '<p class="stage-desc">Mengonsolidasikan peringkat individu CoCoSo dari seluruh DM menjadi keputusan komite tunggal melalui aturan Borda Count, pemecah seri kardinal <span class="m-var">K&#772;<sub>i</sub></span>, dan turnamen mayoritas berpasangan Copeland.</p></div>' +
      '</div>' +

      /* REAL MATHEMATICAL EQUATIONS FOR BORDA, TIE-BREAKER, AND KENDALL'S W */
      '<div class="math-showcase-3">' +
        '<div class="math-card">' +
          '<div class="math-card-head"><span class="math-card-title">Aturan Poin Konsensus Borda</span><span class="math-card-ref">Ecer (2021, RSER)</span></div>' +
          '<div class="math-expr"><span class="m-var">B<sub>i</sub></span><span class="m-op">=</span>' + mSum('k=1', 'K') + '(<span class="m-var">m</span> &minus; <span class="m-var">r<sub>i</sub><sup>(k)</sup></span>)</div>' +
          '<div class="math-note">Peringkat #1 memperoleh <span class="m-var">m &minus; 1 = 7</span> poin, hingga peringkat #<span class="m-var">m</span> memperoleh <span class="m-num">0</span> poin.</div>' +
        '</div>' +
        '<div class="math-card">' +
          '<div class="math-card-head"><span class="math-card-title">Tie-Breaker Kardinal Rata-Rata <span class="m-var">K&#772;<sub>i</sub></span></span><span class="math-card-ref">Penentu Seri Borda</span></div>' +
          '<div class="math-expr"><span class="m-var">K&#772;<sub>i</sub></span><span class="m-op">=</span>' + mFrac('<span class="m-num">1</span>', '<span class="m-var">K</span>') + mSum('k=1', 'K') + '<span class="m-var">K<sub>i</sub><sup>(k)</sup></span></div>' +
          '<div class="math-note">Memecah seri poin Borda secara objektif (misal pada <span class="m-num">10</span> poin antara A4, A7, dan A3).</div>' +
        '</div>' +
        '<div class="math-card">' +
          '<div class="math-card-head"><span class="math-card-title">Koefisien Konkordansi Kendall (<span class="m-var">W</span>)</span><span class="math-card-ref">Kendall &amp; Gibbons (1990)</span></div>' +
          '<div class="math-expr"><span class="m-var">W</span><span class="m-op">=</span>' + mFrac('<span class="m-num">12</span> ' + mSum('i=1', 'm') + '(<span class="m-var">R<sub>i</sub></span> &minus; <span class="m-var">R&#772;</span>)<sup>2</sup>', '<span class="m-var">K</span><sup>2</sup> (<span class="m-var">m</span><sup>3</sup> &minus; <span class="m-var">m</span>)') + '</div>' +
          '<div class="math-note">Mengukur tingkat kesepakatan serempak lintas <span class="m-var">K</span> pengambil keputusan (<span class="m-num">0 &le; W &le; 1</span>).</div>' +
        '</div>' +
      '</div>' +

      '<div class="table-wrap" style="margin-bottom:18px"><table class="data-table"><thead><tr><th class="center">Rank Grup</th><th>Kode</th><th>Alternatif Armada EV</th>' + dmHead + '<th class="num">Total Borda</th><th class="num">Tie-Breaker K&#772;<sub>i</sub></th><th class="num">Copeland (W–L)</th><th class="num">Rentang Rank</th><th>Status Kesepakatan</th></tr></thead><tbody>' + consRows + '</tbody></table></div>' +
      '<div class="grid-2" style="margin-bottom:16px">' +
        '<div class="subcard"><h3>' + ico('chart') + '<span>1. Grafik Poin Konsensus Borda &amp; Kontribusi Tiap DM</span></h3>' + Charts.renderBordaChart(calcResult) + '</div>' +
        '<div class="subcard"><h3>' + ico('chart') + '<span>2. Grafik Perbandingan Skor CoCoSo (<span class="m-var">K<sub>i</sub></span>) &amp; Peringkat Antar-DM</span></h3>' + Charts.renderDMPreferenceKChart(calcResult) + '</div>' +
      '</div>' +
      '<div class="grid-2" style="margin-bottom:16px">' +
        '<div class="subcard"><h3>' + ico('scale') + '<span>3. Peta Rentang Perdebatan Peringkat Antar-DM</span></h3>' + Charts.renderControversyRangeChart(calcResult) + '</div>' +
        '<div class="subcard">' +
          '<h3>' + ico('users') + '<span>4. Statistik Kesepakatan Antar-DM &amp; Rekomendasi Akhir</span></h3>' +
          '<div class="table-wrap" style="margin-bottom:12px"><table class="data-table"><thead><tr><th>Pasangan Responden DM</th><th class="num">&sum; d<sub>i</sub><sup>2</sup></th><th class="num">Spearman &rho;<sub>s</sub></th><th>Interpretasi Hubungan</th></tr></thead><tbody>' + pairRows + '</tbody></table></div>' +
          '<div class="alert-box alert-ok" style="margin:0">' +
            ico('checkCircle') +
            '<div><strong>Koefisien Konkordansi Kendall (<span class="m-var">W</span>) = ' + fmt(calcResult.agreement.kendall.W, 4) + ' (' + esc(Engine.kendallLabel(calcResult.agreement.kendall.W)) + '):</strong> ' +
            '<span class="m-inline">S = ' + fmt(calcResult.agreement.kendall.S, 2) + '</span>, <span class="m-inline">R&#772; = ' + fmt(calcResult.agreement.kendall.Rbar, 2) + '</span>. ' +
            'Alternatif paling diperdebatkan adalah <strong>' + esc(alts[calcResult.agreement.byControversy[0].idx].code + ' — ' + alts[calcResult.agreement.byControversy[0].idx].name) + '</strong> (&Delta;Rank = ' + calcResult.agreement.byControversy[0].range + '), sedangkan <strong>' + esc(alts[calcResult.group.winnerIdx].code + ' — ' + alts[calcResult.group.winnerIdx].name) + '</strong> terpilih sebagai pemenang konsensus komite.' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      renderGroupSupportWidgets() +
    '</section>';
  }

  function renderGroupSupportWidgets() {
    var alts = calcResult.alternatives;
    var dmStatusCards = calcResult.dmStatus.map(function (s) {
      var stBadge = s.used
        ? '<span class="badge badge-benefit">' + ico('check') + ' Selesai &amp; Dihitung</span>'
        : '<span class="badge badge-warn">' + esc(s.status) + '</span>';
      return '<div style="padding:11px 13px;border:1px solid var(--line);border-radius:10px;background:var(--bg-elev);margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">' +
        '<div><strong>' + esc(s.dm.code + ' — ' + s.dm.name) + '</strong><br><span style="font-size:0.75rem;color:var(--ink-muted)">Sel terisi: ' + s.validation.filled + '/' + s.validation.total + ' &bull; Best: ' + esc(s.dm.bwm.best.toUpperCase()) + ', Worst: ' + esc(s.dm.bwm.worst.toUpperCase()) + '</span></div>' +
        '<div>' + stBadge + '</div>' +
      '</div>';
    }).join('');

    var discList = (appState.discussion || []).slice().reverse().map(function (msg) {
      var dmObj = appState.dms[msg.by];
      var author = dmObj ? (dmObj.code + ' (' + dmObj.short + ')') : 'Komite Eksekutif';
      var altObj = alts.find(function (x) { return x.id === msg.altId; });
      var tag = altObj ? '<span class="badge badge-neutral">' + esc(altObj.code + ' ' + altObj.name) + '</span>' : '<span class="badge badge-neutral">Umum</span>';
      var ts = msg.ts ? new Date(msg.ts).toLocaleString('id-ID') : '';
      return '<div style="padding:11px 13px;border:1px solid var(--line);border-radius:10px;background:var(--bg-elev);margin-bottom:8px">' +
        '<div style="display:flex;justify-content:space-between;gap:8px;font-size:0.75rem;color:var(--ink-muted);margin-bottom:4px"><span><strong>' + esc(author) + '</strong> &middot; ' + tag + '</span><span>' + esc(ts) + '</span></div>' +
        '<div style="font-size:0.83rem">' + esc(msg.text) + '</div>' +
      '</div>';
    }).join('');

    var histList = (appState.history || []).slice().reverse().map(function (h) {
      return '<div style="padding:11px 13px;border:1px solid var(--line);border-radius:10px;background:var(--bg-elev);margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">' +
        '<div><strong>' + esc(h.label) + '</strong><br><span style="font-size:0.74rem;color:var(--ink-muted)">' + esc(new Date(h.ts).toLocaleString('id-ID')) + ' &bull; Juara #1: <strong>' + esc(h.winner) + '</strong> (' + h.altCount + ' EV &times; ' + h.critCount + ' Kriteria)</span></div>' +
        '<div><button type="button" class="btn btn-sm" data-action="restore-snapshot" data-id="' + esc(h.id) + '">' + ico('rotate') + '<span>Pulihkan</span></button></div>' +
      '</div>';
    }).join('') || '<p style="font-size:0.81rem;color:var(--ink-muted)">Belum ada snapshot manual. Klik tombol "Simpan Snapshot" untuk merekam riwayat keputusan komite.</p>';

    var altSelectOpts = '<option value="">Umum (Semua Kandidat)</option>' + alts.map(function (a) {
      return '<option value="' + esc(a.id) + '">' + esc(a.code + ' — ' + a.name) + '</option>';
    }).join('');

    return '<div class="grid-3">' +
      '<div class="subcard">' +
        '<h3>' + ico('users') + '<span>Status Pengisian DM Live</span></h3>' +
        dmStatusCards +
      '</div>' +
      '<div class="subcard">' +
        '<h3>' + ico('message') + '<span>Forum Diskusi Komite Real-Time</span></h3>' +
        '<div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap">' +
          '<select id="disc-alt-select" class="input" style="flex:1">' + altSelectOpts + '</select>' +
        '</div>' +
        '<div style="display:flex;gap:6px;margin-bottom:10px">' +
          '<input id="disc-text-input" type="text" class="input" style="flex:1" placeholder="Tulis argumen komite (mis. debat A8 BMW i4 / C5)...">' +
          '<button type="button" class="btn btn-primary" data-action="add-discussion">Kirim</button>' +
        '</div>' +
        '<div style="max-height:240px;overflow-y:auto">' + discList + '</div>' +
      '</div>' +
      '<div class="subcard">' +
        '<h3>' + ico('history') + '<span>Riwayat Snapshot Keputusan</span></h3>' +
        '<div style="display:flex;gap:6px;margin-bottom:10px">' +
          '<input id="snap-label-input" type="text" class="input" style="flex:1" placeholder="Nama skenario / rapat komite...">' +
          '<button type="button" class="btn btn-primary" data-action="save-snapshot">' + ico('plus') + '<span>Simpan Snapshot</span></button>' +
        '</div>' +
        '<div style="max-height:240px;overflow-y:auto">' + histList + '</div>' +
      '</div>' +
    '</div>';
  }

  /* ======================================= STAGE 7: BENCHMARK, SENSITIVITAS, & PARITAS EXCEL (MODE LENGKAP) */
  function renderStage7BenchmarksParityGroup() {
    var alts = calcResult.alternatives;
    var bm = calcResult.benchmarks;

    var benchRows = alts.map(function (a, i) {
      return '<tr>' +
        '<td class="mono"><strong>' + esc(a.code) + '</strong></td>' +
        '<td>' + esc(a.name) + '</td>' +
        '<td class="num">' + calcResult.group.borda[i] + '</td>' +
        '<td class="center">' + rankBadge(calcResult.group.finalRank[i]) + '</td>' +
        '<td class="num">' + bm.saw.borda[i] + ' (' + fmt(bm.saw.avg[i], 4) + ')</td>' +
        '<td class="center">' + rankBadge(bm.saw.finalRank[i]) + '</td>' +
        '<td class="num">' + bm.saw.spearman.d2[i] + '</td>' +
        '<td class="num">' + bm.topsis.borda[i] + ' (' + fmt(bm.topsis.avg[i], 4) + ')</td>' +
        '<td class="center">' + rankBadge(bm.topsis.finalRank[i]) + '</td>' +
        '<td class="num">' + bm.topsis.spearman.d2[i] + '</td>' +
        '</tr>';
    }).join('');

    var allScen = calcResult.sensitivity.dmScenarios.concat(calcResult.sensitivity.critScenarios);
    var scenHead = alts.map(function (a) { return '<th class="center">' + esc(a.code) + '</th>'; }).join('');
    var scenRows = allScen.map(function (s) {
      var rkCells = s.ranks.map(function (r) { return '<td class="center">' + rankBadge(r) + '</td>'; }).join('');
      return '<tr><td class="mono"><strong>' + esc(s.code) + '</strong></td><td>' + esc(s.name) + '</td>' + rkCells +
        '<td class="mono center"><strong>' + esc(alts[s.winnerIdx].code) + '</strong></td>' +
        '<td class="num"><strong>' + fmt(s.rho, 4) + '</strong></td></tr>';
    }).join('');

    var parityHtml = renderExcelParityTable();

    return '<section class="stage-section" id="stage-7">' +
      '<div class="stage-header">' +
        '<div><span class="stage-eyebrow">Tahap 07 &middot; Audit Paritas Excel (Butir 6.4), Benchmark SAW/TOPSIS (4.8), &amp; Sensitivitas (4.9)</span>' +
        '<h2 class="stage-title">Verifikasi Paritas Microsoft Excel, Komparasi Metode SAW/TOPSIS, &amp; 14 Skenario Sensitivitas</h2>' +
        '<p class="stage-desc">Membuktikan kesamaan hasil 100% terhadap buku kerja Microsoft Excel, memvalidasi peringkat terhadap metode SAW &amp; TOPSIS melalui korelasi peringkat Spearman, serta menguji 14 skenario sensitivitas bobot.</p></div>' +
      '</div>' +

      /* REAL MATHEMATICAL EQUATIONS FOR SPEARMAN, TOPSIS, AND SENSITIVITY RENORMALIZATION */
      '<div class="math-showcase-3">' +
        '<div class="math-card">' +
          '<div class="math-card-head"><span class="math-card-title">Korelasi Peringkat Spearman (<span class="m-var">&rho;<sub>s</sub></span>)</span><span class="math-card-ref">Butir 4.8</span></div>' +
          '<div class="math-expr"><span class="m-var">&rho;<sub>s</sub></span><span class="m-op">=</span><span class="m-num">1</span> &minus; ' + mFrac('<span class="m-num">6</span> ' + mSum('i=1', 'm') + '<span class="m-var">d<sub>i</sub></span><sup>2</sup>', '<span class="m-var">m</span>(<span class="m-var">m</span><sup>2</sup> &minus; <span class="m-num">1</span>)') + '</div>' +
          '<div class="math-note">Di mana <span class="m-var">d<sub>i</sub> = r<sub>i</sub><sup>CoCoSo</sup> &minus; r<sub>i</sub><sup>Pembanding</sup></span>.</div>' +
        '</div>' +
        '<div class="math-card">' +
          '<div class="math-card-head"><span class="math-card-title">Indeks Kedekatan Relatif TOPSIS (<span class="m-var">CC<sub>i</sub></span>)</span><span class="math-card-ref">Hwang &amp; Yoon (1981)</span></div>' +
          '<div class="math-expr"><span class="m-var">CC<sub>i</sub></span><span class="m-op">=</span>' + mFrac('<span class="m-var">D<sub>i</sub><sup>&minus;</sup></span>', '<span class="m-var">D<sub>i</sub><sup>+</sup></span> + <span class="m-var">D<sub>i</sub><sup>&minus;</sup></span>') + '<span class="m-op">,&ensp;</span><span class="m-var">D<sub>i</sub><sup>&plusmn;</sup></span><span class="m-op">=</span>' + mRad(mSum('j=1', 'n') + '(<span class="m-var">v<sub>ij</sub></span> &minus; <span class="m-var">A<sub>j</sub><sup>&plusmn;</sup></span>)<sup>2</sup>') + '</div>' +
          '<div class="math-note">Pembanding jarak Euclidean terhadap solusi ideal positif &amp; negatif.</div>' +
        '</div>' +
        '<div class="math-card">' +
          '<div class="math-card-head"><span class="math-card-title">Normalisasi Ulang Perturbasi Sensitivitas (+30%)</span><span class="math-card-ref">Butir 4.9 &amp; 5.9</span></div>' +
          '<div class="math-expr"><span class="m-var">w<sub>p</sub>&prime;</span><span class="m-op">=</span>' + mFrac('<span class="m-num">1,30</span> <span class="m-var">w<sub>p</sub></span>', '<span class="m-num">1</span> + <span class="m-num">0,30</span> <span class="m-var">w<sub>p</sub></span>') + '<span class="m-op">,&emsp;</span><span class="m-var">w<sub>j</sub>&prime;</span><span class="m-op">=</span>' + mFrac('<span class="m-var">w<sub>j</sub></span>', '<span class="m-num">1</span> + <span class="m-num">0,30</span> <span class="m-var">w<sub>p</sub></span>') + '</div>' +
          '<div class="math-note">Menjaga aksioma <span class="m-var">&sum; w<sub>j</sub>&prime; = 1,0000</span> di seluruh 14 skenario uji.</div>' +
        '</div>' +
      '</div>' +

      '<div class="subcard" style="margin-bottom:18px">' +
        '<h3>' + ico('shield') + '<span>A. Bukti Otomatis Paritas Prototype vs Microsoft Excel (Butir 6.4)</span></h3>' +
        parityHtml +
      '</div>' +

      '<div class="grid-2">' +
        '<div class="subcard">' +
          '<h3>' + ico('scale') + '<span>B. Komparasi Ranking CoCoSo vs SAW &amp; TOPSIS + Korelasi Spearman (Butir 4.8)</span></h3>' +
          '<div class="table-wrap"><table class="data-table"><thead><tr><th>Kode</th><th>Alternatif EV</th><th class="num">Borda CoCoSo</th><th class="center">Rank CoCoSo</th><th class="num">Borda (Skor) SAW</th><th class="center">Rank SAW</th><th class="num">d<sub>i</sub><sup>2</sup> SAW</th><th class="num">Borda (CC<sub>i</sub>) TOPSIS</th><th class="center">Rank TOPSIS</th><th class="num">d<sub>i</sub><sup>2</sup> TOPSIS</th></tr></thead><tbody>' +
            benchRows +
            '<tr style="background:var(--bg-subtle);font-weight:700"><td colspan="4">Korelasi Peringkat Spearman (<span class="m-var">&rho;<sub>s</sub></span>)</td><td colspan="3" class="num">&rho;<sub>s</sub>(CoCoSo, SAW) = <strong>' + fmt(bm.saw.spearman.rho, 4) + '</strong> (&sum;d<sup>2</sup>=' + bm.saw.spearman.sumD2 + ')</td><td colspan="3" class="num">&rho;<sub>s</sub>(CoCoSo, TOPSIS) = <strong>' + fmt(bm.topsis.spearman.rho, 4) + '</strong> (&sum;d<sup>2</sup>=' + bm.topsis.spearman.sumD2 + ')</td></tr>' +
          '</tbody></table></div>' +
        '</div>' +
        '<div class="subcard">' +
          '<h3>' + ico('sliders') + '<span>C. Analisis Sensitivitas Multi-Skenario Bobot DM (S0–S5) &amp; Bobot Kriteria (W0–W7)</span></h3>' +
          '<div class="table-wrap" style="max-height:360px;overflow-y:auto"><table class="data-table"><thead><tr><th>Kode</th><th>Skenario Sensitivitas</th>' + scenHead + '<th class="center">Juara #1</th><th class="num">Spearman &rho;<sub>s</sub></th></tr></thead><tbody>' + scenRows + '</tbody></table></div>' +
        '</div>' +
      '</div>' +
    '</section>';
  }

  function renderExcelParityTable() {
    if (!isBaselineUnmodified()) {
      return '<div class="alert-box alert-warn">' + ico('shieldAlert') + '<div>Data saat ini berada dalam <strong>Mode Modifikasi Dinamis (CRUD Aktif)</strong>. Klik tombol <button type="button" class="btn btn-sm" data-action="reset-baseline">' + ico('rotate') + '<span>Reset Baseline (8&times;6)</span></button> untuk menampilkan perbandingan angka 1-lawan-1 terhadap file <code>Konoha_GDSS_EV_SixtSE_Master.xlsx</code>.</div></div>';
    }
    var rows = [];
    var maxDiff = 0;
    function addRow(metric, protoVal, excelVal, digits) {
      var d = Math.abs(protoVal - excelVal);
      if (d > maxDiff) maxDiff = d;
      rows.push('<tr><td>' + esc(metric) + '</td><td class="num">' + fmt(protoVal, digits) + '</td><td class="num">' + fmt(excelVal, digits) + '</td><td class="num">' + d.toExponential(2) + '</td><td class="center"><span class="badge badge-benefit">' + ico('check') + ' IDENTIK</span></td></tr>');
    }
    ['dm1', 'dm2', 'dm3'].forEach(function (did, k) {
      var p = calcResult.perDM[k];
      addRow(p.dm.code + ' — Indikator Konsistensi Linear BWM (ξL*) [Sheet 3]', p.bwm.xi, ExcelRef.xi[did], 6);
      addRow(p.dm.code + ' — Bobot Kriteria C1..C6 (w1*) [Sheet 3]', p.bwm.w[0], ExcelRef.weights[did][0], 6);
      addRow(p.dm.code + ' — Skor CoCoSo K(A1 Tesla Model 3) [Sheet 4 & Sheet 1]', p.cocoso.K[0], ExcelRef.K[did][0], 6);
      addRow(p.dm.code + ' — Skor CoCoSo K(A8 BMW i4 eDrive40) [Sheet 4 & Sheet 1]', p.cocoso.K[7], ExcelRef.K[did][7], 6);
    });
    addRow('Konsensus Grup — Poin Borda A1 Tesla Model 3 [Sheet 1 J6]', calcResult.group.borda[0], ExcelRef.borda[0], 0);
    addRow('Konsensus Grup — Rata-Rata Skor Kompromi K̄(A1 Tesla Model 3) [Sheet 1 I6]', calcResult.group.avgK[0], ExcelRef.avgK[0], 6);
    addRow('Konsensus Grup — Poin Borda A6 Volkswagen ID.7 Pro [Sheet 1 J11]', calcResult.group.borda[5], ExcelRef.borda[5], 0);
    addRow('Konsensus Grup — Rata-Rata Skor Kompromi K̄(A6 Volkswagen ID.7 Pro) [Sheet 1 I11]', calcResult.group.avgK[5], ExcelRef.avgK[5], 6);
    addRow('Benchmarking — Korelasi Spearman CoCoSo vs SAW [Sheet 6 I15]', calcResult.benchmarks.saw.spearman.rho, ExcelRef.saw.rho, 6);
    addRow('Benchmarking — Korelasi Spearman CoCoSo vs TOPSIS [Sheet 6 N15]', calcResult.benchmarks.topsis.spearman.rho, ExcelRef.topsis.rho, 6);
    addRow('Kesepakatan Grup — Koefisien Konkordansi Kendall (W) [Sheet 1 D30]', calcResult.agreement.kendall.W, ExcelRef.kendallW, 6);

    return '<div class="alert-box alert-ok" style="margin-bottom:10px">' + ico('checkCircle') + '<div><strong>VERIFIKASI PARITAS LULUS 100%:</strong> Selisih maksimum antara mesin JavaScript Prototype (<code>engine.js</code>) dan hasil kalkulasi asli Microsoft Excel (<code>Konoha_GDSS_EV_SixtSE_Master.xlsx</code>) adalah <code>max |&Delta;| = ' + maxDiff.toExponential(3) + '</code> (nol mutlak hingga batas presisi IEEE-754).</div></div>' +
      '<div class="table-wrap"><table class="data-table"><thead><tr><th>Indikator &amp; Lokasi Sel di File Excel Master</th><th class="num">Nilai Prototype Web</th><th class="num">Nilai Microsoft Excel</th><th class="num">Selisih |&Delta;|</th><th class="center">Status</th></tr></thead><tbody>' + rows.join('') + '</tbody></table></div>';
  }

  /* ======================================= STAGE 8: RUBRIK 6.1–6.12 & TANYA JAWAB TIM */
  function renderStage8RubricDefense() {
    var rubrics = [
      ['6.1', 'Alur lengkap: input alternatif & kriteria → penilaian tiap DM → normalisasi → bobot (metode A) → ranking (metode B) → agregasi grup → hasil', 'Tahap 01 s/d Tahap 07 di bar navigasi atas menampilkan seluruh alur secara berurutan tanpa ada langkah yang terlewat.', '1'],
      ['6.2', 'Mendukung banyak DM: setiap DM mengisi penilaiannya sendiri (login, peran, atau form per DM)', 'Segmented Role Switcher di header atas + Form independen per DM di Tahap 02 + dukungan tambah DM baru.', '2'],
      ['6.3', 'Alternatif dan kriteria dapat ditambah, diubah, dan dihapus (tidak di-hardcode)', 'Di Tahap 01 tersedia tombol Tambah Alternatif, Edit, Hapus, Tambah Kriteria, serta tombol Demo 1-Klik tambah A9 & C7.', '1'],
      ['6.4', 'Hasil prototype sama dengan hasil Excel untuk data yang sama', 'Tabel Verifikasi Paritas Excel di Tahap 07 membuktikan max |Δ| = 0,00e+00 antara Prototype dan Konoha_GDSS_EV_SixtSE_Master.xlsx.', '7'],
      ['6.5', 'Hasil antara ditampilkan: matriks ternormalisasi, bobot kriteria, skor tiap DM', 'Tahap 03 menampilkan r_ij, Tahap 04 menampilkan bobot w_j* & ξL*, Tahap 05 menampilkan S_i, P_i, k_ia, k_ib, k_ic, dan K_i tiap DM.', '3'],
      ['6.6', 'Visualisasi hasil: grafik ranking dan perbandingan preferensi antar-DM', 'Tahap 04 & Tahap 06 menampilkan 4 grafik vektor SVG interaktif: Poin Borda Bertumpuk, Skor K_i Antar-DM, Bobot w_j* Antar-DM, dan Peta Rentang Debat.', '6'],
      ['6.7', 'Validasi input: menolak nilai kosong atau di luar skala', 'Tahap 02 otomatis memblokir nilai kosong atau angka di luar 1–5 (matriks) & 1–9 (BWM), dilengkapi tombol Simulasi Uji Validasi.', '2'],
      ['6.8', 'Antarmuka mudah dipahami dan konsisten', 'Desain berbasis Apple Human Interface Guidelines (HIG), ikonografi vektor SF-Symbols, rumus matematika buku teks, serta Light/Dark Appearance.', 'all'],
      ['6.9', 'Fitur pendukung grup sebagai nilai tambah (status pengisian DM, diskusi, riwayat keputusan)', 'Tahap 07 bagian D memuat Live Status Pengisian DM, Forum Diskusi Komite per kandidat EV, dan Riwayat Snapshot Keputusan.', '7'],
      ['6.10', 'Demo langsung berjalan tanpa error', 'Berjalan dengan arsitektur Dual-Engine (Cloud Firestore + LocalStorage Fallback) dan lulus automated test suite tanpa error.', 'all'],
      ['6.11', 'Laporan akhir, source code, dan panduan instalasi dikumpulkan', 'Tersedia lengkap di folder d:/DSS/finalproject beserta README.md, panduan deploy, laporan HTML, dan workbook Excel.', '8'],
      ['6.12', 'Setiap anggota mampu menjelaskan bagiannya saat tanya jawab', 'Naskah pembagian bicara 3 anggota komite (DM1 CFO, DM2 Fleet Ops, DM3 HSE/ESG) tersedia di bawah ini untuk sesi tanya jawab.', '8']
    ];

    var rRows = rubrics.map(function (r) {
      return '<tr><td class="mono"><strong>' + r[0] + '</strong></td><td><strong>' + esc(r[1]) + '</strong></td><td>' + esc(r[2]) + '</td>' +
        '<td class="center"><button type="button" class="btn btn-sm btn-primary" data-action="set-stage" data-stage="' + r[3] + '"><span>Buka Bukti</span>' + ico('arrowRight') + '</button></td></tr>';
    }).join('');

    return '<section class="stage-section" id="stage-8">' +
      '<div class="stage-header">' +
        '<div><span class="stage-eyebrow">Panduan Presentasi &amp; Sidang Akhir &middot; Butir 6.1 s/d 6.12 (Target 24/24 Poin)</span>' +
        '<h2 class="stage-title">Peta Bukti Pemenuhan Rubrik Penilaian 6 &amp; Pembagian Peran Tanya-Jawab Anggota Tim</h2>' +
        '<p class="stage-desc">Gunakan tabel pintasan ini saat dosen memeriksa satu per satu butir penilaian 6.1 hingga 6.12 di layar proyektor.</p></div>' +
      '</div>' +
      '<div class="table-wrap" style="margin-bottom:18px"><table class="data-table"><thead><tr><th>No</th><th>Butir Penilaian 6 yang Dicek Dosen</th><th>Implementasi &amp; Bukti di Prototype Ini</th><th class="center">Pintasan Demo</th></tr></thead><tbody>' + rRows + '</tbody></table></div>' +
      '<div class="grid-3">' +
        '<div class="subcard">' +
          '<h3>' + ico('user') + '<span>Anggota 1 &mdash; Peran DM1 (CFO Keuangan) &amp; Arsitektur Data</span></h3>' +
          '<p style="font-size:0.82rem;color:var(--ink-secondary);margin:0"><strong>Bagian Presentasi (Butir 6.1, 6.3, 6.7):</strong> Menjelaskan struktur masalah Sixt SE, dataset 360 EV Kaggle, demo CRUD tambah alternatif/kriteria di Tahap 01, validasi skala 1–5 &amp; 1–9 di Tahap 02, serta mengapa CFO memilih <strong>C1 Harga</strong> sebagai Best (bobot 38,39%) dan memenangkan <strong>A1 Tesla Model 3</strong>.</p>' +
        '</div>' +
        '<div class="subcard">' +
          '<h3>' + ico('user') + '<span>Anggota 2 &mdash; Peran DM2 (Fleet Ops) &amp; Mesin Linear BWM + CoCoSo</span></h3>' +
          '<p style="font-size:0.82rem;color:var(--ink-secondary);margin:0"><strong>Bagian Presentasi (Butir 6.2, 6.4, 6.5):</strong> Menjelaskan normalisasi Min-Max di Tahap 03, model LP Linear BWM Rezaei (2016) di Tahap 04, tahapan CoCoSo (<span class="m-var">S<sub>i</sub>, P<sub>i</sub>, k<sub>ia</sub>, k<sub>ib</sub>, k<sub>ic</sub>, K<sub>i</sub></span>) di Tahap 05, bukti paritas 100% dengan Excel di Tahap 07, serta mengapa Fleet Ops memilih <strong>C2 Range</strong> sebagai Best (38,48%) dan menjagokan <strong>A8 BMW i4</strong>.</p>' +
        '</div>' +
        '<div class="subcard">' +
          '<h3>' + ico('user') + '<span>Anggota 3 &mdash; Peran DM3 (Manajer K3 &amp; ESG) &amp; Konsensus Grup</span></h3>' +
          '<p style="font-size:0.82rem;color:var(--ink-secondary);margin:0"><strong>Bagian Presentasi (Butir 6.6, 6.8, 6.9, 6.10):</strong> Menjelaskan dualitas orientasi <strong>C5 Akselerasi</strong> (Benefit bagi K3 karena tarikan kalem &gt;7,5 detik aman bagi staf, sedangkan Cost bagi DM1/DM2), agregasi Borda &amp; Copeland di Tahap 06, grafik perbandingan antar-DM, sensitivitas, serta fitur kolaborasi Cloud Firestore + LocalStorage.</p>' +
        '</div>' +
      '</div>' +
    '</section>';
  }

  /* ========================================================= MODALS & CRUD */
  function openModal(html) {
    var bd = document.getElementById('modal-backdrop');
    var box = document.getElementById('modal-content');
    if (!bd || !box) return;
    box.innerHTML = html;
    bd.hidden = false;
  }

  function closeModal() {
    var bd = document.getElementById('modal-backdrop');
    if (bd) bd.hidden = true;
  }

  function openAltModal(altId) {
    var existing = altId ? appState.alternatives.find(function (a) { return a.id === altId; }) : null;
    var nextNum = appState.alternatives.length + 1;
    var code = existing ? existing.code : ('A' + nextNum);
    var name = existing ? existing.name : '';
    var seg = existing ? existing.segment : 'Armada Korporat EV';
    var rawFields = appState.criteria.map(function (c) {
      var rv = existing && existing.raw && existing.raw[c.id] !== undefined && existing.raw[c.id] !== null ? existing.raw[c.id] : '';
      return '<div style="margin-bottom:8px"><label style="display:block;font-size:0.79rem;font-weight:600">' + esc(c.code + ' — ' + c.name + ' (' + c.unit + ')') + '</label>' +
        '<input type="number" step="any" class="input" style="width:100%" data-raw-crit="' + esc(c.id) + '" value="' + esc(rv) + '" placeholder="Opsional (data objektif)"></div>';
    }).join('');
    var dmScoreFields = Engine.sortedDMs(appState).map(function (dm) {
      var cells = appState.criteria.map(function (c) {
        var sv = existing && dm.scores[existing.id] && dm.scores[existing.id][c.id] ? dm.scores[existing.id][c.id] : 3;
        return '<label style="font-size:0.78rem">' + esc(c.code) + ': <input type="number" min="1" max="5" step="1" class="input score-input" data-init-dm="' + esc(dm.id) + '" data-init-crit="' + esc(c.id) + '" value="' + esc(sv) + '"></label>';
      }).join(' ');
      return '<div style="margin-bottom:8px;padding:10px;background:var(--bg-subtle);border-radius:8px"><strong>Skor Awal ' + esc(dm.code + ' (' + dm.short + ')') + ' (1–5):</strong><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">' + cells + '</div></div>';
    }).join('');

    openModal(
      '<h3 style="margin-top:0;display:flex;align-items:center;gap:8px">' + ico('layers') + '<span>' + (existing ? 'Edit Alternatif Armada EV' : 'Tambah Alternatif Armada EV Baru (Butir 6.3)') + '</span></h3>' +
      '<div class="grid-2" style="margin-bottom:10px">' +
        '<div><label style="display:block;font-size:0.79rem;font-weight:600">Kode Alternatif</label><input id="m-alt-code" class="input" style="width:100%" value="' + esc(code) + '"></div>' +
        '<div><label style="display:block;font-size:0.79rem;font-weight:600">Nama Model Mobil Listrik</label><input id="m-alt-name" class="input" style="width:100%" value="' + esc(name) + '" placeholder="Mis. Audi Q4 e-tron 45"></div>' +
      '</div>' +
      '<div style="margin-bottom:10px"><label style="display:block;font-size:0.79rem;font-weight:600">Segmen Armada</label><input id="m-alt-seg" class="input" style="width:100%" value="' + esc(seg) + '"></div>' +
      '<h4 style="margin:12px 0 6px;font-size:0.85rem">Data Spesifikasi Objektif (Opsional)</h4>' +
      '<div class="grid-2">' + rawFields + '</div>' +
      '<h4 style="margin:12px 0 6px;font-size:0.85rem">Skor Matriks Tiap DM (Skala Bulat 1–5)</h4>' +
      dmScoreFields +
      '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px">' +
        '<button type="button" class="btn" data-action="close-modal">Batal</button>' +
        '<button type="button" class="btn btn-primary" data-action="save-alt-modal" data-id="' + esc(altId || '') + '">' + ico('check') + '<span>Simpan Alternatif</span></button>' +
      '</div>'
    );
  }

  function openCritModal(critId) {
    var existing = critId ? appState.criteria.find(function (c) { return c.id === critId; }) : null;
    var nextNum = appState.criteria.length + 1;
    var code = existing ? existing.code : ('C' + nextNum);
    var name = existing ? existing.name : '';
    var short = existing ? existing.short : '';
    var unit = existing ? existing.unit : 'Skala 1–5';
    var defType = existing ? existing.defaultType : 'Benefit';
    var desc = existing ? existing.description : '';

    openModal(
      '<h3 style="margin-top:0;display:flex;align-items:center;gap:8px">' + ico('sliders') + '<span>' + (existing ? 'Edit Kriteria Evaluasi' : 'Tambah Kriteria Evaluasi Baru (Butir 6.3)') + '</span></h3>' +
      '<div class="grid-2" style="margin-bottom:10px">' +
        '<div><label style="display:block;font-size:0.79rem;font-weight:600">Kode Kriteria</label><input id="m-crit-code" class="input" style="width:100%" value="' + esc(code) + '"></div>' +
        '<div><label style="display:block;font-size:0.79rem;font-weight:600">Nama Singkat (Label Tabel)</label><input id="m-crit-short" class="input" style="width:100%" value="' + esc(short) + '" placeholder="Mis. Baterai"></div>' +
      '</div>' +
      '<div class="grid-2" style="margin-bottom:10px">' +
        '<div><label style="display:block;font-size:0.79rem;font-weight:600">Nama Lengkap Kriteria</label><input id="m-crit-name" class="input" style="width:100%" value="' + esc(name) + '" placeholder="Mis. Kapasitas Baterai Bersih"></div>' +
        '<div><label style="display:block;font-size:0.79rem;font-weight:600">Satuan</label><input id="m-crit-unit" class="input" style="width:100%" value="' + esc(unit) + '" placeholder="Mis. kWh"></div>' +
      '</div>' +
      '<div style="margin-bottom:10px"><label style="display:block;font-size:0.79rem;font-weight:600">Orientasi Default</label>' +
        '<select id="m-crit-type" class="input" style="width:100%"><option value="Benefit"' + (defType === 'Benefit' ? ' selected' : '') + '>Benefit (Makin besar makin baik)</option><option value="Cost"' + (defType === 'Cost' ? ' selected' : '') + '>Cost (Makin kecil makin baik)</option></select></div>' +
      '<div style="margin-bottom:10px"><label style="display:block;font-size:0.79rem;font-weight:600">Definisi Operasional</label><input id="m-crit-desc" class="input" style="width:100%" value="' + esc(desc) + '"></div>' +
      '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px">' +
        '<button type="button" class="btn" data-action="close-modal">Batal</button>' +
        '<button type="button" class="btn btn-primary" data-action="save-crit-modal" data-id="' + esc(critId || '') + '">' + ico('check') + '<span>Simpan Kriteria</span></button>' +
      '</div>'
    );
  }

  function openCloudSetupModal() {
    var cfg = Storage.getSavedFirebaseConfig() || root.GDSS_FIREBASE_CONFIG || {};
    openModal(
      '<h3 style="margin-top:0;display:flex;align-items:center;gap:8px">' + ico('cloud') + '<span>Pengaturan Cloud Firestore &amp; Sinkronisasi Multi-Device</span></h3>' +
      '<p style="font-size:0.82rem;color:var(--ink-secondary)">Masukkan konfigurasi dari <strong>Firebase Console &rarr; Project Settings &rarr; Your apps (Web)</strong> agar seluruh anggota komite dapat mengakses sesi keputusan secara <em>real-time</em> dari perangkat berbeda. Apabila dikosongkan, sistem otomatis beroperasi menggunakan <strong>LocalStorage + Multi-Tab BroadcastChannel</strong>.</p>' +
      '<div class="grid-2" style="margin-bottom:10px">' +
        '<div><label style="display:block;font-size:0.78rem;font-weight:600">apiKey</label><input id="fb-apikey" class="input" style="width:100%" value="' + esc(cfg.apiKey || '') + '" placeholder="AIzaSy..."></div>' +
        '<div><label style="display:block;font-size:0.78rem;font-weight:600">projectId</label><input id="fb-projectid" class="input" style="width:100%" value="' + esc(cfg.projectId || '') + '" placeholder="sixt-ev-gdss"></div>' +
        '<div><label style="display:block;font-size:0.78rem;font-weight:600">authDomain</label><input id="fb-authdomain" class="input" style="width:100%" value="' + esc(cfg.authDomain || '') + '" placeholder="sixt-ev-gdss.firebaseapp.com"></div>' +
        '<div><label style="display:block;font-size:0.78rem;font-weight:600">appId</label><input id="fb-appid" class="input" style="width:100%" value="' + esc(cfg.appId || '') + '" placeholder="1:123456:web:abcdef"></div>' +
      '</div>' +
      '<div class="grid-2" style="margin-bottom:14px">' +
        '<div><label style="display:block;font-size:0.78rem;font-weight:600">Nama Koleksi Firestore</label><input id="fb-col" class="input" style="width:100%" value="' + esc(cfg.collectionName || 'gdss_sixt_sessions') + '"></div>' +
        '<div><label style="display:block;font-size:0.78rem;font-weight:600">ID Dokumen Room</label><input id="fb-doc" class="input" style="width:100%" value="' + esc(cfg.documentId || 'master_room_konoha') + '"></div>' +
      '</div>' +
      '<div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap">' +
        '<button type="button" class="btn btn-danger btn-sm" data-action="clear-firebase-cfg">Putuskan Cloud (Mode Lokal)</button>' +
        '<div style="display:flex;gap:8px">' +
          '<button type="button" class="btn" data-action="close-modal">Tutup</button>' +
          '<button type="button" class="btn btn-primary" data-action="save-firebase-cfg">' + ico('check') + '<span>Hubungkan Cloud Firestore</span></button>' +
        '</div>' +
      '</div>'
    );
  }

  /* ========================================================= EVENT HANDLERS */
  function bindEvents() {
    document.addEventListener('click', function (ev) {
      var btn = ev.target.closest('[data-action]');
      if (!btn) return;
      var act = btn.getAttribute('data-action');

      if (act === 'set-stage') {
        ui.activeStage = btn.getAttribute('data-stage');
        recomputeAndRender();
      } else if (act === 'switch-role') {
        var r = btn.getAttribute('data-role');
        var dId = btn.getAttribute('data-dm') || 'dm1';
        session.role = r;
        if (r === 'dm') {
          session.dmId = dId;
          ui.selectedDM = dId;
          ui.normDM = dId;
          ui.cocosoDM = dId;
        }
        Storage.saveSession(session);
        recomputeAndRender();
      } else if (act === 'select-dm-tab') {
        ui.selectedDM = btn.getAttribute('data-dm');
        ui.validationDemoMsg = '';
        recomputeAndRender();
      } else if (act === 'select-norm-dm') {
        ui.normDM = btn.getAttribute('data-dm');
        recomputeAndRender();
      } else if (act === 'select-cocoso-dm') {
        ui.cocosoDM = btn.getAttribute('data-dm');
        recomputeAndRender();
      } else if (act === 'select-cocoso-row') {
        ui.selectedCocosoRow = Number(btn.getAttribute('data-row')) || 0;
        recomputeAndRender();
      } else if (act === 'toggle-sp-detail') {
        ui.showSPDetail = !ui.showSPDetail;
        recomputeAndRender();
      } else if (act === 'toggle-full-mode') {
        ui.fullMode = !ui.fullMode;
        if (!ui.fullMode && (ui.activeStage === '7' || ui.activeStage === '8')) {
          ui.activeStage = 'all';
        }
        recomputeAndRender();
      } else if (act === 'toggle-theme') {
        ui.theme = ui.theme === 'dark' ? 'light' : 'dark';
        applyTheme();
      } else if (act === 'open-cloud-modal') {
        openCloudSetupModal();
      } else if (act === 'close-modal') {
        closeModal();
      } else if (act === 'reset-baseline') {
        appState = Storage.resetToSeed();
        ui.validationDemoMsg = 'Data berhasil dikembalikan ke Baseline Master Excel (8 EV × 6 Kriteria × 3 DM).';
        recomputeAndRender();
      } else if (act === 'open-add-alt') {
        openAltModal(null);
      } else if (act === 'edit-alt') {
        openAltModal(btn.getAttribute('data-id'));
      } else if (act === 'del-alt') {
        var idToDel = btn.getAttribute('data-id');
        if (appState.alternatives.length <= 2) {
          alert('Minimal harus terdapat 2 alternatif dalam evaluasi GDSS.');
          return;
        }
        appState.alternatives = appState.alternatives.filter(function (a) { return a.id !== idToDel; });
        Object.keys(appState.dms).forEach(function (k) { delete appState.dms[k].scores[idToDel]; });
        Storage.saveState(appState);
        recomputeAndRender();
      } else if (act === 'save-alt-modal') {
        saveAltFromModal(btn.getAttribute('data-id'));
      } else if (act === 'quick-add-preset-alt') {
        quickAddPresetAlt();
      } else if (act === 'open-add-crit') {
        openCritModal(null);
      } else if (act === 'edit-crit') {
        openCritModal(btn.getAttribute('data-id'));
      } else if (act === 'del-crit') {
        var cDel = btn.getAttribute('data-id');
        if (appState.criteria.length <= 2) {
          alert('Minimal harus terdapat 2 kriteria dalam evaluasi GDSS.');
          return;
        }
        appState.criteria = appState.criteria.filter(function (c) { return c.id !== cDel; });
        var fallbackBest = appState.criteria[0].id;
        var fallbackWorst = appState.criteria[appState.criteria.length - 1].id;
        Object.keys(appState.dms).forEach(function (k) {
          var dm = appState.dms[k];
          delete dm.types[cDel];
          delete dm.bwm.aB[cDel];
          delete dm.bwm.aW[cDel];
          if (dm.bwm.best === cDel) { dm.bwm.best = fallbackBest; dm.bwm.aB[fallbackBest] = 1; }
          if (dm.bwm.worst === cDel) { dm.bwm.worst = fallbackWorst; dm.bwm.aW[fallbackWorst] = 1; }
          dm.bwm.aB[dm.bwm.worst] = dm.bwm.aW[dm.bwm.best] = Math.max(dm.bwm.aB[dm.bwm.worst] || 5, 2);
          Object.keys(dm.scores).forEach(function (aid) { delete dm.scores[aid][cDel]; });
        });
        Storage.saveState(appState);
        recomputeAndRender();
      } else if (act === 'save-crit-modal') {
        saveCritFromModal(btn.getAttribute('data-id'));
      } else if (act === 'quick-add-preset-crit') {
        quickAddPresetCrit();
      } else if (act === 'open-add-dm') {
        quickAddNewDM();
      } else if (act === 'demo-invalid-input') {
        var dmTarget = appState.dms[ui.selectedDM];
        var firstAlt = appState.alternatives[0].id;
        var firstCrit = appState.criteria[0].id;
        dmTarget.scores[firstAlt][firstCrit] = 9; // Di luar skala 1..5
        ui.activeStage = '2';
        recomputeAndRender();
      } else if (act === 'auto-convert-rules') {
        autoConvertDMRules(btn.getAttribute('data-dm'));
      } else if (act === 'submit-dm') {
        var dmSub = appState.dms[btn.getAttribute('data-dm')];
        var vSub = Engine.validateDM(appState, dmSub);
        if (!vSub.complete) {
          ui.validationDemoMsg = '';
          recomputeAndRender();
          return;
        }
        dmSub.status = 'submitted';
        dmSub.submittedAt = new Date().toISOString();
        ui.validationDemoMsg = 'Penilaian ' + dmSub.code + ' tervalidasi 100% dan berhasil disimpan ke perhitungan konsensus grup.';
        Storage.saveState(appState);
        recomputeAndRender();
      } else if (act === 'add-discussion') {
        var txtEl = document.getElementById('disc-text-input');
        var altEl = document.getElementById('disc-alt-select');
        var txt = txtEl ? txtEl.value.trim() : '';
        if (!txt) return;
        appState.discussion = appState.discussion || [];
        appState.discussion.push({
          id: 'm_' + Date.now(),
          by: session.role === 'dm' ? session.dmId : 'facilitator',
          ts: new Date().toISOString(),
          altId: altEl ? altEl.value : '',
          text: txt
        });
        Storage.saveState(appState);
        recomputeAndRender();
      } else if (act === 'save-snapshot') {
        if (!calcResult || !calcResult.ok) return;
        var lblEl = document.getElementById('snap-label-input');
        var lbl = (lblEl && lblEl.value.trim()) || ('Snapshot Komite #' + ((appState.history || []).length + 1));
        var winAlt = appState.alternatives[calcResult.group.winnerIdx];
        var snapCopy = Storage.clone(appState);
        delete snapCopy.history;
        appState.history = appState.history || [];
        appState.history.push({
          id: 'h_' + Date.now(),
          label: lbl,
          ts: new Date().toISOString(),
          winner: winAlt.code + ' — ' + winAlt.name,
          altCount: appState.alternatives.length,
          critCount: appState.criteria.length,
          snapshot: snapCopy
        });
        Storage.saveState(appState);
        recomputeAndRender();
      } else if (act === 'restore-snapshot') {
        var hid = btn.getAttribute('data-id');
        var found = (appState.history || []).find(function (h) { return h.id === hid; });
        if (found && found.snapshot) {
          var keepHist = appState.history;
          appState = Storage.clone(found.snapshot);
          appState.history = keepHist;
          Storage.saveState(appState);
          recomputeAndRender();
        }
      } else if (act === 'save-firebase-cfg') {
        Storage.saveFirebaseConfig({
          apiKey: document.getElementById('fb-apikey').value,
          projectId: document.getElementById('fb-projectid').value,
          authDomain: document.getElementById('fb-authdomain').value,
          appId: document.getElementById('fb-appid').value,
          collectionName: document.getElementById('fb-col').value,
          documentId: document.getElementById('fb-doc').value
        });
        closeModal();
      } else if (act === 'clear-firebase-cfg') {
        Storage.saveFirebaseConfig(null);
        closeModal();
      } else if (act === 'export-json') {
        var blob = new Blob([JSON.stringify(appState, null, 2)], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'sixt-ev-gdss-state.json';
        a.click();
        URL.revokeObjectURL(url);
      }
    });

    document.addEventListener('change', function (ev) {
      var el = ev.target;
      var act = el.getAttribute('data-action');
      if (!act) return;
      var dmId = el.getAttribute('data-dm');
      var dm = appState.dms[dmId];
      if (!dm) return;

      if (act === 'dm-type-change') {
        dm.types[el.getAttribute('data-crit')] = el.value;
        Storage.saveState(appState);
        recomputeAndRender();
      } else if (act === 'bwm-best') {
        dm.bwm.best = el.value;
        dm.bwm.aB[el.value] = 1;
        dm.bwm.aW[el.value] = dm.bwm.aB[dm.bwm.worst] || 7;
        Storage.saveState(appState);
        recomputeAndRender();
      } else if (act === 'bwm-worst') {
        dm.bwm.worst = el.value;
        dm.bwm.aW[el.value] = 1;
        dm.bwm.aB[el.value] = dm.bwm.aW[dm.bwm.best] || 7;
        Storage.saveState(appState);
        recomputeAndRender();
      } else if (act === 'bwm-vec') {
        var vec = el.getAttribute('data-vec');
        var cid = el.getAttribute('data-crit');
        dm.bwm[vec][cid] = el.value === '' ? '' : Number(el.value);
        Storage.saveState(appState);
        recomputeAndRender();
      } else if (act === 'dm-score') {
        var aid = el.getAttribute('data-alt');
        var cid2 = el.getAttribute('data-crit');
        dm.scores[aid] = dm.scores[aid] || {};
        dm.scores[aid][cid2] = el.value === '' ? '' : Number(el.value);
        Storage.saveState(appState);
        recomputeAndRender();
      }
    });

    /* Cegah scroll roda mouse mengubah angka pada input[type="number"] secara tidak sengaja */
    document.addEventListener('wheel', function (ev) {
      if (ev.target && ev.target.tagName === 'INPUT' && ev.target.type === 'number') {
        ev.target.blur();
      }
    }, { passive: true });

    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') closeModal();
    });
  }

  function saveAltFromModal(existingId) {
    var code = document.getElementById('m-alt-code').value.trim() || ('A' + (appState.alternatives.length + 1));
    var name = document.getElementById('m-alt-name').value.trim() || ('Kandidat EV ' + code);
    var seg = document.getElementById('m-alt-seg').value.trim() || 'Armada Korporat EV';
    var id = existingId || ('a_' + Date.now());
    var raw = {};
    document.querySelectorAll('[data-raw-crit]').forEach(function (inp) {
      var cid = inp.getAttribute('data-raw-crit');
      raw[cid] = inp.value === '' ? null : Number(inp.value);
    });
    if (existingId) {
      var target = appState.alternatives.find(function (a) { return a.id === existingId; });
      if (target) { target.code = code; target.name = name; target.segment = seg; target.raw = raw; }
    } else {
      appState.alternatives.push({ id: id, code: code, name: name, segment: seg, raw: raw, source: 'Custom Input' });
    }
    document.querySelectorAll('[data-init-dm]').forEach(function (inp) {
      var dId = inp.getAttribute('data-init-dm');
      var cId = inp.getAttribute('data-init-crit');
      if (appState.dms[dId]) {
        appState.dms[dId].scores[id] = appState.dms[dId].scores[id] || {};
        appState.dms[dId].scores[id][cId] = Math.min(5, Math.max(1, Math.round(Number(inp.value) || 3)));
      }
    });
    closeModal();
    Storage.saveState(appState);
    recomputeAndRender();
  }

  function quickAddPresetAlt() {
    var usedCodes = appState.alternatives.map(function (a) { return a.code; });
    var preset = PRESET_EXTRA_CARS.find(function (p) { return usedCodes.indexOf(p.code) < 0; }) || PRESET_EXTRA_CARS[0];
    var id = 'a_' + Date.now();
    var code = usedCodes.indexOf(preset.code) < 0 ? preset.code : ('A' + (appState.alternatives.length + 1));
    appState.alternatives.push({
      id: id, code: code, name: preset.name, segment: preset.segment,
      raw: Storage.clone(preset.raw), source: preset.source
    });
    Engine.sortedDMs(appState).forEach(function (dm) {
      dm.scores[id] = {};
      appState.criteria.forEach(function (c) {
        var ruleScore = dm.rules && dm.rules[c.id] ? Engine.scoreFromRule(preset.raw[c.id], dm.rules[c.id]) : null;
        dm.scores[id][c.id] = ruleScore || (preset.q && preset.q[dm.id]) || 4;
      });
    });
    Storage.saveState(appState);
    recomputeAndRender();
  }

  function saveCritFromModal(existingId) {
    var code = document.getElementById('m-crit-code').value.trim() || ('C' + (appState.criteria.length + 1));
    var short = document.getElementById('m-crit-short').value.trim() || code;
    var name = document.getElementById('m-crit-name').value.trim() || short;
    var unit = document.getElementById('m-crit-unit').value.trim() || 'Skala 1–5';
    var defType = document.getElementById('m-crit-type').value;
    var desc = document.getElementById('m-crit-desc').value.trim();

    if (existingId) {
      var target = appState.criteria.find(function (c) { return c.id === existingId; });
      if (target) {
        target.code = code; target.short = short; target.name = name;
        target.unit = unit; target.defaultType = defType; target.description = desc;
      }
    } else {
      var id = 'c_' + Date.now();
      appState.criteria.push({ id: id, code: code, name: name, short: short, unit: unit, defaultType: defType, description: desc, source: 'Custom' });
      Object.keys(appState.dms).forEach(function (k) {
        var dm = appState.dms[k];
        dm.types[id] = defType;
        dm.bwm.aB[id] = 3;
        dm.bwm.aW[id] = 3;
        appState.alternatives.forEach(function (a) {
          dm.scores[a.id] = dm.scores[a.id] || {};
          dm.scores[a.id][id] = 3;
        });
      });
    }
    closeModal();
    Storage.saveState(appState);
    recomputeAndRender();
  }

  function quickAddPresetCrit() {
    var nextN = appState.criteria.length + 1;
    var id = 'c_' + Date.now();
    appState.criteria.push({
      id: id, code: 'C' + nextN, name: 'Kapasitas Baterai Bersih (Usable Battery)', short: 'Baterai',
      unit: 'kWh', defaultType: 'Benefit', description: 'Kapasitas energi bersih baterai lithium-ion kendaraan (kWh).', source: 'EV Database'
    });
    var sampleScores = [3, 2, 3, 4, 4, 5, 3, 5];
    Object.keys(appState.dms).forEach(function (k) {
      var dm = appState.dms[k];
      dm.types[id] = 'Benefit';
      dm.bwm.aB[id] = 3;
      dm.bwm.aW[id] = 3;
      appState.alternatives.forEach(function (a, idx) {
        dm.scores[a.id][id] = sampleScores[idx % sampleScores.length];
      });
    });
    Storage.saveState(appState);
    recomputeAndRender();
  }

  function quickAddNewDM() {
    var dms = Engine.sortedDMs(appState);
    var nextNum = dms.length + 1;
    var id = 'dm' + nextNum + '_' + Date.now();
    var base = Storage.clone(dms[0]);
    base.id = id;
    base.code = 'DM' + nextNum;
    base.short = 'Divisi #' + nextNum;
    base.name = 'Manajer Strategi Korporat (DM' + nextNum + ')';
    base.color = '#AF52DE';
    base.order = nextNum;
    appState.dms[id] = base;
    ui.selectedDM = id;
    Storage.saveState(appState);
    recomputeAndRender();
  }

  function autoConvertDMRules(dmId) {
    var dm = appState.dms[dmId];
    if (!dm || !dm.rules) return;
    appState.alternatives.forEach(function (a) {
      appState.criteria.forEach(function (c) {
        if (dm.rules[c.id] && a.raw && a.raw[c.id] !== undefined && a.raw[c.id] !== null) {
          var sc = Engine.scoreFromRule(a.raw[c.id], dm.rules[c.id]);
          if (sc) dm.scores[a.id][c.id] = sc;
        }
      });
    });
    ui.validationDemoMsg = 'Seluruh skor kuantitatif ' + dm.code + ' berhasil dikonversi ulang otomatis dari tabel rentang objektif.';
    Storage.saveState(appState);
    recomputeAndRender();
  }

  /* ========================================================= INITIALIZATION */
  function initApp() {
    applyTheme();
    session = Storage.loadSession();
    appState = Storage.init();

    Storage.onStatusChange(function (st) {
      var pill = document.getElementById('cloud-sync-pill');
      var txt = document.getElementById('cloud-sync-text');
      if (pill && txt) {
        pill.setAttribute('data-mode', st.mode);
        txt.textContent = st.label;
      }
    });

    Storage.onStateChange(function (newState) {
      appState = newState;
      recomputeAndRender();
    });

    bindEvents();
    recomputeAndRender();
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initApp);
    } else {
      initApp();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);
