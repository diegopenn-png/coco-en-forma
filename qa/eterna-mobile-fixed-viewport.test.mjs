import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const qaDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.dirname(qaDir);
const read = file => fs.readFileSync(path.join(rootDir, file), "utf8");

test("Eterna owns the mobile visual viewport while it is open", () => {
  const core = read("eterna-v159.js");

  assert.match(core, /mobile-fixed-viewport/);
  assert.match(core, /function lockEternaViewport\(o\)/);
  assert.match(core, /body\.style\.position="fixed"/);
  assert.match(core, /body\.style\.top=\(-eternaPageLock\.y\)\+"px"/);
  assert.match(core, /window\.visualViewport\.addEventListener\("resize",syncEternaVisualViewport\)/);
  assert.match(core, /window\.visualViewport\.addEventListener\("scroll",syncEternaVisualViewport\)/);
  assert.match(core, /--eterna-vv-height/);
  assert.match(core, /height:var\(--eterna-vv-height,100dvh\)!important/);
  assert.match(core, /background:#f7fcff!important/);
});

test("only Eterna chat scrolls and the page lock is reversible", () => {
  const core = read("eterna-v159.js");

  assert.match(core, /\.eternaV159Body,#eternaOverlayV159 \.eternaV159Main\{min-height:0!important;height:100%!important;overflow:hidden!important\}/);
  assert.match(core, /\.eternaV159Chat\{min-height:0!important;overflow-x:hidden!important;overflow-y:auto!important;overscroll-behavior:contain!important/);
  assert.match(core, /function unlockEternaViewport\(\)/);
  assert.match(core, /body\.style\.position=lock\.bodyPosition/);
  assert.match(core, /window\.scrollTo\(lock\.x,lock\.y\)/);
  assert.match(core, /new MutationObserver\(function\(\)/);
});

test("dynamic viewport wins over the small-viewport fallback", () => {
  const core = read("eterna-v159.js");
  const fallback = core.indexOf("height:100svh!important;height:100dvh!important");
  assert.ok(fallback >= 0, "100dvh debe prevalecer sobre 100svh");
  assert.doesNotMatch(core, /height:100dvh!important;height:100svh!important/);
});

test("the release invalidates both document and service-worker caches", () => {
  assert.match(read("index.html"), /eterna-v159\.js\?v=160941/);
  assert.match(read("sw.js"), /coco-en-forma-v160\.94\.2-audit-1-3-r1/);
});
