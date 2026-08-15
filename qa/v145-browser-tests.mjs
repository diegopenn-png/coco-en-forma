import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const base = process.env.COCO_QA_URL || "http://127.0.0.1:8765";
const results = [];
function record(name, status, detail = "") { results.push({ name, status, detail }); }
async function test(name, body) { try { await body(); record(name, "PASS"); } catch (error) { record(name, "FAIL", error.stack || error.message); } }

const preferredExecutable = chromium.executablePath();
let browser;
try { browser = await chromium.launch({ headless: true, ...(fs.existsSync(preferredExecutable) ? { executablePath: preferredExecutable } : {}) }); }
catch (error) {
  if (/Executable doesn't exist|executable doesn't exist/i.test(String(error && error.message))) {
    console.log("SKIP  Pruebas de navegador: Chromium no está instalado en este entorno. Ejecuta `npx playwright install chromium` y vuelve a lanzar este archivo.");
    process.exit(0);
  }
  throw error;
}
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "allow" });
await context.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, route => route.abort());
const page = await context.newPage();
const consoleErrors = [], pageErrors = [], local404 = [];
page.on("console", message => { if (message.type() === "error" && !/font/i.test(message.text())) consoleErrors.push(message.text()); });
page.on("pageerror", error => pageErrors.push(error.message));
page.on("response", response => { if (response.status() === 404 && response.url().startsWith(base)) local404.push(response.url()); });

await test("Browser: Runner abre sin identificador técnico y muestra objetivo garantizado", async () => {
  await page.goto(`${base}/?qa=1&qaFast=1&juego=cococorre`, { waitUntil: "domcontentloaded" });
  await page.locator(".c144RunnerIntro").waitFor({ timeout: 10000 });
  const intro = await page.locator(".c144RunnerIntro").innerText();
  assert.ok(intro.includes("La dificultad cambia las reglas y los distractores, no solo la velocidad."));
  assert.ok(!/\b\d{8,}\b/.test(intro));
  await page.locator("[data-runner-start]").click();
  await page.locator(".c144RunnerStage").waitFor();
  await page.locator(".c144RunnerObject.correct").first().waitFor({ timeout: 3500 });
  const runnerAudit = await page.evaluate(() => window.CocoRunnerV145.audit());
  assert.equal(runnerAudit.rankingWrites, false); assert.equal(runnerAudit.firstTargetGuaranteed, true);
});

await test("Browser: Runner responde a teclado, salto, agachado y pausa", async () => {
  const stage = page.locator("[data-runner-stage]"); await stage.focus();
  await page.keyboard.press("ArrowRight"); await page.keyboard.press("ArrowUp");
  assert.equal(await page.locator("[data-runner-coco]").getAttribute("data-action"), "jump");
  await page.waitForTimeout(760); await page.keyboard.press("ArrowDown");
  assert.equal(await page.locator("[data-runner-coco]").getAttribute("data-action"), "duck");
  await page.keyboard.press("p"); await page.locator(".c144Pause").waitFor();
  await page.locator("[data-runner-resume]").click();
  assert.equal(await page.locator(".c144Pause").count(), 0);
});

await test("Browser: Runner termina una sola vez con resultado personal", async () => {
  await page.locator(".c144Finish", { hasText: "Misión Cerebro completada" }).waitFor({ timeout: 26000 });
  const finish = await page.locator(".c144Finish").innerText();
  assert.ok(finish.includes("no ha sumado ningún punto a la clasificación general"));
  assert.equal(await page.locator(".c144FinishHero").count(), 1);
});

await test("Browser: Coco Pádel muestra exactamente tres pestañas", async () => {
  await page.goto(`${base}/?qa=1&juego=padel`, { waitUntil: "domcontentloaded" });
  await page.locator(".c145PadelTabs").waitFor({ timeout: 10000 });
  const labels = await page.locator(".c145PadelTabs button").allTextContents();
  assert.deepEqual(labels.map(value => value.trim()), ["Mixing", "Campeonato", "Jugadores"]);
});

async function addPlayer(name, selectedLevel = "medio", acceptDuplicate = false) {
  await page.getByRole("button", { name: "Añadir jugador" }).click();
  const panel = page.locator("[data-padel144-add-panel]");
  await panel.locator("[data-padel144-new-name]").fill(name);
  await panel.locator("[data-padel144-new-level]").selectOption(selectedLevel);
  if (acceptDuplicate) page.once("dialog", dialog => dialog.accept());
  await panel.getByRole("button", { name: /Crear jugador/ }).click();
  await page.locator(".c145PlayerAdmin", { hasText: name }).first().waitFor();
}

await test("Browser: Jugadores crea homónimos, busca por código y conserva niveles", async () => {
  await page.getByRole("button", { name: "Jugadores", exact: true }).click();
  await addPlayer("Diego", "bajo"); await addPlayer("Diego", "alto", true); await addPlayer("Ana", "medio"); await addPlayer("Bruno", "medio");
  const cards = page.locator(".c145PlayerAdmin"); assert.equal(await cards.count(), 4);
  const text = await page.locator("[data-padel144-directory]").innerText();
  for (const code of ["CP-0001", "CP-0002", "CP-0003", "CP-0004"]) assert.ok(text.includes(code));
  await page.locator("[data-padel144-directory-search]").fill("CP-0002");
  assert.equal(await page.locator(".c145PlayerAdmin:visible").count(), 1);
  assert.ok((await page.locator(".c145PlayerAdmin:visible").innerText()).includes("Diego"));
  await page.locator("[data-padel144-directory-search]").fill("");
  const firstLevel = page.locator('[data-padel144-player-level]').first(); page.once("dialog", dialog => dialog.accept()); await firstLevel.selectOption("medio");
  await page.waitForTimeout(150); assert.equal(await firstLevel.inputValue(), "medio");
});

