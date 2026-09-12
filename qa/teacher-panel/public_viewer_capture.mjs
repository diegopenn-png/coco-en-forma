// Public official pages only. No user sessions, secrets, purchases or production writes.
import{chromium}from'playwright';import{mkdirSync,writeFileSync}from'node:fs';import{createHash}from'node:crypto';
const out='panel-viewer-evidence';mkdirSync(out,{recursive:true});
const jobs=[
 {territory:'ES-MD',stages:['primaria'],reference:'Decreto 61/2022',url:'https://www.bocm.es/eli/es-md/d/2022/07/13/61/con'},
 {territory:'ES-MD',stages:['eso'],reference:'Decreto 65/2022',url:'https://www.bocm.es/eli/es-md/d/2022/07/20/65/con'},
 {territory:'ES-MD',stages:['bachillerato'],reference:'Decreto 64/2022',url:'https://www.bocm.es/eli/es-md/d/2022/07/20/64/con'},
 {territory:'ES-CT',stages:['infantil'],reference:'Decret 21/2023',url:'https://portaljuridic.gencat.cat/eli/es-ct/d/2023/02/07/21'},
 {territory:'ES-CT',stages:['primaria','eso'],reference:'Decret 175/2022',url:'https://portaljuridic.gencat.cat/eli/es-ct/d/2022/09/27/175'},
 {territory:'ES-CT',stages:['bachillerato'],reference:'Decret 171/2022',url:'https://portaljuridic.gencat.cat/eli/es-ct/d/2022/09/20/171'},
 {territory:'ES-CT',stages:['primaria','eso'],reference:'Decret 480/2024',url:'https://portaljuridic.gencat.cat/eli/es-ct/d/2024/12/17/480'}
];
const hash=v=>createHash('sha256').update(v).digest('hex');const allowed=u=>{try{const p=new URL(u);return p.protocol==='https:'&&['gencat.cat','comunidad.madrid','bocm.es'].some(h=>p.hostname===h||p.hostname.endsWith('.'+h))}catch{return false}};
const browser=await chromium.launch({headless:true});const results=[];
try{
 for(let start=0;start<jobs.length;start+=3){await Promise.all(jobs.slice(start,start+3).map(async(job)=>{
  const context=await browser.newContext({locale:'es-ES',acceptDownloads:false});await context.route('**/*',r=>allowed(r.request().url())?r.continue():r.abort());const page=await context.newPage();const id='viewer-'+hash(job.url).slice(0,16),row={...job,id,checked_at:new Date().toISOString(),method:'isolated-browser-public-official-viewer',human_certification:false,all_amendments_verified:false};
  try{
   await page.goto(job.url,{waitUntil:'domcontentloaded',timeout:45000});await page.waitForTimeout(7000);
   const texts=[];for(const frame of page.frames()){if(allowed(frame.url())){try{const t=await frame.locator('body').innerText({timeout:5000});if(t.length>500)texts.push({url:frame.url(),text:t})}catch{}}}
   // Madrid embeds the actual normative HTML; retain the parent's canonical URL and fetch only its same-authority embed.
   const embeds=await page.locator('embed[src],iframe[src]').evaluateAll(nodes=>nodes.map(n=>new URL(n.getAttribute('src'),document.baseURI).href));
   for(const u of embeds){if(!allowed(u)||texts.some(t=>t.url===u))continue;try{const r=await context.request.get(u,{timeout:25000});if(r.ok()){const html=await r.text();const doc=await context.newPage();await doc.setContent(html,{waitUntil:'domcontentloaded'});texts.push({url:u,text:await doc.locator('body').innerText()});await doc.close()}}catch{}}
   const full=texts.sort((a,b)=>b.text.length-a.text.length)[0];row.characters=full?.text.length||0;row.evidence_url=full?.url||page.url();row.canonical_url=page.url();row.contains_curriculum_terms=Boolean(full&&/curr[ií]cul|curr[ií]culo|compet[eè]ncies|competencias/i.test(full.text));row.full_text_captured=Boolean(full&&full.text.length>12000&&row.contains_curriculum_terms);
   if(full){writeFileSync(out+'/'+id+'.txt',full.text);row.text_sha256=hash(full.text);row.change_passages=full.text.split('\n').filter(x=>x.length<1400&&/modific|derog|correcci|202[4-6]/i.test(x)).slice(0,60)}
   await page.screenshot({path:out+'/'+id+'.png',fullPage:false});row.status=row.full_text_captured?'official_text_captured_pending_semantic_alignment':'viewer_or_reference_only';
  }catch(e){row.status='capture_failed';row.error=String(e.message).slice(0,250)}finally{await context.close();results.push(row);console.log(JSON.stringify({reference:row.reference,status:row.status,characters:row.characters}))}
 }))}
}finally{await browser.close();writeFileSync(out+'/report.json',JSON.stringify({checked_sources:results.length,full_text_captured:results.filter(r=>r.full_text_captured).length,results,production_changed:false,child_data_accessed:false},null,2))}
