# TraceSettle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build, test, deploy, publish, and document TraceSettle as a Projects-track GenLayer dApp with a full multi-route frontend and one reusable Intelligent Contract.

**Architecture:** One GenVM contract owns workflow commitments, bounded semantic review, deterministic settlement, and withdrawal credits. The frontend is a Vite/React TypeScript app with persistent routing and a typed contract adapter so Phase 7 can wire `genlayer-js` without redesign. Deployment and evidence scripts are resumable and save allowlisted public evidence under `docs/evidence/studionet/`.

**Tech Stack:** GenVM Python contract, `genvm-lint`, `gltest`/direct tests, Node/Vite/React/TypeScript/Vitest, `genlayer-js`, Studionet, Vercel.

## Global Constraints

- Response and coordination stay in Vietnamese; user-facing product copy is English only.
- Project root is `D:\Genlayer Project\tracesettle`; parent workspace is not a Git repo and must not receive contract/frontend source.
- Category is Projects.
- Network is Studionet.
- Demo value amounts are 1 GEN or 2 GEN in human-facing copy; base units appear only inside code constants.
- Contract source is ASCII, line 1 is the current `Depends` header, line 3 imports `from genlayer import *`, and the module has exactly one `gl.Contract` subclass.
- One contract only; no consumer contract in V1.
- FE-PRESERVE applies after Phase 3A.
- FE-HONEST: no simulated wallet signature, transaction, balance, fee, or finality; localStorage only for harmless UI preference.
- FE-SURFACE: primary UI shows user-relevant state and legal actions only.
- FE-PRODUCT: route map must include `/`, `/workflows`, `/workflows/new`, `/workflows/:id`, `/workflows/:id/evidence/:stepId`, `/credits`, `/settings`, and `/help`.
- Public hygiene excludes `.env`, wallet material, parent workspace control docs, prompts, source notes, research, templates, caches, build output, and unrelated boilerplate.

---

## File Structure

- `docs/README.md`: project specification copied from the root template, completed through Phase 4.
- `design-system/tracesettle/MASTER.md`: TraceSettle frontend design source of truth.
- `frontend/package.json`, `frontend/src/**`, `frontend/tests/**`: Vite/React app, adapter, route tests, and build.
- `contracts/tracesettle.py`: the only GenVM contract source.
- `tests/direct/test_tracesettle_static.py`: ASCII/header/class/payable/static guardrails.
- `tests/direct/test_tracesettle_model.py`: deterministic Python model tests for state, accounting, and semantic normalization.
- `scripts/receipt_parser.ts`, `tests/direct/receipt_parser.test.ts`: raw Studio and normalized SDK receipt shape coverage.
- `scripts/deploy-studionet.ts`, `scripts/lifecycle-studionet.ts`, `scripts/inspect-deployment.ts`: resumable deployment, lifecycle, and inspect tools.
- `docs/evidence/studionet/`: allowlisted deployment and lifecycle evidence.
- `README.md`: public repo readme after local build and deployment evidence exist.

---

### Task 1: Phase 3A Product Brief

**Files:**
- Create: `D:\Genlayer Project\tracesettle\docs\README.md`
- Modify: `D:\Genlayer Project\tracesettle\docs\superpowers\plans\2026-08-12-tracesettle-implementation.md`

**Interfaces:**
- Consumes: approved design spec at `docs/superpowers/specs/2026-08-12-tracesettle-design.md`
- Produces: project spec sections for identity, hook, gates, provisional capability sketch, route map, visibility matrix, UI action matrix, and visual preservation constraints

- [ ] **Step 1: Copy the template text**

Run: `Copy-Item -LiteralPath "D:\Genlayer Project\templates\PROJECT-SPEC-TEMPLATE.md" -Destination "D:\Genlayer Project\tracesettle\docs\README.md"`

Expected: `docs/README.md` exists.

- [ ] **Step 2: Fill Stage 1 sections**

Replace the blank template cells with the TraceSettle content already approved:

```markdown
## Identity

- Idea ID: IDEA-013
- Project name: TraceSettle
- Project slug: tracesettle
- Category: Projects
- Status: SELECTED
- Repository: local child repo at D:\Genlayer Project\tracesettle
- Target network: studionet
```

