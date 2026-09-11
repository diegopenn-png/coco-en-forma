/* ETERNA Mic Only v4 · 2026-09-11
 * One microphone only. Full-utterance capture with MediaRecorder + VAD.
 * Transcribes through ETERNA /v1/transcribe and leaves text ready to send.
 * No persistent conversation mode.
 */
(function(root){
  'use strict';
  if(root.__ETERNA_MIC_ONLY_V4__)return;
  root.__ETERNA_MIC_ONLY_V4__=true;

  var session=null;
  var MIC_ICON='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M6.5 10.5v.5a5.5 5.5 0 0 0 11 0v-.5M12 16.5V21M9 21h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

  function overlay(){return document.getElementById('eternaOverlayV159')}
  function clean(v){return String(v==null?'':v).replace(/\s+/g,' ').trim()}
  function mic(){var o=overlay();return o&&o.querySelector('[data-et-mic]')}
  function input(){var o=overlay();return o&&o.querySelector('[data-et-input]')}
  function sendButton(){var o=overlay();return o&&o.querySelector('[data-et-send]')}
  function status(text,kind){var o=overlay();if(!o)return;var s=o.querySelector('[data-et-status]'),d=o.querySelector('[data-et-dot]');if(s)s.textContent=text;if(d)d.className='eternaV159Dot'+(kind?' '+kind:'')}
  function age(){var o=overlay(),txt=o?clean(o.textContent):'';var m=txt.match(/([1-6])(?:º|o)?\s+de\s+Primaria/i);if(m)return 5+Number(m[1]);m=txt.match(/([1-4])(?:º|o)?\s+de\s+ESO/i);if(m)return 11+Number(m[1]);m=txt.match(/([1-2])(?:º|o)?\s+de\s+Bachillerato/i);if(m)return 15+Number(m[1]);return 10}
  function silenceMs(){var a=age();return a<=8?3800:a<=11?3200:a<=14?2600:2200}
  function maxMs(){var a=age();return a<=8?50000:a<=11?45000:a<=14?40000:35000}
  function noSpeechMs(){var a=age();return a<=8?14000:a<=11?12000:a<=14?10000:9000}

  function installStyle(){
    if(document.getElementById('eterna-mic-only-v4-css'))return;
    var s=document.createElement('style');s.id='eterna-mic-only-v4-css';
    s.textContent=[
      '#eternaOverlayV159 [data-et-converse],#eternaOverlayV159 .eternaV160Conversation{display:none!important}',
      '#eternaOverlayV159 .eternaV160ModeActions{gap:8px!important}',
      '@media(min-width:761px){#eternaOverlayV159 .eternaV160ModeActions{flex:0 1 360px!important;max-width:360px!important;align-content:center!important}#eternaOverlayV159 .eternaV160ModeActions>.eternaV160NewActivity,#eternaOverlayV159 .eternaV160ModeActions>.eternaV160ChangeMode{width:100%!important}}',
      '@media(max-width:760px){#eternaOverlayV159 .eternaV160ModeActions{grid-template-columns:1fr 1fr!important;width:100%!important}}',
      '#eternaOverlayV159 [data-et-mic]{position:relative;display:inline-flex!important;align-items:center!important;justify-content:center!important}',
      '#eternaOverlayV159 [data-et-mic] svg{width:28px;height:28px;display:block}',
      '#eternaOverlayV159 [data-et-mic].recording{background:#fff4e8!important;border-color:#ff8a19!important;color:#e86800!important;box-shadow:0 0 0 4px rgba(255,136,25,.14)!important}',
      '#eternaOverlayV159 [data-et-mic].recording:after{content:"";position:absolute;inset:-7px;border:2px solid rgba(255,132,22,.38);border-radius:inherit;animation:eternaMicPulseV4 1.35s ease-out infinite;pointer-events:none}',
      '@keyframes eternaMicPulseV4{0%{transform:scale(.94);opacity:.9}100%{transform:scale(1.18);opacity:0}}'
    ].join('');document.head.appendChild(s)
  }

  function removeConversation(){var o=overlay();if(!o)return;o.querySelectorAll('[data-et-converse],.eternaV160Conversation').forEach(function(n){try{n.remove()}catch(e){n.style.display='none'}})}
  function modernizeMic(){var b=mic();if(!b)return;if(b.dataset.etMicModern==='1')return;b.dataset.etMicModern='1';b.innerHTML=MIC_ICON;b.setAttribute('aria-label','Hablar por micrófono');b.setAttribute('aria-pressed','false')}
  function setMic(on){var b=mic();if(!b)return;modernizeMic();b.classList.toggle('recording',!!on);b.setAttribute('aria-pressed',on?'true':'false');b.setAttribute('aria-label',on?'Terminar grabación':'Hablar por micrófono')}

  function nativeSetValue(el,value){try{var proto=Object.getPrototypeOf(el),desc=Object.getOwnPropertyDescriptor(proto,'value');if(desc&&desc.set)desc.set.call(el,value);else el.value=value}catch(e){el.value=value}}
  function write(text){var el=input();text=clean(text);if(!el||!text)return false;nativeSetValue(el,text);try{el.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:text}))}catch(e){el.dispatchEvent(new Event('input',{bubbles:true}))}try{el.dispatchEvent(new Event('change',{bubbles:true}))}catch(e){}var send=sendButton();if(send)send.disabled=false;try{el.focus()}catch(e){}return true}

  function recorderMime(){if(typeof MediaRecorder==='undefined')return'';var c=['audio/mp4','audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus','audio/ogg'];if(typeof MediaRecorder.isTypeSupported!=='function')return'';for(var i=0;i<c.length;i++)if(MediaRecorder.isTypeSupported(c[i]))return c[i];return''}
  function filename(type){type=String(type||'').toLowerCase();if(type.indexOf('mp4')>=0)return'pregunta.m4a';if(type.indexOf('ogg')>=0)return'pregunta.ogg';if(type.indexOf('wav')>=0)return'pregunta.wav';return'pregunta.webm'}

  async function authToken(refresh){
    try{
      var c=root.__COCO_SUPABASE_CLIENT;
      if(c&&c.auth){if(refresh&&c.auth.refreshSession)await c.auth.refreshSession();var r=await c.auth.getSession();return r&&r.data&&r.data.session&&r.data.session.access_token||''}
    }catch(e){}
    return''
  }
  async function transcribe(blob,type){
    status('Transcribiendo lo que dijiste…','warn');
    var base=String(root.COCO_CONFIG&&root.COCO_CONFIG.eternaEndpoint||'').replace(/\/+$/,'');if(!base){status('Eterna no tiene configurado el servicio de voz.','warn');return}
    var token=await authToken(false);if(!token){status('La sesión ha caducado. Vuelve a entrar y prueba el micrófono.','warn');return}
    async function request(t){var fd=new FormData();fd.append('audio',blob,filename(type));return fetch(base+'/v1/transcribe',{method:'POST',headers:{Authorization:'Bearer '+t},body:fd})}
    try{
      var r=await request(token);if(r.status===401){token=await authToken(true);if(token)r=await request(token)}
      var data=null;try{data=await r.json()}catch(e){}
      if(!r.ok||!data||!clean(data.text)){status('No pude transcribir esta vez. Vuelve a tocar el micrófono.','warn');return}
      if(write(data.text))status('He escrito todo lo que dijiste. Revísalo y pulsa enviar.','ok')
    }catch(e){status('No pude transcribir esta vez. Comprueba la conexión y vuelve a intentarlo.','warn')}
  }

  function stop(reason){
    if(!session)return;var s=session;session=null;
    if(s.hardTimer)clearTimeout(s.hardTimer);if(s.noSpeechTimer)clearTimeout(s.noSpeechTimer);if(s.silenceTimer)clearTimeout(s.silenceTimer);if(s.raf)cancelAnimationFrame(s.raf);
    try{if(s.rec&&s.rec.state==='recording')s.rec.stop()}catch(e){}
    try{if(s.audioCtx)s.audioCtx.close()}catch(e){}
    setMic(false);
  }

  async function start(){
    if(session){stop('manual');return}
    root.__ETERNA_VOICE_DIALOG_ACTIVE__=false;
    if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia||typeof MediaRecorder==='undefined'){status('Este dispositivo no permite grabar audio aquí.','warn');return}
    try{
      var stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
      try{localStorage.setItem('coco_eterna_mic_granted_v1','1')}catch(_e){}
      var mime=recorderMime(),rec=mime?new MediaRecorder(stream,{mimeType:mime}):new MediaRecorder(stream),chunks=[];
      var AudioCtx=root.AudioContext||root.webkitAudioContext,ctx=AudioCtx?new AudioCtx():null,analyser=null,data=null,source=null;
      if(ctx){try{if(ctx.state==='suspended')await ctx.resume();source=ctx.createMediaStreamSource(stream);analyser=ctx.createAnalyser();analyser.fftSize=1024;analyser.smoothingTimeConstant=.2;source.connect(analyser);data=new Uint8Array(analyser.fftSize)}catch(e){try{ctx.close()}catch(_e){}ctx=null;analyser=null}}
      var s={stream:stream,rec:rec,chunks:chunks,audioCtx:ctx,analyser:analyser,data:data,startedAt:Date.now(),speechAt:0,lastVoiceAt:0,noise:.008,raf:0,silenceTimer:null,hardTimer:null,noSpeechTimer:null,mime:mime};session=s;
      rec.ondataavailable=function(ev){if(ev.data&&ev.data.size)chunks.push(ev.data)};
      rec.onerror=function(){status('La grabación se interrumpió. Vuelve a tocar el micrófono.','warn')};
      rec.onstop=async function(){try{stream.getTracks().forEach(function(t){t.stop()})}catch(e){};var type=rec.mimeType||mime||(chunks[0]&&chunks[0].type)||'audio/webm',blob=new Blob(chunks,{type:type});if(blob.size<900){status('No he oído suficiente audio. Vuelve a tocar el micrófono.','warn');return}await transcribe(blob,type)};
      rec.start(250);setMic(true);status('Escuchando… habla con normalidad.','ok');
      s.hardTimer=setTimeout(function(){if(session===s)stop('max')},maxMs());
      s.noSpeechTimer=setTimeout(function(){if(session===s&&!s.speechAt)stop('no-speech')},noSpeechMs());
      function loop(){
        if(session!==s)return;
        var now=Date.now();
        if(analyser&&data){analyser.getByteTimeDomainData(data);var sum=0;for(var i=0;i<data.length;i++){var v=(data[i]-128)/128;sum+=v*v}var rms=Math.sqrt(sum/data.length);if(now-s.startedAt<700)s.noise=Math.max(.004,s.noise*.85+rms*.15);var threshold=Math.max(.016,s.noise*2.6);if(rms>threshold){if(!s.speechAt)s.speechAt=now;s.lastVoiceAt=now;if(s.noSpeechTimer){clearTimeout(s.noSpeechTimer);s.noSpeechTimer=null}if(s.silenceTimer){clearTimeout(s.silenceTimer);s.silenceTimer=null}}else if(s.speechAt&&now-s.lastVoiceAt>180){if(!s.silenceTimer)s.silenceTimer=setTimeout(function(){if(session===s)stop('silence')},silenceMs())}}
        s.raf=requestAnimationFrame(loop)
      }
      if(analyser)s.raf=requestAnimationFrame(loop);
    }catch(e){session=null;setMic(false);var name=String(e&&e.name||'');if(name==='NotAllowedError'||name==='SecurityError')status('El micrófono está bloqueado. Actívalo en los permisos de Coco en Forma y vuelve a tocarlo.','warn');else status('No pude abrir el micrófono. Vuelve a intentarlo.','warn')}
  }

  installStyle();
  document.addEventListener('click',function(ev){var o=overlay();if(!o||!o.classList.contains('is-open'))return;var target=ev.target&&ev.target.closest?ev.target.closest('#eternaOverlayV159 [data-et-mic],#eternaOverlayV159 [data-et-startaction="voice"]'):null;if(!target)return;ev.preventDefault();ev.stopImmediatePropagation();modernizeMic();start()},true);
  var mo=new MutationObserver(function(){installStyle();removeConversation();modernizeMic()});try{mo.observe(document.documentElement,{childList:true,subtree:true})}catch(e){}
  root.addEventListener('coco:eterna-close',function(){if(session)stop('close')});setTimeout(function(){removeConversation();modernizeMic()},0)
})(window);
