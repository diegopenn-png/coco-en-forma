import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const experience = readFileSync("eterna-experience-v160.js", "utf8");

test("the complete accessible Eterna launcher remains actionable after closing", () => {
  assert.match(experience, /\.eternaLauncherCardV159\{cursor:pointer!important;touch-action:manipulation!important\}/);
  assert.match(experience, /if\(launcher\)\{e\.preventDefault\(\);e\.stopImmediatePropagation\(\);setIntent\("home"\)/);
  assert.doesNotMatch(experience, /if\(launcher&&!cta\)\{e\.preventDefault\(\);e\.stopImmediatePropagation\(\);return\}/);
});

test("the logged-out orange CTA still routes directly to account creation", () => {
  assert.match(experience, /if\(loginVisible\(\)&&cta\)goCreateAccount\(\);else runState\(\)/);
});
