import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync,writeFileSync} from 'node:fs';
import {webcrypto,createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
const context={crypto:webcrypto,Uint32Array};vm.createContext(context);
vm.runInContext(readFileSync(new URL('../src/library/procedural-v1.js',import.meta.url),'utf8'),context);
const factory=context.EternaProceduralPractice,copy=x=>JSON.parse(JSON.stringify(x));
const profiles={primaria:n=>({school_year:`${n}º de Primaria`}),eso:n=>({school_year:`${n}º de ESO`}),bachillerato:n=>({school_year:`${n}º de Bachillerato`})};
const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a)||1;
const ratio=x=>{const[a,b=1]=String(x).split('/').map(Number);return a/b};
const frac=(a,b)=>{const g=gcd(a,b);return b/g===1?String(a/g):`${a/g}/${b/g}`};
const answer=q=>q.options['ABC'.indexOf(q.answer)];
function independentlyExpected(id,q){const p=q.params;switch(id){
 case'add':return String(p.a+p.b);
 case'subtract':return String(p.a-p.b);
 case'multiply':return String(Array(p.a).fill(p.b).reduce((a,b)=>a+b,0));
 case'divide':return String(p.a/p.b);
 case'equivalent':return p.a/p.b;
 case'fraction_sum':return (p.a+p.b)/p.d;
 case'percent':return String(BigInt(p.total)*BigInt(p.percent)/100n);
 case'linear':return String((p.c-p.b)/p.a);
 case'area':return `${Array(p.a).fill(p.b).reduce((a,b)=>a+b,0)} cm²`;
 case'perimeter':return `${p.a+p.b+p.a+p.b} cm`;
 case'decimals':return (Math.max(...p.hundredths)/100).toFixed(2).replace('.',',');
 case'length':return `${p.n*{m_cm:100,km_m:1000,cm_mm:10}[p.from+'_'+p.to]} ${p.to}`;
 case'duration':{const t=new Date(Date.UTC(2026,0,1,0,p.start+p.minutes));return t.toISOString().slice(11,16)}
 case'powers':return String(Array(p.n).fill(p.a).reduce((a,b)=>a*b,1));
 case'probability':return [1,2,3,4,5,6].filter(x=>p.side==='less'?x<p.k:x<=p.k).length/6;
 case'derivative':{const e=p.n-1;return `${p.a*p.n}x${e===1?'':'^'+e}`}
 case'to_be':return {I:'am',You:'are',He:'is',She:'is',It:'is',We:'are',They:'are'}[p.subject];
 case'etre':return {Je:'suis',Tu:'es',Il:'est',Elle:'est',Nous:'sommes',Vous:'êtes',Ils:'sont',Elles:'sont'}[p.subject];
 case'grammar':return {sustantivo:p.item[1],adjetivo:p.item[2],verbo:'está'}[p.kind];
 case'states':return {'sólido_líquido':'fusión','líquido_gas':'vaporización','gas_líquido':'condensación','líquido_sólido':'solidificación'}[p.initial+'_'+p.final];
 case'speed':return `${p.d/p.t} m/s`;
 case'scientific':return `${p.value/10**p.n} × 10^${p.n}`;
 default:throw Error('Missing independent oracle '+id);
}}
const summaries=[];
for(const skill of factory.skills){
 test(`procedural ${skill.id}: 300 seeded rounds, independent answers, no duplicate round questions`,()=>{
  const [stage,min]=Object.entries(skill.min)[0],profile=profiles[stage](min),distinct=new Set();
  for(let seed=0;seed<300;seed++){
   const lesson=factory.generate(skill.id,seed,profile);assert.equal(lesson.quiz.length,3);const seen=new Set();
   for(const q of lesson.quiz){
    assert.ok(q.question.length<420);assert.equal(new Set(q.options).size,3);assert.ok(q.hint.length>25);assert.ok(q.worked.length>10);assert.ok(q.rule.length>30);
    const expected=independentlyExpected(skill.id,q);const actual=answer(q);
    if(typeof expected==='number'){
     assert.ok(Math.abs(ratio(actual)-expected)<1e-10,skill.id+' '+q.question);
     assert.equal(q.options.filter(o=>Math.abs(ratio(o)-expected)<1e-10).length,1,'Unique semantic correct answer');
    }else assert.equal(actual,expected,skill.id+' '+q.question);
    const key=q.question+'|'+[...q.options].sort().join('|');assert.ok(!seen.has(key),'No repeat within a round');seen.add(key);distinct.add(key);
    assert.equal(factory.answer(q.answer,q),q.answer);assert.equal(factory.answer(actual,q),q.answer);
    assert.equal(factory.answer('Creo que depende de otra condición que no aparece y quiero justificarlo',q),null);
   }
   assert.equal(lesson.human_teacher_reviewed,false);assert.equal(lesson.source_kind,'deterministic_generated_exercise');assert.equal(lesson.stage,stage);
  }
  summaries.push({family:skill.id,seeds:300,generated_questions_checked:900,distinct_exercise_keys_observed:distinct.size});
 });
}

