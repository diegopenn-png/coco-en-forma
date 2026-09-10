/* ETERNA voice reliability · 160.99.0
 * - Removes the second/global getUserMedia VAD that competed with Eterna Experience.
 * - Leaves the canonical age-adaptive VAD in eterna-experience-v160.js as the single recorder controller.
 * - Makes "Conversar con Eterna" a persistent spoken session: listen -> transcribe -> think -> speak -> listen again.
 * - Keeps the desktop mode selector/layout.
 * Does not change auth, subscriptions, payments, games, scoring, Safety or School Scope.
 */
(function(root){
  'use strict';
  if(root.__ETERNA_VOICE_RELIABILITY_160990__)return;
  root.__ETERNA_VOICE_RELIABILITY_160990__=true;

  var MODE_OPTIONS=[
    ['homework','Ayúdame con mi tarea'],
    ['ask','Pregunta del cole'],
    ['review','Revisa lo que hice'],
    ['explain','Explícame un tema'],
    ['exam','Prepárame para un examen'],
    ['practice','Practicar lo que me cuesta']
  ];

  function overlay(){return document.getElementById('eternaOverlayV159')}
  function conversationButton(){var o=overlay();return o&&o.querySelector('[data-et-converse]')}
  function micButton(){var o=overlay();return o&&o.querySelector('[data-et-mic]')}
  function modeLabel(value){for(var i=0;i<MODE_OPTIONS.length;i++)if(MODE_OPTIONS[i][0]===value)return MODE_OPTIONS[i][1];return'Modo de Eterna'}
  function currentMode(){
    var o=overlay();if(!o)return'';
    var active=o.querySelector('[data-et-mode].is-active,[data-et-modechoice].is-active');
    if(active&&active.dataset)return active.dataset.etMode||active.dataset.etModechoice||'';
    return''
  }

  /* ---------- desktop selector: unchanged behaviour ---------- */
  function closeDesktopModeMenus(except){
    var o=overlay();if(!o)return;
    var menus=o.querySelectorAll('.eternaV160DesktopModeSelector.is-open');
    for(var i=0;i<menus.length;i++)if(menus[i]!==except){
      menus[i].classList.remove('is-open');
      var b=menus[i].querySelector('.eternaV160ModeDropdownButton');if(b)b.setAttribute('aria-expanded','false')
    }
  }

  function ensureDesktopModeSelector(){
    var o=overlay();if(!o)return;
    var actions=o.querySelector('.eternaV160ModeActions');if(!actions)return;
    var wrap=actions.querySelector('.eternaV160DesktopModeSelector');
    if(!wrap){
      wrap=document.createElement('div');
      wrap.className='eternaV160DesktopModeSelector';
      wrap.innerHTML='<button type="button" class="eternaV160ModeDropdownButton" aria-haspopup="listbox" aria-expanded="false"><span class="eternaV160ModeDropdownValue"></span><span class="eternaV160ModeDropdownChevron" aria-hidden="true">⌄</span></button><div class="eternaV160ModeDropdownMenu" role="listbox" aria-label="Modos de Eterna"></div>';
      actions.insertBefore(wrap,actions.firstChild);
      var menu=wrap.querySelector('.eternaV160ModeDropdownMenu');
      MODE_OPTIONS.forEach(function(x){
        var item=document.createElement('button');
        item.type='button';item.className='eternaV160ModeDropdownOption';item.setAttribute('role','option');item.setAttribute('data-value',x[0]);item.textContent=x[1];
        item.addEventListener('click',function(){
          endPersistentConversation('mode-change');
          var value=item.getAttribute('data-value');
          var target=o.querySelector('[data-et-mode="'+value+'"],[data-et-modechoice="'+value+'"]');
          wrap.classList.remove('is-open');wrap.querySelector('.eternaV160ModeDropdownButton').setAttribute('aria-expanded','false');
          if(target&&!target.classList.contains('is-active'))target.click();
          setTimeout(ensureDesktopModeSelector,0)
        });
        menu.appendChild(item)
      });
      var trigger=wrap.querySelector('.eternaV160ModeDropdownButton');
      trigger.addEventListener('click',function(){
        var opening=!wrap.classList.contains('is-open');closeDesktopModeMenus(wrap);wrap.classList.toggle('is-open',opening);trigger.setAttribute('aria-expanded',opening?'true':'false')
      });
      trigger.addEventListener('keydown',function(ev){if(ev.key==='Escape'){wrap.classList.remove('is-open');trigger.setAttribute('aria-expanded','false')}})
    }
    var mode=currentMode()||'homework',valueNode=wrap.querySelector('.eternaV160ModeDropdownValue');if(valueNode)valueNode.textContent=modeLabel(mode);
    var items=wrap.querySelectorAll('.eternaV160ModeDropdownOption');
    for(var j=0;j<items.length;j++){
      var selected=items[j].getAttribute('data-value')===mode;items[j].classList.toggle('is-selected',selected);items[j].setAttribute('aria-selected',selected?'true':'false')
    }
  }

  function installDesktopModeActionsLayout(){
    if(document.getElementById('eterna-desktop-mode-actions-v160990'))return;
    var style=document.createElement('style');style.id='eterna-desktop-mode-actions-v160990';
    style.textContent='@media (min-width:761px){'+
      '#eternaOverlayV159 .eternaV160ModeActions{display:grid!important;grid-template-columns:270px minmax(320px,1fr)!important;grid-template-rows:46px 46px!important;gap:8px 14px!important;align-items:stretch!important;justify-content:stretch!important;flex:0 1 70%!important;width:auto!important;max-width:820px!important;min-width:604px!important;margin-left:auto!important;}'+
      '#eternaOverlayV159 .eternaV160DesktopModeSelector{position:relative!important;grid-column:1!important;grid-row:1!important;display:block!important;width:100%!important;height:46px!important;margin:0!important;padding:0 10px!important;border:1px solid #b9dfea!important;border-radius:13px!important;background:#fff!important;box-sizing:border-box!important;color:#315d73!important;z-index:20!important;}'+
      '#eternaOverlayV159 .eternaV160ModeDropdownButton{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:10px!important;width:100%!important;height:44px!important;margin:0!important;padding:0!important;border:0!important;background:transparent!important;color:#173f59!important;cursor:pointer!important;text-align:left!important;font:800 12px/1.2 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;}'+
      '#eternaOverlayV159 .eternaV160ModeDropdownValue{display:block!important;min-width:0!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;}'+
      '#eternaOverlayV159 .eternaV160ModeDropdownChevron{flex:0 0 auto!important;color:#587587!important;font-size:17px!important;line-height:1!important;}'+
      '#eternaOverlayV159 .eternaV160DesktopModeSelector.is-open .eternaV160ModeDropdownChevron{transform:rotate(180deg)!important;}'+
      '#eternaOverlayV159 .eternaV160ModeDropdownMenu{display:none!important;position:absolute!important;left:0!important;top:calc(100% + 6px)!important;width:100%!important;padding:6px!important;border:1px solid #c7e1eb!important;border-radius:14px!important;background:#fff!important;box-shadow:0 12px 30px rgba(23,63,89,.16)!important;z-index:100!important;}'+
      '#eternaOverlayV159 .eternaV160DesktopModeSelector.is-open .eternaV160ModeDropdownMenu{display:grid!important;gap:3px!important;}'+
      '#eternaOverlayV159 .eternaV160ModeDropdownOption{display:block!important;width:100%!important;min-height:38px!important;padding:8px 10px!important;border:0!important;border-radius:10px!important;background:#fff!important;color:#315d73!important;text-align:left!important;cursor:pointer!important;font:750 11px/1.25 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;}'+
      '#eternaOverlayV159 .eternaV160ModeDropdownOption:hover,#eternaOverlayV159 .eternaV160ModeDropdownOption:focus{background:#f0f9fc!important;outline:none!important;}'+
      '#eternaOverlayV159 .eternaV160ModeDropdownOption.is-selected{background:#e8f6fb!important;color:#173f59!important;font-weight:850!important;}'+
      '#eternaOverlayV159 .eternaV160ModeActions>.eternaV160NewActivity{grid-column:1!important;grid-row:2!important;width:100%!important;max-width:none!important;min-width:0!important;height:46px!important;min-height:46px!important;margin:0!important;box-sizing:border-box!important;}'+
      '#eternaOverlayV159 .eternaV160ModeActions>.eternaV160Conversation{grid-column:2!important;grid-row:1 / 3!important;align-self:stretch!important;width:100%!important;max-width:none!important;min-width:0!important;height:auto!important;min-height:100px!important;margin:0!important;box-sizing:border-box!important;}'+
      '#eternaOverlayV159 .eternaV160ModeActions>[data-et-changemode]{display:none!important;}'+
    '}@media (max-width:760px){#eternaOverlayV159 .eternaV160DesktopModeSelector{display:none!important;}}'+
    '#eternaOverlayV159 .eternaV160Conversation.is-persistent{outline:2px solid rgba(255,255,255,.35);outline-offset:-5px;}';
    document.head.appendChild(style)
  }

  document.addEventListener('click',function(ev){var wrap=ev.target&&ev.target.closest?ev.target.closest('.eternaV160DesktopModeSelector'):null;if(!wrap)closeDesktopModeMenus(null)},true);
  var selectorRaf=0;
  function scheduleSelector(){if(selectorRaf)return;selectorRaf=requestAnimationFrame(function(){selectorRaf=0;ensureDesktopModeSelector()})}
  function startSelectorObserver(){
    installDesktopModeActionsLayout();scheduleSelector();
    if(typeof MutationObserver!=='function')return;
    var observer=new MutationObserver(scheduleSelector);observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
    var retries=0,t=setInterval(function(){retries++;scheduleSelector();if(retries>=20)clearInterval(t)},250)
  }
  startSelectorObserver();

  /* ---------- persistent spoken conversation ----------
   * IMPORTANT: there is deliberately NO navigator.mediaDevices.getUserMedia override here.
   * eterna-experience-v160.js already owns recording + age-adaptive VAD + retry.
   */
  var persistent=false,lastVoiceState='idle',restartTimer=0,sessionNonce=0;

  function setConversationCopy(title,copy,active){
    var b=conversationButton();if(!b)return;
    var t=b.querySelector('[data-et-converse-title]'),c=b.querySelector('[data-et-converse-copy]');
    if(t)t.textContent=title;if(c)c.textContent=copy;
    b.classList.toggle('is-persistent',Boolean(active));
    b.setAttribute('aria-pressed',active?'true':'false')
  }

  function showPersistentState(state){
    if(!persistent)return;
    if(state==='starting')setConversationCopy('Activando el micrófono…','La conversación seguirá abierta',true);
    else if(state==='listening')setConversationCopy('Te escucho…','Habla con normalidad · toca aquí para terminar la conversación',true);
    else if(state==='transcribing')setConversationCopy('Entendiendo tu voz…','La conversación sigue abierta',true);
    else if(state==='thinking')setConversationCopy('Eterna está pensando…','Preparando su respuesta',true);
    else if(state==='preparing')setConversationCopy('Preparando su voz…','Después volverá a escucharte automáticamente',true);
    else if(state==='speaking')setConversationCopy('Eterna está hablando…','Cuando termine, te escuchará de nuevo',true);
    else setConversationCopy('Conversación activa','Preparando el siguiente turno · toca aquí para terminar',true)
  }

  function clearRestart(){if(restartTimer){clearTimeout(restartTimer);restartTimer=0}}

  function endPersistentConversation(reason){
    if(!persistent&&root.__ETERNA_PERSISTENT_CONVERSATION__!==true)return;
    persistent=false;root.__ETERNA_PERSISTENT_CONVERSATION__=false;root.__ETERNA_VOICE_DIALOG_ACTIVE__=false;sessionNonce++;clearRestart();
    var p=root.__ETERNA_VOICE_AUDIO__;if(p){try{p.pause();p.currentTime=0}catch(e){}}
    var o=overlay();
    if(o){
      var cancel=o.querySelector('[data-et-voice-panel].is-visible [data-et-voice-cancel]');
      if(cancel)try{cancel.click()}catch(e){}
    }
    setConversationCopy('Conversar con Eterna','Habla y Eterna te responde con su voz',false);
    lastVoiceState='idle'
  }

  function beginPersistentConversation(){
    persistent=true;root.__ETERNA_PERSISTENT_CONVERSATION__=true;root.__ETERNA_VOICE_DIALOG_ACTIVE__=true;sessionNonce++;clearRestart();showPersistentState('starting')
  }

  function micAlreadyBusy(){
    var o=overlay();if(!o)return false;
    var mic=o.querySelector('[data-et-mic]'),panel=o.querySelector('[data-et-voice-panel]');
    return Boolean((mic&&mic.classList.contains('recording'))||(panel&&panel.classList.contains('is-visible')))
  }

  function restartListeningAfterReply(){
    if(!persistent)return;
    clearRestart();var myNonce=sessionNonce;
    restartTimer=setTimeout(function(){
      restartTimer=0;
      if(!persistent||myNonce!==sessionNonce||document.hidden)return;
      var o=overlay(),mic=micButton();
      if(!o||!o.classList.contains('is-open')||!mic)return endPersistentConversation('overlay-closed');
      if(micAlreadyBusy())return;
      if(mic.disabled){restartTimer=setTimeout(restartListeningAfterReply,350);return}
      root.__ETERNA_VOICE_DIALOG_ACTIVE__=true;
      showPersistentState('starting');
      try{mic.click()}catch(e){showPersistentState('idle')}
    },520)
  }

  /* Mark the session on the same user gesture that starts the existing spoken-dialogue controller.
     We do not block that controller on the first tap. */
  document.addEventListener('click',function(ev){
    var converse=ev.target&&ev.target.closest?ev.target.closest('#eternaOverlayV159 [data-et-converse]'):null;
    if(converse){
      if(!persistent){beginPersistentConversation();return}
      /* Existing spoken controller receives this same tap first on some builds and may stop the
         current turn. We then make that stop final instead of allowing an automatic restart. */
      endPersistentConversation('user');return
    }
    var mode=ev.target&&ev.target.closest?ev.target.closest('#eternaOverlayV159 [data-et-mode],#eternaOverlayV159 [data-et-modechoice],#eternaOverlayV159 [data-et-changemode],#eternaOverlayV159 .eternaV160NewActivity,#eternaOverlayV159 .eternaV159Close'):null;
    if(mode&&persistent)endPersistentConversation('navigation')
  },true);

  root.addEventListener('coco:eterna-voice-state',function(ev){
    var state=ev&&ev.detail&&ev.detail.state||'idle';
    var previous=lastVoiceState;lastVoiceState=state;
    if(!persistent)return;
    /* Core deliberately clears __ETERNA_VOICE_DIALOG_ACTIVE__ after applying one answer.
       Persistent conversation owns the outer session, so restore it for the next turn. */
    if(state!=='idle')root.__ETERNA_VOICE_DIALOG_ACTIVE__=true;
    showPersistentState(state);
    if(state==='idle'&&(previous==='speaking'||previous==='preparing'))restartListeningAfterReply()
  });

  /* Fallback for a browser/TTS path that applies the answer but does not emit speaking cleanly. */
  root.addEventListener('coco:eterna-response-applied',function(){
    if(!persistent)return;
    root.__ETERNA_VOICE_DIALOG_ACTIVE__=true;
    showPersistentState('preparing');
    var myNonce=sessionNonce;
    setTimeout(function(){
      if(!persistent||myNonce!==sessionNonce)return;
      if(lastVoiceState==='idle')restartListeningAfterReply()
    },2200)
  });

  root.addEventListener('coco:eterna-context-invalidated',function(){endPersistentConversation('context')});
  root.addEventListener('coco:eterna-ui-reset',function(){endPersistentConversation('reset');setTimeout(ensureDesktopModeSelector,0)});
  document.addEventListener('visibilitychange',function(){
    if(document.hidden&&persistent){clearRestart();showPersistentState('idle')}
    else if(!document.hidden&&persistent&&lastVoiceState==='idle')restartListeningAfterReply()
  },{passive:true});

  root.ETERNA_VOICE_RELIABILITY_160990=Object.freeze({
    version:'160.99.0',
    single_vad_owner:'eterna-experience-v160.js',
    persistent_conversation:true,
    stopConversation:function(){endPersistentConversation('api')},
    isConversationActive:function(){return persistent}
  });
})(window);