Add the 14 gate matrix with every row `PASS`, the route map from the design spec, and the provisional controls `createWorkflow`, `addStep`, `activateWorkflow`, `acceptStep`, `submitEvidence`, `lockEvidence`, `requestReview`, `retryReview`, `cancelWorkflow`, and `withdrawCredit`.

- [ ] **Step 3: Verify no blank Stage 1 cells**

Run: `rg -n "\|  \||\[\]|Idea ID:$|Status:$|Target network:$" docs/README.md`

Expected: no output for Stage 1 sections.

- [ ] **Step 4: Commit**

Run:

```powershell
git add docs/README.md docs/superpowers/plans/2026-08-12-tracesettle-implementation.md
git commit -m "docs: add TraceSettle project brief"
```

Expected: commit succeeds.

---

### Task 2: Phase 3A Frontend Scaffold and Typed Adapter

**Files:**
- Create: `D:\Genlayer Project\tracesettle\package.json`
- Create: `D:\Genlayer Project\tracesettle\frontend\package.json`
- Create: `D:\Genlayer Project\tracesettle\frontend\index.html`
- Create: `D:\Genlayer Project\tracesettle\frontend\vite.config.ts`
- Create: `D:\Genlayer Project\tracesettle\frontend\tsconfig.json`
- Create: `D:\Genlayer Project\tracesettle\frontend\vitest.setup.ts`
- Create: `D:\Genlayer Project\tracesettle\frontend\src\domain\types.ts`
- Create: `D:\Genlayer Project\tracesettle\frontend\src\domain\fixtures.ts`
- Create: `D:\Genlayer Project\tracesettle\frontend\src\adapters\contractAdapter.ts`
- Create: `D:\Genlayer Project\tracesettle\frontend\src\adapters\fixtureAdapter.ts`
- Test: `D:\Genlayer Project\tracesettle\frontend\src\adapters\contractAdapter.test.ts`

**Interfaces:**
- Produces: `TraceSettleAdapter` with `listWorkflows(address)`, `getWorkflow(id)`, `getCredits(address)`, `createWorkflow(input)`, `acceptStep(input)`, `submitEvidence(input)`, `lockEvidence(id)`, `requestReview(id)`, `retryReview(id)`, `cancelWorkflow(id)`, and `withdrawCredit(address)`
- Produces: domain statuses `DRAFT`, `OPEN`, `EVIDENCE_LOCKED`, `REVIEW_PENDING`, `RETRYABLE`, `SETTLED`, `CANCELLED`

- [ ] **Step 1: Write adapter tests first**

Create a test asserting:

```ts
expect(toUserStatus("RETRYABLE")).toEqual({
  label: "Retryable",
  tone: "warning",
  nextStep: "Fix the evidence issue or cancel safely."
});
expect(isActionVisible({ role: "provider", status: "OPEN", action: "submitEvidence" })).toBe(true);
expect(isActionVisible({ role: "sponsor", status: "SETTLED", action: "requestReview" })).toBe(false);
```

- [ ] **Step 2: Run failing frontend test**

Run: `cd frontend; npm test -- --run src/adapters/contractAdapter.test.ts`

Expected before implementation: command fails because package/test files are absent or functions are not defined.

- [ ] **Step 3: Scaffold Vite/React and implement the domain boundary**

Install exact dependencies from `frontend/package.json`:

```json
{
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "test": "vitest run",
    "typecheck": "tsc --noEmit",
    "build": "tsc --noEmit && vite build"
  },
  "dependencies": {
    "@vitejs/plugin-react": "^6.0.2",
    "vite": "^7.2.0",
    "typescript": "^5.9.3",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-router-dom": "^7.9.5",
    "@phosphor-icons/react": "^2.1.10",
    "genlayer-js": "^1.1.8"
  },
  "devDependencies": {
    "vitest": "^4.1.8",
    "@testing-library/react": "^16.3.2",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/user-event": "^14.6.1",
    "jsdom": "^27.2.0",
    "@types/react": "^19.2.2",
    "@types/react-dom": "^19.2.2"
  }
}
```

