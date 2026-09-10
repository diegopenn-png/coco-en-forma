/* ETERNA iOS/PWA voice engine · v161.2.0
 * One live microphone stream per spoken conversation on iPhone/iPad.
 * Normal mic = one turn. Conversation = keep stream open, pause while Eterna speaks,
 * then record the next turn on the SAME stream (no repeated getUserMedia race).
 */
(function(root){
  'use strict';
  if(root.__ETERNA_IOS_VOICE_ENGINE_V161200__)return;
  root.__ETERNA_IOS_VOICE_ENGINE_V161200__=true;
  root.__ETERNA_IOS_VOICE_ENGINE_ACTIVE__=true;

  var media=navigator.mediaDevices;
  if(!media||typeof media.getUserMedia!=='function'||typeof MediaRecorder==='undefined')return;
  function isIOS(){var ua=String(navigator.userAgent||''),p=String(navigator.platform||''),t=Number(navigator.maxTouchPoints||0);return /iPhone|iPad|iPod/i.test(ua)||(p==='MacIntel'&&t>1)}
  if(!isIOS())return;

  var nativeGUM=media.getUserMedia.bind(media);
  var armedPromise=null;
  var liveMicStream=null;
  var audioCtx=null;
  var turn=null;
  var persistent=false;
  var waitingForReply=false;
  var restartTimer=0;

  function overlay(){return document.getElementById('eternaOverlayV159')}
  function converse(){var o=overlay();return o&&o.querySelector('[data-et-converse]')}
  function input(){var o=overlay();return o&&o.querySelector('[data-et-input]')}
  function send(){var o=overlay();return o&&o.querySelector('[data-et-send]')}
  function endpoint(path){var c=root.COCO_CONFIG||{},b=String(c.eternaEndpoint||'').replace(/\/+$/,'');return b?b+path:''}
  function liveStream(s){try{return !!(s&&s.getAudioTracks&&s.getAudioTracks().some(function(t){return t.readyState==='live'}))}catch(e){return false}}
  function stopStream(s){try{(s&&s.getTracks?s.getTracks():[]).forEach(function(t){try{t.stop()}catch(e){}})}catch(e){}}
  function setTracksEnabled(on){try{(liveMicStream&&liveMicStream.getAudioTracks?liveMicStream.getAudioTracks():[]).forEach(function(t){t.enabled=!!on})}catch(e){}}
  function clearRestart(){if(restartTimer){clearTimeout(restartTimer);restartTimer=0}}
  function closeCtx(){if(audioCtx){try{if(audioCtx.state!=='closed')audioCtx.close()}catch(e){}audioCtx=null}}

  function setButton(state){
    var b=converse();if(!b)return;
    var title=b.querySelector('[data-et-converse-title]'),copy=b.querySelector('[data-et-converse-copy]');
    var map={idle:['Conversar con Eterna','Habla y Eterna te responde con su voz'],starting:['Activando el micrófono…','La conversación seguirá abierta'],listening:['Te escucho…','Habla con normalidad · toca aquí para terminar'],transcribing:['Entendiendo tu voz…','La conversación sigue abierta'],thinking:['Eterna está pensando…','Preparando su respuesta'],preparing:['Preparando su voz…','Después volverá a escucharte'],speaking:['Eterna está hablando…','Cuando termine, volveré a escucharte']};
    var v=map[state]||map.idle;if(title)title.textContent=v[0];if(copy)copy.textContent=v[1];
    b.classList.toggle('is-listening',state==='listening');b.classList.toggle('is-speaking',state==='speaking');b.classList.toggle('is-persistent',persistent);b.setAttribute('aria-pressed',persistent?'true':'false')
  }

  function notice(text){var o=overlay(),box=o&&o.querySelector('.eternaV160LiveState');if(!box)return;if(!text){box.classList.remove('is-visible');box.textContent='';return}box.classList.add('is-visible');box.textContent=text}
  function clearStaleNotice(){var o=overlay(),box=o&&o.querySelector('.eternaV160LiveState');if(box&&/transcribirlo|reactivar el micrófono|permiso del navegador|abrir el micrófono/i.test(String(box.textContent||'')))notice('')}
  function authToken(){var cli=root.__COCO_SUPABASE_CLIENT,c=root.COCO_CONFIG||{};try{if(!cli&&root.supabase&&root.supabase.createClient&&c.url&&c.clave)cli=root.__COCO_SUPABASE_CLIENT=root.supabase.createClient(c.url,c.clave,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}})}catch(e){}if(!cli||!cli.auth)return Promise.resolve('');return cli.auth.getSession().then(function(r){return r&&r.data&&r.data.session&&r.data.session.access_token||''}).catch(function(){return''})}
  function fileName(type){type=String(type||'').toLowerCase();if(type.indexOf('mp4')>=0)return'pregunta.m4a';if(type.indexOf('ogg')>=0)return'pregunta.ogg';if(type.indexOf('webm')>=0)return'pregunta.webm';return'pregunta.m4a'}
  function preferredMime(){var list=['audio/mp4','audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus','audio/ogg'];for(var i=0;i<list.length;i++){try{if(MediaRecorder.isTypeSupported(list[i]))return list[i]}catch(e){}}return''}

  /* iOS requires the permission request and AudioContext resume to begin from a real gesture. */
  function armFromGesture(){
    if(liveStream(liveMicStream))return;
    if(!armedPromise)armedPromise=nativeGUM({audio:true}).then(function(s){liveMicStream=s;armedPromise=null;return s}).catch(function(e){armedPromise=null;throw e});
    var Ctx=root.AudioContext||root.webkitAudioContext;
    if(Ctx&&!audioCtx){try{audioCtx=new Ctx();if(audioCtx.state==='suspended')audioCtx.resume().catch(function(){})}catch(e){audioCtx=null}}
  }
  async function ensureStream(){
    if(liveStream(liveMicStream))return liveMicStream;
    var s=armedPromise?await armedPromise:await nativeGUM({audio:true});
    liveMicStream=s;return s
  }

  function cleanupTurn(){
    var t=turn;if(!t)return;
    if(t.raf)cancelAnimationFrame(t.raf);if(t.maxTimer)clearTimeout(t.maxTimer);turn=null
  }

  function stopTurn(cancelled,reason){
    var t=turn;if(!t||t.stopping)return;t.stopping=true;t.cancelled=!!cancelled;t.reason=reason||'';
    if(t.raf)cancelAnimationFrame(t.raf);if(t.maxTimer)clearTimeout(t.maxTimer);
    try{if(t.rec&&t.rec.state==='recording'){try{if(t.rec.requestData)t.rec.requestData()}catch(e){}t.rec.stop();return}}catch(e){}
    cleanupTurn()
  }

  function startVad(t){
    var Ctx=root.AudioContext||root.webkitAudioContext;if(!Ctx)return;
    try{
      if(!audioCtx||audioCtx.state==='closed')audioCtx=new Ctx();
      if(audioCtx.state==='suspended')audioCtx.resume().catch(function(){});
      var src=audioCtx.createMediaStreamSource(t.stream),an=audioCtx.createAnalyser();an.fftSize=1024;an.smoothingTimeConstant=.18;src.connect(an);t.an=an;
      var data=new Uint8Array(an.fftSize),started=performance.now(),heard=false,lastSpeech=0,candidateAt=0,noise=.0055,smoothed=0;
      function tick(){
        if(!turn||turn!==t||t.stopping)return;
        if(audioCtx&&audioCtx.state==='suspended'){audioCtx.resume().catch(function(){})}
        an.getByteTimeDomainData(data);var sum=0;for(var i=0;i<data.length;i++){var x=(data[i]-128)/128;sum+=x*x}
        var rms=Math.sqrt(sum/data.length),now=performance.now(),elapsed=now-started;smoothed=smoothed?(.72*smoothed+.28*rms):rms;
        var attack=Math.max(.010,Math.min(.050,noise*2.35)),release=Math.max(.007,Math.min(.035,noise*1.45));
        if(!heard){
          if(!candidateAt&&smoothed<attack){var learn=elapsed<800?.10:.018;noise=Math.max(.003,Math.min(.028,noise*(1-learn)+smoothed*learn))}
          attack=Math.max(.010,Math.min(.050,noise*2.35));release=Math.max(.007,Math.min(.035,noise*1.45));
          if(smoothed>attack){if(!candidateAt)candidateAt=now;var held=now-candidateAt;if(held>=150||(smoothed>attack*1.8&&held>=80)){heard=true;lastSpeech=now}}
          else if(smoothed<release*1.1)candidateAt=0
        }else if(smoothed>release)lastSpeech=now;

        /* 5º Primaria: enough pause to think, but never hangs forever. */
        if(heard&&lastSpeech&&now-lastSpeech>2500&&elapsed>1100){stopTurn(false,'silence');return}
        if(!heard&&elapsed>13000){stopTurn(true,'no-speech');return}
        t.raf=requestAnimationFrame(tick)
      }
      t.raf=requestAnimationFrame(tick)
    }catch(e){
      /* Even if WebAudio analysis is unavailable, the hard timer below always ends the turn. */
    }
  }

  async function transcribe(blob,type,keepSession){
    if(!blob||blob.size<300){if(keepSession){setButton('listening');scheduleNextTurn(800)}else setButton('idle');return}
    if(keepSession)setButton('transcribing');
    try{
      var token=await authToken(),url=endpoint('/v1/transcribe');if(!token||!url)throw new Error('NO_AUTH');
      var fd=new FormData();fd.append('audio',blob,fileName(type||blob.type));
      var r=await fetch(url,{method:'POST',headers:{Authorization:'Bearer '+token},body:fd}),d=await r.json().catch(function(){return{}}),text=String(d&&d.text||'').trim();
      if(!r.ok||!text)throw new Error('TRANSCRIBE_'+r.status);
      var i=input(),s=send();if(!i||!s)throw new Error('UI_MISSING');
      i.value=text;i.dispatchEvent(new Event('input',{bubbles:true}));waitingForReply=keepSession;
      if(keepSession){root.__ETERNA_VOICE_DIALOG_ACTIVE__=true;root.__ETERNA_PERSISTENT_CONVERSATION__=true;setButton('thinking');setTracksEnabled(false)}
      setTimeout(function(){try{if(s.disabled)s.disabled=false;s.click()}catch(e){}},40)
    }catch(e){
      notice('No he podido entender el audio. Toca de nuevo y vuelve a intentarlo.');
      if(keepSession){persistent=false;waitingForReply=false;root.__ETERNA_VOICE_DIALOG_ACTIVE__=false;root.__ETERNA_PERSISTENT_CONVERSATION__=false;setTracksEnabled(false);stopStream(liveMicStream);liveMicStream=null;setButton('idle')}
      else{stopStream(liveMicStream);liveMicStream=null;setButton('idle')}
    }
  }

  async function beginTurn(keepSession){
    if(turn)return;clearStaleNotice();
    try{
      var stream=await ensureStream();if(!liveStream(stream))throw new Error('MIC_NOT_LIVE');setTracksEnabled(true);
      var type=preferredMime(),chunks=[],rec=type?new MediaRecorder(stream,{mimeType:type}):new MediaRecorder(stream),t={stream:stream,rec:rec,chunks:chunks,type:type||rec.mimeType||'',stopping:false,cancelled:false,reason:'',raf:0,maxTimer:0};turn=t;
      rec.ondataavailable=function(e){if(e.data&&e.data.size)chunks.push(e.data)};
      rec.onerror=function(){stopTurn(true,'recorder-error')};
      rec.onstop=function(){
        if(turn===t)turn=null;if(t.raf)cancelAnimationFrame(t.raf);if(t.maxTimer)clearTimeout(t.maxTimer);
        if(t.cancelled){if(!keepSession){stopStream(liveMicStream);liveMicStream=null;setButton('idle')}else{setButton('listening');scheduleNextTurn(700)}return}
        var blob=new Blob(chunks,{type:t.type||'audio/mp4'});
        if(!keepSession){stopStream(liveMicStream);liveMicStream=null}
        transcribe(blob,t.type,keepSession)
      };
      rec.start(250);if(keepSession)setButton('listening');
      startVad(t);
      /* Hard ceiling guarantees the UI can never remain stuck on listening. */
      t.maxTimer=setTimeout(function(){stopTurn(false,'hard-max')},28000)
    }catch(e){
      notice('No he podido abrir el micrófono. Comprueba el permiso de Coco en Forma y vuelve a tocar el botón.');
      if(keepSession){persistent=false;root.__ETERNA_VOICE_DIALOG_ACTIVE__=false;root.__ETERNA_PERSISTENT_CONVERSATION__=false;setButton('idle')}
    }
  }

  function scheduleNextTurn(ms){
    clearRestart();if(!persistent||waitingForReply)return;
    restartTimer=setTimeout(function(){restartTimer=0;if(!persistent||waitingForReply||document.hidden||!overlay()||!overlay().classList.contains('is-open'))return;beginTurn(true)},ms||650)
  }

  function beginConversation(){persistent=true;waitingForReply=false;root.__ETERNA_VOICE_DIALOG_ACTIVE__=true;root.__ETERNA_PERSISTENT_CONVERSATION__=true;setButton('starting');beginTurn(true)}
  function endConversation(){
    persistent=false;waitingForReply=false;root.__ETERNA_VOICE_DIALOG_ACTIVE__=false;root.__ETERNA_PERSISTENT_CONVERSATION__=false;clearRestart();
    if(turn)stopTurn(true,'user-end');setTracksEnabled(false);stopStream(liveMicStream);liveMicStream=null;armedPromise=null;closeCtx();setButton('idle')
  }

  ['pointerdown','touchstart'].forEach(function(type){root.addEventListener(type,function(e){var t=e.target&&e.target.closest?e.target.closest('#eternaOverlayV159 [data-et-converse],#eternaOverlayV159 [data-et-mic]'):null;if(t)armFromGesture()},true)});

  root.addEventListener('click',function(e){
    var c=e.target&&e.target.closest?e.target.closest('#eternaOverlayV159 [data-et-converse]'):null;
    var m=e.target&&e.target.closest?e.target.closest('#eternaOverlayV159 [data-et-mic]'):null;
    if(!c&&!m)return;
    e.preventDefault();e.stopImmediatePropagation();
    if(c){if(persistent){endConversation();return}beginConversation();return}
    if(turn){stopTurn(false,'manual');return}
    beginTurn(false)
  },true);

  root.addEventListener('coco:eterna-voice-state',function(e){
    if(!persistent)return;var st=e&&e.detail&&e.detail.state||'';
    if(st==='thinking'){waitingForReply=true;setTracksEnabled(false);setButton('thinking')}
    else if(st==='preparing'){waitingForReply=true;setTracksEnabled(false);setButton('preparing')}
    else if(st==='speaking'){waitingForReply=true;setTracksEnabled(false);setButton('speaking')}
    else if(st==='idle'&&waitingForReply){waitingForReply=false;setTracksEnabled(true);scheduleNextTurn(650)}
  });
  root.addEventListener('coco:eterna-response-applied',function(){if(persistent){waitingForReply=true;root.__ETERNA_VOICE_DIALOG_ACTIVE__=true;setTracksEnabled(false);setButton('preparing')}});
  root.addEventListener('coco:eterna-context-invalidated',endConversation);
  root.addEventListener('coco:eterna-ui-reset',endConversation);
  document.addEventListener('visibilitychange',function(){if(document.hidden){if(persistent)endConversation();else{if(turn)stopTurn(true,'hidden');stopStream(liveMicStream);liveMicStream=null;closeCtx()}}},{passive:true});
})(window);
