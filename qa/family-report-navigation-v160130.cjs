const {chromium}=require(process.env.COCO_PLAYWRIGHT_PATH||'playwright');
const fs=require('fs'),http=require('http'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const root=process.cwd(),out=process.env.COCO_QA_OUT||'/tmp/coco-family-qa';fs.mkdirSync(out,{recursive:true});
const types={'.html':'text/html','.js':'application/javascript','.mjs':'application/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.ttf':'font/ttf'};
const sample={kind:'family',student:{name:'Perfil de prueba',age:'10 años',schoolYear:'5º de Primaria',ccaa:'Andalucía'},learning:{theme:'learning',subtitle:'Un resumen de las materias y conceptos que ha practicado.',summary:'Ha trabajado Matemáticas, Ciencias Naturales y Lengua. Las valoraciones recogen la práctica registrada.',hero:{eyebrow:'MAYOR AVANCE OBSERVADO',title:'Más avance en: suma de fracciones con distinto denominador',text:'Esta valoración se basa en práctica repetida y puede cambiar con nuevas actividades.',percent:89},metrics:[{value:3,label:'materias trabajadas'},{value:32,label:'interacciones registradas'},{value:12,label:'conceptos con práctica'},{value:'3/7',label:'días activos esta semana'}],bars:[{label:'Suma de fracciones',value:89},{label:'Comprensión lectora',value:64}],panels:[{title:'Para seguir avanzando',text:'Repasar un ejemplo y explicar con sus palabras cómo lo resolvió.',items:[{label:'Fracciones equivalentes',percent:72,detail:'Práctica registrada'}]}],nextStep:{title:'Un pequeño reto cada día',text:'Resolver una operación y explicar el resultado.'}},games:{theme:'games',summary:'Ha entrenado memoria, atención y razonamiento con diferentes juegos.',hero:{eyebrow:'FORTALEZA DESTACADA',title:'Memoria y atención',text:'Una lectura de las habilidades practicadas hasta ahora.',percent:82},metrics:[{value:12,label:'partidas que puntúan'},{value:'3/7',label:'días activos'}],bars:[{label:'Memoria',value:82},{label:'Razonamiento',value:75}]}};
(async()=>{
const server=http.createServer((req,res)=>{let p=path.join(root,decodeURIComponent(req.url.split('?')[0]));try{if(fs.statSync(p).isDirectory())p=path.join(p,'index.html');res.setHeader('Content-Type',types[path.extname(p)]||'application/octet-stream');res.end(fs.readFileSync(p))}catch{res.writeHead(404).end()}});await new Promise(ok=>server.listen(4189,'127.0.0.1',ok));
const browser=await chromium.launch({headless:true,...(process.env.COCO_CHROMIUM_PATH?{executablePath:process.env.COCO_CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-gpu','--no-zygote']});const ctx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block',isMobile:true,hasTouch:true});const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
let attempts=3;
await p.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname==='127.0.0.1')return r.continue();if(u.hostname==='cdn.jsdelivr.net'&&u.pathname.includes('supabase'))return r.fulfill({contentType:'application/javascript',body:fs.readFileSync(root+'/supabase-js-2.112.3.min.js','utf8')});if(u.hostname.endsWith('workers.dev')&&u.pathname==='/v1/export')return r.fulfill({
  headers:{'Access-Control-Allow-Origin':'http://127.0.0.1:4189','Access-Control-Allow-Methods':'GET, OPTIONS','Access-Control-Allow-Headers':'authorization, content-type'},
  json:{student_profile:{school_year:'5º de Primaria'},student_concept_memory:attempts?[{concept_label:'Memoria',subject:'Matemáticas',attempts,mastery_score:.8},{concept_label:'Proyecto',subject:'Taller, «A y B»',attempts:1,mastery_score:.5}]:[],learning_strategy_memory:attempts>1?[{strategy_key:'worked_example',evidence_count:3,success_score:.8}]:[],academic_memory:[],usage:[]}
});if(u.hostname.endsWith('workers.dev'))return r.fulfill({headers:{'Access-Control-Allow-Origin':'http://127.0.0.1:4189','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':r.request().headers()['access-control-request-headers']||'authorization, content-type'},contentType:'application/json',body:JSON.stringify({ok:true,subscription:{status:'active',plan:'monthly'},student:{},summary:{},report:{},features:{},usage:{},parent_settings:{}})});return r.abort()});
await p.addInitScript(({hash})=>{
const user={id:'00000000-0000-4000-8000-000000000001',email:'visual-test@example.invalid',user_metadata:{apodo:'Perfil de prueba',edad:'10'}};let session={access_token:'synthetic-ui-only',user};
localStorage.setItem('coco_pin_familia',hash);
const rows={ajustes:{id:1,partidas_por_dia:1},perfiles:{id:user.id,apodo:'Perfil de prueba',rol:'jugador',edad:10},partidas:[],bonos:[],eterna_family_security:{pin_hash:hash},eterna_subscriptions:{status:'active',plan:'monthly'},eterna_student_profiles:{school_year:'5º de Primaria',autonomous_community:'Andalucía'}};
function query(table){let single=false;const chain=new Proxy({},{get(_,key){if(key==='then')return resolve=>resolve({data:single?(Array.isArray(rows[table])?null:rows[table]||null):(Array.isArray(rows[table])?rows[table]:rows[table]?[rows[table]]:[]),error:null,count:0});if(key==='single'||key==='maybeSingle')return ()=>{single=true;return chain};return ()=>chain}});return chain;}
window.__COCO_SUPABASE_CLIENT={from:query,rpc:()=>Promise.resolve({data:[],error:null}),auth:{getSession:async()=>({data:{session}}),getUser:async()=>({data:{user}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},channel:()=>({on(){return this},subscribe(){return this},unsubscribe(){}}),removeChannel(){}};
}, {hash:crypto.createHash('sha256').update('coco-familia-4826').digest('hex')});
if(process.argv.includes('--languages')){
  try{
    const choose=p.locator('[data-coco-language-menu] select').first();
    const familyButton=p.locator('.cocoFamiliaBtn').first();
    const profiles = [
      {attempts:3, languages:['fr','ar','en','es','de']},
      {attempts:1, languages:['nl','it','ru','zh-Hans','da']},
      {attempts:0, languages:['pl','uk','sv','fi','nb']}
    ];
    for(const profile of profiles){
      attempts=profile.attempts;
      await p.goto('http://127.0.0.1:4189/?lang='+profile.languages[0],{waitUntil:'domcontentloaded'});
      for(const tag of profile.languages){
        await choose.selectOption(tag);
        await p.waitForFunction(tag=>window.CocoLocale?.tag===tag,tag);
        await familyButton.click();
        const pin=p.locator('.cocoFamilyPin input').first();
        await pin.fill('1');
        await p.locator('[data-family-enter]').click();
        await p.waitForFunction(()=>document.querySelector('.cocoFamilyError')?.textContent===CocoLocale.t('Escribe exactamente cuatro cifras.'));
        await p.locator('[data-family-recover-open]').click();
        await p.waitForFunction(()=>document.querySelector('[data-family-recover-email] bdi')?.textContent==='vi***t@example.invalid');
        await p.locator('[data-family-recover-save]').click();
        await p.waitForFunction(()=>document.querySelector('[data-family-recover-msg]')?.textContent===CocoLocale.t('Escribe la contraseña de la cuenta.'));
        await p.locator('[data-family-recover-close]').click();
        await pin.fill(tag==='ar'?'٤٨٢٦':'4826');
        await p.locator('[data-family-enter]').click();
        const printButton=p.locator('[data-family-integral-export]:enabled');
        await printButton.waitFor();
        const chapter='[data-family-integral-chapter="learning"]';
        const summarySelector=chapter+' .cocoV160100PlainSummary';
        const expected=await p.evaluate(({attempts,tag})=>{
          if(!attempts)return CocoLocale.t('Todavía no hay actividad escolar suficiente para preparar una valoración.');
          const subjects=['Matemáticas','Taller, «A y B»'];
          if(tag==='es')return 'Ha trabajado '+subjects.join(', ')+(attempts===1?', pero todavía necesitamos más de una interacción sobre un mismo concepto antes de sacar conclusiones.':'. Solo valoramos los conceptos con al menos dos interacciones; el resto se muestra como actividad, sin inventar conclusiones.');
          const topics=new Intl.ListFormat(tag).format(subjects.map(s=>CocoLocale.t(s)));
          return CocoLocale.t('Se ha practicado: {topics}.',{topics})+' '+CocoLocale.t(attempts===1?'Todavía hace falta repetir un mismo concepto para valorar el progreso.':'Solo se valoran conceptos con al menos dos interacciones. El resto figura como actividad.');
        },{attempts,tag});
        await p.waitForFunction(([s,text])=>document.querySelector(s)?.textContent===text,[summarySelector,expected]);
        assert.equal(await p.locator(chapter+' .cocoV16083Next').count(),attempts?1:0);
        await printButton.click();
        const report=p.frameLocator('.cocoReportPreview iframe');
        await report.locator('html[lang="'+tag+'"]').waitFor();
        assert.equal(await report.locator('html').getAttribute('dir'),tag==='ar'?'rtl':'ltr');
        assert.equal(await p.locator('html').getAttribute('lang'),tag);
        assert.equal(await report.locator(summarySelector).textContent(),expected);
        if(attempts>1){
          const strategy=await p.evaluate(()=>CocoLocale.t('ejemplos similares'));
          assert.ok((await report.locator(chapter).innerText()).includes(strategy));
        }
        assert.ok((await report.locator('.cocoV16086ExportIdentity').innerText()).includes('Perfil de prueba'));
        await report.locator('.is-home').click();
        await p.locator('.cocoFamilyV129').waitFor({state:'detached'});
        console.log('Family PIN, recovery, report and print preview passed in '+tag+' (attempts per concept: '+attempts+')');
      }
    }
    assert.deepEqual(errors,[]);
  }catch(error){
    console.error('Synthetic family screen at failure:',await p.evaluate(()=>({
      language:document.documentElement.lang, pinGate:!!document.querySelector('.cocoFamilyPin'),
      pinError:document.querySelector('.cocoFamilyError')?.textContent,
      canonical:document.querySelector('.eternaV159FamilyCard')?.dataset.etFamilyState,
      controls:Array.from(document.querySelectorAll('.cocoFamilyV129 button')).filter(node=>node.offsetWidth).map(node=>node.textContent.trim()).slice(0,20),
      report:document.querySelector('[data-family-integral-report]')?.innerText.slice(0,1800),
      message:document.querySelector('.cocoFamilyV129Body')?.innerText.slice(0,500)
    })),errors);
    throw error;
  }finally{await browser.close();server.close();}
  return;
}
await p.goto('http://127.0.0.1:4189/',{waitUntil:'domcontentloaded'});await p.locator('.cocoFamiliaBtn').first().waitFor();await p.locator('.cocoFamiliaBtn').first().click();await p.locator('.cocoFamilyPin input').first().waitFor();
await p.screenshot({path:out+'/pin-390.png'});assert.ok(await p.locator('[data-family-back]').isVisible());await p.locator('[data-family-back]').click();await p.locator('.cocoFamilyV129').waitFor({state:'detached'});
await p.locator('.cocoFamiliaBtn').first().click();await p.locator('.cocoFamilyPin input').first().fill('4826');await p.locator('[data-family-enter]').click();
await p.locator('[data-family-integral-report="1"]').waitFor({timeout:20000});await p.screenshot({path:out+'/family-real-390.png'});
// Real renderers, synthetic model. Prevent network-derived fixture changes during layout checks.
await p.evaluate(sample=>{const card=document.querySelector('.eternaV159FamilyCard');const report=card.querySelector('[data-family-integral-report]');report.outerHTML=CocoFamilyReportKitV16084.familyHtml(sample,true);document.querySelector('[data-family-integral-export]').onclick=function(){CocoFamilyReportKitV16084.export(sample,this)};window.familySample=sample},sample);
async function assertWhiteOnBlue(scope,selectors){for(const selector of selectors){const colors=await scope.locator(selector).evaluateAll(nodes=>nodes.map(n=>getComputedStyle(n).color));assert.ok(colors.length,selector+' must be present');assert.ok(colors.every(c=>c==='rgb(255, 255, 255)'),selector+' '+JSON.stringify(colors));}}
const results=[];
for(const width of [320,390,768,1280]){
await p.setViewportSize({width,height:900});await p.locator('.cocoFamilyV129Body').evaluate(el=>el.scrollTop=0);
const before=await p.locator('.cocoFamilyV129').evaluate(el=>({width:el.clientWidth,scroll:el.scrollWidth,nav:el.querySelector('nav').getBoundingClientRect().top}));assert.ok(before.scroll<=before.width+1,JSON.stringify(before));assert.ok(before.nav>=0);
await assertWhiteOnBlue(p,['.cocoV16086FamilyHeaderCopy>span','.cocoV16086FamilyHeaderCopy h2','.cocoV16086FamilyHeaderCopy p','.cocoV16086ChapterHead>span','.cocoV16083HeroOrb b']);
if(width===390){await p.locator('[data-family-integral-report]').evaluate(el=>el.scrollIntoView({block:'start'}));await p.screenshot({path:out+'/family-390.png'});await p.locator('.cocoV16086FamilyHeader').screenshot({path:out+'/family-header-390.png'});await p.locator('.cocoV16086ChapterHead').first().screenshot({path:out+'/chapter-header-390.png'});}
await p.locator('[data-family-integral-export]').scrollIntoViewIfNeeded();const scrollBefore=await p.locator('.cocoFamilyV129Body').evaluate(el=>el.scrollTop);await p.locator('[data-family-integral-export]').click();const iframe=p.frameLocator('.cocoReportPreview iframe');await iframe.locator('.cocoReportNavigation').waitFor();await iframe.locator('.cocoReportBrand img').evaluate(i=>i.decode());await iframe.locator('body').evaluate(()=>document.fonts.ready);
await assertWhiteOnBlue(iframe,['.cocoV16083DocTop h1','.cocoV16083DocTop span','.cocoV16083DocTop b','.cocoV16086ChapterHead>span','.cocoV16083HeroOrb b']);
const layout=await iframe.locator('body').evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,font:getComputedStyle(document.querySelector('h1')).fontFamily,title:document.querySelector('h1').textContent}));assert.ok(layout.scroll<=width+1,JSON.stringify(layout));assert.match(layout.font,/CocoMontserrat/);assert.equal(ctx.pages().length,1,'No tab or popup');
await iframe.locator('body').evaluate(()=>scrollTo(0,1000));const nav=await iframe.locator('.cocoReportNavigation').boundingBox();assert.ok(nav.y>=0&&nav.y<20,JSON.stringify(nav));
await iframe.locator('body').evaluate(()=>scrollTo(0,0));if(width===390)await p.screenshot({path:out+'/report-390.png'});
await iframe.locator('button', {hasText:'← Volver'}).click();await p.locator('.cocoReportPreview').waitFor({state:'detached'});assert.ok(await p.locator('.cocoFamilyV129').isVisible());assert.equal(await p.locator('.cocoFamilyV129Body').evaluate(el=>el.scrollTop),scrollBefore);assert.equal(await p.locator('#cocoApp').evaluate(n=>n.inert),false);results.push({width,overflow:false,stickyNavigation:true,returnsToFamily:true,whiteOnBlue:true});
}
await p.locator('[data-family-integral-export]').click();let frame=p.frameLocator('.cocoReportPreview iframe');await frame.locator('.is-print').waitFor();await frame.locator('body').evaluate(()=>{window.print=()=>{window.printCalled=true}});await frame.locator('.is-print').click();assert.ok(await frame.locator('body').evaluate(()=>window.printCalled));
await frame.locator('.is-home').click();await p.locator('.cocoReportPreview').waitFor({state:'detached'});await p.locator('.cocoFamilyV129').waitFor({state:'detached'});assert.equal(await p.locator('#cocoApp').evaluate(n=>n.inert),false);
// A standalone HTML document retains branding, working print styles and real data text.
const html=await p.evaluate(s=>CocoFamilyReportKitV16084.familyDocumentHtml(s),sample);const print=await ctx.newPage();await print.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());await print.setContent(html);await print.evaluate(()=>document.fonts.ready);await print.emulateMedia({media:'print'});assert.equal(await print.locator('.cocoReportNavigation').isVisible(),false);await print.pdf({path:out+'/report.pdf',format:'A4',printBackground:true});
fs.writeFileSync(out+'/result.json',JSON.stringify({results,errors,homeReturns:true,printAction:true,noLiveWrites:true},null,2));console.log(JSON.stringify({results,errors,homeReturns:true,printAction:true,noLiveWrites:true}));await browser.close();server.close();
})().catch(e=>{console.error(e);process.exit(1)});
