/* ETERNA Mic Only v1 · 2026-09-11
 * One control only: simple one-shot dictation.
 * Removes the persistent conversation CTA and owns mic clicks before legacy handlers.
 * Primary path: browser SpeechRecognition/webkitSpeechRecognition (Safari/iOS friendly).
 */
(function(root){
  'use strict';
  if(root.__ETERNA_MIC_ONLY_V1__)return;
  root.__ETERNA_MIC_ONLY_V1__=true;

  var active=null;
  var finalText='';
  var interimText='';

  function overlay(){return document.getElementById('eternaOverlayV159')}
  function clean(v){return String(v==null?'':v).replace(/\s+/g,' ').trim()}
  function input(){var o=overlay();return o&&o.querySelector('[data-et-input]')}
  function mic(){var o=overlay();return o&&o.querySelector('[data-et-mic]')}
  function status(text,kind){var o=overlay();if(!o)return;var s=o.querySelector('[data-et-status]'),d=o.querySelector('[data-et-dot]');if(s)s.textContent=text;if(d)d.className='eternaV159Dot'+(kind?' '+kind:'')}

  function installStyle(){
    if(document.getElementById('eterna-mic-only-v1-css'))return;
    var s=document.createElement('style');
    s.id='eterna-mic-only-v1-css';
    s.textContent=[
      '#eternaOverlayV159 [data-et-converse],#eternaOverlayV159 .eternaV160Conversation{display:none!important}',
      '#eternaOverlayV159 .eternaV160ModeActions{gap:8px!important}',
      '@media(min-width:761px){#eternaOverlayV159 .eternaV160ModeActions{flex:0 1 360px!important;max-width:360px!important;align-content:center!important}#eternaOverlayV159 .eternaV160ModeActions>.eternaV160NewActivity{width:100%!important}}',
      '@media(max-width:760px){#eternaOverlayV159 .eternaV160ModeActions{grid-template-columns:1fr 1fr!important;width:100%!important}#eternaOverlayV159 .eternaV160ModeActions [data-et-converse]{display:none!important}}',
      '#eternaOverlayV159 [data-et-mic].recording{background:#fff4e8!important;border-color:#ff9a3d!important;color:#e86800!important;box-shadow:0 0 0 4px rgba(255,136,25,.14)!important}',
      '#eternaOverlayV159 [data-et-mic].recording:after{content:"";position:absolute;inset:-7px;border:2px solid rgba(255,132,22,.35);border-radius:inherit;animation:eternaMicPulseV1 1.25s ease-out infinite;pointer-events:none}',
      '@keyframes eternaMicPulseV1{0%{transform:scale(.92);opacity:.9}100%{transform:scale(1.16);opacity:0}}'
    ].join('');
    document.head.appendChild(s)
  }

  function removeConversation(){
    var o=overlay();if(!o)return;
    o.querySelectorAll('[data-et-converse],.eternaV160Conversation').forEach(function(n){try{n.remove()}catch(e){n.style.display='none'}})
  }

  function setMic(on){
    var b=mic();if(!b)return;
    b.classList.toggle('recording',!!on);
    b.setAttribute('aria-pressed',on?'true':'false');
    b.setAttribute('aria-label',on?'Terminar dictado':'Hablar por micrófono')
  }

  function write(text){
    var el=input();text=clean(text);if(!el||!text)return false;
    el.value=text;
    try{el.dispatchEvent(new Event('input',{bubbles:true}))}catch(e){}
    try{el.focus()}catch(e){}
    return true
  }

  function stop(){
    if(!active)return;
    try{active.stop()}catch(e){}
  }

  function start(){
    if(active){stop();return}
    var SR=root.SpeechRecognition||root.webkitSpeechRecognition;
    if(!SR){
      setMic(false);
      status('Este dispositivo no ofrece dictado web. Usa el dictado del teclado o escribe tu pregunta.','warn');
      return
    }
    finalText='';interimText='';
    var r=new SR();active=r;
    r.lang='es-ES';r.continuous=false;r.interimResults=true;r.maxAlternatives=1;
    r.onstart=function(){setMic(true);status('Escuchando… habla con normalidad.','ok')};
    r.onaudiostart=function(){setMic(true)};
    r.onresult=function(ev){
      var f='',i='';
      for(var x=ev.resultIndex;x<ev.results.length;x++){
        var t=clean(ev.results[x][0]&&ev.results[x][0].transcript||'');
        if(!t)continue;
        if(ev.results[x].isFinal)f+=(f?' ':'')+t;else i+=(i?' ':'')+t
      }
      if(f)finalText=clean((finalText+' '+f));
      interimText=i;
      var preview=clean((finalText+' '+interimText));
      if(preview)write(preview)
    };
    r.onerror=function(ev){
      var code=String(ev&&ev.error||'');
      if(code==='aborted')return;
      if(code==='not-allowed'||code==='service-not-allowed')status('El micrófono está bloqueado. Permite el acceso al micrófono y vuelve a tocarlo.','warn');
      else if(code==='no-speech')status('No he oído ninguna frase. Toca el micrófono y vuelve a intentarlo.','warn');
      else status('No he podido transcribir esta vez. Toca el micrófono y vuelve a intentarlo.','warn')
    };
    r.onend=function(){
      var text=clean((finalText+' '+interimText));
      active=null;setMic(false);
      if(text&&write(text))status('He escrito lo que te he oído. Revísalo y envíalo.','ok');
      else if(!text)status('No he podido entenderte bien. Toca el micrófono y vuelve a intentarlo.','warn')
    };
    try{r.start()}catch(e){active=null;setMic(false);status('No pude iniciar el micrófono. Vuelve a tocarlo.','warn')}
  }

  installStyle();
  document.addEventListener('click',function(ev){
    var o=overlay();if(!o||!o.classList.contains('is-open'))return;
    var target=ev.target&&ev.target.closest?ev.target.closest('#eternaOverlayV159 [data-et-mic],#eternaOverlayV159 [data-et-startaction="voice"]'):null;
    if(!target)return;
    ev.preventDefault();ev.stopImmediatePropagation();start()
  },true);

  var mo=new MutationObserver(function(){installStyle();removeConversation()});
  try{mo.observe(document.documentElement,{childList:true,subtree:true})}catch(e){}
  root.addEventListener('coco:eterna-close',function(){if(active)stop()});
  setTimeout(removeConversation,0);
})(window);
