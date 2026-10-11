# Minimal Architecture

## System

```mermaid
flowchart LR
    U[Phone / PWA] -->|HTTPS| APP[Next.js on Vercel]
    APP -->|Auth + SQL/API| SB[Supabase]
    APP -->|Server API| P[Pluggy]
    P -->|Open Finance| N[Nubank]
    P -->|Webhooks| APP
```

## Why this architecture

It is intentionally boring:

- Next.js = UI + server routes;
- Supabase = auth + database;
- Pluggy = bank/Open Finance abstraction;
- Vercel = deployment.

No additional infrastructure until a measured problem requires it.

## Runtime data flow

```mermaid
sequenceDiagram
    participant N as Nubank
    participant P as Pluggy
    participant A as App Backend
    participant D as Supabase
    participant M as Mobile UI

    N->>P: Open Finance data
    P->>A: webhook/update
    A->>P: fetch authoritative resource
    P-->>A: accounts/transactions/investments
    A->>D: idempotent upsert
    M->>A: dashboard request
    A->>D: aggregate local data
    D-->>A: result
    A-->>M: mobile response
```

## Modules

- `auth`
- `integrations/pluggy`
- `finance`
- `investments`
- `tax`
- `dashboard`
- `repositories`

## Non-goals

No:
- distributed queue initially;
- separate tax service;
- event bus;
- data warehouse;
- live trading;
- live payment initiation.

If webhook processing later exceeds the safe function lifecycle, introduce a durable queue as an explicit architecture decision.
