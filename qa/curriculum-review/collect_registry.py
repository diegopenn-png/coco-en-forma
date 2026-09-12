"""Public regulatory evidence only. Never equate a fetched document with a validated lesson.
Preserve many-to-many territory/stage mappings and historical sources. No DB writes.
"""
import concurrent.futures,datetime,hashlib,json,re,subprocess,time,unicodedata,urllib.parse,urllib.request
from pathlib import Path
from bs4 import BeautifulSoup
OUT=Path('curriculum-review-evidence');OUT.mkdir(exist_ok=True)
RAW=OUT/'sources';RAW.mkdir(exist_ok=True)
INDEX='https://educagob.educacionfpydeportes.gob.es/curriculo/curriculo-lomloe/curriculos-ccaa.html'
REGIONS={'andalucia':'ES-AN','aragon':'ES-AR','principado de asturias':'ES-AS','islas baleares':'ES-IB','canarias':'ES-CN','cantabria':'ES-CB','castilla y leon':'ES-CL','castilla - la mancha':'ES-CM','castilla-la mancha':'ES-CM','cataluna':'ES-CT','comunidad valenciana':'ES-VC','comunitat valenciana':'ES-VC','extremadura':'ES-EX','galicia':'ES-GA','comunidad de madrid':'ES-MD','region de murcia':'ES-MC','comunidad foral de navarra':'ES-NC','pais vasco':'ES-PV','la rioja':'ES-RI','ciudad autonoma de ceuta':'ES-CE','ciudad autonoma de melilla':'ES-ML'}
STAGES={'infantil':'infantil','primaria':'primaria','educacion secundaria obligatoria':'eso','bachillerato':'bachillerato'}
HOSTS=('educacionfpydeportes.gob.es','juntadeandalucia.es','boa.aragon.es','educa.aragon.es','asturias.es','educastur.es','caib.es','gobiernodecanarias.org','boc.cantabria.es','educantabria.es','jcyl.es','jccm.es','gencat.cat','gva.es','juntaex.es','educarex.es','xunta.gal','bocm.es','comunidad.madrid','borm.es','carm.es','navarra.es','euskadi.eus','larioja.org','boe.es')
# Authority pages are evidence indexes; they are NOT silently substituted for complete norms.
EXTRA=[
 ('ES-IB',['infantil'],'https://www.caib.es/eboibfront/eli/es-ib/d/2025/08/01/40/dof/spa/html','2025 replacement candidate'),
 ('ES-IB',['primaria'],'https://www.caib.es/eboibfront/eli/es-ib/d/2025/08/01/41/dof/spa/html','2025 replacement candidate'),
 ('ES-IB',['eso'],'https://www.caib.es/eboibfront/eli/es-ib/d/2025/08/01/42/dof/spa/html','2025 replacement candidate'),
 ('ES-IB',['bachillerato'],'https://www.caib.es/eboibfront/eli/es-ib/d/2025/08/01/43/dof/spa/html','2025 replacement candidate'),
 ('ES-IB',['eso'],'https://die.caib.es/normativa/html/140/060/020.html','authority index'),
 ('ES-AR',['eso'],'https://educa.aragon.es/-/normativa-eso','authority index'),
 ('ES-CT',['primaria','eso'],'https://xtec.gencat.cat/ca/curriculum/eso/serveicomunitari/','authority index'),
 ('ES-VC',['eso','bachillerato'],'https://ceice.gva.es/va/web/ordenacion-academica/bachillerato/organizacion-y-funcionamiento','authority index'),
 ('ES-NC',['infantil'],'https://www.educacion.navarra.es/en/web/dpto/normativa-segundo-ciclo-infantil','authority index'),
 ('ES-AN',['infantil'],'https://www.juntadeandalucia.es/boja/2023/104/38','development order'),
 ('ES-AN',['primaria'],'https://www.juntadeandalucia.es/boja/2023/104/39','development order'),
 ('ES-AN',['eso'],'https://www.juntadeandalucia.es/boja/2023/104/36','development order'),
 ('ES-AN',['bachillerato'],'https://www.juntadeandalucia.es/boja/2023/104/37','development order'),
 ('ES-CB',['infantil','primaria'],'https://boc.cantabria.es/boces/verAnuncioAction.do?idAnuBlob=374267','retry failed original'),
 ('ES-CB',['eso','bachillerato'],'https://boc.cantabria.es/boces/verAnuncioAction.do?idAnuBlob=374886','retry failed original')]

