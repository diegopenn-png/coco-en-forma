import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const root = new URL("../../", import.meta.url);
const client = readFileSync(new URL("eterna-v159.js", root), "utf8");
const experience = readFileSync(new URL("eterna-experience-v160.js", root), "utf8");
const index = readFileSync(new URL("index.html", root), "utf8");
const productUx = readFileSync(new URL("coco-release-v160903.js", root), "utf8");
const dailyRuntime = readFileSync(new URL("coco-v142-runtime.js", root), "utf8");

function functionBody(source, name, nextName) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `missing ${name}`);
  const end = nextName ? source.indexOf(`function ${nextName}(`, start + 1) : source.length;
  assert.notEqual(end, -1, `missing boundary ${nextName}`);
  return source.slice(start, end);
}

test("chat requests carry the canonical v3 identity envelope", () => {
  const send = functionBody(client, "send", "feedback");
  for (const field of [
    "client_state_contract:3",
    "activity_state",
    "session_id",
    "request_id",
    "client_turn_id",
    "answered_question_id",
    "student_action"
  ]) assert.match(send, new RegExp(field));
  assert.match(send, /toPersistentActivityState\(activity\)/);
});

test("one canonical reducer validates identity and deduplicates every response", () => {
  const apply = functionBody(client, "applyChatResponse", "send");
  assert.match(apply, /responseContextValid/);
  assert.match(apply, /state\.appliedResponses\.has/);
  assert.match(apply, /validateActivityRequest/);
  assert.match(apply, /expected_mode:context\.mode/);
  assert.match(apply, /expected_session_id:context\.session_id/);
  assert.match(client, /applyChatResponse:applyChatResponse/);
});

test("failed sends are not committed to canonical history", () => {
  const send = functionBody(client, "send", "feedback");
  assert.doesNotMatch(send, /state\.history\.push\(\{role:"user"/);
  assert.match(send, /userEntry=\{role:"user"/);
  const apply = functionBody(client, "applyChatResponse", "send");
  assert.match(apply, /if\(context\.userEntry\)state\.history\.push\(context\.userEntry\)/);
});

test("refresh persistence is a v3 whitelist and contains no raw academic state", () => {
  const persist = functionBody(client, "persistLearningSession", "restoreLearningSession");
  assert.match(persist, /toPersistentActivityState/);
  assert.doesNotMatch(persist, /history|conversationState|pedagogicalState|imageData|pending_question/);
  const restore = functionBody(client, "restoreLearningSession", "preferredStudentName");
  assert.match(restore, /saved\.version!==3/);
  assert.doesNotMatch(restore, /saved\.(?:history|conversationState|pedagogicalState|imageData)/);
  assert.match(restore, /candidate\.phase!=="ASK"&&candidate\.phase!=="CLOSE"/);
  assert.match(restore, /phase:"ASK",question_id:null,last_action_id:null/);
  assert.match(restore, /continuaremos con una pregunta nueva/);
});

test("client trials fail closed when the end timestamp is absent or invalid", () => {
  const active = functionBody(client, "activeSubscription", "trialExpired");
  assert.match(active, /status\|\|""\)\.toLowerCase\(\)!=="trialing"/);
  assert.match(active, /Number\.isFinite\(end\)&&end>Date\.now\(\)/);
  assert.doesNotMatch(active, /!s\.trial_end\)return true/);
  const expired = functionBody(client, "trialExpired", "trialLabel");
  assert.match(expired, /status==="trialing"&&\(!Number\.isFinite\(end\)\|\|end<=Date\.now\(\)\)/);
});

test("hint stays canonical while understood closes the UX activity without grading", () => {
  const actions = functionBody(client, "sendStudentAction", "prepareImage");
  assert.match(actions, /activity\.phase!=="WAIT"/);
  assert.match(actions, /meta\.question_id!==activity\.question_id/);
  assert.match(actions, /studentAction:"hint_request"/);
  assert.match(actions, /if\(action==="understood"\)\{completeActivity/);
  assert.match(client, /sendStudentAction\("understood"/);
  assert.match(client, /sendStudentAction\("hint_request"/);
  const feedback = functionBody(client, "feedback", "sendStudentAction");
  assert.match(feedback, /event_id:eventId/);
  assert.match(feedback, /session_id:/);
  assert.match(feedback, /question_id:/);
  assert.match(feedback, /submittedFeedback\.has/);
  const completion = functionBody(client, "completeActivity", "sendStudentAction");
  assert.match(completion, /closeActivity\(state\.mode\)/);
  assert.match(completion, /ACTIVIDAD TERMINADA/);
});

test("only the current WAIT question can render actionable quick controls", () => {
  assert.match(client, /function messageIsActionable\(meta,explicit\).*activity\.phase==="WAIT".*activity\.question_id===qid/);
  assert.match(client, /removeStaleQuickActions\(\)/);
  assert.match(client, /index===state\.history\.length-1/);
});

test("mode switch and close invalidate in-flight work", () => {
  const setMode = functionBody(client, "setMode", "showModePicker");
  assert.match(setMode, /invalidateInFlight\("mode-switch"\)/);
  assert.match(setMode, /closeActivity\(previous\)/);
  const close = functionBody(client, "close", "goToLogin");
  assert.match(close, /invalidateInFlight\("overlay-close"\)/);
  assert.match(close, /closeActivity\(state\.mode\)/);
});

test("background recovery stores only scoped identifiers and delegates to the reducer", () => {
  const write = functionBody(experience, "pendingJobWrite", "responseIdentity");
  assert.match(write, /sessionStorage\.setItem/);
  for (const field of ["uid", "mode", "session_id", "question_id", "answered_question_id", "request_id", "client_turn_id"]) {
    assert.match(write, new RegExp(`${field}:`));
  }
  assert.doesNotMatch(write, /text|reply|history|image|pedagogical_state/);
  const recovery = functionBody(experience, "recoveredReplyRow", "resumePendingChatJob");
  assert.match(recovery, /core\.applyChatResponse\(data,context\)/);
  assert.doesNotMatch(recovery, /createElement\("div"\).*eternaV159Msg|bubble\.textContent=clean\(data\.reply\)/s);
  const resume = functionBody(experience, "resumePendingChatJob", "handleChatResponse");
  assert.match(resume, /uid!==pending\.uid/);
  assert.match(resume, /current\.mode!==pending\.mode/);
  assert.match(resume, /current\.session_id!==pending\.session_id/);
  assert.match(resume, /current\.question_id!==pending\.answered_question_id/);
});

test("master UI access derives from propietario role, never a public email allowlist", () => {
  assert.match(client, /select\("apodo,edad,rol"\)/);
  assert.match(client, /state\.baseProfile&&String\(state\.baseProfile\.rol\|\|""\)\.toLowerCase\(\)==="propietario"/);
  assert.match(experience, /from\("perfiles"\)\.select\("rol"\)/);
  assert.match(experience, /String\(profile\.data\.rol\|\|""\)\.toLowerCase\(\)==="propietario"/);
  for (const source of [client, experience, index, productUx, dailyRuntime]) {
    assert.doesNotMatch(source, /cuentasPruebaIlimitadas/i);
  }
  assert.doesNotMatch(index, /diegopenn@icloud\.com/i);
});
