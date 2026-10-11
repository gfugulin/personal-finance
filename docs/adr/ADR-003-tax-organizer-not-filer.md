# ADR-003 — Tax organizer, not tax filing engine

Status: Accepted.

Decision:
The IR module organizes and estimates. It does not transmit returns or claim final compliance.

Reason:
Brazilian IR rules and filing obligations are broader than bank transaction data.

Consequence:
Version rules, preserve source metadata, expose review/manual adjustments and disclaimers.
