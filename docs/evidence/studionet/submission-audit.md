# Submission audit

Captured: 2026-08-22

## Four-source audit

1. Contract source: `contracts/tracesettle.py`
   - One validator-visible `TraceSettleContract(gl.Contract)` class.
   - ASCII source with correct `Depends` header.
   - Uses `gl.vm.run_nondet` with a custom validator that compares consensus-critical meaning.
   - Recomputes stored evidence digests from fetched rendered text before consequence.
   - Treats artifact text as untrusted provider-controlled input and verifies a provenance envelope before settlement.
   - Value entrypoints are GEN-denominated in user-facing docs and base-unit exact internally.

2. Current tests/checks:
   - `npm run check`: PASS.
   - `genvm-lint check`: PASS, `TraceSettleContract`, 16 methods.
   - Direct tests: 20 passed.
   - Deployment parser tests: 3 passed.
   - Frontend tests: 59 passed.
   - Frontend production build: PASS.

3. Network evidence:
   - Studionet deployment: `docs/evidence/studionet/deployment.json`.
   - Contract: `0xC125348c60768552Aa51D9E8d00a59e326958a17`.
   - Deploy tx: `0x4bfd7a61a876859ea562eaa7f939bd300d054571c0e1ff0b799527cb8a627b38`.
   - Deployment status/result: `FINALIZED`, `MAJORITY_AGREE`, `SUCCESS`.
   - Script-signed lifecycle: `trace-live-20260822-a`, `SETTLED`, verdict `SUCCESS`, consequence `PAY_ALL`.
   - Script-signed provider credit: `4 GEN` before withdrawal, `0 GEN` after withdrawal.

4. README/docs/frontend claims:
   - Public repo URL verified and pushed: https://github.com/duclucky/tracesettle-genlayer.
   - Vercel production URL verified HTTP 200: https://tracesettle-genlayer.vercel.app.
   - Production JS contains the deployed contract address.
   - Same-origin `/genlayer-rpc` production POST returned JSON-RPC 200.

## Objective gate command

Command:

```powershell
& 'D:\Genlayer Project\tools\genlayer-grading-bot\genlayer-precheck.ps1' -Project 'D:\Genlayer Project\tracesettle' -Category projects -RepoUrl 'https://github.com/duclucky/tracesettle-genlayer' -ExplorerUrl 'https://explorer-studio.genlayer.com/address/0xC125348c60768552Aa51D9E8d00a59e326958a17'
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
- No CI workflow is claimed.
- No demo video is claimed.
- No Portal submission confirmation is claimed.
- Fresh remediated-contract browser-wallet writes are not claimed yet.
