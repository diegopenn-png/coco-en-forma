"""Repair extraction and reuse already downloaded official snapshots; no production writes."""
import importlib.util,json,re,time,urllib.parse,urllib.request
from pathlib import Path
from bs4 import BeautifulSoup
spec=importlib.util.spec_from_file_location('collector',Path(__file__).with_name('collect_official.py'))
c=importlib.util.module_from_spec(spec);spec.loader.exec_module(c)
c.REGIONS['castilla - la mancha']='ES-CM'
ALLOWED_ORG=('gobiernodecanarias.org','larioja.org')
old_manifest=json.loads((c.OUT/'source-manifest.json').read_text()) if (c.OUT/'source-manifest.json').exists() else {'sources':[]}
old_docs=json.loads((c.OUT/'documents.json').read_text()) if (c.OUT/'documents.json').exists() else []
by_key={d['source_key']:d for d in old_docs}
cache={c.INDEX:('ministerial-directory',c.INDEX)}
for item in old_manifest['sources']:
 cache[item['url'].replace('http://','https://',1)]=(item['key'],by_key.get(item['key'],{}).get('official_url',item['url']))
def allowed(host):
 return bool(host) and (any(host.endswith(s) for s in ('.es','.cat','.eus','.gal')) or any(host==s or host.endswith('.'+s) for s in ALLOWED_ORG))
def cached_fetch(url):
 p=urllib.parse.urlsplit(url);url=urllib.parse.urlunsplit(('https',p.netloc,p.path,p.query,''))
 if url in cache:
  key,final=cache[url]
  for ext in ('.pdf','.html'):
   path=c.RAW/(key+ext)
   if path.exists():return path.read_bytes(),'application/pdf' if ext=='.pdf' else 'text/html',final
 if not allowed(p.hostname):raise ValueError('Not an approved official host')
 last=None
 for attempt in range(2):
  try:
   req=urllib.request.Request(url,headers={'User-Agent':'EternaCurriculumArchive/1.1 (public educational sources)','Accept':'text/html,application/pdf'})
   with urllib.request.urlopen(req,timeout=30) as r:
    if not allowed(urllib.parse.urlsplit(r.url).hostname):raise ValueError('Unexpected redirect host; review separately')
    raw=r.read(40*1024*1024+1)
    if len(raw)>40*1024*1024:raise ValueError('Source exceeds 40 MiB limit; manual batch review required')
    return raw,r.headers.get('Content-Type',''),r.url
  except Exception as e:last=e;time.sleep(.25)
 raise last

def semantic_paragraphs(html,national=False):
 soup=BeautifulSoup(html,'lxml')
 container=soup.select_one('#textoxslt') or soup.select_one('#textoconsolidado')
 if national and container is None:raise ValueError('Missing complete BOE text container')
 container=container or soup.select_one('#cuerpo') or soup.select_one('#leelo') or soup.select_one('#contenido') or soup.find('article') or soup.find('main') or soup.body or soup
 for bad in container.select('script,style,nav,footer,header,form,.subir,.bloque-analisis,.analisis,.dropdown'):bad.decompose()
 tags=['h2','h3','h4','h5','h6','p','table','li'];lines=[];section=''
 for el in container.find_all(tags):
  # Invalid regional HTML can contain nested paragraphs. Never duplicate descendants.
  if any(parent is not container and parent.name in tags for parent in el.parents):continue
  text=' '.join(el.get_text(' ',strip=True).split())
  if not text or text in ('Subir','Seleccionar redacción:'):continue
  if el.name.startswith('h') or any('titulo' in x for x in el.get('class',[])):section=text[:500]
  lines.append((section,text))
 if not lines:lines=[('',container.get_text('\n',strip=True))]
 extracted='\n\n'.join(t for _,t in lines)
 assert len(extracted)<len(container.get_text(' ',strip=True))*1.12+10000,'Text duplication detected'
 return lines,soup
c.fetch=cached_fetch;c.paragraphs=semantic_paragraphs
c.main()
report_path=c.OUT/'collection-report.json';report=json.loads(report_path.read_text());report['reused_raw_snapshots']=True;report['collection_parser_version']='1.1-lxml-nonduplicating';report['regional_documents_require_annex_and_amendment_audit']=True;report_path.write_text(json.dumps(report,ensure_ascii=False,indent=2))
