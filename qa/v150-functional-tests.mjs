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
  const location = { search: "", hostname: "localhost" };
  const window = {
    CocoV144: {
      id(prefix) { return `${prefix}-${++idCounter}`; }, today() { return "2026-08-16"; }, esc(value) { return String(value); }, body() { return null; },
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

await test("Clasificación general usa RPC global y no depende de RLS de partidas", () => {
  const html = fs.readFileSync(path.join(rootDir, "index.html"), "utf8");
  assert.match(html, /rpc\("clasificacion_general_coco",\{p_limit:50\}\)/);
  assert.match(html, /total_jugadores/);
  assert.match(html, /official:true/);
});

await test("Migración v150 crea rankings general y específico seguros", () => {
  const sql = fs.readFileSync(path.join(rootDir, "supabase-coco-v150.sql"), "utf8");
  assert.match(sql, /create or replace function public\.clasificacion_general_coco/);
  assert.match(sql, /create or replace function public\.clasificacion_juego_coco/);
  assert.match(sql, /security definer/g);
  assert.match(sql, /auth\.uid\(\) is not null/);
  assert.match(sql, /grant execute on function public\.clasificacion_general_coco\(integer\) to authenticated/);
  assert.match(sql, /grant execute on function public\.clasificacion_juego_coco\(text, integer\) to authenticated/);
  assert.doesNotMatch(sql, /delete from|truncate/i);
});

await test("Clasificación general suma exactamente los 12 retos generales", () => {
  const sql = fs.readFileSync(path.join(rootDir, "supabase-coco-v150.sql"), "utf8");
  for (const game of ["numeros","calculo","palabras","series","memoria","sudoku","sopa","crucigrama","tiempo","verdadero","diferencias","cococorre"]) assert.ok(sql.includes(`'${game}'`), game);
  assert.doesNotMatch(sql.match(/clasificacion_general_coco[\s\S]*?\$\$;/)?.[0] || "", /'cocomed'|'futbol'|'padel'/);
});

await test("Clasificación específica solo admite Coco Med y Fútbol", () => {
  const sql = fs.readFileSync(path.join(rootDir, "supabase-coco-v150.sql"), "utf8");
  assert.match(sql, /p_juego in \('cocomed', 'futbol'\)/);
});

await test("Coco Corre v150 comienza cada regla con distractor y alterna objetivos", () => {
  const runner = evaluate("coco-v144-runner.js").CocoRunnerV150;
  for (const level of [1,2,3]) for (let i=0;i<60;i++) {
    const mission = runner.missionForLevel(level, `v150-${level}-${i}`), validation = runner.validateMission(mission);
    assert.equal(validation.valid, true, validation.failures.join(", "));
    assert.equal(validation.firstTargetIndex, 1); assert.equal(validation.startsWithDistractor, true);
  }
});

await test("Coco Corre incluye frutas, herramientas, animales, deportes, naturaleza y ciencia", () => {
  const runner = evaluate("coco-v144-runner.js").CocoRunnerV150, catalog = runner.catalog();
  const ids = Array.from(catalog.categories, item => item.id);
  for (const id of ["herramientas","frutas","animales","deportes","naturaleza","ciencia"]) assert.ok(ids.includes(id), id);
  for (const category of catalog.categories) assert.ok(category.items.length >= 6, `${category.id}: ${category.items.length}`);
});

await test("Coco Corre conserva variedad de color con herramientas moradas", () => {
  const runner = evaluate("coco-v144-runner.js").CocoRunnerV150, catalog = runner.catalog();
  const tools = catalog.categories.find(c => c.id === "herramientas"), purple = catalog.colors.find(c => c.id === "morado");
  let value=.11; const random=()=>((value=(value+.231)%1));
  const opening=runner.openingPlanForRule({type:"category-color",category:tools,color:purple},random,3);
  assert.deepEqual(Array.from(opening, token => token.correct), [false,true,false,true,false]);
  assert.ok(new Set(opening.map(token => token.color.id)).size >= 3);
});

await test("Coco Corre mantiene obstáculos pequeños y mensajes no técnicos", () => {
  const runner = evaluate("coco-v144-runner.js").CocoRunnerV150, audit=runner.audit();
  const css=fs.readFileSync(path.join(rootDir,"coco-v149-refinements.css"),"utf8"), html=fs.readFileSync(path.join(rootDir,"index.html"),"utf8");
  assert.equal(audit.adjacentLaneVisualClearance,true); assert.ok(audit.obstacleApproachScale <= 1);
  assert.match(css,/c144RunnerObject\.obstacle[\s\S]*width:78px/);
  assert.doesNotMatch(html,/Juego no válido: cococorre|No se pudo guardar todavía:/);
});

await test("Encuentra las diferencias incorpora cerebro y pico de Coco como cambios detectables", () => {
  const diff=evaluate("coco-v144-differences.js").CocoDifferencesProV150;
  assert.equal(diff.scenes.length,10);
  for (const scene of diff.scenes) {
    assert.equal(scene.differences.length,6);
    const brain=scene.differences.find(item=>item.key==="brain"), beak=scene.differences.find(item=>item.key==="beak");
    assert.ok(brain && beak, scene.id); assert.equal(brain.forceKind,"color"); assert.equal(beak.forceKind,"color");
    assert.ok(brain.visualW <= 10 && beak.visualW <= 5);
  }
  assert.equal(diff.audit().brightness,1.24);
});

await test("Diferencias mantiene color, forma y presencia sin marcadores previos", () => {
  const audit=evaluate("coco-v144-differences.js").CocoDifferencesProV150.audit();
  assert.deepEqual(Array.from(audit.differenceKinds),["color","shape","presence"]);
  assert.equal(audit.preAnswerMarkers,false); assert.equal(audit.clickableFromBothImages,true); assert.equal(audit.falseClicksAccepted,false);
});

await test("Coco Pádel conserva ranking por torneo y exportación completa", () => {
  const padel=evaluate("coco-v144-padel.js").CocoPadelV150, audit=padel.audit(padel.blankState());
  assert.deepEqual(Array.from(audit.topTabs),["Mixing","Campeonato","Jugadores"]);
  assert.equal(audit.tournamentRankingSelector,true); assert.equal(audit.excelExport,"xlsx"); assert.equal(audit.printExport,true); assert.equal(audit.unlimited,true);
  assert.equal(audit.whatsappExport.length,4);
});

await test("Las 15 miniaturas sociales siguen presentes y a 1200x630", () => {
  const games=["numeros","calculo","palabras","series","memoria","sudoku","sopa","crucigrama","tiempo","verdadero","diferencias","cococorre","cocomed","futbol","padel"];
  const slugs={cococorre:"coco-corre"};
  for (const id of games) {
    const image=path.join(rootDir,"share",`${id}-v149.png`), page=path.join(rootDir,"juego",slugs[id]||id,"index.html");
    assert.ok(fs.existsSync(image)); assert.ok(fs.existsSync(page));
    const bytes=fs.readFileSync(image); assert.equal(bytes.readUInt32BE(16),1200); assert.equal(bytes.readUInt32BE(20),630);
  }
});

await test("PWA usa caché v150 y todos sus recursos de precaché existen", () => {
  const sw=fs.readFileSync(path.join(rootDir,"sw.js"),"utf8"), html=fs.readFileSync(path.join(rootDir,"index.html"),"utf8");
  assert.match(sw,/coco-en-forma-v150\.0\.0-r1/); assert.match(html,/2026-08-16-v150\.0-nueva-linea-desde-v149/);
  for (const asset of Array.from(sw.matchAll(/"\.\/([^"?]+)"/g), m=>m[1])) assert.ok(fs.existsSync(path.join(rootDir,asset)),asset);
  for (const file of ["coco-v144-core.js?v=15000","coco-v144-padel.js?v=15000","coco-v144-runner.js?v=15000","coco-v144-differences.js?v=15000","coco-v149-refinements.css?v=15000"]) assert.ok(html.includes(file),file);
});

await test("Rollback v150 elimina solo las funciones nuevas", () => {
  const sql=fs.readFileSync(path.join(rootDir,"supabase-coco-v150-rollback.sql"),"utf8");
  assert.match(sql,/drop function if exists public\.clasificacion_general_coco/);
  assert.match(sql,/drop function if exists public\.clasificacion_juego_coco/);
  assert.doesNotMatch(sql,/drop table|delete from|truncate/i);
});

const failures=results.filter(r=>r.status==="FAIL");
for (const r of results) console.log(`${r.status.padEnd(4)}  ${r.name}${r.detail?`\n${r.detail}`:""}`);
console.log(`\n${results.length-failures.length}/${results.length} pruebas superadas.`);
if (failures.length) process.exitCode=1;
