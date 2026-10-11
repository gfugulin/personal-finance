# Execution Prompt for Google Antigravity

Implement this repository using spec-driven and test-driven development.

## First action

Before editing source code:

1. read root `AGENTS.md`;
2. read every file in `.agents/rules/`;
3. read `docs/00-product-charter.md`;
4. read `docs/01-engineering-method.md`;
5. read all files under `specs/`;
6. read all files under `test-specs/`;
7. inspect SQL migrations.

Then produce a short implementation plan mapped to milestone IDs.

## Delivery order

### M0 Foundation
- Next.js mobile-first shell
- Supabase SSR auth
- owner login
- TOTP MFA
- database migrations
- RLS tests

### M1 Pluggy Sandbox
- server Pluggy auth
- Connect Token API
- Connect widget
- Pluggy Bank sandbox
- Item persistence

### M2 Sync
- accounts
- transactions
- investments
- webhook
- idempotency
- sync health

### M3 Finance domain
- classification
- review queue
- card payment protection
- transfer protection
- dashboard calculations
- tests

### M4 Mobile screens
- Hoje
- Movimentações
- Patrimônio

### M5 Tax organizer
- fiscal classifications
- tax review queue
- tax year
- tax rule versioning
- 2026 estimator
- annual dossier
- IR screen
- tests

### M6 PWA + hardening
- installable PWA
- mobile responsive checks
- CSP/security headers
- rate limits
- export
- security test suite

### M7 Nubank acceptance
Do not execute with real credentials unless owner has configured them and previous gates pass.

## Working discipline

For each milestone:

1. cite requirement/spec IDs being implemented in task notes;
2. add/update tests first;
3. implement;
4. run tests;
5. verify acceptance scenarios;
6. report:
   - changed files
   - passing tests
   - unresolved assumptions
   - next milestone

## Never do

- never add payment APIs;
- never expose provider credentials client-side;
- never invent tax rules;
- never classify all incoming money as taxable;
- never count invoice payment as expense;
- never hardcode one year's tax legislation into UI components;
- never connect real Nubank before security gate.

## End-of-project report

Return:
- implemented requirement IDs;
- test results;
- Pluggy sandbox result;
- security gate status;
- environment variables still needed;
- exact steps owner must perform in Pluggy/Supabase/Vercel;
- blockers before real Nubank connection.
