# TraceSettle Project Specification

## Identity

- Idea ID: IDEA-013
- Project name: TraceSettle
- Project slug: tracesettle
- Category: Projects
- Status: STUDIONET_VERIFIED
- Repository: local child repo at `D:\Genlayer Project\tracesettle`; public remote pending
- Target network: studionet
- Active contract: `0xd2224146ccFbe1BD700d36F53B0ff1b7B4Fe5313`
- Deployment evidence: `docs/evidence/studionet/deployment.json`
- Lifecycle evidence: `docs/evidence/studionet/lifecycle.json`

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
| Scope honesty | PASS | V1 now claims local tests, Studionet deployment, and script-signed lifecycle evidence; it does not claim legal liability, offchain execution proof, private evidence, external adoption, browser-wallet write proof, Vercel availability, or Portal acceptance until proven. |

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

## State model

### Stable IDs

- Workflow ID: sponsor-supplied ASCII slug, unique per workflow.
- Step ID: sponsor-supplied ASCII slug, unique inside a workflow.
- Attempt ID: contract-derived `workflow_id + ":" + review_nonce`.
- Credit key: `address + ":" + workflow_id`.
- Evidence key: `workflow_id + ":" + step_id`.

### Structured storage

- `workflows: TreeMap[str, WorkflowRecord]`
- `steps: TreeMap[str, StepRecord]`
- `evidence: TreeMap[str, EvidenceRecord]`
- `attempts: TreeMap[str, AttemptRecord]`
- `credits: TreeMap[str, bigint]`
- `workflow_ids: DynArray[str]`

`WorkflowRecord` stores sponsor, status, objective, pool, locked pool, review
nonce, step count, total fee weight, settled flag, cancelled flag, and
settlement reason. `StepRecord` stores provider, promise, dependency IDs,
fee weight, bond, accepted flag, submitted flag, class, and direct downstream
IDs. `EvidenceRecord` stores URL, digest, dependency snapshot, submitter,
attempt nonce, and submission timestamp. `AttemptRecord` stores verdict,
coverage, root-cause set, consequence class, reason, and finalized flag.

### State machine

```text
DRAFT --add_step/sponsor--> DRAFT
DRAFT --activate_workflow/sponsor--> OPEN
OPEN --accept_step/provider + 1 GEN--> OPEN
OPEN --submit_evidence/provider--> OPEN
OPEN --lock_evidence/sponsor--> EVIDENCE_LOCKED
EVIDENCE_LOCKED --request_review/sponsor--> SETTLED
EVIDENCE_LOCKED --request_review/sponsor with unverifiable--> RETRYABLE
RETRYABLE --retry_review/sponsor--> SETTLED
RETRYABLE --retry_review/sponsor with unverifiable--> RETRYABLE
DRAFT --cancel_workflow/sponsor--> CANCELLED
OPEN --cancel_workflow/sponsor--> CANCELLED
RETRYABLE --cancel_workflow/sponsor--> CANCELLED
SETTLED --withdraw_credit/credited actor--> SETTLED
CANCELLED --withdraw_credit/credited actor--> CANCELLED
```

### Illegal transitions

- Add step after activation.
- Activate with no steps, zero fee weight, unknown dependency, cycle, or
  duplicate provider-step ID pair.
- Accept a step by the wrong provider or with value other than 1 GEN.
- Submit evidence by an unaccepted provider, after evidence lock, with unknown
  dependency, malformed URL, or malformed digest.
- Lock evidence before every step has accepted and submitted evidence.
- Request review outside `EVIDENCE_LOCKED` or `RETRYABLE`.
- Retry outside `RETRYABLE`.
- Cancel after `EVIDENCE_LOCKED`, `REVIEW_PENDING`, `SETTLED`, or `CANCELLED`.
- Withdraw when credit is zero.

### Authorization

- Sponsor-only writes: create workflow, add step, activate, lock evidence,
  request review, retry review, cancel workflow.
