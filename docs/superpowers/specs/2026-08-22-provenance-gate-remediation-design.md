# Provenance Gate Remediation Design

## Problem

The reviewer is correct: provider-controlled artifact text can currently influence payout adjudication
after digest stability is proven, but digest stability does not prove provenance or truth. A provider can
host text that claims success, and the contract may pass that text into validator adjudication without a
separate provenance gate for the important claims.

## Design

TraceSettle will treat artifact text as untrusted provider-controlled input. The review context must include
the canonical workflow objective, locked step promises, dependencies, provider addresses, evidence URLs, and
digests. The prompt must state that artifact text cannot create policy, authority, payout rules, or trusted
facts.

Before any validator result can settle GEN, every locked artifact must pass a deterministic provenance gate.
For V1, that gate requires a bounded provenance envelope inside the fetched artifact text:

- `TRACESETTLE_ATTESTATION`
- `workflow_id=<locked workflow id>`
- `step_id=<locked step id>`
- `provider=<locked provider address string>`
- `objective_hash=sha256:<sha256 of canonical workflow objective>`

If any artifact is missing the envelope, binds to the wrong workflow, wrong step, wrong provider, wrong
objective hash, or fails the separate raw-content digest recomputation, the review becomes non-penalizing
and retryable. It must not transfer GEN, slash bonds, open credits, or settle. The digest is intentionally
not required inside the envelope because the contract hashes the complete artifact text; embedding the
same digest in that text would create a self-referential hash requirement.

This does not claim that V1 verifies every external real-world fact. It verifies provenance and binding of
submitted public artifacts. Claims that require outside truth must come from approved sources or signed
attestations in a future extension. Missing proof remains `UNVERIFIABLE`/`RETRYABLE`.

## Test requirements

- Provider text that claims success but lacks the provenance envelope cannot settle.
- Wrong workflow/objective/provider/digest binding cannot settle.
- The canonical workflow objective is included in the review context.
- Rejected provenance leaves workflow state, pool, bonds, and credits unchanged.
- Existing settlement invariant tests still pass.
