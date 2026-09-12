// Test-only localhost gateway into the exact Worker, with synthetic identity/DB
// fixtures and inference disabled. No external requests or child accounts.
import{readFileSync,writeFileSync}from'node:fs';import{fileURLToPath,pathToFileURL}from'node:url';import{resolve,extname}from'node:path';import{createServer}from'node:http';
const root=resolve(fileURLToPath(new URL('../..',import.meta.url)));
const tests=readFileSync(resolve(root,'eterna-worker/test/library-first.test.mjs'),'utf8');
const harnessPath=resolve(root,'eterna-worker/test/.library-ui-harness.mjs');
writeFileSync(harnessPath,tests.split('const profile=l=>')[0].replace("import test from 'node:test';\n",'')+'\nexport{harness};\n');
const{harness}=await import(pathToFileURL(harnessPath));let h=harness();let results=[];
const mime={'.js':'text/javascript','.css':'text/css','.html':'text/html','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp'};
const server=createServer(async(req,res)=>{
 try{
  const u=new URL(req.url,'http://localhost');
  if(u.pathname==='/reset'){await h.drain();h=harness({year:u.searchParams.get('year')||'5º de Primaria'});results=[];res.end('{}');return}
  if(u.pathname==='/audit'){await h.drain();res.setHeader('Content-Type','application/json');res.end(JSON.stringify({inference_attempts:h.inferences.length,turns:results,requests:h.requests}));return}
  if(u.pathname==='/gateway'){
   let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>100000)throw Error('Oversized local fixture')}
   const b=JSON.parse(raw),headers=new Headers(b.headers||{});headers.set('Origin','https://cocoenforma.com');
   const request=new Request('https://worker.test'+b.path,{method:b.method||'GET',headers,...(b.body!=null?{body:b.body}:{})});
   const deferred=[];const response=await h.sandbox.api.handleFetch(request,h.env,{waitUntil(p){deferred.push(Promise.resolve(p));p.catch(()=>{})}});
   const body=await response.text();let json;try{json=JSON.parse(body)}catch{}
   results.push({path:b.path.split('?')[0],status:response.status,route:json?.library_route||null,reply:json?.reply||null,assessment:json?.student_answer_assessment||null,activity:json?.activity_state||null});
   Promise.allSettled(deferred).catch(()=>{});
   res.setHeader('Content-Type','application/json');res.end(JSON.stringify({status:response.status,headers:Object.fromEntries(response.headers),body}));return;
  }
  if(u.pathname==='/fixture'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><html lang="es"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><main id="cocoApp"></main></body></html>');return}
  const path=resolve(root,'.'+u.pathname);if(!path.startsWith(root+'/')){res.writeHead(403).end();return}
  res.setHeader('Content-Type',mime[extname(path)]||'application/octet-stream');res.end(readFileSync(path));
 }catch(e){res.writeHead(500,{'Content-Type':'application/json'});res.end(JSON.stringify({error:String(e.message)}))}
});server.listen(4189,'127.0.0.1',()=>console.log('Synthetic integration gateway ready on 4189'));process.on('SIGTERM',()=>server.close());
