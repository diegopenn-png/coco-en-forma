/* ETERNA Experience v160.56 · pedagogía por edad + UX consolidada
 * Conversación uniforme + un solo indicador inferior + voz de un toque con VAD.
 * Capa aditiva: NO modifica Worker, Stripe, Supabase, juegos, rankings ni contratos existentes.
 * El único MutationObserver se limita al chat de Eterna.
 */
(function(root){
  "use strict";
  if(root.__ETERNA_EXPERIENCE_V16049__)return;
  root.__ETERNA_EXPERIENCE_V16049__=true;

  var VERSION="160.56-age-adaptive";
  var lastPedagogicalState=null;
  var voice=null;
  var voiceSendPending=false;
  var overlayObserver=null;
  var observedChat=null;
  var normalizeRaf=0;
  var thinkingAssistantCount=0;
  var audioSettingsCache={at:0,allowed:null};
  var browserMicCache={at:0,state:""};
  var hiddenTopStateNodes=[];
  var voiceStudentProfileCache={uid:"",age:null,stage:null,school_year:null,at:0};
  var sourceMemory=[];
  var originalFetch=typeof root.fetch==="function"?root.fetch.bind(root):null;

  function overlay(){return document.getElementById("eternaOverlayV159")}
  function chat(){var o=overlay();return o&&o.querySelector("[data-et-chat]")}
  function composer(){var o=overlay();return o&&o.querySelector("[data-et-composer]")}
  function clean(v){return String(v==null?"":v).replace(/\s+/g," ").trim()}
  function norm(v){return clean(v).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()}
  function endpoint(path){
    var c=root.COCO_CONFIG||{},base=String(c.eternaEndpoint||"").replace(/\/+$/,""),p=String(path||"");
    return base?base+(p.charAt(0)==="/"?p:"/"+p):""
  }
  function esc(v){
    return String(v==null?"":v).replace(/[&<>"']/g,function(c){
      return({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[c]
    })
  }

  function injectStyles(){
    if(document.getElementById("eterna-experience-v16049-css"))return;
    var s=document.createElement("style");
    s.id="eterna-experience-v16049-css";
    s.textContent=[
      "#eternaOverlayV159 .eternaV159Check,#eternaOverlayV159 .eternaV159Mission{display:none!important}",
      "#eternaOverlayV159 .eternaV160HiddenHelpTag{display:none!important}",
      "#eternaOverlayV159 .eternaV160ConversationCheck{margin-top:14px;padding-top:12px;border-top:1px solid rgba(23,63,89,.12);font-weight:800;line-height:1.45;color:#214d65}",
      "#eternaOverlayV159 .eternaV160ConversationCheck:before{content:'A ver si lo tenemos';display:block;margin-bottom:5px;color:#6b7f8a;font-size:10px;font-weight:900;letter-spacing:.04em;text-transform:uppercase}",
      "#eternaOverlayV159 .eternaV160LiveState{display:none;align-items:center;gap:9px;margin:0 0 8px;padding:9px 12px;border:1px solid #cfe8f2;border-radius:14px;background:#f1faff;color:#315d73;font-size:11px;font-weight:900;line-height:1.2;box-shadow:0 2px 0 rgba(190,224,238,.55)}",
      "#eternaOverlayV159 .eternaV160LiveState.is-visible{display:flex}",
      "#eternaOverlayV159 .eternaV160LiveIcon{display:grid;place-items:center;width:28px;height:28px;flex:0 0 28px;border-radius:10px;background:#e2f5fc;color:#ef6c05;font-size:17px}",
      "#eternaOverlayV159 .eternaV160ThinkingDots{display:inline-flex;gap:3px;margin-left:2px;vertical-align:middle}",
      "#eternaOverlayV159 .eternaV160ThinkingDots i{display:block;width:4px;height:4px;border-radius:50%;background:currentColor;animation:eternaThinkingDot16049 1.1s infinite ease-in-out}",
      "#eternaOverlayV159 .eternaV160ThinkingDots i:nth-child(2){animation-delay:.14s}#eternaOverlayV159 .eternaV160ThinkingDots i:nth-child(3){animation-delay:.28s}",
      "@keyframes eternaThinkingDot16049{0%,60%,100%{transform:translateY(0);opacity:.35}30%{transform:translateY(-3px);opacity:1}}",
      "#eternaOverlayV159 .eternaV160VoicePanel{display:none;align-items:center;gap:10px;margin:0 0 8px;padding:10px 11px;border:1px solid #bfe4f2;border-radius:15px;background:linear-gradient(180deg,#f4fcff,#edf9fd)}",
      "#eternaOverlayV159 .eternaV160VoicePanel.is-visible{display:flex}",
      "#eternaOverlayV159 .eternaV160VoiceWave{display:flex;align-items:center;justify-content:center;gap:3px;width:58px;height:34px;flex:0 0 58px}",
      "#eternaOverlayV159 .eternaV160VoiceWave i{width:4px;border-radius:99px;background:#2fa9dc;animation:eternaWave16049 .9s infinite ease-in-out}",
      "#eternaOverlayV159 .eternaV160VoiceWave i:nth-child(1){height:10px}.eternaV160VoiceWave i:nth-child(2){height:22px;animation-delay:.08s}.eternaV160VoiceWave i:nth-child(3){height:30px;animation-delay:.16s}.eternaV160VoiceWave i:nth-child(4){height:18px;animation-delay:.24s}.eternaV160VoiceWave i:nth-child(5){height:12px;animation-delay:.32s}",
      "@keyframes eternaWave16049{0%,100%{transform:scaleY(.55);opacity:.55}50%{transform:scaleY(1);opacity:1}}",
      "#eternaOverlayV159 .eternaV160VoiceCopy{min-width:0;flex:1}#eternaOverlayV159 .eternaV160VoiceCopy b{display:block;color:#173f59;font-size:12px}#eternaOverlayV159 .eternaV160VoiceCopy span{display:block;margin-top:2px;color:#68808e;font-size:9.5px;font-weight:750}",
      "#eternaOverlayV159 .eternaV160VoiceActions{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}",
      "#eternaOverlayV159 .eternaV160VoiceActions button{min-height:34px;padding:6px 9px;border-radius:10px;font:900 9.5px inherit;cursor:pointer;touch-action:manipulation}",
      "#eternaOverlayV159 .eternaV160VoiceFinish{border:0;background:#173f59;color:#fff}#eternaOverlayV159 .eternaV160VoiceCancel{border:1px solid #d3e7ef;background:#fff;color:#526f7f}",
      "#eternaOverlayV159 .eternaV159Quick{opacity:.88}#eternaOverlayV159 .eternaV159Quick button{min-height:32px!important}",
      "#eternaOverlayV159 [data-et-name],#cocoApp .carnet .quien strong{text-transform:capitalize!important}",
      "#eternaOverlayV159 textarea[data-et-input]{white-space:nowrap!important;overflow-x:auto!important;overflow-y:hidden!important;resize:none!important}",
      "#eternaOverlayV159 textarea[data-et-input]::placeholder{white-space:nowrap!important}",
      "#eternaOverlayV159 [data-et-mic]{position:relative;overflow:visible;min-width:48px!important;width:48px!important;height:48px!important;flex:0 0 48px!important;transition:transform .18s ease,box-shadow .18s ease,background .18s ease,border-color .18s ease}",
      "#eternaOverlayV159 [data-et-mic]:hover{transform:translateY(-1px)}#eternaOverlayV159 [data-et-mic]:focus-visible{outline:3px solid rgba(42,167,216,.28);outline-offset:3px}",
      "#eternaOverlayV159 .eternaV160MicSvg{display:block;width:22px;height:22px}#eternaOverlayV159 .eternaV160MicSvg path{fill:currentColor}",
      "#eternaOverlayV159 [data-et-mic].recording{background:#173f59!important;border-color:#173f59!important;color:#fff!important;box-shadow:0 0 0 5px rgba(23,63,89,.14)}",
      "#eternaOverlayV159 [data-et-mic].recording::after{content:\"\";position:absolute;inset:-4px;border-radius:inherit;border:2px solid rgba(23,63,89,.22);animation:eternaMicPulse16053 1.25s infinite ease-out}",
      "@keyframes eternaMicPulse16053{0%{transform:scale(.92);opacity:.75}70%{transform:scale(1.08);opacity:.05}100%{transform:scale(1.12);opacity:0}}",
      "#eternaOverlayV159 .eternaV160MemoryNote{margin:10px 0 0;padding:9px 11px;border:1px solid #dcebf2;border-radius:12px;background:#f8fcfe;color:#657d8a;font-size:9.5px;font-weight:700;line-height:1.45;text-align:left}",
      "#eternaOverlayV159 .eternaV160MemoryNote b{color:#315d73;font-size:9.5px}#eternaOverlayV159 .eternaV160MemoryNote span{color:#657d8a}",
      "#eternaOverlayV159 .eternaV160Sources{margin-top:11px;padding-top:9px;border-top:1px solid rgba(23,63,89,.10)}",
      "#eternaOverlayV159 .eternaV160SourcesBtn{display:inline-flex;align-items:center;gap:5px;min-height:31px;padding:5px 9px;border:1px solid #cfe3ec;border-radius:9px;background:#f7fbfd;color:#315d73;font:850 9.5px inherit;cursor:pointer;touch-action:manipulation}",
      "#eternaOverlayV159 .eternaV160SourcesPanel{display:grid;gap:6px;margin-top:7px;padding:8px 9px;border:1px solid #dcebf2;border-radius:10px;background:#fff}",
      "#eternaOverlayV159 .eternaV160SourcesPanel[hidden]{display:none!important}#eternaOverlayV159 .eternaV160SourcesPanel a{color:#146da0;text-decoration:underline;text-underline-offset:2px;font-size:9.5px;font-weight:750;line-height:1.35;overflow-wrap:anywhere}",
      "@media(max-width:760px){#eternaOverlayV159 [data-et-mic]{min-width:52px!important;width:52px!important;height:52px!important;flex-basis:52px!important}#eternaOverlayV159 .eternaV160MicSvg{width:24px!important;height:24px!important}}",
      "@media(max-width:640px){#eternaOverlayV159 .eternaV160LiveState{margin-bottom:7px;padding:8px 10px}#eternaOverlayV159 .eternaV160VoicePanel{align-items:flex-start;flex-wrap:wrap}#eternaOverlayV159 .eternaV160VoiceCopy{min-width:160px}#eternaOverlayV159 .eternaV160VoiceActions{width:100%;justify-content:flex-end}}",
      "@media(prefers-reduced-motion:reduce){#eternaOverlayV159 .eternaV160ThinkingDots i,#eternaOverlayV159 .eternaV160VoiceWave i,#eternaOverlayV159 [data-et-mic].recording::after{animation:none!important}}"
    ].join("");
    document.head.appendChild(s)
  }

  function ensureLiveState(){
    var c=composer();if(!c)return null;
    var live=c.querySelector("[data-et-live-state]");
    if(!live){
      live=document.createElement("div");
      live.className="eternaV160LiveState";
      live.setAttribute("data-et-live-state","");
      live.setAttribute("role","status");
      live.setAttribute("aria-live","polite");
      live.setAttribute("aria-atomic","true");
      c.insertBefore(live,c.firstChild)
    }
    return live
  }

  function setLive(kind,text){
    var live=ensureLiveState();if(!live)return;
    if(!text){live.className="eternaV160LiveState";live.innerHTML="";syncTopLiveDuplicate("","");return}
    var dots=kind==="thinking"?'<span class="eternaV160ThinkingDots" aria-hidden="true"><i></i><i></i><i></i></span>':"";
    live.className="eternaV160LiveState is-visible "+(kind?"is-"+kind:"");
    live.innerHTML='<span class="eternaV160LiveIcon" aria-hidden="true">'+(kind==="thinking"?"✦":kind==="processing"?"🎙️":"i")+'</span><span>'+esc(text)+dots+'</span>';
    syncTopLiveDuplicate(kind,text)
  }

  function micIconMarkup(){
    return '<svg class="eternaV160MicSvg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 15.2a3.9 3.9 0 0 0 3.9-3.9V6.9A3.9 3.9 0 1 0 8.1 6.9v4.4A3.9 3.9 0 0 0 12 15.2Zm6-3.9a1 1 0 1 0-2 0 4 4 0 1 1-8 0 1 1 0 0 0-2 0 6 6 0 0 0 5 5.91V20H9.6a1 1 0 0 0 0 2h4.8a1 1 0 1 0 0-2H13v-2.89A6 6 0 0 0 18 11.3Z"/></svg>'
  }

  function renderMicIdle(button){
    if(!button)return;
    button.classList.remove('recording');
    button.innerHTML=micIconMarkup();
    button.setAttribute('aria-label','Usar micrófono');
    button.setAttribute('title','Hablar con Eterna');
  }

  function renderMicRecording(button){
    if(!button)return;
    button.classList.add('recording');
    button.innerHTML=micIconMarkup();
    button.setAttribute('aria-label','Micrófono grabando');
    button.setAttribute('title','Grabando');
  }

  function restoreHiddenTopStates(){
    hiddenTopStateNodes.forEach(function(el){
      try{ if(el && el.style) el.style.removeProperty('display'); }catch(e){}
      try{ if(el && el.dataset) delete el.dataset.etDuplicateHidden; }catch(e){}
    });
    hiddenTopStateNodes=[];
  }

  function topStateCandidate(node){
    if(!node||!node.closest||node.closest('[data-et-composer]')||node.closest('.eternaV159Msg'))return null;
    var cur=node,limit=0,o=overlay(),base=clean(node.textContent);
    while(cur&&cur.parentElement&&cur.parentElement!==o&&limit<4){
      var parent=cur.parentElement,pt=clean(parent.textContent);
      if(!pt||pt.length>Math.max(base.length+40,120))break;
      if(parent.closest&&parent.closest('[data-et-composer],.eternaV159Msg'))break;
      cur=parent;limit++;
    }
    return cur
  }

  function syncTopLiveDuplicate(kind,text){
    restoreHiddenTopStates();
    if(!text)return;
    var o=overlay();if(!o)return;
    var target=norm(text),prefixes=['eterna esta pensando','preparando el microfono','entendiendo lo que has dicho','he entendido tu pregunta en','he entendido tu pregunta. enviandola','escuchando'];
    Array.prototype.slice.call(o.querySelectorAll('div,span,p,b,strong')).forEach(function(el){
      if(!el||!el.textContent)return;
      var t=norm(el.textContent);
      if(!t)return;
      var match=t===target||prefixes.some(function(p){return t.indexOf(p)===0});
      if(!match)return;
      var box=topStateCandidate(el);
      if(!box||box.dataset&&box.dataset.etDuplicateHidden==='1')return;
      try{box.dataset.etDuplicateHidden='1';box.style.display='none';hiddenTopStateNodes.push(box)}catch(e){}
    })
  }

  async function browserMicState(){
    if(browserMicCache.state&&Date.now()-browserMicCache.at<30000)return browserMicCache.state;
    var state='';
    try{
      if(navigator.permissions&&navigator.permissions.query){
        var p=await navigator.permissions.query({name:'microphone'});
        state=(p&&p.state)||'';
      }
    }catch(e){}
    browserMicCache={at:Date.now(),state:state};
    return state
  }

  function rememberMicGrant(){
    browserMicCache={at:Date.now(),state:'granted'};
    try{localStorage.setItem('eternaMicGrantedV16053','1')}catch(e){}
  }

  function hasRememberedMicGrant(){
    try{return localStorage.getItem('eternaMicGrantedV16053')==='1'}catch(e){return false}
  }

  function ensureVoicePanel(){
    var c=composer();if(!c)return null;
    var p=c.querySelector("[data-et-voice-panel]");
    if(!p){
      p=document.createElement("div");
      p.className="eternaV160VoicePanel";
      p.setAttribute("data-et-voice-panel","");
      p.innerHTML='<div class="eternaV160VoiceWave" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>'+
        '<div class="eternaV160VoiceCopy"><b>Escuchando…</b><span>Habla con normalidad. Eterna enviará la pregunta cuando detecte que has terminado.</span></div>'+
        '<div class="eternaV160VoiceActions"><button type="button" class="eternaV160VoiceCancel" data-et-voice-cancel>Cancelar</button><button type="button" class="eternaV160VoiceFinish" data-et-voice-finish>Terminar ahora</button></div>';
      var live=ensureLiveState();
      if(live&&live.nextSibling)c.insertBefore(p,live.nextSibling);else c.insertBefore(p,c.firstChild)
    }
    return p
  }

  function setVoicePanel(show){
    var p=ensureVoicePanel();if(p)p.classList.toggle("is-visible",Boolean(show))
  }

  function findPreviousAssistant(node){
    var n=node&&node.previousElementSibling;
    while(n){
      if(n.matches&&n.matches(".eternaV159Msg.assistant"))return n;
      n=n.previousElementSibling
    }
    return null
  }

  function findPreviousUser(node){
    var n=node&&node.previousElementSibling;
    while(n){
      if(n.matches&&n.matches(".eternaV159Msg.user"))return n;
      n=n.previousElementSibling
    }
    return null
  }

  function scrollTurnToStart(assistantRow){
    var c=chat();
    if(!c||!assistantRow)return;
    var anchor=findPreviousUser(assistantRow)||assistantRow;
    function apply(){
      if(!document.contains(c)||!document.contains(anchor))return;
      try{
        var cr=c.getBoundingClientRect(),ar=anchor.getBoundingClientRect();
        var delta=ar.top-cr.top-12;
        c.scrollTop=Math.max(0,c.scrollTop+delta)
      }catch(e){}
    }
    requestAnimationFrame(function(){
      apply();
      requestAnimationFrame(apply)
    })
  }

  function ensureMemoryNote(c){
    if(!c)return;
    var start=c.querySelector('.eternaV160Start');
    if(!start||start.querySelector('[data-et-memory-note]'))return;
    var note=document.createElement('div');
    note.className='eternaV160MemoryNote';
    note.setAttribute('data-et-memory-note','');
    note.innerHTML='<b>Privacidad y memoria · </b><span>Eterna no guarda tus conversaciones como un historial. Recuerda únicamente señales pedagógicas —conceptos, nivel aproximado, errores, ayuda y estrategias que funcionan— para ayudarte a aprender mejor. No diagnostica ni etiqueta.</span>';
    start.appendChild(note)
  }

  function safeSourceLinks(value){
    if(!Array.isArray(value))return[];
    var seen={},out=[];
    value.forEach(function(x){
      if(!x||typeof x!=='object')return;
      var url=String(x.url||'').trim(),title=clean(x.title||'Fuente institucional');
      try{
        var u=new URL(url,location.href);
        if(u.protocol!=='https:'&&u.protocol!=='http:')return;
        url=u.href
      }catch(e){return}
      if(seen[url])return;seen[url]=1;
      out.push({url:url,title:title||url})
    });
    return out.slice(0,6)
  }

  function rememberSourceDisclosure(data){
    var links=safeSourceLinks(data&&data.source_links),reply=norm(data&&data.reply||'');
    if(!links.length||!reply)return;
    sourceMemory.push({reply:reply.slice(0,360),links:links});
    if(sourceMemory.length>12)sourceMemory=sourceMemory.slice(-12)
  }

  function sourceEntryForBubble(bubble){
    if(!bubble)return null;
    var text=norm(bubble.textContent||'');
    for(var i=sourceMemory.length-1;i>=0;i--){
      var key=sourceMemory[i].reply;
      if(key&&(text.indexOf(key)===0||key.indexOf(text.slice(0,Math.min(180,text.length)))===0))return sourceMemory[i]
    }
    return null
  }

  function attachSourceDisclosure(row,entry){
    if(!row||!entry||!entry.links||!entry.links.length)return;
    var bubble=row.querySelector('.eternaV159Bubble');
    if(!bubble||bubble.querySelector('[data-et-sources]'))return;
    var wrap=document.createElement('div');wrap.className='eternaV160Sources';wrap.setAttribute('data-et-sources','');
    var button=document.createElement('button');button.type='button';button.className='eternaV160SourcesBtn';button.textContent='↗ Ver fuentes';
    var panel=document.createElement('div');panel.className='eternaV160SourcesPanel';panel.hidden=true;
    entry.links.forEach(function(x){
      var a=document.createElement('a');a.href=x.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=x.title||x.url;panel.appendChild(a)
    });
    button.onclick=function(){panel.hidden=!panel.hidden;button.textContent=panel.hidden?'↗ Ver fuentes':'Ocultar fuentes'};
    wrap.appendChild(button);wrap.appendChild(panel);bubble.appendChild(wrap)
  }

  function restoreRememberedSources(c){
    if(!c||!sourceMemory.length)return;
    var rows=c.querySelectorAll('.eternaV159Msg.assistant');
    for(var i=0;i<rows.length;i++){
      if(rows[i].querySelector('[data-et-sources]'))continue;
      var entry=sourceEntryForBubble(rows[i]);if(entry)attachSourceDisclosure(rows[i],entry)
    }
  }

  function normalizeConversation(){
    normalizeRaf=0;
    var o=overlay(),c=chat();if(!o||!c)return;
    ensureLiveState();
    ensureMemoryNote(c);
    restoreRememberedSources(c);
    c.querySelectorAll(".eternaV159Tag").forEach(function(tag){
      if(/^ayuda\s+\d/i.test(clean(tag.textContent)))tag.classList.add("eternaV160HiddenHelpTag")
    });
    c.querySelectorAll(".eternaV159Check").forEach(function(card){
      var q=clean(card.querySelector("p")&&card.querySelector("p").textContent);
      var row=findPreviousAssistant(card),bubble=row&&row.querySelector(".eternaV159Bubble");
      if(q&&bubble){
        var existing=norm(bubble.textContent);
        var nq=norm(q);
        if(nq&&existing.indexOf(nq)<0&&!bubble.querySelector(".eternaV160ConversationCheck")){
          var inline=document.createElement("div");
          inline.className="eternaV160ConversationCheck";
          inline.textContent=q;
          bubble.appendChild(inline)
        }
      }
      card.remove()
    });
    c.querySelectorAll(".eternaV159Mission").forEach(function(card){card.remove()})
  }

  function queueNormalize(){
    if(normalizeRaf)return;
    normalizeRaf=requestAnimationFrame(normalizeConversation)
  }

  function installOverlayObserver(){
    var c=chat();if(!c||observedChat===c)return;
    if(overlayObserver){try{overlayObserver.disconnect()}catch(e){}}
    observedChat=c;
    thinkingAssistantCount=c.querySelectorAll(".eternaV159Msg.assistant").length;
    overlayObserver=new MutationObserver(function(records){
      var assistantAdded=null;
      for(var i=0;i<records.length;i++){
        var nodes=records[i].addedNodes||[];
        for(var j=0;j<nodes.length;j++){
          var n=nodes[j];
          if(n.nodeType!==1)continue;
          if(n.matches&&n.matches(".eternaV159Msg.assistant"))assistantAdded=n;
          else if(n.querySelector)assistantAdded=n.querySelector(".eternaV159Msg.assistant");
          if(assistantAdded)break
        }
        if(assistantAdded)break
      }
      if(assistantAdded){
        setLive("","");
        scrollTurnToStart(assistantAdded)
      }
      queueNormalize()
    });
    overlayObserver.observe(c,{childList:true,subtree:true});
    queueNormalize()
  }

  function enforceSingleLineComposer(){
    var o=overlay(),input=o&&o.querySelector('[data-et-input]');
    if(!input)return;
    input.setAttribute('rows','1');
    input.setAttribute('wrap','off');
    input.style.whiteSpace='nowrap';
    input.style.overflowY='hidden';
    input.style.resize='none';

    var original=String(input.placeholder||'');
    var compact=original;
    if(window.matchMedia&&window.matchMedia('(max-width: 620px)').matches){
      if(/parte de la tarea no entiendes/i.test(original))compact='Escribe qué parte no entiendes…';
      else if(/pregunta del cole/i.test(original))compact='Escribe tu pregunta…';
      else if(/cuéntame qué hiciste|adjunta una foto/i.test(original))compact='Escribe lo que hiciste…';
      else if(/tema quieres entender/i.test(original))compact='¿Qué tema quieres entender?';
      else if(/asignatura y tema entra/i.test(original))compact='¿Qué tema entra en el examen?';
      else if(/quieres practicar hoy/i.test(original))compact='¿Qué quieres practicar?';
    }
    if(compact!==original)input.placeholder=compact
  }

  function ensureOverlay(){
    var o=overlay();if(!o)return;
    injectStyles();
    ensureLiveState();
    ensureVoicePanel();
    enforceSingleLineComposer();
    var mic=o.querySelector('[data-et-mic]');
    if(mic&&!mic.classList.contains('recording'))renderMicIdle(mic);
    installOverlayObserver();
    queueNormalize()
  }

  function showThinking(){
    ensureOverlay();
    var c=chat();thinkingAssistantCount=c?c.querySelectorAll(".eternaV159Msg.assistant").length:0;
    setVoicePanel(false);
    setLive("thinking","Eterna está pensando")
  }

  function fileNameForMime(type){
    var t=String(type||"").toLowerCase();
    if(t.indexOf("mp4")>=0||t.indexOf("m4a")>=0)return"pregunta.m4a";
    if(t.indexOf("ogg")>=0)return"pregunta.ogg";
    if(t.indexOf("wav")>=0)return"pregunta.wav";
    if(t.indexOf("mpeg")>=0||t.indexOf("mp3")>=0)return"pregunta.mp3";
    return"pregunta.webm"
  }

  function recorderMime(){
    if(typeof MediaRecorder==="undefined"||typeof MediaRecorder.isTypeSupported!=="function")return"";
    var list=["audio/mp4","audio/webm;codecs=opus","audio/webm","audio/ogg;codecs=opus","audio/ogg"];
    for(var i=0;i<list.length;i++)if(MediaRecorder.isTypeSupported(list[i]))return list[i];
    return""
  }

  function getSupabaseClient(){
    if(root.__COCO_SUPABASE_CLIENT)return root.__COCO_SUPABASE_CLIENT;
    var c=root.COCO_CONFIG||{};
    if(!root.supabase||!root.supabase.createClient||!c.url||!c.clave)return null;
    try{
      root.__COCO_SUPABASE_CLIENT=root.supabase.createClient(c.url,c.clave,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
      return root.__COCO_SUPABASE_CLIENT
    }catch(e){return null}
  }

  async function authToken(){
    var cli=getSupabaseClient();if(!cli)return"";
    try{
      var r=await cli.auth.getSession();
      return r&&r.data&&r.data.session&&r.data.session.access_token||""
    }catch(e){return""}
  }

  async function micAllowed(){
    if(audioSettingsCache.allowed!=null&&Date.now()-audioSettingsCache.at<30000)return audioSettingsCache.allowed;
    var token=await authToken(),url=endpoint("/v1/parent-settings");
    if(!token||!url)throw new Error("NO_AUTH");
    var r=await originalFetch(url,{method:"GET",headers:{Authorization:"Bearer "+token}});
    if(!r.ok)throw new Error("SETTINGS_"+r.status);
    var d=await r.json();
    audioSettingsCache={at:Date.now(),allowed:d.allow_audio_input!==false};
    return audioSettingsCache.allowed
  }

  function ageFromSchoolYear(year){
    var s=norm(year||'');
    var m=s.match(/([1-6])(?:o|º)?\s+de\s+primaria/);if(m)return 5+Number(m[1]);
    m=s.match(/([1-4])(?:o|º)?\s+de\s+eso/);if(m)return 11+Number(m[1]);
    m=s.match(/([1-2])(?:o|º)?\s+de\s+bachillerato/);if(m)return 15+Number(m[1]);
    m=s.match(/infantil[^0-9]*([345])/);if(m)return Number(m[1]);
    return null
  }

  async function loadVoiceStudentProfile(){
    var cli=getSupabaseClient();if(!cli||!cli.auth)return voiceStudentProfileCache;
    try{
      var sr=await cli.auth.getSession(),session=sr&&sr.data&&sr.data.session,uid=session&&session.user&&session.user.id?String(session.user.id):'';
      if(!uid)return voiceStudentProfileCache;
      if(voiceStudentProfileCache.uid===uid&&Date.now()-voiceStudentProfileCache.at<5*60*1000)return voiceStudentProfileCache;
      var results=await Promise.allSettled([
        cli.from('perfiles').select('edad').eq('id',uid).maybeSingle(),
        cli.from('eterna_student_profiles').select('stage,school_year').eq('user_id',uid).maybeSingle()
      ]);
      function dataAt(i){var x=results[i];return x&&x.status==='fulfilled'&&x.value?x.value.data:null}
      var base=dataAt(0)||{},profile=dataAt(1)||{},age=Number(base.edad);
      if(!isFinite(age)||age<=0)age=ageFromSchoolYear(profile.school_year);
      voiceStudentProfileCache={uid:uid,age:age||null,stage:profile.stage||null,school_year:profile.school_year||null,at:Date.now()};
      return voiceStudentProfileCache
    }catch(e){return voiceStudentProfileCache}
  }

  function vadConfigForStudent(profile){
    var age=Number(profile&&profile.age),stage=norm(profile&&profile.stage),year=norm(profile&&profile.school_year);
    if(!isFinite(age)||age<=0)age=ageFromSchoolYear(profile&&profile.school_year);
    if(stage.indexOf('bachillerato')>=0||year.indexOf('bachillerato')>=0)return{silenceMs:1500,noSpeechMs:9000,age:age||17,band:'bachillerato'};
    if(age>=17)return{silenceMs:1500,noSpeechMs:9000,age:age,band:'17-18'};
    if(age>=15)return{silenceMs:1600,noSpeechMs:9000,age:age,band:'15-16'};
    if(age>=12)return{silenceMs:1800,noSpeechMs:10000,age:age,band:'12-14'};
    if(age>=9)return{silenceMs:2100,noSpeechMs:11000,age:age,band:'9-11'};
    if(age>=6)return{silenceMs:2400,noSpeechMs:12000,age:age,band:'6-8'};
    return{silenceMs:1800,noSpeechMs:10000,age:age||null,band:'default'}
  }

  function stopTracks(stream){
    try{stream&&stream.getTracks().forEach(function(t){t.stop()})}catch(e){}
  }

  function cleanupVoice(){
    if(!voice)return;
    if(voice.raf)cancelAnimationFrame(voice.raf);
    if(voice.maxTimer)clearTimeout(voice.maxTimer);
    try{voice.audioContext&&voice.audioContext.close()}catch(e){}
    stopTracks(voice.stream);
    var mic=overlay()&&overlay().querySelector("[data-et-mic]");
    if(mic){renderMicIdle(mic);mic.disabled=false}
    var send=overlay()&&overlay().querySelector("[data-et-send]");
    if(send&&voice.sendWasDisabled===false)send.disabled=false;
    setVoicePanel(false)
  }

  function stopVoice(cancelled,reason){
    if(!voice||voice.stopping)return;
    voice.stopping=true;
    voice.cancelled=Boolean(cancelled);
    voice.stopReason=reason||"";
    if(voice.raf)cancelAnimationFrame(voice.raf);
    try{
      if(voice.recorder&&voice.recorder.state==="recording")voice.recorder.stop();
      else{
        cleanupVoice();
        var why=voice.stopReason;
        voice=null;
        if(cancelled&&why==="no-speech")setLive("info","No he oído una pregunta. Toca el micrófono para intentarlo otra vez.");
        else setLive("","")
      }
    }catch(e){
      cleanupVoice();voice=null;setLive("info","No he podido escuchar bien. ¿Quieres intentarlo otra vez?")
    }
  }

  async function transcribeAndSend(blob,mime){
    if(!blob||blob.size<700){setLive("info","No he podido escucharte bien. ¿Quieres intentarlo otra vez?");return}
    setLive("processing","Entendiendo lo que has dicho…");
    try{
      var token=await authToken(),url=endpoint("/v1/transcribe");
      if(!token||!url)throw new Error("NO_AUTH");
      var fd=new FormData();
      fd.append("audio",blob,fileNameForMime(mime||blob.type));
      var r=await originalFetch(url,{method:"POST",headers:{Authorization:"Bearer "+token},body:fd});
      var d=await r.json().catch(function(){return{}});
      var text=clean(d.text);
      if(!r.ok||!text)throw new Error("TRANSCRIPTION_FAILED");
      var o=overlay(),input=o&&o.querySelector("[data-et-input]"),send=o&&o.querySelector("[data-et-send]");
      if(!input||!send)throw new Error("UI_MISSING");
      input.value=text;
      input.dispatchEvent(new Event("input",{bubbles:true}));
      voiceSendPending=true;
      setLive("processing","He entendido tu pregunta. Enviándola…");
      setTimeout(function(){
        if(!send.disabled)send.click();
        else{
          send.disabled=false;
          send.click()
        }
      },40)
    }catch(e){
      setLive("info","No he podido escucharte bien. ¿Quieres intentarlo otra vez?")
    }
  }

  function startVad(v){
    if(!v.audioContext||!v.analyser)return;
    var data=new Uint8Array(v.analyser.fftSize);
    function tick(){
      if(!voice||voice!==v||v.stopping)return;
      v.analyser.getByteTimeDomainData(data);
      var sum=0;
      for(var i=0;i<data.length;i++){var x=(data[i]-128)/128;sum+=x*x}
      var rms=Math.sqrt(sum/data.length),now=performance.now(),elapsed=now-v.startedAt;
      if(elapsed<450)v.noiseFloor=v.noiseFloor*0.8+rms*0.2;
      var threshold=Math.max(0.018,v.noiseFloor*2.7);
      if(rms>threshold){
        v.voiceFrames++;
        if(v.voiceFrames>=2){v.voiceDetected=true;v.lastVoiceAt=now}
      }else v.voiceFrames=0;
      if(v.voiceDetected&&now-v.lastVoiceAt>Number(v.silenceMs||1800)&&elapsed>1100){stopVoice(false,"silence");return}
      if(!v.voiceDetected&&elapsed>Number(v.noSpeechMs||10000)){stopVoice(true,"no-speech");return}
      v.raf=requestAnimationFrame(tick)
    }
    v.raf=requestAnimationFrame(tick)
  }

  async function startVoice(){
    ensureOverlay();
    if(voice&&voice.recorder&&voice.recorder.state==="recording"){stopVoice(false,"manual");return}
    if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia||typeof MediaRecorder==="undefined"){
      setLive("info","Este navegador no permite grabar audio aquí. Puedes escribir tu pregunta.");
      return
    }
    setLive("processing","Preparando el micrófono…");
    try{
      var prepared=await Promise.all([browserMicState(),micAllowed(),loadVoiceStudentProfile()]),browserState=prepared[0],allowed=prepared[1],studentVoiceProfile=prepared[2]||{};
      if(browserState==="denied"){setLive("info","El navegador tiene bloqueado el micrófono. Revísalo en los permisos de Safari o de la PWA.");return}
      if(!allowed){setLive("info","El micrófono está desactivado desde Zona Familiar.");return}
    }catch(e){
      setLive("info","Ahora no puedo comprobar el permiso del micrófono. Inténtalo de nuevo.");
      return
    }
    try{
      var stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
      rememberMicGrant();
      var mime=recorderMime(),rec=mime?new MediaRecorder(stream,{mimeType:mime}):new MediaRecorder(stream);
      var o=overlay(),mic=o&&o.querySelector("[data-et-mic]"),send=o&&o.querySelector("[data-et-send]");
      var vadCfg=vadConfigForStudent(typeof studentVoiceProfile!=="undefined"?studentVoiceProfile:{});
      var v={
        stream:stream,recorder:rec,chunks:[],mime:mime||rec.mimeType||"audio/webm",
        startedAt:performance.now(),lastVoiceAt:0,voiceDetected:false,voiceFrames:0,noiseFloor:.006,
        silenceMs:vadCfg.silenceMs,noSpeechMs:vadCfg.noSpeechMs,studentAge:vadCfg.age,studentBand:vadCfg.band,
        stopping:false,cancelled:false,raf:0,maxTimer:0,audioContext:null,analyser:null,
        sendWasDisabled:send?send.disabled:false
      };
      voice=v;
      if(mic){renderMicRecording(mic);mic.disabled=false}
      if(send)send.disabled=true;
      rec.ondataavailable=function(e){if(e.data&&e.data.size)v.chunks.push(e.data)};
      rec.onerror=function(){if(voice===v)stopVoice(true,"error")};
      rec.onstop=async function(){
        var cancelled=v.cancelled,reason=v.stopReason||"";
        var type=rec.mimeType||v.mime||(v.chunks[0]&&v.chunks[0].type)||"audio/webm";
        var blob=new Blob(v.chunks,{type:type});
        cleanupVoice();
        if(voice===v)voice=null;
        if(cancelled){
          if(reason==="no-speech")setLive("info","No he oído una pregunta. Toca el micrófono para intentarlo otra vez.");
          else if(reason==="error")setLive("info","No he podido escucharte bien. ¿Quieres intentarlo otra vez?");
          else setLive("","");
          return
        }
        await transcribeAndSend(blob,type)
      };
      try{
        var AC=root.AudioContext||root.webkitAudioContext;
        if(AC){
          v.audioContext=new AC();
          try{await v.audioContext.resume()}catch(e){}
          var source=v.audioContext.createMediaStreamSource(stream);
          v.analyser=v.audioContext.createAnalyser();
          v.analyser.fftSize=1024;
          v.analyser.smoothingTimeConstant=.28;
          source.connect(v.analyser)
        }
      }catch(e){v.audioContext=null;v.analyser=null}
      rec.start(250);
      setLive("","");
      setVoicePanel(true);
      if(v.analyser)startVad(v);
      v.maxTimer=setTimeout(function(){if(voice===v&&!v.stopping)stopVoice(false,"max-duration")},60000)
    }catch(e){
      stopTracks(voice&&voice.stream);voice=null;setVoicePanel(false);
      var msg=hasRememberedMicGrant()?"No pude reactivar el micrófono en esta sesión. Revisa el permiso del navegador o vuelve a intentarlo.":"Permite el acceso al micrófono para hablar con Eterna. Después quedará disponible para las siguientes preguntas en este dispositivo.";
      setLive("info",msg)
    }
  }

  function patchChatRequest(input,init){
    try{
      if(!init||typeof init.body!=="string"){voiceSendPending=false;return{input:input,init:init}}
      var b=JSON.parse(init.body);
      if(b&&typeof b==="object"){
        if(voiceSendPending)b.input_source="voice";
        if(lastPedagogicalState&&typeof lastPedagogicalState==="object")b.pedagogical_state=lastPedagogicalState;
        voiceSendPending=false;
        var next=Object.assign({},init,{body:JSON.stringify(b)});
        return{input:input,init:next}
      }
    }catch(e){}
    voiceSendPending=false;
    return{input:input,init:init}
  }

  function installFetchWrapper(){
    if(!originalFetch||root.fetch.__eternaExperience16049Wrapped)return;
    var wrapped=async function(input,init){
      var url=typeof input==="string"?input:(input&&input.url)||"",isChat=/\/v1\/chat(?:\?|$)/.test(url);
      if(isChat){
        var p=patchChatRequest(input,init);input=p.input;init=p.init;
        showThinking()
      }
      try{
        var response=await originalFetch(input,init);
        if(isChat){
          if(response.status!==401){
            if(!response.ok)setTimeout(function(){setLive("","")},0);
            response.clone().json().then(function(data){
              if(data&&data.pedagogical_state&&typeof data.pedagogical_state==="object")lastPedagogicalState=data.pedagogical_state;
              rememberSourceDisclosure(data);
              setTimeout(function(){ensureOverlay();queueNormalize()},0);
              setTimeout(function(){queueNormalize();restoreRememberedSources(chat())},90);
              setTimeout(function(){restoreRememberedSources(chat())},220)
            }).catch(function(){})
          }
        }
        return response
      }catch(e){
        if(isChat)setLive("","");
        throw e
      }
    };
    wrapped.__eternaExperience16049Wrapped=true;
    root.fetch=wrapped
  }

  function installInteractionHooks(){
    if(document.documentElement.dataset.eternaExperience16049==="1")return;
    document.documentElement.dataset.eternaExperience16049="1";
    document.addEventListener("click",function(event){
      try{
        var cancel=event.target&&event.target.closest?event.target.closest("[data-et-voice-cancel]"):null;
        if(cancel){event.preventDefault();event.stopImmediatePropagation();stopVoice(true,"cancel");return}
        var finish=event.target&&event.target.closest?event.target.closest("[data-et-voice-finish]"):null;
        if(finish){event.preventDefault();event.stopImmediatePropagation();stopVoice(false,"manual");return}
        var mic=event.target&&event.target.closest?event.target.closest("#eternaOverlayV159 [data-et-mic]"):null;
        if(mic){
          event.preventDefault();
          event.stopImmediatePropagation();
          startVoice();
          return
        }
        var opener=event.target&&event.target.closest?event.target.closest("#eternaLauncherV159,.eternaLauncherCardV159,[data-et-changemode],[data-et-mode],[data-et-modechoice]"):null;
        if(opener){setTimeout(ensureOverlay,0);setTimeout(ensureOverlay,80);setTimeout(enforceSingleLineComposer,180)}
      }catch(e){}
    },true);
    root.addEventListener("pageshow",function(){setTimeout(ensureOverlay,40)});
    root.addEventListener("resize",function(){setTimeout(enforceSingleLineComposer,40)},{passive:true})
  }

  injectStyles();
  installFetchWrapper();
  installInteractionHooks();
  setTimeout(ensureOverlay,0);
  root.ETERNA_EXPERIENCE_V16049={
    version:VERSION,
    normalize:normalizeConversation,
    getPedagogicalState:function(){return lastPedagogicalState},
    resetPedagogicalState:function(){
      lastPedagogicalState=null;
      voiceSendPending=false;
      audioSettingsCache={at:0,allowed:null};
      voiceStudentProfileCache={uid:"",age:null,stage:null,school_year:null,at:0};
      sourceMemory=[];
      try{if(voice)stopVoice(true,"session-change")}catch(e){}
      voice=null;
      setLive("","")
    }
  };
})(window);


/* ETERNA Experience v160.51 · límites + identidad visual del alumno
 * Extensión consolidada de Fase 2:
 * - Capitaliza el nombre del alumno solo en presentación.
 * - Convierte límite diario/semanal en mensaje claro + acceso directo a Zona Familiar.
 * - Adapta ETERNA_WEEKLY_LIMIT al frontend legado sin tocar eterna-v159.js.
 */
(function(root){
  "use strict";
  if(root.__ETERNA_LIMITS_IDENTITY_V16051__)return;
  root.__ETERNA_LIMITS_IDENTITY_V16051__=true;

  var previousFetch=typeof root.fetch==="function"?root.fetch.bind(root):null;
  var lastLimitType=null;

  function overlay(){return document.getElementById("eternaOverlayV159")}
  function clean(v){return String(v==null?"":v).replace(/\s+/g," ").trim()}

  function capitalizeName(value){
    var s=clean(value);
    if(!s)return s;
    return s.replace(/(^|[\s\-'])[a-záéíóúüñ]/gi,function(m){
      return m.toLocaleUpperCase("es-ES");
    });
  }

  function refreshVisibleName(){
    var nodes=[];
    var o=overlay();
    if(o)Array.prototype.push.apply(nodes,o.querySelectorAll("[data-et-name]"));
    Array.prototype.push.apply(nodes,document.querySelectorAll("#cocoApp .carnet .quien strong"));
    nodes.forEach(function(el){
      var before=clean(el.textContent),after=capitalizeName(before);
      if(after&&after!==before)el.textContent=after;
    });
  }

  function injectLimitStyles(){
    if(document.getElementById("eterna-limits-v16051-css"))return;
    var s=document.createElement("style");
    s.id="eterna-limits-v16051-css";
    s.textContent=[
      "#eternaOverlayV159 .eternaV160FamilyLimitLink{display:inline-flex!important;align-items:center!important;gap:4px!important;margin:9px 0 0!important;padding:8px 11px!important;border:1px solid #b9deed!important;border-radius:11px!important;background:#eef9fd!important;color:#145f82!important;font:900 10.5px inherit!important;text-decoration:none!important;cursor:pointer!important;touch-action:manipulation!important}",
      "#eternaOverlayV159 .eternaV160FamilyLimitLink:hover{background:#e3f5fc!important;color:#0f5677!important}",
      "#eternaOverlayV159 .eternaV160FamilyLimitLink:focus-visible{outline:3px solid rgba(42,167,216,.32)!important;outline-offset:3px!important}",
      "#eternaOverlayV159 .eternaV160LimitReset{display:block!important;margin-top:6px!important;color:#6b808c!important;font-size:9.5px!important;font-weight:750!important;line-height:1.35!important}"
    ].join("");
    document.head.appendChild(s)
  }

  function familyModal(){
    return document.querySelector("#cocoApp .cocoFamilyV129Backdrop,.cocoFamilyV129Backdrop")
  }

  function bestFamilyButton(){
    var list=Array.prototype.slice.call(document.querySelectorAll("#cocoApp .cocoFamiliaBtn,.cocoFamiliaBtn"));
    if(!list.length)return null;
    function isVisible(el){
      try{
        var s=getComputedStyle(el),r=el.getBoundingClientRect();
        return s.display!=="none"&&s.visibility!=="hidden"&&r.width>0&&r.height>0
      }catch(e){return true}
    }
    return list.find(function(b){return b.dataset&&b.dataset.cocoFamilyVersion==="129"&&isVisible(b)})||
           list.find(function(b){return b.dataset&&b.dataset.cocoFamilyVersion==="129"})||
           list.find(isVisible)||
           list[list.length-1]
  }

  function focusFamilyGate(){
    var modal=familyModal();
    if(!modal)return false;
    var input=modal.querySelector(".cocoFamilyPin input,input");
    if(input)setTimeout(function(){try{input.focus({preventScroll:true})}catch(e){try{input.focus()}catch(_e){}}},40);
    return true
  }

  function openFamilyZone(){
    var o=overlay();

    /* Cierra Eterna usando su propio botón y, como respaldo, libera el scroll.
       No toca ninguna lógica ni dato de Zona Familiar. */
    var close=o&&o.querySelector(".eternaV159Close");
    try{if(close)close.click()}catch(e){}
    try{
      if(o)o.classList.remove("is-open");
      document.body.style.overflow=""
    }catch(e){}

    var attempts=0;
    function tryOpen(){
      if(focusFamilyGate())return;
      var b=bestFamilyButton();
      if(b){
        try{b.click()}catch(e){
          try{b.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true,view:window}))}catch(_e){}
        }
      }
      if(focusFamilyGate())return;
      attempts++;
      if(attempts<7)setTimeout(tryOpen,attempts<3?80:160)
    }

    requestAnimationFrame(function(){
      requestAnimationFrame(tryOpen)
    })
  }

  function decorateLimit(type){
    var o=overlay();if(!o)return false;
    var rows=o.querySelectorAll(".eternaV159Msg.assistant");
    if(!rows.length)return false;
    var row=rows[rows.length-1],bubble=row.querySelector(".eternaV159Bubble");
    if(!bubble)return false;

    var text=clean(bubble.textContent);
    if(!/l[ií]mite|consultas de eterna por hoy|consultas de eterna/i.test(text))return false;

    if(bubble.querySelector("[data-et-family-limit]"))return true;

    var meta=bubble.querySelector(".eternaV159Meta");if(meta)meta.remove();
    bubble.textContent="";

    var main=document.createElement("span");
    if(type==="weekly"){
      main.textContent="Has alcanzado el límite semanal de consultas de Eterna. Pide a tus padres que lo gestionen desde Zona Familiar.";
    }else{
      main.textContent="Has alcanzado el límite familiar de consultas de Eterna por hoy. Pide a tus padres que lo gestionen desde Zona Familiar.";
    }
    bubble.appendChild(main);

    var reset=document.createElement("span");
    reset.className="eternaV160LimitReset";
    reset.textContent=type==="weekly"
      ?"El límite semanal se renueva automáticamente al comenzar la próxima semana."
      :"El límite diario se renueva automáticamente al comenzar el próximo día.";
    bubble.appendChild(reset);

    var link=document.createElement("button");
    link.type="button";
    link.className="eternaV160FamilyLimitLink";
    link.setAttribute("data-et-family-limit","");
    link.textContent="Abrir Zona Familiar →";
    link.onclick=function(event){
      if(event)event.preventDefault();
      openFamilyZone()
    };
    bubble.appendChild(link);

    var chat=o.querySelector("[data-et-chat]");
    if(chat){
      try{
        var cr=chat.getBoundingClientRect(),rr=row.getBoundingClientRect();
        chat.scrollTop=Math.max(0,chat.scrollTop+(rr.top-cr.top)-12)
      }catch(e){}
    }
    return true
  }

  function scheduleName(){
    [0,80,220,600,1400].forEach(function(ms){setTimeout(refreshVisibleName,ms)})
  }

  function scheduleLimit(type){
    [0,30,80,160,300,600,1000].forEach(function(ms){
      setTimeout(function(){decorateLimit(type)},ms)
    })
  }

  function installFetchWrapper(){
    if(!previousFetch||root.fetch.__eternaLimits16051Wrapped)return;
    var wrapped=async function(input,init){
      var url=typeof input==="string"?input:(input&&input.url)||"";
      var isChat=/\/v1\/chat(?:\?|$)/.test(url);
      var response=await previousFetch(input,init);
      if(!isChat)return response;

      try{
        var data=await response.clone().json();
        if(data&&data.error==="ETERNA_WEEKLY_LIMIT"){
          lastLimitType="weekly";
          scheduleLimit("weekly");

          /* eterna-v159.js solo conoce ETERNA_DAILY_LIMIT. Reescribimos únicamente
             el código de error de la copia que consume el frontend, conservando
             status/headers y todos los datos de cuota. */
          var rewritten=Object.assign({},data,{error:"ETERNA_DAILY_LIMIT",limit_type:"weekly"});
          return new Response(JSON.stringify(rewritten),{
            status:response.status,
            statusText:response.statusText,
            headers:new Headers(response.headers)
          });
        }
        if(data&&data.error==="ETERNA_DAILY_LIMIT"){
          lastLimitType="daily";
          scheduleLimit("daily");
        }
      }catch(e){}
      return response
    };
    wrapped.__eternaLimits16051Wrapped=true;
    root.fetch=wrapped
  }

  function installHooks(){
    if(document.documentElement.dataset.eternaLimits16051==="1")return;
    document.documentElement.dataset.eternaLimits16051="1";

    document.addEventListener("click",function(event){
      try{
        var limitLink=event.target&&event.target.closest?event.target.closest("[data-et-family-limit]"):null;
        if(limitLink){
          event.preventDefault();
          return
        }
        var opener=event.target&&event.target.closest
          ?event.target.closest("#eternaLauncherV159,.eternaLauncherCardV159,[data-et-mode],[data-et-modechoice],[data-et-changemode]")
          :null;
        if(opener)scheduleName()
      }catch(e){}
    },true);

    root.addEventListener("pageshow",scheduleName)
  }

  injectLimitStyles();
  installFetchWrapper();
  installHooks();
  scheduleName();

  root.ETERNA_LIMITS_IDENTITY_V16051={
    version:"160.51",
    refreshName:refreshVisibleName,
    decorateDaily:function(){return decorateLimit("daily")},
    decorateWeekly:function(){return decorateLimit("weekly")}
  };
})(window);


