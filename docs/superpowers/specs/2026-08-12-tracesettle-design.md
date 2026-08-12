# TraceSettle Product and Contract Design

**Date:** 2026-08-12

**Status:** Approved design; implementation has not started

**Track:** Projects

## Product hook

Settle the failed workflow, not the loudest accusation.

TraceSettle is a multi-party agent-workflow settlement product. A sponsor funds
a bounded workflow, providers bond the steps they promise to perform, and
GenLayer validators classify which signed step artifacts satisfied their
promises, introduced a material fault, or were blocked by an upstream fault.
The finalized semantic result controls fee, bond, refund, and withdrawal
rights.

## Problem and trust boundary

Agent workflows increasingly chain several independent providers. When the
final outcome fails, a coordinator can otherwise decide unilaterally which
provider to blame. Upstream providers benefit from pushing fault downstream;
downstream providers benefit from blaming their inputs; the sponsor benefits
from denying fees broadly. A signed database can record the workflow but still
leaves this semantic attribution under one operator.

TraceSettle places only the irreducibly semantic decision inside GenLayer:
whether each signed artifact materially satisfies its locked step promise and
which step IDs form the first material root-cause set. Workflow construction,
identity, dependency validation, accounting, and the verdict-to-settlement
mapping remain deterministic.

## Users and jobs

### Workflow sponsor

- Define a bounded workflow objective and an acyclic set of provider steps.
- Fund a 2 GEN service pool.
- Lock provider identities, dependencies, promises, evidence rules, and fee
  weights before provider execution.
- Request neutral review after all required evidence is locked.
- Recover unearned service fees or cancel safely when the state permits.

### Step provider

- Accept only the assigned step and post a 1 GEN bond.
- Read the exact upstream artifact references the step depends on.
- Submit one wallet-authenticated artifact URL and digest for the locked step.
- Track review and finality without treating submission as success.
- Withdraw earned fee, returned bond, or downstream compensation from canonical
  credit.

## Evidence and authenticity boundary

V1 judges the providers' submitted work product, not an alleged external event.
Each provider transaction authenticates the provider, workflow ID, step ID,
attempt identity, artifact URL, artifact digest, dependency references, and
submission time. The provider is the authoritative origin for the artifact it
offers as its own deliverable.

Before semantic review, the contract deterministically checks:

- the caller is the locked provider for the step;
- the workflow and step IDs exist and the DAG relationship is locked;
- the URL uses an allowed HTTPS host/path and the response stays bounded;
- the current attempt is unique and the evidence window is valid;
- every required dependency points to a locked artifact;
- the digest recomputed from the exact fetched raw content equals the stored
  digest.

A missing source, malformed response, digest mismatch, stale attempt, unknown
dependency, or unavailable artifact produces a non-penalizing `UNVERIFIABLE`
result and a `RETRYABLE` workflow. It cannot move fees, bonds, or route rights.
TraceSettle does not claim that a submitted artifact proves offchain execution,
real-world delivery, legal liability, or external service quality.

## Consensus design

The leader receives the locked workflow objective, step promises, DAG edges,
and exact fetched artifacts. It returns a bounded structure containing:

- workflow and attempt IDs;
- source-coverage status;
- workflow verdict: `SUCCESS`, `MATERIAL_FAILURE`, or `UNVERIFIABLE`;
- one class for every step: `SATISFIED`, `MATERIAL_FAULT`,
  `DOWNSTREAM_BLOCKED`, or `UNVERIFIABLE`;
- the exact bounded root-cause step-ID set;
- consequence class: `PAY_ALL`, `NET_FAULT`, or `NO_CONSEQUENCE`;
- a short human-readable reason.

The validator independently reruns the same bounded evaluation and compares the
workflow verdict, coverage, every step class, root-cause set, and consequence
class. Rationale wording is non-critical. Unknown step IDs, missing steps,
duplicate IDs, expanded policies, or a leader error must disagree or normalize
to `UNVERIFIABLE`; untrusted evidence never expands the action set.

## State model

Canonical workflow states are:

```text
DRAFT -> OPEN -> EVIDENCE_LOCKED -> REVIEW_PENDING -> SETTLED
             \-> CANCELLED
REVIEW_PENDING -> RETRYABLE -> REVIEW_PENDING
RETRYABLE -> CANCELLED
```

- `DRAFT`: sponsor may add the bounded step DAG and fee weights.
- `OPEN`: terms are immutable; assigned providers accept and submit evidence.
- `EVIDENCE_LOCKED`: all required submissions are frozen for one attempt.
- `REVIEW_PENDING`: validator judgment is in progress.
- `RETRYABLE`: no money has settled; an authorized retry or safe cancellation
  may occur.
- `SETTLED`: credits are opened exactly once and the workflow cannot be judged
  again.
- `CANCELLED`: all unsettled pool and bonds are credited to their original
  owners exactly once.

Workflow, step, evidence, attempt, settlement, and credit records are isolated
by stable string IDs. Review history is append-only. No global `last_*` result
or overwriteable raw JSON registry is permitted.

## Deterministic settlement

The sponsor funds exactly 2 GEN in the demo. Every provider posts exactly 1 GEN
when accepting a step. Human-facing amounts are always displayed in GEN; base
units remain an implementation detail.

For `SUCCESS`:

- each provider receives its locked fee allocation;
- every provider bond is returned;
- rounding remainder returns to the sponsor.

For `MATERIAL_FAILURE`:

