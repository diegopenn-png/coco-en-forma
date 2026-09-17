(function (global) {
  "use strict";

  var VERSION = "balanced-v1";
  var BASE_POINTS = 100;
  var MAX_SCORE = 115;
  var GENERAL_IDS = Object.freeze([
    "numeros", "calculo", "palabras", "series", "memoria", "sudoku",
    "sopa", "crucigrama", "tiempo", "verdadero", "futbol"
  ]);
  var GAME_FACTORS = Object.freeze({
    numeros: 0.98,
    calculo: 1.02,
    palabras: 0.99,
    series: 1.01,
    memoria: 1.00,
    sudoku: 1.03,
    sopa: 0.98,
    crucigrama: 1.01,
    tiempo: 0.99,
    verdadero: 0.98,
    futbol: 1.02
  });
  var DIFFICULTY_FACTORS = Object.freeze({
    1: 0.90,
    2: 1.00,
    3: 1.08,
    4: 1.12
  });
  var LEGACY_CAPS = Object.freeze({
    numeros: 672,
    calculo: 840,
    palabras: 739,
    series: 907,
    memoria: 874,
    sudoku: 1075,
    sopa: 773,
    crucigrama: 320,
    tiempo: 320,
    verdadero: 320,
    futbol: 1300,
    cocomed: 1000,
    padel: 1000
  });

  function clamp(value, minimum, maximum) {
    value = Number(value);
    if (!Number.isFinite(value)) value = minimum;
    return Math.max(minimum, Math.min(maximum, value));
  }

  function isGeneral(gameId) {
    return GENERAL_IDS.indexOf(String(gameId || "")) >= 0;
  }

  function normalizeDifficulty(gameId, difficulty) {
    var level = Math.round(Number(difficulty) || 2);
    var maximum = String(gameId) === "futbol" ? 4 : 3;
    return Math.max(1, Math.min(maximum, level));
  }

  function factorForGame(gameId) {
    return GAME_FACTORS[String(gameId)] || 1;
  }

  function factorForDifficulty(gameId, difficulty) {
    return DIFFICULTY_FACTORS[normalizeDifficulty(gameId, difficulty)] || 1;
  }

  function score(gameId, difficulty, performance) {
    if (!isGeneral(gameId)) return Math.round(clamp(performance, 0, 1) * 1000);
    var points = BASE_POINTS
      * factorForGame(gameId)
      * factorForDifficulty(gameId, difficulty)
      * clamp(performance, 0, 1);
    return Math.round(clamp(points, 0, MAX_SCORE));
  }

  function cap(gameId, difficulty) {
    return score(gameId, difficulty, 1);
  }

  function maxForGame(gameId) {
    return cap(gameId, String(gameId) === "futbol" ? 4 : 3);
  }

  function fromRaw(gameId, difficulty, rawScore, rawMaximum) {
    var maximum = Math.max(1, Number(rawMaximum) || 1);
    return score(gameId, difficulty, clamp(Number(rawScore) / maximum, 0, 1));
  }

  function metadata(gameId, difficulty, performance) {
    var normalizedDifficulty = normalizeDifficulty(gameId, difficulty);
    var normalizedPerformance = clamp(performance, 0, 1);
    return Object.freeze({
      version: VERSION,
      difficulty: normalizedDifficulty,
      performance: normalizedPerformance,
      points: score(gameId, normalizedDifficulty, normalizedPerformance),
      cap: cap(gameId, normalizedDifficulty)
    });
  }

  function rowQuality(row) {
    row = row || {};
    var points = Math.max(0, Number(row.puntos) || 0);
    if (row.puntuacion_version === VERSION) {
      var recorded = Number(row.rendimiento);
      if (Number.isFinite(recorded)) return clamp(recorded, 0, 1);
      return clamp(points / Math.max(1, cap(row.juego, row.dificultad)), 0, 1);
    }
    return clamp(points / Math.max(1, Number(LEGACY_CAPS[row.juego]) || points || 1), 0, 1);
  }

  function audit() {
    var advancedCaps = GENERAL_IDS.map(function (gameId) {
      return cap(gameId, gameId === "futbol" ? 4 : 3);
    });
    var minimum = Math.min.apply(Math, advancedCaps);
    var maximum = Math.max.apply(Math, advancedCaps);
    return {
      version: VERSION,
      games: GENERAL_IDS.length,
      minimumPerfectScore: minimum,
      maximumPerfectScore: maximum,
      perfectScoreRatio: maximum / minimum,
      globalLimit: MAX_SCORE
    };
  }

  global.CocoScoringV160110 = Object.freeze({
    version: VERSION,
    basePoints: BASE_POINTS,
    maxScore: MAX_SCORE,
    generalIds: GENERAL_IDS,
    gameFactors: GAME_FACTORS,
    difficultyFactors: DIFFICULTY_FACTORS,
    legacyCaps: LEGACY_CAPS,
    isGeneral: isGeneral,
    normalizeDifficulty: normalizeDifficulty,
    score: score,
    cap: cap,
    maxForGame: maxForGame,
    fromRaw: fromRaw,
    metadata: metadata,
    rowQuality: rowQuality,
    audit: audit
  });
})(window);
