/*!
 * Sixt EV GDSS — Mesin Perhitungan (engine.js)
 * Alur: Matriks DM (Likert 1–5) → Normalisasi Min-Max → Bobot Linear BWM (Rezaei, 2016)
 *       → Ranking CoCoSo (Yazdani et al., 2019) per DM → Agregasi grup Borda + tie-breaker K̄ (+ Copeland)
 *       → Pembanding SAW & TOPSIS + Spearman → Sensitivitas → Kesepakatan antar-DM (Kendall W).
 * Rumus identik dengan Konoha_GDSS_EV_SixtSE_Master.xlsx. Tanpa dependensi; jalan di browser & Node.
 */
(function (root) {
  'use strict';

  var TOL = 1e-11;

  /* Tabel 3 Liang, Brunelli & Rezaei (2020, Omega 96:102175) — ambang CR input-based.
     Baris = jumlah kriteria n (3..9), kolom = a_BW (3..9). */
  var LIANG_THRESHOLDS = {
    3: [0.1667, 0.1667, 0.1667, 0.1667, 0.1667, 0.1667, 0.1667],
    4: [0.1121, 0.1529, 0.1898, 0.2206, 0.2527, 0.2577, 0.2683],
    5: [0.1354, 0.1994, 0.2306, 0.2546, 0.2716, 0.2844, 0.2960],
    6: [0.1330, 0.1990, 0.2643, 0.3044, 0.3144, 0.3221, 0.3262],
    7: [0.1294, 0.2457, 0.2819, 0.3029, 0.3144, 0.3251, 0.3403],
    8: [0.1309, 0.2521, 0.2958, 0.3154, 0.3408, 0.3620, 0.3657],
    9: [0.1359, 0.2681, 0.3062, 0.3337, 0.3517, 0.3620, 0.3662]
  };

  /* ---------------------------------------------------------------- helpers */
  function sum(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return s; }
  function max(a) { return Math.max.apply(null, a); }
  function min(a) { return Math.min.apply(null, a); }
  function zeros(n) { var a = new Array(n); for (var i = 0; i < n; i++) a[i] = 0; return a; }
  function round9(x) { return Math.round(x * 1e9) / 1e9; }
  function isInt(v) { return typeof v === 'number' && isFinite(v) && Math.floor(v) === v; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  /** Ranking descending, ties → rank minimum (sama dengan pandas rank(method='min') / Excel RANK.EQ). */
  function rankDesc(values) {
    return values.map(function (v) {
      var r = 1;
      for (var i = 0; i < values.length; i++) if (values[i] > v) r++;
      return r;
    });
  }

  /** Spearman: ρ = 1 − 6Σd² / (m(m² − 1)) */
  function spearman(ra, rb) {
    var m = ra.length, d = [], d2 = [];
    for (var i = 0; i < m; i++) { d.push(ra[i] - rb[i]); d2.push((ra[i] - rb[i]) * (ra[i] - rb[i])); }
    var sumD2 = sum(d2), denom = m * (m * m - 1);
    return { d: d, d2: d2, sumD2: sumD2, denom: denom, rho: denom > 0 ? 1 - (6 * sumD2) / denom : 1 };
  }

  function stdSample(a) {
    if (a.length < 2) return 0;
    var mu = sum(a) / a.length, s = 0;
    for (var i = 0; i < a.length; i++) s += (a[i] - mu) * (a[i] - mu);
    return Math.sqrt(s / (a.length - 1));
  }

  function liangThreshold(n, aBW) {
    var row = LIANG_THRESHOLDS[clamp(n, 3, 9)];
    return row[clamp(aBW, 3, 9) - 3];
  }

  /* ------------------------------------------------- simplex (two-phase, Bland) */
  function pivot(T, b, z, zb, basis, r, e) {
    var m = T.length, N = T[0].length, p = T[r][e], j, i;
    for (j = 0; j < N; j++) T[r][j] /= p;
    b[r] /= p;
    for (i = 0; i < m; i++) {
      if (i === r) continue;
      var f = T[i][e];
      if (f !== 0) { for (j = 0; j < N; j++) T[i][j] -= f * T[r][j]; b[i] -= f * b[r]; }
    }
    var fz = z[e];
    if (fz !== 0) { for (j = 0; j < N; j++) z[j] -= fz * T[r][j]; zb.v -= fz * b[r]; }
    basis[r] = e;
  }

  function runSimplex(T, b, cost, basis, allowed) {
    var m = T.length, N = cost.length, z = cost.slice(), zb = { v: 0 }, i, j;
    for (i = 0; i < m; i++) {
      var cb = cost[basis[i]];
      if (cb !== 0) { for (j = 0; j < N; j++) z[j] -= cb * T[i][j]; zb.v -= cb * b[i]; }
    }
    for (var it = 0; it < 10000; it++) {
      var e = -1;
      for (j = 0; j < N; j++) if (allowed[j] && z[j] < -TOL) { e = j; break; }
      if (e < 0) return true;
      var r = -1, best = Infinity;
      for (i = 0; i < m; i++) {
        if (T[i][e] > TOL) {
          var ratio = b[i] / T[i][e];
          if (ratio < best - 1e-13 || (Math.abs(ratio - best) <= 1e-13 && basis[i] < basis[r])) { best = ratio; r = i; }
        }
      }
      if (r < 0) throw new Error('LP tidak terbatas (unbounded)');
      pivot(T, b, z, zb, basis, r, e);
    }
    throw new Error('Simplex melebihi batas iterasi');
  }

  /** min c·x  s.t. Aub·x ≤ 0 (b_ub = 0), Aeq·x = beq (≥0), x ≥ 0 */
  function solveLP(c, Aub, Aeq, beq) {
    var nv = c.length, mu = Aub.length, me = Aeq.length, m = mu + me;
    var N = nv + mu + me, T = [], b = [], basis = [], i, j;
    for (i = 0; i < mu; i++) {
      var row = zeros(N);
      for (j = 0; j < nv; j++) row[j] = Aub[i][j];
      row[nv + i] = 1; T.push(row); b.push(0); basis.push(nv + i);
    }
    for (i = 0; i < me; i++) {
      var row2 = zeros(N);
      for (j = 0; j < nv; j++) row2[j] = Aeq[i][j];
      row2[nv + mu + i] = 1; T.push(row2); b.push(beq[i]); basis.push(nv + mu + i);
    }
    var allowAll = zeros(N).map(function () { return true; });
    var c1 = zeros(N); for (i = 0; i < me; i++) c1[nv + mu + i] = 1;
    runSimplex(T, b, c1, basis, allowAll);
    var art = 0; for (i = 0; i < m; i++) if (basis[i] >= nv + mu) art += b[i];
    if (art > 1e-9) throw new Error('LP tidak layak (infeasible)');
    for (i = 0; i < m; i++) {           // keluarkan variabel artifisial bernilai 0 dari basis
      if (basis[i] >= nv + mu) {
        for (j = 0; j < nv + mu; j++) if (Math.abs(T[i][j]) > TOL) { pivot(T, b, zeros(N), { v: 0 }, basis, i, j); break; }
      }
    }
    var allowed = zeros(N).map(function (_, k) { return k < nv + mu; });
    var c2 = zeros(N); for (j = 0; j < nv; j++) c2[j] = c[j];
    runSimplex(T, b, c2, basis, allowed);
    var x = zeros(nv);
    for (i = 0; i < m; i++) if (basis[i] < nv) x[basis[i]] = b[i];
    return x;
  }

  /* ------------------------------------------------------------- Linear BWM */
  /** Rezaei (2016): min ξ s.t. |w_B − a_Bj·w_j| ≤ ξ, |w_j − a_jW·w_W| ≤ ξ, Σw = 1, w ≥ 0 */
  function linearBWM(bestIdx, worstIdx, aB, aW) {
    var n = aB.length, Aub = [], j;
    for (j = 0; j < n; j++) {
      if (j !== bestIdx) {
        var r1 = zeros(n + 1); r1[bestIdx] = 1; r1[j] -= aB[j]; r1[n] = -1;
        var r2 = zeros(n + 1); r2[bestIdx] = -1; r2[j] += aB[j]; r2[n] = -1;
        Aub.push(r1, r2);
      }
      if (j !== worstIdx) {
        var r3 = zeros(n + 1); r3[j] = 1; r3[worstIdx] -= aW[j]; r3[n] = -1;
        var r4 = zeros(n + 1); r4[j] = -1; r4[worstIdx] += aW[j]; r4[n] = -1;
        Aub.push(r3, r4);
      }
    }
    var eq = zeros(n + 1); for (j = 0; j < n; j++) eq[j] = 1;
    var c = zeros(n + 1); c[n] = 1;
    var x = solveLP(c, Aub, [eq], [1]);
    var w = x.slice(0, n).map(function (v) { return v < 0 && v > -1e-12 ? 0 : v; });
    var xi = x[n];
    var aBW = aB[worstIdx];
    var devB = w.map(function (wj, k) { return Math.abs(w[bestIdx] - aB[k] * wj); });
    var devW = w.map(function (wj, k) { return Math.abs(wj - aW[k] * w[worstIdx]); });
    var crPerJ = aB.map(function (_, k) { return aBW > 1 ? Math.abs(aB[k] * aW[k] - aBW) / (aBW * aBW - aBW) : 0; });
    var cr = max(crPerJ), thr = liangThreshold(n, aBW);
    return {
      w: w, xi: xi, sumW: sum(w), devB: devB, devW: devW, aBW: aBW,
      crPerJ: crPerJ, cr: cr, threshold: thr, consistent: cr <= thr + 1e-12
    };
  }

  /* ----------------------------------------------------------------- CoCoSo */
  function minPositive(a) {
    var m = Infinity; for (var i = 0; i < a.length; i++) if (a[i] > 0 && a[i] < m) m = a[i];
    return m === Infinity ? 0 : m;
  }

  function cocoso(X, types, w, lambda) {
    var m = X.length, n = w.length, i, j, flat = [];
    var colMin = zeros(n), colMax = zeros(n), R = [];
    for (j = 0; j < n; j++) {
      var col = X.map(function (r) { return r[j]; });
      colMin[j] = min(col); colMax[j] = max(col);
      if (colMax[j] === colMin[j]) flat.push(j);
    }
    for (i = 0; i < m; i++) {
      var row = zeros(n);
      for (j = 0; j < n; j++) {
        var rng = colMax[j] - colMin[j];
        if (rng === 0) row[j] = 1;
        else row[j] = types[j] === 'Benefit' ? (X[i][j] - colMin[j]) / rng : (colMax[j] - X[i][j]) / rng;
      }
      R.push(row);
    }
    return Object.assign({ R: R, colMin: colMin, colMax: colMax, flatCols: flat }, cocosoFromR(R, w, lambda));
  }

  function cocosoFromR(R, w, lambda) {
    var m = R.length, n = w.length, i, j;
    var Sterms = [], Pterms = [], S = [], P = [];
    for (i = 0; i < m; i++) {
      var st = zeros(n), pt = zeros(n);
      for (j = 0; j < n; j++) { st[j] = R[i][j] * w[j]; pt[j] = R[i][j] > 0 ? Math.pow(R[i][j], w[j]) : 0; }
      Sterms.push(st); Pterms.push(pt); S.push(sum(st)); P.push(sum(pt));
    }
    var SP = S.map(function (s, k) { return s + P[k]; }), sumSP = sum(SP);
    var Smin = minPositive(S), Pmin = minPositive(P), Smax = max(S), Pmax = max(P);
    var ka = SP.map(function (v) { return sumSP > 0 ? v / sumSP : 0; });
    var kb = S.map(function (s, k) { return (Smin > 0 ? s / Smin : 0) + (Pmin > 0 ? P[k] / Pmin : 0); });
    var den = lambda * Smax + (1 - lambda) * Pmax;
    var kc = S.map(function (s, k) { return den > 0 ? (lambda * s + (1 - lambda) * P[k]) / den : 0; });
    var Kgeo = ka.map(function (a, k) { return Math.pow(a * kb[k] * kc[k], 1 / 3); });
    var Kari = ka.map(function (a, k) { return (a + kb[k] + kc[k]) / 3; });
    var K = Kgeo.map(function (g, k) { return g + Kari[k]; });
    return {
      Sterms: Sterms, Pterms: Pterms, S: S, P: P, sumS: sum(S), sumP: sum(P), sumSP: sumSP,
      Smin: Smin, Pmin: Pmin, Smax: Smax, Pmax: Pmax,
      ka: ka, kb: kb, kc: kc, Kgeo: Kgeo, Kari: Kari, K: K, ranks: rankDesc(K)
    };
  }

  /* ------------------------------------------------------- SAW & TOPSIS */
  function saw(X, types, w) {
    var m = X.length, n = w.length, i, j, R = [], V = [];
    var cmax = [], cmin = [];
    for (j = 0; j < n; j++) { var col = X.map(function (r) { return r[j]; }); cmax.push(max(col)); cmin.push(min(col)); }
    for (i = 0; i < m; i++) {
      var r = zeros(n), v = zeros(n);
      for (j = 0; j < n; j++) { r[j] = types[j] === 'Benefit' ? X[i][j] / cmax[j] : cmin[j] / X[i][j]; v[j] = r[j] * w[j]; }
      R.push(r); V.push(v);
    }
    var scores = V.map(sum);
    return { R: R, V: V, scores: scores, ranks: rankDesc(scores) };
  }

  function topsis(X, types, w) {
    var m = X.length, n = w.length, i, j, norms = zeros(n), R = [], V = [];
    for (j = 0; j < n; j++) { var s = 0; for (i = 0; i < m; i++) s += X[i][j] * X[i][j]; norms[j] = Math.sqrt(s); }
    for (i = 0; i < m; i++) {
      var r = zeros(n), v = zeros(n);
      for (j = 0; j < n; j++) { r[j] = X[i][j] / norms[j]; v[j] = r[j] * w[j]; }
      R.push(r); V.push(v);
    }
    var pis = [], nis = [];
    for (j = 0; j < n; j++) {
      var col = V.map(function (row) { return row[j]; });
      pis.push(types[j] === 'Benefit' ? max(col) : min(col));
      nis.push(types[j] === 'Benefit' ? min(col) : max(col));
    }
    var dpos = V.map(function (row) { var s2 = 0; for (var k = 0; k < n; k++) s2 += (row[k] - pis[k]) * (row[k] - pis[k]); return Math.sqrt(s2); });
    var dneg = V.map(function (row) { var s2 = 0; for (var k = 0; k < n; k++) s2 += (row[k] - nis[k]) * (row[k] - nis[k]); return Math.sqrt(s2); });
    var scores = dpos.map(function (dp, k) { return dp + dneg[k] > 0 ? dneg[k] / (dp + dneg[k]) : 0; });
    return { norms: norms, R: R, V: V, pis: pis, nis: nis, dpos: dpos, dneg: dneg, scores: scores, ranks: rankDesc(scores) };
  }

  /* ---------------------------------------------------- group aggregation */
  /** Borda: poin = m − rank; urut Borda desc, tie-breaker rata-rata skor desc → peringkat final unik. */
  function bordaAggregate(rankLists, scoreLists, m) {
    var K = rankLists.length, borda = [], avg = [], i, k;
    for (i = 0; i < m; i++) {
      var b = 0, s = 0;
      for (k = 0; k < K; k++) { b += m - rankLists[k][i]; s += scoreLists[k][i]; }
      borda.push(b); avg.push(s / K);
    }
    var order = borda.map(function (_, i2) { return i2; }).sort(function (a, c) {
      if (borda[c] !== borda[a]) return borda[c] - borda[a];
      if (avg[c] !== avg[a]) return avg[c] - avg[a];
      return a - c;
    });
    var finalRank = zeros(m); order.forEach(function (idx, pos) { finalRank[idx] = pos + 1; });
    return { borda: borda, avg: avg, order: order, finalRank: finalRank };
  }

  /** Borda berbobot DM (skenario sensitivitas): Σ K·α_k·(m − r_k), tie-breaker Σ α_k·K_k (dibulatkan 9 desimal). */
  function weightedAggregate(rankLists, scoreLists, alphas, m) {
    var K = rankLists.length, wb = [], wk = [], i, k;
    for (i = 0; i < m; i++) {
      var b = 0, s = 0;
      for (k = 0; k < K; k++) { b += K * alphas[k] * (m - rankLists[k][i]); s += alphas[k] * scoreLists[k][i]; }
      wb.push(b); wk.push(s);
    }
    var order = wb.map(function (_, i2) { return i2; }).sort(function (a, c) {
      var A1 = round9(wb[a]), C1 = round9(wb[c]);
      if (C1 !== A1) return C1 - A1;
      var A2 = round9(wk[a]), C2 = round9(wk[c]);
      if (C2 !== A2) return C2 - A2;
      return a - c;
    });
    var ranks = zeros(m); order.forEach(function (idx, pos) { ranks[idx] = pos + 1; });
    return { wborda: wb, wavg: wk, order: order, ranks: ranks };
  }

  function copeland(rankLists, m) {
    var K = rankLists.length, out = [];
    for (var i = 0; i < m; i++) {
      var w = 0, l = 0, d = 0;
      for (var u = 0; u < m; u++) {
        if (u === i) continue;
        var vi = 0, vu = 0;
        for (var k = 0; k < K; k++) { if (rankLists[k][i] < rankLists[k][u]) vi++; else if (rankLists[k][u] < rankLists[k][i]) vu++; }
        if (vi > K / 2) w++; else if (vu > K / 2) l++; else d++;
      }
      out.push({ wins: w, losses: l, draws: d, net: w - l });
    }
    return out;
  }

  /* ----------------------------------------------------------- validation */
  function getCell(obj, a, b) { return obj && obj[a] ? obj[a][b] : undefined; }

  /** Validasi penilaian satu DM terhadap alternatif & kriteria aktif (Butir 6.7). */
  function validateDM(state, dm) {
    var crit = state.criteria || [], alts = state.alternatives || [], meta = state.meta || {};
    var smin = meta.scaleMin || 1, smax = meta.scaleMax || 5, bmax = meta.bwmMax || 9;
    var errors = [], warnings = [], filled = 0, total = alts.length * crit.length;
    var bwm = dm.bwm || {}, aB = bwm.aB || {}, aW = bwm.aW || {};
    var ids = crit.map(function (c) { return c.id; });
    var codeOf = {}; crit.forEach(function (c) { codeOf[c.id] = c.code; });
    var bwmOk = true;
    if (!bwm.best || ids.indexOf(bwm.best) < 0) { errors.push({ area: 'bwm', field: 'best', msg: 'Kriteria terbaik (Best) belum dipilih.' }); bwmOk = false; }
    if (!bwm.worst || ids.indexOf(bwm.worst) < 0) { errors.push({ area: 'bwm', field: 'worst', msg: 'Kriteria terburuk (Worst) belum dipilih.' }); bwmOk = false; }
    if (bwm.best && bwm.best === bwm.worst) { errors.push({ area: 'bwm', field: 'worst', msg: 'Kriteria Best dan Worst tidak boleh sama.' }); bwmOk = false; }
    crit.forEach(function (c) {
      ['aB', 'aW'].forEach(function (key) {
        var v = (key === 'aB' ? aB : aW)[c.id];
        var label = key === 'aB' ? 'a_B (Best→' + c.code + ')' : 'a_W (' + c.code + '→Worst)';
        if (v === undefined || v === null || v === '') { errors.push({ area: 'bwm', field: key + ':' + c.id, msg: label + ' masih kosong.' }); bwmOk = false; }
        else if (!isInt(v) || v < 1 || v > bmax) { errors.push({ area: 'bwm', field: key + ':' + c.id, msg: label + ' = ' + v + ' di luar skala 1–' + bmax + ' (harus bilangan bulat).' }); bwmOk = false; }
      });
    });
    if (bwmOk) {
      if (aB[bwm.best] !== 1) { errors.push({ area: 'bwm', field: 'aB:' + bwm.best, msg: 'a_BB (Best terhadap dirinya sendiri) wajib = 1.' }); bwmOk = false; }
      if (aW[bwm.worst] !== 1) { errors.push({ area: 'bwm', field: 'aW:' + bwm.worst, msg: 'a_WW (Worst terhadap dirinya sendiri) wajib = 1.' }); bwmOk = false; }
      if (aB[bwm.worst] !== aW[bwm.best]) { errors.push({ area: 'bwm', field: 'aW:' + bwm.best, msg: 'a_BW harus sama di kedua vektor: a_B(' + codeOf[bwm.worst] + ') = ' + aB[bwm.worst] + ' tetapi a_W(' + codeOf[bwm.best] + ') = ' + aW[bwm.best] + '.' }); bwmOk = false; }
      crit.forEach(function (c) {
        if (aB[c.id] > aB[bwm.worst]) warnings.push({ area: 'bwm', field: 'aB:' + c.id, msg: 'a_B(' + c.code + ') = ' + aB[c.id] + ' lebih besar dari a_BW = ' + aB[bwm.worst] + ' (tidak logis: Worst seharusnya paling jauh dari Best).' });
        if (aW[c.id] > aW[bwm.best]) warnings.push({ area: 'bwm', field: 'aW:' + c.id, msg: 'a_W(' + c.code + ') = ' + aW[c.id] + ' lebih besar dari a_BW = ' + aW[bwm.best] + '.' });
      });
    }
    var scoreOk = true;
    alts.forEach(function (a) {
      crit.forEach(function (c) {
        var v = getCell(dm.scores, a.id, c.id);
        if (v === undefined || v === null || v === '') { scoreOk = false; errors.push({ area: 'score', field: a.id + ':' + c.id, msg: a.code + ' × ' + c.code + ' masih kosong.' }); }
        else if (!isInt(v) || v < smin || v > smax) { scoreOk = false; errors.push({ area: 'score', field: a.id + ':' + c.id, msg: a.code + ' × ' + c.code + ' = ' + v + ' di luar skala ' + smin + '–' + smax + '.' }); }
        else filled++;
      });
    });
    return { complete: errors.length === 0, bwmOk: bwmOk, scoreOk: scoreOk, errors: errors, warnings: warnings, filled: filled, total: total };
  }

  function dmTypes(dm, crit) {
    return crit.map(function (c) {
      var t = dm.types && dm.types[c.id];
      return t === 'Benefit' || t === 'Cost' ? t : (c.defaultType === 'Cost' ? 'Cost' : 'Benefit');
    });
  }

  function sortedDMs(state) {
    var list = Object.keys(state.dms || {}).map(function (k) { return state.dms[k]; });
    return list.sort(function (a, b) { return (a.order || 0) - (b.order || 0) || (a.code < b.code ? -1 : 1); });
  }

  /* -------------------------------------------------- sensitivity helpers */
  function normalize(w) { var s = sum(w); return w.map(function (v) { return s > 0 ? v / s : 0; }); }

  /** Simulasi what-if: α = bobot suara DM, mult = pengali bobot kriteria (lalu dinormalisasi). */
  function simulate(result, alphas, mult) {
    var per = result.perDM, m = result.alternatives.length, lambda = result.lambda;
    var rankLists = [], scoreLists = [], weights = [];
    per.forEach(function (p) {
      var w = mult ? normalize(p.bwm.w.map(function (v, j) { return v * (mult[j] === undefined ? 1 : mult[j]); })) : p.bwm.w;
      var c = cocosoFromR(p.cocoso.R, w, lambda);
      rankLists.push(c.ranks); scoreLists.push(c.K); weights.push(w);
    });
    var K = per.length;
    var al = alphas || per.map(function () { return 1 / K; });
    var agg = weightedAggregate(rankLists, scoreLists, normalize(al), m);
    return { ranks: agg.ranks, order: agg.order, wborda: agg.wborda, wavg: agg.wavg, dmRanks: rankLists, dmK: scoreLists, weights: weights };
  }

  function dmScenarioDefs(dms) {
    var K = dms.length, defs = [], eq = dms.map(function () { return 1 / K; });
    function pct(a) { return a.map(function (x) { return Math.round(x * 100) + '%'; }).join(' : '); }
    defs.push({ code: 'S0', name: 'Baseline setara (' + pct(eq) + ')', alphas: eq });
    if (K >= 2) {
      dms.forEach(function (dm, k) {
        var dom = K === 2 ? 0.7 : 0.5, rest = (1 - dom) / (K - 1);
        var a = dms.map(function (_, i) { return i === k ? dom : rest; });
        defs.push({ code: 'S' + (k + 1), name: 'Dominasi ' + dm.code + ' — ' + (dm.short || dm.name) + ' (' + pct(a) + ')', alphas: a });
      });
    }
    if (K === 3) {
      defs.push({ code: 'S4', name: 'Fokus ' + dms[0].code + ' + ' + dms[1].code + ' (45% : 45% : 10%)', alphas: [0.45, 0.45, 0.10] });
      defs.push({ code: 'S5', name: 'Fokus ' + dms[0].code + ' + ' + dms[2].code + ' (45% : 10% : 45%)', alphas: [0.45, 0.10, 0.45] });
    }
    return defs;
  }

  /* ------------------------------------------------------------ compute */
  function compute(state) {
    var crit = (state.criteria || []).slice(), alts = (state.alternatives || []).slice();
    var meta = state.meta || {}, lambda = typeof meta.lambda === 'number' ? meta.lambda : 0.5;
    var m = alts.length, n = crit.length, errors = [], warnings = [];
    var allDMs = sortedDMs(state);
    var dmStatus = allDMs.map(function (dm) {
      var v = validateDM(state, dm);
      var state2 = v.complete ? (dm.status === 'submitted' ? 'submitted' : 'ready') : (v.filled > 0 || (dm.bwm && dm.bwm.best) ? 'draft' : 'empty');
      if (dm.status === 'submitted' && !v.complete) state2 = 'needs-revision';
      return { dm: dm, validation: v, status: state2, used: v.complete && dm.status === 'submitted' };
    });
    var res = {
      ok: false, errors: errors, warnings: warnings, lambda: lambda,
      criteria: crit, alternatives: alts, dmStatus: dmStatus, perDM: [], usedDMs: []
    };
    if (n < 2) errors.push('Minimal 2 kriteria diperlukan.');
    if (m < 2) errors.push('Minimal 2 alternatif diperlukan.');
    var used = dmStatus.filter(function (s) { return s.used; }).map(function (s) { return s.dm; });
    res.usedDMs = used;
    if (!used.length) errors.push('Belum ada DM yang mengirim penilaian lengkap.');
    if (errors.length) return res;
    if (used.length < 2) warnings.push('Baru 1 DM yang mengirim penilaian — agregasi grup membutuhkan minimal 2 DM.');
    dmStatus.forEach(function (s) {
      if (!s.used && s.status !== 'empty') warnings.push(s.dm.code + ' belum dihitung (status: ' + s.status + ').');
    });

    var ids = crit.map(function (c) { return c.id; });
    used.forEach(function (dm) {
      var types = dmTypes(dm, crit);
      var X = alts.map(function (a) { return crit.map(function (c) { return dm.scores[a.id][c.id]; }); });
      var aB = ids.map(function (id) { return dm.bwm.aB[id]; }), aW = ids.map(function (id) { return dm.bwm.aW[id]; });
      var bwm = linearBWM(ids.indexOf(dm.bwm.best), ids.indexOf(dm.bwm.worst), aB, aW);
      bwm.bestIdx = ids.indexOf(dm.bwm.best); bwm.worstIdx = ids.indexOf(dm.bwm.worst); bwm.aB = aB; bwm.aW = aW;
      if (!bwm.consistent) warnings.push(dm.code + ': CR input-based ' + bwm.cr.toFixed(4) + ' melebihi ambang Liang ' + bwm.threshold.toFixed(4) + ' — revisi perbandingan BWM disarankan.');
      var cc = cocoso(X, types, bwm.w, lambda);
      cc.flatCols.forEach(function (j) { warnings.push(dm.code + ': semua alternatif bernilai sama pada ' + crit[j].code + ' → r = 1 (kriteria tidak membedakan).'); });
      res.perDM.push({ dm: dm, types: types, X: X, bwm: bwm, cocoso: cc, saw: saw(X, types, bwm.w), topsis: topsis(X, types, bwm.w) });
    });

    var K = res.perDM.length;
    var W = res.perDM.map(function (p) { return p.bwm.w; });
    var wArith = ids.map(function (_, j) { return sum(W.map(function (w) { return w[j]; })) / K; });
    var gRaw = ids.map(function (_, j) { return Math.pow(W.reduce(function (acc, w) { return acc * w[j]; }, 1), 1 / K); });
    var wGeom = normalize(gRaw);
    var matGeo = alts.map(function (_, i) { return ids.map(function (_, j) { return Math.pow(res.perDM.reduce(function (acc, p) { return acc * p.X[i][j]; }, 1), 1 / K); }); });
    var matAri = alts.map(function (_, i) { return ids.map(function (_, j) { return sum(res.perDM.map(function (p) { return p.X[i][j]; })) / K; }); });

    var rankLists = res.perDM.map(function (p) { return p.cocoso.ranks; });
    var KLists = res.perDM.map(function (p) { return p.cocoso.K; });
    var agg = bordaAggregate(rankLists, KLists, m);
    var cope = copeland(rankLists, m);
    res.group = {
      wArith: wArith, wGeom: wGeom, matGeo: matGeo, matAri: matAri,
      borda: agg.borda, avgK: agg.avg, order: agg.order, finalRank: agg.finalRank, copeland: cope,
      copelandRank: rankDesc(cope.map(function (c) { return c.net; })),
      winnerIdx: agg.order[0]
    };

    // Pembanding SAW & TOPSIS (Butir 4.8)
    var sawAgg = bordaAggregate(res.perDM.map(function (p) { return p.saw.ranks; }), res.perDM.map(function (p) { return p.saw.scores; }), m);
    var topAgg = bordaAggregate(res.perDM.map(function (p) { return p.topsis.ranks; }), res.perDM.map(function (p) { return p.topsis.scores; }), m);
    res.benchmarks = {
      saw: { borda: sawAgg.borda, avg: sawAgg.avg, finalRank: sawAgg.finalRank, spearman: spearman(agg.finalRank, sawAgg.finalRank) },
      topsis: { borda: topAgg.borda, avg: topAgg.avg, finalRank: topAgg.finalRank, spearman: spearman(agg.finalRank, topAgg.finalRank) },
      sawVsTopsis: spearman(sawAgg.finalRank, topAgg.finalRank)
    };

    // Sensitivitas bobot DM & bobot kriteria (Butir 4.9 / 5.9)
    var dmDefs = dmScenarioDefs(used);
    var dmScen = dmDefs.map(function (d) {
      var r = weightedAggregate(rankLists, KLists, d.alphas, m);
      var sp = spearman(agg.finalRank, r.ranks);
      return { code: d.code, name: d.name, alphas: d.alphas, ranks: r.ranks, wborda: r.wborda, rho: sp.rho, sumD2: sp.sumD2, winnerIdx: r.order[0] };
    });
    var critDefs = [{ code: 'W0', name: 'Baseline bobot Linear BWM asli', spec: null }];
    crit.forEach(function (c, j) { critDefs.push({ code: 'W' + (j + 1), name: 'Bobot ' + c.code + ' ' + (c.short || c.name) + ' +30% (dinormalisasi)', spec: j }); });
    critDefs.push({ code: 'W' + (n + 1), name: 'Bobot seragam (1/' + n + ' = ' + (1 / n).toFixed(4) + ')', spec: 'equal' });
    var critScen = critDefs.map(function (d) {
      var dmW = [], dmR = [], dmK = [];
      res.perDM.forEach(function (p) {
        var w;
        if (d.spec === null) w = p.bwm.w.slice();
        else if (d.spec === 'equal') w = p.bwm.w.map(function () { return 1 / n; });
        else w = normalize(p.bwm.w.map(function (v, j) { return j === d.spec ? v * 1.3 : v; }));
        var c = cocosoFromR(p.cocoso.R, w, lambda);
        dmW.push(w); dmR.push(c.ranks); dmK.push(c.K);
      });
      var b = [], a = [];
      for (var i = 0; i < m; i++) {
        var bb = 0, ss = 0;
        for (var k = 0; k < K; k++) { bb += m - dmR[k][i]; ss += dmK[k][i]; }
        b.push(bb); a.push(ss / K);
      }
      var order = b.map(function (_, i2) { return i2; }).sort(function (x, y) {
        if (b[y] !== b[x]) return b[y] - b[x];
        var ax = round9(a[x]), ay = round9(a[y]);
        if (ay !== ax) return ay - ax;
        return x - y;
      });
      var ranks = zeros(m); order.forEach(function (idx, pos) { ranks[idx] = pos + 1; });
      var sp = spearman(agg.finalRank, ranks);
      return { code: d.code, name: d.name, dmWeights: dmW, dmRanks: dmR, borda: b, avgK: a, ranks: ranks, rho: sp.rho, sumD2: sp.sumD2, winnerIdx: order[0] };
    });
    var allScen = dmScen.concat(critScen);
    res.sensitivity = {
      dmScenarios: dmScen, critScenarios: critScen,
      winnerStable: allScen.filter(function (s) { return s.winnerIdx === agg.order[0]; }).length,
      total: allScen.length,
      minRho: min(allScen.map(function (s) { return s.rho; }))
    };

    // Kesepakatan antar-DM (Butir 4.10)
    var perAlt = alts.map(function (a, i) {
      var rks = rankLists.map(function (r) { return r[i]; });
      var rng = max(rks) - min(rks), ratio = m > 1 ? rng / (m - 1) : 0, level;
      if (K < 2) level = 'Satu DM';
      else if (ratio >= 0.75) level = 'Paling diperdebatkan';
      else if (ratio >= 0.5) level = 'Perdebatan menengah';
      else if (ratio >= 0.35) level = 'Kompromi (beda sedang)';
      else level = 'Kesepakatan tinggi';
      return { idx: i, ranks: rks, min: min(rks), max: max(rks), range: rng, std: stdSample(rks), sum: sum(rks), level: level, copeland: cope[i] };
    });
    var Rsum = perAlt.map(function (p) { return p.sum; }), Rbar = sum(Rsum) / m;
    var Sk = sum(Rsum.map(function (r) { return (r - Rbar) * (r - Rbar); }));
    var kendallW = K >= 2 ? (12 * Sk) / (K * K * (m * m * m - m)) : 1;
    var pairs = [];
    for (var x = 0; x < K; x++) for (var y = x + 1; y < K; y++) {
      pairs.push({ a: res.perDM[x].dm, b: res.perDM[y].dm, sp: spearman(rankLists[x], rankLists[y]) });
    }
    res.agreement = {
      perAlt: perAlt,
      byControversy: perAlt.slice().sort(function (p, q) { return q.range - p.range || q.std - p.std || p.idx - q.idx; }),
      kendall: { Rbar: Rbar, S: Sk, W: kendallW },
      pairs: pairs
    };
    res.ok = true;
    return res;
  }

  function kendallLabel(W) {
    if (W >= 0.7) return 'Kesepakatan kuat';
    if (W >= 0.5) return 'Kesepakatan cukup';
    if (W >= 0.3) return 'Kesepakatan moderat';
    return 'Kesepakatan lemah';
  }

  /** Konversi data objektif → skor 1–5 memakai aturan interval milik DM (sama dengan rumus IF bertingkat di Excel Sheet 2). */
  function scoreFromRule(value, rule) {
    if (value === null || value === undefined || value === '' || !rule || !rule.bounds) return null;
    var v = Number(value);
    if (!isFinite(v)) return null;
    for (var k = 0; k < rule.bounds.length; k++) {
      if (rule.mode === 'lt' ? v < rule.bounds[k] : v <= rule.bounds[k]) return k + 1;
    }
    return rule.bounds.length + 1;
  }

  var API = {
    version: '1.0.0',
    LIANG_THRESHOLDS: LIANG_THRESHOLDS,
    liangThreshold: liangThreshold,
    rankDesc: rankDesc, spearman: spearman, stdSample: stdSample,
    solveLP: solveLP, linearBWM: linearBWM, cocoso: cocoso, cocosoFromR: cocosoFromR,
    saw: saw, topsis: topsis, bordaAggregate: bordaAggregate, weightedAggregate: weightedAggregate, copeland: copeland,
    validateDM: validateDM, dmTypes: dmTypes, sortedDMs: sortedDMs, compute: compute, simulate: simulate,
    kendallLabel: kendallLabel, scoreFromRule: scoreFromRule, normalize: normalize
  };
  root.GDSSEngine = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
