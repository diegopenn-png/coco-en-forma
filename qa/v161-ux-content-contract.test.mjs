import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const qaDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.dirname(qaDir);
const read = file => fs.readFileSync(path.join(rootDir, file), "utf8");

function loadContent() {
  const html = read("index.html");
  const inline = html.match(/<script id="coco-v134-content">([\s\S]*?)<\/script>/);
  assert.ok(inline, "No se encontró el banco base de contenido");
  const window = {};
  const context = vm.createContext({ window, globalThis: window, self: window, console, Object, Array, Set, Map, String, Number, Boolean, RegExp, Math, JSON, Date });
  vm.runInContext(inline[1], context, { filename: "coco-v134-content-inline.js" });
  vm.runInContext(read("coco-v142-content-extension.js"), context, { filename: "coco-v142-content-extension.js" });
  vm.runInContext(read("coco-v144-content.js"), context, { filename: "coco-v144-content.js" });
  return window;
}

test("the v161 content pack is loaded before game runtimes", () => {
  const html = read("index.html");
  const content = html.indexOf('id="coco-v144-content"');
  const classicRuntime = html.indexOf('id="coco-v134-runtime"');
  const arcadeRuntime = html.indexOf('id="coco-arcade-v133-js"');
  assert.ok(content > 0);
  assert.ok(content < classicRuntime);
  assert.ok(content < arcadeRuntime);
  assert.match(read("coco-v144-content.js"), /CocoContentV161/);
});

test("all 13 games expose at least three real variety axes", () => {
  const window = loadContent();
  const audit = window.CocoContentV161.audit();
  assert.equal(audit.passed, true, audit.failures.join("; "));
  assert.equal(audit.games, 13);
  assert.deepEqual(Object.keys(audit.variety).sort(), ["calculo", "cocomed", "crucigrama", "futbol", "memoria", "numeros", "padel", "palabras", "series", "sopa", "sudoku", "tiempo", "verdadero"].sort());
  Object.entries(audit.variety).forEach(([game, axes]) => {
    assert.ok(axes.length >= 3, game);
    assert.equal(new Set(axes).size, axes.length, `${game} tiene ejes duplicados`);
  });
});

test("new question banks are deduplicated and contain verified feedback", () => {
  const window = loadContent();
  const base = window.CocoV134Content;
  const audit = window.CocoV161ContentAudit;
  assert.ok(audit.additions.words >= 20);
  assert.ok(audit.additions.crosswords >= 20);
  assert.ok(audit.additions.trueFalse >= 20);
  assert.ok(audit.additions.memoryThemes >= 6);
  assert.ok(audit.additions.cocoMed >= 20);
  assert.equal(new Set(base.words.map(item => item[0])).size, base.words.length);
  assert.equal(new Set(base.crosswords.map(item => item[0])).size, base.crosswords.length);
  assert.equal(new Set(base.trueFalse.map(item => item[0])).size, base.trueFalse.length);
  assert.ok(base.trueFalse.every(item => typeof item[1] === "boolean" && item[2] && [1, 2, 3].includes(Number(item[3] || 1))));
});

test("Coco Med additions vary answer positions and preserve safety framing", () => {
  const window = loadContent();
  const additions = window.CocoV142MedExtra.filter(item => /^v161-med-/.test(item.id));
  assert.equal(additions.length, 24);
  assert.ok(new Set(additions.map(item => item.answer)).size >= 2);
  assert.ok(additions.every(item => item.options.length === 3));
  assert.ok(additions.every(item => /no sustituye atención profesional/i.test(item.reference)));
  assert.ok(additions.some(item => /persona adulta|ayuda adulta/i.test(item.options.join(" "))));
});

test("game cards explain their increased variety instead of using generic copy", () => {
  const identity = read("coco-v155-identity.js");
  ["numeros", "calculo", "sopa", "sudoku", "memoria", "series", "palabras", "crucigrama", "tiempo", "verdadero", "cocomed", "futbol", "padel"].forEach(id => {
    assert.match(identity, new RegExp(`${id}:\\{name:`), id);
  });
  assert.match(identity, /porcentajes, medias y operaciones encadenadas/i);
  assert.match(identity, /Fibonacci, potencias/i);
  assert.match(identity, /ciudadanía y tecnología/i);
  assert.match(identity, /puntuación.*clasificaciones e historial/i);
  assert.match(identity, /closest\("\.cocoGameCard"\)/);
});

