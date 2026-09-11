# Browser integration for the real microphone and legacy-autocut modules.
# Only media input and network responses are simulated. No child data or live API calls.
from playwright.sync_api import sync_playwright
from pathlib import Path
import argparse, json, shutil, subprocess
root=Path(__file__).resolve().parents[2]
parser=argparse.ArgumentParser();parser.add_argument('--baseline-ref',default='699ee9b8ea433bdb02edfcff23bed27993e6bb08');parser.add_argument('--output',default='mic-single-owner-browser.json');parser.add_argument('--case',type=int,choices=range(5));args=parser.parse_args()
seed=r'''() => {
for(const key of ['localStorage','sessionStorage']){const map={};Object.defineProperty(window,key,{value:{getItem:k=>map[k]||null,setItem:(k,v)=>map[k]=String(v),removeItem:k=>delete map[k]},configurable:true})};window.trace=[];window.mark=(kind,data)=>trace.push({t:Math.round(performance.now()),kind,data});
const oldClick=HTMLElement.prototype.click;HTMLElement.prototype.click=function(){mark('programmatic-click',{tag:this.tagName,attr:this.outerHTML.slice(0,180),stack:new Error().stack.slice(0,950)});return oldClick.call(this)};
const oldAdd=EventTarget.prototype.addEventListener;EventTarget.prototype.addEventListener=function(n,fn,opt){return oldAdd.call(this,n,fn,opt)};
window.COCO_CONFIG={eternaEndpoint:'https://fake.invalid',url:'https://fake.invalid',clave:'public-test'};
window.testSession={access_token:'synthetic-test-token',user:{id:'qa-synthetic',email:'qa@example.invalid'}};
window.__COCO_SUPABASE_CLIENT={auth:{getSession:async()=>({data:{session:testSession}}),onAuthStateChange:()=>{},refreshSession:async()=>({data:{session:testSession}})},from:(name)=>{const x={data:name==='perfiles'?{edad:10,apodo:'Prueba',rol:'propietario'}:{stage:'primaria',school_year:'5º de Primaria',ccaa:'Andalucía'}};for(const m of ['select','eq','maybeSingle','single','limit','order'])x[m]=()=>x;return x}};
window.fetch=async(url,opts)=>{mark('fetch',String(url));
 if(String(url).includes('/v1/transcribe')){await new Promise(r=>setTimeout(r,window.transcriptionDelay||1800));mark('transcript-return',null);return new Response(JSON.stringify({text:'Explícame los números primos'}),{headers:{'Content-Type':'application/json'}})}
 if(String(url).includes('/v1/legal-consent'))return new Response(JSON.stringify({accepted:true,required:true,backend_available:true}));
 if(String(url).includes('/v1/chat-job'))return new Response('{}',{status:404});
 if(String(url).endsWith('/v1/chat')){mark('chat-body',opts.body);return new Response(JSON.stringify({error:'TEST_CHAT_SENT'}),{status:400})}
 return new Response('{}');};
let streamCount=0;
Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:async()=>{streamCount++;mark('getUserMedia',streamCount);const s={active:true,getTracks:()=>[{stop:()=>{s.active=false;mark('track-stop',streamCount)}}]};return s}}});
window.MediaRecorder=class{static isTypeSupported(t){return t==='audio/mp4'}constructor(stream,o){this.stream=stream;this.mimeType=o?.mimeType||'audio/mp4';this.state='inactive';mark('recorder-construct',null)}start(){this.state='recording';mark('recorder-start',null)}stop(){this.state='inactive';mark('recorder-stop',null);setTimeout(()=>{this.ondataavailable?.({data:new Blob([new Uint8Array(2048)],{type:this.mimeType})});this.onstop?.()},0)}};
window.AudioContext=class{state='running';constructor(){this.stream=null}createMediaStreamSource(s){this.stream=s;return{connect(){}}}createAnalyser(){return{fftSize:1024,getByteTimeDomainData:(a)=>a.fill(window.qaVoice&&this.stream?.active?144:128)}}close(){this.state='closed';return Promise.resolve()}resume(){this.state='running';return Promise.resolve()}};
window.qaVoice=false;
new MutationObserver(ms=>{for(const m of ms){if(m.target.matches?.('[data-et-status]'))mark('status',m.target.textContent)}}).observe(document,{childList:true,subtree:true});
}'''
def original(name):
    return subprocess.check_output(['git','show',args.baseline_ref+':'+name],cwd=root,text=True)
