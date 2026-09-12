"""Archive exact official orders and linked PDFs. HTML omissions remain quarantined.
No claim of current consolidated regional coverage or reviewed table semantics.
"""
from pathlib import Path
from hashlib import sha256
from datetime import datetime,timezone
from urllib.request import Request,urlopen
from urllib.parse import urljoin,urlsplit
import json,re,concurrent.futures
from bs4 import BeautifulSoup
OUT=Path('library-v2-source-evidence');OUT.mkdir(exist_ok=True);(OUT/'originals').mkdir(exist_ok=True)
RELEASE='eterna-library-2026.09-v2'
SOURCES=[('infantil',38,'00284745'),('primaria',39,'00284747'),('eso',36,'00284752'),('bachillerato',37,'00284744')]
h=lambda b:sha256(b if isinstance(b,bytes) else b.encode()).hexdigest()
def get(url):
 p=urlsplit(url)
 if p.scheme!='https' or p.hostname not in ('www.juntadeandalucia.es','juntadeandalucia.es'):raise ValueError('Non-approved official URL')
 with urlopen(Request(url,headers={'User-Agent':'EternaCurriculumArchive/2.0 (public educational sources)'}),timeout=45) as r:
  if urlsplit(r.url).hostname not in ('www.juntadeandalucia.es','juntadeandalucia.es'):raise ValueError('Unexpected redirect')
  raw=r.read(40*1024*1024+1)
  if len(raw)>40*1024*1024:raise ValueError('Source size limit')
  return raw,r.url

def collect(item):
 stage,num,cve=item;url=f'https://www.juntadeandalucia.es/boja/2023/104/{num}';key=f'BOJA-2023-104-{num}';result={'source_key':key,'stage':stage,'url':url,'ok':False}
 try:
  raw,final=get(url);(OUT/'originals'/(key+'.html')).write_bytes(raw);soup=BeautifulSoup(raw,'html.parser');alltext=soup.get_text(' ',strip=True)
  assert 'Orden de 30 de mayo de 2023' in alltext,'Wrong disposition'
  assert {'infantil':'Educación Infantil','primaria':'Educación Primaria','eso':'Educación Secundaria Obligatoria','bachillerato':'Bachillerato'}[stage] in alltext,'Wrong stage'
  omission='habiéndose suprimido' in alltext and 'tablas' in alltext
  assert omission,'Re-review page format and extraction disclaimer'
  # Extract only the readable article; do not pretend the HTML contains all annexes.
  article=soup.select_one('#cuerpo') or soup.select_one('#leelo') or soup.select_one('#contenido') or soup.find('article') or soup.find('main') or soup.body
  for el in article.select('script,style,nav,header,footer,form'):el.decompose()
  body=article.get_text('\n',strip=True);assert len(body)>10000
  observed=re.search(r'CVE\s+(\d{8})',alltext)
  if observed:cve=observed.group(1)
  pdfs=[];failures=[]
  urls=list(dict.fromkeys(urljoin(final,a['href']) for a in soup.find_all('a',href=True) if 'descargar pdf' in a.get_text(' ',strip=True).lower()))
  for i,link in enumerate(urls[:3]):
   try:
    b,u=get(link);assert b.startswith(b'%PDF'), 'Not a PDF';filename=f'{key}-part-{i+1}.pdf';(OUT/'originals'/filename).write_bytes(b);pdfs.append({'url':u,'filename':filename,'sha256':h(b),'bytes':len(b),'semantic_table_reviewed':False})
   except Exception as e:failures.append({'url':link,'error':str(e)[:180]})
  docid=RELEASE+':'+key
  doc={'document_id':docid,'release_id':RELEASE,'source_key':key,'title':f'Orden de 30 de mayo de 2023 · Andalucía · {stage} · BOJA 104/{num}','official_url':final,'jurisdiction':'ES-AN','stage':stage,'language':'es','source_kind':'normative','review_status':'quarantined','license_note':'Publicación normativa oficial. Conservar atribución, enlace e integridad; los recursos de terceros o elementos no normativos requieren revisión separada. Sin aval oficial de ETERNA.','source_version':'Publicación original 2023-06-02; consolidación posterior no certificada','retrieved_at':datetime.now(timezone.utc).isoformat(),'content_sha256':h(body),'text_body':body,'metadata':{'original_sha256':h(raw),'cve':cve,'source_authority_checked':True,'html_omits_tables_and_images':True,'curriculum_annexes_semantically_reviewed':False,'currentness_review_complete':False,'pdfs':pdfs,'pdf_download_failures':failures,'all_curriculum_complete':False}}
  chunks=[]
  for i,start in enumerate(range(0,len(body),12000)):
   text=body[start:start+12000];chunks.append({'chunk_id':docid+':'+str(i),'release_id':RELEASE,'document_id':docid,'ordinal':i,'section_path':'Texto HTML de publicación; anexos incompletos','body':text,'content_sha256':h(text),'metadata':{'quarantined':True,'not_teaching_material':True,'html_omissions':True}})
  result.update(ok=True,document=doc,chunks=chunks,pdf_count=len(pdfs),pdf_download_failures=failures)
 except Exception as e:result['error']=str(e)[:300]
 return result
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:results=list(pool.map(collect,SOURCES))
docs=[r['document'] for r in results if r['ok']];chunks=[c for r in results if r['ok'] for c in r['chunks']]
(OUT/'documents.json').write_text(json.dumps(docs,ensure_ascii=False))
(OUT/'chunks.json').write_text(json.dumps(chunks,ensure_ascii=False))
report={'release':RELEASE,'official_orders_archived':len(docs),'signed_pdf_files_downloaded':sum(r.get('pdf_count',0) for r in results),'new_chunks':len(chunks),'regional_coverage_complete':False,'all_new_sources_quarantined':True,'findings':'The four development orders supplement, not replace, the previously archived decrees. The BOJA HTML expressly omits tables/images; do not activate it as a complete curricular table corpus.','sources':[{k:v for k,v in r.items() if k not in ('document','chunks')} for r in results]}
(OUT/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps(report,ensure_ascii=False))
