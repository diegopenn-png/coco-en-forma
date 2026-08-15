(function (root) {
  "use strict";

  var C = root.CocoV144;
  if (!C || root.CocoDifferencesProV144) return;

  var KINDS = ["orientation", "color", "removed", "size", "position", "shape"];
  var VARIANTS = [
    ["orientation", "color", "removed", "size", "position", "shape"],
    ["color", "removed", "size", "position", "shape", "orientation"],
    ["removed", "shape", "position", "orientation", "color", "size"]
  ];
  var SCENES = [
    ["workshop", "El taller mecánico", "scenes/scene-workshop-v141.webp?v=1440", [["clock", "el reloj", 91.5, 10.5, 10, 15], ["can", "el bote de pintura", 59.5, 45, 7, 15], ["mug", "la taza", 70, 66, 9, 14], ["lamp", "la lámpara", 48, 10, 18, 20], ["toolbox", "la caja de herramientas", 82.5, 62, 18, 23], ["plant", "la planta", 9, 56, 18, 29]]],
    ["invention-lab", "El laboratorio de inventos", "scenes/scene-invention-lab-v141.webp?v=1440", [["clock", "el reloj", 85, 13, 11, 15], ["canisters", "los botes de colores", 88, 53, 17, 18], ["toolbox", "la caja de herramientas", 83, 73, 20, 22], ["cup", "el vaso", 14, 71, 9, 22], ["controls", "las luces del robot", 50, 73, 12, 11], ["lamp", "la lámpara", 31, 11, 16, 21]]],
    ["observatory", "El observatorio de Coco", "scenes/scene-observatory-v141.webp?v=1440", [["clock", "el reloj", 92, 10, 10, 15], ["lights", "los tubos de luz", 24, 53, 20, 20], ["mug", "la taza", 10, 79, 11, 18], ["toolbox", "la caja de herramientas", 89, 80, 19, 22], ["lens", "la lente del telescopio", 78, 29, 17, 20], ["chart", "el mapa celeste", 90, 36, 18, 27]]],
    ["tech-library", "La biblioteca tecnológica", "scenes/scene-tech-library-v141.webp?v=1440", [["clock", "el reloj", 81, 12, 11, 15], ["lamp", "la lámpara", 68, 13, 14, 22], ["globe", "el globo", 93, 36, 11, 18], ["cans", "los botes", 29, 69, 11, 13], ["toolbox", "la caja de herramientas", 89, 74, 19, 23], ["mug", "la taza", 30, 60, 9, 14]]],
    ["electric-garage", "El garaje eléctrico", "scenes/scene-electric-garage-v141.webp?v=1440", [["clock", "el reloj", 74, 13, 10, 15], ["canisters", "los depósitos", 64, 39, 16, 17], ["toolbox", "la caja de herramientas", 11, 61, 21, 22], ["mug", "la taza", 94, 74, 10, 17], ["battery", "la batería", 56, 62, 14, 17], ["floor", "la señal del suelo", 53, 82, 12, 11]]],
    ["robotics-studio", "El estudio de robótica", "scenes/scene-robotics-studio-v141.webp?v=1440", [["clock", "el reloj", 88, 11, 10, 14], ["tubes", "los tubos de energía", 9, 39, 15, 19], ["mug", "la taza", 21, 80, 10, 17], ["toolbox", "la caja de herramientas", 85, 75, 19, 23], ["tools", "los destornilladores", 58, 86, 17, 15], ["lamp", "la lámpara", 44, 11, 16, 21]]],
    ["ocean-lab", "El laboratorio submarino", "scenes/scene-ocean-lab-v141.webp?v=1440", [["clock", "el reloj", 88, 13, 10, 15], ["fish", "los peces", 64, 29, 22, 23], ["canisters", "los depósitos", 17, 65, 15, 16], ["toolbox", "la caja de herramientas", 84, 73, 19, 23], ["mug", "la taza", 68, 69, 9, 15], ["floor", "el aro del suelo", 85, 90, 12, 11]]],
    ["botanical-greenhouse", "El invernadero botánico", "scenes/scene-botanical-greenhouse-v141.webp?v=1440", [["lamp", "la lámpara", 8, 15, 12, 20], ["watering", "la regadera", 91, 70, 14, 23], ["bottle", "la botella", 24, 84, 8, 17], ["cutters", "las tijeras", 71, 86, 16, 12], ["pot", "la maceta", 75, 7, 11, 13], ["notebook", "el cuaderno", 42, 91, 16, 12]]],
    ["music-studio", "El estudio musical", "scenes/scene-music-studio-v141.webp?v=1440", [["guitar", "la guitarra", 11, 47, 15, 40], ["microphone", "el micrófono", 64, 37, 9, 29], ["bells", "las campanas", 84, 22, 22, 13], ["metronome", "el metrónomo", 65, 67, 11, 27], ["controls", "los controles", 25, 84, 21, 15], ["records", "los discos", 88, 76, 21, 18]]],
    ["space-station", "La estación espacial", "scenes/scene-space-station-v141.webp?v=1440", [["planet", "el planeta", 24, 10, 15, 18], ["energy", "el tubo de energía", 23, 40, 12, 30], ["robot", "el robot", 62, 66, 16, 29], ["case", "la caja", 89, 65, 17, 20], ["plant", "la planta", 86, 40, 15, 24], ["tools", "las herramientas", 35, 88, 19, 12]]]
  ].map(function (scene) {
    return { id: scene[0], title: scene[1], src: scene[2], differences: scene[3].map(function (item, index) { return { id: scene[0] + "-" + item[0], label: item[1], x: item[2], y: item[3], w: item[4], h: item[5], kind: KINDS[index] }; }) };
  });

  var levelSelected = 1;
  var user = null;
  var game = null;
  var timer = 0;
  var controller = null;

  function selectorValue(value) { return String(value || "").replace(/([\\"'\\[\\]#.:])/g, "\\$1"); }
  function todayChoice() {
    var forced = null, forcedVariant = null;
    try { if (/localhost|127\.0\.0\.1|terminal\.local/i.test(location.hostname || "")) { var params = new URLSearchParams(location.search); forced = params.get("qaScene"); forcedVariant = params.get("qaVariant"); } } catch (_) {}
    var userKey = user && user.id || "visitante", serial = Math.floor(Date.parse(C.today() + "T12:00:00Z") / 86400000), value = serial + hash(userKey) + levelSelected * 17;
    var scene = forced && SCENES.find(function (item) { return item.id === forced; }) || SCENES[((value % SCENES.length) + SCENES.length) % SCENES.length];
    var variant = forcedVariant == null ? Math.abs(Math.floor(value / SCENES.length)) % VARIANTS.length : Math.max(0, Math.min(VARIANTS.length - 1, Number(forcedVariant) || 0));
    return { scene: scene, variant: variant, id: scene.id + "-v" + (variant + 1) };
  }
  function materialize(choice, count) {
    return choice.scene.differences.slice(0, count).map(function (base, index) {
      var item = Object.assign({}, base); item.id = base.id + "-v" + (choice.variant + 1); item.kind = VARIANTS[choice.variant][index]; item.variant = choice.variant; return item;
    });
  }
  function hash(text) { var value = 0; String(text).split("").forEach(function (character) { value = (Math.imul(value, 31) + character.charCodeAt(0)) | 0; }); return value; }
  function config(level) { return level === 1 ? { count: 4, seconds: 150 } : level === 2 ? { count: 5, seconds: 130 } : { count: 6, seconds: 110 }; }

  async function resolveUser() {
    var session = await C.session(); if (!session || !session.user) return { id: "visitante", name: "Jugador Coco" };
    var metadata = session.user.user_metadata || {}; return { id: session.user.id, name: metadata.apodo || metadata.username || (session.user.email || "Jugador Coco").split("@")[0] };
  }
  function userId() { return user && user.id || "visitante"; }
  async function canPlay() {
    if (!root.CocoDailyV134 || typeof root.CocoDailyV134.canPlay !== "function") return true;
    try { return await root.CocoDailyV134.canPlay("diferencias", userId()); } catch (_) { return true; }
  }

  function introHtml(allowed) {
    var choice = todayChoice(), cfg = config(levelSelected);
    return '<main class="c144DiffIntro"><section class="c144Card"><span class="c144Eyebrow">ATENCIÓN VISUAL · ESCENAS MÁS CLARAS</span><h3>Encuentra las diferencias</h3><p>Compara las dos imágenes y marca cada cambio desde cualquiera de ellas. La imagen, la transformación y la zona pulsable comparten una única definición normalizada.</p><div class="c144DiffTypes"><span>↔ Orientación</span><span>🎨 Color</span><span>◌ Objeto ausente</span><span>↕ Tamaño</span><span>⌖ Posición</span><span>◆ Forma o detalle</span></div><div class="c144LevelButtons"><button type="button" data-diff144-level="1" class="' + (levelSelected === 1 ? "active" : "") + '">Básico · 4</button><button type="button" data-diff144-level="2" class="' + (levelSelected === 2 ? "active" : "") + '">Intermedio · 5</button><button type="button" data-diff144-level="3" class="' + (levelSelected === 3 ? "active" : "") + '">Avanzado · 6</button></div><p class="c144Notice">Escenario de hoy: <b>' + C.esc(choice.scene.title) + '</b> · combinación ' + (choice.variant + 1) + '/3 · ' + cfg.seconds + ' segundos. Todos los cambios son visibles, comprobables y pulsables en ambas imágenes.</p><div class="c144Actions"><button type="button" class="c144Primary" data-diff144-start ' + (allowed ? "" : "disabled") + '>' + (allowed ? "Comenzar" : "Completado hoy") + '</button></div></section></main>';
  }

  async function renderIntro() {
    var allowed = await canPlay(), body = C.body(); if (!body) return; C.setModalTitle("Encuentra las diferencias", "ATENCIÓN VISUAL · v144.0"); body.innerHTML = introHtml(allowed);
    body.querySelectorAll("[data-diff144-level]").forEach(function (button) { button.onclick = function () { levelSelected = Number(button.dataset.diff144Level) || 1; renderIntro(); }; });
    var start = body.querySelector("[data-diff144-start]"); if (start && !start.disabled) start.onclick = startGame;
  }

  function sceneMarkup(side) {
    return '<div class="c144DiffScene" data-diff144-scene="' + side + '" data-ready="false"><canvas width="1536" height="1024" data-diff144-canvas="' + side + '"></canvas>' + game.items.map(function (item) { return '<button type="button" class="c144DiffHit" data-diff144-id="' + item.id + '" aria-label="Marcar posible diferencia: ' + C.esc(item.label) + '" style="left:' + item.x + '%;top:' + item.y + '%;width:' + item.w + '%;height:' + item.h + '%"></button>'; }).join("") + '</div>';
  }

  function gameHtml() {
    return '<main class="c144Diff"><div class="c144DiffTop"><div><span class="c144Eyebrow">ESCENARIO: ' + C.esc(game.scene.title).toUpperCase() + '</span><h3>Encuentra ' + game.items.length + ' diferencias</h3><p>Pulsa el cambio en cualquiera de las dos escenas. Un clic fuera nunca cuenta como acierto.</p></div><div class="c144DiffCounters"><div><b data-diff144-found>0/' + game.items.length + '</b><span>ENCONTRADAS</span></div><div><b data-diff144-time>' + game.remaining + ' s</b><span>TIEMPO</span></div><div><b data-diff144-misses>0</b><span>FALLOS</span></div></div></div><div class="c144DiffBoards"><section class="c144DiffPanel"><header><span>1 · Original</span><small>Más clara</small></header>' + sceneMarkup("left") + '</section><section class="c144DiffPanel"><header><span>2 · Modificada</span><small>Cambios reales</small></header>' + sceneMarkup("right") + '</section></div></main>';
  }

  function rectFor(canvas, item) {
    var width = Math.max(8, Math.round(canvas.width * item.w / 100)), height = Math.max(8, Math.round(canvas.height * item.h / 100));
    return { x: Math.max(0, Math.min(canvas.width - width, Math.round(canvas.width * item.x / 100 - width / 2))), y: Math.max(0, Math.min(canvas.height - height, Math.round(canvas.height * item.y / 100 - height / 2))), width: width, height: height };
  }

  function snapshot(ctx, rect) { var temp = document.createElement("canvas"); temp.width = rect.width; temp.height = rect.height; temp.getContext("2d").drawImage(ctx.canvas, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height); return temp; }
  function clipEllipse(ctx, rect) { ctx.beginPath(); ctx.ellipse(rect.x + rect.width / 2, rect.y + rect.height / 2, rect.width / 2, rect.height / 2, 0, 0, Math.PI * 2); ctx.clip(); }
  function eraseRegion(ctx, rect) {
    ctx.save(); clipEllipse(ctx, rect); var sx = Math.max(0, rect.x - rect.width), sy = Math.max(0, rect.y - Math.round(rect.height * .15)), sw = Math.min(ctx.canvas.width - sx, rect.width), sh = Math.min(ctx.canvas.height - sy, rect.height); ctx.filter = "blur(12px) brightness(1.08)"; ctx.drawImage(ctx.canvas, sx, sy, sw, sh, rect.x, rect.y, rect.width, rect.height); ctx.filter = "none"; ctx.fillStyle = "rgba(235,245,247,.28)"; ctx.fillRect(rect.x, rect.y, rect.width, rect.height); ctx.restore();
  }
  function tintRegion(ctx, rect) {
    var data = ctx.getImageData(rect.x, rect.y, rect.width, rect.height), pixels = data.data;
    for (var y = 0; y < rect.height; y++) for (var x = 0; x < rect.width; x++) { var nx = (x + .5 - rect.width / 2) / (rect.width / 2), ny = (y + .5 - rect.height / 2) / (rect.height / 2), distance = nx * nx + ny * ny; if (distance > 1) continue; var index = (y * rect.width + x) * 4, r = pixels[index], g = pixels[index + 1], b = pixels[index + 2], weight = Math.min(1, (1 - distance) * 1.8); pixels[index] = Math.round(r * (1 - weight) + (255 - g) * weight); pixels[index + 1] = Math.round(g * (1 - weight) + (80 + b * .25) * weight); pixels[index + 2] = Math.round(b * (1 - weight) + (225 - r * .35) * weight); }
    ctx.putImageData(data, rect.x, rect.y);
  }

  function applyDifference(ctx, canvas, item) {
    var rect = rectFor(canvas, item), temp = snapshot(ctx, rect); ctx.save(); clipEllipse(ctx, rect);
    if (item.kind === "orientation") { if (item.variant === 2) { ctx.translate(rect.x, rect.y + rect.height); ctx.scale(1, -1); } else { ctx.translate(rect.x + rect.width, rect.y); ctx.scale(-1, 1); } ctx.drawImage(temp, 0, 0); ctx.globalCompositeOperation = "soft-light"; ctx.fillStyle = "rgba(77,206,255,.55)"; ctx.fillRect(0, 0, rect.width, rect.height); }
    else if (item.kind === "color") { ctx.restore(); tintRegion(ctx, rect); return; }
    else if (item.kind === "removed") { ctx.restore(); eraseRegion(ctx, rect); return; }
    else if (item.kind === "size") { ctx.restore(); eraseRegion(ctx, rect); ctx.save(); clipEllipse(ctx, rect); var scale = item.variant === 1 ? .52 : item.variant === 2 ? .7 : .62, width = rect.width * scale, height = rect.height * scale; ctx.drawImage(temp, rect.x + (rect.width - width) / 2, rect.y + (rect.height - height) / 2, width, height); }
    else if (item.kind === "position") { ctx.restore(); eraseRegion(ctx, rect); ctx.save(); clipEllipse(ctx, rect); var dx = item.variant === 1 ? -.2 : .2, dy = item.variant === 2 ? .16 : -.1; ctx.drawImage(temp, rect.x + rect.width * dx, rect.y + rect.height * dy, rect.width, rect.height); }
    else { ctx.globalAlpha = .96; ctx.fillStyle = item.variant === 1 ? "#ff6f91" : item.variant === 2 ? "#55e6b5" : "#ffd54a"; ctx.strokeStyle = "#123e59"; ctx.lineWidth = Math.max(4, rect.width * .045); ctx.beginPath(); if (item.variant === 1) { ctx.arc(rect.x + rect.width * .5, rect.y + rect.height * .5, Math.min(rect.width, rect.height) * .34, 0, Math.PI * 2); } else if (item.variant === 2) { ctx.moveTo(rect.x + rect.width * .5, rect.y + rect.height * .08); ctx.lineTo(rect.x + rect.width * .9, rect.y + rect.height * .5); ctx.lineTo(rect.x + rect.width * .5, rect.y + rect.height * .92); ctx.lineTo(rect.x + rect.width * .1, rect.y + rect.height * .5); ctx.closePath(); } else { ctx.moveTo(rect.x + rect.width * .5, rect.y + rect.height * .12); ctx.lineTo(rect.x + rect.width * .86, rect.y + rect.height * .82); ctx.lineTo(rect.x + rect.width * .14, rect.y + rect.height * .82); ctx.closePath(); } ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(rect.x + rect.width * .5, rect.y + rect.height * .53, Math.max(4, Math.min(rect.width, rect.height) * .1), 0, Math.PI * 2); ctx.fillStyle = "#315fc4"; ctx.fill(); }
    ctx.restore();
  }

  function loadScenes() {
    var image = new Image(); image.decoding = "async";
    image.onload = function () {
      if (!game || game.finished) return;
      C.body().querySelectorAll("[data-diff144-canvas]").forEach(function (canvas) { var ctx = canvas.getContext("2d", { alpha: false }); ctx.filter = "brightness(1.15) contrast(1.06) saturate(1.06)"; ctx.drawImage(image, 0, 0, canvas.width, canvas.height); ctx.filter = "none"; if (canvas.dataset.diff144Canvas === "right") game.items.forEach(function (item) { applyDifference(ctx, canvas, item); }); var scene = canvas.closest("[data-diff144-scene]"); if (scene) scene.dataset.ready = "true"; });
      game.startedAt = Date.now(); timer = setInterval(tick, 250); updateHud();
    };
    image.onerror = function () { var body = C.body(); if (!body) return; body.innerHTML = '<div class="c144Empty"><b>No se pudo cargar el escenario</b><span>Comprueba los archivos locales de escenas.</span><button type="button" class="c144Secondary" data-diff144-retry>Reintentar</button></div>'; body.querySelector("[data-diff144-retry]").onclick = startGame; };
    image.src = game.scene.src;
  }

  function pointInside(scene, event, item) {
    var rect = scene.getBoundingClientRect(); if (!rect.width || !rect.height) return false; var x = (event.clientX - rect.left) / rect.width * 100, y = (event.clientY - rect.top) / rect.height * 100, nx = (x - item.x) / (item.w / 2), ny = (y - item.y) / (item.h / 2); return nx * nx + ny * ny <= 1;
  }
  function itemAt(scene, event) { var matches = game.items.filter(function (item) { return pointInside(scene, event, item); }); return matches[0] || null; }

  function answer(item, scene, event) {
    if (!game || game.finished || scene.dataset.ready !== "true") return; var now = Date.now(); if (now - game.lastTap < 180) return; game.lastTap = now;
    if (item && game.found.has(item.id)) return;
    if (item) { game.found.add(item.id); C.body().querySelectorAll('[data-diff144-id="' + selectorValue(item.id) + '"]').forEach(function (button) { button.classList.add("found"); button.setAttribute("aria-label", "Diferencia encontrada: " + item.label); }); C.sound("good"); updateHud(); if (game.found.size >= game.items.length) finish("complete"); return; }
    game.misses++; var rect = scene.getBoundingClientRect(), marker = document.createElement("span"); marker.className = "c144DiffMiss"; marker.textContent = "×"; marker.style.left = Math.max(2, Math.min(98, (event.clientX - rect.left) / rect.width * 100)) + "%"; marker.style.top = Math.max(2, Math.min(98, (event.clientY - rect.top) / rect.height * 100)) + "%"; scene.appendChild(marker); setTimeout(function () { marker.remove(); }, 620); C.sound("bad"); updateHud();
  }

  function tick() { if (!game || game.finished) return; game.remaining = Math.max(0, game.limit - (Date.now() - game.startedAt) / 1000); updateHud(); if (game.remaining <= 0) finish("time"); }
  function score() { var accuracy = game.found.size / game.items.length, precision = game.items.length / (game.items.length + game.misses), speed = Math.max(0, game.remaining / game.limit); return Math.round(Math.max(0, Math.min(320, 230 * accuracy + 50 * accuracy * precision + (accuracy === 1 ? 40 * speed : 0)))); }
  function updateHud() { var body = C.body(); if (!body || !game) return; var found = body.querySelector("[data-diff144-found]"), time = body.querySelector("[data-diff144-time]"), misses = body.querySelector("[data-diff144-misses]"); if (found) found.textContent = game.found.size + "/" + game.items.length; if (time) time.textContent = Math.ceil(game.remaining) + " s"; if (misses) misses.textContent = game.misses; }

  async function saveScore(points) {
    if (root.CocoDailyV134 && typeof root.CocoDailyV134.complete === "function") await root.CocoDailyV134.complete("diferencias", userId());
    if (userId() === "visitante") return;
    var api = C.client(); if (!api) return;
    try { var result = await api.rpc("registrar_partida_coco", { p_juego: "diferencias", p_puntos: points }); if (result.error && /could not find|schema cache|PGRST202/i.test(result.error.message || result.error.code || "")) await api.from("partidas").insert({ jugador: userId(), juego: "diferencias", puntos: points }); } catch (_) {}
  }

  async function finish(reason) {
    if (!game || game.finished) return; game.finished = true; clearInterval(timer); var points = score(); await saveScore(points); C.sound(reason === "complete" ? "finish" : "bad"); var body = C.body(); if (!body) return;
    C.setModalTitle("Encuentra las diferencias", "RESULTADO · CLASIFICACIÓN GENERAL"); body.innerHTML = '<main class="c144DiffResult"><section class="c144Card"><span class="c144Eyebrow">' + (reason === "complete" ? "ESCENARIO COMPLETADO" : "TIEMPO FINALIZADO") + '</span><h3>' + game.found.size + ' de ' + game.items.length + ' diferencias</h3><div class="c144RunnerMetrics"><div><b>' + points + '</b><span>Puntos</span></div><div><b>' + game.misses + '</b><span>Clics falsos</span></div><div><b>' + Math.ceil(game.limit - game.remaining) + ' s</b><span>Tiempo</span></div></div><p class="c144HealthyEnd">Buen entrenamiento visual. Descansa la vista mirando a lo lejos durante unos instantes.</p><div class="c144Actions" style="justify-content:center"><button type="button" class="c144Primary" data-diff144-close>Volver</button></div></section></main>'; body.querySelector("[data-diff144-close]").onclick = C.closeModal;
  }

  async function startGame() {
    if (!(await canPlay())) { renderIntro(); return; } var cfg = config(levelSelected), choice = todayChoice(); game = { scene: choice.scene, combinationId: choice.id, variant: choice.variant, items: materialize(choice, cfg.count), found: new Set(), misses: 0, lastTap: 0, limit: cfg.seconds, remaining: cfg.seconds, startedAt: 0, finished: false };
    var body = C.body(); if (!body) return; body.innerHTML = gameHtml(); controller = new AbortController();
    body.querySelectorAll("[data-diff144-scene]").forEach(function (sceneNode) { sceneNode.addEventListener("click", function (event) { var hotspot = event.target.closest("[data-diff144-id]"), keyboardItem = event.detail === 0 && hotspot ? game.items.find(function (item) { return item.id === hotspot.dataset.diff144Id; }) : null; answer(keyboardItem || itemAt(sceneNode, event), sceneNode, event); }, { signal: controller.signal }); });
    loadScenes();
  }

  async function open() { C.openModal({ module: "differences", title: "Encuentra las diferencias", kicker: "ATENCIÓN VISUAL · v144.0", html: '<div class="c144Empty"><b>Coco está preparando el escenario…</b></div>', dispose: dispose }); user = await resolveUser(); renderIntro(); }
  function dispose() { clearInterval(timer); if (controller) controller.abort(); controller = null; if (game) game.finished = true; game = null; }

  root.CocoDifferencesProV144 = {
    version: "144.0.0", open: open, scenes: SCENES,
    config: config, rectFor: rectFor,
    audit: function () { return { sceneCount: SCENES.length, variantsPerScene: VARIANTS.length, combinationsPerLevel: SCENES.length * VARIANTS.length, levels: { basic: 4, intermediate: 5, advanced: 6 }, everySceneHasSix: SCENES.every(function (scene) { return scene.differences.length === 6; }), differenceKinds: KINDS.slice(), sameDefinitionForVisualAndHit: true, normalizedCoordinates: true, clickableFromBothImages: true, falseClicksAccepted: false, brightness: 1.15, renderer: "dual-canvas-v144" }; }
  };
})(window);
