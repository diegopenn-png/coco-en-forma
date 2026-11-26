# Coco Truco

The web and PWA catalogue entry points to `/games/truco/`. Its guide and share card are at `/juego/truco/`. The 40-card Argentine rules use 15 or 30 points, sin flor, with full-table hands for six players. Partners sit in alternating seats. For a team call, the next opposing active seat answers. A player may fold while their partners carry on. Truco does not submit general ranking points.

Solo and pass-and-play store one local match. Online rooms use the existing Coco V2 Supabase project. A 12-character invitation admits a player only while seats are free. The browser saves a separate 256-bit seat credential for each room, and sends it only to the Truco function. Invitations carry only the room code. The server deals and validates moves, generates per-seat views and uses version-checked writes. The three-day expiry is enforced on reads, with expired data removed on the next room creation. The current browser profile can reconnect to its seat. There is no account or chat requirement.

The SQL is in `supabase-coco-truco.sql`. Deploy `supabase/functions/coco-truco/index.ts` with its relative sources and the shared game engine. The function performs seat authentication, with JWT verification disabled for this public guest entrypoint. Only the server has table privileges.

Run `node --test qa/truco.test.mjs` for rules, table simulations, language coverage and entrypoint checks. Regenerate the public guide and its catalogue language data with `node scripts/build-game-landings.mjs`.
