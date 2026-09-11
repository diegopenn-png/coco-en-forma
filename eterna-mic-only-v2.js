/* ETERNA Mic Only v2 · 2026-09-11
 * One control only: simple one-shot dictation.
 * Removes persistent conversation CTA.
 * Uses browser SpeechRecognition/webkitSpeechRecognition with age-adapted auto-stop.
 * No backend transcription dependency.
 */
(function(root){
  'use strict';
  if(root.__ETERNA_MIC_ONLY_V2__)return;
  root.__ETERNA_MIC_ONLY_V2__=true;

  var active=null,finalText='',interimText='',silenceTimer=null,hardTimer=null,noSpeechTimer=null,lastResultAt=0;

  function overlay(){return document.getElementById('eternaOverlayV159')}
  function clean(v){return String(v==null?'':v).replace(/\s+/g,' ').trim()}
  function input(){var o=overlay();return o&&o.querySelector('[data-et-input]')}
  function mic(){var o=overlay();return o&&o.querySelector('[data-et-mic]')}
  function status(text,kind){var o=overlay();if(!o)return;var s=o.querySelector('[data-et-status]'),d=o.querySelector('[data-et-dot]');if(s)s.textContent=text;if(d)d.className='eternaV159Dot'+(kind?' '+kind:'')}
  function age(){var o=overlay(),txt=o?clean(o.textContent):'';var m=txt.match(/([1-6])(?:º|o)?\s+de\s+Primaria/i);if(m)return 5+Number(m[1]);m=txt.match(/([1-4])(?:º|o)?\s+de\s+ESO/i);if(m)return 11+Number(m[1]);m=txt.match(/([1-2])(?:º|o)?\s+de\s+Bachillerato/i);if(m)return 15+Number(m[1]);return 10}
  function silenceMs(){var a=age();return a<=8?3200:a<=11?2700:a<=14?2200:1800}
  function noSpeechMs(){var a=age();return a<=8?10000:a<=11?8500:a<=14?7000:6000}
  function maxMs(){var a=age();return a<=8?32000:a<=11?28000:a<=14?24000:22000}
  function clearTimers(){if(silenceTimer){clearTimeout(silenceTimer);silenceTimer=null}if(hardTimer){clearTimeout(hardTimer);hardTimer=null}if(noSpeechTimer){clearTimeout(noSpeechTimer);noSpeechTimer=null}}

  function installStyle(){
    if(document.getElementById('eterna-mic-only-v2-css'))return;
    var s=document.createElement('style');s.id='eterna-mic-only-v2-css';
    s.textContent=[
      '#eternaOverlayV159 [data-et-converse],#eternaOverlayV159 .eternaV160Conversation{display:none!important}',
      '#eternaOverlayV159 .eternaV160ModeActions{gap:8px!important}',
      '@media(min-width:761px){#eternaOverlayV159 .eternaV160ModeActions{flex:0 1 360px!important;max-width:360px!important;align-content:center!important}#eternaOverlayV159 .eternaV160ModeActions>.eternaV160NewActivity,#eternaOverlayV159 .eternaV160ModeActions>.eternaV160ChangeMode{width:100%!important}}',
      '@media(max-width:760px){#eternaOverlayV159 .eternaV160ModeActions{grid-template-columns:1fr 1fr!important;width:100%!important}#eternaOverlayV159 .eternaV160ModeActions [data-et-converse]{display:none!important}}',
      '#eternaOverlayV159 [data-et-mic].recording{background:#fff4e8!important;border-color:#ff9a3d!important;color:#e86800!important;box-shadow:0 0 0 4px rgba(255,136,25,.14)!important}',
      '#eternaOverlayV159 [data-et-mic].recording:after{content:"";position:absolute;inset:-7px;border:2px solid rgba(255,132,22,.35);border-radius:inherit;animation:eternaMicPulseV2 1.25s ease-out infinite;pointer-events:none}',
      '@keyframes eternaMicPulseV2{0%{transform:scale(.92);opacity:.9}100%{transform:scale(1.16);opacity:0}}'
    ].join('');document.head.appendChild(s)
  }

  function removeConversation(){var o=overlay();if(!o)return;o.querySelectorAll('[data-et-converse],.eternaV160Conversation').forEach(function(n){try{n.remove()}catch(e){n.style.display='none'}})}
  function setMic(on){var b=mic();if(!b)return;b.classList.toggle('recording',!!on);b.setAttribute('aria-pressed',on?'true':'false');b.setAttribute('aria-label',on?'Terminar dictado':'Hablar por micrófono')}

  function nativeSetValue(el,value){
    try{var proto=Object.getPrototypeOf(el),desc=Object.getOwnPropertyDescriptor(proto,'value');if(desc&&desc.set)desc.set.call(el,value);else el.value=value}catch(e){el.value=value}
  }
  function write(text){
    var el=input();text=clean(text);if(!el||!text)return false;
    nativeSetValue(el,text);
    try{el.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:text}))}catch(e){try{el.dispatchEvent(new Event('input',{bubbles:true}))}catch(_e){}}
    try{el.dispatchEvent(new Event('change',{bubbles:true}))}catch(e){}
    try{el.focus()}catch(e){}
    return true
  }

  function finish(){if(!active)return;clearTimers();try{active.stop()}catch(e){}}
  function scheduleSilenceStop(){if(silenceTimer)clearTimeout(silenceTimer);silenceTimer=setTimeout(function(){if(active)finish()},silenceMs())}

  function start(){
    if(active){finish();return}
    root.__ETERNA_VOICE_DIALOG_ACTIVE__=false;
    var SR=root.SpeechRecognition||root.webkitSpeechRecognition;
    if(!SR){setMic(false);status('Este dispositivo no ofrece dictado web. Usa el dictado del teclado o escribe tu pregunta.','warn');return}
    finalText='';interimText='';lastResultAt=0;clearTimers();
    var r=new SR();active=r;r.lang='es-ES';r.continuous=true;r.interimResults=true;r.maxAlternatives=1;
    r.onstart=function(){setMic(true);status('Escuchando… habla con normalidad.','ok');hardTimer=setTimeout(finish,maxMs());noSpeechTimer=setTimeout(function(){if(active&&!lastResultAt)finish()},noSpeechMs())};
    r.onaudiostart=function(){setMic(true)};
    r.onresult=function(ev){
      var f='',i='';lastResultAt=Date.now();if(noSpeechTimer){clearTimeout(noSpeechTimer);noSpeechTimer=null}
      for(var x=ev.resultIndex;x<ev.results.length;x++){
        var t=clean(ev.results[x][0]&&ev.results[x][0].transcript||'');if(!t)continue;
        if(ev.results[x].isFinal)f+=(f?' ':'')+t;else i+=(i?' ':'')+t
      }
      if(f)finalText=clean((finalText+' '+f));interimText=i;
      var preview=clean((finalText+' '+interimText));if(preview)write(preview);
      scheduleSilenceStop()
    };
    r.onerror=function(ev){
      var code=String(ev&&ev.error||'');if(code==='aborted')return;
      if(code==='not-allowed'||code==='service-not-allowed')status('El micrófono está bloqueado. Permite el acceso y vuelve a tocarlo.','warn');
      else if(code==='no-speech')status('No he oído ninguna frase. Toca el micrófono y vuelve a intentarlo.','warn');
      else if(code==='network')status('El dictado del dispositivo no respondió. Comprueba la conexión y vuelve a intentarlo.','warn');
      else status('No he podido transcribir esta vez. Toca el micrófono y vuelve a intentarlo.','warn')
    };
    r.onend=function(){
      clearTimers();var text=clean((finalText+' '+interimText));active=null;setMic(false);
      if(text&&write(text))status('He escrito lo que te he oído. Revísalo y envíalo.','ok');
      else if(!text)status('No he podido entenderte bien. Toca el micrófono y vuelve a intentarlo.','warn')
    };
    try{r.start()}catch(e){active=null;clearTimers();setMic(false);status('No pude iniciar el micrófono. Vuelve a tocarlo.','warn')}
  }

  installStyle();
  document.addEventListener('click',function(ev){
    var o=overlay();if(!o||!o.classList.contains('is-open'))return;
    var target=ev.target&&ev.target.closest?ev.target.closest('#eternaOverlayV159 [data-et-mic],#eternaOverlayV159 [data-et-startaction="voice"]'):null;if(!target)return;
    ev.preventDefault();ev.stopImmediatePropagation();start()
  },true);
  var mo=new MutationObserver(function(){installStyle();removeConversation()});try{mo.observe(document.documentElement,{childList:true,subtree:true})}catch(e){}
  root.addEventListener('coco:eterna-close',function(){if(active)finish()});setTimeout(removeConversation,0)
})(window);
