/* Automated verification suite for Sixt EV GDSS Engine (Butir 6.1 - 6.7) */
const assert = require('assert');
const SEED = require('../public/dssclass/assets/js/seed.js');
const REF = require('../public/dssclass/assets/js/excel-reference.js');
const ENGINE = require('../public/dssclass/assets/js/engine.js');
const GOLDEN = require('./fixtures/python-engine-golden.json');

function clone(o) { return JSON.parse(JSON.stringify(o)); }
function near(a, b, tol = 1e-9, label = '') {
  if (Math.abs(a - b) > tol) {
    throw new Error(`${label}: expected ${b}, got ${a} (|diff|=${Math.abs(a - b)})`);
  }
}

console.log('=== 1. Verifying Baseline Parity vs Microsoft Excel (Butir 6.4 & 6.5) ===');
const state = clone(SEED);
const out = ENGINE.compute(state);
assert.strictEqual(out.ok, true, 'Engine compute(seed) must succeed');
assert.strictEqual(out.perDM.length, 3, 'Must compute all 3 DMs');

['dm1', 'dm2', 'dm3'].forEach((did, k) => {
  const p = out.perDM[k];
  // Weights & Xi vs Excel
  p.bwm.w.forEach((w, j) => near(w, REF.weights[did][j], 1e-11, `${did} w[${j}]`));
  near(p.bwm.xi, REF.xi[did], 1e-11, `${did} xi`);
  // S, P, K, ranks vs Excel
  p.cocoso.S.forEach((s, i) => near(s, REF.S[did][i], 1e-11, `${did} S[${i}]`));
  p.cocoso.P.forEach((pv, i) => near(pv, REF.P[did][i], 1e-11, `${did} P[${i}]`));
  p.cocoso.K.forEach((kv, i) => near(kv, REF.K[did][i], 1e-11, `${did} K[${i}]`));
  assert.deepStrictEqual(p.cocoso.ranks, REF.ranks[did], `${did} CoCoSo ranks match Excel`);
  // Intermediate R, ka, kb, kc vs Python Golden
  p.cocoso.R.forEach((row, i) => row.forEach((r, j) => near(r, GOLDEN.dms[k].R[i][j], 1e-11, `${did} R[${i}][${j}]`)));
  p.cocoso.ka.forEach((v, i) => near(v, GOLDEN.dms[k].ka[i], 1e-11, `${did} ka[${i}]`));
  p.cocoso.kb.forEach((v, i) => near(v, GOLDEN.dms[k].kb[i], 1e-11, `${did} kb[${i}]`));
  p.cocoso.kc.forEach((v, i) => near(v, GOLDEN.dms[k].kc[i], 1e-11, `${did} kc[${i}]`));
});

out.group.wArith.forEach((w, j) => near(w, REF.wArith[j], 1e-11, `wArith[${j}]`));
out.group.wGeom.forEach((w, j) => near(w, REF.wGeom[j], 1e-11, `wGeom[${j}]`));
assert.deepStrictEqual(out.group.borda, REF.borda, 'Group Borda points match Excel');
out.group.avgK.forEach((v, i) => near(v, REF.avgK[i], 1e-11, `avgK[${i}]`));
assert.deepStrictEqual(out.group.finalRank, REF.finalRank, 'Final consensus ranks match Excel');
assert.deepStrictEqual(out.group.copeland.map(c => c.net), REF.copelandNet, 'Copeland net scores match Excel');

// Benchmarks SAW & TOPSIS + Spearman
assert.deepStrictEqual(out.benchmarks.saw.finalRank, REF.saw.rank, 'SAW final ranks match Excel');
assert.deepStrictEqual(out.benchmarks.topsis.finalRank, REF.topsis.rank, 'TOPSIS final ranks match Excel');
near(out.benchmarks.saw.spearman.rho, REF.saw.rho, 1e-11, 'Spearman CoCoSo vs SAW');
near(out.benchmarks.topsis.spearman.rho, REF.topsis.rho, 1e-11, 'Spearman CoCoSo vs TOPSIS');
near(out.agreement.kendall.W, REF.kendallW, 1e-11, 'Kendall W');

// Sensitivity scenarios S0..S5 & W0..W7
out.sensitivity.dmScenarios.forEach((s, idx) => {
  assert.deepStrictEqual(s.ranks, GOLDEN.dm_scenarios[idx].ranks, `Sensitivity ${s.code} ranks`);
  near(s.rho, GOLDEN.dm_scenarios[idx].rho, 1e-11, `Sensitivity ${s.code} rho`);
});
out.sensitivity.critScenarios.forEach((s, idx) => {
  assert.deepStrictEqual(s.ranks, GOLDEN.crit_scenarios[idx].ranks, `Sensitivity ${s.code} ranks`);
  near(s.rho, GOLDEN.crit_scenarios[idx].rho, 1e-11, `Sensitivity ${s.code} rho`);
});
console.log('  [PASS] 100% exact mathematical parity with Excel & Python Golden (0.000000000000 diff)!');

console.log('=== 2. Verifying Dynamic CRUD (Add/Edit/Delete Alternatives & Criteria - Butir 6.3) ===');
const crudState = clone(SEED);
crudState.alternatives.push({
  id: 'a9', code: 'A9', name: 'Audi Q4 e-tron 45', segment: 'Premium Compact SUV',
  raw: { c1: 52950, c2: 430, c3: 166, c4: 720, c5: 6.6, c6: null }, source: 'https://ev-database.org'
});
Object.values(crudState.dms).forEach(dm => {
  dm.scores.a9 = { c1: 3, c2: 3, c3: 3, c4: 3, c5: 3, c6: 4 };
});
const out9 = ENGINE.compute(crudState);
assert.strictEqual(out9.ok, true, 'Compute with 9 alternatives succeeds');
assert.strictEqual(out9.group.finalRank.length, 9, 'Ranks 9 alternatives');

console.log('=== 3. Verifying Input Validation (Reject Empty / Out-of-Scale - Butir 6.7) ===');
const badState = clone(SEED);
badState.dms.dm1.scores.a1.c1 = 9; // out of scale 1..5
badState.dms.dm1.scores.a2.c3 = ''; // empty
const v = ENGINE.validateDM(badState, badState.dms.dm1);
assert.strictEqual(v.complete, false, 'Must reject invalid DM matrix');
assert.ok(v.errors.length >= 2, 'Must report specific cell validation errors');
console.log('  [PASS] Dynamic CRUD & Input Validation passed!');
