/* Bespoke Underwriting — apartment development engine.
   A JavaScript port of the monthly logic in the A.CRE Apartment Development Model v3.0
   (Adventures in CRE, https://www.adventuresincre.com/apartment-development-model/).
   Defaults are the sample inputs that ship with that workbook. Formula references in
   comments point to the workbook's Underwriting tab (e.g. "row 87" = leased %). */
(function (root) {
  'use strict';
  var N = 132; /* monthly grid: month 0 (land close) .. month 132, as in Underwriting!Q:ES */

  /* ---------- A.CRE sample inputs (Apartment Development Model v3.0 template) ---------- */
  function defaults() {
    return {
      startDate: '2026-01-01',
      landAcres: 4.5, gba: 320938, parkingStructured: 300, parkingSurface: 55, buildings: 1, stories: 4,
      /* development budget (rows 26-49). amount: $ total. basis lines are computed from % inputs */
      landPrice: 7990000, closingCosts: 240000,
      constructionPerUnit: 140000, otherHardPct: 0.015,
      /* Bespoke add-on (not in A.CRE): sitework & drainage hard-cost group. Zero defaults keep the A.CRE sample unchanged. */
      sitework: {
        items: [
          { key: 'fill', name: 'Fill and grading', basis: 'CY', cost: 0, qty: 0 },
          { key: 'pond', name: 'Detention/retention pond construction', basis: 'Acre', cost: 0, qty: 0 },
          { key: 'convey', name: 'Stormwater conveyance (culverts, swales, pipes)', basis: 'LF', cost: 0, qty: 0 },
          { key: 'wq', name: 'Water quality treatment (biofiltration, bioswales)', basis: 'SF', cost: 0, qty: 0 },
          { key: 'offsite', name: 'Jurisdiction-required off-site drainage upgrades', basis: 'LS', cost: 0, qty: 1 }
        ],
        contPct: 0.10
      },
      aePct: 0.06, cmPct: 0.02, marketing: 75000, devFeePct: 0.03, financingFees: 0,
      timing: { land: [0, 0], closing: [0, 0], construction: [1, 18], sitework: [1, 18], otherHard: [1, 18], ae: [1, 6], cm: [1, 18], marketing: [16, 18], devFee: [1, 18], financingFees: [0, 0] },
      methods: { construction: 'S-Curve', otherHard: 'S-Curve', sitework: 'S-Curve' }, /* everything else Straight-Line */
      scurveSteepness: 6,
      /* capital stack */
      ltc: 0.65, constRate: 0.095, leaseUpIncomeToInterest: 1,
      permOn: false, permSizing: 'Construction Debt', permLtv: 0.60, permRate: 0.065, permIO: true, permAmortYears: 30, permFeePct: 0.01,
      /* lease-up & revenue */
      rentGrowth: 0.03, preLeased: 0.10, leasePace: 20, leaseTerm: 13,
      unitMix: [
        { name: 'Studio', units: 60, sf: 650, freeLeaseUp: 1, freeStab: 0, rent: 1600 },
        { name: '1 Bd/1 Bth', units: 60, sf: 750, freeLeaseUp: 1, freeStab: 0, rent: 1700 },
        { name: '1 Bd/1.5 Bth', units: 60, sf: 800, freeLeaseUp: 1, freeStab: 0, rent: 1750 },
        { name: '2 Bd/2 Bth', units: 60, sf: 950, freeLeaseUp: 1, freeStab: 0, rent: 1850 },
        { name: '2 Bd/2.5 Bth', units: 60, sf: 1100, freeLeaseUp: 1, freeStab: 0, rent: 2100 }
      ],
      nonRevenueUnits: 2,
      otherIncomeGrowth: 0.03, rubs: 200000, otherIncomePctOfRent: 0.04, parkingPerSpaceMo: 125, parkingOccupancy: 0.80,
      vacancy: 0.05, creditLoss: 0.01, vacancyBasis: 'Total Potential Income',
      /* operating expenses ($/yr, untrended) */
      expenseGrowth: 0.03,
      opex: [
        { key: 'rm', name: 'Repairs and Maintenance', amount: 315000, fixed: 1 },
        { key: 'payroll', name: 'Payroll', amount: 395100, fixed: 1 },
        { key: 'ga', name: 'General & Administrative', amount: 240000, fixed: 0.75 },
        { key: 'mkt', name: 'Marketing', amount: 130000, fixed: 1 },
        { key: 'util', name: 'Utilities', amount: 280000, fixed: 0.5 },
        { key: 'contract', name: 'Contract Services', amount: 105000, fixed: 0.75 },
        { key: 'capres', name: 'Capital Reserves', amount: 60000, fixed: 1 }
      ],
      mgmtFeePct: 0.03, insurance: 105000, insuranceFixed: 1,
      propertyTax: 864728.3169008, taxRamp: [0.5, 0.75, 1],
      miscReservesPerUnit: 0, otherCapex: 25000,
      /* sale */
      capRateToday: 0.0525, exitCap: 0.0575, sellingCosts: 0.015, saleYearTax: 933646.6222943657,
      /* partnership */
      gpShare: 0.10, prefHurdle: 0.09, tiers: [{ hurdle: 0.12, promote: 0.15 }, { hurdle: 0.15, promote: 0.30 }], topPromote: 0.40,
      catchUp: true, aumFeePct: 0.004, aumBase: 'Project Cost', devFeeToGP: false
    };
  }

  /* ---------- math helpers ---------- */
  function erf(x) {
    var s = x < 0 ? -1 : 1; x = Math.abs(x);
    if (x < 2.5) { var sum = 0, t = x, n = 0, term; do { term = t / (2 * n + 1); sum += term; n++; t *= -x * x / n; } while (Math.abs(term) > 1e-17 * Math.abs(sum) && n < 200); return s * 2 / Math.sqrt(Math.PI) * sum; }
    /* erfc continued fraction (Lentz) */
    var tiny = 1e-300, f = x, C = x, D = 0, a, i, d;
    for (i = 1; i < 300; i++) { a = i / 2; D = x + a * D; D = D === 0 ? tiny : D; C = x + a / C; C = C === 0 ? tiny : C; D = 1 / D; d = C * D; f *= d; if (Math.abs(d - 1) < 1e-16) break; }
    return s * (1 - Math.exp(-x * x) / Math.sqrt(Math.PI) / f);
  }
  function normCdf(x, mu, sd) { return 0.5 * (1 + erf((x - mu) / (sd * Math.SQRT2))); }
  function ceil12(x) { return Math.ceil(x / 12 - 1e-12); }
  function eomonth(y, m0) { return new Date(Date.UTC(y, m0 + 1, 0)); } /* last day of month m0 (0-based) */
  function monthDates(start) {
    var p = start.split('-').map(Number), out = [];
    for (var m = 0; m <= N; m++) out.push(eomonth(p[0], p[1] - 1 + m - 1));
    return out;
  }
  function xirr(cfs, dates) {
    var d0 = dates[0].getTime(), t = dates.map(function (d) { return (d.getTime() - d0) / 864e5 / 365; });
    var hasPos = cfs.some(function (v) { return v > 0; }), hasNeg = cfs.some(function (v) { return v < 0; });
    if (!hasPos || !hasNeg) return NaN;
    function npv(r) { var s = 0; for (var i = 0; i < cfs.length; i++) s += cfs[i] / Math.pow(1 + r, t[i]); return s; }
    function dnpv(r) { var s = 0; for (var i = 0; i < cfs.length; i++) s -= t[i] * cfs[i] / Math.pow(1 + r, t[i] + 1); return s; }
    var r = 0.1;
    for (var k = 0; k < 100; k++) { var f = npv(r), df = dnpv(r); if (!isFinite(f) || df === 0) break; var nr = r - f / df; if (nr <= -0.9999) nr = (r - 0.9999) / 2; if (Math.abs(nr - r) < 1e-12) { r = nr; return r; } r = nr; }
    /* bisection fallback */
    var lo = -0.99, hi = 10; if (npv(lo) * npv(hi) > 0) return NaN;
    for (k = 0; k < 300; k++) { var mid = (lo + hi) / 2; if (npv(lo) * npv(mid) <= 0) hi = mid; else lo = mid; }
    return (lo + hi) / 2;
  }
  function sum(a, from, to) { var s = 0; from = from || 0; to = to == null ? a.length - 1 : to; for (var i = from; i <= to && i < a.length; i++) s += a[i] || 0; return s; }
  function zeros() { var a = new Array(N + 1); for (var i = 0; i <= N; i++) a[i] = 0; return a; }
  function pmt(rate, nper, pv) { return rate === 0 ? -pv / nper : -pv * rate / (1 - Math.pow(1 + rate, -nper)); }
  function pv(rate, nper, payment) { return rate === 0 ? -payment * nper : -payment * (1 - Math.pow(1 + rate, -nper)) / rate; }
  function emx(cf) { var p = 0, n = 0; cf.forEach(function (v) { if (v > 0) p += v; else n -= v; }); return n ? p / n : NaN; }

  /* ---------- engine ---------- */
  function run(inp, opts) {
    opts = opts || {};
    var I = inp, M = {};
    var dates = monthDates(I.startDate);
    var units = I.unitMix.reduce(function (s, u) { return s + (+u.units || 0); }, 0);
    var nra = I.unitMix.reduce(function (s, u) { return s + (+u.units || 0) * (+u.sf || 0); }, 0);
    var grossRentYr = I.unitMix.reduce(function (s, u) { return s + u.rent * u.units * 12; }, 0); /* I99 */

    /* --- development budget lines (rows 26-43) --- */
    var construction = units * I.constructionPerUnit;
    var otherHard = construction * I.otherHardPct;
    var sw = I.sitework || { items: [], contPct: 0 };
    var swItems = sw.items.map(function (it) { return { key: it.key, name: it.name, basis: it.basis, cost: +it.cost || 0, qty: it.basis === 'LS' ? 1 : (+it.qty || 0), total: (+it.cost || 0) * (it.basis === 'LS' ? 1 : (+it.qty || 0)) }; });
    var swSub = swItems.reduce(function (a, it) { return a + it.total; }, 0), swCont = swSub * (+sw.contPct || 0), sitework = swSub + swCont;
    var hard = construction + otherHard + sitework;
    var land = I.landPrice + I.closingCosts;
    var ae = hard * I.aePct, cm = hard * I.cmPct;
    /* Bespoke add-on: the A.CRE 'Marketing and Leasing' line can be entered as separate soft-cost lines
       (I.softItems: fixed $ amounts, plus I.softContPct of A&E + CM + those lines). They share the marketing
       timing, so monthly cash flows match one line of the same total. Without softItems the A.CRE line is used. */
    var softLines, mktTot;
    if (I.softItems && I.softItems.length) {
      softLines = I.softItems.map(function (it) { return { key: 'soft_' + it.key, tk: 'marketing', cat: 'soft', group: 'mkt', name: it.name, short: it.short, amount: +it.amount || 0 }; });
      var softBase = ae + cm + softLines.reduce(function (a, L) { return a + L.amount; }, 0);
      softLines.push({ key: 'soft_cont', tk: 'marketing', cat: 'soft', group: 'mkt', name: 'Soft-Cost Contingency', short: 'Soft Contingency', amount: softBase * (+I.softContPct || 0), contPct: +I.softContPct || 0, base: softBase });
      mktTot = softLines.reduce(function (a, L) { return a + L.amount; }, 0);
    } else {
      softLines = [{ key: 'marketing', cat: 'soft', name: 'Marketing and Leasing', amount: I.marketing }];
      mktTot = I.marketing;
    }
    var devFee = (ae + cm + mktTot + hard + land) * I.devFeePct; /* I42 = SUM(I38:I41,I35,I29)*3% */
    var lines = [
      { key: 'land', cat: 'land', name: 'Land Costs', amount: I.landPrice },
      { key: 'closing', cat: 'land', name: 'Closing Costs', amount: I.closingCosts },
      { key: 'construction', cat: 'hard', name: 'Construction Costs', amount: construction },
      { key: 'otherHard', cat: 'hard', name: 'Other Hard Costs', amount: otherHard },
      { key: 'sitework', cat: 'hard', group: 'site', name: 'Sitework and Drainage', amount: sitework },
      { key: 'ae', cat: 'soft', name: 'Architecture & Engineering', amount: ae },
      { key: 'cm', cat: 'soft', name: 'Construction Management', amount: cm },
      { key: 'devFee', cat: 'soft', name: 'Development Fee', amount: devFee }
    ];
    Array.prototype.splice.apply(lines, [lines.length - 1, 0].concat(softLines));
    var constructionEnd = 0;
    lines.forEach(function (L) {
      var tk = L.tk || L.key, t = I.timing[tk], s = t[0], e = t[1], n = e - s + 1, method = (I.methods[tk] || 'Straight-Line');
      L.start = s; L.end = e; L.method = method; L.m = zeros();
      constructionEnd = Math.max(constructionEnd, e);
      if (method === 'S-Curve') {
        var mu = n / 2, sd = n / I.scurveSteepness, den = 1 - 2 * normCdf(0, mu, sd);
        for (var m = s; m <= e && m <= N; m++) { var k = m - s + 1; L.m[m] = (normCdf(k, mu, sd) - normCdf(k - 1, mu, sd)) / den * L.amount; }
      } else for (var m2 = s; m2 <= e && m2 <= N; m2++) L.m[m2] = L.amount / n;
    });
    var ff = I.timing.financingFees; constructionEnd = Math.max(constructionEnd, ff[1]);
    var finFee = zeros(); for (var mf = ff[0]; mf <= ff[1]; mf++) finFee[mf] = I.financingFees / (ff[1] - ff[0] + 1);
    function catSum(cat) { var a = zeros(); lines.forEach(function (L) { if (L.cat === cat) for (var m = 0; m <= N; m++) a[m] += L.m[m]; }); return a; }
    var landM = catSum('land'), hardM = catSum('hard'), softM = catSum('soft');
    var devCost = zeros(); for (var m = 0; m <= N; m++) devCost[m] = landM[m] + hardM[m] + softM[m];
    var devCostTot = sum(devCost), finFeeTot = I.financingFees;

    /* --- timing (D87, E88, E118) --- */
    var opBegin = constructionEnd + 1, gbI = opBegin, gbE = gbI;

    /* --- lease-up (rows 87-89; calc FB86:FB89) --- */
    var leased = zeros(), avail = zeros(), newL = zeros(), stabCtr = zeros(), opm = zeros(), cum = 0;
    for (m = 1; m <= N; m++) {
      opm[m] = Math.max(m - opBegin + 1, 0);
      newL[m] = (opm[m] === 1 ? I.preLeased * units : 0) + (opm[m] > 1 ? Math.min(I.leasePace, avail[m - 1]) : 0);
      cum += newL[m];
      avail[m] = opm[m] > 0 ? units - cum : 0;
      leased[m] = m < opBegin ? 0 : 1 - avail[m] / units;
      stabCtr[m] = leased[m] === 1 ? stabCtr[m - 1] + 1 : 0;
    }
    var stab = 0; for (m = 1; m <= N; m++) if (stabCtr[m] === 1) { stab = m; break; }
    var stabOk = stab > 0; if (!stabOk) stab = N;
    var sale = I.permOn ? 120 : stab + 12;            /* D151 */
    if (opts.saleMonth) sale = opts.saleMonth;
    var end = sale;                                     /* H13 Timing_Analysis_End_Month */
    var permFund = stab, constPayoff = I.permOn ? permFund : sale;

    var igy = zeros(), egy = zeros(), opy = zeros();
    for (m = 0; m <= N; m++) { igy[m] = ceil12(Math.max(m - gbI + 1, 1)); egy[m] = ceil12(Math.max(m - gbE + 1, 1)); opy[m] = ceil12(opm[m]); }

    /* --- revenue (rows 93-115) --- */
    var gross = zeros(), conc = zeros(), nonrev = zeros(), ltl = zeros(), rentInc = zeros();
    var E102 = -I.nonRevenueUnits / units * grossRentYr / 12;
    for (m = 1; m <= N; m++) {
      var g = Math.pow(1 + I.rentGrowth, igy[m] - 1);
      I.unitMix.forEach(function (u) {
        var r = leased[m] > 0 ? u.units * u.rent * g : 0;
        gross[m] += r;
        conc[m] -= stabCtr[m] === 0 ? (u.freeLeaseUp / I.leaseTerm) * r : (u.freeStab / I.leaseTerm) * r;
      });
      nonrev[m] = leased[m] === 0 ? 0 : E102 * Math.pow(1 + I.rentGrowth, opy[m] - 1);
    }
    /* loss-to-lease engine (calc rows 147-160) */
    var mkt = zeros(), tl = zeros(), sec = zeros(), tot = zeros(), inPlace = zeros(), T = I.leaseTerm;
    for (m = 1; m <= N; m++) {
      mkt[m] = opm[m] > 0 ? grossRentYr * Math.pow(1 + I.rentGrowth, igy[m] - 1) / 12 : 0;
      var back = m - Math.min(m, T);
      var prevTl = back > 0 ? tl[back] : 0;
      tl[m] = opm[m] === 0 ? 0 : leased[m] - leased[m - 1] + prevTl;
      tot[m] = tl[m] * mkt[m];
      sec[m] = (opm[m] === 0 ? 0 : prevTl) * mkt[m];
      if (m <= T) inPlace[m] = inPlace[m - 1] + tot[m];
      else { var s2 = 0; for (var j = m - T + 1; j <= m; j++) s2 += tot[j]; inPlace[m] = s2; }
      ltl[m] = Math.max(-(gross[m] + conc[m] + nonrev[m]), -(mkt[m] - inPlace[m]));
      rentInc[m] = gross[m] + conc[m] + ltl[m] + nonrev[m];
    }
    var I100 = -I.unitMix.reduce(function (s, u) { return s + u.freeStab * u.units; }, 0) / units / I.leaseTerm * grossRentYr;
    var otherItems = [
      { name: 'RUBS', amount: I.rubs },
      { name: 'Other Income', amount: (grossRentYr + I100 + E102 * 12) * I.otherIncomePctOfRent }, /* I106 = I103*4% */
      { name: 'Parking Income', amount: I.parkingStructured * I.parkingPerSpaceMo * 12 * I.parkingOccupancy }
    ];
    var other = zeros();
    otherItems.forEach(function (o) { o.m = zeros(); for (var m = 1; m <= N; m++) { o.m[m] = (o.amount / 12 * leased[m]) * Math.pow(1 + I.otherIncomeGrowth, igy[m] - 1); other[m] += o.m[m]; } });
    var tpi = zeros(), vac = zeros(), cl = zeros(), egr = zeros();
    function basis(m, b) { return b === 'Gross Rent' ? gross[m] : b === 'Total Rental Income' ? rentInc[m] : tpi[m]; }
    for (m = 0; m <= N; m++) { tpi[m] = rentInc[m] + other[m]; vac[m] = -I.vacancy * basis(m, I.vacancyBasis); cl[m] = -I.creditLoss * basis(m, I.vacancyBasis); egr[m] = tpi[m] + vac[m] + cl[m]; }

    /* --- expenses (rows 122-132) --- */
    var opexItems = I.opex.map(function (o) { return { name: o.name, amount: o.amount, fixed: o.fixed, m: zeros() }; });
    opexItems.push({ name: 'Insurance', amount: I.insurance, fixed: I.insuranceFixed, m: zeros() });
    var mgmt = zeros(), tax = zeros(), opexTot = zeros(), noi = zeros();
    for (m = 1; m <= N; m++) {
      var ge = Math.pow(1 + I.expenseGrowth, egy[m] - 1);
      opexItems.forEach(function (o) { var fixedPart = m < opBegin ? 0 : o.amount / 12 * o.fixed; o.m[m] = (fixedPart + o.amount / 12 * leased[m] * (1 - o.fixed)) * ge; });
      mgmt[m] = egr[m] * I.mgmtFeePct;
      var ramp = I.taxRamp[Math.min(Math.max(opy[m], 1), 3) - 1];
      tax[m] = (m < opBegin ? 0 : I.propertyTax / 12 * ramp) * Math.pow(1 + I.expenseGrowth, igy[m] - 1); /* row 131 grows on the income-growth year */
      opexTot[m] = opexItems.reduce(function (s, o) { return s + o.m[m]; }, 0) + mgmt[m] + tax[m];
      noi[m] = egr[m] - opexTot[m];
    }
    var capex = zeros(), cfo = zeros(), ds = zeros();
    for (m = 1; m <= N; m++) {
      var gc = Math.pow(1 + I.expenseGrowth, egy[m] - 1);
      capex[m] = (I.miscReservesPerUnit * units / 12 * leased[m] + I.otherCapex / 12 * leased[m]) * gc;
      cfo[m] = noi[m] - capex[m];
    }

    /* --- sources & uses: equity first, then construction debt (calc rows 52-71) --- */
    function fund(E) {
      var eqDraw = zeros(), debt = zeros(), intGross = zeros(), intPaid = zeros(), reserve = zeros(), shortfall = zeros();
      var eqLeft = E, debtLeft = devCostTot + finFeeTot - E, bal = 0, gate = I.permOn ? permFund : end;
      for (var m = 0; m <= N; m++) {
        eqDraw[m] = Math.min(eqLeft, devCost[m] + finFee[m]); eqLeft -= eqDraw[m];
        debt[m] = Math.min(debtLeft, devCost[m] + finFee[m] - eqDraw[m]); debtLeft -= debt[m];
        intGross[m] = m === 0 ? 0 : (m <= gate ? bal * I.constRate / 12 : 0);
        intPaid[m] = m === 0 ? 0 : Math.min(intGross[m], Math.max(cfo[m], 0)) * I.leaseUpIncomeToInterest;
        reserve[m] = intGross[m] - intPaid[m];
        shortfall[m] = I.ltc === 0 ? 0 : (m <= gate ? -Math.min(cfo[m], 0) : 0);
        bal += debt[m] + reserve[m] + shortfall[m];
      }
      var total = devCostTot + finFeeTot + sum(reserve) + sum(shortfall);
      return { eqDraw: eqDraw, debt: debt, intGross: intGross, intPaid: intPaid, reserve: reserve, shortfall: shortfall, total: total };
    }
    var E, F, it = 0;
    if (opts.equity != null) { E = opts.equity; F = fund(E); }
    else {
      E = (1 - I.ltc) * (devCostTot + finFeeTot);
      for (it = 0; it < 200; it++) { F = fund(E); var nE = (1 - I.ltc) * F.total; if (Math.abs(nE - E) < 1e-7) { E = nE; F = fund(E); break; } E = nE; }
    }
    var totalCost = F.total, loan = totalCost - E;
    var constDraw = zeros(), loanBal = zeros(), b2 = 0;
    for (m = 0; m <= N; m++) { constDraw[m] = F.debt[m] + F.reserve[m] + F.shortfall[m]; b2 += constDraw[m]; loanBal[m] = m <= constPayoff ? b2 : 0; }

    /* --- valuation (rows 152-198) --- */
    function window12(a, from) { return sum(a, from, from + 11); }
    var opexSums = function (from) { return opexItems.map(function (o) { return window12(o.m, from); }); };
    var U = {}, Tr = {}, S = {};
    U.gross = grossRentYr; U.conc = -I.unitMix.reduce(function (s, u) { return s + u.freeStab * u.units; }, 0) / units / I.leaseTerm * grossRentYr; U.ltl = 0; U.nonrev = E102 * 12;
    U.rent = U.gross + U.conc + U.ltl + U.nonrev; U.other = otherItems.reduce(function (s, o) { return s + o.amount; }, 0); U.tpi = U.rent + U.other;
    U.vac = -I.vacancy * (I.vacancyBasis === 'Gross Rent' ? U.gross : I.vacancyBasis === 'Total Rental Income' ? U.rent : U.tpi);
    U.cl = -I.creditLoss * (I.vacancyBasis === 'Gross Rent' ? U.gross : I.vacancyBasis === 'Total Rental Income' ? U.rent : U.tpi);
    U.egr = U.tpi + U.vac + U.cl; U.opexItems = opexItems.map(function (o) { return o.amount; }); U.mgmt = U.egr * I.mgmtFeePct; U.tax = I.propertyTax;
    U.opex = sum(U.opexItems) + U.mgmt + U.tax; U.noi = U.egr - U.opex; U.capex = I.miscReservesPerUnit * units + I.otherCapex; U.cfo = U.noi - U.capex;
    Tr.gross = window12(gross, stab); Tr.conc = window12(conc, stab); Tr.ltl = window12(ltl, stab); Tr.nonrev = window12(nonrev, stab);
    Tr.rent = Tr.gross + Tr.conc + Tr.ltl + Tr.nonrev; Tr.other = window12(other, stab); Tr.tpi = Tr.rent + Tr.other;
    Tr.vac = window12(vac, stab); Tr.cl = window12(cl, stab); Tr.egr = Tr.tpi + Tr.vac + Tr.cl;
    Tr.opexItems = opexSums(stab); Tr.mgmt = window12(mgmt, stab); Tr.tax = I.propertyTax * (Tr.gross / U.gross);
    Tr.opex = sum(Tr.opexItems) + Tr.mgmt + Tr.tax; Tr.noi = Tr.egr - Tr.opex; Tr.capex = window12(capex, stab); Tr.cfo = Tr.noi - Tr.capex;
    S.gross = window12(gross, sale); S.conc = Math.min(window12(conc, sale), Tr.conc); S.ltl = Math.min(window12(ltl, sale), Tr.ltl); S.nonrev = Math.min(window12(nonrev, sale), Tr.nonrev);
    S.rent = S.gross + S.conc + S.ltl + S.nonrev;
    S.otherItems = otherItems.map(function (o) { return Math.max(window12(o.m, sale), window12(o.m, stab)); }); S.other = sum(S.otherItems); S.tpi = S.rent + S.other;
    S.vac = Math.min(window12(vac, sale), Tr.vac); S.cl = Math.min(window12(cl, sale), Tr.cl); S.egr = S.tpi + S.vac + S.cl;
    S.opexItems = opexItems.map(function (o, i) { return Math.max(window12(o.m, sale), Tr.opexItems[i]); }); S.mgmt = Math.max(window12(mgmt, sale), Tr.mgmt); S.tax = I.saleYearTax;
    S.opex = sum(S.opexItems) + S.mgmt + S.tax; S.noi = S.egr - S.opex; S.capex = Math.max(window12(capex, sale), Tr.capex); S.cfo = S.noi - S.capex;
    var capTr = (stab / sale) * (I.exitCap - I.capRateToday) + I.capRateToday;
    U.cap = I.capRateToday; Tr.cap = capTr; S.cap = I.exitCap;
    U.value = U.noi / U.cap; Tr.value = Tr.noi / Tr.cap; S.value = S.noi / S.cap;
    [U, Tr, S].forEach(function (x) { x.yoc = x.noi / totalCost; x.spread = (x.yoc - x.cap) * 10000; });

    /* --- permanent debt (rows 76-82) --- */
    var permAmt = I.permSizing === 'Construction Debt' ? loan / (1 - I.permFeePct) : Tr.value * I.permLtv;
    var permPay = I.permIO ? permAmt * I.permRate : pmt(I.permRate / 12, I.permAmortYears * 12, -permAmt) * 12;
    var permPayoff = I.permIO ? -permAmt : pv(I.permRate / 12, I.permAmortYears * 12 - (sale - permFund), permPay / 12);
    var permFundCF = zeros(), permPayCF = zeros();
    for (m = 0; m <= N; m++) {
      if (I.permOn) { permFundCF[m] = m === permFund ? permAmt * (1 - I.permFeePct) : 0; permPayCF[m] = m === sale ? permPayoff : 0; ds[m] = m > permFund ? permPay / 12 : 0; }
      cfo[m] = cfo[m]; /* unchanged */
    }
    var saleGross = S.value, sellCost = -saleGross * I.sellingCosts, saleNet = saleGross + sellCost;
    var debtPayoffAtSale = I.permOn ? permPayoff : -loan;

    /* --- property-level cash flows (rows 202-218), months 0..end --- */
    var L = end + 1, unlev = [], lev = [], cfDates = dates.slice(0, L);
    for (m = 0; m < L; m++) {
      var intG = m <= constPayoff ? F.intGross[m] : 0;
      var saleCF = m === sale ? saleNet : 0, payoff = m === constPayoff ? -loan : 0;
      unlev.push(-devCost[m] + cfo[m] + saleCF);
      lev.push(-finFee[m] - devCost[m] - intG + constDraw[m] + permFundCF[m] + cfo[m] - ds[m] + saleCF + payoff + permPayCF[m]);
    }
    function irrFrom(cf) { return devCost[0] + finFee[0] + (F.reserve[0] || 0) + (F.shortfall[0] || 0) === 0 ? xirr(cf.slice(1), cfDates.slice(1)) : xirr(cf, cfDates); }
    var R = {
      unlevered: { emx: emx(unlev), irr: irrFrom(unlev), profit: sum(unlev) },
      levered: { emx: emx(lev), irr: irrFrom(lev), profit: sum(lev) }
    };

    /* --- partnership waterfall (rows 226-252; calc rows 200-241) --- */
    var gp = I.gpShare, lpS = 1 - gp;
    var hurdles = [I.prefHurdle, I.tiers[0].hurdle, I.tiers[1].hurdle];
    var promotes = [0, I.tiers[0].promote, I.tiers[1].promote, I.topPromote];
    var gpSplit = promotes.map(function (p) { return p + (1 - p) * gp; }), lpSplit = gpSplit.map(function (x) { return 1 - x; });
    var aum = (I.aumBase === 'Project Cost' ? I.aumFeePct * totalCost : I.aumFeePct * E) / 12;
    var cu = (gpSplit[0] < gp) && I.catchUp;
    var gpC = [], lpC = [], gpD = [], lpD = [], acct = [0, 0, 0], gpAcct = 0, tierLP = [0, 0, 0, 0], tierGP = [0, 0, 0, 0];
    for (m = 0; m < L; m++) {
      var c = -Math.min(lev[m], 0); gpC.push(c * gp); lpC.push(c * lpS);
      var aumF = (m >= stab && m <= end) ? aum : 0;
      var cf = lev[m] - aumF, rem = Math.max(cf, 0);
      /* hurdle 1 */
      var a1 = acct[0], acc1 = a1 * (Math.pow(1 + hurdles[0], 1 / 12) - 1);
      var d1 = Math.min(a1 + acc1, Math.max(cf, 0) * lpSplit[0]);
      acct[0] = a1 + acc1 + lpC[m] - d1;
      var gAcc = gpAcct * (Math.pow(1 + hurdles[0], 1 / 12) - 1);
      var g1 = cu ? Math.max(Math.min(cf - d1, gpAcct + gAcc + gpC[m]), 0) : d1 / lpSplit[0] * gpSplit[0];
      gpAcct = gpAcct + gAcc + gpC[m] - g1;
      var rem1 = Math.max(cf - (d1 + g1), 0);
      /* hurdle 2 */
      var a2 = acct[1], acc2 = a2 * (Math.pow(1 + hurdles[1], 1 / 12) - 1);
      var d2 = Math.min(a2 + acc2 - d1, Math.max(rem1, 0) * lpSplit[1]);
      acct[1] = a2 + acc2 + lpC[m] - d1 - d2;
      var g2 = d2 / lpSplit[1] * gpSplit[1];
      var rem2 = Math.max(cf - (d1 + g1) - (d2 + g2), 0);
      /* hurdle 3 */
      var a3 = acct[2], acc3 = a3 * (Math.pow(1 + hurdles[2], 1 / 12) - 1);
      var d3 = Math.min(a3 + acc3 - (d1 + d2), Math.max(rem2, 0) * lpSplit[2]);
      acct[2] = a3 + acc3 + lpC[m] - (d1 + d2) - d3;
      var g3 = d3 / lpSplit[2] * gpSplit[2];
      var rem3 = Math.max(rem2 - (d3 + g3), 0);
      var d4 = rem3 * lpSplit[3], g4 = rem3 * gpSplit[3];
      var devF = I.devFeeToGP ? (lines.filter(function (L) { return L.key === 'devFee'; })[0].m[m] || 0) : 0;
      gpD.push(g1 + devF + aumF + g2 + g3 + g4); lpD.push(d1 + d2 + d3 + d4);
      tierLP[0] += d1; tierLP[1] += d2; tierLP[2] += d3; tierLP[3] += d4; tierGP[0] += g1; tierGP[1] += g2; tierGP[2] += g3; tierGP[3] += g4;
    }
    var gpNet = gpD.map(function (v, i) { return v - gpC[i]; }), lpNet = lpD.map(function (v, i) { return v - lpC[i]; });
    var W = {
      lp: { contrib: sum(lpC), dist: sum(lpD), profit: sum(lpNet), emx: sum(lpD) / sum(lpC), irr: irrFrom(lpNet) },
      gp: { contrib: sum(gpC), dist: sum(gpD), profit: sum(gpNet), emx: sum(gpD) / sum(gpC), irr: irrFrom(gpNet) },
      gpSplit: gpSplit, lpSplit: lpSplit, hurdles: hurdles, promotes: promotes, aumMonthly: aum, tierLP: tierLP, tierGP: tierGP,
      gpD: gpD, lpD: lpD, gpC: gpC, lpC: lpC
    };
    W.lp.roi = W.lp.profit / W.lp.contrib; W.gp.roi = W.gp.profit / W.gp.contrib;

    /* --- annual roll-up (Annual Cash Flow tab: year = ROUNDUP(month/12)) --- */
    var years = ceil12(end), annual = [];
    for (var y = 0; y <= years; y++) annual.push({ year: y, land: 0, hard: 0, soft: 0, carry: 0, totalCost: 0, rent: 0, other: 0, tpi: 0, vacCl: 0, egr: 0, opex: 0, noi: 0, capex: 0, cfo: 0, unlev: 0, lev: 0, interest: 0, equity: 0, debt: 0, sale: 0 });
    for (m = 0; m < L; m++) {
      var A = annual[ceil12(m)];
      A.land += landM[m]; A.hard += hardM[m]; A.soft += softM[m]; A.carry += F.reserve[m] + F.shortfall[m] + finFee[m];
      A.rent += rentInc[m]; A.other += other[m]; A.tpi += tpi[m]; A.vacCl += vac[m] + cl[m]; A.egr += egr[m]; A.opex += opexTot[m]; A.noi += noi[m]; A.capex += capex[m]; A.cfo += cfo[m];
      A.unlev += unlev[m]; A.lev += lev[m]; A.interest += (m <= constPayoff ? F.intGross[m] : 0); A.equity += F.eqDraw[m]; A.debt += constDraw[m]; A.sale += (m === sale ? saleNet : 0);
    }
    annual.forEach(function (A) { A.totalCost = A.land + A.hard + A.soft + A.carry; });

    M.inputs = I; M.units = units; M.nra = nra; M.dates = dates; M.N = N;
    M.timing = { constructionEnd: constructionEnd, opBegin: opBegin, stab: stab, stabOk: stabOk, sale: sale, end: end, permFund: permFund, constPayoff: constPayoff };
    M.budget = { lines: lines, land: land, hard: hard, sitework: { items: swItems, subtotal: swSub, contPct: +sw.contPct || 0, contingency: swCont, total: sitework }, soft: ae + cm + mktTot + devFee, marketing: mktTot, devFee: devFee, preFinancing: devCostTot, interestReserve: sum(F.reserve), shortfall: sum(F.shortfall), financingFees: finFeeTot, carry: sum(F.reserve) + sum(F.shortfall) + finFeeTot, total: totalCost };
    M.sources = { equity: E, loan: loan, ltcActual: loan / totalCost, iterations: it, grossInterest: sum(F.intGross.slice(0, constPayoff + 1)), interestFromOps: sum(F.intPaid.slice(0, constPayoff + 1)) };
    M.perm = { on: I.permOn, amount: permAmt, payment: permPay, payoff: permPayoff, ltv: permAmt / Tr.value, ltc: permAmt / totalCost };
    M.monthly = { leased: leased, gross: gross, conc: conc, ltl: ltl, nonrev: nonrev, rentInc: rentInc, other: other, tpi: tpi, vac: vac, cl: cl, egr: egr, opexTot: opexTot, mgmt: mgmt, tax: tax, noi: noi, capex: capex, cfo: cfo, devCost: devCost, landM: landM, hardM: hardM, softM: softM, eqDraw: F.eqDraw, debt: F.debt, intGross: F.intGross, intPaid: F.intPaid, reserve: F.reserve, shortfall: F.shortfall, constDraw: constDraw, loanBal: loanBal, unlev: unlev, lev: lev, opexItems: opexItems, otherItems: otherItems };
    M.valuation = { untrended: U, trended: Tr, sale: S, saleGross: saleGross, sellCost: sellCost, saleNet: saleNet, debtPayoff: debtPayoffAtSale, equityFromSale: saleNet + debtPayoffAtSale };
    M.returns = R; M.waterfall = W; M.annual = annual;
    M.kpis = { totalCost: totalCost, costPerUnit: totalCost / units, yocUntrended: U.yoc, spreadUntrended: U.spread, leveredIrr: R.levered.irr, leveredEmx: R.levered.emx, unleveredIrr: R.unlevered.irr, profit: R.levered.profit, lpIrr: W.lp.irr, lpEmx: W.lp.emx, loan: loan, equity: E, debtYield: U.noi / loan };
    return M;
  }

  /* sensitivity: like the workbook's data tables, equity stays at the base-case amount */
  function sensitivity(inp, base, key, values) {
    return values.map(function (v) {
      var x = JSON.parse(JSON.stringify(inp)); x[key] = v;
      var r = run(x, { equity: base.sources.equity });
      return { value: v, spread: r.valuation.sale.spread, emx: r.returns.levered.emx, irr: r.returns.levered.irr, lpIrr: r.waterfall.lp.irr };
    });
  }

  var API = { defaults: defaults, run: run, sensitivity: sensitivity, xirr: xirr, N: N };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.ACREModel = API;
})(this);
