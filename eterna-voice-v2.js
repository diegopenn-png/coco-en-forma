/* ETERNA Voice V2 · isolated controller · 2026-09-10
 * Rebuilds microphone + continuous spoken conversation without touching pedagogy,
 * auth, payments, games, scoring, Safety/School Scope or family settings.
 */
(function(root){
  'use strict';
  if(root.__ETERNA_VOICE_V2__) return;
  root.__ETERNA_VOICE_V2__=true;

  var active=false, conversation=false, recorder=null, stream=null, chunks=[], vad=null, hardTimer=null;
  var speechSeen=false, speechStartedAt=0, lastSpeechAt=0, noise=.008, smoothed=0, waitingReply=false;
  var audioEl=null, audioUrl=null, stopping=false;

  function overlay(){return document.getElementById('eternaOverlayV159')}
  function clean(v){return String(v==null?'':v).replace(/\s+/g,' ').trim()}
  function cfg(){return root.COCO_CONFIG||{}}
  function endpoint(path){var base=String(cfg().eternaEndpoint||'').replace(/\/+$/,'');return base?base+path:''}
  function setStatus(text,kind){var o=overlay();if(!o)return;var s=o.querySelector('[data-et-status]'),d=o.querySelector('[data-et-dot]');if(s)s.textContent=text;if(d)d.className='eternaV159Dot'+(kind?' '+kind:'')}
  function emit(state){try{root.dispatchEvent(new CustomEvent('coco:eterna-voice-state',{detail:{state:state}}))}catch(e){}}
  function convButton(){var o=overlay();return o&&o.querySelector('[data-et-converse]')}
  function setConvUi(title,copy,live){var b=convButton();if(!b)return;var t=b.querySelector('[data-et-converse-title]'),c=b.querySelector('[data-et-converse-copy]');if(t)t.textContent=title;if(c)c.textContent=copy;b.classList.toggle('is-active',!!live)}
  function age(){var o=overlay(),text=o?clean(o.textContent):'';var m=text.match(/([1-6])(?:º|o)?\s+de\s+Primaria/i);if(m)return 5+Number(m[1]);m=text.match(/([1-4])(?:º|o)?\s+de\s+ESO/i);if(m)return 11+Number(m[1]);m=text.match(/([1-2])(?:º|o)?\s+de\s+Bachillerato/i);if(m)return 15+Number(m[1]);return 10}
  function silenceMs(){var a=age();return a<=8?3000:a<=11?2500:a<=14?2100:1750}
  function maxMs(){var a=age();return a<=8?30000:a<=11?26000:a<=14?23000:20000}
  function mime(){if(typeof MediaRecorder==='undefined')return'';var list=['audio/mp4','audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus'];for(var i=0;i<list.length;i++){try{if(MediaRecorder.isTypeSupported(list[i]))return list[i]}catch(e){}}return''}
  function filename(type){type=String(type||'').toLowerCase();if(type.indexOf('mp4')>=0)return'pregunta.m4a';if(type.indexOf('ogg')>=0)return'pregunta.ogg';if(type.indexOf('mpeg')>=0)return'pregunta.mp3';return'pregunta.webm'}

  async function sessionToken(){try{var c=root.__COCO_SUPABASE_CLIENT;if(c&&c.auth&&c.auth.getSession){var r=await c.auth.getSession();return r&&r.data&&r.data.session&&r.data.session.access_token||''}}catch(e){}return''}
  async function api(path,options){var url=endpoint(path);if(!url)throw new Error('ETERNA_ENDPOINT_NOT_CONFIGURED');var token=await sessionToken(),headers=Object.assign({},options&&options.headers||{});if(token)headers.Authorization='Bearer '+token;return fetch(url,Object.assign({},options||{},{headers:headers}))}

  function stopVad(){if(vad&&vad.raf)cancelAnimationFrame(vad.raf);if(vad&&vad.ctx){try{vad.ctx.close()}catch(e){}}vad=null;if(hardTimer){clearTimeout(hardTimer);hardTimer=null}}
  function closeStream(){if(stream){try{stream.getTracks().forEach(function(t){t.stop()})}catch(e){}stream=null}}
  function cleanupRecord(){stopVad();recorder=null;chunks=[];active=false;stopping=false}

  async function stopRecording(reason){
    if(!recorder||recorder.state!=='recording'||stopping)return;
    stopping=true;emit('transcribing');setStatus(reason==='timeout'?'Procesando lo que has dicho…':'Entendiendo tu voz…','warn');
    try{recorder.requestData()}catch(e){}
    setTimeout(function(){try{if(recorder&&recorder.state==='recording')recorder.stop()}catch(e){}},80)
  }

  function installVad(s){
    stopVad();var Ctx=root.AudioContext||root.webkitAudioContext;if(!Ctx)return;
    var ctx;try{ctx=new Ctx()}catch(e){return}
    try{if(ctx.state==='suspended')ctx.resume().catch(function(){});var src=ctx.createMediaStreamSource(s),an=ctx.createAnalyser();an.fftSize=1024;an.smoothingTimeConstant=.2;src.connect(an)}catch(e){try{ctx.close()}catch(_e){}return}
    var data=new Uint8Array(an.fftSize);vad={ctx:ctx,an:an,raf:0};speechSeen=false;speechStartedAt=0;lastSpeechAt=0;noise=.008;smoothed=0;var started=performance.now();
    function tick(){if(!active||!vad)return;an.getByteTimeDomainData(data);var sum=0;for(var i=0;i<data.length;i++){var x=(data[i]-128)/128;sum+=x*x}var rms=Math.sqrt(sum/data.length),now=performance.now();smoothed=smoothed?smoothed*.72+rms*.28:rms;if(!speechSeen){if(smoothed<noise*1.5)noise=Math.max(.0035,Math.min(.03,noise*.97+smoothed*.03));var threshold=Math.max(.014,noise*2.1);if(smoothed>threshold){if(!speechStartedAt)speechStartedAt=now;if(now-speechStartedAt>140){speechSeen=true;lastSpeechAt=now}}else speechStartedAt=0}else{var release=Math.max(.009,noise*1.35);if(smoothed>release)lastSpeechAt=now;if(lastSpeechAt&&now-lastSpeechAt>silenceMs()&&now-started>1200){stopRecording('silence');return}}vad.raf=requestAnimationFrame(tick)}
    vad.raf=requestAnimationFrame(tick);hardTimer=setTimeout(function(){if(active)stopRecording('timeout')},maxMs())
  }

  async function transcribeBlob(blob,type){
    if(!blob||blob.size<700)throw new Error('AUDIO_EMPTY');
    var fd=new FormData();fd.append('audio',blob,filename(type||blob.type));
    var r=await api('/v1/transcribe',{method:'POST',body:fd});var data={};try{data=await r.json()}catch(e){}
    if(!r.ok||!clean(data.text))throw new Error(data.error||('TRANSCRIBE_'+r.status));return clean(data.text)
  }

  function sendText(text){var o=overlay();if(!o)return false;var input=o.querySelector('[data-et-input]'),send=o.querySelector('[data-et-send]');if(!input||!send)return false;input.value=text;try{input.dispatchEvent(new Event('input',{bubbles:true}))}catch(e){};setStatus('Eterna está pensando…','warn');emit('thinking');waitingReply=true;setTimeout(function(){try{send.click()}catch(e){}},30);return true}

  async function startRecording(asConversation){
    if(active)return;
    conversation=!!asConversation||conversation;
    if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia||typeof MediaRecorder==='undefined'){setStatus('Este navegador no permite usar el micrófono.','warn');return}
    setConvUi(conversation?'Activando el micrófono…':'Conversar con Eterna',conversation?'La conversación seguirá abierta':'Habla y Eterna te responde con su voz',conversation);
    setStatus('Activando el micrófono…','warn');emit('starting');
    try{
      stream=await navigator.mediaDevices.getUserMedia({audio:true});
      var type=mime(),opts=type?{mimeType:type}:undefined;chunks=[];recorder=opts?new MediaRecorder(stream,opts):new MediaRecorder(stream);active=true;stopping=false;
      recorder.ondataavailable=function(e){if(e.data&&e.data.size)chunks.push(e.data)};
      recorder.onerror=function(){setStatus('Hubo un problema al grabar. Vuelve a intentarlo.','warn');conversation=false;setConvUi('Conversar con Eterna','Habla y Eterna te responde con su voz',false);closeStream();cleanupRecord()};
      recorder.onstop=async function(){var usedType=recorder&&recorder.mimeType||type||chunks[0]&&chunks[0].type||'audio/mp4';var blob=new Blob(chunks,{type:usedType});stopVad();closeStream();active=false;recorder=null;stopping=false;try{var text=await transcribeBlob(blob,usedType);if(conversation){setConvUi('Eterna está pensando…','En cuanto responda, volverá a escucharte',true);sendText(text)}else{var o=overlay(),input=o&&o.querySelector('[data-et-input]');if(input){input.value=text;input.dispatchEvent(new Event('input',{bubbles:true}));input.focus()}setStatus('He escrito lo que te he oído. Revísalo y envíalo.','ok');emit('idle')}}catch(e){setStatus('No he podido transcribirlo bien. Toca el micrófono y vuelve a intentarlo.','warn');emit('idle');if(conversation){setConvUi('Conversar con Eterna','Habla y Eterna te responde con su voz',false);conversation=false}}};
      recorder.start(250);installVad(stream);setStatus('Te escucho…','ok');emit('listening');if(conversation)setConvUi('Te escucho…','Habla con normalidad · toca aquí para terminar',true)
    }catch(e){active=false;closeStream();cleanupRecord();conversation=false;setConvUi('Conversar con Eterna','Habla y Eterna te responde con su voz',false);setStatus('No pude abrir el micrófono. Revisa el permiso y vuelve a intentarlo.','warn');emit('idle')}
  }

  async function speakLatestAndResume(){
    if(!conversation||!waitingReply)return;waitingReply=false;var o=overlay();if(!o)return;var rows=o.querySelectorAll('.eternaV159Msg.assistant .eternaV159Bubble');if(!rows.length){setTimeout(function(){if(conversation)startRecording(true)},250);return}var text=clean(rows[rows.length-1].childNodes[0]&&rows[rows.length-1].childNodes[0].textContent||rows[rows.length-1].textContent);if(!text){setTimeout(function(){if(conversation)startRecording(true)},250);return}
    setConvUi('Eterna está hablando…','Después seguirá escuchándote',true);setStatus('Eterna está hablando…','ok');emit('speaking');
    try{var r=await api('/v1/speak',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:text.slice(0,1800)})});if(!r.ok)throw new Error('SPEAK_'+r.status);var blob=await r.blob();if(audioUrl)try{URL.revokeObjectURL(audioUrl)}catch(e){};audioUrl=URL.createObjectURL(blob);audioEl=new Audio();audioEl.src=audioUrl;audioEl.playsInline=true;audioEl.onended=function(){audioEl=null;setConvUi('Te escucho…','La conversación sigue abierta',true);setTimeout(function(){if(conversation)startRecording(true)},220)};audioEl.onerror=function(){audioEl=null;setTimeout(function(){if(conversation)startRecording(true)},220)};await audioEl.play()}catch(e){setStatus('Respuesta lista. Continúo escuchándote.','ok');setTimeout(function(){if(conversation)startRecording(true)},300)}
  }

  function stopConversation(){conversation=false;waitingReply=false;if(active)stopRecording('manual');if(audioEl){try{audioEl.pause()}catch(e){}audioEl=null}setConvUi('Conversar con Eterna','Habla y Eterna te responde con su voz',false);setStatus('Eterna lista','ok');emit('idle')}

  document.addEventListener('click',function(ev){var o=overlay();if(!o||!o.classList.contains('is-open'))return;var conv=ev.target&&ev.target.closest&&ev.target.closest('#eternaOverlayV159 [data-et-converse]');if(conv){ev.preventDefault();ev.stopImmediatePropagation();if(conversation){stopConversation();return}conversation=true;startRecording(true);return}var mic=ev.target&&ev.target.closest&&ev.target.closest('#eternaOverlayV159 [data-et-mic],#eternaOverlayV159 [data-et-startaction="voice"]');if(mic){ev.preventDefault();ev.stopImmediatePropagation();if(active){stopRecording('manual');return}conversation=false;startRecording(false)}},true);

  root.addEventListener('coco:eterna-response-applied',function(){if(conversation&&waitingReply)setTimeout(speakLatestAndResume,120)});
  root.addEventListener('coco:eterna-ui-reset',stopConversation);
  document.addEventListener('visibilitychange',function(){if(document.hidden)stopConversation()},{passive:true});
})();