- Assigned provider-only writes: accept step, submit evidence for that step.
- Credited actor-only write: withdraw credit for caller.
- Public reads: workflow, step, attempt, credit, and workflow list.

### Idempotency and double-action prevention

- Duplicate workflow and step IDs reject.
- Duplicate activation rejects after status changes.
- Duplicate acceptance rejects if the step is already accepted.
- Evidence replacement is allowed only before evidence lock and only by the
  assigned provider.
- Settlement opens credits once through a `settled` flag.
- Cancellation opens refund credits once through a `cancelled` flag.
- Withdrawal debits credit before external transfer.

## Write-method safety matrix

| Method | Caller | Allowed states | Forbidden states | Idempotency | Value/accounting effect | Views affected | Negative tests |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `create_workflow(workflow_id, objective)` | Sponsor | New workflow | Existing workflow ID | Duplicate ID rejects | Requires exactly 2 GEN; locks sponsor pool | `get_workflow`, `list_workflows`, sponsor credit remains unchanged | duplicate ID, wrong value, empty objective |
| `add_step(workflow_id, step_id, provider, promise, dependencies, fee_weight)` | Sponsor | DRAFT | OPEN, EVIDENCE_LOCKED, REVIEW_PENDING, RETRYABLE, SETTLED, CANCELLED | Duplicate step rejects | No value movement; updates fee weights and DAG | `get_step`, `get_workflow` | wrong caller, duplicate step, unknown dependency, self dependency, cycle, zero fee weight |
| `activate_workflow(workflow_id)` | Sponsor | DRAFT with valid DAG | OPEN, EVIDENCE_LOCKED, REVIEW_PENDING, RETRYABLE, SETTLED, CANCELLED | Duplicate activation rejects | Locks configuration; no value movement | `get_workflow` | wrong caller, no steps, cycle, zero total fee weight |
| `accept_step(workflow_id, step_id)` | Assigned provider | OPEN | DRAFT, EVIDENCE_LOCKED, REVIEW_PENDING, RETRYABLE, SETTLED, CANCELLED | Duplicate acceptance rejects | Requires exactly 1 GEN bond; locks provider bond | `get_step`, `get_workflow` | wrong caller, wrong value, duplicate accept, unknown step |
| `submit_evidence(workflow_id, step_id, url, digest)` | Assigned accepted provider | OPEN before lock | DRAFT, EVIDENCE_LOCKED, REVIEW_PENDING, RETRYABLE, SETTLED, CANCELLED | Replaces prior evidence by same provider before lock | No value movement; stores URL/digest/dependency snapshot | `get_step`, `get_attempt` | wrong caller, unaccepted step, malformed URL, malformed digest, unknown dependency |
| `lock_evidence(workflow_id)` | Sponsor | OPEN with all required evidence | DRAFT, EVIDENCE_LOCKED, REVIEW_PENDING, RETRYABLE, SETTLED, CANCELLED | Duplicate lock rejects | Freezes evidence for current attempt | `get_workflow`, `get_attempt` | wrong caller, missing evidence, duplicate lock |
| `request_review(workflow_id)` | Sponsor | EVIDENCE_LOCKED | DRAFT, OPEN, REVIEW_PENDING, SETTLED, CANCELLED | Settlement flag prevents duplicate credit | On `SUCCESS` or `MATERIAL_FAILURE`, opens fee, bond, refund, and compensation credits once; on `UNVERIFIABLE`, opens no credit | `get_workflow`, `get_attempt`, `get_credit` | wrong caller, digest mismatch, unavailable source, malicious leader, duplicate settlement |
| `retry_review(workflow_id)` | Sponsor | RETRYABLE | DRAFT, OPEN, EVIDENCE_LOCKED, REVIEW_PENDING, SETTLED, CANCELLED | New nonce per retry; settlement flag prevents duplicate credit | Opens no value until a settlement verdict exists | `get_workflow`, `get_attempt` | wrong caller, non-retryable state, repeated source failure |
| `cancel_workflow(workflow_id)` | Sponsor | DRAFT, OPEN, RETRYABLE | EVIDENCE_LOCKED, REVIEW_PENDING, SETTLED, CANCELLED | Cancelled flag prevents duplicate credit | Credits unsettled pool to sponsor and each locked bond to original provider | `get_workflow`, `get_credit` | wrong caller, duplicate cancel, after evidence lock, accounting sum mismatch |
| `withdraw_credit()` | Caller with credit | SETTLED or CANCELLED workflow credit exists | Zero credit | Debit before transfer prevents duplicate withdrawal | Emits transfer of caller credit and sets credit to zero | `get_credit` | zero credit, duplicate withdraw, transfer amount mismatch |

