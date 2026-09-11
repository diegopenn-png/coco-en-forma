"""Download public curricular sources, never child data or commercial textbooks.
National BOE HTML is extracted completely; regional snapshots remain quarantined.
The ministerial directory is discovery evidence, NOT proof a regional text is current.
"""
import concurrent.futures,datetime,hashlib,json,re,subprocess,tempfile,time,unicodedata,urllib.request,urllib.parse
from pathlib import Path
from bs4 import BeautifulSoup
RELEASE='eterna-library-2026.09-v1'
OUT=Path('library-evidence'); OUT.mkdir(exist_ok=True)
RAW=OUT/'official-snapshots';RAW.mkdir(exist_ok=True)
INDEX='https://educagob.educacionfpydeportes.gob.es/curriculo/curriculo-lomloe/curriculos-ccaa.html'
STAGES={'infantil':'infantil','primaria':'primaria','educacion secundaria obligatoria':'eso','bachillerato':'bachillerato'}
REGIONS={'andalucia':'ES-AN','aragon':'ES-AR','principado de asturias':'ES-AS','islas baleares':'ES-IB','canarias':'ES-CN','cantabria':'ES-CB','castilla y leon':'ES-CL','castilla-la mancha':'ES-CM','cataluna':'ES-CT','comunidad valenciana':'ES-VC','comunitat valenciana':'ES-VC','extremadura':'ES-EX','galicia':'ES-GA','comunidad de madrid':'ES-MD','region de murcia':'ES-MC','comunidad foral de navarra':'ES-NC','pais vasco':'ES-PV','la rioja':'ES-RI','ciudad autonoma de ceuta':'ES-CE','ciudad autonoma de melilla':'ES-ML'}
NATIONAL=[('infantil','BOE-A-2022-1654','Real Decreto 95/2022'),('primaria','BOE-A-2022-3296','Real Decreto 157/2022'),('eso','BOE-A-2022-4975','Real Decreto 217/2022'),('bachillerato','BOE-A-2022-5521','Real Decreto 243/2022')]
BOE_NOTE='Fuente: Agencia Estatal Boletín Oficial del Estado. Texto consolidado de carácter meramente informativo y sin valor jurídico. Para fines jurídicos debe consultarse la publicación oficial. Reutilización conforme al aviso legal de BOE; extracción ETERNA sin aval oficial.'
def norm(s):return ' '.join(''.join(c for c in unicodedata.normalize('NFD',s) if unicodedata.category(c)!='Mn').lower().split())
def sha(b):return hashlib.sha256(b if isinstance(b,bytes) else b.encode()).hexdigest()
def fetch(url):
    parsed=urllib.parse.urlsplit(url)
    if parsed.scheme not in ('http','https') or not parsed.hostname or not any(parsed.hostname.endswith(x) for x in ('.es','.cat','.eus','.gal')):raise ValueError('Non-government-domain candidate rejected')
    url=urllib.parse.urlunsplit(('https',parsed.netloc,parsed.path,parsed.query,''))
    last=None
    for attempt in range(2):
        try:
            req=urllib.request.Request(url,headers={'User-Agent':'EternaCurriculumArchive/1.0 (educational source verification)','Accept':'text/html,application/pdf,application/xml'})
            with urllib.request.urlopen(req,timeout=35) as r:
                final=r.url; host=urllib.parse.urlsplit(final).hostname or ''
                if not any(host.endswith(x) for x in ('.es','.cat','.eus','.gal')):raise ValueError('Unexpected redirect host')
                data=r.read(18*1024*1024+1)
                if len(data)>18*1024*1024:raise ValueError('Source over archive size limit')
                return data,r.headers.get('Content-Type',''),final
        except Exception as e:last=e;time.sleep(.5)
    raise last

