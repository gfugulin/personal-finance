---
description: Engineering and spec-driven constraints
---
Use modular-monolith architecture.

Map implementation to requirement IDs.

Do not implement a behavior that contradicts a spec.

Prefer explicit TypeScript domain types.

Use Zod at HTTP/input boundaries.

Use Postgres numeric or decimal-safe arithmetic for money.

Use America/Sao_Paulo for reporting-period grouping.

Keep provider-specific types inside integration adapter.

Use migrations for schema changes.