def run_case(playwright,name,legacy_first=True,full_experience=False,baseline=False,stale_legacy=False):
    print('CASE',name,flush=True)
    executable=shutil.which('chromium') or shutil.which('google-chrome') or shutil.which('chromium-browser')
    browser=playwright.chromium.launch(executable_path=executable,headless=True,args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':393,'height':852})
    page.set_content('<html><head></head><body></body></html>');page.evaluate(seed)
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.add_script_tag(content=(root/'eterna-state-contract-v3.js').read_text())
    core=(root/'eterna-v159.js').read_text().replace('  window.CocoEternaV160=Object.freeze({','  window.__qa={state,overlay,setMode,render};\n  window.CocoEternaV160=Object.freeze({')
    page.add_script_tag(content=core)
    old='eterna-voice-autocut-v160907.js';mic='eterna-mic-only-v4.js'
    for filename in ([old,mic] if legacy_first else [mic,old]):
        src=original(filename) if baseline or (filename==old and stale_legacy) else (root/filename).read_text()
        page.add_script_tag(content=src)
    if full_experience:page.add_script_tag(content=(root/'eterna-experience-v160.js').read_text())
    page.evaluate('''() => {Object.assign(__qa.state,{session:testSession,client:__COCO_SUPABASE_CLIENT,baseProfile:{edad:10,apodo:'Prueba',rol:'propietario'},profile:{stage:'primaria',school_year:'5º de Primaria',ccaa:'Andalucía'},subscription:{status:'active'},parentSettings:{allow_audio_input:true}});const o=__qa.overlay();o.classList.add('is-open');__qa.setMode('explain',false);o.querySelector('[data-et-course]').textContent='5º de Primaria';o.querySelector('[data-et-composer]').style.display='block';}''')
    page.wait_for_timeout(250)
    page.evaluate("document.querySelector('[data-et-mic]').click()")
    page.wait_for_timeout(850);page.evaluate('qaVoice=true');page.wait_for_timeout(650);page.evaluate('qaVoice=false')
    page.wait_for_timeout(5800)
    trace=page.evaluate('trace');browser.close()
    starts=sum(x['kind']=='recorder-start' for x in trace)
    chats=[x for x in trace if x['kind']=='chat-body']
    statuses=[x['data'] for x in trace if x['kind']=='status']
    has_transcription=any('Transcribiendo' in s for s in statuses)
    assert has_transcription,(name,statuses)
    if baseline:
        assert starts>=2 and len(chats)==0,(name,starts,len(chats))
        outcome='REPRODUCED: listening > transcribing > listening; zero chat requests'
    else:
        assert starts==1 and len(chats)==1,(name,starts,len(chats),errors)
        payload=json.loads(chats[0]['data']);assert payload['text']=='Explícame los números primos'
        assert payload['client_state_contract']==3
        first=next(i for i,s in enumerate(statuses) if 'Transcribiendo' in s)
        assert not any(s.startswith('Escuchando') for s in statuses[first+1:]),(name,statuses)
        assert not errors,(name,errors)
        outcome='PASS: one recording, one transcription, one canonical chat request, no restart'
    # The trace contains only synthetic fixture data and identifiers.
    print('DONE',name,outcome,flush=True)
    return {'case':name,'outcome':outcome,'recordings':starts,'chat_requests':len(chats),'statuses':statuses,'browser_errors':errors}
with sync_playwright() as p:
    executable=shutil.which('chromium') or shutil.which('google-chrome') or shutil.which('chromium-browser')
    assert executable,'Chromium/Chrome is required for real DOM integration tests'
    specs=[('published baseline with legacy fallback',{'baseline':True}),('corrected legacy before new controller',{}),('corrected new controller before legacy',{'legacy_first':False}),('corrected with complete experience and actual legal replay',{'full_experience':True}),('corrected microphone protects pending transcript even with a stale legacy script',{'stale_legacy':True})]
    selected=specs if args.case is None else [specs[args.case]]
    cases=[run_case(p,name,**options) for name,options in selected]
report={'browser':'Chromium','media':'simulated speech activity','network':'synthetic transcribe and chat responses; no live API calls','baseline_bug_reproduced':any(c['outcome'].startswith('REPRODUCED') for c in cases),'fixed_scenarios_passed':sum(c['outcome'].startswith('PASS') for c in cases),'cases':cases}

Path(args.output).write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps(report,ensure_ascii=False,indent=2))
