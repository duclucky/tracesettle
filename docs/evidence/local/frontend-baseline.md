# Frontend Baseline Evidence

**Date:** 2026-08-12

**Phase:** 3B frontend self-review

**Commit under review:** `3bec780`

## Commands and Output

Command:

```powershell
cd D:\Genlayer Project\tracesettle\frontend
npm test
npm run build
```

Observed output:

```text
Test Files  2 passed (2)
Tests       12 passed (12)
vite v8.2.1 building client environment for production...
✓ 4580 modules transformed.
dist/index.html                   0.39 kB | gzip:  0.26 kB
dist/assets/index-BNwsVi9-.css    6.05 kB | gzip:  1.87 kB
dist/assets/index-DvyLDZns.js   281.00 kB | gzip: 86.74 kB
✓ built in 411ms
```

## Route Map Built

- `/` - Entry and role selection
- `/workflows` - Workflow inbox
- `/workflows/new` - Sponsor setup flow
- `/workflows/:id` - Workflow room
- `/workflows/:id/evidence/:stepId` - Provider evidence submission
- `/credits` - Credits and withdrawal
- `/settings` - Wallet and network
- `/help` - Verification guide

## FE-PRODUCT Review

The frontend is a multi-route product with persistent navigation, role entry,
workflow inbox, sponsor setup, workflow room, provider evidence submission,
credits, settings, and help. It is not a single screen, method list, or contract
explorer.

## FE-HONEST Review

The frontend does not simulate wallet signatures, balances, gas, fees, or
finality. Fixture data is isolated in `src/domain/fixtures.ts` and the UI states
that a deployed contract address is still missing when `VITE_CONTRACT_ADDRESS`
is absent.

## FE-SURFACE Review

Primary screens show objective, role, user-facing status, GEN amounts, next
legal action, step promises, evidence entry, withdrawal credit, and recoverable
configuration states. Raw attempt IDs, validator internals, and storage details
are not primary UI.

## FE-PRESERVE Lock

Future frontend work must preserve the established light operations theme,
nav model, route map, compact workflow rows, 8px radius system, Phosphor icon
family, status language, and disclosure pattern. Phase 7 may wire real
`genlayer-js` reads and wallet writes through the adapter boundary but must not
redesign the product.

## Evidence Boundary

This is local frontend evidence only. It is not Studionet deployment evidence,
browser-wallet write evidence, Vercel evidence, or Portal submission evidence.
