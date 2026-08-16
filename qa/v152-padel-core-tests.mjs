import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const qaDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.dirname(qaDir);
let idn = 0;
const window = { CocoV144: {
  id: (p) => `${p}-${++idn}`,
  today: () => "2026-08-17",
  esc: (x) => String(x ?? ""),
  session: async () => null,
  client: () => null,
  toast() {}, sound() {}, body: () => null
}};
const context = vm.createContext({ window, console, Date, Math, JSON, Object, Array, String, Number, Boolean, RegExp, Set, Map, Promise, URL, Blob, navigator: {} });
vm.runInContext(fs.readFileSync(path.join(rootDir, "coco-v152-padel.js"), "utf8"), context, { filename: "coco-v152-padel.js" });
const P = window.CocoPadelV152;
assert.ok(P, "API CocoPadelV152 no cargada");

const state = P.blankState();
const players = ["Álvaro", "Bea", "Carlos", "Diego"].map((name) => P.createPlayer(state, name, "medio").player);
assert.equal(new Set(players.map(p => p.code)).size, 4, "códigos de jugador únicos");
state.championships.push({
  id: "ch1", name: "Amigos del tercer tiempo", startDate: "2026-08-17", endDate: "", status: "active",
  participantIds: players.map(p => p.id), scoring: { mode: "points", win: 3, draw: 1, loss: 0, tiebreakers: [] }, createdAt: new Date().toISOString(), finishedAt: null, archivedAt: null
});
state.sessions.push({
  id: "s1", kind: "championship-date", championshipId: "ch1", name: "Jornada 1", date: "2026-08-17", courts: 1, courtLabels: ["1"], rounds: 1, matchMinutes: 20, timerMode: "limit",
  participants: players.map(p => ({ playerId: p.id, codeSnapshot: p.code, nameSnapshot: p.name, levelSnapshot: p.currentLevel })),
  matches: [{ id: "m1", order: 1, round: 1, court: 1, courtLabel: "1", teamA: [players[0].id, players[1].id], teamB: [players[2].id, players[3].id], score: null, updatedAt: null }],
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
});

P.saveResult(state, "s1", "m1", [{ a: 6, b: 4 }, { a: 3, b: 6 }, { a: 10, b: 7 }]);
let rows = P.championshipStandings(state, "ch1");
assert.equal(rows.length, 4);
const winner = rows.find(r => r.id === players[0].id);
assert.equal(winner.position, 1);
assert.equal(winner.played, 1);
assert.equal(winner.won, 1);
assert.equal(winner.setsWon, 2);
assert.equal(winner.setsLost, 1);
assert.equal(winner.gamesWon, 19);
assert.equal(winner.gamesLost, 17);
assert.equal(winner.points, 3);
let stats = P.playerStats(state, players[3].id);
assert.equal(stats.played, 1);
assert.equal(stats.lost, 1);
assert.equal(stats.setsWon, 1);
assert.equal(stats.gamesWon, 17);

// Corregir el mismo resultado debe recalcular, no duplicar estadísticas.
P.saveResult(state, "s1", "m1", [{ a: 4, b: 6 }, { a: 4, b: 6 }]);
rows = P.championshipStandings(state, "ch1");
const newWinner = rows.find(r => r.id === players[2].id);
assert.equal(newWinner.position, 1);
assert.equal(newWinner.points, 3);
assert.equal(newWinner.played, 1);

// Borrar el resultado deja la clasificación derivada sin partidos jugados.
P.deleteResult(state, "s1", "m1");
rows = P.championshipStandings(state, "ch1");
assert.ok(rows.every(r => r.played === 0 && r.points === 0));

console.log("8/8 núcleo Coco Pádel v152 superado: jugadores, resultado por sets, sets/games, puntos, perfil, corrección y borrado/recalculo.");
