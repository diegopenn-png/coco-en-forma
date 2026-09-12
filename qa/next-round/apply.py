from pathlib import Path
import hashlib
p=Path('eterna-worker/src/library/procedural-v1.js');s=p.read_text()
assert hashlib.sha256(s.encode()).hexdigest()=='c9417f494f94ab56b47172e5059d3c3c37f0f0e0e514c819d3c0eab9dcb1f157'
anchor="  const question=q=>`${q.question}\\n${q.options.map((o,i)=>`${'ABC'[i]}) ${o}`).join('\\n')}`;"
helper="""  // Changing a round id is not evidence of new content. Keep generate() intact
  // so questions already visible in a PWA keep their exact expected answers.
  // Select a bounded candidate seed whose three exercises do not overlap the
  // immediately previous round; option shuffling cannot disguise a repeat.
  const roundExerciseKey=q=>q.question.normalize('NFC')+(q.params.hundredths?'|'+[...q.params.hundredths].sort((a,b)=>a-b).join(','):'');
  function nextRoundSeed(lesson,profile,preferredSeed){
    const previous=new Set(lesson.quiz.map(roundExerciseKey));
    const step=Math.imul(3,0x9e3779b9)>>>0;
    let candidate=preferredSeed===undefined?(seedValue(lesson.seed)+step)>>>0:seedValue(preferredSeed);
    for(let attempt=0;attempt<96;attempt++,candidate=(candidate+step)>>>0){
      const next=generate(lesson.skill_id,candidate,profile);if(!next)return null;
      const keys=next.quiz.map(roundExerciseKey);
      if(new Set(keys).size===3&&keys.every(key=>!previous.has(key)))return candidate;
    }
    // Bounded fallback: ask the ordinary tutor rather than claim a repeated
    // or incomplete generated round is new. No unbounded search or history.
    return null;
  }
"""
assert s.count(anchor)==1;s=s.replace(anchor,helper+anchor)
a="      if(/^(?:otra ronda|otra ronda nueva|mas ejercicios|otros ejercicios|mas ejercicios nuevos|seguimos practicando)$/.test(s))return start(l.skill_id,seed===undefined?(seedValue(l.seed)+0x9e3779b9)>>>0:seed);"
b="""      if(/^(?:otra ronda|otra ronda nueva|mas ejercicios|otros ejercicios|mas ejercicios nuevos|seguimos practicando)$/.test(s)){
        const next=nextRoundSeed(l,profile,seed);return next===null?null:start(l.skill_id,next);
      }"""
assert s.count(a)==1;s=s.replace(a,b);p.write_text(s)