def norm(v):return ' '.join(''.join(c for c in unicodedata.normalize('NFD',v)if unicodedata.category(c)!='Mn').lower().split())
def sha(v):return hashlib.sha256(v if isinstance(v,bytes)else v.encode()).hexdigest()
def allowed(url):
 p=urllib.parse.urlsplit(url);h=p.hostname or ''
 return p.scheme in ('https','http')and not p.username and any(h==x or h.endswith('.'+x)for x in HOSTS)
class SafeRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,req,fp,code,msg,headers,newurl):
  if not allowed(newurl):raise ValueError('Unexpected redirect host')
  return super().redirect_request(req,fp,code,msg,headers,newurl)
OPENER=urllib.request.build_opener(SafeRedirect)
def fetch(url):
 assert allowed(url),'Not an approved official host'
 url=url.replace('http://','https://',1)
 req=urllib.request.Request(url,headers={'User-Agent':'Eterna-Curricular-Source-Audit/1.0','Accept':'text/html,application/pdf,application/xml'})
 with OPENER.open(req,timeout=35)as r:
  b=r.read(64*1024*1024+1)
  if len(b)>64*1024*1024:raise ValueError('Source exceeds bounded 64 MiB archive limit')
  return b,r.url,r.headers.get('Content-Type','')

def extract(raw,path):
 if raw.startswith(b'%PDF'):
  f=RAW/(path+'.pdf');f.write_bytes(raw)
  r=subprocess.run(['pdftotext','-layout','-enc','UTF-8',str(f),'-'],capture_output=True,check=True,timeout=90)
  text=r.stdout.decode('utf-8');return text,{'parser':'pdftotext-layout','pages':text.count('\f'),'table_semantics_checked':False},[]
 soup=BeautifulSoup(raw,'lxml');title=soup.title.get_text(' ',strip=True)if soup.title else '';lang=soup.html.get('lang','und')if soup.html else 'und'
 links=[{'label':' '.join(a.get_text(' ',strip=True).split()),'href':a.get('href','')}for a in soup.find_all('a',href=True)]
 container=soup.select_one('#textoxslt, #textoconsolidado, #cuerpo, #leelo, main, article')or soup.body or soup
 for x in container.select('script,style,nav,header,footer,form,.subir'):x.decompose()
 text=container.get_text('\n',strip=True)
 return text,{'parser':'html-text','title':title,'language':lang,'html_table_count':len(container.find_all('table')),'table_semantics_checked':False,'original_layout_preserved':True},links

