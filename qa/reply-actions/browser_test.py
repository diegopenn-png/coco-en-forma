"""Actual ETERNA renderers; isolated synthetic state, no real users or backend calls."""
from pathlib import Path
import json,shutil
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'reply-actions-evidence';OUT.mkdir(exist_ok=True)
core=(ROOT/'eterna-v159.js').read_text();marker='  window.CocoEternaV160=Object.freeze({'
assert core.count(marker)==1
core=core.replace(marker,'  window.__replyActionsQA={state,overlay,appendMessage,renderConversation,renderModeBar};\n'+marker)
errors=[];results=[]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path=shutil.which('chromium') or None,args=['--no-sandbox'])
 for width,height in [(390,844),(820,1180),(1440,1000)]:
  context=browser.new_context(viewport={'width':width,'height':height},service_workers='block')
  context.route('**/*',lambda r:r.abort())
  page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content('<html><head><meta charset="UTF-8"></head><body></body></html>')
  page.evaluate('''() => {
   for(const key of ['localStorage','sessionStorage']){const values={};Object.defineProperty(window,key,{configurable:true,value:{getItem:k=>values[k]||null,setItem:(k,v)=>values[k]=String(v),removeItem:k=>delete values[k]}})}
   window.COCO_CONFIG={eternaEndpoint:'https://example.invalid',url:'https://example.invalid',clave:'synthetic'};
   window.fetch=async()=>new Response('{}',{status:404,headers:{'Content-Type':'application/json'}});
   window.__COCO_SUPABASE_CLIENT={auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange:()=>{}}};
  }''')
  page.add_style_tag(content=(ROOT/'eterna-v159.css').read_text())
  page.add_script_tag(content=(ROOT/'eterna-state-contract-v3.js').read_text())
  page.add_script_tag(content=core)
  for f in ['eterna-experience-v160.js','coco-release-v160903.js','eterna-desktop-compact-v160907.js']:
   page.add_script_tag(content=(ROOT/f).read_text())
  for mode in ['homework','ask','review','explain','exam','practice']:
   page.evaluate('''mode=>{
    const q=__replyActionsQA,s=q.state;s.mode=mode;s.baseProfile={apodo:'Prueba',edad:10};s.profile={school_year:'5º de Primaria',stage:'primaria'};
    s.activities[mode]={contract_version:3,mode,session_id:'session:synthetic',question_id:'question:synthetic',phase:'WAIT',question_number:1,correct_count:0,incorrect_count:0,difficulty:1};
    const o=q.overlay();o.classList.add('is-open');q.renderModeBar();const chat=o.querySelector('[data-et-chat]');chat.innerHTML='';
    const meta={verification_status:'verified',subject:'Matemáticas',question_id:'question:synthetic'};
    q.appendMessage('assistant','¿Cuánto es el 10 % de 280?\\nA) 28\\nB) 38\\nC) 33',meta,false,true);
    s.history=[{role:'assistant',text:'Pregunta de una actividad anterior.',meta:{...meta,question_id:'question:older'}},{role:'user',text:'Otra ronda'},{role:'assistant',text:'¿Cuánto es el 10 % de 280?\\nA) 28\\nB) 38\\nC) 33',meta}];
   }''',mode)
   page.wait_for_timeout(60)
   removed='#eternaOverlayV159 [data-et-hint],#eternaOverlayV159 [data-et-listen],#eternaOverlayV159 [data-et-listen-slow]'
   assert page.locator(removed).count()==0,mode
   assert page.locator('[data-et-copy]').count()==1
   assert page.locator('[data-et-mic]').count()==1
   assert page.locator('[data-et-send]').count()==1
   assert page.locator('[data-et-camera]').count()==1
   if mode in ('exam','practice'):assert page.locator('.eternaV159Quick').count()==0
   else:assert page.locator('[data-et-understood]').count()==1
   page.evaluate("__replyActionsQA.renderConversation(__replyActionsQA.overlay().querySelector('[data-et-chat]'))")
   assert page.locator(removed).count()==0
   assert page.locator('[data-et-copy]').count()==2
   if mode in ('exam','practice'):assert page.locator('.eternaV159Quick').count()==0
   page.locator('[data-et-input]').fill('Una pista, por favor')
   assert page.locator('[data-et-input]').input_value()=='Una pista, por favor'
   results.append({'viewport':width,'mode':mode,'three_buttons_absent_in_dom':True,'history_repaint_passed':True,'copy_camera_mic_send_preserved':True,'text_input_preserved':True,'empty_toolbar_absent':mode in ('exam','practice')})
  page.screenshot(path=str(OUT/f'without-reply-buttons-{width}.png'))
  context.close()
 browser.close()
assert not errors,errors
report={'scenarios':len(results),'browser':'Chromium','physical_iphone_tested':False,'real_users_used':False,'live_audio_capture_tested':False,'errors':errors,'results':results}
(OUT/'browser.json').write_text(json.dumps(report,indent=2));print(json.dumps({'scenarios':len(results),'errors':errors,'three_buttons_removed_in_all_six_modes':True}))
