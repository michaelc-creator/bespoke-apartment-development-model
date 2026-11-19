/* Bespoke Underwriting — Miami Beach condo rental model (calculation engine).
   Standalone: no dependency on the apartment development model (js/acre-model.js / js/app.js).
   Works in the browser (window.MiamiCondoRentalModel) and in Node (module.exports). */
(function (root) {
  'use strict';

  /* Default inputs: a single two-bedroom Miami Beach condo held as a long-term rental.
     These are editable starting assumptions, not sourced facts. */
  function defaults() {
    return {
      price: 400000,          // purchase price
      allCash: false,         // false = financed
      downPct: 0.25,          // down payment, % of price (financed only)
      rate: 0.0725,           // mortgage rate, 30-year fixed (assumption)
      termYears: 30,
      rent: 2750,             // monthly market rent, 2BR (assumption)
      hoaMonthly: 800,        // monthly HOA / condo association dues, 2BR (assumption)
      taxPct: 0.019,          // annual property tax, % of price (Miami-Dade non-homestead, estimate)
      insuranceAnnual: 2600,  // annual HO-6 policy, 2BR (assumption)
      maintPct: 0.05,         // maintenance reserve, % of scheduled rent
      vacancyPct: 0.08,       // vacancy and credit loss, % of scheduled rent
      mgmtPct: 0.10,          // property management, % of collected rent
      closingPct: 0.03,       // buyer closing costs, % of price (FL; incl. mortgage doc stamps / intangible tax when financed, estimate)
      rentGrowth: 0.03,       // annual rent growth for the pro forma (assumption)
      expenseGrowth: 0.03,    // annual growth in HOA, tax and insurance for the pro forma (assumption)
      years: 5
    };
  }

  function payment(loan, annualRate, years) {
    if (loan <= 0) return 0;
    var r = annualRate / 12, n = years * 12;
    if (r === 0) return loan / n;
    return loan * r / (1 - Math.pow(1 + r, -n));
  }
  function balanceAfter(loan, annualRate, years, months) {
    if (loan <= 0) return 0;
    var r = annualRate / 12, pmt = payment(loan, annualRate, years);
    if (r === 0) return Math.max(0, loan - pmt * months);
    return loan * Math.pow(1 + r, months) - pmt * (Math.pow(1 + r, months) - 1) / r;
  }

  function compute(input) {
    var I = Object.assign(defaults(), input || {});
    var price = +I.price || 0;
    var down = I.allCash ? price : price * I.downPct;
    var loan = Math.max(0, price - down);
    var closing = price * I.closingPct;
    var cashInvested = down + closing;
    var pmt = payment(loan, I.rate, I.termYears);
    var debtService = pmt * 12;

    var rows = [];
    for (var y = 1; y <= I.years; y++) {
      var gR = Math.pow(1 + I.rentGrowth, y - 1), gE = Math.pow(1 + I.expenseGrowth, y - 1);
      var gpr = I.rent * 12 * gR;
      var vacancy = gpr * I.vacancyPct;
      var egi = gpr - vacancy;
      var mgmt = egi * I.mgmtPct;
      var maint = gpr * I.maintPct;
      var hoa = I.hoaMonthly * 12 * gE;
      var tax = price * I.taxPct * gE;
      var ins = I.insuranceAnnual * gE;
      var opex = mgmt + maint + hoa + tax + ins;
      var noi = egi - opex;
      var ds = y <= I.termYears ? debtService : 0;
      var cf = noi - ds;
      var balStart = balanceAfter(loan, I.rate, I.termYears, (y - 1) * 12);
      var balEnd = balanceAfter(loan, I.rate, I.termYears, Math.min(y * 12, I.termYears * 12));
      rows.push({ year: y, gpr: gpr, vacancy: vacancy, egi: egi, mgmt: mgmt, maint: maint, hoa: hoa, tax: tax, insurance: ins,
        opex: opex, noi: noi, debtService: ds, cashFlow: cf, principal: balStart - balEnd, loanBalance: balEnd,
        coc: cashInvested > 0 ? cf / cashInvested : NaN });
    }
    var y1 = rows[0];
    var fixedAnnual = I.hoaMonthly * 12 + price * I.taxPct + I.insuranceAnnual;
    /* Break-even rent R (monthly), year 1: 12R(1-v)(1-m) - 12R*maint - fixed - debtService = 0 */
    var margin = (1 - I.vacancyPct) * (1 - I.mgmtPct) - I.maintPct;
    var breakEvenRent = margin > 0 ? (fixedAnnual + debtService) / (12 * margin) : NaN;

    return {
      inputs: I,
      down: down, loan: loan, closing: closing, cashInvested: cashInvested,
      monthlyPayment: pmt, debtService: debtService,
      noi: y1.noi, annualCashFlow: y1.cashFlow, monthlyCashFlow: y1.cashFlow / 12,
      capRate: price > 0 ? y1.noi / price : NaN,
      cashOnCash: cashInvested > 0 ? y1.cashFlow / cashInvested : NaN,
      breakEvenRent: breakEvenRent,
      dscr: debtService > 0 ? y1.noi / debtService : null,
      expenseRatio: y1.egi > 0 ? y1.opex / y1.egi : NaN,
      year1: y1, proForma: rows
    };
  }

  var API = { defaults: defaults, compute: compute, payment: payment, balanceAfter: balanceAfter };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.MiamiCondoRentalModel = API;
})(this);