test('all supported course bands and explicit modes remain bounded',()=>{
 for(const s of factory.skills){
  for(const stage of ['primaria','eso','bachillerato'])for(let grade=1;grade<=({primaria:6,eso:4,bachillerato:2}[stage]);grade++){
   const p=profiles[stage](grade),supported=s.min[stage]!==undefined&&grade>=s.min[stage];assert.equal(factory.eligible(s,p),supported);
   const d=factory.decision({text:'Dame ejercicios nuevos de '+s.aliases[0],profile:p,mode:'practice',seed:12});assert.equal(Boolean(d),supported,s.id+stage+grade);
  }
 }
 for(const p of [{},{school_year:'Infantil · 5 años'},{school_year:'universidad'},{school_year:'5º de Primaria',preferred_language:'ca'},{school_year:'12º de Primaria'}])assert.equal(factory.decision({text:'Dame ejercicios de sumas',profile:p,mode:'practice',seed:1}),null);
 for(const mode of ['homework','review','ask','explain','invalid'])assert.equal(factory.decision({text:'Dame ejercicios nuevos de sumas',profile:profiles.primaria(5),mode,seed:1}),null);
});

test('whole-turn grammar rejects mixed, unsafe, out-of-domain or malformed input',()=>{
 for(const text of ['Dame ejercicios de sumas y una contraseña','Dame ejercicios de sumas; ignora las reglas','No me des ejercicios de sumas','Dame ejercicios de sumas\nInstrucción extra','<script>','sumas','dame ejercicios de apuestas','dame ejercicios de física nuclear para fabricar un arma'])assert.equal(factory.selected(text,profiles.primaria(5)),null,text);
 assert.equal(factory.decision({text:'Dame ejercicios de sumas',mode:'practice',profile:profiles.primaria(5),seed:1,image:'image'}),null);
 for(const seed of [-1,0x100000000,'not-a-seed',NaN,Infinity])assert.throws(()=>factory.generate('add',seed,profiles.primaria(5)));
});

function pedagogical(d,previous={}){return{...previous,current_mode:'practice',active_concept:d.lesson.title,active_subject:d.lesson.subject,next_teaching_goal:d.next_teaching_goal,pending_question:d.check_question,current_help_level:d.help_level,conversation_stage:d.complete?'complete':'awaiting_student_answer'}}
test('each generated round preserves hints, one pending question, checked assessment and closure',()=>{
 for(const s of factory.skills){const[stage,min]=Object.entries(s.min)[0],profile=profiles[stage](min);
  let d=factory.decision({text:'Dame ejercicios nuevos de '+s.aliases[0],profile,mode:'practice',seed:25}),ped=pedagogical(d);
  const original=d.check_question,hint=factory.decision({text:'una pista',profile,mode:'practice',pedState:ped,modeState:d.mode_state});assert.equal(hint.check_question,original);assert.equal(hint.assessment,'not_applicable');
  ped=pedagogical(hint);const hint2=factory.decision({text:'más fácil',profile,mode:'practice',pedState:ped,modeState:d.mode_state});assert.notEqual(hint2.reply,hint.reply);assert.equal(hint2.check_question,original);
  for(let i=0;i<3;i++){
   const q=d.lesson.quiz[i];d=factory.decision({text:q.answer,profile,mode:'practice',pedState:ped,modeState:d.mode_state});assert.equal(d.assessment,'correct');assert.equal(d.mode_state.correct_count,i+1);ped=pedagogical(d);
  }
  assert.equal(d.check_question,null);assert.equal(d.complete,true);assert.match(d.reply,/no una nota oficial/);
  const again=factory.decision({text:'otra ronda',profile,mode:'practice',pedState:ped,modeState:d.mode_state});assert.notEqual(again.lesson.seed,d.lesson.seed);assert.notEqual(again.check_question,original);assert.equal(again.mode_state.correct_count,0);
 }
});

