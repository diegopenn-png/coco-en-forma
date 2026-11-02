# Coco Batalla Naval

Standalone game at `/games/naval/`, with a public guide and social preview at
`/juego/naval/`. The public and signed-in catalogues place it after Generala.
It does not contribute to the general ranking or cognitive report scores.

## Rules and implementation

- A 10 × 10 board and five ships occupying 5, 4, 3, 3 and 2 cells. Ships can touch,
  but cannot overlap. One shot per turn, including after a hit.
- Three local difficulties. The bot only receives its own shot history.
- Local resume, optional sounds, statistics and a reveal of both fleets at the end.
- Private online rooms for two registered Coco accounts. Online turns allow five
  minutes before the other player can claim a timeout. Rooms expire after seven days.
- The Edge Function validates authenticated membership, legal actions and versions.
  Complete fleets live in `coco_naval_private.states`; Realtime publishes only safe
  room metadata. Only each player's filtered view leaves the server.
- Mobile confirmation stays visible at the bottom of the battle screen. Small
  screens use a readable three-column ship selector.

## Verification — 2026-11-02

- Seven engine, server and integration tests pass, including 1,000 generated fleets,
  60 complete bot games across three difficulties, hidden fleets, invalid moves,
  concurrent/stale updates, membership checks and PWA offline routing.
- UI tests cover placement, rotation, bot turns, resume, sharing and manual copy
  fallback, results, login state, and one correctly anchored icon per catalogue card.
- 21 landing, PWA update and balanced-scoring checks pass. Seven additional reward
  and non-scoring checks cover Naval's exclusion from ranking and report totals.
- Browser review at 390 px and 320 px covers entry, placement, battle, persistent
  confirmation, return controls and resume. This is an emulated viewport check,
  not a physical iPhone installation test.
- A real game using three disposable QA accounts in Coco V2 completed with 33
  shots and 33 WebSocket updates. Verified outsider denial, direct-write denial,
  private RPC denial, two-player limit, hidden fleets, turn validation, duplicate
  and stale-shot rejection, victory, final fleet reveal and authenticated resume.
- The existing deployed `coco-naval` function (version 1, JWT verification enabled)
  exactly matches the committed server and engine files. Naval tables have RLS;
  the project's security advisor returned no findings for Naval objects.
- The older Playwright catalogue runner could not start because its local browser
  binary is absent. Browser inspection and the Node/jsdom tests were used instead.

## Commands

```sh
node --test qa/naval*.test.mjs
COCO_JSDOM_PATH=/path/to/jsdom node qa/naval-ui.test.cjs
COCO_JSDOM_PATH=/path/to/jsdom node --test qa/game-landings.test.mjs qa/device-update-contract.test.mjs qa/balanced-game-scoring-v160110.test.mjs
node --test qa/card-thumbnails-v160115.test.mjs qa/v161-non-scoring-experiences.test.mjs
python qa/naval-online-live.py /path/to/private-qa-sessions.json
```

Live test fixtures must contain disposable accounts and must never be committed.
Revoke their sessions and remove their accounts after the test.

## Release state

Backend installed and live-tested. Frontend changes are proposed on the feature
branch; publication to the existing public site is still pending. PWA cache key:
`coco-en-forma-v160.100.57-naval`. Verify the game, landing, share image, catalogue
and cache version on the public domain after merging, before marking publication
complete.
