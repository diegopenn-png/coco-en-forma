import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const qaDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.dirname(qaDir);
const results = [];
let idCounter = 0;

function test(name, body) {
  try { body(); results.push({ name, status: "PASS" }); }
  catch (error) { results.push({ name, status: "FAIL", detail: error.stack || error.message }); }
}

function browserContext(extra = {}) {
  const location = { search: "", hostname: "localhost" };
  const window = {
    CocoV144: {
      id(prefix) { idCounter += 1; return `${prefix}-${String(idCounter).padStart(5, "0")}`; },
      today() { return "2026-08-15"; }, esc(value) { return String(value); }, body() { return null; },
      session: async () => null, client: () => null, toast() {}, sound() {}, openModal() {}, closeModal() {}, setModalTitle() {}
    },
    location, addEventListener() {}, removeEventListener() {}, ...extra
  };
  const context = vm.createContext({ window, self: window, globalThis: window, location, console, Set, Map, Date, Math, JSON, Object, Array, String, Number, Boolean, RegExp, Intl, Promise, AbortController, URLSearchParams, performance: { now: () => Date.now() }, crypto: { randomUUID: () => `qa-${++idCounter}` }, setTimeout, clearTimeout, setInterval, clearInterval });
  return { context, window };
}

function evaluate(file, setup) {
  const { context, window } = browserContext(setup);
  vm.runInContext(fs.readFileSync(path.join(rootDir, file), "utf8"), context, { filename: file });
  return window;
}

function snapshot(player) {
  return { playerId: player.id, codeSnapshot: player.code, nameSnapshot: player.name, levelSnapshot: player.currentLevel };
}

function session({ id, championshipId, players, score = null, date = "2026-01-01" }) {
  return {
    id, kind: championshipId ? "championship-date" : "mixing", championshipId: championshipId || null,
    name: championshipId ? `Fecha ${id}` : "Mixing histórico", date, courts: 1, courtLabels: ["1"], rounds: 1, matchMinutes: 20, timerMode: "limit",
    participants: players.map(snapshot), matches: [{ id: `match-${id}`, order: 1, round: 1, court: 1, courtLabel: "1", teamA: [players[0].id, players[1].id], teamB: [players[2].id, players[3].id], score, updatedAt: null }],
    createdAt: `${date}T00:00:00Z`, updatedAt: `${date}T00:00:00Z`
  };
}

function championship(id, players, mode = "points") {
  return { id, name: "Liga familiar", startDate: "2026-01-01", endDate: "", status: "active", participantIds: players.map(player => player.id), scoring: { mode, win: 3, draw: 1, loss: 0, tiebreakers: ["points", "gameDifference", "gamesWon", "headToHead"] }, createdAt: "2026-01-01T00:00:00Z", finishedAt: null, archivedAt: null };
}

test("Coco Pádel: exactamente Mixing, Campeonato y Jugadores", () => {
  const padel = evaluate("coco-v144-padel.js").CocoPadelV148;
  const audit = padel.audit(padel.blankState());
  assert.deepEqual(Array.from(audit.topTabs), ["Mixing", "Campeonato", "Jugadores"]);
  assert.equal(audit.playerCreationArea, "Jugadores");
  assert.equal(audit.unlimited, true);
  assert.equal(audit.mixingPersisted, false);
  assert.equal(audit.mixingAffectsPoints, false);
});

test("Coco Pádel: nombres duplicados conservan códigos únicos y no reutilizables", () => {
  const padel = evaluate("coco-v144-padel.js").CocoPadelV148, state = padel.blankState();
  const first = padel.createPlayer(state, "Diego", "bajo"), second = padel.createPlayer(state, "Diego", "alto");
  assert.equal(first.player.code, "CP-0001"); assert.equal(second.player.code, "CP-0002"); assert.equal(second.duplicateName, true);
  first.player.active = false;
  const third = padel.createPlayer(state, "Lucía", "medio").player;
  assert.equal(third.code, "CP-0003");
  first.player.name = "Diego editado";
  const restored = padel.normalize(JSON.parse(JSON.stringify(state)));
  assert.equal(restored.players[0].code, "CP-0001");
  assert.equal(new Set(restored.players.map(player => player.code)).size, 3);
});

