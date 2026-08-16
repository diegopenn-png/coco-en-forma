(function () {
  "use strict";

  var CONTENT_VERSION = "142.0.0";
  var DAILY_POLICY_VERSION = "149.0.0";
  /* Conserva las claves v141 para no reiniciar el historial de rotación ni
     cambiar una misión ya elegida al actualizar la PWA durante el mismo día. */
  var STORAGE_PREFIX = "coco_v141_rotation_";
  var DAILY_PREFIX = "coco_v135_complete_";
  var MISSION_PREFIX = "coco_v141_mission_";
  var FALLBACK_USER = "visitante";
  var remoteClient = null;
  var remoteUserId = "";
  var remoteUserEmail = "";
  var remoteReady = false;
  var remoteUnavailable = false;
  var authWatcherInstalled = false;
  var authSubscription = null;
  var syncTimers = Object.create(null);
  var dailyCallCounters = Object.create(null);
  var generatedCallCounters = Object.create(null);

  function localToday() {
    try {
      return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Europe/Madrid",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }).format(new Date());
    } catch {
      var date = new Date();
      return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
    }
  }

  function cleanUser(value) {
    return String(value || FALLBACK_USER).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 96) || FALLBACK_USER;
  }

  function cleanEmail(value) {
    return String(value || "").trim().toLocaleLowerCase("en-US");
  }

  function unlimitedTestEmails() {
    var config = window.COCO_CONFIG || {};
    return (Array.isArray(config.cuentasPruebaIlimitadas) ? config.cuentasPruebaIlimitadas : [])
      .map(cleanEmail).filter(Boolean);
  }

  function isUnlimitedUser(userId) {
    var requested = String(userId || remoteUserId || "");
    return Boolean(requested && remoteUserId && requested === String(remoteUserId) &&
      remoteUserEmail && unlimitedTestEmails().indexOf(remoteUserEmail) >= 0);
  }

  function stableStringify(value) {
    if (value === null || typeof value !== "object") return JSON.stringify(value);
    if (Array.isArray(value)) return "[" + value.map(stableStringify).join(",") + "]";
    return "{" + Object.keys(value).sort().map(function (key) {
      return JSON.stringify(key) + ":" + stableStringify(value[key]);
    }).join(",") + "}";
  }

  function hash(value) {
    var text = String(value), result = 2166136261;
    for (var index = 0; index < text.length; index++) {
      result ^= text.charCodeAt(index);
      result = Math.imul(result, 16777619);
    }
    return (result >>> 0).toString(36);
  }

  function seedNumber(value) {
    var result = 2166136261, text = String(value);
    for (var index = 0; index < text.length; index++) {
      result ^= text.charCodeAt(index);
      result = Math.imul(result, 16777619);
    }
    return result >>> 0;
  }

  function seededRandom(seed) {
    var state = seedNumber(seed) || 1;
    return function () {
      state += 0x6d2b79f5;
      var value = state;
      value = Math.imul(value ^ value >>> 15, value | 1);
      value ^= value + Math.imul(value ^ value >>> 7, value | 61);
      return ((value ^ value >>> 14) >>> 0) / 4294967296;
    };
  }

  function shuffle(list, seed) {
    var copy = list.slice(), random = seededRandom(seed);
    for (var index = copy.length - 1; index > 0; index--) {
      var target = Math.floor(random() * (index + 1));
      var swap = copy[index]; copy[index] = copy[target]; copy[target] = swap;
    }
    return copy;
  }

  function itemId(item, index, getter) {
    var explicit = getter ? getter(item, index) : item && item.id != null ? item.id : null;
    if (explicit != null && String(explicit).trim()) return String(explicit);
    return "h-" + hash(stableStringify(item));
  }

  function scopeName(config) {
    return [config.game || "general", config.mode || "default", config.level == null ? "all" : config.level].join("|");
  }

  function storageKey(userId, scope) {
    return STORAGE_PREFIX + cleanUser(userId) + "_" + hash(scope);
  }

  function missionKey(userId, scope, ordinal, day) {
    return MISSION_PREFIX + cleanUser(userId) + "_" + hash(scope) + "_" + String(ordinal || 0) + "_" + (day || localToday());
  }

  function nextOrdinal(counters, userId, scope) {
    var key = cleanUser(userId) + "|" + scope;
    var value = Number(counters[key] || 0);
    counters[key] = value + 1;
    return value;
  }

  function readMission(userId, scope, ordinal) {
    try { return JSON.parse(localStorage.getItem(missionKey(userId, scope, ordinal)) || "null"); }
    catch { return null; }
  }

  function writeMission(userId, scope, ordinal, value) {
    try { localStorage.setItem(missionKey(userId, scope, ordinal), JSON.stringify(value)); } catch {}
  }

  function blankState(scope) {
    return { contentVersion: CONTENT_VERSION, scope: scope, bag: [], recent: [], history: [], cycle: 0, updatedAt: 0 };
  }

  function readState(userId, scope) {
    var state = null;
    try { state = JSON.parse(localStorage.getItem(storageKey(userId, scope)) || "null"); } catch { state = null; }
    if (!state || typeof state !== "object") state = blankState(scope);
    state.scope = scope;
    state.bag = Array.isArray(state.bag) ? state.bag.map(String) : [];
    state.recent = Array.isArray(state.recent) ? state.recent.map(String) : [];
    state.history = Array.isArray(state.history) ? state.history.map(String) : [];
    state.cycle = Math.max(0, Number(state.cycle) || 0);
    return state;
  }

  function writeState(userId, scope, state) {
    state.contentVersion = CONTENT_VERSION;
    state.updatedAt = Date.now();
    try { localStorage.setItem(storageKey(userId, scope), JSON.stringify(state)); } catch {}
    queueRemoteSync(userId, scope, state);
  }

  function migrateState(state, validIds) {
    var valid = Object.create(null);
    validIds.forEach(function (id) { valid[id] = true; });
    state.bag = state.bag.filter(function (id, index, all) { return valid[id] && all.indexOf(id) === index; });
    state.recent = state.recent.filter(function (id, index, all) { return valid[id] && all.indexOf(id) === index; }).slice(0, 240);
    state.history = state.history.filter(function (id) { return valid[id]; }).slice(0, 2400);
    state.contentVersion = CONTENT_VERSION;
    return state;
  }

  function balancedBag(records, config, state) {
    var category = typeof config.getCategory === "function" ? config.getCategory : function () { return "general"; };
    var answer = typeof config.getAnswer === "function" ? config.getAnswer : function () { return ""; };
    var pending = shuffle(records, String(config.__dailySeed || "") + "|" + state.scope + "|" + state.cycle + "|" + CONTENT_VERSION);
    var ordered = [], categoryCount = Object.create(null), answerCount = Object.create(null), lastCategory = "", lastAnswer = "";
    while (pending.length) {
      var bestIndex = 0, bestScore = Infinity;
      for (var index = 0; index < pending.length; index++) {
        var record = pending[index], cat = String(category(record.item, record.index) || "general"), ans = String(answer(record.item, record.index));
        var score = (categoryCount[cat] || 0) * 4 + (answerCount[ans] || 0) * (ans ? 2 : 0) + (cat === lastCategory ? 3 : 0) + (ans && ans === lastAnswer ? 1 : 0) + index / Math.max(1, pending.length * 10);
        if (score < bestScore) { bestScore = score; bestIndex = index; }
      }
      var selected = pending.splice(bestIndex, 1)[0], selectedCategory = String(category(selected.item, selected.index) || "general"), selectedAnswer = String(answer(selected.item, selected.index));
      ordered.push(selected.id); categoryCount[selectedCategory] = (categoryCount[selectedCategory] || 0) + 1;
      if (selectedAnswer) answerCount[selectedAnswer] = (answerCount[selectedAnswer] || 0) + 1;
      lastCategory = selectedCategory; lastAnswer = selectedAnswer;
    }
    var protectedTail = Object.create(null), tailSize = Math.min(state.recent.length, Math.max(12, Number(config.count || 1) * 2));
    state.recent.slice(0, tailSize).forEach(function (id) { protectedTail[id] = true; });
    return ordered.filter(function (id) { return !protectedTail[id]; }).concat(ordered.filter(function (id) { return protectedTail[id]; }));
  }

  function choose(config) {
    config = config || {};
    var items = Array.isArray(config.items) ? config.items : [], count = Math.max(0, Math.min(items.length, Number(config.count) || 1));
    if (!items.length || !count) return [];
    var records = [], seen = Object.create(null);
    items.forEach(function (item, index) {
      var id = itemId(item, index, config.getId);
      if (!seen[id]) { seen[id] = true; records.push({ id: id, item: item, index: index }); }
    });
    count = Math.min(count, records.length);
    var scope = scopeName(config), userId = cleanUser(config.userId || remoteUserId), ordinal = nextOrdinal(dailyCallCounters, userId, scope);
    var lookup = Object.create(null); records.forEach(function (record) { lookup[record.id] = record.item; });
    var cached = readMission(userId, scope, ordinal);
    if (cached && cached.count === count && Array.isArray(cached.ids) && cached.ids.length === count) {
      var cachedUnique = Object.create(null), cachedItems = [];
      cached.ids.forEach(function (id) {
        if (!cachedUnique[id] && lookup[id]) { cachedUnique[id] = true; cachedItems.push(lookup[id]); }
      });
      if (cachedItems.length === count) return cachedItems;
    }
    var state = migrateState(readState(userId, scope), records.map(function (record) { return record.id; }));
    config.__dailySeed = userId + "|" + localToday();
    var selected = [], selectedRecordIds = [], selectedIds = Object.create(null), guard = 0;
    while (selected.length < count && guard++ < records.length * 4 + count * 4) {
      if (!state.bag.length) { state.cycle++; state.bag = balancedBag(records, config, state); }
      var next = state.bag.shift();
      if (!lookup[next] || selectedIds[next]) continue;
      selectedIds[next] = true; selectedRecordIds.push(next); selected.push(lookup[next]);
      state.recent = [next].concat(state.recent.filter(function (id) { return id !== next; })).slice(0, 240);
      state.history.unshift(next); state.history = state.history.slice(0, 2400);
    }
    writeState(userId, scope, state);
    writeMission(userId, scope, ordinal, { count: selected.length, ids: selectedRecordIds });
    return selected;
  }

  function parseLegacyKey(key) {
    var parts = String(key || "general").split("_");
    if (parts[0] === "tema" && parts.length >= 3) {
      return { game: parts[1], mode: "tema", level: parts[parts.length - 1] };
    }
    return { game: parts[0] || "general", mode: parts.slice(1, -1).join("_") || "classic", level: parts.length > 1 ? parts[parts.length - 1] : "all" };
  }

  function chooseLegacy(userId, key, items, count, getter) {
    var parsed = parseLegacyKey(key);
    return choose({ userId: userId, game: parsed.game, mode: parsed.mode, level: parsed.level, items: items, count: count, getId: getter });
  }

  function signatureScope(userId, key) {
    var parsed = parseLegacyKey(key);
    return { userId: cleanUser(userId), scope: scopeName({ game: parsed.game, mode: "generated-" + parsed.mode, level: parsed.level }) };
  }

  function acceptSignature(userId, key, signature, limit) {
    var target = signatureScope(userId, key), state = readState(target.userId, target.scope), id = "g-" + hash(String(signature));
    if (state.recent.indexOf(id) >= 0) return false;
    state.recent.unshift(id); state.recent = state.recent.slice(0, Math.max(30, Number(limit) || 730));
    state.history.unshift(id); state.history = state.history.slice(0, 2400);
    writeState(target.userId, target.scope, state); return true;
  }

  function generateLegacy(userId, key, factory, attempts, getter) {
    var target = signatureScope(userId, key), ordinal = nextOrdinal(generatedCallCounters, target.userId, target.scope);
    var cached = readMission(target.userId, target.scope, ordinal);
    if (cached && cached.kind === "generated" && cached.value != null) return cached.value;
    var tries = Math.max(30, Math.min(160, Number(attempts) || 60)), value = null, signature = "";
    for (var index = 0; index < tries; index++) {
      value = factory(); signature = getter ? getter(value) : stableStringify(value);
      if (acceptSignature(userId, key, signature, 730)) {
        writeMission(target.userId, target.scope, ordinal, { kind: "generated", value: value, signature: signature });
        return value;
      }
    }
    acceptSignature(userId, key, signature + "|" + Date.now(), 730);
    writeMission(target.userId, target.scope, ordinal, { kind: "generated", value: value, signature: signature });
    return value;
  }

  function setActiveUser(value, email) {
    var next = value ? String(value) : "";
    var emailProvided = arguments.length > 1;
    var nextEmail = emailProvided ? cleanEmail(email) : next === remoteUserId ? remoteUserEmail : "";
    if (next === remoteUserId && nextEmail === remoteUserEmail) return remoteUserId || null;
    var userChanged = next !== remoteUserId;
    remoteUserId = next;
    remoteUserEmail = nextEmail;
    if (userChanged) {
      remoteReady = false;
      dailyCallCounters = Object.create(null);
      generatedCallCounters = Object.create(null);
    }
    var detail = { userId: remoteUserId || null, day: localToday(), unlimitedTesting: isUnlimitedUser(remoteUserId) };
    try { window.dispatchEvent(new CustomEvent("coco:daily-user", { detail: detail })); } catch {}
    try { window.dispatchEvent(new CustomEvent("coco:daily-sync", { detail: Object.assign({ source: "user-change" }, detail) })); } catch {}
    return remoteUserId || null;
  }

  function client() {
    if (remoteClient) return remoteClient;
    var config = window.COCO_CONFIG || {};
    if (!window.supabase || !window.supabase.createClient || !config.url || !config.clave) return null;
    try {
      remoteClient = window.__COCO_SUPABASE_CLIENT || (window.__COCO_SUPABASE_CLIENT = window.supabase.createClient(config.url, config.clave, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } }));
    } catch { remoteClient = null; }
    return remoteClient;
  }

  function installAuthWatcher(api) {
    if (authWatcherInstalled || !api || !api.auth || typeof api.auth.onAuthStateChange !== "function") return;
    authWatcherInstalled = true;
    try {
      var result = api.auth.onAuthStateChange(function (_event, session) {
        var nextUserId = session && session.user && session.user.id ? session.user.id : "";
        var nextUserEmail = session && session.user && session.user.email ? session.user.email : "";
        setActiveUser(nextUserId, nextUserEmail);
        remoteReady = Boolean(nextUserId);
        if (nextUserId) setTimeout(establishRemote, 0);
      });
      authSubscription = result && result.data && result.data.subscription || null;
    } catch {
      authWatcherInstalled = false;
      authSubscription = null;
    }
  }

  function localRotationRows(userId, remoteTimes) {
    var rows = [], prefix = STORAGE_PREFIX + cleanUser(userId) + "_";
    try {
      for (var index = 0; index < localStorage.length; index++) {
        var key = localStorage.key(index); if (!key || key.indexOf(prefix) !== 0) continue;
        var state = JSON.parse(localStorage.getItem(key) || "null");
        if (!state || !state.scope || !state.updatedAt) continue;
        if (Number(state.updatedAt) <= Number(remoteTimes[state.scope] || 0)) continue;
        rows.push({ user_id: userId, scope_key: state.scope, content_version: CONTENT_VERSION, state: state, updated_at: new Date(state.updatedAt).toISOString() });
      }
    } catch {}
    return rows;
  }

  function localDailyRows(userId) {
    if (isUnlimitedUser(userId)) return [];
    var rows = [], prefix = DAILY_PREFIX + cleanUser(userId) + "_";
    try {
      for (var index = 0; index < localStorage.length; index++) {
        var key = localStorage.key(index); if (!key || key.indexOf(prefix) !== 0 || localStorage.getItem(key) !== "1") continue;
        var suffix = key.slice(prefix.length), match = suffix.match(/^(.+)_([0-9]{4}-[0-9]{2}-[0-9]{2})$/);
        if (!match || match[1] === "padel") continue;
        rows.push({ user_id: userId, game_id: match[1], play_date: match[2] });
      }
    } catch {}
    return rows;
  }

  async function establishRemote() {
    var api = client(); if (!api) return false;
    installAuthWatcher(api);
    try {
      var response = await api.auth.getSession(), session = response && response.data && response.data.session;
      if (!session || !session.user) {
        remoteReady = false;
        setActiveUser("");
        return false;
      }
      var syncUserId = session.user.id; setActiveUser(syncUserId, session.user.email || ""); remoteReady = true;
      var remote = await api.from("coco_content_rotation").select("scope_key,state,content_version,updated_at").eq("user_id", syncUserId), remoteTimes = Object.create(null);
      if (!remote.error && Array.isArray(remote.data)) {
        remote.data.forEach(function (row) {
          var incoming = row.state && typeof row.state === "object" ? row.state : null;
          if (!incoming || !row.scope_key) return;
          var local = readState(syncUserId, row.scope_key), remoteTime = Date.parse(row.updated_at || "") || Number(incoming.updatedAt) || 0;
          remoteTimes[row.scope_key] = remoteTime;
          if (!local.updatedAt || remoteTime > Number(local.updatedAt)) {
            incoming.scope = row.scope_key; incoming.updatedAt = remoteTime;
            try { localStorage.setItem(storageKey(syncUserId, row.scope_key), JSON.stringify(incoming)); } catch {}
          }
        });
      }
      var localRows = localRotationRows(syncUserId, remoteTimes);
      if (localRows.length) await api.from("coco_content_rotation").upsert(localRows, { onConflict: "user_id,scope_key" });
      var dailyRows = localDailyRows(syncUserId);
      if (dailyRows.length) await api.from("coco_daily_plays").upsert(dailyRows, { onConflict: "user_id,game_id,play_date", ignoreDuplicates: true });
      var today = localToday();
      var remoteDaily = await api.from("coco_daily_plays").select("game_id,play_date").eq("user_id", syncUserId).eq("play_date", today);
      if (!remoteDaily.error && Array.isArray(remoteDaily.data)) {
        remoteDaily.data.forEach(function (row) {
          if (!row || !row.game_id || row.game_id === "padel") return;
          try { localStorage.setItem(dailyKey(row.game_id, syncUserId, row.play_date || today), "1"); } catch {}
        });
      }
      var verification=await api.auth.getSession(),liveSession=verification&&verification.data&&verification.data.session;
      if(!liveSession||!liveSession.user||cleanUser(liveSession.user.id)!==cleanUser(syncUserId))return false;
      try { window.dispatchEvent(new CustomEvent("coco:daily-sync", { detail: { day: today, userId: syncUserId } })); } catch {}
      return true;
    } catch { remoteUnavailable = true; return false; }
  }

  function queueRemoteSync(userId, scope, state) {
    userId = cleanUser(userId || remoteUserId);
    if (userId === FALLBACK_USER) return;
    var timerKey = userId + "|" + scope;
    clearTimeout(syncTimers[timerKey]);
    syncTimers[timerKey] = setTimeout(async function () {
      var api = client(); if (!api) { remoteUnavailable = true; return; }
      try {
        if (!remoteReady || !remoteUserId || cleanUser(remoteUserId) !== userId) await establishRemote();
        if (!remoteUserId || cleanUser(remoteUserId) !== userId) return;
        var result = await api.from("coco_content_rotation").upsert({ user_id: remoteUserId, scope_key: scope, content_version: CONTENT_VERSION, state: state, updated_at: new Date(state.updatedAt || Date.now()).toISOString() }, { onConflict: "user_id,scope_key" });
        if (result.error) remoteUnavailable = true;
      } catch { remoteUnavailable = true; }
    }, 650);
  }

  function dailyKey(gameId, userId, day) {
    return DAILY_PREFIX + cleanUser(userId || remoteUserId) + "_" + cleanUser(gameId) + "_" + (day || localToday());
  }

  function localDailyUsed(gameId, userId, day) {
    if (isUnlimitedUser(userId)) return false;
    try { return localStorage.getItem(dailyKey(gameId, userId, day)) === "1"; } catch { return false; }
  }

  async function completeDaily(gameId, userId) {
    var day = localToday(), resolvedUser = userId || remoteUserId;
    if (gameId === "padel") return { ok: true, tool: true, source: "local" };
    if (!resolvedUser) return { ok: false, error: "missing-authenticated-user", source: "local" };
    if (cleanUser(remoteUserId) !== cleanUser(resolvedUser)) setActiveUser(resolvedUser);
    if (!remoteUserEmail) await establishRemote();
    if (isUnlimitedUser(resolvedUser)) {
      try { window.dispatchEvent(new CustomEvent("coco:test-play-completed", { detail: { gameId: gameId, userId: resolvedUser, day: day } })); } catch {}
      return { ok: true, unlimited: true, ranked: false, source: "test" };
    }
    if (localDailyUsed(gameId, resolvedUser, day)) return { ok: true, daily: true, already: true, source: "local" };
    try { localStorage.setItem(dailyKey(gameId, resolvedUser, day), "1"); } catch {}
    try { window.dispatchEvent(new CustomEvent("coco:daily-completed", { detail: { gameId: gameId, userId: resolvedUser || null, day: day } })); } catch {}
    var api = client();
    if (api) {
      try {
        if (!remoteReady || (resolvedUser && cleanUser(remoteUserId) !== cleanUser(resolvedUser))) await establishRemote();
        resolvedUser = resolvedUser || remoteUserId;
        if (remoteUserId && (!resolvedUser || cleanUser(resolvedUser) === cleanUser(remoteUserId))) {
          var result = await api.from("coco_daily_plays").insert({ user_id: remoteUserId, game_id: gameId, play_date: day, started_at: new Date().toISOString() });
          if (result.error && (result.error.code === "23505" || /duplicate|unique/i.test(result.error.message || ""))) {
            try { localStorage.setItem(dailyKey(gameId, remoteUserId, day), "1"); } catch {}
            return { ok: true, daily: true, already: true, source: "cloud" };
          }
          if (result.error && !/does not exist|schema cache|relation/i.test(result.error.message || "")) throw result.error;
        }
      } catch { remoteUnavailable = true; }
    }
    return { ok: true, source: remoteUnavailable ? "local" : "cloud" };
  }

  async function checkDaily(gameId, userId) {
    if (gameId === "padel") return { ok: true, tool: true, source: "check" };
    if (!remoteUserEmail) await establishRemote();
    if (isUnlimitedUser(userId)) return { ok: true, unlimited: true, ranked: false, source: "test" };
    var allowed = await canPlayDaily(gameId, userId);
    return allowed ? { ok: true, source: "check" } : { ok: false, daily: true, source: "check" };
  }

  async function canPlayDaily(gameId, userId) {
    var day = localToday(), resolvedUser = userId || remoteUserId;
    if (gameId === "padel") return true;
    if (!resolvedUser) return true;
    if (!remoteUserEmail || String(remoteUserId || "") !== String(resolvedUser)) await establishRemote();
    if (isUnlimitedUser(resolvedUser)) return true;
    if (localDailyUsed(gameId, resolvedUser, day)) return false;
    var api = client(); if (!api) return true;
    try {
      if (!remoteReady || (resolvedUser && cleanUser(remoteUserId) !== cleanUser(resolvedUser))) await establishRemote();
      if (!remoteUserId || (resolvedUser && cleanUser(remoteUserId) !== cleanUser(resolvedUser))) return true;
      var result = await api.from("coco_daily_plays").select("game_id").eq("user_id", remoteUserId).eq("game_id", gameId).eq("play_date", day).maybeSingle();
      if (!result.error && result.data) {
        try { localStorage.setItem(dailyKey(gameId, remoteUserId, day), "1"); } catch {}
        return false;
      }
    } catch { remoteUnavailable = true; }
    return true;
  }

  function track(eventName, properties) {
    var allowed = ["game", "mode", "level", "result", "source"], clean = {};
    allowed.forEach(function (key) { if (properties && properties[key] != null) clean[key] = String(properties[key]).slice(0, 80); });
    try {
      var events = JSON.parse(localStorage.getItem("coco_v134_product_events") || "[]");
      if (!Array.isArray(events)) events = [];
      events.push({ event: String(eventName).slice(0, 64), at: new Date().toISOString(), properties: clean });
      localStorage.setItem("coco_v134_product_events", JSON.stringify(events.slice(-120)));
    } catch {}
  }

  function enhanceCopyAndAccessibility() {
    document.documentElement.lang = "es";
    var app = document.getElementById("cocoApp"); if (!app) return;
    app.querySelectorAll('.cocoGameCard[data-coco-juego="cocomed"]').forEach(function (card) {
      var description = card.querySelector(".cocoDescripcion,.pequeno.apagado");
      if (description) description.textContent = "Poné a prueba tus conocimientos sobre salud y aprendé con una explicación después de cada respuesta.";
      var badge = card.querySelector(".cocoLigaBadge b"); if (badge) badge.textContent = "Misma cuenta · clasificación independiente";
    });
    var medTab = document.querySelector("#cocoMedPestana small");
    if (medTab) medTab.textContent = "Una vez al día · liga independiente";
    var medContent = document.getElementById("cocoMedContenido");
    if (medContent && !medContent.querySelector(".cocoMedEducationNotice")) {
      var note = document.createElement("p"); note.className = "cocoMedEducationNotice";
      note.textContent = "Contenido educativo para estudiar y practicar. No sustituye una consulta ni ofrece diagnósticos.";
      medContent.insertBefore(note, medContent.firstChild);
    }
    app.querySelectorAll("button:not([type])").forEach(function (button) { button.type = "button"; });
    if (window.supabase && !remoteReady) establishRemote();
  }

  function installClassicActionGuard() {
    if (window.__cocoV134ActionGuard) return;
    window.__cocoV134ActionGuard = true;
    document.addEventListener("click", function (event) {
      var button = event.target && event.target.closest ? event.target.closest("#cocoApp .bOk") : null;
      if (!button) return;
      var now = Date.now(), previous = Number(button.dataset.cocoLastAction || 0);
      if (now - previous < 1600) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        return;
      }
      button.dataset.cocoLastAction = String(now);
    }, true);
  }

  function registerPwa() {
    if (!("serviceWorker" in navigator) || location.protocol === "file:" || window.__cocoPwaV142Registered) return;
    window.__cocoPwaV142Registered = true;
    var hadController = Boolean(navigator.serviceWorker.controller), reloading = false;
    window.addEventListener("load", function () {
      navigator.serviceWorker.register(new URL("sw.js",document.baseURI).href,{scope:new URL("./",document.baseURI).pathname}).then(function (registration) {
        function offerUpdate(worker) {
          if (!worker || !hadController || document.querySelector(".cocoV134Update")) return;
          var app = document.getElementById("cocoApp") || document.body, button = document.createElement("button");
          button.type = "button"; button.className = "cocoV134Update"; button.textContent = "Nueva versión disponible · actualizar";
          button.onclick = function () { worker.postMessage({ type: "SKIP_WAITING" }); };
          app.appendChild(button);
        }
        offerUpdate(registration.waiting);
        registration.addEventListener("updatefound", function () {
          var worker = registration.installing; if (!worker) return;
          worker.addEventListener("statechange", function () {
            if (worker.state === "installed") offerUpdate(worker);
          });
        });
      }).catch(function () {});
      navigator.serviceWorker.addEventListener("controllerchange", function () {
        if (!hadController || reloading) return;
        reloading = true;
        location.reload();
      });
    });
  }

  window.CocoRotationV134 = {
    version: CONTENT_VERSION,
    choose: choose,
    chooseLegacy: chooseLegacy,
    generateLegacy: generateLegacy,
    acceptSignature: acceptSignature,
    stableId: itemId,
    canonical: stableStringify,
    hash: hash,
    status: function () { return { contentVersion: CONTENT_VERSION, dailyPolicyVersion: DAILY_POLICY_VERSION, cloudReady: remoteReady, localFallback: remoteUnavailable || !remoteReady, userId: remoteUserId || null, authWatcher: Boolean(authSubscription), unlimitedTesting: isUnlimitedUser(remoteUserId) }; },
    hydrate: establishRemote
  };
  window.CocoDailyV134 = {
    claim: checkDaily,
    complete: completeDaily,
    canPlay: canPlayDaily,
    localUsed: localDailyUsed,
    today: localToday,
    sync: establishRemote,
    setUser: setActiveUser,
    userId: function () { return remoteUserId || null; },
    isUnlimited: isUnlimitedUser,
    policyVersion: DAILY_POLICY_VERSION
  };
  window.CocoDailyV135 = window.CocoDailyV134;
  window.CocoDailyV141 = window.CocoDailyV134;
  window.CocoDailyV142 = window.CocoDailyV134;
  window.CocoDailyV148 = window.CocoDailyV134;
  window.CocoDailyV149 = window.CocoDailyV134;
  window.CocoAnalyticsV134 = { track: track, mode: "local-only", exportsPersonalData: false };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", enhanceCopyAndAccessibility);
  else enhanceCopyAndAccessibility();
  installClassicActionGuard();
  new MutationObserver(function () { clearTimeout(window.__cocoV134Enhance); window.__cocoV134Enhance = setTimeout(enhanceCopyAndAccessibility, 80); }).observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(establishRemote, 1200); registerPwa();
})();
