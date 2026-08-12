# Builders submission packet

## Copy-ready fields

Recommended category: Projects

Title: TraceSettle

Notes / Description (869 chars):

TraceSettle is a Studionet dApp for evidence-based settlement of multi-provider AI workflows. A sponsor funds 2 GEN, providers post 1 GEN bonds and submit public artifact evidence. The Intelligent Contract fetches locked evidence, recomputes digests, asks validators to classify step satisfaction/root cause/coverage, and deterministically opens GEN credits/refunds/withdrawals. Verified: one TraceSettleContract, 11 direct tests, 3 deployment parser tests, 54 frontend tests, npm run check passing, contract deployment SUCCESS on Studionet, script-signed lifecycle settled SUCCESS and withdrew provider credit to 0 GEN, Chrome browser-wallet lifecycle settled SUCCESS and withdrew credit to 0 GEN, public GitHub repo, and Vercel production app. Limitations: demo video, CI, Portal acceptance, external adoption, private evidence, and legal arbitration are not claimed.

## Evidence

- Repository: https://github.com/duclucky/tracesettle-genlayer
- Primary contract explorer: https://explorer-studio.genlayer.com/address/0xd2224146ccFbe1BD700d36F53B0ff1b7B4Fe5313
- Consumer/integration explorer: N/A; no separate consumer contract exists.
- Lifecycle evidence: `docs/evidence/studionet/lifecycle.json`
- Deployment evidence: `docs/evidence/studionet/deployment.json`
- Live app: https://tracesettle-genlayer.vercel.app
- Live frontend evidence: `docs/evidence/studionet/frontend-live.json`
- Browser-wallet lifecycle evidence: `docs/evidence/studionet/browser-wallet-lifecycle.json`
- Successful CI: N/A; no GitHub Actions workflow is claimed. Local `npm run check` passes.

## Verified facts

- Contracts: 1 (`TraceSettleContract`)
- Contract methods: 16 (6 view, 10 write)
- Direct tests: 11 passed
- Deployment parser tests: 3 passed
- Frontend tests: 54 passed
- Network: Studionet
- Deployed contract: `0xd2224146ccFbe1BD700d36F53B0ff1b7B4Fe5313`
- Deploy tx: `0x0f49064274dbfaf652dfca59fb70769d0261566dcb3788c21cc882d850308f5d`
- Lifecycle workflow: `trace-live-20260812-c`
- Lifecycle result: `SUCCESS`
- Final workflow status: `SETTLED`
- Final verdict: `SUCCESS`
- Consequence class: `PAY_ALL`
- Provider credit before withdrawal: `4 GEN`
- Provider credit after withdrawal: `0 GEN`
- Browser-wallet workflow: `trace-live-20260812-a`
- Browser-wallet final workflow status: `SETTLED`
- Browser-wallet credit after withdrawal: `0 GEN`

## Honest limitations / pending

- Demo video is pending.
- Portal submission and Portal acceptance are not claimed.
- External adoption is not claimed.
- Private evidence, legal arbitration, insurance, and non-Studionet networks are out of scope.

## Why this category

TraceSettle is a Projects submission because the contribution is a wallet-enabled product around a reusable Intelligent Contract, not a standalone contract artifact. The frontend provides a multi-page sponsor/provider workflow, canonical contract reads, wallet-gated writes, transaction lifecycle states, and honest missing-proof labels. The core value remains the GenLayer contract: validators settle semantic multi-provider workflow responsibility and the finalized result opens deterministic GEN credits.

## Required short report

**Project name:** TraceSettle

**Description:** TraceSettle settles multi-provider workflow failures with validator judgment and GEN consequences that a normal database cannot neutrally enforce.

**GitHub (public):** https://github.com/duclucky/tracesettle-genlayer

**Live app:** https://tracesettle-genlayer.vercel.app

**Contract (studionet):** 0xd2224146ccFbe1BD700d36F53B0ff1b7B4Fe5313
