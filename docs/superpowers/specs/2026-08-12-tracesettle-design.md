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

TraceSettle is a working dApp, not a landing page, method list, contract console,
or reviewer dashboard. The frontend must let a real sponsor or provider complete
the workflow journey in product language, while hiding validator and storage
internals unless the user opens verification details.

### Design read and UI source of truth

Reading this as: a B2B operations web app for technical workflow sponsors and
step providers, with a trust-first, work-focused product language, leaning toward
React plus Tailwind/Radix-style primitives rather than a marketing landing page.

The `ui-ux-design-pro` engine was run for TraceSettle with React, variance 4,
motion 3, and density 7. It produced an operations-oriented base system, but
the final product direction overrides the generated Calistoga/Inter, heavy
shadow, mobile-dashboard, and gradient recommendations because they conflict
with the project brief and anti-default taste rules. Phase 3A must implement:

- neutral light operations theme using the engine's navy/azure trust palette
  only as a restrained accent;
- Geist Sans or an equivalent non-Inter system face for UI, plus JetBrains Mono
  only for addresses, IDs, and optional verification data;
- one 8px radius system for controls and repeated workflow items;
- compact page chrome, persistent navigation, and dense but readable workflow
  tables/cards;
- subtle state motion only for navigation, submitted/finality transitions, and
  row expansion; all motion must respect reduced-motion;
- no AI-purple gradients, no dark mesh hero, no faux wallet balances, no
  simulated finality, no localStorage canonical state, and no generic lorem
  content.

### Route map

All routes are reachable through persistent navigation and must have no-wallet,
wrong-network, loading, empty, read-error, submitted, finalized, failed, and
retry treatments where that state is relevant.

1. `/` - Entry and role selection
   States the value in sponsor/provider language, shows the current connection
   status, and routes the user into either workflow creation or assigned work.
   It is not a marketing-only hero; its primary controls are `Create workflow`
   and `Review assigned steps` when the connected wallet makes those legal.

2. `/workflows` - Workflow inbox
   Shows workflows relevant to the connected address, role, plain-language
   status, funding/bond posture in GEN, next legal action, and filters for
   Active, Needs action, Retryable, Settled, and Cancelled. Empty state explains
   what the connected user can do next without inventing sample onchain data.

3. `/workflows/new` - Sponsor setup flow
   A multi-step sponsor flow for objective, bounded step DAG, provider
   addresses, promises, evidence host policy, fee weights, and 2 GEN funding.
   It validates DAG shape and missing required fields client-side, then the
   contract remains authoritative. It never claims creation until finality is
   confirmed and canonical state is reloaded.

4. `/workflows/:id` - Workflow room
   The main task room. Shows objective, dependency graph, each provider promise,
   evidence readiness, review state, retry/cancel availability, and the user's
   immediate consequence. Sponsor controls and provider controls are role and
   state gated. Raw enums, hashes, attempt IDs, and fetched-source details stay
   in a collapsed verification panel.

5. `/workflows/:id/evidence/:stepId` - Provider evidence submission
   Lets the assigned provider inspect upstream artifacts, enter the artifact
   URL and digest, post the 1 GEN bond if needed, and submit or replace evidence
   before lock. It must clearly distinguish wallet prompt, transaction submitted,
   accepted/decided, finalized, failed, and retryable outcomes.

6. `/credits` - Credits and withdrawal
   Shows canonical withdrawable GEN, credit source workflows, pending finality,
   and the single legal withdrawal action. It never displays simulated wallet
   balances, gas, or fees. After withdrawal finality, it reloads canonical
   credit and workflow state.

7. `/settings` - Wallet and network
   Shows connected address, Studionet status, contract address configuration,
   preferred injected provider, and honest missing-configuration messages. It
   may store harmless UI provider preference only, never canonical workflow or
   finance state.

8. `/help` - Verification guide
   Explains in user terms what validators inspect, why `UNVERIFIABLE` is
   non-penalizing, what evidence authenticity means in V1, and what the app
   does not prove. It links to Explorer or technical details without becoming a
   reviewer submission page.

### Primary journeys

- Sponsor: connect wallet -> create workflow -> fund 2 GEN -> wait for provider
  evidence -> lock evidence -> request review -> see finalized settlement ->
  withdraw refund or residual credit.
- Provider: connect wallet -> open assigned workflow -> accept step with 1 GEN
  bond -> inspect dependencies -> submit evidence -> track review/finality ->
  withdraw earned fee, returned bond, or compensation.
- Returning user: open inbox -> filter needs-action/retryable -> resume the
  legal next step -> verify consequence in the workflow room or credits page.

### Visibility and action rules

- `USER_PRIMARY`: workflow objective, role, user-facing status, next legal
  action, GEN amounts, evidence readiness, final consequence, withdrawable
  credit, recoverable error.
- `USER_CONTEXTUAL`: step dependency graph, provider promises, source coverage,
  retry reason, cancellation reason, explorer link, current connected provider.
- `SYSTEM_ONLY`: raw storage layout, validator prompt internals, raw leader
  JSON, internal attempt counters, unbounded fetched payloads, submission
  packet material, private keys, gas estimates presented as fact.

Visible controls must map to provisional contract capabilities: create funded
workflow, add/lock steps before activation, activate, accept step with 1 GEN,
submit/replace evidence before evidence lock, lock evidence, request review,
retry unverifiable attempt, cancel in safe states, and withdraw canonical
credit. Any control without a legal contract path is removed before Phase 3B.

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
