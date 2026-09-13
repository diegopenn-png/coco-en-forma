import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const PREVIEW_PARITY_GROUPS = Object.freeze([
  Object.freeze({
    anchor: '<script id="coco-v153-fixes" src="./coco-v153-fixes.js?v=160100"></script>',
    scripts: Object.freeze([
      '<script id="coco-product-ux-v160903" src="./coco-release-v160903.js?v=160960"></script>',
      '<script id="coco-reto-2026-direct" src="./coco-reto-2026-v160908.js?v=160100"></script>',
      '<script id="coco-family-friendly-v160100" src="./coco-family-friendly-v160100.js?v=160100"></script>',
    ]),
  }),
  Object.freeze({
    anchor: '<script id="coco-v159-eterna" src="./eterna-v159.js?v=160101"></script>',
    scripts: Object.freeze([
      '<script id="eterna-hotfix-v160902-direct" src="./eterna-hotfix-v160902.js?v=160960"></script>',
      '<script id="eterna-desktop-compact-v160907-direct" src="./eterna-desktop-compact-v160907.js?v=160960"></script>',
    ]),
  }),
]);

export function injectPreviewParity(source) {
  let html = String(source || "");
  for (const group of PREVIEW_PARITY_GROUPS) {
    const anchorCount = html.split(group.anchor).length - 1;
    if (anchorCount !== 1) {
      throw new Error(`Expected one preview parity anchor, found ${anchorCount}: ${group.anchor}`);
    }
    const missing = group.scripts.filter((script) => !html.includes(script));
    if (missing.length) html = html.replace(group.anchor, `${group.anchor}\n${missing.join("\n")}`);
  }
  return html;
}

function runCli() {
  const path = process.argv[2];
  if (!path) throw new Error("Usage: node qa/eterna/inject-preview-parity.mjs <index.html>");
  const before = readFileSync(path, "utf8");
  const after = injectPreviewParity(before);
  writeFileSync(path, after);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) runCli();