/* ETERNA UX FIX v160.52
 * Marcador de release: navegación familiar robusta + lectura anclada al inicio del turno.
 */
window.ETERNA_UX_FIX_V16055=Object.freeze({
  version:"160.55",
  family_limit_link:true,
  response_start_anchor:true,
  single_bottom_live_state:true,
  modern_mic_ui:true,
  remembered_mic_permission_hint:true,
  single_line_composer:true,
  capitalized_student_name:true,
  strict_user_session_isolation:true,
  extra_global_observer:false
});

window.ETERNA_RELEASE_V16056=Object.freeze({
  version:"160.56",
  age_adaptive_vad:true,
  mic_target_mobile_px:52,
  source_disclosure_when_provided:true,
  pedagogical_memory_notice:true,
  preserves_v16055_session_isolation:true,
  extra_global_observer:false
});


/* ETERNA SESSION FENCE v160.55
 * Privacidad entre cuentas:
 * - logout = limpia inmediatamente el estado visible y recarga;
 * - usuario A -> usuario B = limpia y recarga;
 * - refresh de token del mismo usuario = NO limpia la conversación.
 *
 * La recarga es deliberada: el historial visible de eterna-v159.js vive dentro
 * de un closure privado. Una recarga en una frontera real de autenticación es
 * la forma más segura de garantizar que no sobreviva ningún estado temporal.
 * No borra memoria pedagógica persistida ni datos de Supabase.
 */
