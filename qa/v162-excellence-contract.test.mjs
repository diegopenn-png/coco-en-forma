import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const qaDir=path.dirname(fileURLToPath(import.meta.url));
const rootDir=path.dirname(qaDir);
const read=file=>fs.readFileSync(path.join(rootDir,file),"utf8");

test("all 13 experiences receive a concise goal and first-use guide",()=>{
  const layer=read("coco-excellence-v160934.js");
  const ids=["numeros","calculo","palabras","series","memoria","sudoku","sopa","crucigrama","tiempo","verdadero","cocomed","futbol","padel"];
  ids.forEach(id=>assert.match(layer,new RegExp(`\\b${id}:\\{name:`),id));
  assert.match(layer,/games:Object\.keys\(GAME\)\.length/);
  assert.match(layer,/\.cocoGameCard,#cocoApp \.cocoMiniJuego/);
  assert.match(layer,/observer\.observe\(document\.body/);
  assert.match(layer,/\[250,700,1600,3200\]\.forEach/);
  assert.match(layer,/className="cocoExGuide"/);
  assert.match(layer,/Misión terminada\. Tu progreso ya está guardado/);
});

test("Reto tiempo offers healthy pacing with score normalization",()=>{
  const html=read("index.html"),layer=read("coco-excellence-v160934.js");
  assert.match(layer,/data-coco-pace="calm"/);
  assert.match(layer,/data-coco-pace="normal"/);
  assert.match(layer,/data-coco-pace="challenge"/);
  assert.match(html,/coco_time_pace_v160934/);
  assert.match(html,/storedPace==="calm"\?\.85:storedPace==="challenge"\?1\.08:1/);
  assert.match(html,/active\.timeScoreFactor\|\|1/);
  assert.match(html,/active\.roundDuration\/1000/);
});

test("the excellence layer improves teen and parent hierarchy without privileged writes",()=>{
  const layer=read("coco-excellence-v160934.js");
  assert.match(layer,/data-et-age-band='teen'/);
  assert.match(layer,/cocoExFamilySummary/);
  assert.match(layer,/Qué obtiene la familia con Eterna/);
  assert.match(layer,/Herramienta para familias y clubes/);
  assert.doesNotMatch(layer,/\.from\(|fetch\(|checkout\(|portal\(|signIn|signUp/);
});

test("failed Eterna requests keep the student's input ready to retry",()=>{
  const core=read("eterna-v159.js");
  assert.match(core,/if\(rawText\)\{input\.value=rawText/);
  assert.match(core,/No se pudo verificar · tu pregunta sigue preparada/);
  assert.match(core,/Preparando la foto…/);
  assert.match(core,/No pude preparar la foto · prueba con otra imagen/);
});

test("entrypoint, preview and PWA cache ship the exact excellence version",()=>{
  const html=read("index.html"),sw=read("sw.js"),workflow=read(".github/workflows/eterna-authenticated-preview.yml");
  assert.match(html,/coco-excellence-v160934\.js\?v=160934/);
  assert.match(html,/eterna-v159\.js\?v=160934/);
  assert.match(sw,/coco-en-forma-v160\.93\.4-excellence-pass/);
  assert.match(sw,/"\.\/coco-excellence-v160934\.js"/);
  assert.match(workflow,/frontend 160\.93\.4-excellence-pass/);
  assert.match(workflow,/verify=\$\{GITHUB_SHA\}-\$\{attempt\}/);
  assert.match(workflow,/coco-excellence-v160934\.js\?v=160934&verify=\$\{GITHUB_SHA\}/);
});
