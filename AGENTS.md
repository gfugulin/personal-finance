# Workspace Instructions — Personal Finance Mobile

This file is automatically discoverable by Antigravity as a workspace rule.

## Product

Build a private, one-user, mobile-first PWA for personal financial and tax organization.

Primary outcome:
**the owner opens the phone and understands financial position, net-worth evolution and tax organization with almost no manual transaction entry.**

## Priority order

When instructions conflict:

1. security
2. financial/tax domain correctness
3. tests and acceptance criteria
4. simplicity
5. UX polish

## Required reading before implementation

- `docs/00-product-charter.md`
- `docs/01-engineering-method.md`
- `docs/03-domain-model.md`
- `docs/04-tax-domain.md`
- `docs/05-security.md`
- `specs/*.spec.md`
- `test-specs/*.feature`

## Engineering constraints

- modular monolith;
- one Next.js app;
- one Supabase Postgres;
- Pluggy integration server-side;
- mobile-first PWA;
- no microservices;
- no payment initiation;
- no raw bank credentials;
- no unneeded sensitive data persistence.

## TDD rule

For domain logic and synchronization:
1. write or update the failing test;
2. confirm failure for the intended reason;
3. implement minimum code;
4. pass test;
5. refactor;
6. run relevant suite.

Never add financial/tax formula logic without tests.

## Spec-driven rule

Every feature must map to:
- spec requirement ID;
- acceptance scenario;
- implementation;
- automated test where practical.

If code behavior and spec disagree, do not silently choose. Update the spec only when the product decision is explicit.

## Domain invariants

- credit-card purchase = expense at purchase time;
- card invoice payment ≠ second expense;
- own-account transfer ≠ income/expense;
- investment contribution ≠ consumption expense;
- incoming Pix ≠ automatically taxable income;
- financial classification and fiscal classification are separate;
- tax estimate is planning support, never a filed tax return;
- tax rules are versioned by calendar year.

## Security invariants

- MFA/AAL2 required for financial data;
- RLS required;
- server secrets never in browser;
- no public signup in production;
- webhook authenticated and idempotent;
- dashboard reads local persisted data, not live bank data;
- real Nubank connection only after sandbox + security acceptance.

## UI invariant

The app is phone-first and intentionally sparse.

Primary nav:
- Hoje
- Movimentações
- Patrimônio
- IR

Do not add primary navigation unless a real requirement cannot fit cleanly.
