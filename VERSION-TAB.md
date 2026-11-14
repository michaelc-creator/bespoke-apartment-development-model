# A.CRE Apartment Development Model v3.0 — Version tab (verbatim copy)

Reproduced from the 'Version' tab of Apartment-Development-Model_v3.0.xlsm, as required by section 5 of the A.CRE license (see LICENSE.txt).

```
APARTMENT DEVELOPMENT MODEL - VERSION NOTES
Model Resources | v3.0
Author: Spencer Burton | Important Links:
https://www.adventuresincre.com/ | New to A.CRE Models? Read our Best Practices Guide Now
Compatibility
Excel 2013 | Visit this Model's Webpage
Excel 2016 | Guides and Tutorials for Using the Model
Excel 365 | Browse our entire Library of Real Estate Models
AdventuresinCRE.com and its affiliates do not provide tax, legal, investment, or accounting advice. This material has been prepared for informational purposes only, and is not intended to provide, and should not be relied on for, tax, legal or accounting advice. You should consult your own tax, legal and accounting advisors before engaging in any transaction. This model may contains errors. Verify all calculations being using this model to make investment decisions.
LEARN TO BUILD INSTITUTIONAL-QUALITY REAL ESTATE MODELS FROM SCRATCH - CLICK HERE TO LEARN MORE - 
Changelog | Disclaimer: This model may contain errors
v3.0
AI Skill (v3.0) created for this model
v2.99
Adjusted "Expense Growth" to function as a direct input and applied formatting updates for better readability within the Retail Expenses section
v2.98
Introduced an option to size permanent debt based on LTV (% of property value) in addition to the existing construction debt method
v2.97
Corrected cell references in Sensitivity #1 (Vacancy) and Sensitivity #4 (Rental Growth Begin) to ensure accurate results (Sensitivity Analysis - Underwriting tab) 
v2.96
New feature: Solve for Mill Rate
Added named range 'mill_rate' to stabilized mill rate cell E128 (stabilized property tax ÷ stabilized value)
Added named range 'mill_rate_sale' to sale mill rate cell F177 (sale property tax ÷ sale price)
Added named range 'opex_tax_sale' to sale property tax I177
Used Claude to write SetMillRate() subroutine that solves for a user-specified stabilized and sale mill rate
Added button in Operating Cash Flow 'Property Tax' line (row 128) to run feature
Turned off 'Stale Value' formatting
Updated placeholder values
v2.95
Ran Workbook optimization; 23,486 cells were optimized to improve workbook performance
Turned off 'Format Stale Values'; Calculation Method set to 'Partial'
Renamed Levered IRR and Levered EMx to G-Levered IRR and G-Levered EMx to reiterate that they are Gross returns (i.e. property-level returns)
Added GROSS and NET to IRR/EMx labels Property-Level returns and Partnership Level Returns respectively
Updated placeholder values
v2.941
Removed erroneous line in the PermDebt_Deactivate() macro added in v 2.94 that hid the wrong rows when turning off the PermDebt module 
Updated various placeholder values
v2.94
Updated Calc_Loan_AND_Dev_Fee () macro and Recalculate () macros to allow the user to change worksheet names without breaking the macro
Fixed Sgl. Promote button formatting when Dbl. Promote is activated
Used 'A.CRE Code Helper for Financial Models GPT' to add code comments in all subroutines in the following modules to help users understand the code:
Budget
General
Operating
PermDebt
Retail
Returns
Sensitivity
Used 'A.CRE Code Helper for Financial Models GPT' to improve efficiency of code
As hundreds of code changes were made, tested each macro individually
Misc updates to the 'Version' tab
v2.933
Updated Calc_Loan_AND_Dev_Fee () macro to avoid situations where an erroneous formula in 'Equity Total' errors the macro
Updated various placeholder values
v2.932
Fixed a VBA compile error in the 'Recalculate' subroutine
v2.931
Fixed issue where Income and Expense growth were not calculating correctly in cases where growth begin month was later than Operation Begin month
Updated various placeholder values
v2.93
Fixed issue where Retail Income was double-counted in DCF cash flows (only applicable when Retail Income module turned on)
Added Headings to Retail Income worksheet
v2.921
Added 'Assumption Notes' section to Underwriting tab; open/close using the [+] / [-] button at the top of column O; use notes to support inputs on each row
v2.92
Added logic to allow GP to contribute 100% of equity capital
Added IFERROR() statements to LP cash flow 
Added IFERROR() statements to LP return metrics
Fixed Vacancy link in Sensitivity Analysis #1
Updated various placeholder values
v2.913
Fixed issue where Vacancy and Credit Loss line on the Annual Cash Flow tab was only pulling in Credit loss assumption
Modified Gross Potential Income and Effective Gross Income formulas on Annual Cash Flow tab to be dynamic to Analysis Period
v2.912
Fixed issue where Vacancy and Credit Loss line on Summary tab was only pulling in Credit loss assumption
v2.911
Fixed issue where the DCF component of EGR wasn't including General Vacancy
v2.91
Created a Residual Land Value tool
Used OpenAI's GPT-3 to write the macro
Created named cells for Development Spread and Land Cost
Added button to the Summary tab to run the tool
Updated various placeholder values
v2.90
Added AUM Fee module added to 'Partnership Cash Flow' module
New inputs added to row 290 of the Underwriting tab: AUM Fee type, AUM Fee %, and AUM Fee start month
Updated Levered Cash Flow line available to distribute to partners to reduce by the amount of AUM fee (starting at ET198 on the Underwriting tab)
Renamed the 'Developer Fee to GP' label to 'Developer Fee to GP + AUM Fee' (ET213)
Updated the formula logic in row 213 (starting at ET213) to include the AUM fee to GP
v2.89
Fixed issue where growth rate for 'Expenses' wasn't appearing on the Summary tab
Renamed the label 'Annual Expense Growth' to  'Annual Expense Growth Begin Month'; row 115 on the Underwriting tab
Changed Sensitivity table #4 to sensitize various Rental Growth begin months
v2.881
Separated General Vacancy and Credit Loss into separate lines in Reversion Cash Flow section
v2.88
Fixed issue where Other Income items count, required for Delete Other Income macro, had been unintentionally deleted.
Added detailed Income and Expense growth assumptions
Updated General Vacancy and Credit Loss module
Added input to calculate General Vacancy and Credit Loss either based on Total Potential Income, Total Rental Income, or Gross Rent
Separated General Vacancy and Credit Loss into separate lines
Misc. updates to placeholder values
v2.873
Fixed issue where Operating Expense line items on Annual Cash Flow tab wasn't synced to Underwriting tab
v2.872
Reverted Development Fee logic back to an 'Input' amount rather than an 'Input' percentage; this was a trade-off decision based on challenges with the macro
Added functionality to allow for 0% LTC during Construction
Re-wrote macros to update new Development Fee and 0% LTC during construction logic
v2.871
Fixed issue where using a Development Fee input with too many decimal places caused the Recalculate Macro to hang
v2.87
Fixed issue where, for purposings of calculating Blended Interest Rate, the rate was not blended pari passu in pari passu situations
Added 'Total Construction Debt Balance' line to calculation module (EP78:JX78)
Added a SUMPRODUCT calculation to the Construction Debt Annual Rate (cell E58) to represent the blended annual rate over the hold period
Changed Pro Forma 'Loss-to-Lease' cell (I98) to blue, to allow user to add a Loss-to-Lease to Pro Forma NOI
v2.86
Improved Project Cost graph on Summary tab
Created new ranges for each of Land Costs, Hard Costs, Soft Costs, and Carry Costs,
Changed chart to 'Stacked Column' chart type
Added newly created ranges to the Project Cost graph
Updated heading for Project Cost graph
v2.85
Added functionality to model Capital Reserves either below NOI or above NOI
Created 'Capital Reserves Placement' input in cell E115
Added logic to Make Ready Cost label in OpEx to rename Capital Reserve when Capital Reserve placement is above NOI
Updated logic in Detailed Operating Expense logic to account for new Capital Reserve Placement input
Misc. updates to placeholder inputs
Misc. formatting fixes and changes
v2.84
Removed unnecessary rows from Annual Cash Flow tab
Fixed issue where stabilized Cash-on-Cash return was appearing on the Summary tab (cell F28) when no permanent debt was used
Misc. updates to placeholder inputs
v2.833
Modification to new loss-to-lease methodology to account for situations where 0% pre-leasing is assumed
v2.832
Fixed issue where setting the Operation Begin date to before the construction end date broke the model
Optimized Recalculate macro for speed
Added decimal place to Development Fee /Rentable SF(M2)
Added 'Franchise Tax' as default line item under Property Tax on Detail Expenses
v2.831
Moved Loss-to-Lease module to cell EP143 to fix issue where new loss-to-lease module breaks model when Other Income items are added or deleted
v2.83
Revamped Loss-to-Lease module to solve issue where rent gapped upon new market rent increase
Added Initial Lease and 2nd Generation Lease tracking (EW103:EW107)
Calculating in-place rent at aggregate (EW108)
Loss-to-lease based on lease length, in-place vs. market rent (EW109)
Linked actual loss-to-lease line (row 98) to module EW109
v2.821
Fixed error in 'Equity Proceeds from Capital Event' line (Underwriting row 209), where Permanent Debt cash flows were not included in the calculation
v2.82
Added logic to Recalculate VBA macro to solve for issue where user adds a formula to the Total Equity or Total Development Fee cells
v2.81
Fixed issue where 'Development Fee' label was changed when deleting Soft Cost line items
v2.8
Added functionality to fund Construction + Mezzanine Debt pari passu (at the same time)
Updated label for 'Funding Order' to make identifying the input value (D62) easier
Added drop-down menu to cell D62, whereby user can change order for second tranche of debt to 'One' - this results in secondary debt funding pari passu
Updated formulas in rows 57 and 58 to fund debt pari passu when both debt tranches 'Funding Order' are set to 'One'
Added Error Check to cell K71
Misc. formatting updates
v2.72
Added link to 'Best Practices in Real Estate Financial Modeling' guide for newer users of A.CRE models
Fixed issue where Equity Sources on the Summary report were not calculating correctly when there was operating shortfall post-stabilization
v2.71
Fixed issue where 'Recalculate' feature wasn't working when Mezz Debt was used
v2.7
Fixed issue where Sources on summary tab was not correct in case of Double Promote
Added IFERROR logic to General Partner return metrics to accommodate 0% contribution by GP
Development Fee now driven by percentage of Total Project Costs
Rebuilt recalculate macro to account for circular nature of new Development Fee module
Added 'Recalculate Logic' section starting in row 289
Created a 'Calc_Loan_AND_Dev_Fee ()' macro to run a goal seek until LTC and Dev Fee match their actual user inputs
Rebuilt 'Recalculate ()' macro to loop 'Calc_Loan_AND_Dev_Fee ()' macro until LTC and Dev Fee match their actual user inputs
Added new feature to check for Circular References before running Recalculate
Added logic to 'Recalculate ()' macro that turns off 'Iterative Calc' when run; this is necessary for the model to run correctly
Misc. formatting enhancements and updates
v2.61
Revised Sources and Uses table on Summary tab to only pull initial Sources (not additional equity required during hold)
Updated placeholder value for Permanent Debt (Underwriting I17) to also include loan fees in total loan amount
v2.6
Now includes ability to add loan and closing fees to permanent debt
Added 'Loan Funding Fee + Closing Cost' assumption to cell H78
Added 'Loan Funding Fee + Closing Cost' amount to cell I78
Updated formula in row 78 to deduce loan fees and closing costs
Revised default 'Sale Month'  input formula to use 120 when 'Perm. Debt' module is turned on, otherwise 12 months following stabilization
Fixed header on Annual Cash Flow tab - "ANALYSIS START" (cell R4) output was not dynamic
Minor update to dummy input values
Misc. formatting enhancements
v2.5
Changed the 'Construction Loan' and 'Mezzanine Loan' labels to blue font to denote an input; change order of funding by changing label
Updated Construction Loan and Mezzanine Loan funding labels to link to the new label inputs for each field
Misc. formatting updates
v2.4
Fixed 'Analysis Month' label on 'Annual Cash Flow' tab
Replaced 'Analysis Date' with 'Period Ending' label on 'Annual Cash Flow' tab
Added 'Mezzanine Loan' tranche to Construction Debt (Underwriting tab)
Construction debt consists of 1. Construction Loan and 2. Mezzanine Loan
Added 'Construction Loan' and 'Mezzanine Loan' assumptions (rows 60-63)
Added variable interest rate line for Mezzanine Debt
Updated Variable Rate logic to include Mezzanine Loan
Added Mezzanine Loan and Construction Loan calculation module (ET62:JX62 and EP75:JX76)
Replaced 'Annual Rate' calculation in cell E57 with a Blended Rate calculation between the two forms of construction debt
Added 'Funding by Construction Debt Type' cash flows to rows 56:58
Updated 'SOURCES' section of Summary tab to include Mezzanine Loan
Misc. formatting enhancements and fixes
v2.3
Added Perm. Debt DSCR metric; see Summary tab (Key Assumptions and Return Metrics) and Underwriting tab (cell G74)
Added Stabilized Yr. 1 Cash-on-Cash Return metric; see Summary tab (Key Assumptions and Return Metrics) and Underwriting tab (cell F136)
Built a 'GP Catch Up' module into 'Waterfall (GP/LP)' section
Drop-down menu appears in cells C229:D229 when 'GP Distribution %' in Pref. Return tier is less than 'GP Contribution Share %'
When 'GP Catch Up?' drop-down is set to 'Yes' and once LP hits 1st tier IRR, 100% of cash flow is distributed to GP until it "catches up" with LP IRR
Misc formatting enhancements
v2.2
Added input (F48) to choose percentage of lease-up income to use for interest; unpaid construction interest accrues to interest reserve
Updated Construction Interest Calculation logic to allow for Construction Loan Takeout prior to stabilization
Updated Operating Shortfall to allow for Construction Loan Takeout prior to stabilization
Added data validation to 'Perm. Debt Funding Month' input to ensure Perm. Debt funds after construction end
v2.1
Fixed error in SUM() for /SF and /Unit totals for first three items on Detail Expenses module
Fixed error where 'Insurance' was growing by up to 2x the growth assumption when 'Fixed' was set to some value >0%
v2.0
Fixed minor error in Annual Cash Flow date header formula
Changed default financing cost period to 0; default Waterfall type to 'Single Promote'
Renamed 'Development Period Cash Flows' section to 'Investment Period Cash Flows'
Nominally improved accuracy of construction interest calculation
Renamed 'Debt' to 'Construction Debt'
Add Permanent Debt Module
New section within Investment Cash Flow section entitled 'Permanent Debt'
Assumptions include: Funding Month, Fixed Interest Rate, Interest-Only or Amortizing
Added toggle (row 71 of Underwriting tab) to activate and deactivate the new Permanent Debt Module
Created 'PermDebt_Activate' and 'PermDebt_Deactivate' macros to turn module on and off
Revised 'Returns - Property-Level Cash Flows' section to include Permanent Debt Funding, Payoff, and Debt Service
Removed portions of property-level cash flow on 'Annual Cash Flow' tab; will expand in next version of the model
Misc. formatting
v1.0
Now includes option to use square meters or square feet
Added SF and M2 toggle in cell I8 of Underwriting tab
Various label and logic updates to accommodate option to use square meters
Updated header logic to be dynamic to SF vs. M2 toggle
Added Stabilized Value /Unit and /SF (or /M2) metrics to rows 179 and 180 of the Underwriting tab
Fixed mislabeled header (/Rentable SF instead of /Unit) in rows 55 and 60 of Underwriting tab
Added conditional formatting in cell E57 of Underwriting tab; now reads 'Detail --->' when 'Variable Rate' is used
Added '/Unit' metric to sale proforma (D175:D179 of Underwriting tab)
Added '/SF/YR/' (or '/M2/YR') metric to retail income and retail leasing costs lines
Mill rate metric now included on row 162 of Underwriting tab for Untrended, Trended, and Sale pro formas
Changed JV waterfall to use Promote assumption rather than 'Distribution %" assumption (G215:G219, G236:G240 on Underwriting tab)
Misc. formatting fixes and enhancements
beta v0.8
Fixed issue where Show_Calc macro wasn't working
Fixed issue where 'Analysis Start' date in header on the Summary tab wasn't linked to input on Underwriting tab
Fixed Unlevered ROI formula on summary tab; had been dividing by Total Project Cost including financing costs
beta v0.7
Updated IRR formulas to allow for scenarios where there is no cash flow in time 0
Misc. formatting fixes/improvements
Added printable 'Annual Cash Flow' report tab (hidden by default); monthly cash flows from Underwriting tab rolled up for reporting purposes
Created toggle to hide/show Annual Cash Flow report (see right side of Summary tab - Property Level Cash Flow section)
Cleaned up Misc. VBA code
beta v0.6
Fixed issue on Detail Expenses tab where font for 'Turnover Assumption' input was black, rather than blue
Added option to use Variable, rather than Fixed, construction loan interest rate (see 'Fixed/Variable toggle under 'Sources' - Underwriting tab)
Includes new required input - variable interest rate by month - when Variable is toggled on
Includes two new macros: Fixed_Rate and Variable_Rate
Includes Fixed and Variable buttons under 'Sources' section of Underwriting tab
beta v0.5
Misc. formatting fixes
Built new Detailed Lease Up Module (see Row 73)
Added Basic vs Detailed Lease Up Toggle in the 'Income' subsection of the 'Operating Period Cash Flows' section
Coded two new macros - one to activate basic lease up underwriting, the other to activate detailed lease up underwriting
Added logic such that the 'Leased %' row becomes an input (blue font cell) when detailed lease up activated
Added logic such that when reverting from Detailed to Basic underwriting, Leased % formulas revert to default
beta v0.42
Renamed Total Construction Cost to Total Project Cost on Underwriting tab
Added Expense Growth Month and Expense Growth Year line item
Corrected issue where Income/Expense Growth Year was mislabeled month, not year
Added option to differentiate between Income growth begin and Expense growth begin month
Locked line for Development Fee under Soft Costs so that it flows to GP cash flows/returns (if applicable)
beta v0.41
Added "Detail" option to development cash flow modeling
Added Growth Begin assumption for operating income and expenses
Added Valuation/Unit metric to Summary tab
```
