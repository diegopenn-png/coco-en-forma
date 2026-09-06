import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require=createRequire(import.meta.url);
const { chromium }=require("playwright");
const qaDir=path.dirname(fileURLToPath(import.meta.url));
const evidenceDir=path.join(qaDir,".v162-evidence");
fs.mkdirSync(evidenceDir,{recursive:true});
const base=process.env.COCO_QA_URL||"http://127.0.0.1:4173";
const results=[];
async function check(name,fn){try{await fn();results.push(["PASS",name])}catch(error){results.push(["FAIL",name,error.stack||error.message])}}

const executable=chromium.executablePath();
if(!fs.existsSync(executable)){
  console.log("SKIP  Pruebas visuales locales: Chromium no está instalado; se ejecutarán contra el preview aislado.");
  process.exit(0);
}
const browser=await chromium.launch({headless:true,executablePath:executable});
const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:"block"});
await context.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//,route=>route.abort());
const page=await context.newPage();
const pageErrors=[];page.on("pageerror",error=>pageErrors.push(error.message));

await check("Todas las tarjetas públicas dirigen al login con su nombre",async()=>{
  await page.goto(`${base}/?qa-public-login=1`,{waitUntil:"domcontentloaded"});
  await page.locator(".cocoMiniJuego[data-coco-excellence='1']").first().waitFor({timeout:10000});
  const cards=page.locator(".cocoMiniJuego[data-coco-excellence='1']");
  assert.equal(await cards.count(),13);
  for(let index=0;index<13;index+=1){
    const card=cards.nth(index),name=(await card.locator(":scope > b").innerText()).trim();
    await card.click();
    assert.equal((await page.locator(".cocoV144Toast").last().innerText()).trim(),`Inicia sesión para abrir ${name}.`);
    assert.equal(await page.locator(".cocoV144Modal.visible").count(),0);
    assert.equal(await page.evaluate(()=>document.activeElement===document.querySelector("#cocoApp input[type='email']")),true);
  }
});

await check("Reto tiempo muestra una sola selección de dificultad",async()=>{
  await page.goto(`${base}/?qa=1&juego=tiempo`,{waitUntil:"domcontentloaded"});
  await page.locator(".cocoDifficulty").waitFor({timeout:10000});
  assert.equal(await page.locator(".cocoExPace").count(),0);
  assert.equal(await page.locator(".cocoDifficulty button").count(),3);
  assert.equal(await page.locator(".cocoExGuide").count(),1);
  await page.locator('[data-level="2"]').click();
  assert.equal(await page.locator('[data-level="2"]').getAttribute("aria-pressed"),"true");
  await page.locator("[data-arcade-start]").click();
  await page.getByText(/INTERMEDIO/).first().waitFor({timeout:5000});
});

await check("Fútbol ofrece Rayo como cuarta velocidad opcional",async()=>{
  await page.goto(`${base}/?qa=1&juego=futbol`,{waitUntil:"domcontentloaded"});
  await page.locator(".cocoDifficulty").waitFor({timeout:10000});
  assert.equal(await page.locator(".cocoDifficulty button").count(),4);
  assert.equal((await page.locator('[data-level="4"]').innerText()).trim(),"⚡Rayo");
  assert.equal(await page.locator('[data-level="4"]').getAttribute("aria-pressed"),"false");
  await page.locator('[data-level="4"]').click();
  assert.equal(await page.locator('[data-level="4"]').getAttribute("aria-pressed"),"true");
});

await check("La capa conserva el contenido dentro de móvil y escritorio",async()=>{
  for(const viewport of [{width:320,height:720},{width:390,height:844},{width:1024,height:768},{width:1440,height:900}]){
    await page.setViewportSize(viewport);await page.waitForTimeout(80);
    const g=await page.evaluate(()=>({inner:window.innerWidth,html:document.documentElement.scrollWidth,body:document.body.scrollWidth}));
    assert.ok(g.html<=g.inner&&g.body<=g.inner,`${viewport.width}px: ${JSON.stringify(g)}`);
  }
});

