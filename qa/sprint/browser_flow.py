"""Actual client and Worker state in real Chromium; synthetic database, no live pupil data."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import argparse,json,shutil,subprocess
ROOT=Path(__file__).resolve().parents[2]
ap=argparse.ArgumentParser();ap.add_argument('--output',default='sprint-ui-evidence');args=ap.parse_args();OUT=Path(args.output);OUT.mkdir(exist_ok=True,parents=True)
seed=r'''() => {
for(const key of ['localStorage','sessionStorage']){const map={};Object.defineProperty(window,key,{value:{getItem:k=>map[k]||null,setItem:(k,v)=>map[k]=String(v),removeItem:k=>delete map[k]},configurable:true})};window.trace=[];window.qaCourse='5º de Primaria';window.COCO_CONFIG={eternaEndpoint:'https://qa-sprint.invalid',url:'https://qa-sprint.invalid',clave:'synthetic-public'};
window.testSession={access_token:'test-synthetic',user:{id:'student-test',email:'adult@example.invalid'}};
window.__COCO_SUPABASE_CLIENT={auth:{getSession:async()=>({data:{session:testSession}}),onAuthStateChange:()=>{},refreshSession:async()=>({data:{session:testSession}})},from:(name)=>{const x={data:name==='perfiles'?{edad:10,apodo:'Prueba',rol:'propietario'}:{stage:'primaria',school_year:qaCourse,autonomous_community:'Andalucía'}};for(const m of ['select','eq','maybeSingle','single','limit','order'])x[m]=()=>x;return x}};
window.fetch=async(url,opts={})=>{
 const path=String(url);
 if(path.includes('/v1/legal-consent'))return new Response(JSON.stringify({accepted:true,required:true,backend_available:true}),{headers:{'Content-Type':'application/json'}});
 if(path.includes('/v1/chat-job'))return new Response('{}',{status:404,headers:{'Content-Type':'application/json'}});
 if(path.endsWith('/v1/chat')){
  const body=JSON.parse(opts.body);trace.push({kind:'request',body});
  const r=await window.qaBackend({year:qaCourse,body});const data=r.data;trace.push({kind:'response',data,status:r.status});return new Response(JSON.stringify(data),{status:r.status,headers:{'Content-Type':'application/json'}});
 }
 throw Error('Unplanned browser fetch '+path);
};
}'''
bridge=subprocess.Popen(['node',str(ROOT/'qa/sprint/browser_bridge.mjs')],cwd=ROOT,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,bufsize=1)
assert json.loads(bridge.stdout.readline())['ready']
def exchange(payload):
 bridge.stdin.write(json.dumps(payload,ensure_ascii=False)+'\n');bridge.stdin.flush();line=bridge.stdout.readline()
 assert line,line
 return json.loads(line)
results=[];errors=[]
with sync_playwright() as p:
 exe=shutil.which('chromium') or shutil.which('google-chrome')
 browser=p.chromium.launch(headless=True,args=['--no-sandbox'],**({'executable_path':exe} if exe else {}))
 for viewport in [{'width':1440,'height':1000},{'width':390,'height':844}]:
  context=browser.new_context(viewport=viewport,service_workers='block');page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
  page.expose_function('qaBackend',exchange);page.set_content('<html><head><meta charset="UTF-8"></head><body></body></html>');page.evaluate(seed)
  page.add_script_tag(content=(ROOT/'eterna-state-contract-v3.js').read_text())
  core=(ROOT/'eterna-v159.js').read_text();needle='  window.CocoEternaV160=Object.freeze({';assert core.count(needle)==1
  page.add_script_tag(content=core.replace(needle,'  window.__qa={state,overlay,setMode,render};\n'+needle))
  page.add_script_tag(content=(ROOT/'eterna-experience-v160.js').read_text());page.add_script_tag(content=(ROOT/'eterna-worker/src/library/procedural-v1.js').read_text())
  page.evaluate('''() => {Object.assign(__qa.state,{session:testSession,client:__COCO_SUPABASE_CLIENT,baseProfile:{edad:10,apodo:'Prueba',rol:'propietario'},profile:{stage:'primaria',school_year:qaCourse,autonomous_community:'Andalucía'},subscription:{status:'active'},parentSettings:{allow_audio_input:true}});const o=__qa.overlay();o.classList.add('is-open');o.querySelector('[data-et-course]').textContent=qaCourse;o.querySelector('[data-et-composer]').style.display='block';}''')
  def send(text):
   before=page.evaluate("trace.filter(t=>t.kind==='response').length")
   page.locator('[data-et-input]').fill(text);page.locator('[data-et-send]').click(timeout=5000)
   page.wait_for_function("n => trace.filter(t=>t.kind==='response').length>n && !__qa.state.busy",arg=before,timeout=12000)
   row=page.evaluate("trace.filter(t=>t.kind==='response').at(-1)");assert row['status']==200,row
   assert row['data'].get('generation_model_calls')==0,row
   assert page.evaluate("trace.filter(t=>t.kind==='response').length")==before+1,'duplicate send'
   return row['data']
  for mode in ['practice','exam']:
   for family in ['sumas','porcentajes']:
    page.evaluate('mode=>__qa.setMode(mode,false)',mode)
    d=send('Dame ejercicios nuevos de '+family);assert d.get('generated_exercise') is True
    first=d['pedagogical_state']['pending_question_id'];n0=d['activity_state']['question_number']
    d=send('una pista');assert d['pedagogical_state']['pending_question_id']==first
    d=send('hola Eterna');assert d['pedagogical_state']['pending_question_id']==first;assert d['activity_state']['question_number']==n0
    for i in range(3):
     key=page.evaluate("args=>EternaProceduralPractice.owned(args.p,{school_year:qaCourse},args.mode)?.question.answer",{'p':d['pedagogical_state'],'mode':mode});assert key
     d=send(key);assert d['student_answer_assessment']=='correct';assert d['activity_state']['correct_count']==i+1
    assert d['activity_state']['phase']=='CLOSE';d=send('otra ronda');assert d.get('generated_exercise') is True;assert d['activity_state']['correct_count']==0;assert d['pedagogical_state']['pending_question_id']!=first
    results.append({'viewport':viewport['width'],'mode':mode,'family':family,'one_send_per_turn':True,'hint_and_greeting_keep_question':True,'three_answers':True,'next_round':True,'model_calls':0})
  for mode in ['homework','ask','review','explain']:
   page.evaluate('mode=>__qa.setMode(mode,false)',mode);d=send('Explícame números primos');assert d.get('library_lesson_id')=='p-prime';assert not d.get('generated_exercise')
   results.append({'viewport':viewport['width'],'mode':mode,'curated_content_preserved':True,'model_calls':0})
  page.screenshot(path=str(OUT/f'eterna-{viewport["width"]}.png'),full_page=True);context.close()
 browser.close()
assert not errors,errors
stats=exchange({'stats':True});bridge.terminate();assert stats['model_calls']==0
report={'scenarios':len(results),'actual_browser':'Chromium','ui':'actual ETERNA scripts with test-only state exposure','backend':'actual canonical Worker, synthetic Supabase/auth; no live provider calls','physical_iPhone':False,'microphone_tested':False,'errors':errors,'stats':stats,'results':results}
(OUT/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps(report,ensure_ascii=False))
