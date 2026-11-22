// The quiz keeps its Spanish model values for scoring, filters and saved progress.
// Only its authored copy is looked up. The game downloads one language when opened.
(() => {
  'use strict';
  const version='20261122-1';
  const base=new URL('med/',document.currentScript.src);
  const loaded=new Map(), pending=new Map();
  let shared;
  const normalize=s=>s.trim().replace(/\s+/gu,' ').toLocaleLowerCase('es');
  async function file(name) {
    const url=new URL(name+'.json?v='+version,base);
    const response=await fetch(url);
    if(!response.ok)throw Error('No se pudieron cargar las preguntas. Pulsa Reintentar.');
    return response.json();
  }
  function load(tag) {
    if(!tag||tag==='es'||loaded.has(tag))return Promise.resolve();
    if(!/^(en|de|nl|fr|it|pl|uk|ru|zh-Hans|ar|sv|fi|nb|da)$/.test(tag))return Promise.reject(Error('Idioma no disponible.'));
    if(pending.has(tag))return pending.get(tag);
    if(!shared)shared=file('source').catch(error=>{shared=null;throw error});
    const request=Promise.all([shared,file(tag)]).then(([source,pack])=>{
      if(pack.locale!==tag||pack.values.length!==source.terms.length||pack.revision!==source.revision)throw Error('Idioma no disponible.');
      loaded.set(tag,{dict:new Map(source.terms.map((s,i)=>[normalize(s),pack.values[i]])),prefixes:source.prefixes,suffixes:source.suffixes,ui:pack.ui});
    }).finally(()=>pending.delete(tag));
    pending.set(tag,request);
    return request;
  }
  function text(value,tag) {
    const pack=loaded.get(tag);
    if(!pack||!value||typeof value!=='string')return value;
    const find=s=>pack.dict.get(normalize(s));
    const raw=value.trim(),exact=find(raw);
    if(exact)return exact;
    const folded=normalize(raw);
    // Variants share a source item, even when the question writer changes its initial case.
    const prefix=pack.prefixes.find(s=>folded.startsWith(normalize(s)+' '));
    const suffix=pack.suffixes.find(s=>folded.endsWith(' '+normalize(s)));
    if(prefix||suffix){
      const core=raw.slice(prefix?prefix.length:0,suffix?-suffix.length:undefined).trim();
      if(find(core))return [prefix&&find(prefix),find(core),suffix&&find(suffix)].filter(Boolean).join(' ');
    }
    const question=raw.match(/^Pregunta (\d+) de (\d+) · Aciertos (\d+)$/u);
    if(question)return pack.ui.question.replace('{n}',question[1]).replace('{total}',question[2]).replace('{score}',question[3]);
    const count=raw.match(/^(\d+) (preguntas disponibles|preguntas|días activos|aciertos|exámenes aprobados|materias)(.*)$/u);
    if(count)return [count[1],find(count[2])||count[2],count[3].trim()?text(count[3].trim(),tag):''].filter(Boolean).join(' ');
    if(raw.includes(' · '))return raw.split(' · ').map(part=>text(part,tag)).join(' · ');
    if(raw.startsWith('· '))return '· '+text(raw.slice(2),tag);
    if(/^\d+% recorrido$/.test(raw))return raw.split('%')[0]+'% '+(find('recorrido')||'');
    return value;
  }
  window.CocoMedLanguage=Object.freeze({load,text});
})();
