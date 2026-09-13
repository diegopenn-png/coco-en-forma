import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const index = readFileSync("index.html", "utf8");
const reto = readFileSync("coco-reto-2026-v160908.js", "utf8");
const serviceWorker = readFileSync("sw.js", "utf8");
const runtime = readFileSync("coco-v142-runtime.js", "utf8");
const legacyRuntime = readFileSync("coco-v141-runtime.js", "utf8");
const pwaManager = readFileSync("coco-v152-pwa.js", "utf8");
const manifest = JSON.parse(readFileSync("manifest.webmanifest", "utf8"));
const workflow = readFileSync(".github/workflows/eterna-authenticated-preview.yml", "utf8");
const browserQa = readFileSync("qa/device-update-browser.mjs", "utf8");

function extractPwaRegistrar(source) {
  const start = source.indexOf("  function registerPwa() {");
  const end = source.indexOf("\n\n  window.CocoRotationV134", start);
  assert.ok(start >= 0 && end > start, "PWA registrar not found");
  return source.slice(start, end);
}

const directScripts = [
  '<script id="coco-product-ux-v160903" src="./coco-release-v160903.js?v=160960"></script>',
  '<script id="coco-reto-2026-direct" src="./coco-reto-2026-v160908.js?v=160100"></script>',
  '<script id="coco-family-friendly-v160100" src="./coco-family-friendly-v160100.js?v=160100"></script>',
  '<script id="eterna-hotfix-v160902-direct" src="./eterna-hotfix-v160902.js?v=160960"></script>',
  '<script id="eterna-desktop-compact-v160907-direct" src="./eterna-desktop-compact-v160907.js?v=160960"></script>',
];

test("first visits load every production presentation layer without depending on a Service Worker", () => {
  for (const script of directScripts) assert.equal(index.split(script).length - 1, 1, script);
  assert.ok(index.indexOf(directScripts[0]) > index.indexOf('id="coco-v153-fixes"'));
  assert.ok(index.indexOf(directScripts[1]) > index.indexOf(directScripts[0]));
  assert.ok(index.indexOf(directScripts[2]) > index.indexOf(directScripts[1]));
  assert.ok(index.indexOf(directScripts[3]) > index.indexOf('id="coco-v159-eterna"'));
  assert.ok(index.indexOf(directScripts[4]) > index.indexOf(directScripts[3]));
});

test("PWA clients request and activate the current release instead of retaining an old device cache", () => {
  assert.match(index, /manifest\.webmanifest\?v=160100/);
  assert.match(index, /sw\.js\?v=160101-r2/);
  assert.match(index, /updateViaCache:"none"/);
  assert.match(index, /registration\.update\(\)/);
  assert.match(index, /serviceWorker\.addEventListener\("controllerchange"/);
  assert.match(index, /location\.reload\(\)/);

  assert.match(serviceWorker, /CACHE_VERSION="coco-en-forma-v160\.100\.1-relational-continuity-r2"/);
  for (const asset of [
    "coco-variety-director-v160960.js",
    "coco-release-v160903.js",
    "coco-reto-2026-v160908.js",
    "coco-family-friendly-v160100.js",
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

test("current and legacy PWA entry points share one owner and one canonical worker URL", () => {
  const owner = "__COCO_PWA_REGISTRATION_OWNER__";
  for (const source of [index, runtime, legacyRuntime, pwaManager]) assert.match(source, new RegExp(owner), owner);
  assert.match(index, /__COCO_PWA_REGISTRATION_OWNER__ = "index-v160100"/);
  assert.match(runtime, /__COCO_PWA_REGISTRATION_OWNER__ = "runtime-v160100"/);
  assert.match(legacyRuntime, /__COCO_PWA_REGISTRATION_OWNER__ = "runtime-legacy-v160100"/);
  assert.match(pwaManager, /__COCO_PWA_REGISTRATION_OWNER__="manager-v160100"/);
  assert.match(index, /coco-v142-runtime\.js\?v=160100/);
  assert.match(runtime, /sw\.js\?v=160101-r2/);
  assert.match(legacyRuntime, /sw\.js\?v=160101-r2/);
  assert.match(pwaManager, /SW_TAG="160101-r2"/);
  assert.doesNotMatch(runtime, /new URL\("sw\.js",document\.baseURI\)/);
  assert.doesNotMatch(legacyRuntime, /new URL\("sw\.js",document\.baseURI\)/);
  assert.ok(index.indexOf('__COCO_PWA_REGISTRATION_OWNER__ = "index-v160100"') < index.indexOf('coco-v142-runtime.js?v=160100'));
  assert.match(index, /Date\.now\(\) - previousReload < 15000/);
  assert.match(runtime, /Date\.now\(\) - previousReload < 15000/);
  assert.match(legacyRuntime, /Date\.now\(\) - previousReload < 15000/);
});

test("loading the production index and runtime schedules exactly one worker registration", async () => {
  const loadListeners = [];
  const registrations = [];
  const registration = { waiting: null, installing: null, addEventListener() {}, update() {} };
  const serviceWorker = {
    controller: {},
    register(url, options) {
      registrations.push({ url, options });
      return Promise.resolve(registration);
    },
    addEventListener() {},
  };
  const context = {
    window: { addEventListener(type, listener) { if (type === "load") loadListeners.push(listener); } },
    navigator: { serviceWorker, onLine: true },
    location: { protocol: "https:", reload() {} },
    document: { baseURI: "https://www.cocoenforma.com/", querySelector() { return null; }, getElementById() { return null; }, body: {} },
    sessionStorage: { getItem() { return null; }, setItem() {} },
    URL,
    Boolean,
    Date,
    Number,
    String,
  };
  vm.createContext(context);
  vm.runInContext(`${extractPwaRegistrar(index)}\nregisterPwa();`, context);
  vm.runInContext(`${extractPwaRegistrar(runtime)}\nregisterPwa();`, context);
  assert.equal(context.window.__COCO_PWA_REGISTRATION_OWNER__, "index-v160100");
  assert.equal(loadListeners.length, 1);
  loadListeners[0]();
  await Promise.resolve();
  assert.equal(registrations.length, 1);
  assert.equal(registrations[0].url, "https://www.cocoenforma.com/sw.js?v=160101-r2");
  assert.equal(registrations[0].options.updateViaCache, "none");
});

test("Reto Coco is cleanup-only and cannot reinsert the promotional card", () => {
  assert.match(reto, /disabled v160\.100\.0/);
  assert.match(reto, /getElementById\('cocoReto2026'\)/);
  assert.doesNotMatch(reto, /createElement|innerWidth|orientationchange|reto-coco-2026-v160958\.jpg/);
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
  assert.match(browserQa, /cardCount, 0/);
  assert.match(browserQa, /coco-family-friendly-v160100/);
  assert.match(browserQa, /orientación y breakpoint 390x844/);
  assert.match(workflow, /node qa\/device-update-browser\.mjs/);
  assert.match(workflow, /COCO_QA_EXPECTED_COMMIT: \$\{\{ github\.sha \}\}/);
  assert.match(workflow, /for attempt in \{1\.\.10\}/);
  assert.match(workflow, /did not receive the exact preview revision after 10 attempts/);
  for (const name of ["iphone-safari", "android-chrome", "ipad-safari", "desktop-safari", "desktop-chrome"]) assert.match(workflow, new RegExp(name));
});
