# ADR-002 — Modular monolith

Status: Accepted.

Decision:
One Next.js application + one Supabase database.

Reason:
One-user private product has no need for distributed architecture.

Consequence:
Introduce new infrastructure only after a measured operational need.
