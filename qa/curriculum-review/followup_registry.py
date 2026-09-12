"""Reuse previous raw bytes; add verified official change references. Never certify completeness."""
import json,hashlib,concurrent.futures,urllib.parse
from pathlib import Path
from bs4 import BeautifulSoup
module={"__file__":str(Path(__file__).with_name('collect_registry.py'))}
s=Path(module['__file__']).read_text();exec(compile(s.split('raw,_,_=fetch(INDEX);')[0],module['__file__'],'exec'),module)
OUT=module['OUT'];RAW=module['RAW'];rows=json.loads((OUT/'registry.json').read_text());old_extract=module['extract']
module['HOSTS']+=('castillalamancha.es',)
def extract(raw,key):
 if raw.startswith(b'%PDF'):return old_extract(raw,key)
 soup=BeautifulSoup(raw,'lxml');title=soup.title.get_text(' ',strip=True)if soup.title else '';lang=soup.html.get('lang','und')if soup.html else 'und'
 links=[{'label':' '.join(a.get_text(' ',strip=True).split()),'href':a.get('href','')}for a in soup.find_all('a',href=True)]
 # BOJA contains small earlier main/article blocks. Pick a substantial content container, not the first tiny match.
 candidates=soup.select('#textoxslt, #textoconsolidado, #cuerpo, #leelo, main, article')
 substantial=[x for x in candidates if len(x.get_text(' ',strip=True))>3000]
 container=max(substantial,key=lambda x:len(x.get_text(' ',strip=True)))if substantial else(soup.body or soup)
 for x in container.select('script,style,nav,header,footer,form,.subir'):x.decompose()
 return container.get_text('\n',strip=True),{'parser':'html-largest-substantial-container','title':title,'language':lang,'html_table_count':len(container.find_all('table')),'table_semantics_checked':False,'original_layout_preserved':True},links
module['extract']=extract
fetch_original=module['fetch'];cached={}
for r in rows:
 for ext in ['.pdf','.html']:
  f=RAW/(r['source_key']+ext)
  if f.exists():cached[r['url']]=(f,r.get('resolved_url',r['url']),r.get('content_type',''));break
def fetch(url):
 if url in cached:
  path,final,ctype=cached[url];return path.read_bytes(),final,ctype
 return fetch_original(url)
module['fetch']=fetch
repaired=[]
for r in rows:
 if 'juntadeandalucia.es' in r['url']:
  repaired.append(module['collect']({k:r[k]for k in ['url','scopes','purposes']}))
 else:repaired.append(r)
extra=[
('ES-AN',['primaria','eso','bachillerato'],'https://www.juntadeandalucia.es/boja/2026/168/c03/2','promulgated 2026 organizational and evaluation amendment'),
('ES-AS',['infantil'],'https://miprincipado.asturias.es/bopa/2025/08/27/2025-07198.pdf','promulgated 104/2025; voluntary Asturian-language approximation'),
('ES-MD',['primaria','eso','bachillerato'],'https://www.comunidad.madrid/transparencia/sites/default/files/9._decreto_bocm.pdf','promulgated 59/2024, not consultation draft'),
('ES-RI',['eso','bachillerato'],'https://ias1.larioja.org/boletin/Bor_Boletin_visor_Servlet?referencia=35427809-1-PDF-570623','promulgated 30/2025 modifying 42/2022 and 43/2022'),
('ES-GA',['eso'],'https://www.xunta.gal/dog/Publicados/2023/20230803/AnuncioG0655-280723-0007_es.html','promulgated 117/2023 modification'),
('ES-GA',['eso'],'https://www.xunta.gal/dog/Publicados/2023/20230825/AnuncioG0655-100823-0002_es.html','promulgated 9 August 2023 optional subjects'),
('ES-EX',['bachillerato'],'https://doe.juntaex.es/eli/es-ex/d/2025/07/08/73','promulgated 73/2025 modification; inspect linked authentic text'),
('ES-CM',['eso'],'https://docm.jccm.es/docm/descargarArchivo.do?ruta=2024/07/02/pdf/2024_5244.pdf&tipo=rutaDocm','promulgated 31/2024 modification'),
('ES-AR',['eso'],'https://educa.aragon.es/-/normativa-eso','current authority index, not a consolidated legal opinion'),
('ES-AR',['bachillerato'],'https://educa.aragon.es/-/norma-bachillerato','current authority index including amendments'),
('ES-CT',['primaria','eso','bachillerato'],'https://portaljuridic.gencat.cat/ca/normativa/dret-a-catalunya/Codis-legislacio/Codi-Educacio-de-Catalunya/','current authority legislative code'),
('ES-NC',['bachillerato'],'https://www.educacion.navarra.es/en/web/dpto/profesorado/curriculos-y-normativa/bachillerato','2026 authority index; curriculum versus organization distinguished'),
('ES-NC',['eso'],'https://www.educacion.navarra.es/it/web/dpto/profesorado/curriculos-y-normativa/eso','current authority index'),
('ES-NC',['primaria'],'https://www.educacion.navarra.es/en/web/dpto/normativa-primaria','2026 authority index'),
('ES-CB',['infantil','primaria','eso','bachillerato'],'https://educantabria.es/es/informacion-general/normativa','current authority index; not complete annex text'),
('ES-CN',['eso'],'https://www.gobiernodecanarias.org/educacion/web/secundaria/informacion/ordenacion-curriculo/ordenacion-de-la-educacion-secundaria-obligatoria-eso/','current authority index including specific diversification curriculum'),
('ES-MC',['eso'],'https://www.borm.es/eli/es-mc/d/2024/08/01/158/dof/spa/html','candidate official ELI; do not mark verified if inaccessible')]
items=[{'url':u,'scopes':[[t,s]for s in stages],'purposes':[kind]}for t,stages,u,kind in extra if u not in {r['url']for r in repaired}]
with concurrent.futures.ThreadPoolExecutor(max_workers=4)as pool:new=list(pool.map(module['collect'],items))
repaired+=new
# Preserve deduplicated source identities and update access evidence only, never legal approval.
assert len({x['source_key']for x in repaired})==len(repaired)
(OUT/'registry.json').write_text(json.dumps(repaired,ensure_ascii=False,indent=2))
matrix=json.loads((OUT/'territorial-stage-matrix.json').read_text())
for x in matrix:
 hits=[r for r in repaired if[x['territory'],x['stage']]in r['scopes']]
 x['source_keys']=[r['source_key']for r in hits];x['accessible_sources']=sum(r['accessible']for r in hits)
 x['fully_current_and_semantically_validated']=False
 x['review_state']='source_identity_checked_amendment_chain_partial' if x['accessible_sources']else'pending_access_recovery'
(OUT/'territorial-stage-matrix.json').write_text(json.dumps(matrix,ensure_ascii=False,indent=2))
summary={'scopes_audited':76,'territories':19,'unique_sources_attempted':len(repaired),'accessible_sources':sum(r['accessible']for r in repaired),'scopes_with_accessible_reference':sum(r['accessible_sources']>0 for r in matrix),'repaired_BOJA_extractions':sum('juntadeandalucia.es'in r['url']and r['accessible']for r in repaired),'all_amendments_semantically_reviewed':False,'automatic_promotion_of_regional_sources':False,'human_legal_reviewed':False,'production_modified':False,'failed_sources':[{'url':r['url'],'error':r.get('error'),'scopes':r['scopes']}for r in repaired if not r['accessible']]}
(OUT/'report.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2));print(json.dumps(summary,ensure_ascii=False))
