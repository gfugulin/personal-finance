# Personal Tax Organization Domain — Brazil

## Purpose

The tax module organizes information and estimates planning exposure.

It is **not** a tax return filing engine and does not replace official Receita Federal rules, accountant review or taxpayer responsibility.

## Core objective

At annual tax-return time, the owner should already have:

- categorized income;
- taxable vs exempt/non-taxable distinctions;
- exclusive/definitive taxation items;
- tax withheld/paid records;
- deductible expenses tracked;
- investment positions;
- year-end bank balances;
- unresolved tax items list;
- supporting-document checklist.

## Fiscal classification

`tax_treatment` values:

- `TAXABLE_INCOME`
- `EXEMPT_NON_TAXABLE`
- `EXCLUSIVE_DEFINITIVE`
- `DEDUCTIBLE_EXPENSE`
- `TAX_WITHHELD`
- `ASSET_MOVEMENT`
- `NO_TAX_EFFECT`
- `REVIEW`

## Critical rule

An incoming bank transaction is **never automatically taxable solely because it is incoming**.

Examples requiring distinction:
- salary;
- pró-labore;
- service income;
- reimbursement;
- loan;
- own transfer;
- gift/donation;
- asset sale;
- investment redemption.

Unknown cases go to REVIEW.

## Tax year

Each calendar year has a versioned configuration:
- source;
- source publication/update date;
- effective period;
- progressive brackets;
- deductions/limits;
- reduction rules.

Do not embed legal values in React components.

## 2026 planning configuration

The official Receita Federal 2026 table states:

Monthly:
- regular progressive table;
- monthly reduction can make tax due zero up to R$ 5,000 of qualifying taxable income;
- reduction declines between R$ 5,000.01 and R$ 7,350.

Annual adjustment for calendar year 2026 / exercise 2027:
- annual progressive table;
- annual reduction can make tax due zero up to R$ 60,000 of qualifying annual taxable income;
- reduction declines from R$ 60,000.01 to R$ 88,200.

Implementation must use the official configuration file and tests, not prose copied into UI logic.

## Important distinction

`estimated tax due = 0` does NOT imply:
`not required to file a return`.

Filing obligation is a separate ruleset and must not be inferred from the tax calculation alone.

Until official filing-obligation rules for a specific exercise are encoded and tested, the UI should say:

"Obrigatoriedade de entrega: verificar regras oficiais do exercício."

## Annual dossier

IR tab should offer an annual summary:

### Income
- taxable;
- exempt/non-taxable;
- exclusive/definitive;
- unreviewed.

### Tax
- withheld;
- paid manually;
- estimated annual adjustment.

### Deductions
Manually registered/linked deductible expenses.

### Assets / positions
- 31/12 bank balances when history allows;
- investment positions;
- manual asset registry is P1, not v0.1.

### Checklist
- informe de rendimentos;
- bank/investment statements;
- deductible receipts;
- unresolved transactions;
- other relevant documents manually marked complete.

## Tax reserve

Optional planning metric:

```text
tax_reserve_target =
max(estimated_tax_due - tax_already_withheld_or_paid, 0)
```

Monthly suggested reserve can divide remaining target by remaining months, but must be labeled an estimate.

## Compliance posture

Every computed screen displays:
- tax year;
- rules version/source;
- "estimativa para organização pessoal";
- last rules update date.
