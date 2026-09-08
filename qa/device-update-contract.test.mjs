import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const index = readFileSync("index.html", "utf8");
const reto = readFileSync("coco-reto-2026-v160908.js", "utf8");
const serviceWorker = readFileSync("sw.js", "utf8");
const manifest = JSON.parse(readFileSync("manifest.webmanifest", "utf8"));
const workflow = readFileSync(".github/workflows/eterna-authenticated-preview.yml", "utf8");
const browserQa = readFileSync("qa/device-update-browser.mjs", "utf8");

const directScripts = [
  '<script id="coco-product-ux-v160903" src="./coco-release-v160903.js?v=160960"></script>',
  '<script id="coco-reto-2026-direct" src="./coco-reto-2026-v160908.js?v=160961"></script>',
  '<script id="eterna-hotfix-v160902-direct" src="./eterna-hotfix-v160902.js?v=160960"></script>',
  '<script id="eterna-desktop-compact-v160907-direct" src="./eterna-desktop-compact-v160907.js?v=160960"></script>',
];

test("first visits load every production presentation layer without depending on a Service Worker", () => {
  for (const script of directScripts) assert.equal(index.split(script).length - 1, 1, script);
  assert.ok(index.indexOf(directScripts[0]) > index.indexOf('id="coco-v153-fixes"'));
  assert.ok(index.indexOf(directScripts[1]) > index.indexOf(directScripts[0]));
  assert.ok(index.indexOf(directScripts[2]) > index.indexOf('id="coco-v159-eterna"'));
  assert.ok(index.indexOf(directScripts[3]) > index.indexOf(directScripts[2]));
});

test("PWA clients request and activate the current release instead of retaining an old device cache", () => {
  assert.match(index, /manifest\.webmanifest\?v=160960/);
  assert.match(index, /sw\.js\?v=160960-r1/);
  assert.match(index, /updateViaCache:"none"/);
  assert.match(index, /registration\.update\(\)/);
  assert.match(index, /serviceWorker\.addEventListener\("controllerchange"/);
  assert.match(index, /location\.reload\(\)/);

  assert.match(serviceWorker, /CACHE_VERSION="coco-en-forma-v160\.96\.0-launch-excellence-r1"/);
  for (const asset of [
    "coco-variety-director-v160960.js",
    "coco-release-v160903.js",
    "coco-reto-2026-v160908.js",
    "reto-coco-2026-v160958.jpg",
    "coco-excellence-v160934.js",
    "eterna-v159.js",
  ]) assert.match(serviceWorker, new RegExp(asset.replaceAll(".", "\\.")), asset);
  assert.match(serviceWorker, /cache:"reload"/);
  assert.match(serviceWorker, /self\.skipWaiting\(\)/);
  assert.match(serviceWorker, /caches\.delete\(k\)/);
  assert.match(serviceWorker, /self\.clients\.claim\(\)/);
  assert.equal(manifest.orientation, "any");
  assert.equal(manifest.display, "standalone");
});

test("Reto Coco owns deterministic mobile and desktop placement and reacts to device changes", () => {
  assert.match(reto, /@media\(min-width:901px\)/);
  assert.match(reto, /@media\(max-width:900px\)/);
  assert.match(reto, /window\.innerWidth>900/);
  assert.match(reto, /brand\.insertBefore\(c,brand\.firstChild\)/);
  assert.match(reto, /parent\.insertBefore\(c,games\)/);
  assert.match(reto, /parent\.insertBefore\(brand,games\.nextSibling\)/);
  assert.match(reto, /addEventListener\('resize',schedule/);
  assert.match(reto, /addEventListener\('orientationchange',schedule/);
  assert.match(reto, /width:calc\(100% - 28px\);max-width:430px/);
  assert.match(reto, /aspect-ratio:3\/4/);
});

test("the live preview gate covers representative devices, rotation, overflow and exact revision delivery", () => {
  for (const dimensions of ["320, height: 568", "360, height: 800", "390, height: 844", "430, height: 932", "844, height: 390", "768, height: 1024", "1024, height: 768", "1280, height: 720", "1440, height: 900", "1920, height: 1080"]) {
    assert.match(browserQa, new RegExp(`width: ${dimensions}`), dimensions);
  }
  assert.match(browserQa, /serviceWorkers: "block"/);
  assert.match(browserQa, /attempt <= 10/);
  assert.match(browserQa, /"Cache-Control": "no-cache"/);
  assert.match(browserQa, /verify=\$\{nonce\}/);
  assert.match(browserQa, /htmlScrollWidth <= profile\.width \+ 1/);
  assert.match(browserQa, /naturalWidth, 1200/);
  assert.match(browserQa, /naturalHeight, 1600/);
  assert.match(browserQa, /orientación y breakpoint 390x844/);
  assert.match(workflow, /node qa\/device-update-browser\.mjs/);
  assert.match(workflow, /COCO_QA_EXPECTED_COMMIT: \$\{\{ github\.sha \}\}/);
  for (const name of ["iphone-safari", "android-chrome", "ipad-safari", "desktop-safari", "desktop-chrome"]) assert.match(workflow, new RegExp(name));
});