## Value-destination matrix

| Value source | Locked state | Release/refund/forfeit destination | Terminal states | Duplicate/late/retry behavior | Proof view |
| --- | --- | --- | --- | --- | --- |
| Sponsor pool, 2 GEN | `create_workflow` | Fees to satisfied and downstream-blocked providers; unearned remainder to sponsor | SETTLED, CANCELLED | Settlement or cancellation flag prevents duplicate credit | `get_workflow`, `get_credit(sponsor)` |
| Provider bond, 1 GEN per accepted step | `accept_step` | Returned to satisfied/downstream-blocked provider; distributed from material-fault provider to directly downstream-blocked providers, else sponsor | SETTLED, CANCELLED | Bond cannot be accepted twice; retry opens no value movement | `get_step`, `get_credit(provider)` |
| Earned fee | Settlement | Provider credit by fee weight | SETTLED | Settlement flag prevents duplicate fee credit | `get_credit(provider)` |
| Fault bond distribution | Settlement | Directly downstream-blocked providers equally, or sponsor if none | SETTLED | Root-cause set bounded and credited once | `get_attempt`, `get_credit(address)` |
| Refund | Settlement or cancellation | Sponsor for unearned pool; original provider for cancelled locked bond | SETTLED, CANCELLED | Retryable state opens no refund until cancel or settlement | `get_credit(address)` |
| Withdrawal credit | Settlement or cancellation | Caller external transfer | SETTLED, CANCELLED | Credit debited before transfer; duplicate withdrawal rejects | `get_credit(caller)` |

## Frontend lifecycle coverage matrix

| Canonical state | User action | Contract write | UI component | Frontend test | Evidence status |
| --- | --- | --- | --- | --- | --- |
| No workflow | Create workflow with 2 GEN | `create_workflow` | `/workflows/new` | `App.test.tsx` route coverage, Phase 7 adapter test | Local UI built; browser write waits for Phase 7 to Phase 9 |
| DRAFT | Add step | `add_step` | `/workflows/new` | Phase 7 adapter visibility test | Local UI built; contract write planned |
| DRAFT | Activate workflow | `activate_workflow` | `/workflows/new` | Phase 7 adapter visibility test | Local UI built; contract write planned |
| OPEN | Accept assigned step with 1 GEN | `accept_step` | `/workflows/:id/evidence/:stepId` | `contractAdapter.test.ts` action visibility | Local UI built; browser write waits for Phase 7 |
| OPEN | Submit evidence | `submit_evidence` | `/workflows/:id/evidence/:stepId` | `contractAdapter.test.ts` action visibility | Local UI built; browser write waits for Phase 7 |
| OPEN | Lock evidence | `lock_evidence` | `/workflows/:id` | `App.test.tsx` route coverage | Local UI built; contract write planned |
| EVIDENCE_LOCKED | Request review | `request_review` | `/workflows/:id` | `contractAdapter.test.ts` action visibility | Local UI built; contract write planned |
| RETRYABLE | Retry review | `retry_review` | `/workflows/:id` | Phase 7 adapter visibility test | Local UI built; contract write planned |
| DRAFT/OPEN/RETRYABLE | Cancel safely | `cancel_workflow` | `/workflows/:id` | Phase 7 adapter visibility test | Local UI built; contract write planned |
| SETTLED/CANCELLED with credit | Withdraw credit | `withdraw_credit` | `/credits` | Phase 7 adapter visibility test | Local UI built; browser write waits for Phase 7 |

