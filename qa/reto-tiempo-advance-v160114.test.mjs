import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const html = readFileSync("index.html", "utf8");
const start = html.indexOf("function answerTime(choice,timedOut)");
const end = html.indexOf("var FOOTBALL_ZONES", start);
assert.ok(start >= 0 && end > start, "answerTime debe existir completo");
const answerTimeSource = html.slice(start, end);

function runtime() {
  const scheduled = [];
  const feedbackNodes = {
    ".cocoArcadeFeedbackIcon": { textContent: "" },
    "b": { textContent: "" },
    "p": { textContent: "" }
  };
  const feedback = {
    classList: { add() {} },
    querySelector(selector) { return feedbackNodes[selector]; }
  };
  const context = {
    active: {
      locked: false,
      frame: 1,
      question: {
        answer: 1,
        options: ["M", "L", "J"],
        explanation: "La serie avanza de dos en dos."
      },
      deadline: 1000,
      roundDuration: 1000,
      correct: 0,
      streak: 0,
      maxStreak: 0,
      timeScore: 0,
      index: 0,
      total: 10,
      id: "tiempo",
      level: 3,
      startedAt: 0
    },
    performance: { now() { return 500; } },
    cancelAnimationFrame() {},
    clamp(value, min, max) { return Math.max(min, Math.min(max, value)); },
    vibrate() {},
    window: {},
    body: {
      querySelectorAll() { return []; },
      querySelector(selector) {
        assert.equal(selector, ".cocoArcadeFeedback");
        return feedback;
      }
    },
    announce() {},
    balancedScore(_id, _level, performanceRatio) {
      return Math.round(performanceRatio * 100);
    },
    setHud() {},
    setTimer(callback, delay) { scheduled.push({ callback, delay }); },
    finishGame() {},
    renderTimeRoundCalls: 0,
    renderTimeRound() { context.renderTimeRoundCalls += 1; }
  };
  vm.runInNewContext(`${answerTimeSource};globalThis.answerTime=answerTime`, context);
  return { context, scheduled };
}

test("Reto Tiempo conserva el reloj nativo al procesar una respuesta", () => {
  assert.doesNotMatch(answerTimeSource, /\b(?:var|let|const)\s+performance\b/);
  const { context, scheduled } = runtime();
  assert.doesNotThrow(() => context.answerTime(1, false));
  assert.equal(context.active.correct, 1);
  assert.equal(scheduled.length, 1);
  assert.equal(scheduled[0].delay, 950);
  scheduled[0].callback();
  assert.equal(context.active.index, 1);
  assert.equal(context.renderTimeRoundCalls, 1);
});

test("Reto Tiempo avanza también cuando se agota el tiempo", () => {
  const { context, scheduled } = runtime();
  assert.doesNotThrow(() => context.answerTime(-1, true));
  assert.equal(context.active.correct, 0);
  assert.equal(scheduled.length, 1);
  scheduled[0].callback();
  assert.equal(context.active.index, 1);
  assert.equal(context.renderTimeRoundCalls, 1);
});
