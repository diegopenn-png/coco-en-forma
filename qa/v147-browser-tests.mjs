import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const base = process.env.COCO_QA_URL || "http://127.0.0.1:8765";
const results = [];
function record(name, status, detail = "") { results.push({ name, status, detail }); }
async function test(name, body) { try { await body(); record(name, "PASS"); } catch (error) { record(name, "FAIL", error.stack || error.message); } }

const preferredExecutable = process.env.COCO_CHROMIUM_PATH || chromium.executablePath();
let browser;
try { browser = await chromium.launch({ headless: true, ...(fs.existsSync(preferredExecutable) ? { executablePath: preferredExecutable } : {}) }); }
catch (error) {
  if (/Executable doesn't exist|executable doesn't exist/i.test(String(error && error.message))) {
    console.log("SKIP  Pruebas de navegador: Chromium no está instalado. Ejecuta `npx playwright install chromium`.");
    process.exit(0);
  }
  throw error;
}

function watchPage(page, bucket) {
  page.on("console", message => {
    if (message.type() !== "error" || /font/i.test(message.text())) return;
    const location = message.location(); bucket.console.push({ text: message.text(), url: location && location.url || "" });
  });
  page.on("pageerror", error => bucket.page.push(error.message));
  page.on("response", response => { if (response.status() === 404 && response.url().startsWith(base)) bucket.notFound.push(response.url()); });
}

async function neutralizeExternalDependencies(targetContext) {
  await targetContext.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, route => route.fulfill({ status: 200, contentType: "text/css", body: "" }));
  await targetContext.route(/^https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@2/, route => route.fulfill({ status: 200, contentType: "application/javascript", body: "" }));
  await targetContext.route(/^https:\/\/[^/]+\.supabase\.co\//, route => {
    const url = route.request().url(), isRest = url.includes("/rest/v1/");
    return route.fulfill({ status: 200, contentType: "application/json", headers: isRest ? { "content-range": "*/0" } : {}, body: isRest ? "[]" : '{"user":null,"session":null}' });
  });
}

const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "allow" });
await neutralizeExternalDependencies(context);
const page = await context.newPage(), errors = { console: [], page: [], notFound: [] }; watchPage(page, errors);
page.on("dialog", async dialog => { try { await dialog.accept(); } catch (error) { if (!/already handled/i.test(String(error && error.message))) throw error; } });

await test("Browser: abandonar Coco Corre no registra puntuación", async () => {
  const isolated = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
  await neutralizeExternalDependencies(isolated);
  const abandoned = await isolated.newPage();
  await abandoned.goto(`${base}/?qa=1&qaFast=1&juego=cococorre`, { waitUntil: "domcontentloaded" });
  await abandoned.locator(".c144RunnerIntro").waitFor({ timeout: 10000 });
  await abandoned.evaluate(() => { window.__qaRunnerWrites = 0; window.CocoArcadeV133.saveScore = async () => { window.__qaRunnerWrites += 1; return { ok: true }; }; });
  await abandoned.locator("[data-runner-start]").click(); await abandoned.locator(".c144RunnerStage").waitFor();
  await abandoned.waitForTimeout(900); await abandoned.locator("[data-v144-close]").click(); await abandoned.waitForTimeout(1400);
  assert.equal(await abandoned.evaluate(() => window.__qaRunnerWrites), 0);
  await isolated.close();
});

