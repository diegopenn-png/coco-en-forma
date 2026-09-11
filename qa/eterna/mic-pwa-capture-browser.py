"""Real Chromium WebAudio/MediaRecorder; synthetic tone, mocked server responses.
Runs all six actual mode handlers sequentially in one page. No user data or live calls.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,shutil,argparse
root=Path(__file__).resolve().parents[2]
ap=argparse.ArgumentParser();ap.add_argument('--baseline-file');ap.add_argument('--output',required=True);args=ap.parse_args()
seed=r'''() => {
for(const key of ['localStorage','sessionStorage']){const map={};Object.defineProperty(window,key,{value:{getItem:k=>map[k]||null,setItem:(k,v)=>map[k]=String(v),removeItem:k=>delete map[k]},configurable:true})};window.trace=[];window.mark=(kind,data)=>trace.push({t:Math.round(performance.now()),kind,data});
const oldClick=HTMLElement.prototype.click;HTMLElement.prototype.click=function(){mark('programmatic-click',{tag:this.tagName,attr:this.outerHTML.slice(0,180),stack:new Error().stack.slice(0,950)});return oldClick.call(this)};
const oldAdd=EventTarget.prototype.addEventListener;EventTarget.prototype.addEventListener=function(n,fn,opt){return oldAdd.call(this,n,fn,opt)};
window.COCO_CONFIG={eternaEndpoint:'https://fake.invalid',url:'https://fake.invalid',clave:'public-test'};
window.testSession={access_token:'synthetic-test-token',user:{id:'qa-synthetic',email:'qa@example.invalid'}};
window.__COCO_SUPABASE_CLIENT={auth:{getSession:async()=>({data:{session:testSession}}),onAuthStateChange:()=>{},refreshSession:async()=>({data:{session:testSession}})},from:(name)=>{const x={data:name==='perfiles'?{edad:10,apodo:'Prueba',rol:'propietario'}:{stage:'primaria',school_year:'5º de Primaria',ccaa:'Andalucía'}};for(const m of ['select','eq','maybeSingle','single','limit','order'])x[m]=()=>x;return x}};
window.fetch=async(url,opts)=>{mark('fetch',String(url));
 if(String(url).includes('/v1/transcribe')){await new Promise(r=>setTimeout(r,100));const blob=opts.body.get('audio');mark('audio-bytes',{size:blob.size,type:blob.type});if(blob.size<900)throw Error('Empty real MediaRecorder fixture');mark('transcript-return',null);return new Response(JSON.stringify({text:'Explícame los números primos'}),{headers:{'Content-Type':'application/json'}})}
 if(String(url).includes('/v1/legal-consent'))return new Response(JSON.stringify({accepted:true,required:true,backend_available:true}));
 if(String(url).includes('/v1/chat-job'))return new Response('{}',{status:404});
 if(String(url).endsWith('/v1/chat')){mark('chat-body',opts.body);return new Response(JSON.stringify({error:'TEST_CHAT_SENT'}),{status:400})}
 return new Response('{}');};
let streamCount=0;
window.synth=new AudioContext();window.synthOsc=synth.createOscillator();synthOsc.frequency.value=250;
window.synthGain=synth.createGain();synthGain.gain.value=0;
window.synthDest=synth.createMediaStreamDestination();synthOsc.connect(synthGain);synthGain.connect(synthDest);synthOsc.start();
window.setSignal=(value)=>synthGain.gain.setValueAtTime(value,synth.currentTime);
Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:async()=>{await synth.resume();streamCount++;mark('getUserMedia',streamCount);return synthDest.stream.clone()}}});
const NativeRecorder=window.MediaRecorder;
window.MediaRecorder=class extends NativeRecorder{start(...args){mark('recorder-start',this.mimeType);return super.start(...args)}stop(){mark('recorder-stop',null);return super.stop()}};

new MutationObserver(ms=>{for(const m of ms){if(m.target.matches?.('[data-et-status]'))mark('status',m.target.textContent)}}).observe(document,{childList:true,subtree:true});
}'''
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=shutil.which('chromium') or shutil.which('google-chrome'),headless=True,args=['--no-sandbox','--autoplay-policy=no-user-gesture-required'])
 page=b.new_page(viewport={'width':393,'height':852});page.set_content('<html><head></head><body></body></html>');page.evaluate(seed)
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.add_script_tag(content=(root/'eterna-state-contract-v3.js').read_text())
 core=(root/'eterna-v159.js').read_text().replace('  window.CocoEternaV160=Object.freeze({','  window.__qa={state,overlay,setMode,render};\n  window.CocoEternaV160=Object.freeze({')
 page.add_script_tag(content=core)
 page.add_script_tag(content=(root/'eterna-voice-autocut-v160907.js').read_text())
 page.add_script_tag(content=(Path(args.baseline_file) if args.baseline_file else root/'eterna-mic-only-v4.js').read_text())
 page.add_script_tag(content=(root/'eterna-experience-v160.js').read_text())
 page.evaluate('''() => {Object.assign(__qa.state,{session:testSession,client:__COCO_SUPABASE_CLIENT,baseProfile:{edad:10,apodo:'Prueba',rol:'propietario'},profile:{stage:'primaria',school_year:'5º de Primaria',ccaa:'Andalucía'},subscription:{status:'active'},parentSettings:{allow_audio_input:true}});const o=__qa.overlay();o.classList.add('is-open');o.querySelector('[data-et-course]').textContent='5º de Primaria';o.querySelector('[data-et-composer]').style.display='block';}''')
 results=[]
 modes=['exam'] if args.baseline_file else ['homework','ask','review','explain','exam','practice']
 for i,mode in enumerate(modes):
  print('START MODE',mode,flush=True)
  page.evaluate("mode => {setSignal(0);__qa.setMode(mode,false);}",mode);page.wait_for_timeout(120)
  print('MODE SET',mode,flush=True)
  before=page.evaluate('trace.length')
  selector='[data-et-mic]' if i%2==0 else '[data-et-startaction="voice"]'
  if page.locator(selector).count()==0: selector='[data-et-mic]'
  print('CLICK',selector,flush=True)
  page.locator(selector).first.click(force=True,timeout=4000)
  print('CLICKED',mode,flush=True)
  page.wait_for_function("document.querySelector('[data-et-mic]').getAttribute('aria-pressed')==='true'",timeout=6000)
  # Quiet source RMS around 0.009, not a boolean analyser stub.
  page.evaluate('setSignal(.013)');page.wait_for_timeout(1600);page.evaluate('setSignal(0)')
  if args.baseline_file:
   page.wait_for_timeout(12000)
  else:
   page.wait_for_function("trace.slice(%d).some(e=>e.kind==='chat-body')"%before,timeout=5500)
   page.wait_for_timeout(300)
  print('READ TRACE',mode,flush=True)
  trace=page.evaluate('n=>trace.slice(n)',before)
  statuses=[x['data'] for x in trace if x['kind']=='status'];chats=[json.loads(x['data']) for x in trace if x['kind']=='chat-body'];starts=[x for x in trace if x['kind']=='recorder-start'];audio=[x['data'] for x in trace if x['kind']=='audio-bytes']
  if args.baseline_file:
   assert len(chats)==0 and any('No he oído voz' in st for st in statuses),(chats,statuses)
  else:
   assert len(chats)==1 and chats[0]['mode']==mode,(mode,chats,statuses)
   assert len(starts)==1 and len(audio)==1,(starts,audio)
   assert not any('No he oído voz' in st for st in statuses),statuses
  results.append({'mode':mode,'entry':selector,'recordings':len(starts),'chat_requests':len(chats),'recorded_audio':audio,'statuses':statuses})
 assert not errors,errors
 b.close()
report={'browser':'Chromium','audio':'actual WebAudio graph and MediaRecorder; synthetic 250 Hz tone','network':'mocked transcribe and chat; no live server calls','baseline_no_voice_reproduced':bool(args.baseline_file),'six_modes_passed':not bool(args.baseline_file),'results':results,'errors':errors}
Path(args.output).write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps(report,ensure_ascii=False,indent=2))
