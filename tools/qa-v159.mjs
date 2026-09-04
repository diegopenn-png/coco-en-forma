import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import vm from "node:vm";
import {spawnSync} from "node:child_process";
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),"..");
const must=["index.html","sw.js","manifest.json","manifest.webmanifest","eterna-v159.js","eterna-v159.css","supabase-eterna-v159.sql","supabase-eterna-v159-rollback.sql","eterna-worker/src/index.js","share/eterna.png"];
let fail=0;function ok(x,msg){console.log((x?"✓":"✗")+" "+msg);if(!x)fail++}
for(const f of must)ok(fs.existsSync(path.join(root,f)),"existe "+f);
const idx=fs.readFileSync(path.join(root,"index.html"),"utf8"),sw=fs.readFileSync(path.join(root,"sw.js"),"utf8");
ok(idx.includes("tutorEndpoint:'https://coco-med-tutor.chatinmobiliario.workers.dev/'"),"Coco Med tutorEndpoint intacto");
ok(idx.includes("eternaEndpoint:''")||/eternaEndpoint:'https:\/\//.test(idx),"config Eterna independiente");
ok(idx.includes("./eterna-v159.js?v=15900")&&idx.includes("./eterna-v159.css?v=15900"),"módulo Eterna cargado externamente");
ok(sw.includes('coco-en-forma-v159.0.0-r1'),"Service Worker v159");
ok(sw.includes('./eterna-v159.js')&&sw.includes('./eterna-v159.css')&&sw.includes('./share/eterna.png'),"SW precache Eterna");
ok(idx.includes("COCO RELEASE 2026-08-21-v159.0-ETERNA-Beta"),"release interno v159 identificado");
const worker=fs.readFileSync(path.join(root,"eterna-worker/src/index.js"),"utf8");
ok(worker.includes('image_url:{url:image}'),"Moderation API usa imagen multimodal con objeto URL");
ok(fs.readFileSync(path.join(root,"supabase-eterna-v159.sql"),"utf8").includes("eterna_student_concept_memory"),"Student Model independiente del corpus curricular presente");
ok(worker.includes('ETERNA_DAILY_LIMIT')&&worker.includes('/v1/parent-settings')&&worker.includes('/v1/export')&&worker.includes('/v1/delete-data'),"controles familiares y límite backend presentes");

for(const f of ["eterna-v159.js","eterna-worker/src/index.js"]){const r=spawnSync(process.execPath,["--check",path.join(root,f)],{encoding:"utf8"});ok(r.status===0,"sintaxis "+f+(r.status===0?"":": "+(r.stderr||r.stdout).trim()))}
const scripts=[...idx.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(x=>x[1]).filter(x=>x.trim());let inlineOk=0;for(let i=0;i<scripts.length;i++){try{new vm.Script(scripts[i],{filename:"inline-"+(i+1)});inlineOk++}catch(e){console.error("Inline "+(i+1)+" falla: "+e.message);fail++}}
console.log("Inline scripts válidos: "+inlineOk+"/"+scripts.length);
const protectedFiles=["coco-v142-content-extension.js","coco-v142-runtime.js","coco-v142-unified.js","coco-v144-content.js","coco-v144-core.js","coco-v152-padel.js","coco-v153-fixes.js","coco-v155-identity.js","supabase-coco-v153.sql","supabase-coco-v153-rollback.sql"];
const manifest158=JSON.parse(fs.readFileSync(path.join(root,"RELEASE-MANIFEST-v158.0.json"),"utf8"));const old=new Map(manifest158.files.map(x=>[x.path,x.sha256]));for(const f of protectedFiles){const h=crypto.createHash("sha256").update(fs.readFileSync(path.join(root,f))).digest("hex");ok(h===old.get(f),"sin regresión byte-a-byte: "+f)}
const secretPatterns=[/sk_(live|test)_[A-Za-z0-9]{12,}/,/OPENAI_API_KEY\s*[:=]\s*["'][A-Za-z0-9_-]{20,}/];let leak=false;for(const f of ["index.html","eterna-v159.js","eterna-worker/src/index.js"]){const t=fs.readFileSync(path.join(root,f),"utf8");if(secretPatterns.some(r=>r.test(t)))leak=true}ok(!leak,"no hay secretos privados incrustados");
const meta=fs.statSync(path.join(root,"share/eterna.png"));ok(meta.size>20000,"miniatura social generada");
if(fail){console.error("QA FALLÓ: "+fail+" comprobaciones");process.exit(1)}console.log("QA ESTÁTICO v159 OK");
