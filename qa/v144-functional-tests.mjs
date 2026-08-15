import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const qaDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.dirname(qaDir);
if (fs.readFileSync(path.join(rootDir, "index.html"), "utf8").includes("v145.0-profesional")) {
  console.log("SKIP  Suite histórica v144: la versión activa de este paquete es v145.0. Usa qa/v145-functional-tests.mjs.");
  process.exit(0);
}
const results = [];
let idCounter = 0;

function test(name, body) {
  try {
    body();
    results.push({ name, status: "PASS" });
  } catch (error) {
    results.push({ name, status: "FAIL", detail: error.stack || error.message });
  }
}

function browserContext(extra = {}) {
  const window = {
    CocoV144: {
      id(prefix) { idCounter += 1; return `${prefix}-${String(idCounter).padStart(5, "0")}`; },
      today() { return "2026-08-15"; }, esc(value) { return String(value); },
      body() { return null; }, session: async () => null, client: () => null,
      toast() {}, sound() {}, openModal() {}, closeModal() {}, setModalTitle() {}
    },
    addEventListener() {}, removeEventListener() {}, ...extra
  };
  const context = vm.createContext({ window, self: window, globalThis: window, console, Set, Map, Date, Math, JSON, Object, Array, String, Number, Boolean, RegExp, Intl, Promise, AbortController, URLSearchParams, performance: { now: () => Date.now() }, crypto: { randomUUID: () => `qa-${++idCounter}` }, setTimeout, clearTimeout, setInterval, clearInterval });
  return { context, window };
}

function evaluate(file, setup) {
  const { context, window } = browserContext(setup);
  vm.runInContext(fs.readFileSync(path.join(rootDir, file), "utf8"), context, { filename: file });
  return window;
}

test("Coco Pádel: exactamente tres pestañas principales e ilimitado", () => {
  const padel = evaluate("coco-v144-padel.js").CocoPadelV144;
  const audit = padel.audit(padel.blankState());
  assert.deepEqual(Array.from(audit.topTabs), ["Nuevo mixing", "Campeonatos", "Jugadores"]);
  assert.equal(audit.unlimited, true);
});

test("Coco Pádel: nombres duplicados reciben códigos únicos y no reutilizables", () => {
  const padel = evaluate("coco-v144-padel.js").CocoPadelV144;
  const state = padel.blankState();
  const first = padel.createPlayer(state, "Diego", "bajo");
  const second = padel.createPlayer(state, "Diego", "alto");
  assert.equal(first.duplicateName, false);
  assert.equal(second.duplicateName, true);
  assert.equal(first.player.code, "CP-0001");
  assert.equal(second.player.code, "CP-0002");
  first.player.active = false;
  const third = padel.createPlayer(state, "Lucía", "medio").player;
  assert.equal(third.code, "CP-0003");
  assert.equal(new Set(state.players.map(player => player.code)).size, 3);
});

