import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../../eterna-mic-only-v4.js',import.meta.url),'utf8');
const core=readFileSync(new URL('../../eterna-v159.js',import.meta.url),'utf8');
const flush=async()=>{for(let i=0;i<16;i++)await Promise.resolve()};
const reply=(text='Explícame los números primos',status=200)=>({status,ok:status===200,json:async()=>status===200?{text}:{error:'ETERNA_BACKEND_ERROR'}});
function deferred(){let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve}}
function harness({course='5º de Primaria',response=reply(),permission=null,canonical=false,delayedGate=false}={}){
  const listeners={},docListeners={},timers=new Map(),recorders=[],streams=[],requests=[],sent=[];
  let now=10000,seq=0,voiced=false,requestPending=false,blockSend=false,gatePending=false;const targetGuards=[];
  const ctx={uid:'test-user',mode:'explain',session_id:'test-session',question_id:null,epoch:1,phase:'ASK'};
  const add=(map,name,fn)=>(map[name]||(map[name]=[])).push(fn);
  const emit=(map,name,event={})=>(map[name]||[]).forEach(fn=>fn(event));
  const timeout=(fn,ms=0)=>{const id=++seq;timers.set(id,{at:now+ms,fn});return id};
  const classes=new Set(['is-open']);
  function element(marker){return{dataset:{},style:{},disabled:false,setAttribute(){},classList:{toggle(){}},closest(selector){return selector.includes(marker)?this:null}}}
  const field=Object.assign(element('[data-et-input]'),{value:'',focus(){},dispatchEvent(e){emit(docListeners,e.type,{type:e.type,target:this});if(e.type==='input'&&!requestPending)send.disabled=blockSend||!this.value.trim();return true}});
  const send=Object.assign(element('[data-et-send]'),{disabled:true,clicks:0,onclick:null,addEventListener(type,fn){targetGuards.push(fn)},click(){if(this.disabled)return;emit(docListeners,'click',{target:this});if(delayedGate&&!gatePending){gatePending=true;return}let blocked=false;const event={preventDefault(){},stopImmediatePropagation(){blocked=true}};for(const guard of targetGuards.splice(0)){guard(event);if(blocked)return}this.clicks++;sent.push(field.value);if(this.onclick)this.onclick();else{field.value='';field.disabled=true;this.disabled=true;requestPending=true}}});
  const mic=element('[data-et-mic]'),label={textContent:''},dot={},courseNode={textContent:course};
  const nodes={'[data-et-input]':field,'[data-et-send]':send,'[data-et-mic]':mic,'[data-et-status]':label,'[data-et-dot]':dot,'[data-et-course]':courseNode};
  const overlay={textContent:'Conversation mentions 2º de Bachillerato',classList:{contains:v=>classes.has(v)},querySelector:s=>nodes[s]||null,querySelectorAll:()=>[]};
  const document={hidden:false,documentElement:{},getElementById:id=>id==='eternaOverlayV159'?overlay:{},addEventListener:(name,fn)=>add(docListeners,name,fn)};
  class AudioContext {state='running';createMediaStreamSource(){return{connect(){}}}createAnalyser(){return{fftSize:1024,getByteTimeDomainData(a){a.fill(voiced?144:128)}}}close(){return Promise.resolve()}resume(){return Promise.resolve()}}
  class Recorder {static isTypeSupported(t){return t==='audio/mp4'}constructor(stream,options){this.stream=stream;this.mimeType=options?.mimeType||'audio/mp4';this.state='inactive';this.stops=0;recorders.push(this)}start(){this.state='recording'}stop(){if(this.state!=='recording')return;this.state='inactive';this.stops++;timeout(()=>{this.ondataavailable?.({data:new Blob([new Uint8Array(2048)],{type:this.mimeType})});this.onstop?.()},0)}}
  const window={AudioContext,addEventListener:(name,fn)=>add(listeners,name,fn),COCO_CONFIG:{eternaEndpoint:'https://voice.invalid'},CocoEternaV160:{getActivityContext:()=>({...ctx}),isRequestPending:()=>requestPending},__COCO_SUPABASE_CLIENT:{auth:{getSession:async()=>({data:{session:{access_token:'test-token'}}}),refreshSession:async()=>{}}}};
  const sandbox={window,document,navigator:{mediaDevices:{getUserMedia:async()=>{const stream={stopped:0,getTracks(){return[{stop:()=>{stream.stopped++}}]}};streams.push(stream);if(permission)await permission;return stream}}},MediaRecorder:Recorder,FormData,Blob,Event,AbortController,Uint8Array,Object,Date:class extends Date{static now(){return now}},localStorage:{setItem(){}},MutationObserver:class{observe(){}},setTimeout:timeout,clearTimeout:id=>timers.delete(id),requestAnimationFrame:fn=>timeout(fn,16),cancelAnimationFrame:id=>timers.delete(id),fetch:async(url,init)=>{requests.push({url,init});return await response}};
  const context=vm.createContext(sandbox);
  vm.runInContext(source.replace('})(window);','root.__test={start,stop,transcribe,newTurn,age,silenceMs,cancelPending};})(window);'),context);
  if(canonical){
    const activity={session_id:ctx.session_id,phase:'ASK',question_id:null},state={busy:false,imageData:null,mode:'explain',inputSource:'text',activityEpoch:1};
    Object.assign(context,{state,VERSION:'unchanged',overlay:()=>overlay,resolveContextualTurn:text=>({text,intent:'new_topic'}),ensureActivity:()=>activity,opaqueId:prefix=>prefix+':'+(++seq),setThinking(){},historyForApi:()=>[],appendMessage(){},setStatus:msg=>{label.textContent=msg},sessionUserId:()=>ctx.uid,repetitionDirective:()=>null,activityModeState:()=>({}),freshConversationState:()=>({}),freshPedagogicalState:()=>({}),stateContract:()=>({toPersistentActivityState:a=>a}),safeJson:r=>r.json(),applyChatResponse:()=>({applied:true}),syncSendAvailability(){send.disabled=!field.value.trim()},renderConversation(){},chatErrorPresentation:()=>({message:'failed',status:'failed'}),api:async(url,init)=>{requests.push({url,init});return{ok:true,json:async()=>({reply:'Respuesta de prueba'})}}});
    window.CocoEternaV160.isRequestPending=()=>state.busy;
    const start=core.indexOf('  async function send(options){'),end=core.indexOf('  async function feedback(',start);
    assert.ok(start>0&&end>start);vm.runInContext(core.slice(start,end),context);send.onclick=()=>context.send();
  }
  return{window,document,ctx,field,send,mic,label,courseNode,requests,recorders,streams,sent,
    set busy(v){requestPending=v},set blockSend(v){blockSend=v},voice:v=>{voiced=v},event:(name,e)=>emit(listeners,name,e),
    hide(){document.hidden=true;emit(docListeners,'visibilitychange')},close(){classes.delete('is-open');emit(listeners,'coco:eterna-context-invalidated')},
    start:async()=>{await window.__test.start();await flush()},
    transcribe:()=>window.__test.transcribe(new Blob(['synthetic']), 'audio/mp4',window.__test.newTurn()),
    async advance(ms){const end=now+ms;let guard=0;for(;;){let next=null;for(const [id,t]of timers)if(t.at<=end&&(!next||t.at<next[1].at))next=[id,t];if(!next)break;assert.ok(++guard<20000,'timer loop');now=next[1].at;timers.delete(next[0]);next[1].fn();await flush()}now=end;await flush()}
  };
}
async function speakThenPause(h,pause){await h.start();await h.advance(800);h.voice(true);await h.advance(400);h.voice(false);await h.advance(pause-80);assert.equal(h.recorders[0].stops,0);await h.advance(150)}
for(const [course,pause]of [['Infantil · 0–2 años',2000],['Infantil · 3 años',2000],['Infantil · 5 años',2000],['1º de Primaria',2000],['3º de Primaria',2000],['4º de Primaria',1500],['6º de Primaria',1500],['1º de ESO',1200],['3º de ESO',1200],['4º de ESO',1000],['2º de Bachillerato',1000],['Configura tu curso',2000]]){
  test('auto-send silence window '+course+' = '+pause+' ms',async()=>{const h=harness({course});assert.equal(h.window.__test.silenceMs(),pause);await speakThenPause(h,pause);assert.equal(h.send.clicks,1);assert.equal(h.requests.length,1);assert.equal(h.sent[0],'Explícame los números primos');assert.equal(h.recorders[0].stops,1);assert.ok(h.streams[0].stopped>0);await h.advance(50000);assert.equal(h.send.clicks,1)})
}
test('speech resuming within the pause cancels the pending stop',async()=>{const h=harness();await h.start();await h.advance(800);h.voice(true);await h.advance(400);h.voice(false);await h.advance(1100);h.voice(true);await h.advance(500);assert.equal(h.send.clicks,0);h.voice(false);await h.advance(1400);assert.equal(h.send.clicks,0);await h.advance(200);assert.equal(h.send.clicks,1)});
test('empty and error transcripts do not submit',async()=>{for(const response of [reply(''),reply(' ',200),reply('bad',500)]){const h=harness({response});await h.transcribe();assert.equal(h.send.clicks,0);assert.equal(h.field.value,'')}});
test('no speech records neither a transcription request nor a chat message',async()=>{const h=harness();await h.start();await h.advance(20000);assert.equal(h.requests.length,0);assert.equal(h.send.clicks,0);assert.ok(h.streams[0].stopped>0)});
test('duplicate recorder stop events cannot send twice',async()=>{const h=harness();await speakThenPause(h,1500);await h.recorders[0].onstop();await h.recorders[0].onstop();assert.equal(h.send.clicks,1);assert.equal(h.requests.length,1)});
test('manual stop also submits once without a second Send tap',async()=>{const h=harness();await h.start();h.voice(true);await h.advance(900);await h.start();await h.advance(1);assert.equal(h.send.clicks,1)});
for(const event of ['coco:eterna-context-invalidated','coco:eterna-ui-reset','coco:eterna-close','pagehide']){
  test('cancel recording on '+event,async()=>{const h=harness();await h.start();h.voice(true);await h.advance(1000);h.event(event);await h.advance(3000);assert.equal(h.requests.length,0);assert.equal(h.send.clicks,0)})
}
test('closing while permission is pending releases late microphone stream',async()=>{const d=deferred(),h=harness({permission:d.promise});const p=h.start();await flush();h.close();d.resolve();await p;assert.equal(h.recorders.length,0);assert.ok(h.streams[0].stopped>0);assert.equal(h.send.clicks,0)});
test('rapid starts leave exactly one active recording',async()=>{const d=deferred(),h=harness({permission:d.promise});const a=h.start(),b=h.start();d.resolve();await Promise.all([a,b]);assert.equal(h.recorders.length,1);assert.ok(h.streams[0].stopped>0);h.event('pagehide')});
for(const boundary of ['close','hide','mode','question','user','typing','manual-send','busy']){
  test('late transcription cannot submit after '+boundary,async()=>{const d=deferred(),h=harness({response:d.promise}),p=h.transcribe();await flush();
    if(boundary==='close')h.close();if(boundary==='hide')h.hide();if(boundary==='mode')h.ctx.mode='ask';if(boundary==='question')h.ctx.question_id='new-question';if(boundary==='user')h.ctx.uid='another-user';if(boundary==='typing'){h.field.value='Mi texto';h.field.dispatchEvent(new Event('input'))}if(boundary==='manual-send'){h.field.value='Mi texto';h.send.disabled=false;h.send.click()}if(boundary==='busy')h.busy=true;
    d.resolve(reply());await p;assert.equal(h.send.clicks,boundary==='manual-send'?1:0);if(boundary==='typing')assert.equal(h.field.value,'Mi texto');
  })
}
test('disabled input and busy tutor block a new capture',async()=>{for(const kind of ['input','busy']){const h=harness();if(kind==='input')h.field.disabled=true;else h.busy=true;await h.start();assert.equal(h.streams.length,0)}});
test('automatic Send never overrides a disabled Send button',async()=>{const h=harness();h.blockSend=true;await h.transcribe();assert.equal(h.send.clicks,0);assert.equal(h.send.disabled,true);assert.equal(h.field.value,'Explícame los números primos')});
test('recorder error discards audio',async()=>{const h=harness();await h.start();h.recorders[0].onerror();await h.advance(1);assert.equal(h.requests.length,0);assert.equal(h.send.clicks,0)});
test('canonical unchanged Send handler receives exactly one automatic chat request',async()=>{const h=harness({canonical:true});await speakThenPause(h,1500);await flush();const chats=h.requests.filter(r=>r.url==='/v1/chat');assert.equal(chats.length,1);assert.equal(h.send.clicks,1);const payload=JSON.parse(chats[0].init.body);assert.equal(payload.text,'Explícame los números primos');assert.equal(payload.mode,'explain');assert.equal(payload.client_state_contract,3);assert.equal(payload.session_id,'test-session');assert.equal(h.field.value,'')});

