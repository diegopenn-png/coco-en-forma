const {JSDOM,VirtualConsole}=require(process.env.COCO_JSDOM_PATH||'jsdom');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const settle=()=>new Promise(resolve=>setImmediate(resolve));

(async()=>{
 const context=await import('../../explora/context.mjs');
 const forms=await import('../../explora/context-form.mjs');
 const engine=await import('../../explora/engine.mjs');
 const reporting=await import('../../explora/report.mjs');
 const view=await import('../../explora/coaching-view.mjs');
 const coaching=await import('../../explora/coaching.mjs');
 const pdf=await import('../../.github/coco-eneagrama/pdf.mjs');

 // Imported modules run together in Node's realm; the form is a DOM fixture.
 // In the app test, normalized context is created by readContextForm and the
 // request is JSON-serialized to simulate the browser/server boundary.
 {
  const dom=new JSDOM(`<form id="start"><input name="dob" type="date" value="1990-01-01">${forms.contextFormHTML()}</form>`);
  const w=dom.window,f=w.document.querySelector('form');
  forms.mountContextForm(f,()=>engine.ageAt(f.elements.dob.value).years);
  assert.equal(f.querySelectorAll('.personal-context [required]').length,0);
  assert.equal(context.hasContext(forms.readContextForm(f,35)),false);
  assert.equal(f.elements.context_scene.maxLength,220);assert.equal(f.elements.context_success.maxLength,140);
  const change=(name,value)=>{f.elements[name].value=value;f.elements[name].dispatchEvent(new w.Event('change',{bubbles:true}));};
  change('context_focus','parent');change('context_goal','communicate');change('context_obstacle','haste');
  f.elements.context_scene.value='<script>run()</script>';f.elements.context_success.value='Pedir ayuda.';
  change('context_focus','school');
  assert.equal(f.elements.context_goal.value,'');assert.equal(f.elements.context_obstacle.value,'');
  assert.equal(f.elements.context_scene.value,'<script>run()</script>');
  change('context_goal','remember');change('context_obstacle','recall');
  assert.equal(forms.readContextForm(f,35).goal,'remember');
  change('context_focus','university');
  assert.equal(f.elements.context_goal.value,'remember');
  change('dob','2016-01-01');
  assert.equal(f.elements.context_focus.value,'university');
  assert.ok(!Array.from(f.elements.context_focus.options).some(o=>o.value==='parent'));
  change('dob','1990-01-01');change('context_focus','partner');change('context_goal','communicate');
  change('dob','2016-01-01');
  assert.equal(f.elements.context_focus.value,'');
  assert.ok(!Array.from(f.elements.context_focus.options).some(o=>['parent','adultchild','partner','work','leader'].includes(o.value)));
  assert.equal(w.document.querySelectorAll('script').length,0);
  dom.window.close();
 }

 for(const ageGroup of ['adult','minor']){
  const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
  const dom=new JSDOM('<main id="app"></main>',{url:'https://coco.test/explora/jugar.html',runScripts:'outside-only',virtualConsole:vc});
  const w=dom.window,d=w.document;Object.assign(w,engine,reporting,view,coaching,forms);
  w.navigation={};w.setNavigation=v=>w.navigation=v;w.setNavigationBusy=()=>{};
  w.masterAccess=true;w.ensureAccess=ready=>ready();w.scrollTo=()=>{};w.confirm=()=>true;
  const requests=[],blobs=[];
  w.requestReport=async body=>{
   const received=JSON.parse(JSON.stringify(body));requests.push(received);
   const r=engine.summarize(received.answers,received.age);
   return pdf.makePDF(r,{...received,context:received.context});
  };
  w.URL.createObjectURL=blob=>{blobs.push(blob);return 'blob:https://coco.test/'+blobs.length;};w.URL.revokeObjectURL=()=>{};
  w.eval(fs.readFileSync('explora/app.mjs','utf8').replace(/^import[^\n]+\n/gm,''));
  const click=selector=>{const el=d.querySelector(selector);assert.ok(el,selector);el.click();};
  const change=(form,name,value)=>{form.elements[name].value=value;form.elements[name].dispatchEvent(new w.Event('change',{bubbles:true}));};
  const submit=form=>{form.elements.willing.checked=true;form.elements.adult.checked=true;form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));};
  let form=d.querySelector('#start');
  change(form,'dob',ageGroup==='adult'?'1990-01-01':'2016-01-01');
  change(form,'context_focus',ageGroup==='adult'?'university':'school');
  change(form,'context_goal','understand');change(form,'context_obstacle','confusion');
  form.elements.context_scene.value='<img src=x onerror="alert(1)"> No entendí un paso.';
  form.elements.context_success.value='Explicar el paso con un ejemplo.';form.elements.context_minutes.value='10';
  const expected=forms.readContextForm(form,engine.ageAt(form.elements.dob.value).years);
  submit(form);assert.ok(d.querySelector('.question-card'));
  w.navigation.back();form=d.querySelector('#start');assert.ok(form);
  assert.deepEqual(forms.readContextForm(form,engine.ageAt(form.elements.dob.value).years),expected);
  submit(form);
  for(let i=0;i<54;i++){click('[data-value="3"]');click('#next');}
  await settle();
  assert.ok(d.querySelector('.report'));assert.equal(requests.length,1);assert.deepEqual(requests[0].context,expected);
  assert.equal(d.querySelectorAll('img[src=x],script,svg[onload]').length,0);
  assert.match(d.querySelector('.download-help').textContent,/5 páginas/);
  assert.equal(d.querySelectorAll('.context-priorities > li').length,3);
  assert.equal(d.querySelectorAll('.coach-areas').length,0);
  assert.match(d.querySelector('.context-quote').textContent,/No entendí un paso/);
  const saved=d.querySelector('#download').href;w.navigation.back();click('#return-report');
  assert.equal(d.querySelector('#download').href,saved);assert.equal(requests.length,1);
  d.querySelector('#notes').value='Mi nueva reflexión';d.querySelector('#notes').dispatchEvent(new w.Event('input'));
  click('#update-notes');await settle();assert.equal(requests.length,2);
  assert.equal(requests[1].run_id,requests[0].run_id);assert.deepEqual(requests[1].context,expected);
  click('#restart');form=d.querySelector('#start');assert.ok(form);
  assert.equal(form.elements.dob.value,'');assert.equal(context.hasContext(forms.readContextForm(form,18)),false);
  assert.equal(form.elements.context_scene.value,'');assert.equal(form.elements.context_success.value,'');
  assert.equal(w.localStorage.length,0);assert.equal(w.sessionStorage.length,0);
  assert.deepEqual(errors,[]);w.close();
 }
 console.log('PASS: optional context, role/age changes, study goal compatibility, preserved back-navigation, JSON request, escaped report, five-page download, update and erase.');
})().catch(error=>{console.error(error);process.exitCode=1;});
