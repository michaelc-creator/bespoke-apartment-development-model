/* Worked-example check for js/miami_condo_rental_model.js. Run: node validation/miami_condo_rental_model.test.js
   Expected values are worked by hand from the default inputs (2BR Miami Beach condo):
     Price 400,000; 25% down = 100,000; loan 300,000 at 7.25% / 30 yr
     Payment = 300,000 x (0.0725/12) / (1 - (1 + 0.0725/12)^-360) = 2,046.5288 / mo; debt service 24,558.35 / yr
     Scheduled rent 2,750 x 12 = 33,000; vacancy 8% = 2,640; collected (EGI) 30,360
     Management 10% x 30,360 = 3,036; maintenance 5% x 33,000 = 1,650
     HOA 800 x 12 = 9,600; tax 1.9% x 400,000 = 7,600; HO-6 insurance 2,600
     Operating expenses = 3,036 + 1,650 + 9,600 + 7,600 + 2,600 = 24,486
     NOI = 30,360 - 24,486 = 5,874; cap rate = 5,874 / 400,000 = 1.4685%
     Annual cash flow = 5,874 - 24,558.35 = -18,684.35; monthly = -1,557.03
     Cash invested = 100,000 + 3% x 400,000 = 112,000; cash-on-cash = -16.68%
     Break-even rent = (9,600 + 7,600 + 2,600 + 24,558.35) / (12 x (0.92 x 0.90 - 0.05)) = 44,358.35 / 9.336 = 4,751.32
     DSCR = 5,874 / 24,558.35 = 0.2392
   All-cash variant: cash invested 412,000; cash-on-cash 5,874 / 412,000 = 1.4257%; break-even rent 19,800 / 9.336 = 2,120.82 */
'use strict';
var assert = require('assert');
var M = require('../js/miami_condo_rental_model.js');

var pass = 0;
function near(actual, expected, tol, name) {
  assert.ok(Math.abs(actual - expected) <= tol, name + ': expected ' + expected + ', got ' + actual);
  pass++; console.log('  ok  ' + name + ' = ' + (Math.round(actual * 10000) / 10000));
}

console.log('Financed (defaults)');
var r = M.compute();
near(r.monthlyPayment, 2046.5288401685705, 1e-6, 'monthly mortgage payment');
near(r.year1.egi, 30360, 1e-9, 'effective gross income');
near(r.year1.opex, 24486, 1e-9, 'operating expenses');
near(r.noi, 5874, 1e-9, 'NOI');
near(r.capRate, 0.014685, 1e-12, 'cap rate');
near(r.annualCashFlow, -18684.346082022847, 1e-6, 'annual cash flow');
near(r.monthlyCashFlow, -1557.0288401685705, 1e-6, 'monthly cash flow');
near(r.cashInvested, 112000, 1e-9, 'cash invested');
near(r.cashOnCash, -0.16682451858948968, 1e-9, 'cash-on-cash');
near(r.breakEvenRent, 4751.322416669114, 1e-6, 'break-even rent');
near(r.dscr, 0.2391854883216209, 1e-9, 'DSCR');

// break-even rent really zeroes year-1 cash flow
var be = M.compute({ rent: r.breakEvenRent });
near(be.annualCashFlow, 0, 1e-6, 'cash flow at break-even rent');

// pro forma: year 2 grows rent and fixed costs 3%; loan amortizes
var y2 = r.proForma[1];
near(y2.gpr, 33990, 1e-9, 'year 2 scheduled rent');
near(y2.hoa + y2.tax + y2.insurance, 19800 * 1.03, 1e-9, 'year 2 HOA + tax + insurance');
// month-by-month amortization worked separately: balance after 12 payments = 297,096.43
near(r.proForma[0].loanBalance, 297096.42978098954, 1e-6, 'year 1 ending loan balance');
near(r.proForma[0].principal, 2903.570219010464, 1e-6, 'year 1 principal paid');

console.log('All cash');
var c = M.compute({ allCash: true });
near(c.loan, 0, 0, 'loan');
near(c.annualCashFlow, 5874, 1e-9, 'annual cash flow = NOI');
near(c.cashInvested, 412000, 1e-9, 'cash invested');
near(c.cashOnCash, 0.014257281553398058, 1e-12, 'cash-on-cash');
near(c.breakEvenRent, 2120.822622107969, 1e-6, 'break-even rent');
assert.strictEqual(c.dscr, null); pass++; console.log('  ok  DSCR is n/a when all cash');

console.log('\n' + pass + ' checks passed');
