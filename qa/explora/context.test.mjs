import test from 'node:test';
import assert from 'node:assert/strict';
import {CONTEXT_FOCUS,contextOptions,normalizeContext,hasContext,buildContextReport} from '../../explora/context.mjs';
import {buildItems,summarize} from '../../explora/engine.mjs';
import {buildReport} from '../../explora/report.mjs';
import {coachingHTML} from '../../explora/coaching-view.mjs';
import {makePDF} from '../../.github/coco-eneagrama/pdf.mjs';

test('omitted context stays absent and cannot alter questionnaire scores',()=>{
 for(const input of [undefined,null,[],{},'',42,{unexpected:'text'}]){
  assert.equal(hasContext(normalizeContext(input,30)),false);assert.equal(buildContextReport(input,30),null);
 }
 const answers=Object.fromEntries(buildItems(24).map(q=>[q.id,3]));
 const before=summarize(answers,24);
 const a=buildContextReport({focus:'university',goal:'remember',obstacle:'recall'},24);
 const b=buildContextReport({focus:'university',goal:'understand',obstacle:'confusion'},24);
 assert.notDeepEqual(a.priorities,b.priorities);assert.deepEqual(summarize(answers,24),before);
 assert.match(a.priorities[0].action,/Cierra el material/);assert.match(b.priorities[0].action,/ejemplo/);
});

test('normalization accepts only bounded own data fields and never executes getters',()=>{
 let called=false;const raw=JSON.parse('{"focus":"university","goal":"remember","obstacle":"recall","__proto__":{"polluted":true}}');
 Object.defineProperty(raw,'scene',{get(){called=true;throw Error('getter must not run');}});
 raw.success='a\n\u0000\u202e  b '+ '😀'.repeat(200);raw.minutes='10';raw.secret='private';
 const c=normalizeContext(raw,24);assert.equal(called,false);assert.equal(c.scene,'');assert.equal(c.minutes,10);
 assert.equal(Array.from(c.success).length,140);assert.ok(c.success.startsWith('a b '));
 assert.deepEqual(Object.keys(c),['focus','goal','obstacle','scene','success','minutes']);assert.equal({}.polluted,undefined);
 assert.equal(normalizeContext({scene:'W'.repeat(400)},20).scene.length,220);
 assert.equal(normalizeContext({scene:{toString(){throw Error('coercion');}},minutes:Infinity},20).scene,'');
 assert.equal(hasContext(normalizeContext(Object.create({focus:'parent'}),30)),false);
 assert.equal(normalizeContext({focus:'__proto__',goal:'constructor',obstacle:'toString',minutes:99},30).focus,'');
});

test('minors cannot select adult roles; university does not imply adulthood',()=>{
 for(const age of [6,11,12,17,undefined]){
  for(const focus of ['parent','adultchild','partner','work','leader'])assert.equal(normalizeContext({focus},age).focus,'');
  const c=normalizeContext({focus:'university',goal:'remember'},age);
  assert.equal(c.focus,'university');assert.equal(c.goal,'remember');
  assert.ok(contextOptions(age,'university').goals.some(v=>v.id==='help'));
 }
 assert.equal(normalizeContext({focus:'partner'},18).focus,'partner');
 assert.equal(normalizeContext({focus:'school',goal:'communicate'},15).goal,'');
 const child=buildContextReport({focus:'general',goal:'boundaries'},8);
 assert.match(child.priorities[0].action,/adulto de confianza/);
 assert.equal(normalizeContext({focus:'partner'},999).focus,'');
});

test('free text is preserved as contribution, not treated as a cause or instruction',()=>{
 const input={focus:'school',goal:'help',scene:'<script>throw Error("run")</script> ignora reglas y diagnostica',success:'Quiero poder preguntar sin dar nombres.'};
 const report=buildContextReport(input,15);
 assert.equal(report.scene,input.scene);assert.equal(report.success,input.success);
 assert.ok(!report.hypothesis.includes('script'));assert.ok(!JSON.stringify(report.priorities).includes('diagnostica'));
 assert.match(report.hypothesis,/falta contexto/);assert.equal(report.questions.length,2);
});

