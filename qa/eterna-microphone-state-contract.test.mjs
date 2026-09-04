import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const qaDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.dirname(qaDir);
const read = file => fs.readFileSync(path.join(rootDir, file), "utf8");

test("an empty composer disables Send without pretending that a request is pending", () => {
  const core = read("eterna-v159.js");
  const experience = read("eterna-experience-v160.js");

  assert.match(core, /hasContent=Boolean\(input&&input\.value\.trim\(\)\|\|state\.imageData\)/);
  assert.match(core, /button\.disabled=!hasContent/);
  assert.match(core, /isRequestPending:function\(\)\{return Boolean\(state\.busy\)\}/);
  assert.match(experience, /function chatRequestIsPending\(\)/);
  assert.match(experience, /if\(chatRequestIsPending\(\)\)\{/);
  assert.doesNotMatch(experience, /if\(send&&send\.disabled\)\{\s*setLive\("info","Espera a que Eterna termine/);
});

test("voice remains blocked for real foreground and recoverable background requests", () => {
  const experience = read("eterna-experience-v160.js");

  assert.match(experience, /core\.isRequestPending\(\)/);
  assert.match(experience, /activeBackgroundJobId\|\|pendingJobResumePromise\|\|pendingJobRead\(\)/);
  assert.match(experience, /Espera a que Eterna termine la respuesta anterior antes de volver a hablar/);
});

test("activity boundaries clear foreground and background pending state", () => {
  const core = read("eterna-v159.js");
  const experience = read("eterna-experience-v160.js");

  assert.match(core, /state\.activeRequest=null;state\.busy=false/);
  assert.match(core, /coco:eterna-context-invalidated/);
  assert.match(experience, /coco:eterna-context-invalidated[^\n]*pendingJobClear\(\);activeBackgroundJobId=""/);
});

test("the fixed microphone assets invalidate browser and PWA caches together", () => {
  const serviceWorker = read("sw.js");
  const previewWorkflow = read(".github/workflows/eterna-authenticated-preview.yml");

  assert.match(serviceWorker, /coco-en-forma-v160\.93\.4-excellence-pass/);
  assert.match(serviceWorker, /const ETERNA_EXPERIENCE_PATH="\.\/eterna-experience-v160\.js"/);
  assert.match(serviceWorker, /if\(eternaExperience\)\{e\.respondWith\(cachedPatch\(ETERNA_EXPERIENCE_PATH\)/);
  assert.match(previewWorkflow, /frontend 160\.93\.4-excellence-pass/);
});