await test("Browser: Coco Corre muestra objetivo real, sin revelar respuestas y con Coco estable", async () => {
  await page.goto(`${base}/?qa=1&qaFast=1&juego=cococorre`, { waitUntil: "domcontentloaded" });
  await page.locator(".c144RunnerIntro").waitFor({ timeout: 10000 });
  const intro = await page.locator(".c144RunnerIntro").innerText();
  assert.ok(intro.includes("La dificultad cambia las reglas y los distractores, no solo la velocidad."));
  assert.ok(intro.includes("Hasta 320 puntos")); assert.ok(!/\b\d{8,}\b/.test(intro));
  await page.evaluate(() => {
    window.__qaRunnerWrites = 0; window.__qaRunnerLast = null; window.__qaRunnerSounds = []; window.__qaAudioUnlocked = 0; window.__qaHasAudioUnlock = typeof window.CocoV144.unlockAudio === "function";
    window.CocoV144.unlockAudio = () => { window.__qaAudioUnlocked += 1; return Promise.resolve(true); };
    window.CocoV144.sound = kind => { window.__qaRunnerSounds.push(kind); return true; };
    window.CocoArcadeV133.saveScore = async (...args) => { window.__qaRunnerWrites += 1; window.__qaRunnerLast = args; return { ok: true, stats: { today: 1, total: args[1] } }; };
  });
  await page.locator("[data-runner-start]").click(); await page.locator(".c144RunnerStage").waitFor();
  await page.locator(".c144RunnerObject.runner-token").first().waitFor({ timeout: 6000 });
  assert.equal(await page.locator(".c144RunnerObject.correct,.c144RunnerObject.distractor").count(), 0);
  await page.waitForTimeout(3000);
  const targetVisual = await page.evaluate(() => {
    const objects = Array.from(document.querySelectorAll(".c144RunnerObject.runner-token"));
    const widths = objects.map(node => node.getBoundingClientRect().width);
    return { maxWidth: Math.max(0, ...widths), labels: objects.filter(node => node.querySelector(".c147RunnerTokenGlyph") && node.querySelector(".c147RunnerTokenLabel")).length, sounds: window.__qaRunnerSounds.slice(), unlocked: window.__qaAudioUnlocked, hasUnlock: window.__qaHasAudioUnlock };
  });
  assert.ok(targetVisual.maxWidth >= 90, `Objetivo todavía pequeño: ${targetVisual.maxWidth}px`); assert.ok(targetVisual.labels >= 1);
  assert.ok(targetVisual.sounds.includes("start") && targetVisual.sounds.includes("approach")); assert.ok(targetVisual.unlocked >= 1); assert.equal(targetVisual.hasUnlock, true);
  const motion = await page.evaluate(() => {
    const coco = document.querySelector("[data-runner-coco] img"), shadow = document.querySelector(".c145CocoShadow");
    return { cocoAnimation: getComputedStyle(coco).animationName, shadowAnimation: getComputedStyle(shadow).animationName, action: coco.closest("[data-runner-coco]").dataset.action };
  });
  assert.equal(motion.cocoAnimation, "none"); assert.equal(motion.shadowAnimation, "none"); assert.equal(motion.action, "idle");
  const audit = await page.evaluate(() => window.CocoRunnerV147.audit());
  assert.equal(audit.rankingWrites, true); assert.equal(audit.generalLeaderboard, true); assert.equal(audit.correctAnswerStyling, false);
  const triangle = await page.evaluate(() => {
    const runner = window.CocoRunnerV147, shape = runner.catalog().shapes.find(item => item.id === "triangulo"), random = () => .37;
    const rule = { type: "shape", target: shape }, token = runner.makeTokenForRule(rule, random, 1, true);
    return { glyph: token.glyph, matches: runner.tokenMatchesRule(token, rule) };
  });
  assert.deepEqual(triangle, { glyph: "▲", matches: true });
});

await test("Browser: Coco Corre responde a carriles, salto, agachado y pausa", async () => {
  const stage = page.locator("[data-runner-stage]"); await stage.focus();
  await page.keyboard.press("ArrowRight"); await page.keyboard.press("ArrowUp");
  assert.equal(await page.locator("[data-runner-coco]").getAttribute("data-action"), "jump");
  await page.waitForTimeout(760); await page.keyboard.press("ArrowDown");
  assert.equal(await page.locator("[data-runner-coco]").getAttribute("data-action"), "duck");
  await page.keyboard.press("p"); await page.locator(".c144Pause").waitFor();
  await page.locator("[data-runner-resume]").click(); assert.equal(await page.locator(".c144Pause").count(), 0);
});

