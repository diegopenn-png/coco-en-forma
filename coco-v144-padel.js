(function (root) {
  "use strict";

  var C = root.CocoV144;
  if (!C || root.CocoPadelV145) return;

  var STORAGE_KEY = "coco_padel_club_v144";
  var LEGACY_KEYS = ["coco_padel_club_v132", "coco_padel_club_v130"];
  var state = null;
  var view = "mixing";
  var currentSessionId = null;
  var mixingSession = null;
  var mixingDraft = null;
  var currentChampionshipId = null;
  var selectedPlayerId = null;
  var controller = null;
  var draft = null;
  var busy = false;
  var standingsSort = "position";
  var directoryStatus = "";

  function iso() { return new Date().toISOString(); }
  function level(value) { return ["bajo", "medio", "alto"].indexOf(String(value || "").toLowerCase()) >= 0 ? String(value).toLowerCase() : "medio"; }
  function levelLabel(value) { return value === "alto" ? "Alto" : value === "bajo" ? "Bajo" : "Medio"; }
  function number(value) { value = Number(value); return Number.isFinite(value) && value >= 0 ? value : null; }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function selectorValue(value) { return String(value || "").replace(/([\\"'\\[\\]#.:])/g, "\\$1"); }
  function playerById(playerId) { return state && state.players.find(function (item) { return item.id === playerId; }) || null; }
  function championshipById(championshipId) { return state && state.championships.find(function (item) { return item.id === championshipId; }) || null; }
  function sessionById(sessionId) { return mixingSession && mixingSession.id === sessionId ? mixingSession : state && state.sessions.find(function (item) { return item.id === sessionId; }) || null; }
  function displayPlayer(playerId) { var player = playerById(playerId); return player ? player.name + " — " + player.code : "Jugador no disponible"; }

  function blankState() {
    return { version: 3, nextPlayerNumber: 1, players: [], championships: [], sessions: [], auditLog: [], updatedAt: iso() };
  }

  function codeNumber(code) {
    var match = String(code || "").match(/^CP-(\d+)$/i); return match ? Number(match[1]) : 0;
  }

  function allocateCode(targetState) {
    var used = Object.create(null);
    targetState.players.forEach(function (player) { if (player.code) used[String(player.code).toUpperCase()] = true; });
    var next = Math.max(1, Number(targetState.nextPlayerNumber) || 1), code;
    do { code = "CP-" + String(next++).padStart(4, "0"); } while (used[code]);
    targetState.nextPlayerNumber = next;
    return code;
  }

  function normalizeState(input) {
    var source = input && typeof input === "object" ? clone(input) : blankState(), output = blankState();
    output.updatedAt = source.updatedAt || iso();
    output.auditLog = Array.isArray(source.auditLog) ? source.auditLog.slice(-1000) : [];
    output.players = (Array.isArray(source.players) ? source.players : []).map(function (raw, index) {
      var history = Array.isArray(raw.levelHistory) ? raw.levelHistory : [];
      var legacyHistory = Array.isArray(raw.history) ? raw.history : [];
      var lastLegacy = legacyHistory.slice().sort(function (a, b) { return String(b.date || "").localeCompare(String(a.date || "")); })[0];
      var currentLevel = level(raw.currentLevel || raw.level || lastLegacy && lastLegacy.level);
      return {
        id: String(raw.id || raw.playerId || C.id("player")),
        code: /^CP-\d+$/i.test(String(raw.code || "")) ? String(raw.code).toUpperCase() : "",
        name: String(raw.name || raw.nombre || ("Jugador " + (index + 1))).trim(),
        currentLevel: currentLevel,
        active: raw.active !== false && raw.status !== "inactive",
        createdAt: raw.createdAt || raw.creado || iso(),
        levelHistory: history.map(function (entry) {
          return { id: entry.id || C.id("level"), previousLevel: level(entry.previousLevel || entry.from), newLevel: level(entry.newLevel || entry.to), date: entry.date || entry.changedAt || iso(), championshipId: entry.championshipId || null, reason: String(entry.reason || "") };
        })
      };
    });
    var maxCode = output.players.reduce(function (max, player) { return Math.max(max, codeNumber(player.code)); }, 0);
    output.nextPlayerNumber = Math.max(maxCode + 1, Number(source.nextPlayerNumber) || 1);
    output.players.forEach(function (player) { if (!player.code) player.code = allocateCode(output); });
    output.championships = (Array.isArray(source.championships) ? source.championships : []).map(function (raw) {
      var scoring = raw.scoring || {};
      return {
        id: String(raw.id || C.id("champ")), name: String(raw.name || "Campeonato").trim(),
        startDate: raw.startDate || raw.createdAt && String(raw.createdAt).slice(0, 10) || C.today(), endDate: raw.endDate || "",
        status: ["active", "finished", "archived"].indexOf(raw.status) >= 0 ? raw.status : "active",
        participantIds: Array.isArray(raw.participantIds) ? raw.participantIds.filter(Boolean) : [],
        scoring: {
          mode: scoring.mode === "games" ? "games" : "points",
          win: Math.max(0, Number(scoring.win == null ? 3 : scoring.win)),
          draw: Math.max(0, Number(scoring.draw == null ? 1 : scoring.draw)),
          loss: Math.max(0, Number(scoring.loss == null ? 0 : scoring.loss)),
          tiebreakers: ["points", "gameDifference", "gamesWon", "headToHead"]
        },
        createdAt: raw.createdAt || iso(), finishedAt: raw.finishedAt || null, archivedAt: raw.archivedAt || null
      };
    });
    output.sessions = (Array.isArray(source.sessions) ? source.sessions : []).map(function (raw) {
      var participants = Array.isArray(raw.participants) ? raw.participants : Array.isArray(raw.players) ? raw.players.map(function (entry) {
        var player = output.players.find(function (item) { return item.id === (entry.playerId || entry.id); });
        return { playerId: entry.playerId || entry.id, codeSnapshot: entry.codeSnapshot || player && player.code || "", nameSnapshot: entry.nameSnapshot || entry.name || player && player.name || "Jugador", levelSnapshot: level(entry.levelSnapshot || entry.level || player && player.currentLevel) };
      }) : [];
      return {
        id: String(raw.id || C.id("session")), kind: raw.kind === "championship-date" || raw.championshipId ? "championship-date" : "mixing",
        championshipId: raw.championshipId || null, name: String(raw.name || "Mixing").trim(), date: raw.date || C.today(),
        courts: Math.max(1, Number(raw.courts) || 1), courtLabels: Array.isArray(raw.courtLabels) && raw.courtLabels.length ? raw.courtLabels.map(String) : ["1"],
        rounds: Math.max(1, Number(raw.rounds) || 1), matchMinutes: Math.max(1, Number(raw.matchMinutes) || 20), timerMode: raw.timerMode === "unlimited" ? "unlimited" : "limit",
        participants: participants,
        matches: (Array.isArray(raw.matches) ? raw.matches : []).map(function (match, matchIndex) {
          var gamesA = number(match.score && match.score.gamesA != null ? match.score.gamesA : match.gamesA != null ? match.gamesA : match.scoreA);
          var gamesB = number(match.score && match.score.gamesB != null ? match.score.gamesB : match.gamesB != null ? match.gamesB : match.scoreB);
          return { id: String(match.id || C.id("match")), order: Number(match.order) || matchIndex + 1, round: Number(match.round) || 1, court: Number(match.court) || 1, courtLabel: String(match.courtLabel || match.court || 1), teamA: (match.teamA || []).map(String), teamB: (match.teamB || []).map(String), score: gamesA == null || gamesB == null ? null : { gamesA: gamesA, gamesB: gamesB }, updatedAt: match.updatedAt || null };
        }),
        createdAt: raw.createdAt || iso(), updatedAt: raw.updatedAt || raw.createdAt || iso()
      };
    });
    output.championships.forEach(function (championship) {
      if (!championship.participantIds.length) {
        var seen = Object.create(null);
        output.sessions.filter(function (item) { return item.championshipId === championship.id; }).forEach(function (item) { item.participants.forEach(function (entry) { seen[entry.playerId] = true; }); });
        championship.participantIds = Object.keys(seen);
      }
    });
    output.version = 3;
    return output;
  }

  function createPlayer(targetState, name, playerLevel, options) {
    name = String(name || "").trim(); if (!name) throw new Error("Escribe el nombre del jugador.");
    var duplicateName = targetState.players.some(function (player) { return player.name.toLocaleLowerCase("es") === name.toLocaleLowerCase("es"); });
    var player = { id: C.id("player"), code: allocateCode(targetState), name: name, currentLevel: level(playerLevel), active: true, createdAt: iso(), levelHistory: [] };
    targetState.players.push(player);
    targetState.auditLog.push({ id: C.id("audit"), type: "player-created", playerId: player.id, at: iso() });
    if (!(options && options.skipTimestamp)) targetState.updatedAt = iso();
    return { player: player, duplicateName: duplicateName };
  }

  function scoringFor(championship) {
    return championship && championship.scoring || { mode: "points", win: 3, draw: 1, loss: 0, tiebreakers: ["points", "gameDifference", "gamesWon", "headToHead"] };
  }

  function completed(match) { return Boolean(match && match.score && number(match.score.gamesA) != null && number(match.score.gamesB) != null); }

  function standingsForSessions(targetState, sessions, championship) {
    var rows = Object.create(null), direct = Object.create(null), scoring = scoringFor(championship);
    function ensure(playerId, snapshot) {
      if (!rows[playerId]) {
        var player = targetState.players.find(function (item) { return item.id === playerId; });
        rows[playerId] = { id: playerId, code: player && player.code || snapshot && snapshot.codeSnapshot || "", name: player && player.name || snapshot && snapshot.nameSnapshot || "Jugador", played: 0, won: 0, drawn: 0, lost: 0, gamesWon: 0, gamesLost: 0, gameDifference: 0, points: 0, position: 0 };
      }
      return rows[playerId];
    }
    sessions.forEach(function (session) {
      var snapshots = Object.create(null); session.participants.forEach(function (entry) { snapshots[entry.playerId] = entry; ensure(entry.playerId, entry); });
      session.matches.forEach(function (match) {
        if (!completed(match)) return;
        var a = Number(match.score.gamesA), b = Number(match.score.gamesB), comparison = a === b ? 0 : a > b ? 1 : -1;
        match.teamA.concat(match.teamB).forEach(function (playerId) { ensure(playerId, snapshots[playerId]).played++; });
        match.teamA.forEach(function (playerId) {
          var row = ensure(playerId, snapshots[playerId]); row.gamesWon += a; row.gamesLost += b;
          if (comparison > 0) row.won++; else if (comparison === 0) row.drawn++; else row.lost++;
          row.points += scoring.mode === "games" ? a : comparison > 0 ? scoring.win : comparison === 0 ? scoring.draw : scoring.loss;
          match.teamB.forEach(function (opponent) { (direct[playerId] || (direct[playerId] = Object.create(null)))[opponent] = ((direct[playerId] || {})[opponent] || 0) + (a - b); });
        });
        match.teamB.forEach(function (playerId) {
          var row = ensure(playerId, snapshots[playerId]); row.gamesWon += b; row.gamesLost += a;
          if (comparison < 0) row.won++; else if (comparison === 0) row.drawn++; else row.lost++;
          row.points += scoring.mode === "games" ? b : comparison < 0 ? scoring.win : comparison === 0 ? scoring.draw : scoring.loss;
          match.teamA.forEach(function (opponent) { (direct[playerId] || (direct[playerId] = Object.create(null)))[opponent] = ((direct[playerId] || {})[opponent] || 0) + (b - a); });
        });
      });
    });
    return Object.keys(rows).map(function (key) { rows[key].gameDifference = rows[key].gamesWon - rows[key].gamesLost; return rows[key]; }).sort(function (a, b) {
      return b.points - a.points || b.gameDifference - a.gameDifference || b.gamesWon - a.gamesWon || Number((direct[b.id] || {})[a.id] || 0) - Number((direct[a.id] || {})[b.id] || 0) || a.code.localeCompare(b.code);
    }).map(function (row, index) { row.position = index + 1; return row; });
  }

  function championshipStandings(targetState, championshipId) {
    var championship = targetState.championships.find(function (item) { return item.id === championshipId; });
    return standingsForSessions(targetState, targetState.sessions.filter(function (item) { return item.championshipId === championshipId; }), championship);
  }

  function sessionStandings(targetState, sessionId) {
    var selected = targetState.sessions.find(function (item) { return item.id === sessionId; });
    var championship = selected && targetState.championships.find(function (item) { return item.id === selected.championshipId; });
    return selected ? standingsForSessions(targetState, [selected], championship || null) : [];
  }

  function sortedStandings(rows, criterion) {
    var copy = rows.slice();
    if (criterion === "points") copy.sort(function (a, b) { return b.points - a.points || a.position - b.position; });
    else if (criterion === "won") copy.sort(function (a, b) { return b.won - a.won || b.points - a.points || a.position - b.position; });
    else if (criterion === "gameDifference") copy.sort(function (a, b) { return b.gameDifference - a.gameDifference || b.gamesWon - a.gamesWon || a.position - b.position; });
    else copy.sort(function (a, b) { return a.position - b.position; });
    return copy;
  }

  function saveResult(targetState, sessionId, matchId, gamesA, gamesB) {
    var selected = targetState.sessions.find(function (item) { return item.id === sessionId; }); if (!selected) throw new Error("Sesión no encontrada.");
    var match = selected.matches.find(function (item) { return item.id === matchId; }); if (!match) throw new Error("Partido no encontrado.");
    gamesA = number(gamesA); gamesB = number(gamesB); if (gamesA == null || gamesB == null) throw new Error("Completa ambos resultados.");
    var previous = match.score ? clone(match.score) : null;
    match.score = { gamesA: gamesA, gamesB: gamesB }; match.updatedAt = iso(); selected.updatedAt = iso(); targetState.updatedAt = iso();
    targetState.auditLog.push({ id: C.id("audit"), type: previous ? "result-corrected" : "result-saved", sessionId: sessionId, matchId: matchId, previous: previous, next: clone(match.score), at: iso() });
    return match;
  }

  function deleteResult(targetState, sessionId, matchId) {
    var selected = targetState.sessions.find(function (item) { return item.id === sessionId; }), match = selected && selected.matches.find(function (item) { return item.id === matchId; }); if (!match) throw new Error("Partido no encontrado.");
    var previous = match.score ? clone(match.score) : null; match.score = null; match.updatedAt = iso(); selected.updatedAt = iso(); targetState.updatedAt = iso();
    targetState.auditLog.push({ id: C.id("audit"), type: "result-deleted", sessionId: sessionId, matchId: matchId, previous: previous, at: iso() });
  }

  function changePlayerLevel(targetState, playerId, newLevel, championshipId, reason) {
    var player = targetState.players.find(function (item) { return item.id === playerId; }); if (!player) throw new Error("Jugador no encontrado.");
    var next = level(newLevel), previous = level(player.currentLevel); if (next === previous) return null;
    var entry = { id: C.id("level"), previousLevel: previous, newLevel: next, date: iso(), championshipId: championshipId || null, reason: String(reason || "").trim() };
    player.currentLevel = next; player.levelHistory.push(entry); targetState.updatedAt = iso(); targetState.auditLog.push({ id: C.id("audit"), type: "level-changed", playerId: playerId, championshipId: championshipId || null, previousLevel: previous, newLevel: next, at: entry.date });
    return entry;
  }

  function playerHistory(targetState, playerId) {
    var rows = [];
    targetState.sessions.forEach(function (selected) {
      if (!selected.championshipId) return;
      var snapshot = selected.participants.find(function (entry) { return entry.playerId === playerId; }); if (!snapshot) return;
      selected.matches.forEach(function (match) {
        if (!completed(match) || match.teamA.indexOf(playerId) < 0 && match.teamB.indexOf(playerId) < 0) return;
        var onA = match.teamA.indexOf(playerId) >= 0, mine = onA ? match.score.gamesA : match.score.gamesB, theirs = onA ? match.score.gamesB : match.score.gamesA, partnerIds = (onA ? match.teamA : match.teamB).filter(function (id) { return id !== playerId; }), rivalIds = onA ? match.teamB : match.teamA;
        rows.push({ id: match.id, date: selected.date, sessionId: selected.id, sessionName: selected.name, championshipId: selected.championshipId, championshipName: selected.championshipId && (targetState.championships.find(function (item) { return item.id === selected.championshipId; }) || {}).name || "Sesión libre", levelSnapshot: snapshot.levelSnapshot, gamesWon: mine, gamesLost: theirs, result: mine === theirs ? "Empate" : mine > theirs ? "Ganado" : "Perdido", partners: partnerIds.map(function (id) { var p = targetState.players.find(function (item) { return item.id === id; }); return p ? p.name + " — " + p.code : id; }), rivals: rivalIds.map(function (id) { var p = targetState.players.find(function (item) { return item.id === id; }); return p ? p.name + " — " + p.code : id; }) });
      });
    });
    return rows.sort(function (a, b) { return String(b.date).localeCompare(String(a.date)) || b.id.localeCompare(a.id); });
  }

  function playerStats(targetState, playerId) {
    var history = playerHistory(targetState, playerId), championships = Object.create(null), dates = Object.create(null), result = { championships: 0, dates: 0, played: history.length, won: 0, lost: 0, drawn: 0, gamesWon: 0, gamesLost: 0, gameDifference: 0, points: 0, history: history };
    history.forEach(function (row) { if (row.championshipId) championships[row.championshipId] = true; dates[row.sessionId] = true; result.gamesWon += row.gamesWon; result.gamesLost += row.gamesLost; if (row.result === "Ganado") result.won++; else if (row.result === "Perdido") result.lost++; else result.drawn++; });
    result.championships = Object.keys(championships).length; result.dates = Object.keys(dates).length; result.gameDifference = result.gamesWon - result.gamesLost;
    targetState.championships.forEach(function (championship) { var row = championshipStandings(targetState, championship.id).find(function (item) { return item.id === playerId; }); if (row) result.points += row.points; });
    return result;
  }

  function championshipPointsMap(targetState) {
    var points = Object.create(null);
    targetState.championships.forEach(function (championship) { championshipStandings(targetState, championship.id).forEach(function (row) { points[row.id] = (points[row.id] || 0) + row.points; }); });
    return points;
  }

  async function loadState() {
    var local = null;
    try { local = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); } catch (_) {}
    if (!local) for (var index = 0; index < LEGACY_KEYS.length && !local; index++) try { local = JSON.parse(localStorage.getItem(LEGACY_KEYS[index]) || "null"); } catch (_) {}
    var result = normalizeState(local), userSession = await C.session(), api = C.client();
    if (!userSession || !api || root.CocoArcadeDemo) return result;
    try {
      var remote = await api.from("coco_padel_club_state").select("estado,actualizado").eq("organizador", userSession.user.id).maybeSingle();
      if (!remote.error && remote.data && remote.data.estado) {
        var remoteState = normalizeState(remote.data.estado), remoteTime = Date.parse(remote.data.actualizado || remoteState.updatedAt || "") || 0, localTime = Date.parse(result.updatedAt || "") || 0;
        if (remoteTime >= localTime) result = remoteState;
      }
    } catch (_) {}
    return result;
  }

  async function persist(silent) {
    if (!state || busy) return false; state.updatedAt = iso();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
    var userSession = await C.session(), api = C.client(); if (!userSession || !api || root.CocoArcadeDemo) { if (!silent) C.toast("Guardado en este dispositivo.", "good"); return true; }
    try {
      var result = await api.from("coco_padel_club_state").upsert({ organizador: userSession.user.id, estado: state, actualizado: state.updatedAt }, { onConflict: "organizador" });
      if (result.error) throw result.error; if (!silent) C.toast("Club guardado y sincronizado.", "good"); return true;
    } catch (_) { if (!silent) C.toast("Guardado local. La sincronización remota necesita la migración v144."); return false; }
  }

  function defaultDraft(kind, championship) {
    var participants = championship ? championship.participantIds.slice() : [];
    return { kind: kind || "mixing", championshipId: championship && championship.id || null, name: championship ? "Fecha " + (state.sessions.filter(function (item) { return item.championshipId === championship.id; }).length + 1) : "Mixing " + C.today().split("-").reverse().join("/"), date: C.today(), courts: 2, courtLabels: "1, 2", rounds: 4, timerMode: "limit", matchMinutes: 20, participantIds: participants };
  }

  function generateSession(localDraft) {
    var participants = localDraft.participantIds.map(function (playerId) { var player = playerById(playerId); return player && player.active !== false ? { playerId: player.id, codeSnapshot: player.code, nameSnapshot: player.name, levelSnapshot: player.currentLevel, name: player.name, level: player.currentLevel } : null; }).filter(Boolean);
    if (participants.length < 4) throw new Error("Selecciona al menos cuatro jugadores activos.");
    var courts = Math.max(1, Math.min(40, Number(localDraft.courts) || 1)), rounds = Math.max(1, Math.min(50, Number(localDraft.rounds) || 1)), labels = String(localDraft.courtLabels || "").split(/[,;\n]+/).map(function (value) { return value.trim(); }).filter(Boolean).slice(0, courts);
    while (labels.length < courts) labels.push(String(labels.length + 1));
    var prior = localDraft.kind === "championship-date" ? state.sessions.filter(function (item) { return item.championshipId === localDraft.championshipId; }).reduce(function (all, item) { return all.concat(item.matches || []); }, []) : [], matches;
    if (root.CocoPadelV134 && typeof root.CocoPadelV134.generate === "function") matches = root.CocoPadelV134.generate(participants, labels, rounds, C.id("seed"), { priorMatches: prior });
    else matches = [];
    if (!matches.length) throw new Error("No se pudo generar una rotación válida con esa configuración.");
    var selected = { id: C.id("session"), kind: localDraft.kind, championshipId: localDraft.championshipId || null, name: String(localDraft.name || "Mixing").trim(), date: localDraft.date || C.today(), courts: courts, courtLabels: labels, rounds: rounds, timerMode: localDraft.timerMode === "unlimited" ? "unlimited" : "limit", matchMinutes: Math.max(1, Math.min(240, Number(localDraft.matchMinutes) || 20)), participants: participants.map(function (entry) { return { playerId: entry.playerId, codeSnapshot: entry.codeSnapshot, nameSnapshot: entry.nameSnapshot, levelSnapshot: entry.levelSnapshot }; }), matches: matches.map(function (match) { return { id: match.id || C.id("match"), order: match.order, round: match.round, court: match.court, courtLabel: match.courtLabel, teamA: match.teamA.slice(), teamB: match.teamB.slice(), score: null, updatedAt: null }; }), createdAt: iso(), updatedAt: iso() };
    if (selected.championshipId) {
      state.sessions.push(selected); state.updatedAt = iso(); state.auditLog.push({ id: C.id("audit"), type: "championship-date-created", sessionId: selected.id, championshipId: selected.championshipId, at: iso() });
    } else mixingSession = selected;
    return selected;
  }

  function navHtml() {
    return '<nav class="c145PadelTabs" aria-label="Secciones de Coco Pádel">' + [["mixing", "Mixing"], ["championship", "Campeonato"], ["players", "Jugadores"]].map(function (item) { return '<button type="button" data-padel144-view="' + item[0] + '" class="' + (view === item[0] ? "active" : "") + '" aria-current="' + (view === item[0] ? "page" : "false") + '">' + item[1] + '</button>'; }).join("") + '</nav>';
  }

  function heroHtml() {
    return '<header class="c144PadelHero"><div class="c144PadelMark" aria-hidden="true">🎾</div><div><span class="c144Eyebrow">COCO PÁDEL · ORGANIZACIÓN PROFESIONAL</span><h3>Menos logística. Más pista y más grupo.</h3><p>Códigos permanentes, niveles guardados y estadísticas recalculadas siempre desde los resultados.</p></div><div class="c144PadelWell"><b>☀️ Coco Pádel sigue siendo ilimitado</b><span>Organiza todas las sesiones que necesites. El objetivo es salir a jugar, moverse y encontrarse.</span></div></header>';
  }

  function playerOptionHtml(player, checked) {
    return '<label class="c144PlayerPick"><input type="checkbox" data-padel144-player="' + C.esc(player.id) + '" ' + (checked ? "checked" : "") + '><span><b>' + C.esc(player.name) + ' — ' + C.esc(player.code) + '</b><small>Nivel guardado: ' + levelLabel(player.currentLevel) + '</small></span><i class="c144Chip ' + player.currentLevel + '">' + levelLabel(player.currentLevel) + '</i></label>';
  }

  function createPlayerFormHtml(context) {
    return '<div class="c144FormGrid"><label class="c144Field">Nombre<input data-padel144-new-name maxlength="80" placeholder="Ej.: Diego"></label><label class="c144Field">Nivel inicial<select data-padel144-new-level><option value="bajo">Bajo</option><option value="medio" selected>Medio</option><option value="alto">Alto</option></select></label></div><div class="c144Actions"><button type="button" class="c144Secondary" data-padel144-create-player="' + context + '">Crear jugador sin salir</button></div><p class="c144Notice">Si ya existe ese nombre, Coco avisará pero permitirá continuar. El código CP identifica a cada persona sin ambigüedad.</p>';
  }

  function sessionListHtml(kind) {
    var sessions = state.sessions.filter(function (item) { return kind === "mixing" ? !item.championshipId : true; }).slice().sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
    return '<div class="c144SessionList">' + (sessions.length ? sessions.map(function (item) { var done = item.matches.filter(completed).length; return '<button type="button" data-padel144-open-session="' + item.id + '" class="' + (item.id === currentSessionId ? "active" : "") + '"><span>' + C.esc(item.date) + '</span><b>' + C.esc(item.name) + '</b><small>' + done + '/' + item.matches.length + ' resultados</small></button>'; }).join("") : '<div class="c144Empty"><b>Aún no hay sesiones</b><span>Configura el primer mixing.</span></div>') + '</div>';
  }

  function standingsTableHtml(rows, scoring) {
    return '<div class="c144TableWrap"><table class="c144Table"><thead><tr><th>Pos.</th><th>Jugador</th><th>PJ</th><th>PG</th><th>PP</th><th>GG</th><th>GP</th><th>DG</th><th>PTS</th></tr></thead><tbody>' + (rows.length ? rows.map(function (row) { return '<tr><td class="rank">' + row.position + '</td><td><b>' + C.esc(row.name) + '</b><br><small>' + C.esc(row.code) + '</small></td><td>' + row.played + '</td><td>' + row.won + '</td><td>' + row.lost + '</td><td>' + row.gamesWon + '</td><td>' + row.gamesLost + '</td><td>' + (row.gameDifference > 0 ? "+" : "") + row.gameDifference + '</td><td><b>' + row.points + '</b></td></tr>'; }).join("") : '<tr><td colspan="9">Todavía no hay resultados completos.</td></tr>') + '</tbody></table></div><p class="c144Notice">Regla: ' + (scoring.mode === "games" ? "los puntos equivalen a los games ganados" : scoring.win + " por victoria, " + scoring.draw + " por empate y " + scoring.loss + " por derrota") + '. Desempates: puntos, diferencia de games, games ganados y resultado directo.</p>';
  }

  function matchHtml(selected, match) {
    var score = match.score || {}, played = completed(match);
    return '<article class="c144Match ' + (played ? "played" : "") + '"><div class="c144MatchHead"><span>PARTIDO ' + match.order + '</span><b>Pista ' + C.esc(match.courtLabel) + '</b></div><div class="c144Versus"><b>' + match.teamA.map(displayPlayer).map(C.esc).join('<br><span>+</span><br>') + '</b><span>VS</span><b>' + match.teamB.map(displayPlayer).map(C.esc).join('<br><span>+</span><br>') + '</b></div><div class="c144Score"><input type="number" min="0" inputmode="numeric" aria-label="Games pareja A" data-padel144-score-a="' + match.id + '" value="' + (score.gamesA == null ? "" : score.gamesA) + '"><b>—</b><input type="number" min="0" inputmode="numeric" aria-label="Games pareja B" data-padel144-score-b="' + match.id + '" value="' + (score.gamesB == null ? "" : score.gamesB) + '"></div><div class="c144MatchActions"><button type="button" class="c144Primary" data-padel144-save-score="' + match.id + '">' + (played ? "Corregir" : "Guardar") + '</button>' + (played ? '<button type="button" class="c144Danger" data-padel144-delete-score="' + match.id + '">Deshacer</button>' : "") + '</div></article>';
  }

  function sessionDetailHtml(selected, championship) {
    if (!selected) return '<div class="c144Empty"><b>Selecciona o crea una sesión</b><span>Los partidos y resultados aparecerán aquí.</span></div>';
    var rounds = Object.create(null); selected.matches.forEach(function (match) { (rounds[match.round] || (rounds[match.round] = [])).push(match); });
    var scoring = scoringFor(championship), rows = standingsForSessions(state, [selected], championship), done = selected.matches.filter(completed).length;
    return '<section class="c144Card c144PadelPanel"><div class="c144PadelPanelHead"><div><span class="c144Eyebrow">' + (selected.championshipId ? "FECHA DEL CAMPEONATO" : "SESIÓN LIBRE") + '</span><h3>' + C.esc(selected.name) + '</h3><p>' + C.esc(selected.date) + ' · ' + selected.participants.length + ' jugadores · ' + selected.courts + ' pistas</p></div><span class="c144Chip">' + done + '/' + selected.matches.length + ' guardados</span></div><div class="c144Actions"><button type="button" class="c144Primary" data-padel144-save-all>Guardar toda la sesión</button></div><div class="c144Rounds">' + Object.keys(rounds).map(function (round) { return '<section class="c144Round"><header><b>Ronda ' + round + '</b><span>' + (selected.timerMode === "unlimited" ? "Sin límite" : selected.matchMinutes + " min") + '</span></header><div class="c144Matches">' + rounds[round].map(function (match) { return matchHtml(selected, match); }).join("") + '</div></section>'; }).join("") + '</div><div class="c144StandingsTools"><h4>Resumen de la sesión</h4></div>' + standingsTableHtml(rows, scoring) + '</section>';
  }

  function mixingOrderHtml(selected) {
    if (!selected) return '<section class="c144Card c144PadelPanel c145MixingEmpty"><div class="c144Empty"><b>El orden de juego aparecerá aquí</b><span>Selecciona jugadores, indica pistas y rondas, y pulsa “Generar partidos”.</span></div></section>';
    var rounds = Object.create(null); selected.matches.forEach(function (match) { (rounds[match.round] || (rounds[match.round] = [])).push(match); });
    return '<section class="c144Card c144PadelPanel"><div class="c144PadelPanelHead"><div><span class="c144Eyebrow">ORDEN DE JUEGO TEMPORAL</span><h3>Listo para llevar a la pista</h3><p>' + selected.participants.length + ' jugadores · ' + selected.courts + ' pistas · ' + selected.rounds + ' rondas</p></div><span class="c144Chip">No suma puntos</span></div><p class="c144Notice">Este mixing vive únicamente mientras está abierto. No se guarda como historial, no aparece en campeonatos y no modifica estadísticas.</p><div class="c144Rounds">' + Object.keys(rounds).map(function (round) { return '<section class="c144Round"><header><b>Ronda ' + round + '</b><span>Orden de juego</span></header><div class="c144Matches">' + rounds[round].map(function (match) { return '<article class="c144Match"><div class="c144MatchHead"><span>PARTIDO ' + match.order + '</span><b>Pista ' + C.esc(match.courtLabel) + '</b></div><div class="c144Versus"><b>' + match.teamA.map(displayPlayer).map(C.esc).join('<br><span>+</span><br>') + '</b><span>VS</span><b>' + match.teamB.map(displayPlayer).map(C.esc).join('<br><span>+</span><br>') + '</b></div><button type="button" class="c144Secondary" data-padel144-swap-mixing="' + match.id + '">Cambiar una pareja</button></article>'; }).join("") + '</div></section>'; }).join("") + '</div><div class="c144Actions"><button type="button" class="c144Secondary" data-padel144-regenerate-mixing>Regenerar cruces</button><button type="button" class="c144Danger" data-padel144-reset-mixing>Descartar mixing</button></div></section>';
  }

  function mixingHtml() {
    if (!mixingDraft) mixingDraft = defaultDraft("mixing"); draft = mixingDraft;
    var players = state.players.filter(function (player) { return player.active; });
    return '<main class="c144PadelPage"><div class="c145FlowSteps" aria-label="Flujo del mixing"><span class="active">1 · Jugadores</span><span>2 · Pistas</span><span>3 · Partidos</span></div><div class="c144PadelGrid"><section class="c144Card c144PadelPanel"><div class="c144PadelPanelHead"><div><span class="c144Eyebrow">MIXING OCASIONAL</span><h3>¿Quién juega hoy?</h3><p>Los niveles guardados se recuperan automáticamente.</p></div><span class="c144Chip" data-padel144-mixing-count>' + draft.participantIds.length + ' elegidos</span></div><label class="c144Field">Buscar por nombre o código<input data-padel144-picker-search placeholder="Diego o CP-0012" autocomplete="off"></label><div class="c144PlayerResults">' + (players.length ? players.map(function (player) { return playerOptionHtml(player, draft.participantIds.indexOf(player.id) >= 0); }).join("") : '<div class="c144Empty"><b>No hay jugadores activos</b><span>Créelos o reactívalos desde la pestaña Jugadores.</span></div>') + '</div><div class="c145MixingSetup"><label class="c144Field">Número de pistas<input type="number" min="1" max="40" inputmode="numeric" data-padel144-draft="courts" value="' + draft.courts + '"></label><label class="c144Field">Número de rondas<input type="number" min="1" max="50" inputmode="numeric" data-padel144-draft="rounds" value="' + draft.rounds + '"></label></div><div class="c144Actions"><button type="button" class="c144Primary" data-padel144-generate>Generar partidos</button></div><p class="c144Notice">Para añadir una persona nueva, ve a <b>Jugadores</b>. Así el directorio permanece ordenado y cada código se crea una sola vez.</p></section><div>' + mixingOrderHtml(mixingSession) + '</div></div></main>';
  }

  function championshipListHtml() {
    return state.championships.slice().sort(function (a, b) { return String(b.createdAt).localeCompare(String(a.createdAt)); }).map(function (championship) { var dates = state.sessions.filter(function (item) { return item.championshipId === championship.id; }).length; return '<button type="button" class="c144ChampButton ' + (championship.id === currentChampionshipId ? "active" : "") + '" data-padel144-champ="' + championship.id + '"><b>' + C.esc(championship.name) + '</b><span>' + dates + ' fechas · ' + (championship.status === "active" ? "Activo" : championship.status === "finished" ? "Finalizado" : "Archivado") + '</span></button>'; }).join("");
  }

  function championshipCreateHtml() {
    return '<section class="c144Card c144PadelPanel"><div class="c144PadelPanelHead"><div><span class="c144Eyebrow">NUEVO CAMPEONATO</span><h3>Crear competición</h3></div></div><div class="c144FormGrid"><label class="c144Field c144Wide">Nombre<input data-padel144-champ-name maxlength="80" placeholder="Ej.: Liga familiar 2026"></label><label class="c144Field">Inicio<input type="date" data-padel144-champ-start value="' + C.today() + '"></label><label class="c144Field">Fin opcional<input type="date" data-padel144-champ-end></label><label class="c144Field c144Wide">Sistema<select data-padel144-champ-mode><option value="games">Games ganados (mixing)</option><option value="points">Puntos por victoria/empate/derrota</option></select></label><label class="c144Field">Victoria<input type="number" min="0" data-padel144-champ-win value="3"></label><label class="c144Field">Empate<input type="number" min="0" data-padel144-champ-draw value="1"></label><label class="c144Field">Derrota<input type="number" min="0" data-padel144-champ-loss value="0"></label></div><div class="c144PadelPanelHead" style="margin-top:16px"><div><h4>Participantes</h4><p>Puedes modificarlos después.</p></div></div><div class="c144PlayerResults">' + state.players.filter(function (player) { return player.active; }).map(function (player) { return '<label class="c144PlayerPick"><input type="checkbox" data-padel144-new-champ-player="' + player.id + '"><span><b>' + C.esc(player.name) + ' — ' + C.esc(player.code) + '</b><small>' + levelLabel(player.currentLevel) + '</small></span></label>'; }).join("") + '</div><div class="c144Actions"><button type="button" class="c144Primary" data-padel144-create-champ>Crear campeonato</button></div></section>';
  }

  function levelReviewHtml(championship) {
    return '<section class="c144Card c144PadelPanel"><div class="c144PadelPanelHead"><div><span class="c144Eyebrow">REVISIÓN MANUAL DE NIVELES</span><h3>Subir, mantener o bajar</h3><p>Nunca se cambia automáticamente. Cada cambio conserva su trazabilidad.</p></div></div><div class="c144LevelReview">' + championship.participantIds.map(function (playerId) { var player = playerById(playerId); if (!player) return ""; return '<div class="c144LevelRow"><div><b>' + C.esc(player.name) + ' — ' + C.esc(player.code) + '</b><small>Nivel actual: ' + levelLabel(player.currentLevel) + '</small></div><label class="c144Field">Nuevo nivel<select data-padel144-review-level="' + player.id + '"><option value="bajo" ' + (player.currentLevel === "bajo" ? "selected" : "") + '>Bajo</option><option value="medio" ' + (player.currentLevel === "medio" ? "selected" : "") + '>Medio</option><option value="alto" ' + (player.currentLevel === "alto" ? "selected" : "") + '>Alto</option></select></label><label class="c144Field">Motivo opcional<input data-padel144-review-reason="' + player.id + '" maxlength="140"></label><button type="button" class="c144Secondary" data-padel144-apply-level="' + player.id + '">Confirmar</button></div>'; }).join("") + '</div></section>';
  }

  function championshipDetailHtml(championship) {
    if (!championship) return '<div class="c144Empty"><b>Elige o crea un campeonato</b><span>Aquí aparecerán sus fechas y la clasificación acumulada.</span></div>';
    var sessions = state.sessions.filter(function (item) { return item.championshipId === championship.id; }).sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); }), rows = sortedStandings(championshipStandings(state, championship.id), standingsSort), selected = sessionById(currentSessionId);
    if (!draft || draft.championshipId !== championship.id) draft = defaultDraft("championship-date", championship);
    return '<section class="c144Card c144ChampHeader"><div><span class="c144Eyebrow">' + (championship.status === "active" ? "CAMPEONATO ACTIVO" : championship.status === "finished" ? "CAMPEONATO FINALIZADO" : "CAMPEONATO ARCHIVADO") + '</span><h3>' + C.esc(championship.name) + '</h3><p>' + C.esc(championship.startDate) + (championship.endDate ? ' → ' + C.esc(championship.endDate) : '') + ' · ' + championship.participantIds.length + ' participantes · ' + sessions.length + ' fechas</p></div><div class="c144Actions">' + (championship.status === "active" ? '<button type="button" class="c144Secondary" data-padel144-finish-champ>Finalizar</button>' : championship.status === "finished" ? '<button type="button" class="c144Secondary" data-padel144-reopen-champ>Reabrir</button><button type="button" class="c144Danger" data-padel144-archive-champ>Archivar</button>' : '') + '</div></section><section class="c144Card c144PadelPanel"><div class="c144PadelPanelHead"><div><span class="c144Eyebrow">CLASIFICACIÓN ACUMULADA</span><h3>Jornada tras jornada</h3></div><label class="c144Field">Ordenar<select data-padel144-sort><option value="position" ' + (standingsSort === "position" ? "selected" : "") + '>Posición</option><option value="points" ' + (standingsSort === "points" ? "selected" : "") + '>Puntos</option><option value="won" ' + (standingsSort === "won" ? "selected" : "") + '>Partidos ganados</option><option value="gameDifference" ' + (standingsSort === "gameDifference" ? "selected" : "") + '>Diferencia de games</option></select></label></div>' + standingsTableHtml(rows, championship.scoring) + '</section><section class="c144Card c144PadelPanel"><div class="c144PadelPanelHead"><div><span class="c144Eyebrow">PARTICIPANTES</span><h3>Plantilla del campeonato</h3></div></div><div class="c144PlayerResults">' + state.players.filter(function (player) { return player.active || championship.participantIds.indexOf(player.id) >= 0; }).map(function (player) { return playerOptionHtml(player, championship.participantIds.indexOf(player.id) >= 0).replace('data-padel144-player=', 'data-padel144-champ-player='); }).join("") + '</div><div class="c144Actions"><button type="button" class="c144Secondary" data-padel144-save-participants>Guardar participantes</button></div></section>' + (championship.status === "active" ? '<section class="c144Card c144PadelPanel"><div class="c144PadelPanelHead"><div><span class="c144Eyebrow">NUEVA FECHA</span><h3>Añadir jornada dentro del campeonato</h3></div></div><div class="c144FormGrid"><label class="c144Field">Nombre<input data-padel144-draft="name" value="' + C.esc(draft.name) + '"></label><label class="c144Field">Fecha<input type="date" data-padel144-draft="date" value="' + C.esc(draft.date) + '"></label><label class="c144Field">Pistas<input type="number" min="1" max="40" data-padel144-draft="courts" value="' + draft.courts + '"></label><label class="c144Field">Rondas<input type="number" min="1" max="50" data-padel144-draft="rounds" value="' + draft.rounds + '"></label><label class="c144Field c144Wide">Nombres de pista<input data-padel144-draft="courtLabels" value="' + C.esc(draft.courtLabels) + '"></label></div><div class="c144Actions"><button type="button" class="c144Primary" data-padel144-generate-date>Crear fecha</button></div></section>' : '') + '<section class="c144Card c144PadelPanel"><div class="c144PadelPanelHead"><div><span class="c144Eyebrow">FECHAS DEL CAMPEONATO</span><h3>Historial sin límite</h3></div><span class="c144Chip">' + sessions.length + ' fechas</span></div><div class="c144DateCards">' + (sessions.length ? sessions.map(function (item) { var completeCount = item.matches.filter(completed).length; return '<article class="c144DateCard"><header><span>' + C.esc(item.date) + '</span><span class="c144Chip">' + completeCount + '/' + item.matches.length + '</span></header><h4>' + C.esc(item.name) + '</h4><p>' + item.participants.length + ' jugadores · ' + item.matches.length + ' partidos</p><button type="button" class="c144Secondary" data-padel144-open-session="' + item.id + '">Abrir resultados</button></article>'; }).join("") : '<div class="c144Empty"><b>Aún no hay fechas</b><span>Un campeonato puede acumular 20, 30 o todas las fechas que necesites.</span></div>') + '</div></section>' + (selected && selected.championshipId === championship.id ? sessionDetailHtml(selected, championship) : '') + (championship.status !== "active" ? levelReviewHtml(championship) : '');
  }

  function championshipsHtml() {
    var championship = championshipById(currentChampionshipId);
    return '<main class="c144PadelPage"><div class="c144ChampLayout"><aside class="c144ChampSidebar">' + championshipCreateHtml() + '<section class="c144Card c144PadelPanel"><div class="c144PadelPanelHead"><div><span class="c144Eyebrow">CAMPEONATOS</span><h3>Activos y anteriores</h3></div></div>' + (state.championships.length ? championshipListHtml() : '<div class="c144Empty"><b>Sin campeonatos</b></div>') + '</section></aside><div>' + championshipDetailHtml(championship) + '</div></div></main>';
  }

  function profileHtml(player) {
    if (!player) return ""; var stats = playerStats(state, player.id), history = stats.history;
    return '<section class="c144Profile"><div class="c144Card c144ProfileHero"><div><span class="c144Eyebrow">FICHA INDIVIDUAL</span><h3>' + C.esc(player.name) + ' — ' + C.esc(player.code) + '</h3><p>Creado el ' + C.esc(String(player.createdAt).slice(0, 10)) + ' · ' + (player.active ? "Activo" : "Inactivo") + '</p></div><div><span class="c144Chip ' + player.currentLevel + '">Nivel ' + levelLabel(player.currentLevel) + '</span><div class="c144Actions"><button type="button" class="c144Secondary" data-padel144-toggle-player="' + player.id + '">' + (player.active ? "Desactivar" : "Reactivar") + '</button></div></div></div><div class="c144MetricGrid">' + [[stats.championships, "Campeonatos"], [stats.dates, "Fechas"], [stats.played, "Partidos"], [stats.won, "Ganados"], [stats.lost, "Perdidos"], [stats.gamesWon, "Games ganados"], [stats.gamesLost, "Games perdidos"], [(stats.gameDifference > 0 ? "+" : "") + stats.gameDifference, "Diferencia"], [stats.points, "Puntos"]].map(function (item) { return '<div class="c144Metric"><b>' + item[0] + '</b><span>' + item[1] + '</span></div>'; }).join("") + '</div><section class="c144Card c144PadelPanel"><div class="c144PadelPanelHead"><div><span class="c144Eyebrow">HISTORIAL CRONOLÓGICO</span><h3>Partidos, parejas y rivales</h3></div></div><div class="c144FormGrid"><label class="c144Field">Campeonato<select data-padel144-history-champ><option value="">Todos</option>' + state.championships.map(function (item) { return '<option value="' + item.id + '">' + C.esc(item.name) + '</option>'; }).join("") + '</select></label><label class="c144Field">Desde<input type="date" data-padel144-history-from></label><label class="c144Field">Hasta<input type="date" data-padel144-history-to></label></div><div class="c144History" data-padel144-history-list>' + historyRowsHtml(history) + '</div></section><section class="c144Card c144PadelPanel"><div class="c144PadelPanelHead"><div><span class="c144Eyebrow">CAMBIOS DE NIVEL</span><h3>Trazabilidad</h3></div></div>' + (player.levelHistory.length ? player.levelHistory.slice().reverse().map(function (entry) { var championship = championshipById(entry.championshipId); return '<div class="c144HistoryRow"><span>' + C.esc(String(entry.date).slice(0, 10)) + '</span><b>' + levelLabel(entry.previousLevel) + ' → ' + levelLabel(entry.newLevel) + '</b><small>' + C.esc(championship && championship.name || "Cambio manual") + (entry.reason ? ' · ' + C.esc(entry.reason) : '') + '</small></div>'; }).join("") : '<div class="c144Empty"><b>Sin cambios</b><span>El nivel actual se mantiene hasta una revisión manual.</span></div>') + '</section></section>';
  }

  function historyRowsHtml(history) {
    return history.length ? history.map(function (row) { return '<article class="c144HistoryRow" data-history-champ="' + (row.championshipId || "") + '" data-history-date="' + row.date + '"><span>' + C.esc(row.date) + '<br><small>' + C.esc(row.championshipName) + '</small></span><div><b>' + C.esc(row.sessionName) + ' · ' + row.gamesWon + '–' + row.gamesLost + ' · ' + row.result + '</b><br><small>Pareja: ' + C.esc(row.partners.join(", ") || "—") + ' · Rivales: ' + C.esc(row.rivals.join(", ")) + '</small></div><span class="c144Chip ' + row.levelSnapshot + '">' + levelLabel(row.levelSnapshot) + '</span></article>'; }).join("") : '<div class="c144Empty"><b>Sin partidos todavía</b><span>Los resultados aparecerán aquí al guardarse.</span></div>';
  }

  function playersHtml() {
    var player = playerById(selectedPlayerId);
    return '<main class="c144PadelPage"><section class="c144Card c144PadelPanel"><div class="c144PadelPanelHead"><div><span class="c144Eyebrow">JUGADORES · ADMINISTRACIÓN ÚNICA</span><h3>Directorio del club</h3><p>Aquí se crean, editan, nivelan y activan todas las personas.</p></div><button type="button" class="c144Primary" data-padel144-toggle-add-player>Añadir jugador</button></div><div class="c145AddPlayer" data-padel144-add-panel hidden><h4>Nuevo jugador</h4>' + createPlayerFormHtml("directory") + '</div><div class="c144PlayerFilters c145PlayerFilters"><label class="c144Field">Nombre o código<input data-padel144-directory-search placeholder="Diego o CP-0012" autocomplete="off"></label><label class="c144Field">Nivel<select data-padel144-directory-level><option value="">Todos</option><option value="bajo">Bajo</option><option value="medio">Medio</option><option value="alto">Alto</option></select></label><label class="c144Field">Estado<select data-padel144-directory-status><option value="">Todos</option><option value="active">Activos</option><option value="inactive">Inactivos</option></select></label></div><div class="c145DirectorySummary"><b>' + state.players.length + ' jugadores</b><span>Los puntos proceden exclusivamente de campeonatos.</span></div><div class="c145PlayerDirectory" data-padel144-directory>' + (state.players.length ? directoryCardsHtml(state.players) : '<div class="c144Empty"><b>Aún no hay jugadores</b><span>Pulsa “Añadir jugador” para crear el primero.</span></div>') + '</div></section>' + (player ? profileHtml(player) : '<div class="c144Empty"><b>Abre una ficha para consultar su historial</b><span>Los mixings ocasionales no aparecerán ni sumarán puntos.</span></div>') + '</main>';
  }

  function directoryCardsHtml(players) {
    var points = championshipPointsMap(state);
    return players.map(function (player) { return '<article class="c145PlayerAdmin ' + (player.active ? "" : "inactive") + '" data-padel144-player-card data-search="' + C.esc((player.name + " " + player.code).toLocaleLowerCase("es")) + '" data-level="' + player.currentLevel + '" data-status="' + (player.active ? "active" : "inactive") + '"><div class="c145PlayerIdentity"><button type="button" data-padel144-profile="' + player.id + '" aria-label="Abrir ficha de ' + C.esc(player.name) + '"><b>' + C.esc(player.name) + '</b><span>' + C.esc(player.code) + ' · ' + (player.active ? "Activo" : "Inactivo") + '</span></button><div><b>' + (points[player.id] || 0) + '</b><span>puntos</span></div></div><div class="c145PlayerAdminActions"><label class="c144Field">Nivel<select data-padel144-player-level="' + player.id + '"><option value="bajo" ' + (player.currentLevel === "bajo" ? "selected" : "") + '>Bajo</option><option value="medio" ' + (player.currentLevel === "medio" ? "selected" : "") + '>Medio</option><option value="alto" ' + (player.currentLevel === "alto" ? "selected" : "") + '>Alto</option></select></label><button type="button" class="c144Secondary" data-padel144-edit-player="' + player.id + '">Editar nombre</button><button type="button" class="' + (player.active ? "c144Danger" : "c144Secondary") + '" data-padel144-toggle-player="' + player.id + '">' + (player.active ? "Dar de baja" : "Dar de alta") + '</button></div></article>'; }).join("");
  }

  function render() {
    var body = C.body(); if (!body || !state) return;
    C.setModalTitle("Coco Pádel", "HERRAMIENTA ILIMITADA · v145.0");
    body.innerHTML = '<div class="c144Padel c145Padel">' + heroHtml() + navHtml() + (view === "mixing" ? mixingHtml() : view === "championship" ? championshipsHtml() : playersHtml()) + '</div>';
  }

  async function createPlayerFromForm(context) {
    var body = C.body(), nameInput = body.querySelector("[data-padel144-new-name]"), levelInput = body.querySelector("[data-padel144-new-level]"), name = String(nameInput && nameInput.value || "").trim();
    if (!name) { C.toast("Escribe el nombre del jugador.", "bad"); return; }
    var duplicate = state.players.some(function (player) { return player.name.toLocaleLowerCase("es") === name.toLocaleLowerCase("es"); });
    if (duplicate && !confirm("Ya existe al menos un jugador llamado " + name + ". ¿Es otra persona y quieres crearla con un código diferente?")) return;
    var result = createPlayer(state, name, levelInput && levelInput.value); selectedPlayerId = result.player.id;
    await persist(true); C.toast(result.player.name + " creado como " + result.player.code + ".", "good"); render();
  }

  async function createChampionship() {
    var body = C.body(), name = String(body.querySelector("[data-padel144-champ-name]").value || "").trim(); if (!name) { C.toast("Escribe el nombre del campeonato.", "bad"); return; }
    var participantIds = Array.prototype.slice.call(body.querySelectorAll("[data-padel144-new-champ-player]:checked")).map(function (input) { return input.dataset.padel144NewChampPlayer; });
    var championship = { id: C.id("champ"), name: name, startDate: body.querySelector("[data-padel144-champ-start]").value || C.today(), endDate: body.querySelector("[data-padel144-champ-end]").value || "", status: "active", participantIds: participantIds, scoring: { mode: body.querySelector("[data-padel144-champ-mode]").value === "games" ? "games" : "points", win: Math.max(0, Number(body.querySelector("[data-padel144-champ-win]").value) || 0), draw: Math.max(0, Number(body.querySelector("[data-padel144-champ-draw]").value) || 0), loss: Math.max(0, Number(body.querySelector("[data-padel144-champ-loss]").value) || 0), tiebreakers: ["points", "gameDifference", "gamesWon", "headToHead"] }, createdAt: iso(), finishedAt: null, archivedAt: null };
    state.championships.push(championship); currentChampionshipId = championship.id; draft = defaultDraft("championship-date", championship); state.auditLog.push({ id: C.id("audit"), type: "championship-created", championshipId: championship.id, at: iso() }); await persist(true); C.toast("Campeonato creado.", "good"); render();
  }

  function updateDraftFrom(input) {
    if (!draft) return; var key = input.dataset.padel144Draft, value = input.type === "number" ? Number(input.value) : input.value; draft[key] = value;
  }

  async function saveSingleResult(matchId) {
    var selected = sessionById(currentSessionId), body = C.body(); if (!selected) return;
    var a = body.querySelector('[data-padel144-score-a="' + selectorValue(matchId) + '"]'), b = body.querySelector('[data-padel144-score-b="' + selectorValue(matchId) + '"]');
    try { saveResult(state, selected.id, matchId, a && a.value, b && b.value); await persist(true); C.toast("Resultado guardado y estadísticas recalculadas.", "good"); render(); } catch (error) { C.toast(error.message, "bad"); }
  }

  async function saveAllResults() {
    var selected = sessionById(currentSessionId), body = C.body(); if (!selected) return; var saved = 0, invalid = 0;
    selected.matches.forEach(function (match) { var a = body.querySelector('[data-padel144-score-a="' + selectorValue(match.id) + '"]'), b = body.querySelector('[data-padel144-score-b="' + selectorValue(match.id) + '"]'), av = a && a.value, bv = b && b.value; if (av === "" && bv === "") return; if (av === "" || bv === "") { invalid++; return; } saveResult(state, selected.id, match.id, av, bv); saved++; });
    if (invalid) { C.toast("Hay " + invalid + " partidos con un solo marcador. Completa ambos campos.", "bad"); return; } if (!saved) { C.toast("No hay resultados nuevos para guardar."); return; }
    await persist(true); C.toast(saved + " resultados guardados sin duplicar estadísticas.", "good"); C.sound("finish"); render();
  }

  function filterDirectory() {
    var body = C.body(), search = body.querySelector("[data-padel144-directory-search]"), levelSelect = body.querySelector("[data-padel144-directory-level]"), statusSelect = body.querySelector("[data-padel144-directory-status]"); if (!search || !levelSelect || !statusSelect) return;
    var query = String(search.value || "").toLocaleLowerCase("es"), targetLevel = levelSelect.value, targetStatus = statusSelect.value; directoryStatus = targetStatus;
    body.querySelectorAll("[data-padel144-player-card]").forEach(function (card) { card.hidden = Boolean(query && card.dataset.search.indexOf(query) < 0 || targetLevel && card.dataset.level !== targetLevel || targetStatus && card.dataset.status !== targetStatus); });
  }

  function filterHistory() {
    var body = C.body(), championship = body.querySelector("[data-padel144-history-champ]").value, from = body.querySelector("[data-padel144-history-from]").value, to = body.querySelector("[data-padel144-history-to]").value;
    body.querySelectorAll("[data-history-date]").forEach(function (row) { var date = row.dataset.historyDate; row.hidden = Boolean(championship && row.dataset.historyChamp !== championship || from && date < from || to && date > to); });
  }

  async function handleClick(event) {
    var button = event.target.closest("button"); if (!button) return;
    if (button.dataset.padel144View) { if (view === "mixing" && draft && draft.kind === "mixing") mixingDraft = draft; view = button.dataset.padel144View; currentSessionId = null; selectedPlayerId = null; draft = view === "mixing" ? mixingDraft : null; render(); return; }
    if (button.hasAttribute("data-padel144-toggle-add-player")) { var panel = C.body().querySelector("[data-padel144-add-panel]"); if (panel) { panel.hidden = !panel.hidden; if (!panel.hidden) { var nameField = panel.querySelector("[data-padel144-new-name]"); if (nameField) nameField.focus(); } } return; }
    if (button.dataset.padel144CreatePlayer) { await createPlayerFromForm(button.dataset.padel144CreatePlayer); return; }
    if (button.hasAttribute("data-padel144-generate") || button.hasAttribute("data-padel144-generate-date")) {
      try { var selected = generateSession(draft); currentSessionId = selected.id; if (selected.championshipId) { currentChampionshipId = selected.championshipId; await persist(true); } C.toast((selected.championshipId ? "Fecha guardada" : "Mixing temporal creado") + ": " + selected.matches.length + " partidos equilibrados.", "good"); render(); } catch (error) { C.toast(error.message, "bad"); } return;
    }
    if (button.hasAttribute("data-padel144-regenerate-mixing")) { try { mixingSession = generateSession(draft); currentSessionId = mixingSession.id; C.toast("Cruces regenerados. Nada se ha guardado en el historial.", "good"); render(); } catch (error) { C.toast(error.message, "bad"); } return; }
    if (button.hasAttribute("data-padel144-reset-mixing")) { if (!confirm("¿Descartar este mixing temporal? No afectará a jugadores ni campeonatos.")) return; mixingSession = null; currentSessionId = null; mixingDraft = defaultDraft("mixing"); draft = mixingDraft; render(); return; }
    if (button.dataset.padel144SwapMixing) { var mixingMatch = mixingSession && mixingSession.matches.find(function (match) { return match.id === button.dataset.padel144SwapMixing; }); if (!mixingMatch || mixingMatch.teamA.length < 2 || mixingMatch.teamB.length < 1) return; var swapped = mixingMatch.teamA[1]; mixingMatch.teamA[1] = mixingMatch.teamB[0]; mixingMatch.teamB[0] = swapped; C.toast("Pareja ajustada solo para este mixing.", "good"); render(); return; }
    if (button.dataset.padel144OpenSession) { currentSessionId = button.dataset.padel144OpenSession; var selectedSession = sessionById(currentSessionId); if (selectedSession && selectedSession.championshipId) { currentChampionshipId = selectedSession.championshipId; view = "championship"; } render(); return; }
    if (button.dataset.padel144SaveScore) { await saveSingleResult(button.dataset.padel144SaveScore); return; }
    if (button.dataset.padel144DeleteScore) { if (!confirm("¿Deshacer este resultado? La clasificación y los historiales se recalcularán.")) return; deleteResult(state, currentSessionId, button.dataset.padel144DeleteScore); await persist(true); C.toast("Resultado eliminado y estadísticas recalculadas.", "good"); render(); return; }
    if (button.hasAttribute("data-padel144-save-all")) { await saveAllResults(); return; }
    if (button.hasAttribute("data-padel144-create-champ")) { await createChampionship(); return; }
    if (button.dataset.padel144Champ) { currentChampionshipId = button.dataset.padel144Champ; currentSessionId = null; draft = null; render(); return; }
    if (button.hasAttribute("data-padel144-save-participants")) { var championship = championshipById(currentChampionshipId); championship.participantIds = Array.prototype.slice.call(C.body().querySelectorAll("[data-padel144-champ-player]:checked")).map(function (input) { return input.dataset.padel144ChampPlayer; }); state.updatedAt = iso(); draft = defaultDraft("championship-date", championship); await persist(true); C.toast("Participantes actualizados.", "good"); render(); return; }
    if (button.hasAttribute("data-padel144-finish-champ")) { if (!confirm("¿Finalizar el campeonato y abrir la revisión manual de niveles?")) return; var finishing = championshipById(currentChampionshipId); finishing.status = "finished"; finishing.finishedAt = iso(); state.auditLog.push({ id: C.id("audit"), type: "championship-finished", championshipId: finishing.id, at: finishing.finishedAt }); await persist(true); render(); return; }
    if (button.hasAttribute("data-padel144-reopen-champ")) { if (!confirm("¿Reabrir este campeonato para añadir o corregir fechas?")) return; var reopening = championshipById(currentChampionshipId); reopening.status = "active"; reopening.finishedAt = null; await persist(true); render(); return; }
    if (button.hasAttribute("data-padel144-archive-champ")) { if (!confirm("¿Archivar este campeonato? Seguirá disponible para consulta.")) return; var archive = championshipById(currentChampionshipId); archive.status = "archived"; archive.archivedAt = iso(); await persist(true); render(); return; }
    if (button.dataset.padel144ApplyLevel) { var playerId = button.dataset.padel144ApplyLevel, select = C.body().querySelector('[data-padel144-review-level="' + selectorValue(playerId) + '"]'), reason = C.body().querySelector('[data-padel144-review-reason="' + selectorValue(playerId) + '"]'), player = playerById(playerId); if (!player) return; if (select.value === player.currentLevel) { C.toast("Nivel mantenido. No se crea un cambio innecesario."); return; } if (!confirm("Cambiar a " + levelLabel(select.value) + " el nivel de " + player.name + "?")) return; changePlayerLevel(state, playerId, select.value, currentChampionshipId, reason && reason.value); await persist(true); C.toast("Nivel actualizado; los partidos anteriores conservan su nivel histórico.", "good"); render(); return; }
    if (button.dataset.padel144Profile) { selectedPlayerId = button.dataset.padel144Profile; render(); return; }
    if (button.dataset.padel144EditPlayer) { var editing = playerById(button.dataset.padel144EditPlayer); if (!editing) return; var renamed = prompt("Nombre del jugador " + editing.code, editing.name); if (renamed == null) return; renamed = String(renamed).trim(); if (!renamed) { C.toast("El nombre no puede quedar vacío.", "bad"); return; } var sameName = state.players.some(function (item) { return item.id !== editing.id && item.name.toLocaleLowerCase("es") === renamed.toLocaleLowerCase("es"); }); if (sameName && !confirm("Ya existe otra persona llamada " + renamed + ". ¿Quieres conservar ambas diferenciadas por su código?")) return; editing.name = renamed; state.auditLog.push({ id: C.id("audit"), type: "player-renamed", playerId: editing.id, at: iso() }); await persist(true); C.toast("Nombre actualizado. El código " + editing.code + " no cambió.", "good"); render(); return; }
    if (button.dataset.padel144TogglePlayer) { var toggle = playerById(button.dataset.padel144TogglePlayer); if (!toggle || !confirm((toggle.active ? "¿Desactivar" : "¿Reactivar") + " a " + toggle.name + " — " + toggle.code + "?")) return; toggle.active = !toggle.active; state.auditLog.push({ id: C.id("audit"), type: toggle.active ? "player-reactivated" : "player-deactivated", playerId: toggle.id, at: iso() }); await persist(true); render(); }
  }

  function handleChange(event) {
    var input = event.target;
    if (input.dataset.padel144Draft) { updateDraftFrom(input); if (input.dataset.padel144Draft === "timerMode") render(); return; }
    if (input.dataset.padel144Player && draft) { var playerId = input.dataset.padel144Player, index = draft.participantIds.indexOf(playerId); if (input.checked && index < 0) draft.participantIds.push(playerId); else if (!input.checked && index >= 0) draft.participantIds.splice(index, 1); if (draft.kind === "mixing") { mixingDraft = draft; var counter = C.body().querySelector("[data-padel144-mixing-count]"); if (counter) counter.textContent = draft.participantIds.length + " elegidos"; } return; }
    if (input.dataset.padel144Sort) { standingsSort = input.value; render(); return; }
    if (input.dataset.padel144PlayerLevel) { var player = playerById(input.dataset.padel144PlayerLevel); if (!player) return; var nextLevel = level(input.value); if (nextLevel === player.currentLevel) return; if (!confirm("¿Cambiar a nivel " + levelLabel(nextLevel) + " a " + player.name + " — " + player.code + "?")) { render(); return; } changePlayerLevel(state, player.id, nextLevel, null, "Cambio manual desde Jugadores"); persist(true).then(function () { C.toast("Nivel actualizado para las próximas partidas.", "good"); render(); }); return; }
    if (input.matches("[data-padel144-directory-search],[data-padel144-directory-level],[data-padel144-directory-status]")) { filterDirectory(); return; }
    if (input.matches("[data-padel144-history-champ],[data-padel144-history-from],[data-padel144-history-to]")) filterHistory();
  }

  function handleInput(event) {
    var input = event.target;
    if (input.dataset.padel144PickerSearch) { var query = String(input.value || "").toLocaleLowerCase("es"); C.body().querySelectorAll(".c144PlayerPick").forEach(function (row) { row.hidden = Boolean(query && String(row.textContent || "").toLocaleLowerCase("es").indexOf(query) < 0); }); }
    if (input.dataset.padel144DirectorySearch) filterDirectory();
  }

  async function open() {
    C.openModal({ module: "padel", title: "Coco Pádel", kicker: "HERRAMIENTA ILIMITADA · v145.0", html: '<div class="c144Empty"><b>Coco está cargando el club…</b></div>', dispose: dispose });
    state = await loadState(); if (!C.body()) return;
    currentChampionshipId = state.championships.find(function (item) { return item.status === "active"; }) && state.championships.find(function (item) { return item.status === "active"; }).id || state.championships[0] && state.championships[0].id || null;
    controller = new AbortController(); C.body().addEventListener("click", handleClick, { signal: controller.signal }); C.body().addEventListener("change", handleChange, { signal: controller.signal }); C.body().addEventListener("input", handleInput, { signal: controller.signal });
    view = "mixing"; currentSessionId = null; selectedPlayerId = null; mixingDraft = null; draft = null; render();
  }

  function dispose() { if (controller) controller.abort(); controller = null; draft = null; mixingDraft = null; mixingSession = null; currentSessionId = null; busy = false; }

  var api = {
    version: "145.0.0", open: open, normalize: normalizeState, blankState: blankState, createPlayer: createPlayer,
    saveResult: saveResult, deleteResult: deleteResult, changePlayerLevel: changePlayerLevel,
    championshipStandings: championshipStandings, standingsForSessions: standingsForSessions,
    playerHistory: playerHistory, playerStats: playerStats, championshipPointsMap: championshipPointsMap,
    audit: function (targetState) {
      targetState = normalizeState(targetState || state || blankState());
      var codes = targetState.players.map(function (player) { return player.code; });
      return { version: targetState.version, topTabs: ["Mixing", "Campeonato", "Jugadores"], playerCreationArea: "Jugadores", unlimited: true, mixingPersisted: false, mixingAffectsPoints: false, playerCount: targetState.players.length, uniqueCodes: new Set(codes).size === codes.length, codesImmutable: true, statsDerivedFromResults: true, playerPointsSource: "championship-results-only", levelsAutomatic: false, championshipDates: targetState.sessions.filter(function (item) { return Boolean(item.championshipId); }).length, championships: targetState.championships.length };
    }
  };
  root.CocoPadelV145 = api;
  root.CocoPadelV144 = api;
})(window);
