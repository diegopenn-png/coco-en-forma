(function (root) {
  "use strict";

  var C = root.CocoV144;
  if (!C || root.CocoRunnerV145) return;

  var GAME_ID = "cococorre";
  var HISTORY_KEY = "coco_runner_history_v144";
  var levelSelected = 1;
  var user = null;
  var game = null;
  var controller = null;
  var frame = 0;
  var lastFrame = 0;
  var pointerStart = null;

  var COLORS = [{ id: "azul", label: "azul", value: "#38aee0" }, { id: "naranja", label: "naranja", value: "#ef7a18" }, { id: "verde", label: "verde", value: "#45b979" }, { id: "morado", label: "morado", value: "#7960d8" }];
  var SHAPES = [{ id: "circulo", label: "círculo", glyph: "●" }, { id: "cuadrado", label: "cuadrado", glyph: "■" }, { id: "triangulo", label: "triángulo", glyph: "▲" }, { id: "estrella", label: "estrella", glyph: "★" }];
  var CATEGORIES = [
    { id: "herramientas", label: "herramientas", items: [{ id: "llave", label: "llave", glyph: "🔧" }, { id: "engranaje", label: "engranaje", glyph: "⚙" }, { id: "tuerca", label: "tuerca", glyph: "⬢" }] },
    { id: "naturaleza", label: "naturaleza", items: [{ id: "hoja", label: "hoja", glyph: "◆" }, { id: "flor", label: "flor", glyph: "✿" }, { id: "gota", label: "gota", glyph: "●" }] },
    { id: "ciencia", label: "ciencia", items: [{ id: "atomo", label: "átomo", glyph: "⚛" }, { id: "matraz", label: "matraz", glyph: "⌬" }, { id: "iman", label: "imán", glyph: "∩" }] }
  ];

  function hash(text) { var value = 2166136261; String(text).split("").forEach(function (character) { value ^= character.charCodeAt(0); value = Math.imul(value, 16777619); }); return value >>> 0; }
  function randomFrom(seed) { var value = hash(seed) || 1; return function () { value += 0x6d2b79f5; var mixed = value; mixed = Math.imul(mixed ^ mixed >>> 15, mixed | 1); mixed ^= mixed + Math.imul(mixed ^ mixed >>> 7, mixed | 61); return ((mixed ^ mixed >>> 14) >>> 0) / 4294967296; }; }
  function pick(list, random) { return list[Math.floor(random() * list.length)]; }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function dateSerial() { return Math.floor(Date.parse(C.today() + "T12:00:00Z") / 86400000); }
  function history() { try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch (_) { return []; } }

  function categoryById(id) { return CATEGORIES.filter(function (category) { return category.id === id; })[0] || CATEGORIES[0]; }
  function otherFrom(list, currentId, random) { var options = list.filter(function (item) { return item.id !== currentId; }); return pick(options.length ? options : list, random); }
  function pluralShape(shape) { return shape.id === "circulo" ? "círculos" : shape.id === "cuadrado" ? "cuadrados" : shape.id === "triangulo" ? "triángulos" : "estrellas"; }

  function buildMission(chosenLevel, seed, attempt) {
    var random = randomFrom(String(seed || (C.today() + "|" + chosenLevel)) + "|" + attempt), sequenceLength = chosenLevel === 1 ? 3 : chosenLevel === 2 ? 4 : 5, sequence = [];
    while (sequence.length < sequenceLength) { var next = pick(COLORS, random); if (!sequence.length || sequence[sequence.length - 1].id !== next.id) sequence.push(next); }
    var attentionPools = {
      1: [function () { return { type: "even" }; }, function () { return { type: "shape", target: pick(SHAPES, random) }; }, function () { return { type: "color", target: pick(COLORS, random) }; }],
      2: [function () { return { type: "odd" }; }, function () { return { type: "category", target: pick(CATEGORIES, random) }; }, function () { return { type: "shape-color", shape: pick(SHAPES, random), color: pick(COLORS, random) }; }],
      3: [function () { return { type: "shape-color", shape: pick(SHAPES, random), color: pick(COLORS, random) }; }, function () { return { type: "category-color", category: pick(CATEGORIES, random), color: pick(COLORS, random) }; }, function () { return { type: "calculation", parity: random() > .5 ? "par" : "impar" }; }]
    };
    var attentionFactory = pick(attentionPools[chosenLevel] || attentionPools[1], random);
    var flexRules = chosenLevel === 1 ? [
      { type: "shape", target: pick(SHAPES, random) }, { type: "color", target: pick(COLORS, random) }, { type: "category", target: pick(CATEGORIES, random) }
    ] : chosenLevel === 2 ? [
      { type: "even" }, { type: "odd" }, { type: "category", target: pick(CATEGORIES, random) }, { type: "shape-color", shape: pick(SHAPES, random), color: pick(COLORS, random) }
    ] : [
      { type: "shape-color", shape: pick(SHAPES, random), color: pick(COLORS, random) }, { type: "calculation", parity: random() > .5 ? "par" : "impar" }, { type: "opposite-color", target: pick(COLORS, random) }, { type: "category-color", category: pick(CATEGORIES, random), color: pick(COLORS, random) }
    ];
    return { id: "runner-" + chosenLevel + "-" + hash(String(seed || "daily") + "|" + attempt), level: chosenLevel, attention: attentionFactory(), memory: { type: "sequence", sequence: sequence }, flex: { rules: flexRules } };
  }

  function ruleFor(mission, segment, flexIndex, memoryIndex) {
    if (segment === 0) return mission.attention;
    if (segment === 1) return { type: "sequence", sequence: mission.memory.sequence, index: memoryIndex % mission.memory.sequence.length, target: mission.memory.sequence[memoryIndex % mission.memory.sequence.length] };
    return mission.flex.rules[flexIndex % mission.flex.rules.length];
  }

  function ruleCopy(mission, segment, flexIndex, memoryIndex) {
    var rule = ruleFor(mission, segment, flexIndex, memoryIndex || 0), prefix = segment === 2 ? "Nueva regla: " : "";
    if (rule.type === "sequence") {
      var reveal = game && game.elapsed - game.duration / 3 < 5;
      return reveal ? "Memoriza: " + rule.sequence.map(function (item) { return item.label; }).join(" → ") : "Ahora recoge " + rule.target.label + " · paso " + (rule.index + 1) + "/" + rule.sequence.length;
    }
    if (rule.type === "shape") return prefix + "recoge " + pluralShape(rule.target);
    if (rule.type === "color") return prefix + "recoge objetos de color " + rule.target.label;
    if (rule.type === "even") return prefix + "recoge números pares";
    if (rule.type === "odd") return prefix + "recoge números impares";
    if (rule.type === "category") return prefix + "recoge elementos de " + rule.target.label;
    if (rule.type === "shape-color") return prefix + "recoge " + pluralShape(rule.shape) + " de color " + rule.color.label;
    if (rule.type === "category-color") return prefix + "recoge " + rule.category.label + " de color " + rule.color.label;
    if (rule.type === "calculation") return prefix + "elige operaciones con resultado " + rule.parity;
    return prefix + "recoge todo excepto el color " + rule.target.label;
  }

  function baseToken(random, level) {
    var category = pick(CATEGORIES, random), item = pick(category.items, random), shape = pick(SHAPES, random), color = pick(COLORS, random), value = 1 + Math.floor(random() * (level === 1 ? 12 : level === 2 ? 30 : 72));
    return { color: color, shape: shape, value: value, category: category, item: item, glyph: shape.glyph, display: "shape" };
  }

  function makeCalculation(token, random, parity) {
    var wantedEven = parity === "par", a = 2 + Math.floor(random() * 13), b = 1 + Math.floor(random() * 9), subtract = random() > .57, value;
    if (subtract && b > a) { var swap = a; a = b; b = swap; }
    value = subtract ? a - b : a + b;
    if ((value % 2 === 0) !== wantedEven) { b += 1; if (subtract && b > a) subtract = false; value = subtract ? a - b : a + b; }
    token.value = value; token.glyph = a + (subtract ? "−" : "+") + b; token.display = "calculation"; return token;
  }

  function tokenMatchesRule(token, rule) {
    if (rule.type === "shape") return token.shape.id === rule.target.id;
    if (rule.type === "color") return token.color.id === rule.target.id;
    if (rule.type === "even") return token.value % 2 === 0;
    if (rule.type === "odd") return Math.abs(token.value % 2) === 1;
    if (rule.type === "category") return token.category.id === rule.target.id;
    if (rule.type === "shape-color") return token.shape.id === rule.shape.id && token.color.id === rule.color.id;
    if (rule.type === "category-color") return token.category.id === rule.category.id && token.color.id === rule.color.id;
    if (rule.type === "calculation") return rule.parity === "par" ? token.value % 2 === 0 : Math.abs(token.value % 2) === 1;
    if (rule.type === "sequence") return token.color.id === rule.target.id;
    return token.color.id !== rule.target.id;
  }

  function makeTokenForRule(rule, random, level, shouldMatch) {
    var token = baseToken(random, level), wanted = shouldMatch !== false;
    if (rule.type === "shape") { token.shape = wanted ? rule.target : otherFrom(SHAPES, rule.target.id, random); token.glyph = token.shape.glyph; }
    else if (rule.type === "color") { token.color = wanted ? rule.target : otherFrom(COLORS, rule.target.id, random); token.glyph = token.shape.glyph; }
    else if (rule.type === "even" || rule.type === "odd") { var wantsEven = rule.type === "even" ? wanted : !wanted; token.value = (1 + Math.floor(random() * 24)) * 2 + (wantsEven ? 0 : 1); token.glyph = String(token.value); token.display = "number"; }
    else if (rule.type === "category") { token.category = wanted ? rule.target : otherFrom(CATEGORIES, rule.target.id, random); token.item = pick(token.category.items, random); token.glyph = token.item.glyph; token.display = "category"; }
    else if (rule.type === "shape-color") { token.shape = wanted ? rule.shape : (random() > .5 ? otherFrom(SHAPES, rule.shape.id, random) : rule.shape); token.color = wanted ? rule.color : (token.shape.id === rule.shape.id ? otherFrom(COLORS, rule.color.id, random) : pick(COLORS, random)); token.glyph = token.shape.glyph; }
    else if (rule.type === "category-color") { token.category = wanted ? rule.category : (random() > .5 ? otherFrom(CATEGORIES, rule.category.id, random) : rule.category); token.color = wanted ? rule.color : (token.category.id === rule.category.id ? otherFrom(COLORS, rule.color.id, random) : pick(COLORS, random)); token.item = pick(token.category.items, random); token.glyph = token.item.glyph; token.display = "category"; }
    else if (rule.type === "calculation") { token = makeCalculation(token, random, wanted ? rule.parity : (rule.parity === "par" ? "impar" : "par")); }
    else if (rule.type === "sequence") { token.color = wanted ? rule.target : otherFrom(COLORS, rule.target.id, random); token.glyph = token.shape.glyph; }
    else if (rule.type === "opposite-color") { token.color = wanted ? otherFrom(COLORS, rule.target.id, random) : rule.target; token.glyph = token.shape.glyph; }
    token.correct = tokenMatchesRule(token, rule); token.ruleType = rule.type;
    return token;
  }

  function validateMission(mission) {
    var random = randomFrom(mission.id + "|preflight"), rules = [mission.attention];
    mission.memory.sequence.forEach(function (color, index) { rules.push({ type: "sequence", sequence: mission.memory.sequence, index: index, target: color }); });
    mission.flex.rules.forEach(function (rule) { rules.push(rule); });
    var failures = [];
    rules.forEach(function (rule, index) {
      var correct = makeTokenForRule(rule, random, mission.level, true), distractor = makeTokenForRule(rule, random, mission.level, false);
      if (!tokenMatchesRule(correct, rule)) failures.push("rule-" + index + "-missing-target");
      if (tokenMatchesRule(distractor, rule)) failures.push("rule-" + index + "-missing-distractor");
      if (rule.type === "shape" && rule.target.id === "estrella" && correct.glyph !== "★") failures.push("star-not-visible");
    });
    var spawnInterval = mission.level === 1 ? 1.28 : mission.level === 2 ? 1.08 : .92, nominalDuration = mission.level === 1 ? 132 : mission.level === 2 ? 162 : 198, guaranteedPerSegment = Math.floor(((nominalDuration / 3) / spawnInterval) / (mission.level + 2));
    if (guaranteedPerSegment < mission.memory.sequence.length) failures.push("insufficient-sequence-budget");
    return { valid: failures.length === 0, failures: failures, checkedRules: rules.length, guaranteedPerSegment: guaranteedPerSegment };
  }

  function missionForLevel(chosenLevel, seed) {
    var mission, validation, attempt = 0;
    do { mission = buildMission(chosenLevel, seed, attempt++); validation = validateMission(mission); } while (!validation.valid && attempt < 24);
    mission.validation = validation;
    if (!validation.valid) throw new Error("No se pudo generar una misión completable: " + validation.failures.join(", "));
    return mission;
  }

  function currentUserId() { return user && user.id || root.CocoDailyV134 && root.CocoDailyV134.userId && root.CocoDailyV134.userId() || "visitante"; }

  async function resolveUser() {
    var session = await C.session();
    if (!session || !session.user) return { id: "visitante", name: "Jugador Coco" };
    var metadata = session.user.user_metadata || {}, name = metadata.apodo || metadata.username || (session.user.email || "Jugador Coco").split("@")[0];
    try { var profile = await C.client().from("perfiles").select("apodo").eq("id", session.user.id).maybeSingle(); if (!profile.error && profile.data && profile.data.apodo) name = profile.data.apodo; } catch (_) {}
    return { id: session.user.id, name: name };
  }

  function runnerStats() {
    var rows = history().filter(function (row) { return row.userId === currentUserId(); }), best = rows.reduce(function (max, row) { return Math.max(max, Number(row.accuracy) || 0); }, 0), average = rows.length ? Math.round(rows.reduce(function (sum, row) { return sum + (Number(row.accuracy) || 0); }, 0) / rows.length) : 0;
    return { missions: rows.length, best: best, average: average };
  }

  async function canPlay() {
    if (!root.CocoDailyV134 || typeof root.CocoDailyV134.canPlay !== "function") return !C.runnerCompletedToday();
    try { return await root.CocoDailyV134.canPlay(GAME_ID, currentUserId()); } catch (_) { return !C.runnerCompletedToday(); }
  }

  function introHtml(allowed) {
    var stats = runnerStats();
    return '<main class="c144RunnerIntro"><div class="c144RunnerIntroGrid"><section class="c144Card"><span class="c144Eyebrow">MISIÓN COGNITIVA FINITA · EVOLUCIÓN PERSONAL</span><h3>Coco Corre<br>Misión Cerebro</h3><p>Un recorrido original de tres carriles con principio y final. Entrena atención, memoria de trabajo y control inhibitorio en una sesión breve y saludable.</p><div class="c144RunnerFeatures"><div><b>3 tramos</b><span>Atención, memoria y flexibilidad</span></div><div><b>2–4 minutos</b><span>Meta clara, nunca infinito</span></div><div><b>Sin ranking</b><span>No suma puntos generales</span></div></div><div class="c144LevelButtons" role="group" aria-label="Dificultad"><button type="button" data-runner-level="1" class="' + (levelSelected === 1 ? "active" : "") + '">🌱 Básico</button><button type="button" data-runner-level="2" class="' + (levelSelected === 2 ? "active" : "") + '">⚡ Intermedio</button><button type="button" data-runner-level="3" class="' + (levelSelected === 3 ? "active" : "") + '">🏆 Avanzado</button></div><p class="c144Notice">La dificultad cambia las reglas y los distractores, no solo la velocidad.</p><div class="c144Actions"><button type="button" class="c144Primary" data-runner-start ' + (allowed ? "" : "disabled") + '>' + (allowed ? "Comenzar misión de hoy" : "Completado hoy") + '</button></div><p><small>Controles: desliza o usa ← → para cambiar de carril, ↑ para saltar, ↓ para agacharte. Las colisiones no terminan la partida.</small></p></section><aside class="c144Card c144RunnerCoco"><img src="./coco-v2-runner-v144.png" alt="Coco V2 con cerebro visible, mono azul de mecánico y herramientas, corriendo"><div class="c144PersonalSummary"><div><b>' + stats.missions + '</b><span>misiones</span></div><div><b>' + stats.average + '%</b><span>precisión media</span></div><div><b>' + stats.best + '%</b><span>mejor precisión</span></div></div></aside></div><p class="c144HealthyEnd">Coco en Forma no usa monedas, vidas, cofres, tiendas, publicidad ni recompensas aleatorias. Al terminar, Coco te invitará a descansar.</p></main>';
  }

  async function renderIntro() {
    var body = C.body(); if (!body) return; C.setModalTitle("Coco Corre — Misión Cerebro", "EVOLUCIÓN PERSONAL · NO SUMA AL RANKING");
    var allowed = await canPlay(); if (!C.body()) return; body.innerHTML = introHtml(allowed); bindIntro();
  }

  function bindIntro() {
    var body = C.body();
    body.querySelectorAll("[data-runner-level]").forEach(function (button) { button.onclick = function () { levelSelected = Number(button.dataset.runnerLevel) || 1; renderIntro(); }; });
    var start = body.querySelector("[data-runner-start]"); if (start && !start.disabled) start.onclick = startGame;
  }

  function gameDuration(chosenLevel) {
    var params = new URLSearchParams(location.search), fast = /localhost|127\.0\.0\.1|terminal\.local/i.test(location.hostname || "") && params.get("qaFast") === "1";
    return fast ? 18 : chosenLevel === 1 ? 132 : chosenLevel === 2 ? 162 : 198;
  }

  function stageHtml() {
    return '<main class="c144RunnerGame" data-runner-stage tabindex="0" aria-label="Runner educativo de tres carriles"><div class="c144RunnerHud"><div><span class="c144HudPill" data-runner-segment>Tramo 1/3</span><span class="c144HudPill" data-runner-time>0:00</span></div><div class="c144Rule" data-runner-rule aria-live="polite"></div><div><button type="button" data-runner-pause aria-label="Pausar la misión">Ⅱ</button></div></div><div class="c144RunnerStage" data-runner-world><div class="c144RunnerSky"></div><div class="c145Parallax c145ParallaxFar" aria-hidden="true"><i></i><i></i><i></i><i></i></div><div class="c145Parallax c145ParallaxNear" aria-hidden="true"><i></i><i></i><i></i><i></i></div><div class="c144Road"><div class="c145RoadFlow" aria-hidden="true"><i></i><i></i><i></i></div></div><div class="c145SideSignals" aria-hidden="true"><i></i><i></i><i></i><i></i></div><div class="c144RunnerCocoPlay" data-runner-coco data-action="run"><span class="c145CocoShadow" aria-hidden="true"></span><img src="./coco-v2-runner-v144.png" alt="Coco V2 corriendo con cerebro visible, mono azul y herramientas"><span class="c145SpeedLines" aria-hidden="true"></span></div><div class="c144RunnerMessage" data-runner-message aria-live="polite"></div><div class="c144RunnerControls" aria-label="Controles táctiles"><button type="button" data-move="up" aria-label="Saltar">↑</button><button type="button" data-move="left" aria-label="Carril izquierdo">←</button><button type="button" data-move="down" aria-label="Agacharse">↓</button><button type="button" data-move="right" aria-label="Carril derecho">→</button></div><div class="c144RunnerProgress"><i data-runner-progress></i></div></div></main>';
  }

  async function startGame() {
    if (!(await canPlay())) { renderIntro(); return; }
    var body = C.body(); if (!body) return;
    var duration = gameDuration(levelSelected), seed = C.today() + "|" + currentUserId() + "|" + levelSelected;
    game = { level: levelSelected, mission: missionForLevel(levelSelected, seed), random: randomFrom(seed + "|runtime"), duration: duration, elapsed: 0, segment: 0, flexIndex: 0, memoryIndex: 0, lane: 0, previousLane: 0, action: "run", actionUntil: 0, paused: false, stopped: false, objects: [], nextSpawn: .18, forcedCorrect: 2, spawnsSinceCorrect: 0, correct: 0, distractors: 0, missed: 0, expected: 0, obstacles: 0, obstaclesPassed: 0, collisions: 0, reactions: [], sequences: 0, ruleChanges: 0, celebrationDone: false, lastRuleChange: 0, startedAt: Date.now() };
    body.innerHTML = stageHtml(); controller = new AbortController();
    document.addEventListener("keydown", keyControl, { signal: controller.signal });
    body.querySelectorAll("[data-move]").forEach(function (button) { button.addEventListener("pointerdown", function (event) { event.preventDefault(); move(button.dataset.move); }, { signal: controller.signal }); });
    var stage = body.querySelector("[data-runner-stage]"); stage.dataset.level = String(levelSelected); stage.addEventListener("pointerdown", pointerDown, { signal: controller.signal }); stage.addEventListener("pointerup", pointerUp, { signal: controller.signal }); stage.addEventListener("pointercancel", function () { pointerStart = null; }, { signal: controller.signal });
    body.querySelector("[data-runner-pause]").onclick = togglePause;
    document.addEventListener("visibilitychange", visibilityPause, { signal: controller.signal });
    updateLane(); updateHud(); showMessage("Tramo 1 · Atención selectiva", "good"); C.sound("good"); lastFrame = performance.now(); frame = requestAnimationFrame(loop);
  }

  function keyControl(event) {
    if (!game || game.stopped) return; var map = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down" };
    if (map[event.key]) { event.preventDefault(); move(map[event.key]); }
    else if (event.key === " " || event.key.toLowerCase() === "p") { event.preventDefault(); togglePause(); }
  }

  function pointerDown(event) { if (!game || game.paused) return; pointerStart = { x: event.clientX, y: event.clientY, at: Date.now() }; }
  function pointerUp(event) {
    if (!pointerStart || !game || game.paused) return; var dx = event.clientX - pointerStart.x, dy = event.clientY - pointerStart.y; pointerStart = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 25) return;
    if (Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? "left" : "right"); else move(dy < 0 ? "up" : "down");
  }

  function move(direction) {
    if (!game || game.paused || game.stopped) return; var now = performance.now();
    game.previousLane = game.lane;
    if (direction === "left") game.lane = Math.max(-1, game.lane - 1);
    else if (direction === "right") game.lane = Math.min(1, game.lane + 1);
    else if (direction === "up") { game.action = "jump"; game.actionUntil = now + 650; }
    else if (direction === "down") { game.action = "duck"; game.actionUntil = now + 720; }
    updateLane();
  }

  function updateLane() {
    var body = C.body(), coco = body && body.querySelector("[data-runner-coco]"); if (!coco || !game) return;
    var stage = body.querySelector(".c144RunnerStage"), step = Math.min(178, (stage.clientWidth || innerWidth) * .25), changed = game.lane !== game.previousLane;
    coco.style.setProperty("--lane-x", (game.lane * step) + "px"); coco.dataset.action = game.action; coco.classList.toggle("jump", game.action === "jump"); coco.classList.toggle("duck", game.action === "duck");
    if (changed) {
      coco.classList.remove("lean-left", "lean-right"); void coco.offsetWidth; coco.classList.add(game.lane < game.previousLane ? "lean-left" : "lean-right");
      clearTimeout(coco.__leanTimer); coco.__leanTimer = setTimeout(function () { if (coco) coco.classList.remove("lean-left", "lean-right"); }, 360);
    }
  }

  function currentRule() { return ruleFor(game.mission, game.segment, game.flexIndex, game.memoryIndex); }
  function correctGapLimit() { return game.level === 1 ? 2 : game.level === 2 ? 3 : 4; }
  function targetRate() { return game.level === 1 ? .58 : game.level === 2 ? .48 : .4; }

  function spawnObject() {
    var body = C.body(); if (!body || !game) return;
    var obstacleRate = game.level === 1 ? .18 : game.level === 2 ? .24 : .29, mustBeCorrect = game.forcedCorrect > 0 || game.spawnsSinceCorrect >= correctGapLimit(), obstacle = !mustBeCorrect && game.random() < obstacleRate, lane = Math.floor(game.random() * 3) - 1, item;
    if (obstacle) { item = { id: C.id("run"), kind: "obstacle", lane: lane, progress: 0, requirement: game.random() > .5 ? "jump" : "duck", spawnedAt: performance.now(), resolved: false }; game.spawnsSinceCorrect++; }
    else {
      var shouldMatch = mustBeCorrect || game.random() < targetRate(), rule = currentRule(), token = makeTokenForRule(rule, game.random, game.level, shouldMatch);
      item = { id: C.id("run"), kind: "token", lane: lane, progress: 0, token: token, ruleType: rule.type, spawnedAt: performance.now(), resolved: false };
      if (token.correct) { game.expected++; game.forcedCorrect = Math.max(0, game.forcedCorrect - 1); game.spawnsSinceCorrect = 0; } else game.spawnsSinceCorrect++;
    }
    var node = document.createElement("div"); node.className = "c144RunnerObject " + (obstacle ? "obstacle" : item.token.correct ? "correct" : "distractor") + (!obstacle && item.token.display === "calculation" ? " c145Gate" : ""); node.dataset.runnerObject = item.id;
    if (obstacle) { node.textContent = item.requirement === "jump" ? "▰" : "╱╲"; node.setAttribute("aria-label", item.requirement === "jump" ? "Obstáculo para saltar" : "Obstáculo para agacharse"); }
    else { node.textContent = item.token.glyph; node.style.color = item.token.color.value; node.setAttribute("aria-label", item.token.display === "category" ? item.token.item.label + " de color " + item.token.color.label : item.token.display === "calculation" ? "Operación " + item.token.glyph : item.token.shape.label + " de color " + item.token.color.label + (item.token.display === "number" ? ", número " + item.token.value : "")); }
    body.querySelector(".c144RunnerStage").appendChild(node); item.node = node; game.objects.push(item);
  }

  function positionObject(item) {
    var body = C.body(), stage = body && body.querySelector(".c144RunnerStage"); if (!stage || !item.node) return;
    var width = stage.clientWidth || innerWidth, center = width / 2, spread = width * (.055 + item.progress * .22), x = center + item.lane * spread, y = 30 + item.progress * 66, scale = .42 + item.progress * .9;
    item.node.style.left = x + "px"; item.node.style.top = y + "%"; item.node.style.setProperty("--scale", scale.toFixed(2)); item.node.style.opacity = item.progress > .96 ? String(Math.max(0, 1 - (item.progress - .96) * 20)) : "1";
  }

  function resolveObject(item) {
    if (item.resolved || !game) return; item.resolved = true; var sameLane = item.lane === game.lane, body = C.body(), coco = body && body.querySelector("[data-runner-coco]");
    if (item.kind === "obstacle") {
      game.obstacles++;
      if (!sameLane || game.action === item.requirement) { game.obstaclesPassed++; if (sameLane) showMessage(item.requirement === "jump" ? "¡Buen salto!" : "¡Bien agachado!", "good"); }
      else { game.collisions++; if (coco) { coco.classList.add("hit"); setTimeout(function () { if (coco) coco.classList.remove("hit"); }, 520); } showMessage("Choque suave · Coco sigue", "bad"); C.sound("bad"); }
    } else if (sameLane) {
      game.reactions.push(Math.max(0, performance.now() - item.spawnedAt));
      var correctNow = item.token.correct;
      if (correctNow) { game.correct++; if (game.segment === 1) { game.memoryIndex++; if (game.memoryIndex % game.mission.memory.sequence.length === 0) game.sequences++; beginNewRule(true); } showMessage("¡Correcto!", "good"); C.sound("good"); }
      else { game.distractors++; showMessage("Era un distractor", "bad"); C.sound("bad"); }
    } else if (item.token.correct) game.missed++;
    if (item.node) item.node.remove();
  }

  function showMessage(message, tone) {
    var body = C.body(), node = body && body.querySelector("[data-runner-message]"); if (!node) return; node.textContent = message; node.dataset.tone = tone || ""; node.classList.add("show"); clearTimeout(node.__timer); node.__timer = setTimeout(function () { node.classList.remove("show"); }, 900);
  }

  function beginNewRule(clearTokens) {
    if (!game) return;
    game.forcedCorrect = 2; game.spawnsSinceCorrect = 0; game.nextSpawn = .1;
    if (clearTokens !== false) {
      game.objects.forEach(function (item) { if (item.kind === "token") { item.resolved = true; if (item.node) item.node.remove(); } });
      game.objects = game.objects.filter(function (item) { return !item.resolved; });
    }
  }

  function updateSegment() {
    var next = Math.min(2, Math.floor(game.elapsed / (game.duration / 3)));
    if (next !== game.segment) { game.segment = next; game.memoryIndex = 0; game.flexIndex = 0; game.lastRuleChange = game.elapsed; beginNewRule(true); var world = C.body() && C.body().querySelector("[data-runner-world]"); if (world) world.dataset.segment = String(next + 1); showMessage(next === 1 ? "Tramo 2 · Memoria de trabajo" : "Tramo 3 · Cambia de regla", "good"); C.sound("finish"); }
    if (game.segment === 2) {
      var interval = game.level === 1 ? 18 : game.level === 2 ? 14 : 11, desired = Math.floor((game.elapsed - game.duration * 2 / 3) / interval);
      if (desired > game.flexIndex) { game.flexIndex = desired; game.ruleChanges++; beginNewRule(true); showMessage("¡Cambio de regla!", "good"); C.sound("finish"); }
    }
  }

  function updateHud() {
    var body = C.body(); if (!body || !game) return; var remaining = Math.max(0, Math.ceil(game.duration - game.elapsed)), minutes = Math.floor(remaining / 60), seconds = String(remaining % 60).padStart(2, "0");
    var segment = body.querySelector("[data-runner-segment]"), time = body.querySelector("[data-runner-time]"), rule = body.querySelector("[data-runner-rule]"), progress = body.querySelector("[data-runner-progress]");
    if (segment) segment.textContent = "Tramo " + (game.segment + 1) + "/3"; if (time) time.textContent = minutes + ":" + seconds; if (rule) rule.textContent = ruleCopy(game.mission, game.segment, game.flexIndex, game.memoryIndex); if (progress) progress.style.width = Math.min(100, game.elapsed / game.duration * 100) + "%";
  }

  function loop(now) {
    if (!game || game.stopped) return; var delta = Math.min(.05, Math.max(0, (now - lastFrame) / 1000)); lastFrame = now;
    if (!game.paused) {
      game.elapsed += delta; if (now >= game.actionUntil && game.action !== "run") { game.action = "run"; updateLane(); }
      updateSegment(); game.nextSpawn -= delta; if (game.nextSpawn <= 0) { spawnObject(); game.nextSpawn = game.level === 1 ? 1.28 : game.level === 2 ? 1.08 : .92; }
      var speed = game.level === 1 ? .19 : game.level === 2 ? .215 : .235;
      game.objects.slice().forEach(function (item) { item.progress += delta * speed; positionObject(item); if (item.progress >= .88) resolveObject(item); });
      game.objects = game.objects.filter(function (item) { return !item.resolved; }); updateHud(); if (game.elapsed >= game.duration) { finishGame(); return; }
    }
    frame = requestAnimationFrame(loop);
  }

  function togglePause() {
    if (!game || game.stopped) return; game.paused = !game.paused; var body = C.body(), existing = body && body.querySelector(".c144Pause");
    if (game.paused && !existing) { var pause = document.createElement("div"); pause.className = "c144Pause"; pause.innerHTML = '<div><span class="c144Eyebrow">PAUSA SALUDABLE</span><h3>Misión en pausa</h3><p>Respira, descansa la vista y continúa cuando quieras.</p><button type="button" class="c144Primary" data-runner-resume>Reanudar</button></div>'; body.querySelector(".c144RunnerGame").appendChild(pause); pause.querySelector("[data-runner-resume]").onclick = togglePause; }
    else if (!game.paused && existing) { existing.remove(); lastFrame = performance.now(); }
  }

  function visibilityPause() { if (document.hidden && game && !game.paused && !game.stopped) togglePause(); }

  function highlightedSkill(result) {
    var scores = [{ label: "Atención selectiva", value: result.correctObjects }, { label: "Memoria de trabajo", value: result.sequencesRemembered * 4 }, { label: "Control inhibitorio", value: Math.max(0, result.correctObjects - result.distractorsPicked) }, { label: "Percepción visual", value: result.obstaclesPassed }];
    scores.sort(function (a, b) { return b.value - a.value; }); return scores[0].label;
  }

  async function savePersonalResult(result) {
    var rows = history(); rows.unshift(result); rows = rows.slice(0, 240); try { localStorage.setItem(HISTORY_KEY, JSON.stringify(rows)); } catch (_) {}
    var session = await C.session(), api = C.client(); if (!session || !api) return;
    try { await api.from("coco_runner_history").insert({ user_id: session.user.id, mission_id: result.missionId, level: result.level, play_date: result.date, stats: result, completed_at: result.completedAt }); } catch (_) {}
  }

  async function finishGame() {
    if (!game || game.stopped) return; game.stopped = true; cancelAnimationFrame(frame); if (controller) controller.abort(); controller = null;
    game.objects.forEach(function (item) { if (item.node) item.node.remove(); });
    var opportunities = Math.max(1, game.correct + game.distractors + game.missed), accuracy = Math.round(100 * game.correct / opportunities), reaction = game.reactions.length ? Math.round(game.reactions.reduce(function (sum, value) { return sum + value; }, 0) / game.reactions.length) : 0;
    var result = { id: C.id("runner-result"), userId: currentUserId(), missionId: game.mission.id, date: C.today(), completedAt: new Date().toISOString(), level: game.level, accuracy: accuracy, correctObjects: game.correct, distractorsPicked: game.distractors, missedTargets: game.missed, sequencesRemembered: game.sequences, obstaclesPassed: game.obstaclesPassed, obstacleCount: game.obstacles, collisions: game.collisions, averageReactionMs: reaction, ruleChanges: game.ruleChanges, durationSeconds: Math.round(game.elapsed), highlightedSkill: "" };
    result.highlightedSkill = highlightedSkill(result); await savePersonalResult(result);
    if (root.CocoDailyV134 && typeof root.CocoDailyV134.complete === "function") await root.CocoDailyV134.complete(GAME_ID, currentUserId());
    if (!game.celebrationDone) { game.celebrationDone = true; C.sound("finish"); }
    renderFinish(result);
  }

  function renderFinish(result) {
    var body = C.body(); if (!body) return; C.setModalTitle("Misión completada", "EVOLUCIÓN PERSONAL · SIN CLASIFICACIÓN");
    body.innerHTML = '<main class="c144Finish"><section class="c144Card c144FinishHero"><img src="./coco-v2-runner-v144.png" alt="Coco V2 celebrando la misión"><span class="c144Eyebrow">META ALCANZADA</span><h3>¡Misión Cerebro completada!</h3><p>Tu habilidad destacada hoy fue <b>' + C.esc(result.highlightedSkill) + '</b>. Este resultado es personal y no ha sumado ningún punto a la clasificación general.</p><div class="c144RunnerMetrics"><div><b>' + result.accuracy + '%</b><span>Precisión</span></div><div><b>' + result.correctObjects + '</b><span>Objetos correctos</span></div><div><b>' + result.distractorsPicked + '</b><span>Distractores</span></div><div><b>' + result.sequencesRemembered + '</b><span>Secuencias</span></div><div><b>' + result.obstaclesPassed + '/' + result.obstacleCount + '</b><span>Obstáculos superados</span></div><div><b>' + (result.averageReactionMs ? result.averageReactionMs + ' ms' : '—') + '</b><span>Reacción media</span></div></div><p class="c144HealthyEnd">Buen trabajo. Ahora es un buen momento para apartar la vista de la pantalla, moverte un poco y continuar mañana.</p><div class="c144Actions" style="justify-content:center"><button type="button" class="c144Primary" data-runner-close>Volver a Coco en Forma</button></div></section></main>';
    body.querySelector("[data-runner-close]").onclick = C.closeModal; if (C.enhanceCatalog) C.enhanceCatalog();
  }

  async function open() {
    C.openModal({ module: "runner", title: "Coco Corre — Misión Cerebro", kicker: "EVOLUCIÓN PERSONAL · NO SUMA AL RANKING", html: '<div class="c144Empty"><b>Coco está preparando la misión…</b></div>', dispose: dispose });
    user = await resolveUser(); await renderIntro();
  }

  function dispose() { if (game) game.stopped = true; cancelAnimationFrame(frame); if (controller) controller.abort(); controller = null; pointerStart = null; game = null; }

  var api = {
    version: "145.0.0", open: open, missionForLevel: missionForLevel, validateMission: validateMission, tokenMatchesRule: tokenMatchesRule, makeTokenForRule: makeTokenForRule, ruleFor: ruleFor,
    catalog: function () { return { colors: COLORS.slice(), shapes: SHAPES.slice(), categories: CATEGORIES.slice() }; },
    audit: function () { return { id: GAME_ID, finite: true, durationSeconds: [132, 162, 198], levels: 3, segments: ["attention", "working-memory", "inhibition-flexibility"], controls: ["swipe", "keyboard", "buttons"], preflightValidation: true, firstTargetGuaranteed: true, targetsAfterRuleChange: 2, maxDistractorGap: { basic: 2, intermediate: 3, advanced: 4 }, rankingWrites: false, partidasTableWrites: false, ownLeaderboard: false, dailyLimit: 1, monetization: false, randomRewards: false, localCharacterAsset: "coco-v2-runner-v144.png" }; }
  };
  root.CocoRunnerV145 = api;
  root.CocoRunnerV144 = api;
})(window);