await test("Browser: Coco Corre conserva objetivos legibles en 320, 360, 390 y 430 px", async () => {
  for (const width of [320, 360, 390, 430]) {
    await page.setViewportSize({ width, height: 844 }); await page.waitForTimeout(100);
    const geometry = await page.evaluate(() => {
      const objects = Array.from(document.querySelectorAll(".c144RunnerObject.runner-token")), widths = objects.map(node => node.getBoundingClientRect().width);
      return { inner: innerWidth, body: document.body.scrollWidth, maxTarget: Math.max(0, ...widths), stage: document.querySelector(".c144RunnerStage").getBoundingClientRect().width };
    });
    assert.ok(geometry.body <= geometry.inner && geometry.stage <= geometry.inner && geometry.maxTarget >= 58, `${width}px: ${JSON.stringify(geometry)}`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
});

await test("Browser: Coco Corre termina y escribe exactamente una vez en la clasificación general", async () => {
  await page.locator(".c144Finish", { hasText: "Misión Cerebro completada" }).waitFor({ timeout: 30000 });
  const finish = await page.locator(".c144Finish").innerText();
  assert.ok(finish.includes("PUNTOS GENERALES")); assert.ok(finish.includes("Puntuación guardada una sola vez"));
  assert.equal(await page.evaluate(() => window.__qaRunnerWrites), 1);
  const saved = await page.evaluate(() => window.__qaRunnerLast); assert.equal(saved[0], "cococorre"); assert.ok(saved[1] >= 0 && saved[1] <= 320);
  assert.ok(await page.evaluate(() => window.CocoArcadeV133.classification.generalIds.includes("cococorre")));
});

await test("Browser: Coco Pádel abre con exactamente tres pestañas y una portada limpia", async () => {
  await page.goto(`${base}/?qa=1&juego=padel`, { waitUntil: "domcontentloaded" });
  await page.locator(".c145PadelTabs").waitFor({ timeout: 10000 });
  const labels = await page.locator(".c145PadelTabs button").allTextContents();
  assert.deepEqual(labels.map(value => value.trim()), ["Mixing", "Campeonato", "Jugadores"]);
  assert.equal(await page.getByRole("button", { name: "Crear nuevo mixing" }).count(), 1);
  assert.ok((await page.locator(".c144PadelPage").innerText()).includes("no guarda historial"));
});

async function addPlayer(name, selectedLevel = "medio", acceptDuplicate = false) {
  await page.getByRole("button", { name: "Añadir jugador" }).click();
  const panel = page.locator("[data-padel144-add-panel]"); await panel.locator("[data-padel144-new-name]").fill(name); await panel.locator("[data-padel144-new-level]").selectOption(selectedLevel);
  await panel.getByRole("button", { name: /Crear jugador/ }).click(); await page.locator(".c145PlayerAdmin", { hasText: name }).first().waitFor();
}

await test("Browser: Jugadores crea homónimos, busca código, cambia nivel y conserva resumen", async () => {
  await page.getByRole("button", { name: "Jugadores", exact: true }).click();
  await addPlayer("Diego", "bajo"); await addPlayer("Diego", "alto", true); await addPlayer("Ana", "medio"); await addPlayer("Bruno", "medio");
  assert.equal(await page.locator(".c145PlayerAdmin").count(), 4);
  const text = await page.locator("[data-padel144-directory]").innerText();
  for (const code of ["CP-0001", "CP-0002", "CP-0003", "CP-0004"]) assert.ok(text.includes(code));
  assert.ok(text.includes("PJ") && text.includes("PG") && text.includes("GG") && text.includes("DG"));
  assert.ok(!/Pareja:|Rivales:|HISTORIAL CRONOLÓGICO/i.test(text));
  await page.locator("[data-padel144-directory-search]").fill("CP-0002"); assert.equal(await page.locator(".c145PlayerAdmin:visible").count(), 1);
  await page.locator("[data-padel144-directory-search]").fill("");
  const firstLevel = page.locator("[data-padel144-player-level]").first(); await firstLevel.selectOption("medio");
  await page.waitForTimeout(180); assert.equal(await page.locator("[data-padel144-player-level]").first().inputValue(), "medio");
});

await test("Browser: alta y baja no eliminan jugador ni código", async () => {
  const first = page.locator(".c145PlayerAdmin").first(), code = (await first.innerText()).match(/CP-\d{4}/)[0];
  await first.getByRole("button", { name: "Dar de baja" }).click(); const samePlayer = page.locator(".c145PlayerAdmin", { hasText: code }); assert.ok((await samePlayer.innerText()).includes(code));
  await samePlayer.getByRole("button", { name: "Dar de alta" }).click(); assert.ok((await page.locator(".c145PlayerAdmin", { hasText: code }).innerText()).includes(code));
});

await test("Browser: Mixing recorre cinco pasos, no registra resultados y puede descartarse", async () => {
  await page.getByRole("button", { name: "Mixing", exact: true }).click(); await page.getByRole("button", { name: "Crear nuevo mixing" }).click();
  const picks = page.locator("[data-padel144-player]"); assert.ok(await picks.count() >= 4); for (let index = 0; index < 4; index += 1) await picks.nth(index).check();
  await page.getByRole("button", { name: "Continuar con pistas" }).click();
  await page.locator('[data-padel144-draft="courts"]').fill("1"); await page.locator('[data-padel144-draft="rounds"]').fill("2");
  await page.getByRole("button", { name: "Revisar configuración" }).click(); await page.getByRole("button", { name: "Generar partidos" }).click();
  await page.getByText("Revisa y ajusta las parejas").waitFor(); assert.equal(await page.locator("[data-padel144-score-a]").count(), 0);
  await page.getByRole("button", { name: "Cambiar una pareja" }).first().click(); await page.getByRole("button", { name: "Confirmar orden" }).click();
  await page.getByText("Listo para llevar a la pista").waitFor(); await page.getByRole("button", { name: "Dejar listo y volver" }).click();
  assert.equal(await page.getByRole("button", { name: "Continuar mixing" }).count(), 1);
  await page.getByRole("button", { name: "Descartar mixing" }).click();
  assert.equal(await page.getByRole("button", { name: "Continuar mixing" }).count(), 0);
});

await test("Browser: Campeonato separa portada, creación y detalle; jornada recalcula clasificación", async () => {
  await page.getByRole("button", { name: "Campeonato", exact: true }).click();
  assert.equal(await page.getByRole("button", { name: "Crear campeonato" }).count(), 1); assert.equal(await page.locator("[data-padel146-champ-draft]").count(), 0);
  await page.getByRole("button", { name: "Crear campeonato" }).click();
  await page.locator('[data-padel146-champ-draft="name"]').fill("Liga QA"); await page.getByRole("button", { name: "Continuar" }).click();
  await page.locator('[data-padel146-champ-draft="mode"]').selectOption("points"); await page.getByRole("button", { name: "Elegir jugadores" }).click();
  const participants = page.locator("[data-padel146-champ-player]"); for (let index = 0; index < 4; index += 1) await participants.nth(index).check();
  await page.getByRole("button", { name: "Crear campeonato" }).click(); await page.getByText("CAMPEONATO ACTIVO").waitFor();
  const detailText = await page.locator(".c146ChampDetail").innerText(); assert.ok(!detailText.includes("Plantilla del campeonato")); assert.ok(detailText.includes("CLASIFICACIÓN ACUMULADA"));
  await page.getByRole("button", { name: "Añadir jornada" }).click(); await page.locator('[data-padel144-draft="rounds"]').fill("1"); await page.locator('[data-padel144-draft="courts"]').fill("1");
  await page.getByRole("button", { name: "Crear jornada" }).click(); await page.locator("[data-padel144-score-a]").first().fill("6"); await page.locator("[data-padel144-score-b]").first().fill("4");
  await page.getByRole("button", { name: "Guardar toda la jornada" }).click(); await page.getByText("1/1 guardados").first().waitFor();
  const standings = await page.locator(".c144Table").first().innerText(); assert.ok(standings.includes("3"));
  await page.locator("[data-padel144-score-a]").first().fill("2"); await page.locator("[data-padel144-score-b]").first().fill("6"); await page.getByRole("button", { name: "Corregir" }).first().click(); assert.equal(await page.locator("[data-padel144-score-a]").first().inputValue(), "2");
  await page.getByRole("button", { name: "Deshacer" }).first().click(); assert.equal(await page.getByRole("button", { name: "Guardar", exact: true }).count(), 1);
  await page.locator("[data-padel144-score-a]").first().fill("6"); await page.locator("[data-padel144-score-b]").first().fill("4"); await page.getByRole("button", { name: "Guardar", exact: true }).click();
});

await test("Browser: PWA conserva jugadores, niveles y campeonato al recargar", async () => {
  await page.reload({ waitUntil: "domcontentloaded" }); await page.locator(".c145PadelTabs").waitFor({ timeout: 10000 });
  await page.getByRole("button", { name: "Jugadores", exact: true }).click(); assert.equal(await page.locator(".c145PlayerAdmin").count(), 4); assert.equal(await page.locator("[data-padel144-player-level]").first().inputValue(), "medio");
  await page.getByRole("button", { name: "Campeonato", exact: true }).click(); assert.ok((await page.locator(".c144PadelPage").innerText()).includes("Liga QA"));
});

await test("Browser: Encuentra las diferencias completa todos los escenarios y niveles desde ambas imágenes", async () => {
  const diffContext = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
  await neutralizeExternalDependencies(diffContext);
  await diffContext.addInitScript(() => { for (const key of Object.keys(localStorage)) if (/coco_v135_complete_|coco_v139_score_/.test(key)) localStorage.removeItem(key); });
  const diffPage = await diffContext.newPage(), diffErrors = { console: [], page: [], notFound: [] }; watchPage(diffPage, diffErrors);
  const scenes = ["workshop", "invention-lab", "observatory", "tech-library", "electric-garage", "robotics-studio", "ocean-lab", "botanical-greenhouse", "music-studio", "space-station"];
  for (const scene of scenes) for (const level of [1, 2, 3]) {
    await diffPage.goto(`${base}/?qa=1&juego=diferencias&qaScene=${scene}&qaVariant=${level - 1}`, { waitUntil: "domcontentloaded" });
    await diffPage.locator(".c144DiffIntro").waitFor({ timeout: 10000 }); await diffPage.locator(`[data-diff144-level="${level}"]`).click(); await diffPage.locator("[data-diff144-start]").click();
    await diffPage.locator('[data-diff144-scene="left"][data-ready="true"]').waitFor({ timeout: 10000 }); await diffPage.locator('[data-diff144-scene="right"][data-ready="true"]').waitFor({ timeout: 10000 });
    const count = level + 3; assert.equal(await diffPage.locator('[data-diff144-scene="left"] .c144DiffHit').count(), count); assert.equal(await diffPage.locator('[data-diff144-scene="right"] .c144DiffHit').count(), count);
    const hiddenHints = await diffPage.locator(".c144DiffHit").evaluateAll(nodes => nodes.every(node => {
      const style = getComputedStyle(node); return !node.textContent.trim() && style.backgroundColor === "rgba(0, 0, 0, 0)" && parseFloat(style.borderTopWidth) === 0;
    }));
    assert.equal(hiddenHints, true, `${scene}/L${level}: existe una pista visual previa`);
    if (scene === scenes[0] && level === 1) {
      for (const width of [320, 360, 390, 430, 1440]) {
        await diffPage.setViewportSize({ width, height: width === 1440 ? 900 : 844 }); await diffPage.waitForTimeout(60);
        const geometry = await diffPage.evaluate(() => ({ inner: innerWidth, body: document.body.scrollWidth, scenes: Array.from(document.querySelectorAll(".c144DiffScene")).every(node => { const box = node.getBoundingClientRect(); return box.left >= 0 && box.right <= innerWidth + 1; }) }));
        assert.ok(geometry.body <= geometry.inner && geometry.scenes, `${width}px: ${JSON.stringify(geometry)}`);
      }
      await diffPage.setViewportSize({ width: 390, height: 844 });
    }
    if (scene === scenes[0] && level === 1) { await diffPage.locator('[data-diff144-scene="left"]').click({ position: { x: 4, y: 4 } }); assert.equal(await diffPage.locator("[data-diff144-misses]").innerText(), "1"); }
    for (let index = 0; index < count; index += 1) {
      const side = index % 2 ? "right" : "left", hotspot = diffPage.locator(`[data-diff144-scene="${side}"] .c144DiffHit`).nth(index);
      await hotspot.scrollIntoViewIfNeeded(); const box = await hotspot.boundingBox(); assert.ok(box, `${scene}/L${level}: zona ${index + 1} sin geometría`);
      await diffPage.mouse.click(box.x + box.width / 2, box.y + box.height / 2); await diffPage.waitForTimeout(205);
    }
    await diffPage.locator(".c144DiffResult").waitFor({ timeout: 8000 }); assert.ok((await diffPage.locator(".c144DiffResult").innerText()).includes(`${count} de ${count} diferencias`));
  }
  const audit = await diffPage.evaluate(() => window.CocoDifferencesProV147.audit()); assert.deepEqual(audit.differenceKinds, ["color", "shape", "presence"]); assert.equal(audit.brokenObjects, false); assert.equal(audit.deformedObjects, false); assert.equal(audit.preAnswerMarkers, false); assert.equal(audit.genericCircleMarkers, false); assert.equal(audit.genericStarMarkers, false);
  assert.deepEqual(diffErrors.page, []); assert.deepEqual(diffErrors.notFound, []); await diffContext.close();
});

await test("Browser: sin desbordamiento horizontal en 320, 360, 390 y 430 px", async () => {
  for (const width of [320, 360, 390, 430]) {
    await page.setViewportSize({ width, height: 844 }); await page.waitForTimeout(100);
    const geometry = await page.evaluate(() => {
      window.scrollTo(9999, window.scrollY); const attemptedScrollX = window.scrollX; window.scrollTo(0, window.scrollY);
      const shell = document.querySelector(".cocoV144Shell"), shellRect = shell && shell.getBoundingClientRect();
      const clippedTabs = Array.from(document.querySelectorAll(".c145PadelTabs button")).filter(button => button.scrollWidth > button.clientWidth + 1).map(button => button.textContent.trim());
      return { inner: innerWidth, body: document.body.scrollWidth, attemptedScrollX, shellLeft: shellRect && Math.round(shellRect.left), shellRight: shellRect && Math.round(shellRect.right), clippedTabs, overflow: getComputedStyle(document.documentElement).overflowX };
    });
    assert.ok(geometry.body <= geometry.inner && geometry.attemptedScrollX === 0 && geometry.shellLeft >= 0 && geometry.shellRight <= geometry.inner && geometry.clippedTabs.length === 0, `${width}px: ${JSON.stringify(geometry)}`);
  }
});

await test("Browser: service worker v147, sin errores JavaScript ni 404 locales", async () => {
  const cacheVersion = await page.evaluate(async () => { if (!("caches" in window)) return []; return caches.keys(); }); assert.ok(cacheVersion.some(key => key.includes("v147.0.0")) || cacheVersion.length === 0);
  assert.deepEqual(errors.page, []); assert.deepEqual(errors.notFound, []); const relevant = errors.console.filter(entry => !entry.url || entry.url.startsWith(base)).map(entry => entry.text).filter(message => !/favicon|fonts/i.test(message)); assert.deepEqual(relevant, []);
});

await context.close(); await browser.close();
const failures = results.filter(result => result.status === "FAIL");
for (const result of results) console.log(`${result.status.padEnd(4)}  ${result.name}${result.detail ? `\n${result.detail}` : ""}`);
console.log(`\n${results.length - failures.length}/${results.length} pruebas de navegador superadas.`);
if (failures.length) process.exitCode = 1;