- [ ] **Step 4: Run adapter tests**

Run: `cd frontend; npm test -- --run src/adapters/contractAdapter.test.ts`

Expected: tests pass.

- [ ] **Step 5: Commit**

Run:

```powershell
git add package.json frontend
git commit -m "feat: add frontend adapter boundary"
```

Expected: commit succeeds.

---

### Task 3: Phase 3A Full Multi-Route Frontend

**Files:**
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/styles.css`
- Create: `frontend/src/components/AppShell.tsx`
- Create: `frontend/src/components/WalletStatus.tsx`
- Create: `frontend/src/components/StatusBadge.tsx`
- Create: `frontend/src/components/WorkflowList.tsx`
- Create: `frontend/src/components/TransactionState.tsx`
- Create: `frontend/src/pages/EntryPage.tsx`
- Create: `frontend/src/pages/WorkflowInboxPage.tsx`
- Create: `frontend/src/pages/NewWorkflowPage.tsx`
- Create: `frontend/src/pages/WorkflowRoomPage.tsx`
- Create: `frontend/src/pages/EvidenceSubmissionPage.tsx`
- Create: `frontend/src/pages/CreditsPage.tsx`
- Create: `frontend/src/pages/SettingsPage.tsx`
- Create: `frontend/src/pages/HelpPage.tsx`
- Test: `frontend/src/App.test.tsx`

**Interfaces:**
- Consumes: `TraceSettleAdapter` from Task 2
- Produces: eight working routes with persistent navigation and sponsor/provider primary journeys behind the fixture adapter

- [ ] **Step 1: Write route coverage test first**

Create `frontend/src/App.test.tsx` with assertions that rendering each path shows these page headings:

```ts
[
  ["/", "Settle the failed workflow"],
  ["/workflows", "Workflow inbox"],
  ["/workflows/new", "Create workflow"],
  ["/workflows/trace-1001", "Workflow room"],
  ["/workflows/trace-1001/evidence/step-build", "Submit evidence"],
  ["/credits", "Credits"],
  ["/settings", "Wallet and network"],
  ["/help", "Verification guide"]
]
```

- [ ] **Step 2: Run failing route test**

Run: `cd frontend; npm test -- --run src/App.test.tsx`

Expected before implementation: fails because app files are absent.

- [ ] **Step 3: Implement app shell and pages**

Build the app with product copy only, no raw method-list UI. Use fixture data only through `fixtureAdapter`, and label the app as needing a deployed contract when `VITE_CONTRACT_ADDRESS` is missing.

- [ ] **Step 4: Run frontend checks**

Run:

```powershell
cd frontend
npm test
npm run typecheck
npm run build
```

Expected: all pass, production build creates `frontend/dist`.

- [ ] **Step 5: Commit**

Run:

```powershell
git add frontend
git commit -m "feat: build TraceSettle product frontend"
```

Expected: commit succeeds.

---

### Task 4: Phase 3B Frontend Self-Review

**Files:**
- Modify: `docs/README.md`
- Create: `docs/evidence/local/frontend-baseline.md`

**Interfaces:**
- Consumes: built frontend route map and design system
- Produces: Phase 3B baseline proof and FE-PRESERVE lock

- [ ] **Step 1: Run build proof**

Run:

```powershell
cd frontend
npm test
npm run build
```

Expected: all pass.

- [ ] **Step 2: Record baseline**

Write `docs/evidence/local/frontend-baseline.md` with command, real output summary, route list, and findings for FE-PRODUCT, FE-HONEST, FE-SURFACE, and FE-PRESERVE.

- [ ] **Step 3: Commit**

Run:

```powershell
git add docs/evidence/local/frontend-baseline.md docs/README.md
git commit -m "docs: record frontend baseline"
```

Expected: commit succeeds.

---

### Task 5: Phase 4 Full Specification

**Files:**
- Modify: `docs/README.md`

**Interfaces:**
- Consumes: Phase 3A/3B frontend controls and route map
- Produces: full contract interface, write-method safety matrix, value-destination matrix, frontend lifecycle coverage matrix, fact authentication matrix, consensus-critical field matrix, and claim-to-code matrix

- [ ] **Step 1: Complete write-method safety rows**

Rows must cover `create_workflow`, `add_step`, `activate_workflow`, `accept_step`, `submit_evidence`, `lock_evidence`, `request_review`, `retry_review`, `cancel_workflow`, and `withdraw_credit`.

- [ ] **Step 2: Complete value-destination matrix**

Rows must define source, locked state, terminal destination, retry behavior, and proof view for sponsor pool, provider bond, earned fee, fault bond distribution, refund, and withdrawable credit.

- [ ] **Step 3: Complete frontend lifecycle matrix**

Each route action from Task 3 maps to a public write/view and frontend test. Any script-only action is marked as not browser-complete in the claim wording.

- [ ] **Step 4: Verify full spec gate**

Run: `rg -n "\|  \||unfilled|blank" docs/README.md`

Expected: no missing-cell findings in required Phase 4 sections.

- [ ] **Step 5: Commit**

Run:

```powershell
git add docs/README.md
git commit -m "docs: lock TraceSettle contract specification"
```

Expected: commit succeeds.

---

### Task 6: Phase 5 Contract TDD and Implementation

**Files:**
- Create: `contracts/tracesettle.py`
- Create: `tests/direct/test_tracesettle_static.py`
- Create: `tests/direct/test_tracesettle_model.py`
- Create: `tests/direct/tracesettle_model.py`

**Interfaces:**
- Produces: one `TraceSettleContract(gl.Contract)` class
- Produces views: `get_workflow`, `get_step`, `get_attempt`, `get_credit`, `list_workflows`
- Produces writes: `create_workflow`, `add_step`, `activate_workflow`, `accept_step`, `submit_evidence`, `lock_evidence`, `request_review`, `retry_review`, `cancel_workflow`, `withdraw_credit`

- [ ] **Step 1: Write failing static guardrail tests**

Tests assert ASCII source, first line `# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }`, exactly one `gl.Contract` subclass, payable methods for value entrypoints, no `gl.eth.send_value`, and GEN constants named in comments.

