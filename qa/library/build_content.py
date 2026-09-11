import json,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
LESSONS=[]
SOURCES={'infantil':'BOE-A-2022-1654','primaria':'BOE-A-2022-3296','eso':'BOE-A-2022-4975','bachillerato':'BOE-A-2022-5521'}
def group(stage,data):
 for line in data.strip().splitlines():
  if not line.strip() or line.startswith('#'):continue
  parts=line.split('|');assert len(parts)==12,(len(parts),line[:60])
  id,title,subject,grades,aliases,explain,simple,example,checks,hint,misconception,why=parts
  low,high=map(int,grades.split('-'))
  years=[f'{n}º de '+{'primaria':'Primaria','eso':'ESO','bachillerato':'Bachillerato'}.get(stage,'') if stage!='infantil' else f'Infantil · {n} años' for n in range(low,high+1)]
  quiz=[]
  for i,q in enumerate(checks.split('$')):
   question,a,b,c,correct=q.split('~');assert correct in ('A','B','C')
   quiz.append({'id':id+':q'+str(i),'question':question,'options':[a,b,c],'answer':correct,'hint':hint,'level':min(5,i+1)})
  assert len(quiz)==3
  lesson={'id':id,'stage':stage,'subject':subject,'title':title,'grade_min':low,'grade_max':high,'school_years':years,'aliases':list(dict.fromkeys([title]+aliases.split(';'))),'explanation':explain,'simpler':simple,'example':example,'why':why,'misconception':misconception,'hints':[hint,simple,example],'quiz':quiz,'curriculum_source':'https://www.boe.es/buscar/act.php?id='+SOURCES[stage],'curriculum_source_key':SOURCES[stage],'source_kind':'original_teaching_material','grade_mapping':'editorial_progression_not_official_grade_mandate','review_method':'AI-assisted editorial review plus structural and deterministic tests; not human teacher certification','human_teacher_reviewed':False,'language':'es','license_note':'Material original preparado para ETERNA; referencia curricular por etapa, sin aval oficial.'}
  assert len(set(lesson['aliases']))==len(lesson['aliases']);LESSONS.append(lesson)

# Correct the one identified transfer omission; the final canonical digest guards every character.
p=ROOT/'qa/library/lessons-infantil.txt';t=p.read_text()
old='Para comparar sin contar podemos…~Mirar solo la separación~Emparejar objetos~B'
if old in t:p.write_text(t.replace(old,'Para comparar sin contar podemos…~Mirar solo la separación~Emparejar objetos~Cambiar los colores~B'))
PARTS={'infantil':['infantil'],'primaria':['primaria-maths','primaria-other'],'eso':['eso-a','eso-b'],'bachillerato':['bachillerato']}
for stage,parts in PARTS.items():
 group(stage,'\n'.join((ROOT/('qa/library/lessons-'+p+'.txt')).read_text().strip() for p in parts))
assert len(LESSONS)==80,len(LESSONS)
assert len({x['id']for x in LESSONS})==80
if __name__=='__main__':
 out=ROOT/'eterna-worker/src/library';out.mkdir(parents=True,exist_ok=True)
 payload={'release_id':'eterna-library-2026.09-v1','coverage_complete':False,'human_teacher_reviewed':False,'lessons':LESSONS}
 text=json.dumps(payload,ensure_ascii=False,separators=(',',':'))
 digest=hashlib.sha256(text.encode()).hexdigest()
 assert digest=='62685cd0f23371f3c675e6181c9f54beb6396213d8c09c8ecd1c306b8996e901',digest
 (out/'content-v1.js').write_text('/* Original ETERNA material. Not a complete textbook collection or official endorsement. */\nglobalThis.ETERNA_LIBRARY_CONTENT='+text+';\n')
 (ROOT/'qa/library/lessons-v1.json').write_text(json.dumps(LESSONS,ensure_ascii=False,indent=2))
 print(json.dumps({'lessons':len(LESSONS),'questions':sum(len(x['quiz'])for x in LESSONS),'stages':{s:sum(x['stage']==s for x in LESSONS)for s in SOURCES},'content_sha256':digest,'bytes':len(text.encode())}))
