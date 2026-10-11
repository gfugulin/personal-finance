# Pluggy Setup Runbook

## Current integration model

Pluggy's documented Open Finance coverage currently lists Nubank with:
- Accounts
- Transactions
- Credit Cards
- Investments
- Investment Transactions

Always re-check current connector products at go-live.

## Server auth

1. Client ID + Client Secret stay server-only.
2. Exchange them for Pluggy API Key.
3. Cache server-side until near expiry.
4. Current Pluggy docs state API Key validity is 2 hours.

## Frontend connection

1. authenticated AAL2 user asks for connection;
2. backend creates Connect Token;
3. current docs state Connect Token validity is 30 minutes;
4. browser opens Pluggy Connect;
5. user authorizes institution/Open Finance flow;
6. widget returns Item;
7. server verifies ownership/client mapping and persists Item ID.

## Sandbox

Test Pluggy Bank before Nubank.

Never use production bank data to debug:
- auth flow;
- transaction mapper;
- webhook idempotency;
- UI empty/error states.

## Data sync

Initial:
- accounts;
- transactions, paginated;
- investments;
- investment transactions.

Ongoing:
- Pluggy Item refresh;
- `transactions/created`;
- `transactions/updated`;
- `transactions/deleted`;
- lifecycle events (`item/updated`, `item/error`, waiting states).

Transaction webhooks occur when an Item update detects changes. They do not guarantee a purchase appears in the app at the exact moment it occurs.

UI therefore displays:
"Sincronizado há X min"

and may provide:
"Atualizar"

## Webhook

Register HTTPS endpoint, e.g.:

`POST /api/integrations/pluggy/webhook`

Configure custom header:

`X-Finance-Webhook-Secret: <random secret>`

On `transactions/created`, use the provider's created-transactions link/current API contract.
On update, retrieve full current transaction records.
On delete, soft-delete/exclude local records.

## Do not implement

Pluggy also offers payment-related APIs/webhooks. They are outside this product and must not be integrated.
