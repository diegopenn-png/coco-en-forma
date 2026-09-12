import{chromium}from'playwright';import{mkdirSync,writeFileSync,readFileSync}from'node:fs';import{execFileSync}from'node:child_process';import{createHash}from'node:crypto';
const dir='panel-madrid-pdf-evidence';mkdirSync(dir,{recursive:true});const url='https://www.bocm.es/eli/es-md/d/2022/07/20/64/con',hash=x=>createHash('sha256').update(x).digest('hex');
const allowed=u=>{try{const p=new URL(u);return p.protocol==='https:'&&['bocm.es','comunidad.madrid'].some(h=>p.hostname===h||p.hostname.endsWith('.'+h))}catch{return false}};
const report={source_url:url,reference:'Decreto 64/2022',territory:'ES-MD',stage:'bachillerato',phase:'pending',human_legal_reviewed:false,all_annexes_semantically_checked:false,production_changed:false};const browser=await chromium.launch({headless:true});
try{
 const ctx=await browser.newContext({locale:'es-ES'});await ctx.route('**/*',r=>allowed(r.request().url())?r.continue():r.abort());const page=await ctx.newPage();await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});await page.waitForTimeout(5000);
 report.canonical_url=page.url();const embeds=await page.locator('embed[src],iframe[src]').evaluateAll(ns=>ns.map(n=>new URL(n.getAttribute('src'),document.baseURI).href));
 let done=false;
 for(const target of embeds){if(!allowed(target))continue;const r=await ctx.request.get(target,{timeout:40000});if(!r.ok())continue;const bytes=await r.body();if(bytes.length>40*1024*1024)throw Error('Bounded archive size exceeded');
  if(bytes.subarray(0,5).toString()==='%PDF-'){
   writeFileSync(dir+'/madrid-bachillerato-consolidado.pdf',bytes);execFileSync('pdftotext',['-layout','-enc','UTF-8',dir+'/madrid-bachillerato-consolidado.pdf',dir+'/madrid-bachillerato-consolidado.txt'],{timeout:90000});
   const text=readFileSync(dir+'/madrid-bachillerato-consolidado.txt','utf8');if(text.length<20000||!/bachillerato/i.test(text))throw Error('Expected normative PDF text not found');
   report.phase='actual-pdf-text-captured';report.pdf_sha256=hash(bytes);report.text_sha256=hash(text);report.characters=text.length;report.pages=text.split('\f').length-1;report.evidence_url=target;report.contains_curricular_annex_terms=/competencias espec[ií]ficas|criterios de evaluaci[oó]n/i.test(text);report.change_passages=text.split('\n').filter(x=>/modificaciones efectuadas|Decreto 59\/2024|Corrección de errores|derog/i.test(x)).slice(0,30);done=true;break;
  }
 }
 if(!done)throw Error('Official viewer did not expose the expected PDF');await ctx.close();console.log(JSON.stringify(report));
}catch(e){report.phase='capture-failed';report.error=String(e.message).slice(0,300);throw e}finally{await browser.close();writeFileSync(dir+'/report.json',JSON.stringify(report,null,2))}