test("Coco Pádel: Mixing histórico no aparece ni suma puntos", () => {
  const padel = evaluate("coco-v144-padel.js").CocoPadelV148, state = padel.blankState();
  const players = ["A", "B", "C", "D"].map((name, index) => padel.createPlayer(state, name, index === 0 ? "bajo" : "medio").player);
  const champ = championship("champ", players); state.championships.push(champ);
  state.sessions.push(session({ id: "c1", championshipId: champ.id, players, score: { gamesA: 6, gamesB: 4 } }));
  state.sessions.push(session({ id: "old-mixing", championshipId: null, players, score: { gamesA: 6, gamesB: 0 } }));
  const stats = padel.playerStats(state, players[0].id);
  assert.equal(stats.played, 1); assert.equal(stats.won, 1); assert.equal(stats.points, 3); assert.equal(stats.history.length, 1);
  assert.equal(stats.history[0].championshipId, champ.id);
  assert.equal(padel.championshipPointsMap(state)[players[0].id], 3);
});

test("Coco Pádel: 20 jornadas acumulan, corrigen y eliminan sin duplicar", () => {
  const padel = evaluate("coco-v144-padel.js").CocoPadelV148, state = padel.blankState();
  const players = ["Diego", "Diego", "Ana", "Bruno"].map((name, index) => padel.createPlayer(state, name, ["bajo", "medio", "alto", "medio"][index]).player);
  const champ = championship("champ-20", players); state.championships.push(champ);
  for (let index = 1; index <= 20; index += 1) {
    const date = `2026-01-${String(index).padStart(2, "0")}`, selected = session({ id: `d${index}`, championshipId: champ.id, players, date });
    state.sessions.push(selected); padel.saveResult(state, selected.id, selected.matches[0].id, 6, index % 2 ? 4 : 6);
  }
  let rows = padel.championshipStandings(state, champ.id);
  assert.equal(rows.length, 4); assert.ok(rows.every(row => row.played === 20)); assert.equal(rows[0].position, 1);
  const before = rows.find(row => row.id === players[0].id);
  padel.saveResult(state, "d1", "match-d1", 1, 6);
  rows = padel.championshipStandings(state, champ.id);
  const corrected = rows.find(row => row.id === players[0].id);
  assert.equal(corrected.played, 20); assert.notEqual(corrected.gamesWon, before.gamesWon);
  padel.deleteResult(state, "d2", "match-d2");
  rows = padel.championshipStandings(state, champ.id);
  assert.equal(rows.find(row => row.id === players[0].id).played, 19);
});

test("Coco Pádel: el cambio manual conserva el nivel histórico", () => {
  const padel = evaluate("coco-v144-padel.js").CocoPadelV148, state = padel.blankState();
  const players = [padel.createPlayer(state, "Elena", "bajo").player, ...["B", "C", "D"].map(name => padel.createPlayer(state, name, "medio").player)];
  const champ = championship("champ-level", players, "games"); state.championships.push(champ);
  state.sessions.push(session({ id: "level-date", championshipId: champ.id, players, score: { gamesA: 6, gamesB: 3 } }));
  const change = padel.changePlayerLevel(state, players[0].id, "medio", champ.id, "Buen rendimiento");
  assert.equal(change.previousLevel, "bajo"); assert.equal(players[0].currentLevel, "medio");
  assert.equal(padel.playerHistory(state, players[0].id)[0].levelSnapshot, "bajo");
});

test("Runner: todas las misiones pasan validación previa en los tres niveles", () => {
  const runner = evaluate("coco-v144-runner.js").CocoRunnerV148;
  for (const level of [1, 2, 3]) for (let index = 0; index < 80; index += 1) {
    const mission = runner.missionForLevel(level, `qa-${level}-${index}`), validation = runner.validateMission(mission);
    assert.equal(validation.valid, true, validation.failures.join(", "));
    assert.ok(validation.guaranteedPerSegment >= mission.memory.sequence.length);
  }
});

