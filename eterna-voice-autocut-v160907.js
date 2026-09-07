/* ETERNA voice reliability hotfix · 160.93.15
 * Scope: reliable automatic end-of-speech cutoff for ETERNA conversation mic,
 * age-adaptive silence windows, bounded watchdogs, continuous visible progress,
 * and a persistent desktop mode dropdown aligned with mobile behavior.
 * Does not change auth, subscriptions, payments, games, scoring, Safety or School Scope.
 */
(function(root){
  'use strict';
  if(root.__ETERNA_VOICE_AUTOCUT_1609315__)return;
  root.__ETERNA_VOICE_AUTOCUT_1609315__=true;

  var MODE_OPTIONS=[
    ['homework','Ayúdame con mi tarea'],
    ['ask','Pregunta del cole'],
    ['review','Revisa lo que hice'],
    ['explain','Explícame un tema'],
    ['exam','Prepárame para un examen'],
    ['practice','Practicar lo que me cuesta']
  ];

  function overlay(){return document.getElementById('eternaOverlayV159')}

  function currentMode(){
    var o=overlay();if(!o)return'';
    var active=o.querySelector('[data-et-mode].is-active,[data-et-modechoice].is-active');
    if(active&&active.dataset)return active.dataset.etMode||active.dataset.etModechoice||'';
    return''
  }

  function ensureDesktopModeSelector(){
    var o=overlay();if(!o)return;
    var actions=o.querySelector('.eternaV160ModeActions');if(!actions)return;
    var wrap=actions.querySelector('.eternaV160DesktopModeSelector');
    if(!wrap){
      wrap=document.createElement('label');
      wrap.className='eternaV160DesktopModeSelector';
      wrap.innerHTML='<span>Modo</span><select aria-label="Cambiar modo de Eterna">'+MODE_OPTIONS.map(function(x){return'<option value="'+x[0]+'">'+x[1]+'</option>'}).join('')+'</select>';
      actions.insertBefore(wrap,actions.firstChild);
      var select=wrap.querySelector('select');
      select.addEventListener('change',function(){
        var value=select.value;
        var target=o.querySelector('[data-et-mode="'+value+'"],[data-et-modechoice="'+value+'"]');
        if(target&&!target.classList.contains('is-active'))target.click();
        setTimeout(ensureDesktopModeSelector,0)
      })
    }
    var select=wrap.querySelector('select'),mode=currentMode();
    if(select&&mode&&select.value!==mode)select.value=mode
  }

  function installDesktopModeActionsLayout(){
    if(document.getElementById('eterna-desktop-mode-actions-v1609315'))return;
    var style=document.createElement('style');
    style.id='eterna-desktop-mode-actions-v1609315';
    style.textContent='@media (min-width:761px){'+
      '#eternaOverlayV159 .eternaV160ModeActions{display:grid!important;grid-template-columns:220px minmax(320px,1fr)!important;grid-template-rows:46px 46px!important;gap:8px 12px!important;align-items:stretch!important;justify-content:stretch!important;flex:0 1 66%!important;width:auto!important;max-width:760px!important;min-width:552px!important;margin-left:auto!important;}'+
      '#eternaOverlayV159 .eternaV160DesktopModeSelector{grid-column:1!important;grid-row:1!important;display:grid!important;grid-template-columns:42px minmax(0,1fr)!important;align-items:center!important;gap:6px!important;width:100%!important;height:46px!important;margin:0!important;padding:0 8px!important;border:1px solid #b9dfea!important;border-radius:12px!important;background:#fff!important;box-sizing:border-box!important;color:#315d73!important;}'+
      '#eternaOverlayV159 .eternaV160DesktopModeSelector>span{font:900 9px/1 inherit!important;color:#68808e!important;text-transform:uppercase!important;letter-spacing:.03em!important;}'+
      '#eternaOverlayV159 .eternaV160DesktopModeSelector>select{display:block!important;width:100%!important;min-width:0!important;height:36px!important;border:0!important;outline:0!important;background:#fff!important;color:#315d73!important;font:900 10px inherit!important;cursor:pointer!important;appearance:auto!important;-webkit-appearance:menulist!important;}'+
      '#eternaOverlayV159 .eternaV160ModeActions>.eternaV160NewActivity{grid-column:1!important;grid-row:2!important;width:100%!important;max-width:none!important;min-width:0!important;height:46px!important;min-height:46px!important;margin:0!important;order:initial!important;box-sizing:border-box!important;}'+
      '#eternaOverlayV159 .eternaV160ModeActions>.eternaV160Conversation{grid-column:2!important;grid-row:1 / 3!important;align-self:stretch!important;width:100%!important;max-width:none!important;min-width:0!important;height:auto!important;min-height:100px!important;margin:0!important;order:initial!important;box-sizing:border-box!important;}'+
      '#eternaOverlayV159 .eternaV160ModeActions>[data-et-changemode]{display:none!important;}'+
    '}@media (max-width:760px){#eternaOverlayV159 .eternaV160DesktopModeSelector{display:none!important;}}';
    document.head.appendChild(style)
  }

  var selectorRaf=0;
  function scheduleSelector(){
    if(selectorRaf)return;
    selectorRaf=requestAnimationFrame(function(){selectorRaf=0;ensureDesktopModeSelector()})
  }
  function startSelectorObserver(){
    installDesktopModeActionsLayout();
    scheduleSelector();
    var rootNode=document.documentElement||document;
    if(!rootNode||typeof MutationObserver!=='function')return;
    var observer=new MutationObserver(function(mutations){
      for(var i=0;i<mutations.length;i++){
        if(mutations[i].type==='childList'||mutations[i].type==='attributes'){scheduleSelector();break}
      }
    });
    observer.observe(rootNode,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
    var retries=0;
    var retryTimer=setInterval(function(){
      retries++;scheduleSelector();
      if(retries>=20)clearInterval(retryTimer)
    },250)
  }
  startSelectorObserver();

  var media=navigator.mediaDevices;
  if(!media||typeof media.getUserMedia!=='function')return;

  var originalGetUserMedia=media.getUserMedia.bind(media);
  var recentEternaMicIntentAt=0;
  var monitor=null;

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

  document.addEventListener('click',function(ev){
    var mode=ev.target&&ev.target.closest?ev.target.closest('#eternaOverlayV159 [data-et-mode],#eternaOverlayV159 [data-et-modechoice]'):null;
    if(mode)setTimeout(ensureDesktopModeSelector,0)
  },true);
  root.addEventListener('coco:eterna-ui-reset',function(){cleanup();setTimeout(ensureDesktopModeSelector,0)});
  root.addEventListener('coco:eterna-response-applied',cleanup);
  document.addEventListener('visibilitychange',function(){if(document.hidden)cleanup()},{passive:true});
})(window);
