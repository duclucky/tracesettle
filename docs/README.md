# TraceSettle Project Specification

## Identity

- Idea ID: IDEA-013
- Project name: TraceSettle
- Project slug: tracesettle
- Category: Projects
- Status: SELECTED
- Repository: local child repo at `D:\Genlayer Project\tracesettle`
- Target network: studionet

## One-sentence product hook

Settle the failed workflow, not the loudest accusation.

## Trust problem

- Decision that must not depend on one party: which provider step in a
  multi-agent workflow first introduced a material fault, and which providers
  should receive fees, returned bonds, compensation, or refunds.
- Why database/ordinary EVM/backend LLM is insufficient: deterministic systems
  can store submissions and balances, but they cannot neutrally decide the
  semantic meaning of provider artifacts against locked promises when upstream,
  downstream, and sponsor incentives conflict.
- Value/rights/access at risk: a 2 GEN sponsor service pool, 1 GEN provider
  bonds, earned fees, downstream compensation, refunds, retry rights, and
  withdrawal credits.

## Fingerprint

- Trust problem: neutral semantic attribution of failure across a bounded
  provider DAG.
- Actors/adversary: sponsor, step providers, downstream providers, and
  outsiders with conflicting incentives around blame and payment.
- Evidence class + authenticity mechanism: provider-originated artifact URL and
  digest submitted by the locked provider wallet for the locked workflow,
  step, dependencies, and attempt. Validators fetch the exact public content and
  the contract recomputes the digest before consequence.
- Consensus question: which locked steps satisfied their promises, which
  introduced a material fault, which were downstream-blocked, and whether the
  source coverage permits settlement.
- State machine: `DRAFT -> OPEN -> EVIDENCE_LOCKED -> REVIEW_PENDING ->
  SETTLED`, plus safe `RETRYABLE` and `CANCELLED` recovery states.
- Direct consequence: deterministic credit ledger opens fees, returned bonds,
  fault-bond distribution, sponsor refunds, and withdrawals exactly once.
- Reuse surface: workflow settlement primitive callable by A2A coordinators,
  MCP build brokers, and DAO agent schedulers.

## Mandatory gate matrix

| Gate | PASS/FAIL | Evidence/reason |
| --- | --- | --- |
| Replacement | PASS | A database or EVM can record artifacts but cannot neutrally classify semantic fault across conflicting providers. |
| Judgment | PASS | Validators judge material satisfaction, root cause, downstream blocking, and source coverage from bounded artifacts. |
| Evidence availability | PASS | Provider artifact URLs are public HTTPS resources inside an allowed host/path and size window; validators can fetch them independently. |
| Evidence authenticity | PASS | V1 authenticates only the provider's own submitted deliverable through the provider transaction, workflow ID, step ID, dependency set, URL, digest, and attempt binding; invalid or missing objective evidence is non-penalizing. |
| Equivalence | PASS | Consensus-critical fields are bounded enums and sets: verdict, source coverage, step classes, root-cause IDs, and consequence class; rationale wording is non-critical. |
| Consequence | PASS | Final verdict changes fee, bond, refund, compensation, retry, cancellation, and withdrawal rights. |
| Adversarial | PASS | Sponsor, upstream provider, downstream provider, and outsider incentives conflict over blame, fees, and bonds. |
| State model | PASS | Per-workflow isolated state machine has locked configuration, review attempts, retry, settlement, cancellation, and credit withdrawal. |
| Reuse | PASS | A2A coordinator, MCP build broker, and DAO agent scheduler can call the same primitive. |
| Contract count | PASS | One contract owns workflow commitments, semantic review, settlement, and credits; no status mirror is justified. |
| Differentiation | PASS | Unlike bilateral escrow, access bonds, slot clearing, or successor transfer, TraceSettle classifies a multi-provider dependency graph after artifacts exist. |
| Claim-to-code | PASS | Every product claim maps to planned writes, views, tests, and evidence in the implementation plan; Phase 4 locks exact method names before contract code. |
| Full lifecycle | PASS | Planned lifecycle covers create, fund, accept, submit, lock, review, settle or retry, cancel, and withdraw. |
| Scope honesty | PASS | V1 does not claim legal liability, offchain execution proof, private evidence, external adoption, browser-wallet proof, deployment, or Portal acceptance until proven. |

## Actors, roles and incentives

| Actor | Permissions | Value at risk | Incentive to bias |
| --- | --- | --- | --- |
| Sponsor | Create workflow, fund pool, add steps, activate, lock evidence, request review, retry, cancel safe states, withdraw credit | 2 GEN pool and refund rights | Blame providers broadly to recover more fees |
| Assigned provider | Accept assigned step with bond, inspect dependencies, submit or replace evidence before lock, withdraw credit | 1 GEN bond, fee allocation, compensation rights | Claim its own output satisfied the promise and shift fault away |
| Downstream provider | Same as assigned provider for its step | 1 GEN bond, fee, compensation from upstream fault | Blame upstream inputs for failure |
| Outsider | Read public views only | No direct value | Attempt to confuse evidence or submit unauthorized actions |

