# Operations

## Connection health

Show:
- connected / attention / disconnected;
- last successful sync;
- last attempt;
- accounts found;
- transaction count;
- last provider error code safely mapped.

## Error philosophy

If Nubank/Pluggy is temporarily unavailable:
- keep last valid data;
- show staleness;
- do not zero balances;
- do not delete accounts.

## Exports

IR annual dossier export is P0.5/P1 depending implementation time.

Preferred first export:
- JSON + CSV package by tax year.

PDF is optional later.

## Backups

- use Supabase backup capabilities according to plan;
- source-controlled migrations;
- on-demand local export;
- never commit exports to Git.

## Rule updates

Tax rules change over time.

When a new tax year is introduced:
1. add configuration;
2. add source citation metadata;
3. add fixtures;
4. add tests;
5. activate only for effective year.

Never overwrite historical year rules.
