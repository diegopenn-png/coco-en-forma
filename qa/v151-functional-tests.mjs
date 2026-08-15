import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const qaDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.dirname(qaDir);
const results = [];
let idCounter = 0;
async function test(name, fn){try{await fn();results.push(["PASS",name]);}catch(error){results.push(["FAIL",name,error.stack||error.message]);}}
function browser(extra={}){
  const location={search:"",hostname:"localhost"};
  const window={CocoV144:{id(p){return `${p}-${++idCounter}`},today(){return "2026-08-16"},esc:String,body(){return null},session:async()=>null,client:()=>null,toast(){},sound(){},openModal(){},closeModal(){},setModalTitle(){}},location,addEventListener(){},removeEventListener(){},...extra};
  const context=vm.createContext({window,self:window,globalThis:window,location,console,Set,Map,Date,Math,JSON,Object,Array,String,Number,Boolean,RegExp,Intl,Promise,AbortController,URLSearchParams,TextEncoder,Blob,performance:{now:()=>Date.now()},crypto:{randomUUID:()=>`qa-${++idCounter}`},setTimeout,clearTimeout,setInterval,clearInterval});
  return {window,context};
}
function evaluate(file,extra){const b=browser(extra);vm.runInContext(fs.readFileSync(path.join(rootDir,file),"utf8"),b.context,{filename:file});return b.window;}