test('asynchronous legal gate accepts the same automatic intent exactly once',async()=>{const h=harness({delayedGate:true});await h.transcribe();assert.equal(h.send.clicks,0);h.send.click();assert.equal(h.send.clicks,1)});
test('close during the existing legal gate prevents its delayed automatic replay',async()=>{const h=harness({delayedGate:true});await h.transcribe();h.close();h.send.click();assert.equal(h.send.clicks,0)});
test('new activity during the legal gate prevents its delayed automatic replay',async()=>{const h=harness({delayedGate:true});await h.transcribe();h.ctx.session_id='another-session';h.event('coco:eterna-context-invalidated');h.send.click();assert.equal(h.send.clicks,0)});

// A stopped recording still owns its transcription until the one automatic Send.
test('a late microphone click cannot discard an in-flight transcription',async()=>{const d=deferred(),h=harness({response:d.promise}),p=h.transcribe();await flush();await h.start();assert.equal(h.streams.length,0);assert.equal(h.requests[0].init.signal.aborted,false);d.resolve(reply());await p;assert.equal(h.send.clicks,1)});
test('repeated late microphone clicks cannot restart capture or duplicate Send',async()=>{const d=deferred(),h=harness({response:d.promise}),p=h.transcribe();await flush();for(let i=0;i<5;i++)await h.start();d.resolve(reply());await p;assert.equal(h.streams.length,0);assert.equal(h.send.clicks,1);assert.equal(h.requests.length,1)});
test('pending legal replay keeps ownership until the automatic send is resolved',async()=>{const h=harness({delayedGate:true});await h.transcribe();await h.start();assert.equal(h.streams.length,0);h.send.click();assert.equal(h.send.clicks,1)});
test('closing during transcription still cancels rather than sending stale audio',async()=>{const d=deferred(),h=harness({response:d.promise}),p=h.transcribe();await flush();h.close();assert.equal(h.requests[0].init.signal.aborted,true);d.resolve(reply());await p;assert.equal(h.send.clicks,0)});
test('cache delivers the legacy monitor and the new owner as one release',()=>{const s=readFileSync(new URL('../../sw.js',import.meta.url),'utf8');assert.ok(s.includes('ETERNA_VOICE_AUTOCUT_PATH="./eterna-voice-autocut-v160907.js"'));assert.ok(s.includes('ETERNA_MIC_ONLY_PATH,ETERNA_VOICE_AUTOCUT_PATH,'));assert.ok(s.includes('cachedPatch(ETERNA_VOICE_AUTOCUT_PATH)'))});

test('missing endpoint releases ownership so a corrected configuration can retry',async()=>{const h=harness();h.window.COCO_CONFIG.eternaEndpoint='';await h.transcribe();assert.equal(h.send.clicks,0);h.window.COCO_CONFIG.eternaEndpoint='https://voice.invalid';await h.start();assert.equal(h.streams.length,1);h.event('pagehide')});
test('missing session releases ownership so renewed authorization can retry',async()=>{const h=harness();h.window.__COCO_SUPABASE_CLIENT.auth.getSession=async()=>({data:{session:null}});await h.transcribe();assert.equal(h.send.clicks,0);h.window.__COCO_SUPABASE_CLIENT.auth.getSession=async()=>({data:{session:{access_token:'test-token'}}});await h.start();assert.equal(h.streams.length,1);h.event('pagehide')});
