import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {webcrypto,createHash} from 'node:crypto';
const context={crypto:webcrypto,Uint32Array};vm.createContext(context);
vm.runInContext(readFileSync(new URL('../src/library/procedural-v1.js',import.meta.url),'utf8'),context);
const f=context.EternaProceduralPractice;
const profileFor=skill=>{const [stage,grade]=Object.entries(skill.min)[0];return {school_year:`${grade}º de ${{primaria:'Primaria',eso:'ESO',bachillerato:'Bachillerato'}[stage]}`}};
// A choice-order change is not a new exercise. Decimal comparison has its actual
// operands in the choices; every other family states its problem in the stem.
const key=q=>q.question.normalize('NFC')+(q.params.hundredths?'|'+[...q.params.hundredths].sort((a,b)=>a-b).join(','):'');
const closed=(lesson,mode)=>({current_mode:mode,active_concept:lesson.title,active_subject:lesson.subject,next_teaching_goal:`proc:v1:${lesson.skill_id}:${lesson.seed}:2:0:${mode}`,pending_question:null,current_help_level:0,conversation_stage:'complete'});

test('regression: another percentage round must not slide the last two questions forward',()=>{
 const profile={school_year:'5º de Primaria'},lesson=f.generate('percent',25,profile);
 const next=f.decision({text:'Otra ronda',profile,mode:'practice',pedState:closed(lesson,'practice'),modeState:{correct_count:3,incorrect_count:0,question_number:3}});
 assert.ok(next);assert.equal(next.mode_state.correct_count,0);assert.equal(next.mode_state.question_number,1);
 const previous=new Set(lesson.quiz.map(key));for(const q of next.lesson.quiz)assert.ok(!previous.has(key(q)),`Repeated exercise: ${q.question}`);
});

for(const skill of f.skills)test(`adjacent round variety: ${skill.id}, 200 seeds in both modes`,()=>{
 const profile=profileFor(skill);
 for(const mode of ['practice','exam'])for(let n=0;n<200;n++){
  let lesson=f.generate(skill.id,n,profile);
  for(let round=0;round<3;round++){
   const previous=new Set(lesson.quiz.map(key));
   const next=f.decision({text:round%2?'más ejercicios':'otra ronda',profile,mode,pedState:closed(lesson,mode),modeState:{correct_count:3,incorrect_count:1,question_number:3}});
   assert.ok(next,skill.id+': must find a bounded, non-overlapping round');assert.equal(next.model_calls,0);assert.equal(next.generation_tokens,0);
   assert.equal(next.lesson.skill_id,skill.id);assert.equal(next.mode_state.question_number,1);assert.equal(next.mode_state.correct_count,0);assert.equal(next.mode_state.incorrect_count,0);
   assert.equal(new Set(next.lesson.quiz.map(key)).size,3,'Three distinct problem stems (or decimal operand sets)');
   for(const q of next.lesson.quiz)assert.ok(!previous.has(key(q)),skill.id+': '+q.question);
   const ped={...closed(next.lesson,mode),next_teaching_goal:next.next_teaching_goal,pending_question:next.check_question};
   const own=f.owned(ped,profile,mode);assert.ok(own);assert.equal(f.question(own.question),next.check_question);
   lesson=next.lesson;
  }
 }
});

test('explicit test seed cannot bypass the previous round exclusion',()=>{
 const profile={school_year:'5º de Primaria'},lesson=f.generate('percent',25,profile);
 for(const seed of [25,(25+0x9e3779b9)>>>0,0,0xffffffff]){
  const next=f.decision({text:'otra ronda',profile,mode:'practice',pedState:closed(lesson,'practice'),seed});assert.ok(next);
  const previous=new Set(lesson.quiz.map(key));assert.ok(next.lesson.quiz.every(q=>!previous.has(key(q))));
 }
});

test('active question is not silently replaced by another-round request',()=>{
 const profile={school_year:'5º de Primaria'},lesson=f.generate('percent',25,profile),ped={...closed(lesson,'practice'),next_teaching_goal:`proc:v1:percent:${lesson.seed}:0:0:practice`,pending_question:f.question(lesson.quiz[0])};
 assert.equal(f.decision({text:'otra ronda',profile,mode:'practice',pedState:ped}),null);
 assert.equal(f.decision({text:'otra ronda',profile,mode:'exam',pedState:closed(lesson,'practice')}),null);
});

test('all existing seeded question objects remain byte-equivalent to published v1',()=>{
 const initial=[];for(const skill of f.skills)for(let seed=0;seed<32;seed++)initial.push(f.generate(skill.id,seed,profileFor(skill)));
 assert.equal(createHash('sha256').update(JSON.stringify(initial)).digest('hex'),'cfc4b8046ac8600a675b06dfec798dde828ad41d42c6f9207ffe2c0f1442be30');
});
