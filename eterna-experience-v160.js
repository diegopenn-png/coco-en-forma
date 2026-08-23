/* ETERNA Experience v160.49 · Fase 2 companion
 * Conversación uniforme + indicador visible "pensando" + voz de un toque con VAD.
 * Capa aditiva: NO modifica Worker, Stripe, Supabase, juegos, rankings ni contratos existentes.
 * El único MutationObserver se limita al chat de Eterna.
 */
(function(root){
  "use strict";
  if(root.__ETERNA_EXPERIENCE_V16049__)return;
  root.__ETERNA_EXPERIENCE_V16049__=true;

  var VERSION="160.49-phase2";
  var lastPedagogicalState=null;
  var voice=null;
  var voiceSendPending=false;
  var overlayObserver=null;
  var observedChat=null;
  var normalizeRaf=0;
  var thinkingAssistantCount=0;
  var audioSettingsCache={at:0,allowed:null};
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
      "@media(max-width:640px){#eternaOverlayV159 .eternaV160LiveState{margin-bottom:7px;padding:8px 10px}#eternaOverlayV159 .eternaV160VoicePanel{align-items:flex-start;flex-wrap:wrap}#eternaOverlayV159 .eternaV160VoiceCopy{min-width:160px}#eternaOverlayV159 .eternaV160VoiceActions{width:100%;justify-content:flex-end}}",
      "@media(prefers-reduced-motion:reduce){#eternaOverlayV159 .eternaV160ThinkingDots i,#eternaOverlayV159 .eternaV160VoiceWave i{animation:none!important}}"
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
    if(!text){live.className="eternaV160LiveState";live.innerHTML="";return}
    var dots=kind==="thinking"?'<span class="eternaV160ThinkingDots" aria-hidden="true"><i></i><i></i><i></i></span>':"";
    live.className="eternaV160LiveState is-visible "+(kind?"is-"+kind:"");
    live.innerHTML='<span class="eternaV160LiveIcon" aria-hidden="true">'+(kind==="thinking"?"✦":kind==="processing"?"🎙️":"i")+'</span><span>'+esc(text)+dots+'</span>'
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

  function normalizeConversation(){
    normalizeRaf=0;
    var o=overlay(),c=chat();if(!o||!c)return;
    ensureLiveState();
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

  function ensureOverlay(){
    var o=overlay();if(!o)return;
    injectStyles();
    ensureLiveState();
    ensureVoicePanel();
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
    if(mic){mic.classList.remove("recording");mic.textContent="🎙️";mic.disabled=false}
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
      if(v.voiceDetected&&now-v.lastVoiceAt>1700&&elapsed>1100){stopVoice(false,"silence");return}
      if(!v.voiceDetected&&elapsed>9000){stopVoice(true,"no-speech");return}
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
      var allowed=await micAllowed();
      if(!allowed){setLive("info","El micrófono está desactivado desde Zona Familiar.");return}
    }catch(e){
      setLive("info","Ahora no puedo comprobar el permiso del micrófono. Inténtalo de nuevo.");
      return
    }
    try{
      var stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
      var mime=recorderMime(),rec=mime?new MediaRecorder(stream,{mimeType:mime}):new MediaRecorder(stream);
      var o=overlay(),mic=o&&o.querySelector("[data-et-mic]"),send=o&&o.querySelector("[data-et-send]");
      var v={
        stream:stream,recorder:rec,chunks:[],mime:mime||rec.mimeType||"audio/webm",
        startedAt:performance.now(),lastVoiceAt:0,voiceDetected:false,voiceFrames:0,noiseFloor:.006,
        stopping:false,cancelled:false,raf:0,maxTimer:0,audioContext:null,analyser:null,
        sendWasDisabled:send?send.disabled:false
      };
      voice=v;
      if(mic){mic.classList.add("recording");mic.textContent="●";mic.disabled=false}
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
      setLive("info","No se pudo acceder al micrófono. Revisa el permiso del navegador.")
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
              setTimeout(function(){ensureOverlay();queueNormalize()},0);
              setTimeout(function(){queueNormalize()},90)
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
        var opener=event.target&&event.target.closest?event.target.closest("#eternaLauncherV159,.eternaLauncherCardV159,[data-et-changemode],[data-et-mode]"):null;
        if(opener){setTimeout(ensureOverlay,0);setTimeout(ensureOverlay,80)}
      }catch(e){}
    },true);
    root.addEventListener("pageshow",function(){setTimeout(ensureOverlay,40)})
  }

  injectStyles();
  installFetchWrapper();
  installInteractionHooks();
  setTimeout(ensureOverlay,0);
  root.ETERNA_EXPERIENCE_V16049={version:VERSION,normalize:normalizeConversation,getPedagogicalState:function(){return lastPedagogicalState}};
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
    var o=overlay();if(!o)return;
    o.querySelectorAll("[data-et-name]").forEach(function(el){
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
window.ETERNA_UX_FIX_V16052=Object.freeze({
  version:"160.52",
  family_limit_link:true,
  response_start_anchor:true,
  extra_global_observer:false
});