test("Runner: triángulos, estrellas, círculos, cuadrados y todas las reglas tienen objetivo y distractor", () => {
  const runner = evaluate("coco-v144-runner.js").CocoRunnerV148, catalog = runner.catalog();
  const star = catalog.shapes.find(shape => shape.id === "estrella"), blue = catalog.colors[0], category = catalog.categories[0];
  const rules = [
    ...catalog.shapes.map(target => ({ type: "shape", target })), { type: "color", target: blue }, { type: "even" }, { type: "odd" },
    { type: "category", target: category }, { type: "shape-color", shape: star, color: blue },
    { type: "category-color", category, color: blue }, { type: "sequence", sequence: catalog.colors.slice(0, 3), index: 0, target: blue },
    { type: "calculation", parity: "par" }, { type: "calculation", parity: "impar" }, { type: "opposite-color", target: blue }
  ];
  let value = 0; const random = () => ((value = (value + 0.173) % 1));
  for (const level of [1, 2, 3]) for (const rule of rules) {
    const target = runner.makeTokenForRule(rule, random, level, true), distractor = runner.makeTokenForRule(rule, random, level, false);
    assert.equal(runner.tokenMatchesRule(target, rule), true, `${rule.type}/L${level}`);
    assert.equal(runner.tokenMatchesRule(distractor, rule), false, `${rule.type}/L${level}`);
    const plan = runner.buildRulePlan(rule, level, 60, random);
    assert.equal(plan.firstTarget, true, `${rule.type}/L${level}: el primer objeto no es válido`);
    assert.ok(plan.targets >= 12 && plan.distractors >= 6, `${rule.type}/L${level}: proporción insuficiente`);
    assert.ok(plan.maxDistractorGap <= level + 1, `${rule.type}/L${level}: demasiados distractores seguidos`);
  }
  const expectedGlyphs = { circulo: "●", cuadrado: "■", triangulo: "▲", estrella: "★" };
  for (const shape of catalog.shapes) assert.equal(runner.makeTokenForRule({ type: "shape", target: shape }, random, 1, true).glyph, expectedGlyphs[shape.id]);
});

