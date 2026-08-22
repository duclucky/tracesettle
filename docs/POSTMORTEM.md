# TraceSettle postmortem

## Validated

- The idea passed all 14 mandatory gates and has milestone headroom.
- One project child repo exists with its own Git history and public GitHub remote.
- The frontend was designed with `ui-ux-design-pro`, built in this run, and preserved through later integration.
- The contract source is ASCII, has the required header, imports `from genlayer import *`, and contains exactly one validator-visible `gl.Contract` subclass.
- `npm run check` passes contract lint, direct tests, deployment parser tests, frontend tests, and production build.
- Local provenance remediation now treats provider artifact text as untrusted input and rejects missing or mismatched provenance binding before settlement.
- Provenance-gate Studionet deployment finalized with `SUCCESS` at `0xC125348c60768552Aa51D9E8d00a59e326958a17`.
- Script-signed Studionet lifecycle settled workflow `trace-live-20260822-a` with verdict `SUCCESS`, consequence `PAY_ALL`, and provider credit withdrawn to `0 GEN`.
- Chrome read-only smoke on production shows the remediated contract address, `/genlayer-rpc`, EVM wallet RPC, and zero console errors.
- Vercel production deployment `dpl_3TyT3wxgV3UafeC6NXo4atiA5zhk` is live and configured with the remediated contract address.

## Pending / not claimed

- Demo video is pending.
- Portal submission and Portal acceptance are not claimed.
- External adoption is not claimed.
- CI is not claimed.
- Fresh remediated-contract browser-wallet writes are not claimed until a new user-signed browser lifecycle is run.

## Lessons

- GenLayer address calldata in `genlayer-js` required explicit `CalldataAddress` wrapping for `Address` arguments.
- Studionet finalization can surface transient SDK/RPC notices while the transaction still reaches finalized state; scripts must inspect canonical receipts/state instead of treating one message as final truth.
- Allowlisted evidence files are necessary because full Studio receipts/stdout can contain validator configuration and must not be stored or published.
- Root-step dependency encoding should avoid an empty string at the calldata boundary; TraceSettle uses `none` for the root dependency marker.
- Digest stability is not provenance or truth. Provider-controlled artifact text must be isolated as untrusted input, bound to the canonical objective and provider transaction, and blocked from payout unless provenance checks pass first.

## Next milestone headroom

Build an authenticated A2A gateway integration that emits versioned, origin-signed task/artifact receipts and a router consumer that reads finalized TraceSettle state to reroute failed work. This is a substantial integration and new enforcement boundary, not a cosmetic milestone.
