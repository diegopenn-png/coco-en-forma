import test from 'node:test';
import assert from 'node:assert/strict';
import {buildItems,summarize} from '../../explora/engine.mjs';
import {buildReport} from '../../explora/report.mjs';
import * as view from '../../explora/coaching-view.mjs';
import {makePDF} from '../../.github/coco-eneagrama/pdf.mjs';

// All profiles are synthetic. Values are expressed after reversing the two reverse items.
function fixture(age=35,values={},omit=[]){
 const answers=Object.fromEntries(buildItems(age).filter(q=>!omit.includes(q.id)).map(q=>{
  const j=Number(q.id.split('-')[1]),v=values[q.type]??3,n=Array.isArray(v)?v[j]:v;
  return [q.id,q.reverse?6-n:n];
 }));
 return summarize(answers,age);
}

test('report preserves the scoring source and distinguishes partial means from missing means',()=>{
 const result=fixture(35,{2:5},['2-4','2-5','9-3','9-4','9-5']);
 const before=JSON.stringify(result),report=buildReport(result);
 assert.ok(report.results,'a shared, traceable results model is required');
 assert.equal(report.results.coverage.answered,49);
 assert.equal(report.results.coverage.omitted,5);
 assert.equal(report.results.coverage.available,8);
 assert.equal(report.results.rows.find(r=>r.id===2).coverage,'4/6');
 assert.equal(report.results.rows.find(r=>r.id===2).status,'partial');
 assert.equal(report.results.rows.find(r=>r.id===9).status,'insufficient');
 assert.equal(report.results.rows.find(r=>r.id===9).score,null);
 assert.equal(report.results.comparison.kind,'incomplete');
 assert.equal(report.primaryId,null);
 assert.equal(report.experiment.sourceId,null);
 assert.equal(JSON.stringify(result),before,'report generation must not rewrite scores or answers');
});

test('an eligible map with omissions retains its actual coverage and numeric evidence',()=>{
 const report=buildReport(fixture(35,{2:5},['2-4','2-5']));
 assert.ok(report.results);
 assert.equal(report.results.coverage.answered,52);
 assert.equal(report.results.coverage.partial,1);
 assert.equal(report.primaryId,2);
 assert.match(report.readings[0].observed,/5,00.*4 de 6/);
 assert.match(report.results.coverage.note,/omisiones/);
});

test('exact ties, close means and a wide map remain different without creating a tie winner',()=>{
 const tied=buildReport(fixture(35,{2:5,5:5}));
 const close=buildReport(fixture(35,{2:5,5:[5,5,5,5,5,4]}));
 const wide=buildReport(fixture());
 assert.ok(tied.results);
 assert.equal(tied.results.comparison.kind,'tie');
 assert.deepEqual(tied.results.comparison.exactTopIds,[2,5]);
 assert.equal(close.results.comparison.kind,'close');
 assert.deepEqual(close.results.comparison.nearIds,[2,5]);
 assert.ok(Math.abs(close.results.comparison.gap-1/6)<1e-9);
 assert.equal(wide.results.comparison.kind,'broad');
 for(const report of [tied,close,wide]){
  assert.equal(report.primaryId,null);
  assert.equal(report.experiment.sourceId,null);
  assert.match(report.results.comparison.rule,/editorial/);
 }
 assert.doesNotMatch(wide.results.comparison.description,/todas las respuestas (?:fueron|son) iguales/);
});

test('different available profiles receive different experiments with observable revision criteria',()=>{
 const reports=[1,2,3,4,5,6,7,8,9].map(id=>buildReport(fixture(35,{[id]:5})));
 assert.ok(reports.every(r=>r.experiment));
 assert.equal(new Set(reports.map(r=>r.experiment.action)).size,9);
 assert.equal(new Set(reports.map(r=>r.readings[0].contrast)).size,9);
 for(const [index,report] of reports.entries()){
  assert.equal(report.experiment.sourceId,index+1);
  assert.ok(report.experiment.observe.length>35);
  assert.ok(report.experiment.adjust.length>35);
  assert.equal(report.episode.practice[1],report.experiment.action);
  assert.match(report.readings[0].observed,/5,00.*6 de 6/);
 }
});

test('children and adolescents keep ownership of their exercise without a ranked identity',()=>{
 for(const age of [6,11,12,17]){
  const report=buildReport(fixture(age,{8:5}));
  assert.ok(report.results);
  assert.equal(report.results.comparison.kind,'minor');
  assert.equal(report.results.comparison.gap,null);
  assert.deepEqual(report.results.comparison.nearIds,[]);
  assert.equal(report.primaryId,null);
  assert.equal(report.experiment.sourceId,null);
  assert.match(report.experiment.action,/eliges|elige|tú/);
  assert.doesNotMatch(JSON.stringify(report.experiment),/pareja|empleo|inversi[oó]n/);
 }
 assert.notEqual(buildReport(fixture(11)).experiment.action,buildReport(fixture(12)).experiment.action);
});

test('an empty map remains empty and never infers a low tendency or a motive',()=>{
 const report=buildReport(summarize({},35));
 assert.ok(report.results);
 assert.equal(report.results.coverage.omitted,54);
 assert.equal(report.results.coverage.available,0);
 assert.ok(report.results.rows.every(r=>r.score===null&&r.status==='insufficient'));
 assert.equal(report.results.comparison.gap,null);
 assert.equal(report.primaryId,null);
 assert.equal(report.readings.length,0);
 assert.equal(report.experiment.sourceId,null);
});

test('an incomplete or broad map does not invent an exact tie',()=>{
 const broad=buildReport(fixture(35,{1:5,2:[5,5,5,5,5,4],3:[5,5,5,5,4,3],4:[5,5,5,4,3,3]},['3-5','4-4','4-5']));
 assert.equal(broad.results.comparison.kind,'broad');
 assert.deepEqual(broad.results.comparison.exactTopIds,[1]);
 for(const report of [broad,buildReport(summarize({},35))]){
  assert.doesNotMatch(report.synthesis,/empate de puntuaciones/);
  assert.match(report.synthesis,/contexto/);
 }
});

test('a minor with missing data is never told that nine means are available',()=>{
 const report=buildReport(summarize({},10));
 assert.equal(report.results.coverage.available,0);
 assert.equal(report.results.comparison.kind,'minor');
 assert.doesNotMatch(report.evidence+' '+report.results.comparison.description,/Las nueve medias/);
 assert.match(report.evidence,/Faltan respuestas/);
 assert.match(report.results.comparison.description,/disponibles/);
 assert.equal(report.readings.length,0);
 assert.equal(report.primaryId,null);
});

test('the shared table exposes real means and counts, and both renderers carry the same experiment',()=>{
 const result=fixture(35,{5:5},['5-4','5-5']),report=buildReport(result);
 assert.equal(typeof view.resultMapHTML,'function');
 const html=view.resultMapHTML(result)+view.coachingHTML(result);
 const pdf=new TextDecoder().decode(makePDF(result,{sample:true}));
 assert.match(html,/<table/);
 assert.equal((html.match(/data-result-row=/g)||[]).length,9);
 assert.match(html,/4\/6/);
 assert.match(html,/5,00/);
 assert.ok(html.includes(report.experiment.action));
 assert.ok(pdf.includes('(52 de 54 respuestas'));
 assert.ok(pdf.includes('(4/6)'));
 assert.ok(pdf.includes('(Un ensayo acotado)'));
 assert.equal((pdf.match(/\/Type \/Page /g)||[]).length,7);
});