## Scope and non-goals

### In scope

- One reusable GenVM contract.
- One Projects-track Vite/React frontend.
- Studionet deployment.
- 1 GEN provider bonds and 2 GEN sponsor demo pool.
- Provider artifact URL and digest binding.
- Semantic classification of each locked step.
- Deterministic settlement and withdrawal credit.

### Out of scope

- Legal arbitration, legal liability, insurance, private evidence, arbitrary
  workflow size, offchain execution proof, external adoption, non-Studionet
  networks, and a second consumer contract.

## Product/frontend blueprint

### Human users and jobs

| User/role | Primary job | Decision or outcome needed |
| --- | --- | --- |
| Sponsor | Create and fund a bounded workflow, then request neutral review | Know which providers are paid, refunded, blocked, or retryable |
| Provider | Accept an assigned step, post bond, submit evidence, and withdraw credit | Know whether its artifact satisfied the promise or was blamed or blocked |
| Returning user | Resume work across prior workflows | Find workflows needing action, settled credit, retry, or cancellation |

### Information architecture

| Screen/view | User purpose | Primary action | Required states | Mobile behavior |
| --- | --- | --- | --- | --- |
| `/` Entry and role selection | Understand the value and route into the right job | Create workflow or review assigned steps | no-wallet, wrong-network, loading, empty, read-error | Single-column intro, connection panel before actions |
| `/workflows` Workflow inbox | See relevant workflows and next legal action | Filter and open a workflow | loading, empty, active, needs-action, retryable, settled, cancelled, read-error | Filters become horizontal scroll, rows become stacked cards |
| `/workflows/new` Sponsor setup | Define objective, steps, dependencies, evidence policy, provider addresses, fee weights, and 2 GEN funding | Create funded workflow | draft validation, wallet prompt, submitted, finalized, failed | Wizard steps stack; graph summary moves below form |
| `/workflows/:id` Workflow room | Inspect objective, dependency graph, evidence readiness, review progress, consequence, and legal actions | Lock evidence, request review, retry, cancel, or open evidence step | loading, open, evidence locked, review pending, retryable, settled, cancelled, error | Two-column layout collapses to timeline first, actions second |
| `/workflows/:id/evidence/:stepId` Evidence submission | Let assigned provider inspect dependencies and submit artifact URL/digest with 1 GEN bond posture | Accept step or submit evidence | not accepted, open, submitted, finalized, failed, retryable | Form first, dependency context below |
| `/credits` Credits | Show canonical withdrawable GEN and source workflows | Withdraw credit | loading, no credit, credit available, submitted, finalized, failed | Summary above source rows |
| `/settings` Wallet and network | Show connected address, Studionet, contract address, and provider preference | Connect, switch/add Studionet, inspect configuration | no-wallet, wrong-network, missing address, ready | Full-width settings groups |
| `/help` Verification guide | Explain validator scope, retry, authenticity, and honest limits | Read verification guide or open Explorer | content ready | Simple stacked sections |

### Visibility matrix

| Function/data group | Visibility | Eligible role/state | User need or reason hidden |
| --- | --- | --- | --- |
| Workflow objective and user role | USER_PRIMARY | all connected users | Establishes what the user is acting on |
| Plain-language workflow status | USER_PRIMARY | all connected users | Drives the next legal action |
| GEN pool, bond, credit, refund, and compensation amounts | USER_PRIMARY | affected sponsor or provider | Direct value consequence |
| Next legal action | USER_PRIMARY | eligible role and legal state | Lets the user complete the journey |
| Step promises and dependency graph | USER_CONTEXTUAL | workflow participants | Needed to understand fault attribution |
| Evidence URL and digest summary | USER_CONTEXTUAL | workflow participants | Needed to verify what was submitted |
| Explorer link and raw IDs | USER_CONTEXTUAL | users who open details | Supports verification without dominating UI |
| Validator prompt internals and raw leader JSON | SYSTEM_ONLY | none in primary UI | Reviewer/debug data, not user task data |
| Private keys, wallet exports, gas estimates shown as fact | SYSTEM_ONLY | none | Must never appear in frontend |
| Submission packet material | SYSTEM_ONLY | none in product UI | Belongs in docs, not user workflow |

### UI action matrix

