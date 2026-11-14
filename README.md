# Bespoke Underwriting Apartment Development Model

A browser version of a ground-up apartment development underwriting model, styled to match Bespoke Underwriting. Live page: https://michaelc-creator.github.io/bespoke-apartment-development-model/

**Based on the [A.CRE Apartment Development Model](https://www.adventuresincre.com/apartment-development-model/) by Adventures in CRE** (v3.0, author Spencer Burton). The calculations in `js/acre-model.js` are a JavaScript port of that workbook, and the default inputs are its sample inputs. Use is subject to the A.CRE license in [LICENSE.txt](LICENSE.txt). A copy of the workbook's Version tab is in [VERSION-TAB.md](VERSION-TAB.md) and [version.html](version.html), as clause 5 of that license requires.

## What's in it
- Development budget (straight-line and S-curve timing), construction loan sized at loan-to-cost, with equity first, then debt, capitalized interest and the lease-up operating shortfall
- Unit mix, lease-up pace, loss-to-lease, concessions, other income, vacancy and credit loss
- Operating expenses with fixed/variable split during lease-up, and the property-tax ramp
- Untrended, trended and sale valuation; yield on cost and development spread
- Unlevered and levered IRR / equity multiple; IRR-hurdle LP/GP waterfall with an asset management fee
- Exit cap and vacancy sensitivity tables (equity held at the base case, like the workbook's data tables)
- **Bespoke add-on:** a Sitework and Drainage cost group (fill and grading, detention/retention ponds, stormwater conveyance, water quality treatment, off-site drainage upgrades, plus a contingency). It is not part of the A.CRE model. It defaults to zero, so the A.CRE sample results are unchanged. When it is filled in, it is added to hard costs, which flows into A&E, construction management, the development fee, loan sizing, interest and returns.

## Validation
With the A.CRE sample inputs, the engine matches the workbook's cached values. See `validation/`. With the workbook's macro-solved equity, every monthly row matches within about $0.00000002, and scalars match to about 1e-15 relative (IRRs within 5e-8, Excel's XIRR tolerance). When the page solves equity itself, results differ from the workbook macro by at most 2.3e-7 relative (a few dollars).

## Not included
Mezzanine debt, floating-rate construction debt, the retail module, the detailed operating-expense and detailed lease-up tabs, detail-method budget lines, the double (co-GP) promote, the residual land value tool, the solve-for-mill-rate helper, and the add/delete-item macros. Permanent-loan mode is implemented, but the template ships with it off, so it was not checked against the workbook.

For illustration and education only. Not investment, tax, legal or lending advice.