- [ ] **Step 2: Write failing model tests**

Tests cover success settlement, material fault settlement, retryable unverifiable path, wrong caller, duplicate settlement, duplicate withdrawal, digest mismatch, unknown dependency, DAG cycle, and accounting sum invariant.

- [ ] **Step 3: Run failing tests**

Run: `python -m pytest tests/direct/test_tracesettle_static.py tests/direct/test_tracesettle_model.py -q`

Expected before implementation: fails because contract/model files are absent.

- [ ] **Step 4: Implement contract and deterministic model**

Implement storage records, explicit state transitions, objective evidence gates, digest mismatch handling, semantic result normalization, deterministic settlement, and idempotency-protected withdrawal. Use `gl.vm.run_nondet` for semantic review unless current local lint/runtime proves it unavailable.

- [ ] **Step 5: Run lint and direct tests**

Run:

```powershell
$env:PYTHONUTF8='1'
genvm-lint check contracts/tracesettle.py
python -m pytest tests/direct -q
```

Expected: linter passes and all direct tests pass. If `genvm-lint` is unavailable on PATH, record the exact command failure and keep static guardrails passing.

- [ ] **Step 6: Commit**

Run:

```powershell
git add contracts tests
git commit -m "feat: implement TraceSettle contract"
```

Expected: commit succeeds.

---

### Task 7: Phase 6 Project Check

**Files:**
- Modify: `package.json`
- Modify: `frontend/package.json`
- Modify: `tests/direct/**`

**Interfaces:**
- Produces: root `npm run check`

- [ ] **Step 1: Add root check script**

Root `package.json` scripts:

```json
{
  "scripts": {
    "check": "npm run check:contract && npm run check:tests && npm run check:frontend",
    "check:contract": "genvm-lint check contracts/tracesettle.py",
    "check:tests": "python -m pytest tests/direct -q",
    "check:frontend": "cd frontend && npm test && npm run build"
  }
}
```

- [ ] **Step 2: Run check**

Run: `npm run check`

Expected: all local checks pass or the unavailable local linter is recorded as the only local tooling blocker before network work.

