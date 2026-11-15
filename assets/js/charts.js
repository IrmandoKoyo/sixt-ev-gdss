/*!
 * Sixt EV GDSS — Pure Vector SVG Visualization Engine (charts.js)
 * Crafted with Apple Human Interface Guidelines (HIG) palette & typography.
 * Memenuhi Butir 6.6: Grafik Ranking Konsensus & Perbandingan Preferensi Antar-DM.
 */
(function (root) {
  'use strict';

  /* Refined Apple System Palette for DMs */
  var DM_COLORS = ['#0066CC', '#0D7A5F', '#5856D6', '#AF52DE', '#0071E3', '#32ADE6'];

  function dmColor(p, k) {
    if (k === 0) return '#0066CC';
    if (k === 1) return '#0D7A5F';
    if (k === 2) return '#5856D6';
    return (p && p.dm && p.dm.color) || DM_COLORS[k % DM_COLORS.length];
  }

  function esc(s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* 1. Grafik Batang Bertumpuk Poin Borda Grup & Tie-Breaker K_bar */
  function renderBordaChart(res) {
    if (!res || !res.ok) return '<p>Data belum lengkap untuk grafik.</p>';
    var alts = res.alternatives, m = alts.length, K = res.perDM.length;
    var order = res.group.order;
    var maxBorda = Math.max(1, m * K);
    var rowH = 40, topPad = 40, botPad = 24, leftW = 212, rightW = 142, chartW = 456;
    var W = leftW + chartW + rightW, H = topPad + m * rowH + botPad;

    var svg = [];
    svg.push('<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="auto" role="img" aria-label="Grafik Poin Borda Konsensus Grup" style="display:block;max-width:100%;font-family:-apple-system,BlinkMacSystemFont,Inter,sans-serif;">');

    // Legend
    var lx = leftW;
    res.perDM.forEach(function (p, k) {
      var col = dmColor(p, k);
      svg.push('<rect x="' + lx + '" y="10" width="11" height="11" rx="3.5" fill="' + col + '"/>');
      var lbl = esc(p.dm.code + ' (' + (p.dm.short || p.dm.name) + ')');
      svg.push('<text x="' + (lx + 16) + '" y="19.5" font-size="11.2" font-weight="600" fill="currentColor">' + lbl + '</text>');
      lx += 145;
    });

    order.forEach(function (altIdx, pos) {
      var a = alts[altIdx];
      var y = topPad + pos * rowH;
      var borda = res.group.borda[altIdx];
      var avgK = res.group.avgK[altIdx];
      var rk = res.group.finalRank[altIdx];

      svg.push('<line x1="8" y1="' + (y + rowH - 5) + '" x2="' + (W - 8) + '" y2="' + (y + rowH - 5) + '" stroke="rgba(134,134,139,0.18)" stroke-width="1"/>');
      var badgeBg = rk === 1 ? '#0071E3' : (rk === 2 ? '#0D7A5F' : (rk === 3 ? '#5856D6' : '#86868B'));
      svg.push('<rect x="8" y="' + (y + 5) + '" width="28" height="22" rx="6" fill="' + badgeBg + '"/>');
      svg.push('<text x="22" y="' + (y + 20) + '" text-anchor="middle" font-size="10.8" font-weight="700" fill="#ffffff">#' + rk + '</text>');
      svg.push('<text x="44" y="' + (y + 20) + '" font-size="11.8" font-weight="600" fill="currentColor">' + esc(a.code + ' — ' + a.name.slice(0, 22)) + '</text>');

      // Track
      svg.push('<rect x="' + leftW + '" y="' + (y + 6) + '" width="' + chartW + '" height="20" rx="5" fill="rgba(134,134,139,0.12)"/>');
      var curX = leftW;
      res.perDM.forEach(function (p, k) {
        var pts = m - p.cocoso.ranks[altIdx];
        var segW = (pts / maxBorda) * chartW;
        var col = dmColor(p, k);
        if (segW > 0) {
          svg.push('<rect x="' + curX.toFixed(1) + '" y="' + (y + 6) + '" width="' + Math.max(2, segW - 1.2).toFixed(1) + '" height="20" rx="3" fill="' + col + '"><title>' + esc(p.dm.code + ': Rank #' + p.cocoso.ranks[altIdx] + ' = ' + pts + ' poin Borda') + '</title></rect>');
          if (segW >= 24) {
            svg.push('<text x="' + (curX + segW / 2).toFixed(1) + '" y="' + (y + 19.5) + '" text-anchor="middle" font-size="10.2" font-weight="600" fill="#ffffff">+' + pts + '</text>');
          }
          curX += segW;
        }
      });

      svg.push('<text x="' + (leftW + chartW + 10) + '" y="' + (y + 20) + '" font-size="11.2" font-weight="700" fill="currentColor">' + borda + ' pt  (K̄=' + avgK.toFixed(3) + ')</text>');
    });
    svg.push('</svg>');
    return svg.join('');
  }

  /* 2. Grafik Perbandingan Skor CoCoSo (Ki) Antar-DM per Alternatif */
  function renderDMPreferenceKChart(res) {
    if (!res || !res.ok) return '';
    var alts = res.alternatives, m = alts.length, K = res.perDM.length;
    var maxK = 0.1;
    res.perDM.forEach(function (p) { p.cocoso.K.forEach(function (v) { if (v > maxK) maxK = v; }); });
    maxK = Math.ceil(maxK * 1.08 * 10) / 10;

    var W = 780, H = 310, padL = 48, padR = 20, padT = 36, padB = 56;
    var plotW = W - padL - padR, plotH = H - padT - padB;
    var groupW = plotW / m;
    var barW = Math.min(22, Math.max(8, (groupW - 18) / Math.max(1, K)));

    var svg = [];
    svg.push('<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="auto" role="img" aria-label="Grafik Perbandingan Skor Ki Antar-DM" style="display:block;max-width:100%;font-family:-apple-system,BlinkMacSystemFont,Inter,sans-serif;">');

    for (var g = 0; g <= 4; g++) {
      var val = (maxK * g) / 4;
      var gy = padT + plotH - (g / 4) * plotH;
      svg.push('<line x1="' + padL + '" y1="' + gy.toFixed(1) + '" x2="' + (W - padR) + '" y2="' + gy.toFixed(1) + '" stroke="rgba(134,134,139,0.20)" stroke-dasharray="3,3"/>');
      svg.push('<text x="' + (padL - 6) + '" y="' + (gy + 4).toFixed(1) + '" text-anchor="end" font-size="10.2" fill="currentColor">' + val.toFixed(1) + '</text>');
    }

    alts.forEach(function (a, i) {
      var gx = padL + i * groupW + (groupW - K * barW) / 2;
      res.perDM.forEach(function (p, k) {
        var kv = p.cocoso.K[i], rk = p.cocoso.ranks[i];
        var bh = (kv / maxK) * plotH;
        var bx = gx + k * barW;
        var by = padT + plotH - bh;
        var col = dmColor(p, k);
        svg.push('<rect x="' + bx.toFixed(1) + '" y="' + by.toFixed(1) + '" width="' + (barW - 2).toFixed(1) + '" height="' + Math.max(2, bh).toFixed(1) + '" rx="3" fill="' + col + '"><title>' + esc(a.code + ' — ' + p.dm.code + ': Ki=' + kv.toFixed(4) + ' (Rank #' + rk + ')') + '</title></rect>');
        svg.push('<text x="' + (bx + (barW - 2) / 2).toFixed(1) + '" y="' + (by - 4).toFixed(1) + '" text-anchor="middle" font-size="9" font-weight="700" fill="' + col + '">#' + rk + '</text>');
      });
      var cx = padL + i * groupW + groupW / 2;
      svg.push('<text x="' + cx.toFixed(1) + '" y="' + (padT + plotH + 18) + '" text-anchor="middle" font-size="10.8" font-weight="700" fill="currentColor">' + esc(a.code) + '</text>');
      svg.push('<text x="' + cx.toFixed(1) + '" y="' + (padT + plotH + 32) + '" text-anchor="middle" font-size="9.4" fill="#86868B">' + esc(a.name.split(' ').slice(0, 2).join(' ')) + '</text>');
    });

    svg.push('</svg>');
    return svg.join('');
  }

  /* 3. Grafik Perbandingan Bobot Kriteria Linear BWM Antar-DM (wj*) */
  function renderWeightsComparisonChart(res) {
    if (!res || !res.ok) return '';
    var crit = res.criteria, n = crit.length, K = res.perDM.length;
    var maxW = 0.45;
    res.perDM.forEach(function (p) { p.bwm.w.forEach(function (v) { if (v > maxW) maxW = v; }); });
    maxW = Math.ceil(maxW * 1.1 * 20) / 20;

    var W = 780, H = 300, padL = 52, padR = 20, padT = 36, padB = 52;
    var plotW = W - padL - padR, plotH = H - padT - padB;
    var groupW = plotW / n;
    var cols = K + 1;
    var barW = Math.min(20, Math.max(8, (groupW - 20) / cols));

    var svg = [];
    svg.push('<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="auto" role="img" aria-label="Grafik Bobot Kriteria Linear BWM Antar-DM" style="display:block;max-width:100%;font-family:-apple-system,BlinkMacSystemFont,Inter,sans-serif;">');

    // Legend
    var lx = padL;
    res.perDM.forEach(function (p, k) {
      var col = dmColor(p, k);
      svg.push('<rect x="' + lx + '" y="8" width="10" height="10" rx="3" fill="' + col + '"/>');
      svg.push('<text x="' + (lx + 14) + '" y="17" font-size="10.4" font-weight="600" fill="currentColor">' + esc(p.dm.code) + '</text>');
      lx += 72;
    });
    svg.push('<rect x="' + lx + '" y="8" width="10" height="10" rx="3" fill="#1D1D1F"/>');
    svg.push('<text x="' + (lx + 14) + '" y="17" font-size="10.4" font-weight="600" fill="currentColor">Rata-rata Grup (w̄_j)</text>');

    for (var g = 0; g <= 4; g++) {
      var val = (maxW * g) / 4;
      var gy = padT + plotH - (g / 4) * plotH;
      svg.push('<line x1="' + padL + '" y1="' + gy.toFixed(1) + '" x2="' + (W - padR) + '" y2="' + gy.toFixed(1) + '" stroke="rgba(134,134,139,0.20)" stroke-dasharray="3,3"/>');
      svg.push('<text x="' + (padL - 6) + '" y="' + (gy + 4).toFixed(1) + '" text-anchor="end" font-size="10.2" fill="currentColor">' + (val * 100).toFixed(0) + '%</text>');
    }

    crit.forEach(function (c, j) {
      var gx = padL + j * groupW + (groupW - cols * barW) / 2;
      res.perDM.forEach(function (p, k) {
        var wv = p.bwm.w[j];
        var bh = (wv / maxW) * plotH;
        var bx = gx + k * barW, by = padT + plotH - bh;
        var col = dmColor(p, k);
        svg.push('<rect x="' + bx.toFixed(1) + '" y="' + by.toFixed(1) + '" width="' + (barW - 2).toFixed(1) + '" height="' + Math.max(2, bh).toFixed(1) + '" rx="3" fill="' + col + '"><title>' + esc(p.dm.code + ' ' + c.code + ': ' + (wv * 100).toFixed(2) + '%') + '</title></rect>');
      });
      var wa = res.group.wArith[j];
      var bha = (wa / maxW) * plotH;
      var bxa = gx + K * barW, bya = padT + plotH - bha;
      svg.push('<rect x="' + bxa.toFixed(1) + '" y="' + bya.toFixed(1) + '" width="' + (barW - 2).toFixed(1) + '" height="' + Math.max(2, bha).toFixed(1) + '" rx="3" fill="#1D1D1F"><title>' + esc('Rata-rata Grup ' + c.code + ': ' + (wa * 100).toFixed(2) + '%') + '</title></rect>');

      var cx = padL + j * groupW + groupW / 2;
      svg.push('<text x="' + cx.toFixed(1) + '" y="' + (padT + plotH + 18) + '" text-anchor="middle" font-size="10.8" font-weight="700" fill="currentColor">' + esc(c.code) + '</text>');
      svg.push('<text x="' + cx.toFixed(1) + '" y="' + (padT + plotH + 32) + '" text-anchor="middle" font-size="9.4" fill="#86868B">' + esc(c.short || c.name.slice(0, 12)) + '</text>');
    });

    svg.push('</svg>');
    return svg.join('');
  }

  /* 4. Dumbbell Chart Rentang Perdebatan Peringkat Antar-DM (Butir 4.10 & 6.6) */
  function renderControversyRangeChart(res) {
    if (!res || !res.ok) return '';
    var alts = res.alternatives, m = alts.length;
    var rowH = 36, padT = 32, padB = 26, leftW = 195, rightW = 145, plotW = 415;
    var W = leftW + plotW + rightW, H = padT + m * rowH + padB;

    var svg = [];
    svg.push('<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="auto" role="img" aria-label="Peta Rentang Perdebatan Peringkat Antar-DM" style="display:block;max-width:100%;font-family:-apple-system,BlinkMacSystemFont,Inter,sans-serif;">');

    for (var r = 1; r <= m; r++) {
      var rx = leftW + ((r - 1) / Math.max(1, m - 1)) * plotW;
      svg.push('<line x1="' + rx.toFixed(1) + '" y1="' + (padT - 8) + '" x2="' + rx.toFixed(1) + '" y2="' + (H - padB) + '" stroke="rgba(134,134,139,0.20)" stroke-dasharray="2,2"/>');
      svg.push('<text x="' + rx.toFixed(1) + '" y="' + (padT - 12) + '" text-anchor="middle" font-size="10.2" font-weight="600" fill="currentColor">Rank #' + r + '</text>');
    }

    res.agreement.byControversy.forEach(function (item, idx) {
      var a = alts[item.idx];
      var y = padT + idx * rowH + 14;
      var xMin = leftW + ((item.min - 1) / Math.max(1, m - 1)) * plotW;
      var xMax = leftW + ((item.max - 1) / Math.max(1, m - 1)) * plotW;
      var lineCol = item.range >= 5 ? '#D70015' : (item.range >= 3 ? '#B25000' : '#1D7D46');

      svg.push('<text x="10" y="' + (y + 4) + '" font-size="11.4" font-weight="600" fill="currentColor">' + esc(a.code + ' — ' + a.name.slice(0, 21)) + '</text>');
      svg.push('<line x1="' + xMin.toFixed(1) + '" y1="' + y + '" x2="' + xMax.toFixed(1) + '" y2="' + y + '" stroke="' + lineCol + '" stroke-width="4.5" stroke-linecap="round" opacity="0.38"/>');

      item.ranks.forEach(function (rk, k) {
        var p = res.perDM[k];
        var cx = leftW + ((rk - 1) / Math.max(1, m - 1)) * plotW + (k - 1) * 4.5;
        var col = dmColor(p, k);
        svg.push('<circle cx="' + cx.toFixed(1) + '" cy="' + y + '" r="8" fill="' + col + '" stroke="#ffffff" stroke-width="1.5"><title>' + esc(p.dm.code + ': Rank #' + rk) + '</title></circle>');
        svg.push('<text x="' + cx.toFixed(1) + '" y="' + (y + 3.2) + '" text-anchor="middle" font-size="8.4" font-weight="700" fill="#ffffff">' + (k + 1) + '</text>');
      });

      svg.push('<text x="' + (leftW + plotW + 14) + '" y="' + (y + 4) + '" font-size="10.8" font-weight="600" fill="' + lineCol + '">ΔRank = ' + item.range + ' (s=' + item.std.toFixed(2) + ')</text>');
    });

    svg.push('</svg>');
    return svg.join('');
  }

  root.GDSSCharts = {
    renderBordaChart: renderBordaChart,
    renderDMPreferenceKChart: renderDMPreferenceKChart,
    renderWeightsComparisonChart: renderWeightsComparisonChart,
    renderControversyRangeChart: renderControversyRangeChart
  };
})(typeof window !== 'undefined' ? window : globalThis);
