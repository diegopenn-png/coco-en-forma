(function (root) {
  "use strict";

  if (root.CocoV144) return;

  var VERSION = "144.0.0";
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

  function sound(kind) {
    if (localStorage.getItem("coco_sonido") === "0") return;
    try {
      var context = root.__cocoV144Audio || (root.__cocoV144Audio = new (root.AudioContext || root.webkitAudioContext)());
      var notes = kind === "finish" ? [523, 659, 784, 1047] : kind === "bad" ? [205, 168] : [660, 880];
      notes.forEach(function (frequency, index) {
        var oscillator = context.createOscillator(), gain = context.createGain(), at = context.currentTime + index * .075;
        oscillator.type = kind === "bad" ? "sine" : "triangle";
        oscillator.frequency.value = frequency;
        oscillator.connect(gain); gain.connect(context.destination);
        gain.gain.setValueAtTime(.0001, at);
        gain.gain.exponentialRampToValueAtTime(.14, at + .018);
        gain.gain.exponentialRampToValueAtTime(.0001, at + .15);
        oscillator.start(at); oscillator.stop(at + .17);
      });
    } catch (_) {}
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
      '<div class="cocoV144HeaderActions"><button type="button" data-v144-sound aria-label="Activar o desactivar sonido">🔊</button><button type="button" data-v144-close aria-label="Cerrar">×</button></div></header>' +
      '<div class="cocoV144Body"></div></div>';
    document.body.appendChild(modal);
    modalBody = modal.querySelector(".cocoV144Body");
    modalTitle = modal.querySelector("#cocoV144ModalTitle");
    modalKicker = modal.querySelector(".cocoV144Kicker");
    modal.querySelector("[data-v144-close]").onclick = closeModal;
    modal.querySelector("[data-v144-sound]").onclick = function () {
      var muted = localStorage.getItem("coco_sonido") === "0";
      localStorage.setItem("coco_sonido", muted ? "1" : "0");
      this.textContent = muted ? "🔊" : "🔇";
      this.setAttribute("aria-label", muted ? "Desactivar sonido" : "Activar sonido");
      if (muted) sound("good");
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
    modalKicker.textContent = options.kicker || "COCO EN FORMA · v144.0";
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

  function transformRunnerCard(card) {
    if (!card || card.dataset.cocoV144Game === "cococorre") return;
    card.dataset.cocoV144Game = "cococorre";
    card.removeAttribute("data-coco-juego");
    card.classList.add("cocoV144RunnerCard");
    card.classList.remove("cocoDailyComplete", "cocoConstruccion");
    ["cocoV132Bound", "cocoV132Ready", "cocoV132Loading", "cocoDailyState"].forEach(function (key) { delete card.dataset[key]; });
    var visual = card.querySelector(".emoji,.cocoIconoEspecial"); if (visual) visual.innerHTML = runnerIcon();
    var title = card.querySelector("h3"); if (title) title.textContent = "Coco Corre";
    var description = card.querySelector(".cocoDescripcion,p.pequeno.apagado"); if (description) { description.classList.add("cocoDescripcion"); description.textContent = "Misión breve por tres carriles para entrenar atención, memoria y control mental."; }
    var state = card.querySelector(".cocoEstadoObra,.cocoArcadeCardScore");
    if (state) { state.className = "cocoArcadeCardScore cocoV144PersonalScore"; var history = personalRunnerHistory(); state.innerHTML = '<b>' + history.length + '</b>&nbsp;misiones personales'; }
    var badge = card.querySelector(".cocoLigaBadge");
    if (badge) { var freshBadge = badge.cloneNode(false); freshBadge.className = "cocoLigaBadge cocoV144PersonalBadge"; freshBadge.innerHTML = '<span aria-hidden="true">🧠</span><b>Evolución personal · no suma al ranking</b>'; badge.replaceWith(freshBadge); }
    var share = card.querySelector(".cocoCardShare"); if (share) share.remove();
    var button = card.querySelector(".cocoBotonJuego,.btn");
    if (button) {
      var fresh = button.cloneNode(false), completed = runnerCompletedToday();
      fresh.type = "button"; fresh.className = button.className; fresh.dataset.cocoV144Open = "runner";
      fresh.disabled = completed; fresh.setAttribute("aria-disabled", completed ? "true" : "false");
      fresh.textContent = completed ? "Completado hoy" : "Comenzar misión";
      button.replaceWith(fresh);
    }
  }

  function transformRunnerMini(item) {
    if (!item || item.dataset.cocoV144Game === "cococorre") return;
    var fresh = item.cloneNode(true);
    fresh.dataset.cocoV144Game = "cococorre";
    fresh.dataset.cocoV144Open = "runner";
    fresh.removeAttribute("data-coco-juego");
    var title = fresh.querySelector("b"); if (title) title.textContent = "Coco Corre";
    var icon = fresh.querySelector(".cocoMiniIcono"); if (icon) icon.innerHTML = runnerIcon();
    var state = fresh.querySelector(".cocoMiniEstado"); if (state) state.textContent = runnerCompletedToday() ? "Completado hoy" : "Una vez al día";
    item.replaceWith(fresh);
  }

  function titleOf(node) {
    var title = node && node.querySelector && node.querySelector("h3,b");
    return title ? String(title.textContent || "").trim() : "";
  }

  function removeEnglishExposure() {
    var arcade = root.CocoArcadeV133;
    if (arcade) {
      if (arcade.games) { delete arcade.games.ingles; delete arcade.games.cococorre; }
      [arcade.classification && arcade.classification.generalIds, arcade.classification && arcade.classification.specificIds].forEach(function (list) {
        if (!Array.isArray(list)) return;
        for (var index = list.length - 1; index >= 0; index--) if (list[index] === "ingles" || list[index] === "cococorre") list.splice(index, 1);
      });
      if (!arcade.__v144OpenWrapped && typeof arcade.open === "function") {
        var originalOpen = arcade.open;
        arcade.open = function (gameId) { if (gameId === "ingles" || gameId === "cococorre") return root.CocoRunnerV144 && root.CocoRunnerV144.open(); return originalOpen.apply(this, arguments); };
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
    if (note) note.textContent = "Una partida breve por juego y día. Coco Corre muestra evolución personal y no suma al ranking. Coco Pádel es ilimitado.";
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
    event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
    if (feature === "runner" && root.CocoRunnerV144) root.CocoRunnerV144.open();
    else if (feature === "padel" && root.CocoPadelV144) root.CocoPadelV144.open();
    else if (feature === "differences" && root.CocoDifferencesProV144) root.CocoDifferencesProV144.open();
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

  root.COCO_VERSION = "2026-08-15-v144.0-professional";
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", enhanceCatalog);
  else enhanceCatalog();
  observer = new MutationObserver(scheduleEnhance);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  root.addEventListener("coco:daily-completed", scheduleEnhance);
  setTimeout(function () {
    try { if (new URLSearchParams(location.search).get("juego") === "cococorre" && root.CocoRunnerV144) root.CocoRunnerV144.open(); } catch (_) {}
  }, 260);
})(window);
