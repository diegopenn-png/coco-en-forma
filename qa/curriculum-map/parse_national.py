"""Lossless paragraph-level national curriculum inventory. No invented lessons or legal approvals.
Only Annex II teaching content is typed. All other annexes/articulado remain in authentic source.
Original lexical text, anchors and ordinals are retained; courses absent in the text remain unspecified.
"""
from pathlib import Path
import argparse,collections,hashlib,json,re,unicodedata
from bs4 import BeautifulSoup
SNAPSHOT='eterna-curriculum-map-2026.09.12-v1'
SOURCES={'infantil':'BOE-A-2022-1654','primaria':'BOE-A-2022-3296','eso':'BOE-A-2022-4975','bachillerato':'BOE-A-2022-5521'}
def sha(v):return hashlib.sha256(v if isinstance(v,bytes) else v.encode()).hexdigest()
def clean(s):return ' '.join(unicodedata.normalize('NFC',s).split())
def normalize(s):return ''.join(c for c in unicodedata.normalize('NFD',s) if unicodedata.category(c)!='Mn').casefold()
def read_blocks(path,stage):
 raw=path.read_bytes();sp=BeautifulSoup(raw,'lxml');text=sp.select_one('#textoxslt') or sp.select_one('#textoconsolidado');assert text is not None,'Missing actual BOE consolidated text'
 h=[p for p in text.select('.anexo_num') if clean(p.get_text())=='ANEXO II'];assert len(h)==1
 section=h[0].find_parent('div',class_='bloque');assert section and section.get('id');anchor=section['id']
 tags=[]
 for p in section.find_all(['p','h2','h3','h4','h5','h6','table','li']):
  if p.find_parent('table') or p.find_parent('li'):continue
  if any(x in p.get('class',[]) for x in ['bloque','linkSubir','nota_pie']):continue
  s=clean(p.get_text(' ',strip=True))
  if s:tags.append((p,s))
 subject='';offering='';band='unspecified';mode='introduction';comp=None;block='';subblock='';rows=[];subject_list=[]
 for n,(p,t) in enumerate(tags):
  cl=p.get('class',[]);tn=normalize(t).rstrip('.');kind='narrative';code=None;subject_new=False
  if stage in ('infantil','primaria') and 'centro_cursiva' in cl and (stage=='primaria' or re.match(r'^Área [123]\.',t)):
   subject=re.sub(r'^Área [123]\.\s*','',t);offering=subject;subject_new=True
  elif stage in ('eso','bachillerato') and 'centro_negrita' in cl:
   base=re.sub(r' (?:I|II)$','',t,flags=re.I)
   if stage=='bachillerato' and base.casefold()==subject.casefold() and re.search(r' (?:I|II)$',t):
    offering=t;band='1' if t.endswith(' I') else '2';mode='introduction';comp=None;block='';subblock='';kind='offering_heading'
   else:subject=t;offering=t;subject_new=True
  if subject_new:
   subject_list.append(subject);band='unspecified';mode='introduction';comp=None;block='';subblock='';kind='subject_heading'
  if tn in ['primer ciclo','segundo ciclo','tercer ciclo','cursos de primero a tercero','cursos primero y segundo','cursos tercero y cuarto','cuarto curso']:
   band=t;mode='introduction';comp=None;block='';subblock='';kind='course_heading'
  elif stage=='eso' and t in ['MATEMÁTICAS A','MATEMÁTICAS B']:
   offering=t.title();band='Cuarto curso';mode='introduction';comp=None;block='';subblock='';kind='offering_heading'
  elif tn=='competencias especificas':mode='competence';kind='section_heading';comp=None
  elif tn=='criterios de evaluacion':mode='criterion';kind='section_heading';comp=None
  elif tn=='saberes basicos':mode='knowledge';kind='section_heading';comp=None;block='';subblock=''
  elif mode=='competence' and re.match(r'^\d+\.\s',t):kind='competence';code=re.match(r'^(\d+)\.',t)[1];comp=code
  elif mode=='criterion' and re.fullmatch(r'Competencia específica \d+\.?',t):comp=re.search(r'\d+',t)[0];kind='criterion_group'
  elif mode=='criterion' and re.match(r'^\d+\.\d+\b',t):
   kind='criterion';code=re.match(r'^(\d+\.\d+)\b',t)[1];assert comp is None or code.split('.')[0]==comp,(stage,subject,t)
  elif mode=='knowledge':
   if re.match(r'^(?:[A-Z]|[IVX]{1,5})\.\s',t):block=t;subblock='';kind='knowledge_block';code=t.split('.')[0]
   elif re.match(r'^\d+(?:\.\d+)?\.?(?:\s|$)',t):subblock=t;kind='knowledge_subblock';code=re.match(r'^\d+(?:\.\d+)?',t)[0]
   elif t.startswith(('−','–','-')):kind='knowledge_item'
   else:kind='knowledge_context'
  if 'anexo_num' in cl or 'anexo_tit' in cl:kind='annex_heading'
  row={'unit_id':SOURCES[stage]+':II:'+str(n).zfill(5)+':'+sha(t)[:12],'snapshot_id':SNAPSHOT,'source_key':SOURCES[stage],'source_sha256':sha(raw),'jurisdiction':'ES-STATE','stage':stage,'subject':subject or None,'offering':offering or None,'course_band':band,'kind':kind,'official_code':code,'competence_code':comp,'knowledge_block':block or None,'knowledge_subblock':subblock or None,'text':t,'text_sha256':sha(t),'source_ordinal':n,'official_url':'https://www.boe.es/buscar/act.php?id='+SOURCES[stage]+'#'+anchor,'metadata':{'source_anchor':anchor,'html_tag':p.name,'html_classes':cl,'source_text_not_teaching_explanation':True,'course_band_is_original_text':band not in ('1','2','unspecified'),'course_origin':'offering_I_II' if band in ('1','2') else 'explicit_heading' if band!='unspecified' else 'not_asserted','not_human_certified':True}}
  rows.append(row)
 assert ''.join(r['text'] for r in rows)==''.join(t for _,t in tags),'Loss or duplication in source paragraphs'
 for kind in ['competence','criterion','knowledge_item']:assert sum(r['kind']==kind for r in rows)>10,(stage,kind)
 keys=[(r['subject'],r['offering'],r['course_band'],r['official_code'])for r in rows if r['kind']=='criterion'];assert len(keys)==len(set(keys)),('Duplicated criterion identity',stage)
 expected={'infantil':3,'primaria':7,'eso':18,'bachillerato':42};assert len(subject_list)==expected[stage],(stage,len(subject_list),subject_list)
 report={'source_key':SOURCES[stage],'stage':stage,'source_sha256':sha(raw),'annex_anchor':anchor,'paragraphs':len(rows),'paragraph_reconstruction_verified':True,'types':dict(collections.Counter(r['kind'] for r in rows)),'subjects':subject_list,'criteria_with_unspecified_course':sum(r['kind']=='criterion'and r['course_band']=='unspecified'for r in rows),'lesson_coverage_claimed':False,'legal_currentness_not_inferred_from_download':True}
 return rows,report

def main(inp,out):
 out.mkdir(parents=True,exist_ok=True);allrows=[];reports=[]
 for stage,code in SOURCES.items():
  rows,report=read_blocks(inp/(code+'.html'),stage);allrows+=rows;reports.append(report)
 with(out/'units.jsonl').open('w')as f:
  for row in allrows:f.write(json.dumps(row,ensure_ascii=False,separators=(',',':'))+'\n')
 summary={'snapshot_id':SNAPSHOT,'sources':reports,'rows':len(allrows),'types':dict(collections.Counter(r['kind']for r in allrows)),'source_paragraphs_accounted_for':True,'scope':'Complete represented Annex II semantic paragraph inventory of these four exact BOE source snapshots, not whole Spanish territorial curricula','full_teaching_coverage':False,'human_review':False}
 (out/'national-inventory.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2));print(json.dumps(summary,ensure_ascii=False))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--input',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args();main(a.input,a.output)
