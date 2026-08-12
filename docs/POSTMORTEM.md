# TraceSettle postmortem

## Validated

- The idea passed all 14 mandatory gates and has milestone headroom.
- One project child repo exists with its own Git history and public GitHub remote.
- The frontend was designed with `ui-ux-design-pro`, built in this run, and preserved through later integration.
- The contract source is ASCII, has the required header, imports `from genlayer import *`, and contains exactly one validator-visible `gl.Contract` subclass.
- `npm run check` passes contract lint, direct tests, deployment parser tests, frontend tests, and production build.
- Studionet deployment finalized with `SUCCESS` at `0xd2224146ccFbe1BD700d36F53B0ff1b7B4Fe5313`.
- Script-signed Studionet lifecycle settled workflow `trace-live-20260812-c` with verdict `SUCCESS`, consequence `PAY_ALL`, and provider credit withdrawn to `0 GEN`.
- Chrome browser-wallet lifecycle settled workflow `trace-live-20260812-a`, used real user-approved wallet transactions, and withdrew browser-read credit to `0 GEN`.
- Vercel production deployment `dpl_2LiFnyrKUTfBYRL5v6kapSCBY5K1` is live and configured with the deployed contract address.

## Pending / not claimed

- Demo video is pending.
- Portal submission and Portal acceptance are not claimed.
- External adoption is not claimed.
- CI is not claimed.

## Lessons

- GenLayer address calldata in `genlayer-js` required explicit `CalldataAddress` wrapping for `Address` arguments.
- Studionet finalization can surface transient SDK/RPC notices while the transaction still reaches finalized state; scripts must inspect canonical receipts/state instead of treating one message as final truth.
- Allowlisted evidence files are necessary because full Studio receipts/stdout can contain validator configuration and must not be stored or published.
- Root-step dependency encoding should avoid an empty string at the calldata boundary; TraceSettle uses `none` for the root dependency marker.

## Next milestone headroom

Build an authenticated A2A gateway integration that emits versioned, origin-signed task/artifact receipts and a router consumer that reads finalized TraceSettle state to reroute failed work. This is a substantial integration and new enforcement boundary, not a cosmetic milestone.
