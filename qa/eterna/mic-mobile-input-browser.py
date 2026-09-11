# Native WebAudio and MediaRecorder; synthetic input and mock API, never a child's recording.
from playwright.sync_api import sync_playwright
from pathlib import Path
import argparse,json,shutil
root=Path(__file__).resolve().parents[2]
parser=argparse.ArgumentParser();parser.add_argument('--engine',choices=['chromium','webkit'],default='chromium');parser.add_argument('--baseline-dir');parser.add_argument('--output',default='mic-mobile-input-browser.json');args=parser.parse_args()
# Reuse the full-module fixture (identity, legal gate, mock API) from the previous regression.
previous=(root/'qa/eterna/mic-single-owner-browser.py').read_text()
seed=previous.split("seed=r'''",1)[1].split("'''\ndef original",1)[0]
begin=seed.index('let streamCount=0;');end=seed.index('window.qaVoice=false;',begin)
seed=seed[:begin]+r'''
window.NativeAudioContext=window.AudioContext||window.webkitAudioContext;window.signalGain=null;window.signalContext=null;window.signalStreams=[];
Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:async()=>{
 mark('getUserMedia',signalStreams.length+1);
 const ctx=new NativeAudioContext(),osc=ctx.createOscillator(),gain=ctx.createGain(),dest=ctx.createMediaStreamDestination();
 osc.frequency.value=230;gain.gain.value=0;osc.connect(gain);gain.connect(dest);osc.start();await ctx.resume();
 signalGain=gain;signalContext=ctx;signalStreams.push({ctx,stream:dest.stream,osc});return dest.stream;
}}});
window.setSignal=function(on){qaVoice=on;if(signalGain)signalGain.gain.setValueAtTime(on?window.testVolume:0,signalContext.currentTime)};
window.stopTestFeed=async function(){for(const f of signalStreams){f.osc.stop();await f.ctx.close()}signalStreams=[];signalGain=null;signalContext=null};window.testVolume=.006;
'''+seed[end:]
seed=seed.replace('window.transcriptionDelay||1800','window.transcriptionDelay||80')
seed=seed.replace("if(String(url).includes('/v1/transcribe')){", "if(String(url).includes('/v1/transcribe')){var b=opts.body.get('audio');mark('audio-upload',{size:b.size,type:b.type});")
with sync_playwright() as p:
    opts={'headless':True}
    if args.engine=='chromium':
        executable=shutil.which('chromium') or shutil.which('google-chrome') or shutil.which('chromium-browser')
        if executable:opts['executable_path']=executable
        opts['args']=['--no-sandbox','--autoplay-policy=no-user-gesture-required']
    browser=getattr(p,args.engine).launch(**opts)
    page=browser.new_page(viewport={'width':393,'height':852})
    page.set_content('<html><head></head><body></body></html>');page.evaluate(seed)
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.add_script_tag(content=(root/'eterna-state-contract-v3.js').read_text())
    core=(root/'eterna-v159.js').read_text().replace('  window.CocoEternaV160=Object.freeze({','  window.__qa={state,overlay,setMode,render};\n  window.CocoEternaV160=Object.freeze({')
    page.add_script_tag(content=core)
    page.add_script_tag(content=(root/'eterna-voice-autocut-v160907.js').read_text())
    mic=Path(args.baseline_dir)/'eterna-mic-only-v4.js' if args.baseline_dir else root/'eterna-mic-only-v4.js'
    page.add_script_tag(content=mic.read_text())
    page.add_script_tag(content=(root/'eterna-experience-v160.js').read_text())
    page.evaluate("""() => {Object.assign(__qa.state,{session:testSession,client:__COCO_SUPABASE_CLIENT,baseProfile:{edad:10,apodo:'Prueba',rol:'propietario'},profile:{stage:'primaria',school_year:'5º de Primaria',ccaa:'Andalucía'},subscription:{status:'active'},parentSettings:{allow_audio_input:true}});const o=__qa.overlay();o.classList.add('is-open');__qa.setMode('explain',false);o.querySelector('[data-et-course]').textContent='5º de Primaria';o.querySelector('[data-et-composer]').style.display='block';}""")
    page.wait_for_timeout(150);cases=[]
    modes=['explain','exam'] if args.baseline_dir else ['explain','exam','practice','ask','review','homework','exam','review','ask','practice','homework','explain']
    for i,mode in enumerate(modes):
        print('START',i,mode,flush=True)
        page.evaluate('(mode)=>__qa.setMode(mode,false)',mode);page.wait_for_timeout(100)
        page.evaluate('trace=[]');page.evaluate('(v)=>testVolume=v',.05 if i==0 else .006)
        target='[data-et-mic]' if i%2==0 else '[data-et-startaction="voice"]'
        page.locator(target).click(force=True);page.wait_for_timeout(350)
        page.evaluate('setSignal(true)');page.wait_for_timeout(900);page.evaluate('setSignal(false)')
        page.wait_for_timeout(12800 if args.baseline_dir and i==1 else 3000)
        trace=page.evaluate('trace');chats=[x for x in trace if x['kind']=='chat-body'];uploads=[x['data'] for x in trace if x['kind']=='audio-upload'];status=page.locator('[data-et-status]').inner_text()
        if args.baseline_dir and i==1:
            assert len(chats)==0 and 'No he oído voz' in status,(mode,status,len(chats));outcome='REPRODUCED quiet signal discarded before transcription'
        else:
            assert len(chats)==1,(mode,status,len(chats),errors,trace[-8:])
            payload=json.loads(chats[0]['data']);assert payload['mode']==mode;assert payload['text']=='Explícame los números primos';assert len(uploads)==1 and uploads[0]['size']>=900
            outcome='PASS one native recording, one upload, one canonical send'
        assert page.evaluate('signalStreams.every(s=>s.stream.getTracks().every(t=>t.readyState==="ended"))'),'microphone stream leaked'
        cases.append({'mode':mode,'entry':target,'amplitude':.05 if i==0 else .006,'outcome':outcome,'uploads':uploads,'chat_requests':len(chats)})
        print(mode,outcome,flush=True);page.evaluate('stopTestFeed()')
    assert not errors,errors
    browser.close()
report={'engine':args.engine,'baseline':bool(args.baseline_dir),'native_audio_context':True,'native_media_recorder':True,'synthetic_input':'230Hz tone; not a physical microphone','network':'mocked, no child data, no production request','cases':cases,'errors':errors}
Path(args.output).write_text(json.dumps(report,ensure_ascii=False,indent=2))