def collect(item):
 key='norm-'+sha(item['url'])[:20]
 r={**item,'source_key':key,'checked_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'complete_currentness_review':False,'human_legal_reviewed':False,'teaching_approved':False}
 try:
  raw,final,ctype=fetch(item['url']);r.update({'resolved_url':final,'original_sha256':sha(raw),'bytes':len(raw),'content_type':ctype})
  ext='.pdf'if raw.startswith(b'%PDF')else'.html';(RAW/(key+ext)).write_bytes(raw)
  text,metadata,links=extract(raw,key);r.update(metadata)
  r['text_sha256']=sha(text);r['characters']=len(text);(RAW/(key+'.txt')).write_text(text)
  r['accessible']=len(text)>1000
  r['looks_normative']=bool(re.search(r'(?i)(decret|orden|ordre|curr[ií]cul|curr[ií]culo|annex|anexo)',text))
  r['possible_missing_content']=bool(re.search(r'(?i)(omitid[oa]s?|no se muestran|no se visualizan|no se incluyen).{0,130}(tablas|im[aá]genes|textos)',text))
  r['status']='identity_and_extraction_checked'if r['accessible']and r['looks_normative']else'review_required'
  # Keep candidates for human/AI legal interpretation; keyword matches never prove currentness.
  evidence=[]
  for line in text.splitlines():
   if re.search(r'(?i)(derog|modific|correcci[oó]|correcci[oó]n|vigencia|vig[eè]ncia|202[4-6])',line):
    if len(line)<2000:evidence.append(line)
  r['change_candidates']=evidence[:60]
  official_links=[]
  for link in links:
   href=urllib.parse.urljoin(final,link['href'])
   if allowed(href)and re.search(r'(?i)(curr[ií]cul|decret|orden|ordre|modific|correcc|annex|anexo|pdf)',link['label']+' '+href):official_links.append({'label':link['label'][:500],'url':href})
  r['official_related_links']=official_links[:80]
 except Exception as e:r.update({'accessible':False,'status':'fetch_or_extraction_failed','error':str(e)[:300]})
 return r

raw,_,_=fetch(INDEX);(OUT/'ministerial-directory.html').write_bytes(raw);soup=BeautifulSoup(raw,'lxml');scopes={};region=None;stage=None
for el in soup.find_all(['h2','a']):
 label=norm(el.get_text(' ',strip=True).replace('Salto de línea',''))
 if el.name=='h2':region=REGIONS.get(label);stage=None;continue
 if not region:continue
 if label in STAGES:stage=STAGES[label]
 elif 'correccion de errores'not in label:continue
 if stage:
  url=urllib.parse.urljoin(INDEX,el.get('href','')).replace('http://','https://',1)
  if allowed(url):scopes.setdefault((region,stage),[]).append(url)
assert len(scopes)==76,(len(scopes),list(scopes))
items={}
def add(url,territory,stage,kind):
 item=items.setdefault(url,{'url':url,'scopes':[],'purposes':[]})
 for s in stage:
  if [territory,s]not in item['scopes']:item['scopes'].append([territory,s])
 if kind not in item['purposes']:item['purposes'].append(kind)
for(t,s),urls in scopes.items():
 for url in urls:add(url,t,[s],'ministerial directory reference')
for t,s,url,kind in EXTRA:add(url,t,s,kind)
for stage,bid in [('infantil','BOE-A-2022-1654'),('primaria','BOE-A-2022-3296'),('eso','BOE-A-2022-4975'),('bachillerato','BOE-A-2022-5521')]:add('https://www.boe.es/buscar/act.php?id='+bid,'ES-STATE',[stage],'consolidated national baseline')
with concurrent.futures.ThreadPoolExecutor(max_workers=4)as pool:results=list(pool.map(collect,items.values()))
byurl={r['url']:r for r in results};matrix=[]
for(t,s),urls in sorted(scopes.items()):
 matches=[r for r in results if [t,s]in r['scopes']]
 matrix.append({'territory':t,'stage':s,'original_references':urls,'source_keys':[r['source_key']for r in matches],'accessible_sources':sum(r['accessible']for r in matches),'review_state':'partial_with_amendments_to_check'if any('2025 replacement candidate'in r['purposes']for r in matches)else'identity_and_access_audited','fully_current_and_semantically_validated':False,'do_not_serve_regulation_as_lesson':True})
(OUT/'registry.json').write_text(json.dumps(results,ensure_ascii=False,indent=2));(OUT/'territorial-stage-matrix.json').write_text(json.dumps(matrix,ensure_ascii=False,indent=2))
summary={'territories':19,'stages':4,'scopes_audited':len(matrix),'unique_sources_attempted':len(results),'accessible_sources':sum(r['accessible']for r in results),'scopes_with_accessible_reference':sum(r['accessible_sources']>0 for r in matrix),'failed':[{'url':r['url'],'scopes':r['scopes'],'error':r.get('error')}for r in results if not r['accessible']],'all_amendments_semantically_reviewed':False,'automatic_promotion_of_regional_sources':False,'production_modified':False,'child_data_accessed':False}
(OUT/'report.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2));print(json.dumps(summary,ensure_ascii=False))
