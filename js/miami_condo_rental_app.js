/* Bespoke Underwriting — Miami Beach Condo Rental Model UI. Engine: js/miami_condo_rental_model.js.
   Standalone page; layout and styling follow the apartment development model (index.html / js/app.js). */
(function () {
  'use strict';
  var M = window.MiamiCondoRentalModel, S = M.defaults(), R = null, selKpi = 'monthlyCashFlow';
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function n0(v) { return Math.round(v).toLocaleString('en-US'); }
  function numIn(v) { return v == null || !isFinite(v) ? '' : (+v).toLocaleString('en-US', { maximumFractionDigits: 2 }); }
  function money(v) { if (v == null || !isFinite(v)) return '—'; var s = '$' + n0(Math.abs(v)); return v < -0.5 ? '(' + s + ')' : s; }
  function moneyC(v) { if (!isFinite(v)) return '—'; var a = Math.abs(v), s = a >= 1e6 ? (a / 1e6).toFixed(2) + 'M' : a >= 1e4 ? (a / 1e3).toFixed(0) + 'K' : a >= 1e3 ? (a / 1e3).toFixed(1) + 'K' : a.toFixed(0); return (v < 0 ? '-$' : '$') + s; }
  function pct(v, d) { return v != null && isFinite(v) ? (v * 100).toFixed(d == null ? 2 : d) + '%' : '—'; }
  function x2(v) { return v != null && isFinite(v) ? v.toFixed(2) + 'x' : 'n/a'; }
  function neg(v, s) { return v < -0.005 ? '<span class="neg">' + s + '</span>' : s; }

  /* ---------- inputs ---------- */
  var GROUPS = [
    { title: 'Purchase and financing', fields: [
      { p: 'price', label: 'Purchase price', f: '$', min: 150000, max: 2000000, step: 5000, slider: true },
      { p: 'closingPct', label: 'Closing costs', f: '%', min: 0, max: 0.06, step: 0.0025, slider: true, hint: '% of price; FL buyer costs incl. mortgage doc stamps and intangible tax when financed' },
      { p: 'allCash', label: 'Financing', f: 'sel', opts: [[false, 'Financed'], [true, 'All cash']] },
      { p: 'downPct', label: 'Down payment', f: '%', min: 0.05, max: 1, step: 0.01, slider: true, fin: true, hint: '% of purchase price' },
      { p: 'rate', label: 'Mortgage rate', f: '%', min: 0.02, max: 0.12, step: 0.000625, slider: true, fin: true, hint: 'Fixed rate' },
      { p: 'termYears', label: 'Amortization', f: 'n', min: 10, max: 40, step: 1, unit: 'years', fin: true }
    ] },
    { title: 'Rent and operating expenses', fields: [
      { p: 'rent', label: 'Monthly rent (2BR)', f: '$', min: 1000, max: 10000, step: 25, slider: true },
      { p: 'vacancyPct', label: 'Vacancy and credit loss', f: '%', min: 0, max: 0.3, step: 0.005, slider: true, hint: '% of scheduled rent' },
      { p: 'mgmtPct', label: 'Property management', f: '%', min: 0, max: 0.2, step: 0.005, hint: '% of collected rent' },
      { p: 'maintPct', label: 'Maintenance reserve', f: '%', min: 0, max: 0.15, step: 0.005, hint: '% of scheduled rent' },
      { p: 'hoaMonthly', label: 'HOA dues (monthly)', f: '$', min: 0, max: 3000, step: 10, slider: true },
      { p: 'taxPct', label: 'Property tax', f: '%', min: 0, max: 0.03, step: 0.0005, hint: '% of price / yr (Miami-Dade non-homestead, estimate)' },
      { p: 'insuranceAnnual', label: 'HO-6 insurance (annual)', f: '$', min: 0, max: 15000, step: 50 }
    ] },
    { title: 'Pro forma', fields: [
      { p: 'rentGrowth', label: 'Rent growth', f: '%', min: -0.05, max: 0.1, step: 0.0025, hint: 'per year' },
      { p: 'expenseGrowth', label: 'HOA, tax and insurance growth', f: '%', min: -0.05, max: 0.15, step: 0.0025, hint: 'per year' },
      { p: 'years', label: 'Pro forma years', f: 'n', min: 1, max: 10, step: 1, unit: 'years' }
    ] }
  ];
  var ALL = []; GROUPS.forEach(function (g) { g.fields.forEach(function (f) { ALL.push(f); }); });
  function fmtIn(f, v) { if (v == null || v === '') return ''; if (f.f === '$') return numIn(v); if (f.f === '%') return String(+(v * 100).toFixed(4)); return String(v); }
  function parseIn(f, t) { if (String(t).trim() === '') return null; var v = parseFloat(String(t).replace(/[^0-9.\-]/g, '')); if (!isFinite(v)) return null; return f.f === '%' ? v / 100 : v; }

  function fieldHTML(f, i) {
    var id = 'f' + i, v = S[f.p], lab = '<label for="' + id + '">' + esc(f.label) + '</label>', box;
    if (f.f === 'sel') box = '<div class="box"><select id="' + id + '" data-i="' + i + '">' + f.opts.map(function (o) { return '<option value="' + esc(String(o[0])) + '"' + (String(o[0]) === String(v) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></div>';
    else box = '<div class="box">' + (f.f === '$' ? '<span class="unit" style="margin:0 4px 0 0">$</span>' : '') + '<input type="text" id="' + id + '" data-i="' + i + '" inputmode="decimal" value="' + esc(fmtIn(f, v)) + '">' + (f.f === '%' ? '<span class="unit">%</span>' : f.unit ? '<span class="unit">' + esc(f.unit) + '</span>' : '') + '</div>';
    var sl = f.slider ? '<input type="range" data-r="' + i + '" min="' + f.min + '" max="' + f.max + '" step="' + f.step + '" value="' + v + '" aria-label="' + esc(f.label) + ' slider">' : '';
    var hint = f.hint ? '<div class="hint">' + esc(f.hint) + '</div>' : '';
    return '<div class="fld' + (f.fin ? ' fin' : '') + '" data-fld="' + i + '">' + lab + box + sl + hint + '</div>';
  }
  function buildInputs() {
    $('inputGroups').innerHTML = GROUPS.map(function (g) {
      return '<div class="card"><div class="card-h"><h3>' + esc(g.title) + '</h3></div><div class="fields">' + g.fields.map(function (f) { return fieldHTML(f, ALL.indexOf(f)); }).join('') + '</div></div>';
    }).join('');
    syncFin();
  }
  function syncFin() {
    document.querySelectorAll('.fld.fin').forEach(function (d) { d.classList.toggle('off', !!S.allCash); d.querySelectorAll('input').forEach(function (x) { x.disabled = !!S.allCash; }); });
  }

  /* ---------- events ---------- */
  var tmr = null;
  function schedule() { clearTimeout(tmr); tmr = setTimeout(recalc, 120); }
  document.addEventListener('input', function (e) {
    var t = e.target, d = t.dataset;
    if (d.i != null) {
      var f = ALL[+d.i]; if (f.f === 'sel') return;
      var v = parseIn(f, t.value); if (v == null) return;
      S[f.p] = v; var r = document.querySelector('[data-r="' + d.i + '"]'); if (r) r.value = v; schedule();
    } else if (d.r != null) {
      var f2 = ALL[+d.r], v2 = +t.value; S[f2.p] = v2; var inp = $('f' + d.r); if (inp) inp.value = fmtIn(f2, v2); schedule();
    }
  });
  document.addEventListener('change', function (e) {
    var t = e.target, d = t.dataset;
    if (d.i != null && ALL[+d.i].f === 'sel') { S[ALL[+d.i].p] = t.value === 'true'; syncFin(); recalc(); }
    if (t.tagName === 'INPUT' && t.type === 'text' && d.i != null) t.value = fmtIn(ALL[+d.i], S[ALL[+d.i].p]);
  });
  $('resetBtn').addEventListener('click', function () { S = M.defaults(); buildInputs(); recalc(); });
  $('menuBtn').addEventListener('click', function () { var sb = $('sitebar'), o = sb.classList.toggle('open'); this.setAttribute('aria-expanded', o); });

  /* ---------- KPI tiles ---------- */
  var KPIS = [
    { k: 'monthlyCashFlow', t: 'Monthly Cash Flow', f: money, s: function (r) { return 'Year 1, after debt service'; }, d: 'Year-1 annual pre-tax cash flow ÷ 12: collected rent minus operating expenses minus mortgage payments.' },
    { k: 'annualCashFlow', t: 'Annual Cash Flow', f: money, s: function (r) { return 'NOI ' + money(r.noi) + ' less debt ' + money(r.debtService); }, d: 'Year-1 NOI minus annual debt service (principal and interest), before income taxes.' },
    { k: 'noi', t: 'Net Operating Income', f: money, s: function (r) { return pct(r.expenseRatio, 1) + ' expense ratio'; }, d: 'Collected rent (scheduled rent less vacancy) minus management, maintenance reserve, HOA, property tax and HO-6 insurance. Excludes debt service.' },
    { k: 'capRate', t: 'Cap Rate', f: function (v) { return pct(v); }, s: function (r) { return 'on ' + money(r.inputs.price) + ' price'; }, d: 'Year-1 NOI ÷ purchase price.' },
    { k: 'cashOnCash', t: 'Cash-on-Cash', f: function (v) { return pct(v); }, s: function (r) { return 'on ' + money(r.cashInvested) + ' invested'; }, d: 'Year-1 annual pre-tax cash flow ÷ cash invested (down payment + closing costs).' },
    { k: 'breakEvenRent', t: 'Break-even Rent', f: function (v) { return money(v) + ' / mo'; }, s: function (r) { return 'vs ' + money(r.inputs.rent) + ' assumed rent'; }, d: 'Monthly rent at which year-1 cash flow is zero, solved directly: (HOA + property tax + insurance + debt service) ÷ (12 × [(1 − vacancy) × (1 − management) − maintenance reserve]).' },
    { k: 'dscr', t: 'DSCR', f: x2, s: function (r) { return r.loan ? 'Payment ' + money(r.monthlyPayment) + ' / mo' : 'All cash, no mortgage'; }, d: 'Debt service coverage ratio = year-1 NOI ÷ annual debt service. Not applicable when the purchase is all cash.' },
    { k: 'cashInvested', t: 'Total Cash Invested', f: money, s: function (r) { return r.loan ? money(r.loan) + ' mortgage' : 'All cash'; }, d: 'Down payment (or the full price when all cash) plus closing costs.' }
  ];
  function renderKpis() {
    $('kpis').innerHTML = KPIS.map(function (q) {
      return '<button type="button" class="kpi' + (q.k === selKpi ? ' sel' : '') + '" data-kpi="' + q.k + '" aria-pressed="' + (q.k === selKpi) + '"><span class="k">' + q.t + '</span><span class="v">' + q.f(R[q.k]) + '</span><span class="s">' + q.s(R) + '</span></button>';
    }).join('');
    var q = KPIS.filter(function (x) { return x.k === selKpi; })[0];
    $('kpiDef').innerHTML = '<b>' + q.t + ':</b> ' + esc(q.d);
  }
  $('kpis').addEventListener('click', function (e) { var b = e.target.closest('[data-kpi]'); if (!b) return; selKpi = b.dataset.kpi; renderKpis(); });

  /* ---------- SVG charts ---------- */
  var C = { blue: '#359BC5', b2: '#6CC0E0', b3: '#A9DCEF', b4: '#D6EEF7', orange: '#FDAD3F', deep: '#1E5C78' };
  function el(tag, a, txt) { var s = '<' + tag; for (var k in a) s += ' ' + k + '="' + a[k] + '"'; return s + (txt != null ? '>' + esc(txt) + '</' + tag + '>' : '/>'); }
  function box(id) { var e = $(id); return { e: e, w: Math.max(260, e.clientWidth), h: Math.max(260, e.clientHeight) }; }
  function svg(b, body) { b.e.innerHTML = '<svg viewBox="0 0 ' + b.w + ' ' + b.h + '" width="' + b.w + '" height="' + b.h + '" role="img">' + body + '</svg>'; }
  function niceMax(v) { if (v <= 0) return 1; var p = Math.pow(10, Math.floor(Math.log10(v))), m = v / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p; }
  function legend(id, items) { $(id).innerHTML = items.map(function (i) { return '<span><i style="background:' + i[1] + '"></i>' + esc(i[0]) + '</span>'; }).join(''); }

  function chartRent() {
    var b = box('chRent'), y1 = R.year1, narrow = b.w < 440, m = function (v) { return v / 12; };
    var rows = [
      { n: 'Vacancy and credit loss', s: 'Vacancy', v: m(y1.vacancy), c: C.b4 },
      { n: 'Property management', s: 'Management', v: m(y1.mgmt), c: C.b2 },
      { n: 'Maintenance reserve', s: 'Maintenance', v: m(y1.maint), c: C.b2 },
      { n: 'HOA dues', s: 'HOA', v: m(y1.hoa), c: C.blue },
      { n: 'Property tax', s: 'Property tax', v: m(y1.tax), c: C.blue },
      { n: 'HO-6 insurance', s: 'Insurance', v: m(y1.insurance), c: C.blue },
      { n: 'Mortgage payment', s: 'Mortgage', v: R.monthlyPayment, c: C.deep },
      { n: R.monthlyCashFlow < 0 ? 'Cash shortfall' : 'Cash flow to owner', s: R.monthlyCashFlow < 0 ? 'Shortfall' : 'Cash flow', v: R.monthlyCashFlow, c: C.orange }
    ];
    var lw = narrow ? 88 : 168, vw = narrow ? 56 : 70, x0 = lw, x1 = b.w - vw, mx = Math.max.apply(null, rows.map(function (r) { return Math.abs(r.v); })) || 1;
    var rh = (b.h - 4) / rows.length, bh = Math.min(18, rh * 0.62), out = '';
    rows.forEach(function (r, i) {
      var y = 2 + i * rh + (rh - bh) / 2, a = Math.abs(r.v), w = Math.max(a > 0 ? 2 : 0, (x1 - x0 - 8) * a / mx);
      out += el('text', { x: 0, y: y + bh / 2 + 4 }, narrow ? r.s : r.n);
      out += el('rect', { x: x0, y: y.toFixed(1), width: w.toFixed(1), height: bh.toFixed(1), rx: 4, fill: r.c });
      out += el('text', { x: x0 + w + 6, y: y + bh / 2 + 4, class: 'vl' }, money(r.v));
    });
    svg(b, out);
    $('c1v').textContent = 'Rent ' + money(R.inputs.rent) + ' / mo';
  }

  function chartOps() {
    var b = box('chOps'), yrs = R.proForma;
    var ser = [['egi', 'Collected rent', C.b3], ['opex', 'Operating expenses', C.b2], ['noi', 'Net operating income', C.blue], ['cashFlow', 'Cash flow after debt service', C.orange]];
    var vals = []; yrs.forEach(function (a) { ser.forEach(function (s) { vals.push(a[s[0]]); }); });
    var mxv = Math.max.apply(null, vals.concat([1])), mn = Math.min.apply(null, vals.concat([0]));
    var stp = niceMax((mxv - mn) / 4), top = Math.ceil(mxv / stp - 1e-9) * stp, bot = mn < 0 ? -Math.ceil(-mn / stp - 1e-9) * stp : 0;
    var L = 52, Rr = 6, T = 18, Bm = 26, ph = b.h - T - Bm, pw = b.w - L - Rr, y = function (v) { return T + ph * (top - v) / (top - bot); }, out = '';
    for (var v = bot; v <= top + stp / 2; v += stp) { var yy = y(v); out += el('line', { x1: L, x2: b.w - Rr, y1: yy, y2: yy, class: 'grid' }) + el('text', { x: L - 6, y: yy + 4, 'text-anchor': 'end' }, moneyC(Math.abs(v) < 1e-6 ? 0 : v)); }
    out += el('line', { x1: L, x2: b.w - Rr, y1: y(0), y2: y(0), class: 'axis' });
    var ns = ser.length, gw = pw / Math.max(1, yrs.length), bw = Math.min(26, gw * 0.84 / ns);
    yrs.forEach(function (a, i) {
      var gx = L + gw * i + (gw - bw * ns - 2 * (ns - 1)) / 2;
      ser.forEach(function (s, j) { var v = a[s[0]], y1 = y(Math.max(v, 0)), y2 = y(Math.min(v, 0)); out += el('rect', { x: (gx + j * (bw + 2)).toFixed(1), y: y1.toFixed(1), width: bw.toFixed(1), height: Math.max(1, y2 - y1).toFixed(1), rx: 3, fill: s[2] }); });
      out += el('text', { x: L + gw * i + gw / 2, y: b.h - 8, 'text-anchor': 'middle' }, (gw < 56 ? 'Y' : 'Year ') + a.year);
    });
    svg(b, out);
    $('c2v').textContent = 'Year-1 NOI ' + money(R.noi);
    legend('lgOps', ser.map(function (s) { return [s[1], s[2]]; }));
  }

  function emptyChart(b, msg) { var out = ''; for (var k = 0; k <= 4; k++) { var y = 18 + (b.h - 44) * k / 4; out += el('line', { x1: 52, x2: b.w - 6, y1: y, y2: y, class: 'grid' }); } out += el('text', { x: b.w / 2, y: b.h / 2 + 6, 'text-anchor': 'middle', class: 'vl' }, msg); svg(b, out); }

  function chartLoan() {
    var b = box('chLoan'), I = R.inputs, n = I.termYears;
    if (!R.loan) { emptyChart(b, 'All cash: no mortgage'); $('c3v').textContent = '$0'; legend('lgLoan', [['Mortgage balance', C.b2]]); return; }
    var stp = niceMax(R.loan / 4), mx = Math.ceil(R.loan / stp - 1e-9) * stp, L = 52, Rr = 10, T = 22, Bm = 26, ph = b.h - T - Bm, pw = b.w - L - Rr;
    var x = function (yr) { return L + pw * yr / n; }, y = function (v) { return T + ph * (1 - v / mx); }, out = '';
    for (var v = 0; v <= mx + stp / 2; v += stp) { out += el('line', { x1: L, x2: b.w - Rr, y1: y(v), y2: y(v), class: 'grid' }) + el('text', { x: L - 6, y: y(v) + 4, 'text-anchor': 'end' }, moneyC(v)); }
    var step = n > 20 ? 5 : n > 10 ? 2 : 1; for (var t = 0; t <= n; t += step) out += el('text', { x: x(t), y: b.h - 8, 'text-anchor': 'middle' }, 'Y' + t);
    var pts = []; for (var mo = 0; mo <= n * 12; mo += 3) pts.push(x(mo / 12).toFixed(1) + ',' + y(M.balanceAfter(R.loan, I.rate, n, mo)).toFixed(1));
    out += '<defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#359BC5" stop-opacity=".55"/><stop offset="1" stop-color="#359BC5" stop-opacity=".04"/></linearGradient></defs>';
    out += el('polygon', { points: x(0) + ',' + y(0) + ' ' + pts.join(' ') + ' ' + x(n) + ',' + y(0), fill: 'url(#lg)' });
    out += el('polyline', { points: pts.join(' '), fill: 'none', stroke: C.b2, 'stroke-width': 2.2, 'stroke-linejoin': 'round' });
    var py = Math.min(I.years, n), xx = x(py), lbl = 'End of pro forma: ' + moneyC(R.proForma[py - 1].loanBalance), anc = xx + lbl.length * 6.4 > b.w - Rr ? 'end' : 'start';
    out += el('line', { x1: xx, x2: xx, y1: T - 4, y2: T + ph, stroke: 'rgba(255,255,255,.28)', 'stroke-dasharray': '4 4' }) + el('text', { x: xx + (anc === 'end' ? -5 : 5), y: T - 8, 'text-anchor': anc, class: 'vl' }, lbl);
    svg(b, out);
    $('c3v').textContent = 'Loan ' + money(R.loan);
    legend('lgLoan', [['Mortgage balance over the ' + n + '-year amortization; ' + money(R.monthlyPayment) + ' / mo principal and interest', C.b2]]);
  }

  function chartBe() {
    var b = box('chBe'), I = R.inputs, be = R.breakEvenRent;
    var lo = Math.max(0, Math.min(I.rent, isFinite(be) ? be : I.rent) * 0.6), hi = Math.max(I.rent, isFinite(be) ? be : I.rent) * 1.3;
    var f = function (rent) { return M.compute(Object.assign({}, I, { rent: rent })).monthlyCashFlow; };
    var N = 40, pts = []; for (var i = 0; i <= N; i++) { var rt = lo + (hi - lo) * i / N; pts.push([rt, f(rt)]); }
    var vs = pts.map(function (p) { return p[1]; }), mxv = Math.max.apply(null, vs.concat([0])), mn = Math.min.apply(null, vs.concat([0]));
    var stp = niceMax((mxv - mn) / 4 || 1), top = Math.ceil(mxv / stp - 1e-9) * stp, bot = -Math.ceil(-mn / stp - 1e-9) * stp; if (top === bot) top = bot + stp;
    var L = 56, Rr = 10, T = 22, Bm = 26, ph = b.h - T - Bm, pw = b.w - L - Rr, x = function (v) { return L + pw * (v - lo) / (hi - lo); }, y = function (v) { return T + ph * (top - v) / (top - bot); }, out = '';
    for (var v = bot; v <= top + stp / 2; v += stp) { out += el('line', { x1: L, x2: b.w - Rr, y1: y(v), y2: y(v), class: 'grid' }) + el('text', { x: L - 6, y: y(v) + 4, 'text-anchor': 'end' }, moneyC(Math.abs(v) < 1e-6 ? 0 : v)); }
    out += el('line', { x1: L, x2: b.w - Rr, y1: y(0), y2: y(0), class: 'axis' });
    for (i = 0; i <= 4; i++) { var tv = lo + (hi - lo) * i / 4; out += el('text', { x: x(tv), y: b.h - 8, 'text-anchor': i === 0 ? 'start' : i === 4 ? 'end' : 'middle' }, moneyC(tv)); }
    out += el('polyline', { points: pts.map(function (p) { return x(p[0]).toFixed(1) + ',' + y(p[1]).toFixed(1); }).join(' '), fill: 'none', stroke: C.b2, 'stroke-width': 2.2 });
    function vline(rt, label, color) { var xx = x(rt), anc = xx + label.length * 6.4 > b.w - Rr ? 'end' : 'start'; out += el('line', { x1: xx, x2: xx, y1: T - 4, y2: T + ph, stroke: color, 'stroke-dasharray': '4 4' }) + el('text', { x: xx + (anc === 'end' ? -5 : 5), y: T - 8 + (color === C.orange ? 14 : 0), 'text-anchor': anc, class: 'vl' }, label); }
    if (isFinite(be)) vline(be, 'Break-even ' + money(be), 'rgba(255,255,255,.35)');
    vline(I.rent, 'Assumed ' + money(I.rent), C.orange);
    out += el('circle', { cx: x(I.rent).toFixed(1), cy: y(R.monthlyCashFlow).toFixed(1), r: 5, fill: C.orange });
    svg(b, out);
    $('c4v').textContent = 'Break-even ' + money(be) + ' / mo';
    legend('lgBe', [['Year-1 monthly cash flow at each monthly rent, other inputs held', C.b2], ['Assumed rent', C.orange]]);
  }

  /* ---------- tables ---------- */
  function tr(cells, c) { return '<tr' + (c ? ' class="' + c + '"' : '') + '>' + cells.map(function (x, i) { return i === 0 ? '<td class="lbl">' + x + '</td>' : '<td class="n">' + x + '</td>'; }).join('') + '</tr>'; }
  function th(cells) { return '<thead><tr>' + cells.map(function (x, i) { return '<th' + (i ? ' class="n"' : '') + '>' + x + '</th>'; }).join('') + '</tr></thead>'; }
  function grp(t, n) { return '<tr class="grp"><td colspan="' + n + '">' + t + '</td></tr>'; }
  function renderTables() {
    var I = R.inputs, y1 = R.year1, tot = I.price + R.closing;
    var src = [['Down payment (equity)', R.down], ['Closing costs (equity)', R.closing], ['Mortgage', R.loan]];
    $('tSources').innerHTML = th(['Source', 'Amount', '% of total']) + '<tbody>' + src.map(function (s) { return tr([s[0], money(s[1]), pct(s[1] / tot, 1)]); }).join('') + tr(['Total sources', money(tot), '100.0%'], 'tot') + '</tbody>';
    $('tUses').innerHTML = th(['Use', 'Amount', '% of total']) + '<tbody>' + tr(['Purchase price', money(I.price), pct(I.price / tot, 1)]) + tr(['Closing costs', money(R.closing), pct(R.closing / tot, 1)]) + tr(['Total uses', money(tot), '100.0%'], 'tot') + '</tbody>';
    $('srcTot').textContent = money(tot); $('useTot').textContent = money(tot);

    var g = y1.gpr, line = function (name, basis, a, c) { return tr([name, basis, neg(a, money(a / 12)), neg(a, money(a)), pct(a / g, 1)], c); };
    $('tBudget').innerHTML = th(['Line item', 'Basis', 'Monthly', 'Annual', '% of rent']) + '<tbody>' +
      grp('Revenue', 5) + line('Scheduled rent', money(I.rent) + ' / mo', g) + line('Vacancy and credit loss', pct(I.vacancyPct, 1) + ' of rent', -y1.vacancy) + line('Collected rent', '', y1.egi, 'sub') +
      grp('Operating expenses', 5) + line('Property management', pct(I.mgmtPct, 1) + ' of collected', y1.mgmt) + line('Maintenance reserve', pct(I.maintPct, 1) + ' of rent', y1.maint) +
      line('HOA dues', money(I.hoaMonthly) + ' / mo', y1.hoa) + line('Property tax', pct(I.taxPct, 2) + ' of price', y1.tax) + line('HO-6 insurance', money(I.insuranceAnnual) + ' / yr', y1.insurance) + line('Total operating expenses', '', y1.opex, 'sub') +
      line('Net operating income', '', y1.noi, 'sub') + line('Mortgage payment (P&I)', R.loan ? pct(I.rate, 3) + ', ' + I.termYears + ' yr' : 'All cash', y1.debtService) +
      line('Cash flow after debt service', '', y1.cashFlow, 'tot') + '</tbody>';

    var P = R.proForma, row = function (name, k, c, fmt) { return tr([name].concat(P.map(function (a) { var v = a[k]; return fmt ? fmt(v) : neg(v, money(v)); })), c); };
    $('pfNote').textContent = 'Rent +' + pct(I.rentGrowth, 1) + ' / yr; HOA, tax and insurance +' + pct(I.expenseGrowth, 1) + ' / yr';
    $('tAnnual').innerHTML = th(['$'].concat(P.map(function (a) { return 'Year ' + a.year; }))) + '<tbody>' +
      grp('Revenue', P.length + 1) + row('Scheduled rent', 'gpr') + tr(['Vacancy and credit loss'].concat(P.map(function (a) { return neg(-1, money(-a.vacancy)); }))) + row('Collected rent', 'egi', 'sub') +
      grp('Operating expenses', P.length + 1) + row('Property management', 'mgmt') + row('Maintenance reserve', 'maint') + row('HOA dues', 'hoa') + row('Property tax', 'tax') + row('HO-6 insurance', 'insurance') + row('Total operating expenses', 'opex', 'sub') +
      row('Net operating income', 'noi', 'sub') + row('Debt service', 'debtService') + row('Cash flow after debt service', 'cashFlow', 'tot') +
      row('Cash-on-cash', 'coc', '', function (v) { return neg(v, pct(v)); }) + row('Principal paid', 'principal') + row('Mortgage balance (end of year)', 'loanBalance') + '</tbody>';

    $('tRet').innerHTML = th(['Metric', 'Value', 'Calculation']) + '<tbody>' +
      tr(['Total cash invested', money(R.cashInvested), 'Down payment ' + money(R.down) + ' + closing ' + money(R.closing)]) +
      tr(['Net operating income', money(R.noi), 'Collected rent − operating expenses']) +
      tr(['Cap rate', pct(R.capRate), 'NOI ÷ purchase price'], 'sub') +
      tr(['Annual cash flow', neg(R.annualCashFlow, money(R.annualCashFlow)), 'NOI − debt service ' + money(R.debtService)]) +
      tr(['Monthly cash flow', neg(R.monthlyCashFlow, money(R.monthlyCashFlow)), 'Annual cash flow ÷ 12']) +
      tr(['Cash-on-cash', neg(R.cashOnCash, pct(R.cashOnCash)), 'Annual cash flow ÷ cash invested'], 'sub') +
      tr(['DSCR', x2(R.dscr), R.loan ? 'NOI ÷ debt service' : 'All cash']) +
      tr(['Break-even rent', money(R.breakEvenRent) + ' / mo', 'Rent where cash flow = 0']) +
      tr(['Operating expense ratio', pct(R.expenseRatio, 1), 'Operating expenses ÷ collected rent']) + '</tbody>';

    function sens(id, key, label, fmtKey) {
      var steps = [-0.2, -0.1, 0, 0.1, 0.2];
      $(id).innerHTML = th([label, 'Monthly CF', 'Cap rate', 'Cash-on-cash', 'DSCR']) + '<tbody>' + steps.map(function (s) {
        var o = {}; o[key] = I[key] * (1 + s); var r = M.compute(Object.assign({}, I, o));
        return tr([fmtKey(o[key]) + (s ? ' (' + (s > 0 ? '+' : '') + Math.round(s * 100) + '%)' : ' (base)'), neg(r.monthlyCashFlow, money(r.monthlyCashFlow)), pct(r.capRate), neg(r.cashOnCash, pct(r.cashOnCash)), x2(r.dscr)], s ? '' : 'hl');
      }).join('') + '</tbody>';
    }
    sens('tSensRent', 'rent', 'Monthly rent', money);
    sens('tSensPrice', 'price', 'Purchase price', money);
  }

  function renderCharts() { chartRent(); chartOps(); chartLoan(); chartBe(); }
  function recalc() {
    var ok = ALL.every(function (f) { return f.f === 'sel' || isFinite(S[f.p]); }) && S.price > 0 && S.years >= 1 && S.termYears >= 1;
    if (!ok) return;
    var I = Object.assign({}, S, { years: Math.round(S.years), termYears: Math.round(S.termYears) });
    R = M.compute(I);
    renderKpis(); renderCharts(); renderTables();
  }
  var rz = null; window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { if (R) renderCharts(); }, 120); });
  $('yr').textContent = new Date().getFullYear();
  buildInputs(); recalc();
})();