## Evidence policy

- Authoritative sources: provider-submitted HTTPS artifact URLs from an allowed
  host/path policy locked in the workflow.
- Provenance/authentication: the provider wallet transaction binds workflow ID,
  step ID, URL, digest, dependency IDs, and attempt nonce. This authenticates
  the provider's own offered deliverable only.
- Authorized attestor/signer: assigned provider address for each step.
- Anti-replay event/digest identity: `workflow_id`, `step_id`, `review_nonce`,
  URL, digest, dependency snapshot, and submitter.
- Signed timestamp bounds: contract stores submission timestamp from
  transaction context and rejects evidence after lock.
- Immutable policy/source version URLs and hashes: V1 locks allowed host/path
  policy in workflow configuration; external real-world policy versions are out
  of scope.
- Allowed schemes/domains/paths: HTTPS only, host/path prefix locked by sponsor
  before activation.
- Time/window rules: evidence can be submitted or replaced only while workflow
  is `OPEN`; review uses the locked evidence snapshot.
- Size/count bounds: maximum 6 steps, maximum 3 dependencies per step, maximum
  4 root causes, maximum 6 fetched artifacts, maximum 32 KB raw artifact body.
- Missing evidence: lock rejects before every step has evidence.
- Contradictory evidence: semantic review may classify `UNVERIFIABLE` when
  artifacts cannot support a bounded class.
- Unavailable source: `UNVERIFIABLE`, state becomes `RETRYABLE`, no value moves.
- Invalid/unverifiable attestation: non-penalizing `UNVERIFIABLE`/`RETRYABLE`.
- Prompt-injection boundary: fetched artifact text cannot add policies, step
  IDs, classes, destinations, or transfer rules; only locked workflow data can.
- Private/unverifiable evidence excluded: private sources, screenshots, and
  self-reported logs without the locked URL/digest path are not accepted.

### Fact authentication matrix

| Consequential fact | Who can fabricate it? | Authoritative source / issuer | Verification method | Replay/timestamp binding | Failure consequence | Required negative test |
| --- | --- | --- | --- | --- | --- | --- |
| Provider identity for step | Outsider or wrong provider | Locked step provider address | `gl.message.sender` equals provider | workflow ID and step ID in storage | Reject write | wrong provider accept and submit |
| Artifact content bytes | Provider or host operator | Exact fetched HTTPS response | Recompute digest from fetched raw content | URL, digest, review nonce | `UNVERIFIABLE`, no settlement | digest mismatch |
| Dependency snapshot | Provider | Locked step DAG and evidence records | Dependency IDs must match locked dependencies and submitted evidence | workflow ID, step ID, review nonce | Reject evidence or classify retryable | unknown dependency |
| Evidence timing | Provider | Contract state and transaction context | Evidence allowed only while `OPEN` before lock | status and submission timestamp | Reject write | submit after lock |
| Settlement destination | Any participant | Deterministic contract rules | Derived from locked classes and root-cause set | settlement flag and workflow ID | Reject or no duplicate credit | duplicate settlement and accounting invariant |

## Consensus design

### Leader task

- Inputs: workflow objective, locked step promises, dependencies, provider
  addresses, evidence URLs, digests, fetched artifact bodies, and review nonce.
- Fetch: `gl.nondet.web.get(url)` for each locked evidence URL.
- Extraction: recompute digest before prompt; pass only bounded text summaries
  and locked step records to the LLM.
- Normalization: drop unknown keys, sort step IDs, cap rationale length, and
  map invalid enums to `UNVERIFIABLE`.
- Structured output: JSON with workflow ID, attempt ID, coverage, workflow
  verdict, step classes, root-cause set, consequence class, and reason.

### Consensus-critical fields

