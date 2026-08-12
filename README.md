# TraceSettle

Settle the failed workflow, not the loudest accusation.

TraceSettle is a GenLayer Projects-track application for multi-provider
workflow settlement. A sponsor funds a bounded workflow in GEN, assigned
providers post 1 GEN bonds and submit public artifact evidence, and one
Intelligent Contract asks validators to classify step satisfaction, root cause,
coverage, and the deterministic settlement consequence.

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

See:

- `docs/README.md` for the full specification and gate evidence.
- `docs/evidence/studionet/deployment.json` for allowlisted deployment proof.
- `docs/evidence/studionet/lifecycle.json` for allowlisted lifecycle proof.
- `docs/evidence/studionet/frontend-live.json` for public frontend deployment proof.

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
Studionet lifecycle evidence, public repository availability, and production
frontend availability. It does not claim legal arbitration, private evidence
support, offchain execution proof, browser-wallet write evidence, Portal
acceptance, or external adoption.
