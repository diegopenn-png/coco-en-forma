import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const base = process.env.COCO_QA_URL || "http://127.0.0.1:8765";
const executablePath = process.env.COCO_CHROMIUM_PATH || chromium.executablePath();
const evidence = path.resolve("qa/evidence-v146");
fs.mkdirSync(evidence, { recursive: true });

const browser = await chromium.launch({ headless: true, ...(fs.existsSync(executablePath) ? { executablePath } : {}) });

async function prepare(context) {
  await context.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, route => route.fulfill({ status: 200, contentType: "text/css", body: "" }));
  await context.route(/^https:\/\/[^/]+\.supabase\.co\//, route => route.fulfill({ status: 200, contentType: "application/json", body: route.request().url().includes("/rest/v1/") ? "[]" : '{"user":null,"session":null}' }));
}

const runnerContext = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, serviceWorkers: "block" });
await prepare(runnerContext);
const runner = await runnerContext.newPage();
await runner.goto(`${base}/?qa=1&qaFast=1&juego=cococorre`, { waitUntil: "domcontentloaded" });
await runner.locator(".c144RunnerIntro").waitFor();
await runner.screenshot({ path: path.join(evidence, "coco-corre-intro-390-v146.png") });
await runner.locator("[data-runner-start]").click();
await runner.locator(".c144RunnerObject.runner-token").first().waitFor({ timeout: 6000 });
await runner.waitForTimeout(450);
await runner.screenshot({ path: path.join(evidence, "coco-corre-partida-390-v146.png") });
await runnerContext.close();

const padelContext = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, serviceWorkers: "block" });
await prepare(padelContext);
await padelContext.addInitScript(() => {
  const now = new Date().toISOString();
  localStorage.setItem("coco_padel_club_v144", JSON.stringify({
    version: 3,
    nextPlayerNumber: 5,
    updatedAt: now,
    auditLog: [],
    players: [
      { id: "p1", code: "CP-0001", name: "Diego", currentLevel: "bajo", active: true, createdAt: now, levelHistory: [] },
      { id: "p2", code: "CP-0002", name: "Diego", currentLevel: "alto", active: true, createdAt: now, levelHistory: [] },
      { id: "p3", code: "CP-0003", name: "Ana", currentLevel: "medio", active: true, createdAt: now, levelHistory: [] },
      { id: "p4", code: "CP-0004", name: "Bruno", currentLevel: "medio", active: false, createdAt: now, levelHistory: [] }
    ],
    championships: [{
      id: "champ-qa", name: "Liga familiar", startDate: "2026-08-15", endDate: "", status: "active", participantIds: ["p1", "p2", "p3", "p4"],
      scoring: { mode: "points", win: 3, draw: 1, loss: 0, tiebreakers: ["points", "gameDifference", "gamesWon", "headToHead"] }, createdAt: now, finishedAt: null, archivedAt: null
    }],
    sessions: []
  }));
});
const padel = await padelContext.newPage();
await padel.goto(`${base}/?qa=1&juego=padel`, { waitUntil: "domcontentloaded" });
await padel.locator(".c145PadelTabs").waitFor();
await padel.screenshot({ path: path.join(evidence, "coco-padel-mixing-390-v146.png") });
await padel.getByRole("button", { name: "Jugadores", exact: true }).click();
await padel.screenshot({ path: path.join(evidence, "coco-padel-jugadores-390-v146.png") });
await padel.setViewportSize({ width: 320, height: 844 });
await padel.screenshot({ path: path.join(evidence, "coco-padel-jugadores-320-v146.png") });
await padel.setViewportSize({ width: 390, height: 844 });
await padel.getByRole("button", { name: "Campeonato", exact: true }).click();
await padel.screenshot({ path: path.join(evidence, "coco-padel-campeonatos-390-v146.png") });
await padel.getByRole("button", { name: /Liga familiar/ }).click();
await padel.screenshot({ path: path.join(evidence, "coco-padel-detalle-390-v146.png") });
await padelContext.close();

const differencesContext = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, serviceWorkers: "block" });
await prepare(differencesContext);
await differencesContext.addInitScript(() => { for (const key of Object.keys(localStorage)) if (/coco_v135_complete_|coco_v139_score_/.test(key)) localStorage.removeItem(key); });
const differences = await differencesContext.newPage();
await differences.goto(`${base}/?qa=1&juego=diferencias&qaScene=workshop&qaVariant=0`, { waitUntil: "domcontentloaded" });
await differences.locator(".c144DiffIntro").waitFor();
await differences.locator("[data-diff144-start]").click();
await differences.locator('[data-diff144-scene="left"][data-ready="true"]').waitFor({ timeout: 10000 });
await differences.screenshot({ path: path.join(evidence, "diferencias-partida-390-v146.png") });
await differencesContext.close();

await browser.close();
console.log("PASS  Evidencia visual v146 generada en qa/evidence-v146.");
