/* ETERNA Mic Only v3 · 2026-09-11
 * One microphone control on desktop + PWA.
 * Captures the full utterance with MediaRecorder, auto-stops after age-adapted silence,
 * transcribes through Eterna's authenticated /v1/transcribe endpoint, and leaves
 * the transcript in the composer ready for the normal Send button.
 */
(function(root){
  'use strict';
  if(root.__ETERNA_MIC_ONLY_V3__)return;
  root.__ETERNA_MIC_ONLY_V3__=true;

  var session=null,lastGestureAt=0;

  function overlay(){return document.getElementById('eternaOverlayV159')}
  function clean(v){return String(v==null?'':v).replace(/\s+/g,' ').trim()}
  function input(){var o=overlay();return o&&o.querySelector('[data-et-input]')}
  function mic(){var o=overlay();return o&&o.querySelector('[data-et-mic]')}
  function send(){var o=overlay();return o&&o.querySelector('[data-et-send]')}
  function status(text,kind){var o=overlay();if(!o)return;var s=o.querySelector('[data-et-status]'),d=o.querySelector('[data-et-dot]');if(s)s.textContent=text;if(d)d.className='eternaV159Dot'+(kind?' '+kind:'')}
  function age(){var o=overlay(),txt=o?clean(o.textContent):'';var m=txt.match(/([1-6])(?:º|o)?\s+de\s+Primaria/i);if(m)return 5+Number(m[1]);m=txt.match(/([1-4])(?:º|o)?\s+de\s+ESO/i);if(m)return 11+Number(m[1]);m=txt.match(/([1-2])(?:º|o)?\s+de\s+Bachillerato/i);if(m)return 15+Number(m[1]);return 10}
  function silenceMs(){var a=age();return a<=8?3600:a<=11?3200:a<=14?2700:2300}
  function noSpeechMs(){var a=age();return a<=8?11000:a<=11?9500:a<=14?8000:7000}
  function maxMs(){var a=age();return a<=8?45000:a<=11?40000:a<=14?35000:32000}
  function isIOS(){return /iPad|iPhone|iPod/.test(navigator.userAgent)||navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1}

  function installStyle(){
    if(document.getElementById('eterna-mic-only-v3-css'))return;
    var s=document.createElement('style');s.id='eterna-mic-only-v3-css';
    s.textContent=[
      '#eternaOverlayV159 [data-et-converse],#eternaOverlayV159 .eternaV160Conversation{display:none!important}',
      '#eternaOverlayV159 .eternaV160ModeActions{gap:8px!important}',
      '@media(min-width:761px){#eternaOverlayV159 .eternaV160ModeActions{flex:0 1 360px!important;max-width:360px!important;align-content:center!important}#eternaOverlayV159 .eternaV160ModeActions>.eternaV160NewActivity,#eternaOverlayV159 .eternaV160ModeActions>.eternaV160ChangeMode{width:100%!important}}',
      '@media(max-width:760px){#eternaOverlayV159 .eternaV160ModeActions{grid-template-columns:1fr 1fr!important;width:100%!important}#eternaOverlayV159 .eternaV160ModeActions [data-et-converse]{display:none!important}}',
      '#eternaOverlayV159 [data-et-mic].recording{background:#fff4e8!important;border-color:#ff9a3d!important;color:#e86800!important;box-shadow:0 0 0 4px rgba(255,136,25,.14)!important}',
      '#eternaOverlayV159 [data-et-mic].recording:after{content:"";position:absolute;inset:-7px;border:2px solid rgba(255,132,22,.35);border-radius:inherit;animation:eternaMicPulseV3 1.25s ease-out infinite;pointer-events:none}',
      '@keyframes eternaMicPulseV3{0%{transform:scale(.92);opacity:.9}100%{transform:scale(1.16);opacity:0}}'
    ].join('');document.head.appendChild(s)
  }
  function removeConversation(){var o=overlay();if(!o)return;o.querySelectorAll('[data-et-converse],.eternaV160Conversation').forEach(function(n){try{n.remove()}catch(e){n.style.display='none'}})}
  function setMic(on){var b=mic();if(!b)return;b.classList.toggle('recording',!!on);b.setAttribute('aria-pressed',on?'true':'false');b.setAttribute('aria-label',on?'Terminar dictado':'Hablar por micrófono');b.textContent=on?'■':'🎙️'}
  function nativeSetValue(el,value){try{var proto=Object.getPrototypeOf(el),desc=Object.getOwnPropertyDescriptor(proto,'value');if(desc&&desc.set)desc.set.call(el,value);else el.value=value}catch(e){el.value=value}}
  function write(text){var el=input();text=clean(text);if(!el||!text)return false;nativeSetValue(el,text);try{el.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:text}))}catch(e){el.dispatchEvent(new Event('input',{bubbles:true}))}try{el.dispatchEvent(new Event('change',{bubbles:true}))}catch(e){}var b=send();if(b)b.disabled=false;try{el.focus()}catch(e){}return true}

  function recorderMime(){if(typeof MediaRecorder==='undefined')return'';var c=isIOS()?['audio/mp4','audio/webm;codecs=opus','audio/webm']:['audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus','audio/mp4'];if(typeof MediaRecorder.isTypeSupported!=='function')return'';for(var i=0;i<c.length;i++)if(MediaRecorder.isTypeSupported(c[i]))return c[i];return''}
  function filename(type){type=String(type||'').toLowerCase();if(type.indexOf('mp4')>=0)return'pregunta.m4a';if(type.indexOf('ogg')>=0)return'pregunta.ogg';if(type.indexOf('wav')>=0)return'pregunta.wav';return'pregunta.webm'}
  function endpoint(){var c=root.COCO_CONFIG||{},base=String(c.eternaEndpoint||'').replace(/\/+$/,'');return base?base+'/v1/transcribe':''}
  function supabaseClient(){var c=root.COCO_CONFIG||{};if(root.__COCO_SUPABASE_CLIENT__)return root.__COCO_SUPABASE_CLIENT__;if(root.supabase&&root.supabase.createClient&&c.url&&c.clave){try{return root.__COCO_SUPABASE_CLIENT__=root.supabase.createClient(c.url,c.clave,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}})}catch(e){}}return null}
  async function accessToken(refresh){var c=supabaseClient();if(!c||!c.auth)return'';try{if(refresh&&c.auth.refreshSession){var rr=await c.auth.refreshSession();return rr&&rr.data&&rr.data.session&&rr.data.session.access_token||''}var r=await c.auth.getSession();return r&&r.data&&r.data.session&&r.data.session.access_token||''}catch(e){return''}}
  async function transcribe(blob,type){
    var url=endpoint();if(!url)throw new Error('NO_ENDPOINT');
    async function run(refresh){var token=await accessToken(refresh);if(!token)throw new Error('NO_SESSION');var fd=new FormData();fd.append('audio',blob,filename(type));return fetch(url,{method:'POST',headers:{Authorization:'Bearer '+token},body:fd})}
    var r=await run(false);if(r.status===401)r=await run(true);var data={};try{data=await r.json()}catch(e){}if(!r.ok||!clean(data&&data.text))throw new Error(data&&data.error||'TRANSCRIPTION_FAILED');return clean(data.text)
  }

  function cleanup(s){if(!s)return;try{clearTimeout(s.noSpeechTimer)}catch(e){}try{clearTimeout(s.maxTimer)}catch(e){}try{clearInterval(s.vadTimer)}catch(e){}try{if(s.source)s.source.disconnect()}catch(e){}try{if(s.analyser)s.analyser.disconnect()}catch(e){}try{if(s.audioContext&&s.audioContext.state!=='closed')s.audioContext.close()}catch(e){}try{s.stream&&s.stream.getTracks().forEach(function(t){t.stop()})}catch(e){}}
  function stopCapture(reason){var s=session;if(!s||s.stopping)return;s.stopping=true;s.stopReason=reason||'manual';try{if(s.recorder&&s.recorder.state==='recording')s.recorder.stop();else finalize(s)}catch(e){finalize(s)}}
  async function finalize(s){if(!s||s.finalized)return;s.finalized=true;cleanup(s);if(session===s)session=null;setMic(false);var type=s.recorder&&s.recorder.mimeType||s.mime||(s.chunks[0]&&s.chunks[0].type)||'audio/webm',blob=new Blob(s.chunks,{type:type});if(!s.speechStarted||blob.size<900){status('No he oído una frase completa. Toca el micrófono y vuelve a intentarlo.','warn');return}status('Transcribiendo todo lo que has dicho…','warn');try{var text=await transcribe(blob,type);if(write(text))status('He escrito todo lo que te he oído. Revísalo y pulsa enviar.','ok')}catch(e){console.error('ETERNA MIC V3',e);status(e&&e.message==='NO_SESSION'?'La sesión ha caducado. Vuelve a entrar y prueba otra vez.':'No pude transcribir esta vez. Vuelve a tocar el micrófono.','warn')}}

  async function startCapture(){
    if(session){stopCapture('manual');return}
    if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia||typeof MediaRecorder==='undefined'){status('Este dispositivo no permite grabar audio desde Eterna.','warn');return}
    try{
      var stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}}),mime=recorderMime(),rec=mime?new MediaRecorder(stream,{mimeType:mime}):new MediaRecorder(stream),s={stream:stream,recorder:rec,mime:mime,chunks:[],speechStarted:false,lastVoiceAt:0,startedAt:Date.now(),stopping:false,finalized:false,noiseFloor:.008,calibration:[],vadTimer:null,noSpeechTimer:null,maxTimer:null,audioContext:null,analyser:null,source:null};session=s;
      rec.ondataavailable=function(e){if(e.data&&e.data.size)s.chunks.push(e.data)};rec.onstop=function(){finalize(s)};rec.onerror=function(){stopCapture('error')};rec.start(250);setMic(true);status('Escuchando… habla con normalidad. Se detendrá solo cuando termines.','ok');
      s.noSpeechTimer=setTimeout(function(){if(session===s&&!s.speechStarted)stopCapture('no-speech')},noSpeechMs());s.maxTimer=setTimeout(function(){if(session===s)stopCapture('max')},maxMs());
      try{
        var AC=root.AudioContext||root.webkitAudioContext;if(AC){s.audioContext=new AC();if(s.audioContext.state==='suspended')await s.audioContext.resume();s.analyser=s.audioContext.createAnalyser();s.analyser.fftSize=1024;s.analyser.smoothingTimeConstant=.22;s.source=s.audioContext.createMediaStreamSource(stream);s.source.connect(s.analyser);var buf=new Uint8Array(s.analyser.fftSize),tick=0;s.vadTimer=setInterval(function(){if(session!==s||s.stopping)return;s.analyser.getByteTimeDomainData(buf);var sum=0;for(var i=0;i<buf.length;i++){var v=(buf[i]-128)/128;sum+=v*v}var rms=Math.sqrt(sum/buf.length);tick++;if(!s.speechStarted&&tick<=6){s.calibration.push(rms);var avg=s.calibration.reduce(function(a,b){return a+b},0)/s.calibration.length;s.noiseFloor=Math.max(.004,avg)}var threshold=Math.max(.014,s.noiseFloor*2.6);if(rms>threshold){s.speechStarted=true;s.lastVoiceAt=Date.now()}else if(s.speechStarted&&Date.now()-s.lastVoiceAt>=silenceMs()){stopCapture('silence')}},120)}
      }catch(e){console.warn('ETERNA MIC V3 VAD fallback',e)}
    }catch(e){session=null;setMic(false);status('No se pudo abrir el micrófono. Revisa el permiso y vuelve a intentarlo.','warn')}
  }

  function isMicTarget(ev){var o=overlay();if(!o||!o.classList.contains('is-open'))return null;return ev.target&&ev.target.closest?ev.target.closest('#eternaOverlayV159 [data-et-mic],#eternaOverlayV159 [data-et-startaction="voice"]'):null}
  function handle(ev){var t=isMicTarget(ev);if(!t)return;var now=Date.now();if(ev.type==='click'&&now-lastGestureAt<700){ev.preventDefault();ev.stopImmediatePropagation();return}if(ev.type==='pointerup')lastGestureAt=now;ev.preventDefault();ev.stopImmediatePropagation();startCapture()}

  installStyle();document.addEventListener('pointerup',handle,true);document.addEventListener('click',handle,true);
  var mo=new MutationObserver(function(){installStyle();removeConversation()});try{mo.observe(document.documentElement,{childList:true,subtree:true})}catch(e){}
  root.addEventListener('coco:eterna-close',function(){if(session)stopCapture('close')});setTimeout(removeConversation,0)
})(window);
