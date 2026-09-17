import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const read = path => readFileSync(path, "utf8");
const source = read("coco-scoring-v160110.js");
const html = read("index.html");
const sql = read("supabase-coco-v160110-balanced-scoring.sql");
const rollback = read("supabase-coco-v160110-balanced-scoring-rollback.sql");
const recoverySql = read("supabase-coco-v160111-ranking-recovery.sql");
const recoveryRollback = read("supabase-coco-v160111-ranking-recovery-rollback.sql");
const sw = read("sw.js");
const context = { window: {}, setTimeout, clearTimeout, Promise, Error };
vm.runInNewContext(source, context);
const scoring = context.window.CocoScoringV160110;

test("la clasificación general conserva exactamente once juegos comparables", () => {
  assert.deepEqual(Array.from(scoring.generalIds), [
    "numeros", "calculo", "palabras", "series", "memoria", "sudoku",
    "sopa", "crucigrama", "tiempo", "verdadero", "futbol"
  ]);
  assert.equal(scoring.generalIds.includes("cocomed"), false);
  assert.equal(scoring.generalIds.includes("padel"), false);
  assert.equal(scoring.audit().games, 11);
});

test("ningún juego domina la escala y la dificultad crece de forma moderada", () => {
  for (const level of [1, 2, 3]) {
    const scores = scoring.generalIds.map(id => scoring.cap(id, level));
    assert.ok(Math.max(...scores) / Math.min(...scores) <= 1.08, `nivel ${level}`);
  }
  for (const id of scoring.generalIds) {
    assert.ok(scoring.cap(id, 1) < scoring.cap(id, 2), `${id}: básico < intermedio`);
    assert.ok(scoring.cap(id, 2) < scoring.cap(id, 3), `${id}: intermedio < avanzado`);
    assert.ok(scoring.maxForGame(id) <= 115, `${id}: máximo acotado`);
  }
  assert.equal(scoring.cap("futbol", 4), 114);
  assert.ok(scoring.audit().perfectScoreRatio < 1.08);
});

test("el rendimiento es monótono y permanece en la misma unidad para todos", () => {
  for (const id of scoring.generalIds) {
    const low = scoring.score(id, 2, 0.35);
    const medium = scoring.score(id, 2, 0.65);
    const high = scoring.score(id, 2, 0.95);
    assert.ok(low < medium && medium < high, id);
    assert.ok(high < 115, id);
  }
  const samePerformance = scoring.generalIds.map(id => scoring.score(id, 3, 0.8));
  assert.ok(Math.max(...samePerformance) - Math.min(...samePerformance) <= 5);
});

test("Zona Familiar compara correctamente resultados nuevos e históricos", () => {
  assert.equal(scoring.rowQuality({
    juego: "sudoku",
    puntos: scoring.score("sudoku", 3, 0.8),
    puntuacion_version: "balanced-v1",
    dificultad: 3,
    rendimiento: 0.8
  }), 0.8);
  assert.equal(scoring.rowQuality({ juego: "sudoku", puntos: 1075 }), 1);
  assert.equal(scoring.rowQuality({ juego: "verdadero", puntos: 160 }), 0.5);
  assert.equal(scoring.rowPoints({ juego: "sudoku", puntos: 1075 }), 103);
  assert.equal(scoring.rowPoints({ juego: "futbol", puntos: 650 }), 51);
  assert.equal(scoring.rowPoints({
    juego: "calculo",
    puntos: 83,
    puntuacion_version: "balanced-v1"
  }), 83);
});

test("el guardado admite objetos PromiseLike y propaga fallos sin quedarse esperando", async () => {
  const thenable = { then(resolve) { resolve({ data: { ok: true }, error: null }); } };
  assert.deepEqual(await scoring.waitFor(thenable, 1000), {
    data: { ok: true }, error: null
  });
  await assert.rejects(
    scoring.waitFor(Promise.reject(new Error("sin red")), 1000),
    /sin red/
  );
});

