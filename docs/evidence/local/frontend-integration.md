# Frontend integration evidence

Date: 2026-08-12

Scope: Phase 7 local frontend integration. This is not Studionet browser-wallet proof.

## Implemented

- Runtime config rejects missing or malformed `VITE_CONTRACT_ADDRESS` and keeps the UI in preview mode.
- Browser wallet detection uses an injected EIP-1193 provider at action time; no fixture account is shown as connected.
- Live action controls lazy-load the GenLayer SDK only when a user initiates an action.
- `create_workflow` sends exactly 2 GEN, `accept_step` sends exactly 1 GEN, and all write actions wait for `FINALIZED` before claiming canonical reload.
- Fixture data remains local preview data and is labeled as such.

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

✓ Lint passed (3 checks)
✓ Validation passed
  Contract: TraceSettleContract
  Methods: 15 (5 view, 10 write)
  ℹ py-genlayer: a newer runner is available (9b8kjyda2ycxyq4ea6g4yfpnydxhd52gqba5rb8dw7krkh5mn9p0). See https://github.com/genlayerlabs/genvm/releases for changes.

> tracesettle@0.1.0 check:tests
> .venv\Scripts\python.exe -m pytest tests/direct -q

..........                                                               [100%]
10 passed in 0.04s

> tracesettle@0.1.0 check:frontend
> cd frontend && npm test && npm run build

> tracesettle-frontend@0.1.0 test
> vitest run

 Test Files  5 passed (5)
      Tests  26 passed (26)

> tracesettle-frontend@0.1.0 build
> tsc --noEmit && vite build

✓ built in 442ms
```

## Honest limits

- This evidence proves local TypeScript, unit/component behavior, SDK wiring, and production build.
- It does not prove a deployed Studionet browser transaction, accepted verdict, finalized verdict, wallet balance, or Explorer state.
