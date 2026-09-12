import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';import{webcrypto}from'node:crypto';import vm from'node:vm';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8'),c={};vm.createContext(c);vm.runInContext(read('../src/library/compass-data-v1.js'),c);vm.runInContext(read('../src/library/curricular-compass-v1.js'),c);const compass=c.EternaCurricularCompass;
const row={unit_id:'BOE-A-2022-4975:II:00162:362cd53b0936',source_key:'BOE-A-2022-4975',stage:'eso',subject:'Biología y Geología',offering:'Biología y Geología',course_band:'Cuarto curso',kind:'knowledge_item',official_code:null,body:'– La función biológica de la mitosis, la meiosis y sus fases.',official_url:'https://www.boe.es/buscar/act.php?id=BOE-A-2022-4975#ai-2',text_sha256:'362cd53b09369a95521e1a4f3e41bc1d3caa4d594158ff86ff8e3357ef2171d3'};
const plan=compass.plan({school_year:'4º de ESO'},'Biología','mitosis y meiosis');
test('compass covers all four national stage inventories without claiming textbook or regional completeness',()=>{
 assert.equal(c.ETERNA_COMPASS_DATA.source_elements,9033);assert.equal(c.ETERNA_COMPASS_DATA.knowledge_items,3120);assert.equal(c.ETERNA_COMPASS_DATA.criteria,1612);assert.equal(Object.values(c.ETERNA_COMPASS_DATA.subjects).reduce((n,x)=>n+x.length,0),70);assert.equal(c.ETERNA_COMPASS_DATA.normative_text_is_not_a_lesson,true);assert.equal(c.ETERNA_COMPASS_DATA.territorial_consolidation_complete,false);
 for(const[stage,labels]of Object.entries(c.ETERNA_COMPASS_DATA.subjects))for(const label of labels)assert.deepEqual(JSON.parse(JSON.stringify(compass.subjects(stage,label))),[label]);
});
test('only bounded public-source vocabulary, stage and subject are sent to source lookup',()=>{
 assert.ok(plan);assert.equal(plan.p_stage,'eso');assert.equal(plan.p_grade,4);assert.ok(plan.p_subjects.includes('Biología y Geología'));assert.deepEqual(Array.from(plan.p_terms),['mitosis','meiosis']);
 for(const p of [{},{school_year:'universidad'},{school_year:'4º de ESO',preferred_language:'ca'}])assert.equal(compass.plan(p,'Biología','mitosis'),null);
 for(const v of ['nombre@example.com','mi teléfono es 123456789','https://evil.example/mitosis','mitosis <script>'])assert.equal(compass.terms(v).length,0);
 assert.equal(compass.plan({school_year:'4º de ESO'},'Información secreta','mitosis'),null);
 assert.equal(compass.terms('supercalifragilisticoNombreInventado').length,0);
 assert.ok(compass.terms('mitosis meiosis células núcleo reproducción material genético').length<=6);
});
test('grade-band checks prevent upper-stage paragraphs leaking into younger-course source context',()=>{
 assert.equal(compass.expectedBand('primaria',2,'Tercer ciclo'),false);assert.equal(compass.expectedBand('primaria',5,'Tercer ciclo'),true);
 assert.equal(compass.expectedBand('eso',1,'Cuarto curso'),false);assert.equal(compass.expectedBand('eso',4,'Cursos de primero a tercero'),false);
 assert.equal(compass.expectedBand('bachillerato',1,'2'),false);assert.equal(compass.expectedBand('infantil',4,'Primer ciclo'),false);
 assert.equal(compass.expectedBand('bachillerato',1,'unspecified'),true);
});
test('compass distinguishes curricular scope from factual evidence and caps prompt length',()=>{
 const ctx=compass.context([row],plan);assert.ok(ctx);assert.equal(ctx.role,'curricular_orientation_only');assert.equal(ctx.factual_answer_evidence,false);assert.equal(ctx.territorial_alignment_verified,false);assert.equal(ctx.items.length,1);
 const large=compass.context(Array.from({length:6},(_,i)=>({...row,unit_id:row.unit_id+i,body:'Texto normativo de referencia. '.repeat(100)})),plan);assert.ok(JSON.stringify(large).length<=2600);assert.ok(large.items.length<=3);assert.equal(large.items[0].excerpt_truncated,true);
});
test('malformed, external, wrong course, wrong subject or unapproved kind rows are discarded',()=>{
 for(const change of [{stage:'primaria'},{subject:'Química'},{course_band:'Cursos de primero a tercero'},{official_url:'https://example.invalid'},{source_key:'private-child-data'},{kind:'student_message'},{text_sha256:'wrong'}])assert.equal(compass.context([{...row,...change}],plan),null,JSON.stringify(change));
});
function harness({bad=false,slow=false}={}){
 const src=read('../src/index.js'),match=src.match(/const COMPASS_TTL_MS=[\s\S]+?(?=async function retrieveCurriculum)/);assert.ok(match);
 const calls=[];const sandbox={URL,AbortController,setTimeout,clearTimeout,crypto:webcrypto,TextEncoder,globalThis:null};sandbox.globalThis=sandbox;
 sandbox.EternaCurricularCompass=compass;sandbox.ETERNA_COMPASS_DATA=c.ETERNA_COMPASS_DATA;
 sandbox.sha256=async s=>Buffer.from(await webcrypto.subtle.digest('SHA-256',new TextEncoder().encode(s))).toString('hex');sandbox.supabaseSecretKey=e=>e.SUPABASE_SECRET_KEY;
 sandbox.fetch=async(url,init)=>{calls.push({url,init});if(slow)return new Promise((_,reject)=>init.signal.addEventListener('abort',()=>reject(Error('aborted'))));return{ok:!bad,json:async()=>[row]}};
 vm.createContext(sandbox);vm.runInContext(match[0]+'\nglobalThis.run=readCurricularCompass;',sandbox);
 return{calls,run:sandbox.run,env:{ETERNA_CURRICULAR_COMPASS:'v1',SUPABASE_URL:'https://source-test.invalid',SUPABASE_SECRET_KEY:'sb_secret_test'}};
}
test('read-only compass caches public output without adding model or personal-data requests',async()=>{
 const h=harness(),p={school_year:'4º de ESO',apodo:'DoNotSend',age:15,user_id:'private-uid'};
 const [a,b]=await Promise.all([h.run(h.env,p,'Biología','mitosis'),h.run(h.env,p,'Biología','mitosis')]);assert.ok(a);assert.ok(b);assert.equal(h.calls.length,1);
 const call=h.calls[0];assert.ok(call.url.endsWith('/rpc/eterna_curricular_compass_v1'));assert.equal(call.init.method,'POST');const body=JSON.parse(call.init.body);assert.equal(body.p_stage,'eso');assert.doesNotMatch(call.init.body,/DoNotSend|private-uid|apodo|user_id/);assert.equal(body.p_snapshot,'eterna-curriculum-map-2026.09.12-v1');
});
test('compass is optional and degrades without affecting original tutor behavior',async()=>{
 const h=harness();assert.equal(await h.run({...h.env,ETERNA_CURRICULAR_COMPASS:'off'},{school_year:'4º de ESO'},'Biología','mitosis'),null);assert.equal(h.calls.length,0);
 const bad=harness({bad:true});assert.equal(await bad.run(bad.env,{school_year:'4º de ESO'},'Biología','mitosis'),null);
 const slow=harness({slow:true});const start=Date.now();assert.equal(await slow.run(slow.env,{school_year:'4º de ESO'},'Biología','mitosis'),null);assert.ok(Date.now()-start<1400);
});
test('integration keeps normative orientation out of factual-evidence and source-completion gates',()=>{
 const s=read('../src/index.js');assert.match(s,/Promise\.all\(\[retrieveCurriculum\(env,ctx\.profile,effectiveSubject,effectiveConcept\),readCurricularCompass/);assert.match(s,/if\(compass\)scope\.curricular_compass=compass/);
 assert.match(s,/ORIENTACIÓN CURRICULAR ESTATAL, NO PRUEBA FACTUAL/);assert.match(s,/Su presencia no justifica declarar verified/);
 assert.doesNotMatch(s,/curriculum\.push\(compass|curriculum\.unshift\(compass/);
 const gate=s.match(/const academicNeedsSource=[^;]+;/)?.[0];assert.ok(gate);assert.doesNotMatch(gate,/compass/);
});
