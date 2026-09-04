(function installEternaStateContractV3(root) {
  "use strict";

  if (root.EternaStateContractV3) return;

  var CONTRACT_VERSION = 3;
  var MODES = Object.freeze(["homework", "ask", "review", "explain", "exam", "practice"]);
  var PHASES = Object.freeze(["ASK", "WAIT", "ASSESS", "FEEDBACK", "NEXT", "CLOSE"]);
  var EVENTS = Object.freeze({
    QUESTION_ISSUED: "QUESTION_ISSUED",
    ANSWER_RECEIVED: "ANSWER_RECEIVED",
    ASSESSMENT_RECORDED: "ASSESSMENT_RECORDED",
    FEEDBACK_DELIVERED: "FEEDBACK_DELIVERED",
    CONTINUE: "CONTINUE",
    HINT_USED: "HINT_USED",
    SESSION_CLOSED: "SESSION_CLOSED"
  });
  var ASSESSMENTS = Object.freeze(["correct", "partial", "incorrect", "not_applicable"]);
  var TARGET_KEYS = Object.freeze(["curriculum_id", "subject_id", "skill_id", "level_id", "label", "source"]);
  var PERSISTENCE_KEYS = Object.freeze([
    "contract_version", "session_id", "mode", "phase", "question_id", "practice_target",
    "question_number", "correct_count", "partial_count", "incorrect_count", "difficulty",
    "hints_used", "last_action_id", "next_transition"
  ]);
  var NEXT_TRANSITION = Object.freeze({
    ASK: "WAIT",
    WAIT: "ASSESS",
    ASSESS: "FEEDBACK",
    FEEDBACK: "NEXT_OR_CLOSE",
    NEXT: "ASK_OR_CLOSE",
    CLOSE: null
  });
  var ALLOWED_EVENTS = Object.freeze({
    ASK: Object.freeze([EVENTS.QUESTION_ISSUED]),
    WAIT: Object.freeze([EVENTS.ANSWER_RECEIVED, EVENTS.HINT_USED]),
    ASSESS: Object.freeze([EVENTS.ASSESSMENT_RECORDED]),
    FEEDBACK: Object.freeze([EVENTS.FEEDBACK_DELIVERED]),
    NEXT: Object.freeze([EVENTS.CONTINUE]),
    CLOSE: Object.freeze([])
  });

  function isRecord(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function boundedInteger(value, fallback, minimum, maximum) {
    var number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.max(minimum, Math.min(maximum, Math.trunc(number)));
  }

  function validOpaqueId(value) {
    return typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._:-]{5,127}$/.test(value);
  }

  function makeOpaqueId(prefix) {
    var random = "";
    try {
      if (root.crypto && typeof root.crypto.randomUUID === "function") random = root.crypto.randomUUID();
    } catch (_) {}
    if (!random) {
      random = Date.now().toString(36) + "-" + Math.random().toString(36).slice(2) + "-" + Math.random().toString(36).slice(2);
    }
    return String(prefix || "id") + ":" + random;
  }

  function cleanIdentifier(value) {
    if (typeof value !== "string") return null;
    var clean = value.trim().slice(0, 64);
    return /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,63}$/.test(clean) ? clean : null;
  }

  function cleanCurriculumLabel(value) {
    if (typeof value !== "string") return null;
    var clean = value.normalize ? value.normalize("NFKC") : value;
    clean = clean
      .replace(/[\u0000-\u001f\u007f]/g, " ")
      .replace(/[<>\[\]{}]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80);
    return clean || null;
  }

  function sanitizePracticeTarget(value) {
    if (!isRecord(value)) return null;
    var target = {
      curriculum_id: cleanIdentifier(value.curriculum_id),
      subject_id: cleanIdentifier(value.subject_id),
      skill_id: cleanIdentifier(value.skill_id),
      level_id: cleanIdentifier(value.level_id),
      label: cleanCurriculumLabel(value.label),
      source: ["explicit", "progress", "curriculum"].includes(value.source) ? value.source : null
    };
    return TARGET_KEYS.some(function hasTargetValue(key) { return Boolean(target[key]); }) ? target : null;
  }

  function normalizeQuestion(value) {
    if (typeof value !== "string") return "";
    var normalized = value.normalize ? value.normalize("NFKC") : value;
    return normalized
      .replace(/[\u0000-\u001f\u007f]/g, " ")
      .replace(/[“”]/g, "\"")
      .replace(/[‘’]/g, "'")
      .replace(/\s+/g, " ")
      .trim()
      .toLocaleLowerCase("es");
  }

  function sameQuestion(left, right) {
    var a = normalizeQuestion(left);
    var b = normalizeQuestion(right);
    return Boolean(a && b && a === b);
  }

  function resolveQuestionId(currentState, options) {
    var current = isRecord(currentState) ? currentState : {};
    var details = isRecord(options) ? options : {};
    var identical = details.same_question === true || sameQuestion(details.previous_question, details.question);
    if (identical && validOpaqueId(current.question_id)) return current.question_id;
    if (validOpaqueId(details.question_id)) return details.question_id;
    return makeOpaqueId("question");
  }

  function rawPhaseRequiresQuestionId(phase) {
    return phase === "WAIT" || phase === "ASSESS" || phase === "FEEDBACK";
  }

  function sanitizeActivityState(value, defaults) {
    var input = isRecord(value) ? value : {};
    var fallback = isRecord(defaults) ? defaults : {};
    var mode = MODES.includes(input.mode) ? input.mode : (MODES.includes(fallback.mode) ? fallback.mode : "homework");
    var sessionId = validOpaqueId(input.session_id)
      ? input.session_id
      : (validOpaqueId(fallback.session_id) ? fallback.session_id : makeOpaqueId("session"));
    var phase = PHASES.includes(input.phase) ? input.phase : "ASK";
    var questionId = validOpaqueId(input.question_id) ? input.question_id : null;
    if (rawPhaseRequiresQuestionId(phase) && !questionId) phase = "ASK";
    if (phase === "CLOSE") questionId = null;
    return {
      contract_version: CONTRACT_VERSION,
      session_id: sessionId,
      mode: mode,
      phase: phase,
      question_id: questionId,
      practice_target: sanitizePracticeTarget(input.practice_target || fallback.practice_target),
      question_number: boundedInteger(input.question_number, 1, 1, 10000),
      correct_count: boundedInteger(input.correct_count, 0, 0, 10000),
      partial_count: boundedInteger(input.partial_count, 0, 0, 10000),
      incorrect_count: boundedInteger(input.incorrect_count, 0, 0, 10000),
      difficulty: boundedInteger(input.difficulty, 2, 1, 5),
      hints_used: boundedInteger(input.hints_used, 0, 0, 10000),
      last_action_id: validOpaqueId(input.last_action_id) ? input.last_action_id : null,
      next_transition: NEXT_TRANSITION[phase]
    };
  }

  function createActivityState(options) {
    var input = isRecord(options) ? options : {};
    return sanitizeActivityState({
      session_id: input.session_id,
      mode: input.mode,
      phase: "ASK",
      question_id: null,
      practice_target: input.practice_target,
      question_number: 1,
      correct_count: 0,
      partial_count: 0,
      incorrect_count: 0,
      difficulty: input.difficulty,
      hints_used: 0,
      last_action_id: null
    });
  }

  function validationError(code, field) {
    return { code: code, field: field };
  }

  function validateActivityRequest(value, expectations) {
    var input = isRecord(value) ? value : {};
    var expected = isRecord(expectations) ? expectations : {};
    var errors = [];
    if (!isRecord(value)) errors.push(validationError("INVALID_ACTIVITY_STATE", "activity_state"));
    if (input.contract_version !== CONTRACT_VERSION) errors.push(validationError("UNSUPPORTED_CONTRACT_VERSION", "contract_version"));
    if (!MODES.includes(input.mode)) errors.push(validationError("INVALID_MODE", "mode"));
    if (!validOpaqueId(input.session_id)) errors.push(validationError("INVALID_SESSION_ID", "session_id"));
    if (!PHASES.includes(input.phase)) errors.push(validationError("INVALID_PHASE", "phase"));
    if (rawPhaseRequiresQuestionId(input.phase) && !validOpaqueId(input.question_id)) {
      errors.push(validationError("MISSING_QUESTION_ID", "question_id"));
    }
    if (expected.expected_mode && input.mode !== expected.expected_mode) {
      errors.push(validationError("MODE_MISMATCH", "mode"));
    }
    if (expected.expected_session_id && input.session_id !== expected.expected_session_id) {
      errors.push(validationError("SESSION_MISMATCH", "session_id"));
    }
    if (expected.require_answer === true && !validOpaqueId(expected.answered_question_id)) {
      errors.push(validationError("MISSING_ANSWERED_QUESTION_ID", "answered_question_id"));
    } else if (expected.answered_question_id != null && !validOpaqueId(expected.answered_question_id)) {
      errors.push(validationError("INVALID_ANSWERED_QUESTION_ID", "answered_question_id"));
    } else if (validOpaqueId(expected.answered_question_id) && input.question_id !== expected.answered_question_id) {
      errors.push(validationError("STALE_QUESTION", "answered_question_id"));
    }
    return { ok: errors.length === 0, errors: errors, state: sanitizeActivityState(input) };
  }

  function transitionFailure(code, state, field) {
    var error = validationError(code, field || "event");
    return { ok: false, duplicate: false, error: error, errors: [error], state: state };
  }

  function transitionActivityState(value, event, details) {
    var payload = isRecord(details) ? details : {};
    var validation = validateActivityRequest(value, {
      expected_mode: payload.expected_mode,
      expected_session_id: payload.expected_session_id
    });
    var current = validation.state;
    if (!validation.ok) return { ok: false, duplicate: false, errors: validation.errors, state: current };
    if (!validOpaqueId(payload.action_id)) return transitionFailure("MISSING_ACTION_ID", current, "action_id");
    if (payload.action_id === current.last_action_id) {
      return { ok: true, duplicate: true, state: current };
    }
    if (event === EVENTS.SESSION_CLOSED) {
      if (current.phase === "CLOSE") return { ok: true, duplicate: true, state: current };
      var closed = Object.assign({}, current, {
        phase: "CLOSE",
        question_id: null,
        last_action_id: payload.action_id,
        next_transition: NEXT_TRANSITION.CLOSE
      });
      return { ok: true, duplicate: false, state: closed };
    }
    if (!Object.prototype.hasOwnProperty.call(EVENTS, event) || !ALLOWED_EVENTS[current.phase].includes(event)) {
      return transitionFailure("TRANSITION_NOT_ALLOWED", current, "event");
    }

    var next = Object.assign({}, current);
    if (event === EVENTS.QUESTION_ISSUED) {
      next.phase = "WAIT";
      next.question_id = resolveQuestionId(current, payload);
    } else if (event === EVENTS.HINT_USED) {
      next.hints_used = boundedInteger(current.hints_used + 1, current.hints_used, 0, 10000);
    } else if (event === EVENTS.ANSWER_RECEIVED) {
      var answerValidation = validateActivityRequest(current, {
        expected_mode: payload.expected_mode,
        expected_session_id: payload.expected_session_id,
        answered_question_id: payload.answered_question_id,
        require_answer: true
      });
      if (!answerValidation.ok) return { ok: false, duplicate: false, errors: answerValidation.errors, state: current };
      next.phase = "ASSESS";
    } else if (event === EVENTS.ASSESSMENT_RECORDED) {
      if (!ASSESSMENTS.includes(payload.assessment)) {
        return transitionFailure("INVALID_ASSESSMENT", current, "assessment");
      }
      if (payload.assessment === "correct") next.correct_count += 1;
      if (payload.assessment === "partial") next.partial_count += 1;
      if (payload.assessment === "incorrect") next.incorrect_count += 1;
      next.phase = "FEEDBACK";
    } else if (event === EVENTS.FEEDBACK_DELIVERED) {
      next.phase = "NEXT";
    } else if (event === EVENTS.CONTINUE) {
      next.phase = "ASK";
      if (payload.advance_question !== false) next.question_number = boundedInteger(current.question_number + 1, current.question_number, 1, 10000);
    }
    next.last_action_id = payload.action_id;
    next.next_transition = NEXT_TRANSITION[next.phase];
    return { ok: true, duplicate: false, state: sanitizeActivityState(next) };
  }

  function toPersistentActivityState(value) {
    var state = sanitizeActivityState(value);
    var persisted = {};
    PERSISTENCE_KEYS.forEach(function copyWhitelistedKey(key) {
      persisted[key] = key === "practice_target" ? sanitizePracticeTarget(state[key]) : state[key];
    });
    return persisted;
  }

  root.EternaStateContractV3 = Object.freeze({
    CONTRACT_VERSION: CONTRACT_VERSION,
    MODES: MODES,
    PHASES: PHASES,
    EVENTS: EVENTS,
    ASSESSMENTS: ASSESSMENTS,
    PERSISTENCE_KEYS: PERSISTENCE_KEYS,
    createActivityState: createActivityState,
    sanitizeActivityState: sanitizeActivityState,
    sanitizePracticeTarget: sanitizePracticeTarget,
    validateActivityRequest: validateActivityRequest,
    transitionActivityState: transitionActivityState,
    sameQuestion: sameQuestion,
    resolveQuestionId: resolveQuestionId,
    toPersistentActivityState: toPersistentActivityState,
    validOpaqueId: validOpaqueId
  });
})(globalThis);
