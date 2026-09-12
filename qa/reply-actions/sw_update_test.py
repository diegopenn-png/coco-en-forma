"""Actual SW lifecycle and core-response routing on an isolated loopback origin."""
from pathlib import Path
import http.server,threading,shutil,json,hashlib
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
new_sw=(ROOT/'sw.js').read_bytes();old_sw=new_sw.replace(b'coco-en-forma-v160.99.4-reply-actions-r1',b'coco-en-forma-v160.99.3-mic-pwa-capture-r1')
new_core=(ROOT/'eterna-v159.js').read_bytes()
old_core=b'/* OLD_CORE_CACHE_FIXTURE */ var old_reply_button="<button data-et-listen>Escuchar</button>";'
state={'updated':False}
class Handler(http.server.BaseHTTPRequestHandler):
 def log_message(self,*args):pass
 def do_GET(self):
  path=self.path.split('?')[0]
  if path=='/sw.js':body=new_sw if state['updated'] else old_sw;mime='application/javascript'
  elif path=='/eterna-v159.js':body=new_core if state['updated'] else old_core;mime='application/javascript'
  elif path in ('/','/index.html'):body=b'<!doctype html><title>Isolated PWA update test</title>';mime='text/html'
  else:body=b'/* inert public-asset fixture */';mime='application/javascript'
  self.send_response(200);self.send_header('Content-Type',mime);self.send_header('Cache-Control','no-store');self.end_headers();self.wfile.write(body)
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Handler);threading.Thread(target=server.serve_forever,daemon=True).start()
origin='http://127.0.0.1:'+str(server.server_port)
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path=shutil.which('chromium') or None,args=['--no-sandbox'])
 context=browser.new_context(service_workers='allow');page=context.new_page();page.goto(origin)
 page.evaluate("async()=>{await navigator.serviceWorker.register('/sw.js?v=160980-r1',{scope:'/',updateViaCache:'none'});await navigator.serviceWorker.ready}")
 page.wait_for_function('!!navigator.serviceWorker.controller')
 old=page.evaluate("async()=>(await fetch('/eterna-v159.js?v=160980')).text()")
 assert 'OLD_CORE_CACHE_FIXTURE' in old
 state['updated']=True
 # A Promise object is not evidence of an activated replacement. Await the lifecycle event explicitly.
 page.evaluate("""async()=>{
  const changed=new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>reject(new Error('Replacement controller did not activate')),25000);
   navigator.serviceWorker.addEventListener('controllerchange',()=>{clearTimeout(timer);resolve(true)},{once:true});
  });
  const r=await navigator.serviceWorker.getRegistration();await r.update();await changed;
 }""")
 keys=page.evaluate('async()=>await caches.keys()')
 assert 'coco-en-forma-v160.99.4-reply-actions-r1' in keys,keys
 assert 'coco-en-forma-v160.99.3-mic-pwa-capture-r1' not in keys,keys
 fresh=page.evaluate("async()=>(await fetch('/eterna-v159.js?v=160980')).text()")
 report={'actual_service_worker_script':True,'initially_cached_old_core':True,'upgrade_installed':True,'old_cache_deleted':True,'old_asset_url_serves_updated_core':fresh.startswith(new_core.decode()),'new_response_bytes':len(fresh.encode()),'new_response_sha256':hashlib.sha256(fresh.encode()).hexdigest(),'controller_change_event_awaited':True,'environment':'Chromium loopback; inert peripheral assets, no real user data','physical_iphone':False}
 o=ROOT/'reply-actions-live-evidence';o.mkdir(exist_ok=True);(o/'sw-update.json').write_text(json.dumps(report,indent=2))
 assert 'Reply actions 160.99.4' in fresh and 'OLD_CORE_CACHE_FIXTURE' not in fresh,report
 assert fresh.startswith(new_core.decode()),report
 for marker in ['<button type="button" data-et-hint>','<button type="button" data-et-listen>','<button type="button" data-et-listen-slow']:assert marker not in fresh
 assert 'async function speak(' in fresh and 'data-et-mic' in fresh
 report.update({'removed_button_markup_absent':True,'microphone_and_speech_source_retained':True});(o/'sw-update.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
 context.close();browser.close()
server.shutdown()
