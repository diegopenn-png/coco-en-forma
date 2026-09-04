import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
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
  const location = { search: "", hostname: "localhost", href: "http://localhost/" };
  const window = {
    CocoV144: {
      id(prefix) { return `${prefix}-${++idCounter}`; },
      today() { return "2026-08-17"; },
      esc(value) { return String(value); },
      body() { return null; },
      session: async () => null,
      client: () => null,
      toast() {}, sound() {}, openModal() {}, closeModal() {}, setModalTitle() {}
    },
    location,
    open() { return {}; },
    addEventListener() {}, removeEventListener() {},
    ...extra
  };
  const context = vm.createContext({
    window, self: window, globalThis: window, location, console, Set, Map, Date, Math, JSON, Object, Array, String, Number, Boolean, RegExp, Intl, Promise, AbortController, URLSearchParams, TextEncoder, Blob,
    navigator: { clipboard: { writeText: async () => {} } },
    document: { createElement() { return { style:{}, select(){}, remove(){}, click(){}, setAttribute(){}, appendChild(){}, innerHTML:"", value:"" }; }, body: { appendChild(){} }, execCommand(){ return true; } },
    performance: { now: () => Date.now() },
    crypto: { randomUUID: () => `qa-${++idCounter}` },
    setTimeout, clearTimeout, setInterval, clearInterval, requestAnimationFrame: () => 1, cancelAnimationFrame() {}
  });
  return { context, window };
}

function evaluate(file, setup) {
  const { context, window } = browserContext(setup);
  vm.runInContext(fs.readFileSync(path.join(rootDir, file), "utf8"), context, { filename: file });
  return window;
}

await test("La v151 carga módulos nuevos sin sustituir la clasificación general", () => {
  const html = fs.readFileSync(path.join(rootDir, "index.html"), "utf8");
  for (const file of ["coco-v151-padel.js?v=15100","coco-v151-runner.js?v=15100","coco-v151-differences.js?v=15100","coco-v151-refinements.css?v=15100"]) assert.ok(html.includes(file), file);
  assert.match(html, /rpc\("clasificacion_general_coco",\{p_limit:50\}\)/);
  assert.match(html, /2026-08-17-v151\.0-mejora-profesional/);
});

