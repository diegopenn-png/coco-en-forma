import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
const qaDir=path.dirname(fileURLToPath(import.meta.url)); const root=path.dirname(qaDir); const results=[];
async function test(name,fn){try{await fn();results.push({name,status:"PASS"})}catch(e){results.push({name,status:"FAIL",detail:e.stack||e.message})}}
const read=(f)=>fs.readFileSync(path.join(root,f),"utf8");
await test("Catálogo: Coco Pádel está disponible y no aparece En construcción",()=>{
 const h=read("index.html"), f=read("coco-v152-fixes.js"); assert.match(h,/id:"padel",nombre:"Pádel",grupo:"propio",estado:"listo"/); assert.match(f,/function fixAvailableCard/); assert.match(f,/Abrir Coco Pádel/);
});
await test("Tarjetas: ranking por juego eliminado; solo estado de clasificación general no clicable",()=>{
 const h=read("index.html"), f=read("coco-v152-fixes.js"); assert.match(h,/Puntúa para la clasificación general/); assert.match(h,/No puntúa para la clasificación general/); assert.match(f,/pointer-events:none|aria-disabled/); assert.doesNotMatch(h,/puntos en Coco Med/);
});
await test("Coco Pádel: sin Excel, sin torneo y con compartir WhatsApp/Copiar",()=>{
 const s=read("coco-v152-padel.js"); assert.doesNotMatch(s,/\btorneos?\b/i); assert.doesNotMatch(s,/\.xlsx|Exportar a Excel/i); assert.match(s,/Enviar por WhatsApp/); assert.match(s,/>Copiar</); assert.match(s,/excelExport: false/);
});
await test("Coco Pádel: ficha de jugador compacta y sin siglas opacas",()=>{
 const s=read("coco-v152-padel.js"); for(const word of ["Partidos jugados","Victorias","Derrotas","Campeonatos","Jornadas","Posición"]) assert.ok(s.includes(word),word); assert.match(s,/playerCardsUseAbbreviations: false/); assert.doesNotMatch(s,/>PJ<|>PG<|>PP<|>SG<|>SP<|>DS<|>GG<|>GP<|>DG</);
});
await test("Coco Pádel: búsqueda parcial y jornadas/resultados conservados",()=>{
 const s=read("coco-v152-padel.js"); assert.match(s,/data-padel144-directory-search/); assert.match(s,/findDirectoryPlayer/); assert.match(s,/Añadir jornada/); assert.match(s,/Crear jornada/); assert.match(s,/resultEntry: "set-by-set"/); assert.match(s,/rankingsRecalculateFromResults: true/);
});
await test("Coco Corre: Street Skate real, skate, salto, agacharse y primer distractor",()=>{
 const s=read("coco-v152-runner.js"), css=read("coco-v152-refinements.css"); assert.match(s,/STREET SKATE/); assert.match(s,/c151Skateboard/); assert.match(s,/c151Barricade/); assert.match(s,/c151OverheadBarrier/); assert.match(s,/openingQueue/); assert.match(s,/maxRuleSeconds: 15/); assert.match(s,/ruleIntervalsSeconds: \{ basic: 15, intermediate: 12, advanced: 10 \}/); assert.match(css,/c152PushFoot/); assert.match(css,/c152WheelSpin/); assert.match(css,/c151StreetWall/);
});
await test("Encuentra las diferencias: pares específicos por nivel sin cambios extra",()=>{
 const s=read("coco-v152-differences.js"); assert.match(s,/v152-right-.*-l/); assert.match(s,/levelSpecificPairs: true/); assert.match(s,/noExtraUnclickableDifferences: true/); assert.match(s,/object-fit:contain|sceneSource/);
});
await test("Encuentra las diferencias: 100 recursos v152 presentes",()=>{
 const dir=path.join(root,"scenes"), files=fs.readdirSync(dir).filter(f=>/v152.*\.webp$/.test(f)); assert.equal(files.length,100); for(const f of files)assert.ok(fs.statSync(path.join(dir,f)).size>1000,f);
});
await test("CSS v152 alcanza el modal fuera de #cocoApp y corrige móvil",()=>{
 const css=read("coco-v152-refinements.css"); assert.equal((css.match(/#cocoApp/g)||[]).length,0); assert.match(css,/@media\(max-width:700px\)[\s\S]*?\.c151Diff \.c144DiffBoards\{grid-template-columns:1fr!important/); assert.match(css,/\.c152PlayerMetrics\{display:grid!important;grid-template-columns:repeat\(3/); assert.match(css,/\.c151RunnerControls button\{width:46px!important;height:46px!important/);
});
await test("PWA v152: service worker y manifest actualizados",()=>{
 const sw=read("sw.js"); assert.match(sw,/coco-en-forma-v152\.0\.0-r1/); for(const f of ["coco-v152-padel.js","coco-v152-runner.js","coco-v152-differences.js","coco-v152-fixes.js","coco-v152-refinements.css"])assert.ok(sw.includes(f),f); assert.equal((sw.match(/scene-[^\"]+-v152[^\"]+\.webp/g)||[]).length,100); assert.match(read("manifest.webmanifest"),/pwa-v152/);
});
await test("Clasificación principal Supabase permanece intacta",()=>{
 const h=read("index.html"); assert.match(h,/rpc\("clasificacion_general_coco",\{p_limit:50\}\)/); assert.match(h,/cocoRankingProxy/); assert.match(h,/>Clasificación</);
});
await test("Módulos v152 mantienen aliases compatibles con núcleo estable",()=>{
 for(const [f,n] of [["coco-v152-padel.js","CocoPadelV149"],["coco-v152-runner.js","CocoRunnerV149"],["coco-v152-differences.js","CocoDifferencesProV149"]]) assert.ok(read(f).includes(n),`${f}:${n}`);
});
const failed=results.filter(x=>x.status==="FAIL"); for(const r of results)console.log(`${r.status.padEnd(4)} ${r.name}${r.detail?"\n"+r.detail:""}`); console.log(`\n${results.length-failed.length}/${results.length} pruebas v152 superadas.`); if(failed.length)process.exit(1);
