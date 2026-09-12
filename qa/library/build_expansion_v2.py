"""Build the bounded v2 snapshot from reviewed original text; fail on baseline drift."""
from pathlib import Path
from hashlib import sha256
import json
W=Path(__file__).resolve().parents[2]
old_release='eterna-library-2026.09-v1';release='eterna-library-2026.09-v2'
h=lambda p:sha256((W/p).read_bytes()).hexdigest()
expected={'eterna-worker/src/index.js':'92a5712135b2530506669bc6b6baabba59e14cf9744087abbd22393ea1972adb','eterna-worker/src/library/runtime-v1.js':'26aad7f15e50050a58edeeeca4012df5b58cde8f87d4928dddebc767a3241c21','qa/library/lessons-v1.json':'eb6b80568bef5dd052949033d498cd10e3b2f2514b8ac1d779ada4fdb0168246'}
for p,v in expected.items():assert h(p)==v,p+' baseline differs'
base=json.loads((W/'qa/library/lessons-v1.json').read_text());assert len(base)==80
sources={'infantil':'BOE-A-2022-1654','primaria':'BOE-A-2022-3296','eso':'BOE-A-2022-4975','bachillerato':'BOE-A-2022-5521'}
new=[]
for stage,source in sources.items():
 for line in (W/f'qa/library/v2-{stage}.txt').read_text().strip().splitlines():
  fields=line.split('|');assert len(fields)==12,(len(fields),line[:50])
  id,title,subject,grades,aliases,explain,simple,example,checks,hint,misconception,why=fields
  low,high=map(int,grades.split('-'))
  years=[f'Infantil · {n} años' if stage=='infantil' else f'{n}º de '+{'primaria':'Primaria','eso':'ESO','bachillerato':'Bachillerato'}[stage] for n in range(low,high+1)]
  quiz=[]
  for i,q in enumerate(checks.split('$')):
   question,a,b,c,answer=q.split('~');assert answer in 'ABC'
   quiz.append(dict(id=f'{id}:q{i}',question=question,options=[a,b,c],answer=answer,hint=hint,level=i+1))
  assert len(quiz)==3
  new.append(dict(id=id,stage=stage,subject=subject,title=title,grade_min=low,grade_max=high,school_years=years,aliases=list(dict.fromkeys([title]+aliases.split(';'))),explanation=explain,simpler=simple,example=example,why=why,misconception=misconception,hints=[hint,simple,example],quiz=quiz,curriculum_source='https://www.boe.es/buscar/act.php?id='+source,curriculum_source_key=source,source_kind='original_teaching_material',grade_mapping='editorial_progression_not_official_grade_mandate',review_method='AI-assisted editorial review plus structural, independent numerical and deterministic tests; not human teacher certification',human_teacher_reviewed=False,language='es',license_note='Material original preparado para ETERNA; referencia curricular por etapa, sin aval oficial.'))
assert len(new)==80
all_lessons=base+new;assert len({l['id']for l in all_lessons})==160
assert all_lessons[:80]==base,'Do not rewrite an existing question behind its persistent identity'
(W/'qa/library/expansion-v2.json').write_text(json.dumps(new,ensure_ascii=False,indent=2)+'\n')
(W/'qa/library/lessons-v1.json').write_text(json.dumps(all_lessons,ensure_ascii=False,indent=2))
payload=dict(release_id=release,coverage_complete=False,human_teacher_reviewed=False,lessons=all_lessons)
(W/'eterna-worker/src/library/content-v1.js').write_text('/* Original ETERNA material. Not a complete textbook collection or official endorsement. */\nglobalThis.ETERNA_LIBRARY_CONTENT='+json.dumps(payload,ensure_ascii=False,separators=(',',':'))+';\n')
p=W/'eterna-worker/src/library/runtime-v1.js';s=p.read_text().replace("const VERSION='library-first-v1'","const VERSION='library-first-v2'").replace("release_id:'"+old_release+"'","release_id:'"+release+"'")
protocols=json.loads((W/'qa/library/v2-protocols.json').read_text());assert len(protocols)==16
insert=',\n'+',\n'.join('    '+json.dumps({'id':p['id'],'aliases':p['aliases']},ensure_ascii=False) for p in protocols)
needle="{id:'school_boredom',aliases:['me aburro estudiando','estudiar es aburrido','no me gusta estudiar']}"
assert s.count(needle)==1;s=s.replace(needle,needle+insert)
needle='      default:return null;';assert s.count(needle)==1
s=s.replace(needle,''.join('      case'+json.dumps(p['id'])+':return '+json.dumps(p['reply'],ensure_ascii=False)+';\n' for p in protocols)+needle)
s=s.replace('Preguntar o equivocarse al leer no es un motivo de vergüenza${name}.','Puede dar vergüenza leer o preguntar delante de otros${name}; no tienes que ocultarlo ni hacerlo perfecto.')
old="    s=s.replace(/^(?:quiero|necesito) (?:aprender|entender|practicar|repasar|estudiar)(?: sobre)? /,'')"
newgrammar="""    s=s.replace(/^hola(?: eterna)? /,'')
      .replace(/^(?:me puedes|me podrias|puedes|podrias) (?:explicar|ensenar|ayudar a entender|ayudarme a entender)(?: un poco)? /,'')
      .replace(/^(?:me explicas|podemos repasar|podemos practicar|necesito ayuda con|tengo dudas sobre) /,'')
      .replace(/ (?:paso a paso|de forma sencilla|de manera sencilla)$/,'');
    s=s.replace(/^(?:quiero|necesito) (?:aprender|entender|practicar|repasar|estudiar)(?: sobre)? /,'')"""
