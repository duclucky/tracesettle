# Builders submission packet

## Copy-ready fields

Recommended category: Projects

Title: TraceSettle

Notes / Description (981 chars):

TraceSettle is a Studionet dApp for evidence-based settlement of multi-provider AI workflows. A sponsor funds 2 GEN, providers post 1 GEN bonds and submit public artifact evidence. The Intelligent Contract fetches locked evidence, recomputes digests, enforces coverage/root/class invariants before any settlement credit, asks validators to classify satisfaction/root cause/coverage, and opens deterministic GEN credits/refunds/withdrawals. Verified: one TraceSettleContract, 14 direct tests, 3 deployment/config tests, 59 frontend tests, npm run check passing, remediated contract deployment SUCCESS on Studionet, script-signed lifecycle settled SUCCESS and withdrew provider credit to 0 GEN, EVM wallet RPC + same-origin GenLayer RPC proxy configured and production-verified, public GitHub repo, and Vercel production app. Limitations: remediated browser-wallet writes, demo video, CI, Portal acceptance, external adoption, private evidence, and legal arbitration are not claimed.

## Evidence

- Repository: https://github.com/duclucky/tracesettle-genlayer
- Primary contract explorer: https://explorer-studio.genlayer.com/address/0xF6BcD69787aeef9a4a033Fa951068eFbAA8fBDe5
- Consumer/integration explorer: N/A; no separate consumer contract exists.
- Lifecycle evidence: `docs/evidence/studionet/lifecycle.json`
- Deployment evidence: `docs/evidence/studionet/deployment.json`
- Live app: https://tracesettle-genlayer.vercel.app
- Live frontend evidence: `docs/evidence/studionet/frontend-live.json`
- Browser-wallet lifecycle evidence: prior deployment only; not claimed for the remediated contract without a fresh user-signed browser run.
- Successful CI: N/A; no GitHub Actions workflow is claimed. Local `npm run check` passes.

## Verified facts

- Contracts: 1 (`TraceSettleContract`)
- Contract methods: 16 (6 view, 10 write)
- Direct tests: 14 passed
- Deployment/config tests: 3 passed
- Frontend tests: 59 passed
- Network: Studionet
- Deployed contract: `0xF6BcD69787aeef9a4a033Fa951068eFbAA8fBDe5`
- Deploy tx: `0xd05369d098c67497776a5beb6500efc3a9f60634c60203ee01593d87de5e2f9f`
- Lifecycle workflow: `trace-live-20260812-c`
- Lifecycle result: `SUCCESS`
- Final workflow status: `SETTLED`
- Final verdict: `SUCCESS`
- Consequence class: `PAY_ALL`
- Provider credit before withdrawal: `4 GEN`
- Provider credit after withdrawal: `0 GEN`
- Browser-wallet workflow: prior deployment only; not claimed as remediated-contract proof.
- Local RPC remediation: `http://127.0.0.1:5173/genlayer-rpc` returned status 200 and `{"jsonrpc":"2.0","result":"0xf22f","id":1}`.
- Production RPC remediation: `https://tracesettle-genlayer.vercel.app/genlayer-rpc` returned status 200 and `{"jsonrpc":"2.0","result":"0xf22f","id":1}`.

## Honest limitations / pending

- Remediated browser-wallet writes are pending a fresh user-signed browser lifecycle.
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

**Contract (studionet):** 0xF6BcD69787aeef9a4a033Fa951068eFbAA8fBDe5