await test("Acceso v151: el catálogo no deshabilita juegos mientras consulta Supabase",()=>{
  const html=fs.readFileSync(path.join(rootDir,"index.html"),"utf8");
  const upgrade=html.match(/function upgradeCard\(card\)\{[\s\S]*?\n  \}\n\n  function bindRankingBadge/);
  assert.ok(upgrade,"upgradeCard no localizado");
  assert.match(upgrade[0],/setOptimisticCardState\(card,id\)/);
  assert.doesNotMatch(upgrade[0],/Comprobando misión|Preparando club/);
  assert.doesNotMatch(upgrade[0],/button\.disabled=true/);
  assert.match(html,/if\(state==="done"\)\{event\.preventDefault\(\)/);
  assert.match(html,/function cocoTimeout\(/);
  assert.match(html,/cocoTimeout\(loadStats\(id\),1650,fallbackStats\)/);
  assert.match(html,/cocoTimeout\(currentSession\(false\),950,null\)/);
});

await test("Acceso v151: usa nombres de motor nuevos para evitar mezcla de caché",()=>{
  const html=fs.readFileSync(path.join(rootDir,"index.html"),"utf8"), sw=fs.readFileSync(path.join(rootDir,"sw.js"),"utf8");
  assert.match(html,/coco-v151-runner\.js\?v=15100/);
  assert.match(html,/coco-v151-differences\.js\?v=15100/);
  assert.match(html,/coco-v151-refinements\.css\?v=15100/);
  assert.match(html,/sw\.js\?v=15100/);
  assert.match(html,/updateViaCache:"none"/);
  assert.match(sw,/coco-en-forma-v151\.0\.0-r1/);
  assert.match(sw,/await self\.skipWaiting\(\)/);
  assert.match(sw,/red primero/);
  assert.doesNotMatch(sw,/ignoreSearch:\s*true/);
});

await test("Coco Corre v151: 180 misiones siguen siendo completables",()=>{
  const r=evaluate("coco-v151-runner.js").CocoRunnerV151;
  assert.ok(r);
  for(const level of [1,2,3])for(let i=0;i<60;i++){
    const mission=r.missionForLevel(level,`v151-${level}-${i}`),v=r.validateMission(mission);
    assert.equal(v.valid,true,v.failures.join(", "));assert.equal(v.firstTargetIndex,2);assert.equal(v.startsWithDistractor,true);
  }
});

await test("Coco Corre v151: los elementos se acercan claramente más rápido",()=>{
  const r=evaluate("coco-v151-runner.js").CocoRunnerV151,a=r.audit(),source=fs.readFileSync(path.join(rootDir,"coco-v151-runner.js"),"utf8");
  assert.deepEqual(JSON.parse(JSON.stringify(a.spawnIntervalSeconds)),{basic:1.08,intermediate:.92,advanced:.78});
  assert.deepEqual(JSON.parse(JSON.stringify(a.approachSecondsToDecision)),{basic:2.93,intermediate:2.59,advanced:2.32});
  assert.match(source,/approachSpeedForLevel\(chosenLevel\).*\.30.*\.34.*\.38/);
  assert.doesNotMatch(source,/\.19\s*:\s*game\.level/);
});

await test("Coco Corre v151: frutas, herramientas y deportes no se recortan",()=>{
  const r=evaluate("coco-v151-runner.js").CocoRunnerV151,c=r.catalog(),source=fs.readFileSync(path.join(rootDir,"coco-v151-runner.js"),"utf8"),css=fs.readFileSync(path.join(rootDir,"coco-v151-refinements.css"),"utf8");
  for(const id of ["herramientas","frutas","deportes","ciencia","cocina"])assert.ok(c.categories.some(x=>x.id===id),id);
  assert.match(source,/c151RunnerVisual/);assert.match(source,/c151RunnerTintedCanvas/);assert.match(source,/c151RunnerColorName/);assert.match(source,/source-atop/);
  assert.match(css,/contain:layout style!important/);assert.match(css,/overflow:visible!important/);
  assert.match(css,/max-width:156px!important/);assert.doesNotMatch(css,/text-overflow:ellipsis/);
  assert.equal(r.audit().unclippedCategoryArtwork,true);
});

await test("Encuentra las diferencias v151: solo modifica objetos reales",()=>{
  const d=evaluate("coco-v151-differences.js").CocoDifferencesProV151,a=d.audit(),source=fs.readFileSync(path.join(rootDir,"coco-v151-differences.js"),"utf8");
  assert.equal(a.sceneCount,10);assert.equal(a.everySceneHasAtLeastEight,true);assert.equal(a.brightness,1.32);
  assert.deepEqual(Array.from(a.differenceKinds),["object-color","character-color"]);
  assert.equal(a.syntheticOverlayShapes,false);assert.equal(a.syntheticAddedProps,false);assert.equal(a.realObjectChangesOnly,true);
  assert.doesNotMatch(source,/drawIntegratedDetail|drawContextProp|polygonPath/);
  assert.doesNotMatch(source,/kind === "shape"|kind === "presence"/);
  assert.match(source,/else if \(item\.kind === "object-color" && side === "right"\) recolorNaturalRegion/);
  assert.match(source,/Sin marcas superpuestas/);
});

await test("Encuentra las diferencias v151: todos los niveles incluyen un cambio real de Coco",()=>{
  const d=evaluate("coco-v151-differences.js").CocoDifferencesProV151;
  for(const scene of d.scenes)for(let variant=0;variant<3;variant++)for(const level of [1,2,3]){
    const items=d.materializeForAudit(scene.id,variant,d.config(level).count);
    assert.ok(items.some(x=>x.characterPart==="brain"||x.characterPart==="beak"),`${scene.id}/v${variant+1}/L${level}`);
    assert.ok(items.every(x=>x.kind==="object-color"||x.kind==="character-color"));
  }
});

await test("PWA v151: todos los recursos precargados existen",()=>{
  const sw=fs.readFileSync(path.join(rootDir,"sw.js"),"utf8");
  for(const m of sw.matchAll(/"\.\/([^"?]+)"/g)){const rel=m[1];if(rel==="")continue;assert.ok(fs.existsSync(path.join(rootDir,rel)),rel);}
});

await test("Integridad v151: conserva los 15 accesos y la clasificación",()=>{
  const html=fs.readFileSync(path.join(rootDir,"index.html"),"utf8");
  const ids=["numeros","calculo","palabras","series","memoria","sudoku","sopa","crucigrama","tiempo","verdadero","diferencias","cococorre","cocomed","futbol","padel"];
  for(const id of ids)assert.ok(html.includes(id),id);
  assert.match(html,/Clasificación general|CLASIFICACIÓN GENERAL/);assert.match(html,/Clasificación específica|CLASIFICACIÓN ESPECÍFICA/);
});

for(const row of results){console.log(`${row[0]}  ${row[1]}`);if(row[2])console.log(row[2]);}
const pass=results.filter(r=>r[0]==="PASS").length;console.log(`\n${pass}/${results.length} pruebas v151 superadas.`);if(pass!==results.length)process.exit(1);
