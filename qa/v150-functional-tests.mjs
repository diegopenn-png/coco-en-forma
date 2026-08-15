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

await test("Coco Corre: 180 misiones válidas y dos distractores antes del primer objetivo",()=>{
  const r=evaluate("coco-v144-runner.js").CocoRunnerV150;
  for(const level of [1,2,3])for(let i=0;i<60;i++){
    const mission=r.missionForLevel(level,`v150-${level}-${i}`),v=r.validateMission(mission);
    assert.equal(v.valid,true,v.failures.join(", ")); assert.equal(v.firstTargetIndex,2); assert.equal(v.startsWithDistractor,true);
  }
});
await test("Coco Corre: ninguna regla nueva regala la respuesta en los dos primeros objetos",()=>{
  const r=evaluate("coco-v144-runner.js").CocoRunnerV150,c=r.catalog();
  const rules=[{type:"shape-color",shape:c.shapes.find(x=>x.id==="cuadrado"),color:c.colors.find(x=>x.id==="azul")},{type:"category-color",category:c.categories.find(x=>x.id==="herramientas"),color:c.colors.find(x=>x.id==="morado")},{type:"category",target:c.categories.find(x=>x.id==="frutas")},{type:"even"},{type:"odd"}];
  let value=.071; const random=()=>((value=(value+.173)%1));
  for(const level of [1,2,3])for(const rule of rules){const opening=r.openingPlanForRule(rule,random,level);assert.deepEqual(Array.from(opening,t=>t.correct),[false,false,true,false,true,false]);}
});
await test("Coco Corre: variedad ampliada con frutas, herramientas y más familias",()=>{
  const r=evaluate("coco-v144-runner.js").CocoRunnerV150,c=r.catalog(),audit=r.audit();
  assert.ok(c.colors.length>=8);assert.ok(c.shapes.length>=7);assert.ok(c.categories.length>=8);
  for(const id of ["herramientas","frutas","ciencia","colegio","deportes","espacio","cocina"])assert.ok(c.categories.some(x=>x.id===id),id);
  assert.equal(audit.openingDistractorsBeforeTarget,2);assert.equal(audit.fruitAndToolVariety,true);
});
await test("Coco Corre: frutas y herramientas muestran el color de forma visible, no solo en la lógica",()=>{
  const r=evaluate("coco-v144-runner.js").CocoRunnerV150,c=r.catalog();
  let value=.137; const random=()=>((value=(value+.193)%1));
  const rule={type:"category-color",category:c.categories.find(x=>x.id==="herramientas"),color:c.colors.find(x=>x.id==="morado")};
  const opening=r.openingPlanForRule(rule,random,3);
  assert.equal(opening[0].category.id,"herramientas");assert.equal(opening[1].category.id,"herramientas");assert.equal(opening[2].correct,true);
  assert.notEqual(opening[0].color.id,"morado");assert.notEqual(opening[1].color.id,"morado");assert.equal(opening[2].color.id,"morado");
  assert.ok(new Set(opening.map(x=>x.color.id)).size>=3,"Debe haber varios colores visibles dentro de la misma categoría");
  const source=fs.readFileSync(path.join(rootDir,"coco-v144-runner.js"),"utf8"),css=fs.readFileSync(path.join(rootDir,"coco-v150-refinements.css"),"utf8");
  assert.match(source,/appendTintedCategoryGlyph/);assert.match(source,/globalCompositeOperation = "source-atop"/);assert.match(source,/token\.item\.label \+ " · " \+ token\.color\.label/);
  assert.match(css,/c150RunnerTintedCanvas/);assert.match(css,/c150RunnerColorDot/);
});
await test("Clasificación: dentro de los juegos solo queda la etiqueta informativa",()=>{
  const html=fs.readFileSync(path.join(rootDir,"index.html"),"utf8");
  assert.doesNotMatch(html,/function leaderboardPreviewHtml/);assert.doesNotMatch(html,/data-open-leaderboard/);
  assert.match(html,/active\.leaderboard=loaded\[2\]/);assert.match(html,/Promise\.resolve\(null\)/);
  assert.match(html,/oldBadge\.cloneNode\(true\)/);assert.match(html,/badge\.removeAttribute\("role"\)/);assert.match(html,/event\.stopPropagation\(\)/);
  assert.match(html,/Clasificación general|CLASIFICACIÓN GENERAL/);assert.match(html,/Clasificación específica|CLASIFICACIÓN ESPECÍFICA/);
  assert.doesNotMatch(html,/Misma cuenta · clasificación independiente/);
  assert.match(html,/ea\("ranking"\)/,"Debe conservarse la pestaña principal de Clasificación");
});
await test("Resultados de juego: no hay botón para abrir una clasificación paralela",()=>{
  const html=fs.readFileSync(path.join(rootDir,"index.html"),"utf8");
  assert.doesNotMatch(html,/data-result-ranking[^\{]/); // solo puede quedar el selector preventivo de CSS
  const runner=fs.readFileSync(path.join(rootDir,"coco-v144-runner.js"),"utf8"),diff=fs.readFileSync(path.join(rootDir,"coco-v144-differences.js"),"utf8");
  assert.doesNotMatch(runner,/Ver clasificación/);assert.doesNotMatch(diff,/Ver clasificación/);
});
await test("Encuentra las diferencias: diez escenas, más luminosidad y cambios reales en Coco",()=>{
  const d=evaluate("coco-v144-differences.js").CocoDifferencesProV150,a=d.audit();
  assert.equal(a.sceneCount,10);assert.equal(a.everySceneHasAtLeastEight,true);assert.equal(a.brightness,1.28);assert.equal(a.characterDifferenceGuaranteed,true);
  assert.deepEqual(Array.from(a.differenceKinds),["color","shape","presence","character-color"]);
  for(const scene of d.scenes)for(let variant=0;variant<3;variant++)for(const level of [1,2,3]){
    const items=d.materializeForAudit(scene.id,variant,d.config(level).count);assert.ok(items.some(x=>x.characterPart==="brain"||x.characterPart==="beak"),`${scene.id}/v${variant+1}/L${level}`);
    for(const item of items){assert.ok(item.x>0&&item.x<100&&item.y>0&&item.y<100);assert.ok(item.w>=8&&item.h>=9);}
  }
});
await test("Encuentra las diferencias: cerebro y pico usan recolor selectivo, no un parche plano",()=>{
  const source=fs.readFileSync(path.join(rootDir,"coco-v144-differences.js"),"utf8");
  assert.match(source,/part === "brain" && !\(hsv\[1\] > \.22/);assert.match(source,/part === "beak" && !\(hsv\[1\] > \.42/);
  assert.match(source,/brightness\(1\.28\) contrast\(1\.09\) saturate\(1\.1\)/);
});
await test("Contenido: los bancos educativos y las rotaciones se amplían",()=>{
  const base={version:"test",words:[],crosswords:[],trueFalse:[],soupExtensions:{},mixedMemoryThemes:[]};
  const w=evaluate("coco-v150-content.js",{CocoV134Content:base});
  assert.ok(w.CocoV150ContentAudit.addedWords>=50);assert.ok(w.CocoV150ContentAudit.addedFacts>=25);assert.ok(w.CocoV150ContentAudit.addedMemoryThemes>=10);
  // evalúa el inventario de combinaciones sobre la misma base enriquecida
  const b=browser({CocoV134Content:base,CocoV142MedExtra:Array(50).fill({})});
  vm.runInContext(fs.readFileSync(path.join(rootDir,"coco-v144-content.js"),"utf8"),b.context,{filename:"coco-v144-content.js"});
  const audit=b.window.CocoContentV150.audit();assert.equal(audit.passed,true);assert.equal(audit.minimumPerLevel,40);assert.equal(audit.gamesAudited,15);
});
await test("PWA v150: todos los recursos precargados existen",()=>{
  const sw=fs.readFileSync(path.join(rootDir,"sw.js"),"utf8");assert.match(sw,/coco-en-forma-v150\.0\.0-r1/);assert.match(sw,/coco-v150-content\.js/);assert.match(sw,/coco-v150-refinements\.css/);
  for(const m of sw.matchAll(/"\.\/([^"?]+)"/g)){const rel=m[1];if(rel==="")continue;assert.ok(fs.existsSync(path.join(rootDir,rel)),rel);}
});
await test("Integridad: conserva los 15 accesos del catálogo",()=>{
  const html=fs.readFileSync(path.join(rootDir,"index.html"),"utf8");
  const ids=["numeros","calculo","palabras","series","memoria","sudoku","sopa","crucigrama","tiempo","verdadero","diferencias","cococorre","cocomed","futbol","padel"];
  for(const id of ids)assert.ok(html.includes(id),id);
});

for(const row of results){console.log(`${row[0]}  ${row[1]}`);if(row[2])console.log(row[2]);}
const pass=results.filter(r=>r[0]==="PASS").length;console.log(`\n${pass}/${results.length} pruebas v150 superadas.`);if(pass!==results.length)process.exit(1);
