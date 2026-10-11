# Financial Domain Model

## Transaction is the central entity

Each transaction has two independent meanings:

### Financial classification
Examples:
- INCOME
- EXPENSE
- TRANSFER
- CARD_PAYMENT
- INVESTMENT
- REFUND
- IGNORE
- UNKNOWN

### Fiscal classification
Examples:
- TAXABLE_INCOME
- EXEMPT_NON_TAXABLE
- EXCLUSIVE_DEFINITIVE
- DEDUCTIBLE_EXPENSE
- TAX_WITHHELD
- ASSET_MOVEMENT
- NO_TAX_EFFECT
- REVIEW

One does not imply the other automatically.

Example:

```text
Pró-labore recebido
financial = INCOME
fiscal = TAXABLE_INCOME
```

```text
Pix between owned accounts
financial = TRANSFER
fiscal = NO_TAX_EFFECT
```

## Core entities

- Profile
- FinancialConnection
- Account
- Transaction
- Category
- ClassificationRule
- Investment
- InvestmentTransaction
- MonthlyPlan
- Goal
- NetWorthSnapshot
- TaxYear
- TaxClassificationRule
- TaxAdjustment
- TaxDocumentChecklist

## Money

Persist `numeric`, not floating point.

## Time

Persist timestamps in UTC.
Report periods in `America/Sao_Paulo`.

## Financial invariants

1. credit purchase is spending at purchase time;
2. paying the invoice is a cash settlement, not new spending;
3. own transfer is not income or spending;
4. investment contribution is not lifestyle spending;
5. net worth subtracts current card liability;
6. free money can be negative;
7. unknown classification remains explicit instead of being guessed.
