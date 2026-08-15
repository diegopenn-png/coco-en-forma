(function (root) {
  "use strict";

  var C = root.CocoV144;
  if (!C || root.CocoDifferencesProV149) return;

  var KINDS = ["color", "shape", "presence"];
  var VARIANTS = [
    ["color", "shape", "presence", "color", "shape", "presence"],
    ["shape", "presence", "color", "shape", "presence", "color"],
    ["presence", "color", "shape", "presence", "color", "shape"]
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
    return { id: scene[0], title: scene[1], src: scene[2], differences: scene[3].map(function (item, index) { return { id: scene[0] + "-" + item[0], key: item[0], sceneId: scene[0], label: item[1], x: item[2], y: item[3], w: Math.max(12, item[4]), h: Math.max(14, item[5]), kind: KINDS[index % KINDS.length] }; }) };
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
      var item = Object.assign({}, base); item.id = base.id + "-v" + (choice.variant + 1); item.kind = VARIANTS[choice.variant][index]; item.variant = choice.variant;
      item.label = item.kind === "color" ? "el cambio de color de " + base.label : item.kind === "shape" ? "el cambio de forma de " + base.label : "el objeto presente o ausente junto a " + base.label;
      return item;
    });
  }
  function hash(text) { var value = 0; String(text).split("").forEach(function (character) { value = (Math.imul(value, 31) + character.charCodeAt(0)) | 0; }); return value; }
  function config(level) { return level === 1 ? { count: 4, seconds: 150 } : level === 2 ? { count: 5, seconds: 130 } : { count: 6, seconds: 110 }; }

  async function resolveUser() {
    var session = await C.session(); if (!session || !session.user) return { id: "visitante", name: "Jugador Coco" };
    if (root.CocoDailyV134 && typeof root.CocoDailyV134.setUser === "function") root.CocoDailyV134.setUser(session.user.id, session.user.email || "");
    var metadata = session.user.user_metadata || {}; return { id: session.user.id, name: metadata.apodo || metadata.username || (session.user.email || "Jugador Coco").split("@")[0] };
  }
  function userId() { return user && user.id || "visitante"; }
  function unlimitedTesting() { return Boolean(root.CocoDailyV134 && typeof root.CocoDailyV134.isUnlimited === "function" && root.CocoDailyV134.isUnlimited(userId())); }
  async function canPlay() {
    if (!root.CocoDailyV134 || typeof root.CocoDailyV134.canPlay !== "function") return true;
    try { return await root.CocoDailyV134.canPlay("diferencias", userId()); } catch (_) { return true; }
  }

  function introHtml(allowed) {
    var choice = todayChoice(), cfg = config(levelSelected), unlimited = unlimitedTesting();
    return '<main class="c144DiffIntro"><section class="c144Card"><span class="c144Eyebrow">ATENCIÓN VISUAL · ESCENAS CLARAS Y COHERENTES</span><h3>Encuentra las diferencias</h3><p>Compara las dos imágenes y marca cada cambio desde cualquiera de ellas. La imagen, el objeto y su zona pulsable comparten una única definición normalizada.</p><div class="c144DiffTypes"><span>🎨 Color claro</span><span>◆ Forma completa</span><span>◌ Presente o ausente</span></div><div class="c144LevelButtons"><button type="button" data-diff144-level="1" class="' + (levelSelected === 1 ? "active" : "") + '">Básico · 4</button><button type="button" data-diff144-level="2" class="' + (levelSelected === 2 ? "active" : "") + '">Intermedio · 5</button><button type="button" data-diff144-level="3" class="' + (levelSelected === 3 ? "active" : "") + '">Avanzado · 6</button></div><p class="c144Notice">Escenario de hoy: <b>' + C.esc(choice.scene.title) + '</b> · combinación ' + (choice.variant + 1) + '/3 · ' + cfg.seconds + ' segundos. No se deforman, rompen ni deterioran objetos.</p>' + (unlimited ? '<p class="c144Notice">Modo de pruebas activo: puedes repetir sin límite. Solo el primer resultado válido del día puntúa.</p>' : '') + '<div class="c144Actions"><button type="button" class="c144Primary" data-diff144-start ' + (allowed ? "" : "disabled") + '>' + (allowed ? (unlimited ? "Comenzar partida de prueba" : "Comenzar") : "Completado hoy") + '</button></div></section></main>';
  }

  async function renderIntro() {
    var allowed = await canPlay(), body = C.body(); if (!body) return; C.setModalTitle("Encuentra las diferencias", "ATENCIÓN VISUAL · v149.0"); body.innerHTML = introHtml(allowed);
    body.querySelectorAll("[data-diff144-level]").forEach(function (button) { button.onclick = function () { levelSelected = Number(button.dataset.diff144Level) || 1; renderIntro(); }; });
    var start = body.querySelector("[data-diff144-start]"); if (start && !start.disabled) start.onclick = startGame;
  }

  function sceneMarkup(side) {
    return '<div class="c144DiffScene" data-diff144-scene="' + side + '" data-ready="false" role="img" aria-label="Escena ' + (side === "left" ? "original" : "modificada") + '. Busca las diferencias sin pistas visuales."><canvas width="1536" height="1024" data-diff144-canvas="' + side + '"></canvas>' + game.items.map(function (item) { return '<button type="button" tabindex="-1" aria-hidden="true" class="c144DiffHit" data-diff144-id="' + item.id + '" style="left:' + item.x + '%;top:' + item.y + '%;width:' + item.w + '%;height:' + item.h + '%"></button>'; }).join("") + '</div>';
  }

  function gameHtml() {
    return '<main class="c144Diff"><div class="c144DiffTop"><div><span class="c144Eyebrow">ESCENARIO: ' + C.esc(game.scene.title).toUpperCase() + '</span><h3>Encuentra ' + game.items.length + ' diferencias</h3><p>Pulsa el cambio en cualquiera de las dos escenas. Un clic fuera nunca cuenta como acierto.</p></div><div class="c144DiffCounters"><div><b data-diff144-found>0/' + game.items.length + '</b><span>ENCONTRADAS</span></div><div><b data-diff144-time>' + game.remaining + ' s</b><span>TIEMPO</span></div><div><b data-diff144-misses>0</b><span>FALLOS</span></div></div></div><div class="c144DiffBoards"><section class="c144DiffPanel"><header><span>1 · Original</span><small>Más clara</small></header>' + sceneMarkup("left") + '</section><section class="c144DiffPanel"><header><span>2 · Modificada</span><small>Cambios reales</small></header>' + sceneMarkup("right") + '</section></div></main>';
  }

  function rectFor(canvas, item) {
    var width = Math.max(8, Math.round(canvas.width * item.w / 100)), height = Math.max(8, Math.round(canvas.height * item.h / 100));
    return { x: Math.max(0, Math.min(canvas.width - width, Math.round(canvas.width * item.x / 100 - width / 2))), y: Math.max(0, Math.min(canvas.height - height, Math.round(canvas.height * item.y / 100 - height / 2))), width: width, height: height };
  }

  function clamp01(value) { return Math.max(0, Math.min(1, value)); }
  function rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255; var max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min, hue = 0;
    if (delta) hue = max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
    hue = ((hue / 6) % 1 + 1) % 1; return [hue, max ? delta / max : 0, max];
  }
  function hsvToRgb(h, s, v) {
    h = ((h % 1) + 1) % 1; var section = Math.floor(h * 6), fraction = h * 6 - section, p = v * (1 - s), q = v * (1 - fraction * s), t = v * (1 - (1 - fraction) * s), values = [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][section % 6];
    return values.map(function (value) { return Math.round(value * 255); });
  }
  function featherWeight(x, y, width, height) {
    var nx = Math.abs((x + .5) / width * 2 - 1), ny = Math.abs((y + .5) / height * 2 - 1), edge = Math.max(nx, ny), weight = clamp01((1 - edge) / .24);
    return weight * weight * (3 - 2 * weight);
  }
  function recolorNaturalRegion(ctx, rect, variant) {
    var image = ctx.getImageData(rect.x, rect.y, rect.width, rect.height), data = image.data, hues = [.07, .48, .78], targetHue = hues[variant % hues.length];
    for (var y = 0; y < rect.height; y++) for (var x = 0; x < rect.width; x++) {
      var weight = featherWeight(x, y, rect.width, rect.height); if (weight <= 0) continue;
      var index = (y * rect.width + x) * 4, original = [data[index], data[index + 1], data[index + 2]], hsv = rgbToHsv(original[0], original[1], original[2]);
      var next = hsvToRgb(targetHue, Math.max(.34, Math.min(.78, hsv[1] * .86 + .16)), Math.max(.16, Math.min(1, hsv[2] * 1.04)));
      weight *= .76; data[index] = Math.round(original[0] + (next[0] - original[0]) * weight); data[index + 1] = Math.round(original[1] + (next[1] - original[1]) * weight); data[index + 2] = Math.round(original[2] + (next[2] - original[2]) * weight);
    }
    ctx.putImageData(image, rect.x, rect.y);
  }
  function polygonPath(ctx, cx, cy, radius, sides, rotation) {
    ctx.beginPath(); for (var point = 0; point < sides; point++) { var angle = (rotation || 0) + point * Math.PI * 2 / sides, x = cx + Math.cos(angle) * radius, y = cy + Math.sin(angle) * radius; if (!point) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.closePath();
  }
  function roundedRectPath(ctx, x, y, width, height, radius) {
    radius = Math.min(radius, width / 2, height / 2); ctx.beginPath(); ctx.moveTo(x + radius, y); ctx.lineTo(x + width - radius, y); ctx.quadraticCurveTo(x + width, y, x + width, y + radius); ctx.lineTo(x + width, y + height - radius); ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height); ctx.lineTo(x + radius, y + height); ctx.quadraticCurveTo(x, y + height, x, y + height - radius); ctx.lineTo(x, y + radius); ctx.quadraticCurveTo(x, y, x + radius, y); ctx.closePath();
  }
  function drawIntegratedDetail(ctx, rect, item, side) {
    var cx = rect.x + rect.width / 2, cy = rect.y + rect.height / 2, size = Math.max(20, Math.min(rect.width, rect.height) * .3), key = item.key || "", left = side === "left";
    if (key === "clock") size *= 1.38;
    var isControl = /controls|lights|tubes|energy/.test(key), isContainer = /mug|cup|bottle|watering|pot/.test(key);
    if (isContainer) size *= 1.5;
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,.38)"; ctx.shadowBlur = Math.max(4, size * .1); ctx.shadowOffsetY = Math.max(2, size * .07); ctx.lineCap = "round"; ctx.lineJoin = "round";
    if (key === "clock") {
      ctx.translate(cx, cy); ctx.strokeStyle = "#7b321f"; ctx.lineWidth = Math.max(4, size * .13); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(left ? -size * .16 : size * .34, -size * .56); ctx.moveTo(0, 0); ctx.lineTo(left ? size * .52 : -size * .48, left ? size * .2 : size * .32); ctx.stroke();
    } else if (key === "microphone") {
      var micGradient = ctx.createLinearGradient(cx - size, cy, cx + size, cy); micGradient.addColorStop(0, "#42362f"); micGradient.addColorStop(.5, "#c2aa82"); micGradient.addColorStop(1, "#352c28"); ctx.fillStyle = micGradient;
      if (left) roundedRectPath(ctx, cx - size * .42, cy - size * .72, size * .84, size * 1.44, size * .38); else polygonPath(ctx, cx, cy, size * .72, 6, Math.PI / 6); ctx.fill();
      ctx.shadowColor = "transparent"; ctx.strokeStyle = "rgba(27,22,20,.7)"; ctx.lineWidth = Math.max(1.5, size * .045); for (var grille = -2; grille <= 2; grille++) { ctx.beginPath(); ctx.moveTo(cx - size * .28, cy + grille * size * .18); ctx.lineTo(cx + size * .28, cy + grille * size * .18); ctx.stroke(); }
    } else if (isControl) {
      ctx.fillStyle = "rgba(32,48,54,.88)"; roundedRectPath(ctx, cx - size * .62, cy - size * .46, size * 1.24, size * .92, size * .12); ctx.fill(); ctx.shadowColor = "transparent"; ctx.strokeStyle = "#d39b42"; ctx.lineWidth = Math.max(4, size * .14); ctx.beginPath(); if (left) { ctx.moveTo(cx, cy - size * .27); ctx.lineTo(cx, cy + size * .27); } else { ctx.moveTo(cx - size * .32, cy); ctx.lineTo(cx + size * .32, cy); } ctx.stroke();
    } else if (key === "guitar") {
      ctx.fillStyle = "rgba(76,37,20,.9)"; ctx.beginPath(); if (left) { ctx.moveTo(cx - size * .5, cy - size * .5); ctx.bezierCurveTo(cx + size * .46, cy - size * .35, cx + size * .48, cy + size * .38, cx - size * .12, cy + size * .6); ctx.bezierCurveTo(cx - size * .5, cy + size * .34, cx - size * .64, cy, cx - size * .5, cy - size * .5); } else { ctx.moveTo(cx - size * .55, cy - size * .45); ctx.lineTo(cx + size * .5, cy - size * .28); ctx.lineTo(cx + size * .28, cy + size * .55); ctx.lineTo(cx - size * .42, cy + size * .42); ctx.closePath(); } ctx.fill();
    } else if (/lamp|bells/.test(key)) {
      ctx.fillStyle = "#a16a2f"; ctx.beginPath(); if (left) { ctx.moveTo(cx - size * .62, cy + size * .42); ctx.lineTo(cx - size * .28, cy - size * .5); ctx.lineTo(cx + size * .28, cy - size * .5); ctx.lineTo(cx + size * .62, cy + size * .42); } else { ctx.moveTo(cx - size * .7, cy + size * .4); ctx.quadraticCurveTo(cx, cy - size * .82, cx + size * .7, cy + size * .4); } ctx.closePath(); ctx.fill();
    } else if (isContainer) {
      ctx.shadowColor = "transparent"; ctx.strokeStyle = "#6c4028"; ctx.lineWidth = Math.max(5, size * .18); ctx.beginPath(); if (left) { ctx.moveTo(cx - size * .06, cy - size * .48); ctx.bezierCurveTo(cx - size * .12, cy - size * .52, cx + size * .68, cy - size * .45, cx + size * .55, cy + size * .34); } else { ctx.moveTo(cx - size * .06, cy - size * .48); ctx.lineTo(cx + size * .55, cy - size * .48); ctx.lineTo(cx + size * .55, cy + size * .34); } ctx.stroke();
    } else if (key === "plant") {
      ctx.fillStyle = "#39764d"; ctx.beginPath(); ctx.moveTo(cx, cy + size * .65); ctx.bezierCurveTo(cx + (left ? -.78 : .78) * size, cy + size * .12, cx + (left ? -.58 : .58) * size, cy - size * .65, cx, cy - size * .72); ctx.bezierCurveTo(cx + (left ? .28 : -.28) * size, cy - size * .18, cx + (left ? .3 : -.3) * size, cy + size * .34, cx, cy + size * .65); ctx.fill();
    } else if (key === "fish") {
      ctx.fillStyle = "#458f91"; ctx.beginPath(); ctx.moveTo(cx - size * .7, cy); ctx.quadraticCurveTo(cx, cy - size * .5, cx + size * .56, cy); ctx.quadraticCurveTo(cx, cy + size * .5, cx - size * .7, cy); ctx.fill(); ctx.beginPath(); ctx.moveTo(cx + size * .5, cy); if (left) { ctx.lineTo(cx + size, cy - size * .45); ctx.lineTo(cx + size, cy + size * .45); } else { ctx.lineTo(cx + size, cy - size * .58); ctx.lineTo(cx + size * .76, cy); ctx.lineTo(cx + size, cy + size * .58); } ctx.closePath(); ctx.fill();
    } else {
      var shapes = [["diamond", "hexagon"], ["tag", "diamond"], ["hexagon", "tag"]], shape = shapes[item.variant % shapes.length][left ? 0 : 1], gradient = ctx.createLinearGradient(cx - size, cy - size, cx + size, cy + size); gradient.addColorStop(0, "#c39a5f"); gradient.addColorStop(.55, "#80603f"); gradient.addColorStop(1, "#49372c"); ctx.fillStyle = gradient;
      if (shape === "diamond") polygonPath(ctx, cx, cy, size * .66, 4, Math.PI / 4); else if (shape === "hexagon") polygonPath(ctx, cx, cy, size * .66, 6, Math.PI / 6); else roundedRectPath(ctx, cx - size * .68, cy - size * .43, size * 1.36, size * .86, size * .13); ctx.fill();
      ctx.shadowColor = "transparent"; ctx.globalAlpha = .58; ctx.lineWidth = Math.max(2, size * .045); ctx.strokeStyle = "#30251f"; ctx.stroke();
    }
    ctx.restore();
  }
  function drawContextProp(ctx, rect, item) {
    var cx = rect.x + rect.width / 2, cy = rect.y + rect.height / 2, size = Math.max(24, Math.min(rect.width, rect.height) * .31), family = item.sceneId === "music-studio" ? "music" : item.sceneId === "botanical-greenhouse" ? "nature" : item.sceneId === "ocean-lab" ? "ocean" : item.sceneId === "space-station" || item.sceneId === "observatory" ? "space" : "tool";
    ctx.save(); ctx.translate(cx, cy); ctx.shadowColor = "rgba(0,0,0,.42)"; ctx.shadowBlur = Math.max(4, size * .11); ctx.shadowOffsetY = Math.max(2, size * .08); ctx.lineCap = "round"; ctx.lineJoin = "round";
    if (family === "music") {
      ctx.strokeStyle = "#d7a64d"; ctx.fillStyle = "#9a5a28"; ctx.lineWidth = Math.max(4, size * .16); ctx.beginPath(); ctx.moveTo(size * .18, -size * .7); ctx.lineTo(size * .18, size * .34); ctx.lineTo(size * .62, size * .18); ctx.stroke(); ctx.beginPath(); ctx.ellipse(-size * .08, size * .42, size * .34, size * .23, -.22, 0, Math.PI * 2); ctx.fill();
    } else if (family === "nature") {
      ctx.fillStyle = "#3f8f5e"; ctx.beginPath(); ctx.moveTo(0, size * .62); ctx.bezierCurveTo(-size * .85, size * .14, -size * .58, -size * .72, 0, -size * .78); ctx.bezierCurveTo(size * .7, -size * .38, size * .72, size * .32, 0, size * .62); ctx.fill(); ctx.shadowColor = "transparent"; ctx.strokeStyle = "#24593d"; ctx.lineWidth = Math.max(2, size * .07); ctx.beginPath(); ctx.moveTo(-size * .08, size * .75); ctx.lineTo(size * .18, -size * .5); ctx.stroke();
    } else if (family === "ocean") {
      ctx.fillStyle = "#4aa6a8"; ctx.beginPath(); ctx.ellipse(-size * .08, 0, size * .68, size * .38, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.moveTo(size * .5, 0); ctx.lineTo(size, -size * .42); ctx.lineTo(size, size * .42); ctx.closePath(); ctx.fill(); ctx.shadowColor = "transparent"; ctx.fillStyle = "#102f3b"; ctx.fillRect(-size * .42, -size * .08, Math.max(2, size * .08), Math.max(2, size * .08));
    } else if (family === "space") {
      ctx.fillStyle = "#b78743"; roundedRectPath(ctx, -size * .35, -size * .35, size * .7, size * .7, size * .1); ctx.fill(); ctx.fillStyle = "#357a91"; ctx.fillRect(-size, -size * .38, size * .52, size * .76); ctx.fillRect(size * .48, -size * .38, size * .52, size * .76); ctx.shadowColor = "transparent"; ctx.strokeStyle = "#d9c07e"; ctx.lineWidth = Math.max(2, size * .06); ctx.beginPath(); ctx.moveTo(0, -size * .35); ctx.lineTo(0, -size * .82); ctx.stroke();
    } else {
      ctx.strokeStyle = "#a9793e"; ctx.lineWidth = Math.max(7, size * .22); ctx.beginPath(); ctx.moveTo(-size * .62, size * .56); ctx.lineTo(size * .45, -size * .5); ctx.stroke(); ctx.shadowColor = "transparent"; ctx.strokeStyle = "#5a3d28"; ctx.lineWidth = Math.max(3, size * .09); polygonPath(ctx, size * .56, -size * .58, size * .34, 6, Math.PI / 6); ctx.stroke();
    }
    ctx.restore();
  }
  function applyDifference(ctx, canvas, item, side) {
    var rect = rectFor(canvas, item);
    if (item.kind === "color" && side === "right") recolorNaturalRegion(ctx, rect, item.variant);
    else if (item.kind === "shape") drawIntegratedDetail(ctx, rect, item, side);
    else if (item.kind === "presence" && side === "right") drawContextProp(ctx, rect, item);
  }

  function loadScenes() {
    var image = new Image(); image.decoding = "async";
    image.onload = function () {
      if (!game || game.finished) return;
      C.body().querySelectorAll("[data-diff144-canvas]").forEach(function (canvas) { var ctx = canvas.getContext("2d", { alpha: false }), side = canvas.dataset.diff144Canvas; ctx.filter = "brightness(1.2) contrast(1.07) saturate(1.06)"; ctx.drawImage(image, 0, 0, canvas.width, canvas.height); ctx.filter = "none"; game.items.forEach(function (item) { applyDifference(ctx, canvas, item, side); }); var scene = canvas.closest("[data-diff144-scene]"); if (scene) scene.dataset.ready = "true"; });
      game.startedAt = Date.now(); timer = setInterval(tick, 250); updateHud();
    };
    image.onerror = function () { var body = C.body(); if (!body) return; body.innerHTML = '<div class="c144Empty"><b>No se pudo cargar el escenario</b><span>Comprueba los archivos locales de escenas.</span><button type="button" class="c144Secondary" data-diff144-retry>Reintentar</button></div>'; body.querySelector("[data-diff144-retry]").onclick = startGame; };
    image.src = game.scene.src;
  }

  function pointInside(scene, event, item) {
    var rect = scene.getBoundingClientRect(); if (!rect.width || !rect.height) return false; var x = (event.clientX - rect.left) / rect.width * 100, y = (event.clientY - rect.top) / rect.height * 100, nx = (x - item.x) / (item.w / 2), ny = (y - item.y) / (item.h / 2); return nx * nx + ny * ny <= 1;
  }
  function itemAt(scene, event) {
    var rect = scene.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    var x = (event.clientX - rect.left) / rect.width * 100, y = (event.clientY - rect.top) / rect.height * 100;
    var matches = game.items.filter(function (item) { return !game.found.has(item.id) && pointInside(scene, event, item); });
    matches.sort(function (a, b) {
      var ax = (x - a.x) / (a.w / 2), ay = (y - a.y) / (a.h / 2), bx = (x - b.x) / (b.w / 2), by = (y - b.y) / (b.h / 2);
      return ax * ax + ay * ay - (bx * bx + by * by);
    });
    return matches[0] || null;
  }

  function answer(item, scene, event) {
    if (!game || game.finished || scene.dataset.ready !== "true") return;
    if (item && game.found.has(item.id)) return;
    if (item) { game.found.add(item.id); C.body().querySelectorAll('[data-diff144-id="' + selectorValue(item.id) + '"]').forEach(function (button) { button.classList.add("found"); button.innerHTML = '<span aria-hidden="true">✓</span>'; }); C.sound("good"); updateHud(); if (game.found.size >= game.items.length) finish("complete"); return; }
    game.misses++; var rect = scene.getBoundingClientRect(), marker = document.createElement("span"); marker.className = "c144DiffMiss"; marker.textContent = "×"; marker.style.left = Math.max(2, Math.min(98, (event.clientX - rect.left) / rect.width * 100)) + "%"; marker.style.top = Math.max(2, Math.min(98, (event.clientY - rect.top) / rect.height * 100)) + "%"; scene.appendChild(marker); setTimeout(function () { marker.remove(); }, 620); C.sound("bad"); updateHud();
  }

  function tick() { if (!game || game.finished) return; game.remaining = Math.max(0, game.limit - (Date.now() - game.startedAt) / 1000); updateHud(); if (game.remaining <= 0) finish("time"); }
  function score() { var accuracy = game.found.size / game.items.length, precision = game.items.length / (game.items.length + game.misses), speed = Math.max(0, game.remaining / game.limit); return Math.round(Math.max(0, Math.min(320, 230 * accuracy + 50 * accuracy * precision + (accuracy === 1 ? 40 * speed : 0)))); }
  function updateHud() { var body = C.body(); if (!body || !game) return; var found = body.querySelector("[data-diff144-found]"), time = body.querySelector("[data-diff144-time]"), misses = body.querySelector("[data-diff144-misses]"); if (found) found.textContent = game.found.size + "/" + game.items.length; if (time) time.textContent = Math.ceil(game.remaining) + " s"; if (misses) misses.textContent = game.misses; }

  async function saveScore(points) {
    var result = null, arcade = root.CocoArcadeV133;
    if (arcade && typeof arcade.saveScore === "function") result = await arcade.saveScore("diferencias", points, { found: game && game.found.size || 0, total: game && game.items.length || 0, misses: game && game.misses || 0, level: levelSelected }, userId());
    else if (userId() !== "visitante") {
      var api = C.client();
      try { result = await api.rpc("registrar_partida_coco", { p_juego: "diferencias", p_puntos: points }); if (result.error && /could not find|schema cache|PGRST202/i.test(result.error.message || result.error.code || "")) result = await api.from("partidas").insert({ jugador: userId(), juego: "diferencias", puntos: points }); result = result && result.error ? { ok: false, error: result.error.message || "No se pudo guardar." } : { ok: true }; } catch (error) { result = { ok: false, error: error && error.message || "No se pudo guardar." }; }
    }
    if (result && result.ok && root.CocoDailyV134 && typeof root.CocoDailyV134.complete === "function") await root.CocoDailyV134.complete("diferencias", userId());
    return result || { ok: userId() === "visitante", local: true };
  }

  async function finish(reason) {
    if (!game || game.finished) return; game.finished = true; clearInterval(timer); var points = score(), saved = await saveScore(points); C.sound(reason === "complete" ? "finish" : "bad"); var body = C.body(); if (!body) return;
    var saveCopy = saved && saved.test ? "Partida de prueba completada sin duplicar puntos. Solo el primer resultado válido del día puntúa." : saved && saved.ok ? "Puntuación guardada correctamente." : "No se pudo guardar la puntuación todavía.";
    C.setModalTitle("Encuentra las diferencias", "RESULTADO · CLASIFICACIÓN GENERAL"); body.innerHTML = '<main class="c144DiffResult"><section class="c144Card"><span class="c144Eyebrow">' + (reason === "complete" ? "ESCENARIO COMPLETADO" : "TIEMPO FINALIZADO") + '</span><h3>' + game.found.size + ' de ' + game.items.length + ' diferencias</h3><div class="c144RunnerMetrics"><div><b>' + points + '</b><span>' + (saved && saved.test ? 'Resultado de prueba' : 'Puntos') + '</span></div><div><b>' + game.misses + '</b><span>Clics falsos</span></div><div><b>' + Math.ceil(game.limit - game.remaining) + ' s</b><span>Tiempo</span></div></div><p class="c144Notice">' + C.esc(saveCopy) + '</p><p class="c144HealthyEnd">Buen entrenamiento visual. Descansa la vista mirando a lo lejos durante unos instantes.</p><div class="c144Actions" style="justify-content:center"><button type="button" class="c144Primary" data-diff144-close>Volver</button></div></section></main>'; body.querySelector("[data-diff144-close]").onclick = C.closeModal;
  }

  async function startGame() {
    if (!(await canPlay())) { renderIntro(); return; } var cfg = config(levelSelected), choice = todayChoice(); game = { scene: choice.scene, combinationId: choice.id, variant: choice.variant, items: materialize(choice, cfg.count), found: new Set(), misses: 0, lastTap: 0, limit: cfg.seconds, remaining: cfg.seconds, startedAt: 0, finished: false };
    var body = C.body(); if (!body) return; body.innerHTML = gameHtml(); controller = new AbortController();
    body.querySelectorAll("[data-diff144-scene]").forEach(function (sceneNode) { sceneNode.addEventListener("click", function (event) { var hotspot = event.target.closest("[data-diff144-id]"), hotspotItem = hotspot ? game.items.find(function (item) { return item.id === hotspot.dataset.diff144Id; }) : null, exactHotspotItem = hotspotItem && (event.detail === 0 || pointInside(sceneNode, event, hotspotItem)) ? hotspotItem : null; answer(exactHotspotItem || itemAt(sceneNode, event), sceneNode, event); }, { signal: controller.signal }); });
    loadScenes();
  }

  async function open() { C.openModal({ module: "differences", title: "Encuentra las diferencias", kicker: "ATENCIÓN VISUAL · v149.0", html: '<div class="c144Empty"><b>Coco está preparando el escenario…</b></div>', dispose: dispose }); user = await resolveUser(); renderIntro(); }
  function dispose() { clearInterval(timer); if (controller) controller.abort(); controller = null; if (game) game.finished = true; game = null; }

  var api = {
    version: "149.0.0", open: open, scenes: SCENES,
    config: config, rectFor: rectFor,
    materializeForAudit: function (sceneId, variant, count) {
      var scene = SCENES.find(function (item) { return item.id === sceneId; });
      if (!scene) throw new Error("Escenario no encontrado: " + sceneId);
      variant = Math.max(0, Math.min(VARIANTS.length - 1, Number(variant) || 0));
      return materialize({ scene: scene, variant: variant }, Math.max(1, Math.min(scene.differences.length, Number(count) || 6)));
    },
    applyDifferenceForAudit: applyDifference,
    audit: function () { return { sceneCount: SCENES.length, variantsPerScene: VARIANTS.length, combinationsPerLevel: SCENES.length * VARIANTS.length, levels: { basic: 4, intermediate: 5, advanced: 6 }, everySceneHasSix: SCENES.every(function (scene) { return scene.differences.length === 6; }), differenceKinds: KINDS.slice(), allowedKindsOnly: true, brokenObjects: false, deformedObjects: false, blurredRemoval: false, completeObjects: true, preAnswerMarkers: false, genericCircleMarkers: false, genericStarMarkers: false, foundFeedbackOnlyAfterCorrectTap: true, sameDefinitionForVisualAndHit: true, normalizedCoordinates: true, clickableFromBothImages: true, falseClicksAccepted: false, brightness: 1.2, unlimitedTestAccount: true, extraTestRunsRanked: false, renderer: "dual-canvas-integrated-scene-changes-v149" }; }
  };
  root.CocoDifferencesProV149 = api;
  root.CocoDifferencesProV148 = api;
  root.CocoDifferencesProV147 = api;
  root.CocoDifferencesProV146 = api;
  root.CocoDifferencesProV144 = api;
})(window);
