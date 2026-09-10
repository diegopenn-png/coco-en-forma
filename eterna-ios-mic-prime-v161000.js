/* ETERNA iOS/PWA voice engine · v161.1.0
 * One owner for iPhone/iPad voice capture: trusted gesture -> live stream -> MediaRecorder -> transcribe.
 * Avoids the previous async legal/replay race that could lose the microphone before recording started.
 * Desktop/non-iOS remains on the canonical Eterna voice path.
 */
(function(root){
  'use strict';
  if(root.__ETERNA_IOS_VOICE_ENGINE_V161100__)return;
  root.__ETERNA_IOS_VOICE_ENGINE_V161100__=true;

  var media=navigator.mediaDevices;
  if(!media||typeof media.getUserMedia!=='function'||typeof MediaRecorder==='undefined')return;

  function isIOS(){
    var ua=String(navigator.userAgent||''),p=String(navigator.platform||''),t=Number(navigator.maxTouchPoints||0);
    return /iPhone|iPad|iPod/i.test(ua)||(p==='MacIntel'&&t>1)
  }
  if(!isIOS())return;

  var nativeGUM=media.getUserMedia.bind(media);
  var armed=null,session=null,persistent=false,restartTimer=0;
  var SILENCE_MS=2400,NO_SPEECH_MS=12000,MAX_MS=26000;

  function overlay(){return document.getElementById('eternaOverlayV159')}
  function mic(){var o=overlay();return o&&o.querySelector('[data-et-mic]')}
  function converse(){var o=overlay();return o&&o.querySelector('[data-et-converse]')}
  function input(){var o=overlay();return o&&o.querySelector('[data-et-input]')}
  function send(){var o=overlay();return o&&o.querySelector('[data-et-send]')}
  function endpoint(path){var c=root.COCO_CONFIG||{},b=String(c.eternaEndpoint||'').replace(/\/+$/,'');return b?b+path:''}
  function liveStream(s){try{return !!(s&&s.getAudioTracks&&s.getAudioTracks().some(function(t){return t.readyState==='live'}))}catch(e){return false}}
  function stopStream(s){try{(s&&s.getTracks?s.getTracks():[]).forEach(function(t){try{t.stop()}catch(e){}})}catch(e){}}
  function clearRestart(){if(restartTimer){clearTimeout(restartTimer);restartTimer=0}}

  function setButton(state){
    var b=converse();if(!b)return;
    var title=b.querySelector('[data-et-converse-title]'),copy=b.querySelector('[data-et-converse-copy]');
    var map={
      idle:['Conversar con Eterna','Habla y Eterna te responde con su voz'],
      starting:['Activando el micrófono…','La conversación seguirá abierta'],
      listening:['Te escucho…','Habla con normalidad · toca aquí para terminar'],
      transcribing:['Entendiendo tu voz…','La conversación sigue abierta'],
      thinking:['Eterna está pensando…','Preparando su respuesta'],
      preparing:['Preparando su voz…','Después volverá a escucharte'],
      speaking:['Eterna está hablando…','Cuando termine, volveré a escucharte']
    },v=map[state]||map.idle;
    if(title)title.textContent=v[0];if(copy)copy.textContent=v[1];
    b.classList.toggle('is-listening',state==='listening');
    b.classList.toggle('is-speaking',state==='speaking');
    b.classList.toggle('is-persistent',persistent)
  }

  function clearStaleNotice(){
    var o=overlay();if(!o)return;
    var box=o.querySelector('.eternaV160LiveState');
    if(box&&/transcribirlo|reactivar el micrófono|permiso del navegador/i.test(String(box.textContent||''))){box.classList.remove('is-visible');box.textContent=''}
  }

  function authToken(){
    var cli=root.__COCO_SUPABASE_CLIENT,c=root.COCO_CONFIG||{};
    try{if(!cli&&root.supabase&&root.supabase.createClient&&c.url&&c.clave)cli=root.__COCO_SUPABASE_CLIENT=root.supabase.createClient(c.url,c.clave,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}})}catch(e){}
    if(!cli||!cli.auth)return Promise.resolve('');
    return cli.auth.getSession().then(function(r){return r&&r.data&&r.data.session&&r.data.session.access_token||''}).catch(function(){return''})
  }

  function fileName(type){type=String(type||'').toLowerCase();if(type.indexOf('mp4')>=0)return'pregunta.m4a';if(type.indexOf('ogg')>=0)return'pregunta.ogg';if(type.indexOf('webm')>=0)return'pregunta.webm';return'pregunta.m4a'}
  function mime(){var list=['audio/mp4','audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus','audio/ogg'];for(var i=0;i<list.length;i++){try{if(MediaRecorder.isTypeSupported(list[i]))return list[i]}catch(e){}}return''}

  function armFromGesture(){
    if(armed&&armed.promise)return;
    var h={stream:null,promise:null,used:false};
    h.promise=nativeGUM({audio:true}).then(function(s){h.stream=s;return s}).catch(function(e){if(armed===h)armed=null;throw e});
    armed=h;
  }

  function takeArmed(){
    var h=armed;armed=null;
    if(!h)return nativeGUM({audio:true});
    h.used=true;
    return Promise.resolve(h.promise).then(function(s){if(!liveStream(s))throw new Error('MIC_NOT_LIVE');return s})
  }

  function finish(cancelled,reason){
    var s=session;if(!s||s.stopping)return;
    s.stopping=true;s.cancelled=!!cancelled;s.reason=reason||'';
    if(s.raf)cancelAnimationFrame(s.raf);if(s.maxTimer)clearTimeout(s.maxTimer);if(s.ctx){try{s.ctx.close()}catch(e){}}
    try{if(s.rec&&s.rec.state==='recording'){try{s.rec.requestData&&s.rec.requestData()}catch(e){}s.rec.stop();return}}catch(e){}
    stopStream(s.stream);session=null;
    if(persistent)setButton('starting');else setButton('idle')
  }

  function startVad(s){
    var Ctx=root.AudioContext||root.webkitAudioContext;if(!Ctx)return;
    try{
      var ctx=new Ctx(),src=ctx.createMediaStreamSource(s.stream),an=ctx.createAnalyser();an.fftSize=1024;src.connect(an);s.ctx=ctx;s.an=an;
      var data=new Uint8Array(an.fftSize),started=performance.now(),lastSpeech=0,heard=false;
      function tick(){
        if(!session||session!==s||s.stopping)return;
        an.getByteTimeDomainData(data);var sum=0;for(var i=0;i<data.length;i++){var x=(data[i]-128)/128;sum+=x*x}var rms=Math.sqrt(sum/data.length),now=performance.now();
        if(rms>0.018){heard=true;lastSpeech=now}
        if(heard&&lastSpeech&&now-lastSpeech>SILENCE_MS&&now-started>900){finish(false,'silence');return}
        if(!heard&&now-started>NO_SPEECH_MS){finish(true,'no-speech');return}
        s.raf=requestAnimationFrame(tick)
      }
      s.raf=requestAnimationFrame(tick)
    }catch(e){}
  }

  async function transcribe(blob,type,wasPersistent){
    if(!blob||blob.size<300){if(wasPersistent){setButton('starting');scheduleRestart(700)}return}
    if(wasPersistent)setButton('transcribing');
    try{
      var token=await authToken(),url=endpoint('/v1/transcribe');if(!token||!url)throw new Error('NO_AUTH');
      var fd=new FormData();fd.append('audio',blob,fileName(type||blob.type));
      var r=await fetch(url,{method:'POST',headers:{Authorization:'Bearer '+token},body:fd}),d=await r.json().catch(function(){return{}}),text=String(d&&d.text||'').trim();
      if(!r.ok||!text)throw new Error('TRANSCRIBE_'+r.status);
      var i=input(),s=send();if(!i||!s)throw new Error('UI');
      i.value=text;i.dispatchEvent(new Event('input',{bubbles:true}));
      if(wasPersistent){root.__ETERNA_VOICE_DIALOG_ACTIVE__=true;root.__ETERNA_PERSISTENT_CONVERSATION__=true;setButton('thinking')}
      setTimeout(function(){try{if(s.disabled)s.disabled=false;s.click()}catch(e){}},30)
    }catch(e){
      if(wasPersistent){setButton('idle');persistent=false;root.__ETERNA_VOICE_DIALOG_ACTIVE__=false;root.__ETERNA_PERSISTENT_CONVERSATION__=false}
      var o=overlay(),box=o&&o.querySelector('.eternaV160LiveState');if(box){box.classList.add('is-visible');box.textContent='No he podido entender el audio. Toca el micrófono para intentarlo otra vez.'}
    }
  }

  async function beginRecording(asPersistent){
    if(session)return;
    clearStaleNotice();
    if(asPersistent){persistent=true;root.__ETERNA_VOICE_DIALOG_ACTIVE__=true;root.__ETERNA_PERSISTENT_CONVERSATION__=true;setButton('starting')}
    try{
      var stream=await takeArmed();if(!liveStream(stream))throw new Error('MIC_NOT_LIVE');
      var type=mime(),chunks=[],rec=type?new MediaRecorder(stream,{mimeType:type}):new MediaRecorder(stream),s={stream:stream,rec:rec,chunks:chunks,type:type||rec.mimeType||'',stopping:false,raf:0,maxTimer:0,ctx:null};session=s;
      rec.ondataavailable=function(e){if(e.data&&e.data.size)chunks.push(e.data)};
      rec.onerror=function(){finish(true,'recorder-error')};
      rec.onstop=function(){
        if(session===s)session=null;stopStream(stream);if(s.raf)cancelAnimationFrame(s.raf);if(s.maxTimer)clearTimeout(s.maxTimer);if(s.ctx){try{s.ctx.close()}catch(e){}}
        if(s.cancelled){if(persistent){setButton('starting');scheduleRestart(700)}else setButton('idle');return}
        var blob=new Blob(chunks,{type:s.type||'audio/mp4'});transcribe(blob,s.type,asPersistent)
      };
      rec.start(250);if(asPersistent)setButton('listening');
      startVad(s);s.maxTimer=setTimeout(function(){finish(false,'max')},MAX_MS)
    }catch(e){
      if(asPersistent){persistent=false;root.__ETERNA_VOICE_DIALOG_ACTIVE__=false;root.__ETERNA_PERSISTENT_CONVERSATION__=false;setButton('idle')}
      var o=overlay(),box=o&&o.querySelector('.eternaV160LiveState');if(box){box.classList.add('is-visible');box.textContent='No he podido abrir el micrófono. Cierra y vuelve a abrir Eterna e inténtalo de nuevo.'}
    }
  }

  function scheduleRestart(ms){
    clearRestart();if(!persistent)return;
    restartTimer=setTimeout(function(){restartTimer=0;if(!persistent||document.hidden||!overlay()||!overlay().classList.contains('is-open'))return;armFromGesture();beginRecording(true)},ms||650)
  }

  function endPersistent(){
    persistent=false;root.__ETERNA_VOICE_DIALOG_ACTIVE__=false;root.__ETERNA_PERSISTENT_CONVERSATION__=false;clearRestart();
    if(session)finish(true,'user-end');if(armed){Promise.resolve(armed.promise).then(stopStream).catch(function(){});armed=null}setButton('idle')
  }

  ['pointerdown','touchstart'].forEach(function(type){root.addEventListener(type,function(e){var t=e.target&&e.target.closest?e.target.closest('#eternaOverlayV159 [data-et-converse],#eternaOverlayV159 [data-et-mic]'):null;if(t)armFromGesture()},true)});

  root.addEventListener('click',function(e){
    var c=e.target&&e.target.closest?e.target.closest('#eternaOverlayV159 [data-et-converse]'):null;
    var m=e.target&&e.target.closest?e.target.closest('#eternaOverlayV159 [data-et-mic]'):null;
    if(!c&&!m)return;
    e.preventDefault();e.stopImmediatePropagation();
    if(c){if(persistent){endPersistent();return}beginRecording(true);return}
    if(session){finish(false,'manual');return}
    beginRecording(false)
  },true);

  root.addEventListener('coco:eterna-voice-state',function(e){
    if(!persistent)return;var st=e&&e.detail&&e.detail.state||'';
    if(st==='thinking')setButton('thinking');else if(st==='preparing')setButton('preparing');else if(st==='speaking')setButton('speaking');
    else if(st==='idle'&&!session)scheduleRestart(700)
  });
  root.addEventListener('coco:eterna-response-applied',function(){if(persistent){root.__ETERNA_VOICE_DIALOG_ACTIVE__=true;setButton('preparing')}});
  root.addEventListener('coco:eterna-context-invalidated',endPersistent);
  root.addEventListener('coco:eterna-ui-reset',endPersistent);
  document.addEventListener('visibilitychange',function(){if(document.hidden){if(session)finish(true,'hidden');if(persistent)endPersistent()}},{passive:true});
})(window);
