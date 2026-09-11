// One-off, exact-source transcription repair. Does not alter auth, chat or speech.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const path='eterna-worker/src/index.js';
const source=readFileSync(path,'utf8');
const before='const audio=[...new Uint8Array(await file.arrayBuffer())],data=await env.AI.run(env.TRANSCRIBE_MODEL||"@cf/openai/whisper-large-v3-turbo",';
const after='const bytes=new Uint8Array(await file.arrayBuffer());let audio="";for(let offset=0;offset<bytes.length;offset+=24576)audio+=btoa(String.fromCharCode(...bytes.subarray(offset,offset+24576)));const data=await env.AI.run(env.TRANSCRIBE_MODEL||"@cf/openai/whisper-large-v3-turbo",';
const hash=s=>createHash('sha256').update(s).digest('hex');
if(source.includes(after)&&hash(source.replace(after,before))==='fbf4a21b93bfc8a9dad803f1f9dfdcf2c9eab1772e55976794c4d39f40d08582'){
 console.log('Exact transcription repair already present');
}else{
 if(hash(source)!=='fbf4a21b93bfc8a9dad803f1f9dfdcf2c9eab1772e55976794c4d39f40d08582'||source.split(before).length!==2)throw new Error('Unexpected source; refuse to patch');
 const updated=source.replace(before,after);
 if(updated.replace(after,before)!==source)throw new Error('Unexpected non-transcription difference');
 writeFileSync(path,updated);console.log('Changed only Cloudflare transcription audio encoding; '+hash(updated));
}
