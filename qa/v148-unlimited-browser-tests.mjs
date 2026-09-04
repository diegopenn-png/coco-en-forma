import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const base = process.env.COCO_QA_URL || "http://127.0.0.1:8765";
const preferredExecutable = process.env.COCO_CHROMIUM_PATH || chromium.executablePath();
const results = [];

async function test(name, body) {
  try { await body(); results.push({ name, status: "PASS" }); }
  catch (error) { results.push({ name, status: "FAIL", detail: error.stack || error.message }); }
}

let browser;
try { browser = await chromium.launch({ headless: true, ...(fs.existsSync(preferredExecutable) ? { executablePath: preferredExecutable } : {}) }); }
catch (error) {
  if (/Executable doesn't exist|executable doesn't exist/i.test(String(error && error.message))) {
    console.log("SKIP  Política ilimitada v148: Chromium no está instalado.");
    process.exit(0);
  }
  throw error;
}

const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
await context.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, route => route.fulfill({ status: 200, contentType: "text/css", body: "" }));
await context.route(/^https:\/\/[^/]+\.supabase\.co\//, route => {
  const isRest = route.request().url().includes("/rest/v1/");
  return route.fulfill({ status: 200, contentType: "application/json", headers: isRest ? { "content-range": "*/0" } : {}, body: isRest ? "[]" : '{"user":null,"session":null}' });
});
const page = await context.newPage();
const pageErrors = [];
page.on("pageerror", error => pageErrors.push(error.message));
await page.goto(`${base}/?qa=1`, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => Boolean(window.CocoDailyV148 && window.CocoArcadeV133 && window.CocoResponseV135), null, { timeout: 10000 });
await page.waitForTimeout(1600);

await test("Cuenta exacta: el correo autorizado activa el modo ilimitado en todos los juegos", async () => {
  const state = await page.evaluate(async () => {
    const daily = window.CocoDailyV148, id = "tester-qa", day = daily.today();
    const games = ["numeros", "calculo", "palabras", "series", "memoria", "sudoku", "sopa", "crucigrama", "tiempo", "verdadero", "diferencias", "cocomed", "futbol", "padel", "cococorre"];
    daily.setUser(id, "DIEGOPENN@icloud.com");
    for (const game of games) localStorage.setItem(`coco_v135_complete_${id}_${game}_${day}`, "1");
    const availability = {};
    for (const game of games) availability[game] = await daily.canPlay(game, id);
    const claim = await daily.claim("memoria", id), firstCompletion = await daily.complete("memoria", id), secondCompletion = await daily.complete("memoria", id);
    return { unlimited: daily.isUnlimited(id), localUsed: daily.localUsed("memoria", id), availability, claim, firstCompletion, secondCompletion, status: window.CocoRotationV134.status() };
  });
  assert.equal(state.unlimited, true); assert.equal(state.localUsed, false);
  assert.ok(Object.values(state.availability).every(Boolean));
  assert.equal(state.claim.unlimited, true); assert.equal(state.firstCompletion.unlimited, true); assert.equal(state.secondCompletion.unlimited, true);
  assert.equal(state.firstCompletion.ranked, false); assert.equal(state.status.dailyPolicyVersion, "148.0.0"); assert.equal(state.status.unlimitedTesting, true);
});

await test("Coincidencia exacta: otro correo no recibe la excepción", async () => {
  const state = await page.evaluate(async () => {
    const daily = window.CocoDailyV148, id = "normal-qa", day = daily.today();
    daily.setUser(id, "otra-persona@example.com");
    localStorage.setItem(`coco_v135_complete_${id}_memoria_${day}`, "1");
    return { unlimited: daily.isUnlimited(id), used: daily.localUsed("memoria", id), canPlay: await daily.canPlay("memoria", id), claim: await daily.claim("memoria", id) };
  });
  assert.equal(state.unlimited, false); assert.equal(state.used, true); assert.equal(state.canPlay, false); assert.equal(state.claim.ok, false); assert.equal(state.claim.daily, true);
});

await test("Puntuación: la primera partida se guarda y las repeticiones de prueba no duplican puntos", async () => {
  const state = await page.evaluate(async () => {
    const daily = window.CocoDailyV148, arcade = window.CocoArcadeV133, id = "tester-score", game = "series";
    daily.setUser(id, "diegopenn@icloud.com");
    localStorage.removeItem(`coco_v139_score_${id}_${game}`);
    const first = await arcade.saveScore(game, 111, { qa: 1 }, id);
    daily.setUser(id, "diegopenn@icloud.com");
    const second = await arcade.saveScore(game, 222, { qa: 2 }, id);
    const stored = JSON.parse(localStorage.getItem(`coco_v139_score_${id}_${game}`) || "{}");
    return { first, second, stored };
  });
  assert.equal(state.first.ok, true); assert.equal(state.first.test, undefined);
  assert.equal(state.second.ok, true); assert.equal(state.second.test, true); assert.equal(state.second.unranked, true);
  assert.equal(state.stored.total, 111); assert.equal(state.stored.plays, 1); assert.equal(state.stored.lastScore, 111);
});

await test("Puntuación normal: el resto conserva una única partida diaria", async () => {
  const state = await page.evaluate(async () => {
    const daily = window.CocoDailyV148, arcade = window.CocoArcadeV133, id = "normal-score", game = "calculo";
    daily.setUser(id, "normal@example.com");
    localStorage.removeItem(`coco_v139_score_${id}_${game}`);
    const first = await arcade.saveScore(game, 100, { qa: 1 }, id);
    daily.setUser(id, "normal@example.com");
    const second = await arcade.saveScore(game, 200, { qa: 2 }, id);
    const stored = JSON.parse(localStorage.getItem(`coco_v139_score_${id}_${game}`) || "{}");
    return { first, second, stored };
  });
  assert.equal(state.first.ok, true); assert.equal(state.second.ok, false); assert.equal(state.second.daily, true);
  assert.equal(state.stored.total, 100); assert.equal(state.stored.plays, 1);
});

await test("Interfaz unificada: una prueba completada vuelve a dejar el juego disponible", async () => {
  const state = await page.evaluate(async () => {
    const daily = window.CocoDailyV148, id = "tester-card";
    daily.setUser(id, "diegopenn@icloud.com");
    const card = document.createElement("article"); card.dataset.cocoJuego = "sudoku"; card.innerHTML = '<button class="btn" disabled>Completado hoy</button>'; document.getElementById("cocoApp").appendChild(card);
    const result = await window.CocoResponseV135.complete("sudoku", id), button = card.querySelector("button");
    const value = { result, disabled: button.disabled, state: card.dataset.cocoDailyState, text: button.textContent };
    card.remove(); return value;
  });
  assert.equal(state.result.unlimited, true); assert.equal(state.disabled, false); assert.equal(state.state, "available"); assert.equal(state.text, "Jugar");
});

assert.deepEqual(pageErrors, []);
await context.close(); await browser.close();
const failures = results.filter(result => result.status === "FAIL");
for (const result of results) console.log(`${result.status.padEnd(4)}  ${result.name}${result.detail ? `\n${result.detail}` : ""}`);
console.log(`\n${results.length - failures.length}/${results.length} pruebas de política ilimitada superadas.`);
if (failures.length) process.exitCode = 1;
