import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync("index.html", "utf8");
const scoringSource = readFileSync("coco-scoring-v160110.js", "utf8");
const context = { window: {} };
vm.runInNewContext(scoringSource, context);
const scoring = context.window.CocoScoringV160110;

test("Fútbol Rayo conserva una bonificación moderada dentro de la escala común", () => {
  assert.equal(scoring.cap("futbol", 3), 110);
  assert.equal(scoring.cap("futbol", 4), 114);
  assert.ok(scoring.cap("futbol", 4) > scoring.cap("futbol", 3));
  assert.ok(scoring.cap("futbol", 4) / scoring.cap("futbol", 3) < 1.05);
  assert.match(source, /function footballMaxPoints\(\)\{return balancedCap\("futbol",active&&active\.level\|\|2\)\}/);
  assert.match(source, /active\.sportScore=balancedScore\("futbol",active\.level,active\.sportQuality\/active\.total\)/);
  assert.match(source, /points=footballPoints\(quality\)/);
  assert.match(source, /futbol:114,padel:1000/);
  assert.doesNotMatch(source, /active&&active\.level===4\?1300:1000/);
});
