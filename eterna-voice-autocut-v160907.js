/* ETERNA voice reliability hotfix · 160.93.12
 * Scope: reliable automatic end-of-speech cutoff for ETERNA conversation mic,
 * age-adaptive silence windows, bounded watchdogs, continuous visible progress,
 * and desktop-only mode-action layout so conversation never covers controls.
 * Does not change auth, subscriptions, payments, games, scoring, Safety or School Scope.
 */
(function(root){
  'use strict';
  if(root.__ETERNA_VOICE_AUTOCUT_1609312__)return;
  root.__ETERNA_VOICE_AUTOCUT_1609312__=true;

  var media=navigator.mediaDevices;
  if(!media||typeof media.getUserMedia!=='function')return;

  function installDesktopModeActionsLayout(){
    if(document.getElementById('eterna-desktop-mode-actions-v1609312'))return;
    var style=document.createElement('style');
    style.id='eterna-desktop-mode-actions-v1609312';
    style.textContent='@media (min-width:761px){'+
      '#eternaOverlayV159 .eternaV160ModeActions{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;grid-template-rows:auto auto!important;gap:10px 12px!important;align-items:stretch!important;width:100%!important;}'+
      '#eternaOverlayV159 .eternaV160ModeActions>.eternaV160NewActivity{grid-column:1!important;grid-row:1!important;width:100%!important;max-width:none!important;margin:0!important;order:initial!important;}'+
      '#eternaOverlayV159 .eternaV160ModeActions>[data-et-changemode]{grid-column:2!important;grid-row:1!important;width:100%!important;max-width:none!important;margin:0!important;order:initial!important;}'+
      '#eternaOverlayV159 .eternaV160ModeActions>.eternaV160Conversation{grid-column:1 / -1!important;grid-row:2!important;width:100%!important;max-width:none!important;min-width:0!important;margin:0!important;order:initial!important;box-sizing:border-box!important;}'+
    '}';
    document.head.appendChild(style)
  }
  installDesktopModeActionsLayout();

  var originalGetUserMedia=media.getUserMedia.bind(media);
  var recentEternaMicIntentAt=0;
  var monitor=null;

  function overlay(){return document.getElementById('eternaOverlayV159')}
  function clean(v){return String(v==null?'':v).replace(/\s+/g,' ').trim()}

  function ageFromUi(){
    var o=overlay();if(!o)return null;
    var text=clean(o.textContent);
    var m=text.match(/([1-6])(?:º|o)?\s+de\s+Primaria/i);if(m)return 5+Number(m[1]);
    m=text.match(/([1-4])(?:º|o)?\s+de\s+ESO/i);if(m)return 11+Number(m[1]);
    m=text.match(/([1-2])(?:º|o)?\s+de\s+Bachillerato/i);if(m)return 15+Number(m[1]);
    var band=String(o.getAttribute('data-et-age-band')||'').toLowerCase();
    if(band==='teen')return 15;
    if(band==='child')return 10;
    return null
  }

  function cfgForAge(age){
    age=Number(age);
    if(age>=17)return{silenceMs:1550,noSpeechMs:9500,maxMs:32000,minSpeechMs:150};
    if(age>=15)return{silenceMs:1750,noSpeechMs:10000,maxMs:34000,minSpeechMs:160};
    if(age>=12)return{silenceMs:2050,noSpeechMs:11000,maxMs:36000,minSpeechMs:180};
    if(age>=9)return{silenceMs:2400,noSpeechMs:12500,maxMs:40000,minSpeechMs:200};
    if(age>=6)return{silenceMs:2800,noSpeechMs:14000,maxMs:44000,minSpeechMs:220};
    return{silenceMs:2200,noSpeechMs:12000,maxMs:38000,minSpeechMs:180}
  }

  function ensureLive(){
    var o=overlay();if(!o)return null;
    var c=o.querySelector('[data-et-chat]');if(!c)return null;
    var live=c.querySelector('.eternaV160LiveState');
    if(!live){live=document.createElement('div');live.className='eternaV160LiveState';c.insertBefore(live,c.firstChild)}
    return live
  }

  function showProgress(text){
    var live=ensureLive();if(!live||!text)return;
    live.className='eternaV160LiveState is-visible is-thinking';
    live.innerHTML='<span class="eternaV160LiveIcon" aria-hidden="true">✦</span><span>'+String(text).replace(/[&<>"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'})[c]})+'<span class="eternaV160ThinkingDots" aria-hidden="true"><i></i><i></i><i></i></span></span>'
  }

  function clickControl(selector){
    var o=overlay(),b=o&&o.querySelector(selector);if(!b)return false;
    try{b.click();return true}catch(e){return false}
  }

  function cleanup(){
    var m=monitor;monitor=null;if(!m)return;
    if(m.raf)cancelAnimationFrame(m.raf);
    if(m.maxTimer)clearTimeout(m.maxTimer);
    try{if(m.ctx&&m.ctx.state!=='closed')m.ctx.close()}catch(e){}
  }

  function finish(reason){
    var m=monitor;if(!m||m.done)return;
    m.done=true;
    if(reason==='no-speech'){
      if(!clickControl('[data-et-voice-cancel]'))clickControl('[data-et-mic]');
      cleanup();
      return
    }
    showProgress(reason==='max'?'Procesando lo que has dicho…':'Procesando tu voz…');
    if(!clickControl('[data-et-voice-finish]'))clickControl('[data-et-mic]');
    cleanup()
  }

  function startMonitor(stream){
    cleanup();
    var o=overlay();if(!o||!o.classList.contains('is-open'))return;
    var Ctx=root.AudioContext||root.webkitAudioContext;if(!Ctx)return;
    var cfg=cfgForAge(ageFromUi()),ctx=null,analyser=null;
    try{ctx=new Ctx({latencyHint:'interactive'})}catch(e){try{ctx=new Ctx()}catch(_e){return}}
    try{
      if(ctx.state==='suspended')ctx.resume().catch(function(){});
      var source=ctx.createMediaStreamSource(stream);
      analyser=ctx.createAnalyser();analyser.fftSize=1024;analyser.smoothingTimeConstant=.18;source.connect(analyser)
    }catch(e){try{ctx.close()}catch(_e){};return}

    var m={ctx:ctx,analyser:analyser,startedAt:performance.now(),voice:false,candidateAt:0,lastVoiceAt:0,noise:.006,smoothed:0,done:false,raf:0,maxTimer:0};
    monitor=m;
    var data=new Uint8Array(analyser.fftSize);

    function tick(){
      if(monitor!==m||m.done)return;
      if(!overlay()||!overlay().classList.contains('is-open')){cleanup();return}
      if(m.ctx&&m.ctx.state==='suspended'){try{m.ctx.resume()}catch(e){}}
      analyser.getByteTimeDomainData(data);
      var sum=0;for(var i=0;i<data.length;i++){var x=(data[i]-128)/128;sum+=x*x}
      var rms=Math.sqrt(sum/data.length),now=performance.now(),elapsed=now-m.startedAt;
      m.smoothed=m.smoothed?(.70*m.smoothed+.30*rms):rms;
      var level=m.smoothed;
      var attack=Math.max(.013,Math.min(.060,m.noise*2.35));
      var release=Math.max(.0085,Math.min(.042,m.noise*1.50));

      if(!m.voice){
        if(!m.candidateAt&&level<attack){var learn=elapsed<700?.11:.02;m.noise=Math.max(.0035,Math.min(.032,m.noise*(1-learn)+level*learn))}
        attack=Math.max(.013,Math.min(.060,m.noise*2.35));
        release=Math.max(.0085,Math.min(.042,m.noise*1.50));
        if(level>attack){
          if(!m.candidateAt)m.candidateAt=now;
          var candidate=now-m.candidateAt,strong=level>attack*1.7;
          if(candidate>=cfg.minSpeechMs||(strong&&candidate>=90)){m.voice=true;m.lastVoiceAt=now}
        }else if(level<release*1.12)m.candidateAt=0
      }else if(level>release){m.lastVoiceAt=now}

      if(m.voice&&now-m.lastVoiceAt>cfg.silenceMs&&elapsed>1300){finish('silence');return}
      if(!m.voice&&elapsed>cfg.noSpeechMs){finish('no-speech');return}
      m.raf=requestAnimationFrame(tick)
    }

    m.maxTimer=setTimeout(function(){if(monitor===m&&!m.done)finish(m.voice?'max':'no-speech')},cfg.maxMs);
    m.raf=requestAnimationFrame(tick)
  }

  media.getUserMedia=function(constraints){
    var isAudio=Boolean(constraints&&constraints.audio);
    return originalGetUserMedia(constraints).then(function(stream){
      if(isAudio&&Date.now()-recentEternaMicIntentAt<5000){setTimeout(function(){startMonitor(stream)},120)}
      return stream
    })
  };

  document.addEventListener('click',function(ev){
    var mic=ev.target&&ev.target.closest?ev.target.closest('#eternaOverlayV159 [data-et-mic]'):null;
    if(mic){recentEternaMicIntentAt=Date.now();showProgress('Activando el micrófono…');return}
    var send=ev.target&&ev.target.closest?ev.target.closest('#eternaOverlayV159 [data-et-send]'):null;
    if(send&&!send.disabled)showProgress('Enviando tu pregunta…')
  },true);

  root.addEventListener('coco:eterna-response-applied',cleanup);
  root.addEventListener('coco:eterna-ui-reset',cleanup);
  document.addEventListener('visibilitychange',function(){if(document.hidden)cleanup()},{passive:true});
})(window);
