// Real DOM integration using synthetic profile, no network and no model calls.
const { chromium } = require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES + '/playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
(async () => {
  const browser = await chromium.launch({headless:true,args:['--no-sandbox']});
  const cases=[];
  try {
    for(const viewport of [{width:393,height:852},{width:393,height:500},{width:820,height:1180},{width:1440,height:900}]) {
      const page = await browser.newPage({viewport});
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.route('**/*',route=>route.abort());
      await page.setContent('<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body></body></html>');
      await page.evaluate(() => {
        for(const key of ['localStorage','sessionStorage']){const map={};Object.defineProperty(window,key,{value:{getItem:k=>map[k]||null,setItem:(k,v)=>map[k]=String(v),removeItem:k=>delete map[k]},configurable:true});}
        window.COCO_CONFIG={eternaEndpoint:'https://synthetic.invalid'};
        window.fetch=()=>{throw Error('No live requests allowed');};
        window.testSession={access_token:'synthetic',user:{id:'qa-synthetic'}};
        window.__COCO_SUPABASE_CLIENT={auth:{getSession:async()=>({data:{session:testSession}}),onAuthStateChange:()=>{}}};
      });
      await page.addScriptTag({content:fs.readFileSync(path.join(root,'eterna-state-contract-v3.js'),'utf8')});
      const client=fs.readFileSync(path.join(root,'eterna-v159.js'),'utf8').replace('  window.CocoEternaV160=Object.freeze({','  window.__qa={state,overlay,setMode,appendMessage,resetVisibleSession,MODE_CONFIG,replaceSend:fn=>{send=fn}};\n  window.CocoEternaV160=Object.freeze({');
      await page.addScriptTag({content:client});
      await page.evaluate(()=>{
        Object.assign(__qa.state,{session:testSession,baseProfile:{edad:10,apodo:'Prueba'},profile:{stage:'primaria',school_year:'5º de Primaria'},subscription:{status:'active'},parentSettings:{allow_audio_input:true}});
        __qa.overlay().classList.add('is-open');
        __qa.replaceSend(()=>{window.capturedPractice={mode:__qa.state.mode,text:document.querySelector('[data-et-input]').value,history:__qa.state.history.slice()};});
      });
      for(const mode of ['homework','ask','review','explain','exam','practice']) {
        await page.evaluate(mode=>__qa.setMode(mode,false),mode);
        const input=page.locator('[data-et-input]');
        await input.evaluate(el=>el.placeholder='Escribe tu respuesta…');
        await page.locator('[data-et-newactivity]').click();
        assert.equal(await input.getAttribute('placeholder'),await page.evaluate(mode=>__qa.MODE_CONFIG[mode].placeholder,mode));
        await page.evaluate(()=>__qa.appendMessage('assistant','Vamos paso a paso.',{verification_status:'verified',check_question:'¿Cuánto es 7 × 8?'},false));
        const heading=await page.locator('.eternaV159Check b').last().textContent();
        assert.equal(heading,({homework:'Tu siguiente paso',review:'Revisamos este paso',exam:'Tu pregunta de examen',practice:'Tu turno para practicar'})[mode]||'Comprueba esta idea');
        const bounds=await page.evaluate(()=>{
          const selectors=['[data-et-input]','[data-et-send]','[data-et-newactivity]','[data-et-changemode]'];
          return selectors.map(selector=>{const r=document.querySelector(selector).getBoundingClientRect();return{selector,left:r.left,right:r.right,width:r.width};});
        });
        for(const b of bounds){assert.ok(b.width>0,JSON.stringify(b));assert.ok(b.left>=-1&&b.right<=viewport.width+1,JSON.stringify({viewport,mode,...b}));}
        cases.push({viewport,mode,reset_placeholder:true,contextual_heading:true,horizontal_fit:true});
      }
      await page.evaluate(()=>{
        __qa.setMode('review',false);
        __qa.appendMessage('assistant','Vamos a practicar otra suma.',{verification_status:'verified',practice_suggestion:'Sumar fracciones de distinto denominador',subject:'Matemáticas',concept:'fracciones'},false);
      });
      await page.locator('[data-et-practice]').last().click();
      const request=await page.evaluate(()=>capturedPractice);
      assert.equal(request.mode,'practice');assert.match(request.text,/Sumar fracciones de distinto denominador/);assert.match(request.text,/Tema: fracciones/);assert.equal(request.history.length,0);
      assert.deepEqual(errors,[]);
      await page.close();
    }
  } finally {await browser.close();}
  const report={status:'passed',cases:cases.length,viewports:4,modes:6,practice_transitions:4,network:'disabled',limitation:'Chromium viewport simulation; not physical iOS/Android or real model evaluation',results:cases};
  if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(report,null,2));
  console.log(JSON.stringify({...report,results:undefined},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
