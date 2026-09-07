import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync("index.html", "utf8");

test("Fútbol Rayo awards exactly 300 points more than Avanzado", () => {
  assert.match(source, /function footballMaxPoints\(\)\{return active&&active\.level===4\?1300:1000\}/);
  assert.match(source, /function footballPoints\(quality\)\{return Math\.round\(clamp\(quality,0,1\)\*\(footballMaxPoints\(\)\/active\.total\)\)\}/);
  assert.match(source, /points=footballPoints\(quality\)/);
  assert.match(source, /active\.sportScore=Math\.min\(footballMaxPoints\(\),active\.sportScore\+points\)/);
  assert.match(source, /var scoreLimit=id==="futbol"\?1300:1000/);
  assert.match(source, /futbol:1300,padel:1000/);
  assert.equal(1300 - 1000, 300);
});
