# Coco Ciudad

Coco's original 2–6 person board game at `/games/ciudad/`. Forty numbered squares reveal a card after the die lands; 120 authored cards in eight decks, private online rooms, shared-device play, account resume, and a 12-round ending. The public and authenticated catalogue entry is anchored immediately after Coco Bank and explicitly says “No puntúa”. The existing Coco logo, typography, thumbnail family, navigation and Auth session are reused.

## Rules

- Each player starts with 1,500 fictional CB, salary 250 CB per lap, and three goals from one of six life paths. This is a separate fictional game economy, not Coco Bank balances or real currency.
- The server draws a random die for every initial/turn roll. Initial highest roll starts; tied leaders re-roll. Remaining seats follow the host/join order, starting at the winner.
- Each turn: optional single portfolio management action → roll → revealed card/property decision → end. The game ends after exactly 12 turns per person. Decks avoid repeats until their category is exhausted.
- Purchases, rent, up to two upgrades, bank sales at 70%, proposals to sell to another participant, consent-based 50/50 purchases, and one-lap ascending auctions are implemented. Shared assets cannot be sold/upgraded by one owner alone. Market events change rent by ±20% for the current and following round.
- Mandatory expenses can create debt. Optional purchases require cash. Everyone stays in the game. Score is floor(net worth/100) + learning×2 + experiences×3 + community×3 + wellbeing×2 + 15 per achieved goal. Ties share victory.
- Match ranking is independent of Coco's daily/general score; there is no paid API, subscription, AI generation, or real-money transaction in gameplay.

## State and access

`engine.mjs` is a pure state machine used locally and by the authenticated Edge Function `coco-city`. Only the server creates online dice/card draws, checks phases and actor identity, and changes state. Every write compares the prior version to prevent duplicate/concurrent moves or overfilling rooms. Client-supplied dice, scores and money are ignored.

`coco_city_rooms` is a separate RLS table. Only registered participants can SELECT; no anonymous reads or direct client writes. Service role remains in the Edge Function environment. Membership uses account IDs, not editable metadata. Realtime Postgres Changes carries the committed state; polling/reconnect fetches the current version. Invite codes are 64-bit random values in a URL fragment. A host has at most one waiting room and may create at most 20 rooms per day.

Online rooms last 30 days. Exiting the game preserves the seat. A server deadline of two minutes allows another participant to advance an absent player's phase using a conservative default: roll, pass, decline, end, or free/lowest-cost required choice. There is no autonomous scheduler. Local games are browser-only and separate from online saves.

## Checks

- `node --test qa/ciudad.test.mjs qa/ciudad-online.test.mjs`: 11 content, game and handler tests, including complete six-player matches, ties, ownership, consent, auction, deck exhaustion, simultaneous writes, authorization and timeouts.
- `COCO_JSDOM_PATH=/tmp/coco-chess-dom/node_modules/jsdom node qa/ciudad-ui.test.cjs`: six-player local flow, cards, purchases, save/resume, online login/lobby, turn ownership and offline guards. Auth transport here is stubbed.
- `COCO_JSDOM_PATH=/tmp/coco-chess-dom/node_modules/jsdom node qa/ciudad-catalogue.test.cjs`: both catalogue variants place Ciudad immediately after Coco Bank, keep the no-score marker, avoid duplicates and share the correct game link.
- `python qa/ciudad-online-live.py /private/test-fixture.json`: actual Auth, private room/RLS, seventh-player denial, wrong turns, replay rejection, Realtime synchronization and resume using seven isolated QA accounts. Never commit the fixture.
- `qa/ciudad-layout.html`: live responsive harness at 320×568, 390×740 and 430×820. It cannot emulate physical iPhone safe areas.

The SQL setup is `supabase-coco-ciudad.sql`; production migration `coco_city_private_six_player_rooms` was applied during implementation. Do not apply it again. Function v1 was deployed using the exact engine/content in this directory. No existing table or ranking was modified.

Live verification on 2026-11-01 passed with seven isolated registered QA accounts: six admitted, seventh denied, participant-only reads, direct writes denied, host-only start, 12 server dice rolls, six complete turns, 22 exact matching WebSocket states, rejected wrong turns/stale retries, and the sixth player resuming the same saved board. The QA room was then closed, all seven fixture accounts disabled and their sessions revoked. No real player account was used. Desktop browser preview verified six starting rolls, turn movement, a revealed property card, a decision and handoff to the next player. The catalogue preview shows 18 coordinated card colours with Ciudad immediately following Bank. Mobile/PWA production delivery and physical-device safe areas remain release checks.
