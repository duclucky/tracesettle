# TraceSettle

Settle the failed workflow, not the loudest accusation.

TraceSettle is a GenLayer Projects-track application for multi-provider
workflow settlement. A sponsor funds a bounded workflow in GEN, assigned
providers post 1 GEN bonds and submit public artifact evidence, and one
Intelligent Contract asks validators to classify step satisfaction, root cause,
coverage, and the deterministic settlement consequence.

## Why GenLayer is required

A normal database or backend LLM could store workflow steps, but it would leave
one coordinator in control of blame and payout. TraceSettle puts the disputed
semantic question inside a GenLayer Intelligent Contract: validators
independently fetch the locked evidence, recompute the submitted digest, agree
on the meaning of the artifact set, and only then apply the settlement rule.

Validators inspect:

- the locked workflow objective, step promises, dependency graph, and assigned
  provider wallets;
- public HTTPS artifact URLs and SHA-256 digests submitted by the provider
  wallet before evidence lock;
- whether each step is satisfied, materially faulty, downstream-blocked, or
  unverifiable;
- the exact root-cause step set, source coverage, verdict, and deterministic
  consequence class.

The finalized consequence opens canonical GEN credits, refunds, bond returns,
or forfeitures exactly once. The frontend then reloads canonical contract state
instead of treating wallet submission as success.

## Verified status

- Category: Projects
- Repository: https://github.com/duclucky/tracesettle-genlayer
- Live app: https://tracesettle-genlayer.vercel.app
- Network: Studionet
- Contract: `0xd2224146ccFbe1BD700d36F53B0ff1b7B4Fe5313`
- Explorer: https://explorer-studio.genlayer.com/address/0xd2224146ccFbe1BD700d36F53B0ff1b7B4Fe5313
- Deploy tx: `0x0f49064274dbfaf652dfca59fb70769d0261566dcb3788c21cc882d850308f5d`
- Deployment: `FINALIZED`, `MAJORITY_AGREE`, `SUCCESS`
- Lifecycle workflow: `trace-live-20260812-c`
- Lifecycle result: `SUCCESS`
- Final verdict: `SUCCESS`
- Provider credit: `4 GEN` before withdrawal, `0 GEN` after withdrawal
- Browser-wallet workflow: `trace-live-20260812-a`
- Browser-wallet result: `SETTLED`, credit after withdrawal `0 GEN`
- Current local check: 1 contract, 11 direct tests, 3 deployment parser tests,
  54 frontend tests, production build passing

See:

- `docs/README.md` for the full specification and gate evidence.
- `docs/evidence/studionet/deployment.json` for allowlisted deployment proof.
- `docs/evidence/studionet/lifecycle.json` for allowlisted lifecycle proof.
- `docs/evidence/studionet/frontend-live.json` for public frontend deployment proof.
- `docs/evidence/studionet/browser-wallet-lifecycle.json` for Chrome
  browser-wallet lifecycle proof.
- `docs/SUBMISSION.md` for copy-ready Builders submission text.

## Product surface

The Vercel app is a full Projects-track dApp, not a contract explorer. It
includes:

- entry and role selection;
- workflow inbox and detail pages;
- sponsor workflow setup;
- provider evidence submission;
- canonical credit read and withdrawal;
- wallet/network settings;
- help and verification guidance.

The browser client uses `genlayer-js`, an injected EIP-1193 wallet, Studionet,
and the deployed contract address. It does not simulate wallet signatures,
balances, gas, fees, transactions, finality, or canonical contract state.

## Build and verify

```powershell
npm install
cd frontend
npm install
cd ..
npm run check
```

`npm run check` runs:

- `genvm-lint check` against `contracts/tracesettle.py`
- direct Python tests
- deployment receipt parser tests
- frontend Vitest tests
- production frontend build

## Frontend configuration

The frontend reads `VITE_CONTRACT_ADDRESS`. Local development can copy
`frontend/.env.example` to `frontend/.env`.

Only public `VITE_*` values belong in frontend env files. Private keys must stay
in ignored project or parent `.env` files for deployment/lifecycle scripts.

## Studionet deployment and lifecycle

Deployment and lifecycle scripts are resumable and save only allowlisted public
evidence:

```powershell
npm run inspect:deployment
npm run deploy:studionet
npm run lifecycle:studionet
```

The scripts discover ignored local secrets from project `.env` first, then the
authorized parent workspace `.env`, and never print private key values.

## Honest limits

This repository proves local checks, Studionet deployment, script-signed
Studionet lifecycle evidence, Chrome browser-wallet lifecycle evidence, public
repository availability, and production frontend availability. It does not
claim legal arbitration, private evidence support, offchain execution proof,
Portal acceptance, CI, demo video, or external adoption.

## Copy-ready submission

**Recommended category:** Projects

**Title:** TraceSettle

**Description:**

TraceSettle is a Studionet dApp for evidence-based settlement of multi-provider AI workflows. A sponsor funds 2 GEN, providers post 1 GEN bonds and submit public artifact evidence. The Intelligent Contract fetches locked evidence, recomputes digests, asks validators to classify step satisfaction/root cause/coverage, and deterministically opens GEN credits/refunds/withdrawals. Verified: one TraceSettleContract, 11 direct tests, 3 deployment parser tests, 54 frontend tests, npm run check passing, contract deployment SUCCESS on Studionet, script-signed lifecycle settled SUCCESS and withdrew provider credit to 0 GEN, Chrome browser-wallet lifecycle settled SUCCESS and withdrew credit to 0 GEN, public GitHub repo, and Vercel production app. Limitations: demo video, CI, Portal acceptance, external adoption, private evidence, and legal arbitration are not claimed.

**Short report:**

```text
Project name: TraceSettle
Description: TraceSettle settles multi-provider workflow failures with validator judgment and GEN consequences that a normal database cannot neutrally enforce.
GitHub (public): https://github.com/duclucky/tracesettle-genlayer
Live app: https://tracesettle-genlayer.vercel.app
Contract (studionet): 0xd2224146ccFbe1BD700d36F53B0ff1b7B4Fe5313
```