await check("El catálogo público móvil mantiene tarjetas compactas y legibles",async()=>{
  for(const viewport of [{width:320,height:720},{width:390,height:844}]){
    await page.setViewportSize(viewport);
    await page.goto(base,{waitUntil:"domcontentloaded"});
    await page.locator(".cocoMiniJuego[data-coco-excellence='1']").first().waitFor({timeout:10000});
    const cards=await page.locator(".cocoMiniJuego[data-coco-excellence='1']").evaluateAll(nodes=>nodes.map(card=>{
      const icon=card.querySelector(".cocoMiniIcono"),title=card.querySelector("b"),meta=card.querySelector(".cocoExcellenceMeta"),goal=meta&&meta.lastElementChild;
      const box=card.getBoundingClientRect(),ib=icon&&icon.getBoundingClientRect(),tb=title&&title.getBoundingClientRect(),mb=meta&&meta.getBoundingClientRect(),gb=goal&&goal.getBoundingClientRect();
      return {height:box.height,width:box.width,titleLeft:tb&&tb.left,iconRight:ib&&ib.right,metaWidth:mb&&mb.width,goalWidth:gb&&gb.width,metaRight:mb&&mb.right,cardRight:box.right}
    }));
    assert.ok(cards.length>=13,`${viewport.width}px: catálogo incompleto`);
    cards.forEach((card,index)=>{
      assert.ok(card.height<190,`${viewport.width}px tarjeta ${index}: altura ${card.height}`);
      assert.ok(card.titleLeft>=card.iconRight+4,`${viewport.width}px tarjeta ${index}: título solapado`);
      assert.ok(card.metaWidth>=card.width-24,`${viewport.width}px tarjeta ${index}: metadatos estrechos`);
      assert.ok(card.goalWidth>=140,`${viewport.width}px tarjeta ${index}: objetivo ilegible`);
      assert.ok(card.metaRight<=card.cardRight+1,`${viewport.width}px tarjeta ${index}: metadatos fuera de tarjeta`)
    })
  }
});

await check("Zona Familiar elimina el resumen y valor redundantes",async()=>{
  await page.evaluate(()=>{
    const app=document.getElementById("cocoApp");
    app.insertAdjacentHTML("beforeend",'<section class="eternaV159FamilyCard"><span class="eternaV159FamilyStatus active">activa</span><section class="cocoExFamilySummary">Resumen anterior</section><section class="cocoExFamilyValue">Valor anterior</section><div class="eternaV160FamilyPromo">Compartir</div><details class="eternaV159ParentSettings"><summary>Privacidad</summary></details></section>');
  });
  await page.waitForTimeout(80);
  assert.equal(await page.locator(".cocoExFamilySummary").count(),0);
  assert.equal(await page.locator(".cocoExFamilyValue").count(),0);
});

await check("El selector de ETERNA muestra ejemplos y estética adolescente",async()=>{
  await page.evaluate(()=>{
    const app=document.getElementById("cocoApp");
    app.insertAdjacentHTML("beforeend",'<section id="eternaOverlayV159" data-et-age-band="teen"><div class="eternaV159Shell"><div class="eternaV159Top"></div><button class="eternaV160ModeChoice" data-et-modechoice="exam"><span><strong>Prepárame para un examen</strong><small>Una pregunta cada vez</small></span></button></div></section>');
  });
  await page.locator(".cocoExModeExample").waitFor();
  assert.match(await page.locator(".cocoExModeExample").innerText(),/células/);
  const radius=await page.locator("#eternaOverlayV159 .eternaV159Shell").evaluate(node=>getComputedStyle(node).backgroundColor);
  assert.ok(radius);
});

await check("No hay errores JavaScript",async()=>assert.deepEqual(pageErrors,[]));
await page.screenshot({path:path.join(evidenceDir,"excellence-mobile.png"),fullPage:true});

await context.close();await browser.close();
const failures=results.filter(row=>row[0]==="FAIL");
for(const row of results)console.log(`${row[0]}  ${row[1]}${row[2]?`\n${row[2]}`:""}`);
console.log(`\n${results.length-failures.length}/${results.length} pruebas de navegador superadas.`);
if(failures.length)process.exitCode=1;
