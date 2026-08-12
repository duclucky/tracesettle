# Wallet Provider Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Detect modern EVM browser wallets through EIP-6963 and legacy injection paths while rendering only one honest wallet-status message.

**Architecture:** Keep wallet discovery inside the existing wallet adapter. Add an asynchronous EIP-6963 request/announce path with a bounded wait, preserve synchronous legacy detection, and make every frontend consumer rediscover at action time. Keep `WalletStatus` as the only visual change by replacing its independent detection/error lines with one live status line.

**Tech Stack:** React 19, TypeScript 5.9, Vitest 4, Testing Library, Vite 8, EIP-1193, EIP-6963.

## Global Constraints

- Do not add a wallet modal or another dependency.
- Do not change routes, navigation labels, palette, typography, spacing, or control placement.
- Do not simulate wallet state, signatures, balances, gas, transactions, or finality.
- Do not persist wallet state in local storage.
- Do not change contract behavior or GEN amounts.
- The user approves or signs every wallet request; automated tests must not approve or sign for the user.
- Keep a single live wallet status message and preserve honest missing-configuration blockers.

## File Structure

- Modify `frontend/src/adapters/wallet.ts`: validate candidates, scan legacy injection paths, request EIP-6963 announcements, and return one discovery result.
- Modify `frontend/src/adapters/wallet.test.ts`: cover direct, EIP-6963, multi-provider, wallet-specific, and invalid candidates.
- Modify `frontend/src/components/WalletStatus.tsx`: use asynchronous discovery and one `aria-live` status message.
- Modify `frontend/src/components/LiveTraceSettleAction.tsx`: rediscover the provider at click time before transaction creation.
- Modify `frontend/src/pages/CreditsPage.tsx`: rediscover the provider at click time before canonical reads.
- Modify `frontend/src/App.test.tsx`: prove the missing-wallet message never duplicates after Connect wallet.

---

### Task 1: EIP-6963 and legacy provider discovery

**Files:**

- Modify: `frontend/src/adapters/wallet.ts`
- Test: `frontend/src/adapters/wallet.test.ts`

**Interfaces:**

- Produces: `WalletEnvironment`, the testable browser injection surface.
- Produces: `discoverInjectedWallet(source: WalletEnvironment, announcementWaitMs?: number): Promise<WalletDetection>`.
- Preserves: `detectInjectedWallet(source: WalletEnvironment): WalletDetection` for immediate legacy detection.
- Preserves: `connectInjectedWallet(provider: Eip1193Provider): Promise<WalletConnection>`.

- [ ] **Step 1: Write failing discovery tests**

Add imports and cases equivalent to:

```ts
import {
  connectInjectedWallet,
  detectInjectedWallet,
  discoverInjectedWallet,
  shortenAddress
} from "./wallet";

it("discovers a provider announced through EIP-6963", async () => {
  const provider = { request: vi.fn() };
  const target = new EventTarget();
  target.addEventListener("eip6963:requestProvider", () => {
    target.dispatchEvent(
      new CustomEvent("eip6963:announceProvider", {
        detail: { info: { name: "OKX Wallet" }, provider }
      })
    );
  });

  await expect(discoverInjectedWallet(target, 0)).resolves.toEqual({
    status: "available",
    provider,
    label: "OKX Wallet available"
  });
});

it("uses a valid multi-provider fallback", async () => {
  const provider = { request: vi.fn() };
  await expect(
    discoverInjectedWallet({ ethereum: { providers: [{}, provider] } }, 0)
  ).resolves.toMatchObject({ status: "available", provider });
});

it("uses a wallet-specific nested EIP-1193 provider", async () => {
  const provider = { request: vi.fn() };
  await expect(
    discoverInjectedWallet({ okxwallet: { ethereum: provider } }, 0)
  ).resolves.toMatchObject({
    status: "available",
    provider,
    label: "OKX Wallet available"
  });
});

it("ignores invalid announced and legacy candidates", async () => {
  await expect(
    discoverInjectedWallet({ ethereum: {}, phantom: { ethereum: {} } }, 0)
  ).resolves.toEqual({
    status: "missing",
    provider: undefined,
    label: "No browser wallet detected"
  });
});
```

