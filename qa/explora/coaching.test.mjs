import {buildReport} from '../../explora/report.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import {buildItems,summarize} from '../../explora/engine.mjs';import {buildCoaching,REPORT_PAGES} from '../../explora/coaching.mjs';import {makePDF} from '../../.github/coco-eneagrama/pdf.mjs';
function result(age,leaders=[]){return summarize(Object.fromEntries(buildItems(age).map(q=>[q.id,leaders.includes(q.type)?(q.reverse?1:5):3])),age)}
test('nine complete guides and eight concrete areas; tied answers never select a type',()=>{const c=buildCoaching(result(30));assert.deepEqual(c.focus,[]);assert.equal(c.profiles.length,9);assert.ok(c.profiles.every(p=>p.areas.length===8&&p.areas.every(a=>a.tip.length>45)));assert.equal(new Set(c.profiles.flatMap(p=>p.areas.map(a=>a.tip))).size,72);assert.equal(c.plan.length,7)});
test('adults receive a comparative reading, minors never a ranked identity',()=>{assert.deepEqual(buildCoaching(result(30,[2,5])).focus,[2,5]);for(const age of [6,11,12,17]){const c=buildCoaching(result(age,[5]));assert.deepEqual(c.focus,[]);assert.ok(!c.profiles.some(p=>p.areas.some(a=>a.name.includes('pareja')||a.name.includes('Trabajo'))));assert.match(c.intro,age<12?/colegio/:/autonomía/);assert.ok(!JSON.stringify(c).includes('de confianza de confianza'));if(age<12)assert.match(c.profiles[0].areas[0].question,/tu amigo/)}assert.match(buildCoaching(result(18,[5])).profiles[0].areas[0].name,/pareja/)});
test('PDF layout supports all focus combinations, three age groups and long reflections',()=>{for(const age of [8,15,35])for(const leaders of [[],[1],[2,5],[1,6,9],[1,2,3,4]]){const bytes=makePDF(result(age,leaders),{age,alias:'W'.repeat(40),notes:'W'.repeat(350)});assert.equal((new TextDecoder().decode(bytes).match(/\/Type \/Page /g)||[]).length,REPORT_PAGES)}});

// Regression: editorial selection must not assign tied types to arbitrary areas.
test('report has one non-repeated action per area and no arbitrary tie winner',()=>{
 for(const age of [6,11,12,17,18,99])for(const leaders of [[],[1],[2],[3],[4],[5],[6],[7],[8],[9],[1,2],[2,5,8],[1,2,3,4]]){
  const r=result(age,leaders),c=buildReport(r);
  assert.equal(c.areas.length,8);assert.equal(new Set(c.areas.map(a=>a.tip)).size,8);
  if(age<18||leaders.length!==1){assert.equal(c.primaryId,null);assert.ok(c.areas.every(a=>a.source===null));}
  else assert.equal(c.primaryId,leaders[0]);
  assert.equal((new TextDecoder().decode(makePDF(r,{age,notes:'W'.repeat(350)})).match(/\/Type \/Page /g)||[]).length,7);
 }
 const child=buildReport(result(10,[2])),teen=buildReport(result(15,[2]));
 assert.notEqual(child.areas[2].tip,teen.areas[2].tip);assert.match(teen.areas[2].tip,/proyecto|materia/);
});
test('runner-up is compared only if unique; closer means remain ambiguous',()=>{
 const r=result(40,[2]);r.rows[0].score=4.4;
 let c=buildReport(r);assert.deepEqual(c.readings.map(p=>p.id),[2,1]);
 assert.match(c.synthesis,/qué me corresponde realmente/);
 r.rows[2].score=4.4;c=buildReport(r);assert.deepEqual(c.readings.map(p=>p.id),[2]);
 assert.match(c.evidence,/empate/);
});
