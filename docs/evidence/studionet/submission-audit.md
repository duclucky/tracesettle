# Submission audit

Captured: 2026-08-12

## Four-source audit

1. Contract source: `contracts/tracesettle.py`
   - One validator-visible `TraceSettleContract(gl.Contract)` class.
   - ASCII source with correct `Depends` header.
   - Uses `gl.vm.run_nondet` with a custom validator that compares consensus-critical meaning.
   - Recomputes stored evidence digests from fetched rendered text before consequence.
   - Value entrypoints are GEN-denominated in user-facing docs and base-unit exact internally.

2. Current tests/checks:
   - `npm run check`: PASS.
   - `genvm-lint check`: PASS, `TraceSettleContract`, 16 methods.
   - Direct tests: 11 passed.
   - Deployment parser tests: 2 passed.
   - Frontend tests: 26 passed.
   - Frontend production build: PASS.

3. Network evidence:
   - Studionet deployment: `docs/evidence/studionet/deployment.json`.
   - Contract: `0xd2224146ccFbe1BD700d36F53B0ff1b7B4Fe5313`.
   - Deploy tx: `0x0f49064274dbfaf652dfca59fb70769d0261566dcb3788c21cc882d850308f5d`.
   - Deployment status/result: `FINALIZED`, `MAJORITY_AGREE`, `SUCCESS`.
   - Lifecycle: `trace-live-20260812-c`, `SETTLED`, verdict `SUCCESS`, consequence `PAY_ALL`.
   - Provider credit: `4 GEN` before withdrawal, `0 GEN` after withdrawal.

4. README/docs/frontend claims:
   - Public repo URL verified and pushed: https://github.com/duclucky/tracesettle-genlayer.
   - Vercel production URL verified HTTP 200: https://tracesettle-genlayer.vercel.app.
   - Production JS contains the deployed contract address.
   - Browser-wallet lifecycle proof remains explicitly pending and is not claimed.

## Objective gate command

Command:

```powershell
& 'D:\Genlayer Project\tools\genlayer-grading-bot\genlayer-precheck.ps1' -Project 'D:\Genlayer Project\tracesettle' -Category projects -RepoUrl 'https://github.com/duclucky/tracesettle-genlayer' -ExplorerUrl 'https://explorer-studio.genlayer.com/address/0xd2224146ccFbe1BD700d36F53B0ff1b7B4Fe5313'
```

Real output excerpt:

```text
Summary: 0 BLOCKER, 1 WARN, 3 auto-verified OK
GATE:
  [PASS] real GenLayer contract present
  [PASS] uses consensus (not deterministic-only / not fake off-chain)
  [PASS] not a renamed boilerplate / empty fork
  [PASS] repository builds & tests pass
  [PASS] frontend actually calls the contract (not branding-only)
Rubric section estimate: 19/20
```

Literal acceptance check command:

```powershell
$project = 'D:\Genlayer Project\tracesettle'; $report = Get-Content (Join-Path $project 'precheck-report.json') -Raw | ConvertFrom-Json; if ($report.counts.BLOCKER -eq 0) { 'NO BLOCKER - Project tracesettle - Category projects' } else { 'BLOCKER - Project tracesettle - Category projects'; $report.findings | Where-Object { $_.sev -eq 'BLOCKER' } | ConvertTo-Json -Depth 4 }
```

Real output:

```text
NO BLOCKER - Project tracesettle - Category projects
```

## Warnings and pending proof

- Static precheck warning: class name is `TraceSettleContract`; workspace policy prefers a project-specific class and `genvm-lint` recognizes it, so this is not treated as a blocker.
- Browser control in this Codex session failed with `failed to write kernel assets`; no browser-wallet lifecycle proof is claimed.
- No CI workflow is claimed.
- No Portal submission confirmation is claimed.
