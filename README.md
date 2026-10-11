# Personal Finance Mobile — Spec Pack v0.2

Private, mobile-first personal finance + tax organization app.

## Product thesis

This is not a banking app, accounting ERP, tax-filing system or investment platform.

It is a **personal financial cockpit** that automatically imports Nubank/Open Finance data and helps one person answer:

1. What came in?
2. What went out?
3. Where am I overspending?
4. How much did I invest?
5. How is my net worth evolving?
6. What can I safely spend/invest now?
7. What income has tax relevance?
8. What should I keep organized for the annual Brazilian IRPF return?

## MVP navigation

Only four primary tabs:

- Hoje
- Movimentações
- Patrimônio
- IR

Goals and monthly planning are embedded in Hoje instead of becoming separate modules.

## Core stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Recharts
- Supabase Postgres + Auth
- Pluggy Connect / Open Finance
- Vercel
- PWA

No Redis, Kafka, Kubernetes, native mobile app, microservices or AI in MVP.

## Development method

This repository uses:

- Spec-Driven Development
- Test-Driven Development
- explicit domain invariants
- acceptance tests before implementation
- security gates before real Nubank data

Start with:

1. `START-HERE.md`
2. `AGENTS.md`
3. `docs/00-product-charter.md`
4. `docs/01-engineering-method.md`
5. `specs/001-mobile-shell.spec.md`
6. `specs/002-bank-sync.spec.md`
7. `specs/003-finance-engine.spec.md`
8. `specs/004-investments.spec.md`
9. `specs/005-tax-organizer.spec.md`
10. `docs/05-security.md`

The package includes Antigravity-native workspace rules under `.agents/`.
