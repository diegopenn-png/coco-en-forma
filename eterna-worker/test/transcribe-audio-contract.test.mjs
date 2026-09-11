import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/index.js',import.meta.url),'utf8');
const start=source.indexOf('async function handleTranscribe(');
const end=source.indexOf('\nasync function handleSpeak(',start);
assert.ok(start>0&&end>start);
const handler=source.slice(start,end);
function load({legal=true,sub=true,audioAllowed=true,result={text:'Texto de prueba'}}={}){
 const calls=[];
 const sandbox={File,FormData,Blob,Uint8Array,btoa,
  requireLegalState:async()=>{calls.push('legal');return{ok:legal,response:new Response('{}',{status:403})}},
  getSubscription:async()=>{calls.push('subscription');return sub},subscriptionActive:x=>x,
  getParentSettings:async()=>{calls.push('parent');return{allow_audio_input:audioAllowed}},
  json:(p,status=200)=>new Response(JSON.stringify(p),{status}),
  aiProvider:env=>env.AI_PROVIDER,
  openai:async(env,path,init)=>{calls.push({path,init});return new Response(JSON.stringify(result))}
 };
 vm.createContext(sandbox);vm.runInContext(handler+'\nglobalThis.handle=handleTranscribe;',sandbox);
 return{calls,handle:sandbox.handle,env:{AI_PROVIDER:'cloudflare',TRANSCRIBE_MODEL:'@cf/openai/whisper-large-v3-turbo',AI:{run:async(model,input)=>{calls.push({model,input});return result}}}};
}
function req(size=256,type='audio/mp4',name='pregunta.m4a'){
 const bytes=Uint8Array.from({length:size},(_,i)=>i%256);
 const form=new FormData();form.append('audio',new File([bytes],name,{type}));
 return{bytes,request:{formData:async()=>form}};
}
const auth={user:{id:'synthetic',email:'synthetic@example.invalid'}};
for(const size of [1,2,3,256,24575,24576,24577,49151,49152,49153,8*1024*1024]){
 test('transcription base64 preserves every byte, size='+size,async()=>{
  const api=load(),{bytes,request}=req(size),r=await api.handle(request,api.env,auth);
  assert.equal(r.status,200);const call=api.calls.at(-1);
  assert.equal(typeof call.input.audio,'string');
  assert.deepEqual(Buffer.from(call.input.audio,'base64'),Buffer.from(bytes));
  assert.equal(call.input.audio,Buffer.from(bytes).toString('base64'));
  assert.equal(call.model,'@cf/openai/whisper-large-v3-turbo');
  assert.equal(call.input.language,'es');assert.equal(call.input.task,'transcribe');
  assert.equal(call.input.vad_filter,true);assert.equal(call.input.condition_on_previous_text,false);
 });
}
for(const [type,name] of [['audio/wav','pregunta.wav'],['audio/mp4','pregunta.m4a'],['audio/mp4;codecs=mp4a.40.2','pregunta.m4a'],['audio/webm;codecs=opus','pregunta.webm']]){
 test('transcription still accepts '+type,async()=>{
  const api=load(),{request}=req(1024,type,name);assert.equal((await api.handle(request,api.env,auth)).status,200);
 });
}
for(const [options,status,expectedCalls] of [[{legal:false},403,['legal']],[{sub:false},402,['legal','subscription']],[{audioAllowed:false},403,['legal','subscription','parent']]]){
 test('transcription access remains closed: '+JSON.stringify(options),async()=>{
  const api=load(options);const r=await api.handle({formData:async()=>{throw Error('Must not read audio before access checks')}},api.env,auth);
  assert.equal(r.status,status);assert.deepEqual(api.calls,expectedCalls);
 });
}
test('transcription rejects missing, oversized and non-audio files before inference',async()=>{
 for(const [request,status] of [[{formData:async()=>new FormData()},400],[req(8*1024*1024+1).request,413],[req(1000,'text/plain','bad.txt').request,415]]){
  const api=load(),r=await api.handle(request,api.env,auth);assert.equal(r.status,status);assert.equal(api.calls.length,3);
 }
});
test('Cloudflare transcript response shape is unchanged',async()=>{
 for(const result of [{text:'Texto de prueba'},{transcription_info:{text:'Texto de prueba'}}]){
  const api=load({result}),r=await api.handle(req().request,api.env,auth);assert.deepEqual(await r.json(),{text:'Texto de prueba'});
 }
});
test('OpenAI fallback branch still sends original file as multipart, not base64',async()=>{
 const api=load(),{bytes,request}=req(1024);api.env.AI_PROVIDER='openai';api.env.TRANSCRIBE_MODEL='gpt-4o-mini-transcribe';
 const r=await api.handle(request,api.env,auth);assert.equal(r.status,200);
 const call=api.calls.at(-1);assert.equal(call.path,'/audio/transcriptions');
 assert.equal(call.init.body.get('model'),'gpt-4o-mini-transcribe');assert.equal(call.init.body.get('language'),'es');
 const file=call.init.body.get('file');assert.equal(file.name,'pregunta.m4a');assert.equal(file.type,'audio/mp4');
 assert.deepEqual(Buffer.from(await file.arrayBuffer()),Buffer.from(bytes));
});