test("Runner: objetivos garantizados y códigos internos invisibles", () => {
  const source = fs.readFileSync(path.join(rootDir, "coco-v144-runner.js"), "utf8");
  assert.match(source, /La dificultad cambia las reglas y los distractores, no solo la velocidad\./);
  assert.doesNotMatch(source, /3196364135/);
  assert.doesNotMatch(source, /Misión '\s*\+\s*C\.esc\(mission\.id/);
  assert.match(source, /forcedCorrect:\s*2/); assert.match(source, /spawnsSinceCorrect\s*>=\s*correctGapLimit/);
  assert.match(source, /beginNewRule\(true\)/); assert.match(source, /validateMission/);
});

test("Runner: finito, una vez al día y en la clasificación general", () => {
  const runner = evaluate("coco-v144-runner.js").CocoRunnerV148, audit = runner.audit();
  assert.deepEqual(Array.from(audit.durationSeconds), [132, 162, 198]); assert.equal(audit.dailyLimit, 1);
  assert.equal(audit.rankingWrites, true); assert.equal(audit.partidasTableWrites, true); assert.equal(audit.generalLeaderboard, true); assert.equal(audit.ownLeaderboard, false);
  assert.equal(audit.preflightValidation, true); assert.equal(audit.firstTargetGuaranteed, true);
  assert.equal(audit.targetBaseSize, 112); assert.ok(audit.targetApproachScale >= 1.6);
  assert.equal(audit.neutralApproachSound, true); assert.equal(audit.audioUnlockForSafariPwa, true);
  const source = fs.readFileSync(path.join(rootDir, "coco-v144-runner.js"), "utf8");
  assert.match(source, /from\("coco_runner_history"\)\.insert/); assert.match(source, /CocoArcadeV133/); assert.match(source, /saveScore\(GAME_ID/);
  assert.doesNotMatch(source, /Sin ranking|No suma puntos generales|no ha sumado ningún punto/i);
});

test("Runner: audio desbloqueable en Safari/PWA y feedback neutral de aproximación", () => {
  const core = fs.readFileSync(path.join(rootDir, "coco-v144-core.js"), "utf8"), runner = fs.readFileSync(path.join(rootDir, "coco-v144-runner.js"), "utf8");
  assert.match(core, /function unlockAudio/); assert.match(core, /context\.state === "suspended"/); assert.match(core, /context\.resume\(\)/);
  assert.match(core, /approach:/); assert.match(core, /warning:/); assert.match(runner, /C\.sound\(item\.kind === "obstacle" \? "warning" : "approach"\)/);
  assert.match(runner, /addEventListener\("pointerdown"[^\n]+C\.unlockAudio/); assert.match(runner, /c147RunnerTokenGlyph/); assert.match(runner, /c147RunnerTokenLabel/);
});

test("Runner: fórmula general normalizada, justa y sin velocidad como criterio", () => {
  const runner = evaluate("coco-v144-runner.js").CocoRunnerV148;
  const weak = runner.generalScoreFor({ level: 3, accuracy: 0, correctObjects: 0, availableTargets: 20, distractorsPicked: 8, sequencesRemembered: 0, obstacleCount: 8, obstaclesPassed: 0 });
  const basic = runner.generalScoreFor({ level: 1, accuracy: 90, correctObjects: 18, availableTargets: 20, distractorsPicked: 2, sequencesRemembered: 2, obstacleCount: 8, obstaclesPassed: 7 });
  const advanced = runner.generalScoreFor({ level: 3, accuracy: 90, correctObjects: 18, availableTargets: 20, distractorsPicked: 2, sequencesRemembered: 3, obstacleCount: 8, obstaclesPassed: 7 });
  assert.equal(weak, 0); assert.ok(basic > 0 && basic <= 320); assert.ok(advanced >= basic && advanced <= 320);
  assert.equal(runner.generalScoreFor({ level: 3, accuracy: 100, correctObjects: 20, availableTargets: 20, distractorsPicked: 0, sequencesRemembered: 3, obstacleCount: 8, obstaclesPassed: 8 }), 320);
});

test("Coco Pádel: interfaz de Mixing no crea jugadores, no muestra historial y no registra resultados", () => {
  const source = fs.readFileSync(path.join(rootDir, "coco-v144-padel.js"), "utf8");
  const mixingBlock = source.slice(source.indexOf("function mixingHtml"), source.indexOf("function championshipListHtml"));
  assert.doesNotMatch(mixingBlock, /createPlayerFormHtml|sessionListHtml|sessionDetailHtml|saveResult/);
  assert.match(source, /no guarda historial/i); assert.match(source, /No suma puntos/);
  assert.match(source, /if \(selected\.championshipId\) \{\s*state\.sessions\.push/);
  assert.match(source, /data-padel144-swap-mixing/); assert.match(source, /data-padel144-reset-mixing/);
  assert.match(source, /Crear nuevo mixing/); assert.match(source, /Continuar mixing/); assert.match(source, /PASO 1 DE 5/);
});

test("Coco Pádel: Jugadores reúne alta, búsqueda, nivel, estado, edición y puntos", () => {
  const source = fs.readFileSync(path.join(rootDir, "coco-v144-padel.js"), "utf8");
  for (const marker of ["Añadir jugador", "data-padel144-directory-search", "data-padel144-directory-level", "data-padel144-directory-status", "data-padel144-player-level", "data-padel144-edit-player", "data-padel144-toggle-player", "puntos"]) assert.ok(source.includes(marker), marker);
  assert.match(source, /playerPointsSource:\s*"championship-results-only"/);
  assert.match(source, /c146PlayerMetrics/); assert.doesNotMatch(source, /HISTORIAL CRONOLÓGICO|Partidos, parejas y rivales|Plantilla del campeonato/);
});

test("Coco Pádel: Campeonato usa portada, creación por pasos y detalle independiente", () => {
  const source = fs.readFileSync(path.join(rootDir, "coco-v144-padel.js"), "utf8");
  for (const marker of ["Crear campeonato", "Campeonatos en curso", "Ver finalizados y archivados", "Añadir jornada", "Volver a campeonatos", "data-padel146-champ-next"]) assert.ok(source.includes(marker), marker);
  assert.doesNotMatch(source, /Plantilla del campeonato/);
  assert.match(source, /championshipScreen === "create"/); assert.match(source, /championshipScreen === "detail"/);
});

test("Encuentra las diferencias: cambios integrados y ninguna pista previa", () => {
  const differences = evaluate("coco-v144-differences.js").CocoDifferencesProV148, audit = differences.audit();
  assert.deepEqual(Array.from(audit.differenceKinds), ["color", "shape", "presence"]);
  assert.equal(audit.allowedKindsOnly, true); assert.equal(audit.brokenObjects, false); assert.equal(audit.deformedObjects, false); assert.equal(audit.blurredRemoval, false); assert.equal(audit.completeObjects, true);
  assert.equal(audit.sameDefinitionForVisualAndHit, true); assert.equal(audit.clickableFromBothImages, true); assert.equal(audit.falseClicksAccepted, false);
  assert.equal(audit.preAnswerMarkers, false); assert.equal(audit.genericCircleMarkers, false); assert.equal(audit.genericStarMarkers, false); assert.equal(audit.foundFeedbackOnlyAfterCorrectTap, true);
  assert.equal(audit.sceneCount, 10); assert.equal(audit.combinationsPerLevel, 30); assert.equal(audit.everySceneHasSix, true);
  const source = fs.readFileSync(path.join(rootDir, "coco-v144-differences.js"), "utf8");
  assert.doesNotMatch(source, /drawCompleteObject|markerRect|strokeStyle\s*=\s*["']rgba\(255,255,255/);
  assert.match(source, /recolorNaturalRegion/); assert.match(source, /drawIntegratedDetail/); assert.match(source, /drawContextProp/);
});

test("PWA: caché v148 contiene todos sus recursos y no contiene Inglés", () => {
  const sw = fs.readFileSync(path.join(rootDir, "sw.js"), "utf8");
  assert.match(sw, /coco-en-forma-v148\.0\.0/); assert.match(sw, /coco-v147-refinements\.css/); assert.doesNotMatch(sw, /ingles|english/i);
  const paths = Array.from(sw.matchAll(/"\.\/([^"?]+)"/g), match => match[1]).filter(Boolean);
  for (const asset of paths) assert.ok(fs.existsSync(path.join(rootDir, asset)), `Falta ${asset}`);
});

test("Integración: v148 carga los módulos corregidos y registra Coco Corre como general", () => {
  const html = fs.readFileSync(path.join(rootDir, "index.html"), "utf8");
  for (const file of ["coco-v144-core.js?v=14800", "coco-v144-padel.js?v=14800", "coco-v144-runner.js?v=14800", "coco-v147-refinements.css?v=14800"]) assert.ok(html.includes(file), file);
  assert.ok(html.includes("2026-08-15-v148.0-profesional")); assert.ok(html.includes('id:"cococorre",nombre:"Coco Corre",grupo:"general"'));
  assert.match(html, /GENERAL_IDS=\[[^\]]*"cococorre"/); assert.match(html, /saveScore:saveScore/);
  assert.doesNotMatch(html, /ingl[eé]s|english/i);
});

test("Integridad estática: todas las rutas locales declaradas existen", () => {
  const html = fs.readFileSync(path.join(rootDir, "index.html"), "utf8"), sw = fs.readFileSync(path.join(rootDir, "sw.js"), "utf8");
  const refs = new Set([
    ...Array.from(html.matchAll(/(?:src|href)=["'](\.\.?\/[^"'#?]+)(?:[?#][^"']*)?["']/g), match => match[1]),
    ...Array.from(sw.matchAll(/["'](\.\/[^"'?]+)["']/g), match => match[1])
  ]);
  for (const ref of refs) {
    const relative = ref.replace(/^\.\//, "");
    assert.ok(fs.existsSync(path.join(rootDir, relative)), `Ruta local ausente: ${ref}`);
  }
});

test("Responsive y accesibilidad: 320, 360, 390 y 430; sin desbordamiento global", () => {
  const css = fs.readFileSync(path.join(rootDir, "coco-v144-professional.css"), "utf8") + fs.readFileSync(path.join(rootDir, "coco-v147-refinements.css"), "utf8");
  for (const width of [320, 360, 390, 430]) assert.match(css, new RegExp(`max-width:\\s*${width}px`));
  assert.match(css, /prefers-reduced-motion:\s*reduce/); assert.match(css, /overflow-x:\s*hidden/); assert.match(css, /min-height:44px/);
});

test("Migración existente sigue siendo aditiva, reversible y protegida por RLS", () => {
  const migration = fs.readFileSync(path.join(rootDir, "supabase-coco-v144.sql"), "utf8"), rollback = fs.readFileSync(path.join(rootDir, "supabase-coco-v144-rollback.sql"), "utf8");
  assert.match(migration, /create table if not exists public\.coco_runner_history/i); assert.match(migration, /enable row level security/i);
  assert.doesNotMatch(migration, /drop\s+table|truncate|delete\s+from/i); assert.match(rollback, /drop table if exists public\.coco_runner_history/i);
});

test("Política v148: solo la cuenta de prueba indicada recibe partidas ilimitadas", () => {
  const html = fs.readFileSync(path.join(rootDir, "index.html"), "utf8"), runtime = fs.readFileSync(path.join(rootDir, "coco-v142-runtime.js"), "utf8");
  const allowlist = html.match(/cuentasPruebaIlimitadas:\[([^\]]*)\]/);
  assert.ok(allowlist); assert.equal(allowlist[1].replace(/\s/g, ""), "'diegopenn@icloud.com'");
  assert.match(runtime, /function isUnlimitedUser\(userId\)/); assert.match(runtime, /requested === String\(remoteUserId\)/);
  assert.match(runtime, /unlimitedTestEmails\(\)\.indexOf\(remoteUserEmail\) >= 0/);
  assert.match(runtime, /if \(isUnlimitedUser\(resolvedUser\)\) return true/);
  assert.match(runtime, /window\.CocoDailyV148 = window\.CocoDailyV134/);
});

test("Política v148: las repeticiones de prueba no duplican puntuación ni cierres diarios", () => {
  const html = fs.readFileSync(path.join(rootDir, "index.html"), "utf8"), unified = fs.readFileSync(path.join(rootDir, "coco-v142-unified.js"), "utf8");
  const runner = fs.readFileSync(path.join(rootDir, "coco-v144-runner.js"), "utf8"), differences = fs.readFileSync(path.join(rootDir, "coco-v144-differences.js"), "utf8");
  assert.match(html, /test:true,unranked:true/); assert.match(html, /Modo de pruebas: puedes repetir; solo el primer resultado diario puntúa/);
  assert.match(html, /pruebaNoPuntuable/); assert.match(html, /sin sumar otra vez al progreso ni a la clasificación/);
  assert.match(unified, /if \(result\.unlimited\) clearCardComplete\(gameId\)/);
  assert.match(runner, /rankingTest/); assert.match(runner, /extraTestRunsRanked: false/);
  assert.match(differences, /extraTestRunsRanked: false/); assert.match(differences, /CocoArcadeV133/);
});

const failures = results.filter(result => result.status === "FAIL");
for (const result of results) console.log(`${result.status.padEnd(4)}  ${result.name}${result.detail ? `\n${result.detail}` : ""}`);
console.log(`\n${results.length - failures.length}/${results.length} pruebas superadas.`);
if (failures.length) process.exitCode = 1;