(function(root){
  "use strict";
  if(root.__ETERNA_SESSION_FENCE_V16055__)return;
  root.__ETERNA_SESSION_FENCE_V16055__=true;

  var STORAGE_KEY="eterna_active_user_v16055";
  var currentUserId="";
  var reloadScheduled=false;
  var subscription=null;

  function overlay(){return document.getElementById("eternaOverlayV159")}

  function storedUser(){
    try{return String(sessionStorage.getItem(STORAGE_KEY)||"")}catch(e){return""}
  }

  function storeUser(uid){
    try{
      if(uid)sessionStorage.setItem(STORAGE_KEY,String(uid));
      else sessionStorage.removeItem(STORAGE_KEY)
    }catch(e){}
  }

  function stopTransientVoice(){
    try{
      var media=document.querySelector("#eternaOverlayV159 [data-et-mic].recording");
      if(media){
        media.classList.remove("recording");
        media.disabled=false
      }
    }catch(e){}
  }

  function scrubVisibleEterna(){
    var o=overlay();
    if(!o)return;

    try{
      var chat=o.querySelector("[data-et-chat]");
      if(chat)chat.innerHTML="";
    }catch(e){}

    try{
      var input=o.querySelector("[data-et-input]");
      if(input){
        input.value="";
        input.disabled=false
      }
    }catch(e){}

    try{
      var preview=o.querySelector("[data-et-preview]");
      if(preview){
        preview.classList.remove("show");
        var img=preview.querySelector("img");
        if(img)img.removeAttribute("src")
      }
    }catch(e){}

    try{
      var live=o.querySelector("[data-et-live-state]");
      if(live){
        live.className="eternaV160LiveState";
        live.innerHTML=""
      }
    }catch(e){}

    try{
      var name=o.querySelector("[data-et-name]");
      if(name)name.textContent="Alumno Coco"
    }catch(e){}

    stopTransientVoice();

    /* Cierra Eterna inmediatamente para que jamás quede a la vista el hilo
       del usuario anterior durante el cambio de cuenta. */
    try{o.classList.remove("is-open")}catch(e){}
    try{document.body.style.overflow=""}catch(e){}
  }

  function clearExperienceTransientState(){
    /* Objetos públicos de las capas nuevas: no contienen conversación cruda,
       pero reiniciamos lo que podamos antes de la recarga. */
    try{
      if(root.ETERNA_EXPERIENCE_V16049 &&
         typeof root.ETERNA_EXPERIENCE_V16049.resetPedagogicalState==="function"){
        root.ETERNA_EXPERIENCE_V16049.resetPedagogicalState()
      }
    }catch(e){}

    try{
      if(root.ETERNA_EXPERIENCE_V16054 &&
         typeof root.ETERNA_EXPERIENCE_V16054.resetTransient==="function"){
        root.ETERNA_EXPERIENCE_V16054.resetTransient()
      }
    }catch(e){}
  }

  function scheduleCleanReload(nextUid){
    if(reloadScheduled)return;
    reloadScheduled=true;

    scrubVisibleEterna();
    clearExperienceTransientState();
    storeUser(nextUid||"");

    /* Dos frames aseguran que la conversación anterior desaparezca visualmente
       antes de que el navegador ejecute la recarga. */
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        try{location.reload()}catch(e){location.href=location.href}
      })
    })
  }

  function handleAuth(event,session){
    var nextUid=session&&session.user&&session.user.id
      ?String(session.user.id)
      :"";

    /* Cierre de sesión real. TOKEN_REFRESHED con sesión válida no entra aquí. */
    if(!nextUid){
      if(currentUserId||storedUser()){
        currentUserId="";
        scheduleCleanReload("")
      }else{
        scrubVisibleEterna()
      }
      return
    }

    var previous=currentUserId||storedUser();

    /* Cambio directo de identidad sin un SIGNED_OUT intermedio. */
    if(previous&&previous!==nextUid){
      currentUserId=nextUid;
      scheduleCleanReload(nextUid);
      return
    }

    /* Primer login de esta página o refresh del mismo usuario. */
    currentUserId=nextUid;
    storeUser(nextUid)
  }

  async function install(){
    var cli=null;
    try{
      if(root.__COCO_SUPABASE_CLIENT)cli=root.__COCO_SUPABASE_CLIENT;
      else{
        var c=root.COCO_CONFIG||{};
        if(root.supabase&&root.supabase.createClient&&c.url&&c.clave){
          cli=root.__COCO_SUPABASE_CLIENT=root.supabase.createClient(
            c.url,
            c.clave,
            {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}}
          )
        }
      }
    }catch(e){}

    if(!cli||!cli.auth){
      setTimeout(install,120);
      return
    }

    try{
      var existing=await cli.auth.getSession();
      currentUserId=existing&&existing.data&&existing.data.session&&
                    existing.data.session.user&&existing.data.session.user.id
        ?String(existing.data.session.user.id)
        :"";

      var oldStored=storedUser();

      /* Si la página arrancó ya con una cuenta distinta de la que estaba
         activa en esta pestaña, limpiamos antes de continuar. */
      if(oldStored&&currentUserId&&oldStored!==currentUserId){
        scheduleCleanReload(currentUserId);
        return
      }

      storeUser(currentUserId)
    }catch(e){}

    try{
      var result=cli.auth.onAuthStateChange(function(event,session){
        handleAuth(event,session)
      });
      subscription=result&&result.data&&result.data.subscription||null
    }catch(e){}
  }

  install();

  root.ETERNA_SESSION_FENCE_V16055=Object.freeze({
    version:"160.55",
    strict_user_isolation:true,
    clears_on_signout:true,
    clears_on_user_change:true,
    preserves_same_user_token_refresh:true,
    persistent_learning_memory_untouched:true
  })
})(window);