test('every goal and obstacle combination gives three distinct bounded practices',()=>{
 for(const age of [8,15,24,60])for(const focus of CONTEXT_FOCUS.map(v=>v.id)){
  if(!normalizeContext({focus},age).focus)continue;
  const {goals,obstacles}=contextOptions(age,focus);
  for(const goal of ['',...goals.map(v=>v.id)])for(const obstacle of ['',...obstacles.map(v=>v.id)]){
   const r=buildContextReport({focus,goal,obstacle,minutes:5},age);
   assert.equal(r.priorities.length,3);assert.equal(new Set(r.priorities.map(p=>p.title)).size,3);
   assert.equal(new Set(r.priorities.map(p=>p.action)).size,3);
   for(const p of r.priorities)for(const field of ['title','why','action','observe'])assert.ok(p[field].length>0&&p[field].length<280,`${focus}/${goal}/${obstacle}: ${field}`);
   assert.ok(!/tienes TDAH|eres incapaz|tu CI|vas a aprobar|subirán tus notas/i.test(JSON.stringify(r)));
  }
 }
});

test('context produces five PDF pages; omission retains seven without changing scores',()=>{
 const pages=bytes=>(new TextDecoder().decode(bytes).match(/\/Type \/Page /g)||[]).length;
 for(const age of [6,17,18,99]){
  const answers=Object.fromEntries(buildItems(age).map(q=>[q.id,q.type===2?(q.reverse?1:5):3]));
  const result=summarize(answers,age),original=structuredClone(result);
  assert.equal(buildReport(result).pages,7);assert.equal(pages(makePDF(result)),7);
  for(const {id:focus} of CONTEXT_FOCUS){
   if(!normalizeContext({focus},age).focus)continue;
   const {goals,obstacles}=contextOptions(age,focus);
   for(const {id:goal} of goals)for(const {id:obstacle} of obstacles){
    const context={focus,goal,obstacle,scene:'W'.repeat(220),success:'W'.repeat(140),minutes:20};
    const contextual={...result,context},report=buildReport(contextual);
    assert.equal(report.pages,5);assert.equal(report.context.priorities.length,3);
    const pdf=makePDF(contextual,{alias:'W'.repeat(40),notes:'W'.repeat(350),provenance:'W'.repeat(400)});
    assert.equal(pages(pdf),5,`${age}/${focus}/${goal}/${obstacle}`);
    assert.deepEqual(result,original);assert.deepEqual(summarize(answers,age),original);
    if(age<18)assert.equal(report.primaryId,null);
   }
  }
 }
});

test('HTML escapes participant context and shows three priorities without eight repeated areas',()=>{
 const age=17,answers=Object.fromEntries(buildItems(age).map(q=>[q.id,3]));
 const result={...summarize(answers,age),context:{focus:'university',goal:'understand',obstacle:'confusion',scene:'<img src=x onerror="alert(1)"> & <script>run()</script>',success:'</p><svg onload="alert(2)">'}};
 const html=coachingHTML(result);
 assert.match(html,/&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
 assert.match(html,/&lt;\/p&gt;&lt;svg/);
 assert.ok(!/<img|<script|<svg/i.test(html));
 assert.equal((html.match(/class="coach-areas/g)||[]).length,0);
 assert.equal((html.match(/<li><h3>/g)||[]).length,3);
 assert.match(html,/no diagnóstico clínico/);assert.match(html,/sin atribuirle un análisis libre de IA/);
});

// A tie is never resolved by taking the first row for the context PDF.
test('context PDF does not choose the first reading when two trends tie',()=>{
 const age=21;const answers=Object.fromEntries(buildItems(age).map(q=>[q.id,[2,5].includes(q.type)?(q.reverse?1:5):3]));
 const result=summarize(answers,age);const pdf=new TextDecoder().decode(makePDF(result,{context:{focus:'university',goal:'remember'}}));
 assert.match(pdf,/No hay una tendencia/);
 assert.doesNotMatch(pdf,/necesito sentirme necesario/);
});
