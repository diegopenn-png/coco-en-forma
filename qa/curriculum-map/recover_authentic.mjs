// Public official sources only. No credentials, user sessions, API-model calls or production writes.
import{mkdirSync,writeFileSync}from'node:fs';import{createHash}from'node:crypto';import{execFileSync}from'node:child_process';import{chromium}from'playwright';
const root='curriculum-map-evidence';mkdirSync(root+'/sources',{recursive:true});mkdirSync(root+'/national',{recursive:true});
const digest=b=>createHash('sha256').update(b).digest('hex');
const allowed=u=>{try{const x=new URL(u);return x.protocol==='https:'&&['boe.es','www.boe.es','bocm.es','www.bocm.es','gestiona.comunidad.madrid','www.comunidad.madrid','boc.cantabria.es','educantabria.es','www.educantabria.es','www.gobiernodecanarias.org'].includes(x.hostname)}catch{return false}};
const report={production_modified:false,student_data_accessed:false,model_calls:0,national:[],regional:[],no_completeness_or_human_endorsement:true};const save=()=>writeFileSync(root+'/retrieval.json',JSON.stringify(report,null,2));save();
async function fetchBytes(url){if(!allowed(url))throw Error('Non-official URL');let target=url;for(let i=0;i<7;i++){const r=await fetch(target,{redirect:'manual',headers:{'Accept':'text/html,application/pdf,application/xml','User-Agent':'EternaCurricularReferenceAudit/2.0'},signal:AbortSignal.timeout(80000)});if(r.status>=300&&r.status<400){target=new URL(r.headers.get('location'),target).href;if(!allowed(target))throw Error('Unexpected redirect');continue}if(!r.ok)throw Error('HTTP '+r.status);const b=Buffer.from(await r.arrayBuffer());if(b.length>40*1024*1024)throw Error('Size limit');return{bytes:b,url:target,type:r.headers.get('content-type')||''}}throw Error('Redirect limit')}
function persistPdf(item,bytes,sourceUrl){if(bytes.subarray(0,5).toString()!=='%PDF-')throw Error('Not PDF bytes');const key=item.key,path=root+'/sources/'+key+'.pdf';writeFileSync(path,bytes);const text=execFileSync('pdftotext',['-layout','-enc','UTF-8',path,'-'],{encoding:'utf8',timeout:60000,maxBuffer:30*1024*1024});if(text.length<10000||!item.required.test(text))throw Error('PDF identity or extracted text invalid');writeFileSync(root+'/sources/'+key+'.txt',text);const info=execFileSync('pdfinfo',[path],{encoding:'utf8'});return{key,official_url:sourceUrl,bytes:bytes.length,sha256:digest(bytes),text_sha256:digest(text),characters:text.length,pages:Number(info.match(/^Pages:\s*(\d+)/m)?.[1]),type:'authentic-pdf',text_extracted:true,all_annexes_semantically_verified:false}}
for(const id of ['BOE-A-2022-1654','BOE-A-2022-3296','BOE-A-2022-4975','BOE-A-2022-5521']){
 const row={id,checked_at:new Date().toISOString(),metadata:[]};
 try{const x=await fetchBytes('https://www.boe.es/buscar/act.php?id='+id);if(!x.bytes.includes(Buffer.from('textoxslt'))&&!x.bytes.includes(Buffer.from('textoconsolidado')))throw Error('Missing full BOE text');writeFileSync(root+'/national/'+id+'.html',x.bytes);row.html_sha256=digest(x.bytes);row.current_html_captured=true}catch(e){row.error=String(e.message)}
 for(const suffix of ['metadatos','analisis']){try{const x=await fetchBytes('https://www.boe.es/datosabiertos/api/legislacion-consolidada/id/'+id+'/'+suffix);writeFileSync(root+'/national/'+id+'-'+suffix+'.xml',x.bytes);row.metadata.push({kind:suffix,sha256:digest(x.bytes),bytes:x.bytes.length})}catch(e){row.metadata.push({kind:suffix,error:String(e.message)})}}
 report.national.push(row);save()
}
const items=[
 {key:'madrid-bachillerato-original',url:'https://www.bocm.es/boletin/CM_Orden_BOCM/2022/07/26/BOCM-20220726-1.PDF',required:/64\/2022/},
 {key:'madrid-modificacion-59-2024',url:'https://www.bocm.es/boletin/CM_Orden_BOCM/2024/06/13/BOCM-20240613-2.PDF',required:/59\/2024/},
 {key:'madrid-optativas-114-2025',url:'https://bocm.es/boletin/CM_Orden_BOCM/2025/01/31/BOCM-20250131-18.PDF',required:/114\/2025/},
 {key:'cantabria-infantil-primaria',url:'https://boc.cantabria.es/boces/verAnuncioAction.do?idAnuBlob=374267',required:/66\/2022/},
 {key:'cantabria-eso-bachillerato',url:'https://boc.cantabria.es/boces/verAnuncioAction.do?idAnuBlob=374886',required:/73\/2022/}
];
await Promise.all(items.map(async item=>{const r={key:item.key,official_url:item.url};try{const x=await fetchBytes(item.url);Object.assign(r,persistPdf(item,x.bytes,x.url))}catch(e){r.error=String(e.message)}report.regional.push(r);save()}));
const browser=await chromium.launch({headless:true});
try{
 const context=await browser.newContext();await context.route('**/*',route=>allowed(route.request().url())||route.request().url().startsWith('data:')?route.continue():route.abort());
 const page=await context.newPage(),captured=[],pending=[];
 const item={key:'madrid-bachillerato-consolidado',required:/64\/2022/};
 page.on('response',response=>{if(!allowed(response.url())||!(/ficheroTemporal|\.pdf|VerPdf/i.test(response.url())||/pdf/i.test(response.headers()['content-type']||'')))return;pending.push((async()=>{try{const bytes=await response.body();if(bytes.subarray(0,5).toString()==='%PDF-')captured.push(persistPdf(item,bytes,response.url()))}catch{}})())});
 const canonical='https://gestiona.comunidad.madrid/wleg_pub/servlet/Servidor?opcion=VerHtml&nmnorma=12792';
 try{await page.goto(canonical,{waitUntil:'domcontentloaded',timeout:90000});await page.waitForTimeout(5000)}catch{}
 // Some official viewers serve PDF bytes under an .html extension. Read bytes, never decode them as text.
 for(const f of page.frames())if(allowed(f.url())&&/ficheroTemporal/.test(f.url())){try{const r=await context.request.get(f.url(),{timeout:70000});const b=await r.body();if(b.subarray(0,5).toString()==='%PDF-')captured.push(persistPdf(item,b,f.url()))}catch{}}
 await Promise.all(pending);
 const entry={key:item.key,official_url:canonical,captured_pdf:captured.length>0,candidates:captured,all_modifications_mapped:false};
 if(!captured.length){entry.viewer_text=await page.locator('body').innerText().catch(()=> '');entry.viewer_text=entry.viewer_text.slice(0,3000);entry.error='No authentic PDF response captured; not reported as recovered'}
 report.regional.push(entry);save();await context.close();
}finally{await browser.close()}
report.finished_at=new Date().toISOString();save();console.log(JSON.stringify(report));
if(report.national.some(r=>!r.current_html_captured))throw Error('At least one national source failed; do not import stale text as fresh');
