"""Actual SW lifecycle: verify the upgraded renderer, report cache residue without mislabelling it."""
from pathlib import Path
import http.server,threading,shutil,json,hashlib
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'reply-actions-live-evidence';OUT.mkdir(exist_ok=True)
new_sw=(ROOT/'sw.js').read_bytes();old_sw=new_sw.replace(b'coco-en-forma-v160.99.4-reply-actions-r1',b'coco-en-forma-v160.99.3-mic-pwa-capture-r1')
new_core=(ROOT/'eterna-v159.js').read_bytes();old_core=b'/* OLD_CORE_CACHE_FIXTURE */ var old_reply_button="<button data-et-listen>Escuchar</button>";'
state={'updated':False};requests=[]
class Handler(http.server.BaseHTTPRequestHandler):
 def log_message(self,*args):pass
 def do_GET(self):
  path=self.path.split('?')[0]
  if path=='/sw.js':body=new_sw if state['updated'] else old_sw;mime='application/javascript'
  elif path=='/eterna-v159.js':body=new_core if state['updated'] else old_core;mime='application/javascript'
  elif path in ('/','/index.html'):body=b'<!doctype html><title>Isolated PWA update test</title>';mime='text/html'
  else:body=b'/* inert public-asset fixture */';mime='application/javascript'
  requests.append({'path':self.path,'updated':state['updated']})
  self.send_response(200);self.send_header('Content-Type',mime);self.send_header('Cache-Control','no-store');self.end_headers();self.wfile.write(body)
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Handler);threading.Thread(target=server.serve_forever,daemon=True).start()
origin='http://127.0.0.1:'+str(server.server_port)
report={'status':'started','actual_service_worker_script':True,'environment':'Chromium loopback, inert peripheral assets, no real users','physical_iphone':False,'production_changed':False}
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path=shutil.which('chromium') or None,args=['--no-sandbox'])
  context=browser.new_context(service_workers='allow');page=context.new_page();page.goto(origin)
  page.evaluate("async()=>{await navigator.serviceWorker.register('/sw.js?v=160980-r1',{scope:'/',updateViaCache:'none'});await navigator.serviceWorker.ready}")
  page.wait_for_function('!!navigator.serviceWorker.controller')
  old=page.evaluate("async()=>(await fetch('/eterna-v159.js?v=160980')).text()")
  assert 'OLD_CORE_CACHE_FIXTURE' in old;report['initially_cached_old_core']=True
  state['updated']=True
  page.evaluate("""async()=>{
   const previous=navigator.serviceWorker.controller;
   const changed=new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(new Error('Replacement controller did not activate')),25000);
    const listener=()=>{if(navigator.serviceWorker.controller!==previous){clearTimeout(timer);navigator.serviceWorker.removeEventListener('controllerchange',listener);resolve(true)}};
    navigator.serviceWorker.addEventListener('controllerchange',listener);
   });
   const r=await navigator.serviceWorker.getRegistration();await r.update();await changed;
  }""")
  report['controller_change_event_awaited']=True
  # Old in-flight fetches may reopen their named cache. Record it; the effective renderer is the acceptance condition.
  report['caches_after_controller_change']=page.evaluate('async()=>await caches.keys()')
  assert 'coco-en-forma-v160.99.4-reply-actions-r1' in report['caches_after_controller_change']
  page.reload();page.wait_for_function('!!navigator.serviceWorker.controller')
  report['navigation_reload_tested']=True;report['core_responses']=[]
  for suffix in ['?v=160980','?v=160994-reply-actions-r1']:
   fresh=page.evaluate("async suffix=>(await fetch('/eterna-v159.js'+suffix)).text()",suffix)
   row={'asset_query':suffix,'bytes':len(fresh.encode()),'sha256':hashlib.sha256(fresh.encode()).hexdigest(),'starts_with_exact_patched_core':fresh.startswith(new_core.decode()),'old_fixture_present':'OLD_CORE_CACHE_FIXTURE' in fresh}
   report['core_responses'].append(row)
   assert row['starts_with_exact_patched_core'] and not row['old_fixture_present'],row
   for marker in ['<button type="button" data-et-hint>','<button type="button" data-et-listen>','<button type="button" data-et-listen-slow']:assert marker not in fresh
   assert 'async function speak(' in fresh and 'data-et-mic' in fresh
  report['status']='upgraded_renderer_verified';report['removed_button_markup_absent']=True;report['microphone_and_speech_source_retained']=True
  context.close();browser.close()
except Exception as e:
 report['status']='failed';report['error']=str(e);raise
finally:
 report['fixture_requests']=requests
 (OUT/'sw-update.json').write_text(json.dumps(report,indent=2));server.shutdown()
print(json.dumps({k:v for k,v in report.items()if k!='fixture_requests'}))