test("Coco Pádel: campeonato de 20 fechas acumula desde resultados derivados", () => {
  const padel = evaluate("coco-v144-padel.js").CocoPadelV144;
  const state = padel.blankState();
  const players = [
    padel.createPlayer(state, "Diego", "bajo").player,
    padel.createPlayer(state, "Diego", "medio").player,
    padel.createPlayer(state, "Ana", "alto").player,
    padel.createPlayer(state, "Bruno", "medio").player
  ];
  const championship = { id: "champ-20", name: "Liga 20 fechas", startDate: "2026-01-01", endDate: "", status: "active", participantIds: players.map(player => player.id), scoring: { mode: "points", win: 3, draw: 1, loss: 0, tiebreakers: ["points", "gameDifference", "gamesWon", "headToHead"] }, createdAt: "2026-01-01T00:00:00Z", finishedAt: null, archivedAt: null };
  state.championships.push(championship);
  for (let index = 0; index < 20; index += 1) {
    const sessionId = `date-${String(index + 1).padStart(2, "0")}`;
    state.sessions.push({ id: sessionId, kind: "championship-date", championshipId: championship.id, name: `Fecha ${index + 1}`, date: `2026-01-${String(index + 1).padStart(2, "0")}`, courts: 1, courtLabels: ["Central"], rounds: 1, matchMinutes: 20, timerMode: "limit", participants: players.map(player => ({ playerId: player.id, codeSnapshot: player.code, nameSnapshot: player.name, levelSnapshot: player.currentLevel })), matches: [{ id: `match-${index + 1}`, order: 1, round: 1, court: 1, courtLabel: "Central", teamA: [players[0].id, players[2].id], teamB: [players[1].id, players[3].id], score: null, updatedAt: null }], createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" });
    padel.saveResult(state, sessionId, `match-${index + 1}`, index % 3 === 2 ? 5 : 6, index % 3 === 0 ? 4 : 6);
  }
  const standings = padel.championshipStandings(state, championship.id);
  assert.equal(state.sessions.length, 20);
  assert.equal(standings.length, 4);
  assert.ok(standings.every(row => row.played === 20));
  assert.ok(standings.every(row => row.gamesWon + row.gamesLost > 0));
  assert.equal(standings[0].position, 1);
});

test("Coco Pádel: guardar, corregir y eliminar no duplica estadísticas", () => {
  const padel = evaluate("coco-v144-padel.js").CocoPadelV144;
  const state = padel.blankState(), a = padel.createPlayer(state, "A", "bajo").player, b = padel.createPlayer(state, "B", "medio").player, c = padel.createPlayer(state, "C", "alto").player, d = padel.createPlayer(state, "D", "medio").player;
  state.sessions.push({ id: "s", kind: "mixing", championshipId: null, name: "Mixing", date: "2026-08-15", courts: 1, courtLabels: ["1"], rounds: 1, matchMinutes: 20, timerMode: "limit", participants: [a, b, c, d].map(player => ({ playerId: player.id, codeSnapshot: player.code, nameSnapshot: player.name, levelSnapshot: player.currentLevel })), matches: [{ id: "m", order: 1, round: 1, court: 1, courtLabel: "1", teamA: [a.id, b.id], teamB: [c.id, d.id], score: null, updatedAt: null }], createdAt: "2026-08-15T00:00:00Z", updatedAt: "2026-08-15T00:00:00Z" });
  padel.saveResult(state, "s", "m", 6, 4);
  padel.saveResult(state, "s", "m", 6, 4);
  assert.equal(padel.playerStats(state, a.id).played, 1);
  padel.saveResult(state, "s", "m", 3, 6);
  assert.equal(padel.playerStats(state, a.id).lost, 1);
  assert.equal(padel.playerStats(state, a.id).won, 0);
  padel.deleteResult(state, "s", "m");
  assert.equal(padel.playerStats(state, a.id).played, 0);
  assert.ok(state.auditLog.some(entry => entry.type === "result-corrected"));
  assert.ok(state.auditLog.some(entry => entry.type === "result-deleted"));
});

test("Coco Pádel: cambio manual conserva el nivel histórico del partido", () => {
  const padel = evaluate("coco-v144-padel.js").CocoPadelV144;
  const state = padel.blankState(), a = padel.createPlayer(state, "Elena", "bajo").player, b = padel.createPlayer(state, "B", "medio").player, c = padel.createPlayer(state, "C", "alto").player, d = padel.createPlayer(state, "D", "medio").player;
  state.championships.push({ id: "champ", name: "Copa", startDate: "2026-08-01", endDate: "", status: "finished", participantIds: [a.id, b.id, c.id, d.id], scoring: { mode: "games", win: 3, draw: 1, loss: 0 }, createdAt: "2026-08-01T00:00:00Z" });
  state.sessions.push({ id: "s", kind: "championship-date", championshipId: "champ", name: "Fecha 1", date: "2026-08-01", courts: 1, courtLabels: ["1"], rounds: 1, matchMinutes: 20, timerMode: "limit", participants: [a, b, c, d].map(player => ({ playerId: player.id, codeSnapshot: player.code, nameSnapshot: player.name, levelSnapshot: player.currentLevel })), matches: [{ id: "m", order: 1, round: 1, court: 1, courtLabel: "1", teamA: [a.id, b.id], teamB: [c.id, d.id], score: { gamesA: 6, gamesB: 3 }, updatedAt: "2026-08-01T01:00:00Z" }], createdAt: "2026-08-01T00:00:00Z", updatedAt: "2026-08-01T01:00:00Z" });
  const change = padel.changePlayerLevel(state, a.id, "medio", "champ", "Buen rendimiento");
  assert.equal(change.previousLevel, "bajo");
  assert.equal(a.currentLevel, "medio");
  assert.equal(padel.playerHistory(state, a.id)[0].levelSnapshot, "bajo");
  const restored = padel.normalize(JSON.parse(JSON.stringify(state)));
  assert.equal(restored.players.find(player => player.id === a.id).currentLevel, "medio");
  assert.equal(padel.playerHistory(restored, a.id)[0].levelSnapshot, "bajo");
});

test("Contenido: mínimo 20 combinaciones únicas por nivel y juego activo", () => {
  const html = fs.readFileSync(path.join(rootDir, "index.html"), "utf8");
  const match = html.match(/<script id="coco-v134-content">([\s\S]*?)<\/script>/);
  assert.ok(match, "No se encontró el banco base");
  const { context, window } = browserContext();
  vm.runInContext(match[1], context, { filename: "coco-v134-content-inline.js" });
  vm.runInContext(fs.readFileSync(path.join(rootDir, "coco-v142-content-extension.js"), "utf8"), context, { filename: "coco-v142-content-extension.js" });
  vm.runInContext(fs.readFileSync(path.join(rootDir, "coco-v144-content.js"), "utf8"), context, { filename: "coco-v144-content.js" });
  const audit = window.CocoContentV144.audit();
  assert.equal(audit.passed, true, audit.failures.join("; "));
  assert.equal(audit.gamesAudited, 14);
  assert.ok(audit.counts.words.basic >= 20);
  assert.ok(audit.counts.words.intermediate >= 20);
  assert.ok(audit.counts.words.advanced >= 20);
  for (const game of window.CocoContentV144.games) for (const level of [1, 2, 3]) {
    const list = window.CocoContentV144.challenges(game, level);
    assert.ok(list.length >= 20, `${game} L${level}`);
    assert.equal(new Set(list.map(item => item.id)).size, list.length, `${game} L${level} IDs`);
  }
});

test("Diferencias: 30 combinaciones/nivel, seis tipos y geometría compartida", () => {
  const differences = evaluate("coco-v144-differences.js").CocoDifferencesProV144;
  const audit = differences.audit();
  assert.equal(audit.sceneCount, 10);
  assert.equal(audit.combinationsPerLevel, 30);
  assert.equal(audit.everySceneHasSix, true);
  assert.deepEqual(Array.from(audit.differenceKinds), ["orientation", "color", "removed", "size", "position", "shape"]);
  assert.equal(audit.sameDefinitionForVisualAndHit, true);
  assert.equal(audit.clickableFromBothImages, true);
  assert.equal(audit.falseClicksAccepted, false);
});

test("Diferencias: todas las zonas normalizadas permanecen dentro del lienzo", () => {
  const differences = evaluate("coco-v144-differences.js").CocoDifferencesProV144;
  for (const scene of differences.scenes) {
    assert.equal(scene.differences.length, 6, scene.id);
    for (const item of scene.differences) {
      assert.ok(item.x > 0 && item.x < 100, `${scene.id}/${item.id} x`);
      assert.ok(item.y > 0 && item.y < 100, `${scene.id}/${item.id} y`);
      assert.ok(item.w >= 6 && item.h >= 6, `${scene.id}/${item.id} tamaño táctil`);
      const rect = differences.rectFor({ width: 1536, height: 1024 }, item);
      assert.ok(rect.x >= 0 && rect.y >= 0, `${scene.id}/${item.id} origen`);
      assert.ok(rect.x + rect.width <= 1536 && rect.y + rect.height <= 1024, `${scene.id}/${item.id} límites`);
    }
  }
});

test("Runner: tres niveles finitos, misiones variadas y cero escrituras al ranking", () => {
  const runner = evaluate("coco-v144-runner.js").CocoRunnerV144;
  const audit = runner.audit();
  assert.deepEqual(Array.from(audit.durationSeconds), [132, 162, 198]);
  assert.equal(audit.finite, true);
  assert.equal(audit.rankingWrites, false);
  assert.equal(audit.partidasTableWrites, false);
  assert.equal(audit.ownLeaderboard, false);
  for (const level of [1, 2, 3]) {
    const missions = Array.from({ length: 30 }, (_, index) => runner.missionForLevel(level, `qa-${level}-${index}`));
    assert.ok(new Set(missions.map(mission => mission.id)).size >= 20);
    assert.ok(missions.every(mission => mission.memory.sequence.length === level + 2));
  }
});

test("Runner: controles, pausa, final saludable y guardado exclusivamente personal", () => {
  const source = fs.readFileSync(path.join(rootDir, "coco-v144-runner.js"), "utf8");
  const sql = fs.readFileSync(path.join(rootDir, "supabase-coco-v144.sql"), "utf8");
  assert.match(source, /ArrowLeft|ArrowRight|ArrowUp|ArrowDown/);
  assert.match(source, /pointerdown/);
  assert.match(source, /togglePause/);
  assert.match(source, /Pausa saludable/i);
  assert.match(source, /apart(ar|e) la vista|descansa/i);
  assert.match(source, /from\("coco_runner_history"\)\.insert/);
  assert.doesNotMatch(source, /from\("partidas"\)|registrar_partida_coco/);
  assert.match(sql, /unique\s*\(user_id,\s*play_date\)/i);
});

test("Coco Pádel: búsqueda visible por nombre, código y nivel; historial filtrable", () => {
  const source = fs.readFileSync(path.join(rootDir, "coco-v144-padel.js"), "utf8");
  assert.match(source, /Buscar por nombre o código/i);
  assert.match(source, /data-padel144-directory-level/);
  assert.match(source, /data-padel144-history-champ/);
  assert.match(source, /data-padel144-history-from/);
  assert.match(source, /data-padel144-history-to/);
  assert.match(source, /gamesWon/);
  assert.match(source, /gamesLost/);
  assert.match(source, /gameDifference/);
});

test("Base de datos: migración aditiva, RLS y reversión documentada", () => {
  const migration = fs.readFileSync(path.join(rootDir, "supabase-coco-v144.sql"), "utf8");
  const rollback = fs.readFileSync(path.join(rootDir, "supabase-coco-v144-rollback.sql"), "utf8");
  assert.match(migration, /create table if not exists public\.coco_runner_history/i);
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /auth\.uid\(\)\s*=\s*user_id/i);
  assert.doesNotMatch(migration, /drop\s+table|truncate|delete\s+from/i);
  assert.match(rollback, /drop table if exists public\.coco_runner_history/i);
});

test("PWA: todos los recursos precargados existen y no hay recurso del juego retirado", () => {
  const sw = fs.readFileSync(path.join(rootDir, "sw.js"), "utf8");
  assert.match(sw, /coco-en-forma-v144\.0\.0/);
  assert.doesNotMatch(sw, /ingles|english/i);
  const paths = Array.from(sw.matchAll(/"\.\/([^"?]+)"/g), match => match[1]).filter(asset => asset && asset !== "");
  for (const asset of paths) assert.ok(fs.existsSync(path.join(rootDir, asset)), `Falta ${asset}`);
});

test("Integración: v144 carga módulos locales, retira Inglés y conserva v143 intacta fuera del árbol", () => {
  const html = fs.readFileSync(path.join(rootDir, "index.html"), "utf8");
  for (const file of ["coco-v144-content.js", "coco-v144-core.js", "coco-v144-padel.js", "coco-v144-runner.js", "coco-v144-differences.js", "coco-v144-professional.css"]) assert.ok(html.includes(file), file);
  assert.ok(html.includes('id:"cococorre",nombre:"Coco Corre"'));
  assert.ok(!html.includes('id:"ingles",nombre:"Inglés"'));
  assert.ok(!html.includes('var OWN_IDS=["cocomed","futbol","ingles"]'));
  assert.doesNotMatch(html, /ingl[eé]s|english/i);
  assert.ok(fs.existsSync(path.join(rootDir, "juego/coco-corre/index.html")));
});

test("Responsive y accesibilidad: cuatro anchos objetivo, movimiento reducido y controles táctiles", () => {
  const css = fs.readFileSync(path.join(rootDir, "coco-v144-professional.css"), "utf8");
  assert.match(css, /@media\s*\(max-width:\s*430px\)/);
  assert.match(css, /@media\s*\(max-width:\s*390px\)/);
  assert.match(css, /@media\s*\(max-width:\s*360px\)/);
  assert.match(css, /@media\s*\(max-width:\s*320px\)/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /touch-action/);
  assert.match(css, /overflow-x:\s*hidden/);
});

const failures = results.filter(result => result.status === "FAIL");
for (const result of results) console.log(`${result.status.padEnd(4)}  ${result.name}${result.detail ? `\n${result.detail}` : ""}`);
console.log(`\n${results.length - failures.length}/${results.length} pruebas superadas.`);
if (failures.length) process.exitCode = 1;