| Field | Type/bounds | Comparison rule | Why critical |
| --- | --- | --- | --- |
| `workflow_id` | existing string ID | exact match | Prevents cross-workflow settlement |
| `attempt_id` | derived string ID | exact match | Prevents replay across attempts |
| `coverage` | `COMPLETE` or `INCOMPLETE` | exact match | Incomplete coverage cannot settle |
| `workflow_verdict` | `SUCCESS`, `MATERIAL_FAILURE`, `UNVERIFIABLE` | exact match | Drives settlement or retry |
| `step_classes` | one class per locked step | exact key and enum match | Determines fees, bonds, and blocked providers |
| `root_cause_steps` | sorted set, max 4, existing step IDs | exact set match | Determines fault bond distribution |
| `consequence_class` | `PAY_ALL`, `NET_FAULT`, `NO_CONSEQUENCE` | exact match | Prevents LLM from inventing value movement |

### Validator

- Independent evidence/replay: validators fetch the same locked URLs, recompute
  digests, and rerun semantic classification.
- Semantic rule: compare only coverage, verdict, step class map, root-cause set,
  and consequence class; reason wording is non-critical.
- Rejection conditions: unknown step, missing step, duplicate step, invalid enum,
  expanded root set, digest mismatch, unavailable source, expanded policy, or
  mismatched consequence class.
- `UNDETERMINED` handling: no settlement credit opens; current attempt remains
  readable and sponsor can retry only from canonical `RETRYABLE`.

### Rationale policy

Reason text is capped, user-facing, and non-consensus-critical. It may explain
why a step was satisfied, faulted, blocked, or unverifiable, but it cannot
change value destinations or legal actions.

## Consequence and accounting

| Verdict | Canonical state change | Consumer action | Value movement |
| --- | --- | --- | --- |
| SUCCESS | SETTLED | Withdraw credit | Each provider earns fee and returned bond; sponsor receives rounding remainder |
| MATERIAL_FAILURE | SETTLED | Withdraw credit | Satisfied and downstream-blocked providers earn fee and bond; material-fault providers lose fee and bond; unearned fees return to sponsor |
| UNVERIFIABLE | RETRYABLE | Retry or cancel | No value movement |
| CANCELLED | CANCELLED | Withdraw credit | Sponsor pool returns to sponsor; accepted provider bonds return to original providers |

- Accepted/finalized boundary: value consequences are opened only when the
  review transaction finalizes with a settlement verdict or cancellation
  finalizes in a safe state.
- Ledger invariant: sponsor pool plus accepted bonds equals locked values,
  opened credits, withdrawn values, and remaining locked values.
- Child-message/transfer evidence: withdrawal emits a transfer only after debit.
- Withdrawal/settlement: credits are canonical and idempotent.
- Cure/appeal/restore: not in V1; retry handles unverifiable evidence only.

## Reusable interface

### Write methods

- `create_workflow(workflow_id: str, objective: str) payable`
- `add_step(workflow_id: str, step_id: str, provider: Address, promise: str, dependencies: str, fee_weight: u256)`
- `activate_workflow(workflow_id: str)`
- `accept_step(workflow_id: str, step_id: str) payable`
- `submit_evidence(workflow_id: str, step_id: str, url: str, digest: str)`
- `lock_evidence(workflow_id: str)`
- `request_review(workflow_id: str)`
- `retry_review(workflow_id: str)`
- `cancel_workflow(workflow_id: str)`
- `withdraw_credit()`

### View methods

- `get_workflow(workflow_id: str) -> dict`
- `get_workflow_step_ids(workflow_id: str) -> str`
- `get_step(workflow_id: str, step_id: str) -> dict`
- `get_attempt(workflow_id: str) -> dict`
- `get_credit(owner: Address) -> dict`
- `list_workflows(offset: u256, limit: u256) -> DynArray[str]`

### Consumer/callback

- Authentication: no external consumer callback in V1.
- Idempotency key: not applicable in V1.
- Failure/retry: external consumers read finalized views after settlement.
- Authorized cancellation: sponsor-only safe-state cancellation.

