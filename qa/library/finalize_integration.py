"""Backend-only integration with the unchanged PWA. Exact-source patch."""
from pathlib import Path
from hashlib import sha256
r=Path('eterna-worker/src/library/runtime-v1.js');s=r.read_text()
assert sha256(s.encode()).hexdigest()=='3eb25369a980593d4ca81a54cf31e2f7a3ee7c5cdd22c62237bb0e80dddcde13'
s=s.replace("const VERSION='library-first-v1';","const VERSION='library-first-v1.1';")
insert=r'''  // The PWA expands a few short commands before sending them. Decode only the
  // complete canonical templates for the verified current lesson/question.
  // Never strip an arbitrary prefix, trailing clause, or untrusted answer key.
  function clientTurn(text,{profile={},pedState={},mode='ask'}={}){
    if(typeof text!=='string'||text.length>2400)return text;
    const active=owned(pedState,profile,mode);if(!active)return text;
    const topic=active.lesson.title,templates=new Map();
    const add=(raw,value)=>templates.set(norm(raw),value);
    if(pedState.pending_question){
      for(const answer of ['sí','no'])add(`Mi respuesta a tu última comprobación es ${answer}. Evalúala usando exactamente la pregunta anterior: ${question(active.question)}`,answer);
    }else add(`Sí. Continúa con la explicación que acababas de ofrecer sobre ${topic} y resuelve lo que quedó pendiente.`,'siguiente');
    add(`Continúa ahora con lo que quedó pendiente sobre ${topic}. No repitas lo ya explicado; avanza al siguiente punto útil.`,'siguiente');
    add(`Explica por qué ocurre lo que acabamos de mencionar sobre ${topic}. Responde a la causa de la referencia anterior, sin cambiar de tema.`,'por qué');
    add(`No lo entendí. Explícame de nuevo ${topic} con una estrategia realmente distinta: cambia la representación, analogía o ejemplo y divide la idea en menos pasos. No reformules simplemente la misma explicación.`,'no lo entiendo');
    add(`Explícame de nuevo ${topic} con una estrategia realmente distinta. No repitas la misma formulación: cambia de representación, ejemplo, analogía o pasos y parte de lo que ya estaba explicado.`,'no lo entiendo');
    const simpler=`Explícame ${topic} más fácil: menos palabras, menos abstracción y menos pasos, pero mantén la precisión. No repitas literalmente la respuesta anterior.`;
    const prefix='SIMPLIFICACIÓN OBLIGATORIA: explica la misma idea con palabras cotidianas, frases cortas y un solo ejemplo concreto. Evita términos técnicos o abstractos como base de la explicación; si uno es imprescindible, explícalo después con palabras sencillas. Máximo tres ideas y no repitas la formulación anterior. ';
    add(simpler,'más fácil');add(prefix+simpler,'más fácil');
    return templates.get(norm(text))||text;
  }
'''
assert s.count('  const question=q=>')==1;s=s.replace('  const question=q=>',insert+'  const question=q=>')
s=s.replace('¡De nada${name}! El esfuerzo que has hecho para entenderlo cuenta.','¡De nada${name}! Podemos avanzar a tu ritmo.')
s=s.replace("{mode_state:state,explained_marker:'lib:v1:intro'}", "{mode_state:state,explained_markers:['lib:v1:intro','lib:v1:example']}")
s=s.replace('exactLesson,owned,decision,question,contextText','exactLesson,owned,clientTurn,decision,question,contextText')
r.write_text(s)
p=Path('eterna-worker/src/index.js');s=p.read_text()
assert sha256(s.encode()).hexdigest()=='92a5712135b2530506669bc6b6baabba59e14cf9744087abbd22393ea1972adb'
a='...(candidate.explained_marker?[candidate.explained_marker]:[])'
assert s.count(a)==1;s=s.replace(a,a+',...(candidate.explained_markers||[])')
a='return library.decision({text,profile:ctx.profile,pedState:incomingPedState,modeState:incomingModeState,mode,image,newTopic:startsNewTopic})'
b='const canonicalText=startsNewTopic?text:library.clientTurn(text,{profile:ctx.profile,pedState:incomingPedState,mode});\n  return library.decision({text:canonicalText,profile:ctx.profile,pedState:incomingPedState,modeState:incomingModeState,mode,image,newTopic:startsNewTopic})'
assert s.count(a)==1;s=s.replace(a,b)
a='if(!startsNewTopic&&!incomingPedState.pending_question){const q=latestCheckQuestion(history);if(q)incomingPedState.pending_question=q}'
b='if(!startsNewTopic&&!incomingPedState.pending_question&&!(ownedLibraryRuntime(env)&&incomingPedState.conversation_stage==="complete"&&/^lib:v1:/.test(incomingPedState.next_teaching_goal||""))){const q=latestCheckQuestion(history);if(q)incomingPedState.pending_question=q}'
assert s.count(a)==1;s=s.replace(a,b)
s=s.replace('owned_library:{enabled:Boolean(ownedLibraryRuntime(env)),release:', 'owned_library:{revision:ownedLibraryRuntime(env)?.version||null,enabled:Boolean(ownedLibraryRuntime(env)),release:')
p.write_text(s)
t=Path('eterna-worker/test/library-first.test.mjs');assert sha256(t.read_bytes()).hexdigest()=='5384eed6045a850676b74211b4915b070f980f1f7c5939c7c0613f4f6e506429';t.write_text(t.read_text()+Path('qa/library/integration-tests.txt').read_text())
expected={str(r):'761cef30b0a271a18490de31999194c86f6a384488054efd70c530233198caf2',str(p):'166fb207b893121dc566638cc3ef44775ba7f5da56f99549f39d9ca9ff3ecf3f',str(t):'cd73fc41481069044dbe4a8aa34c9b0a447c89f6b876330d2f619ddc4ce47676'}
for path,want in expected.items():assert sha256(Path(path).read_bytes()).hexdigest()==want,path
print('Exact locally tested integration candidate prepared; no frontend changes.')
