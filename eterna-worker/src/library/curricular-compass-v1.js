/* Read-only curricular orientation. Does not establish the truth of an answer,
 * replace moderation, or promote unreviewed territorial law into teaching content.
 */
(function(root){
 'use strict';
 const VERSION='curricular-compass-v1';
 const normalize=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
 const STOP=new Set('que como para este esta estas estos del las los una unos unas con por sobre muy mas menos mayor menor tema estudiar aprender practica ejercicios ejercicio problema explicar explica explicame ayudar ayudame repasar quiero necesito saber entender hacer forma concepto teoria introduccion pregunta dudas actividades actividad relacion segun ser son entre desde hasta cuando donde cual cuales tengo modo bien parte partes siguiente despues ejemplo ejemplos colegio escuela alumno alumnos'.split(' '));
 function course(profile={}){
  if(profile.preferred_language&&!/^es(?:-es)?$/i.test(profile.preferred_language))return null;
  const t=normalize(profile.school_year);let m=t.match(/^([1-6])(?:º|o)? de primaria$/);if(m)return{stage:'primaria',grade:Number(m[1])};
  m=t.match(/^([1-4])(?:º|o)? de eso$/);if(m)return{stage:'eso',grade:Number(m[1])};
  m=t.match(/^([1-2])(?:º|o)? de bachillerato$/);if(m)return{stage:'bachillerato',grade:Number(m[1])};
  m=t.match(/^infantil(?:\s*[·-]\s*| )([0-5]) anos$/);return m?{stage:'infantil',grade:Number(m[1])}:null;
 }
 function subjects(stage,raw){
  const known=root.ETERNA_COMPASS_DATA?.subjects?.[stage]||[],key=normalize(raw),exact=known.filter(v=>normalize(v)===key);if(exact.length)return exact;
  const add=(candidates)=>known.filter(v=>candidates.includes(normalize(v)));
  if(stage==='primaria'){
   if(['ciencias','ciencias naturales','ciencias sociales','conocimiento del medio','biologia','geologia','historia','geografia'].includes(key))return add(['conocimiento del medio natural, social y cultural']);
   if(['ingles','frances','lengua extranjera: ingles','lengua extranjera: frances'].includes(key))return add(['lengua extranjera']);
   if(['lengua','castellano','lectura'].includes(key))return add(['lengua castellana y literatura']);
   if(['arte','musica','plastica','educacion plastica'].includes(key))return add(['educacion artistica']);
   if(['valores','etica'].includes(key))return add(['educacion en valores civicos y eticos']);
  }
  if(stage==='eso'){
   if(['fisica','quimica'].includes(key))return add(['fisica y quimica']);
   if(['biologia','geologia','ciencias naturales'].includes(key))return add(['biologia y geologia']);
   if(['historia','geografia','ciencias sociales'].includes(key))return add(['geografia e historia']);
   if(['ingles','lengua extranjera: ingles'].includes(key))return add(['lengua extranjera']);
   if(['frances','lengua extranjera: frances'].includes(key))return add(['segunda lengua extranjera','lengua extranjera']);
   if(['lengua','castellano','literatura'].includes(key))return add(['lengua castellana y literatura']);
   if(key==='tecnologia')return add(['tecnologia','tecnologia y digitalizacion']);
  }
  if(stage==='bachillerato'){
   if(['lengua','castellano'].includes(key))return add(['lengua castellana y literatura']);
   if(['ingles','frances','lengua extranjera: ingles','lengua extranjera: frances'].includes(key))return add(['lengua extranjera']);
   if(key==='biologia')return add(['biologia','biologia, geologia y ciencias ambientales']);
  }
  return [];
 }
 function terms(concept){
  if(typeof concept!=='string'||concept.length>220||/[@<>`{}\[\]|\\]|https?:|\d{5,}/i.test(concept))return[];
  const vocabulary=root.ETERNA_COMPASS_DATA?.vocabulary||{},list=[];
  for(const raw of concept.match(/[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]{3,35}/g)||[]){const n=normalize(raw);if(!STOP.has(n)&&Object.hasOwn(vocabulary,n)&&!list.includes(vocabulary[n]))list.push(vocabulary[n]);if(list.length===6)break}
  return list;
 }
 function plan(profile,subject,concept){const c=course(profile),s=c?subjects(c.stage,subject):[],t=terms(concept);if(!c||!s.length||!t.length)return null;return{p_stage:c.stage,p_grade:c.grade,p_subjects:s.slice(0,8),p_terms:t,p_snapshot:root.ETERNA_COMPASS_DATA.snapshot_id}}
 function expectedBand(stage,grade,band){
  if(band==='unspecified')return true;
  if(stage==='infantil')return band===(grade<3?'Primer ciclo':'Segundo ciclo');
  if(stage==='primaria')return band===(grade<=2?'Primer ciclo':grade<=4?'Segundo ciclo':'Tercer ciclo');
  if(stage==='bachillerato')return band===String(grade);
  return (grade<=3&&band==='Cursos de primero a tercero')||(grade<=2&&band==='Cursos primero y segundo')||(grade>=3&&band==='Cursos tercero y cuarto')||(grade===4&&band==='Cuarto curso');
 }
 function context(rows,request){
  if(!request||!Array.isArray(rows))return null;const result=[];let budget=1550;
  for(const r of rows.slice(0,3)){
   if(r.stage!==request.p_stage||!request.p_subjects.includes(r.subject)||!expectedBand(r.stage,request.p_grade,r.course_band)||!['knowledge_item','criterion'].includes(r.kind)||!/^BOE-A-2022-(?:1654|3296|4975|5521)$/.test(r.source_key)||typeof r.body!=='string'||!/^https:\/\/www\.boe\.es\/buscar\/act\.php\?id=BOE-A-2022-/.test(r.official_url)||typeof r.unit_id!=='string'||!r.unit_id.startsWith(r.source_key+':')||!/^[a-f0-9]{64}$/.test(r.text_sha256))continue;
   const body=r.body.slice(0,Math.min(800,budget));if(body.length<15)continue;
   const item={subject:r.subject,course_band:r.course_band,offering:r.offering,kind:r.kind,text:body,source:r.official_url,unit_id:r.unit_id,excerpt_truncated:body.length<r.body.length};
   if(JSON.stringify([...result,item]).length>2300)break;
   result.push(item);budget-=body.length;if(budget<30)break;
  }
  return result.length?{role:'curricular_orientation_only',jurisdiction:'ES-STATE',snapshot:request.p_snapshot,territorial_alignment_verified:false,factual_answer_evidence:false,items:result}:null;
 }
 root.EternaCurricularCompass=Object.freeze({version:VERSION,course,subjects,terms,plan,context,expectedBand,max_items:3,max_context_chars:2600});
})(globalThis);
