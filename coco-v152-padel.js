(function (root) {
  "use strict";

  var C = root.CocoV144;
  if (!C || root.CocoPadelV152) return;

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
  var mixingScreen = "home";
  var mixingStep = 1;
  var championshipScreen = "home";
  var championshipCreateStep = 1;
  var championshipDraft = null;
  var rankingChampionshipId = null;
  var archivedVisible = false;
  var dateFormOpen = false;
  var participantsOpen = false;

  function iso() { return new Date().toISOString(); }
  function level(value) { return ["bajo", "medio", "alto"].indexOf(String(value || "").toLowerCase()) >= 0 ? String(value).toLowerCase() : "medio"; }
  function levelLabel(value) { return value === "alto" ? "Alto" : value === "bajo" ? "Bajo" : "Medio"; }
  function number(value) { value = Number(value); return Number.isFinite(value) && value >= 0 ? value : null; }
  function normalizeSearch(value) { return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es").trim(); }
  function scoreFromSets(rawSets) {
    var sets = (Array.isArray(rawSets) ? rawSets : []).map(function (set) {
      var a = number(set && set.a), b = number(set && set.b);
      return a == null || b == null ? null : { a: a, b: b };
    }).filter(Boolean);
    if (!sets.length) return null;
    var gamesA = 0, gamesB = 0, setsA = 0, setsB = 0;
    sets.forEach(function (set) { gamesA += set.a; gamesB += set.b; if (set.a > set.b) setsA++; else if (set.b > set.a) setsB++; });
    return { sets: sets, gamesA: gamesA, gamesB: gamesB, setsA: setsA, setsB: setsB };
  }
  function normalizeScore(rawScore, legacyA, legacyB) {
    if (rawScore && Array.isArray(rawScore.sets) && rawScore.sets.length) return scoreFromSets(rawScore.sets);
    var a = number(rawScore && rawScore.gamesA != null ? rawScore.gamesA : legacyA);
    var b = number(rawScore && rawScore.gamesB != null ? rawScore.gamesB : legacyB);
    return a == null || b == null ? null : scoreFromSets([{ a: a, b: b }]);
  }
  function scoreText(score) { return score && Array.isArray(score.sets) ? score.sets.map(function (set) { return set.a + "-" + set.b; }).join(" · ") : ""; }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function selectorValue(value) { return String(value || "").replace(/([\\"'\\[\\]#.:])/g, "\\$1"); }
  function playerById(playerId) { return state && state.players.find(function (item) { return item.id === playerId; }) || null; }
  function championshipById(championshipId) { return state && state.championships.find(function (item) { return item.id === championshipId; }) || null; }
  function sessionById(sessionId) { return mixingSession && mixingSession.id === sessionId ? mixingSession : state && state.sessions.find(function (item) { return item.id === sessionId; }) || null; }
  function displayPlayer(playerId) { var player = playerById(playerId); return player ? player.name + " — " + player.code : "Jugador no disponible"; }

  function blankState() {
    return { version: 4, nextPlayerNumber: 1, players: [], championships: [], sessions: [], auditLog: [], updatedAt: iso() };
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
          var normalizedScore = normalizeScore(match.score, match.gamesA != null ? match.gamesA : match.scoreA, match.gamesB != null ? match.gamesB : match.scoreB);
          return { id: String(match.id || C.id("match")), order: Number(match.order) || matchIndex + 1, round: Number(match.round) || 1, court: Number(match.court) || 1, courtLabel: String(match.courtLabel || match.court || 1), teamA: (match.teamA || []).map(String), teamB: (match.teamB || []).map(String), score: normalizedScore, updatedAt: match.updatedAt || null };
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
    output.version = 4;
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

  function completed(match) {
    if (!match || !match.score) return false;
    var score = normalizeScore(match.score);
    return Boolean(score && score.sets.length && score.setsA !== score.setsB);
  }

  function standingsForSessions(targetState, sessions, championship) {
    var rows = Object.create(null), direct = Object.create(null), scoring = scoringFor(championship);
    function ensure(playerId, snapshot) {
      if (!rows[playerId]) {
        var player = targetState.players.find(function (item) { return item.id === playerId; });
        rows[playerId] = {
          id: playerId, code: player && player.code || snapshot && snapshot.codeSnapshot || "",
          name: player && player.name || snapshot && snapshot.nameSnapshot || "Jugador",
          played: 0, won: 0, drawn: 0, lost: 0,
          setsWon: 0, setsLost: 0, setDifference: 0,
          gamesWon: 0, gamesLost: 0, gameDifference: 0,
          points: 0, position: 0
        };
      }
      return rows[playerId];
    }
    sessions.forEach(function (session) {
      var snapshots = Object.create(null);
      session.participants.forEach(function (entry) { snapshots[entry.playerId] = entry; ensure(entry.playerId, entry); });
      session.matches.forEach(function (match) {
        if (!completed(match)) return;
        var score = normalizeScore(match.score), a = score.gamesA, b = score.gamesB, setsA = score.setsA, setsB = score.setsB, comparison = setsA > setsB ? 1 : -1;
        match.teamA.concat(match.teamB).forEach(function (playerId) { ensure(playerId, snapshots[playerId]).played++; });
        match.teamA.forEach(function (playerId) {
          var row = ensure(playerId, snapshots[playerId]);
          row.gamesWon += a; row.gamesLost += b; row.setsWon += setsA; row.setsLost += setsB;
          if (comparison > 0) row.won++; else row.lost++;
          row.points += scoring.mode === "games" ? a : comparison > 0 ? scoring.win : scoring.loss;
          match.teamB.forEach(function (opponent) { (direct[playerId] || (direct[playerId] = Object.create(null)))[opponent] = ((direct[playerId] || {})[opponent] || 0) + (setsA - setsB) * 100 + (a - b); });
        });
        match.teamB.forEach(function (playerId) {
          var row = ensure(playerId, snapshots[playerId]);
          row.gamesWon += b; row.gamesLost += a; row.setsWon += setsB; row.setsLost += setsA;
          if (comparison < 0) row.won++; else row.lost++;
          row.points += scoring.mode === "games" ? b : comparison < 0 ? scoring.win : scoring.loss;
          match.teamA.forEach(function (opponent) { (direct[playerId] || (direct[playerId] = Object.create(null)))[opponent] = ((direct[playerId] || {})[opponent] || 0) + (setsB - setsA) * 100 + (b - a); });
        });
      });
    });
    return Object.keys(rows).map(function (key) {
      rows[key].setDifference = rows[key].setsWon - rows[key].setsLost;
      rows[key].gameDifference = rows[key].gamesWon - rows[key].gamesLost;
      return rows[key];
    }).sort(function (a, b) {
      return b.points - a.points || b.setDifference - a.setDifference || b.gameDifference - a.gameDifference || b.setsWon - a.setsWon || b.gamesWon - a.gamesWon || Number((direct[b.id] || {})[a.id] || 0) - Number((direct[a.id] || {})[b.id] || 0) || a.code.localeCompare(b.code);
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

  function safeFileName(value) {
    return String(value || "coco-padel").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70) || "coco-padel";
  }

  function pairLabel(playerIds, targetState) {
    targetState = targetState || state;
    return (playerIds || []).map(function (playerId) { var player = targetState && targetState.players.find(function (item) { return item.id === playerId; }); return player ? player.name + " — " + player.code : "Jugador no disponible"; }).join(" + ");
  }

  function exportToolsHtml(scope, compact) {
    return '<div class="c149ExportBar c151ShareBar ' + (compact ? "compact" : "") + '"><div><b>Compartir</b><span>Envía la información por WhatsApp o cópiala al portapapeles.</span></div><div><button type="button" class="c144Primary" data-padel151-whatsapp="' + scope + '">Enviar por WhatsApp</button><button type="button" class="c144Secondary" data-padel151-copy="' + scope + '">Copiar</button></div></div>';
  }

  function standingsPayload(championship, targetState) {
    targetState = targetState || state;
    var rows = championship && targetState ? championshipStandings(targetState, championship.id) : [];
    var headers = ["Posición", "Jugador", "Código", "Partidos jugados", "Victorias", "Derrotas", "Sets ganados", "Sets perdidos", "Diferencia de sets", "Juegos ganados", "Juegos perdidos", "Diferencia de juegos", "Puntos"];
    var data = rows.map(function (row) { return [row.position, row.name, row.code, row.played, row.won, row.lost, row.setsWon, row.setsLost, row.setDifference, row.gamesWon, row.gamesLost, row.gameDifference, row.points]; });
    var text = "COCO PÁDEL\nCLASIFICACIÓN DEL CAMPEONATO — " + (championship ? championship.name : "Campeonato") + "\n" + (championship && targetState ? targetState.sessions.filter(function (session) { return session.championshipId === championship.id; }).length : 0) + " jornadas\n\n" + (rows.length ? rows.map(function (row) { return row.position + ". " + row.name + " (" + row.code + ") — " + row.points + " puntos · " + row.played + " partidos · " + row.won + " victorias · diferencia de sets " + (row.setDifference > 0 ? "+" : "") + row.setDifference; }).join("\n") : "Aún no hay resultados completos.");
    return { title: "Clasificación - " + (championship ? championship.name : "Coco Pádel"), headers: headers, rows: data, text: text };
  }

  function schedulePayload(selected, label, targetState) {
    targetState = targetState || state;
    var headers = ["Ronda", "Partido", "Pista", "Pareja A", "Resultado por sets", "Pareja B"];
    var rows = selected ? selected.matches.slice().sort(function (a, b) { return a.round - b.round || a.order - b.order; }).map(function (match) { return [match.round, match.order, match.courtLabel, pairLabel(match.teamA, targetState), completed(match) ? scoreText(match.score) : "Pendiente", pairLabel(match.teamB, targetState)]; }) : [];
    var text = "COCO PÁDEL\n" + String(label || "ORDEN DE JUEGO").toUpperCase() + " — " + (selected ? selected.name : "") + (selected && selected.date ? "\n" + selected.date : "") + "\n\n" + (selected ? selected.matches.slice().sort(function (a, b) { return a.round - b.round || a.order - b.order; }).map(function (match) { return "Ronda " + match.round + " · Pista " + match.courtLabel + "\n" + pairLabel(match.teamA, targetState) + "\nVS\n" + pairLabel(match.teamB, targetState) + (completed(match) ? "\nResultado: " + scoreText(match.score) : ""); }).join("\n\n") : "No hay partidos generados.");
    return { title: (label || "Orden de juego") + " - " + (selected ? selected.name : "Coco Pádel"), headers: headers, rows: rows, text: text };
  }

  function playersPayload(targetState) {
    targetState = targetState || state;
    var headers = ["Jugador", "Código", "Nivel", "Estado", "Campeonatos", "Jornadas", "Partidos jugados", "Victorias", "Derrotas", "Sets ganados", "Sets perdidos", "Juegos ganados", "Juegos perdidos", "Puntos"];
    var rows = targetState.players.slice().sort(function (a, b) { return a.code.localeCompare(b.code); }).map(function (player) { var stats = playerStats(targetState, player.id); return [player.name, player.code, levelLabel(player.currentLevel), player.active ? "Activo" : "Inactivo", stats.championships, stats.dates, stats.played, stats.won, stats.lost, stats.setsWon, stats.setsLost, stats.gamesWon, stats.gamesLost, stats.points]; });
    var text = "COCO PÁDEL\nJUGADORES\n\n" + (targetState.players.length ? targetState.players.map(function (player) { var stats = playerStats(targetState, player.id); return player.name + " (" + player.code + ") · " + levelLabel(player.currentLevel) + " · " + (player.active ? "Activo" : "Inactivo") + " · " + stats.played + " partidos · " + stats.won + " victorias · " + stats.points + " puntos"; }).join("\n") : "Aún no hay jugadores.");
    return { title: "Jugadores - Coco Pádel", headers: headers, rows: rows, text: text };
  }

  function payloadFor(scope) {
    if (scope === "players") return playersPayload();
    if (scope === "mixing") return schedulePayload(mixingSession, "Orden de juego");
    if (scope === "session") return schedulePayload(sessionById(currentSessionId), "Jornada");
    return standingsPayload(championshipById(rankingChampionshipId || currentChampionshipId));
  }






  async function copyPayload(payload) {
    var ok = false;
    try { await navigator.clipboard.writeText(payload.text); ok = true; } catch (_) {
      var area = document.createElement("textarea"); area.value = payload.text; area.style.position = "fixed"; area.style.opacity = "0"; document.body.appendChild(area); area.select();
      try { ok = document.execCommand("copy"); } catch (_) {}
      area.remove();
    }
    C.toast(ok ? "Contenido copiado." : "No se pudo copiar automáticamente.", ok ? "good" : "bad");
  }

  function sendWhatsApp(payload) {
    var text = payload && payload.text || "";
    if (!text) { C.toast("No hay contenido para compartir.", "bad"); return; }
    var url = "https://wa.me/?text=" + encodeURIComponent(text);
    var popup = window.open(url, "_blank", "noopener,noreferrer");
    if (!popup) { window.location.href = url; }
  }


  function saveResult(targetState, sessionId, matchId, setsOrA, legacyB) {
    var selected = targetState.sessions.find(function (item) { return item.id === sessionId; }); if (!selected) throw new Error("Jornada no encontrada.");
    var match = selected.matches.find(function (item) { return item.id === matchId; }); if (!match) throw new Error("Partido no encontrado.");
    var sets = Array.isArray(setsOrA) ? setsOrA : [{ a: setsOrA, b: legacyB }];
    var score = scoreFromSets(sets);
    if (!score || !score.sets.length) throw new Error("Introduce al menos un set completo.");
    if (score.sets.some(function (set) { return set.a === set.b; })) throw new Error("Un set de pádel no puede terminar empatado.");
    if (score.setsA === score.setsB) throw new Error("El partido debe tener una pareja ganadora. Revisa los sets.");
    var previous = match.score ? clone(match.score) : null;
    match.score = score; match.updatedAt = iso(); selected.updatedAt = iso(); targetState.updatedAt = iso();
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
        var score = normalizeScore(match.score), onA = match.teamA.indexOf(playerId) >= 0;
        var mine = onA ? score.gamesA : score.gamesB, theirs = onA ? score.gamesB : score.gamesA, mySets = onA ? score.setsA : score.setsB, theirSets = onA ? score.setsB : score.setsA;
        var partnerIds = (onA ? match.teamA : match.teamB).filter(function (id) { return id !== playerId; }), rivalIds = onA ? match.teamB : match.teamA;
        rows.push({
          id: match.id, date: selected.date, sessionId: selected.id, sessionName: selected.name,
          championshipId: selected.championshipId,
          championshipName: selected.championshipId && (targetState.championships.find(function (item) { return item.id === selected.championshipId; }) || {}).name || "Campeonato",
          levelSnapshot: snapshot.levelSnapshot, setsWon: mySets, setsLost: theirSets, gamesWon: mine, gamesLost: theirs,
          scoreText: scoreText(score), result: mySets > theirSets ? "Ganado" : "Perdido",
          partners: partnerIds.map(function (id) { var p = targetState.players.find(function (item) { return item.id === id; }); return p ? p.name + " — " + p.code : id; }),
          rivals: rivalIds.map(function (id) { var p = targetState.players.find(function (item) { return item.id === id; }); return p ? p.name + " — " + p.code : id; })
        });
      });
    });
    return rows.sort(function (a, b) { return String(b.date).localeCompare(String(a.date)) || b.id.localeCompare(a.id); });
  }

  function playerStats(targetState, playerId) {
    var history = playerHistory(targetState, playerId), championships = Object.create(null), dates = Object.create(null);
    var result = { championships: 0, dates: 0, played: history.length, won: 0, lost: 0, drawn: 0, setsWon: 0, setsLost: 0, setDifference: 0, gamesWon: 0, gamesLost: 0, gameDifference: 0, points: 0, currentPositions: [], history: history };
    history.forEach(function (row) {
      if (row.championshipId) championships[row.championshipId] = true; dates[row.sessionId] = true;
      result.setsWon += row.setsWon || 0; result.setsLost += row.setsLost || 0; result.gamesWon += row.gamesWon; result.gamesLost += row.gamesLost;
      if (row.result === "Ganado") result.won++; else result.lost++;
    });
    result.championships = Object.keys(championships).length; result.dates = Object.keys(dates).length;
    result.setDifference = result.setsWon - result.setsLost; result.gameDifference = result.gamesWon - result.gamesLost;
    targetState.championships.forEach(function (championship) {
      var row = championshipStandings(targetState, championship.id).find(function (item) { return item.id === playerId; });
      if (row) { result.points += row.points; if (championship.status === "active") result.currentPositions.push({ championshipId: championship.id, name: championship.name, position: row.position }); }
    });
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
    return { kind: kind || "mixing", championshipId: championship && championship.id || null, name: championship ? "Jornada " + (state.sessions.filter(function (item) { return item.championshipId === championship.id; }).length + 1) : "Mixing " + C.today().split("-").reverse().join("/"), date: C.today(), courts: 2, courtLabels: "1, 2", rounds: 4, timerMode: "limit", matchMinutes: 20, participantIds: participants };
  }

  function blankChampionshipDraft() {
    return { name: "", startDate: C.today(), endDate: "", mode: "games", win: 3, draw: 1, loss: 0, participantIds: [] };
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
    return '<header class="c144PadelHero"><div class="c144PadelMark" aria-hidden="true"><svg viewBox="0 0 64 64"><circle cx="25" cy="24" r="16" fill="#d9f535" stroke="#fff" stroke-width="4"/><path d="M12 16c8 2 17 10 23 21M16 11c2 10 10 19 21 24" fill="none" stroke="#2585aa" stroke-width="3"/><path d="M37 37l16 16" stroke="#fff" stroke-width="7" stroke-linecap="round"/><path d="M45 45l10 10" stroke="#123f60" stroke-width="3" stroke-linecap="round"/></svg></div><div><span class="c144Eyebrow">COCO PÁDEL · ORGANIZACIÓN PROFESIONAL</span><h3>Menos logística. Más pista y más grupo.</h3><p>Códigos permanentes, niveles guardados y estadísticas recalculadas siempre desde los resultados.</p></div><div class="c144PadelWell"><b>Coco Pádel sigue siendo ilimitado</b><span>Organiza todas las sesiones que necesites. El objetivo es salir a jugar, moverse y encontrarse.</span></div></header>';
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
    var empty = '<div class="c144Empty"><b>Todavía no hay resultados completos</b><span>La clasificación aparecerá al guardar los primeros partidos de la jornada.</span></div>';
    var cards = rows.length ? '<div class="c149RankingCards c151RankingCards">' + rows.map(function (row) {
      return '<article><div class="c149RankIdentity"><strong>#' + row.position + '</strong><div><b>' + C.esc(row.name) + '</b><span>' + C.esc(row.code) + '</span></div><em>' + row.points + ' puntos</em></div><div class="c149RankMetrics c152RankMetrics"><span><b>' + row.played + '</b>Partidos jugados</span><span><b>' + row.won + '</b>Victorias</span><span><b>' + row.lost + '</b>Derrotas</span><span><b>' + (row.setDifference > 0 ? "+" : "") + row.setDifference + '</b>Diferencia de sets</span></div></article>';
    }).join("") + '</div>' : empty;
    var table = rows.length ? '<div class="c144TableWrap c149RankingTableDesktop"><table class="c144Table c151RankingTable c152RankingTable"><thead><tr><th>Posición</th><th>Jugador</th><th>Partidos</th><th>Victorias</th><th>Derrotas</th><th>Sets ganados</th><th>Sets perdidos</th><th>Dif. sets</th><th>Juegos ganados</th><th>Juegos perdidos</th><th>Dif. juegos</th><th>Puntos</th></tr></thead><tbody>' + rows.map(function (row) {
      return '<tr><td class="rank">' + row.position + '</td><td><b>' + C.esc(row.name) + '</b><br><small>' + C.esc(row.code) + '</small></td><td>' + row.played + '</td><td>' + row.won + '</td><td>' + row.lost + '</td><td>' + row.setsWon + '</td><td>' + row.setsLost + '</td><td>' + (row.setDifference > 0 ? "+" : "") + row.setDifference + '</td><td>' + row.gamesWon + '</td><td>' + row.gamesLost + '</td><td>' + (row.gameDifference > 0 ? "+" : "") + row.gameDifference + '</td><td><b>' + row.points + '</b></td></tr>';
    }).join("") + '</tbody></table></div>' : '';
    return table + cards + '<p class="c144Notice">Regla: ' + (scoring.mode === "games" ? "los puntos equivalen a los games ganados" : scoring.win + " por victoria y " + scoring.loss + " por derrota") + '. Desempates: puntos, diferencia de sets, diferencia de games, sets ganados, games ganados y resultado directo.</p>';
  }

  function matchHtml(selected, match) {
    var score = normalizeScore(match.score) || { sets: [] }, played = completed(match);
    var setRows = [0, 1, 2].map(function (index) {
      var set = score.sets[index] || {};
      return '<div class="c151SetRow"><span>Set ' + (index + 1) + '</span><input type="number" min="0" max="99" inputmode="numeric" aria-label="Set ' + (index + 1) + ' pareja A" data-padel151-set-a="' + match.id + '" data-set-index="' + index + '" value="' + (set.a == null ? "" : set.a) + '"><b>—</b><input type="number" min="0" max="99" inputmode="numeric" aria-label="Set ' + (index + 1) + ' pareja B" data-padel151-set-b="' + match.id + '" data-set-index="' + index + '" value="' + (set.b == null ? "" : set.b) + '"></div>';
    }).join("");
    return '<article class="c144Match c151Match ' + (played ? "played" : "") + '"><div class="c144MatchHead"><span>PARTIDO ' + match.order + '</span><b>Pista ' + C.esc(match.courtLabel) + '</b></div><div class="c144Versus"><b>' + match.teamA.map(displayPlayer).map(C.esc).join('<br><span>+</span><br>') + '</b><span>VS</span><b>' + match.teamB.map(displayPlayer).map(C.esc).join('<br><span>+</span><br>') + '</b></div><div class="c151SetGrid">' + setRows + '</div><p class="c151ScoreHint">Carga el resultado set a set. Ejemplo: 6–4 · 3–6 · 10–7. Deja vacío el tercer set si no fue necesario.</p><div class="c144MatchActions"><button type="button" class="c144Primary" data-padel144-save-score="' + match.id + '">' + (played ? "Corregir resultado" : "Guardar resultado") + '</button>' + (played ? '<button type="button" class="c144Danger" data-padel144-delete-score="' + match.id + '">Deshacer</button>' : "") + '</div></article>';
  }

  function sessionDetailHtml(selected, championship) {
    if (!selected) return '<div class="c144Empty"><b>Selecciona o crea una sesión</b><span>Los partidos y resultados aparecerán aquí.</span></div>';
    var rounds = Object.create(null); selected.matches.forEach(function (match) { (rounds[match.round] || (rounds[match.round] = [])).push(match); });
    var scoring = scoringFor(championship), rows = standingsForSessions(state, [selected], championship), done = selected.matches.filter(completed).length;
    return '<section class="c144Card c144PadelPanel c146SessionDetail"><div class="c146DetailBack"><button type="button" class="c144Secondary" data-padel146-close-session>‹ Volver al campeonato</button></div><div class="c144PadelPanelHead"><div><span class="c144Eyebrow">' + (selected.championshipId ? "JORNADA DEL CAMPEONATO" : "SESIÓN LIBRE") + '</span><h3>' + C.esc(selected.name) + '</h3><p>' + C.esc(selected.date) + ' · ' + selected.participants.length + ' jugadores · ' + selected.courts + ' pistas</p></div><span class="c144Chip">' + done + '/' + selected.matches.length + ' guardados</span></div><div class="c146SessionState"><span>' + (selected.matches.length - done) + ' partidos pendientes</span><span>' + done + ' resultados guardados</span></div><div class="c144Actions"><button type="button" class="c144Primary" data-padel144-save-all>Guardar toda la jornada</button></div>' + exportToolsHtml("session", true) + '<div class="c144Rounds">' + Object.keys(rounds).map(function (round) { return '<section class="c144Round"><header><b>Ronda ' + round + '</b><span>' + (selected.timerMode === "unlimited" ? "Sin límite" : selected.matchMinutes + " min") + '</span></header><div class="c144Matches">' + rounds[round].map(function (match) { return matchHtml(selected, match); }).join("") + '</div></section>'; }).join("") + '</div><div class="c144StandingsTools"><h4>Resumen de esta jornada</h4></div>' + standingsTableHtml(rows, scoring) + '</section>';
  }

  function mixingOrderHtml(selected, editable) {
    if (!selected) return '<section class="c144Card c144PadelPanel c145MixingEmpty"><div class="c144Empty"><b>El orden de juego aparecerá aquí</b><span>Selecciona jugadores, indica pistas y rondas, y pulsa “Generar partidos”.</span></div></section>';
    var rounds = Object.create(null); selected.matches.forEach(function (match) { (rounds[match.round] || (rounds[match.round] = [])).push(match); });
    return '<section class="c144Card c144PadelPanel"><div class="c144PadelPanelHead"><div><span class="c144Eyebrow">ORDEN DE JUEGO TEMPORAL</span><h3>' + (editable ? "Revisa y ajusta las parejas" : "Listo para llevar a la pista") + '</h3><p>' + selected.participants.length + ' jugadores · ' + selected.courts + ' pistas · ' + selected.rounds + ' rondas</p></div><span class="c144Chip">No suma puntos</span></div><p class="c144Notice">Este mixing vive únicamente mientras Coco Pádel está abierto. No guarda historial, no registra resultados y no modifica estadísticas.</p>' + exportToolsHtml("mixing", true) + '<div class="c144Rounds">' + Object.keys(rounds).map(function (round) { return '<section class="c144Round"><header><b>Ronda ' + round + '</b><span>Orden de juego</span></header><div class="c144Matches">' + rounds[round].map(function (match) { return '<article class="c144Match"><div class="c144MatchHead"><span>PARTIDO ' + match.order + '</span><b>Pista ' + C.esc(match.courtLabel) + '</b></div><div class="c144Versus"><b>' + match.teamA.map(displayPlayer).map(C.esc).join('<br><span>+</span><br>') + '</b><span>VS</span><b>' + match.teamB.map(displayPlayer).map(C.esc).join('<br><span>+</span><br>') + '</b></div>' + (editable ? '<button type="button" class="c144Secondary" data-padel144-swap-mixing="' + match.id + '">Cambiar una pareja</button>' : '') + '</article>'; }).join("") + '</div></section>'; }).join("") + '</div></section>';
  }

  function mixingHtml() {
    if (mixingScreen === "home") {
      var openMixing = Boolean(mixingDraft || mixingSession);
      return '<main class="c144PadelPage c146PadelLanding"><section class="c144Card c146LandingHero"><span class="c144Eyebrow">MIXING OCASIONAL</span><h3>Organiza la próxima jornada</h3><p>Crea parejas equilibradas y un orden de pista claro, sin guardar resultados ni alterar puntos.</p><button type="button" class="c144Primary" data-padel146-new-mixing>Crear nuevo mixing</button></section>' + (openMixing ? '<section class="c144Card c146ContinueCard"><div><span class="c144Eyebrow">MIXING TEMPORAL ABIERTO</span><h3>' + C.esc(mixingSession && mixingSession.name || mixingDraft && mixingDraft.name || "Mixing sin terminar") + '</h3><p>' + (mixingSession ? mixingSession.participants.length + ' jugadores · ' + mixingSession.matches.length + ' partidos generados' : (mixingDraft.participantIds || []).length + ' jugadores elegidos') + '</p></div><div class="c144Actions"><button type="button" class="c144Primary" data-padel146-continue-mixing>Continuar mixing</button><button type="button" class="c144Danger" data-padel144-reset-mixing>Descartar mixing</button></div></section>' : '<div class="c144Empty"><b>No hay ningún mixing abierto</b><span>Pulsa “Crear nuevo mixing” para empezar en cinco pasos breves.</span></div>') + '<p class="c144Notice c146LandingNote"><b>Temporal:</b> no guarda historial, no registra resultados, no suma puntos y nunca aparece en Campeonato.</p></main>';
    }
    if (!mixingDraft) mixingDraft = defaultDraft("mixing"); draft = mixingDraft;
    var players = state.players.filter(function (player) { return player.active; });
    var steps = '<div class="c145FlowSteps c146FiveSteps" aria-label="Flujo del mixing">' + ["Jugadores", "Pistas", "Generar", "Ajustar", "Orden"].map(function (label, index) { return '<span class="' + (mixingStep === index + 1 ? "active" : mixingStep > index + 1 ? "done" : "") + '">' + (index + 1) + ' · ' + label + '</span>'; }).join("") + '</div>';
    var back = '<div class="c146DetailBack"><button type="button" class="c144Secondary" data-padel146-mixing-home>‹ Volver al inicio</button></div>', content = "";
    if (mixingStep === 1) content = '<section class="c144Card c144PadelPanel"><div class="c144PadelPanelHead"><div><span class="c144Eyebrow">PASO 1 DE 5</span><h3>Selecciona jugadores activos</h3><p>El nivel guardado se recupera automáticamente.</p></div><span class="c144Chip" data-padel144-mixing-count>' + draft.participantIds.length + ' elegidos</span></div><label class="c144Field">Buscar por nombre o código<input data-padel144-picker-search placeholder="Diego o CP-0012" autocomplete="off"></label><div class="c144PlayerResults">' + (players.length ? players.map(function (player) { return playerOptionHtml(player, draft.participantIds.indexOf(player.id) >= 0); }).join("") : '<div class="c144Empty"><b>No hay jugadores activos</b><span>Créelos o reactívalos desde Jugadores.</span></div>') + '</div><div class="c144Actions"><button type="button" class="c144Primary" data-padel146-mixing-next>Continuar con pistas</button></div></section>';
    else if (mixingStep === 2) content = '<section class="c144Card c144PadelPanel"><span class="c144Eyebrow">PASO 2 DE 5</span><h3>Indica pistas y rondas</h3><div class="c145MixingSetup"><label class="c144Field">Número de pistas<input type="number" min="1" max="40" inputmode="numeric" data-padel144-draft="courts" value="' + draft.courts + '"></label><label class="c144Field">Número de rondas<input type="number" min="1" max="50" inputmode="numeric" data-padel144-draft="rounds" value="' + draft.rounds + '"></label><label class="c144Field c144Wide">Nombres de pista<input data-padel144-draft="courtLabels" value="' + C.esc(draft.courtLabels) + '" placeholder="1, 2"></label></div><div class="c144Actions"><button type="button" class="c144Secondary" data-padel146-mixing-prev>Volver</button><button type="button" class="c144Primary" data-padel146-mixing-next>Revisar configuración</button></div></section>';
    else if (mixingStep === 3) content = '<section class="c144Card c144PadelPanel"><span class="c144Eyebrow">PASO 3 DE 5</span><h3>Todo listo para generar</h3><div class="c146ReviewGrid"><div><b>' + draft.participantIds.length + '</b><span>jugadores</span></div><div><b>' + draft.courts + '</b><span>pistas</span></div><div><b>' + draft.rounds + '</b><span>rondas</span></div></div><p>Se equilibrarán niveles, parejas y repeticiones. Después podrás ajustar manualmente los cruces.</p><div class="c144Actions"><button type="button" class="c144Secondary" data-padel146-mixing-prev>Volver</button><button type="button" class="c144Primary" data-padel144-generate>Generar partidos</button></div></section>';
    else if (mixingStep === 4) content = mixingOrderHtml(mixingSession, true) + '<div class="c144Actions c146FlowActions"><button type="button" class="c144Secondary" data-padel144-regenerate-mixing>Regenerar cruces</button><button type="button" class="c144Primary" data-padel146-mixing-next>Confirmar orden</button></div>';
    else content = mixingOrderHtml(mixingSession, false) + '<div class="c144Actions c146FlowActions"><button type="button" class="c144Secondary" data-padel146-mixing-prev>Ajustar parejas</button><button type="button" class="c144Primary" data-padel146-mixing-home>Dejar listo y volver</button><button type="button" class="c144Danger" data-padel144-reset-mixing>Descartar mixing</button></div>';
    return '<main class="c144PadelPage c146FlowPage">' + back + steps + content + '</main>';
  }

  function championshipListHtml(championships) {
    return championships.slice().sort(function (a, b) { return String(b.createdAt).localeCompare(String(a.createdAt)); }).map(function (championship) { var dates = state.sessions.filter(function (item) { return item.championshipId === championship.id; }).length, rows = championshipStandings(state, championship.id); return '<button type="button" class="c144ChampButton c146ChampCard" data-padel144-champ="' + championship.id + '"><span class="c144Chip">' + (championship.status === "active" ? "Activo" : championship.status === "finished" ? "Finalizado" : "Archivado") + '</span><b>' + C.esc(championship.name) + '</b><span>' + dates + ' jornadas · ' + championship.participantIds.length + ' participantes</span><small>' + (rows.length ? 'Líder provisional: ' + C.esc(rows[0].name) + ' · ' + rows[0].points + ' pts' : 'Aún sin resultados') + '</small></button>'; }).join("");
  }

  function championshipCreateHtml() {
    if (!championshipDraft) championshipDraft = blankChampionshipDraft();
    var steps = '<div class="c145FlowSteps c146ChampSteps">' + ["Datos", "Puntuación", "Jugadores"].map(function (label, index) { return '<span class="' + (championshipCreateStep === index + 1 ? "active" : championshipCreateStep > index + 1 ? "done" : "") + '">' + (index + 1) + ' · ' + label + '</span>'; }).join("") + '</div>', content;
    if (championshipCreateStep === 1) content = '<div class="c144FormGrid"><label class="c144Field c144Wide">Nombre del campeonato<input data-padel146-champ-draft="name" maxlength="80" value="' + C.esc(championshipDraft.name) + '" placeholder="Ej.: Liga familiar 2026"></label><label class="c144Field">Inicio<input type="date" data-padel146-champ-draft="startDate" value="' + C.esc(championshipDraft.startDate) + '"></label><label class="c144Field">Fin opcional<input type="date" data-padel146-champ-draft="endDate" value="' + C.esc(championshipDraft.endDate) + '"></label></div><div class="c144Actions"><button type="button" class="c144Primary" data-padel146-champ-next>Continuar</button></div>';
    else if (championshipCreateStep === 2) content = '<div class="c144FormGrid"><label class="c144Field c144Wide">Sistema de puntuación<select data-padel146-champ-draft="mode"><option value="games" ' + (championshipDraft.mode === "games" ? "selected" : "") + '>Games ganados (mixing)</option><option value="points" ' + (championshipDraft.mode === "points" ? "selected" : "") + '>Puntos por victoria, empate y derrota</option></select></label><label class="c144Field">Victoria<input type="number" min="0" data-padel146-champ-draft="win" value="' + championshipDraft.win + '"></label><label class="c144Field">Empate<input type="number" min="0" data-padel146-champ-draft="draw" value="' + championshipDraft.draw + '"></label><label class="c144Field">Derrota<input type="number" min="0" data-padel146-champ-draft="loss" value="' + championshipDraft.loss + '"></label></div><p class="c144Notice">Desempates: puntos, diferencia de games, games ganados y resultado directo.</p><div class="c144Actions"><button type="button" class="c144Secondary" data-padel146-champ-prev>Volver</button><button type="button" class="c144Primary" data-padel146-champ-next>Elegir jugadores</button></div>';
    else content = '<div class="c144PadelPanelHead"><div><h4>Participantes activos</h4><p>Puedes editarlos después desde una acción secundaria.</p></div><span class="c144Chip">' + championshipDraft.participantIds.length + ' elegidos</span></div><div class="c144PlayerResults">' + state.players.filter(function (player) { return player.active; }).map(function (player) { return '<label class="c144PlayerPick"><input type="checkbox" data-padel146-champ-player="' + player.id + '" ' + (championshipDraft.participantIds.indexOf(player.id) >= 0 ? "checked" : "") + '><span><b>' + C.esc(player.name) + ' — ' + C.esc(player.code) + '</b><small>Nivel ' + levelLabel(player.currentLevel) + '</small></span></label>'; }).join("") + '</div><div class="c144Actions"><button type="button" class="c144Secondary" data-padel146-champ-prev>Volver</button><button type="button" class="c144Primary" data-padel144-create-champ>Crear campeonato</button></div>';
    return '<main class="c144PadelPage c146FlowPage"><div class="c146DetailBack"><button type="button" class="c144Secondary" data-padel146-champ-home>‹ Cancelar y volver</button></div>' + steps + '<section class="c144Card c144PadelPanel"><span class="c144Eyebrow">NUEVO CAMPEONATO · PASO ' + championshipCreateStep + ' DE 3</span><h3>Crear competición</h3>' + content + '</section></main>';
  }

  function levelReviewHtml(championship) {
    return '<section class="c144Card c144PadelPanel"><div class="c144PadelPanelHead"><div><span class="c144Eyebrow">REVISIÓN MANUAL DE NIVELES</span><h3>Subir, mantener o bajar</h3><p>Nunca se cambia automáticamente. Cada cambio conserva su trazabilidad.</p></div></div><div class="c144LevelReview">' + championship.participantIds.map(function (playerId) { var player = playerById(playerId); if (!player) return ""; return '<div class="c144LevelRow"><div><b>' + C.esc(player.name) + ' — ' + C.esc(player.code) + '</b><small>Nivel actual: ' + levelLabel(player.currentLevel) + '</small></div><label class="c144Field">Nuevo nivel<select data-padel144-review-level="' + player.id + '"><option value="bajo" ' + (player.currentLevel === "bajo" ? "selected" : "") + '>Bajo</option><option value="medio" ' + (player.currentLevel === "medio" ? "selected" : "") + '>Medio</option><option value="alto" ' + (player.currentLevel === "alto" ? "selected" : "") + '>Alto</option></select></label><label class="c144Field">Motivo opcional<input data-padel144-review-reason="' + player.id + '" maxlength="140"></label><button type="button" class="c144Secondary" data-padel144-apply-level="' + player.id + '">Confirmar</button></div>'; }).join("") + '</div></section>';
  }

  function championshipDetailHtml(championship) {
    if (!championship) return '<div class="c144Empty"><b>Elige o crea un campeonato</b><span>Aquí aparecerán sus jornadas y la clasificación acumulada.</span></div>';
    var sessions = state.sessions.filter(function (item) { return item.championshipId === championship.id; }).sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); }), rows = sortedStandings(championshipStandings(state, championship.id), standingsSort), selected = sessionById(currentSessionId);
    if (!draft || draft.championshipId !== championship.id) draft = defaultDraft("championship-date", championship);
    var participantEditor = participantsOpen ? '<section class="c144Card c144PadelPanel c146SecondaryPanel"><div class="c144PadelPanelHead"><div><span class="c144Eyebrow">CONFIGURACIÓN</span><h3>Editar participantes</h3></div><button type="button" class="c144Secondary" data-padel146-close-participants>Cerrar</button></div><div class="c144PlayerResults">' + state.players.filter(function (player) { return player.active || championship.participantIds.indexOf(player.id) >= 0; }).map(function (player) { return playerOptionHtml(player, championship.participantIds.indexOf(player.id) >= 0).replace('data-padel144-player=', 'data-padel144-champ-player='); }).join("") + '</div><div class="c144Actions"><button type="button" class="c144Primary" data-padel144-save-participants>Guardar participantes</button></div></section>' : '';
    var dateForm = championship.status === "active" && dateFormOpen ? '<section class="c144Card c144PadelPanel c146SecondaryPanel"><div class="c144PadelPanelHead"><div><span class="c144Eyebrow">NUEVA JORNADA</span><h3>Añadir jornada</h3></div><button type="button" class="c144Secondary" data-padel146-close-date>Cerrar</button></div><div class="c144FormGrid"><label class="c144Field">Nombre<input data-padel144-draft="name" value="' + C.esc(draft.name) + '"></label><label class="c144Field">Fecha<input type="date" data-padel144-draft="date" value="' + C.esc(draft.date) + '"></label><label class="c144Field">Pistas<input type="number" min="1" max="40" data-padel144-draft="courts" value="' + draft.courts + '"></label><label class="c144Field">Rondas<input type="number" min="1" max="50" data-padel144-draft="rounds" value="' + draft.rounds + '"></label><label class="c144Field c144Wide">Nombres de pista<input data-padel144-draft="courtLabels" value="' + C.esc(draft.courtLabels) + '"></label></div><div class="c144Actions"><button type="button" class="c144Primary" data-padel144-generate-date>Crear jornada</button></div></section>' : '';
    return '<main class="c144PadelPage c146ChampDetail"><div class="c146DetailBack"><button type="button" class="c144Secondary" data-padel146-champ-home>‹ Volver a campeonatos</button></div><section class="c144Card c144ChampHeader"><div><span class="c144Eyebrow">' + (championship.status === "active" ? "CAMPEONATO ACTIVO" : championship.status === "finished" ? "CAMPEONATO FINALIZADO" : "CAMPEONATO ARCHIVADO") + '</span><h3>' + C.esc(championship.name) + '</h3><p>' + C.esc(championship.startDate) + (championship.endDate ? ' → ' + C.esc(championship.endDate) : '') + ' · ' + championship.participantIds.length + ' participantes · ' + sessions.length + ' jornadas</p></div><div class="c144Actions">' + (championship.status === "active" ? '<button type="button" class="c144Primary" data-padel146-open-date>Añadir jornada</button><button type="button" class="c144Secondary" data-padel146-open-participants>Editar participantes</button><button type="button" class="c144Secondary" data-padel144-finish-champ>Finalizar</button>' : championship.status === "finished" ? '<button type="button" class="c144Secondary" data-padel144-reopen-champ>Reabrir</button><button type="button" class="c144Danger" data-padel144-archive-champ>Archivar</button>' : '') + '</div></section>' + dateForm + participantEditor + '<section class="c144Card c144PadelPanel"><div class="c144PadelPanelHead"><div><span class="c144Eyebrow">CLASIFICACIÓN ACUMULADA</span><h3>Jornada tras jornada</h3></div><label class="c144Field">Ordenar<select data-padel144-sort><option value="position" ' + (standingsSort === "position" ? "selected" : "") + '>Posición</option><option value="points" ' + (standingsSort === "points" ? "selected" : "") + '>Puntos</option><option value="won" ' + (standingsSort === "won" ? "selected" : "") + '>Partidos ganados</option><option value="gameDifference" ' + (standingsSort === "gameDifference" ? "selected" : "") + '>Diferencia de games</option></select></label></div>' + exportToolsHtml("ranking", true) + standingsTableHtml(rows, championship.scoring) + '</section><section class="c144Card c144PadelPanel"><div class="c144PadelPanelHead"><div><span class="c144Eyebrow">JORNADAS</span><h3>Partidos y resultados</h3></div><span class="c144Chip">' + sessions.length + ' jornadas</span></div><div class="c144DateCards">' + (sessions.length ? sessions.map(function (item) { var completeCount = item.matches.filter(completed).length; return '<article class="c144DateCard"><header><span>' + C.esc(item.date) + '</span><span class="c144Chip">' + completeCount + '/' + item.matches.length + ' guardados</span></header><h4>' + C.esc(item.name) + '</h4><p>' + (item.matches.length - completeCount) + ' pendientes · ' + item.participants.length + ' jugadores</p><button type="button" class="c144Secondary" data-padel144-open-session="' + item.id + '">Abrir jornada</button></article>'; }).join("") : '<div class="c144Empty"><b>Aún no hay jornadas</b><span>Este campeonato puede acumular 20, 30 o todas las jornadas que necesites.</span></div>') + '</div></section>' + (selected && selected.championshipId === championship.id ? sessionDetailHtml(selected, championship) : '') + (championship.status !== "active" ? levelReviewHtml(championship) : '') + '</main>';
  }

  function championshipRankingHtml() {
    var championships = state.championships.slice().sort(function (a, b) { return String(b.createdAt).localeCompare(String(a.createdAt)); });
    if (!championships.length) return '<main class="c144PadelPage"><div class="c146DetailBack"><button type="button" class="c144Secondary" data-padel146-champ-home>‹ Volver a campeonatos</button></div><div class="c144Empty"><b>Aún no hay campeonatos</b><span>Crea un campeonato para consultar su clasificación actualizada.</span></div></main>';
    if (!rankingChampionshipId || !championshipById(rankingChampionshipId)) rankingChampionshipId = championships[0].id;
    var championship = championshipById(rankingChampionshipId), rows = championshipStandings(state, championship.id), sessions = state.sessions.filter(function (session) { return session.championshipId === championship.id; });
    return '<main class="c144PadelPage c149TournamentRanking"><div class="c146DetailBack"><button type="button" class="c144Secondary" data-padel146-champ-home>‹ Volver a campeonatos</button></div><section class="c144Card c144PadelPanel"><div class="c144PadelPanelHead"><div><span class="c144Eyebrow">CLASIFICACIÓN POR CAMPEONATOS</span><h3>Elige un campeonato</h3><p>La tabla se recalcula siempre desde los resultados guardados jornada tras jornada.</p></div><label class="c144Field">Campeonato<select data-padel149-ranking-championship>' + championships.map(function (item) { return '<option value="' + item.id + '" ' + (item.id === championship.id ? "selected" : "") + '>' + C.esc(item.name) + ' · ' + (item.status === "active" ? "Activo" : item.status === "finished" ? "Finalizado" : "Archivado") + '</option>'; }).join("") + '</select></label></div><div class="c149TournamentSummary"><span><b>' + sessions.length + '</b> jornadas</span><span><b>' + championship.participantIds.length + '</b> jugadores</span><span><b>' + rows.filter(function (row) { return row.played > 0; }).length + '</b> con resultados</span></div>' + exportToolsHtml("ranking", false) + standingsTableHtml(rows, championship.scoring) + '</section></main>';
  }

  function championshipsHtml() {
    if (championshipScreen === "create") return championshipCreateHtml();
    if (championshipScreen === "detail") return championshipDetailHtml(championshipById(currentChampionshipId));
    if (championshipScreen === "ranking") return championshipRankingHtml();
    var active = state.championships.filter(function (item) { return item.status === "active"; }), previous = state.championships.filter(function (item) { return item.status !== "active"; });
    return '<main class="c144PadelPage c146PadelLanding"><section class="c144Card c146LandingHero"><span class="c144Eyebrow">CAMPEONATOS</span><h3>Competiciones claras, jornada tras jornada</h3><p>Crea el campeonato, abre cada jornada y deja que Coco recalcule la clasificación desde los resultados.</p><div class="c144Actions"><button type="button" class="c144Primary" data-padel146-new-champ>Crear campeonato</button><button type="button" class="c144Secondary" data-padel149-open-ranking>Clasificación por campeonatos</button></div></section><section class="c144Card c144PadelPanel"><div class="c144PadelPanelHead"><div><span class="c144Eyebrow">ACTIVOS</span><h3>Campeonatos en curso</h3></div><span class="c144Chip">' + active.length + '</span></div><div class="c146ChampList">' + (active.length ? championshipListHtml(active) : '<div class="c144Empty"><b>No hay campeonatos activos</b><span>Crea el primero con el botón superior.</span></div>') + '</div></section><section class="c146ArchivedAccess"><button type="button" class="c144Secondary" data-padel146-toggle-archived>' + (archivedVisible ? "Ocultar anteriores" : "Ver finalizados y archivados") + ' (' + previous.length + ')</button>' + (archivedVisible ? '<div class="c146ChampList">' + (previous.length ? championshipListHtml(previous) : '<div class="c144Empty"><b>Aún no hay campeonatos anteriores</b></div>') + '</div>' : '') + '</section></main>';
  }

  function playersHtml() {
    return '<main class="c144PadelPage"><section class="c144Card c144PadelPanel"><div class="c144PadelPanelHead"><div><span class="c144Eyebrow">JUGADORES · ADMINISTRACIÓN ÚNICA</span><h3>Directorio del club</h3><p>Busca, crea, edita, nivela y gestiona jugadores desde una sola pantalla.</p></div><button type="button" class="c144Primary" data-padel144-toggle-add-player>Añadir jugador</button></div><div class="c145AddPlayer" data-padel144-add-panel hidden><h4>Nuevo jugador</h4>' + createPlayerFormHtml("directory") + '</div><div class="c151PlayerSearch"><label class="c144Field">Buscar jugador<input data-padel144-directory-search placeholder="Nombre o código · Ej.: Dieg" autocomplete="off"></label><button type="button" class="c144Primary" data-padel151-find-player>Buscar</button></div><div class="c144PlayerFilters c145PlayerFilters c151PlayerFilters"><label class="c144Field">Nivel<select data-padel144-directory-level><option value="">Todos</option><option value="bajo">Bajo</option><option value="medio">Medio</option><option value="alto">Alto</option></select></label><label class="c144Field">Estado<select data-padel144-directory-status><option value="">Todos</option><option value="active">Activos</option><option value="inactive">Inactivos</option></select></label></div><div class="c145DirectorySummary"><b>' + state.players.length + ' jugadores</b><span>Las estadísticas se recalculan desde los resultados guardados jornada tras jornada.</span></div>' + exportToolsHtml("players", true) + '<div class="c145PlayerDirectory c146PlayerDirectory" data-padel144-directory>' + (state.players.length ? directoryCardsHtml(state.players) : '<div class="c144Empty"><b>Aún no hay jugadores</b><span>Pulsa “Añadir jugador” para crear el primero.</span></div>') + '</div></section></main>';
  }

  function directoryCardsHtml(players) {
    return players.map(function (player) {
      var stats = playerStats(state, player.id), currentPosition = stats.currentPositions.length ? "#" + stats.currentPositions[0].position + " · " + stats.currentPositions[0].name : "Sin campeonato activo";
      return '<article class="c145PlayerAdmin c146PlayerSummary c151PlayerCard c152PlayerCard ' + (player.active ? "" : "inactive") + '" data-padel144-player-card data-player-id="' + C.esc(player.id) + '" data-search="' + C.esc(normalizeSearch(player.name + " " + player.code)) + '" data-level="' + player.currentLevel + '" data-status="' + (player.active ? "active" : "inactive") + '"><div class="c145PlayerIdentity"><div><b>' + C.esc(player.name) + '</b><span>' + C.esc(player.code) + ' · ' + (player.active ? "Activo" : "Inactivo") + '</span></div><div><b>' + stats.points + '</b><span>Puntos</span></div></div><div class="c151PlayerContext c152PlayerContext"><span><b>Campeonatos</b> ' + stats.championships + '</span><span><b>Jornadas</b> ' + stats.dates + '</span><span><b>Posición</b> ' + C.esc(currentPosition) + '</span></div><div class="c146PlayerMetrics c152PlayerMetrics">' + [[stats.played, "Partidos jugados"], [stats.won, "Victorias"], [stats.lost, "Derrotas"]].map(function (item) { return '<div><b>' + item[0] + '</b><span>' + item[1] + '</span></div>'; }).join("") + '</div><div class="c145PlayerAdminActions"><label class="c144Field c146LevelControl"><span>Cambiar nivel</span><select data-padel144-player-level="' + player.id + '" aria-label="Cambiar nivel de ' + C.esc(player.name) + '"><option value="bajo" ' + (player.currentLevel === "bajo" ? "selected" : "") + '>Bajo</option><option value="medio" ' + (player.currentLevel === "medio" ? "selected" : "") + '>Medio</option><option value="alto" ' + (player.currentLevel === "alto" ? "selected" : "") + '>Alto</option></select></label><button type="button" class="c144Secondary" data-padel144-edit-player="' + player.id + '">Editar nombre</button><button type="button" class="' + (player.active ? "c144Danger" : "c144Secondary") + '" data-padel144-toggle-player="' + player.id + '">' + (player.active ? "Dar de baja" : "Dar de alta") + '</button></div></article>';
    }).join("");
  }

  function render() {
    var body = C.body(); if (!body || !state) return;
    C.setModalTitle("Coco Pádel", "HERRAMIENTA ILIMITADA · v154.0");
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
    if (!championshipDraft) championshipDraft = blankChampionshipDraft();
    var name = String(championshipDraft.name || "").trim(); if (!name) { C.toast("Escribe el nombre del campeonato.", "bad"); championshipCreateStep = 1; render(); return; }
    var participantIds = championshipDraft.participantIds.slice(); if (participantIds.length < 4) { C.toast("Selecciona al menos cuatro jugadores activos.", "bad"); return; }
    var championship = { id: C.id("champ"), name: name, startDate: championshipDraft.startDate || C.today(), endDate: championshipDraft.endDate || "", status: "active", participantIds: participantIds, scoring: { mode: championshipDraft.mode === "points" ? "points" : "games", win: Math.max(0, Number(championshipDraft.win) || 0), draw: Math.max(0, Number(championshipDraft.draw) || 0), loss: Math.max(0, Number(championshipDraft.loss) || 0), tiebreakers: ["points", "gameDifference", "gamesWon", "headToHead"] }, createdAt: iso(), finishedAt: null, archivedAt: null };
    state.championships.push(championship); currentChampionshipId = championship.id; draft = defaultDraft("championship-date", championship); championshipDraft = null; championshipCreateStep = 1; championshipScreen = "detail"; dateFormOpen = false; participantsOpen = false; state.auditLog.push({ id: C.id("audit"), type: "championship-created", championshipId: championship.id, at: iso() }); await persist(true); C.toast("Campeonato creado.", "good"); render();
  }

  function updateDraftFrom(input) {
    if (!draft) return; var key = input.dataset.padel144Draft, value = input.type === "number" ? Number(input.value) : input.value; draft[key] = value;
  }

  function updateChampionshipDraftFrom(input) {
    if (!championshipDraft) championshipDraft = blankChampionshipDraft();
    var key = input.dataset.padel146ChampDraft, value = input.type === "number" ? Number(input.value) : input.value; championshipDraft[key] = value;
  }

  async function saveSingleResult(matchId) {
    var selected = sessionById(currentSessionId), body = C.body(); if (!selected) return;
    var sets = [], invalidPair = false;
    [0, 1, 2].forEach(function (index) {
      var a = body.querySelector('[data-padel151-set-a="' + selectorValue(matchId) + '"][data-set-index="' + index + '"]');
      var b = body.querySelector('[data-padel151-set-b="' + selectorValue(matchId) + '"][data-set-index="' + index + '"]');
      var av = a && String(a.value).trim(), bv = b && String(b.value).trim();
      if (!av && !bv) return;
      if (!av || !bv) { invalidPair = true; return; }
      sets.push({ a: av, b: bv });
    });
    if (invalidPair) { C.toast("Cada set debe tener los dos marcadores.", "bad"); return; }
    try { saveResult(state, selected.id, matchId, sets); await persist(true); C.toast("Resultado guardado. Perfil y clasificación recalculados.", "good"); render(); } catch (error) { C.toast(error.message, "bad"); }
  }

  async function saveAllResults() {
    var selected = sessionById(currentSessionId), body = C.body(); if (!selected) return;
    var pending = [], errors = [];
    selected.matches.forEach(function (match) {
      var sets = [], any = false, invalidPair = false;
      [0, 1, 2].forEach(function (index) {
        var a = body.querySelector('[data-padel151-set-a="' + selectorValue(match.id) + '"][data-set-index="' + index + '"]');
        var b = body.querySelector('[data-padel151-set-b="' + selectorValue(match.id) + '"][data-set-index="' + index + '"]');
        var av = a && String(a.value).trim(), bv = b && String(b.value).trim();
        if (!av && !bv) return;
        any = true;
        if (!av || !bv) { invalidPair = true; return; }
        sets.push({ a: av, b: bv });
      });
      if (invalidPair) errors.push("Partido " + match.order + ": hay un set incompleto.");
      else if (any) pending.push({ matchId: match.id, sets: sets });
    });
    if (errors.length) { C.toast(errors[0] + (errors.length > 1 ? " Hay más resultados incompletos." : ""), "bad"); return; }
    if (!pending.length) { C.toast("No hay resultados para guardar."); return; }
    try {
      pending.forEach(function (entry) { saveResult(state, selected.id, entry.matchId, entry.sets); });
      await persist(true); C.toast(pending.length + " resultados guardados. La clasificación quedó actualizada.", "good"); C.sound("finish"); render();
    } catch (error) { C.toast(error.message, "bad"); }
  }

  function filterDirectory() {
    var body = C.body(), search = body.querySelector("[data-padel144-directory-search]"), levelSelect = body.querySelector("[data-padel144-directory-level]"), statusSelect = body.querySelector("[data-padel144-directory-status]"); if (!search || !levelSelect || !statusSelect) return;
    var query = normalizeSearch(search.value), targetLevel = levelSelect.value, targetStatus = statusSelect.value; directoryStatus = targetStatus;
    body.querySelectorAll("[data-padel144-player-card]").forEach(function (card) {
      card.hidden = Boolean(query && card.dataset.search.indexOf(query) < 0 || targetLevel && card.dataset.level !== targetLevel || targetStatus && card.dataset.status !== targetStatus);
    });
  }

  function findDirectoryPlayer() {
    var body = C.body(), input = body && body.querySelector("[data-padel144-directory-search]"); if (!body || !input) return;
    var query = normalizeSearch(input.value);
    if (!query) { C.toast("Escribe el nombre o código del jugador."); input.focus(); return; }
    filterDirectory();
    var cards = Array.prototype.slice.call(body.querySelectorAll("[data-padel144-player-card]")), card = cards.find(function (item) { return !item.hidden && String(item.dataset.search || "").indexOf(query) >= 0; });
    if (!card) { C.toast("No encontré ningún jugador con ese nombre o código.", "bad"); return; }
    card.classList.remove("c151PlayerLocated"); void card.offsetWidth; card.classList.add("c151PlayerLocated");
    card.scrollIntoView({ behavior: "smooth", block: "center" });
    card.setAttribute("tabindex", "-1"); card.focus({ preventScroll: true });
    setTimeout(function () { card.classList.remove("c151PlayerLocated"); }, 2600);
  }

  function filterHistory() {
    var body = C.body(), championship = body.querySelector("[data-padel144-history-champ]").value, from = body.querySelector("[data-padel144-history-from]").value, to = body.querySelector("[data-padel144-history-to]").value;
    body.querySelectorAll("[data-history-date]").forEach(function (row) { var date = row.dataset.historyDate; row.hidden = Boolean(championship && row.dataset.historyChamp !== championship || from && date < from || to && date > to); });
  }

  async function handleClick(event) {
    var button = event.target.closest("button"); if (!button) return;
    if (button.dataset.padel151Copy) { await copyPayload(payloadFor(button.dataset.padel151Copy)); return; }
    if (button.dataset.padel151Whatsapp) { sendWhatsApp(payloadFor(button.dataset.padel151Whatsapp)); return; }
    if (button.hasAttribute("data-padel151-find-player")) { findDirectoryPlayer(); return; }
    if (button.dataset.padel144View) { if (view === "mixing" && draft && draft.kind === "mixing") mixingDraft = draft; view = button.dataset.padel144View; currentSessionId = null; selectedPlayerId = null; draft = null; if (view === "mixing") mixingScreen = "home"; if (view === "championship") championshipScreen = "home"; render(); return; }
    if (button.hasAttribute("data-padel144-toggle-add-player")) { var panel = C.body().querySelector("[data-padel144-add-panel]"); if (panel) { panel.hidden = !panel.hidden; if (!panel.hidden) { var nameField = panel.querySelector("[data-padel144-new-name]"); if (nameField) nameField.focus(); } } return; }
    if (button.dataset.padel144CreatePlayer) { await createPlayerFromForm(button.dataset.padel144CreatePlayer); return; }
    if (button.hasAttribute("data-padel146-new-mixing")) { if ((mixingDraft || mixingSession) && !confirm("¿Empezar un mixing nuevo y descartar el temporal actual?")) return; mixingSession = null; mixingDraft = defaultDraft("mixing"); draft = mixingDraft; mixingStep = 1; mixingScreen = "builder"; render(); return; }
    if (button.hasAttribute("data-padel146-continue-mixing")) { mixingScreen = "builder"; draft = mixingDraft || defaultDraft("mixing"); mixingDraft = draft; mixingStep = mixingSession ? Math.max(4, mixingStep) : Math.max(1, Math.min(3, mixingStep)); render(); return; }
    if (button.hasAttribute("data-padel146-mixing-home")) { mixingScreen = "home"; render(); return; }
    if (button.hasAttribute("data-padel146-mixing-next")) { if (mixingStep === 1 && (!draft || draft.participantIds.length < 4)) { C.toast("Selecciona al menos cuatro jugadores activos.", "bad"); return; } if (mixingStep === 4 && !mixingSession) { C.toast("Genera primero los partidos.", "bad"); return; } mixingStep = Math.min(5, mixingStep + 1); render(); return; }
    if (button.hasAttribute("data-padel146-mixing-prev")) { mixingStep = Math.max(1, mixingStep - 1); render(); return; }
    if (button.hasAttribute("data-padel144-generate") || button.hasAttribute("data-padel144-generate-date")) {
      try { var selected = generateSession(draft); currentSessionId = selected.id; if (selected.championshipId) { currentChampionshipId = selected.championshipId; dateFormOpen = false; championshipScreen = "detail"; await persist(true); } else { mixingStep = 4; mixingScreen = "builder"; } C.toast((selected.championshipId ? "Jornada guardada" : "Mixing temporal creado") + ": " + selected.matches.length + " partidos equilibrados.", "good"); render(); } catch (error) { C.toast(error.message, "bad"); } return;
    }
    if (button.hasAttribute("data-padel144-regenerate-mixing")) { try { mixingSession = generateSession(draft); currentSessionId = mixingSession.id; mixingStep = 4; C.toast("Cruces regenerados. Nada se ha guardado en el historial.", "good"); render(); } catch (error) { C.toast(error.message, "bad"); } return; }
    if (button.hasAttribute("data-padel144-reset-mixing")) { if (!confirm("¿Descartar este mixing temporal? No afectará a jugadores ni campeonatos.")) return; mixingSession = null; currentSessionId = null; mixingDraft = null; draft = null; mixingStep = 1; mixingScreen = "home"; render(); return; }
    if (button.dataset.padel144SwapMixing) { var mixingMatch = mixingSession && mixingSession.matches.find(function (match) { return match.id === button.dataset.padel144SwapMixing; }); if (!mixingMatch || mixingMatch.teamA.length < 2 || mixingMatch.teamB.length < 1) return; var swapped = mixingMatch.teamA[1]; mixingMatch.teamA[1] = mixingMatch.teamB[0]; mixingMatch.teamB[0] = swapped; C.toast("Pareja ajustada solo para este mixing.", "good"); render(); return; }
    if (button.hasAttribute("data-padel146-new-champ")) { championshipDraft = blankChampionshipDraft(); championshipCreateStep = 1; championshipScreen = "create"; render(); return; }
    if (button.hasAttribute("data-padel149-open-ranking")) { var firstChampionship = championshipById(currentChampionshipId) || state.championships[0]; rankingChampionshipId = firstChampionship && firstChampionship.id || null; championshipScreen = "ranking"; render(); return; }
    if (button.hasAttribute("data-padel146-champ-next")) { if (!championshipDraft) championshipDraft = blankChampionshipDraft(); if (championshipCreateStep === 1 && !String(championshipDraft.name || "").trim()) { C.toast("Escribe el nombre del campeonato.", "bad"); return; } championshipCreateStep = Math.min(3, championshipCreateStep + 1); render(); return; }
    if (button.hasAttribute("data-padel146-champ-prev")) { championshipCreateStep = Math.max(1, championshipCreateStep - 1); render(); return; }
    if (button.hasAttribute("data-padel146-champ-home")) { championshipScreen = "home"; currentChampionshipId = null; currentSessionId = null; dateFormOpen = false; participantsOpen = false; draft = null; render(); return; }
    if (button.hasAttribute("data-padel146-toggle-archived")) { archivedVisible = !archivedVisible; render(); return; }
    if (button.hasAttribute("data-padel146-open-date")) { var dateChampionship = championshipById(currentChampionshipId); draft = defaultDraft("championship-date", dateChampionship); dateFormOpen = true; participantsOpen = false; currentSessionId = null; render(); return; }
    if (button.hasAttribute("data-padel146-close-date")) { dateFormOpen = false; render(); return; }
    if (button.hasAttribute("data-padel146-open-participants")) { participantsOpen = true; dateFormOpen = false; render(); return; }
    if (button.hasAttribute("data-padel146-close-participants")) { participantsOpen = false; render(); return; }
    if (button.hasAttribute("data-padel146-close-session")) { currentSessionId = null; render(); return; }
    if (button.dataset.padel144OpenSession) { currentSessionId = button.dataset.padel144OpenSession; var selectedSession = sessionById(currentSessionId); if (selectedSession && selectedSession.championshipId) { currentChampionshipId = selectedSession.championshipId; view = "championship"; championshipScreen = "detail"; dateFormOpen = false; participantsOpen = false; } render(); return; }
    if (button.dataset.padel144SaveScore) { await saveSingleResult(button.dataset.padel144SaveScore); return; }
    if (button.dataset.padel144DeleteScore) { if (!confirm("¿Deshacer este resultado? La clasificación y los historiales se recalcularán.")) return; deleteResult(state, currentSessionId, button.dataset.padel144DeleteScore); await persist(true); C.toast("Resultado eliminado y estadísticas recalculadas.", "good"); render(); return; }
    if (button.hasAttribute("data-padel144-save-all")) { await saveAllResults(); return; }
    if (button.hasAttribute("data-padel144-create-champ")) { await createChampionship(); return; }
    if (button.dataset.padel144Champ) { currentChampionshipId = button.dataset.padel144Champ; currentSessionId = null; draft = null; championshipScreen = "detail"; dateFormOpen = false; participantsOpen = false; render(); return; }
    if (button.hasAttribute("data-padel144-save-participants")) { var championship = championshipById(currentChampionshipId), nextParticipants = Array.prototype.slice.call(C.body().querySelectorAll("[data-padel144-champ-player]:checked")).map(function (input) { return input.dataset.padel144ChampPlayer; }); if (nextParticipants.length < 4) { C.toast("Mantén al menos cuatro participantes.", "bad"); return; } championship.participantIds = nextParticipants; state.updatedAt = iso(); draft = defaultDraft("championship-date", championship); participantsOpen = false; await persist(true); C.toast("Participantes actualizados.", "good"); render(); return; }
    if (button.hasAttribute("data-padel144-finish-champ")) { if (!confirm("¿Finalizar el campeonato y abrir la revisión manual de niveles?")) return; var finishing = championshipById(currentChampionshipId); finishing.status = "finished"; finishing.finishedAt = iso(); state.auditLog.push({ id: C.id("audit"), type: "championship-finished", championshipId: finishing.id, at: finishing.finishedAt }); await persist(true); render(); return; }
    if (button.hasAttribute("data-padel144-reopen-champ")) { if (!confirm("¿Reabrir este campeonato para añadir o corregir jornadas?")) return; var reopening = championshipById(currentChampionshipId); reopening.status = "active"; reopening.finishedAt = null; await persist(true); render(); return; }
    if (button.hasAttribute("data-padel144-archive-champ")) { if (!confirm("¿Archivar este campeonato? Seguirá disponible para consulta.")) return; var archive = championshipById(currentChampionshipId); archive.status = "archived"; archive.archivedAt = iso(); await persist(true); render(); return; }
    if (button.dataset.padel144ApplyLevel) { var playerId = button.dataset.padel144ApplyLevel, select = C.body().querySelector('[data-padel144-review-level="' + selectorValue(playerId) + '"]'), reason = C.body().querySelector('[data-padel144-review-reason="' + selectorValue(playerId) + '"]'), player = playerById(playerId); if (!player) return; if (select.value === player.currentLevel) { C.toast("Nivel mantenido. No se crea un cambio innecesario."); return; } if (!confirm("Cambiar a " + levelLabel(select.value) + " el nivel de " + player.name + "?")) return; changePlayerLevel(state, playerId, select.value, currentChampionshipId, reason && reason.value); await persist(true); C.toast("Nivel actualizado; los partidos anteriores conservan su nivel histórico.", "good"); render(); return; }
    if (button.dataset.padel144EditPlayer) { var editing = playerById(button.dataset.padel144EditPlayer); if (!editing) return; var renamed = prompt("Nombre del jugador " + editing.code, editing.name); if (renamed == null) return; renamed = String(renamed).trim(); if (!renamed) { C.toast("El nombre no puede quedar vacío.", "bad"); return; } var sameName = state.players.some(function (item) { return item.id !== editing.id && item.name.toLocaleLowerCase("es") === renamed.toLocaleLowerCase("es"); }); if (sameName && !confirm("Ya existe otra persona llamada " + renamed + ". ¿Quieres conservar ambas diferenciadas por su código?")) return; editing.name = renamed; state.auditLog.push({ id: C.id("audit"), type: "player-renamed", playerId: editing.id, at: iso() }); await persist(true); C.toast("Nombre actualizado. El código " + editing.code + " no cambió.", "good"); render(); return; }
    if (button.dataset.padel144TogglePlayer) { var toggle = playerById(button.dataset.padel144TogglePlayer); if (!toggle || !confirm((toggle.active ? "¿Desactivar" : "¿Reactivar") + " a " + toggle.name + " — " + toggle.code + "?")) return; toggle.active = !toggle.active; state.auditLog.push({ id: C.id("audit"), type: toggle.active ? "player-reactivated" : "player-deactivated", playerId: toggle.id, at: iso() }); await persist(true); render(); }
  }

  function handleChange(event) {
    var input = event.target;
    if (input.dataset.padel144Draft) { updateDraftFrom(input); if (input.dataset.padel144Draft === "timerMode") render(); return; }
    if (input.dataset.padel146ChampDraft) { updateChampionshipDraftFrom(input); return; }
    if (input.dataset.padel146ChampPlayer && championshipDraft) { var championshipPlayerId = input.dataset.padel146ChampPlayer, championshipIndex = championshipDraft.participantIds.indexOf(championshipPlayerId); if (input.checked && championshipIndex < 0) championshipDraft.participantIds.push(championshipPlayerId); else if (!input.checked && championshipIndex >= 0) championshipDraft.participantIds.splice(championshipIndex, 1); return; }
    if (input.dataset.padel144Player && draft) { var playerId = input.dataset.padel144Player, index = draft.participantIds.indexOf(playerId); if (input.checked && index < 0) draft.participantIds.push(playerId); else if (!input.checked && index >= 0) draft.participantIds.splice(index, 1); if (draft.kind === "mixing") { mixingDraft = draft; var counter = C.body().querySelector("[data-padel144-mixing-count]"); if (counter) counter.textContent = draft.participantIds.length + " elegidos"; } return; }
    if (input.dataset.padel144Sort) { standingsSort = input.value; render(); return; }
    if (input.hasAttribute("data-padel149-ranking-championship")) { rankingChampionshipId = input.value; render(); return; }
    if (input.dataset.padel144PlayerLevel) { var player = playerById(input.dataset.padel144PlayerLevel); if (!player) return; var nextLevel = level(input.value); if (nextLevel === player.currentLevel) return; if (!confirm("¿Cambiar a nivel " + levelLabel(nextLevel) + " a " + player.name + " — " + player.code + "?")) { render(); return; } changePlayerLevel(state, player.id, nextLevel, null, "Cambio manual desde Jugadores"); persist(true).then(function () { C.toast("Nivel actualizado para las próximas partidas.", "good"); render(); }); return; }
    if (input.matches("[data-padel144-directory-level],[data-padel144-directory-status]")) { filterDirectory(); return; }
    if (input.matches("[data-padel144-history-champ],[data-padel144-history-from],[data-padel144-history-to]")) filterHistory();
  }

  function handleInput(event) {
    var input = event.target;
    if (input.dataset.padel144Draft) updateDraftFrom(input);
    if (input.dataset.padel146ChampDraft) updateChampionshipDraftFrom(input);
    if (input.dataset.padel144PickerSearch) { var query = normalizeSearch(input.value); C.body().querySelectorAll(".c144PlayerPick").forEach(function (row) { row.hidden = Boolean(query && normalizeSearch(row.textContent || "").indexOf(query) < 0); }); }
  }

  function handleKeydown(event) {
    if (event.key === "Enter" && event.target && event.target.hasAttribute("data-padel144-directory-search")) { event.preventDefault(); findDirectoryPlayer(); }
  }

  async function open() {
    C.openModal({ module: "padel", title: "Coco Pádel", kicker: "HERRAMIENTA ILIMITADA · v154.0", html: '<div class="c144Empty"><b>Coco está cargando el club…</b></div>', dispose: dispose });
    state = await loadState(); if (!C.body()) return;
    currentChampionshipId = state.championships.find(function (item) { return item.status === "active"; }) && state.championships.find(function (item) { return item.status === "active"; }).id || state.championships[0] && state.championships[0].id || null;
    controller = new AbortController(); C.body().addEventListener("click", handleClick, { signal: controller.signal }); C.body().addEventListener("change", handleChange, { signal: controller.signal }); C.body().addEventListener("input", handleInput, { signal: controller.signal }); C.body().addEventListener("keydown", handleKeydown, { signal: controller.signal });
    view = "mixing"; currentSessionId = null; selectedPlayerId = null; mixingDraft = null; mixingSession = null; mixingScreen = "home"; mixingStep = 1; championshipScreen = "home"; championshipCreateStep = 1; championshipDraft = null; rankingChampionshipId = currentChampionshipId; archivedVisible = false; dateFormOpen = false; participantsOpen = false; draft = null; render();
  }

  function dispose() { if (controller) controller.abort(); controller = null; draft = null; mixingDraft = null; mixingSession = null; currentSessionId = null; championshipDraft = null; rankingChampionshipId = null; dateFormOpen = false; participantsOpen = false; busy = false; }

  var api = {
    version: "152.0.0", open: open, normalize: normalizeState, blankState: blankState, createPlayer: createPlayer,
    saveResult: saveResult, deleteResult: deleteResult, changePlayerLevel: changePlayerLevel,
    championshipStandings: championshipStandings, standingsForSessions: standingsForSessions,
    playerHistory: playerHistory, playerStats: playerStats, championshipPointsMap: championshipPointsMap,
    standingsPayload: standingsPayload, schedulePayload: schedulePayload, playersPayload: playersPayload,
    audit: function (targetState) {
      targetState = normalizeState(targetState || state || blankState());
      var codes = targetState.players.map(function (player) { return player.code; });
      return {
        version: targetState.version, topTabs: ["Mixing", "Campeonato", "Jugadores"], terminology: "campeonato",
        playerCreationArea: "Jugadores", explicitPlayerSearch: true, accentInsensitiveSearch: true,
        unlimited: true, mixingLandingFirst: true, championshipLandingFirst: true, championshipRankingSelector: true,
        whatsappDirect: ["mixing", "championship", "session", "players"], clipboardCopy: true, excelExport: false, printExport: false,
        resultEntry: "set-by-set", maxSetsVisible: 3, rankingsIncludeSets: true, rankingsRecalculateFromResults: true, playerCardsUseAbbreviations: false, playerCardMetrics: ["Partidos jugados", "Victorias", "Derrotas"],
        mixingPersisted: false, mixingStoresResults: false, mixingAffectsPoints: false,
        playerCount: targetState.players.length, uniqueCodes: new Set(codes).size === codes.length, codesImmutable: true,
        statsDerivedFromResults: true, playerPointsSource: "championship-results-only", levelsAutomatic: false,
        championshipDates: targetState.sessions.filter(function (item) { return Boolean(item.championshipId); }).length,
        championships: targetState.championships.length
      };
    }
  };
  root.CocoPadelV152 = api;
  root.CocoPadelV151 = api;
  root.CocoPadelV150 = api;
  root.CocoPadelV149 = api;
  root.CocoPadelV148 = api;
  root.CocoPadelV147 = api;
  root.CocoPadelV146 = api;
  root.CocoPadelV145 = api;
  root.CocoPadelV144 = api;
})(window);
