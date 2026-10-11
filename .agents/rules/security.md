---
description: Mandatory security constraints
---
No payment initiation.

Never expose:
- PLUGGY_CLIENT_SECRET
- Pluggy API Key
- Supabase secret/service key
- webhook secret

Require AAL2 for financial/tax data.

Enable RLS.

No public signup in production.

Webhook must authenticate and deduplicate eventId.

Never log raw financial provider payloads or credentials.

No real Nubank connection until security gate passes.
