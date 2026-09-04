(function () {
  "use strict";
  if (window.CocoResponseV141) return;

  var VERSION = "141.0.0";
  var feedbackTimer = 0;
  var confettiTimer = 0;
  var audioContext = null;
  var lastSoundAt = 0;
  var lastConfettiAt = 0;
  var lastFeedback = { key: "", at: 0 };
  var activeGameId = "";
  var legacyEffects = window.CocoEffectsV134 || null;
  var completionPromises = Object.create(null);
  var celebratedCompletions = Object.create(null);
  var auditState = {
    correct: 0,
    incorrect: 0,
    confettiRuns: 0,
    confettiCancels: 0,
    confettiDurationMs: 0,
    confettiReasons: [],
    sounds: { correct: 0, incorrect: 0 },
    completions: Object.create(null)
  };

  function appRoot() {
    return document.getElementById("cocoApp") || document.body;
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function safeGameId(value) {
    return text(value).toLowerCase().replace(/[^a-z0-9_-]/g, "");
  }

  function ensureFeedback() {
    var root = appRoot();
    var box = root.querySelector(".cocoUnifiedFeedback");
    if (box) return box;
    box = document.createElement("div");
    box.className = "cocoUnifiedFeedback";
    box.setAttribute("role", "status");
    box.setAttribute("aria-live", "polite");
    box.setAttribute("aria-atomic", "true");
    box.innerHTML = '<div class="cocoUnifiedFeedbackHead"><span class="cocoUnifiedFeedbackIcon" aria-hidden="true"></span><strong class="cocoUnifiedFeedbackTitle"></strong></div><p class="cocoUnifiedFeedbackAnswer"></p>';
    root.appendChild(box);
    return box;
  }

  function legacySoundWasJustPlayed() {
    var latest = Math.max(
      Number(window.__cocoBaseSoundAt || 0),
      Number(window.__cocoArcadeLastSoundAt || 0),
      Number(window.__cocoMedSoundAt || 0)
    );
    return Date.now() - latest < 260;
  }

  function sound(kind) {
    var incorrect = kind === "incorrect" || kind === "bad" || kind === "mal";
    if (localStorage.getItem("coco_sonido") === "0") return false;
    var now = Date.now();
    if (now - lastSoundAt < 180 || legacySoundWasJustPlayed()) return false;
    lastSoundAt = now;
    try {
      var Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) return false;
      audioContext = audioContext || new Context();
      if (audioContext.state === "suspended") audioContext.resume();
      /* Mismas dos notas que usa Descifra la palabra en la base v134.3. */
      var notes = incorrect ? [220, 180] : [660, 880];
      notes.forEach(function (frequency, index) {
        var at = audioContext.currentTime + index * .09;
        var oscillator = audioContext.createOscillator();
        var gain = audioContext.createGain();
        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(frequency, at);
        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        gain.gain.setValueAtTime(.0001, at);
        gain.gain.exponentialRampToValueAtTime(.13, at + .02);
        gain.gain.exponentialRampToValueAtTime(.0001, at + .18);
        oscillator.start(at);
        oscillator.stop(at + .2);
      });
      auditState.sounds[incorrect ? "incorrect" : "correct"]++;
      return true;
    } catch {
      return false;
    }
  }

  function cancelLegacyEffects() {
    try {
      if (legacyEffects && typeof legacyEffects.cancelAll === "function") legacyEffects.cancelAll();
    } catch {}
    document.querySelectorAll(".confetiCoco,.confetiPremium,.cocoConfetiV81,.cocoArcadeConfetti,.cocoMedConfeti,.cocoMedConfetti").forEach(function (node) {
      node.remove();
    });
  }

  function cancelConfetti() {
    clearTimeout(confettiTimer);
    confettiTimer = 0;
    var found = document.querySelectorAll(".cocoUnifiedConfetti");
    if (found.length) auditState.confettiCancels++;
    found.forEach(function (node) { node.remove(); });
  }

  function completionConfetti(completionKey) {
    if (!completionKey || celebratedCompletions[completionKey]) return false;
    var now = Date.now();
    if (now - lastConfettiAt < 220) return false;
    lastConfettiAt = now;
    celebratedCompletions[completionKey] = true;
    cancelLegacyEffects();
    cancelConfetti();
    auditState.confettiRuns++;
    auditState.confettiDurationMs = 1600;
    auditState.confettiReasons.push({ key: completionKey, at: now, reason: "valid-game-completion" });
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
    var root = appRoot();
    var layer = document.createElement("div");
    var colors = ["#ef6c05", "#2fa9dc", "#2fbe85", "#ffc93c", "#765bd5", "#e8515c"];
    layer.className = "cocoUnifiedConfetti";
    layer.setAttribute("aria-hidden", "true");
    for (var index = 0; index < 36; index++) {
      var bit = document.createElement("i");
      bit.style.left = (Math.random() * 100) + "%";
      bit.style.background = colors[index % colors.length];
      bit.style.animationDelay = (Math.random() * 180) + "ms";
      bit.style.setProperty("--coco-drift", ((Math.random() - .5) * 220) + "px");
      bit.style.setProperty("--coco-spin", (480 + Math.random() * 680) + "deg");
      layer.appendChild(bit);
    }
    root.appendChild(layer);
    confettiTimer = setTimeout(cancelConfetti, 1600);
    return true;
  }

  function inferAnswer() {
    var marked = document.querySelector("#cocoApp .opSerie.bienSerie,#cocoApp [data-option].correct,#cocoApp [data-time-option].correct");
    if (marked) return text(marked.textContent);
    var message = document.querySelector("#cocoApp .ctMsg,#cocoApp .sudMsg,#cocoApp .sopaMsg");
    var value = text(message && message.textContent);
    var match = value.match(/(?:era|correct[oa](?: es)?|faltaba)\s*[:：]?\s*(.+)$/i);
    return match ? text(match[1]) : "";
  }

  function show(kind, options) {
    options = options || {};
    kind = kind === "bien" || kind === "good" || kind === "correct" ? "correct" : "incorrect";
    var custom = text(options.message || "");
    var answer = text(options.answer || options.correctAnswer || "");
    if (kind === "incorrect" && !answer && !custom && !options.suppressAnswer) answer = inferAnswer();
    var key = kind + "|" + answer + "|" + custom;
    var now = Date.now();
    if (lastFeedback.key === key && now - lastFeedback.at < 260) return false;
    lastFeedback = { key: key, at: now };

    var box = ensureFeedback();
    var title = kind === "correct" ? "¡Respuesta correcta!" : "Respuesta incorrecta";
    var detail = kind === "incorrect"
      ? (answer ? "La respuesta correcta era: " + answer : (custom || "Revisa la solución marcada en el juego."))
      : custom;
    box.className = "cocoUnifiedFeedback " + kind;
    box.dataset.cocoFeedbackKind = kind;
    box.dataset.cocoFeedbackAnswer = answer;
    box.querySelector(".cocoUnifiedFeedbackIcon").textContent = kind === "correct" ? "✓" : "×";
    box.querySelector(".cocoUnifiedFeedbackTitle").textContent = title;
    var detailNode = box.querySelector(".cocoUnifiedFeedbackAnswer");
    detailNode.textContent = detail;
    detailNode.hidden = !detail;
    clearTimeout(feedbackTimer);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { box.classList.add("visible"); });
    });
    auditState[kind]++;
    sound(kind);
    cancelLegacyEffects();
    if (kind === "incorrect") {
      cancelConfetti();
    }
    feedbackTimer = setTimeout(function () { box.classList.remove("visible"); }, kind === "correct" ? 1450 : 2450);
    return true;
  }

  function markCardComplete(gameId) {
    gameId = safeGameId(gameId);
    if (!gameId || gameId === "padel") return;
    document.querySelectorAll('#cocoApp [data-coco-juego="' + gameId + '"]').forEach(function (card) {
      card.classList.add("cocoDailyComplete");
      card.dataset.cocoDailyState = "done";
      var button = card.querySelector(".cocoBotonJuego,.btn");
      if (!button) return;
      button.disabled = true;
      button.setAttribute("aria-disabled", "true");
      button.textContent = "Completado hoy";
    });
  }

  function clearCardComplete(gameId) {
    gameId=safeGameId(gameId);if(!gameId||gameId==="padel")return;
    document.querySelectorAll('#cocoApp [data-coco-juego="'+gameId+'"]').forEach(function(card){
      card.classList.remove("cocoDailyComplete");card.dataset.cocoDailyState="available";
      var button=card.querySelector(".cocoBotonJuego,.btn");if(!button)return;
      button.disabled=false;button.setAttribute("aria-disabled","false");button.textContent="Jugar";
    });
  }

  function restoreCompletedCards() {
    if (!window.CocoDailyV134 || typeof window.CocoDailyV134.localUsed !== "function") return;
    var userId = typeof window.CocoDailyV134.userId === "function" ? window.CocoDailyV134.userId() : null;
    document.querySelectorAll("#cocoApp [data-coco-juego]").forEach(function (card) {
      var gameId=safeGameId(card.dataset.cocoJuego);if(!gameId||gameId==="padel")return;
      if(userId&&window.CocoDailyV134.localUsed(gameId,userId))markCardComplete(gameId);else clearCardComplete(gameId);
    });
  }

  function complete(gameId, userId) {
    gameId = safeGameId(gameId);
    if (!gameId || gameId === "padel") return Promise.resolve({ ok: true, tool: true });
    var daily = window.CocoDailyV134;
    var resolvedUser = userId || (daily && typeof daily.userId === "function" ? daily.userId() : "");
    if (!resolvedUser) return Promise.resolve({ ok: false, error: "missing-authenticated-user" });
    var day = daily && typeof daily.today === "function" ? daily.today() : new Date().toISOString().slice(0, 10);
    var completionKey = String(resolvedUser) + "|" + gameId + "|" + day;
    if (completionPromises[completionKey]) return completionPromises[completionKey];
    auditState.completions[gameId] = (auditState.completions[gameId] || 0) + 1;
    completionPromises[completionKey] = Promise.resolve(
      daily && typeof daily.complete === "function"
        ? daily.complete(gameId, userId)
        : { ok: true, local: true }
    ).then(function (result) {
      result = result || { ok: false };
      if (result.ok) {
        markCardComplete(gameId);
        if (!result.already) completionConfetti(completionKey);
      }
      return result;
    }).catch(function (error) {
      return { ok: false, error: text(error && error.message || error || "daily-completion-failed") };
    }).finally(function () {
      delete completionPromises[completionKey];
    });
    return completionPromises[completionKey];
  }

  function memoryCards(root) {
    var list = [];
    if (root && root.nodeType === 1 && root.matches && root.matches(".memoriaCarta")) list.push(root);
    if (root && root.querySelectorAll) list = list.concat(Array.prototype.slice.call(root.querySelectorAll(".memoriaCarta")));
    return list;
  }

  function forceMemoryState(card) {
    if (!card) return;
    var open = card.classList.contains("volteada") || card.classList.contains("encontrada");
    var back = card.querySelector(".memoriaDorso");
    var front = card.querySelector(".memoriaFrente");
    var svg = front && front.querySelector(".cocoMemorySvg");
    card.style.setProperty("-webkit-transform", "none", "important");
    card.style.setProperty("transform", "none", "important");
    card.style.setProperty("transform-style", "flat", "important");
    if (back) {
      back.style.setProperty("display", open ? "none" : "grid", "important");
      back.style.setProperty("visibility", open ? "hidden" : "visible", "important");
      back.style.setProperty("opacity", open ? "0" : "1", "important");
      back.setAttribute("aria-hidden", open ? "true" : "false");
    }
    if (front) {
      front.style.setProperty("display", open ? "grid" : "none", "important");
      front.style.setProperty("visibility", open ? "visible" : "hidden", "important");
      front.style.setProperty("opacity", open ? "1" : "0", "important");
      front.setAttribute("aria-hidden", open ? "false" : "true");
    }
    if (svg) {
      svg.style.setProperty("display", "block", "important");
      svg.style.setProperty("width", "100%", "important");
      svg.style.setProperty("height", "100%", "important");
      svg.style.setProperty("opacity", "1", "important");
      svg.style.setProperty("visibility", "visible", "important");
    }
  }

  function verifyMemoryCard(card) {
    forceMemoryState(card);
    requestAnimationFrame(function () {
      forceMemoryState(card);
      var open = card.classList.contains("volteada") || card.classList.contains("encontrada");
      var svg = card.querySelector(".memoriaFrente .cocoMemorySvg");
      var rect = svg && svg.getBoundingClientRect ? svg.getBoundingClientRect() : { width: 0, height: 0 };
      var style = svg ? getComputedStyle(svg) : null;
      var visible = Boolean(open && svg && rect.width > 8 && rect.height > 8 && style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) > 0);
      card.dataset.cocoMemoryVisible = visible ? "yes" : open ? "no" : "closed";
    });
  }

  function prepareMemory(root) {
    memoryCards(root || document).forEach(function (card) {
      card.dataset.cocoMemoryV135 = VERSION;
      forceMemoryState(card);
    });
  }

  function memoryAudit() {
    var cards = Array.prototype.slice.call(document.querySelectorAll("#cocoApp .memoriaCarta"));
    var opened = cards.filter(function (card) { return card.classList.contains("volteada") || card.classList.contains("encontrada"); });
    var visible = opened.filter(function (card) {
      var front = card.querySelector(".memoriaFrente");
      var back = card.querySelector(".memoriaDorso");
      var svg = front && front.querySelector(".cocoMemorySvg");
      var rect = svg && svg.getBoundingClientRect ? svg.getBoundingClientRect() : { width: 0, height: 0 };
      var frontStyle = front ? getComputedStyle(front) : null;
      var backStyle = back ? getComputedStyle(back) : null;
      var svgStyle = svg ? getComputedStyle(svg) : null;
      return Boolean(svg && rect.width > 8 && rect.height > 8 && frontStyle.display !== "none" && frontStyle.visibility !== "hidden" && svgStyle.display !== "none" && svgStyle.visibility !== "hidden" && Number(svgStyle.opacity) > 0 && (!backStyle || backStyle.display === "none" || backStyle.visibility === "hidden"));
    });
    return {
      cards: cards.length,
      svgs: cards.filter(function (card) { return Boolean(card.querySelector(".memoriaFrente .cocoMemorySvg")); }).length,
      opened: opened.length,
      visible: visible.length,
      ok: cards.length > 0 && opened.length > 0 && opened.length === visible.length
    };
  }

  function buttonNodes(root) {
    var list = [];
    if (root && root.nodeType === 1 && root.matches && root.matches("button")) list.push(root);
    if (root && root.querySelectorAll) list = list.concat(Array.prototype.slice.call(root.querySelectorAll("button")));
    return list;
  }

  function enforceExclusiveExpandButton(root) {
    buttonNodes(root || document).forEach(function (button) {
      var label = text(button.textContent).toLowerCase();
      if (label !== "explícamelo mejor" && label !== "explicamelo mejor" && label !== "ampliar respuesta") return;
      if (button.closest("#cocoMedContenido,.cocoMedModal")) {
        button.textContent = "Ampliar respuesta";
        button.setAttribute("aria-label", "Ampliar esta respuesta con la inteligencia artificial de Coco Med");
      } else button.remove();
    });
  }

  function installNumbersDecision() {
    window.CocoV132NumbersDecision = function (info, continueGame) {
      show("correct", { message: "Secuencia completada." });
      var app = document.getElementById("cocoApp");
      var host = app && (app.querySelector(".caja") || app.querySelector(".juego-contenedor") || app);
      if (!host) {
        setTimeout(function () { if (typeof continueGame === "function") continueGame(); }, 850);
        return;
      }
      var previous = host.querySelector(".cocoNumbersDecision");
      if (previous) previous.remove();
      var panel = document.createElement("section");
      panel.className = "cocoNumbersDecision";
      panel.setAttribute("aria-live", "polite");
      panel.innerHTML = '<div><span>SECUENCIA COMPLETADA</span><h3>¡Camino correcto!</h3><p>Has conectado los números en orden sin repetir casillas.</p></div><div><button type="button" class="cocoArcadePrimary" data-numbers-continue>Continuar</button></div>';
      host.appendChild(panel);
      panel.querySelector("[data-numbers-continue]").onclick = function () {
        panel.remove();
        if (typeof continueGame === "function") continueGame();
      };
      panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    };
  }

  function cancelAll() {
    clearTimeout(feedbackTimer);
    feedbackTimer = 0;
    cancelConfetti();
    var box = document.querySelector("#cocoApp .cocoUnifiedFeedback");
    if (box) box.classList.remove("visible");
    cancelLegacyEffects();
  }

  function bindGlobals() {
    window.cocoFeedbackGlobal = function (kind, options) { return show(kind, options); };
    installNumbersDecision();
    prepareMemory(document);
    enforceExclusiveExpandButton(document);
    restoreCompletedCards();
  }

  window.CocoResponseV141 = Object.freeze({
    show: show,
    sound: sound,
    confetti: function () { return false; },
    complete: complete,
    markCardComplete: markCardComplete,
    restoreCompletedCards: restoreCompletedCards,
    cancelAll: cancelAll,
    memoryAudit: memoryAudit,
    version: VERSION
  });
  window.CocoResponseV135 = window.CocoResponseV141;

  window.CocoEffectsV134 = Object.freeze({ cancelAll: cancelAll });
  document.addEventListener("click", function (event) {
    var card = event.target && event.target.closest ? event.target.closest("#cocoApp [data-coco-juego]") : null;
    if (card) activeGameId = safeGameId(card.dataset.cocoJuego);
    var memoryCard = event.target && event.target.closest ? event.target.closest("#cocoApp .memoriaCarta") : null;
    if (memoryCard) verifyMemoryCard(memoryCard);
  });
  window.addEventListener("pagehide", cancelAll);
  window.addEventListener("coco:daily-completed", function (event) {
    var detail=event&&event.detail||{},current=window.CocoDailyV134&&typeof window.CocoDailyV134.userId==="function"?window.CocoDailyV134.userId():null;
    if(detail.userId&&current&&String(detail.userId)!==String(current))return;
    markCardComplete(detail.gameId);
  });
  window.addEventListener("coco:daily-sync", restoreCompletedCards);
  window.addEventListener("coco:daily-user", restoreCompletedCards);

  var restoreTimer = 0;
  var observer = new MutationObserver(function (records) {
    var catalogChanged = false;
    records.forEach(function (record) {
      if (record.type === "attributes" && record.target && record.target.matches && record.target.matches(".memoriaCarta")) {
        verifyMemoryCard(record.target);
        return;
      }
      Array.prototype.forEach.call(record.addedNodes || [], function (node) {
        if (!node || node.nodeType !== 1) return;
        prepareMemory(node);
        enforceExclusiveExpandButton(node);
        if ((node.matches && node.matches("#cocoApp [data-coco-juego],#cocoApp")) ||
            (node.querySelector && node.querySelector("[data-coco-juego]"))) catalogChanged = true;
      });
    });
    if (catalogChanged) {
      clearTimeout(restoreTimer);
      restoreTimer = setTimeout(restoreCompletedCards, 80);
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });

  bindGlobals();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bindGlobals, { once: true });
  setTimeout(bindGlobals, 0);
  setTimeout(bindGlobals, 250);

  window.CocoQualityV135 = Object.freeze({
    version: VERSION,
    activeGame: function () { return activeGameId; },
    audit: function () {
      var expand = buttonNodes(document).filter(function (button) { return /^(Ampliar respuesta|Explícamelo mejor)$/i.test(text(button.textContent)); });
      return {
        memory: memoryAudit(),
        expandButtons: expand.length,
        expandButtonsOutsideCocoMed: expand.filter(function (button) { return !button.closest("#cocoMedContenido,.cocoMedModal"); }).length,
        confettiLayers: document.querySelectorAll(".cocoUnifiedConfetti").length,
        responseCounts: { correct: auditState.correct, incorrect: auditState.incorrect },
        soundCounts: { correct: auditState.sounds.correct, incorrect: auditState.sounds.incorrect },
        confettiRuns: auditState.confettiRuns,
        confettiDurationMs: auditState.confettiDurationMs,
        confettiReasons: auditState.confettiReasons.slice(),
        completions: Object.assign({}, auditState.completions)
      };
    }
  });
})();