## Threat model

| Threat | Attack | Mitigation | Test |
| --- | --- | --- | --- |
| Wrong caller | Outsider accepts, submits, reviews, cancels, or withdraws | Role checks on every write | unauthorized caller tests |
| DAG manipulation | Sponsor creates cycle or unknown dependency | Validate dependencies before activation | cycle and unknown dependency tests |
| Digest mismatch | Provider changes hosted artifact after submission | Recompute exact fetched raw content digest before semantic review | digest mismatch retryable test |
| Source outage | URL unavailable during review | `UNVERIFIABLE` and no value movement | unavailable source test |
| Prompt injection | Artifact asks model to change policy or destination | Locked policy and bounded output schema; unknown keys dropped | prompt-injection test |
| Malicious leader | Leader omits step or changes root-cause set | Validator compares consensus-critical meaning | malicious leader test |
| Duplicate settlement | Sponsor repeats review after settled | `settled` flag and accounting invariant | duplicate settlement test |
| Double withdrawal | Actor withdraws twice | Debit before transfer and zero-credit reject | duplicate withdrawal test |
| Value orphan | Cancellation or retry leaves pool/bond without owner | Value-destination matrix and cancellation credits | cancellation accounting test |

## Test plan

- Happy path: three-step workflow settles `SUCCESS`, pays fees, returns bonds,
  and withdraws credit.
- Unauthorized: outsider and wrong-role writes reject.
- Isolation: two workflows with same step IDs do not collide.
- Evidence failure: missing, malformed, unavailable, digest-mismatched, and
  contradictory evidence cannot settle.
- Malicious leader: missing step, unknown step, changed root cause, invalid enum,
  and mismatched consequence class fail validation.
- Prompt injection: artifact text cannot expand policy, root causes, or value
  destinations.
- Semantic mismatch: valid JSON with different step class map fails validator.
- Verdict classes: `SUCCESS`, `MATERIAL_FAILURE`, and `UNVERIFIABLE`.
- Duplicate: create, accept, activate, lock, settle, cancel, and withdraw.
- Recovery/value write safety: retry and cancel from legal and illegal states.
- Accounting/value: pool, bonds, earned fee, refund, compensation, credit, and
  withdrawal invariant.
- Cure/restore: no V1 cure or restore claim.
- Consumer enforcement: no V1 consumer callback.
- Undetermined/retry: undetermined review cannot open credits.

## Claim-to-code matrix

| Product claim | Contract method/state | View/read | Direct test | Network evidence |
| --- | --- | --- | --- | --- |
| Sponsor funds a bounded workflow with 2 GEN | `create_workflow`, DRAFT | `get_workflow` | wrong value, duplicate ID, stored pool | Studionet create tx and read |
| Providers post 1 GEN bonds | `accept_step`, OPEN | `get_step` | wrong caller, wrong value, duplicate accept | Studionet accept tx and read |
| Evidence is bound to provider and digest | `submit_evidence` | `get_step`, `get_attempt` | wrong provider, digest mismatch, unknown dependency | Studionet submit tx and read |
| Validators classify step satisfaction and root cause | `request_review`, `retry_review` | `get_attempt` | malicious leader, semantic mismatch, prompt injection | Studionet review tx and attempt read |
| Unverifiable evidence is non-penalizing | `request_review`, RETRYABLE | `get_workflow`, `get_credit` | source outage, digest mismatch, zero credit movement | Studionet retryable lifecycle |
| Settlement opens deterministic credits | settlement branch in review | `get_credit` | success, material failure, accounting invariant | Studionet settled lifecycle |
| Withdrawal debits before transfer | `withdraw_credit` | `get_credit` | zero credit, duplicate withdraw | Studionet withdraw tx and post-read |
| Frontend is a full product, not method list | route map and adapter | route render tests | `App.test.tsx`, `contractAdapter.test.ts` | Vercel and browser evidence after deployment |

