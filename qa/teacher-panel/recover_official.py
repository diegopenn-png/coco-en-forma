"""Recover public official references. An accessible page is not a certified curriculum.
No student data; no production changes; no unbounded crawling or arbitrary redirects.
"""
from pathlib import Path
import concurrent.futures,datetime,hashlib,json,re,subprocess,urllib.parse
from bs4 import BeautifulSoup
import requests
OUT=Path('panel-regulatory-evidence');OUT.mkdir(exist_ok=True);RAW=OUT/'sources';RAW.mkdir(exist_ok=True)
PRIOR=Path('.prior-registry');rows=json.loads((PRIOR/'registry.json').read_text());matrix=json.loads((PRIOR/'territorial-stage-matrix.json').read_text())
HOSTS=('navarra.es','gencat.cat','gencat.gal','comunidad.madrid','madrid.org','bocm.es','carm.es','borm.es','cantabria.es','educantabria.es','euskadi.eus','boe.es','juntaex.es','gva.es','caib.es','aragon.es','juntadeandalucia.es')
STAGES=['infantil','primaria','eso','bachillerato']
EXTRA=[
('ES-NC',['infantil'],'https://www.lexnavarra.navarra.es/detalle.asp?r=54862','normative','Decreto Foral 61/2022'),
('ES-NC',['primaria'],'https://www.lexnavarra.navarra.es/detalle.asp?r=54950','normative','Decreto Foral 67/2022'),
('ES-NC',['eso'],'https://www.lexnavarra.navarra.es/detalle.asp?r=54997','normative','Decreto Foral 71/2022'),
('ES-NC',['bachillerato'],'https://www.lexnavarra.navarra.es/detalle.asp?r=55074','normative','Decreto Foral 72/2022'),
('ES-CT',STAGES,'https://educacio.gencat.cat/ca/departament/normativa/normativa-educacio/','authority_index','Índice oficial de normativa de educación'),
('ES-CT',['infantil'],'https://portaljuridic.gencat.cat/eli/es-ct/d/2023/02/07/21','normative','Decret 21/2023'),
('ES-CT',['primaria','eso'],'https://portaljuridic.gencat.cat/eli/es-ct/d/2022/09/27/175','normative','Decret 175/2022'),
('ES-CT',['primaria','eso'],'https://portaljuridic.gencat.cat/eli/es-ct/d/2024/12/17/480','amendment','Decret 480/2024'),
('ES-CT',['bachillerato'],'https://portaljuridic.gencat.cat/eli/es-ct/d/2022/09/20/171','normative','Decret 171/2022'),
('ES-PV',['infantil'],'https://www.euskadi.eus/bopv2/datos/2023/06/2302727a.pdf','normative','Decreto 75/2023'),
('ES-MC',['bachillerato'],'https://www.carm.es/web/descarga?ALIAS=ARCH&ARCHIVO=Decreto+251-2022+ordenaci%C3%B3n+y+curr%C3%ADculo+Bachillerato.pdf&IDCONTENIDO=181356&IDTIPO=60&RASTRO=c77%24m4507%2C21239','normative','Decreto 251/2022'),
('ES-MD',['primaria'],'https://gestiona.comunidad.madrid/wleg_pub/servlet/Servidor?opcion=VerHtml&nmnorma=12774','normative','Decreto 61/2022'),
('ES-MD',['primaria'],'https://www.bocm.es/eli/es-md/d/2022/07/13/61/con','normative','Decreto 61/2022 texto consolidado'),
('ES-MD',['eso'],'https://www.bocm.es/eli/es-md/d/2022/07/20/65/con','normative','Decreto 65/2022 texto consolidado'),
('ES-MD',['bachillerato'],'https://www.bocm.es/eli/es-md/d/2022/07/20/64/con','normative','Decreto 64/2022 texto consolidado'),
('ES-MD',['bachillerato'],'https://www.comunidad.madrid/educacion/regulacion-bachillerato','authority_index','Regulación del Bachillerato'),
('ES-MD',['primaria'],'https://www.comunidad.madrid/educacion/regulacion-educacion-primaria','authority_index','Regulación Educación Primaria'),
('ES-MD',['eso'],'https://www.comunidad.madrid/educacion/regulacion-educacion-secundaria-obligatoria','authority_index','Regulación ESO'),
('ES-CB',STAGES,'https://educantabria.es/es/informacion-general/normativa','authority_index','Normativa Educantabria'),
('ES-CB',['infantil','primaria'],'https://boc.cantabria.es/boces/verAnuncioAction.do?idAnuBlob=374267','normative','Decreto 66/2022'),
('ES-CB',['eso','bachillerato'],'https://boc.cantabria.es/boces/verAnuncioAction.do?idAnuBlob=374886','normative','Decreto 73/2022')]
def sha(v):return hashlib.sha256(v if isinstance(v,bytes)else v.encode()).hexdigest()
def allowed(u):
 p=urllib.parse.urlsplit(u);h=p.hostname or ''
 return p.scheme=='https' and not p.username and any(h==x or h.endswith('.'+x)for x in HOSTS)
def fetch(url):
 session=requests.Session();session.headers.update({'User-Agent':'Eterna-Official-Curriculum-Review/2.0','Accept':'text/html,application/pdf'})
 for _ in range(6):
  if not allowed(url):raise ValueError('Unapproved official redirect '+str(urllib.parse.urlsplit(url).hostname))
  r=session.get(url,timeout=(12,45),allow_redirects=False)
  if r.status_code in (301,302,303,307,308):url=urllib.parse.urljoin(url,r.headers['Location']);continue
  r.raise_for_status()
  if len(r.content)>50*1024*1024:raise ValueError('Archive exceeds 50 MiB limit')
  return r.content,url,r.headers.get('content-type','')
 raise ValueError('Too many redirects')