Use a structural cast only where `EventTarget` lacks the optional injection properties required by `WalletEnvironment`.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- src/adapters/wallet.test.ts`

Expected: FAIL because `discoverInjectedWallet` and `WalletEnvironment` do not exist.

- [ ] **Step 3: Implement minimal provider discovery**

In `wallet.ts`, add:

```ts
export interface WalletEnvironment {
  ethereum?: unknown;
  okxwallet?: unknown;
  phantom?: unknown;
  rabby?: unknown;
  coinbaseWalletExtension?: unknown;
  addEventListener?(type: string, listener: EventListener): void;
  removeEventListener?(type: string, listener: EventListener): void;
  dispatchEvent?(event: Event): boolean;
}

function asProvider(candidate: unknown): Eip1193Provider | undefined {
  if (
    typeof candidate === "object" &&
    candidate !== null &&
    "request" in candidate &&
    typeof candidate.request === "function"
  ) {
    return candidate as Eip1193Provider;
  }
  return undefined;
}
```

Refactor `detectInjectedWallet` to use `asProvider` and then scan `ethereum.providers`, `okxwallet`, `phantom`, `rabby`, and `coinbaseWalletExtension`, including each wallet-specific object's nested `ethereum` property. Known wallet globals return an honest wallet-specific label.

Implement `discoverInjectedWallet` so it:

1. Returns a direct valid `source.ethereum` provider immediately.
2. Registers `eip6963:announceProvider`, dispatches `eip6963:requestProvider`, and accepts the first valid announced provider.
3. Removes its listener and clears its timer on resolution.
4. After a default 100 ms bounded wait, returns `detectInjectedWallet(source)`.
5. Falls back immediately when event methods are unavailable.

The EIP-6963 detail validator must require a valid `detail.provider`; use trimmed `detail.info.name` only when it is a non-empty string, otherwise use `Browser wallet available`.

- [ ] **Step 4: Run focused adapter tests and verify GREEN**

Run: `npm test -- src/adapters/wallet.test.ts`

Expected: all wallet adapter tests PASS.

- [ ] **Step 5: Run frontend typecheck**

Run: `npm run typecheck`

Expected: PASS with no TypeScript errors.

- [ ] **Step 6: Review and commit Task 1**

Run: `git diff --check`

Review `git diff -- frontend/src/adapters/wallet.ts frontend/src/adapters/wallet.test.ts` for invalid-provider acceptance, leaked data, or unbounded waits.

Commit:

```text
git add frontend/src/adapters/wallet.ts frontend/src/adapters/wallet.test.ts
git commit -m "fix: discover injected wallet providers"
```

---

### Task 2: One live wallet status across all consumers

**Files:**

- Modify: `frontend/src/components/WalletStatus.tsx`
- Modify: `frontend/src/components/LiveTraceSettleAction.tsx`
- Modify: `frontend/src/pages/CreditsPage.tsx`
- Test: `frontend/src/App.test.tsx`

**Interfaces:**

- Consumes: `discoverInjectedWallet(source: WalletEnvironment, announcementWaitMs?: number)` from Task 1.
- Produces: one `aria-live="polite"` message in `WalletStatus`.
- Preserves: existing transaction lifecycle stages and canonical reload behavior.

- [ ] **Step 1: Write the failing duplicate-status test**

Add to `App.test.tsx`:

```ts
it("keeps one missing-wallet status after Connect wallet is pressed", async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={["/"]}>
      <AppRoutes />
    </MemoryRouter>
  );

  await user.click(screen.getByRole("button", { name: "Connect wallet" }));

  expect(screen.getAllByText("No browser wallet detected")).toHaveLength(1);
  expect(screen.getByText("No browser wallet detected")).toHaveAttribute(
    "aria-live",
    "polite"
  );
});
```

- [ ] **Step 2: Run the focused UI test and verify RED**

Run: `npm test -- src/App.test.tsx -t "keeps one missing-wallet status"`

Expected: FAIL because the current component renders two matching messages and has no live-region attribute.

- [ ] **Step 3: Implement the single-status component flow**

In `WalletStatus.tsx`:

- Import `useEffect` and `discoverInjectedWallet`.
- Build one testable `WalletEnvironment` from `window` when available.
- Initialize detection synchronously with `detectInjectedWallet` so server/test rendering remains honest.
- Run `discoverInjectedWallet` in an effect and ignore its result after unmount.
- Rediscover inside `connectWallet` so late injection works without reload.
- Store one `statusMessage`; set it to the discovery label, connection success, missing provider, empty account, or caught provider error.
- Remove the independent `detection.status === "missing"` and `error` spans.
- Render exactly one `<span aria-live="polite">{statusMessage}</span>`.

In `LiveTraceSettleAction.tsx` and `CreditsPage.tsx`, replace synchronous `detectInjectedWallet` calls with awaited `discoverInjectedWallet` calls using the same browser environment. Preserve every existing no-transaction, configuration, finality, and canonical-read message.

- [ ] **Step 4: Run the focused UI test and verify GREEN**

Run: `npm test -- src/App.test.tsx -t "keeps one missing-wallet status"`

Expected: PASS with exactly one matching status.

- [ ] **Step 5: Run all frontend tests and typecheck**

Run: `npm test`

Expected: all frontend tests PASS.

Run: `npm run typecheck`

Expected: PASS with no TypeScript errors.

- [ ] **Step 6: Review and commit Task 2**

Run: `git diff --check`

Review the four changed files for duplicate status nodes, stale provider state, unhandled promise rejection, transaction behavior changes, and accidental wallet approval logic.

Commit:

```text
git add frontend/src/components/WalletStatus.tsx frontend/src/components/LiveTraceSettleAction.tsx frontend/src/pages/CreditsPage.tsx frontend/src/App.test.tsx
git commit -m "fix: unify browser wallet status"
```

---

### Task 3: Full verification, deployment, and Chrome proof

**Files:**

- Modify only if evidence format requires it: `docs/evidence/studionet/frontend-live.json`
- Modify only if audit status changes: `docs/evidence/studionet/submission-audit.md`

**Interfaces:**

- Consumes: the completed Task 1 and Task 2 commits.
- Produces: fresh local verification output, public deployment identity, and Chrome-visible proof.

- [ ] **Step 1: Run the repository acceptance command**

Run from the repository root: `npm run check`

Expected: contract lint PASS, direct tests PASS, frontend tests PASS, frontend TypeScript PASS, and production build PASS.

- [ ] **Step 2: Run UI pre-flight checks for this scoped component**

Verify the Connect wallet control remains keyboard focusable, the status uses one `aria-live` node, text does not wrap or duplicate at desktop, the existing theme/accent/radius locks are unchanged, and no new animation, icon, dependency, em dash, fake value, or simulated state was introduced.

- [ ] **Step 3: Run public-repository hygiene before push**

Run and inspect:

```text
git rev-parse --show-toplevel
git status --short
git diff origin/main...HEAD --name-only
git ls-files
git check-ignore -v frontend/.env cli-diag.log
```

Confirm the top level is `D:/Genlayer Project/tracesettle`, only intended public files changed, ignored secret/log files remain ignored, and no `.env`, key, wallet export, root control file, or internal knowledge file is tracked.

- [ ] **Step 4: Push the verified commits**

Run: `git push origin main`

Expected: remote `main` advances to local `HEAD` without rejected updates.

- [ ] **Step 5: Wait for and verify the production deployment**

Open `https://tracesettle-genlayer.vercel.app/` and confirm the served frontend contains the new single-status behavior. If the connected tab still has no provider, report that environmental state honestly; do not claim wallet connection proof.

- [ ] **Step 6: Test the production app in the user's real Chrome**

Using the Chrome control skill:

1. Inspect provider globals only, without cookies, storage, passwords, seeds, keys, or account exports.
2. Confirm the initial page shows one missing-wallet message when no provider is injected.
3. Press Connect wallet and confirm the message count remains one.
4. If a provider is injected, request connection and stop for the user's approval.
5. After user approval, test every user-visible route and action, keeping demo value at 1-2 GEN and requiring the user to approve every signature.
6. Confirm transaction submitted, accepted/decided, finalized, failed, retry, and canonical reload states only when real browser evidence exists.

- [ ] **Step 7: Re-read the approved spec and plan**

Confirm every requirement has command output or Chrome evidence. List any unresolved environmental limitation instead of inferring success.
