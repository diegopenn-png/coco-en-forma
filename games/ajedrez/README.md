# Coco Ajedrez · La ciudad del futuro

Static chess game at `/games/ajedrez/`, using the official Coco icon. Standard play is the default and has no daily lock, mission requirement, timer, or mandatory score. Two people can play on one device, or one player can choose either color against a local opponent (three search depths). Registered Coco accounts can also create a private online room and invite another registered player by code or link.

## Short-screen flow and online play

- Home offers local play, online play, learning and challenges. Only the current screen is visible; the board is never appended below setup or instructions.
- Setup and lesson/challenge lists lead directly to the board, reset scroll and place keyboard focus at the screen heading. Back follows the current flow. The bottom mobile navigation respects safe-area insets.
- Rules, board appearance, move history, export and resignation live in dialogs. The mobile board is sized against the viewport; hints and undo remain available for local games.
- Online access reuses the main site's Supabase Auth session. Anonymous users sign in with their existing Coco account. Rooms use a random 16-character invitation code (also shareable as a URL fragment); no public directory or messages are sent.
- `online.mjs` subscribes to Postgres Changes with participant RLS, refreshes the state after subscribing/reconnecting, blocks moves while disconnected, and lists up to 10 recent rooms. One pending room per host; rooms can be resumed for 30 days. Online play has no hints or undo.
- `supabase/functions/coco-chess/handler.mjs` verifies every request using Auth `getUser`, rejects anonymous accounts, authorizes room membership and side/turn, and validates moves with the same vendored chess.js. Versioned compare-and-swap updates prevent simultaneous writes. Draw offers need both players' agreement; resignation and game-over rules are applied on the server.
- `supabase-coco-ajedrez-online.sql` creates the private room table, participant-only SELECT policy and Realtime publication entry. `anon` has no access; `authenticated` cannot write directly. The Edge Function's service credential stays server-side. The gateway's legacy JWT check is disabled because the function performs explicit Auth verification and supports the existing publishable key.
- To deploy the function, bundle its index and handler at their repository paths together with `games/ajedrez/vendor/chess.mjs` and its license. Do not duplicate the engine or put service credentials in browser code.

## Rules and persistence

- Vendored chess.js 1.4.0 (BSD-2-Clause, license beside source) handles legal moves, castling, en passant, four promotion choices, check/mate, stalemate and draws. Source: https://jhlywa.github.io/chess.js/ ; npm tarball `chess.js@1.4.0`.
- Casual-play convention: automatically ends on third repetition and the 50-move draw condition, explained in the rules panel.
- Local AI uses iterative alpha-beta search in a module worker, with a bounded local fallback. No paid APIs, network inference, or certified Elo claims.
- One local standard PGN, local settings and tutorial/challenge completion are stored in this browser. Not account-synced, not connected to Coco's general ranking or reports. Switching learning modes preserves the saved standard game.
- Six legal lessons; six independently verified challenges; two optional board finishes unlock after 2 and 4 challenges. Standard play never requires these.
- Catalogue entry deliberately has its own data attribute and capture handler so the legacy daily game limiter cannot prevent standard play.
- Assets are included in the existing Coco service worker cache, version v160.100.47-ajedrez-pantallas.

## Validation

`node --test qa/ajedrez.test.mjs qa/ajedrez-online.test.mjs` — 18 engine and server tests, including authorization, private room membership, legal turns, stale and simultaneous requests, mate, draws and resignation.

`COCO_JSDOM_PATH=/tmp/coco-chess-dom/node_modules/jsdom node qa/ajedrez-ui.test.cjs` — navigation, a single visible screen, no inactive board on entry, start/resume, lesson completion, dialogs, login and private-room UI, ownership of turns, offline guards and preservation of local saves. Install pinned `jsdom@26.1.0` at that prefix first.

`qa/ajedrez-online-live.py <private-fixture-json>` validates Auth, server requests, RLS and actual WebSocket updates using disposable test accounts. Credentials are supplied separately and must never be committed.

`qa/ajedrez-layout.html` is a visual QA harness for the actual app at 320, 390 and 430px widths; it does not emulate the native iPhone status bar.

### Earlier baseline checks

`node --test qa/ajedrez.test.mjs` — 11 tests: initial position, all lesson targets, all puzzle solutions, castling and attacked transit square, en passant, all four promotions, mate vs stalemate, PGN round trip with repetition, all AI levels preserve caller state and return legal moves, AI solves mates in one, and first offline navigation to the cached chess directory (with/without trailing slash and query links).

Browser QA on a local preview: standard AI reply after e4, optional hint, undo of both turns, reload/resume, two-person standard game ending in Qh4 mate, pawn lesson, queen mate challenge, promotion chooser and underpromotion to knight, public catalogue entry and copy-button feedback, navigation into the game. Layout inspected at desktop and in a 390px-wide mobile iframe with no horizontal overflow. A physical iPhone/PWA and authenticated menu were not tested.

## Artwork

`pieces.png`: native built-in image generation, transparent sprite sheet. Prompt: twelve futuristic metallic chess pieces in a regular six-column/two-row grid, Cybertruck-inspired folded steel; top row silver/cyan, bottom charcoal/amber; order king, queen, bishop, horse knight, rook, pawn; consistent camera and square cells; no logos or text.

`cover-coco-v2.jpg`: the catalogue and social image, built from Coco’s existing native SVG card family by `scripts/build-chess-card.py`, using the exact official logo.

`cover.png`: the original concept illustration, retained as a historical asset; it is no longer the catalogue or social image. Actual gameplay uses the interactive board and the separate sprites, not an image of a board. Original prompt: futuristic chess interface in Spanish, faceted brushed steel, silver/cyan and graphite/amber teams, large board, robotic horse knight, header “AJEDREZ DEL FUTURO”, navigation, optional hint and overhead view. Both originals remain unchanged.