| Visible control | Contract capability/method | Eligible role | Legal state | Input/value | Finality | Failure/recovery |
| --- | --- | --- | --- | --- | --- | --- |
| Create workflow | `create_workflow` | sponsor | no existing workflow ID | workflow ID, objective, 2 GEN | reload workflow after finality | failed wallet or invalid input keeps draft |
| Add step | `add_step` | sponsor | DRAFT | step ID, provider, promise, dependencies, fee weight | reload workflow after finality | duplicate, cycle, unknown dependency shown inline |
| Activate workflow | `activate_workflow` | sponsor | DRAFT | workflow ID | reload OPEN state | incomplete config remains editable |
| Accept step | `accept_step` | assigned provider | OPEN | step ID, 1 GEN | reload step and bond posture | wrong caller or value rejected |
| Submit evidence | `submit_evidence` | assigned accepted provider | OPEN before evidence lock | URL, digest, dependency refs | reload evidence state | malformed URL/digest or failed tx is recoverable |
| Lock evidence | `lock_evidence` | sponsor | OPEN with required submissions | workflow ID | reload EVIDENCE_LOCKED | missing evidence keeps OPEN |
| Request review | `request_review` | sponsor | EVIDENCE_LOCKED or RETRYABLE | workflow ID | reload REVIEW_PENDING then final state | unavailable or unverifiable source becomes retryable |
| Retry review | `retry_review` | sponsor | RETRYABLE | workflow ID | reload REVIEW_PENDING | repeated source failure stays retryable |
| Cancel workflow | `cancel_workflow` | sponsor | DRAFT, OPEN, or RETRYABLE | workflow ID | reload CANCELLED and credits | illegal state rejected |
| Withdraw credit | `withdraw_credit` | credited actor | credit greater than 0 | recipient address | reload credit after finality | duplicate withdrawal cannot double debit |

### User-facing state language

| Canonical status/violation | User-facing label | User consequence/next step |
| --- | --- | --- |
| DRAFT | Draft setup | Sponsor can finish steps and activate |
| OPEN | Waiting for evidence | Providers can accept and submit artifacts |
| EVIDENCE_LOCKED | Evidence locked | Sponsor can request review |
| REVIEW_PENDING | Review in progress | Wait for accepted or finalized result |
| RETRYABLE | Retryable | Fix source/evidence issue or cancel safely |
| SETTLED | Settled | Credits are available according to verdict |
| CANCELLED | Cancelled | Unsettled funds and bonds return to owners |
| SATISFIED | Satisfied | Provider keeps fee and bond |
| MATERIAL_FAULT | Material fault | Provider loses fee and bond is redistributed |
| DOWNSTREAM_BLOCKED | Blocked downstream | Provider keeps fee and bond or receives compensation |
| UNVERIFIABLE | Unverifiable | No penalty; retry or cancel path remains |

### Visual preservation constraints

- Visual language/layout to preserve after frontend build: trust-first light
  operations app, restrained navy/azure accent, Geist-style sans UI,
  JetBrains/Geist Mono only for technical details, 8px radius, persistent
  navigation, compact workflow rows, and route-map page structure.
- Allowed functional edits: add or remove legal controls, fields, labels,
  state messages, disclosures, responsive fixes, accessibility fixes, and
  integration wiring required by the finalized contract.
- System/reviewer details excluded from the primary UI: raw storage, raw leader
  JSON, validator prompt internals, internal attempts, full fetched payloads,
  submission packet material, private keys, gas or fee values presented as fact.

## Provisional contract capability sketch

- Sponsor writes: create funded workflow, add bounded steps, activate, lock
  evidence, request review, retry, cancel safe states.
- Provider writes: accept assigned step with 1 GEN, submit or replace evidence
  before evidence lock.
- Credited actor writes: withdraw canonical credit once.
- Views: workflow summary, step detail, attempt, settlement, credit, workflow
  IDs by actor.
- Value/finality: UI shows wallet prompt, submitted, accepted/decided,
  finalized, failed, retryable, and canonical reload states. Human-facing
  amounts are GEN.
- Recovery: missing source, malformed source, digest mismatch, unavailable
  source, or invalid objective evidence produces non-penalizing retryable state.

## Phase 4 completion gate

The following sections are intentionally not contract-final in Phase 3A:
structured storage, exact public method signatures, write-method safety matrix,
value-destination matrix, fact-authentication matrix, consensus-critical field
matrix, threat model, direct test matrix, deployment evidence plan, and
claim-to-code matrix. Phase 4 must replace this section with the full locked
specification before any contract code is written.

## Frontend baseline

Phase 3A and 3B local frontend baseline is recorded in
`docs/evidence/local/frontend-baseline.md`. The frontend route map is built,
tested, and production-built behind the typed adapter boundary. This remains
local frontend evidence only and does not prove browser-wallet writes,
Studionet reads, deployment, or live app availability.

## Honest limitations

At SELECTED status, TraceSettle has approved design, frontend design system
artifacts, and local frontend baseline evidence only. It does not yet claim
contract code, Studionet deployment, browser-wallet evidence, public repo,
Vercel deployment, lifecycle evidence, Portal submission, or external adoption.

## Kill criteria

Stop and redesign if contract or frontend work makes the backend/client decide
the verdict, omits GenLayer semantic consensus, stores overwriteable global
results, treats actor-controlled evidence as authentic without objective
binding, exposes a method-list UI as the product, drops the full route map,
uses localStorage as canonical state, or creates value flows without complete
refund and withdrawal destinations.