def paragraphs(html,national=False):
    soup=BeautifulSoup(html,'html.parser')
    container=soup.select_one('#textoconsolidado') if national else soup.select_one('#textoconsolidado, #cuerpo, #contenido, article, main')
    if national and container is None:raise ValueError('Missing complete BOE text container')
    container=container or soup.body or soup
    for bad in container.select('script,style,nav,footer,header,form,.subir,.bloque-analisis,.analisis'):bad.decompose()
    nodes=container.find_all(['h2','h3','h4','h5','h6','p','table','li'])
    lines=[];section='';heading=[]
    for el in nodes:
        if el.find_parent('table') or el.find_parent('li'):continue
        text=' '.join(el.get_text(' ',strip=True).split())
        if not text or text in ('Subir','Seleccionar redacción:'):continue
        if el.name.startswith('h') or any('titulo' in c for c in el.get('class',[])):
            section=text[:500]
        lines.append((section,text))
    if not lines:lines=[('',container.get_text('\n',strip=True))]
    return lines,soup

def collect_one(item):
    started=time.monotonic();national=item.get('national',False);key=item['key'];docid=RELEASE+':'+key
    meta={'directory_url':INDEX if not national else None,'full_regional_coverage_verified':False,'human_reviewed':False}
    try:
        raw,ctype,final=fetch(item['url']);suffix='.pdf' if raw.startswith(b'%PDF') else '.html';(RAW/(key+suffix)).write_bytes(raw)
        title=item.get('title') or (item['jurisdiction']+' '+item['stage']+' · fuente oficial localizada')
        if suffix=='.pdf':
            with tempfile.TemporaryDirectory() as temp:
                pdf=Path(temp)/'source.pdf';pdf.write_bytes(raw)
                # Preserve text position within page; do not interpret tabular cells as verified lessons.
                result=subprocess.run(['pdftotext','-layout','-enc','UTF-8',str(pdf),'-'],capture_output=True,timeout=60,check=True)
                pages=result.stdout.decode().split('\f');lines=[('Página '+str(i+1),p.strip()) for i,p in enumerate(pages) if p.strip()]
                subprocess.run(['pdftoppm','-f','1','-singlefile','-scale-to','900','-png',str(pdf),str(RAW/(key+'-page1'))],check=True,capture_output=True,timeout=30)
            meta.update({'page_count':len(pages),'table_structure_review_pending':True,'parser':'pdftotext-layout'})
            version=None
        else:
            lines,soup=paragraphs(raw,national)
            if soup.title:title=soup.title.get_text(' ',strip=True)[:900]
            whole=soup.get_text(' ',strip=True)
            version=(re.search(r'Última actualización, publicada el\s*([0-9/]+)',whole) or re.search(r'última modificación[^0-9]*([0-9/]+)',whole,re.I))
            version=version.group(1) if version else None
            meta.update({'parser':'html-semantic-blocks','consolidation_notice':national})
        text='\n\n'.join(t for _,t in lines)
        if national:
            assert len(text)>30000 and 'saberes básicos' in text.lower() and 'criterios de evaluación' in text.lower(), 'Incomplete national extraction'
        elif len(text)<3000:raise ValueError('Too little text; likely index or inaccessible annexes')
        # Never silently truncate a norm. Original is kept in the source archive and full text is stored.
        chunks=[];buffer='';path='';ordinal=0
        def add_chunk(body,section):
            nonlocal ordinal
            chunks.append({'chunk_id':docid+':'+str(ordinal),'release_id':RELEASE,'document_id':docid,'ordinal':ordinal,'section_path':section,'body':body,'content_sha256':sha(body),'metadata':{'kind':'normative_requirements_not_lesson','source_review':national}});ordinal+=1
        for section,line in lines:
            if buffer and (len(buffer)+len(line)>7000 or (section!=path and len(buffer)>2500)):
                add_chunk(buffer,path);buffer=''
            path=section
            while len(line)>14000:
                split=line.rfind(' ',0,12000);split=split if split>0 else 12000
                if buffer:add_chunk(buffer,path);buffer=''
                add_chunk(line[:split],section);line=line[split:].lstrip()
            buffer+=(('\n\n' if buffer else '')+line)
        if buffer:add_chunk(buffer,path)
        document={'document_id':docid,'release_id':RELEASE,'source_key':key,'title':title,'official_url':final,'jurisdiction':item['jurisdiction'],'stage':item['stage'],'language':item.get('language','es'),'source_kind':'normative','review_status':'source_checked' if national else 'quarantined','license_note':BOE_NOTE if 'boe.es' in final else 'Disposición normativa de fuente pública; art. 13 TRLPI. Conservar atribución, integridad y enlace. Extracción y vigencia territorial pendientes de revisión; no implica aval oficial.','source_version':version,'retrieved_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'content_sha256':sha(text),'text_body':text,'metadata':{**meta,'original_sha256':sha(raw),'bytes_downloaded':len(raw),'elapsed_seconds':round(time.monotonic()-started,2),'mapped_territories':item.get('territories',[item['jurisdiction']]),'mapped_stages':item.get('stages',[item['stage']])}}
        return {'item':item,'document':document,'chunks':chunks,'ok':True}
    except Exception as e:return {'item':item,'ok':False,'error':str(e)[:300]}

def main():
    raw,_,_=fetch(INDEX);(RAW/'ministerial-directory.html').write_bytes(raw);soup=BeautifulSoup(raw,'html.parser')
    found=[];current=None;stage=None
    for el in soup.find_all(['h2','a']):
        text=norm(el.get_text(' ',strip=True).replace('Salto de línea',''))
        if el.name=='h2':current=REGIONS.get(text);stage=None;continue
        if not current:continue
        if text in STAGES:stage=STAGES[text]
        elif 'correccion de errores' not in text:continue
        url=urllib.parse.urljoin(INDEX,el.get('href',''))
        if not stage or not url.startswith(('http://','https://')):continue
        found.append({'jurisdiction':current,'stage':stage,'url':url,'label':el.get_text(' ',strip=True)})
    assert len({x['jurisdiction'] for x in found})>=15, 'Directory layout changed; stop rather than pretend full coverage'
    items=[{'key':bid,'url':'https://www.boe.es/buscar/act.php?id='+bid,'jurisdiction':'ES-STATE','stage':stage,'title':title,'national':True}for stage,bid,title in NATIONAL]
    dedup={}
    for f in found:
        url=f['url'].replace('http://','https://',1)
        if url in dedup:
            dedup[url]['territories']=sorted(set(dedup[url]['territories']+[f['jurisdiction']]))
            dedup[url]['stages']=sorted(set(dedup[url]['stages']+[f['stage']]))
        else:dedup[url]={'key':'regional-'+sha(url)[:18],'url':url,'jurisdiction':f['jurisdiction'],'stage':f['stage'],'territories':[f['jurisdiction']],'stages':[f['stage']]}
    items.extend(dedup.values());(OUT/'source-manifest.json').write_text(json.dumps({'release_id':RELEASE,'directory':INDEX,'directory_sha256':sha(raw),'discovered':found,'sources':items,'coverage_complete':False},ensure_ascii=False,indent=2))
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:results=list(pool.map(collect_one,items))
    docs=[r['document']for r in results if r['ok']];chunks=[c for r in results if r['ok'] for c in r['chunks']]
    (OUT/'documents.json').write_text(json.dumps(docs,ensure_ascii=False,separators=(',',':')))
    with (OUT/'chunks.jsonl').open('w') as f:
        for c in chunks:f.write(json.dumps(c,ensure_ascii=False,separators=(',',':'))+'\n')
    report={'release_id':RELEASE,'documents_downloaded':len(docs),'chunks':len(chunks),'text_utf8_bytes':sum(len(d['text_body'].encode()) for d in docs),'national_complete_texts':sum(d['jurisdiction']=='ES-STATE' for d in docs),'regional_discovery_jurisdictions':len({x['jurisdiction']for x in found}),'regional_curriculum_complete':False,'normative_corpus_is_not_textbook_content':True,'regional_snapshots_quarantined':sum(d['review_status']=='quarantined' for d in docs),'failed_sources':[r for r in results if not r['ok']],'document_summary':[{k:d[k]for k in ('document_id','title','jurisdiction','stage','review_status','content_sha256','source_version')}for d in docs]}
    (OUT/'collection-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps({k:v for k,v in report.items()if k not in ('document_summary','failed_sources')},ensure_ascii=False));print('Failed sources:',len(report['failed_sources']))
    assert report['national_complete_texts']==4, 'Not all four national texts are available'
if __name__=='__main__':main()
