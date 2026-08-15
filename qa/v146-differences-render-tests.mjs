import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { createCanvas, loadImage } = require("@napi-rs/canvas");
const qaDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.dirname(qaDir);
let idCounter = 0;

const window = {
  CocoV144: {
    id(prefix) { idCounter += 1; return `${prefix}-${idCounter}`; },
    today() { return "2026-08-15"; }, esc(value) { return String(value); }, body() { return null; },
    session: async () => null, client: () => null, toast() {}, sound() {}, openModal() {}, closeModal() {}, setModalTitle() {}
  },
  location: { search: "", hostname: "localhost" }, addEventListener() {}, removeEventListener() {}
};
const context = vm.createContext({
  window, self: window, globalThis: window, location: window.location, console, Set, Map, Date, Math, JSON, Object, Array, String, Number, Boolean, RegExp, Intl, Promise, AbortController, URLSearchParams,
  performance: { now: () => Date.now() }, setTimeout, clearTimeout, setInterval, clearInterval
});
vm.runInContext(fs.readFileSync(path.join(rootDir, "coco-v144-differences.js"), "utf8"), context, { filename: "coco-v144-differences.js" });
const differences = window.CocoDifferencesProV146;

function freshCanvas(image) {
  const canvas = createCanvas(768, 512), ctx = canvas.getContext("2d", { alpha: false });
  ctx.filter = "brightness(1.2) contrast(1.07) saturate(1.06)";
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  ctx.filter = "none";
  return canvas;
}

function changedPixels(first, second, rect) {
  const a = first.getContext("2d").getImageData(rect.x, rect.y, rect.width, rect.height).data;
  const b = second.getContext("2d").getImageData(rect.x, rect.y, rect.width, rect.height).data;
  let count = 0;
  for (let index = 0; index < a.length; index += 4) {
    if (Math.abs(a[index] - b[index]) + Math.abs(a[index + 1] - b[index + 1]) + Math.abs(a[index + 2] - b[index + 2]) > 24) count += 1;
  }
  return count;
}

let combinations = 0, verifiedDifferences = 0;
const evidenceRows = [];
for (const scene of differences.scenes) {
  const imagePath = path.join(rootDir, scene.src.split("?")[0]);
  assert.ok(fs.existsSync(imagePath), `Falta ${imagePath}`);
  const image = await loadImage(imagePath);
  for (let variant = 0; variant < 3; variant += 1) {
    for (const level of [1, 2, 3]) {
      const count = differences.config(level).count;
      const items = differences.materializeForAudit(scene.id, variant, count);
      for (const item of items) {
        assert.ok(["color", "shape", "presence"].includes(item.kind));
        const base = freshCanvas(image), left = freshCanvas(image), right = freshCanvas(image);
        differences.applyDifferenceForAudit(left.getContext("2d"), left, item, "left");
        differences.applyDifferenceForAudit(right.getContext("2d"), right, item, "right");
        const rect = differences.rectFor(left, item);
        const between = changedPixels(left, right, rect);
        assert.ok(between > 100, `${scene.id} v${variant + 1}: ${item.id} no produce una diferencia visible suficiente (${between})`);
        const leftFromBase = changedPixels(base, left, rect), rightFromBase = changedPixels(base, right, rect);
        if (item.kind === "presence") {
          assert.equal(leftFromBase, 0, `${item.id}: el lado sin objeto debe conservar la escena natural`);
          assert.ok(rightFromBase > 100, `${item.id}: el objeto presente debe ser visible y completo`);
        } else {
          assert.ok(leftFromBase > 100 && rightFromBase > 100, `${item.id}: ambas formas deben estar completas`);
        }
        verifiedDifferences += 1;
      }
      if (variant === 0 && level === 3 && process.env.COCO_QA_EVIDENCE === "1") {
        const left = freshCanvas(image), right = freshCanvas(image);
        for (const item of items) {
          differences.applyDifferenceForAudit(left.getContext("2d"), left, item, "left");
          differences.applyDifferenceForAudit(right.getContext("2d"), right, item, "right");
        }
        evidenceRows.push({ title: scene.title, left, right });
      }
      combinations += 1;
    }
  }
}

console.log(`PASS  Render real: ${combinations} combinaciones y ${verifiedDifferences} diferencias verificadas píxel a píxel.`);
console.log("PASS  Solo se renderizan color, formas completas y presencia/ausencia; el lado ausente conserva intacta la escena.");

if (evidenceRows.length) {
  const rowHeight = 314, sheet = createCanvas(800, evidenceRows.length * rowHeight), ctx = sheet.getContext("2d");
  ctx.fillStyle = "#eef7fb"; ctx.fillRect(0, 0, sheet.width, sheet.height);
  evidenceRows.forEach((row, index) => {
    const y = index * rowHeight;
    ctx.fillStyle = "#173e58"; ctx.font = "bold 16px sans-serif"; ctx.fillText(row.title, 12, y + 20);
    ctx.font = "12px sans-serif"; ctx.fillText("Imagen 1", 12, y + 39); ctx.fillText("Imagen 2", 408, y + 39);
    ctx.drawImage(row.left, 8, y + 46, 384, 256); ctx.drawImage(row.right, 408, y + 46, 384, 256);
  });
  const evidenceDir = path.join(qaDir, "evidence-v146"); fs.mkdirSync(evidenceDir, { recursive: true });
  const evidencePath = path.join(evidenceDir, "encuentra-las-diferencias-v146.jpg");
  fs.writeFileSync(evidencePath, sheet.toBuffer("image/jpeg", 88));
  console.log(`PASS  Evidencia visual generada: ${path.relative(rootDir, evidencePath)}`);
}
