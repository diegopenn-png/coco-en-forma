(function (root) {
  "use strict";

  if (root.CocoV144) return;

  var VERSION = "150.0.0";
  var modal = null;
  var modalBody = null;
  var modalTitle = null;
  var modalKicker = null;
  var previousFocus = null;
  var disposer = null;
  var observer = null;
  var enhanceTimer = 0;

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
    });
  }

  function id(prefix) {
    try { return prefix + "-" + crypto.randomUUID(); }
    catch (_) { return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 9); }
  }

  function today() {
    try {
      if (root.CocoDailyV134 && typeof root.CocoDailyV134.today === "function") return root.CocoDailyV134.today();
      return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    } catch (_) { return new Date().toISOString().slice(0, 10); }
  }

  function client() {
    var config = root.COCO_CONFIG || {};
    try {
      if (root.__COCO_SUPABASE_CLIENT) return root.__COCO_SUPABASE_CLIENT;
      if (!root.supabase || !root.supabase.createClient || !config.url || !config.clave) return null;
      root.__COCO_SUPABASE_CLIENT = root.supabase.createClient(String(config.url).replace(/\/+$/, ""), String(config.clave).trim(), {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
      });
      return root.__COCO_SUPABASE_CLIENT;
    } catch (_) { return null; }
  }

  async function session() {
    var api = client();
    if (!api || !api.auth || typeof api.auth.getSession !== "function") return null;
    try {
      var result = await api.auth.getSession();
      return result && result.data && result.data.session || null;
    } catch (_) { return null; }
  }

  function toast(message, tone) {
    var node = document.createElement("div");
    node.className = "cocoV144Toast " + (tone || "info");
    node.setAttribute("role", "status");
    node.textContent = String(message || "");
    document.body.appendChild(node);
    requestAnimationFrame(function () { node.classList.add("visible"); });
    setTimeout(function () {
      node.classList.remove("visible");
      setTimeout(function () { if (node.parentNode) node.remove(); }, 260);
    }, 2700);
  }

  function audioContext() {
    var Context = root.AudioContext || root.webkitAudioContext;
    if (!Context) return null;
    return root.__cocoV144Audio || (root.__cocoV144Audio = new Context());
  }

  function unlockAudio() {
    if (localStorage.getItem("coco_sonido") === "0") return Promise.resolve(false);
    try {
      var context = audioContext();
      if (!context) return Promise.resolve(false);
      var resumed = context.state === "suspended" && context.resume ? context.resume() : Promise.resolve();
      return Promise.resolve(resumed).then(function () {
        /* Un pulso silencioso dentro del gesto desbloquea Web Audio en Safari/PWA. */
        var oscillator = context.createOscillator(), gain = context.createGain(), at = context.currentTime;
        gain.gain.setValueAtTime(.0001, at); oscillator.connect(gain); gain.connect(context.destination);
        oscillator.start(at); oscillator.stop(at + .012); return true;
      }).catch(function () { return false; });
    } catch (_) { return Promise.resolve(false); }
  }

  function sound(kind) {
    if (localStorage.getItem("coco_sonido") === "0") return false;
    try {
      var context = audioContext(); if (!context) return false;
      var patterns = {
        finish: { notes: [523, 659, 784, 1047], type: "triangle", volume: .14, step: .075, duration: .17 },
        bad: { notes: [205, 168], type: "sine", volume: .14, step: .075, duration: .17 },
        approach: { notes: [285], end: 355, type: "sine", volume: .055, step: 0, duration: .105 },
        warning: { notes: [185, 155], type: "square", volume: .05, step: .07, duration: .11 },
        move: { notes: [330], end: 390, type: "triangle", volume: .045, step: 0, duration: .075 },
        jump: { notes: [390], end: 610, type: "triangle", volume: .065, step: 0, duration: .13 },
        duck: { notes: [360], end: 235, type: "sine", volume: .055, step: 0, duration: .12 },
        start: { notes: [392, 523], type: "triangle", volume: .09, step: .08, duration: .16 },
        good: { notes: [660, 880], type: "triangle", volume: .14, step: .075, duration: .17 }
      };
      var pattern = patterns[kind] || patterns.good;
      function play() {
        pattern.notes.forEach(function (frequency, index) {
          var oscillator = context.createOscillator(), gain = context.createGain(), at = context.currentTime + index * pattern.step;
          oscillator.type = pattern.type; oscillator.frequency.setValueAtTime(frequency, at);
          if (pattern.end && oscillator.frequency.exponentialRampToValueAtTime) oscillator.frequency.exponentialRampToValueAtTime(pattern.end, at + pattern.duration);
          oscillator.connect(gain); gain.connect(context.destination);
          gain.gain.setValueAtTime(.0001, at);
          gain.gain.exponentialRampToValueAtTime(pattern.volume, at + .012);
          gain.gain.exponentialRampToValueAtTime(.0001, at + pattern.duration);
          oscillator.start(at); oscillator.stop(at + pattern.duration + .02);
        });
      }
      if (context.state === "suspended" && context.resume) context.resume().then(play).catch(function () {}); else play();
      return true;
    } catch (_) { return false; }
  }

  function soundIcon(muted) {
    return '<svg viewBox="0 0 24 24" width="23" height="23" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 8.2c1.2 1 1.8 2.3 1.8 3.8s-.6 2.8-1.8 3.8M18.8 5.5c2 1.8 3.1 3.9 3.1 6.5s-1.1 4.7-3.1 6.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' + (muted ? '<path d="M3 3l18 18" stroke="#ffd44d" stroke-width="2.4" stroke-linecap="round"/>' : '') + '</svg>';
  }

  function ensureModal() {
    if (modal) return modal;
    modal = document.createElement("section");
    modal.id = "cocoV144Modal";
    modal.className = "cocoV144Modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "cocoV144ModalTitle");
    modal.innerHTML = '<div class="cocoV144Shell" tabindex="-1">' +
      '<header class="cocoV144Header"><div><span class="cocoV144Kicker"></span><h2 id="cocoV144ModalTitle"></h2></div>' +
      '<div class="cocoV144HeaderActions"><button type="button" data-v144-sound aria-label="Activar o desactivar sonido"></button><button type="button" data-v144-close aria-label="Cerrar">×</button></div></header>' +
      '<div class="cocoV144Body"></div></div>';
    document.body.appendChild(modal);
    modalBody = modal.querySelector(".cocoV144Body");
    modalTitle = modal.querySelector("#cocoV144ModalTitle");
    modalKicker = modal.querySelector(".cocoV144Kicker");
    modal.querySelector("[data-v144-close]").onclick = closeModal;
    var soundButton = modal.querySelector("[data-v144-sound]"), initiallyMuted = localStorage.getItem("coco_sonido") === "0";
    soundButton.innerHTML = soundIcon(initiallyMuted);
    soundButton.setAttribute("aria-label", initiallyMuted ? "Activar sonido" : "Desactivar sonido");
    soundButton.onclick = function () {
      var muted = localStorage.getItem("coco_sonido") === "0";
      localStorage.setItem("coco_sonido", muted ? "1" : "0");
      this.innerHTML = soundIcon(!muted);
      this.setAttribute("aria-label", muted ? "Desactivar sonido" : "Activar sonido");
      if (muted) unlockAudio().then(function () { sound("good"); });
    };
    modal.addEventListener("click", function (event) { if (event.target === modal) closeModal(); });
    modal.addEventListener("keydown", function (event) {
      if (event.key === "Escape") { event.preventDefault(); closeModal(); return; }
      if (event.key !== "Tab") return;
      var focusable = Array.prototype.slice.call(modal.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]'));
      if (!focusable.length) return;
      var first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    return modal;
  }

  function openModal(options) {
    options = options || {};
    ensureModal();
    if (disposer) { try { disposer(); } catch (_) {} disposer = null; }
    previousFocus = document.activeElement;
    modal.dataset.module = options.module || "";
    modalTitle.textContent = options.title || "Coco en Forma";
    modalKicker.textContent = options.kicker || "COCO EN FORMA · v150.0";
    modalBody.innerHTML = options.html || "";
    disposer = typeof options.dispose === "function" ? options.dispose : null;
    modal.classList.add("visible");
    document.documentElement.classList.add("cocoV144Open");
    document.body.classList.add("cocoV144Open");
    requestAnimationFrame(function () { var shell = modal.querySelector(".cocoV144Shell"); if (shell) shell.focus({ preventScroll: true }); });
    return modalBody;
  }

  function closeModal() {
    if (!modal || !modal.classList.contains("visible")) return;
    if (disposer) { try { disposer(); } catch (_) {} disposer = null; }
    try { modal.dispatchEvent(new CustomEvent("coco:v144-close", { bubbles: false })); } catch (_) {}
    modal.classList.remove("visible");
    modalBody.innerHTML = "";
    document.documentElement.classList.remove("cocoV144Open");
    document.body.classList.remove("cocoV144Open");
    if (previousFocus && document.contains(previousFocus)) try { previousFocus.focus({ preventScroll: true }); } catch (_) {}
  }

  function setModalTitle(title, kicker) {
    if (modalTitle && title) modalTitle.textContent = title;
    if (modalKicker && kicker) modalKicker.textContent = kicker;
  }

  function runnerIcon() {
    return '<svg class="cocoV144RunnerIcon" viewBox="0 0 120 120" aria-hidden="true"><defs><linearGradient id="run144" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#1f9ed2"/><stop offset="1" stop-color="#5b4dc8"/></linearGradient></defs><rect x="4" y="4" width="112" height="112" rx="30" fill="url(#run144)"/><path d="M23 90 43 34h34l20 56" fill="none" stroke="#d9f5ff" stroke-width="9" stroke-linecap="round" opacity=".75"/><path d="M60 18v82M35 101l10-25M85 101 75 76" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".95"/><path d="m60 30 7 14 16 2-12 11 3 16-14-8-14 8 3-16-12-11 16-2Z" fill="#ffd64a" stroke="#17394b" stroke-width="3"/></svg>';
  }

  function personalRunnerHistory() {
    try { return JSON.parse(localStorage.getItem("coco_runner_history_v144") || "[]"); }
    catch (_) { return []; }
  }

  function runnerCompletedToday() {
    var userId = root.CocoDailyV134 && root.CocoDailyV134.userId ? root.CocoDailyV134.userId() : "visitante";
    return Boolean(root.CocoDailyV134 && root.CocoDailyV134.localUsed && root.CocoDailyV134.localUsed("cococorre", userId || "visitante", today()));
  }

  function unlimitedTesting() {
    var userId = root.CocoDailyV134 && root.CocoDailyV134.userId ? root.CocoDailyV134.userId() : "";
    return Boolean(root.CocoDailyV134 && typeof root.CocoDailyV134.isUnlimited === "function" && root.CocoDailyV134.isUnlimited(userId));
  }

  function transformRunnerCard(card) {
    if (!card || card.dataset.cocoV144Game === "cococorre") return;
    card.dataset.cocoV144Game = "cococorre";
    card.dataset.cocoJuego = "cococorre";
    card.dataset.cocoClasificacion = "general";
    card.classList.add("cocoV144RunnerCard");
    card.classList.remove("cocoDailyComplete", "cocoConstruccion");
    ["cocoV132Bound", "cocoV132Ready", "cocoV132Loading", "cocoDailyState"].forEach(function (key) { delete card.dataset[key]; });
    var visual = card.querySelector(".emoji,.cocoIconoEspecial"); if (visual) visual.innerHTML = runnerIcon();
    var title = card.querySelector("h3"); if (title) title.textContent = "Coco Corre";
    var description = card.querySelector(".cocoDescripcion,p.pequeno.apagado"); if (description) { description.classList.add("cocoDescripcion"); description.textContent = "Misión breve por tres carriles para entrenar atención, memoria y control mental."; }
    var state = card.querySelector(".cocoEstadoObra,.cocoArcadeCardScore");
    if (state) {
      state.className = "cocoArcadeCardScore";
      state.innerHTML = '<b>—</b>&nbsp;cargando puntos';
      if (root.CocoArcadeV133 && typeof root.CocoArcadeV133.loadStats === "function") root.CocoArcadeV133.loadStats("cococorre").then(function (stats) {
        if (!state.isConnected) return;
        state.innerHTML = '<b>' + Math.round(Number(stats && stats.total) || 0).toLocaleString("es-ES") + '</b>&nbsp;puntos en este reto';
      }).catch(function () {});
    }
    var badge = card.querySelector(".cocoLigaBadge");
    if (badge) { var freshBadge = badge.cloneNode(false); freshBadge.className = "cocoLigaBadge"; freshBadge.innerHTML = '<span aria-hidden="true">🏆</span><b>Clasificación general</b>'; freshBadge.setAttribute("aria-label", "Ver clasificación general"); badge.replaceWith(freshBadge); }
    var share = card.querySelector(".cocoCardShare"); if (share) share.remove();
    var button = card.querySelector(".cocoBotonJuego,.btn");
    if (button) {
      var fresh = button.cloneNode(false), completed = runnerCompletedToday();
      fresh.type = "button"; fresh.className = button.className; fresh.dataset.cocoV144Open = "runner";
      fresh.disabled = completed; fresh.setAttribute("aria-disabled", completed ? "true" : "false");
      fresh.textContent = completed ? "Completado hoy" : unlimitedTesting() ? "Probar otra vez" : "Comenzar misión";
      button.replaceWith(fresh);
    }
  }

  function transformRunnerMini(item) {
    if (!item || item.dataset.cocoV144Game === "cococorre") return;
    var fresh = item.cloneNode(true);
    fresh.dataset.cocoV144Game = "cococorre";
    fresh.dataset.cocoV144Open = "runner";
    fresh.dataset.cocoJuego = "cococorre";
    var title = fresh.querySelector("b"); if (title) title.textContent = "Coco Corre";
    var icon = fresh.querySelector(".cocoMiniIcono"); if (icon) icon.innerHTML = runnerIcon();
    var state = fresh.querySelector(".cocoMiniEstado"); if (state) state.textContent = runnerCompletedToday() ? "Completado hoy" : unlimitedTesting() ? "Pruebas ilimitadas" : "Una vez al día";
    item.replaceWith(fresh);
  }

  function titleOf(node) {
    var title = node && node.querySelector && node.querySelector("h3,b");
    return title ? String(title.textContent || "").trim() : "";
  }

  function removeEnglishExposure() {
    var arcade = root.CocoArcadeV133;
    if (arcade) {
      if (arcade.games) delete arcade.games.ingles;
      [arcade.classification && arcade.classification.generalIds, arcade.classification && arcade.classification.specificIds].forEach(function (list) {
        if (!Array.isArray(list)) return;
        for (var index = list.length - 1; index >= 0; index--) if (list[index] === "ingles") list.splice(index, 1);
      });
      var general = arcade.classification && arcade.classification.generalIds;
      if (Array.isArray(general) && general.indexOf("cococorre") < 0) general.push("cococorre");
      if (!arcade.__v144OpenWrapped && typeof arcade.open === "function") {
        var originalOpen = arcade.open;
        arcade.open = function (gameId) { if (gameId === "ingles" || gameId === "cococorre") { var runner = root.CocoRunnerV149 || root.CocoRunnerV148 || root.CocoRunnerV147 || root.CocoRunnerV146 || root.CocoRunnerV144; return runner && runner.open(); } return originalOpen.apply(this, arguments); };
        arcade.__v144OpenWrapped = true;
      }
    }
  }

  function enhanceCatalog() {
    removeEnglishExposure();
    var app = document.getElementById("cocoApp"); if (!app) return;
    Array.prototype.slice.call(app.querySelectorAll(".cocoGameCard")).forEach(function (card) {
      var dataId = String(card.dataset.cocoJuego || "").toLowerCase(), title = titleOf(card);
      if (dataId === "ingles" || dataId === "cococorre" || /^(coco\s*)?ingl[eé]s$/i.test(title) || /^coco\s+corre$/i.test(title)) transformRunnerCard(card);
    });
    Array.prototype.slice.call(app.querySelectorAll(".cocoMiniJuego")).forEach(function (item) {
      var dataId = String(item.dataset.cocoJuego || "").toLowerCase(), title = titleOf(item);
      if (dataId === "ingles" || dataId === "cococorre" || /^(coco\s*)?ingl[eé]s$/i.test(title) || /^coco\s+corre$/i.test(title)) transformRunnerMini(item);
    });
    app.querySelectorAll('[data-coco-juego="ingles"],[href*="ingles" i],[data-game="ingles"]').forEach(function (node) {
      if (node.closest && (node.closest(".cocoGameCard") || node.closest(".cocoMiniJuego"))) return;
      node.remove();
    });
    var note = app.querySelector(".cocoRetosNota");
    if (note) { var noteCopy = unlimitedTesting() ? "Modo de pruebas activo: partidas ilimitadas en todos los juegos. Solo el primer resultado válido de cada juego y día puntúa. Coco Pádel continúa siendo ilimitado." : "Una partida breve por juego y día. Coco Corre suma una puntuación diaria a la clasificación general. Coco Pádel es ilimitado."; if (note.textContent !== noteCopy) note.textContent = noteCopy; }
  }

  function scheduleEnhance() {
    clearTimeout(enhanceTimer);
    enhanceTimer = setTimeout(enhanceCatalog, 45);
  }

  function identifiedFeature(target) {
    var card = target && target.closest ? target.closest(".cocoGameCard,.cocoMiniJuego") : null;
    if (!card) return "";
    if (card.dataset.cocoV144Game === "cococorre") return "runner";
    var raw = String(card.dataset.cocoJuego || "").toLowerCase(), title = titleOf(card);
    if (raw === "padel" || /^coco\s+p[aá]del/i.test(title) || title === "Pádel") return "padel";
    if (raw === "diferencias" || /encuentra las diferencias/i.test(title)) return "differences";
    return "";
  }

  document.addEventListener("click", function (event) {
    var action = event.target && event.target.closest && event.target.closest("[data-coco-v144-open]");
    var feature = action ? action.dataset.cocoV144Open : identifiedFeature(event.target);
    if (!feature) return;
    var actionable = action || event.target.closest("button,.cocoMiniJuego,.cocoLigaBadge");
    if (!actionable) return;
    if (feature === "runner" && actionable.classList && actionable.classList.contains("cocoLigaBadge")) return;
    event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
    if (feature === "runner" && (root.CocoRunnerV149 || root.CocoRunnerV148 || root.CocoRunnerV147 || root.CocoRunnerV146 || root.CocoRunnerV144)) (root.CocoRunnerV149 || root.CocoRunnerV148 || root.CocoRunnerV147 || root.CocoRunnerV146 || root.CocoRunnerV144).open();
    else if (feature === "padel" && (root.CocoPadelV149 || root.CocoPadelV148 || root.CocoPadelV147 || root.CocoPadelV146 || root.CocoPadelV144)) (root.CocoPadelV149 || root.CocoPadelV148 || root.CocoPadelV147 || root.CocoPadelV146 || root.CocoPadelV144).open();
    else if (feature === "differences" && (root.CocoDifferencesProV149 || root.CocoDifferencesProV148 || root.CocoDifferencesProV147 || root.CocoDifferencesProV146 || root.CocoDifferencesProV144)) (root.CocoDifferencesProV149 || root.CocoDifferencesProV148 || root.CocoDifferencesProV147 || root.CocoDifferencesProV146 || root.CocoDifferencesProV144).open();
  }, true);

  root.CocoV144 = {
    version: VERSION,
    esc: esc,
    id: id,
    today: today,
    client: client,
    session: session,
    toast: toast,
    sound: sound,
    unlockAudio: unlockAudio,
    openModal: openModal,
    closeModal: closeModal,
    setModalTitle: setModalTitle,
    body: function () { return modalBody; },
    enhanceCatalog: enhanceCatalog,
    runnerCompletedToday: runnerCompletedToday,
    audit: function () {
      var arcade = root.CocoArcadeV133 || {}, specific = arcade.classification && arcade.classification.specificIds || [];
      return {
        version: VERSION,
        englishVisible: Boolean(document.querySelector('[data-coco-juego="ingles"]')),
        englishInSpecificRanking: specific.indexOf("ingles") >= 0,
        runnerInGeneralRanking: Boolean(arcade.classification && arcade.classification.generalIds && arcade.classification.generalIds.indexOf("cococorre") >= 0),
        runnerInSpecificRanking: specific.indexOf("cococorre") >= 0,
        padelUnlimited: true,
        publicDeploymentPerformed: false
      };
    }
  };

  root.CocoV148 = root.CocoV144;
  root.CocoV147 = root.CocoV144;
  root.CocoV146 = root.CocoV144;
  root.COCO_VERSION = "2026-08-16-v150.0-nueva-linea-desde-v149";
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", enhanceCatalog);
  else enhanceCatalog();
  observer = new MutationObserver(scheduleEnhance);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  root.addEventListener("coco:daily-completed", scheduleEnhance);
  root.addEventListener("coco:daily-user", scheduleEnhance);
  root.addEventListener("coco:daily-sync", scheduleEnhance);
  setTimeout(function () {
    try {
      var activeModal = document.querySelector(".cocoV144Modal.visible");
      if (new URLSearchParams(location.search).get("juego") === "cococorre" && (root.CocoRunnerV149 || root.CocoRunnerV148 || root.CocoRunnerV147 || root.CocoRunnerV146 || root.CocoRunnerV144) && (!activeModal || activeModal.dataset.module !== "runner")) (root.CocoRunnerV149 || root.CocoRunnerV148 || root.CocoRunnerV147 || root.CocoRunnerV146 || root.CocoRunnerV144).open();
    } catch (_) {}
  }, 260);
})(window);
