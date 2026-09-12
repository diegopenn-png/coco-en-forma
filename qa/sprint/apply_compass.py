from pathlib import Path
p=Path('eterna-worker/src/index.js');s=p.read_text()
assert 'import "./library/procedural-v1.js";' in s and 'async function readCurricularCompass(' not in s
s=s.replace('import "./library/procedural-v1.js";','import "./library/procedural-v1.js";\nimport "./library/compass-data-v1.js";\nimport "./library/curricular-compass-v1.js";')
helper='''// Bounded read-only public source search. Raw chats, names and pupil IDs are not cache keys or request fields.
const COMPASS_TTL_MS=10*60*1000,COMPASS_CACHE_LIMIT=128,compassCache=new Map();
async function readCurricularCompass(env,profile,subject,concept){
  if(env.ETERNA_CURRICULAR_COMPASS!=="v1"||!globalThis.EternaCurricularCompass||!globalThis.ETERNA_COMPASS_DATA)return null;
  const compass=globalThis.EternaCurricularCompass,plan=compass.plan(profile,subject,concept);if(!plan)return null;
  let origin;try{origin=new URL(env.SUPABASE_URL).origin}catch{return null}
  const key=await sha256(origin+JSON.stringify(plan)),now=Date.now(),cached=compassCache.get(key);if(cached&&cached.expires_at>now)return await cached.value;
  const secret=supabaseSecretKey(env);if(!secret)return null;
  const value=(async()=>{
    const controller=typeof AbortController!=="undefined"?new AbortController():null;
    let timer;try{
      const headers={apikey:secret,"Content-Type":"application/json"};if(!secret.startsWith("sb_secret_"))headers.Authorization="Bearer "+secret;
      const work=fetch(origin+"/rest/v1/rpc/eterna_curricular_compass_v1",{method:"POST",headers,body:JSON.stringify(plan),...(controller?{signal:controller.signal}:{})}).then(async r=>r.ok?compass.context(await r.json(),plan):null);
      const cutoff=new Promise(resolve=>{timer=setTimeout(()=>{try{controller?.abort()}catch{}resolve(null)},900)});
      return await Promise.race([work,cutoff]);
    }catch{return null}finally{if(timer)clearTimeout(timer)}
  })();
  if(compassCache.size>=COMPASS_CACHE_LIMIT)compassCache.delete(compassCache.keys().next().value);
  compassCache.set(key,{expires_at:now+COMPASS_TTL_MS,value});return await value
}
'''
s=s.replace('async function retrieveCurriculum(env,profile,subject,concept)',helper+'\nasync function retrieveCurriculum(env,profile,subject,concept)')
a='const curriculum=await retrieveCurriculum(env,ctx.profile,effectiveSubject,effectiveConcept);let externalEvidence=null;timings?.mark("curriculum");'
b='const [curriculum,compass]=await Promise.all([retrieveCurriculum(env,ctx.profile,effectiveSubject,effectiveConcept),readCurricularCompass(env,ctx.profile,effectiveSubject,effectiveConcept)]);if(compass)scope.curricular_compass=compass;let externalEvidence=null;timings?.mark("curriculum");'
assert s.count(a)==1;s=s.replace(a,b)
a='${publicTutorBenchmarkInstruction()}\nMEMORIA ACADÉMICA'
b='${publicTutorBenchmarkInstruction()}\nBRÚJULA CURRICULAR: scope.curricular_compass contiene solo orientación de saberes y criterios estatales, no explicaciones ni prueba de la respuesta. Nunca la uses para dar por cierta una afirmación, cerrar una verificación o afirmar que una materia es obligatoria en un curso autonómico. Respeta el curso y las optativas; no cites un fragmento incompleto como norma íntegra.\nMEMORIA ACADÉMICA'
assert a in s;s=s.replace(a,b)
a='Currículo=${JSON.stringify(evidence)}. Evidencia académica fiable opcional='
b='Currículo=${JSON.stringify(evidence)}. ORIENTACIÓN CURRICULAR ESTATAL, NO PRUEBA FACTUAL=${JSON.stringify(scope.curricular_compass||null)}. Evidencia académica fiable opcional='
assert s.count(a)==1;s=s.replace(a,b)
a='16) topic_return_request: debe retomar el estado restaurado sin evaluar la petición de retorno como respuesta académica ni repetir desde el principio.'
b=a+'\n17) Scope.curricular_compass es orientación normativa estatal, no evidencia factual de una solución ni acreditación autonómica. Su presencia no justifica declarar verified ni sustituir una comprobación independiente.'
assert a in s;s=s.replace(a,b)
a='generated_variants_are_not_new_lessons:true}}),c);'
b='generated_variants_are_not_new_lessons:true},curricular_compass:{enabled:env.ETERNA_CURRICULAR_COMPASS==="v1"&&Boolean(globalThis.EternaCurricularCompass),version:globalThis.EternaCurricularCompass?.version||null,source_elements:globalThis.ETERNA_COMPASS_DATA?.source_elements||0,scope:"state_curriculum_orientation_only",max_items:3,additional_generation_model_calls:0,territorial_completeness:false}}),c);'
assert s.count(a)==1;s=s.replace(a,b)
p.write_text(s)
