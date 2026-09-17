import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const read = path => readFileSync(path, "utf8");
const source = read("coco-scoring-v160110.js");
const html = read("index.html");
const sql = read("supabase-coco-v160110-balanced-scoring.sql");
const rollback = read("supabase-coco-v160110-balanced-scoring-rollback.sql");
const sw = read("sw.js");
const context = { window: {} };
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
});

test("web y PWA usan el motor común antes de abrir cualquier juego", () => {
  const moduleAt = html.indexOf('id="coco-scoring-v160110"');
  const classicAt = html.indexOf("var U={numeros:1");
  assert.ok(moduleAt > 0 && moduleAt < classicAt);
  assert.match(html, /api\.metadata\(a,Number\(e\)\+1,o\)/);
  assert.match(html, /registrar_partida_equilibrada_v160110/);
  assert.equal((html.match(/registrar_partida_coco/g) || []).length, 1,
    "la ruta general no puede degradarse al guardado antiguo sin metadatos");
  assert.match(html, /\(!general\|\|ranked\)&&\(e\.porJuego/,
    "los juegos ajenos al ranking conservan su acumulado histórico");
  assert.match(html, /catch\(function\(error\)\{return\{data:null,error:error\}\}\)/,
    "un fallo de guardado debe terminar en una respuesta recuperable");
  assert.match(html, /function currentQuizPerformance\(\)/);
  assert.match(html, /balancedScore\(active\.id,active\.level,performance\)/);
  assert.match(html, /promedio por partida/);
  assert.doesNotMatch(html, /var scoreLimit=id==="futbol"\?1300:1000/);
  assert.match(sw, /coco-en-forma-v160\.100\.10-balanced-scoring-r1/);
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