- `SATISFIED` providers receive their fee and bond;
- `DOWNSTREAM_BLOCKED` providers receive their fee and bond because their own
  output did not introduce the root fault;
- `MATERIAL_FAULT` providers receive no fee and their bond is distributed
  equally among directly downstream-blocked providers, or to the sponsor if no
  such provider exists;
- every unearned fee and rounding remainder returns to the sponsor.

For `UNVERIFIABLE` or an undetermined transaction, no settlement occurs. Retry
or cancellation preserves a complete refund destination for the service pool
and every provider bond. Credits are debited before external transfer, and
withdrawal is idempotency-protected.

## Provisional contract capabilities

The full write-method safety matrix is deferred to the project specification,
but the user-facing capability boundary is fixed by this design:

- sponsor: create funded workflow, add bounded steps, activate, lock evidence,
  request review, retry an unverifiable attempt, and cancel in explicit safe
  states;
- assigned provider: accept a step with bond and submit or replace evidence
  only before evidence lock;
- credited actor: withdraw canonical credit once;
- all users: read workflow, step, current attempt, settlement, credit, and
  paginated workflow IDs.

No consumer contract is justified in V1. One contract owns workflow commitments,
semantic judgment, settlement, and credit. A second status mirror would add no
trust or enforcement boundary.

## Product information architecture

TraceSettle is a working dApp, not a landing page or contract console.

### Workflow home

Shows workflows relevant to the connected address, their plain-language state,
the user's role, and the one next legal action. It handles no-wallet,
wrong-network, loading, empty, and read-error states.

### Workflow workspace

Shows the objective, step dependency path, provider promises, evidence status,
review progress, and user consequence. Sponsor and provider controls appear only
for the connected role and legal canonical state. Technical hashes, attempt IDs,
and raw enums stay inside a restrained verification disclosure.

### Credits and withdrawal

Shows withdrawable GEN, the workflow sources of credit, pending finality, and a
single withdrawal action. It never displays simulated balances, fees, gas, or
finality.

The UI must represent wallet prompt, submitted, accepted/decided, finalized,
failed, and retry states. It reloads canonical workflow and credit views after
finality. Local storage may hold harmless display preferences only.

## Error and recovery behavior

- Wrong role or illegal state: reject without state or accounting change.
- Duplicate workflow/step/evidence IDs: reject deterministically.
- Duplicate activation, settlement, cancellation, or withdrawal: reject or
  return the already-final state without opening duplicate credit.
- Missing or contradictory evidence: `RETRYABLE`, no consequence.
- Digest mismatch or source outage: `RETRYABLE`, no consequence.
- Malicious or shape-valid but semantically different leader output: validator
  disagreement; no canonical settlement.
- Failed wallet request or network switch: preserve the previous canonical UI
  and show a recoverable user-facing error.
- Failed/undetermined review: read the current attempt from canonical state;
  never assume attempt `-1` or display fake finality.

## Testing strategy

Testing must cover:

- per-workflow and per-step isolation;
- sponsor/provider/outsider authorization;
- DAG cycle, unknown dependency, duplicate step, and locked configuration;
- payable metadata for sponsor pool and provider bonds;
- happy-path success and multi-root material failure;
- downstream-blocked versus independent material fault;
- missing, malformed, unavailable, digest-mismatched, contradictory, and
  prompt-injected evidence;
- malicious leader, missing step, unknown step, changed root-cause set, and
  semantic mismatch with valid JSON shape;
- retry and cancellation from every legal and illegal state;
- value-destination and aggregate-liability invariants after every value write;
- double settlement, double credit, and double withdrawal prevention;
- raw Studio and normalized SDK receipt parser shapes;
- wallet discovery, Studionet switch/add, role/state action visibility,
  transaction lifecycle, canonical reload, missing-address honesty, and mobile
  accessibility in the frontend.

## Collision analysis

- TrustlessAgent is a bilateral deliverable escrow with one release/refund
  result. TraceSettle classifies a bounded multi-provider dependency graph and
  nets several step positions.
- SkillSlot Clearing judges compatibility before work and allocates scarce
  slots. TraceSettle judges causality after signed artifacts exist and settles
  faults across an active workflow.
- PactRelay judges one successor before provider rights move. TraceSettle keeps
  all providers and determines which step first broke a dependency chain.
- AgentAccessBond judges one policy violation and quarantines an identity.
  TraceSettle judges inter-step material satisfaction and opens a multi-party
  settlement ledger.
- Generic arbitration asks which party wins. TraceSettle locks a DAG, a finite
  step class for every node, an exact root-cause set, and a deterministic
  consequence mapping.

## Milestone headroom

The first substantial milestone after an accepted V1 is a real A2A gateway that
automatically emits versioned, origin-signed task and artifact receipts, plus a
router consumer that uses finalized TraceSettle state to reroute failed work.
This adds a real external integration and enforcement boundary; it is not a
rename, restyle, or repository reorganization.

Later milestones may add a first-class appeal panel for high-value workflows or
cross-workflow reliability history consumed by external schedulers, but neither
is part of V1.

## Scope and non-goals

V1 does not claim legal liability, offchain execution proof, private evidence,
arbitrary workflow size, external adoption, browser-wallet evidence, Studionet
deployment, another network, Portal acceptance, or production-grade insurance.
Those claims remain absent until the corresponding code, tests, canonical
network state, browser evidence, and public artifacts exist.