Deployment: existing GitHub Pages repository `diegopenn-png/coco-en-forma`, main. No new service or subscription.

## Published and verified · 1 November 2026

The user asked to finish implementing the chess game. The prepared commit `ae8d547af0867575302baeca21cb68993c7d5ed7` was fast-forwarded to `main` successfully, preserving the existing Coco site. The prior publication blockers below are historical and resolved.

Live URL: https://cocoenforma.com/games/ajedrez/

Verified in this session:
- All 11 local engine/content/offline tests passed; first-party syntax and whitespace checks passed.
- GitHub chess CI [41333262966](https://github.com/diegopenn-png/coco-en-forma/actions/runs/41333262966), Pages deployment [41333262195](https://github.com/diegopenn-png/coco-en-forma/actions/runs/41333262195), and production web/PWA checks [41333263052](https://github.com/diegopenn-png/coco-en-forma/actions/runs/41333263052) completed successfully.
- Eight public assets (index, app, stylesheet, piece sheet, cover, catalogue entry, navigation loader, service worker) returned HTTP 200 with SHA-256 identical to the released source.
- Live Chrome UI: standard game e4 followed by Coco's Nc6, undo both turns, reload and resume, two-person game f3/e5/g4/Qh4 ending in checkmate, first pawn lesson, queen-and-king mate challenge, and navigation back to the main catalogue.
- The public catalogue displays Coco Ajedrez with its artwork and unlimited standard-play label. Its copy button displayed “Copiado”, placed the exact live URL on the clipboard, and opening the card loaded the game.
- The live board and piece artwork were visually inspected.

Limits: a physical iPhone/installed PWA and the authenticated catalogue were not exercised. Progress remains browser-local and separate from the general ranking/reports, as described above.

## Historical handoff · 1 November 2026

Implementation saved in local commit `fefcae0aeeaffd46567c65b42ab6106c6eab0769`. All 11 engine/content/offline tests passed again. A separate jsdom 26.1.0 check also passed: two-person standard game through checkmate, undo, lesson completion, preserving the standard game while changing modes, challenge completion, and back navigation. Syntax and whitespace checks passed.

Publication is pending explicit user authorization: automatic approval review rejected the push to `main` because it would publish the changes without explicit permission to upload to that branch. Remote `main` was rechecked and remains `0306af385e18d1474004e2c00d7f82de7e48ebc7`; the public chess route still returns 404. Do not present the game as live. Once authorized, push the prepared commits, check the chess CI and Pages deployment, and verify gameplay, artwork and catalogue entry on the live URL. Current-session visual browser checks were blocked by unavailable local preview connectivity; the earlier local browser observations above are historical, not production verification.

### Recovery verification · 1 November 2026

Recovered the implementation after the user reported a ChatGPT ConversationDetailError. Re-ran all 11 tests successfully, all first-party JavaScript syntax checks, and whitespace checks excluding the unchanged third-party chess.js distribution. Rechecked the actual UI handlers with jsdom: two-player checkmate, undo, lesson and challenge completion, preserving the standard PGN while changing modes, back navigation and resume all passed. Visual verification could not be repeated in this session because the local Playwright browser executable is unavailable; physical iPhone/PWA and authenticated-menu checks remain unverified.

The automatic approval reviewer rejected publication to `main` again because it did not accept the recovered authorization as sufficient evidence for that production action. Do not retry production publication without new explicit approval. The preparation branch `codex/coco-ajedrez-ready-20261101` is for reviewing and preserving the code only; it does not make the game live on cocoenforma.com. Next step: obtain explicit permission to publish this chess implementation to `main`, then verify Pages deployment and live gameplay.

## Coco visual integration and iPhone navigation · 1 November 2026

Replaced the standalone dark shell with Coco’s Lilita One / Fredoka typography, light cards, blue/purple title panel and orange primary actions. The illustration follows the existing colourful game-card family and preserves the official logo. Existing metallic pieces and chess rules are unchanged.

At widths up to 760 px the two navigation controls are fixed to the bottom of the viewport, with 52 px minimum targets, safe-area bottom/left/right spacing and matching content clearance. The header has a safe-area top inset. Desktop keeps a sticky header with safe-area spacing. The PWA cache and stylesheet URL were updated for the release.

Validation before publication: all 11 existing tests, first-party entry syntax and diff whitespace checks pass. Production verification: chess CI 41334416454, Pages deployment 41334416155 and web/PWA smoke 41334416433 all passed for commit `64cbc76000eb3c5c001df10554d6628af8c95b18`. The published HTML, CSS, entry module, thumbnail and service worker match the source byte-for-byte. Live Chrome visually confirmed the Coco typography and light design, no horizontal overflow, starting a standard game, Back returning to setup and Main Menu returning to Coco. The public catalogue uses the new illustration. A physical iPhone/installed PWA and mobile viewport remain unverified; the mobile safe-area layout was reviewed in source.

## Live verification — focused screens and online rooms (2026-11-01)

- Supabase migration `coco_chess_private_online_rooms` and Edge Function `coco-chess` v1 deployed. Three isolated QA accounts verified real Auth, participant-only REST reads, denied client writes, capacity of two, ownership of turns, illegal/stale move rejection, four matching WebSocket updates, mate and resume. The QA accounts were disabled and their rooms expired after testing; no real player data was changed.
- GitHub chess workflow passed all 18 engine/server checks plus the UI scenarios. Production browser verified the home menu, short setup, board-first entry, local AI reply, dialog controls and return navigation. The full board and bottom navigation fit at 390 × 740 and 320 × 568 in the mobile iframe harness. Native iPhone safe-area behavior remains to be verified on a physical device.
