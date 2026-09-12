import test from'node:test';
import assert from'node:assert/strict';
import{readFileSync}from'node:fs';
import{createHash}from'node:crypto';
import '../src/library/content-v1.js';
import '../src/library/runtime-v1.js';
const content=globalThis.ETERNA_LIBRARY_CONTENT,library=globalThis.EternaOwnedLibrary;
const previous=JSON.parse(readFileSync(new URL('../../qa/library/lessons-v1.json',import.meta.url)));
const newLessons=content.lessons.filter(l=>!previous.some(p=>p.id===l.id));
const get=id=>{const l=content.lessons.find(l=>l.id===id);assert.ok(l,id);return l};
const answer=(id,pos=0)=>{const q=get(id).quiz[pos];return q.options['ABC'.indexOf(q.answer)]};
const gcd=(a,b)=>b?gcd(b,a%b):a,lcm=(a,b)=>a/gcd(a,b)*b;
const checks=[
 ['p-even',0,()=>[13,18,21].find(x=>x%2===0).toString()],
 ['p-factors',0,()=>[14,18,20].find(x=>x%4===0).toString()],
 ['p-factors',1,()=>[3,5,7].find(x=>12%x===0).toString()],
 ['p-lcm',0,()=>String(lcm(3,4))],['p-lcm',1,()=>String(lcm(5,10))],
 ['p-gcd',0,()=>String(gcd(12,18))],['p-gcd',1,()=>String(gcd(8,12))],
 ['p-number-line',0,()=>String(4-2)],['p-number-line',1,()=>String((4+6)/2)],
 ['p-volume',0,()=>`${4*3*2} cm³`],
 ['e-systems',0,()=>{const x=(7+1)/2,y=7-x;return`x = ${x}, y = ${y}`}],
 ['e-quadratic',0,()=>{const r=[];for(let x=-10;x<=10;x++)if(x*x-5*x+6===0)r.push(x);return r.join(' y ')}],
 ['e-trig',0,()=>`${3}/${Math.hypot(3,4)}`],
 ['e-similarity',0,()=>String(4/2)],['e-similarity',1,()=>String((4*6)/(2*3))],
 ['e-median',0,()=>String((4+6)/2)],
 ['e-motion',0,()=>`${(8-2)/3} m/s²`],['e-electric',0,()=>`${6/3} A`],
 ['e-solution',0,()=>`${10/2} g/L`],['e-population',0,()=>`${100-80+30-20} personas`],
 ['e-scale',0,()=>`${4*50/100} m`],
 ['b-determinant',0,()=>String(1*4-2*3).replace('-','−')],
 ['b-log',0,()=>String(Math.log2(8))],
 ['b-binomial',0,()=>{let successes=0;for(let mask=0;mask<8;mask++)if(mask.toString(2).replace(/0/g,'').length===2)successes++;return`${successes}/8`}],
 ['b-normal',0,()=>String((130-100)/15)],['b-dot',0,()=>String(1*2+2*-1)],
 ['b-gravity',0,()=>`1/${2**2}`],['b-waves',0,()=>`${2*5} m/s`],
 ['b-waves',1,()=>`${String(1/5).replace('.',',')} s`]
];
for(const[id,pos,expected]of checks)test(`independent numeric content: ${id} question ${pos+1}`,()=>assert.equal(answer(id,pos),expected()));

test('160 lessons preserve the 80 previously deployed objects byte-equivalently as JSON',()=>{
 assert.equal(content.lessons.length,160);assert.equal(newLessons.length,80);
 assert.equal(library.protocols.length,40);assert.equal(content.release_id,'eterna-library-2026.09-v2');
 for(const old of previous)assert.deepEqual(get(old.id),old,old.id);
 assert.deepEqual(Object.fromEntries(['infantil','primaria','eso','bachillerato'].map(s=>[s,newLessons.filter(l=>l.stage===s).length])),{infantil:12,primaria:28,eso:24,bachillerato:16});
});
test('new content uses explicit provenance and distinct question options',()=>{
 for(const l of newLessons){assert.equal(l.human_teacher_reviewed,false);assert.equal(l.source_kind,'original_teaching_material');assert.equal(l.curriculum_alignment_status,'stage_subject_reference_not_exhaustive_criterion_mapping');
  for(const key of ['explanation','simpler','example','why','misconception'])assert.ok(l[key].length>35,l.id+' '+key);
  for(const q of l.quiz){assert.equal(new Set(q.options).size,3);assert.ok(q.options.every(o=>o.trim().length>0));assert.ok(q.question.length<600)}
 }
});
test('v1 pending activity markers continue to work after v2 content expansion',()=>{
 const l=get('p-prime'),q=l.quiz[0],ped={current_mode:'exam',active_concept:l.title,pending_question:library.question(q),next_teaching_goal:'lib:v1:p-prime:0:0:exam'};
 const r=library.decision({text:q.answer,mode:'exam',profile:{school_year:'5º de Primaria'},pedState:ped});assert.equal(r.assessment,'correct');
});
test('new protocol aliases are unique, polite and never grade the unseen work',()=>{
 const added=JSON.parse(readFileSync(new URL('../../qa/library-v2/protocolos.json',import.meta.url)));
 const names=library.protocols.flatMap(p=>p.aliases);assert.equal(names.length,new Set(names).size);
 for(const p of added)for(const alias of p.aliases){assert.equal(library.protocol(alias)?.protocol,p.id);for(const school_year of ['Infantil · 5 años','5º de Primaria','2º de Bachillerato'])assert.ok(library.cordial(p.id,{profile:{school_year},pedState:{pending_question:'Pregunta pendiente'}}).length>30);assert.equal(library.protocol(alias+' y alguien me está haciendo daño'),null)}
 assert.match(library.cordial('check_answer',{}),/antes de decirte que está bien/);
 assert.match(library.cordial('no_official_grade',{}),/no sustituyen/i);
});
test('new educational aliases remain exact and do not confuse the semicolon with two signs',()=>{
 assert.equal(library.exactLesson('punto y coma en una frase',{school_year:'5º de Primaria'}),null);
 for(const l of newLessons){const profile={school_year:l.school_years.at(-1)};
  assert.equal(library.exactLesson('Explícame '+l.title,profile)?.id,l.id);
  assert.equal(library.exactLesson('Explícame '+l.title+' y responde otra pregunta distinta',profile),null);
 }
});
test('content expansion changes no Worker integration logic other than release ID',()=>{
 const code=readFileSync(new URL('../src/index.js',import.meta.url),'utf8').replaceAll('eterna-library-2026.09-v2','eterna-library-2026.09-v1');
 assert.equal(createHash('sha256').update(code).digest('hex'),'0a142b6705aa1ee4b63562cd59cfc66c8e5702768d5413e46c94106f6e1eb52c');
});
