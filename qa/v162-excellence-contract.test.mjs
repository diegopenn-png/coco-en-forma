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
  assert.match(layer,/card\.dataset\.cocoExcellence="1"/);
  assert.match(layer,/else card\.appendChild\(box\)/);
  assert.match(layer,/\.cocoMiniJuego\[data-coco-excellence='1'\]\{grid-template-columns:82px minmax\(0,1fr\)/);
  assert.match(layer,/\.cocoMiniJuego\[data-coco-excellence='1'\]>\.cocoExcellenceMeta\{grid-column:1\/-1;grid-row:3/);
  assert.match(layer,/\.cocoMiniJuego\[data-coco-kind='tool'\]>\.cocoExcellenceMeta\{grid-row:4\}/);
  assert.match(layer,/observer\.observe\(document\.body/);
  assert.match(layer,/\[250,700,1600,3200\]\.forEach/);
  assert.match(layer,/className="cocoExGuide"/);
  assert.match(layer,/Misión terminada\. Tu progreso ya está guardado/);
});

test("Reto tiempo uses one clear difficulty control",()=>{
  const html=read("index.html"),layer=read("coco-excellence-v160934.js");
  assert.doesNotMatch(layer,/data-coco-pace/);
  assert.doesNotMatch(layer,/cocoExPace/);
  assert.doesNotMatch(html,/coco_time_pace_v160934/);
  assert.doesNotMatch(html,/timeScoreFactor/);
  assert.match(html,/active\.roundDuration=active\.level===1\?10000:active\.level===2\?8500:7000/);
  assert.match(html,/active\.roundDuration\/1000/);
});

test("Fútbol adds an optional Rayo level without changing automatic age selection",()=>{
  const html=read("index.html"),layer=read("coco-excellence-v160934.js");
  assert.match(html,/\["4 velocidades","Básico, intermedio, avanzado y Rayo"\]/);
  assert.match(html,/active\.game\.type==="football"\?\[1,2,3,4\]:\[1,2,3\]/);
  assert.match(html,/level===3\?"Avanzado":"Rayo"/);
  assert.match(html,/active\.level===3\?420:260/);
  assert.match(html,/active\.level===3\?70:35/);
  assert.match(html,/active\.level===3\?320:220/);
  assert.match(html,/return age<=9\?1:age<=12\?2:3/);
  assert.match(layer,/footballLevels:\["basic","intermediate","advanced","lightning"\]/);
});

test("the excellence layer removes redundant family presentation without privileged writes",()=>{
  const layer=read("coco-excellence-v160934.js"),eterna=read("eterna-v159.js");
  assert.match(layer,/data-et-age-band='teen'/);
  assert.match(layer,/querySelectorAll\("\.cocoExFamilySummary,\.cocoExFamilyValue"\)/);
  assert.match(layer,/familyRedundancyRemoved:true/);
  assert.doesNotMatch(layer,/Acceso protegido/);
  assert.doesNotMatch(layer,/Qué obtiene la familia con Eterna/);
  assert.doesNotMatch(eterna,/Progreso escolar con Eterna/);
  assert.doesNotMatch(eterna,/renderProgressPanel/);
  assert.match(eterna,/renderAcademicMemoryPanel\(memoryModel\)\+settings/);
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
  const html=read("index.html"),sw=read("sw.js"),workflow=read(".github/workflows/eterna-authenticated-preview.yml"),core=read("coco-v144-core.js");
  assert.match(html,/coco-excellence-v160934\.js\?v=160945/);
  assert.match(html,/eterna-v159\.js\?v=160941/);
  assert.match(html,/coco-v144-core\.js\?v=15001/);
  assert.match(sw,/coco-en-forma-v160\.94\.5-game-difficulty-r1/);
  assert.match(sw,/"\.\/coco-excellence-v160934\.js"/);
  assert.match(core,/\.cocoMiniJuego\[data-coco-juego\]/);
  assert.match(core,/Inicia sesión para abrir /);
  assert.match(core,/#cocoApp input\[type='email'\]/);
  assert.match(workflow,/frontend 160\.94\.1-mobile-fixed-viewport/);
  assert.match(workflow,/verify=\$\{GITHUB_SHA\}-\$\{attempt\}/);
  assert.match(workflow,/coco-excellence-v160934\.js\?v=160945&verify=\$\{GITHUB_SHA\}/);
  assert.match(workflow,/coco-v144-core\.js\?v=15001&verify=\$\{GITHUB_SHA\}-\$\{attempt\}/);
});