await test("Browser: alta y baja no eliminan jugador ni código", async () => {
  const first = page.locator(".c145PlayerAdmin").first(); const code = (await first.innerText()).match(/CP-\d{4}/)[0];
  page.once("dialog", dialog => dialog.accept()); await first.getByRole("button", { name: "Dar de baja" }).click();
  assert.ok((await page.locator(".c145PlayerAdmin").first().innerText()).includes(code));
  page.once("dialog", dialog => dialog.accept()); await page.locator(".c145PlayerAdmin").first().getByRole("button", { name: "Dar de alta" }).click();
  assert.ok((await page.locator(".c145PlayerAdmin").first().innerText()).includes(code));
});

await test("Browser: Mixing genera cruces temporales sin resultados ni puntos", async () => {
  await page.getByRole("button", { name: "Mixing", exact: true }).click();
  const picks = page.locator('[data-padel144-player]'); assert.ok(await picks.count() >= 4);
  for (let index = 0; index < 4; index += 1) await picks.nth(index).check();
  await page.locator('[data-padel144-draft="courts"]').fill("1"); await page.locator('[data-padel144-draft="rounds"]').fill("2");
  await page.getByRole("button", { name: "Generar partidos" }).click();
  await page.getByText("ORDEN DE JUEGO TEMPORAL").waitFor();
  assert.equal(await page.locator('[data-padel144-score-a]').count(), 0);
  assert.ok((await page.locator(".c144PadelPage").innerText()).includes("No se guarda como historial"));
  await page.getByRole("button", { name: "Cambiar una pareja" }).first().click();
  page.once("dialog", dialog => dialog.accept()); await page.getByRole("button", { name: "Descartar mixing" }).click();
  assert.equal(await page.getByText("ORDEN DE JUEGO TEMPORAL").count(), 0);
});

await test("Browser: Campeonato crea jornada, guarda y recalcula resultados", async () => {
  await page.getByRole("button", { name: "Campeonato", exact: true }).click();
  await page.locator("[data-padel144-champ-name]").fill("Liga QA");
  const participants = page.locator("[data-padel144-new-champ-player]"); for (let index = 0; index < 4; index += 1) await participants.nth(index).check();
  await page.locator("[data-padel144-champ-mode]").selectOption("points");
  await page.getByRole("button", { name: "Crear campeonato" }).click();
  await page.getByText("CAMPEONATO ACTIVO").waitFor();
  const rounds = page.locator('[data-padel144-draft="rounds"]'); await rounds.fill("1");
  const courts = page.locator('[data-padel144-draft="courts"]'); await courts.fill("1");
  await page.getByRole("button", { name: "Crear fecha" }).click();
  await page.locator('[data-padel144-score-a]').first().fill("6"); await page.locator('[data-padel144-score-b]').first().fill("4");
  await page.getByRole("button", { name: "Guardar toda la sesión" }).click();
  await page.getByText("1/1 guardados").waitFor();
  const tableText = await page.locator(".c144Table").first().innerText(); assert.ok(tableText.includes("3"));
  const a = page.locator('[data-padel144-score-a]').first(), b = page.locator('[data-padel144-score-b]').first(); await a.fill("2"); await b.fill("6");
  await page.getByRole("button", { name: "Corregir" }).first().click();
  assert.equal(await a.inputValue(), "2");
});

await test("Browser: PWA conserva jugadores y campeonato al recargar", async () => {
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator(".c145PadelTabs").waitFor({ timeout: 10000 });
  await page.getByRole("button", { name: "Jugadores", exact: true }).click();
  assert.equal(await page.locator(".c145PlayerAdmin").count(), 4);
  await page.getByRole("button", { name: "Campeonato", exact: true }).click();
  assert.ok((await page.locator(".c144PadelPage").innerText()).includes("Liga QA"));
});

await test("Browser: sin desbordamiento horizontal en 320, 360, 390 y 430 px", async () => {
  for (const width of [320, 360, 390, 430]) {
    await page.setViewportSize({ width, height: 844 }); await page.waitForTimeout(80);
    const geometry = await page.evaluate(() => ({ inner: window.innerWidth, scroll: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
    assert.ok(geometry.scroll <= geometry.inner && geometry.body <= geometry.inner, `${width}px: ${JSON.stringify(geometry)}`);
  }
});

await test("Browser: sin errores JavaScript ni 404 locales", async () => {
  assert.deepEqual(pageErrors, []); assert.deepEqual(local404, []);
  const relevant = consoleErrors.filter(message => !/Failed to load resource.*ERR_FAILED|favicon/i.test(message));
  assert.deepEqual(relevant, []);
});

await context.close(); await browser.close();
const failures = results.filter(result => result.status === "FAIL");
for (const result of results) console.log(`${result.status.padEnd(4)}  ${result.name}${result.detail ? `\n${result.detail}` : ""}`);
console.log(`\n${results.length - failures.length}/${results.length} pruebas de navegador superadas.`);
if (failures.length) process.exitCode = 1;
