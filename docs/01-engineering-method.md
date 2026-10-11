# Engineering Method — Spec Driven + TDD

## Spec Driven Development

Every behavior starts in a spec.

Requirement format:

`<AREA>-<number>`

Examples:
- BANK-001
- FIN-004
- TAX-012
- SEC-003
- UI-005

Each requirement must have:
- statement;
- rationale if non-obvious;
- acceptance criteria;
- test mapping.

## Traceability

Maintain `TRACEABILITY.md`.

Each production feature should map:

```text
Requirement -> Acceptance Scenario -> Test -> Code
```

## Test Driven Development

### Red
Create the smallest failing automated test representing the requirement.

### Green
Write minimum implementation to pass.

### Refactor
Improve internal design while preserving green suite.

## What absolutely requires tests

- money calculations;
- monthly period grouping;
- card-payment deduplication;
- transfer classification;
- investment contribution classification;
- tax classification;
- 2026 IR estimator;
- webhook idempotency;
- Pluggy mapper;
- RLS authorization.

## What may be test-later

Pure visual spacing and static copy may use component/E2E verification after implementation.

## Test pyramid

1. domain unit tests — majority;
2. repository/integration tests;
3. provider contract fixture tests;
4. security/RLS tests;
5. mobile E2E happy paths.

## Definition of Ready

Feature can enter implementation only when:
- requirement is written;
- acceptance behavior is clear;
- security implications are known;
- domain ambiguity is resolved;
- test approach exists.

## Definition of Done

- requirement implemented;
- tests pass;
- acceptance scenario passes;
- mobile state handled;
- error/empty/loading state handled;
- security reviewed;
- no sensitive logs;
- docs updated if behavior changed.
