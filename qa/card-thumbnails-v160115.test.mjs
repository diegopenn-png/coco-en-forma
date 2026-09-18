import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import test from "node:test";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const serviceWorker = readFileSync(new URL("../sw.js", import.meta.url), "utf8");

const cards = [
  "coco-mini.webp",
  "coco-en-racha-mini.webp",
  "coco-campeon-mini.webp",
  "coco-heroe-mini.webp",
  "coco-astronauta-mini.webp",
  "coco-leyenda-mini.webp",
];

test("the six card thumbnails are small local WebP assets", () => {
  for (const filename of cards) {
    const url = new URL(`../assets/tarjetas/${filename}`, import.meta.url);
    const bytes = readFileSync(url);
    assert.equal(bytes.subarray(0, 4).toString("ascii"), "RIFF", filename);
    assert.equal(bytes.subarray(8, 12).toString("ascii"), "WEBP", filename);
    assert.ok(statSync(url).size < 80_000, `${filename} must stay below 80 KB`);
  }
});

test("visible cards prefer local thumbnails while preserving original downloads", () => {
  const catalogStart = html.indexOf("var TARJETAS_COCO=");
  const catalogEnd = html.indexOf("];function B", catalogStart);
  const catalog = html.slice(catalogStart, catalogEnd);
  for (const filename of cards) {
    assert.match(html, new RegExp(`mini:\"\\./assets/tarjetas/${filename.replaceAll(".", "\\.")}\"`));
    assert.match(serviceWorker, new RegExp(`\\./assets/tarjetas/${filename.replaceAll(".", "\\.")}`));
  }
  assert.equal((catalog.match(/https:\/\/imagecdn\.123inventatuweb\.com\//g) || []).length, 6);
  assert.match(html, /src="'\+\(t\.mini\|\|t\.url\)\+'"/);
  assert.match(html, /src="'\+\(b\.mini\|\|b\.url\)\+'"/);
  assert.match(html, /data-fallback-src/);
  assert.match(html, /q\.querySelector\("\.loginPoster"\)\.src=TARJETAS_COCO\[0\]\.mini\|\|TARJETAS_COCO\[0\]\.url/);
});

test("the PWA pre-caches thumbnails under a new release key", () => {
  assert.match(serviceWorker, /CACHE_VERSION="coco-en-forma-v160\.100\.17-eterna-contextual-dialogue-r1"/);
  assert.match(serviceWorker, /\.concat\(CARD_THUMBNAILS\)/);
});