def collect(item):
 key='panel-'+sha(item['url'])[:20];record={**item,'source_key':key,'checked_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'teaching_approved':False,'all_annexes_semantically_checked':False,'human_legal_reviewed':False}
 try:
  raw,url,ct=fetch(item['url']);pdf=raw.startswith(b'%PDF');f=RAW/(key+('.pdf'if pdf else'.html'));f.write_bytes(raw)
  record.update({'resolved_url':url,'content_type':ct,'bytes':len(raw),'original_sha256':sha(raw)})
  if pdf:
   text=subprocess.check_output(['pdftotext','-layout','-enc','UTF-8',str(f),'-'],timeout=90).decode();links=[];record.update({'parser':'pdftotext-layout','pages':text.count('\f')})
  else:
   encoding='windows-1252'if'lexnavarra.navarra.es'in url else None
   soup=BeautifulSoup(raw,'lxml',from_encoding=encoding)
   if soup.title:record['title']=soup.title.get_text(' ',strip=True)
   links=[{'url':urllib.parse.urljoin(url,a['href']),'label':' '.join(a.get_text(' ',strip=True).split())}for a in soup.select('a[href]')]
   for bad in soup.select('script,style,nav,footer,header,form'):bad.decompose()
   candidates=soup.select('#textoxslt, #textoconsolidado, #cuerpo, main, article');candidates=[c for c in candidates if len(c.get_text())>3000]
   el=max(candidates,key=lambda c:len(c.get_text()))if candidates else soup.body or soup
   text=el.get_text('\n',strip=True);record['parser']='html-bounded-main'
  (RAW/(key+'.txt')).write_text(text);record.update({'characters':len(text),'text_sha256':sha(text),'accessible':len(text)>1000,'replacement_characters':text.count('\ufffd')})
  record['contains_annex_text']=bool(re.search(r'(?i)(saberes b[aá]sicos|compet[eè]ncies espec[ií]fiques|criterios de evaluaci[oó]n)',text)) and len(text)>15000
  record['evidence_role']='authority_index'if item['kind']=='authority_index'else('normative_text'if len(text)>12000 else'official_reference_metadata')
  record['related_links']=[l for l in links if allowed(l['url'])and re.search(r'(?i)(67/2022|71/2022|72/2022|51/2025|61/2022|59/2024|65/2022|64/2022|66/2022|73/2022|21/2023|175/2022|480/2024|171/2022|anexo|annex|pdf|nota\.asp)',l['label']+' '+l['url'])][:50]
  record['change_passages']=[line[:1500]for line in text.splitlines()if re.search(r'(?i)(derog|modific|correcci[oó]|vigencia|202[4-6])',line)and len(line)<1500][:40]
  record['status']='captured_not_legally_certified'if record['accessible']else'insufficient_text'
 except Exception as e:record.update({'status':'access_failed','accessible':False,'error':str(e)[:300]})
 return record
items=[{'territory':t,'stages':s,'url':u,'kind':k,'expected_reference':n,'scopes':[[t,x]for x in s]}for t,s,u,k,n in EXTRA]
with concurrent.futures.ThreadPoolExecutor(max_workers=6)as pool:new=list(pool.map(collect,items))
# Resolve only one layer of official annex/consolidation links, capped at thirty targets.
seen={x['url']for x in items};follow=[]
for r in new:
 for l in r.get('related_links',[]):
  if l['url'] in seen or len(follow)>=30:continue
  if not re.search(r'(?:\.pdf(?:\?|$)|nota\.asp|VerHtml|54862|54950|54997|55074)',l['url'],re.I):continue
  seen.add(l['url']);follow.append({'territory':r['territory'],'stages':r['stages'],'scopes':r['scopes'],'url':l['url'],'kind':'related_official','expected_reference':l['label'],'discovered_from':r['url']})
with concurrent.futures.ThreadPoolExecutor(max_workers=6)as pool:new+=list(pool.map(collect,follow))
for m in matrix:
 current=[r for r in new if[m['territory'],m['stage']]in r['scopes']and r['accessible']]
 m['recovery_sources']=[r['source_key']for r in current];m['accessible_after_recovery']=bool(m['accessible_sources']or current)
 m['full_curriculum_certified']=False;m['all_amendments_semantically_reviewed']=False
summary={'territories':19,'stages':4,'scopes':76,'previous_scopes_accessible':sum(bool(m['accessible_sources'])for m in matrix),'scopes_accessible_after_recovery':sum(m['accessible_after_recovery']for m in matrix),'new_sources_attempted':len(new),'new_sources_captured':sum(r['accessible']for r in new),'remaining_scopes':[[m['territory'],m['stage']]for m in matrix if not m['accessible_after_recovery']],'no_automatic_teaching_promotion':True,'human_review':False,'production_changed':False}
(OUT/'recovered-registry.json').write_text(json.dumps(new,ensure_ascii=False,indent=2));(OUT/'territorial-stage-matrix.json').write_text(json.dumps(matrix,ensure_ascii=False,indent=2));(OUT/'report.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2));print(json.dumps(summary,ensure_ascii=False))
