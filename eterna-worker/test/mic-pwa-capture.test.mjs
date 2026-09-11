// Reuse the existing microphone harness; only platform signal/state doubles change.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const url=new URL('./mic-auto-send.test.mjs',import.meta.url);
let h=readFileSync(url,'utf8').split('async function speakThenPause')[0];
h=h.replaceAll('import.meta.url',JSON.stringify(url.href));
h=h.replace("const source=readFileSync(new URL('../../eterna-mic-only-v4.js',"+JSON.stringify(url.href)+"),'utf8');", "const source=readFileSync(process.env.MIC_SOURCE || new URL('../../eterna-mic-only-v4.js',"+JSON.stringify(url.href)+"),'utf8');");
h=h.replace('permission=null,canonical=false,delayedGate=false',"permission=null,canonical=false,delayedGate=false,audioState='running',requireOutput=false,stalled=false,denied=false");
h=h.replace('const listeners={},docListeners={},timers','const audioContexts=[],order=[];const listeners={},docListeners={},timers');
h=h.replace('voiced=false,requestPending','voiced=false,amplitude=.125,requestPending');
const a=h.indexOf('  class AudioContext '),b=h.indexOf('  class Recorder ',a);assert.ok(a>0&&b>a);
h=h.slice(0,a)+`  class AudioContext {
 constructor(){this.state=audioState;this.resumes=0;this.pulled=false;this.disconnected=0;this.destination={};audioContexts.push(this);order.push('audio-context')}
 createMediaStreamSource(){return{connect(){},disconnect:()=>this.disconnected++}}
 createGain(){return{gain:{value:1},connect:()=>{this.pulled=true},disconnect:()=>this.disconnected++}}
 createAnalyser(){return{fftSize:1024,connect(){},disconnect:()=>this.disconnected++,getFloatTimeDomainData:(a)=>{for(let i=0;i<a.length;i++)a[i]=this.state==='running'&&(!requireOutput||this.pulled)&&voiced?Math.SQRT2*amplitude*Math.sin(2*Math.PI*i/32):0},getByteTimeDomainData:(a)=>{for(let i=0;i<a.length;i++)a[i]=128+(this.state==='running'&&(!requireOutput||this.pulled)&&voiced?Math.round(Math.SQRT2*amplitude*128*Math.sin(2*Math.PI*i/32)):0)}}}
 close(){this.state='closed';return Promise.resolve()}
 resume(){order.push('resume');this.resumes++;if(stalled)return new Promise(()=>{});this.state='running';return Promise.resolve()}
 }
`+h.slice(b);
h=h.replace('getUserMedia:async()=>{const stream',"getUserMedia:async()=>{order.push('getUserMedia');if(denied)throw Object.assign(new Error('denied'),{name:'NotAllowedError'});const stream");
h=h.replace('AbortController,Uint8Array,Object','AbortController,Float32Array,Uint8Array,Object');
h=h.replace('return{window,document,ctx,field','return{order,audioContexts,window,document,ctx,field');
h=h.replace('voice:v=>{voiced=v}','voice:(v,a=.125)=>{voiced=v;amplitude=a}');
h=h.replace('    hide(){',"    nextMode(mode){emit(listeners,'coco:eterna-context-invalidated');ctx.mode=mode;ctx.session_id='test-'+mode;ctx.epoch++;field.value='';field.disabled=false;send.disabled=true;requestPending=false},\n    hide(){");
const {harness,flush,deferred}=await import('data:text/javascript;base64,'+Buffer.from(h+'\nexport {harness,flush,deferred};').toString('base64'));
const baseline = process.env.MIC_BASELINE === '1';
const modes=['homework','ask','review','explain','exam','practice'];
for (const mode of modes){
  test('quiet voice detected and submitted in '+mode,async()=>{
    const h=harness();h.nextMode(mode);await h.start();await h.advance(800);h.voice(true,.009);await h.advance(1600);h.voice(false);await h.advance(2000);
    assert.equal(h.send.clicks,1);assert.equal(h.requests.length,1);
  });
}
test('speaking immediately is not learnt as background noise or cut mid-sentence',async()=>{
  const h=harness();h.voice(true,.05);await h.start();await h.advance(3500);assert.equal(h.recorders[0].stops,0);
  h.voice(false);await h.advance(1700);assert.equal(h.send.clicks,1);
});
test('gradually rising quiet speech is detected in the first 700ms',async()=>{
  const h=harness();await h.start();for(let i=1;i<=12;i++){h.voice(true,i*.001);await h.advance(50)}
  h.voice(true,.012);await h.advance(1800);assert.equal(h.recorders[0].stops,0);h.voice(false);await h.advance(1700);assert.equal(h.send.clicks,1);
});
test('audio context activation starts before the first asynchronous microphone request',async()=>{
  const h=harness({audioState:'suspended'});await h.start();assert.ok(h.order.indexOf('resume')<h.order.indexOf('getUserMedia'));h.event('pagehide');
});
test('interrupted audio context is resumed before recording',async()=>{
  const h=harness({audioState:'interrupted'});await h.start();h.voice(true,.05);await h.advance(1000);h.voice(false);await h.advance(1700);assert.equal(h.send.clicks,1);assert.ok(h.audioContexts[0].resumes>0);
});
test('analysis graph is connected to a muted output',async()=>{
  const h=harness({requireOutput:true});await h.start();h.voice(true,.05);await h.advance(1200);h.voice(false);await h.advance(1700);assert.equal(h.send.clicks,1);assert.equal(h.audioContexts[0].pulled,true);
});
test('six sequential modes get fresh released contexts and one automatic send each',async()=>{
 const h=harness({audioState:'interrupted',requireOutput:true});
 for(const [i,mode]of modes.entries()){h.nextMode(mode);await h.start();h.voice(true,.009);await h.advance(1700);h.voice(false);await h.advance(1700);assert.equal(h.send.clicks,i+1,mode);assert.equal(h.audioContexts[i].state,'closed',mode)}
 assert.equal(h.requests.length,6);assert.equal(h.audioContexts.length,6);assert.ok(h.streams.every(s=>s.stopped>0));
});
test('true silence never produces a transcript or automatic chat',async()=>{
 const h=harness();await h.start();await h.advance(16000);assert.equal(h.requests.length,0);assert.equal(h.send.clicks,0);assert.equal(h.audioContexts[0].state,'closed');
});
test('denied permission releases the synchronously created audio context',async()=>{
 const h=harness({denied:true});await h.start();assert.equal(h.audioContexts.length,1);assert.equal(h.audioContexts[0].state,'closed');assert.equal(h.recorders.length,0);
});
if(!baseline){
 test('blocked audio activation times out without calling absence of voice',async()=>{
  const h=harness({audioState:'suspended',stalled:true});const start=h.start();await flush();await h.advance(4500);await start;
  assert.equal(h.recorders.length,0);assert.equal(h.requests.length,0);assert.match(h.label.textContent,/MIC-CAPTURE-1/);assert.doesNotMatch(h.label.textContent,/No he oído voz/);assert.equal(h.audioContexts[0].state,'closed');
 });
 test('a short isolated click is not a spoken question',async()=>{
   const h=harness();await h.start();h.voice(true,.12);await h.advance(32);h.voice(false);await h.advance(16000);assert.equal(h.send.clicks,0);assert.equal(h.requests.length,0);
 });
 test('interruption during speech is recovered without reopening the recorder',async()=>{
   const h=harness();await h.start();h.voice(true,.02);await h.advance(600);h.audioContexts[0].state='interrupted';await h.advance(600);h.voice(false);await h.advance(1700);assert.equal(h.send.clicks,1);assert.equal(h.recorders.length,1);assert.ok(h.audioContexts[0].resumes>=1);
 });
 test('closing while permission is pending releases its pre-created context',async()=>{
   const d=deferred(),h=harness({permission:d.promise});const start=h.start();await flush();h.close();d.resolve();await start;assert.equal(h.recorders.length,0);assert.equal(h.audioContexts[0].state,'closed');assert.ok(h.streams[0].stopped>0);
 });
}
