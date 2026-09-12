"""No model calls. A subject reference or a lexical suggestion is not criterion mastery."""
from pathlib import Path
import collections,hashlib,json,math,re,unicodedata,argparse
SNAPSHOT='eterna-curriculum-map-2026.09.12-v1'
LIBRARY='eterna-library-2026.09-v6-310-traceable-12c672'
def norm(s):return ''.join(c for c in unicodedata.normalize('NFD',s).lower()if unicodedata.category(c)!='Mn')
def tokens(s):
 stop=set('a al ante bajo con contra de del desde durante el la los las un una unos unas en entre hacia hasta para por segun sin sobre tras y e o u que se su sus es son ser estar como mas menos cada este esta esto estos estas eso esa ese otros otras otro otra uno dos tres uso utilizar forma formas procesos proceso informacion diferente diferentes propio propia propias propios medio medios ejemplo ejemplos'.split())
 return [t for t in re.findall('[a-záéíóúñü]+',norm(s))if len(t)>2 and t not in stop]
def subjects_for(l,available):
 s=l['subject']
 if l['stage']=='primaria' and s=='Conocimiento del Medio':s='Conocimiento del Medio Natural, Social y Cultural'
 elif l['stage']=='primaria' and s.startswith('Educación Artística:'):s='Educación Artística'
 elif s.startswith('Lengua Extranjera:'):s='Lengua Extranjera'
 elif s.startswith('Segunda Lengua Extranjera:'):s='Segunda Lengua Extranjera'
 match=[x for x in available if norm(x)==norm(s)];assert len(match)==1,(l['id'],s,match);return match[0]
def main(lesson_path,unit_path,out):
 ls=json.loads(lesson_path.read_text());assert len(ls)==310
 units=[json.loads(line)for line in unit_path.read_text().splitlines()];available={}
 for u in units:
  if u['kind']=='subject_heading':available.setdefault(u['stage'],[]).append(u['subject'])
 eligible=[u for u in units if u['kind']in ('knowledge_item','criterion')];by_subject=collections.defaultdict(list)
 for u in eligible:by_subject[(u['stage'],u['subject'])].append(u)
 doc_tokens={u['unit_id']:collections.Counter(tokens(u['text']))for u in eligible};df=collections.Counter(t for ts in doc_tokens.values()for t in ts);N=len(eligible);idf={t:math.log(1+(N-v+.5)/(v+.5))for t,v in df.items()};avg=sum(sum(ts.values())for ts in doc_tokens.values())/N
 subjectmap=[];candidates=[];stats=[]
 for l in ls:
  actual=subjects_for(l,available[l['stage']]);heading=next(u for u in units if u['stage']==l['stage']and u['subject']==actual and u['kind']=='subject_heading')
  subjectmap.append({'snapshot_id':SNAPSHOT,'library_release_id':LIBRARY,'lesson_id':l['id'],'full_lesson_id':LIBRARY+':'+l['id'],'stage':l['stage'],'lesson_subject':l['subject'],'official_subject':actual,'source_subject_unit_id':heading['unit_id'],'official_url':heading['official_url'],'relation':'source_subject_reference','meaning':'Subject identity only; not proof that the lesson meets every criterion or is assigned to these exact courses by a territory.','mapping_method':'explicit_subject_name_alias_table','human_teacher_reviewed':False})
  pool=by_subject[(l['stage'],actual)];inherited=False
  if not pool and l['stage']=='eso'and actual=='Segunda Lengua Extranjera':pool=by_subject[('eso','Lengua Extranjera')];inherited=True
  weights=collections.Counter(tokens(l['title']+' '+' '.join(l['aliases'])))
  for t in list(weights):weights[t]=4
  for t in tokens(l['explanation']):weights[t]=max(weights[t],.35)
  def score(u):
   cnt=doc_tokens[u['unit_id']];length=sum(cnt.values());v=0
   for t,w in weights.items():
    f=cnt.get(t,0)
    if f:v+=w*idf[t]*f*2.2/(f+1.2*(.25+.75*length/avg))
   return v
  selected=[]
  for kind in ['knowledge_item','criterion']:
   ranked=sorted(((score(u),u)for u in pool if u['kind']==kind),key=lambda p:(-p[0],p[1]['source_ordinal']))[:2]
   for value,u in ranked:
    if value<=0:continue
    row={'snapshot_id':SNAPSHOT,'library_release_id':LIBRARY,'lesson_id':l['id'],'unit_id':u['unit_id'],'link_kind':'candidate_supporting_subset','status':'candidate_not_validated','score':round(value,5),'algorithm':'bounded_subject_BM25_v1_no_model','subject_inherited_from_explicit_cross_reference':inherited,'course_alignment_checked':False,'territorial_alignment_checked':False,'whole_criterion_mastery_claimed':False,'evidence':{'unit_kind':u['kind'],'official_code':u['official_code'],'subject':u['subject'],'offering':u['offering'],'course_band':u['course_band'],'text':u['text'],'official_url':u['official_url']}}
    selected.append(row);candidates.append(row)
  stats.append({'lesson_id':l['id'],'title':l['title'],'stage':l['stage'],'official_subject':actual,'candidate_links':len(selected),'granular_links_validated':0})
 out.mkdir(parents=True,exist_ok=True)
 for name,data in [('lesson-subject-map.json',subjectmap),('element-link-candidates.json',candidates),('lessons-mapping-status.json',stats)]:
  (out/name).write_text(json.dumps(data,ensure_ascii=False,indent=2))
 groups=[]
 for stage,subjects in available.items():
  for s in subjects:
   us=by_subject[(stage,s)];mapped=[l['lesson_id']for l in subjectmap if l['stage']==stage and l['official_subject']==s]
   groups.append({'stage':stage,'official_subject':s,'knowledge_items':sum(u['kind']=='knowledge_item'for u in us),'criteria':sum(u['kind']=='criterion'for u in us),'prepared_lessons':len(mapped),'lesson_ids':mapped,'full_coverage':False,'note':'A positive lesson count only establishes representation of a subject, not complete coverage of its content.'})
 (out/'coverage-gaps.json').write_text(json.dumps({'snapshot_id':SNAPSHOT,'library_release_id':LIBRARY,'subject_groups':groups,'all_lessons_subject_mapped':len(subjectmap)==310,'candidate_links':len(candidates),'validated_element_links':0,'knowledge_items_total':sum(u['kind']=='knowledge_item'for u in units),'criteria_total':sum(u['kind']=='criterion'for u in units),'full_subject_coverage_claimed':False,'unrepresented_subjects':[g for g in groups if not g['prepared_lessons']]},ensure_ascii=False,indent=2))
 print(json.dumps({'subject_links':len(subjectmap),'candidate_links':len(candidates),'subjects':len(groups),'unrepresented':[(g['stage'],g['official_subject'])for g in groups if not g['prepared_lessons']]},ensure_ascii=False))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--lessons',type=Path,required=True);p.add_argument('--units',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args();main(a.lessons,a.units,a.output)
