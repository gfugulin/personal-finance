# Security Baseline

## Read-only bank boundary

The app may read:
- accounts;
- balances;
- transactions;
- cards;
- investments.

The app must not:
- initiate Pix;
- initiate transfer;
- pay boleto;
- trade;
- use payment-intent APIs.

## Authentication
- Supabase Auth;
- one owner;
- public signup disabled;
- TOTP MFA required;
- AAL2 required for financial/tax data.

## Database
- RLS all user financial/tax tables;
- owner row restriction;
- restrictive AAL2 policy;
- operational webhook table in private schema.

## Secrets
Never exposed to browser:
- Pluggy Client Secret;
- Pluggy API Key;
- Supabase Secret/Service Role;
- webhook secret.

Browser may receive:
- Supabase publishable key;
- temporary Pluggy Connect Token.

## Webhook
- public HTTPS endpoint;
- custom secret header;
- eventId unique;
- schema validation;
- authoritative follow-up fetch;
- idempotent upsert;
- quick 2xx after safe receipt;
- no sensitive payload logs.

## Data minimization

Do not persist by default:
- bank password;
- bank MFA;
- Pix key;
- full account/card numbers;
- CPF/CNPJ from arbitrary counterparties;
- full raw provider payload;
- identity payload not used by product.

## Real-data gate

Real Nubank may connect only when:
- sandbox E2E passes;
- MFA enforced;
- RLS tests pass;
- secrets inspected in browser build;
- webhook duplicate test passes;
- card-payment test passes;
- cross-user RLS test passes;
- Security Advisor reviewed.
