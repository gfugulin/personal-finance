---
description: Test-driven development rules
---
For finance, tax, sync and security logic:
- write failing test first;
- verify the failure;
- implement minimum behavior;
- pass;
- refactor.

Never modify expected test output merely to match incorrect production behavior.

Regression bugs require a reproducing test before fix.

Keep test fixtures deterministic.
