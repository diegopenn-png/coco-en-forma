"""Unmodified ETERNA UI + exact Worker, synthetic auth/DB, no AI calls.
PWA viewport emulation is not a physical iPhone/Safari test.
"""
import json,time,urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[2];out=root/'library-integration-evidence';out.mkdir(exist_ok=True)
base='http://127.0.0.1:4189'
seed=r'''() => {
 window.__auditTurns=[];
 const session={access_token:'synthetic-test-token',user:{id:'student-test',email:'adult@example.invalid'}};
 const rows={perfiles:{apodo:'Prueba',edad:10,rol:'usuario'},eterna_student_profiles:{user_id:'student-test',stage:'primaria',school_year:'5º de Primaria',autonomous_community:'Andalucía',preferred_language:'es'},eterna_subscriptions:{status:'active',plan:'monthly'},eterna_parent_settings:{allow_audio_input:true,allow_image_input:false,voice_enabled:false,max_sessions_per_day:100}};
 const cli={auth:{getSession:async()=>({data:{session}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),refreshSession:async()=>({data:{session}})},from:name=>{let single=false;const x={then(resolve){return Promise.resolve({data:single?(rows[name]||null):(rows[name]?[rows[name]]:[]),error:null}).then(resolve)}};for(const m of ['select','eq','order','limit','gte','lte','is'])x[m]=()=>x;for(const m of ['maybeSingle','single'])x[m]=()=>{single=true;return x};return x}};
 window.COCO_CONFIG={eternaEndpoint:'https://worker.test',url:'https://supabase.test',clave:'public-test'};
 window.supabase={createClient:()=>cli};window.__COCO_SUPABASE_CLIENT=cli;
 const nativeFetch=window.fetch.bind(window);
 window.fetch=async(input,init={})=>{
  const u=new URL(typeof input==='string'?input:input.url,location.href);
  if(u.host==='worker.test'){
   const hr=Object.fromEntries(new Headers(init.headers||{}));
   const r=await nativeFetch('/gateway',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path:u.pathname+u.search,method:init.method||'GET',body:init.body||null,headers:hr})});
   const p=await r.json();if(!p.status)throw Error(p.error||'Local gateway failed');
   let d;try{d=JSON.parse(p.body)}catch{}if(d?.reply)window.__auditTurns.push(d);
   return new Response(p.body,{status:p.status,headers:p.headers});
  }
  if(u.origin===location.origin)return nativeFetch(input,init);
  throw Error('External request blocked during library fixture');
 };
}'''
reports=[]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,args=['--no-sandbox'])
 for name,viewport,mobile in [('desktop',{'width':1440,'height':950},False),('pwa-mobile-emulation',{'width':393,'height':852},True)]:
  urllib.request.urlopen(base+'/reset').read()
  page=browser.new_page(viewport=viewport,is_mobile=mobile,has_touch=mobile)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(base+'/fixture');page.add_style_tag(url=base+'/eterna-v159.css');page.evaluate(seed)
  if mobile:page.evaluate("Object.defineProperty(navigator,'standalone',{value:true,configurable:true})")
  for f in ['eterna-state-contract-v3.js','eterna-v159.js','eterna-hotfix-v160902.js','eterna-mic-only-v4.js','eterna-experience-v160.js','eterna-desktop-compact-v160907.js']:
   page.add_script_tag(url=base+'/'+f)
  page.evaluate('CocoEternaV160.open()');page.locator('[data-et-input]').wait_for(state='visible',timeout=12000)
  scenarios=[]
  def change(mode):
   if mobile:
    page.locator('[data-et-changemode]').click();page.locator('[data-et-modechoice="'+mode+'"]').click()
   else:page.locator('[data-et-mode="'+mode+'"]').click()
  def send(s,route='owned-lesson-v1'):
   before=page.evaluate('__auditTurns.length');start=time.monotonic()
   page.locator('[data-et-input]').fill(s);page.locator('[data-et-send]').click()
   try:page.wait_for_function('n => __auditTurns.length>n&&!CocoEternaV160.isRequestPending()',arg=before,timeout=18000)
   except Exception:
    page.screenshot(path=str(out/(name+'-failure.png')),full_page=True)
    print('Fixture failure:',s,page.locator('[data-et-status]').inner_text(),errors,flush=True)
    print(urllib.request.urlopen(base+'/audit').read().decode()[:12000],flush=True)
    raise
   d=page.evaluate('__auditTurns.at(-1)');elapsed=round((time.monotonic()-start)*1000,1)
   assert d.get('library_route')==route,(s,d.get('library_route'),d.get('reply'))
   assert page.locator('.eternaV159Msg.assistant').count()>0
   assert not page.locator('[data-et-input]').is_disabled()
   scenarios.append({'input':s,'route':route,'elapsed_ms_synthetic_gateway':elapsed,'phase':d.get('activity_state',{}).get('phase'),'question_number':d.get('activity_state',{}).get('question_number')})
   return d
  for mode in ['homework','ask','review','explain','exam','practice']:
   print(name,mode,flush=True);change(mode)
   d=send('números primos')
   assert d['mode_label'] and page.evaluate('CocoEternaV160.getActivityContext().mode')==mode
   if mode=='explain':
    qid=d['pedagogical_state']['pending_question_id'];d=send('más fácil');assert d['pedagogical_state']['pending_question_id']==qid
    d=send('C');assert d['student_answer_assessment']=='correct'
    d=send('hola Eterna','owned-protocol-v1');assert d['pedagogical_state']['pending_question'] is None
   if mode=='exam':
    d=send('C');qid=d['pedagogical_state']['pending_question_id'];n=d['activity_state']['question_number']
    d=send('¿Qué edad tienes?','owned-protocol-v1');assert d['pedagogical_state']['pending_question_id']==qid and d['activity_state']['question_number']==n
    d=send('no');assert d['student_answer_assessment']=='correct'
    d=send('B');assert d['activity_state']['phase']=='CLOSE' and d['activity_state']['correct_count']==3
   if mode=='practice':
    d=send('A');qid=d['pedagogical_state']['pending_question_id'];assert d['student_answer_assessment']=='incorrect'
    d=send('una pista');assert d['pedagogical_state']['pending_question_id']==qid
    d=send('C');assert d['student_answer_assessment']=='correct'
  page.screenshot(path=str(out/(name+'.png')),full_page=True)
  audit=json.loads(urllib.request.urlopen(base+'/audit').read());assert audit['inference_attempts']==0,audit
  assert any(t['path']=='/v1/chat-job' for t in audit['turns']),'Actual PWA background job flow was not exercised'
  assert not errors,errors
  reports.append({'device':name,'browser':'Chromium','app_files_unmodified':True,'actual_chat_job_result_flow':True,'synthetic_auth_database':True,'model_calls':audit['inference_attempts'],'physical_iphone_tested':False,'scenarios':scenarios,'page_errors':errors})
  page.close()
 browser.close()
(out/'ui-report.json').write_text(json.dumps(reports,ensure_ascii=False,indent=2));print(json.dumps({'ui_scenarios':sum(len(x['scenarios'])for x in reports),'models':0,'passed':True}))
