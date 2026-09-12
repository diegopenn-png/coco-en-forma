from pathlib import Path
import hashlib
p=Path('eterna-worker/src/index.js');s=p.read_text()
assert hashlib.sha256(s.encode()).hexdigest()=='4c2ab810c201dcb0bb367479f91c635141719e9bb62e2cd7fe9d50db652e1bb3'
s=s.replace('import "./library/runtime-v1.js";','import "./library/runtime-v1.js";\nimport "./library/procedural-v1.js";')
a='''function ownedLibraryRuntime(env){
  const library=globalThis.EternaOwnedLibrary,content=globalThis.ETERNA_LIBRARY_CONTENT;
  return env.ENABLE_ETERNA_LIBRARY==="true"&&env.ETERNA_LIBRARY_RELEASE==="eterna-library-2026.09-v6-310-traceable-12c672"&&library?.release_id===env.ETERNA_LIBRARY_RELEASE&&content?.release_id===library.release_id?library:null
}'''
b='''// Optional exercise factory is composed with the existing library; no auth or quota path is replaced.
let ownedLibraryFacade=null,ownedLibraryFacadeBase=null;
function trustedOwnedContext(ped,profile,mode){return globalThis.EternaProceduralPractice?.owned(ped,profile,mode)||globalThis.EternaOwnedLibrary?.owned(ped,profile,mode)||null}
function ownedLibraryRuntime(env){
  const library=globalThis.EternaOwnedLibrary,content=globalThis.ETERNA_LIBRARY_CONTENT;
  if(!(env.ENABLE_ETERNA_LIBRARY==="true"&&env.ETERNA_LIBRARY_RELEASE==="eterna-library-2026.09-v6-310-traceable-12c672"&&library?.release_id===env.ETERNA_LIBRARY_RELEASE&&content?.release_id===library.release_id))return null;
  const factory=env.ETERNA_EXERCISE_FACTORY==="v1"?globalThis.EternaProceduralPractice:null;
  if(!factory)return library;
  if(ownedLibraryFacadeBase!==library){
    ownedLibraryFacadeBase=library;
    ownedLibraryFacade=Object.freeze({...library,
      owned:(ped,profile,mode)=>factory.owned(ped,profile,mode)||library.owned(ped,profile,mode),
      clientTurn:(text,args)=>factory.clientTurn(library.clientTurn(text,args),args),
      decision:args=>factory.decision(args)||library.decision(args)
    });
  }
  return ownedLibraryFacade
}'''
assert a in s;s=s.replace(a,b)
s=s.replace('const previous=globalThis.EternaOwnedLibrary.owned(incomingPedState,{school_year:l.school_years[0]},mode);','const previous=trustedOwnedContext(incomingPedState,{school_year:l.school_years[0]},mode);')
a='content_provenance:{kind:"original_teaching_material",curriculum_reference:l.curriculum_source,official_endorsement:false,human_teacher_reviewed:false}'
b='generated_exercise:Boolean(candidate.generated_exercise),generator_version:candidate.generator_version||null,content_provenance:{kind:candidate.generated_exercise?"deterministic_generated_exercise":"original_teaching_material",curriculum_reference:l.curriculum_source,official_endorsement:false,human_teacher_reviewed:false}'
assert s.count(a)==1;s=s.replace(a,b)
s=s.replace('/^lib:v1:/.test(incomingPedState.next_teaching_goal||"")','/^(?:lib|proc):v1:/.test(incomingPedState.next_teaching_goal||"")')
a='owned_library:{revision:ownedLibraryRuntime(env)?.version||null,enabled:Boolean(ownedLibraryRuntime(env)),release:ownedLibraryRuntime(env)?.release_id||null,lessons:ownedLibraryRuntime(env)?globalThis.ETERNA_LIBRARY_CONTENT.lessons.length:0,protocols:ownedLibraryRuntime(env)?.protocols.length||0,curriculum_complete:false}'
b=a+',exercise_factory:{enabled:env.ETERNA_EXERCISE_FACTORY==="v1"&&Boolean(ownedLibraryRuntime(env))&&Boolean(globalThis.EternaProceduralPractice),version:globalThis.EternaProceduralPractice?.version||null,families:env.ETERNA_EXERCISE_FACTORY==="v1"?globalThis.EternaProceduralPractice?.skills.length||0:0,generated_variants_are_not_new_lessons:true}'
assert a in s;s=s.replace(a,b)
p.write_text(s)
