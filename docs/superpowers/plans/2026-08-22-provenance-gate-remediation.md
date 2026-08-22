# Provenance Gate Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent provider-controlled artifact text from influencing GEN payout unless deterministic provenance binding passes first.

**Architecture:** Extend the direct model and GenVM contract with a V1 provenance envelope gate. The nondeterministic leader fetches artifact text, recomputes the digest, verifies the envelope against locked workflow state, includes the canonical objective in the prompt, and returns `UNVERIFIABLE` before settlement if provenance fails. Documentation is updated to claim provenance binding honestly, not external truth verification.

**Tech Stack:** GenVM Python contract, direct Python model tests, pytest, genvm-lint, Vite/Vitest frontend checks through `npm run check`.

## Global Constraints

- Contract source remains ASCII with the existing Depends header and exactly one validator-visible `gl.Contract` subclass.
- All GEN amounts remain in GEN-facing docs and base units only inside contract/test constants.
- Invalid provenance must be non-penalizing: no transfer, no credit, no slash, no settlement.
- Do not redeploy, push, or click final submit in this plan.

---

### Task 1: Add failing provenance tests

**Files:**
- Modify: `D:\Genlayer Project\tracesettle\tests\direct\tracesettle_model.py`
- Modify: `D:\Genlayer Project\tracesettle\tests\direct\test_tracesettle_model.py`

**Interfaces:**
- Produces: model behavior proving missing/wrong provenance blocks settlement and preserves accounting.

- [x] **Step 1: Add model support for artifact text in tests**

Add `artifact_text: str = ""` to the `Step` dataclass and allow tests to set it through a helper.

- [x] **Step 2: Add failing tests**

Add tests named:

- `test_provider_controlled_text_without_provenance_cannot_settle`
- `test_wrong_objective_hash_provenance_cannot_settle`
- `test_canonical_objective_is_part_of_review_context`

- [x] **Step 3: Run focused tests and confirm RED**

Run: `.venv\Scripts\python.exe -m pytest tests/direct/test_tracesettle_model.py -q`

Expected: new provenance tests fail because model has no provenance gate yet.

### Task 2: Implement provenance gate in model and contract

**Files:**
- Modify: `D:\Genlayer Project\tracesettle\tests\direct\tracesettle_model.py`
- Modify: `D:\Genlayer Project\tracesettle\contracts\tracesettle.py`

**Interfaces:**
- Consumes: locked workflow objective, workflow ID, step ID, provider, digest, fetched artifact text.
- Produces: `_artifact_provenance_valid(...) -> bool` and `_objective_hash(...) -> str`.

- [x] **Step 1: Implement model provenance helpers**

Implement objective hash and envelope validation in the model. `request_review` must set `RETRYABLE` before settlement if any artifact provenance is invalid.

- [x] **Step 2: Run focused model tests and confirm GREEN**

Run: `.venv\Scripts\python.exe -m pytest tests/direct/test_tracesettle_model.py -q`

Expected: all direct model tests pass.

- [x] **Step 3: Implement contract provenance helpers**

In `contracts/tracesettle.py`, add `_objective_hash`, `_artifact_provenance_valid`, and call it in `leader_fn` after digest recomputation and before prompt construction. Include `WORKFLOW_OBJECTIVE` in `evidence_pack` and state artifact text is untrusted provider-controlled evidence in the prompt.

- [x] **Step 4: Run contract static/lint checks**

Run: `npm run check:contract`

Expected: GenVM lint passes.

### Task 3: Update documentation and full verification

**Files:**
- Modify: `D:\Genlayer Project\tracesettle\README.md`
- Modify: `D:\Genlayer Project\tracesettle\docs\README.md`
- Modify: `D:\Genlayer Project\tracesettle\docs\SUBMISSION.md`
- Modify: `D:\Genlayer Project\tracesettle\docs\POSTMORTEM.md`

**Interfaces:**
- Produces: honest submission language describing provenance binding and untrusted artifact limits.

- [x] **Step 1: Patch docs**

State that artifacts are untrusted provider-controlled text, V1 verifies provenance binding through a bounded envelope, and external truth claims require approved sources or signed attestations.

- [x] **Step 2: Run full verification**

Run: `npm run check`

Expected: contract lint, direct tests, deployment/config tests, frontend tests, and production build pass.

- [x] **Step 3: Review diff**

Run: `git status --short` and inspect changed files for secrets, stale deployment claims, and overclaims.