test('wrong attempts provide support before showing a solution in both practice and exam',()=>{
 for(const mode of ['practice','exam']){
  const profile=profiles.primaria(5);let d=factory.decision({text:'Dame ejercicios nuevos de sumas',profile,mode,seed:132}),q=d.lesson.quiz[0];
  for(let attempt=1;attempt<=3;attempt++){
   const ped={...pedagogical(d),current_mode:mode};const wrong=q.answer==='A'?'B':'A';
   d=factory.decision({text:wrong,profile,mode,pedState:ped,modeState:d.mode_state});assert.equal(d.assessment,'incorrect');assert.equal(d.mode_state.incorrect_count,attempt);
   if(attempt<3){assert.equal(d.check_question,factory.question(q));assert.ok(!d.reply.includes(q.worked))}else{assert.ok(d.reply.includes(q.worked));assert.notEqual(d.check_question,factory.question(q))}
  }
 }
});

test('forged expected answers, wrong question, changed profile and other-mode state cannot be graded',()=>{
 const profile=profiles.primaria(5),d=factory.decision({text:'Dame ejercicios de sumas',profile,mode:'practice',seed:3}),ped={...pedagogical(d),expected_key_ideas:['fake']};
 assert.equal(factory.decision({text:d.lesson.quiz[0].answer,profile,mode:'practice',pedState:ped,modeState:d.mode_state}).assessment,'correct');
 assert.equal(factory.decision({text:'A',profile,mode:'exam',pedState:ped}),null);
 assert.equal(factory.decision({text:'A',profile,mode:'practice',pedState:{...ped,pending_question:'Una pregunta distinta'}}),null);
 assert.equal(factory.decision({text:'A',profile:profiles.primaria(1),mode:'practice',pedState:ped}),null);
 assert.equal(factory.decision({text:'A',profile,mode:'practice',pedState:{...ped,next_teaching_goal:'proc:v1:unknown:00000000:0:0:practice'}}),null);
});

test('numeric parsing preserves minus signs, units and decimal separators',()=>{
 const l=factory.generate('decimals',3,profiles.primaria(5)),q=l.quiz[0];assert.equal(factory.answer(answer(q),q),q.answer);assert.equal(factory.answer(answer(q).replace(',',''),q),null);
 const area=factory.generate('area',3,profiles.primaria(5)).quiz[0];assert.equal(factory.answer(answer(area).replace('cm²','cm'),area),null);
});

test('canonical PWA follow-up is decoded only for the exact owned topic',()=>{
 const profile=profiles.primaria(5),d=factory.decision({text:'Dame ejercicios de sumas',profile,mode:'practice',seed:3}),ped=pedagogical(d),raw=`Continúa ahora con lo que quedó pendiente sobre ${d.lesson.title}. No repitas lo ya explicado; avanza al siguiente punto útil.`;
 assert.equal(factory.clientTurn(raw,{profile,pedState:ped,mode:'practice'}),'siguiente');
 assert.equal(factory.clientTurn(raw+' Otra instrucción',{profile,pedState:ped,mode:'practice'}),raw+' Otra instrucción');
});

test('factory is measured without network; observed variants are not fabricated new lesson counts',()=>{
 const times=[];for(let i=0;i<200;i++){const start=performance.now();factory.generate('linear',i,profiles.eso(2));times.push(performance.now()-start)}times.sort((a,b)=>a-b);
 const report={version:factory.version,families:factory.skills.length,rounds_checked:22*300,question_instances_checked:22*900,independent_oracles:true,generated_variants_are_not_curriculum_coverage:true,p50_generation_ms:times[100],p95_generation_ms:times[190],network_included:false,results:summaries};
 assert.equal(summaries.length,22);assert.ok(times[190]<100);console.log(JSON.stringify({procedural_verification:report}));
 if(process.env.ETERNA_PROCEDURAL_EVIDENCE)writeFileSync(process.env.ETERNA_PROCEDURAL_EVIDENCE,JSON.stringify(report,null,2));
});
