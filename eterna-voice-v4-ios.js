/* ETERNA Voice V4 iOS · native speech recognition · 2026-09-10
 * Isolated iPhone/iPad/PWA voice path.
 * Normal mic = one-shot dictation. Conversar = persistent spoken session.
 * Does not touch pedagogy, auth, payments, games, scoring, Safety/School Scope or family settings.
 */
(function(root){
  'use strict';
  if(root.__ETERNA_VOICE_V4_IOS__) return;
  var ua=String(navigator.userAgent||'');
  var ios=/iPhone|iPad|iPod/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  if(!ios) return;
  root.__ETERNA_VOICE_V4_IOS__=true;

  var Recognition=root.SpeechRecognition||root.webkitSpeechRecognition;
  var rec=null, mode='idle', conversation=false, waitingReply=false, finalText='', hadSpeech=false, restarting=false;
  var audio=null,audioUrl=null,turnTimer=null;

  function overlay(){return document.getElementById('eternaOverlayV159')}
  function clean(v){return String(v==null?'':v).replace(/\s+/g,' ').trim()}
  function cfg(){return root.COCO_CONFIG||{}}
  function endpoint(path){var base=String(cfg().eternaEndpoint||'').replace(/\/+$/,'');return base?base+path:''}
  function status(text,kind){var o=overlay();if(!o)return;var s=o.querySelector('[data-et-status]'),d=o.querySelector('[data-et-dot]');if(s)s.textContent=text;if(d)d.className='eternaV159Dot'+(kind?' '+kind:'')}
  function convBtn(){var o=overlay();return o&&o.querySelector('[data-et-converse]')}
  function convUi(title,copy,on){var b=convBtn();if(!b)return;var t=b.querySelector('[data-et-converse-title]'),c=b.querySelector('[data-et-converse-copy]');if(t)t.textContent=title;if(c)c.textContent=copy;b.classList.toggle('is-active',!!on)}
  function micBtn(){var o=overlay();return o&&o.querySelector('[data-et-mic]')}
  function micUi(on){var b=micBtn();if(!b)return;b.classList.toggle('recording',!!on);b.setAttribute('aria-pressed',on?'true':'false');b.textContent=on?'■':'🎙️'}
  function age(){var o=overlay(),txt=o?clean(o.textContent):'';var m=txt.match(/([1-6])(?:º|o)?\s+de\s+Primaria/i);if(m)return 5+Number(m[1]);m=txt.match(/([1-4])(?:º|o)?\s+de\s+ESO/i);if(m)return 11+Number(m[1]);m=txt.match(/([1-2])(?:º|o)?\s+de\s+Bachillerato/i);if(m)return 15+Number(m[1]);return 10}
  function maxTurnMs(){var a=age();return a<=8?32000:a<=11?28000:a<=14?24000:22000}
  async function token(){try{var c=root.__COCO_SUPABASE_CLIENT;if(c&&c.auth&&c.auth.getSession){var r=await c.auth.getSession();return r&&r.data&&r.data.session&&r.data.session.access_token||''}}catch(e){}return''}
  async function api(path,options){var url=endpoint(path);if(!url)throw new Error('ETERNA_ENDPOINT_NOT_CONFIGURED');var tk=await token(),headers=Object.assign({},options&&options.headers||{});if(tk)headers.Authorization='Bearer '+tk;return fetch(url,Object.assign({},options||{},{headers:headers}))}
  function clearTimer(){if(turnTimer){clearTimeout(turnTimer);turnTimer=null}}
  function stopRecognition(){clearTimer();if(rec){try{rec.onend=null;rec.onerror=null;rec.stop()}catch(e){}rec=null}micUi(false)}
  function putText(text,sendNow){var o=overlay();if(!o)return false;var i=o.querySelector('[data-et-input]'),s=o.querySelector('[data-et-send]');if(!i)return false;i.value=text;try{i.dispatchEvent(new Event('input',{bubbles:true}))}catch(e){}if(sendNow&&s){waitingReply=true;status('Eterna está pensando…','warn');convUi('Eterna está pensando…','En cuanto responda, volverá a escucharte',true);setTimeout(function(){try{s.click()}catch(e){}},40)}else{status('He escrito lo que te he oído. Revísalo y envíalo.','ok');try{i.focus()}catch(e){}}return true}

  function finishRecognition(){
    var text=clean(finalText);stopRecognition();
    if(!text){status('No he podido oírte bien. Toca el micrófono y vuelve a intentarlo.','warn');if(conversation){setTimeout(function(){if(conversation)startRecognition(true)},500)}return}
    if(conversation)putText(text,true);else putText(text,false)
  }

  function startRecognition(asConversation){
    if(mode==='listening'||mode==='starting')return;
    conversation=!!asConversation||conversation;finalText='';hadSpeech=false;
    if(!Recognition){status('El reconocimiento de voz no está disponible en este iPhone.','warn');convUi('Conversar con Eterna','Habla y Eterna te responde con su voz',false);conversation=false;return}
    mode='starting';status('Activando el micrófono…','warn');if(conversation)convUi('Activando el micrófono…','La conversación seguirá abierta',true);else micUi(true);
    try{
      rec=new Recognition();rec.lang='es-ES';rec.continuous=false;rec.interimResults=true;rec.maxAlternatives=1;
      rec.onstart=function(){mode='listening';status('Te escucho…','ok');if(conversation)convUi('Te escucho…','Habla con normalidad · toca aquí para terminar',true);else micUi(true)};
      rec.onspeechstart=function(){hadSpeech=true};
      rec.onresult=function(ev){var final='',interim='';for(var i=ev.resultIndex;i<ev.results.length;i++){var part=clean(ev.results[i][0]&&ev.results[i][0].transcript||'');if(ev.results[i].isFinal)final+=part+' ';else interim+=part+' '}if(final)finalText=clean((finalText+' '+final));if(interim||final)status(clean(finalText||interim)?'Te escucho…':'Escuchando…','ok')};
      rec.onerror=function(ev){var err=ev&&ev.error||'unknown';mode='idle';stopRecognition();if(err==='no-speech'||err==='aborted'){if(conversation){setTimeout(function(){if(conversation)startRecognition(true)},450)}else status('No te he oído. Toca el micrófono y vuelve a intentarlo.','warn');return}conversation=false;convUi('Conversar con Eterna','Habla y Eterna te responde con su voz',false);status(err==='not-allowed'?'El micrófono está bloqueado. Actívalo en los permisos del iPhone.':'No pude iniciar el micrófono. Vuelve a intentarlo.','warn')};
      rec.onend=function(){if(mode==='idle')return;mode='idle';finishRecognition()};
      rec.start();turnTimer=setTimeout(function(){if(rec){try{rec.stop()}catch(e){}}},maxTurnMs())
    }catch(e){mode='idle';stopRecognition();conversation=false;convUi('Conversar con Eterna','Habla y Eterna te responde con su voz',false);status('No pude iniciar el micrófono. Vuelve a intentarlo.','warn')}
  }

  async function speakLatest(){
    if(!conversation||!waitingReply||restarting)return;restarting=true;waitingReply=false;
    var o=overlay(),rows=o&&o.querySelectorAll('.eternaV159Msg.assistant .eternaV159Bubble');if(!rows||!rows.length){restarting=false;setTimeout(function(){if(conversation)startRecognition(true)},400);return}
    var last=rows[rows.length-1],text=clean(last.childNodes[0]&&last.childNodes[0].textContent||last.textContent);if(!text){restarting=false;setTimeout(function(){if(conversation)startRecognition(true)},400);return}
    status('Eterna está hablando…','ok');convUi('Eterna está hablando…','Después seguiré escuchándote',true);
    try{var r=await api('/v1/speak',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:text.slice(0,1800)})});if(!r.ok)throw new Error('SPEAK_'+r.status);var b=await r.blob();if(audioUrl)try{URL.revokeObjectURL(audioUrl)}catch(e){}audioUrl=URL.createObjectURL(b);audio=new Audio(audioUrl);audio.playsInline=true;audio.onended=function(){audio=null;restarting=false;setTimeout(function(){if(conversation)startRecognition(true)},350)};audio.onerror=audio.onended;await audio.play()}catch(e){restarting=false;setTimeout(function(){if(conversation)startRecognition(true)},450)}
  }
  function stopConversation(){conversation=false;waitingReply=false;restarting=false;stopRecognition();if(audio){try{audio.pause()}catch(e){}audio=null}convUi('Conversar con Eterna','Habla y Eterna te responde con su voz',false);status('Eterna lista','ok')}

  document.addEventListener('click',function(ev){var o=overlay();if(!o||!o.classList.contains('is-open'))return;
    var conv=ev.target&&ev.target.closest&&ev.target.closest('#eternaOverlayV159 [data-et-converse]');
    if(conv){ev.preventDefault();ev.stopImmediatePropagation();if(conversation){stopConversation();return}conversation=true;startRecognition(true);return}
    var mic=ev.target&&ev.target.closest&&ev.target.closest('#eternaOverlayV159 [data-et-mic]');
    if(mic){ev.preventDefault();ev.stopImmediatePropagation();if(mode==='listening'||mode==='starting'){finishRecognition();return}conversation=false;convUi('Conversar con Eterna','Habla y Eterna te responde con su voz',false);startRecognition(false);return}
    var startVoice=ev.target&&ev.target.closest&&ev.target.closest('#eternaOverlayV159 [data-et-startaction="voice"]');
    if(startVoice){ev.preventDefault();ev.stopImmediatePropagation();conversation=false;convUi('Conversar con Eterna','Habla y Eterna te responde con su voz',false);startRecognition(false)}
  },true);

  root.addEventListener('coco:eterna-response-applied',function(){if(conversation&&waitingReply)setTimeout(speakLatest,150)});
  root.addEventListener('coco:eterna-ui-reset',stopConversation);
  document.addEventListener('visibilitychange',function(){if(document.hidden)stopConversation()},{passive:true});
})(window);
