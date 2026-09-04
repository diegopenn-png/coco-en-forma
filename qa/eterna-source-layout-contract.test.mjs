import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

test("Eterna has one canonical Worker entrypoint", () => {
  const wrangler = readFileSync("eterna-worker/wrangler.jsonc", "utf8");
  const worker = readFileSync("eterna-worker/src/index.js", "utf8");

  assert.match(wrangler, /"main"\s*:\s*"src\/index\.js"/);
  assert.match(worker, /160\.93\.0-ux-completion-and-progressive-hints/);
  assert.equal(existsSync("eterna-worker/src/src/index.js"), false);
});
