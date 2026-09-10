/* ETERNA Voice V5 · clean mic/conversation separation · 2026-09-10
 * IMPORTANT: this file is intentionally executed BEFORE eterna-experience-v160.js.
 * Its capture handler owns ONLY [data-et-mic], [data-et-startaction="voice"] and [data-et-converse].
 * It never emits coco:eterna-voice-state, so one-shot dictation cannot mutate the orange conversation control.
 * Mic = one-shot dictation. Conversation = persistent listen -> transcribe -> send -> speak -> listen loop.
 */
(function(root){
  'use strict';
  if(root.__ETERNA_VOICE_V5__)return;
  root.__ETERNA_VOICE_V5__=true;

  var S={mode:'idle',conversation:false,stream:null,ctx:null,source:null,processor:null,sink:null,
    chunks:[],sampleRate:44100,speech:false,candidateAt:0,lastSpeechAt:0,startedAt:0,noise:.008,smoothed:0,
    hardTimer:null,noSpeechTimer:null,waitingReply:false,audio:null,audioUrl:null,stopReason:'',authClient:null};

  function overlay(){return document.getElementById('eternaOverlayV159')}
  function clean(v){return String(v==null?'':v).replace(/\s+/g,' ').trim()}
  function cfg(){return root.COCO_CONFIG||{}}
  function endpoint(path){var base=String(cfg().eternaEndpoint||'').replace(/\/+$/,'');return base?base+path:''}
  function status(text,kind){var o=overlay();if(!o)return;var s=o.querySelector('[data-et-status]'),d=o.querySelector('[data-et-dot]');if(s)s.textContent=text;if(d)d.className='eternaV159Dot'+(kind?' '+kind:'')}
  function micBtn(){var o=overlay();return o&&o.querySelector('[data-et-mic]')}
  function convBtn(){var o=overlay();return o&&o.querySelector('[data-et-converse]')}
  function micUi(on){var b=micBtn();if(!b)return;b.classList.toggle('recording',!!on);b.setAttribute('aria-pressed',on?'true':'false');b.setAttribute('aria-label',on?'Terminar dictado':'Hablar por micrófono');var svg=b.querySelector('svg');if(svg)svg.style.opacity=on?'.55':'1'}
  function convUi(state){var b=convBtn();if(!b)return;var t=b.querySelector('[data-et-converse-title]'),c=b.querySelector('[data-et-converse-copy]');b.classList.remove('is-listening','is-speaking');b.setAttribute('aria-pressed',state==='idle'?'false':'true');
    var title='Conversar con Eterna',copy='Habla y Eterna te responde con su voz';
    if(state==='starting'){title='Activando el micrófono…';copy='La conversación seguirá abierta'}
    if(state==='listening'){title='Te escucho…';copy='Habla con normalidad · toca aquí para terminar';b.classList.add('is-listening')}
    if(state==='transcribing'){title='Entendiendo tu voz…';copy='Estoy preparando lo que has dicho'}
    if(state==='thinking'){title='Eterna está pensando…';copy='Enseguida te respondo con mi voz'}
    if(state==='speaking'){title='Eterna está hablando…';copy='Después volveré a escucharte';b.classList.add('is-speaking')}
    if(t)t.textContent=title;if(c)c.textContent=copy
  }
  function setMode(next){S.mode=next;if(!S.conversation&&next==='idle')micUi(false);if(S.conversation)convUi(next)}

  function age(){var o=overlay(),txt=o?clean(o.textContent):'';var m=txt.match(/([1-6])(?:º|o)?\s+de\s+Primaria/i);if(m)return 5+Number(m[1]);m=txt.match(/([1-4])(?:º|o)?\s+de\s+ESO/i);if(m)return 11+Number(m[1]);m=txt.match(/([1-2])(?:º|o)?\s+de\s+Bachillerato/i);if(m)return 15+Number(m[1]);return 10}
  function silenceMs(){var a=age();return a<=8?3200:a<=11?2700:a<=14?2200:1800}
  function maxMs(){var a=age();return a<=8?32000:a<=11?28000:a<=14?24000:22000}
  function noSpeechMs(){var a=age();return a<=8?9500:a<=11?8000:a<=14?7000:6000}

  function getClient(){if(root.__COCO_SUPABASE_CLIENT)return root.__COCO_SUPABASE_CLIENT;if(S.authClient)return S.authClient;try{var c=cfg();if(root.supabase&&root.supabase.createClient&&c.url&&c.clave){S.authClient=root.supabase.createClient(c.url,c.clave,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});return S.authClient}}catch(e){}return null}
  async function token(){try{var c=getClient();if(c&&c.auth&&c.auth.getSession){var r=await c.auth.getSession();return r&&r.data&&r.data.session&&r.data.session.access_token||''}}catch(e){}return''}
  async function api(path,options){var url=endpoint(path);if(!url)throw new Error('NO_ENDPOINT');var tk=await token(),headers=Object.assign({},options&&options.headers||{});if(tk)headers.Authorization='Bearer '+tk;var r=await fetch(url,Object.assign({},options||{},{headers:headers}));return r}

  function clearTimers(){if(S.hardTimer){clearTimeout(S.hardTimer);S.hardTimer=null}if(S.noSpeechTimer){clearTimeout(S.noSpeechTimer);S.noSpeechTimer=null}}
  function stopTracks(){if(S.stream){try{S.stream.getTracks().forEach(function(t){t.stop()})}catch(e){}S.stream=null}}
  function closeGraph(stopMedia){clearTimers();try{if(S.processor)S.processor.disconnect()}catch(e){}try{if(S.source)S.source.disconnect()}catch(e){}try{if(S.sink)S.sink.disconnect()}catch(e){}S.processor=S.source=S.sink=null;if(S.ctx){try{S.ctx.close()}catch(e){}S.ctx=null}if(stopMedia)stopTracks()}
  function resetTurn(){S.chunks=[];S.speech=false;S.candidateAt=0;S.lastSpeechAt=0;S.startedAt=performance.now();S.noise=.008;S.smoothed=0;S.stopReason=''}
  function flatten(chunks){var n=0,i;for(i=0;i<chunks.length;i++)n+=chunks[i].length;var out=new Float32Array(n),off=0;for(i=0;i<chunks.length;i++){out.set(chunks[i],off);off+=chunks[i].length}return out}
  function downsample(input,inRate,outRate){if(!input.length||outRate>=inRate)return input;var ratio=inRate/outRate,len=Math.max(1,Math.floor(input.length/ratio)),out=new Float32Array(len);for(var i=0;i<len;i++){var start=Math.floor(i*ratio),end=Math.min(input.length,Math.floor((i+1)*ratio)),sum=0,c=0;for(var j=start;j<end;j++){sum+=input[j];c++}out[i]=c?sum/c:0}return out}
  function wav(samples,rate){var buf=new ArrayBuffer(44+samples.length*2),v=new DataView(buf);function str(off,s){for(var i=0;i<s.length;i++)v.setUint8(off+i,s.charCodeAt(i))}str(0,'RIFF');v.setUint32(4,36+samples.length*2,true);str(8,'WAVE');str(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);str(36,'data');v.setUint32(40,samples.length*2,true);for(var i=0,o=44;i<samples.length;i++,o+=2){var x=Math.max(-1,Math.min(1,samples[i]));v.setInt16(o,x<0?x*32768:x*32767,true)}return new Blob([buf],{type:'audio/wav'})}
  function makeWav(){var pcm=flatten(S.chunks);return wav(downsample(pcm,S.sampleRate,16000),16000)}

  async function transcribe(blob){if(!blob||blob.size<1600)throw new Error('EMPTY_AUDIO');var fd=new FormData();fd.append('audio',blob,'pregunta.wav');var r=await api('/v1/transcribe',{method:'POST',body:fd}),data={};try{data=await r.json()}catch(e){}if(!r.ok)throw new Error(String(data.error||('HTTP_'+r.status)));var text=clean(data.text);if(!text)throw new Error('EMPTY_TRANSCRIPT');return text}
  function putText(text,sendNow){var o=overlay();if(!o)return;var input=o.querySelector('[data-et-input]'),send=o.querySelector('[data-et-send]');if(!input)return;input.value=text;try{input.dispatchEvent(new Event('input',{bubbles:true}))}catch(e){}if(sendNow&&send){S.waitingReply=true;setMode('thinking');status('Eterna está pensando…','warn');setTimeout(function(){try{send.click()}catch(e){}},50)}else{setMode('idle');status('He escrito lo que te he oído. Revísalo y envíalo.','ok');try{input.focus()}catch(e){}}}

  async function finishTurn(reason){if(S.mode!=='listening'&&S.mode!=='starting')return;S.stopReason=reason||'silence';setMode('transcribing');status('Entendiendo tu voz…','warn');var blob=makeWav();closeGraph(true);try{var text=await transcribe(blob);putText(text,S.conversation)}catch(e){console.warn('[ETERNA Voice V5 transcribe]',e&&e.message||e);if(S.conversation){status('No he podido entenderte bien. Vuelve a hablar cuando veas “Te escucho”.','warn');setTimeout(function(){if(S.conversation)startTurn(true)},650)}else{setMode('idle');status('No he podido entenderte bien. Toca el micrófono y vuelve a intentarlo.','warn')}}}

  async function startTurn(asConversation){if(S.mode!=='idle'&&S.mode!=='thinking'&&S.mode!=='speaking')return;S.conversation=!!asConversation;setMode('starting');status('Activando el micrófono…','warn');if(!S.conversation)micUi(true);try{if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia)throw new Error('NO_GUM');S.stream=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:true,noiseSuppression:true,autoGainControl:true}});var Ctx=root.AudioContext||root.webkitAudioContext;if(!Ctx)throw new Error('NO_AUDIO_CONTEXT');S.ctx=new Ctx();try{if(S.ctx.state==='suspended')await S.ctx.resume()}catch(e){}S.sampleRate=Number(S.ctx.sampleRate||44100);S.source=S.ctx.createMediaStreamSource(S.stream);var create=S.ctx.createScriptProcessor||S.ctx.createJavaScriptNode;if(!create)throw new Error('NO_PROCESSOR');S.processor=create.call(S.ctx,2048,1,1);S.sink=S.ctx.createGain();S.sink.gain.value=0;S.source.connect(S.processor);S.processor.connect(S.sink);S.sink.connect(S.ctx.destination);resetTurn();setMode('listening');status(S.conversation?'Te escucho…':'Escuchando…','ok');
      S.processor.onaudioprocess=function(ev){if(S.mode!=='listening')return;var src=ev.inputBuffer.getChannelData(0),copy=new Float32Array(src.length);copy.set(src);S.chunks.push(copy);var sum=0;for(var i=0;i<src.length;i++){var x=src[i];sum+=x*x}var rms=Math.sqrt(sum/src.length),now=performance.now();S.smoothed=S.smoothed?S.smoothed*.72+rms*.28:rms;if(!S.speech){if(S.smoothed<Math.max(.014,S.noise*1.7))S.noise=Math.max(.0035,Math.min(.03,S.noise*.98+S.smoothed*.02));var attack=Math.max(.011,S.noise*1.9);if(S.smoothed>attack){if(!S.candidateAt)S.candidateAt=now;if(now-S.candidateAt>=120){S.speech=true;S.lastSpeechAt=now}}else S.candidateAt=0}else{var release=Math.max(.0075,S.noise*1.22);if(S.smoothed>release)S.lastSpeechAt=now;if(S.lastSpeechAt&&now-S.lastSpeechAt>silenceMs()&&now-S.startedAt>900)finishTurn('silence')}};
      S.hardTimer=setTimeout(function(){if(S.mode==='listening')finishTurn('max')},maxMs());S.noSpeechTimer=setTimeout(function(){if(S.mode==='listening'&&!S.speech){closeGraph(true);if(S.conversation){status('No te he oído todavía. Sigo escuchando…','warn');setTimeout(function(){if(S.conversation){S.mode='idle';startTurn(true)}},500)}else{setMode('idle');status('No te he oído. Toca el micrófono y vuelve a intentarlo.','warn')}}},noSpeechMs())
    }catch(e){console.warn('[ETERNA Voice V5 start]',e&&e.message||e);closeGraph(true);S.conversation=false;setMode('idle');convUi('idle');micUi(false);status('No pude abrir el micrófono. Revisa el permiso del iPhone y vuelve a intentarlo.','warn')}}

  async function speakLatest(){if(!S.conversation||!S.waitingReply)return;S.waitingReply=false;var o=overlay(),rows=o&&o.querySelectorAll('.eternaV159Msg.assistant .eternaV159Bubble');if(!rows||!rows.length){S.mode='idle';setTimeout(function(){if(S.conversation)startTurn(true)},350);return}var last=rows[rows.length-1],text=clean(last.childNodes[0]&&last.childNodes[0].textContent||last.textContent);if(!text){S.mode='idle';setTimeout(function(){if(S.conversation)startTurn(true)},350);return}setMode('speaking');status('Eterna está hablando…','ok');try{var r=await api('/v1/speak',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:text.slice(0,1800)})});if(!r.ok)throw new Error('SPEAK_'+r.status);var b=await r.blob();if(S.audioUrl)try{URL.revokeObjectURL(S.audioUrl)}catch(e){}S.audioUrl=URL.createObjectURL(b);if(!S.audio){S.audio=new Audio();S.audio.playsInline=true}S.audio.src=S.audioUrl;S.audio.onended=function(){S.mode='idle';setTimeout(function(){if(S.conversation)startTurn(true)},280)};S.audio.onerror=S.audio.onended;await S.audio.play()}catch(e){console.warn('[ETERNA Voice V5 speak]',e&&e.message||e);S.mode='idle';setTimeout(function(){if(S.conversation)startTurn(true)},350)}}
  function stopConversation(){S.conversation=false;S.waitingReply=false;if(S.audio){try{S.audio.pause()}catch(e){}}if(S.mode==='listening'||S.mode==='starting')closeGraph(true);S.mode='idle';micUi(false);convUi('idle');status('Eterna lista','ok')}
  function stopDictation(){if(!S.conversation&&(S.mode==='listening'||S.mode==='starting'))finishTurn('manual')}

  /* Registered before eterna-experience-v160.js on purpose. */
  document.addEventListener('click',function(ev){var o=overlay();if(!o||!o.classList.contains('is-open'))return;var target=ev.target&&ev.target.closest?ev.target:null;if(!target)return;
    var conv=target.closest('#eternaOverlayV159 [data-et-converse]');if(conv){ev.preventDefault();ev.stopImmediatePropagation();if(S.conversation){stopConversation();return}if(S.mode!=='idle'){closeGraph(true);S.mode='idle'}S.conversation=true;convUi('starting');startTurn(true);return}
    var mic=target.closest('#eternaOverlayV159 [data-et-mic]');if(mic){ev.preventDefault();ev.stopImmediatePropagation();if(S.conversation)stopConversation();if(S.mode==='listening'||S.mode==='starting'){stopDictation();return}S.conversation=false;convUi('idle');startTurn(false);return}
    var voiceEntry=target.closest('#eternaOverlayV159 [data-et-startaction="voice"]');if(voiceEntry){ev.preventDefault();ev.stopImmediatePropagation();if(S.conversation)stopConversation();S.conversation=false;convUi('idle');startTurn(false);return}
  },true);

  root.addEventListener('coco:eterna-response-applied',function(){if(S.conversation&&S.waitingReply)setTimeout(speakLatest,120)});
  root.addEventListener('coco:eterna-ui-reset',function(){stopConversation();closeGraph(true)});
  document.addEventListener('visibilitychange',function(){if(document.hidden){stopConversation();closeGraph(true)}},{passive:true});
})(window);
