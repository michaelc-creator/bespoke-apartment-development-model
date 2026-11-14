/* Bespoke Underwriting — Apartment Development Model UI. Engine: js/acre-model.js (port of the A.CRE Apartment Development Model v3.0). */
(function () {
  'use strict';
  var A = window.ACREModel, D = A.defaults(), S = A.defaults(), R = null, selKpi = 'leveredIrr';
  var $ = function (id) { return document.getElementById(id); };
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function get(o, p) { return p.split('.').reduce(function (a, k) { return a == null ? a : a[k]; }, o); }
  function set(o, p, v) { var k = p.split('.'), x = o; for (var i = 0; i < k.length - 1; i++) x = x[k[i]]; x[k[k.length - 1]] = v; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ---------- formatting ---------- */
  function n0(v) { return isFinite(v) ? Math.round(v).toLocaleString('en-US') : '–'; }
  function money(v) { if (!isFinite(v)) return '–'; var s = '$' + n0(Math.abs(v)); return v < -0.5 ? '(' + s + ')' : s; }
  function moneyC(v) { if (!isFinite(v)) return '–'; var a = Math.abs(v), s = a >= 1e9 ? (a / 1e9).toFixed(2) + 'B' : a >= 1e6 ? (a / 1e6).toFixed(a >= 1e8 ? 0 : 1) + 'M' : a >= 1e3 ? (a / 1e3).toFixed(0) + 'K' : a.toFixed(0); return (v < 0 ? '-$' : '$') + s; }
  function pct(v, d) { return isFinite(v) ? (v * 100).toFixed(d == null ? 2 : d) + '%' : '–'; }
  function x2(v) { return isFinite(v) ? v.toFixed(2) + 'x' : '–'; }
  function bps(v) { return isFinite(v) ? Math.round(v) + ' bps' : '–'; }
  function cls(v) { return v < -0.5 ? ' neg' : ''; }

  /* ---------- input definitions (A.CRE input cells in comments) ---------- */
  var tEnd = { get: function (s) { return s.timing.construction[1]; }, set: function (s, v) { v = Math.max(1, Math.round(v)); ['construction', 'otherHard', 'cm', 'devFee', 'sitework'].forEach(function (k) { s.timing[k][1] = v; }); } };
  var GROUPS = [
    { title: 'Timing', fields: [
      { p: 'startDate', label: 'Analysis start date', f: 'date' },
      { label: 'Construction end month', f: 'n', min: 6, max: 48, step: 1, slider: true, acc: tEnd, unit: 'months' },
      { p: 'timing.ae.1', label: 'A&E end month', f: 'n', min: 1, max: 36, step: 1, unit: 'month' },
      { p: 'timing.marketing.0', label: 'Marketing start month', f: 'n', min: 1, max: 48, step: 1, unit: 'month' },
      { p: 'timing.marketing.1', label: 'Marketing end month', f: 'n', min: 1, max: 48, step: 1, unit: 'month' }
    ] },
    { title: 'Development budget', id: 'budget', hard: [
      { p: 'constructionPerUnit', label: 'Hard cost per unit', f: '$', min: 50000, max: 400000, step: 1000, slider: true },
      { p: 'otherHardPct', label: 'Other hard costs', f: '%', min: 0, max: 0.10, step: 0.0025, slider: true, hint: '% of construction cost' }
    ], fields: [
      { p: 'landPrice', label: 'Land price', f: '$', min: 0, max: 30000000, step: 10000, slider: true },
      { p: 'closingCosts', label: 'Land closing costs', f: '$', min: 0, max: 2000000, step: 5000 },
      { p: 'aePct', label: 'Architecture & engineering', f: '%', min: 0, max: 0.15, step: 0.0025, slider: true, hint: '% of hard costs' },
      { p: 'cmPct', label: 'Construction management', f: '%', min: 0, max: 0.10, step: 0.0025, hint: '% of hard costs' },
      { p: 'marketing', label: 'Marketing and leasing', f: '$', min: 0, max: 1000000, step: 5000 },
      { p: 'devFeePct', label: 'Development fee', f: '%', min: 0, max: 0.08, step: 0.0025, slider: true, hint: '% of land, hard and soft costs' },
      { p: 'financingFees', label: 'Financing fees', f: '$', min: 0, max: 2000000, step: 5000 }
    ] },
    { title: 'Construction loan and permanent loan', fields: [
      { p: 'ltc', label: 'Construction loan-to-cost', f: '%', min: 0, max: 0.85, step: 0.005, slider: true },
      { p: 'constRate', label: 'Construction interest rate', f: '%', min: 0.02, max: 0.15, step: 0.0025, slider: true },
      { p: 'permOn', label: 'Permanent loan', f: 'sel', opts: [[false, 'Off'], [true, 'On']] },
      { p: 'permLtv', label: 'Perm loan LTV', f: '%', min: 0, max: 0.8, step: 0.005, hint: 'Used when sizing on value' },
      { p: 'permSizing', label: 'Perm loan sizing', f: 'sel', opts: [['Construction Debt', 'Refinance construction loan'], ['LTV', 'Loan-to-value']] },
      { p: 'permRate', label: 'Perm interest rate (IO)', f: '%', min: 0.02, max: 0.12, step: 0.0025 },
      { p: 'permFeePct', label: 'Perm loan fee', f: '%', min: 0, max: 0.03, step: 0.0025 }
    ] },
    { title: 'Lease-up and revenue', fields: [
      { p: 'rentGrowth', label: 'Rent growth (annual)', f: '%', min: -0.02, max: 0.08, step: 0.0025, slider: true },
      { p: 'preLeased', label: 'Pre-leased at opening', f: '%', min: 0, max: 1, step: 0.01 },
      { p: 'leasePace', label: 'Lease-up pace', f: 'n', min: 1, max: 100, step: 1, slider: true, unit: 'units / mo' },
      { p: 'leaseTerm', label: 'Lease term', f: 'n', min: 6, max: 24, step: 1, unit: 'months' },
      { p: 'nonRevenueUnits', label: 'Non-revenue units', f: 'n', min: 0, max: 50, step: 1, unit: 'units' },
      { p: 'rubs', label: 'RUBS income (annual)', f: '$', min: 0, max: 2000000, step: 5000 },
      { p: 'otherIncomePctOfRent', label: 'Other income', f: '%', min: 0, max: 0.15, step: 0.0025, hint: '% of rental income' },
      { p: 'parkingStructured', label: 'Paid parking spaces', f: 'n', min: 0, max: 2000, step: 1, unit: 'spaces' },
      { p: 'parkingPerSpaceMo', label: 'Parking rent', f: '$', min: 0, max: 500, step: 5, unit: '/ space / mo' },
      { p: 'parkingOccupancy', label: 'Parking occupancy', f: '%', min: 0, max: 1, step: 0.01 },
      { p: 'otherIncomeGrowth', label: 'Other income growth', f: '%', min: -0.02, max: 0.08, step: 0.0025 },
      { p: 'vacancy', label: 'Stabilized vacancy', f: '%', min: 0, max: 0.2, step: 0.0025, slider: true },
      { p: 'creditLoss', label: 'Credit loss', f: '%', min: 0, max: 0.05, step: 0.0025 }
    ] },
    { title: 'Operating expenses and capex', fields: [
      { p: 'expenseGrowth', label: 'Expense growth (annual)', f: '%', min: -0.02, max: 0.08, step: 0.0025, slider: true },
      { p: 'mgmtFeePct', label: 'Management fee', f: '%', min: 0, max: 0.08, step: 0.0025, hint: '% of effective gross revenue' },
      { p: 'insurance', label: 'Insurance (annual)', f: '$', min: 0, max: 1000000, step: 1000 },
      { p: 'propertyTax', label: 'Property tax (stabilized, annual)', f: '$', min: 0, max: 3000000, step: 1000 },
      { p: 'saleYearTax', label: 'Sale-year property tax', f: '$', min: 0, max: 3000000, step: 1000, hint: 'Not linked to property tax above' },
      { p: 'otherCapex', label: 'Capital expenditures (annual)', f: '$', min: 0, max: 500000, step: 1000 }
    ] },
    { title: 'Valuation and sale', fields: [
      { p: 'capRateToday', label: 'Market cap rate today', f: '%', min: 0.03, max: 0.10, step: 0.0005, slider: true },
      { p: 'exitCap', label: 'Exit cap rate', f: '%', min: 0.03, max: 0.10, step: 0.0005, slider: true },
      { p: 'sellingCosts', label: 'Selling costs', f: '%', min: 0, max: 0.05, step: 0.0025 }
    ] },
    { title: 'Partnership waterfall', fields: [
      { p: 'gpShare', label: 'GP equity share', f: '%', min: 0, max: 0.5, step: 0.005, slider: true },
      { p: 'prefHurdle', label: 'Preferred return (IRR hurdle 1)', f: '%', min: 0, max: 0.2, step: 0.0025 },
      { p: 'tiers.0.hurdle', label: 'IRR hurdle 2', f: '%', min: 0, max: 0.3, step: 0.0025 },
      { p: 'tiers.0.promote', label: 'Promote above hurdle 1', f: '%', min: 0, max: 0.6, step: 0.0025 },
      { p: 'tiers.1.hurdle', label: 'IRR hurdle 3', f: '%', min: 0, max: 0.4, step: 0.0025 },
      { p: 'tiers.1.promote', label: 'Promote above hurdle 2', f: '%', min: 0, max: 0.6, step: 0.0025 },
      { p: 'topPromote', label: 'Promote above hurdle 3', f: '%', min: 0, max: 0.7, step: 0.0025 },
      { p: 'aumFeePct', label: 'Asset management fee', f: '%', min: 0, max: 0.02, step: 0.0005, hint: '% of total project cost / yr, paid after stabilization' }
    ] }
  ];
  var ALL = []; GROUPS.forEach(function (g) { (g.hard || []).concat(g.fields).forEach(function (f) { ALL.push(f); }); });
  function fget(f, s) { return f.acc ? f.acc.get(s) : get(s, f.p); }
  function fset(f, s, v) { if (f.acc) f.acc.set(s, v); else set(s, f.p, v); }
  function same(a, b) { return typeof a === 'number' && typeof b === 'number' ? Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(b)) : a === b; }
  function fmtIn(f, v) {
    if (f.f === '$') return n0(v);
    if (f.f === '%') return String(+(v * 100).toFixed(4));
    if (f.f === 'n') return String(v);
    return String(v);
  }
  function parseIn(f, t) { var v = parseFloat(String(t).replace(/[^0-9.\-]/g, '')); if (!isFinite(v)) return null; return f.f === '%' ? v / 100 : v; }

  function chip(edited) { return edited ? '<span class="est edited">Edited</span>' : ''; }
  function fieldHTML(f, i) {
    var id = 'f' + i, v = fget(f, S), lab = '<label for="' + id + '">' + esc(f.label) + '<span data-chip="' + i + '">' + chip(!same(v, fget(f, D))) + '</span></label>', box;
    if (f.f === 'sel') box = '<div class="box"><select id="' + id + '" data-i="' + i + '">' + f.opts.map(function (o) { return '<option value="' + esc(String(o[0])) + '"' + (String(o[0]) === String(v) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></div>';
    else if (f.f === 'date') box = '<div class="box"><input type="text" id="' + id + '" data-i="' + i + '" value="' + esc(v) + '" inputmode="numeric" placeholder="YYYY-MM-DD"></div>';
    else box = '<div class="box">' + (f.f === '$' ? '<span class="unit" style="margin:0 4px 0 0">$</span>' : '') + '<input type="text" id="' + id + '" data-i="' + i + '" inputmode="decimal" value="' + esc(fmtIn(f, v)) + '">' + (f.f === '%' ? '<span class="unit">%</span>' : f.unit ? '<span class="unit">' + esc(f.unit) + '</span>' : '') + '</div>';
    var sl = f.slider ? '<input type="range" data-r="' + i + '" min="' + f.min + '" max="' + f.max + '" step="' + f.step + '" value="' + v + '" aria-label="' + esc(f.label) + ' slider">' : '';
    var hint = f.hint ? '<div class="hint">' + esc(f.hint) + '</div>' : '';
    return '<div class="fld">' + lab + box + sl + hint + '</div>';
  }

  /* ---------- sitework & drainage (Bespoke add-on) ---------- */
  var SW_BASIS = { CY: 'per cubic yard', Acre: 'per acre', Pond: 'per pond (lump sum)', LF: 'per linear foot', SF: 'per square foot', LS: 'lump sum' };
  function siteworkHTML() {
    var sw = S.sitework;
    var rows = sw.items.map(function (it, j) {
      var basis = it.key === 'pond'
        ? '<select data-sw="' + j + '" data-k="basis" aria-label="Pond cost basis"><option value="Acre"' + (it.basis === 'Acre' ? ' selected' : '') + '>per acre</option><option value="Pond"' + (it.basis === 'Pond' ? ' selected' : '') + '>per pond</option></select>'
        : esc(SW_BASIS[it.basis]);
      var qtyLbl = { CY: 'CY', Acre: 'acres', Pond: 'ponds', LF: 'LF', SF: 'SF' }[it.basis];
      var qty = it.basis === 'LS' ? '<td class="n fixed" data-l="Quantity">1</td>' : '<td class="n" data-l="Quantity (' + qtyLbl + ')"><input data-sw="' + j + '" data-k="qty" inputmode="decimal" placeholder="0" value="' + (it.qty ? n0(it.qty) : '') + '" aria-label="' + esc(it.name) + ' quantity (' + qtyLbl + ')"></td>';
      return '<tr><td class="lbl">' + esc(it.name) + '</td><td class="n" data-l="Unit cost ($)"><input data-sw="' + j + '" data-k="cost" inputmode="decimal" placeholder="$0" value="' + (it.cost ? n0(it.cost) : '') + '" aria-label="' + esc(it.name) + ' unit cost"></td><td data-l="Basis">' + basis + '</td>' + qty + '<td class="n" data-l="Line total" data-swt="' + j + '">$0</td></tr>';
    }).join('');
    return '<div class="subp" id="siteworkPanel"><div class="subp-h"><h4>Sitework and Drainage</h4><span class="est">Zero defaults</span></div>' +
      '<div class="tw"><table class="t swt"><thead><tr><th>Line</th><th class="n">Unit cost ($)</th><th>Basis</th><th class="n">Quantity</th><th class="n">Line total</th></tr></thead><tbody>' + rows +
      '<tr class="sub"><td class="lbl" colspan="4">Subtotal</td><td class="n" data-l="Subtotal" id="swSub">$0</td></tr>' +
      '<tr class="cont"><td class="lbl" colspan="2">Sitework and drainage contingency</td><td colspan="2" data-l="Rate"><span class="inl"><input data-swc="1" inputmode="decimal" value="' + +(sw.contPct * 100).toFixed(4) + '" aria-label="Contingency rate">% of subtotal</span></td><td class="n" data-l="Contingency" id="swCont">$0</td></tr>' +
      '<tr class="tot"><td class="lbl" colspan="4">Sitework and drainage total</td><td class="n" data-l="Category total" id="swTot">$0</td></tr></tbody></table></div></div>';
  }

  function buildInputs() {
    var html = GROUPS.map(function (g) {
      var inner = '';
      if (g.hard) {
        inner += '<div class="hardrow"><div class="subp"><div class="subp-h"><h4>Hard costs</h4></div>' + g.hard.map(function (f) { return fieldHTML(f, ALL.indexOf(f)); }).join('') +
          '<div class="fld"><label>Total hard costs</label><div class="calc" id="hardTot"></div><div class="hint">Construction + other hard + sitework and drainage</div></div></div>' + siteworkHTML() + '</div>';
      }
      inner += '<div class="fields">' + g.fields.map(function (f) { return fieldHTML(f, ALL.indexOf(f)); }).join('') + '</div>';
      return '<div class="card"' + (g.id ? ' id="grp-' + g.id + '"' : '') + '><div class="card-h"><h3>' + esc(g.title) + '</h3></div>' + inner + '</div>';
    }).join('');
    $('inputGroups').innerHTML = html;
    buildUnitMix(); buildOpex();
  }
  function buildUnitMix() {
    var h = '<thead><tr><th>Unit type</th><th class="n">Units</th><th class="n">Avg SF</th><th class="n">Rent / mo</th><th class="n">Rent / SF</th><th class="n">Free mo. lease-up</th><th class="n">Free mo. stabilized</th></tr></thead><tbody>';
    S.unitMix.forEach(function (u, j) {
      h += '<tr><td><input class="txt" data-um="' + j + '" data-k="name" value="' + esc(u.name) + '" aria-label="Unit type"></td>' +
        ['units', 'sf', 'rent'].map(function (k) { return '<td class="n"><input data-um="' + j + '" data-k="' + k + '" inputmode="decimal" value="' + n0(u[k]) + '" aria-label="' + k + '"></td>'; }).join('') +
        '<td class="n" data-rpsf="' + j + '"></td>' +
        ['freeLeaseUp', 'freeStab'].map(function (k) { return '<td class="n"><input data-um="' + j + '" data-k="' + k + '" inputmode="decimal" value="' + u[k] + '" aria-label="' + k + '"></td>'; }).join('') + '</tr>';
    });
    h += '<tr class="tot"><td>Total / average</td><td class="n" id="umU"></td><td class="n" id="umSf"></td><td class="n" id="umR"></td><td class="n" id="umRsf"></td><td></td><td></td></tr></tbody>';
    $('unitMix').innerHTML = h;
  }
  function buildOpex() {
    var h = '<thead><tr><th>Expense</th><th class="n">Annual ($)</th><th class="n">% fixed</th><th class="n">Per unit</th></tr></thead><tbody>';
    S.opex.forEach(function (o, j) {
      h += '<tr><td class="lbl">' + esc(o.name) + '</td><td class="n"><input data-ox="' + j + '" data-k="amount" inputmode="decimal" value="' + n0(o.amount) + '" aria-label="' + esc(o.name) + ' amount"></td><td class="n"><input data-ox="' + j + '" data-k="fixed" inputmode="decimal" value="' + +(o.fixed * 100).toFixed(2) + '" aria-label="' + esc(o.name) + ' percent fixed"></td><td class="n" data-opu="' + j + '"></td></tr>';
    });
    h += '<tr class="tot"><td>Total (before mgmt, insurance, tax)</td><td class="n" id="oxT"></td><td></td><td class="n" id="oxU"></td></tr></tbody>';
    $('opexTbl').innerHTML = h;
  }
  function refreshChips() {
    ALL.forEach(function (f, i) { var el = document.querySelector('[data-chip="' + i + '"]'); if (el) el.innerHTML = chip(!same(fget(f, S), fget(f, D))); });
  }

  /* ---------- events ---------- */
  var tmr = null;
  function schedule() { clearTimeout(tmr); tmr = setTimeout(recalc, 120); }
  document.addEventListener('input', function (e) {
    var t = e.target, d = t.dataset;
    if (d.i != null) {
      var f = ALL[+d.i];
      if (f.f === 'sel') return;
      if (f.f === 'date') { if (/^\d{4}-\d{2}-\d{2}$/.test(t.value) && !isNaN(Date.parse(t.value))) { set(S, f.p, t.value); refreshChips(); schedule(); } return; }
      var v = parseIn(f, t.value); if (v == null) return;
      fset(f, S, v); var r = document.querySelector('[data-r="' + d.i + '"]'); if (r) r.value = v;
      refreshChips(); schedule();
    } else if (d.r != null) {
      var f2 = ALL[+d.r], v2 = +t.value; fset(f2, S, v2);
      var inp = $('f' + d.r); if (inp) inp.value = fmtIn(f2, v2);
      refreshChips(); schedule();
    } else if (d.um != null) {
      var u = S.unitMix[+d.um]; if (d.k === 'name') u.name = t.value; else { var x = parseFloat(t.value.replace(/[^0-9.\-]/g, '')); if (!isFinite(x)) return; u[d.k] = x; }
      schedule();
    } else if (d.ox != null) {
      var o = S.opex[+d.ox], y = parseFloat(t.value.replace(/[^0-9.\-]/g, '')); if (!isFinite(y)) return; o[d.k] = d.k === 'fixed' ? y / 100 : y; schedule();
    } else if (d.sw != null && d.k !== 'basis') {
      var z = parseFloat(t.value.replace(/[^0-9.\-]/g, '')); S.sitework.items[+d.sw][d.k] = isFinite(z) ? z : 0; schedule();
    } else if (d.swc != null) {
      var c = parseFloat(t.value.replace(/[^0-9.\-]/g, '')); S.sitework.contPct = isFinite(c) ? c / 100 : 0; schedule();
    }
  });
  document.addEventListener('change', function (e) {
    var t = e.target, d = t.dataset;
    if (d.i != null && ALL[+d.i].f === 'sel') { var f = ALL[+d.i]; var v = f.opts.filter(function (o) { return String(o[0]) === t.value; })[0][0]; set(S, f.p, v); refreshChips(); schedule(); }
    if (d.sw != null && d.k === 'basis') { S.sitework.items[+d.sw].basis = t.value; buildInputs(); recalc(); }
    if (t.tagName === 'INPUT' && t.type === 'text' && d.i != null && ALL[+d.i].f === '$') t.value = n0(fget(ALL[+d.i], S));
  });
  $('resetBtn').addEventListener('click', function () { S = A.defaults(); buildInputs(); recalc(); });
  $('menuBtn').addEventListener('click', function () { var sb = $('sitebar'), o = sb.classList.toggle('open'); this.setAttribute('aria-expanded', o); });

  /* ---------- KPI tiles ---------- */
  var KPIS = [
    { k: 'totalCost', t: 'Total Project Cost', f: money, s: function (r) { return money(r.kpis.costPerUnit) + ' / unit'; }, d: 'Land, hard and soft costs plus capitalized construction interest and the lease-up operating shortfall.' },
    { k: 'loan', t: 'Construction Loan', f: money, s: function (r) { return pct(r.sources.ltcActual, 1) + ' loan-to-cost'; }, d: 'Construction loan commitment = loan-to-cost × total project cost. Equity is solved so that equity + loan = total cost, including the interest the loan itself carries.' },
    { k: 'yocUntrended', t: 'Yield on Cost', f: function (v) { return pct(v); }, s: function () { return 'Untrended NOI / cost'; }, d: 'Untrended (today\'s rents and expenses) stabilized NOI divided by total project cost.' },
    { k: 'spreadUntrended', t: 'Development Spread', f: bps, s: function (r) { return 'vs. ' + pct(r.inputs.capRateToday) + ' market cap'; }, d: 'Untrended yield on cost minus today\'s market cap rate, in basis points. The margin the development earns over buying a stabilized asset.' },
    { k: 'leveredIrr', t: 'Levered IRR', f: function (v) { return pct(v); }, s: function () { return 'Property level, gross'; }, d: 'XIRR of monthly levered cash flow (total equity in, distributions out) before the asset management fee and promote.' },
    { k: 'leveredEmx', t: 'Levered Equity Multiple', f: x2, s: function () { return 'Distributions / equity'; }, d: 'Total positive levered cash flow divided by total equity invested.' },
    { k: 'profit', t: 'Levered Profit', f: money, s: function (r) { return 'Unlevered IRR ' + pct(r.kpis.unleveredIrr); }, d: 'Sum of levered cash flows: distributions minus equity invested.' },
    { k: 'lpIrr', t: 'LP Net IRR', f: function (v) { return pct(v); }, s: function (r) { return x2(r.kpis.lpEmx) + ' LP multiple'; }, d: 'Limited partner IRR after the asset management fee and the GP promote, from the IRR-hurdle waterfall.' }
  ];
  function renderKpis() {
    $('kpis').innerHTML = KPIS.map(function (q) {
      return '<button type="button" class="kpi' + (q.k === selKpi ? ' sel' : '') + '" data-kpi="' + q.k + '" aria-pressed="' + (q.k === selKpi) + '"><span class="k">' + q.t + '</span><span class="v">' + q.f(R.kpis[q.k]) + '</span><span class="s">' + q.s(R) + '</span></button>';
    }).join('');
    var q = KPIS.filter(function (x) { return x.k === selKpi; })[0];
    var tm = R.timing;
    $('kpiDef').innerHTML = '<b>' + q.t + ':</b> ' + esc(q.d) + ' <br>Timeline: construction months 1–' + tm.constructionEnd + ', lease-up from month ' + tm.opBegin + ', stabilized month ' + (tm.stabOk ? tm.stab : 'not reached') + ', sale month ' + tm.sale + '.';
  }
  $('kpis').addEventListener('click', function (e) { var b = e.target.closest('[data-kpi]'); if (!b) return; selKpi = b.dataset.kpi; renderKpis(); });

  /* ---------- SVG charts ---------- */
  var C = { blue: '#359BC5', b2: '#6CC0E0', b3: '#A9DCEF', b4: '#D6EEF7', orange: '#FDAD3F', site: '#1E5C78' };
  function el(tag, a, txt) { var s = '<' + tag; for (var k in a) s += ' ' + k + '="' + a[k] + '"'; return s + (txt != null ? '>' + esc(txt) + '</' + tag + '>' : '/>'); }
  function box(id) { var e = $(id); return { e: e, w: Math.max(260, e.clientWidth), h: Math.max(260, e.clientHeight) }; }
  function svg(b, body) { b.e.innerHTML = '<svg viewBox="0 0 ' + b.w + ' ' + b.h + '" width="' + b.w + '" height="' + b.h + '" role="img">' + body + '</svg>'; }
  function niceMax(v) { if (v <= 0) return 1; var p = Math.pow(10, Math.floor(Math.log10(v))), m = v / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p; }
  function legend(id, items) { $(id).innerHTML = items.map(function (i) { return '<span><i style="background:' + i[1] + '"></i>' + esc(i[0]) + '</span>'; }).join(''); }

  function chartBudget() {
    var b = box('chBudget'), B = R.budget, narrow = b.w < 440;
    var rows = B.lines.map(function (L) { return { n: L.name, v: L.amount, c: L.group === 'site' ? C.site : L.cat === 'land' ? C.b3 : L.cat === 'hard' ? C.blue : C.b2 }; });
    rows.push({ n: 'Capitalized Interest', v: B.interestReserve, c: C.b4 }, { n: 'Operating Shortfall', v: B.shortfall, c: C.b4 });
    if (B.financingFees) rows.push({ n: 'Financing Fees', v: B.financingFees, c: C.b4 });
    if (narrow) rows.forEach(function (r) { r.n = r.n.replace('Architecture & Engineering', 'A&E').replace('Construction Management', 'Constr. Mgmt').replace('Marketing and Leasing', 'Marketing').replace('Construction Costs', 'Construction').replace('Capitalized Interest', 'Cap. Interest').replace('Operating Shortfall', 'Op. Shortfall').replace('Sitework and Drainage', 'Site & Drainage').replace('Other Hard Costs', 'Other Hard').replace('Development Fee', 'Dev. Fee').replace('Closing Costs', 'Closing').replace('Land Costs', 'Land').replace('Financing Fees', 'Fin. Fees'); });
    var lw = narrow ? 92 : 168, vw = narrow ? 52 : 64, x0 = lw, x1 = b.w - vw, mx = Math.max.apply(null, rows.map(function (r) { return r.v; })) || 1;
    var rh = (b.h - 4) / rows.length, bh = Math.min(18, rh * 0.62), out = '';
    rows.forEach(function (r, i) {
      var y = 2 + i * rh + (rh - bh) / 2, w = Math.max(r.v > 0 ? 2 : 0, (x1 - x0 - 8) * r.v / mx);
      out += el('text', { x: 0, y: y + bh / 2 + 4 }, r.n);
      out += el('rect', Object.assign({ x: x0, y: y, width: w.toFixed(1), height: bh.toFixed(1), rx: 4, fill: r.c }, r.c === C.site ? { stroke: C.b2, 'stroke-width': 1 } : {}));
      out += el('text', { x: x0 + w + 6, y: y + bh / 2 + 4, class: 'vl' }, moneyC(r.v));
    });
    svg(b, out);
    $('c1v').textContent = money(B.total);
    legend('lgBudget', [['Land', C.b3], ['Hard costs', C.blue], ['Sitework and drainage', C.site], ['Soft costs', C.b2], ['Financing carry', C.b4]]);
  }

  function chartOps() {
    var b = box('chOps'), yrs = R.annual.filter(function (a) { return Math.abs(a.egr) > 1 || Math.abs(a.opex) > 1; });
    var ser = [['egr', 'Effective gross revenue', C.b3], ['opex', 'Operating expenses', C.b2], ['noi', 'Net operating income', C.blue]];
    var vals = []; yrs.forEach(function (a) { ser.forEach(function (s) { vals.push(a[s[0]]); }); });
    var mxv = Math.max.apply(null, vals.concat([1])), mn = Math.min.apply(null, vals.concat([0]));
    var stp = niceMax((mxv - mn) / 4), top = Math.ceil(mxv / stp - 1e-9) * stp, bot = mn < 0 ? -Math.ceil(-mn / stp - 1e-9) * stp : 0;
    var L = 52, Rr = 6, T = 18, Bm = 26, ph = b.h - T - Bm, pw = b.w - L - Rr, y = function (v) { return T + ph * (top - v) / (top - bot); }, out = '';
    for (var v = bot; v <= top + stp / 2; v += stp) { var yy = y(v); out += el('line', { x1: L, x2: b.w - Rr, y1: yy, y2: yy, class: 'grid' }) + el('text', { x: L - 6, y: yy + 4, 'text-anchor': 'end' }, moneyC(Math.abs(v) < 1e-6 ? 0 : v)); }
    out += el('line', { x1: L, x2: b.w - Rr, y1: y(0), y2: y(0), class: 'axis' });
    var gw = pw / Math.max(1, yrs.length), bw = Math.min(34, gw * 0.8 / 3);
    yrs.forEach(function (a, i) {
      var gx = L + gw * i + (gw - bw * 3 - 4) / 2;
      ser.forEach(function (s, j) { var v = a[s[0]], y1 = y(Math.max(v, 0)), y2 = y(Math.min(v, 0)); out += el('rect', { x: (gx + j * (bw + 2)).toFixed(1), y: y1.toFixed(1), width: bw.toFixed(1), height: Math.max(1, y2 - y1).toFixed(1), rx: 3, fill: s[2] }); });
      out += el('text', { x: L + gw * i + gw / 2, y: b.h - 8, 'text-anchor': 'middle' }, 'Year ' + a.year);
    });
    svg(b, out);
    $('c2v').textContent = 'Sale-year NOI ' + moneyC(R.valuation.sale.noi);
    legend('lgOps', ser.map(function (s) { return [s[1], s[2]]; }));
  }

  function chartLoan() {
    var b = box('chLoan'), lb = R.monthly.loanBal, end = R.timing.end, tm = R.timing;
    var mx = niceMax(Math.max.apply(null, lb.slice(0, end + 1).concat([1])));
    var L = 52, Rr = 10, T = 22, Bm = 26, ph = b.h - T - Bm, pw = b.w - L - Rr, x = function (m) { return L + pw * m / Math.max(1, end); }, y = function (v) { return T + ph * (1 - v / mx); }, out = '';
    for (var k = 0; k <= 4; k++) { var v = mx * k / 4; out += el('line', { x1: L, x2: b.w - Rr, y1: y(v), y2: y(v), class: 'grid' }) + el('text', { x: L - 6, y: y(v) + 4, 'text-anchor': 'end' }, moneyC(v)); }
    var step = end > 60 ? 12 : 6; for (var m = 0; m <= end; m += step) out += el('text', { x: x(m), y: b.h - 8, 'text-anchor': 'middle' }, 'M' + m);
    var pts = []; for (m = 0; m <= end; m++) pts.push(x(m).toFixed(1) + ',' + y(lb[m]).toFixed(1));
    out += '<defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#359BC5" stop-opacity=".55"/><stop offset="1" stop-color="#359BC5" stop-opacity=".04"/></linearGradient></defs>';
    out += el('polygon', { points: x(0) + ',' + y(0) + ' ' + pts.join(' ') + ' ' + x(end) + ',' + y(0), fill: 'url(#lg)' });
    out += el('polyline', { points: pts.join(' '), fill: 'none', stroke: C.b2, 'stroke-width': 2.2, 'stroke-linejoin': 'round' });
    function vline(m, label, anchor) { var xx = x(m); if (anchor === 'start' && xx + label.length * 6.4 > b.w - Rr) anchor = 'end'; if (anchor === 'end' && xx - label.length * 6.4 < L) anchor = 'start'; out += el('line', { x1: xx, x2: xx, y1: T - 4, y2: T + ph, stroke: 'rgba(255,255,255,.28)', 'stroke-dasharray': '4 4' }) + el('text', { x: xx + (anchor === 'end' ? -5 : 5), y: T - 8, 'text-anchor': anchor, class: 'vl' }, label); }
    vline(tm.constructionEnd, 'Construction end M' + tm.constructionEnd, 'end');
    if (tm.stabOk && tm.stab !== tm.sale) vline(tm.stab, 'Stabilized M' + tm.stab, 'start');
    svg(b, out);
    $('c3v').textContent = 'Peak ' + moneyC(Math.max.apply(null, lb));
    legend('lgLoan', [['Loan balance incl. capitalized interest; repaid at sale, month ' + tm.constPayoff, C.b2]]);
  }

  function chartWf() {
    var b = box('chWf'), W = R.waterfall, h = W.hurdles;
    var cats = [['Capital + ' + pct(h[0], 0) + ' pref', W.tierLP[0], W.tierGP[0]], [pct(h[0], 0) + '–' + pct(h[1], 0), W.tierLP[1], W.tierGP[1]], [pct(h[1], 0) + '–' + pct(h[2], 0), W.tierLP[2], W.tierGP[2]], ['Above ' + pct(h[2], 0), W.tierLP[3], W.tierGP[3]]];
    var aumTot = W.aumMonthly * Math.max(0, R.timing.end - R.timing.stab + 1);
    cats.push(['AUM fee', 0, aumTot]);
    var mx = niceMax(Math.max.apply(null, cats.map(function (c) { return c[1] + c[2]; }).concat([1])));
    var L = 52, Rr = 6, T = 22, Bm = 40, ph = b.h - T - Bm, pw = b.w - L - Rr, y = function (v) { return T + ph * (1 - v / mx); }, out = '';
    for (var k = 0; k <= 4; k++) { var v = mx * k / 4; out += el('line', { x1: L, x2: b.w - Rr, y1: y(v), y2: y(v), class: 'grid' }) + el('text', { x: L - 6, y: y(v) + 4, 'text-anchor': 'end' }, moneyC(v)); }
    var gw = pw / cats.length, bw = Math.min(56, gw * 0.62);
    cats.forEach(function (c, i) {
      var cx = L + gw * i + gw / 2, x0 = cx - bw / 2, lp = Math.max(0, c[1]), gp = Math.max(0, c[2]);
      out += el('rect', { x: x0.toFixed(1), y: y(lp).toFixed(1), width: bw.toFixed(1), height: Math.max(0, y(0) - y(lp)).toFixed(1), rx: 3, fill: C.blue });
      out += el('rect', { x: x0.toFixed(1), y: y(lp + gp).toFixed(1), width: bw.toFixed(1), height: Math.max(0, y(lp) - y(lp + gp)).toFixed(1), rx: 3, fill: C.b3 });
      out += el('text', { x: cx, y: y(lp + gp) - 6, 'text-anchor': 'middle', class: 'vl' }, moneyC(lp + gp));
      var words = c[0].split(' '), l1 = c[0], l2 = '';
      if (gw < 90 && words.length > 1) { l1 = words.slice(0, Math.ceil(words.length / 2)).join(' '); l2 = words.slice(Math.ceil(words.length / 2)).join(' '); }
      out += el('text', { x: cx, y: b.h - 22, 'text-anchor': 'middle' }, l1) + (l2 ? el('text', { x: cx, y: b.h - 8, 'text-anchor': 'middle' }, l2) : '');
    });
    svg(b, out);
    $('c4v').textContent = 'LP ' + moneyC(W.lp.dist) + ' · GP ' + moneyC(W.gp.dist);
    legend('lgWf', [['LP distributions', C.blue], ['GP distributions (co-invest share, promote, AUM fee)', C.b3]]);
  }

  /* ---------- tables ---------- */
  function tr(cells, c) { return '<tr' + (c ? ' class="' + c + '"' : '') + '>' + cells.map(function (x, i) { return i === 0 ? '<td class="lbl">' + x + '</td>' : '<td class="n">' + x + '</td>'; }).join('') + '</tr>'; }
  function th(cells) { return '<thead><tr>' + cells.map(function (x, i) { return '<th' + (i ? ' class="n"' : '') + '>' + x + '</th>'; }).join('') + '</tr></thead>'; }
  function renderTables() {
    var B = R.budget, Sx = R.sources, W = R.waterfall, tot = B.total, u = R.units;
    var lp = W.lp.contrib, gp = W.gp.contrib;
    $('tSources').innerHTML = th(['Source', 'Amount', '% of total', 'Per unit']) + '<tbody>' +
      tr(['LP equity', money(lp), pct(lp / tot, 1), money(lp / u)]) + tr(['GP equity', money(gp), pct(gp / tot, 1), money(gp / u)]) +
      tr(['Total equity', money(Sx.equity), pct(Sx.equity / tot, 1), money(Sx.equity / u)], 'sub') +
      tr(['Construction loan', money(Sx.loan), pct(Sx.loan / tot, 1), money(Sx.loan / u)]) +
      tr(['Total sources', money(Sx.equity + Sx.loan), pct((Sx.equity + Sx.loan) / tot, 1), money((Sx.equity + Sx.loan) / u)], 'tot') + '</tbody>';
    var uses = [['Land and closing', B.land], ['Hard costs (incl. sitework and drainage)', B.hard], ['Soft costs (incl. development fee)', B.soft], ['Capitalized interest', B.interestReserve], ['Operating shortfall', B.shortfall]];
    if (B.financingFees) uses.push(['Financing fees', B.financingFees]);
    $('tUses').innerHTML = th(['Use', 'Amount', '% of total', 'Per unit']) + '<tbody>' + uses.map(function (x) { return tr([x[0], money(x[1]), pct(x[1] / tot, 1), money(x[1] / u)]); }).join('') + tr(['Total uses', money(tot), '100.0%', money(tot / u)], 'tot') + '</tbody>';
    $('srcTot').textContent = money(Sx.equity + Sx.loan); $('useTot').textContent = money(tot);

    var nra = R.nra, rowsB = '', cats = [['land', 'Land'], ['hard', 'Hard costs'], ['site', 'Sitework and drainage'], ['soft', 'Soft costs']];
    function line(L) { return tr([esc(L.name), L.start === L.end ? 'M' + L.start : 'M' + L.start + '–' + L.end, L.method, money(L.amount / u), '$' + (L.amount / nra).toFixed(2), money(L.amount), pct(L.amount / tot, 1)]); }
    cats.forEach(function (c) {
      var ls = B.lines.filter(function (L) { return c[0] === 'site' ? L.group === 'site' : L.cat === c[0] && L.group !== 'site'; }), s = ls.reduce(function (a, L) { return a + L.amount; }, 0);
      rowsB += '<tr class="grp"><td colspan="7">' + c[1] + '</td></tr>';
      if (c[0] === 'site') {
        var sw = B.sitework, swL = ls[0];
        sw.items.forEach(function (it) { rowsB += tr([esc(it.name) + (it.basis === 'LS' ? ' (lump sum)' : ' (' + n0(it.qty) + ' ' + it.basis + ' × $' + n0(it.cost) + ')'), 'M' + swL.start + '–' + swL.end, swL.method, money(it.total / u), '$' + (it.total / nra).toFixed(2), money(it.total), pct(it.total / tot, 1)]); });
        rowsB += tr(['Contingency (' + pct(sw.contPct, 1) + ' of ' + money(sw.subtotal) + ')', 'M' + swL.start + '–' + swL.end, swL.method, money(sw.contingency / u), '$' + (sw.contingency / nra).toFixed(2), money(sw.contingency), pct(sw.contingency / tot, 1)]);
      } else ls.forEach(function (L) { rowsB += line(L); });
      rowsB += tr(['Total ' + c[1].toLowerCase(), '', '', money(s / u), '$' + (s / nra).toFixed(2), money(s), pct(s / tot, 1)], 'sub');
    });
    rowsB += '<tr class="grp"><td colspan="7">Financing carry</td></tr>';
    [['Capitalized interest', B.interestReserve], ['Operating shortfall (lease-up)', B.shortfall], ['Financing fees', B.financingFees]].forEach(function (x) { rowsB += tr([x[0], '', '', money(x[1] / u), '$' + (x[1] / nra).toFixed(2), money(x[1]), pct(x[1] / tot, 1)]); });
    rowsB += tr(['Total project cost', '', '', money(tot / u), '$' + (tot / nra).toFixed(2), money(tot), '100.0%'], 'tot');
    $('tBudget').innerHTML = '<thead><tr><th>Line item</th><th class="n">Timing</th><th class="n">Method</th><th class="n">Per unit</th><th class="n">Per NRSF</th><th class="n">Amount</th><th class="n">% of total</th></tr></thead><tbody>' + rowsB + '</tbody>';
    $('budNote').textContent = n0(u) + ' units · ' + n0(nra) + ' NRSF';

    var An = R.annual, cols = ['Year ' + 0].concat(An.slice(1).map(function (a) { return 'Year ' + a.year; })).concat(['Total']);
    function arow(lbl, k, c, neg) { var s = 0; var cells = An.map(function (a) { var v = (neg ? -1 : 1) * a[k]; s += v; return '<span class="' + cls(v) + '">' + money(v) + '</span>'; }); return tr([lbl].concat(cells).concat(['<span class="' + cls(s) + '">' + money(s) + '</span>']), c); }
    $('tAnnual').innerHTML = th(['$'].concat(cols)) + '<tbody>' +
      '<tr class="grp"><td colspan="' + (cols.length + 1) + '">Development</td></tr>' + arow('Land', 'land') + arow('Hard costs', 'hard') + arow('Soft costs', 'soft') + arow('Financing carry', 'carry') + arow('Total project cost', 'totalCost', 'sub') +
      '<tr class="grp"><td colspan="' + (cols.length + 1) + '">Operations</td></tr>' + arow('Rental income', 'rent') + arow('Other income', 'other') + arow('Vacancy and credit loss', 'vacCl') + arow('Effective gross revenue', 'egr', 'sub') + arow('Operating expenses', 'opex', '', true) + arow('Net operating income', 'noi', 'sub') + arow('Capital expenditures', 'capex', '', true) + arow('Cash flow from operations', 'cfo') +
      '<tr class="grp"><td colspan="' + (cols.length + 1) + '">Capital</td></tr>' + arow('Net sale proceeds', 'sale') + arow('Equity contributions', 'equity') + arow('Loan draws (incl. capitalized interest)', 'debt') + arow('Unlevered cash flow', 'unlev', 'tot') + arow('Levered cash flow', 'lev', 'tot') + '</tbody>';

    var V = R.valuation, vs = [V.untrended, V.trended, V.sale];
    $('tVal').innerHTML = th(['', 'Untrended', 'Trended', 'Sale']) + '<tbody>' +
      tr(['Net operating income'].concat(vs.map(function (v) { return money(v.noi); }))) +
      tr(['Cap rate'].concat(vs.map(function (v) { return pct(v.cap); }))) +
      tr(['Value'].concat(vs.map(function (v) { return money(v.value); }))) +
      tr(['Yield on cost'].concat(vs.map(function (v) { return pct(v.yoc); })), 'sub') +
      tr(['Development spread'].concat(vs.map(function (v) { return bps(v.spread); }))) +
      tr(['Net sale proceeds', '', '', money(V.saleNet)]) + '</tbody>';
    var Rt = R.returns, eq = Sx.equity;
    var unlevIn = -R.monthly.unlev.filter(function (v) { return v < 0; }).reduce(function (a, v) { return a + v; }, 0);
    $('tRet').innerHTML = th(['', 'Unlevered', 'Levered', 'LP', 'GP']) + '<tbody>' +
      tr(['Capital invested', money(unlevIn), money(eq), money(W.lp.contrib), money(W.gp.contrib)]) +
      tr(['Profit', money(Rt.unlevered.profit), money(Rt.levered.profit), money(W.lp.profit), money(W.gp.profit)]) +
      tr(['Equity multiple', x2(Rt.unlevered.emx), x2(Rt.levered.emx), x2(W.lp.emx), x2(W.gp.emx)], 'sub') +
      tr(['IRR', pct(Rt.unlevered.irr), pct(Rt.levered.irr), pct(W.lp.irr), pct(W.gp.irr)], 'sub') +
      tr(['Asset mgmt fee (monthly)', '', '', '', money(W.aumMonthly)]) +
      tr(['Promote tiers', '', '', '', W.promotes.map(function (p) { return pct(p, 0); }).join(' / ')]) + '</tbody>';

    function sens(id, key, vals, label) {
      var res = A.sensitivity(S, R, key, vals);
      $(id).innerHTML = th([label, 'Spread (sale)', 'Lev. IRR', 'Lev. EMx', 'LP IRR']) + '<tbody>' + res.map(function (r) {
        var base = Math.abs(r.value - S[key]) < 1e-9; return tr([pct(r.value), bps(r.spread), pct(r.irr), x2(r.emx), pct(r.lpIrr)], base ? 'hl' : '');
      }).join('') + '</tbody>';
    }
    var ec = S.exitCap, vc = S.vacancy;
    sens('tSensCap', 'exitCap', [-0.0075, -0.005, -0.0025, 0, 0.0025].map(function (d) { return +(ec + d).toFixed(6); }), 'Exit cap');
    sens('tSensVac', 'vacancy', [-0.02, 0, 0.02, 0.04, 0.06].map(function (d) { return +Math.max(0, vc + d).toFixed(6); }), 'Vacancy');
  }

  function renderInputCalcs() {
    var B = R.budget, sw = B.sitework;
    $('hardTot').textContent = money(B.hard);
    sw.items.forEach(function (it, j) { var c = document.querySelector('[data-swt="' + j + '"]'); if (c) c.textContent = money(it.total); });
    $('swSub').textContent = money(sw.subtotal); $('swCont').textContent = money(sw.contingency); $('swTot').textContent = money(sw.total);
    var U = 0, SF = 0, RT = 0;
    S.unitMix.forEach(function (u, j) { U += +u.units; SF += u.units * u.sf; RT += u.units * u.rent; var c = document.querySelector('[data-rpsf="' + j + '"]'); if (c) c.textContent = '$' + (u.sf ? u.rent / u.sf : 0).toFixed(2); });
    $('umU').textContent = n0(U); $('umSf').textContent = U ? n0(SF / U) : '–'; $('umR').textContent = U ? money(RT / U) : '–'; $('umRsf').textContent = SF ? '$' + (RT / SF).toFixed(2) : '–';
    $('umNote').textContent = n0(U) + ' units · ' + n0(SF) + ' NRSF';
    var T = 0; S.opex.forEach(function (o, j) { T += +o.amount; var c = document.querySelector('[data-opu="' + j + '"]'); if (c) c.textContent = U ? money(o.amount / U) : '–'; });
    $('oxT').textContent = money(T); $('oxU').textContent = U ? money(T / U) : '–';
  }

  function renderCharts() { chartBudget(); chartOps(); chartLoan(); chartWf(); }
  function recalc() {
    var units = S.unitMix.reduce(function (a, u) { return a + (+u.units || 0); }, 0);
    if (units <= 0) { $('warn').hidden = false; $('warn').textContent = 'Enter at least one unit in the unit mix.'; return; }
    try { R = A.run(S); } catch (err) { $('warn').hidden = false; $('warn').textContent = 'These inputs could not be calculated: ' + err.message; return; }
    var w = [];
    if (!R.timing.stabOk) w.push('The property never reaches 100% leased within the 132-month grid, so returns are not meaningful.');
    if (!isFinite(R.returns.levered.irr)) w.push('Levered IRR is undefined for these inputs.');
    $('warn').hidden = !w.length; $('warn').textContent = w.join(' ');
    renderInputCalcs(); renderKpis(); renderCharts(); renderTables();
  }
  var rz = null; window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { if (R) renderCharts(); }, 120); });
  $('yr').textContent = new Date().getFullYear();
  buildInputs(); recalc();
  window.__acre = { get state() { return S; }, get result() { return R; } };
})();
