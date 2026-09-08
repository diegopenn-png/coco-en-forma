import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { injectPreviewParity, PREVIEW_PARITY_GROUPS } from "./eterna/inject-preview-parity.mjs";

const index = readFileSync("index.html", "utf8");
const workflow = readFileSync(".github/workflows/eterna-authenticated-preview.yml", "utf8");

test("the no-cache preview restores every presentation layer composed by production", () => {
  const result = injectPreviewParity(index);
  assert.equal(injectPreviewParity(result), result, "preview injection must be idempotent");

  for (const group of PREVIEW_PARITY_GROUPS) {
    const anchorAt = result.indexOf(group.anchor);
    assert.notEqual(anchorAt, -1);
    for (const script of group.scripts) {
      assert.ok(result.indexOf(script) > anchorAt, script);
      assert.equal(result.split(script).length - 1, 1, script);
    }
  }

  for (const path of [
    "coco-release-v160903.js",
    "coco-reto-2026-v160908.js",
    "reto-coco-2026-v160958.jpg",
    "eterna-hotfix-v160902.js",
    "eterna-desktop-compact-v160907.js",
  ]) assert.equal(existsSync(path), true, path);
});

test("the authenticated preview deploys and verifies Reto Coco parity", () => {
  assert.match(workflow, /node qa\/eterna\/inject-preview-parity\.mjs preview-dist\/index\.html/);
  assert.match(workflow, /id="coco-product-ux-v160903"/);
  assert.match(workflow, /id="coco-reto-2026-direct"/);
  assert.match(workflow, /id="eterna-hotfix-v160902-direct"/);
  assert.match(workflow, /id="eterna-desktop-compact-v160907-direct"/);
  assert.match(workflow, /reto-coco-2026-v160958\.jpg\?verify=/);
  assert.match(workflow, /wc -c < \/tmp\/reto-coco-2026-preview\.jpg/);
  assert.match(workflow, /window\.__COCO_PREVIEW_COMMIT__='\$\{GITHUB_SHA\}'/);
  assert.match(workflow, /index_url="\$\{PREVIEW_ORIGIN\}\/\?verify=\$\{GITHUB_SHA\}-\$\{attempt\}"/);
  assert.match(workflow, /grep -F "window\.__COCO_PREVIEW_COMMIT__='\$\{GITHUB_SHA\}'" \/tmp\/eterna-preview-index\.html/);
  assert.match(workflow, /self\.registration\.unregister\(\)/);
});