- [ ] **Step 3: Commit**

Run:

```powershell
git add package.json frontend/package.json tests
git commit -m "test: add project check pipeline"
```

Expected: commit succeeds.

---

### Task 8: Phase 7 Frontend GenLayer Integration

**Files:**
- Modify: `frontend/src/adapters/contractAdapter.ts`
- Create: `frontend/src/adapters/wallet.ts`
- Test: `frontend/src/adapters/wallet.test.ts`
- Test: `frontend/src/adapters/contractAdapter.integration.test.ts`

**Interfaces:**
- Consumes: finalized contract interface from Task 5
- Produces: `createStudionetAdapter(provider, userAddress, contractAddress)` and EIP-6963 provider discovery

- [x] **Step 1: Write wallet and adapter tests**

Tests assert missing contract address shows honest unavailable state, EIP-6963 providers are collected, Studionet switch/add uses chain id from `studionet.id`, and role/state action visibility does not change after integration.

- [x] **Step 2: Implement integration adapter**

Use `createClient({ chain: studionet, account: userAddress })` and pass the browser wallet address string. Keep private keys out of frontend env and source.

- [x] **Step 3: Run frontend tests and build**

Run:

```powershell
cd frontend
npm test
npm run build
```

Expected: pass.

- [x] **Step 4: Commit**

Run:

```powershell
git add frontend
git commit -m "feat: wire frontend contract adapter"
```

Expected: commit succeeds.

---

### Task 9: Phase 8 Deployment Scripts and Lifecycle Evidence

**Files:**
- Create: `scripts/receipt_parser.ts`
- Create: `scripts/deploy-studionet.ts`
- Create: `scripts/lifecycle-studionet.ts`
- Create: `scripts/inspect-deployment.ts`
- Test: `tests/direct/receipt_parser.test.ts`
- Create: `docs/evidence/studionet/README.md`

**Interfaces:**
- Produces: allowlisted `deployment.json`, `lifecycle.json`, and canonical read evidence

- [ ] **Step 1: Write receipt parser tests**

Fixtures cover raw Studio `consensus_data.leader_receipt[].execution_result` and normalized SDK result shape.

- [ ] **Step 2: Implement parser and scripts**

Scripts read project `.env` first and parent `.env` second, check only presence/non-empty, never print secrets, inspect before write, and resume existing finalized deployments.

- [ ] **Step 3: Deploy and run lifecycle**

Run:

```powershell
npm run check
npm run deploy:studionet
npm run lifecycle:studionet
```

Expected: deployment and lifecycle evidence saved with `Result: SUCCESS`, canonical reads, tx hashes, explorer URLs, statuses, timestamps, and GEN-denominated value proof.

- [ ] **Step 4: Commit**

Run:

```powershell
git add scripts tests/direct docs/evidence/studionet
git commit -m "chore: add studionet deployment evidence"
```

Expected: commit succeeds.

---

### Task 10: Phases 9 and 10 Frontend Address Wiring and Language Audit

**Files:**
- Create: `frontend/.env` ignored local file
- Modify: `frontend/src/**`
- Modify: `README.md`

**Interfaces:**
- Consumes: deployed contract address from Task 9
- Produces: production frontend build bound to the deployed address

- [ ] **Step 1: Write deployed address locally**

Run: `$address = (Get-Content docs/evidence/studionet/deployment.json | ConvertFrom-Json).contract_address; Set-Content -Path frontend/.env -Value "VITE_CONTRACT_ADDRESS=$address"`

Expected: `frontend/.env` exists and remains ignored.

- [ ] **Step 2: Build**

Run: `cd frontend; npm run build`

Expected: build passes.

- [ ] **Step 3: Language audit**

Run: `rg -n "[À-ỹ]" frontend/src README.md docs/README.md`

Expected: no user-facing non-English copy.

- [ ] **Step 4: Commit public source changes**

Run:

```powershell
git add frontend/src README.md docs/README.md
git commit -m "docs: audit frontend language and address handling"
```

Expected: commit succeeds without staging `frontend/.env`.

---

### Task 11: Phases 11 to 14 Public Repo, Vercel, Live Verification

