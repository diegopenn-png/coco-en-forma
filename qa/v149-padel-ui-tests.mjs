import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const qaDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(qaDir);
const handlers = Object.create(null), storage = new Map();
const body = {
  innerHTML: "",
  addEventListener(type, handler) { handlers[type] = handler; },
  querySelector() { return null; },
  querySelectorAll() { return []; }
};
let counter = 0;
const localStorage = { getItem(key) { return storage.get(key) || null; }, setItem(key, value) { storage.set(key, String(value)); } };
const C = {
  id(prefix) { return `${prefix}-${++counter}`; }, today() { return "2026-08-15"; }, esc(value) { return String(value); }, body() { return body; },
  session: async () => null, client: () => null, toast() {}, sound() {}, openModal() {}, closeModal() {}, setModalTitle() {}
};
const window = { CocoV144: C, CocoArcadeDemo: true, location: { search: "", hostname: "localhost" }, addEventListener() {}, removeEventListener() {} };
const context = vm.createContext({ window, self: window, globalThis: window, location: window.location, localStorage, console, Set, Map, Date, Math, JSON, Object, Array, String, Number, Boolean, RegExp, Intl, Promise, AbortController, URLSearchParams, TextEncoder, Blob, setTimeout, clearTimeout, confirm: () => true, prompt: () => null });
vm.runInContext(fs.readFileSync(path.join(root, "coco-v144-padel.js"), "utf8"), context, { filename: "coco-v144-padel.js" });
const padel = window.CocoPadelV149, state = padel.blankState();
const players = ["Alicia", "Beto", "Carla", "Diego"].map((name, index) => padel.createPlayer(state, name, ["bajo", "medio", "alto", "medio"][index]).player);
state.championships.push({ id: "champ-ui", name: "Liga UI", startDate: "2026-08-01", endDate: "", status: "active", participantIds: players.map(player => player.id), scoring: { mode: "points", win: 3, draw: 1, loss: 0, tiebreakers: ["points", "gameDifference", "gamesWon", "headToHead"] }, createdAt: "2026-08-01T00:00:00Z", finishedAt: null, archivedAt: null });
localStorage.setItem("coco_padel_club_v144", JSON.stringify(state));

function button(dataset = {}, attributes = []) {
  return { dataset, hasAttribute(name) { return attributes.includes(name); } };
}
async function click(target) {
  await handlers.click({ target: { closest(selector) { return selector === "button" ? target : null; } } });
}

await padel.open();
assert.match(body.innerHTML, /Crear nuevo mixing/);
assert.equal((body.innerHTML.match(/data-padel144-view=/g) || []).length, 3);
assert.match(body.innerHTML, />Mixing<|>Campeonato<|>Jugadores</);
console.log("PASS  UI Pádel: portada Mixing y exactamente tres pestañas renderizadas.");

await click(button({ padel144View: "championship" }));
assert.match(body.innerHTML, /Crear campeonato/); assert.match(body.innerHTML, /Ranking actualizado por torneos/); assert.match(body.innerHTML, /Campeonatos en curso/);
console.log("PASS  UI Pádel: portada Campeonato limpia con creación, activos y ranking por torneo.");

await click(button({}, ["data-padel149-open-ranking"]));
assert.match(body.innerHTML, /data-padel149-ranking-championship/); assert.match(body.innerHTML, /Liga UI/);
assert.equal((body.innerHTML.match(/data-padel149-(copy|excel|print)=/g) || []).length, 3);
console.log("PASS  UI Pádel: selector de torneo y tres salidas de exportación renderizadas.");

await click(button({ padel144View: "players" }));
assert.match(body.innerHTML, /data-padel144-player-level/); assert.match(body.innerHTML, /data-padel144-toggle-player/);
assert.match(body.innerHTML, /Copiar para WhatsApp/); assert.match(body.innerHTML, /Exportar a Excel/); assert.match(body.innerHTML, /Imprimir/);
assert.doesNotMatch(body.innerHTML, /Parejas|Rivales|Historial cronológico/);
console.log("PASS  UI Pádel: Jugadores muestra nivel, alta/baja, resumen y exportación sin historial confuso.");