test("web y PWA usan el motor común antes de abrir cualquier juego", () => {
  const moduleAt = html.indexOf('id="coco-scoring-v160110"');
  const classicAt = html.indexOf("var U={numeros:1");
  assert.ok(moduleAt > 0 && moduleAt < classicAt);
  assert.match(html, /api\.metadata\(a,Number\(e\)\+1,o\)/);
  assert.match(html, /registrar_partida_equilibrada_v160110/);
  assert.equal((html.match(/registrar_partida_coco/g) || []).length, 1,
    "la ruta general no puede degradarse al guardado antiguo sin metadatos");
  assert.match(html, /e\.porJuego\[a\.juego\]=\(e\.porJuego\[a\.juego\]\|\|0\)\+points/,
    "los juegos ajenos al ranking conservan su acumulado histórico");
  assert.match(html, /api\.waitFor\(d\.rpc\("registrar_partida_equilibrada_v160110"/,
    "el núcleo clásico debe asimilar el PromiseLike de Supabase");
  assert.match(html, /api\.waitFor\(cli\.rpc\("registrar_partida_equilibrada_v160110"/,
    "el arcade debe asimilar el PromiseLike de Supabase");
  assert.doesNotMatch(html, /\.rpc\([^\n]+\)\.catch\(/,
    "un builder PromiseLike de PostgREST no expone .catch directamente");
  assert.match(html, /function currentQuizPerformance\(\)/);
  assert.match(html, /balancedScore\(active\.id,active\.level,performance\)/);
  assert.match(html, /promedio por partida/);
  assert.doesNotMatch(html, /var scoreLimit=id==="futbol"\?1300:1000/);
  assert.match(sw, /coco-en-forma-v160\.100\.13-eterna-incomplete-retry-r1/);
  assert.match(sw, /\.\/coco-scoring-v160110\.js/);
});

test("la migración inicia temporada sin borrar el histórico", () => {
  assert.match(sql, /add column if not exists puntuacion_version text/);
  assert.match(sql, /alter table public\.coco_scoring_seasons enable row level security/);
  assert.equal((sql.match(/security definer\s+set search_path = ''/g) || []).length, 3);
  assert.match(sql, /create policy partidas_balanced_v1_solo_rpc/);
  assert.match(sql, /as restrictive\s+for insert\s+to public\s+with check \(puntuacion_version is null\)/);
  assert.match(sql, /partidas_balanced_v1_integridad/);
  assert.match(sql, /p\.puntuacion_version = 'balanced-v1'/);
  assert.match(sql, /p_puntos > 115/);
  assert.match(sql, /abs\(p_puntos - v_esperado\) > 1/);
  assert.match(sql, /pg_advisory_xact_lock/);
  assert.match(sql, /and p\.juego = p_juego/);
  assert.match(sql, /partidas_jugador_juego_creado_idx/);
  assert.match(sql, /p\.creado >= v_inicio_dia\s+and p\.creado < v_fin_dia/);
  assert.doesNotMatch(sql, /delete\s+from\s+public\.partidas/i);
  assert.doesNotMatch(sql, /update\s+public\.partidas/i);
  assert.match(rollback, /Reactiva la lectura histórica v153/);
  assert.doesNotMatch(rollback, /delete\s+from\s+public\.partidas/i);
  assert.doesNotMatch(rollback, /drop\s+column/i);
});

test("la recuperación vuelve a incluir el histórico sin reescribir partidas", () => {
  assert.match(recoverySql, /create or replace view public\.coco_clasificacion_fuente_v153/);
  assert.match(recoverySql, /p\.puntuacion_version = 'balanced-v1' or p\.puntuacion_version is null/);
  assert.match(recoverySql, /when 'sudoku' then 1075/);
  assert.match(recoverySql, /when 'futbol' then 1300/);
  assert.match(recoverySql, /pv\.numeros \+ pv\.calculo \+ pv\.palabras/);
  assert.doesNotMatch(recoverySql, /delete\s+from\s+public\.partidas/i);
  assert.doesNotMatch(recoverySql, /update\s+public\.partidas/i);
  assert.doesNotMatch(recoverySql, /alter\s+table\s+public\.partidas/i);
  assert.match(recoveryRollback, /create or replace view public\.coco_clasificacion_fuente_v153/);
  assert.doesNotMatch(recoveryRollback, /delete\s+from\s+public\.partidas/i);
  assert.doesNotMatch(recoveryRollback, /update\s+public\.partidas/i);
});
