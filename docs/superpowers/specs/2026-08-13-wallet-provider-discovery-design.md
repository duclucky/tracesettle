# Wallet Provider Discovery Fix

## Objective

Make TraceSettle detect modern EVM browser wallets reliably without changing the existing information architecture or visual system. The wallet status must never repeat the same message after the user presses Connect wallet.

## Confirmed failure

The production page currently reads only `window.ethereum` once during the first render. This misses providers announced later through EIP-6963 and provider objects exposed under wallet-specific globals. `WalletStatus` also renders the detection label and the click error independently, which produces two identical `No browser wallet detected` messages.

## Chosen approach

Use EIP-6963 discovery with legacy fallbacks. Do not add a wallet modal dependency.

Provider priority is:

1. A valid `window.ethereum` EIP-1193 provider, preserving the browser's active provider choice.
2. A valid provider announced through `eip6963:announceProvider` after the app dispatches `eip6963:requestProvider`.
3. A valid provider in `window.ethereum.providers`.
4. Valid wallet-specific EIP-1193 providers exposed by OKX, Phantom, Rabby, or Coinbase.

Every candidate must expose a callable `request` method. Invalid objects are ignored. No wallet state, signature, balance, gas estimate, or transaction finality is simulated or persisted locally.

## Components and data flow

The wallet adapter will provide one asynchronous discovery function. It performs the immediate legacy scan, requests EIP-6963 announcements for a short bounded interval, then performs a final fallback scan. It returns the existing available or missing result shape plus an honest display label.

`WalletStatus`, `LiveTraceSettleAction`, and `CreditsPage` will call the same discovery function. Action handlers rediscover at click time so a wallet injected after page load can be used without a full reload.

`WalletStatus` will render exactly one live status message. Initial discovery, missing-provider feedback, wallet rejection, request failure, and connection success all update this single message. The address remains the canonical connected display when an account is returned.

## Error handling

- No provider: show one `No browser wallet detected` message and submit no transaction.
- Invalid provider candidate: ignore it and continue discovery.
- Wallet returns no account: show `Wallet did not return an account` and submit no transaction.
- User rejection or provider error: show the provider error once in the live status region.
- No contract configuration: preserve the existing honest configuration blocker.

## Accessibility and UI constraints

This is a targeted evolution of the existing trust-first B2B interface. Routes, navigation labels, palette, typography, spacing, and control placement remain unchanged. The status message uses an `aria-live` region so asynchronous changes are announced. The Connect wallet button remains keyboard accessible and its label does not change.

## Test strategy

Tests must fail before production code changes and then prove:

1. Existing `window.ethereum` discovery still works.
2. EIP-6963 announcements are discovered.
3. Multi-provider and wallet-specific fallbacks are discovered.
4. Invalid candidates are rejected.
5. Pressing Connect wallet with no provider leaves exactly one missing-wallet message.
6. Existing route and transaction-state tests remain green.
7. `npm run check` passes, including contract lint, direct tests, frontend TypeScript, frontend tests, and production build.
8. The deployed site is rechecked in the user's real Chrome. Wallet approval or signing is left to the user.

## Scope boundary

This fix does not add wallet selection UI, change contract behavior, change GEN amounts, or claim that an extension is available when the controlled Chrome tab did not receive an injected provider. A future milestone may add explicit multi-wallet selection if real usage demonstrates that need.