assert old in s;s=s.replace(old,newgrammar)
old="""    const hits=lessons().filter(l=>appropriate(l,profile)&&[l.title,...l.aliases].some(a=>norm(a).replace(/^(?:el|la|los|las|un|una) /,'')===s));
    return hits.length===1?hits[0]:null;"""
newlookup="""    const hits=(aliasIndex().get(s)||[]).filter(l=>appropriate(l,profile));
    return hits.length===1?hits[0]:null;"""
assert old in s;s=s.replace(old,newlookup)
helper="""  let indexedSnapshot=null,indexedAliases=new Map();
  function aliasIndex(){
    const snapshot=root.ETERNA_LIBRARY_CONTENT;
    if(indexedSnapshot!==snapshot){
      const map=new Map();for(const l of lessons())for(const a of new Set([l.title,...l.aliases].map(a=>norm(a).replace(/^(?:el|la|los|las|un|una) /,'')))){const values=map.get(a)||[];values.push(l);map.set(a,values)}
      indexedSnapshot=snapshot;indexedAliases=map;
    }
    return indexedAliases;
  }
"""
s=s.replace('  function exactLesson(text,profile){',helper+'  function exactLesson(text,profile){')
start=s.index('    const exact=v=>');end=s.index('\n    const value=',start)
s=s[:start]+"    const exact=v=>{const raw=String(v??'').normalize('NFC').replace(/−/g,'-').replace(/\\s+/g,' ').trim();return /[0-9]/.test(raw)?raw:raw.toLocaleLowerCase('es-ES')};"+s[end:]
p.write_text(s)
p=W/'eterna-worker/src/index.js';p.write_text(p.read_text().replace(old_release,release))
p=W/'eterna-worker/test/library-first.test.mjs';s=p.read_text().replace(old_release,release).replace('80 actual','160 actual').replace('240 distinct','480 distinct').replace('all 240 known','all 480 known').replace('24 cordial protocols','40 cordial protocols').replace('lessons.length,80','lessons.length,160').replace(').size,80',').size,160').replace(').length,240',').length,480').replace('protocols.length,24','protocols.length,40');p.write_text(s+(W/'qa/library/v2-extra-tests.mjs.txt').read_text())
expected_final={'eterna-worker/src/index.js':'c0a46f5eb8fbcc014be1fb51e2ee5cc3e90fec2a5cb46a222bfc4d4bfacd0156','eterna-worker/src/library/runtime-v1.js':'faa289b941fb995a6cdecf924bc9c7ea32973fa9ad6c624ef386d11ca2c0f421','eterna-worker/src/library/content-v1.js':'44dd8a3f068de9f6f9b06cef1b6fa19e025ec0c94714ccef498b582ac8fa6143','qa/library/lessons-v1.json':'1cf7c42c9e0d2787c5753df63078d4c134cd6805d81a293128277d50efde06d5'}
for p,v in expected_final.items():assert h(p)==v,(p,h(p))
print(json.dumps({'lessons':160,'questions':480,'protocols':40,'old_lessons_unchanged':True,'curriculum_complete':False,'microphone_changed':False,'final_hashes':expected_final}))
