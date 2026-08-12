# Contract hardening evidence

Date: 2026-08-12

Scope: Phase 5 hardening before Studionet deployment. This is local lint/test/build evidence only.

## Implemented

- `request_review` now fetches evidence inside the nondeterministic path using a precomputed `fetch_plan` closure rather than reading storage inside `leader_fn`.
- Rendered evidence text is hashed and compared with the stored `sha256:` digest before semantic judgment.
- Digest mismatch returns non-penalizing `UNVERIFIABLE`/`RETRYABLE` behavior.
- Validator comparison covers verdict, coverage, class map, and root set; free-text reason remains non-critical.
- Deterministic settlement now handles `SUCCESS`, `MATERIAL_FAILURE`, `SATISFIED`, `MATERIAL_FAULT`, and `DOWNSTREAM_BLOCKED`.
- Cancellation now credits both sponsor pool and accepted provider bonds before closing.

## Proof

Command:

```powershell
npm run check
```

Output:

```text
> tracesettle@0.1.0 check
> npm run check:contract && npm run check:tests && npm run check:frontend

> tracesettle@0.1.0 check:contract
> set PYTHONUTF8=1&& .venv\Scripts\genvm-lint.exe check contracts/tracesettle.py

[pass] Lint passed (3 checks)
[pass] Validation passed
  Contract: TraceSettleContract
  Methods: 16 (6 view, 10 write)

> tracesettle@0.1.0 check:tests
> .venv\Scripts\python.exe -m pytest tests/direct -q

...........                                                              [100%]
11 passed in 0.05s

> tracesettle@0.1.0 check:frontend
> cd frontend && npm test && npm run build

 Test Files  5 passed (5)
      Tests  26 passed (26)

[pass] frontend production build completed
```

## Honest limits

- This does not prove Studionet nondeterministic consensus, live web rendering stability, browser-wallet signing, Explorer finality, or transfer receipt/balance evidence.
