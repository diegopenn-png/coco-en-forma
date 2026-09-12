from pathlib import Path
from hashlib import sha256
p=Path('eterna-worker/src/index.js');s=p.read_text()
assert sha256(s.encode()).hexdigest()=='166fb207b893121dc566638cc3ef44775ba7f5da56f99549f39d9ca9ff3ecf3f'
a='const libraryProtocol=currentSituation.kind==="library_protocol";if(libraryProtocol)'
b='const libraryProtocol=currentSituation.kind==="library_protocol",ownedContext=libraryProtocol?ownedLibraryRuntime(env).owned(incomingPedState,ctx.profile,mode):null;if(libraryProtocol)'
assert s.count(a)==1;s=s.replace(a,b)
start=s.index('  if(currentSituation&&!(currentSituation.kind===');end=s.index('  if(contractMeta.enabled&&contractMeta.studentAction===',start)
block=s[start:end]
a='subject:null,concept:null,help_level:null,check_question:null,practice_suggestion:null'
b='subject:ownedContext?.lesson.subject||null,concept:ownedContext?.lesson.title||null,help_level:null,check_question:ownedContext?incomingPedState.pending_question:null,practice_suggestion:null'
assert block.count(a)==1;s=s[:start]+block.replace(a,b)+s[end:]
a='if(assessment!=="correct")pedagogical_state.known_points=candidate.relation==="new_topic"?[]:incomingPedState.known_points;'
b='''if(assessment!=="correct")pedagogical_state.known_points=candidate.relation==="new_topic"?[]:incomingPedState.known_points;
  else{
    const previous=globalThis.EternaOwnedLibrary.owned(incomingPedState,{school_year:l.school_years[0]},mode);
    const evidence=previous?`Respuesta comprobada a «${previous.question.question}»: ${previous.question.options["ABC".indexOf(previous.question.answer)]}.`:null;
    pedagogical_state.known_points=[...new Set([...(incomingPedState.known_points||[]),...(evidence?[evidence]:[])])].slice(-10);
  }'''
assert s.count(a)==1;s=s.replace(a,b);p.write_text(s)
t=Path('eterna-worker/test/library-first.test.mjs');assert sha256(t.read_bytes()).hexdigest()=='cd73fc41481069044dbe4a8aa34c9b0a447c89f6b876330d2f619ddc4ce47676'
t.write_text(t.read_text()+r'''

test('cordiality returns the same active check metadata so the unmodified PWA keeps its answer context',async()=>{
 const h=harness();let d=(await h.turn({mode:'exam',text:'números primos'})).data;
 d=(await h.turn({mode:'exam',text:'C',pedagogical_state:d.pedagogical_state,mode_state:d.mode_state})).data;
 const before=d;
 d=(await h.turn({mode:'exam',text:'¿Qué edad tienes?',pedagogical_state:d.pedagogical_state,mode_state:d.mode_state})).data;
 assert.equal(d.library_route,'owned-protocol-v1');assert.equal(d.check_question,before.check_question);assert.equal(d.concept,before.concept);assert.equal(d.subject,before.subject);assert.equal(d.mode_state.correct_count,1);assert.equal(d.student_answer_assessment,'not_applicable');
 const client=deployedClientTurn('no',d.pedagogical_state);d=(await h.turn({...client,mode:'exam',pedagogical_state:d.pedagogical_state,mode_state:d.mode_state})).data;
 assert.equal(d.student_answer_assessment,'correct');assert.equal(d.mode_state.correct_count,2);assert.equal(h.inferences.length,0);await h.drain();
});

test('a correct choice records evidence of the answered check, never the answer to the next unseen check',async()=>{
 const h=harness();let d=(await h.turn({mode:'exam',text:'números primos'})).data;
 d=(await h.turn({mode:'exam',text:'C',pedagogical_state:d.pedagogical_state,mode_state:d.mode_state})).data;
 assert.equal(d.check_question.includes('El 1'),true);
 assert.deepEqual(plain(d.pedagogical_state.known_points),['Respuesta comprobada a «¿Cuál es primo?»: 7.']);await h.drain();
});
''')
assert sha256(p.read_bytes()).hexdigest()=='f19f07b712288fc331cefe32cab54adafd3e9b12b5cd948030d7474c6b0c4f93'
assert sha256(t.read_bytes()).hexdigest()=='30dab624892da60bd0511c179ec7f2a5ca8c0f710377ca1f454bf0f8acbc4009'
print('Verified protocol-context and demonstrated-knowledge correction applied.')
