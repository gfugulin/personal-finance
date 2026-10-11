# SPEC 002 — Nubank / Pluggy Bank Sync

## BANK-001
Authenticated AAL2 owner can request a Pluggy Connect Token without receiving Pluggy server credentials.

## BANK-002
App can create/persist a Pluggy Item connection.

## BANK-003
Initial synchronization imports:
- BANK accounts;
- CREDIT accounts;
- transactions;
- investments when available;
- investment transactions when available.

## BANK-004
Transaction synchronization is idempotent by external provider ID.

## BANK-005
Webhook delivery is idempotent by eventId.

## BANK-006
Created/updated/deleted transaction events reconcile local state.

## BANK-007
Dashboard reads local persisted data and does not wait for live bank response.

## BANK-008
Connection UI displays last successful sync.

## BANK-009
Real Nubank connection is blocked operationally until sandbox/security gate.

## BANK-010
The product does not guarantee instant transaction arrival. It describes synchronization accurately.
