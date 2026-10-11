# Acceptance Gates

## Gate A — Foundation
- owner auth works;
- TOTP enrollment works;
- AAL2 required;
- RLS security tests pass;
- 360px app shell passes.

## Gate B — Sandbox
- Pluggy Bank connects;
- BANK account imported;
- CREDIT account imported;
- transaction pagination works;
- investments fixture/import works;
- webhook create/update/delete works;
- duplicate event does not duplicate data.

## Gate C — Finance
- card payment test passes;
- transfer test passes;
- investment contribution test passes;
- free-money tests pass;
- net-worth tests pass.

## Gate D — Tax
- unknown incoming transaction => REVIEW;
- tax rules versioned;
- 2026 calculation fixtures pass;
- zero estimated tax does not show "no filing required";
- annual dossier aggregates correct categories.

## Gate E — Real Nubank
Only after A-D:
- connect Nubank;
- reconcile bank balance;
- reconcile card current balance;
- inspect 20+ transactions;
- inspect Pix;
- inspect credit purchase;
- inspect investments if present;
- verify freshness timestamp.

## Gate F — Personal daily use
- app installable on phone;
- opens to Hoje;
- month close understandable in under 5 minutes;
- unresolved classifications visibly surfaced.
