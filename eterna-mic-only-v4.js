/* ETERNA Mic Only v4 · 2026-09-11
 * One microphone only. Full-utterance capture with MediaRecorder + VAD.
 * Transcribes through ETERNA /v1/transcribe and submits once after an age-adapted pause.
 * No persistent conversation mode.
 */
(function(root){
  'use strict';
  if(root.__ETERNA_MIC_ONLY_V4__)return;
  root.__ETERNA_MIC_ONLY_V4__=true;

  var session=null,pending=null,writing=false,dispatchTurn=null;
  var MIC_ICON='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M6.5 10.5v.5a5.5 5.5 0 0 0 11 0v-.5M12 16.5V21M9 21h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

  function overlay(){return document.getElementById('eternaOverlayV159')}
  function clean(v){return String(v==null?'':v).replace(/\s+/g,' ').trim()}
  function mic(){var o=overlay();return o&&o.querySelector('[data-et-mic]')}
  function input(){var o=overlay();return o&&o.querySelector('[data-et-input]')}
  function sendButton(){var o=overlay();return o&&o.querySelector('[data-et-send]')}
  function status(text,kind){var o=overlay();if(!o)return;var s=o.querySelector('[data-et-status]'),d=o.querySelector('[data-et-dot]');if(s)s.textContent=text;if(d)d.className='eternaV159Dot'+(kind?' '+kind:'')}
  // Use the actual course label, never words from the conversation, to infer age.
  function age(){var o=overlay(),course=o&&o.querySelector('[data-et-course]'),txt=clean(course&&course.textContent),m;if(/infantil/i.test(txt)){m=txt.match(/([0-5])\s*años/i);return m?Number(m[1]):5}m=txt.match(/([1-6])(?:º|o)?\s+de\s+Primaria/i);if(m)return 5+Number(m[1]);m=txt.match(/([1-4])(?:º|o)?\s+de\s+ESO/i);if(m)return 11+Number(m[1]);m=txt.match(/([1-2])(?:º|o)?\s+de\s+Bachillerato/i);if(m)return 15+Number(m[1]);return 6}
  function silenceMs(){var a=age();return a<=8?2000:a<=11?1500:a<=14?1200:1000}
  function maxMs(){var a=age();return a<=8?50000:a<=11?45000:a<=14?40000:35000}
  function noSpeechMs(){var a=age();return a<=8?14000:a<=11?12000:a<=14?10000:9000}

  function activityKey(){try{var api=root.CocoEternaV160||root.CocoEternaV159,c=api&&api.getActivityContext&&api.getActivityContext();return c?[c.uid,c.mode,c.session_id,c.question_id,c.epoch,c.phase].join('|'):''}catch(e){return''}}
  function busy(){try{var api=root.CocoEternaV160||root.CocoEternaV159;return !!(api&&api.isRequestPending&&api.isRequestPending())}catch(e){return true}}
  function newTurn(){return pending={overlay:overlay(),field:input(),key:activityKey(),initialText:input()?input().value:'',cancelled:false,sent:false,processed:false,controller:typeof AbortController!=='undefined'?new AbortController():null}}
  function current(s){return !!(s&&pending===s&&!s.cancelled&&!s.sent&&s.overlay===overlay()&&s.field===input()&&s.overlay&&s.overlay.classList.contains('is-open')&&!document.hidden&&s.key===activityKey())}
  function releaseStream(s){try{if(s.stream)s.stream.getTracks().forEach(function(t){t.stop()})}catch(e){}}
  function cancelPending(){if(dispatchTurn){dispatchTurn.cancelled=true;dispatchTurn=null}var s=pending;if(!s)return;s.cancelled=true;pending=null;try{if(s.controller)s.controller.abort()}catch(e){}if(session===s)stop('cancel');else{releaseStream(s);closeInputGraph(s)}}
  function submitOnce(s,text){
    var field=input(),button=sendButton();
    if(!current(s)||busy()||!field||field.disabled||!button||button.disabled||typeof button.click!=='function'||clean(field.value)!==clean(text))return false;
    // Use the existing Send handler and its access checks, not a second chat request path.
    dispatchTurn=s;
    // The legal layer may replay this click asynchronously. Check the original intent again.
    if(button.addEventListener)button.addEventListener('click',function(ev){
      if(dispatchTurn===s)dispatchTurn=null;
      if(s.cancelled||s.overlay!==overlay()||s.field!==input()||!s.overlay.classList.contains('is-open')||document.hidden||s.key!==activityKey()||busy()||field.disabled||button.disabled||clean(field.value)!==clean(text)){
        ev.preventDefault();ev.stopImmediatePropagation()
      }
    },{capture:true,once:true});
    s.sent=true;pending=null;status('Enviando tu pregunta…','ok');button.click();return true
  }

  // Create/resume in the microphone click, before the permission promise yields.
  // Each turn owns a fresh graph; mode changes can never retain an old source.
  function openInputGraph(s){
    var Ctx=root.AudioContext||root.webkitAudioContext;
    if(!Ctx)return;
    try{s.audioCtx=new Ctx();if(s.audioCtx.state!=='running')s.audioReady=Promise.resolve(s.audioCtx.resume()).catch(function(){return false})}catch(e){closeInputGraph(s)}
  }
  function closeInputGraph(s){
    if(!s)return;
    ['source','analyser','sink'].forEach(function(k){try{if(s[k]&&s[k].disconnect)s[k].disconnect()}catch(e){}s[k]=null});
    var ctx=s.audioCtx;s.audioCtx=null;
    try{if(ctx&&ctx.state!=='closed')Promise.resolve(ctx.close()).catch(function(){})}catch(e){}
  }
  async function inputGraphReady(s){
    var ctx=s.audioCtx;if(!ctx||ctx.state==='closed')return false;
    if(ctx.state==='running')return true;
    var timer;try{
      var ready=s.audioReady||Promise.resolve(ctx.resume()).catch(function(){return false});
      await Promise.race([ready,new Promise(function(resolve){timer=setTimeout(resolve,1500)})]);
      return ctx.state==='running'
    }catch(e){return false}finally{if(timer)clearTimeout(timer);s.audioReady=null}
  }
  function inputFault(s,code){
    if(!current(s))return;
    if(session===s)stop('error');else{cancelPending();releaseStream(s);closeInputGraph(s)}
    voiceDiagnostic(0,code,'El micrófono no está entregando sonido de forma estable. Tócalo de nuevo para activarlo.');
  }
  function resumeInterruptedGraph(s){
    if(s.resuming||!s.audioCtx)return;
    s.resuming=true;
    if(s.silenceTimer){clearTimeout(s.silenceTimer);s.silenceTimer=null}
    s.audioReady=null;
    inputGraphReady(s).then(function(ok){
      s.resuming=false;if(!current(s)||session!==s)return;
      if(!ok){inputFault(s,'AUDIO_CONTEXT_INTERRUPTED');return}
      s.lastClock=s.audioCtx.currentTime;s.clockAt=Date.now();if(s.speechAt)s.lastVoiceAt=Date.now()
    })
  }
  function sampleVoice(s,now){
    var values=s.data,analyser=s.analyser,sum=0,mean=0,i,v;
    if(s.floatSamples){
      analyser.getFloatTimeDomainData(values);
      for(i=0;i<values.length;i++)mean+=values[i];mean/=values.length;
      for(i=0;i<values.length;i++){v=values[i]-mean;sum+=v*v}
    }else{
      analyser.getByteTimeDomainData(values);
      for(i=0;i<values.length;i++){v=(values[i]-128)/128;sum+=v*v}
    }
    var rms=Math.sqrt(sum/values.length),step=Math.max(0,Math.min(50,now-s.lastSampleAt));s.lastSampleAt=now;
    if(!Number.isFinite(rms))return false;
    s.sampleCount++;s.peakRms=Math.max(s.peakRms,rms);
    var threshold=Math.max(s.speechAt?.0018:.003,s.noise*(s.speechAt?1.6:2.4));
    if(rms>threshold){
      s.voiceEvidence+=step;
      if(!s.speechAt&&s.voiceEvidence>=64)s.speechAt=now;
      if(s.speechAt){
        s.lastVoiceAt=now;
        if(s.noSpeechTimer){clearTimeout(s.noSpeechTimer);s.noSpeechTimer=null}
        if(s.silenceTimer){clearTimeout(s.silenceTimer);s.silenceTimer=null}
      }
    }else{
      s.voiceEvidence=0;
      // Learn background only from quiet frames, never from the child's first words.
      if(!s.speechAt)s.noise=Math.max(.0003,Math.min(.01,s.noise*.94+rms*.06));
      if(s.speechAt&&now-s.lastVoiceAt>180&&!s.silenceTimer){
        s.silenceTimer=setTimeout(function(){
          s.silenceTimer=null;if(session!==s||!current(s))return;
          if(s.audioCtx&&s.audioCtx.state!=='running'){resumeInterruptedGraph(s);return}
          stop('silence')
        },Math.max(0,s.pauseMs-(now-s.lastVoiceAt)))
      }
    }
    return true
  }

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
  function write(text){var el=input();text=clean(text);if(!el||!text)return false;nativeSetValue(el,text);try{el.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:text}))}catch(e){el.dispatchEvent(new Event('input',{bubbles:true}))}try{el.dispatchEvent(new Event('change',{bubbles:true}))}catch(e){}return true}

  function recorderMime(){if(typeof MediaRecorder==='undefined')return'';var c=['audio/mp4','audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus','audio/ogg'];if(typeof MediaRecorder.isTypeSupported!=='function')return'';for(var i=0;i<c.length;i++)if(MediaRecorder.isTypeSupported(c[i]))return c[i];return''}
  function filename(type){type=String(type||'').toLowerCase();if(type.indexOf('mp4')>=0)return'pregunta.m4a';if(type.indexOf('ogg')>=0)return'pregunta.ogg';if(type.indexOf('wav')>=0)return'pregunta.wav';return'pregunta.webm'}

  async function authToken(refresh){
    try{
      var c=root.__COCO_SUPABASE_CLIENT;
      if(c&&c.auth){if(refresh&&c.auth.refreshSession)await c.auth.refreshSession();var r=await c.auth.getSession();return r&&r.data&&r.data.session&&r.data.session.access_token||''}
    }catch(e){}
    return''
  }
  // Diagnostic labels are fixed strings; never display or store raw server errors or audio.
  function voiceDiagnostic(http,code,message){
    status(message+' [MIC-DIAG-1'+(http?' HTTP '+http:'')+' '+code+']','warn')
  }
  function transcriptionError(response,data){
    var http=response.status,code=data&&typeof data.error==='string'?data.error:'';
    var known={
      UNAUTHORIZED:'La sesión no autoriza el audio. Vuelve a entrar.',
      ETERNA_SUBSCRIPTION_REQUIRED:'El servidor requiere una suscripción o prueba activa. Revisa Zona Familiar.',
      ETERNA_LEGAL_ACCEPTANCE_REQUIRED:'Falta completar la autorización legal en Zona Familiar.',
      PARENTAL_AUTHORIZATION_REQUIRED:'Falta la autorización de un adulto en Zona Familiar.',
      ADULT_EMAIL_VERIFICATION_REQUIRED:'Falta verificar el correo del adulto en Zona Familiar.',
      STUDENT_PROFILE_REQUIRED:'Falta completar el perfil escolar en Zona Familiar.',
      ETERNA_AUDIO_DISABLED:'La entrada por voz está desactivada en Zona Familiar.',
      AUDIO_REQUIRED:'El servidor no ha recibido el archivo de audio.',
      AUDIO_TOO_LARGE:'La grabación supera el tamaño permitido. Prueba una frase más corta.',
      AUDIO_TYPE_NOT_ALLOWED:'El servidor no acepta el formato de esta grabación.',
      ORIGIN_NOT_ALLOWED:'El servidor no autoriza el origen de esta página.',
      NOT_FOUND:'No se encuentra el servicio de transcripción.',
      ETERNA_BACKEND_ERROR:'El servidor de Eterna ha fallado al procesar la transcripción.'
    };
    if(Object.prototype.hasOwnProperty.call(known,code)){voiceDiagnostic(http,code,known[code]);return}
    var messages={401:'La sesión no autoriza el audio. Vuelve a entrar.',402:'El servidor requiere acceso activo. Revisa Zona Familiar.',403:'El servidor ha rechazado el permiso para transcribir.',404:'No se encuentra el servicio de transcripción.',413:'La grabación supera el tamaño permitido.',415:'El servidor no acepta el formato de esta grabación.',429:'El servicio de voz ha alcanzado un límite temporal.'};
    voiceDiagnostic(http,'HTTP_ERROR',messages[http]||(http>=500?'El servicio de transcripción ha devuelto un error del servidor.':'El servicio de transcripción ha rechazado la petición.'))
  }

  async function transcribe(blob,type,s){
    if(!current(s))return;
    s.transcribing=true;
    status('Transcribiendo lo que dijiste…','warn');
    var base=String(root.COCO_CONFIG&&root.COCO_CONFIG.eternaEndpoint||'').replace(/\/+$/,'');if(!base){if(pending===s)pending=null;voiceDiagnostic(0,'ENDPOINT_MISSING','Eterna no tiene configurado el servicio de voz.');return}
    var token=await authToken(false);if(!current(s))return;if(!token){if(pending===s)pending=null;voiceDiagnostic(0,'SESSION_MISSING','La sesión ha caducado. Vuelve a entrar y prueba el micrófono.');return}
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

  function stop(reason){
    if(!session)return;var s=session;session=null;s.stopReason=reason;
    if(reason==='cancel'||reason==='close'||reason==='no-speech'||reason==='error'){s.cancelled=true;if(pending===s)pending=null}
    if(s.hardTimer)clearTimeout(s.hardTimer);if(s.noSpeechTimer)clearTimeout(s.noSpeechTimer);if(s.silenceTimer)clearTimeout(s.silenceTimer);if(s.raf)cancelAnimationFrame(s.raf);
    try{if(s.rec&&s.rec.state==='recording')s.rec.stop()}catch(e){}
    if(s.cancelled){releaseStream(s);closeInputGraph(s)}
    setMic(false);
    if(reason==='no-speech')status('No he oído voz. Toca el micrófono y vuelve a intentarlo.','warn')
  }

  async function start(){
    // A late synthetic stop must not cancel transcription and reopen capture.
    if(pending&&pending.transcribing||dispatchTurn)return;
    if(session){stop('manual');return}
    cancelPending();
    var o=overlay(),field=input();if(!o||!o.classList.contains('is-open')||!field||field.disabled||busy()||document.hidden)return;
    root.__ETERNA_VOICE_DIALOG_ACTIVE__=false;
    if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia||typeof MediaRecorder==='undefined'){status('Este dispositivo no permite grabar audio aquí.','warn');return}
    var s=newTurn();openInputGraph(s);
    try{
      var stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});s.stream=stream;
      if(!current(s)){releaseStream(s);closeInputGraph(s);return}
      try{localStorage.setItem('coco_eterna_mic_granted_v1','1')}catch(_e){}
      var mime=recorderMime(),rec=mime?new MediaRecorder(stream,{mimeType:mime}):new MediaRecorder(stream),chunks=[];
      var ctx=s.audioCtx,analyser=null,data=null,source=null,sink=null;
      if(!await inputGraphReady(s)){inputFault(s,'AUDIO_CONTEXT_NOT_RUNNING');return}
      if(!current(s)){releaseStream(s);closeInputGraph(s);return}
      try{
        source=ctx.createMediaStreamSource(stream);analyser=ctx.createAnalyser();analyser.fftSize=1024;analyser.smoothingTimeConstant=.2;source.connect(analyser);
        s.source=source;s.analyser=analyser;
        // A zero-gain output keeps the graph processing without microphone feedback.
        if(ctx.createGain&&analyser.connect){sink=ctx.createGain();sink.gain.value=0;analyser.connect(sink);sink.connect(ctx.destination);s.sink=sink}
        s.floatSamples=typeof analyser.getFloatTimeDomainData==='function';
        data=s.floatSamples?new Float32Array(analyser.fftSize):new Uint8Array(analyser.fftSize)
      }catch(e){inputFault(s,'AUDIO_ANALYSER_UNAVAILABLE');return}
      if(!current(s)){releaseStream(s);closeInputGraph(s);return}
      Object.assign(s,{rec:rec,chunks:chunks,audioCtx:ctx,analyser:analyser,data:data,startedAt:Date.now(),speechAt:0,lastVoiceAt:0,noise:.001,voiceEvidence:0,lastSampleAt:Date.now(),sampleCount:0,peakRms:0,lastClock:ctx.currentTime,clockAt:Date.now(),mutedAt:0,resuming:false,raf:0,silenceTimer:null,hardTimer:null,noSpeechTimer:null,mime:mime,pauseMs:silenceMs()});session=s;
      rec.ondataavailable=function(ev){if(ev.data&&ev.data.size)chunks.push(ev.data)};
      rec.onerror=function(){if(current(s)){stop('error');status('La grabación se interrumpió. Vuelve a tocar el micrófono.','warn')}};
      rec.onstop=async function(){
        releaseStream(s);closeInputGraph(s);if(s.processed)return;s.processed=true;
        if(session===s)stop('ended');
        if(!current(s))return;
        var type=rec.mimeType||mime||(chunks[0]&&chunks[0].type)||'audio/webm',blob=new Blob(chunks,{type:type});
        if(blob.size<900){if(pending===s)pending=null;status('No he oído suficiente audio. Vuelve a tocar el micrófono.','warn');return}
        await transcribe(blob,type,s)
      };
      rec.start(250);setMic(true);status('Escuchando… al terminar, enviaré tu pregunta automáticamente.','ok');
      s.hardTimer=setTimeout(function(){if(session===s)stop('max')},maxMs());
      s.noSpeechTimer=setTimeout(function(){if(session!==s||s.speechAt)return;if(!s.audioCtx||s.audioCtx.state!=='running'||!s.sampleCount){inputFault(s,'AUDIO_INPUT_NOT_READY');return}stop('no-speech')},noSpeechMs());
      function loop(){
        if(session!==s)return;
        var now=Date.now();
        if(!current(s)){cancelPending();return}
        var track=stream.getAudioTracks?stream.getAudioTracks()[0]:null;
        if(stream.active===false||track&&(track.readyState==='ended'||track.enabled===false)){inputFault(s,'AUDIO_TRACK_ENDED');return}
        if(track&&track.muted){
          if(!s.mutedAt)s.mutedAt=now;
          if(s.silenceTimer){clearTimeout(s.silenceTimer);s.silenceTimer=null}
          if(now-s.mutedAt>1500){inputFault(s,'AUDIO_TRACK_MUTED');return}
        }else if(ctx.state!=='running'){
          resumeInterruptedGraph(s)
        }else{
          if(s.mutedAt){s.mutedAt=0;if(s.speechAt)s.lastVoiceAt=now}
          // 'running' alone is insufficient on some mobile audio interruptions.
          if(typeof ctx.currentTime==='number'){
            if(ctx.currentTime!==s.lastClock){s.lastClock=ctx.currentTime;s.clockAt=now}
            else if(now-s.clockAt>1500){inputFault(s,'AUDIO_CLOCK_STALLED');return}
          }
          try{if(!sampleVoice(s,now)){inputFault(s,'AUDIO_ANALYSIS_INVALID');return}}catch(e){inputFault(s,'AUDIO_ANALYSIS_UNAVAILABLE');return}
        }
        s.raf=requestAnimationFrame(loop)
      }
      if(analyser)s.raf=requestAnimationFrame(loop);
    }catch(e){
      var relevant=current(s);if(session===s)stop('error');releaseStream(s);closeInputGraph(s);if(pending===s)pending=null;
      if(!relevant)return;setMic(false);var name=String(e&&e.name||'');if(name==='NotAllowedError'||name==='SecurityError')status('El micrófono está bloqueado. Actívalo en los permisos de Coco en Forma y vuelve a tocarlo.','warn');else status('No pude abrir el micrófono. Vuelve a intentarlo.','warn')
    }
  }

  installStyle();
  document.addEventListener('click',function(ev){var o=overlay();if(!o||!o.classList.contains('is-open'))return;var target=ev.target&&ev.target.closest?ev.target.closest('#eternaOverlayV159 [data-et-mic],#eternaOverlayV159 [data-et-startaction="voice"]'):null;if(!target){if(pending&&ev.target&&ev.target.closest&&ev.target.closest('#eternaOverlayV159 [data-et-send]'))cancelPending();return}ev.preventDefault();ev.stopImmediatePropagation();modernizeMic();start()},true);
  document.addEventListener('input',function(ev){if(!writing&&(pending||dispatchTurn)&&ev.target===input())cancelPending()},true);
  document.addEventListener('keydown',function(ev){if(pending&&ev.target===input()&&ev.key==='Enter'&&!ev.shiftKey)cancelPending()},true);
  document.addEventListener('visibilitychange',function(){if(document.hidden)cancelPending()});
  ['coco:eterna-close','coco:eterna-context-invalidated','coco:eterna-ui-reset','pagehide'].forEach(function(event){root.addEventListener(event,cancelPending)});
  root.addEventListener('coco:daily-user',function(ev){if(pending&&ev&&ev.detail&&pending.key.split('|')[0]!==String(ev.detail.userId||''))cancelPending()});
  var mo=new MutationObserver(function(){installStyle();removeConversation();modernizeMic();if(pending&&!current(pending))cancelPending()});try{mo.observe(document.documentElement,{childList:true,subtree:true})}catch(e){}
  setTimeout(function(){removeConversation();modernizeMic()},0)
})(window);
