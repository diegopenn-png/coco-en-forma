import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const qaDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.dirname(qaDir);
const results = [];
let idCounter = 0;

async function test(name, body) {
  try { await body(); results.push({ name, status: "PASS" }); }
  catch (error) { results.push({ name, status: "FAIL", detail: error.stack || error.message }); }
}

function browserContext(extra = {}) {
  const location = { search: "", hostname: "localhost" };
  const window = {
    CocoV144: {
      id(prefix) { idCounter += 1; return `${prefix}-${String(idCounter).padStart(6, "0")}`; },
      today() { return "2026-08-15"; }, esc(value) { return String(value); }, body() { return null; },
      session: async () => null, client: () => null, toast() {}, sound() {}, openModal() {}, closeModal() {}, setModalTitle() {}
    },
    location, addEventListener() {}, removeEventListener() {}, ...extra
  };
  const context = vm.createContext({ window, self: window, globalThis: window, location, console, Set, Map, Date, Math, JSON, Object, Array, String, Number, Boolean, RegExp, Intl, Promise, AbortController, URLSearchParams, TextEncoder, Blob, performance: { now: () => Date.now() }, crypto: { randomUUID: () => `qa-${++idCounter}` }, setTimeout, clearTimeout, setInterval, clearInterval });
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

function makeSession({ id, championshipId, players, score = null, date = "2026-01-01" }) {
  return {
    id, kind: championshipId ? "championship-date" : "mixing", championshipId: championshipId || null,
    name: championshipId ? `Jornada ${id}` : "Mixing temporal", date, courts: 1, courtLabels: ["Central"], rounds: 1, matchMinutes: 20, timerMode: "limit",
    participants: players.map(snapshot), matches: [{ id: `match-${id}`, order: 1, round: 1, court: 1, courtLabel: "Central", teamA: [players[0].id, players[1].id], teamB: [players[2].id, players[3].id], score, updatedAt: null }],
    createdAt: `${date}T00:00:00Z`, updatedAt: `${date}T00:00:00Z`
  };
}

function makeChampionship(id, players, name = "Liga familiar", mode = "points") {
  return { id, name, startDate: "2026-01-01", endDate: "", status: "active", participantIds: players.map(player => player.id), scoring: { mode, win: 3, draw: 1, loss: 0, tiebreakers: ["points", "gameDifference", "gamesWon", "headToHead"] }, createdAt: "2026-01-01T00:00:00Z", finishedAt: null, archivedAt: null };
}

await test("Coco Corre: 180 misiones pasan la validación previa", () => {
  const runner = evaluate("coco-v144-runner.js").CocoRunnerV149;
  for (const level of [1, 2, 3]) for (let index = 0; index < 60; index += 1) {
    const mission = runner.missionForLevel(level, `v149-${level}-${index}`), validation = runner.validateMission(mission);
    assert.equal(validation.valid, true, validation.failures.join(", "));
    assert.equal(validation.firstTargetIndex, 1);
    assert.equal(validation.startsWithDistractor, true);
    assert.ok(validation.guaranteedPerSegment >= mission.memory.sequence.length);
  }
});

await test("Coco Corre: cada regla comienza distractor, objetivo, distractor y sigue siendo completable", () => {
  const runner = evaluate("coco-v144-runner.js").CocoRunnerV149, catalog = runner.catalog();
  const rules = [
    ...catalog.shapes.map(target => ({ type: "shape", target })),
    ...catalog.colors.map(target => ({ type: "color", target })),
    { type: "even" }, { type: "odd" },
    ...catalog.categories.map(target => ({ type: "category", target })),
    { type: "shape-color", shape: catalog.shapes[2], color: catalog.colors[3] },
    { type: "category-color", category: catalog.categories[0], color: catalog.colors[3] },
    { type: "sequence", sequence: catalog.colors.slice(0, 3), index: 0, target: catalog.colors[0] },
    { type: "calculation", parity: "par" }, { type: "calculation", parity: "impar" },
    { type: "opposite-color", target: catalog.colors[1] }
  ];
  let value = .071; const random = () => ((value = (value + .173) % 1));
  for (const level of [1, 2, 3]) for (const rule of rules) {
    const opening = runner.openingPlanForRule(rule, random, level);
    assert.deepEqual(Array.from(opening, token => runner.tokenMatchesRule(token, rule)), [false, true, false, true, false], `${rule.type}/L${level}`);
    const plan = runner.buildRulePlan(rule, level, 48, random);
    assert.equal(plan.firstTargetIndex, 1); assert.equal(plan.startsWithDistractor, true);
    assert.ok(plan.targets >= 8); assert.ok(plan.distractors >= 5);
    assert.ok(plan.maxDistractorGap <= level + 1);
  }
});

await test("Coco Corre: herramientas moradas conviven con herramientas de otros colores", () => {
  const runner = evaluate("coco-v144-runner.js").CocoRunnerV149, catalog = runner.catalog();
  const tools = catalog.categories.find(category => category.id === "herramientas"), purple = catalog.colors.find(color => color.id === "morado");
  const rule = { type: "category-color", category: tools, color: purple };
  let value = .11; const opening = runner.openingPlanForRule(rule, () => ((value = (value + .231) % 1)), 3);
  assert.ok(opening.every(token => token.category.id === "herramientas"));
  const colors = new Set(opening.map(token => token.color.id));
  assert.ok(colors.has("morado")); assert.ok(colors.size >= 3);
  assert.deepEqual(Array.from(opening, token => token.correct), [false, true, false, true, false]);
});

await test("Coco Corre: triángulos y estrellas se dibujan con su glifo real", () => {
  const runner = evaluate("coco-v144-runner.js").CocoRunnerV149, catalog = runner.catalog();
  let value = .13; const random = () => ((value = (value + .197) % 1));
  const triangle = catalog.shapes.find(shape => shape.id === "triangulo"), star = catalog.shapes.find(shape => shape.id === "estrella");
  assert.equal(runner.makeTokenForRule({ type: "shape", target: triangle }, random, 1, true).glyph, "▲");
  assert.equal(runner.makeTokenForRule({ type: "shape", target: star }, random, 1, true).glyph, "★");
});

await test("Coco Corre: obstáculos visualmente seguros, audio y sin respuestas reveladas", () => {
  const runner = evaluate("coco-v144-runner.js").CocoRunnerV149, audit = runner.audit();
  const source = fs.readFileSync(path.join(rootDir, "coco-v144-runner.js"), "utf8"), css = fs.readFileSync(path.join(rootDir, "coco-v149-refinements.css"), "utf8");
  assert.equal(audit.adjacentLaneVisualClearance, true); assert.ok(audit.obstacleApproachScale <= 1);
  assert.equal(audit.neutralApproachSound, true); assert.equal(audit.technicalErrorsHidden, true);
  assert.match(source, /C\.sound\(item\.kind === "obstacle" \? "warning" : "approach"\)/);
  assert.match(css, /c144RunnerObject\.obstacle[\s\S]*width:78px/); assert.match(css, /max-width:430px/);
  assert.equal(audit.correctAnswerStyling, false); assert.equal(audit.characterMotion, "stable-with-brief-functional-actions");
});

await test("Mensajes de juego: nunca exponen errores técnicos internos", () => {
  const html = fs.readFileSync(path.join(rootDir, "index.html"), "utf8"), runner = fs.readFileSync(path.join(rootDir, "coco-v144-runner.js"), "utf8");
  assert.doesNotMatch(html, /No se pudo guardar todavía:/);
  assert.doesNotMatch(html, /esc\(board\.error\)/);
  assert.doesNotMatch(html + runner, /Juego no válido: cococorre/);
  assert.match(html, /La puntuación se sincronizará automáticamente cuando vuelva la conexión/);
  assert.match(runner, /Misión completada\. La puntuación se sincronizará automáticamente/);
  assert.match(html, /coco-v149-user-copy-sanitizer/); assert.match(html, /technicalDetailsVisible:false/);
});

await test("Coco Corre: migración reversible y ruta segura de puntuación general", () => {
  const html = fs.readFileSync(path.join(rootDir, "index.html"), "utf8");
  const migration = fs.readFileSync(path.join(rootDir, "supabase-coco-v149.sql"), "utf8");
  const rollback = fs.readFileSync(path.join(rootDir, "supabase-coco-v149-rollback.sql"), "utf8");
  assert.match(html, /rpc\("registrar_coco_corre_v149",\{p_puntos:points\}\)/);
  assert.match(migration, /'cococorre'/); assert.match(migration, /partidas_juego_valido/);
  assert.match(migration, /p_puntos > 320/); assert.match(migration, /errcode = '23505'/);
  assert.match(migration, /coco_v149_constraint_backup/); assert.match(migration, /security definer/);
  assert.match(rollback, /constraint_definition/); assert.match(rollback, /drop function if exists public\.registrar_coco_corre_v149/);
  assert.doesNotMatch(rollback, /delete from public\.partidas|truncate/i);
});

await test("Coco Pádel: tres pestañas, ranking por torneo y exportación completa", () => {
  const padel = evaluate("coco-v144-padel.js").CocoPadelV149, audit = padel.audit(padel.blankState());
  assert.deepEqual(Array.from(audit.topTabs), ["Mixing", "Campeonato", "Jugadores"]);
  assert.equal(audit.tournamentRankingSelector, true); assert.equal(audit.whatsappExport.length, 4);
  assert.equal(audit.excelExport, "xlsx"); assert.equal(audit.printExport, true); assert.equal(audit.unlimited, true);
});

await test("Coco Pádel: dos Diegos reciben códigos permanentes distintos", () => {
  const padel = evaluate("coco-v144-padel.js").CocoPadelV149, state = padel.blankState();
  const first = padel.createPlayer(state, "Diego", "bajo"), second = padel.createPlayer(state, "Diego", "alto");
  assert.equal(first.player.code, "CP-0001"); assert.equal(second.player.code, "CP-0002"); assert.equal(second.duplicateName, true);
  first.player.active = false; first.player.name = "Diego P.";
  assert.equal(padel.createPlayer(state, "Ana", "medio").player.code, "CP-0003");
  const restored = padel.normalize(JSON.parse(JSON.stringify(state)));
  assert.equal(restored.players[0].code, "CP-0001"); assert.equal(restored.players[0].active, false);
});

await test("Coco Pádel: 20 jornadas acumulan, corrigen y eliminan sin duplicar", () => {
  const padel = evaluate("coco-v144-padel.js").CocoPadelV149, state = padel.blankState();
  const players = ["Diego", "Diego", "Ana", "Bruno"].map((name, index) => padel.createPlayer(state, name, ["bajo", "medio", "alto", "medio"][index]).player);
  const championship = makeChampionship("champ-20", players); state.championships.push(championship);
  for (let index = 1; index <= 20; index += 1) {
    const selected = makeSession({ id: `d${index}`, championshipId: championship.id, players, date: `2026-01-${String(index).padStart(2, "0")}` });
    state.sessions.push(selected); padel.saveResult(state, selected.id, selected.matches[0].id, 6, index % 2 ? 4 : 6);
  }
  let rows = padel.championshipStandings(state, championship.id);
  assert.ok(rows.every(row => row.played === 20));
  const before = rows.find(row => row.id === players[0].id).gamesWon;
  padel.saveResult(state, "d1", "match-d1", 1, 6);
  rows = padel.championshipStandings(state, championship.id);
  assert.equal(rows.find(row => row.id === players[0].id).played, 20);
  assert.notEqual(rows.find(row => row.id === players[0].id).gamesWon, before);
  padel.deleteResult(state, "d2", "match-d2");
  assert.equal(padel.championshipStandings(state, championship.id).find(row => row.id === players[0].id).played, 19);
});

await test("Coco Pádel: una jornada nunca altera otro campeonato", () => {
  const padel = evaluate("coco-v144-padel.js").CocoPadelV149, state = padel.blankState();
  const players = ["A", "B", "C", "D"].map(name => padel.createPlayer(state, name, "medio").player);
  const first = makeChampionship("one", players, "Torneo uno"), second = makeChampionship("two", players, "Torneo dos"); state.championships.push(first, second);
  state.sessions.push(makeSession({ id: "one-date", championshipId: first.id, players, score: { gamesA: 6, gamesB: 2 } }));
  assert.equal(padel.championshipStandings(state, first.id)[0].played, 1);
  assert.equal(padel.championshipStandings(state, second.id).every(row => row.played === 0), true);
});

await test("Coco Pádel: Mixing no suma puntos y el nivel histórico se conserva", () => {
  const padel = evaluate("coco-v144-padel.js").CocoPadelV149, state = padel.blankState();
  const players = ["Elena", "B", "C", "D"].map((name, index) => padel.createPlayer(state, name, index ? "medio" : "bajo").player);
  const championship = makeChampionship("level", players, "Liga niveles", "games"); state.championships.push(championship);
  state.sessions.push(makeSession({ id: "ranked", championshipId: championship.id, players, score: { gamesA: 6, gamesB: 3 } }));
  state.sessions.push(makeSession({ id: "mixing", championshipId: null, players, score: { gamesA: 9, gamesB: 0 } }));
  assert.equal(padel.playerStats(state, players[0].id).played, 1);
  const change = padel.changePlayerLevel(state, players[0].id, "medio", championship.id, "Revisión manual");
  assert.equal(change.previousLevel, "bajo"); assert.equal(players[0].currentLevel, "medio");
  assert.equal(padel.playerHistory(state, players[0].id)[0].levelSnapshot, "bajo");
});

await test("Coco Pádel: WhatsApp, jugadores y orden de pista contienen datos útiles", () => {
  const padel = evaluate("coco-v144-padel.js").CocoPadelV149, state = padel.blankState();
  const players = ["Alicia", "Beto", "Carla", "Diego"].map(name => padel.createPlayer(state, name, "medio").player);
  const championship = makeChampionship("export", players, "Copa agosto"); state.championships.push(championship);
  const selected = makeSession({ id: "export-date", championshipId: championship.id, players, score: { gamesA: 6, gamesB: 4 } }); state.sessions.push(selected);
  const ranking = padel.standingsPayload(championship, state), schedule = padel.schedulePayload(selected, "Jornada", state), directory = padel.playersPayload(state);
  assert.match(ranking.text, /RANKING ACTUALIZADO — Copa agosto/); assert.match(ranking.text, /1\. Alicia \(CP-0001\)/);
  assert.match(schedule.text, /Pista Central/); assert.match(schedule.text, /Alicia — CP-0001/);
  assert.equal(directory.rows.length, 4); assert.equal(ranking.fileName, "ranking-copa-agosto.xlsx");
});

await test("Coco Pádel: el archivo Excel es un XLSX válido", async () => {
  const padel = evaluate("coco-v144-padel.js").CocoPadelV149;
  const blob = padel.xlsxBlob({ sheetName: "Ranking", headers: ["Posición", "Jugador", "Puntos"], rows: [[1, "Diego", 30], [2, "Ana", 24]] });
  const target = "/tmp/coco-padel-v149-qa.xlsx";
  fs.writeFileSync(target, Buffer.from(await blob.arrayBuffer()));
  const listing = execFileSync("unzip", ["-t", target], { encoding: "utf8" });
  assert.match(listing, /No errors detected/); assert.ok(fs.statSync(target).size > 1000);
  const csv = "/tmp/coco-padel-v149-qa.csv"; if (fs.existsSync(csv)) fs.rmSync(csv);
  const officeProfile = fs.mkdtempSync("/tmp/coco-lo-v149-");
  execFileSync("soffice", [`-env:UserInstallation=file://${officeProfile}`, "--headless", "--convert-to", "csv", "--outdir", "/tmp", target], { stdio: "pipe" });
  assert.match(fs.readFileSync(csv, "utf8"), /Diego,30/);
  fs.rmSync(csv); fs.rmSync(target); fs.rmSync(officeProfile, { recursive: true, force: true });
});

await test("Coco Pádel: interfaz limpia, exportable y mobile-first", () => {
  const source = fs.readFileSync(path.join(rootDir, "coco-v144-padel.js"), "utf8"), css = fs.readFileSync(path.join(rootDir, "coco-v149-refinements.css"), "utf8");
  for (const marker of ["Ranking actualizado por torneos", "Copiar para WhatsApp", "Exportar a Excel", "Imprimir", "Crear nuevo mixing", "Crear campeonato", "Añadir jornada"]) assert.ok(source.includes(marker), marker);
  assert.doesNotMatch(source, /Plantilla del campeonato/); assert.match(source, /playerSummaryOnly: true/);
  assert.match(css, /c149ExportBar/); assert.match(css, /c149RankingCards/); assert.match(css, /max-width:430px/); assert.match(css, /max-width:320px/);
});

await test("Miniaturas sociales: los 15 juegos tienen imagen 1200×630 y página propia", () => {
  const games = ["numeros", "calculo", "palabras", "series", "memoria", "sudoku", "sopa", "crucigrama", "tiempo", "verdadero", "diferencias", "cococorre", "cocomed", "futbol", "padel"];
  const slugs = { cococorre: "coco-corre" };
  for (const id of games) {
    const image = path.join(rootDir, "share", `${id}-v149.png`), page = path.join(rootDir, "juego", slugs[id] || id, "index.html");
    assert.ok(fs.existsSync(image), image); assert.ok(fs.existsSync(page), page);
    const bytes = fs.readFileSync(image); assert.equal(bytes.readUInt32BE(16), 1200); assert.equal(bytes.readUInt32BE(20), 630);
    const html = fs.readFileSync(page, "utf8");
    assert.ok(html.includes(`share/${id}-v149.png`)); assert.match(html, /og:image:width" content="1200"/); assert.match(html, /twitter:card" content="summary_large_image"/);
  }
  assert.ok(fs.existsSync(path.join(rootDir, "share", "diferencias.png")), "Se conserva la miniatura histórica");
});

await test("Compartir: URLs específicas y portada general usan miniaturas v149", () => {
  const html = fs.readFileSync(path.join(rootDir, "index.html"), "utf8");
  assert.match(html, /slugs=\{cococorre:"coco-corre"\}/);
  assert.match(html, /share\/coco-en-forma-v149\.png/);
  assert.match(html, /og:image:width" content="1200"/); assert.match(html, /og:image:height" content="630"/);
});

await test("Encuentra las diferencias mantiene escenas naturales sin pistas previas", () => {
  const differences = evaluate("coco-v144-differences.js").CocoDifferencesProV149, audit = differences.audit();
  assert.deepEqual(Array.from(audit.differenceKinds), ["color", "shape", "presence"]);
  assert.equal(audit.brokenObjects, false); assert.equal(audit.deformedObjects, false); assert.equal(audit.preAnswerMarkers, false);
  assert.equal(audit.genericCircleMarkers, false); assert.equal(audit.genericStarMarkers, false); assert.equal(audit.clickableFromBothImages, true);
  assert.equal(audit.sceneCount, 10); assert.equal(audit.combinationsPerLevel, 30); assert.equal(audit.everySceneHasSix, true);
});

await test("Cuenta de prueba: solo diegopenn@icloud.com queda sin límite", () => {
  const html = fs.readFileSync(path.join(rootDir, "index.html"), "utf8"), runtime = fs.readFileSync(path.join(rootDir, "coco-v142-runtime.js"), "utf8");
  const allowlist = html.match(/cuentasPruebaIlimitadas:\[([^\]]*)\]/); assert.ok(allowlist);
  assert.equal(allowlist[1].replace(/\s/g, ""), "'diegopenn@icloud.com'");
  assert.match(runtime, /unlimitedTestEmails\(\)\.indexOf\(remoteUserEmail\) >= 0/);
  assert.match(runtime, /window\.CocoDailyV149 = window\.CocoDailyV134/);
});

