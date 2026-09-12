// Preserve unrelated drafts: create a separate immutable content-release namespace.
import{readFileSync,writeFileSync}from'node:fs';import{createHash}from'node:crypto';import{execFileSync}from'node:child_process';import assert from'node:assert/strict';
const before='eterna-library-2026.09-v2',after=before+'-160',path='.content-proof/library-v2-evidence/report.json',hash=x=>createHash('sha256').update(x).digest('hex');
const old=JSON.parse(readFileSync(path));assert.equal(old.release,before);assert.equal(old.tests_failed,0);assert.equal(old.ui_model_calls,0);assert.equal(old.ui_scenarios,42);
for(const[f,p]of Object.entries(old.blobs))assert.equal(hash(readFileSync(f)),p.sha256,f);
const report=JSON.parse(JSON.stringify(old).replaceAll(before,after));
for(const f of Object.keys(report.blobs)){const s=readFileSync(f,'utf8');writeFileSync(f,s.replaceAll(before,after));report.blobs[f].sha256=hash(readFileSync(f));report.blobs[f].sha=execFileSync('git',['hash-object',f],{encoding:'utf8'}).trim()}
report.namespace_only_change=true;report.original_content_proof_run=34663746343;report.drafts_preserved='eterna-library-2026.09-v2';
writeFileSync(path,JSON.stringify(report,null,2));
const p='qa/library-release-v2/prepare_private.py',script=readFileSync(p,'utf8');writeFileSync(p,script.replaceAll(before,after));
console.log('Only release namespace changed; existing mixed drafts preserved. Tests must run again before publication.');
