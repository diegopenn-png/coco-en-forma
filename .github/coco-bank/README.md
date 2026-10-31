# Coco Bank — public learning game

Public launch authorized by Diego on 31 October 2026. Every verified Coco account can play; each account owns its saved state and parental guard. Existing owner data remain under their original UUID. Catalogue entry follows Pádel and inherits its card classes.

## Integration

- `coco-family-friendly-v160100.js` loads `coco-bank-private-v1.js` on web and PWA.
- The loader inserts a matching card immediately after Pádel in the signed-out and signed-in catalogues. The Worker validates the session before opening a saved game. `?coco_bank=1` requests opening after normal authentication.
- The private HTML and artwork are fetched with a bearer token and `no-store`, then rendered in an isolated, opaque-origin iframe. CSP disables network access and form navigation; an authenticated, nonce-checked parent bridge handles operations.
- Logout/account changes destroy the iframe and private state in memory; the public catalogue card remains visible. Nothing from the private app is stored in the browser cache or localStorage.
- The public service worker caches only the small loader. Private sources/assets live under `.github` (excluded from GitHub Pages), and are deployed as Worker modules. The repository's existing visibility is unchanged; source-code secrecy is not an authorization boundary.

## Server and persistence

Worker: `https://coco-bank-private.chatinmobiliario.workers.dev`.
D1: `coco-bank-private`, EU. Initialize with `schema.sql`.
All app and data routes validate `/auth/v1/user` server-side and require a verified UUID and confirmed account email. All state and PIN queries use that server-verified UUID, never a caller-supplied owner ID. User-supplied display names and metadata never authorize access. CORS accepts only the apex and www production origins. No service-role credential is used.

State updates use optimistic revisions and operation IDs to prevent duplicate spending. Monthly salary and bills are generated once per anniversary of the challenge start; no accelerated clock. Pending purchases reserve funds. Existing bills and the family reserve are excluded from investable cash. Orders settle only after a later price observation. The daily job also advances accounts without an open browser.

1 CB = €10; monetary values are integer euro cents. Investment performance uses portfolio units so salary, new contributions and withdrawals do not create artificial returns. Deposit interest is simple annual interest, actual days/365, credited at maturity. Challenge dates are inclusive UTC calendar dates. The final portfolio uses the last daily snapshot recorded before the deadline. The reward is a family agreement recorded in the simulation; there are no payment or redemption endpoints.

## Market data and limits

Cron: every day at 12:00 UTC. Initial snapshot loaded on 2026-10-20 from these same sources.

- Apple, Tesla, Samsung and IEF: Yahoo Finance daily raw closes. Open sessions and invalid closes are skipped. The displayed timestamp is the source close, not the fetch time.
- Bitcoin: Coinbase BTC/EUR spot reference at daily fetch time.
- Currency conversion: ECB daily reference rates.
- Educational deposits: the real ECB €STR reference fixed at opening, explicitly not a retail bank offer.
- IEF is labeled as a bond fund, not an individual bond or a capital guarantee.

Missing/stale prices disable orders; previous successful observations keep their timestamps. No synthetic fallback price. The market's working-day schedule and the snapshot delay are visible. Orders are simulated fractional purchases; no brokerage fees or taxes. Dividends are simplified to ex-dividend date with the available FX rate; splits adjust held units. Corporate-action revisions and live execution are outside this educational private review. Before a public release, review market-data licensing/provider contracts and family reward rules. No paid data plan has been started.

## Verification and release

Run from the repository root:

```
node --test .github/coco-bank/test/*.test.mjs
node .github/coco-bank/test/browser.cjs
```

The browser test requires Playwright and Chromium, and accepts `COCO_CHROMIUM_PATH` and `COCO_TEST_OUTPUT`. It uses local, explicitly synthetic test data and mocked authentication only. It covers Francesco's entry, configuration, bills, lesson unlocking, queued orders, mobile width, logout cleanup and hidden access for another account. Tests never impersonate Diego against the live server.

The Worker is deployed separately using `wrangler.jsonc` (or Cloudflare's equivalent multipart API). GitHub Pages publishes the public loader/PWA changes from main. Anonymous direct access and forged tokens were checked against the live Worker and return 403 with no-store headers. Access with Diego's real session must occur through his normal sign-in; no tokens were minted or borrowed for testing.


## Guided interface · 1.6.0-private

Recovered all eleven modules from the running 1.5.0 private Worker before editing: the repository had lagged behind deployment. The financial engine, parental checks, school content, monthly receipts and challenge history are preserved from that running version.

The home screen gives one state-dependent next step and four separate destinations: account/investments, household expenses, challenges and learning. Five navigation buttons provide direct access. Account and expense pages explain what to do in three short steps. The return-to-Coco button is sticky with safe-area spacing, remains usable during requests, and also appears in loading/error states. Each destination has a distinct color and action label. No navigation action executes a financial operation.

Node tests exercise the serialized browser application with synthetic fixtures and the message bridge, plus financial and authorization behavior. Engine test fixtures now follow the already-deployed account creation, parental setup, receipt payment and organization sequence. The Cloud Browser cannot reach the local preview server; authenticated live layout review requires the owner's session. No credentials or real account state are used in test fixtures.


## Kids release · 2.0.0-kids

New accounts start with an adult-selected practice example: €100 virtual salary, €40 bills (rent 30, electricity 5, water 5), €10 reserve, €150 savings goal over three months. These are explicitly fictional learning amounts. The real-world example remains selectable before setup; existing plans are never reset or migrated. All prices and investments still use the existing market engine.

The child sees receive → pay → save, a single next step, a concrete amount remaining to their goal, short instructions and large controls. Advanced investments are collapsed behind an optional learning section. No charge, subscription or AI call is introduced.

The original private Worker name is retained to preserve deployment, database and cron bindings. The daily job pages through all saved accounts. The historical ADMIN_ID export is retained only for regression fixtures; it is not used for authorization or data selection.

Validation: Node financial/navigation tests plus a real in-memory SQLite isolation test for two verified users, attempted owner-ID spoofing, foreign parental tickets and locking another account. Browser QA uses synthetic state at 320 and 390 CSS px. Live publication must additionally verify the catalogue placement and matching dimensions. No fabricated authenticated production sessions.