await test("PWA v149: caché, rutas y recursos locales son íntegros", () => {
  const html = fs.readFileSync(path.join(rootDir, "index.html"), "utf8"), sw = fs.readFileSync(path.join(rootDir, "sw.js"), "utf8");
  assert.match(sw, /coco-en-forma-v149\.0\.0-r1/); assert.match(sw, /coco-v149-refinements\.css/); assert.doesNotMatch(sw, /ingles|english/i);
  for (const asset of Array.from(sw.matchAll(/"\.\/([^"?]+)"/g), match => match[1])) assert.ok(fs.existsSync(path.join(rootDir, asset)), `Falta ${asset}`);
  for (const file of ["coco-v144-core.js?v=14900", "coco-v144-padel.js?v=14900", "coco-v144-runner.js?v=14900", "coco-v149-refinements.css?v=14900"]) assert.ok(html.includes(file), file);
  assert.ok(html.includes("2026-08-15-v149.0-profesional")); assert.doesNotMatch(html, /ingl[eé]s|english/i);
});

await test("Responsive y accesibilidad: 320, 360, 390 y 430 sin desbordamiento global", () => {
  const css = ["coco-v144-professional.css", "coco-v147-refinements.css", "coco-v149-refinements.css"].map(file => fs.readFileSync(path.join(rootDir, file), "utf8")).join("\n");
  for (const width of [320, 360, 390, 430]) assert.match(css, new RegExp(`max-width:\\s*${width}px`));
  assert.match(css, /prefers-reduced-motion:reduce/); assert.match(css, /overflow-x:hidden/); assert.match(css, /min-height:44px/);
});

await test("La base v148 permanece idéntica a la copia de trabajo v148", () => {
  const base = path.resolve(rootDir, "..", "base-v1480"), previous = path.resolve(rootDir, "..", "..", "coco-v148", "work-v1480");
  const output = execFileSync("diff", ["-qr", base, previous], { encoding: "utf8" });
  assert.equal(output, "");
});

const failures = results.filter(result => result.status === "FAIL");
for (const result of results) console.log(`${result.status.padEnd(4)}  ${result.name}${result.detail ? `\n${result.detail}` : ""}`);
console.log(`\n${results.length - failures.length}/${results.length} pruebas superadas.`);
if (failures.length) process.exitCode = 1;
