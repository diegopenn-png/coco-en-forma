import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const reportKit = fs.readFileSync(new URL("../coco-v153-fixes.js", import.meta.url), "utf8");
const eternaClient = fs.readFileSync(new URL("../eterna-v159.js", import.meta.url), "utf8");
const worker = fs.readFileSync(new URL("../eterna-worker/src/index.js", import.meta.url), "utf8");

test("the family view exposes one integral report and enables PDF only when both chapters are ready", () => {
  assert.match(reportKit, /data-family-integral-report="1"/);
  assert.match(reportKit, /ready=!!\(family\.learning&&family\.games\)/);
  assert.match(reportKit, /data-family-integral-export/);
  assert.match(reportKit, /Exportar PDF/);
  assert.match(reportKit, /Preparando informe…/);
});

test("PDF export has a print action and a popup-blocked fallback", () => {
  assert.match(reportKit, /Imprimir o guardar como PDF/);
  assert.match(reportKit, /onclick="window\.print\(\)"/);
  assert.match(reportKit, /function printReportWithoutPopup\(/);
  assert.match(reportKit, /if\(!writeReportPreview\(preview,html\)\)printReportWithoutPopup\(html\)/);
});

test("legacy Eterna export delegates to the canonical integral report", () => {
  assert.match(eternaClient, /data-family-integral-report='1'/);
  assert.match(eternaClient, /data-family-integral-export/);
  assert.doesNotMatch(eternaClient, /function exportEterna[\s\S]{0,700}new Blob/);
});

test("the export API returns structured learning signals without raw child conversations", () => {
  const start = worker.indexOf("async function handleExport");
  const end = worker.indexOf("async function handleDelete", start);
  assert.ok(start >= 0 && end > start, "handleExport source must be present");
  const source = worker.slice(start, end);
  assert.match(source, /student_concept_memory/);
  assert.match(source, /learning_strategy_memory/);
  assert.match(source, /academic_memory/);
  assert.match(source, /select=understood,help_level,concept_id,created_at/);
  assert.doesNotMatch(source, /conversation_text|message_text|raw_text|image_data_url|audio_data/);
  assert.match(source, /No se exportan fotografías ni texto bruto de conversaciones/);
});