**Files:**
- Modify: `README.md`
- Modify: `.gitignore`

**Interfaces:**
- Produces: public GitHub URL, Vercel production URL, live app verification, README with verified URL and explorer address

- [ ] **Step 1: Hygiene gate**

Run:

```powershell
git rev-parse --show-toplevel
git status --short
git diff --check
git diff --cached --name-only
git ls-files
```

Expected: toplevel is `D:/Genlayer Project/tracesettle`; staged list contains only public deliverables; no ignored secrets are tracked.

- [ ] **Step 2: Publish public GitHub repo**

Use the authenticated GitHub CLI if available:

```powershell
gh repo create tracesettle-genlayer --public --source . --remote origin --description "TraceSettle settles multi-provider agent workflows with GenLayer semantic consensus." --push
```

Expected: public repo exists and `main` is pushed without force.

- [ ] **Step 3: Deploy Vercel production**

Run:

```powershell
vercel --prod --cwd frontend --name tracesettle-genlayer
```

Expected: production URL resolves.

- [ ] **Step 4: Verify live app**

Run:

```powershell
curl.exe -I https://tracesettle-genlayer.vercel.app
curl.exe -s https://tracesettle-genlayer.vercel.app
```

Expected: HTTP 200, body contains `TraceSettle` and `id="root"`.

- [ ] **Step 5: Final README push**

Run:

```powershell
git add README.md
git commit -m "docs: add live deployment details"
git push origin main
```

Expected: push succeeds.

---

### Task 12: Phases 15 and 16 Submission Audit, Objective Gate, Final Reread

**Files:**
- Modify: `docs/README.md`
- Modify: `D:\Genlayer Project\docs\IDEA-REGISTRY.md`
- Create: `docs/POSTMORTEM.md`
- Create: `docs/evidence/studionet/submission-audit.md`

**Interfaces:**
- Produces: copy-ready Builders packet, exact final report format, registry outcome, postmortem, and objective no-blocker proof

- [ ] **Step 1: Four-source audit**

Cross-check contract source, current test output, network evidence, and README/frontend claims. Remove or narrow any claim without method/view/test/evidence.

- [ ] **Step 2: Objective acceptance command**

Find the workspace command that accepts `-Project` and `-Category`:

```powershell
rg -n "NO BLOCKER|Project.*Category|-Category" "D:\Genlayer Project"
```

Run the discovered command with `-Project tracesettle -Category projects`.

Expected: output contains `NO BLOCKER`.

- [ ] **Step 3: Submission packet**

Write copy-ready fields with category Projects, title TraceSettle, verified repository, live app, contract explorer, lifecycle evidence, exact contract/test counts, and honest limitations.

- [ ] **Step 4: Registry and postmortem**

Update root `docs/IDEA-REGISTRY.md` with TraceSettle status/outcome and next milestone headroom. Add `docs/POSTMORTEM.md` with validated vs pending evidence and any gate lessons.

- [ ] **Step 5: Final reread**

Run:

```powershell
Get-Content -Raw "D:\Genlayer Project\MASTER-PROMPT-GENLAYER-END-TO-END.md"
```

Confirm every master-prompt phase, 14 gates, FE-PRESERVE, FE-HONEST, FE-SURFACE, and FE-PRODUCT item is complete with proof, or list uncertainty instead of guessing.

- [ ] **Step 6: Commit and final report**

Run:

```powershell
git add docs README.md
git commit -m "docs: add submission audit and postmortem"
git push origin main
```

Expected: push succeeds and final response includes the exact master report format.

---

## Self-Review

- Spec coverage: Tasks 1 to 4 cover Phase 3A/3B and the approved frontend rethink; Task 5 covers Phase 4; Tasks 6 to 7 cover Phases 5 and 6; Task 8 covers Phase 7; Task 9 covers Phase 8; Task 10 covers Phases 9 and 10; Task 11 covers Phases 11 to 14; Task 12 covers Phases 15, 16, objective acceptance, and final reread.
- Type consistency: frontend adapter names, route names, contract write/view names, and canonical states match the approved design spec.
- Execution mode: Inline Execution is selected because the user explicitly required no frontend handoff and no other agent.