test("Eterna UX has an explicit end, restart, accessible audio and empty-send guard", () => {
  const core = read("eterna-v159.js");
  const experience = read("eterna-experience-v160.js");
  assert.match(core, /data-et-newactivity/);
  assert.match(core, /ACTIVIDAD TERMINADA/);
  assert.match(core, /puedes parar aquí/i);
  assert.match(core, /if\(action==="understood"\)\{completeActivity/);
  assert.doesNotMatch(core, /action==="understood"\?[^\n]*send\(/);
  assert.match(core, /data-et-listen-slow/);
  assert.match(core, /aria-pressed/);
  assert.match(core, /syncSendAvailability/);
  assert.match(experience, /Comprobando el contenido/);
  assert.match(experience, /Preparando una explicación clara/);
  assert.doesNotMatch(experience, /permisos de Safari o de la PWA/);
  assert.match(experience, /data-et-age-band=teen/);
});

test("Zona Familiar masks the legacy report before Safari can paint it", () => {
  const release = read("coco-release-v160903.js");
  assert.match(release, /installFamilyShellObserver160905/);
  assert.match(release, /MutationObserver/);
  assert.match(release, /node\.matches\("\.cocoFamilyV129,\.cocoFamilyV129Backdrop"\)/);
  assert.match(release, /ensureFamilyMask160904\(\);return/);
  assert.match(release, /Preparando Zona Familiar/);
});

test("master accounts can replay every game without adding a second daily score", () => {
  const html = read("index.html");
  const runtime = read("coco-v142-runtime.js");
  const unified = read("coco-v142-unified.js");
  assert.match(runtime, /remoteUserRole/);
  assert.match(runtime, /from\("perfiles"\)\.select\("rol"\)/);
  assert.match(runtime, /remoteUserRole[^\n]*propietario/);
  assert.match(runtime, /\/v1\/access-status/);
  assert.match(runtime, /data\.unlimited_testing === true/);
  assert.match(runtime, /remoteUnlimitedTesting/);
  assert.match(runtime, /sessionStorage\.getItem\(UNLIMITED_SESSION_PREFIX/);
  assert.match(runtime, /remoteUnlimitedTesting = readCachedUnlimitedTesting\(next\)/);
  assert.match(runtime, /cacheUnlimitedTesting\(syncUserId/);
  assert.match(runtime, /source: "access-status"/);
  assert.match(html, /coco-v142-runtime\.js\?v=160932/);
  assert.match(html, /coco-v142-unified\.js\?v=160932/);
  assert.match(runtime, /return \{ ok: true, unlimited: true, ranked: false, source: "test" \}/);
  assert.match(unified, /daily\.isUnlimited\(userId\)/);
  assert.match(unified, /if\(!unlimited&&userId&&window\.CocoDailyV134\.localUsed/);
  assert.match(read("sw.js"), /coco-en-forma-v160\.94\.1-eterna-mobile-fixed-viewport/);
});

test("production promotes the exact preview-tested Worker with automatic rollback", () => {
  const workflow = read(".github/workflows/eterna-worker-production-160931.yml");
  const release = read(".github/release-eterna-160931");
  assert.match(workflow, /TARGET_VERSION_ID: 4afe57d3-593b-46a4-829a-74356bcb7377/);
  assert.match(workflow, /EXPECTED_VERSION: 160\.93\.1-master-game-replay/);
  assert.match(workflow, /PREVIEW_HEALTH_URL: https:\/\/4afe57d3-coco-eterna-v159\.chatinmobiliario\.workers\.dev\/health/);
  assert.match(workflow, /wrangler versions deploy/);
  assert.match(workflow, /wrangler rollback/);
  assert.match(release, /4afe57d3-593b-46a4-829a-74356bcb7377/);
});