await test("Las tarjetas ya no consultan ni muestran micro-puntuaciones", () => {
  const html = fs.readFileSync(path.join(rootDir, "index.html"), "utf8");
  const css = fs.readFileSync(path.join(rootDir, "coco-v151-refinements.css"), "utf8");
  const refresh = html.match(/async function refreshCardScore[\s\S]*?function upgradeCard/)?.[0] || "";
  assert.doesNotMatch(refresh, /loadStats\(/);
  assert.doesNotMatch(html, /score\.className="cocoArcadeCardScore"/);
  assert.match(css, /\.cocoArcadeCardScore\{display:none!important\}/);
});

await test("Coco Pádel usa exclusivamente Campeonato y elimina Excel/impresión de la interfaz", () => {
  const source = fs.readFileSync(path.join(rootDir, "coco-v151-padel.js"), "utf8");
  const padel = evaluate("coco-v151-padel.js").CocoPadelV151;
  const audit = padel.audit(padel.blankState());
  assert.equal(audit.terminology, "campeonato");
  assert.equal(audit.excelExport, false);
  assert.equal(audit.printExport, false);
  assert.equal(audit.clipboardCopy, true);
  assert.equal(audit.whatsappDirect.length, 4);
  assert.doesNotMatch(source, /\btorneo(?:s)?\b/i);
  assert.doesNotMatch(source, /data-padel149-excel|data-padel149-print/);
  assert.match(source, /https:\/\/wa\.me\/\?text=/);
});

await test("Coco Pádel guarda resultados set a set y recalcula el ranking", () => {
  const padel = evaluate("coco-v151-padel.js").CocoPadelV151;
  const state = padel.blankState();
  const players = ["Ana","Bea","Cris","Dani"].map(name => padel.createPlayer(state, name, "medio").player);
  state.championships.push({ id:"champ-1", name:"Liga Coco", startDate:"2026-08-17", endDate:"", status:"active", participantIds:players.map(p=>p.id), scoring:{mode:"points",win:3,draw:1,loss:0,tiebreakers:["points","setDifference","gameDifference","setsWon","gamesWon","headToHead"]}, createdAt:new Date().toISOString(), finishedAt:null, archivedAt:null });
  state.sessions.push({ id:"day-1", kind:"championship-date", championshipId:"champ-1", name:"Jornada 1", date:"2026-08-17", courts:1, courtLabels:["1"], rounds:1, matchMinutes:20, timerMode:"limit", participants:players.map(p=>({playerId:p.id,codeSnapshot:p.code,nameSnapshot:p.name,levelSnapshot:"medio"})), matches:[{id:"m1",order:1,round:1,court:1,courtLabel:"1",teamA:[players[0].id,players[1].id],teamB:[players[2].id,players[3].id],score:null,updatedAt:null}], createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() });
  padel.saveResult(state,"day-1","m1",[{a:6,b:4},{a:3,b:6},{a:10,b:7}]);
  const rows = padel.championshipStandings(state,"champ-1");
  const ana = rows.find(row=>row.id===players[0].id), cris = rows.find(row=>row.id===players[2].id);
  assert.equal(ana.position,1);
  assert.equal(ana.played,1); assert.equal(ana.won,1); assert.equal(ana.setsWon,2); assert.equal(ana.setsLost,1); assert.equal(ana.gamesWon,19); assert.equal(ana.gamesLost,17); assert.equal(ana.points,3);
  assert.equal(cris.lost,1); assert.equal(cris.setsWon,1); assert.equal(cris.setsLost,2);
  const stats = padel.playerStats(state,players[0].id);
  assert.equal(stats.championships,1); assert.equal(stats.dates,1); assert.equal(stats.setsWon,2); assert.equal(stats.currentPositions[0].position,1);
});

await test("Coco Pádel tiene buscador explícito, parcial y sin tildes", () => {
  const source = fs.readFileSync(path.join(rootDir, "coco-v151-padel.js"), "utf8");
  assert.match(source, /data-padel151-find-player>Buscar</);
  assert.match(source, /normalize\("NFD"\)/);
  assert.match(source, /scrollIntoView\(\{ behavior: "smooth", block: "center" \}\)/);
  assert.match(source, /c151PlayerLocated/);
});

await test("Coco Corre cambia consignas como máximo cada 15 segundos y empieza con distractor", () => {
  const runner = evaluate("coco-v151-runner.js").CocoRunnerV151;
  const audit = runner.audit();
  assert.equal(audit.maxRuleSeconds,15);
  assert.deepEqual(Object.values(audit.ruleIntervalsSeconds),[15,12,10]);
  assert.equal(audit.firstObjectAfterRuleChange,"distractor");
  for (const level of [1,2,3]) for (let i=0;i<40;i++) {
    const mission = runner.missionForLevel(level,`v151-${level}-${i}`);
    const validation = runner.validateMission(mission);
    assert.equal(validation.valid,true,validation.failures.join(","));
    assert.equal(validation.startsWithDistractor,true);
    assert.equal(validation.firstTargetIndex,1);
  }
});

await test("Coco Corre es street-skate, incluye salto/agacharse y no usa emojis de catálogo", () => {
  const source = fs.readFileSync(path.join(rootDir, "coco-v151-runner.js"), "utf8");
  const runner = evaluate("coco-v151-runner.js").CocoRunnerV151;
  const audit = runner.audit(), catalog=runner.catalog();
  assert.equal(audit.theme,"urban-skate"); assert.equal(audit.skateboard,true); assert.equal(audit.pushAnimation,true);
  assert.deepEqual(Array.from(audit.actions),["lane","jump","duck"]);
  assert.ok(catalog.categories.length >= 10);
  assert.ok(catalog.categories.every(category=>category.items.length>=6));
  const emoji=/[\u{1F300}-\u{1FAFF}]/u;
  assert.equal(emoji.test(source),false);
  assert.match(source,/c151Barricade/); assert.match(source,/c151OverheadBarrier/);
});

await test("Diferencias usa pares precompuestos y jamás pinta cambios sintéticos en runtime", () => {
  const diff = evaluate("coco-v151-differences.js").CocoDifferencesProV151;
  const audit=diff.audit();
  assert.equal(audit.sceneCount,10); assert.equal(audit.variantsPerScene,3); assert.equal(audit.everySceneHasSix,true);
  assert.equal(audit.precomposedPairs,true); assert.equal(audit.runtimeSyntheticOverlays,false); assert.equal(audit.runtimeCanvasPatches,false);
  assert.equal(audit.clickableFromBothImages,true); assert.equal(audit.falseClicksAccepted,false);
  for (const scene of diff.scenes) {
    assert.equal(scene.variants.length,3);
    assert.ok(fs.existsSync(path.join(rootDir,scene.left.split("?")[0])),scene.left);
    for (const variant of scene.variants) {
      assert.equal(variant.differences.length,6);
      assert.ok(fs.existsSync(path.join(rootDir,variant.src.split("?")[0])),variant.src);
      for (const item of variant.differences) {
        assert.ok(item.w>=8 && item.h>=8,`${scene.id}/${item.key}`);
        assert.ok(item.x>=0 && item.x<=100 && item.y>=0 && item.y<=100,`${scene.id}/${item.key}`);
      }
    }
  }
});

await test("Las escenas v151 son 40 archivos locales y el service worker las precachea", () => {
  const sw=fs.readFileSync(path.join(rootDir,"sw.js"),"utf8");
  const assets=Array.from(sw.matchAll(/"\.\/scenes\/(scene-[^"]+-v151-[^"]+\.webp)"/g),m=>m[1]);
  assert.equal(assets.length,40);
  assert.equal(new Set(assets).size,40);
  for (const asset of assets) assert.ok(fs.existsSync(path.join(rootDir,"scenes",asset)),asset);
});

await test("PWA v151 precachea todos los recursos declarados", () => {
  const sw=fs.readFileSync(path.join(rootDir,"sw.js"),"utf8");
  assert.match(sw,/coco-en-forma-v151\.0\.0-r1/);
  for (const asset of Array.from(sw.matchAll(/"\.\/([^"?]+)"/g),m=>m[1])) assert.ok(fs.existsSync(path.join(rootDir,asset)),asset);
  const manifest=JSON.parse(fs.readFileSync(path.join(rootDir,"manifest.webmanifest"),"utf8"));
  assert.equal(manifest.start_url,"./?source=pwa-v151");
});

await test("Supabase de clasificaciones se mantiene sin migración destructiva nueva", () => {
  const sql=fs.readFileSync(path.join(rootDir,"supabase-coco-v150.sql"),"utf8");
  assert.match(sql,/clasificacion_general_coco/); assert.match(sql,/clasificacion_juego_coco/);
  assert.doesNotMatch(sql,/delete from|truncate/i);
});

await test("Las 15 miniaturas sociales permanecen intactas", () => {
  const games=["numeros","calculo","palabras","series","memoria","sudoku","sopa","crucigrama","tiempo","verdadero","diferencias","cococorre","cocomed","futbol","padel"];
  const slugs={cococorre:"coco-corre"};
  for (const id of games) {
    assert.ok(fs.existsSync(path.join(rootDir,"share",`${id}-v149.png`)));
    assert.ok(fs.existsSync(path.join(rootDir,"juego",slugs[id]||id,"index.html")));
  }
});

const failures=results.filter(r=>r.status==="FAIL");
for (const r of results) console.log(`${r.status.padEnd(4)}  ${r.name}${r.detail?`\n${r.detail}`:""}`);
console.log(`\n${results.length-failures.length}/${results.length} pruebas superadas.`);
if (failures.length) process.exitCode=1;
