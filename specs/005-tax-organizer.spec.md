# SPEC 005 — Personal Tax Organizer

## TAX-001 Separate fiscal classification
Every transaction can have independent financial and fiscal classifications.

## TAX-002 Incoming money is not automatically taxable
An incoming transaction with unknown fiscal meaning must be REVIEW, not TAXABLE_INCOME.

## TAX-003 Tax year
Each tax-relevant transaction is associated with a calendar tax year based on configured reporting timezone/date semantics.

## TAX-004 Tax rules are versioned
Tax calculation values are loaded from year-specific configuration with source metadata.

## TAX-005 2026 estimator
For calendar year 2026, estimator must implement tested official annual progressive and reduction rules used by the MVP estimator.

## TAX-006 Filing obligation is separate
The app must not infer "no need to file" merely from zero estimated tax.

## TAX-007 Tax review queue
IR screen exposes transactions that require fiscal review.

## TAX-008 Annual dossier
For a selected tax year, app summarizes:
- taxable income;
- exempt/non-taxable;
- exclusive/definitive;
- tax withheld/paid;
- deductions recorded;
- year-end account/investment position where data exists;
- pending items;
- checklist.

## TAX-009 Tax reserve
App may show estimated tax reserve:
`max(estimated_due - withheld_or_paid, 0)`.

## TAX-010 Disclaimer
IR screen clearly states estimates are for personal organization and should be checked against official rules.

## TAX-011 Manual adjustments
Owner can add manual tax adjustment records when bank transactions do not contain enough information.

Examples:
- tax withheld;
- deductible receipt;
- manual taxable income correction.

## TAX-012 Rule learning
Owner can create deterministic fiscal rules for recurring counterparties/descriptions, but system-level safety constraints take precedence.
