// Apply only the user-authorized microphone auto-submit change to a known baseline.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const hash=s=>createHash('sha256').update(s).digest('hex');
const p='eterna-mic-only-v4.js';
let s=readFileSync(p,'utf8');
assert.equal(hash(s),'14d58b46606218a2ad49bd0f75b2560e08df337f754c7a2a9696aded261b4819');
s=s.replace('and leaves text ready to send.','and submits once after an age-adapted pause.');
s=s.replace('var session=null;','var session=null,pending=null,writing=false;');
const from=s.indexOf('  function age()'),to=s.indexOf('  function maxMs()',from);
assert.ok(from>0&&to>from);
s=s.slice(0,from)+`  // Use the actual course label, never words from the conversation, to infer age.
  function age(){var o=overlay(),course=o&&o.querySelector('[data-et-course]'),txt=clean(course&&course.textContent),m;if(/infantil/i.test(txt)){m=txt.match(/([0-5])\\s*años/i);return m?Number(m[1]):5}m=txt.match(/([1-6])(?:º|o)?\\s+de\\s+Primaria/i);if(m)return 5+Number(m[1]);m=txt.match(/([1-4])(?:º|o)?\\s+de\\s+ESO/i);if(m)return 11+Number(m[1]);m=txt.match(/([1-2])(?:º|o)?\\s+de\\s+Bachillerato/i);if(m)return 15+Number(m[1]);return 6}
  function silenceMs(){var a=age();return a<=8?2000:a<=11?1500:a<=14?1200:1000}
`+s.slice(to);
const helpers=`  function activityKey(){try{var api=root.CocoEternaV160||root.CocoEternaV159,c=api&&api.getActivityContext&&api.getActivityContext();return c?[c.uid,c.mode,c.session_id,c.question_id,c.epoch,c.phase].join('|'):''}catch(e){return''}}
  function busy(){try{var api=root.CocoEternaV160||root.CocoEternaV159;return !!(api&&api.isRequestPending&&api.isRequestPending())}catch(e){return true}}
  function newTurn(){return pending={overlay:overlay(),field:input(),key:activityKey(),initialText:input()?input().value:'',cancelled:false,sent:false,processed:false,controller:typeof AbortController!=='undefined'?new AbortController():null}}
  function current(s){return !!(s&&pending===s&&!s.cancelled&&!s.sent&&s.overlay===overlay()&&s.field===input()&&s.overlay&&s.overlay.classList.contains('is-open')&&!document.hidden&&s.key===activityKey())}
  function releaseStream(s){try{if(s.stream)s.stream.getTracks().forEach(function(t){t.stop()})}catch(e){}}
  function cancelPending(){var s=pending;if(!s)return;s.cancelled=true;pending=null;try{if(s.controller)s.controller.abort()}catch(e){}if(session===s)stop('cancel');else releaseStream(s)}
  function submitOnce(s,text){
    var field=input(),button=sendButton();
    if(!current(s)||busy()||!field||field.disabled||!button||button.disabled||typeof button.click!=='function'||clean(field.value)!==clean(text))return false;
    // Use the existing Send handler and its access checks, not a second chat request path.
    s.sent=true;pending=null;status('Enviando tu pregunta…','ok');button.click();return true
  }

`;
s=s.replace('  function installStyle(){',helpers+'  function installStyle(){');
s=s.replace("var send=sendButton();if(send)send.disabled=false;try{el.focus()}catch(e){}return true}","return true}");
const start=s.indexOf('  async function transcribe('),end=s.indexOf('  function stop(',start);
assert.ok(start>0&&end>start);
s=s.slice(0,start)+`  async function transcribe(blob,type,s){
    if(!current(s))return;
    status('Transcribiendo lo que dijiste…','warn');
    var base=String(root.COCO_CONFIG&&root.COCO_CONFIG.eternaEndpoint||'').replace(/\\/+$/,'');if(!base){voiceDiagnostic(0,'ENDPOINT_MISSING','Eterna no tiene configurado el servicio de voz.');return}
    var token=await authToken(false);if(!current(s))return;if(!token){voiceDiagnostic(0,'SESSION_MISSING','La sesión ha caducado. Vuelve a entrar y prueba el micrófono.');return}
    async function request(t){var fd=new FormData();fd.append('audio',blob,filename(type));var options={method:'POST',headers:{Authorization:'Bearer '+t},body:fd};if(s.controller)options.signal=s.controller.signal;return fetch(base+'/v1/transcribe',options)}
    try{
      var r=await request(token);if(!current(s))return;if(r.status===401){token=await authToken(true);if(!current(s))return;if(token)r=await request(token)}
      var data=null,validJson=true;try{data=await r.json()}catch(e){validJson=false}
      if(!current(s))return;
      if(!r.ok){transcriptionError(r,data);return}
      if(!validJson){voiceDiagnostic(r.status,'INVALID_JSON','El servicio de voz ha devuelto una respuesta que no se puede leer.');return}
      if(!data||typeof data.text!=='string'){voiceDiagnostic(r.status,'INVALID_RESPONSE','El servicio de voz ha respondido sin el campo de transcripción esperado.');return}
      if(!clean(data.text)){voiceDiagnostic(r.status,'EMPTY_TRANSCRIPT','El servicio de voz ha devuelto una transcripción vacía.');return}
      if(busy()||!input()||input().disabled||input().value!==s.initialText)return;
      var written=false;writing=true;try{written=write(data.text)}finally{writing=false}
      if(written&&!submitOnce(s,data.text)&&current(s))status('Tu pregunta está escrita. Pulsa enviar cuando esté disponible.','warn')
    }catch(e){if(current(s))voiceDiagnostic(0,'REQUEST_FAILED','No se ha podido completar la petición de voz. Comprueba la conexión.')}
    finally{if(pending===s)pending=null}
  }

`+s.slice(end);
const stopAt=s.indexOf('  function stop(');
s=s.slice(0,stopAt)+`  function stop(reason){
    if(!session)return;var s=session;session=null;s.stopReason=reason;
    if(reason==='cancel'||reason==='close'||reason==='no-speech'||reason==='error'){s.cancelled=true;if(pending===s)pending=null}
    if(s.hardTimer)clearTimeout(s.hardTimer);if(s.noSpeechTimer)clearTimeout(s.noSpeechTimer);if(s.silenceTimer)clearTimeout(s.silenceTimer);if(s.raf)cancelAnimationFrame(s.raf);
    try{if(s.rec&&s.rec.state==='recording')s.rec.stop()}catch(e){}
    try{if(s.audioCtx)s.audioCtx.close()}catch(e){}
    if(s.cancelled)releaseStream(s);
    setMic(false);
    if(reason==='no-speech')status('No he oído voz. Toca el micrófono y vuelve a intentarlo.','warn')
  }

  async function start(){
    if(session){stop('manual');return}
    cancelPending();
    var o=overlay(),field=input();if(!o||!o.classList.contains('is-open')||!field||field.disabled||busy()||document.hidden)return;
    root.__ETERNA_VOICE_DIALOG_ACTIVE__=false;
    if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia||typeof MediaRecorder==='undefined'){status('Este dispositivo no permite grabar audio aquí.','warn');return}
    var s=newTurn();
    try{
      var stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});s.stream=stream;
      if(!current(s)){releaseStream(s);return}
      try{localStorage.setItem('coco_eterna_mic_granted_v1','1')}catch(_e){}
      var mime=recorderMime(),rec=mime?new MediaRecorder(stream,{mimeType:mime}):new MediaRecorder(stream),chunks=[];
      var AudioCtx=root.AudioContext||root.webkitAudioContext,ctx=AudioCtx?new AudioCtx():null,analyser=null,data=null,source=null;s.audioCtx=ctx;
      if(ctx){try{if(ctx.state==='suspended')await ctx.resume();source=ctx.createMediaStreamSource(stream);analyser=ctx.createAnalyser();analyser.fftSize=1024;analyser.smoothingTimeConstant=.2;source.connect(analyser);data=new Uint8Array(analyser.fftSize)}catch(e){try{ctx.close()}catch(_e){}ctx=null;analyser=null}}
      if(!current(s)){releaseStream(s);try{if(ctx)ctx.close()}catch(e){}return}
      Object.assign(s,{rec:rec,chunks:chunks,audioCtx:ctx,analyser:analyser,data:data,startedAt:Date.now(),speechAt:0,lastVoiceAt:0,noise:.008,raf:0,silenceTimer:null,hardTimer:null,noSpeechTimer:null,mime:mime,pauseMs:silenceMs()});session=s;
      rec.ondataavailable=function(ev){if(ev.data&&ev.data.size)chunks.push(ev.data)};
      rec.onerror=function(){if(current(s)){stop('error');status('La grabación se interrumpió. Vuelve a tocar el micrófono.','warn')}};
      rec.onstop=async function(){
        releaseStream(s);if(s.processed)return;s.processed=true;
        if(session===s)stop('ended');
        if(!current(s))return;
        var type=rec.mimeType||mime||(chunks[0]&&chunks[0].type)||'audio/webm',blob=new Blob(chunks,{type:type});
        if(blob.size<900){if(pending===s)pending=null;status('No he oído suficiente audio. Vuelve a tocar el micrófono.','warn');return}
        await transcribe(blob,type,s)
      };
      rec.start(250);setMic(true);status('Escuchando… al terminar, enviaré tu pregunta automáticamente.','ok');
      s.hardTimer=setTimeout(function(){if(session===s)stop('max')},maxMs());
      s.noSpeechTimer=setTimeout(function(){if(session===s&&!s.speechAt)stop('no-speech')},noSpeechMs());
      function loop(){
        if(session!==s)return;
        var now=Date.now();
        if(analyser&&data){analyser.getByteTimeDomainData(data);var sum=0;for(var i=0;i<data.length;i++){var v=(data[i]-128)/128;sum+=v*v}var rms=Math.sqrt(sum/data.length);if(now-s.startedAt<700)s.noise=Math.max(.004,s.noise*.85+rms*.15);var threshold=Math.max(.016,s.noise*2.6);if(rms>threshold){if(!s.speechAt)s.speechAt=now;s.lastVoiceAt=now;if(s.noSpeechTimer){clearTimeout(s.noSpeechTimer);s.noSpeechTimer=null}if(s.silenceTimer){clearTimeout(s.silenceTimer);s.silenceTimer=null}}else if(s.speechAt&&now-s.lastVoiceAt>180){if(!s.silenceTimer)s.silenceTimer=setTimeout(function(){if(session===s)stop('silence')},Math.max(0,s.pauseMs-(now-s.lastVoiceAt)))}}
        s.raf=requestAnimationFrame(loop)
      }
      if(analyser)s.raf=requestAnimationFrame(loop);
    }catch(e){
      var relevant=current(s);if(session===s)stop('error');releaseStream(s);try{if(s.audioCtx)s.audioCtx.close()}catch(_e){}if(pending===s)pending=null;
      if(!relevant)return;setMic(false);var name=String(e&&e.name||'');if(name==='NotAllowedError'||name==='SecurityError')status('El micrófono está bloqueado. Actívalo en los permisos de Coco en Forma y vuelve a tocarlo.','warn');else status('No pude abrir el micrófono. Vuelve a intentarlo.','warn')
    }
  }

  installStyle();
  document.addEventListener('click',function(ev){var o=overlay();if(!o||!o.classList.contains('is-open'))return;var target=ev.target&&ev.target.closest?ev.target.closest('#eternaOverlayV159 [data-et-mic],#eternaOverlayV159 [data-et-startaction="voice"]'):null;if(!target){if(pending&&ev.target&&ev.target.closest&&ev.target.closest('#eternaOverlayV159 [data-et-send]'))cancelPending();return}ev.preventDefault();ev.stopImmediatePropagation();modernizeMic();start()},true);
  document.addEventListener('input',function(ev){if(!writing&&pending&&ev.target===input())cancelPending()},true);
  document.addEventListener('keydown',function(ev){if(pending&&ev.target===input()&&ev.key==='Enter'&&!ev.shiftKey)cancelPending()},true);
  document.addEventListener('visibilitychange',function(){if(document.hidden)cancelPending()});
  ['coco:eterna-close','coco:eterna-context-invalidated','coco:eterna-ui-reset','pagehide'].forEach(function(event){root.addEventListener(event,cancelPending)});
  root.addEventListener('coco:daily-user',function(ev){if(pending&&ev&&ev.detail&&pending.key.split('|')[0]!==String(ev.detail.userId||''))cancelPending()});
  var mo=new MutationObserver(function(){installStyle();removeConversation();modernizeMic();if(pending&&!current(pending))cancelPending()});try{mo.observe(document.documentElement,{childList:true,subtree:true})}catch(e){}
  setTimeout(function(){removeConversation();modernizeMic()},0)
})(window);
`;
assert.ok(!s.includes('if(send)send.disabled=false'));
writeFileSync(p,s);
const sw='sw.js';let cache=readFileSync(sw,'utf8');assert.equal(hash(cache),'0b62691e891841879f40f8942c6a61ab4ac43e347d687e104a563deb824ae791');
writeFileSync(sw,cache.replace('coco-en-forma-v160.99.0-mic-only-v4-r2','coco-en-forma-v160.99.1-mic-auto-send-r1'));
const contract='eterna-worker/test/client-state-contract.test.mjs';let c=readFileSync(contract,'utf8');assert.equal(hash(c),'bc451de933e99ea5d72ec69fcf897498c9fd281905215c0df73daca0511ff3aa');
c=c.replace('v160\\.99\\.0-mic-only-v4-r2','v160\\.99\\.1-mic-auto-send-r1').replace('auto-stops and leaves text ready to send','auto-stops and submits through the canonical Send button');writeFileSync(contract,c);
// Update the existing diagnostic harness to use a real turn and canonical input enabling.
const test='eterna-worker/test/mic-diagnostics.test.mjs';let t=readFileSync(test,'utf8');assert.equal(hash(t),'cbd9f4620baa2285722e53bac47ccbd1139c2412addcc994312ed8b1752035b7');
t=t.replace('send = { disabled: true }','send = { disabled: true, clicks: 0, click() { this.clicks++; } }');
t=t.replace('events.push(e.type);','events.push(e.type); if(e.type === "input") send.disabled = !this.value.trim();');
t=t.replace('const overlay = { querySelector','const overlay = { classList: { contains: () => true }, querySelector');
t=t.replace('root.__testTranscribe=transcribe;','root.__testTranscribe=(blob,type)=>transcribe(blob,type,newTurn());');
t=t.replace('input events and manual Send','input events and one automatic Send');
t=t.replace('assert.match(h.label.textContent, /Revísalo y pulsa enviar/);','assert.equal(h.send.clicks, 1); assert.match(h.label.textContent, /Enviando tu pregunta/);');
writeFileSync(test,t);
console.log('Only microphone, cache and matching tests patched. Backend and canonical chat unchanged.');
