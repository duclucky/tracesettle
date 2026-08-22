# Provenance Gate Remediation Evidence

Date: 2026-08-22

Scope: local contract/model hardening after reviewer feedback that provider-controlled artifact text could influence payout without enough provenance or truth proof.

Reviewer issue:

> Provider-controlled artifact text can influence payout adjudication without proving provenance or truth. Isolate evidence as untrusted data, include the canonical workflow objective, and verify important claims through approved sources or signed attestations.

Implemented local remediation:

- `contracts/tracesettle.py` now includes the canonical `WORKFLOW_OBJECTIVE` in the review context.
- Fetched artifact text is labeled `UNTRUSTED_PROVIDER_ARTIFACT_TEXT` in the prompt.
- Before prompt-based settlement, the contract recomputes the digest and verifies a V1 `TRACESETTLE_ATTESTATION` envelope.
- The envelope must bind `workflow_id`, `step_id`, `provider`, and `objective_hash`.
- The submitted digest is still enforced by recomputing the raw fetched artifact text before the envelope check.
- Missing or mismatched provenance returns `UNVERIFIABLE`/`RETRYABLE` and cannot move GEN, open credits, slash, or settle.
- External truth claims remain out of scope unless backed by approved sources or signed attestations.

Focused RED evidence:

```text
.venv\Scripts\python.exe -m pytest tests/direct/test_tracesettle_model.py -q
.........FFF
FAILED test_provider_controlled_text_without_provenance_cannot_settle
FAILED test_wrong_objective_hash_provenance_cannot_settle
FAILED test_canonical_objective_is_part_of_review_context
```

Focused GREEN evidence:

```text
.venv\Scripts\python.exe -m pytest tests/direct/test_tracesettle_static.py::test_review_path_verifies_artifact_provenance_before_settlement_prompt tests/direct/test_tracesettle_model.py -q
.............
13 passed in 0.05s
```

```text
npm run check:contract
Lint passed
Validation passed
Contract: TraceSettleContract
Methods: 16 (6 view, 10 write)
```

Honest limit: this is local source/test evidence. It is not a fresh Studionet deployment, not a fresh Studionet lifecycle, and not fresh remediated browser-wallet write evidence.

Full verification:

```text
npm run check

check:contract
Lint passed
Validation passed
Contract: TraceSettleContract
Methods: 16 (6 view, 10 write)

check:tests
20 passed in 0.07s

check:deployment
tests 3
pass 3
fail 0

check:frontend
Test Files 6 passed (6)
Tests 59 passed (59)
tsc --noEmit and vite build completed
```
