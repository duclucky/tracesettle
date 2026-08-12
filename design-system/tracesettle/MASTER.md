# TraceSettle Frontend Design System

Generated from `ui-ux-design-pro` engine output on 2026-08-12, then filtered
through the project brief and taste rules.

## Design Read

TraceSettle is a B2B operations web app for technical workflow sponsors and step
providers. The UI language is trust-first, work-focused, and dense enough for
repeat use. It is not a marketing landing page, reviewer dashboard, contract
explorer, or single-screen demo.

## Dials

- Design variance: 4/10
- Motion intensity: 3/10
- Visual density: 7/10

These dials mean restrained layout variation, subtle state motion, and compact
but readable operational screens.

## Foundation

- Stack: Vite, React, TypeScript
- Styling: Tailwind or equivalent CSS variables
- Component model: Radix-style accessible primitives, owned app components
- Icons: one vector icon family only, preferably Phosphor or Radix Icons
- Data boundary: typed contract adapter, no canonical state in localStorage

## Color Tokens

Use a light operations theme with one restrained trust accent.

| Role | Token | Value |
| --- | --- | --- |
| Canvas | `--color-canvas` | `#F8FAFC` |
| Surface | `--color-surface` | `#FFFFFF` |
| Surface muted | `--color-surface-muted` | `#EEF3F7` |
| Text primary | `--color-text` | `#111827` |
| Text secondary | `--color-text-muted` | `#526071` |
| Border | `--color-border` | `#DDE5EE` |
| Accent | `--color-accent` | `#0369A1` |
| Accent strong | `--color-accent-strong` | `#075985` |
| Success | `--color-success` | `#166534` |
| Warning | `--color-warning` | `#92400E` |
| Danger | `--color-danger` | `#B91C1C` |
| Retry | `--color-retry` | `#6D5D00` |

Do not use AI-purple gradients, dark mesh backgrounds, glass-heavy panels, or
one-note slate pages. Status colors are semantic, not decorative accents.

## Typography

- UI font: Geist Sans, Switzer, or system sans. Do not default to Inter.
- Mono font: JetBrains Mono or Geist Mono for addresses, IDs, and optional
  verification details only.
- Heading style: compact, operational, and scan-friendly. Avoid hero-scale type
  inside task screens.
- Letter spacing: 0 for normal text. Small uppercase labels are rare and must
  serve navigation or status scanning.

## Layout

- Persistent navigation is required on every route.
- Desktop content width: 1180px to 1320px depending on page density.
- Use page-level grids for inbox, setup, workspace, and credit pages.
- Cards are for repeated workflow items, detail panels, dialogs, and framed
  tools only. Do not put cards inside cards.
- Radius system: 8px for buttons, inputs, panels, rows, and dialogs.
- Use dividers, grouped rows, and whitespace before decorative shadows.
- All pages must work at 375px, 768px, 1024px, and 1440px.

## Core Components

- App shell with persistent nav, wallet/network status, and active route state.
- Wallet connection panel with no-wallet, wrong-network, missing-address, and
  provider-selection states.
- Workflow inbox with filters for Active, Needs action, Retryable, Settled, and
  Cancelled.
- Sponsor setup wizard with validation for objective, steps, DAG dependencies,
  evidence host policy, provider addresses, fee weights, and 2 GEN funding.
- Workflow room with dependency graph, status timeline, role-gated controls,
  and collapsed verification details.
- Provider evidence form with URL, digest, bond posture, dependency context, and
  transaction lifecycle feedback.
- Credits page with canonical withdrawable GEN, source workflow rows, and one
  legal withdraw action.
- Help page with concise verification and limitation explanations.

## Motion

Motion is for state comprehension, not decoration.

- Navigation and panel transitions: 150ms to 220ms.
- Transaction lifecycle state changes: 200ms to 300ms.
- Row expansion and disclosure: 160ms to 240ms.
- Reduced motion: disable non-essential transitions.
- Do not use scroll hijacking, infinite ambient animation, or layout-shifting
  hover effects.

## FE Rules

- FE-PRESERVE: after Phase 3A, preserve this visual language and page structure.
- FE-HONEST: never simulate wallet signatures, balances, fees, finality, or
  canonical contract state.
- FE-SURFACE: show user-relevant state and legal actions only; raw contract and
  validator details stay in disclosures or Explorer links.
- FE-PRODUCT: ship the full multi-route product journey, not a single dashboard.

## Preflight

- All route-map pages exist and are reachable through navigation.
- Primary sponsor and provider journeys run end to end behind the adapter.
- No visible lorem, placeholder claims, or fake sample onchain state.
- Button and form contrast meet WCAG AA.
- Focus states are visible and keyboard traversal follows visual order.
- Touch/click targets are at least 44px.
- No content overlaps or horizontal scroll at 375px.
- Loading, empty, submitted, finalized, failed, retry, and wrong-network states
  are represented where relevant.
- Production frontend build passes before Phase 3B exits.