## Analogue and differentiation matrix

| Analogue/prior idea | Similar dimensions | Structural difference | Collision decision |
| --- | --- | --- | --- |
| TrustlessAgent | Deliverable escrow with release/refund | TraceSettle nets a multi-provider dependency graph and classifies every step | Distinct |
| SkillSlot Clearing | Agent marketplace and allocation | TraceSettle judges after artifacts exist, not before slot allocation | Distinct |
| PactRelay | Successor handoff judgment | TraceSettle keeps all providers and attributes root fault across a DAG | Distinct |
| AgentAccessBond | Bond and semantic policy violation | TraceSettle settles workflow fees/bonds, not identity access/quarantine | Distinct |
| Generic arbitration | Evidence-based dispute resolution | TraceSettle uses locked step classes, root-cause set, and deterministic value mapping | Distinct |

## Deployment and evidence plan

- Network: Studionet.
- Actors/wallet separation: sponsor wallet from ignored authorized `.env`;
  second actor wallet only if required and authorized for lifecycle separation.
- Deploy steps: inspect current deployment state, deploy only if no active
  finalized deployment exists for current source commit and Depends/API family.
- Consequential lifecycle: create, add steps, activate, accept, submit evidence,
  lock, request review, read settlement or retry, cancel if retryable, withdraw.
- Canonical reads: workflow, step, attempt, and credit after every finalized
  write.
- Balance/receipt proof: save allowlisted tx hash, explorer URL, status,
  result, timestamp, public actor, pre/post credit, and GEN-denominated value.
- Evidence path: `docs/evidence/studionet/`.
- Resume/idempotency: scripts inspect deployment and lifecycle files before any
  write; finalized transactions are not replayed.

## Verified evidence

Contract hardening evidence is recorded in
`docs/evidence/local/contract-hardening.md`. Phase 3A and 3B local frontend baseline is recorded in
`docs/evidence/local/frontend-baseline.md`. Phase 7 local SDK/wallet/read-path
integration is recorded in `docs/evidence/local/frontend-integration.md`. The
frontend route map is built, tested, production-built, and wired behind the
typed adapter boundary.

Studionet deployment evidence is recorded in
`docs/evidence/studionet/deployment.json`:

- contract address: `0xd2224146ccFbe1BD700d36F53B0ff1b7B4Fe5313`
- deploy tx: `0x0f49064274dbfaf652dfca59fb70769d0261566dcb3788c21cc882d850308f5d`
- status: `FINALIZED`
- consensus result: `MAJORITY_AGREE`
- deployment result: `SUCCESS`
- schema verified: `true`

Studionet lifecycle evidence is recorded in
`docs/evidence/studionet/lifecycle.json`:

- workflow: `trace-live-20260812-c`
- final workflow status: `SETTLED`
- final verdict: `SUCCESS`
- consequence class: `PAY_ALL`
- provider credit before withdrawal: `4 GEN`
- provider credit after withdrawal: `0 GEN`
- final step IDs: `step-plan`, `step-build`
- both final steps read as `SATISFIED`

Lifecycle records are allowlisted public fields only. Full Studio receipts,
RPC payloads, validator configs, private keys, and raw stdout/stderr are not
stored in the repository.

## Honest limitations

TraceSettle currently claims approved design, one GenVM contract, direct tests,
frontend design-system artifacts, local frontend evidence, SDK/wallet/read-path
integration, Studionet deployment, and script-signed Studionet lifecycle
evidence. It does not yet claim browser-wallet write evidence, public repo,
Vercel deployment, Portal submission, Portal acceptance, or external adoption.

## Kill criteria

Stop and redesign if contract or frontend work makes the backend/client decide
the verdict, omits GenLayer semantic consensus, stores overwriteable global
results, treats actor-controlled evidence as authentic without objective
binding, exposes a method-list UI as the product, drops the full route map,
uses localStorage as canonical state, or creates value flows without complete
refund and withdrawal destinations.
