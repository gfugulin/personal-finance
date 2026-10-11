# SPEC 003 — Finance Engine

## FIN-001 Card expense
A credit-card purchase is an EXPENSE on purchase date.

Invoice payment is CARD_PAYMENT and must not increase spending.

## FIN-002 Transfer
Own-account transfer is TRANSFER and must not affect income or spending.

## FIN-003 Investment
Capital contribution to investment is INVESTMENT, not lifestyle EXPENSE.

## FIN-004 Income
Only INCOME transactions contribute to monthly income.

## FIN-005 Spending
Only EXPENSE transactions, adjusted for refund policy, contribute to monthly spending.

## FIN-006 Free money

```text
free_money =
cash
- current_card_liability
- remaining_expected_expenses_this_month
- remaining_expected_investments_this_month
- reserve_floor
```

No duplicated card-invoice planned flow may be subtracted.

## FIN-007 Net worth

```text
net_worth =
cash
+ current_investments
- current_card_liability
```

## FIN-008 Savings rate

If income <= 0 => null.

Otherwise:
`(income - spending) / income`

## FIN-009 Investment rate

If income <= 0 => null.

Otherwise:
`new_capital_invested / income`

## FIN-010 Review
Uncertain financial classification remains UNKNOWN and enters review queue.
