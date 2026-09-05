/* ETERNA Experience v160.93.9 · expired direct plans
 * La edad adapta la pedagogía, nunca el acceso.
 * Conserva micrófono premium, legal shield, onboarding consolidado y un único MutationObserver limitado al chat de Eterna.
 * Corrige placeholders por modo y reduce trabajo de arranque fuera de Eterna.
 */
(function(root){
  "use strict";
  if(root.__ETERNA_EXPERIENCE_V16049__)return;
  root.__ETERNA_EXPERIENCE_V16049__=true;

  var VERSION="160.93.9-expired-direct-plans";
  var LOAD_INTENT=String(root.__COCO_ETERNA_LOAD_INTENT__||"idle");
  var PENDING_JOB_KEY="coco_eterna_pending_job_v16074";
  var BACKGROUND_JOB_TTL_MS=5*60*1000;
  var experienceActivated=false,resizeRaf=0,pendingJobResumePromise=null,activeBackgroundJobId="";
  var consumedResponseIds=new Set();
  var lastPedagogicalState=null;
  var voice=null;
  var voiceSendPending=false;
  var voiceStarting=false;
  var voiceTranscribing=false;
  var primedAudioContext=null;
  var primedAudioTimer=0;
  var overlayObserver=null;
  var observedChat=null;
  var normalizeRaf=0;
  var thinkingAssistantCount=0,thinkingStageTimers=[];
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
      "#eternaOverlayV159 .eternaV160VoicePanel.has-speech{border-color:#9fd8e9;background:linear-gradient(180deg,#effbff,#e9f8fd);box-shadow:0 0 0 3px rgba(47,169,220,.07)}",
      "#eternaOverlayV159 .eternaV160VoicePanel.manual-fallback{border-color:#ead6b7;background:linear-gradient(180deg,#fffaf3,#fff7ed)}",
      "#eternaOverlayV159 .eternaV160VoiceWave{display:flex;align-items:center;justify-content:center;gap:3px;width:58px;height:34px;flex:0 0 58px}",
      "#eternaOverlayV159 .eternaV160VoiceWave i{width:4px;border-radius:99px;background:#2fa9dc;animation:eternaWave16049 .9s infinite ease-in-out}",
      "#eternaOverlayV159 .eternaV160VoiceWave i:nth-child(1){height:10px}.eternaV160VoiceWave i:nth-child(2){height:22px;animation-delay:.08s}.eternaV160VoiceWave i:nth-child(3){height:30px;animation-delay:.16s}.eternaV160VoiceWave i:nth-child(4){height:18px;animation-delay:.24s}.eternaV160VoiceWave i:nth-child(5){height:12px;animation-delay:.32s}",
      "@keyframes eternaWave16049{0%,100%{transform:scaleY(.55);opacity:.55}50%{transform:scaleY(1);opacity:1}}",
      "#eternaOverlayV159 .eternaV160VoiceCopy{min-width:0;flex:1}#eternaOverlayV159 .eternaV160VoiceCopy b{display:block;color:#173f59;font-size:12px}#eternaOverlayV159 .eternaV160VoiceCopy span{display:block;margin-top:2px;color:#68808e;font-size:9.5px;font-weight:750}",
      "#eternaOverlayV159 .eternaV160VoiceActions{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}",
      "#eternaOverlayV159 .eternaV160VoiceActions button{min-height:34px;padding:6px 9px;border-radius:10px;font:900 9.5px inherit;cursor:pointer;touch-action:manipulation}",
      "#eternaOverlayV159 .eternaV160VoiceFinish{border:0;background:#173f59;color:#fff}#eternaOverlayV159 .eternaV160VoiceCancel{border:1px solid #d3e7ef;background:#fff;color:#526f7f}",
      "#eternaOverlayV159 .eternaV160RetryVerification{display:inline-flex;margin-top:10px;min-height:38px;padding:8px 12px;border:0;border-radius:11px;background:#173f59;color:#fff;font:900 10px inherit;cursor:pointer}",
      "#eternaOverlayV159 .eternaV159Quick{opacity:1;display:flex;gap:8px;flex-wrap:wrap}#eternaOverlayV159 .eternaV159Quick button{min-height:44px!important;padding:9px 12px!important}#eternaOverlayV159 .eternaV159Quick button.is-playing{background:#173f59!important;color:#fff!important;border-color:#173f59!important}",
      "#eternaOverlayV159 .eternaV159Copy{grid-column:2;justify-self:start;margin:3px 0 0!important;border:0;background:transparent;color:#587587;font:700 12px system-ui;cursor:pointer;padding:6px 7px;min-height:36px}",
      "#eternaOverlayV159 .eternaV160ModeActions{display:flex;gap:7px;align-items:center;justify-content:flex-end;flex-wrap:wrap}#eternaOverlayV159 .eternaV160NewActivity{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:8px 12px;border:1px solid #b9dfea;border-radius:12px;background:#fff;color:#315d73;font:900 10px inherit;cursor:pointer}",
      "#eternaOverlayV159 .eternaV160Completion{display:grid;grid-template-columns:48px minmax(0,1fr);gap:12px;margin:16px auto 26px;max-width:720px;padding:18px;border:1px solid #a9e3c7;border-radius:20px;background:linear-gradient(180deg,#f3fff8,#eafaf2);color:#315d73;box-shadow:0 8px 24px rgba(35,128,86,.08)}#eternaOverlayV159 .eternaV160CompletionIcon{display:grid;place-items:center;width:48px;height:48px;border-radius:50%;background:#29aa72;color:#fff;font:900 24px system-ui}#eternaOverlayV159 .eternaV160Completion small{color:#168555;font:900 9px inherit;letter-spacing:.08em}#eternaOverlayV159 .eternaV160Completion h3{margin:3px 0 5px;color:#173f59;font-size:18px;line-height:1.2}#eternaOverlayV159 .eternaV160Completion p{margin:0 0 11px;font-size:11px;line-height:1.45}#eternaOverlayV159 .eternaV160Completion div>div{display:flex;gap:7px;flex-wrap:wrap}#eternaOverlayV159 .eternaV160Completion button{min-height:44px;padding:9px 12px;border:1px solid #b9ddcb;border-radius:12px;background:#fff;color:#315d73;font:900 10px inherit;cursor:pointer}#eternaOverlayV159 .eternaV160Completion button:first-child{border-color:#173f59;background:#173f59;color:#fff}#eternaOverlayV159 [data-et-composer].is-complete{display:none!important}",
      "#eternaOverlayV159[data-et-age-band=teen] .eternaV159TopCopy p{font-family:system-ui,sans-serif;font-weight:650}#eternaOverlayV159[data-et-age-band=teen] .eternaV160StartIcon,#eternaOverlayV159[data-et-age-band=teen] .eternaV160ModeIcon{filter:grayscale(.55);transform:scale(.9)}#eternaOverlayV159[data-et-age-band=teen] .eternaV160Start h3{font-family:system-ui,sans-serif;font-weight:850;letter-spacing:-.02em}#eternaOverlayV159[data-et-age-band=teen] .eternaV159Bubble{font-family:system-ui,sans-serif;font-weight:650}",
      "#eternaOverlayV159 [data-et-name],#cocoApp .carnet .quien strong{text-transform:capitalize!important}",
      "#eternaOverlayV159 textarea[data-et-input]{white-space:nowrap!important;overflow-x:auto!important;overflow-y:hidden!important;resize:none!important}",
      "#eternaOverlayV159 textarea[data-et-input]::placeholder{white-space:nowrap!important}",
      "#eternaOverlayV159 [data-et-mic]{position:relative;overflow:visible;display:grid!important;place-items:center!important;min-width:48px!important;width:48px!important;height:48px!important;flex:0 0 48px!important;padding:0!important;border:1px solid #d5e7ef!important;border-radius:16px!important;background:linear-gradient(180deg,#ffffff,#f5fafc)!important;color:#315d73!important;box-shadow:0 2px 0 rgba(169,207,222,.40)!important;transition:transform .18s ease,box-shadow .18s ease,background .18s ease,border-color .18s ease,color .18s ease}",
      "#eternaOverlayV159 [data-et-mic]:hover{transform:translateY(-1px);background:#eef8fc!important;border-color:#b9dce9!important;color:#1f6787!important;box-shadow:0 3px 0 rgba(169,207,222,.42)!important}#eternaOverlayV159 [data-et-mic]:focus-visible{outline:3px solid rgba(42,167,216,.24)!important;outline-offset:3px!important}",
      "#eternaOverlayV159 [data-et-mic]:disabled{opacity:.55!important;cursor:not-allowed!important;transform:none!important}",
      "#eternaOverlayV159 .eternaV160MicSvg{display:block;width:22px;height:22px;fill:none!important;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;overflow:visible}#eternaOverlayV159 .eternaV160MicSvg *{fill:none!important;stroke:currentColor!important;vector-effect:non-scaling-stroke}",
      "#eternaOverlayV159 [data-et-mic].recording{background:linear-gradient(180deg,#fff9f4,#fff0e3)!important;border-color:#efb07d!important;color:#e86f18!important;box-shadow:0 0 0 5px rgba(239,108,5,.10),0 2px 0 rgba(224,132,64,.16)!important}",
      "#eternaOverlayV159 [data-et-mic].recording::after{content:\"\";position:absolute;inset:-4px;border-radius:19px;border:1.8px solid rgba(232,111,24,.30);animation:eternaMicPulse16057 1.3s infinite ease-out;pointer-events:none}",
      "@keyframes eternaMicPulse16057{0%{transform:scale(.94);opacity:.65}72%{transform:scale(1.10);opacity:.04}100%{transform:scale(1.13);opacity:0}}",
      "#eternaOverlayV159 .eternaV160MemoryNote{margin:10px 0 0;padding:9px 11px;border:1px solid #dcebf2;border-radius:12px;background:#f8fcfe;color:#657d8a;font-size:9.5px;font-weight:700;line-height:1.45;text-align:left}#eternaOverlayV159 .eternaV160MemoryNote summary{cursor:pointer;color:#315d73;font-weight:900;min-height:24px;display:flex;align-items:center}#eternaOverlayV159 .eternaV160MemoryNote p{margin:6px 0 0}",
      "#eternaOverlayV159 .eternaV160NeedCourse{margin:8px 0 12px;padding:16px;border:1px solid #cfe4ed;border-radius:16px;background:#f7fbfd;color:#315d73;text-align:center}",
      "#eternaOverlayV159 .eternaV160NeedCourse h3{margin:0 0 6px;color:#173f59;font-size:18px}.eternaV160NeedCourse p{margin:0 auto 12px;max-width:560px;font-size:11px;font-weight:750;line-height:1.5}",
      "#eternaOverlayV159 .eternaV160NeedCourse button{min-height:42px;padding:9px 14px;border:0;border-radius:11px;background:#173f59;color:#fff;font:900 10.5px inherit;cursor:pointer}",
      "#eternaOverlayV159 .eternaV160MemoryNote b{color:#315d73;font-size:9.5px}#eternaOverlayV159 .eternaV160MemoryNote span{color:#657d8a}",
      "#eternaOverlayV159 .eternaV160Sources{margin-top:11px;padding-top:9px;border-top:1px solid rgba(23,63,89,.10)}",
      "#eternaOverlayV159 .eternaV160SourcesBtn{display:inline-flex;align-items:center;gap:5px;min-height:31px;padding:5px 9px;border:1px solid #cfe3ec;border-radius:9px;background:#f7fbfd;color:#315d73;font:850 9.5px inherit;cursor:pointer;touch-action:manipulation}",
      "#eternaOverlayV159 .eternaV160SourcesPanel{display:grid;gap:6px;margin-top:7px;padding:8px 9px;border:1px solid #dcebf2;border-radius:10px;background:#fff}",
      "#eternaOverlayV159 .eternaV160SourcesPanel[hidden]{display:none!important}#eternaOverlayV159 .eternaV160SourcesPanel a{color:#146da0;text-decoration:underline;text-underline-offset:2px;font-size:9.5px;font-weight:750;line-height:1.35;overflow-wrap:anywhere}",
      "#cocoApp .eternaV159FamilyCard .eternaV160ProgressPanel.eternaV160StrengthMap{position:relative;overflow:hidden;margin-top:16px!important;padding:18px!important;border:1px solid #d8e9f1!important;border-radius:22px!important;background:linear-gradient(145deg,#fbfdff 0%,#f4fbfe 52%,#fffaf5 100%)!important;box-shadow:0 10px 26px rgba(23,63,89,.08)!important}",
      "#cocoApp .eternaV160StrengthMap:before{content:\"\";position:absolute;right:-70px;top:-80px;width:190px;height:190px;border-radius:50%;background:radial-gradient(circle,rgba(78,187,225,.14),rgba(78,187,225,0) 70%);pointer-events:none}",
      "#cocoApp .eternaV160StrengthMap .eternaV160ProgressHead{position:relative;z-index:1;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;margin:0 0 12px!important}",
      "#cocoApp .eternaV160StrengthMap .eternaV160ProgressHead>b{font-family:var(--display,inherit)!important;font-size:20px!important;line-height:1.08!important;color:#173f59!important}",
      "#cocoApp .eternaV160StrengthMap .eternaV160ProgressHead button{min-height:36px!important;padding:7px 11px!important;border:1px solid #cfe3ec!important;border-radius:11px!important;background:#fff!important;color:#2b6784!important;font-weight:850!important;box-shadow:0 2px 0 rgba(190,217,229,.45)!important}",
      "#cocoApp .eternaV160StrengthHero{position:relative;z-index:1;display:grid;grid-template-columns:auto minmax(0,1fr) minmax(170px,.62fr);align-items:center;gap:13px;margin:0 0 13px;padding:14px;border:1px solid #dcebf2;border-radius:18px;background:rgba(255,255,255,.88);box-shadow:inset 0 1px 0 rgba(255,255,255,.95)}",
      "#cocoApp .eternaV160StrengthOrb{display:grid;place-items:center;width:52px;height:52px;border-radius:17px;background:linear-gradient(145deg,#e8f8fe,#fff2e7);border:1px solid #cde8f2;color:#277fa5;box-shadow:0 4px 12px rgba(37,117,150,.10)}#cocoApp .eternaV160StrengthOrb svg{width:27px;height:27px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}",
      "#cocoApp .eternaV160StrengthHeroCopy{min-width:0}#cocoApp .eternaV160StrengthHeroCopy>span{display:block;color:#498096;font-size:9px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}#cocoApp .eternaV160StrengthHeroCopy>strong{display:block;margin-top:3px;color:#173f59;font-size:16px;line-height:1.18}#cocoApp .eternaV160StrengthHeroCopy>small{display:block;margin-top:4px;color:#637d8b;font-size:10px;font-weight:700;line-height:1.4}",
      "#cocoApp .eternaV160NextStep{align-self:stretch;display:flex;flex-direction:column;justify-content:center;min-width:0;padding:10px 11px;border:1px solid #f0d8b8;border-radius:14px;background:#fff8ef}#cocoApp .eternaV160NextStep>span{color:#a86b2c;font-size:8.5px;font-weight:900;letter-spacing:.07em;text-transform:uppercase}#cocoApp .eternaV160NextStep>b{margin-top:3px;color:#70451e;font-size:11px;line-height:1.22;overflow-wrap:anywhere}#cocoApp .eternaV160NextStep>small{margin-top:3px;color:#98734f;font-size:8.5px;font-weight:700}",
      "#cocoApp .eternaV160StrengthMap .eternaV160ProgressIntro{position:relative;z-index:1;margin:0 0 12px!important;padding:9px 11px!important;border-left:3px solid #9fcfe1;border-radius:0 10px 10px 0;background:rgba(241,249,252,.76);color:#637d8b!important;font-size:10px!important;line-height:1.45!important}",
      "#cocoApp .eternaV160StrengthMap .eternaV160ProgressGrid{position:relative;z-index:1;display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:11px!important}",
      "#cocoApp .eternaV160StrengthMap .eternaV160ProgressBox{position:relative;min-width:0;min-height:122px;padding:14px 14px 13px 14px!important;border:1px solid #dfeaf0!important;border-radius:17px!important;background:#fff!important;box-shadow:0 4px 12px rgba(23,63,89,.055)!important}",
      "#cocoApp .eternaV160StrengthMap .eternaV160ProgressBox.eternaV160MapStrength{background:linear-gradient(145deg,#f5fcf7,#fff)!important;border-color:#cce8d5!important}#cocoApp .eternaV160StrengthMap .eternaV160ProgressBox.eternaV160MapReinforce{background:linear-gradient(145deg,#fff9f0,#fff)!important;border-color:#f0d9b9!important}#cocoApp .eternaV160StrengthMap .eternaV160ProgressBox.eternaV160MapStrategy{background:linear-gradient(145deg,#f5f9ff,#fff)!important;border-color:#d6e1f3!important}#cocoApp .eternaV160StrengthMap .eternaV160ProgressBox.eternaV160MapActivity{background:linear-gradient(145deg,#f9f7ff,#fff)!important;border-color:#e0daf1!important}",
      "#cocoApp .eternaV160StrengthBoxHead{display:flex;align-items:center;gap:8px;margin-bottom:9px}#cocoApp .eternaV160StrengthBoxIcon{display:grid;place-items:center;width:30px;height:30px;flex:0 0 30px;border-radius:10px;background:#edf7fb;color:#287d9f}#cocoApp .eternaV160StrengthBoxIcon svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}#cocoApp .eternaV160MapReinforce .eternaV160StrengthBoxIcon{background:#fff1df;color:#b56b20}#cocoApp .eternaV160MapStrategy .eternaV160StrengthBoxIcon{background:#eef3ff;color:#506da9}#cocoApp .eternaV160MapActivity .eternaV160StrengthBoxIcon{background:#f1edfb;color:#735b9b}",
      "#cocoApp .eternaV160StrengthMap .eternaV160ProgressBox b{color:#173f59!important;font-size:12px!important;line-height:1.18!important}#cocoApp .eternaV160StrengthMap .eternaV160ProgressBox>span{display:block;color:#536f7e!important;font-size:10px!important;font-weight:700!important;line-height:1.45!important}",
      "#cocoApp .eternaV160MasteryList{display:grid!important;gap:8px!important}#cocoApp .eternaV160MasteryItem{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px 8px;align-items:center}#cocoApp .eternaV160MasteryItem>span{min-width:0;color:#315565;font-size:9.5px;font-weight:800;overflow-wrap:anywhere}#cocoApp .eternaV160MasteryItem>small{color:#467d62;font-size:9px;font-weight:900}",
      "#cocoApp .eternaV160MasteryTrack{grid-column:1/-1;height:7px;border-radius:999px;background:#e7f1eb;overflow:hidden}#cocoApp .eternaV160MasteryFill{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#65b98a,#8fd2aa);transition:width .35s ease}",
      "#cocoApp .eternaV160ChipList{display:flex!important;flex-wrap:wrap;gap:6px!important}#cocoApp .eternaV160StrengthChip{display:inline-flex!important;max-width:100%;align-items:center;padding:5px 8px;border:1px solid rgba(89,126,145,.14);border-radius:999px;background:rgba(255,255,255,.78);color:#486978!important;font-size:9px!important;font-weight:800!important;line-height:1.22!important;overflow-wrap:anywhere}",
      "#cocoApp .eternaV160StrengthMap.eternaV160StrengthEmpty .eternaV160ProgressIntro{margin-bottom:0!important}#cocoApp .eternaV160StrengthMap.eternaV160StrengthEmpty .eternaV160StrengthHero{grid-template-columns:auto minmax(0,1fr)}",
      "@media(max-width:700px){#cocoApp .eternaV160StrengthMap .eternaV160ProgressHead{align-items:flex-start!important;flex-direction:column!important}#cocoApp .eternaV160StrengthMap .eternaV160ProgressHead button{width:100%!important}#cocoApp .eternaV160StrengthHero{grid-template-columns:auto minmax(0,1fr);align-items:start}#cocoApp .eternaV160NextStep{grid-column:1/-1}#cocoApp .eternaV160StrengthMap .eternaV160ProgressGrid{grid-template-columns:1fr!important}#cocoApp .eternaV159FamilyCard .eternaV160ProgressPanel.eternaV160StrengthMap{padding:14px!important;border-radius:19px!important}}",
      "@media(max-width:760px){#eternaOverlayV159 [data-et-mic]{min-width:52px!important;width:52px!important;height:52px!important;flex-basis:52px!important;border-radius:17px!important}#eternaOverlayV159 .eternaV160MicSvg{width:24px!important;height:24px!important}#eternaOverlayV159 .eternaV159Top{padding-top:max(10px,env(safe-area-inset-top))!important;padding-bottom:10px!important}#eternaOverlayV159 .eternaV159TopCopy p{display:none!important}#eternaOverlayV159 .eternaV160ModeBar{display:grid!important;grid-template-columns:auto minmax(0,1fr)!important;gap:8px!important}#eternaOverlayV159 .eternaV160ModeActions{grid-column:1/-1;width:100%;display:grid;grid-template-columns:1fr 1fr}#eternaOverlayV159 .eternaV160ModeActions button{width:100%;min-height:44px!important}#eternaOverlayV159 .eternaV160Completion{grid-template-columns:40px minmax(0,1fr);margin:10px 0 18px;padding:14px}#eternaOverlayV159 .eternaV160CompletionIcon{width:40px;height:40px}#eternaOverlayV159 .eternaV160Completion div>div{display:grid;grid-template-columns:1fr}#eternaOverlayV159 .eternaV160Completion button{width:100%}}",
      "@media(max-width:640px){#eternaOverlayV159 .eternaV160LiveState{margin-bottom:7px;padding:8px 10px}#eternaOverlayV159 .eternaV160VoicePanel{align-items:flex-start;flex-wrap:wrap}#eternaOverlayV159 .eternaV160VoiceCopy{min-width:160px}#eternaOverlayV159 .eternaV160VoiceActions{width:100%;justify-content:flex-end}}",
      "@media(max-width:760px){#eternaOverlayV159 .eternaV159Main{min-height:0!important;overflow:hidden!important}#eternaOverlayV159 .eternaV159Chat{scroll-padding-top:12px!important;scroll-padding-bottom:calc(118px + env(safe-area-inset-bottom))!important;padding-bottom:calc(22px + env(safe-area-inset-bottom))!important}#eternaOverlayV159 .eternaV159Msg{scroll-margin-top:12px!important;scroll-margin-bottom:18px!important}#eternaOverlayV159 .eternaV160ModeBar{position:relative!important;z-index:2!important;flex:0 0 auto!important}#eternaOverlayV159 .eternaV159Composer{position:relative!important;z-index:3!important;padding-bottom:max(10px,env(safe-area-inset-bottom))!important}#eternaOverlayV159 .eternaV159InputRow{align-items:center!important}}",
      "@media(prefers-reduced-motion:reduce){#eternaOverlayV159 .eternaV160ThinkingDots i,#eternaOverlayV159 .eternaV160VoiceWave i,#eternaOverlayV159 [data-et-mic].recording::after,#cocoApp .eternaV160StrengthMap .eternaV160MasteryFill{animation:none!important;transition:none!important}}"
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

  function clearThinkingStages(){thinkingStageTimers.forEach(function(timer){clearTimeout(timer)});thinkingStageTimers=[]}

  function normalizeHeaderStatus(){
    var o=overlay();if(!o)return;
    var status=o.querySelector("[data-et-status]"),dot=o.querySelector("[data-et-dot]");
    if(!status)return;
    var text=norm(status.textContent);
    if(text==="no se pudo verificar"||text==="quiero comprobarlo mejor antes de responderte"||text==="eterna esta revisando la respuesta"){
      status.textContent="Eterna está revisando la respuesta";
      if(dot)dot.className="eternaV159Dot warn";
      return
    }
    if(text==="respuesta verificada"||
       text==="eterna lista"||
       text==="eterna lista · apoyo escolar verificado"||
       text==="beta de prueba · eterna lista"){
      status.textContent="Eterna lista";
      if(dot)dot.className="eternaV159Dot ok"
    }
  }

  function scheduleHeaderStatus(){
    if(typeof queueMicrotask==="function")queueMicrotask(normalizeHeaderStatus);
    else requestAnimationFrame(normalizeHeaderStatus)
  }

  function micIconMarkup(){
    return '<svg class="eternaV160MicSvg" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">'+
      '<path d="M12 14.75a3.75 3.75 0 0 0 3.75-3.75V7a3.75 3.75 0 1 0-7.5 0v4A3.75 3.75 0 0 0 12 14.75Z"/>'+
      '<path d="M6.5 11a5.5 5.5 0 0 0 11 0"/>'+
      '<path d="M12 16.5V20"/>'+
      '<path d="M9.5 20h5"/>'+
    '</svg>'
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

  function closeAudioContext(ctx){
    try{if(ctx&&ctx.state!=="closed")ctx.close()}catch(e){}
  }

  function clearPrimedAudioTimer(){
    if(primedAudioTimer){clearTimeout(primedAudioTimer);primedAudioTimer=0}
  }

  function primeAudioContext(){
    var AC=root.AudioContext||root.webkitAudioContext;
    if(!AC)return null;
    try{
      if(primedAudioContext&&primedAudioContext.state!=="closed"){
        try{if(primedAudioContext.state==="suspended")primedAudioContext.resume()}catch(e){}
        return primedAudioContext
      }
      var ctx=null;
      try{ctx=new AC({latencyHint:"interactive"})}catch(e){ctx=new AC()}
      primedAudioContext=ctx;
      try{ctx.resume()}catch(e){}
      clearPrimedAudioTimer();
      primedAudioTimer=setTimeout(function(){
        if(primedAudioContext===ctx){
          primedAudioContext=null;
          closeAudioContext(ctx)
        }
      },15000);
      return ctx
    }catch(e){return null}
  }

  function claimPrimedAudioContext(){
    var ctx=primedAudioContext;
    primedAudioContext=null;
    clearPrimedAudioTimer();
    return ctx&&ctx.state!=="closed"?ctx:null
  }

  function setMicDisabled(disabled){
    var o=overlay(),mic=o&&o.querySelector("[data-et-mic]");
    if(mic)mic.disabled=Boolean(disabled)
  }

  function releaseVoiceStartLock(){
    voiceStarting=false;
    if(!voice&&!voiceTranscribing)setMicDisabled(false)
  }

  function chatRequestIsPending(){
    var core=root.CocoEternaV160;
    var foreground=Boolean(core&&typeof core.isRequestPending==="function"&&core.isRequestPending());
    return foreground||Boolean(activeBackgroundJobId||pendingJobResumePromise||pendingJobRead())
  }

  function updateVoicePanelCopy(title,detail,stateClass){
    var p=ensureVoicePanel();if(!p)return;
    p.classList.remove("has-speech","manual-fallback");
    if(stateClass)p.classList.add(stateClass);
    var b=p.querySelector(".eternaV160VoiceCopy b"),span=p.querySelector(".eternaV160VoiceCopy span");
    if(b&&title)b.textContent=title;
    if(span&&detail)span.textContent=detail
  }

  function ensureVoicePanel(){
    var c=composer();if(!c)return null;
    var p=c.querySelector("[data-et-voice-panel]");
    if(!p){
      p=document.createElement("div");
      p.className="eternaV160VoicePanel";
      p.setAttribute("data-et-voice-panel","");
      p.innerHTML='<div class="eternaV160VoiceWave" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>'+
        '<div class="eternaV160VoiceCopy"><b>Escuchando…</b><span>Habla con normalidad. Puedes hacer pausas breves; Eterna enviará la pregunta cuando termines.</span></div>'+
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
    var note=document.createElement('details');
    note.className='eternaV160MemoryNote';
    note.setAttribute('data-et-memory-note','');
    note.innerHTML='<summary>Privacidad y memoria</summary><p>Eterna no guarda tus conversaciones como un historial. Recuerda únicamente señales pedagógicas —conceptos, nivel aproximado, errores, ayuda y estrategias que funcionan— para ayudarte a aprender mejor. No diagnostica ni etiqueta.</p>';
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

  function strengthMapIcon(kind){
    var icons={
      hero:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5 14.2 8l4.8.7-3.5 3.4.8 4.8-4.3-2.3-4.3 2.3.8-4.8L5 8.7 9.8 8 12 3.5Z"/></svg>',
      strength:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7.5 12.5 3 3 6-7"/><path d="M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Z"/></svg>',
      reinforce:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v3M12 17v3M4 12h3M17 12h3"/><circle cx="12" cy="12" r="4.2"/></svg>',
      strategy:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 15.5c-1.1-.9-1.8-2.2-1.8-3.7a5.3 5.3 0 0 1 10.6 0c0 1.5-.6 2.8-1.8 3.7-.8.7-1.2 1.4-1.2 2.2h-4.6c0-.8-.4-1.5-1.2-2.2Z"/><path d="M9.8 20h4.4"/></svg>',
      activity:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 18V9M10 18V5M15 18v-6M20 18V8"/></svg>'
    };
    return icons[kind]||icons.hero
  }

  function splitStrengthText(value){
    return clean(value).split(/\s+·\s+/).map(function(x){return clean(x)}).filter(Boolean)
  }

  function masteryItems(value){
    var out=[];
    splitStrengthText(value).forEach(function(part){
      var m=part.match(/^(.*?)\s*\((\d{1,3})%\)\s*$/);
      if(!m)return;
      out.push({label:clean(m[1]),percent:Math.max(0,Math.min(100,Number(m[2])||0))})
    });
    return out
  }

  function simpleItems(value){
    var items=splitStrengthText(value);
    if(items.length===1&&/^todav[ií]a|^eterna seguir[aá]|^actividad escolar/i.test(items[0]))return[];
    return items
  }

  function decorateStrengthBox(box,kind,title){
    if(!box)return;
    box.classList.add("eternaV160Map"+kind.charAt(0).toUpperCase()+kind.slice(1));
    var heading=box.querySelector("b");
    if(!heading)return;
    heading.textContent=title;
    if(heading.parentElement&&heading.parentElement.classList.contains("eternaV160StrengthBoxHead"))return;
    var head=document.createElement("div");
    head.className="eternaV160StrengthBoxHead";
    var icon=document.createElement("span");
    icon.className="eternaV160StrengthBoxIcon";
    icon.setAttribute("aria-hidden","true");
    icon.innerHTML=strengthMapIcon(kind);
    heading.parentNode.insertBefore(head,heading);
    head.appendChild(icon);
    head.appendChild(heading)
  }

  function renderMasteryMap(span,items){
    if(!span||!items.length)return;
    span.textContent="";
    span.classList.add("eternaV160MasteryList");
    items.forEach(function(item){
      var row=document.createElement("span");
      row.className="eternaV160MasteryItem";
      var label=document.createElement("span");label.textContent=item.label;
      var value=document.createElement("small");value.textContent=item.percent+"%";
      var track=document.createElement("span");track.className="eternaV160MasteryTrack";
      var fill=document.createElement("i");fill.className="eternaV160MasteryFill";fill.style.width=item.percent+"%";
      track.appendChild(fill);row.appendChild(label);row.appendChild(value);row.appendChild(track);span.appendChild(row)
    })
  }

  function renderChipMap(span,items){
    if(!span||!items.length)return;
    span.textContent="";
    span.classList.add("eternaV160ChipList");
    items.forEach(function(item){
      var chip=document.createElement("span");
      chip.className="eternaV160StrengthChip";
      chip.textContent=item;
      span.appendChild(chip)
    })
  }

  function enhanceLearningProgressMap(){
    var panel=document.querySelector("#cocoApp .eternaV159FamilyCard .eternaV160ProgressPanel");
    if(!panel)return false;
    if(panel.dataset.etStrengthMap==="16057")return true;
    panel.dataset.etStrengthMap="16057";
    panel.classList.add("eternaV160StrengthMap");

    var head=panel.querySelector(".eternaV160ProgressHead");
    if(head){
      var title=head.querySelector("b");
      if(title)title.textContent="Mapa de fortalezas del aprendizaje"
    }

    var grid=panel.querySelector(".eternaV160ProgressGrid");
    var boxes=grid?Array.prototype.slice.call(grid.querySelectorAll(".eternaV160ProgressBox")):[];
    if(!boxes.length)panel.classList.add("eternaV160StrengthEmpty");

    var strongestText=boxes[0]&&boxes[0].querySelector("span")?clean(boxes[0].querySelector("span").textContent):"";
    var reinforceText=boxes[1]&&boxes[1].querySelector("span")?clean(boxes[1].querySelector("span").textContent):"";
    var strategyText=boxes[2]&&boxes[2].querySelector("span")?clean(boxes[2].querySelector("span").textContent):"";
    var strong=masteryItems(strongestText),reinforce=simpleItems(reinforceText),strategies=simpleItems(strategyText);

    if(boxes[0]){
      decorateStrengthBox(boxes[0],"strength","Tus fortalezas");
      renderMasteryMap(boxes[0].querySelector(":scope > span"),strong)
    }
    if(boxes[1]){
      decorateStrengthBox(boxes[1],"reinforce","Vamos a reforzar");
      renderChipMap(boxes[1].querySelector(":scope > span"),reinforce)
    }
    if(boxes[2]){
      decorateStrengthBox(boxes[2],"strategy","Así aprendes mejor");
      renderChipMap(boxes[2].querySelector(":scope > span"),strategies)
    }
    if(boxes[3])decorateStrengthBox(boxes[3],"activity","Tu recorrido");

    var hero=document.createElement("div");
    hero.className="eternaV160StrengthHero";
    var strongLead=strong[0]||null,reinforceLead=reinforce[0]||"";
    hero.innerHTML=
      '<div class="eternaV160StrengthOrb" aria-hidden="true">'+strengthMapIcon("hero")+'</div>'+
      '<div class="eternaV160StrengthHeroCopy">'+
        '<span>PROGRESO ESCOLAR · ETERNA</span>'+
        '<strong>'+(strongLead?'Fortaleza destacada: '+esc(strongLead.label):'Tu mapa de aprendizaje')+'</strong>'+
        '<small>'+(strongLead?'Dominio aproximado observado: '+strongLead.percent+'%. Este mapa cambia a medida que sigues aprendiendo.':'Eterna irá completando este mapa a medida que realices actividades escolares.')+'</small>'+
      '</div>'+
      (reinforceLead?'<div class="eternaV160NextStep"><span>PRÓXIMO PASO</span><b>'+esc(reinforceLead)+'</b><small>Área sugerida para reforzar</small></div>':"");

    var intro=panel.querySelector(".eternaV160ProgressIntro");
    if(intro)panel.insertBefore(hero,intro);
    else if(grid)panel.insertBefore(hero,grid);
    else panel.appendChild(hero);
    return true
  }

  function scheduleLearningProgressMap(){
    return enhanceLearningProgressMap()
  }


  function courseIsConfigured(){
    var o=overlay(),label=o&&o.querySelector("[data-et-course]");
    var text=norm(label&&label.textContent);
    return !!text&&text.indexOf("configura tu curso")<0
  }

  function setStatusDom(text,kind){
    var o=overlay(),s=o&&o.querySelector("[data-et-status]"),d=o&&o.querySelector("[data-et-dot]");
    if(s)s.textContent=text;
    if(d)d.className="eternaV159Dot"+(kind?" "+kind:"")
  }

  function repairHiddenStarter(c){
    if(!c)return false;
    var comp=composer(),starter=c.querySelector(".eternaV160Start");
    if(!comp||!starter)return false;

    var hidden=false;
    try{hidden=getComputedStyle(comp).display==="none"}catch(e){hidden=comp.style.display==="none"}
    if(!hidden)return false;

    if(courseIsConfigured()){
      comp.style.display="block";
      setStatusDom("Eterna lista","ok");
      return true
    }

    if(starter.dataset.etNeedsCourseV16067==="1")return true;
    starter.dataset.etNeedsCourseV16067="1";
    starter.className="eternaV160NeedCourse";
    starter.innerHTML=
      '<h3>Primero configura el curso</h3>'+
      '<p>Eterna necesita saber el curso y la comunidad autónoma para adaptar correctamente el nivel y el currículo. Después podrás escribir, hablar o enviar una foto.</p>'+
      '<button type="button" data-et-reopen-setup>Configurar curso ahora</button>';
    var b=starter.querySelector("[data-et-reopen-setup]");
    if(b)b.onclick=function(){
      try{
        if(root.CocoEternaV160&&typeof root.CocoEternaV160.open==="function")root.CocoEternaV160.open()
      }catch(e){}
    };
    setStatusDom("Falta configurar el curso","warn");
    return true
  }

  function repairChatReadiness(c){
    if(!c)return;
    repairHiddenStarter(c)
  }

  function enhanceRetryableVerification(c){
    if(!c)return;
    var rows=c.querySelectorAll(".eternaV159Msg.assistant");
    rows.forEach(function(row){
      if(row.querySelector("[data-et-retry-verification]"))return;
      var bubble=row.querySelector(".eternaV159Bubble"),txt=norm(bubble&&bubble.textContent);
      if(txt.indexOf("problema temporal para comprobar")<0)return;
      var user=findPreviousUser(row),userBubble=user&&user.querySelector(".eternaV159Bubble"),question=clean(userBubble&&userBubble.textContent);
      if(!question)return;
      var b=document.createElement("button");b.type="button";b.setAttribute("data-et-retry-verification","");b.className="eternaV160RetryVerification";b.textContent="Intentar de nuevo";
      b.onclick=function(){var o=overlay(),i=o&&o.querySelector("[data-et-input]"),send=o&&o.querySelector("[data-et-send]");if(!i||!send)return;i.value=question;i.dispatchEvent(new Event("input",{bubbles:true}));send.click()};
      bubble.appendChild(b)
    })
  }
  function perfMark(name){try{performance.mark(name)}catch(e){}}
  function perfMeasure(name,start,end){try{performance.measure(name,start,end)}catch(e){}}

  function normalizeConversation(){
    normalizeRaf=0;
    var o=overlay(),c=chat();if(!o||!c)return;
    ensureLiveState();
    normalizeHeaderStatus();
    ensureMemoryNote(c);
    repairChatReadiness(c);
    restoreRememberedSources(c);
    enhanceRetryableVerification(c);
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
        clearThinkingStages();
        setLive("","");
        scrollTurnToStart(assistantAdded);
        scheduleHeaderStatus()
      }
      queueNormalize()
    });
    overlayObserver.observe(c,{childList:true,subtree:true});
    queueNormalize()
  }

  function syncModePlaceholder(){
    var o=overlay(),input=o&&o.querySelector("[data-et-input]");if(!input)return;
    var active=o.querySelector("[data-et-mode].is-active"),mode=active&&active.dataset?active.dataset.etMode:"";
    if(!mode){var choice=o.querySelector("[data-et-modechoice].is-active");mode=choice&&choice.dataset?choice.dataset.etModechoice:""}
    var map={homework:"Escribe qué parte de la tarea no entiendes…",ask:"Escribe tu pregunta del cole…",review:"Cuéntame qué hiciste o adjunta una foto…",explain:"¿Qué tema quieres entender mejor?",exam:"¿Qué asignatura y tema entra en el examen?",practice:"¿Qué quieres practicar hoy?"};
    if(map[mode])input.placeholder=map[mode]
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
    try{if(!o.dataset.etPerfVisibleV16069){o.dataset.etPerfVisibleV16069="1";performance.mark("eterna_overlay_visible")}}catch(e){}
    injectStyles();
    ensureLiveState();
    ensureVoicePanel();
    syncModePlaceholder();
    enforceSingleLineComposer();
    normalizeHeaderStatus();
    var mic=o.querySelector('[data-et-mic]');
    if(mic&&!mic.classList.contains('recording'))renderMicIdle(mic);
    installOverlayObserver();
    queueNormalize()
  }

  function showThinking(){
    ensureOverlay();
    var c=chat();thinkingAssistantCount=c?c.querySelectorAll(".eternaV159Msg.assistant").length:0;
    setVoicePanel(false);
    clearThinkingStages();
    setLive("thinking","Leyendo tu pregunta…");
    thinkingStageTimers.push(setTimeout(function(){setLive("thinking","Comprobando el contenido…")},2500));
    thinkingStageTimers.push(setTimeout(function(){setLive("thinking","Preparando una explicación clara…")},6000))
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
    if(stage.indexOf('bachillerato')>=0||year.indexOf('bachillerato')>=0)return{silenceMs:1600,noSpeechMs:9500,minSpeechMs:150,age:age||17,band:'bachillerato'};
    if(age>=17)return{silenceMs:1600,noSpeechMs:9500,minSpeechMs:150,age:age,band:'17-18'};
    if(age>=15)return{silenceMs:1700,noSpeechMs:10000,minSpeechMs:160,age:age,band:'15-16'};
    if(age>=12)return{silenceMs:1950,noSpeechMs:10500,minSpeechMs:180,age:age,band:'12-14'};
    if(age>=9)return{silenceMs:2300,noSpeechMs:11500,minSpeechMs:200,age:age,band:'9-11'};
    if(age>=6)return{silenceMs:2600,noSpeechMs:13000,minSpeechMs:220,age:age,band:'6-8'};
    return{silenceMs:2000,noSpeechMs:11000,minSpeechMs:180,age:age||null,band:'default'}
  }

  function stopTracks(stream){
    try{stream&&stream.getTracks().forEach(function(t){t.stop()})}catch(e){}
  }

  function cleanupVoice(){
    if(!voice)return;
    if(voice.raf)cancelAnimationFrame(voice.raf);
    if(voice.maxTimer)clearTimeout(voice.maxTimer);
    closeAudioContext(voice.audioContext)
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
      if(voice.recorder&&voice.recorder.state==="recording"){
        try{if(typeof voice.recorder.requestData==="function")voice.recorder.requestData()}catch(e){}
        voice.recorder.stop()
      }
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
    if(!blob||blob.size<700){setLive("info","No he podido escucharte bien. Toca el micrófono para intentarlo otra vez.");return}
    voiceTranscribing=true;
    setMicDisabled(true);
    setLive("processing","Entendiendo lo que has dicho…");
    try{
      var token=await authToken(),url=endpoint("/v1/transcribe");
      if(!token||!url)throw new Error("NO_AUTH");
      var response=null,data=null,lastError=null;
      for(var attempt=0;attempt<2;attempt++){
        try{
          var fd=new FormData();
          fd.append("audio",blob,fileNameForMime(mime||blob.type));
          response=await originalFetch(url,{method:"POST",headers:{Authorization:"Bearer "+token},body:fd});
          data=await response.json().catch(function(){return{}});
          if(response.ok)break;
          if(response.status<500&&response.status!==429)break
        }catch(fetchError){lastError=fetchError}
        if(attempt===0)await new Promise(function(resolve){setTimeout(resolve,320)})
      }
      var text=clean(data&&data.text);
      if(!response||!response.ok||!text)throw lastError||new Error("TRANSCRIPTION_FAILED");
      var o=overlay(),input=o&&o.querySelector("[data-et-input]"),send=o&&o.querySelector("[data-et-send]");
      if(!input||!send)throw new Error("UI_MISSING");
      input.value=text;
      input.dispatchEvent(new Event("input",{bubbles:true}));
      voiceSendPending=true;
      setLive("processing","He entendido tu pregunta. Enviándola…");
      setTimeout(function(){
        voiceTranscribing=false;
        if(!send.disabled)send.click();
        else{
          send.disabled=false;
          send.click()
        }
        setMicDisabled(false)
      },55)
    }catch(e){
      voiceTranscribing=false;
      setMicDisabled(false);
      setLive("info","No he podido transcribirlo bien. Toca el micrófono y vuelve a intentarlo.")
    }
  }

  function startVad(v){
    if(!v.audioContext||!v.analyser)return;
    var data=new Uint8Array(v.analyser.fftSize);
    v.vadAvailable=true;
    function tick(){
      if(!voice||voice!==v||v.stopping)return;
      if(v.audioContext&&v.audioContext.state==="suspended"){
        try{v.audioContext.resume()}catch(e){}
      }
      v.analyser.getByteTimeDomainData(data);
      var sum=0;
      for(var i=0;i<data.length;i++){var x=(data[i]-128)/128;sum+=x*x}
      var rms=Math.sqrt(sum/data.length),now=performance.now(),elapsed=now-v.startedAt;
      v.smoothedRms=v.smoothedRms?(.72*v.smoothedRms+.28*rms):rms;
      var level=v.smoothedRms;

      var attack=Math.max(.014,Math.min(.065,v.noiseFloor*2.45));
      var release=Math.max(.009,Math.min(.045,v.noiseFloor*1.55));

      if(!v.voiceDetected){
        if(!v.candidateAt&&level<attack){
          var learn=elapsed<650?.10:.018;
          v.noiseFloor=Math.max(.0035,Math.min(.035,v.noiseFloor*(1-learn)+level*learn))
        }
        attack=Math.max(.014,Math.min(.065,v.noiseFloor*2.45));
        release=Math.max(.009,Math.min(.045,v.noiseFloor*1.55));

        if(level>attack){
          if(!v.candidateAt)v.candidateAt=now;
          var candidateMs=now-v.candidateAt;
          var strong=level>attack*1.75;
          if(candidateMs>=Number(v.minSpeechMs||180)||(strong&&candidateMs>=90)){
            v.voiceDetected=true;
            v.speechStartedAt=v.candidateAt;
            v.lastVoiceAt=now;
            updateVoicePanelCopy("Te escucho…","Cuando termines, espera un momento y Eterna enviará tu pregunta.","has-speech")
          }
        }else if(level<release*1.12){
          v.candidateAt=0
        }
      }else{
        if(level>release)v.lastVoiceAt=now
      }

      if(v.voiceDetected&&now-v.lastVoiceAt>Number(v.silenceMs||2000)&&elapsed>1200){
        stopVoice(false,"silence");
        return
      }
      if(!v.voiceDetected&&elapsed>Number(v.noSpeechMs||11000)){
        stopVoice(true,"no-speech");
        return
      }
      v.raf=requestAnimationFrame(tick)
    }
    v.raf=requestAnimationFrame(tick)
  }

  async function startVoice(){
    ensureOverlay();
    if(voice&&voice.recorder&&voice.recorder.state==="recording"){stopVoice(false,"manual");return}
    if(voiceStarting||voiceTranscribing)return;
    if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia||typeof MediaRecorder==="undefined"){
      setLive("info","Este navegador no permite grabar audio aquí. Puedes escribir tu pregunta.");
      return
    }

    var o=overlay();
    if(chatRequestIsPending()){
      setLive("info","Espera a que Eterna termine la respuesta anterior antes de volver a hablar.");
      return
    }

    voiceStarting=true;
    setMicDisabled(true);
    var warmContext=claimPrimedAudioContext();
    setLive("processing","Preparando el micrófono…");

    try{
      var prepared=await Promise.all([browserMicState(),micAllowed(),loadVoiceStudentProfile()]),browserState=prepared[0],allowed=prepared[1],studentVoiceProfile=prepared[2]||{};
      if(browserState==="denied"){
        closeAudioContext(warmContext);
        releaseVoiceStartLock();
        setLive("info","El navegador tiene bloqueado el micrófono. Revísalo en los permisos del navegador o de la app.");
        return
      }
      if(!allowed){
        closeAudioContext(warmContext);
        releaseVoiceStartLock();
        setLive("info","El micrófono está desactivado desde Zona Familiar.");
        return
      }
    }catch(e){
      closeAudioContext(warmContext);
      releaseVoiceStartLock();
      setLive("info","Ahora no puedo comprobar el permiso del micrófono. Inténtalo de nuevo.");
      return
    }

    try{
      var stream=await navigator.mediaDevices.getUserMedia({
        audio:{
          echoCancellation:{ideal:true},
          noiseSuppression:{ideal:true},
          autoGainControl:{ideal:true},
          channelCount:{ideal:1}
        }
      });
      rememberMicGrant();

      var mime=recorderMime(),rec=null;
      try{rec=mime?new MediaRecorder(stream,{mimeType:mime}):new MediaRecorder(stream)}
      catch(firstRecorderError){rec=new MediaRecorder(stream);mime=rec.mimeType||""}

      o=overlay();
      var mic=o&&o.querySelector("[data-et-mic]"),send=o&&o.querySelector("[data-et-send]");
      var vadCfg=vadConfigForStudent(typeof studentVoiceProfile!=="undefined"?studentVoiceProfile:{});
      var v={
        stream:stream,recorder:rec,chunks:[],mime:mime||rec.mimeType||"audio/webm",
        startedAt:performance.now(),lastVoiceAt:0,voiceDetected:false,candidateAt:0,speechStartedAt:0,
        noiseFloor:.006,smoothedRms:0,vadAvailable:false,minSpeechMs:vadCfg.minSpeechMs,
        silenceMs:vadCfg.silenceMs,noSpeechMs:vadCfg.noSpeechMs,studentAge:vadCfg.age,studentBand:vadCfg.band,
        stopping:false,cancelled:false,raf:0,maxTimer:0,audioContext:null,analyser:null,
        sendWasDisabled:send?send.disabled:false
      };
      voice=v;

      if(mic){renderMicRecording(mic);mic.disabled=false}
      if(send)send.disabled=true;

      rec.ondataavailable=function(e){if(e.data&&e.data.size)v.chunks.push(e.data)};
      rec.onerror=function(){if(voice===v)stopVoice(true,"error")};
      rec.onstart=function(){v.startedAt=performance.now()};
      rec.onstop=async function(){
        var cancelled=v.cancelled,reason=v.stopReason||"";
        var type=rec.mimeType||v.mime||(v.chunks[0]&&v.chunks[0].type)||"audio/webm";
        var blob=new Blob(v.chunks,{type:type});
        var duration=performance.now()-v.startedAt;
        cleanupVoice();
        if(voice===v)voice=null;
        releaseVoiceStartLock();

        if(cancelled){
          if(reason==="no-speech")setLive("info","No he oído una pregunta. Toca el micrófono para intentarlo otra vez.");
          else if(reason==="interrupted")setLive("info","La grabación se interrumpió. Toca el micrófono para volver a hablar.");
          else if(reason==="error")setLive("info","No he podido escucharte bien. Toca el micrófono para intentarlo otra vez.");
          else setLive("","");
          return
        }

        if(v.vadAvailable&&!v.voiceDetected&&duration<900){
          setLive("info","No he oído suficiente voz. Toca el micrófono y vuelve a intentarlo.");
          return
        }
        await transcribeAndSend(blob,type)
      };

      try{
        var AC=root.AudioContext||root.webkitAudioContext;
        if(AC){
          v.audioContext=warmContext&&warmContext.state!=="closed"?warmContext:null;
          if(!v.audioContext){
            try{v.audioContext=new AC({latencyHint:"interactive"})}catch(e){v.audioContext=new AC()}
          }
          try{if(v.audioContext.state==="suspended")await v.audioContext.resume()}catch(e){}
          var source=v.audioContext.createMediaStreamSource(stream);
          v.analyser=v.audioContext.createAnalyser();
          v.analyser.fftSize=1024;
          v.analyser.smoothingTimeConstant=.22;
          source.connect(v.analyser)
        }
      }catch(e){
        closeAudioContext(warmContext);
        v.audioContext=null;
        v.analyser=null
      }

      var tracks=stream.getAudioTracks?stream.getAudioTracks():[];
      tracks.forEach(function(track){
        try{track.addEventListener("ended",function(){if(voice===v&&!v.stopping)stopVoice(true,"interrupted")},{once:true})}catch(e){}
      });

      rec.start(250);
      setLive("","");
      setVoicePanel(true);
      updateVoicePanelCopy("Escuchando…","Habla con normalidad. Puedes hacer pausas breves; Eterna enviará la pregunta cuando termines.","");

      if(v.analyser&&(!v.audioContext||v.audioContext.state!=="suspended")){
        startVad(v)
      }else{
        updateVoicePanelCopy("Escuchando…","La detección automática no está disponible en esta sesión. Pulsa «Terminar ahora» cuando acabes.","manual-fallback")
      }

      v.maxTimer=setTimeout(function(){if(voice===v&&!v.stopping)stopVoice(false,"max-duration")},60000);
      releaseVoiceStartLock()
    }catch(e){
      closeAudioContext(warmContext);
      stopTracks(voice&&voice.stream);
      voice=null;
      setVoicePanel(false);
      releaseVoiceStartLock();
      var name=String(e&&e.name||"");
      var msg=name==="NotAllowedError"||name==="SecurityError"
        ?"Permite el acceso al micrófono en Safari o en la PWA para hablar con Eterna."
        :hasRememberedMicGrant()
          ?"No pude reactivar el micrófono en esta sesión. Vuelve a intentarlo; si continúa, revisa el permiso del navegador."
          :"Permite el acceso al micrófono para hablar con Eterna. Después quedará disponible para las siguientes preguntas en este dispositivo.";
      setLive("info",msg)
    }
  }

  function patchChatRequest(input,init){
    try{
      if(!init||typeof init.body!=="string"){voiceSendPending=false;return{input:input,init:init}}
      var b=JSON.parse(init.body);
      if(b&&typeof b==="object"){
        if(voiceSendPending)b.input_source="voice";
        if(!b.pedagogical_state&&lastPedagogicalState&&typeof lastPedagogicalState==="object")b.pedagogical_state=lastPedagogicalState;
        voiceSendPending=false;
        var next=Object.assign({},init,{body:JSON.stringify(b)});
        return{input:input,init:next}
      }
    }catch(e){}
    voiceSendPending=false;
    return{input:input,init:init}
  }

  function pendingJobRead(){
    try{
      var d=JSON.parse(sessionStorage.getItem(PENDING_JOB_KEY)||"null"),contract=root.EternaStateContractV3;
      if(!d||d.version!==3||!d.id||!d.at||Date.now()-Number(d.at)>BACKGROUND_JOB_TTL_MS||!contract||!contract.validOpaqueId(d.uid)||!contract.MODES.includes(d.mode)||!contract.validOpaqueId(d.session_id)||!contract.validOpaqueId(d.request_id)||!contract.validOpaqueId(d.client_turn_id)||d.question_id!=null&&!contract.validOpaqueId(d.question_id)||d.answered_question_id!=null&&!contract.validOpaqueId(d.answered_question_id)){sessionStorage.removeItem(PENDING_JOB_KEY);return null}
      return d
    }catch(e){return null}
  }

  function pendingJobMetadata(body){var core=root.CocoEternaV160,ctx=core&&typeof core.getActivityContext==="function"?core.getActivityContext():null,b=body&&typeof body==="object"?body:{};return{version:3,uid:ctx&&ctx.uid||null,mode:b.mode||ctx&&ctx.mode||null,session_id:b.session_id||b.activity_state&&b.activity_state.session_id||ctx&&ctx.session_id||null,question_id:b.activity_state&&b.activity_state.question_id||ctx&&ctx.question_id||null,answered_question_id:b.answered_question_id||null,request_id:b.request_id||null,client_turn_id:b.client_turn_id||null}}

  function pendingJobWrite(id,metadata){
    var m=metadata&&typeof metadata==="object"?metadata:{};try{sessionStorage.setItem(PENDING_JOB_KEY,JSON.stringify({version:3,id:String(id||""),at:Date.now(),uid:m.uid||null,mode:m.mode||null,session_id:m.session_id||null,question_id:m.question_id||null,answered_question_id:m.answered_question_id||null,request_id:m.request_id||null,client_turn_id:m.client_turn_id||null}))}catch(e){}
  }

  function responseIdentity(response){
    try{return clean(response&&response.headers&&response.headers.get("X-Eterna-Response-Id")||"")}catch(e){return""}
  }

  function markResponseConsumed(responseId){
    responseId=clean(responseId);if(!responseId)return;
    consumedResponseIds.add(responseId);
    if(consumedResponseIds.size>80){var first=consumedResponseIds.values().next().value;if(first)consumedResponseIds.delete(first)}
  }

  function responseWasConsumed(responseId){return Boolean(responseId&&consumedResponseIds.has(clean(responseId)))}

  function assistantReplyText(bubble){
    if(!bubble)return"";
    try{
      var clone=bubble.cloneNode(true),checks=clone.querySelectorAll(".eternaV160ConversationCheck,[data-et-sources]");
      checks.forEach(function(n){n.remove()});
      return norm(clone.textContent)
    }catch(e){return norm(bubble.textContent)}
  }

  function replyAlreadyVisible(reply){
    var c=chat(),target=norm(reply);if(!c||!target)return false;
    var rows=c.querySelectorAll(".eternaV159Msg.assistant .eternaV159Bubble");
    for(var i=Math.max(0,rows.length-8);i<rows.length;i++){
      var existing=assistantReplyText(rows[i]);
      if(!existing)continue;
      if(existing===target||existing.indexOf(target)===0||target.indexOf(existing)===0)return true
    }
    return false
  }

  function pendingJobClear(id){
    try{
      var d=pendingJobRead();
      if(!id||!d||String(d.id)===String(id))sessionStorage.removeItem(PENDING_JOB_KEY)
    }catch(e){}
  }

  function waitForForeground(){
    if(!document.hidden)return Promise.resolve();
    return new Promise(function(resolve){
      function done(){
        if(document.hidden)return;
        document.removeEventListener("visibilitychange",done);
        root.removeEventListener("pageshow",done);
        resolve()
      }
      document.addEventListener("visibilitychange",done,{passive:true});
      root.addEventListener("pageshow",done,{passive:true})
    })
  }

  function delay(ms){return new Promise(function(resolve){setTimeout(resolve,ms)})}

  async function pollChatJob(jobId,headers,startedAt){
    var resultUrl=endpoint("/v1/chat-result")+"?id="+encodeURIComponent(jobId),start=Number(startedAt||Date.now());
    while(Date.now()-start<BACKGROUND_JOB_TTL_MS){
      if(document.hidden)await waitForForeground();
      var response=await originalFetch(resultUrl,{method:"GET",headers:headers,cache:"no-store"});
      if(response.status===202){await delay(550);continue}
      if(response.status===404){pendingJobClear(jobId);throw new Error("ETERNA_BACKGROUND_RESULT_EXPIRED")}
      return response
    }
    pendingJobClear(jobId);
    throw new Error("ETERNA_BACKGROUND_RESULT_EXPIRED")
  }

  async function backgroundChatFetch(input,init){
    var jobUrl=endpoint("/v1/chat-job");
    if(!jobUrl||!init||typeof init.body!=="string")return originalFetch(input,init);
    var headers=new Headers(init.headers||{}),requestBody=null;try{requestBody=JSON.parse(init.body)}catch(e){}
    try{
      var startResponse=await originalFetch(jobUrl,{method:"POST",headers:headers,body:init.body,cache:"no-store"});
      if(startResponse.status!==202){
        if([404,405,501,503].indexOf(startResponse.status)>=0)return originalFetch(input,init);
        return startResponse
      }
      var job=await startResponse.json().catch(function(){return{}});
      if(!job.job_id)throw new Error("ETERNA_BACKGROUND_JOB_INVALID");
      pendingJobWrite(job.job_id,pendingJobMetadata(requestBody));
      activeBackgroundJobId=String(job.job_id);
      return await pollChatJob(job.job_id,headers,Date.now())
    }catch(e){
      /* No repetir /v1/chat tras un error de red ambiguo: el POST del job puede
         haber llegado al Worker aunque Safari/iOS haya perdido la respuesta. */
      activeBackgroundJobId="";
      throw e
    }
  }

  function recoveredReplyRow(data,pending,responseId){
    var core=root.CocoEternaV160,c=chat();if(!core||typeof core.applyChatResponse!=="function"||!c||!data||!data.reply||!pending)return false;
    responseId=clean(responseId);if(replyAlreadyVisible(data.reply)){if(responseId)markResponseConsumed(responseId);return false}
    var context={uid:pending.uid,mode:pending.mode,session_id:pending.session_id,request_id:pending.request_id,client_turn_id:pending.client_turn_id,answered_question_id:pending.answered_question_id,recovered:true},result=core.applyChatResponse(data,context);
    if(!result||!result.applied)return false;
    var rows=c.querySelectorAll(".eternaV159Msg.assistant"),latest=rows.length?rows[rows.length-1]:null,note=document.createElement("div");note.className="eternaV160MemoryNote";note.setAttribute("data-et-recovered-job",String(pending.id));note.textContent="He recuperado la respuesta que Eterna estaba procesando mientras estabas fuera de la app.";if(latest)c.insertBefore(note,latest);else c.appendChild(note);
    if(data.pedagogical_state&&typeof data.pedagogical_state==="object")lastPedagogicalState=data.pedagogical_state;
    rememberSourceDisclosure(data);restoreRememberedSources(c);normalizeHeaderStatus();if(responseId)markResponseConsumed(responseId);c.scrollTop=c.scrollHeight;return true
  }

  async function resumePendingChatJob(){
    if(pendingJobResumePromise)return pendingJobResumePromise;
    var pending=pendingJobRead();if(!pending)return false;
    /* Si el fetch original sigue vivo en esta misma página, él es el único consumidor.
       Tras una recarga real de iOS este estado en memoria desaparece y resume sí actúa. */
    if(activeBackgroundJobId&&String(activeBackgroundJobId)===String(pending.id))return false;
    pendingJobResumePromise=(async function(){
      try{
        var cli=getSupabaseClient(),sr=cli&&cli.auth?await cli.auth.getSession():null,session=sr&&sr.data&&sr.data.session,t=session&&session.access_token||"",uid=session&&session.user&&session.user.id?String(session.user.id):"";if(!t||!uid||uid!==pending.uid){pendingJobClear(pending.id);return false}
        var response=await originalFetch(endpoint("/v1/chat-result")+"?id="+encodeURIComponent(pending.id),{method:"GET",headers:{Authorization:"Bearer "+t},cache:"no-store"});
        if(response.status===202){
          if(!document.hidden)setTimeout(function(){pendingJobResumePromise=null;resumePendingChatJob()},700);
          return false
        }
        if(response.status===404){pendingJobClear(pending.id);return false}
        var responseId=responseIdentity(response),data=await response.clone().json().catch(function(){return{}});
        if(responseWasConsumed(responseId)||replyAlreadyVisible(data&&data.reply)){if(responseId)markResponseConsumed(responseId);pendingJobClear(pending.id);return false}
        if(root.CocoEternaV160&&typeof root.CocoEternaV160.open==="function"){
          try{await root.CocoEternaV160.open()}catch(e){}
        }
        ensureOverlay();
        var current=root.CocoEternaV160&&typeof root.CocoEternaV160.getActivityContext==="function"?root.CocoEternaV160.getActivityContext():null;
        if(!current||current.uid!==pending.uid||current.mode!==pending.mode||current.session_id!==pending.session_id||pending.answered_question_id&&current.question_id!==pending.answered_question_id){pendingJobClear(pending.id);return false}
        var applied=recoveredReplyRow(data,pending,responseId);pendingJobClear(pending.id);return applied
      }catch(e){return false}
      finally{pendingJobResumePromise=null}
    })();
    return pendingJobResumePromise
  }

  function handleChatResponse(response){
    if(!response||response.status===401)return;
    if(!response.ok){clearThinkingStages();setLive("","");activeBackgroundJobId="";pendingJobClear()}
    response.clone().json().then(function(data){
      if(data&&data.pedagogical_state&&typeof data.pedagogical_state==="object")lastPedagogicalState=data.pedagogical_state;
      rememberSourceDisclosure(data);
      ensureOverlay();
      queueNormalize();
      normalizeHeaderStatus()
    }).catch(function(){})
  }

  function installFetchWrapper(){
    if(!originalFetch||root.fetch.__eternaExperience16074Wrapped)return;
    var wrapped=async function(input,init){
      var url=typeof input==="string"?input:(input&&input.url)||"",isChat=/\/v1\/chat(?:\?|$)/.test(url);
      if(isChat){
        var p=patchChatRequest(input,init);input=p.input;init=p.init;
        showThinking()
      }
      try{
        var response=isChat?await backgroundChatFetch(input,init):await originalFetch(input,init);
        if(isChat)handleChatResponse(response);
        return response
      }catch(e){
        if(isChat){clearThinkingStages();setLive("","")}
        throw e
      }
    };
    wrapped.__eternaExperience16074Wrapped=true;
    root.fetch=wrapped
  }

  function installInteractionHooks(){
    if(document.documentElement.dataset.eternaExperience16074==="1")return;
    document.documentElement.dataset.eternaExperience16074="1";
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
          if(!(voice&&voice.recorder&&voice.recorder.state==="recording")&&!voiceStarting&&!voiceTranscribing)primeAudioContext();
          if(root.ETERNA_LEGAL_SHIELD_V16058){
            if(typeof root.ETERNA_LEGAL_SHIELD_V16058.consumeBypass==="function"&&root.ETERNA_LEGAL_SHIELD_V16058.consumeBypass(mic)){startVoice();return}
            if(typeof root.ETERNA_LEGAL_SHIELD_V16058.gateMic==="function"){root.ETERNA_LEGAL_SHIELD_V16058.gateMic(mic);return}
          }
          startVoice();
          return
        }
        var modeAttempt=event.target&&event.target.closest?event.target.closest("#eternaOverlayV159 [data-et-changemode],#eternaOverlayV159 [data-et-mode],#eternaOverlayV159 [data-et-modechoice]"):null;
        if(modeAttempt&&!courseIsConfigured()){
          var currentChat=chat(),setup=currentChat&&currentChat.querySelector(".eternaV159Setup");
          if(setup){
            event.preventDefault();
            event.stopImmediatePropagation();
            setStatusDom("Primero configura el curso","warn");
            try{setup.scrollIntoView({behavior:"smooth",block:"center"})}catch(e){}
            var first=setup.querySelector("[data-et-year]");if(first)setTimeout(function(){try{first.focus()}catch(e){}},60);
            return
          }
        }
        var opener=event.target&&event.target.closest?event.target.closest("#eternaLauncherV159,.eternaLauncherCardV159,[data-et-changemode],[data-et-mode],[data-et-modechoice]"):null;
        if(opener)requestAnimationFrame(function(){ensureOverlay();syncModePlaceholder();enforceSingleLineComposer();normalizeHeaderStatus()})
      }catch(e){}
    },true);
    root.addEventListener("pageshow",function(){
      var o=overlay();
      if(o&&o.classList.contains("is-open"))requestAnimationFrame(function(){ensureOverlay();normalizeHeaderStatus()});
      resumePendingChatJob()
    },{passive:true});
    root.addEventListener("coco:eterna-response-applied",function(event){clearThinkingStages();var pending=pendingJobRead(),detail=event&&event.detail||{};if(pending&&detail.request_id===pending.request_id&&detail.client_turn_id===pending.client_turn_id&&detail.session_id===pending.session_id&&detail.mode===pending.mode){activeBackgroundJobId="";pendingJobClear(pending.id)}});
    root.addEventListener("coco:eterna-context-invalidated",function(){clearThinkingStages();pendingJobClear();activeBackgroundJobId=""});
    root.addEventListener("coco:eterna-ui-reset",function(){clearThinkingStages();setLive("","");setVoicePanel(false)});
    root.addEventListener("resize",function(){
      if(resizeRaf)return;
      resizeRaf=requestAnimationFrame(function(){resizeRaf=0;if(overlay())enforceSingleLineComposer()})
    },{passive:true});
    document.addEventListener("visibilitychange",function(){
      if(document.hidden){
        if(voice&&voice.recorder&&voice.recorder.state==="recording")stopVoice(true,"interrupted")
      }else{
        resumePendingChatJob()
      }
    },{passive:true})
  }

  function activateExperience(){
    if(experienceActivated)return true;
    experienceActivated=true;
    LOAD_INTENT="eterna";
    injectStyles();
    installFetchWrapper();
    installInteractionHooks();
    if(document.getElementById("eternaOverlayV159"))ensureOverlay();
    resumePendingChatJob();
    return true
  }

  injectStyles();
  root.ETERNA_EXPERIENCE_V16049={
    version:VERSION,
    normalize:normalizeConversation,
    activate:activateExperience,
    resumePending:resumePendingChatJob,
    enhanceFamilyProgress:enhanceLearningProgressMap,
    getPedagogicalState:function(){return lastPedagogicalState},
    resetPedagogicalState:function(){
      lastPedagogicalState=null;
      voiceSendPending=false;
      voiceStarting=false;
      voiceTranscribing=false;
      closeAudioContext(primedAudioContext);
      primedAudioContext=null;
      clearPrimedAudioTimer();
      audioSettingsCache={at:0,allowed:null};
      voiceStudentProfileCache={uid:"",age:null,stage:null,school_year:null,at:0};
      sourceMemory=[];
      pendingJobClear();
      try{if(voice)stopVoice(true,"session-change")}catch(e){}
      voice=null;
      setLive("","")
    }
  };
  activateExperience()
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
  var lastLimitType=null,limitRaf=0;

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
    var o=overlay(),close=o&&o.querySelector(".eternaV159Close");
    try{if(close)close.click()}catch(e){}
    try{if(o)o.classList.remove("is-open");document.body.style.overflow=""}catch(e){}
    var b=bestFamilyButton();
    if(b){
      try{b.click()}catch(e){try{b.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true,view:window}))}catch(_e){}}
    }
    requestAnimationFrame(focusFamilyGate)
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
    requestAnimationFrame(refreshVisibleName)
  }

  function syncLimitHeader(type){
    var o=overlay(),s=o&&o.querySelector("[data-et-status]"),d=o&&o.querySelector("[data-et-dot]");
    if(!s)return;
    if(type==="weekly")s.textContent="Límite semanal alcanzado";
    else if(type==="daily")s.textContent="Límite diario alcanzado";
    if(d)d.className="eternaV159Dot warn"
  }

  function clearStaleLimitHeader(){
    var o=overlay(),s=o&&o.querySelector("[data-et-status]"),d=o&&o.querySelector("[data-et-dot]");
    if(!s||!/l[ií]mite\s+(diario|semanal)/i.test(String(s.textContent||"")))return;
    s.textContent="Eterna lista";if(d)d.className="eternaV159Dot ok"
  }

  function scheduleLimit(type){
    if(limitRaf)cancelAnimationFrame(limitRaf);
    limitRaf=requestAnimationFrame(function(){limitRaf=0;decorateLimit(type);syncLimitHeader(type)})
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
        }else if(response.ok){
          lastLimitType=null;
          requestAnimationFrame(clearStaleLimitHeader)
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

    root.addEventListener("pageshow",function(){if(overlay())scheduleName()},{passive:true})
  }

  injectLimitStyles();
  installFetchWrapper();
  installHooks();
  scheduleName();

  root.ETERNA_LIMITS_IDENTITY_V16051={
    version:"160.74",
    refreshName:refreshVisibleName,
    clearStaleLimit:clearStaleLimitHeader,
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


window.ETERNA_RELEASE_V16057=Object.freeze({
  version:"160.57",
  verified_status_shown_as_ready:true,
  verifier_logic_untouched:true,
  premium_line_microphone:true,
  mic_target_mobile_px:52,
  learning_strength_map:true,
  strength_map_existing_data_only:true,
  cloudflare_worker_unchanged:"160.3-age1",
  sql_required:false,
  preserves_age_adaptive_pedagogy:true,
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


/* ETERNA LEGAL SHIELD v160.58
 * Capa aditiva, sin observers globales:
 * - autorización/aceptación legal registrable en Zona Familiar;
 * - verificación de correo del adulto;
 * - bloqueo preventivo de Eterna hasta aceptación cuando Worker 160.4 está activo;
 * - información precontractual antes de Stripe.
 */
(function(root){
  "use strict";
  if(root.__ETERNA_LEGAL_SHIELD_V16058__)return;
  root.__ETERNA_LEGAL_SHIELD_V16058__=true;

  var LEGAL_VERSION="2026-08-23-v1";
  var stateCache=null,stateAt=0,backendAvailable=null,legalStatePromise=null,legalRenderPromise=null;
  var bypass=new WeakSet();
  var originalFetch=typeof root.fetch==="function"?root.fetch.bind(root):null;

  function endpoint(path){var c=root.COCO_CONFIG||{},b=String(c.eternaEndpoint||"").replace(/\/+$/,"");return b?b+(String(path||"").charAt(0)==="/"?path:"/"+path):""}
  function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[c]})}
  function getClient(){if(root.__COCO_SUPABASE_CLIENT)return root.__COCO_SUPABASE_CLIENT;var c=root.COCO_CONFIG||{};try{if(root.supabase&&root.supabase.createClient&&c.url&&c.clave)return root.__COCO_SUPABASE_CLIENT=root.supabase.createClient(c.url,c.clave,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}})}catch(e){}return null}
  async function session(){var c=getClient();if(!c)return null;try{var r=await c.auth.getSession();return r&&r.data&&r.data.session||null}catch(e){return null}}
  async function token(){var s=await session();return s&&s.access_token||""}
  function invalidate(){stateCache=null;stateAt=0}

  function injectStyles(){
    if(document.getElementById("eterna-legal-v16058-css"))return;
    var s=document.createElement("style");s.id="eterna-legal-v16058-css";s.textContent=[
      "#cocoApp .eternaLegalV16058{margin:14px 0;padding:16px;border:2px solid #d8eaf2;border-radius:18px;background:linear-gradient(145deg,#f7fcfe,#fffaf4);color:#294858;box-shadow:0 5px 16px rgba(23,63,89,.055)}",
      "#cocoApp .eternaLegalV16058.is-ok{border-color:#c8e9d6;background:linear-gradient(145deg,#f3fcf7,#fff)}",
      "#cocoApp .eternaLegalV16058Head{display:flex;gap:10px;align-items:flex-start;justify-content:space-between}.eternaLegalV16058Head>div{min-width:0}.eternaLegalV16058Head span{display:block;font-size:9px;font-weight:900;letter-spacing:.08em;color:#548093}.eternaLegalV16058Head h4{margin:2px 0 3px;color:#173f59;font-size:16px}.eternaLegalV16058Head p{margin:0;color:#607985;font-size:10px;line-height:1.4}",
      "#cocoApp .eternaLegalV16058Badge{flex:0 0 auto;padding:5px 8px;border-radius:999px;background:#fff0df;color:#9a5c21;font-size:9px;font-weight:900}#cocoApp .eternaLegalV16058.is-ok .eternaLegalV16058Badge{background:#e8f8ef;color:#23714b}",
      "#cocoApp .eternaLegalV16058Links{display:flex;flex-wrap:wrap;gap:6px;margin:11px 0}#cocoApp .eternaLegalV16058Links a{padding:5px 8px;border:1px solid #d9e8ef;border-radius:9px;background:#fff;color:#246b8a;font-size:9px;font-weight:800;text-decoration:none}",
      "#cocoApp .eternaLegalV16058Form{display:grid;gap:8px;margin-top:10px}",
      "#cocoApp .eternaLegalV16058Check,.eternaLegalModalV16058 .eternaLegalV16058Check{position:relative;z-index:1;display:flex;align-items:flex-start;gap:10px;padding:10px 11px;border:1px solid #e0ebf0;border-radius:12px;background:rgba(255,255,255,.90);font-size:10px;font-weight:720;line-height:1.35;cursor:pointer!important;touch-action:manipulation!important;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none}",
      "#cocoApp .eternaLegalV16058Check input[type=checkbox],.eternaLegalModalV16058 .eternaLegalV16058Check input[type=checkbox]{position:relative!important;inset:auto!important;display:block!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;z-index:3!important;appearance:auto!important;-webkit-appearance:checkbox!important;margin:1px 0 0!important;width:20px!important;height:20px!important;min-width:20px!important;min-height:20px!important;flex:0 0 20px!important;accent-color:#2f9ac5!important;cursor:pointer!important}",
      "#cocoApp .eternaLegalV16058Check span,.eternaLegalModalV16058 .eternaLegalV16058Check span{pointer-events:none;flex:1;min-width:0}",
      "#cocoApp .eternaLegalV16058Check.is-checked,.eternaLegalModalV16058 .eternaLegalV16058Check.is-checked{border-color:#9dd4e6;background:#f2fbfe;box-shadow:0 0 0 2px rgba(47,154,197,.08)}",
      "#cocoApp .eternaLegalV16058Check.is-checked span,.eternaLegalModalV16058 .eternaLegalV16058Check.is-checked span{color:#173f59}",
      "#cocoApp .eternaLegalV16058Actions button,.eternaLegalModalV16058 button{position:relative;z-index:3;pointer-events:auto!important;touch-action:manipulation!important}",
      "#cocoApp .eternaLegalV16058 label.eternaLegalV16058Relation{display:grid;gap:4px;color:#496878;font-size:9px;font-weight:850}#cocoApp .eternaLegalV16058 select{width:100%;min-height:38px;border:1px solid #cfe2eb;border-radius:10px;background:#fff;padding:6px 9px;color:#294858;font:750 10px inherit}",
      "#cocoApp .eternaLegalV16058Actions{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px}#cocoApp .eternaLegalV16058Actions button{min-height:38px;padding:8px 11px;border-radius:10px;font:850 10px inherit;cursor:pointer}.eternaLegalPrimaryV16058{border:0;background:#173f59;color:#fff}.eternaLegalSecondaryV16058{border:1px solid #cfe2eb;background:#fff;color:#355f73}.eternaLegalDangerV16058{border:1px solid #efc9c1;background:#fff8f6;color:#9b4738}",
      "#cocoApp .eternaLegalV16058Msg{min-height:15px;margin-top:6px;color:#7b5b36;font-size:9px;font-weight:800}#cocoApp .eternaLegalV16058Msg.ok{color:#22714a}#cocoApp .eternaLegalV16058Msg.error{color:#a24436}",
      ".eternaLegalModalV16058{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:18px;background:rgba(6,25,39,.62);backdrop-filter:blur(5px)}.eternaLegalModalV16058[hidden]{display:none!important}.eternaLegalModalCardV16058{width:min(520px,100%);max-height:min(760px,calc(100vh - 36px));overflow:auto;border-radius:22px;background:#fff;padding:20px;color:#294858;box-shadow:0 24px 70px rgba(0,0,0,.28)}.eternaLegalModalCardV16058 h3{margin:0;color:#173f59;font-size:21px}.eternaLegalModalCardV16058 p{font-size:12px;line-height:1.5}.eternaLegalPurchaseV16058{display:grid;gap:8px;padding:12px;border:1px solid #d9e8ef;border-radius:14px;background:#f7fbfd}.eternaLegalPurchaseV16058 strong{color:#173f59;font-size:19px}.eternaLegalPurchaseV16058 small{color:#627d8a;line-height:1.4}.eternaLegalModalActionsV16058{display:flex;gap:8px;margin-top:14px;flex-wrap:wrap}.eternaLegalModalActionsV16058 button{min-height:42px;padding:9px 13px;border-radius:11px;font-weight:850;cursor:pointer}.eternaLegalPayV16058{border:0;background:#ef761e;color:#fff}.eternaLegalCancelV16058{border:1px solid #d5e5ec;background:#fff;color:#456778}",
      "#eternaOverlayV159 .eternaLegalChildLinksV16058{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin:4px 0 0;font-size:8.5px;font-weight:800}#eternaOverlayV159 .eternaLegalChildLinksV16058 a{color:#6a8795;text-decoration:underline;text-underline-offset:2px}",
      "#cocoApp .cocoLegalSignupNoticeV16058{margin:10px 0 0;padding:10px 12px;border:1px solid #d7e8ef;border-radius:12px;background:#f7fbfd;color:#587483;font-size:10px;font-weight:700;line-height:1.4}#cocoApp .cocoLegalSignupNoticeV16058 a{color:#246b8a;font-weight:850}",
      ".eternaLegalModalV16058 .eternaLegalV16058Links{display:flex;flex-wrap:wrap;gap:6px;margin:11px 0}.eternaLegalModalV16058 .eternaLegalV16058Links a{padding:5px 8px;border:1px solid #d9e8ef;border-radius:9px;background:#fff;color:#246b8a;font-size:9px;font-weight:800;text-decoration:none}",
      "@media(max-width:640px){#cocoApp .eternaLegalV16058{padding:13px;border-radius:15px}#cocoApp .eternaLegalV16058Head{flex-direction:column}.eternaLegalModalCardV16058{padding:17px;border-radius:18px}}"
    ].join("");document.head.appendChild(s)
  }

  async function legalState(force){
    if(force){stateCache=null;stateAt=0}
    if(stateCache&&Date.now()-stateAt<60000)return stateCache;
    if(legalStatePromise)return legalStatePromise;
    var task=(async function(){
      var t=await token(),url=endpoint("/v1/legal-consent");
      if(!t||!url)return{required:false,accepted:true,backend_available:false};
      try{
        var r=await originalFetch(url,{method:"GET",headers:{Authorization:"Bearer "+t,"Cache-Control":"no-store"}});
        if(r.status===404){backendAvailable=false;return{required:false,accepted:true,backend_available:false}}
        var d=await r.json().catch(function(){return{}});
        if(!r.ok)throw new Error(d.error||("LEGAL_"+r.status));
        backendAvailable=true;d.backend_available=true;stateCache=d;stateAt=Date.now();return d
      }catch(e){
        if(backendAvailable===false)return{required:false,accepted:true,backend_available:false};
        return{required:false,accepted:true,backend_available:false,temporary_error:true}
      }
    })();
    legalStatePromise=task;
    try{return await task}finally{if(legalStatePromise===task)legalStatePromise=null}
  }

  async function postLegal(body){
    var t=await token(),url=endpoint("/v1/legal-consent");if(!t||!url)throw new Error("NO_SESSION");
    var r=await originalFetch(url,{method:"POST",headers:{Authorization:"Bearer "+t,"Content-Type":"application/json"},body:JSON.stringify(body||{})}),d=await r.json().catch(function(){return{}});
    if(!r.ok){var e=new Error(d.error||("LEGAL_"+r.status));e.code=d.error||"LEGAL_ERROR";throw e}
    stateCache=d;stateAt=Date.now();return d
  }

  function bindLegalCheckRows(scope){
    if(!scope||!scope.querySelectorAll)return;
    Array.prototype.slice.call(scope.querySelectorAll(".eternaLegalV16058Check")).forEach(function(label){
      if(label.dataset.legalTapBound==="1")return;
      var input=label.querySelector('input[type="checkbox"]');
      if(!input)return;
      label.dataset.legalTapBound="1";

      function sync(){
        label.classList.toggle("is-checked",Boolean(input.checked));
        label.setAttribute("aria-checked",input.checked?"true":"false")
      }

      /* iOS/PWA: hacemos toda la fila táctil de forma explícita.
         Si el toque llega al checkbox real dejamos actuar al control nativo.
         En el resto de la fila anulamos el toggle implícito del label y lo
         hacemos nosotros una sola vez, evitando dobles cambios. */
      label.addEventListener("click",function(event){
        if(event.target===input){sync();return}
        if(event.target&&event.target.closest&&event.target.closest("a,button,select,option"))return;
        event.preventDefault();
        input.checked=!input.checked;
        input.dispatchEvent(new Event("change",{bubbles:true}));
        sync()
      },false);

      input.addEventListener("change",sync,false);
      sync()
    })
  }

  function legalLinks(){return '<div class="eternaLegalV16058Links">'+
    '<a href="/privacidad-menores.html" target="_blank" rel="noopener">Privacidad para menores</a>'+
    '<a href="/politica-de-privacidad.html" target="_blank" rel="noopener">Privacidad completa</a>'+
    '<a href="/informacion-ia-eterna.html" target="_blank" rel="noopener">Cómo funciona la IA</a>'+
    '<a href="/terminos-y-condiciones.html" target="_blank" rel="noopener">Términos</a>'+
    '<a href="/suscripciones-y-desistimiento.html" target="_blank" rel="noopener">Suscripción y desistimiento</a></div>'}

  function familyCard(){return document.querySelector("#cocoApp .eternaV159FamilyCard")}
  function legalNode(card){var scope=card||familyCard();return scope&&scope.querySelector(".eternaLegalV16058[data-et-legal-canonical='1'],.eternaLegalV16058")}
  function message(node,text,kind){var m=node&&node.querySelector(".eternaLegalV16058Msg");if(m){m.textContent=String(text||"");m.className="eternaLegalV16058Msg"+(kind?" "+kind:"")}}

  function ensureCanonicalLegalNode(card){
    if(!card)return null;
    var node=legalNode(card);
    if(!node){
      node=document.createElement("section");
      node.className="eternaLegalV16058";
      node.setAttribute("data-et-legal-canonical","1");
      node.setAttribute("aria-label","Autorización y privacidad de Eterna");
      node.innerHTML='<div class="eternaLegalV16058Head"><div><span>PRIVACIDAD Y AUTORIZACIÓN</span><h4>Comprobando autorización…</h4><p>Estamos comprobando el estado registrado de esta cuenta.</p></div><b class="eternaLegalV16058Badge">Comprobando</b></div>';
      var scope=card.querySelector(".eternaV160FamilyScope"),target=scope&&scope.nextSibling;
      card.insertBefore(node,target||card.firstChild)
    }else{
      node.setAttribute("data-et-legal-canonical","1")
    }
    return node
  }

  async function renderLegalCard(force){
    injectStyles();
    var card=familyCard();if(!card)return false;
    var node=ensureCanonicalLegalNode(card);if(!node)return false;
    if(legalRenderPromise)return legalRenderPromise;
    var task=(async function(){
      var st=await legalState(force);
      if(!document.body.contains(card)||!document.body.contains(node))return false;
      var minor=st.minor!==false;
      node.className="eternaLegalV16058"+(st.accepted?" is-ok":"");
      node.setAttribute("data-et-legal-canonical","1");
      node.setAttribute("aria-label","Autorización y privacidad de Eterna");
      if(st.accepted){
        node.innerHTML='<div class="eternaLegalV16058Head"><div><span>PRIVACIDAD Y AUTORIZACIÓN</span><h4>Autorización registrada</h4><p>La cuenta tiene registrada la versión legal '+esc(st.legal_version||LEGAL_VERSION)+' para Eterna.</p></div><b class="eternaLegalV16058Badge">Protección activa ✓</b></div>'+legalLinks()+
          '<div class="eternaLegalV16058Actions"><button type="button" class="eternaLegalDangerV16058" data-legal-withdraw>Retirar autorización</button></div><div class="eternaLegalV16058Msg" aria-live="polite"></div>';
      }else{
        var emailCopy=st.email_verified===false?'Antes de confirmar, verifica el correo electrónico del adulto responsable.':'La aceptación queda registrada con la cuenta, la versión documental y la fecha.';
        node.innerHTML='<div class="eternaLegalV16058Head"><div><span>PRIVACIDAD Y AUTORIZACIÓN</span><h4>'+(minor?'Un adulto debe autorizar Eterna':'Aceptación legal de Eterna')+'</h4><p>'+emailCopy+'</p></div><b class="eternaLegalV16058Badge">Pendiente</b></div>'+legalLinks()+
          '<div class="eternaLegalV16058Form">'+
            (minor?'<label class="eternaLegalV16058Relation">Relación con el menor<select data-legal-relation><option value="">Selecciona</option><option value="parent">Padre</option><option value="mother">Madre</option><option value="legal_guardian">Tutor/a legal</option></select></label>':'')+
            '<label class="eternaLegalV16058Check"><input type="checkbox" data-legal-authority><span>'+(minor?'Confirmo que soy mayor de 18 años y padre, madre o tutor/a legal del menor asociado a esta cuenta, y autorizo su uso de Eterna.':'Confirmo que soy mayor de 18 años y titular de esta cuenta.')+'</span></label>'+
            '<label class="eternaLegalV16058Check"><input type="checkbox" data-legal-docs><span>He leído y acepto los Términos y la Política de Privacidad aplicables a Eterna.</span></label>'+
            '<label class="eternaLegalV16058Check"><input type="checkbox" data-legal-ai><span>Entiendo que Eterna es una inteligencia artificial, puede equivocarse y es una herramienta de apoyo escolar, no una persona ni un sustituto de docentes o profesionales.</span></label>'+
          '</div><div class="eternaLegalV16058Actions"><button type="button" class="eternaLegalPrimaryV16058" data-legal-accept>Confirmar autorización y continuar</button>'+(st.email_verified===false?'<button type="button" class="eternaLegalSecondaryV16058" data-legal-resend>Enviar verificación de correo</button>':'')+'</div><div class="eternaLegalV16058Msg" aria-live="polite"></div>';
      }
      bindLegalCheckRows(node);
      var accept=node.querySelector("[data-legal-accept]");if(accept)accept.onclick=async function(){
        var authority=node.querySelector("[data-legal-authority]"),docs=node.querySelector("[data-legal-docs]"),ai=node.querySelector("[data-legal-ai]"),rel=node.querySelector("[data-legal-relation]");
        if(!authority||!docs||!ai||!authority.checked||!docs.checked||!ai.checked||(minor&&(!rel||!rel.value))){message(node,"Completa las confirmaciones y, si corresponde, la relación con el menor.","error");return}
        accept.disabled=true;message(node,"Registrando la autorización…","");
        try{
          await postLegal({action:"accept",relationship:minor?rel.value:"adult_user",terms_accepted:true,privacy_accepted:true,ai_notice_accepted:true,parental_authorization:minor});
          message(node,"Autorización registrada correctamente.","ok");
          await renderLegalCard(false)
        }catch(e){
          accept.disabled=false;
          if(e.code==="ADULT_EMAIL_VERIFICATION_REQUIRED")message(node,"Primero confirma el correo electrónico del adulto y vuelve a intentarlo.","error");
          else message(node,"No se pudo registrar la autorización. Inténtalo de nuevo.","error")
        }
      };
      var resend=node.querySelector("[data-legal-resend]");if(resend)resend.onclick=async function(){var c=getClient(),s=await session(),email=s&&s.user&&s.user.email;if(!c||!email){message(node,"No se encontró el correo de la cuenta.","error");return}resend.disabled=true;try{var r=await c.auth.resend({type:"signup",email:email});if(r&&r.error)throw r.error;message(node,"Te hemos enviado un correo de verificación. Después vuelve a entrar en Zona Familiar.","ok")}catch(e){message(node,"No se pudo enviar el correo de verificación.","error")}finally{resend.disabled=false}};
      var withdraw=node.querySelector("[data-legal-withdraw]");if(withdraw)withdraw.onclick=async function(){if(!confirm("Retirar la autorización bloqueará Eterna hasta que un adulto vuelva a autorizarla. Esto no cancela por sí solo una suscripción de pago. ¿Continuar?"))return;withdraw.disabled=true;try{await postLegal({action:"withdraw"});await renderLegalCard(false);alert("Autorización retirada. Si existe una suscripción de pago y no quieres futuras renovaciones, gestiona también la suscripción desde Zona Familiar.")}catch(e){withdraw.disabled=false;message(node,"No se pudo retirar la autorización.","error")}};
      try{performance.mark("family_legal_ready")}catch(e){}
      try{root.dispatchEvent(new CustomEvent("coco:family-legal-ready",{detail:{card:card,node:node,state:st}}))}catch(e){}
      return true
    })();
    legalRenderPromise=task;
    try{return await task}finally{if(legalRenderPromise===task)legalRenderPromise=null}
  }

  function waitForFamilyCard(){
    var card=familyCard();if(card)return Promise.resolve(card);
    return new Promise(function(resolve){
      function ready(event){
        var c=event&&event.detail&&event.detail.card||familyCard();
        if(!c)return;
        root.removeEventListener("coco:family-card-ready",ready);
        resolve(c)
      }
      root.addEventListener("coco:family-card-ready",ready)
    })
  }

  async function openFamily(){
    var o=document.getElementById("eternaOverlayV159"),close=o&&o.querySelector(".eternaV159Close");try{if(close)close.click()}catch(e){}
    var b=document.querySelector("#cocoApp .cocoFamiliaBtn,.cocoFamiliaBtn");if(!b)return null;
    try{b.click()}catch(e){}
    return await waitForFamilyCard()
  }

  async function legalRequiredNotice(){
    var card=await openFamily();if(!card)return;
    await renderLegalCard(false);
    var n=legalNode(card);if(n){try{n.scrollIntoView({behavior:"smooth",block:"center"})}catch(e){}message(n,"Confirma la autorización antes de continuar con Eterna.","error")}
  }

  function replay(el){if(!el)return;bypass.add(el);if(typeof queueMicrotask==="function")queueMicrotask(function(){try{el.click()}catch(e){}});else requestAnimationFrame(function(){try{el.click()}catch(e){}})}

  function purchaseModal(plan,sourceButton){
    injectStyles();var old=document.querySelector(".eternaLegalModalV16058");if(old)old.remove();
    var monthly=plan!=="annual",price=monthly?"7,99 € / mes":"79,99 € / año",label=monthly?"Contratar y pagar 7,99 €/mes":"Contratar y pagar 79,99 €/año";
    var modal=document.createElement("div");modal.className="eternaLegalModalV16058";modal.innerHTML='<section class="eternaLegalModalCardV16058" role="dialog" aria-modal="true" aria-label="Confirmar contratación"><h3>Antes de continuar al pago</h3><p>Revisa las condiciones principales de la suscripción.</p><div class="eternaLegalPurchaseV16058"><strong>'+price+'</strong><small>Suscripción recurrente hasta cancelación. Pago procesado por Stripe. Puedes gestionar futuras renovaciones desde Zona Familiar.</small><small>Con carácter general, la contratación a distancia dispone de un derecho de desistimiento de 14 días naturales, sujeto a las condiciones y excepciones legalmente aplicables.</small></div>'+legalLinks()+'<label class="eternaLegalV16058Check" style="margin-top:10px"><input type="checkbox" data-purchase-start><span>Solicito que el servicio de pago comience inmediatamente tras completarse el pago y confirmo que he recibido la información sobre desistimiento.</span></label><div class="eternaLegalModalActionsV16058"><button type="button" class="eternaLegalPayV16058" data-purchase-pay>'+label+'</button><button type="button" class="eternaLegalCancelV16058" data-purchase-cancel>Volver</button></div></section>';document.body.appendChild(modal);
    bindLegalCheckRows(modal);
    var cancel=modal.querySelector("[data-purchase-cancel]"),pay=modal.querySelector("[data-purchase-pay]"),start=modal.querySelector("[data-purchase-start]");cancel.onclick=function(){modal.remove()};modal.onclick=function(e){if(e.target===modal)modal.remove()};pay.onclick=async function(){if(!start.checked){start.closest("label").style.borderColor="#e4a08f";return}pay.disabled=true;try{var st=await legalState(false);if(st.backend_available){await postLegal({action:"purchase_ack",plan:plan,recurring_ack:true,withdrawal_info_ack:true,immediate_service_requested:true})}modal.remove();replay(sourceButton)}catch(e){pay.disabled=false;var card=modal.querySelector(".eternaLegalPurchaseV16058");if(card&&!card.querySelector("[data-purchase-error]")){var msg=document.createElement("small");msg.setAttribute("data-purchase-error","");msg.style.color="#a24436";msg.textContent="No se pudo registrar la información precontractual. Inténtalo de nuevo.";card.appendChild(msg)}}}
  }

  async function gateElement(el,kind){
    var st=await legalState(false);
    if(st.backend_available&&st.required&&!st.accepted){legalRequiredNotice();return}
    if(kind==="monthly"||kind==="annual"){purchaseModal(kind,el);return}
    replay(el)
  }

  function ensureSignupLegalNotice(){
    var login=document.querySelector("#cocoApp .loginCard,.loginCard");if(!login||login.querySelector(".cocoLegalSignupNoticeV16058"))return;
    var n=document.createElement("div");n.className="cocoLegalSignupNoticeV16058";n.innerHTML='Si el jugador es menor de 18 años, la cuenta debe crearla o autorizarla su padre, madre o tutor legal y utilizar un correo del adulto responsable. <a href="/privacidad-menores.html" target="_blank" rel="noopener">Privacidad para menores</a> · <a href="/terminos-y-condiciones.html" target="_blank" rel="noopener">Términos</a>';
    login.appendChild(n)
  }

  function installCapture(){
    if(document.documentElement.dataset.eternaLegalV16073==="1")return;document.documentElement.dataset.eternaLegalV16073="1";
    document.addEventListener("click",function(event){
      try{
        var el=event.target&&event.target.closest?event.target.closest("#eternaOverlayV159 [data-et-send],#eternaOverlayV159 [data-et-mic],#cocoApp [data-et-trial],#cocoApp [data-et-month],#cocoApp [data-et-year]"):null;
        if(!el)return;if(bypass.has(el)){bypass.delete(el);return}
        ensureChildLinks();
        event.preventDefault();event.stopImmediatePropagation();
        var kind=el.matches("[data-et-month]")?"monthly":el.matches("[data-et-year]")?"annual":el.matches("[data-et-trial]")?"trial":el.matches("[data-et-mic]")?"mic":"send";gateElement(el,kind)
      }catch(e){}
    },true);
    document.addEventListener("keydown",function(event){
      try{var input=event.target&&event.target.matches&&event.target.matches("#eternaOverlayV159 [data-et-input]")?event.target:null;if(!input||event.key!=="Enter"||event.shiftKey)return;var send=document.querySelector("#eternaOverlayV159 [data-et-send]");if(!send)return;event.preventDefault();event.stopImmediatePropagation();gateElement(send,"send")}catch(e){}
    },true);
    root.addEventListener("coco:family-card-ready",function(){renderLegalCard(false)},{passive:true});
    root.addEventListener("pageshow",function(){invalidate();ensureChildLinks();ensureSignupLegalNotice();if(familyCard())renderLegalCard(false)},{passive:true})
  }

  function ensureChildLinks(){
    var o=document.getElementById("eternaOverlayV159"),composer=o&&o.querySelector("[data-et-composer]");if(!composer||composer.querySelector(".eternaLegalChildLinksV16058"))return;
    var d=document.createElement("div");d.className="eternaLegalChildLinksV16058";d.innerHTML='<a href="/privacidad-menores.html" target="_blank" rel="noopener">Tu privacidad</a><a href="/informacion-ia-eterna.html" target="_blank" rel="noopener">Cómo funciona Eterna</a>';composer.appendChild(d)
  }

  function installFetchAwareness(){
    if(!originalFetch||root.fetch.__eternaLegal16058Wrapped)return;
    var wrapped=async function(input,init){var r=await originalFetch(input,init),url=typeof input==="string"?input:(input&&input.url)||"";if(/\/v1\/(chat|transcribe|speak|feedback|trial|checkout)(?:\?|$)/.test(url)&&r.status===403){try{var d=await r.clone().json();if(d&&d.error==="ETERNA_LEGAL_ACCEPTANCE_REQUIRED"){invalidate();legalRequiredNotice()}}catch(e){}}return r};wrapped.__eternaLegal16058Wrapped=true;root.fetch=wrapped
  }

  injectStyles();installFetchAwareness();installCapture();ensureChildLinks();ensureSignupLegalNotice();
  if(familyCard())renderLegalCard(false);
  root.ETERNA_LEGAL_SHIELD_V16058=Object.freeze({version:"160.74",legal_version:LEGAL_VERSION,refresh:function(){invalidate();return renderLegalCard(true)},render:renderLegalCard,ensureCanonicalLegalNode:ensureCanonicalLegalNode,gateMic:function(mic){gateElement(mic,"mic")},consumeBypass:function(el){if(!el||!bypass.has(el))return false;bypass.delete(el);return true},cloudflare_required:"160.11-final4",sql_required:false,no_global_observer:true,canonical_before_await:true,shared_legal_state_promise:true})
})(window);

window.ETERNA_RELEASE_V16059=Object.freeze({
  version:"160.59",
  ios_pwa_legal_checkbox_fix:true,
  whole_confirmation_row_tappable:true,
  purchase_ack_checkbox_fixed:true,
  legal_backend_unchanged:"160.4-legal1",
  sql_required:false,
  preserves_v16058_legal_registry:true,
  preserves_v16057_pedagogy_and_ux:true,
  extra_global_observer:false
});

window.ETERNA_RELEASE_V16060=Object.freeze({
  version:"160.60",
  premium_microphone_v2:true,
  ios_audio_context_priming:true,
  duplicate_tap_lock:true,
  adaptive_noise_floor:true,
  vad_hysteresis:true,
  short_noise_rejection:true,
  age_adaptive_pause_tolerance:true,
  transient_transcription_retry:true,
  mediarecorder_request_data_before_stop:true,
  graceful_background_interruption:true,
  manual_finish_fallback:true,
  legal_checkbox_fix_included:true,
  cloudflare_worker_unchanged:"160.4-legal1",
  sql_required:false,
  preserves_v16055_session_isolation:true,
  preserves_v16058_legal_registry:true,
  extra_global_observer:false
});

window.ETERNA_RELEASE_V16070=Object.freeze({version:"160.70",consolidated_controller:true,age_access_gate:false,age_pedagogy_only:true,course_setup_required:true,retryable_verification_ui:true,premium_microphone_v2_preserved:true,legal_checkbox_fix_preserved:true,worker_required:"160.7-launch3",sql_required:false,extra_global_observer:false});

/* ETERNA v160.70 · Zona Familiar consolidada en eterna-experience
 * Oculta el inicio independiente del trial mientras se comprueba o falta autorización.
 * Si la autorización está pendiente, la integra dentro de Acceso y planes.
 * El único CTA pendiente es “Autorizar y empezar prueba gratis”.
 * Cuando ya está autorizada, el inicio de trial vuelve a estar disponible y destacado.
 * Sin MutationObserver nuevo. No modifica Worker, Stripe, Supabase ni memoria pedagógica.
 */
(function(root){
  "use strict";
  if(root.__ETERNA_FAMILY_EMBEDDED_V16068__)return;
  root.__ETERNA_FAMILY_EMBEDDED_V16068__=true;

  var VERSION="160.83-family-premium-reporting";
  var subscriptionUiCache={uid:"",at:0,data:null,promise:null},learningReportCache={uid:"",at:0,model:null,promise:null};


  function clean(v){return String(v==null?"":v).replace(/\s+/g," ").trim()}
  function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[c]})}
  function capName(v){
    var s=clean(v);
    if(!s)return"Alumno Coco";
    return s.charAt(0).toLocaleUpperCase("es-ES")+s.slice(1)
  }
  function clamp01(n){n=Number(n);return isFinite(n)?Math.max(0,Math.min(1,n)):0}
  function percent(n){return Math.round(clamp01(n)*100)}
  function dateES(value){
    try{return new Intl.DateTimeFormat("es-ES",{day:"2-digit",month:"long",year:"numeric"}).format(value?new Date(value):new Date())}
    catch(e){return new Date().toLocaleDateString("es-ES")}
  }
  function strategyName(k){
    return({socratic_question:"preguntas guiadas",worked_example:"ejemplos similares",analogy:"analogías",visual_structure:"apoyo visual y estructura",retrieval_practice:"preguntas de recuerdo",step_by_step:"pasos cortos",error_analysis:"análisis de errores",direct_explanation:"explicación directa"})[k]||k
  }
  function endpoint(path){
    var c=root.COCO_CONFIG||{},base=String(c.eternaEndpoint||"").replace(/\/+$/,""),p=String(path||"");
    return base?base+(p.charAt(0)==="/"?p:"/"+p):""
  }
  function getClient(){
    if(root.__COCO_SUPABASE_CLIENT)return root.__COCO_SUPABASE_CLIENT;
    var c=root.COCO_CONFIG||{};
    if(root.supabase&&root.supabase.createClient&&c.url&&c.clave){
      try{return root.__COCO_SUPABASE_CLIENT=(root.supabase.createClient(c.url,c.clave,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}}))}catch(e){}
    }
    return null
  }
  async function getSession(){
    var c=getClient();if(!c||!c.auth)return null;
    try{var r=await c.auth.getSession();return r&&r.data?r.data.session:null}catch(e){return null}
  }
  async function api(path,options){
    var url=endpoint(path);if(!url)throw new Error("ETERNA_ENDPOINT_NOT_CONFIGURED");
    var s=await getSession(),headers=Object.assign({},options&&options.headers||{});
    if(s&&s.access_token)headers.Authorization="Bearer "+s.access_token;
    return fetch(url,Object.assign({},options||{},{headers:headers}))
  }

  function paymentJustSucceeded(){
    try{return new URLSearchParams(location.search).get("payment")==="success"}catch(e){return false}
  }
  function billingJustUpdated(){
    try{return new URLSearchParams(location.search).get("billing")==="updated"}catch(e){return false}
  }
  function planMeta(plan){
    plan=clean(plan).toLowerCase();
    if(plan==="monthly")return{key:"monthly",name:"Plan mensual",price:"7,99 € / mes"};
    if(plan==="annual")return{key:"annual",name:"Plan anual",price:"79,99 € / año"};
    if(plan==="tester")return{key:"tester",name:"Acceso de prueba",price:""};
    var label=plan?plan.charAt(0).toUpperCase()+plan.slice(1):"Eterna";
    return{key:plan||"unknown",name:"Plan "+label,price:""}
  }
  function activePaidSubscription(sub){return !!(sub&&String(sub.status||"")==="active"&&String(sub.provider||"")==="stripe")}
  function clearSubscriptionUiCache(){subscriptionUiCache={uid:"",at:0,data:null,promise:null}}
  async function readSubscriptionUi(force){
    var session=await getSession(),uid=session&&session.user&&session.user.id;if(!uid)return null;
    var now=Date.now();
    if(!force&&subscriptionUiCache.uid===uid&&subscriptionUiCache.at&&now-subscriptionUiCache.at<5000)return subscriptionUiCache.data;
    if(subscriptionUiCache.promise&&subscriptionUiCache.uid===uid)return subscriptionUiCache.promise;
    var c=getClient();if(!c)return null;
    subscriptionUiCache.uid=uid;
    subscriptionUiCache.promise=Promise.resolve(c.from("eterna_subscriptions").select("status,plan,provider,provider_customer_id,provider_subscription_id,current_period_end,cancel_at_period_end,trial_end,updated_at").eq("user_id",uid).maybeSingle()).then(function(r){
      if(r&&r.error)throw r.error;subscriptionUiCache.data=r&&r.data||null;subscriptionUiCache.at=Date.now();return subscriptionUiCache.data
    }).catch(function(){subscriptionUiCache.data=null;subscriptionUiCache.at=Date.now();return null}).finally(function(){subscriptionUiCache.promise=null});
    return subscriptionUiCache.promise
  }
  async function openSubscriptionPortal(button,flow,currentPlan){
    var switching=flow==="subscription_update",original=button&&button.textContent||(switching?"Cambiar plan":"Gestionar suscripción");
    if(button){button.disabled=true;button.textContent=switching?"Abriendo cambio…":"Abriendo gestión…"}
    try{
      if(switching&&currentPlan)try{sessionStorage.setItem("coco_eterna_plan_switch_from_v16080",String(currentPlan))}catch(e){}
      var r=await api("/v1/portal",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(switching?{flow:"subscription_update"}:{})}),data=await r.json().catch(function(){return{}});
      if(!r.ok||!data.url)throw new Error(data.error||"PORTAL");location.href=data.url
    }catch(e){
      if(button){button.disabled=false;button.textContent=original}
      alert(switching?"No se pudo abrir el cambio de plan. Comprueba que el cambio de plan esté habilitado en Stripe.":"No se pudo abrir la gestión de la suscripción.")
    }
  }
  function openEternaFromFamily(){
    var close=document.querySelector("#cocoApp .cocoFamilyV129 [data-family-close],#cocoApp .cocoFamilyV129>header button");if(close)try{close.click()}catch(e){}
    queueMicrotask(function(){try{if(root.CocoEternaV160&&typeof root.CocoEternaV160.open==="function")root.CocoEternaV160.open()}catch(e){}})
  }
  function currentPlanHtml(sub){
    var meta=planMeta(sub&&sub.plan),end=sub&&sub.current_period_end?dateES(sub.current_period_end):"",cancel=!!(sub&&sub.cancel_at_period_end);
    var statusLine=cancel?(end?"Cancelación programada · acceso hasta "+end:"Cancelación programada al final del periodo"):(end?"Próxima renovación: "+end:"Suscripción activa");
    var switchBlock="";
    if(sub&&sub.provider_customer_id&&sub.provider_subscription_id){
      switchBlock=meta.key==="monthly"
        ?'<div class="eternaV16079Alternative"><div><b>Ahorra con el plan anual</b><span>79,99 € / año. Stripe calculará el ajuste sobre esta misma suscripción.</span></div><button type="button" data-et-v16080-switch data-current-plan="monthly">Cambiar a plan anual</button></div>'
        :'<div class="eternaV16079Alternative"><div><b>¿Quieres cambiar de plan?</b><span>Consulta en Stripe los planes disponibles para esta misma suscripción.</span></div><button type="button" data-et-v16080-switch data-current-plan="'+esc(meta.key)+'">Ver planes disponibles</button></div>'
    }
    return '<div class="eternaV16079CurrentPlan" data-et-current-plan="'+esc(meta.key)+'"><div class="eternaV16079CurrentPlanHead"><div><span class="eternaV16079CurrentPlanLabel">TU PLAN ACTUAL</span><h5>'+esc(meta.name)+'</h5>'+(meta.price?'<strong class="eternaV16079CurrentPlanPrice">'+esc(meta.price)+'</strong>':"")+'</div></div><p class="eternaV16079CurrentPlanMeta">'+esc(statusLine)+'</p><div class="eternaV16079PlanActions"><button type="button" class="is-primary" data-et-v16079-open>Abrir Eterna</button>'+(sub&&sub.provider_customer_id?'<button type="button" class="is-secondary" data-et-v16079-manage>Gestionar suscripción</button>':"")+'</div>'+switchBlock+'</div>'
  }
  function bindSubscriptionUi(wrap){
    if(!wrap)return;wrap.querySelectorAll("[data-et-v16079-open]").forEach(function(b){if(b.dataset.boundV16079)return;b.dataset.boundV16079="1";b.onclick=openEternaFromFamily});
    wrap.querySelectorAll("[data-et-v16079-manage]").forEach(function(b){if(b.dataset.boundV16080Manage)return;b.dataset.boundV16080Manage="1";b.onclick=function(){openSubscriptionPortal(b,"manage","")}});
    wrap.querySelectorAll("[data-et-v16080-switch]").forEach(function(b){if(b.dataset.boundV16080Switch)return;b.dataset.boundV16080Switch="1";b.onclick=function(){openSubscriptionPortal(b,"subscription_update",b.dataset.currentPlan||"")}});
    var refresh=wrap.querySelector("[data-et-v16079-refresh]");if(refresh&&!refresh.dataset.boundV16079){refresh.dataset.boundV16079="1";refresh.onclick=function(){clearSubscriptionUiCache();refresh.disabled=true;refresh.textContent="Actualizando…";syncSubscriptionUi(wrap,true)}}
  }
  function renderPaidSubscription(wrap,sub){
    if(!wrap||!activePaidSubscription(sub))return false;
    wrap.querySelectorAll(".eternaV160TrialActive,.eternaV160UpgradeWrap,.eternaV16061TesterNote,.eternaV16079PaymentPending,.eternaV159Buttons").forEach(function(n){n.remove()});
    var old=wrap.querySelector(".eternaV16079CurrentPlan");if(old)old.remove();
    var head=wrap.querySelector(".eternaV16061SubscriptionHead"),holder=document.createElement("div");holder.innerHTML=currentPlanHtml(sub);
    if(head&&head.nextSibling)wrap.insertBefore(holder.firstChild,head.nextSibling);else wrap.appendChild(holder.firstChild);
    wrap.dataset.etPlanState="active";bindSubscriptionUi(wrap);
    try{var u=new URL(location.href),changed=false;if(u.searchParams.get("payment")==="success"){u.searchParams.delete("payment");changed=true}if(u.searchParams.get("billing")==="updated"){u.searchParams.delete("billing");changed=true;try{sessionStorage.removeItem("coco_eterna_plan_switch_from_v16080")}catch(_e){}}if(changed)history.replaceState(history.state,"",u.pathname+(u.searchParams.toString()?"?"+u.searchParams.toString():"")+u.hash)}catch(e){}
    return true
  }
  function renderPaymentPending(wrap){
    if(!wrap||wrap.querySelector(".eternaV16079PaymentPending"))return;
    var note=document.createElement("div");note.className="eternaV16079PaymentPending";note.innerHTML='<b>✓ Pago recibido por Stripe</b><span>Estamos actualizando el estado de tu suscripción. No vuelvas a contratar otro plan mientras se confirma.</span><button type="button" data-et-v16079-refresh>Actualizar estado</button>';
    var head=wrap.querySelector(".eternaV16061SubscriptionHead");if(head&&head.nextSibling)wrap.insertBefore(note,head.nextSibling);else wrap.appendChild(note);bindSubscriptionUi(wrap)
  }
  async function syncSubscriptionUi(wrap,force){
    if(!wrap)return;
    if(wrap.dataset.etSubscriptionSync==="loading"&&!force)return;wrap.dataset.etSubscriptionSync="loading";
    var sub=await readSubscriptionUi(!!force||billingJustUpdated());
    if(activePaidSubscription(sub)){renderPaidSubscription(wrap,sub)}else if(paymentJustSucceeded()){renderPaymentPending(wrap);wrap.dataset.etPlanState="confirming"}
    else wrap.dataset.etPlanState=sub&&sub.status||"unknown";
    wrap.dataset.etSubscriptionSync="done";bindSubscriptionUi(wrap)
  }

  function injectStyles(){
    if(document.getElementById("eterna-family-v16066-css"))return;
    var s=document.createElement("style");s.id="eterna-family-v16066-css";
    s.textContent=[
      "#cocoApp .eternaV16061SubscriptionTop{position:relative;margin:0 0 16px;padding:16px;border:2px solid #f0d09f;border-radius:20px;background:linear-gradient(180deg,#fffaf0,#fff5e5);box-shadow:0 4px 0 rgba(235,201,145,.38)}",
      "#cocoApp .eternaV16061SubscriptionTop.is-expired{padding:0;border:0;background:transparent;box-shadow:none}#cocoApp .eternaV16061SubscriptionTop.is-expired>.eternaV160ExpiredGate{margin:0 auto}",
      "#cocoApp .eternaV16061SubscriptionHead{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:10px}",
      "#cocoApp .eternaV16061SubscriptionHead span{display:inline-flex;padding:5px 9px;border-radius:999px;background:#ef6c05;color:#fff;font-size:9px;font-weight:900;letter-spacing:.07em}",
      "#cocoApp .eternaV16061SubscriptionHead h4{width:100%;margin:0;color:#173f59;font-size:20px;line-height:1.08}",
      "#cocoApp .eternaV16061SubscriptionHead p{margin:0;color:#6b7880;font-size:10px;font-weight:750;line-height:1.45}",
      "#cocoApp .eternaV16061SubscriptionTop>.eternaV160TrialActive,#cocoApp .eternaV16061SubscriptionTop>.eternaV160UpgradeWrap,#cocoApp .eternaV16061SubscriptionTop>.eternaV159Buttons{margin-left:0!important;margin-right:0!important}",
      "#cocoApp .eternaV16061TesterNote{margin:0 0 10px;padding:11px 13px;border:1px solid #ffd39d;border-radius:14px;background:#fff8e9;color:#173f59}",
      "#cocoApp .eternaV16061TesterNote b{display:block;font-size:13px}.eternaV16061TesterNote span{display:block;margin-top:3px;color:#6f7f88;font-size:10px;font-weight:750}",
      "#cocoApp .eternaV16079CurrentPlan{display:grid;gap:12px;margin:0 0 12px;padding:15px;border:1px solid #b9dec9;border-radius:16px;background:linear-gradient(180deg,#f4fcf7,#eef9f3);box-shadow:0 3px 0 rgba(139,201,166,.28)}",
      "#cocoApp .eternaV16079CurrentPlanHead{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap}",
      "#cocoApp .eternaV16079CurrentPlanLabel{display:inline-flex;padding:5px 9px;border-radius:999px;background:#20895a;color:#fff;font-size:9px;font-weight:950;letter-spacing:.06em}",
      "#cocoApp .eternaV16079CurrentPlan h5{margin:6px 0 2px;color:#173f59;font-size:20px;line-height:1.08}",
      "#cocoApp .eternaV16079CurrentPlanPrice{display:block;color:#20895a;font-size:13px;font-weight:950}",
      "#cocoApp .eternaV16079CurrentPlanMeta{margin:0;color:#607987;font-size:10px;font-weight:800;line-height:1.45}",
      "#cocoApp .eternaV16079PlanActions{display:flex;gap:8px;flex-wrap:wrap}",
      "#cocoApp .eternaV16079PlanActions button{min-height:42px;padding:9px 13px;border-radius:12px;font:900 10.5px inherit;cursor:pointer}",
      "#cocoApp .eternaV16079PlanActions .is-primary{border:0;background:#173f59;color:#fff;box-shadow:0 3px 0 #0e2b3e}",
      "#cocoApp .eternaV16079PlanActions .is-secondary{border:1px solid #bdd8e4;background:#fff;color:#2d6884;box-shadow:0 2px 0 rgba(180,211,224,.5)}",
      "#cocoApp .eternaV16079Alternative{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:12px 13px;border:1px solid #f0d09f;border-radius:14px;background:#fffaf0;color:#173f59}",
      "#cocoApp .eternaV16079Alternative b{display:block;font-size:12px}.eternaV16079Alternative span{display:block;margin-top:2px;color:#6b7880;font-size:9.5px;font-weight:750}",
      "#cocoApp .eternaV16079Alternative button{min-height:38px;padding:8px 11px;border:0;border-radius:10px;background:#ef6c05;color:#fff;font:900 9.5px inherit;cursor:pointer}",
      "#cocoApp .eternaV16079PaymentPending{margin:0 0 12px;padding:13px;border:1px solid #ffd39d;border-radius:14px;background:#fff8e9;color:#173f59}",
      "#cocoApp .eternaV16079PaymentPending b{display:block;font-size:12px}.eternaV16079PaymentPending span{display:block;margin:3px 0 8px;color:#6f7f88;font-size:9.5px;font-weight:750;line-height:1.4}.eternaV16079PaymentPending button{min-height:36px;padding:7px 10px;border:0;border-radius:10px;background:#173f59;color:#fff;font:900 9.5px inherit;cursor:pointer}",
      "#cocoApp .eternaLegalV16058[data-et-family-legal-end='1']{margin-top:18px!important}",
      "#cocoApp .eternaV16061SubscriptionTop .eternaLegalV16058[data-et-family-legal-inline='1']{margin:12px 0!important;background:#fff!important;border-color:#cfe3ec!important;box-shadow:0 2px 0 rgba(200,220,230,.42)!important}",
      "#cocoApp .eternaV16061SubscriptionTop .eternaLegalV16058[data-et-family-legal-inline='1'] .eternaLegalV16058Head h4{font-size:17px!important}",
      "#cocoApp .eternaV16061SubscriptionTop [data-et-trial][data-hidden-by-legal='1']{display:none!important}",
      "#cocoApp .eternaV16061SubscriptionTop[data-et-legal-state='checking'] [data-et-trial],#cocoApp .eternaV16061SubscriptionTop[data-et-legal-state='pending'] [data-et-trial]{display:none!important}",
      "#cocoApp .eternaV16061SubscriptionTop [data-et-trial]{min-height:54px!important;padding:12px 20px!important;border:0!important;border-radius:14px!important;background:linear-gradient(180deg,#f47b12,#e66408)!important;color:#fff!important;font-weight:950!important;font-size:12px!important;box-shadow:0 4px 0 #b64e05,0 10px 22px rgba(230,100,8,.18)!important;cursor:pointer!important}",
      "#cocoApp .eternaV16061SubscriptionTop [data-et-trial]:hover{transform:translateY(-1px)!important;filter:brightness(1.03)!important}",
      "#cocoApp .eternaV16061SubscriptionTop .eternaLegalV16058[data-et-family-legal-inline='1'] [data-legal-accept]{min-height:56px!important;padding:12px 18px!important;border:0!important;border-radius:14px!important;background:linear-gradient(180deg,#f47b12,#e66408)!important;color:#fff!important;font-weight:950!important;font-size:12px!important;box-shadow:0 4px 0 #b64e05,0 10px 22px rgba(230,100,8,.18)!important;cursor:pointer!important}",
      "#cocoApp .eternaV16066LegalChecking{margin:10px 0;padding:11px 13px;border:1px solid #d6e8ef;border-radius:13px;background:#f7fbfd;color:#5f7a88;font-size:10px;font-weight:800;line-height:1.4}",

      "#cocoApp .eternaV159FamilyStatus[data-et-v16081-beta='1']{background:#eaf8f1!important;color:#315f4b!important;border:1px solid #ccebdc!important;padding:6px 10px!important;border-radius:999px!important;font-size:9px!important;font-weight:900!important;letter-spacing:.02em!important}",
      "#cocoApp .eternaV16081LearningMapBlock,#cocoApp .eternaV16081GameMapBlock{position:relative!important;overflow:hidden!important;margin-top:18px!important;border:1px solid #d8e9f1!important;border-radius:22px!important;background:linear-gradient(145deg,#fbfdff 0%,#f4fbfe 58%,#fffaf5 100%)!important;box-shadow:0 10px 26px rgba(23,63,89,.08)!important}",
      "#cocoApp .eternaV16081GameMapBlock{padding:18px!important;box-sizing:border-box!important}",
      "#cocoApp .eternaV16081GameMapBlock:before{content:\"\";position:absolute;right:-70px;top:-80px;width:190px;height:190px;border-radius:50%;background:radial-gradient(circle,rgba(239,108,5,.10),rgba(239,108,5,0) 70%);pointer-events:none}",
      "#cocoApp .eternaV16081MapIdentity{position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:0 0 14px;padding:0 0 12px;border-bottom:1px solid rgba(23,63,89,.10)}",
      "#cocoApp .eternaV16081MapIdentity span{display:inline-flex;align-items:center;min-height:28px;padding:5px 10px;border-radius:999px;background:#0f5677;color:#fff!important;font-size:9px;font-weight:950;letter-spacing:.075em;text-transform:uppercase}",
      "#cocoApp .eternaV16081MapIdentity.is-games span{background:#ef6c05}",
      "#cocoApp .eternaV16081MapIdentity small{display:block;flex:1 1 280px;color:#617985!important;font-size:10px;font-weight:800;line-height:1.42}",
      "#cocoApp .eternaV16081GameMapBlock h2,#cocoApp .eternaV16081GameMapBlock h3,#cocoApp .eternaV16081GameMapBlock h4{position:relative;z-index:1;color:#173f59!important;font-family:var(--display,inherit)!important;line-height:1.08!important}",
      "#cocoApp .eternaV16081LearningMapBlock .eternaV160ProgressHead>b{font-size:24px!important}",
      "#cocoApp .eternaV16081GameMapBlock[data-et-v16081-games-map='1']{scroll-margin-top:18px}",
      "@media(max-width:640px){#cocoApp .eternaV16081MapIdentity{align-items:flex-start}#cocoApp .eternaV16081MapIdentity small{flex-basis:100%}#cocoApp .eternaV16081GameMapBlock{padding:14px!important}#cocoApp .eternaV16081LearningMapBlock .eternaV160ProgressHead>b{font-size:21px!important}}",
      "@media(max-width:640px){#cocoApp .eternaV16061SubscriptionTop{padding:13px;border-radius:18px}}"
    ].join("");
    document.head.appendChild(s)
  }

  function familyCard(){return document.querySelector("#cocoApp .eternaV159FamilyCard")}

  function directChildren(card,className){
    return Array.prototype.filter.call(card&&card.children||[],function(n){return n.classList&&n.classList.contains(className)})
  }

  async function checkout(plan,button){
    var original=button.textContent;
    button.disabled=true;button.textContent="Abriendo pago…";
    try{
      var r=await api("/v1/checkout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({plan:plan})});
      var data=await r.json().catch(function(){return{}});
      if(!r.ok)throw new Error(data.error||"CHECKOUT");
      if(!data.url)throw new Error("CHECKOUT_URL");
      location.href=data.url
    }catch(e){
      button.disabled=false;button.textContent=original;
      alert("No se pudo abrir la pasarela de pago. Inténtalo de nuevo.")
    }
  }

  function bindCreatedPlanButtons(rootNode){
    if(!rootNode)return;
    var m=rootNode.querySelector("[data-et-month][data-v16061-created]");
    var y=rootNode.querySelector("[data-et-year][data-v16061-created]");
    if(m&&!m.dataset.boundV16061){m.dataset.boundV16061="1";m.onclick=function(){checkout("monthly",m)}}
    if(y&&!y.dataset.boundV16061){y.dataset.boundV16061="1";y.onclick=function(){checkout("annual",y)}}
  }

  function createTesterPlans(){
    var frag=document.createElement("div");
    frag.innerHTML=
      '<div class="eternaV16061TesterNote"><b>⭐ Acceso de prueba activo</b><span>Puedes contratar Eterna en cualquier momento desde Zona Familiar.</span></div>'+
      '<div class="eternaV160UpgradeWrap"><div class="eternaV160UpgradeHead"><div><b>Elige tu plan cuando quieras</b><span>La suscripción se activa al completar el pago. Pago procesado por Stripe.</span></div></div>'+
        '<div class="eternaV160PaidGrid">'+
          '<article class="eternaV160PaidPlan"><b>Plan mensual</b><strong>7,99 € <small>/mes</small></strong><span>Flexibilidad mes a mes.</span><button type="button" data-et-month data-v16061-created="1">Contratar mensual</button></article>'+
          '<article class="eternaV160PaidPlan is-annual"><span class="badge">Ahorra aprox. 17%</span><b>Plan anual</b><strong>79,99 € <small>/año</small></strong><span>12 meses con el mejor precio.</span><button type="button" data-et-year data-v16061-created="1">Contratar anual</button></article>'+
        '</div>'+
      '</div>';
    return frag
  }

  function moveSubscriptionFirst(card){
    if(!card)return false;
    var existing=directChildren(card,"eternaV16061SubscriptionTop")[0];
    var expired=directChildren(card,"eternaV160ExpiredGate")[0]||null;
    if(expired){
      if(existing)existing.remove();
      var expiredWrap=document.createElement("section");
      expiredWrap.className="eternaV16061SubscriptionTop is-expired";
      expiredWrap.setAttribute("aria-label","Planes de Eterna");
      expiredWrap.dataset.etPlanState="expired";
      card.insertBefore(expiredWrap,card.firstChild);
      expiredWrap.appendChild(expired);
      return true
    }
    if(existing){bindCreatedPlanButtons(existing);syncSubscriptionUi(existing,false);return true}

    var status=card.querySelector(".eternaV159FamilyStatus"),statusText=clean(status&&status.textContent).toLowerCase();
    var trial=directChildren(card,"eternaV160TrialActive")[0]||null;
    var upgrade=directChildren(card,"eternaV160UpgradeWrap")[0]||null;
    var paidButtons=directChildren(card,"eternaV159Buttons").filter(function(n){
      return !!n.querySelector("[data-et-open],[data-et-portal]")
    })[0]||null;

    var wrap=document.createElement("section");
    wrap.className="eternaV16061SubscriptionTop";
    wrap.setAttribute("aria-label","Suscripción Eterna");
    wrap.dataset.etLegalState="checking";
    wrap.innerHTML='<div class="eternaV16061SubscriptionHead"><span>SUSCRIPCIÓN ETERNA</span><h4>Acceso y planes</h4><p>La suscripción y su gestión están siempre disponibles al entrar en Zona Familiar.</p></div>';

    if(trial)wrap.appendChild(trial);
    if(upgrade)wrap.appendChild(upgrade);

    if(!trial&&!upgrade&&/beta de prueba/.test(statusText)){
      var tester=createTesterPlans();
      while(tester.firstChild)wrap.appendChild(tester.firstChild)
    }else if(!trial&&!upgrade&&paidButtons){
      var note=document.createElement("div");note.className="eternaV16061TesterNote";
      note.innerHTML="<b>✓ Suscripción activa</b><span>Puedes abrir Eterna o gestionar tu suscripción desde aquí.</span>";
      wrap.appendChild(note);wrap.appendChild(paidButtons)
    }else if(!trial&&!upgrade&&!paidButtons&&status&&status.classList.contains("active")){
      var active=document.createElement("div");active.className="eternaV16061TesterNote";
      active.innerHTML="<b>✓ Acceso activo</b><span>Tu acceso a Eterna está activo.</span>";wrap.appendChild(active)
    }

    card.insertBefore(wrap,card.firstChild);
    bindCreatedPlanButtons(wrap);
    syncSubscriptionUi(wrap,false);
    return true
  }

  function legalCheckingNote(subscription,show){
    if(!subscription)return;
    var note=subscription.querySelector(".eternaV16066LegalChecking");
    if(show&&!note){
      note=document.createElement("div");
      note.className="eternaV16066LegalChecking";
      note.textContent="Comprobando la autorización necesaria para comenzar la prueba…";
      var upgrade=subscription.querySelector(".eternaV160UpgradeWrap");
      subscription.insertBefore(note,upgrade||null)
    }else if(!show&&note)note.remove()
  }

  function placeLegal(card){
    if(!card)return false;
    var subscription=card.querySelector(".eternaV16061SubscriptionTop");
    var trialButton=subscription&&subscription.querySelector("[data-et-trial]");
    var keep=card.querySelector(".eternaLegalV16058[data-et-legal-canonical='1']");

    if(!keep){
      if(subscription){
        subscription.dataset.etLegalState="checking";
        legalCheckingNote(subscription,true)
      }
      return false
    }

    legalCheckingNote(subscription,false);

    if(!keep.classList.contains("is-ok")&&subscription){
      subscription.dataset.etLegalState="pending";
      keep.dataset.etFamilyLegalInline="1";
      keep.removeAttribute("data-et-family-legal-end");

      var upgrade=subscription.querySelector(".eternaV160UpgradeWrap");
      subscription.insertBefore(keep,upgrade||null);

      var accept=keep.querySelector("[data-legal-accept]");
      if(accept){
        accept.textContent="Autorizar y empezar prueba gratis";
        accept.setAttribute("aria-label","Autorizar Eterna y empezar la prueba gratuita de 7 días")
      }

      if(trialButton){
        trialButton.dataset.hiddenByLegal="1";
        trialButton.setAttribute("aria-hidden","true")
      }
    }else{
      if(subscription)subscription.dataset.etLegalState="accepted";
      keep.removeAttribute("data-et-family-legal-inline");
      keep.dataset.etFamilyLegalEnd="1";
      card.appendChild(keep);

      if(trialButton&&trialButton.dataset.hiddenByLegal==="1"){
        delete trialButton.dataset.hiddenByLegal;
        trialButton.removeAttribute("aria-hidden")
      }
      if(trialButton)trialButton.textContent="Empezar prueba gratis · 7 días"
    }
    return true
  }


  function normalizeFamilyBetaLabel(card){
    var status=card&&card.querySelector(".eternaV159FamilyStatus");
    if(!status)return;
    if(/beta\s+de\s+prueba/i.test(clean(status.textContent))){
      status.textContent="Versión beta";
      status.dataset.etV16081Beta="1"
    }
  }

  function removeDuplicateFamilyCommercialActions(card){
    if(!card)return;
    Array.prototype.slice.call(card.querySelectorAll(".eternaV159Buttons")).forEach(function(group){
      if(group.closest&&group.closest(".eternaV16061SubscriptionTop"))return;
      if(group.querySelector("[data-et-open],[data-et-portal]"))group.remove()
    })
  }

  function clarifyFamilyHeader(card){
    var modal=card&&card.closest?card.closest(".cocoFamilyV129Backdrop"):null;
    if(!modal)modal=document.querySelector("#cocoApp .cocoFamilyV129Backdrop,.cocoFamilyV129Backdrop");
    if(!modal)return null;
    var shell=modal.querySelector(".cocoFamilyV129")||modal;
    var header=shell.querySelector(":scope > header")||shell.querySelector("header");
    if(header){
      Array.prototype.slice.call(header.querySelectorAll("p,small")).some(function(node){
        var text=norm(node.textContent);
        if(text.indexOf("dos lecturas distintas")>=0||text.indexOf("eterna resume la ayuda escolar")>=0){
          node.textContent="Dos mapas complementarios: aprendizaje escolar con Eterna y entrenamiento cognitivo con Coco.";
          return true
        }
        return false
      })
    }
    return modal
  }

  function ensureMapIdentity(block,type,label,description){
    if(!block)return;
    var key="map-"+type,existing=block.querySelector("[data-et-v16081-map='"+key+"']");
    if(existing)return existing;
    var identity=document.createElement("div");
    identity.className="eternaV16081MapIdentity"+(type==="games"?" is-games":" is-learning");
    identity.dataset.etV16081Map=key;
    identity.innerHTML="<span>"+esc(label)+"</span><small>"+esc(description)+"</small>";
    var head=block.querySelector(".eternaV160ProgressHead,h2,h3,h4,h5");
    if(head)block.insertBefore(identity,head);else block.insertBefore(identity,block.firstChild);
    return identity
  }

  function enhanceLearningMapIdentity(card){
    var panel=card&&card.querySelector(".eternaV160StrengthMap,.eternaV160ProgressPanel");
    if(!panel)return false;
    if(panel.dataset.etPremiumReport==="16083")return true;
    panel.classList.add("eternaV16081LearningMapBlock");
    var head=panel.querySelector(".eternaV160ProgressHead");
    if(head){
      var title=head.querySelector("b,h2,h3,h4");
      if(title)title.textContent="Mapa de fortalezas del aprendizaje"
    }
    ensureMapIdentity(
      panel,
      "learning",
      "APRENDIZAJE · ETERNA",
      "Tareas, explicaciones, práctica y exámenes: señales académicas que evolucionan con el alumno."
    );
    return true
  }

  function gameStrengthHeading(modal,card){
    if(!modal)return null;
    var list=Array.prototype.slice.call(modal.querySelectorAll("h2,h3,h4,h5,b,strong"));
    for(var i=0;i<list.length;i++){
      var node=list[i];
      if(card&&card.contains(node))continue;
      if(node.closest&&node.closest("header"))continue;
      var text=norm(node.textContent);
      if(text==="progreso y fortalezas")continue;
      if(text.indexOf("mapa de fortalezas")>=0)return node;
      if(text.indexOf("fortalezas")>=0&&(text.indexOf("juegos")>=0||text.indexOf("mente")>=0))return node
    }
    return null
  }

  function gameStrengthBlock(heading,modal){
    if(!heading)return null;
    var known=heading.closest("section,article,.caja,.cocoFamilySection,.cocoFamilyPanel,.cocoStrengthMap,.cocoFamilyStrengths,.mapaFortalezas");
    if(known)return known;
    var node=heading.parentElement,last=node,steps=0;
    while(node&&node!==modal&&steps<4){
      last=node;
      if(node.querySelectorAll&&node.querySelectorAll("[role='progressbar'],progress,.barra,.cocoFortaleza,.fortaleza").length>=2)return node;
      node=node.parentElement;steps++
    }
    return last
  }

  function enhanceGamesStrengthMap(modal,card){
    var heading=gameStrengthHeading(modal,card);
    if(!heading)return false;
    heading.textContent="Mapa de fortalezas de juegos para la mente";
    var block=gameStrengthBlock(heading,modal);
    if(!block)return false;
    block.classList.add("eternaV16081GameMapBlock");
    block.dataset.etV16081GamesMap="1";
    ensureMapIdentity(
      block,
      "games",
      "JUEGOS PARA LA MENTE · COCO",
      "Memoria, atención, cálculo, lógica y lenguaje a partir del entrenamiento cognitivo de Coco."
    );
    return true
  }

  function enhanceFamilyInformationArchitecture(card){
    if(!card)return false;
    removeDuplicateFamilyCommercialActions(card);
    normalizeFamilyBetaLabel(card);
    var modal=clarifyFamilyHeader(card);
    enhanceLearningMapIdentity(card);
    enhanceGamesStrengthMap(modal,card);
    return true
  }

  function applyFamilyLayout(){
    injectStyles();
    var card=familyCard();if(!card)return false;
    moveSubscriptionFirst(card);
    var legalReady=placeLegal(card);
    try{if(root.ETERNA_EXPERIENCE_V16049&&typeof root.ETERNA_EXPERIENCE_V16049.enhanceFamilyProgress==="function")root.ETERNA_EXPERIENCE_V16049.enhanceFamilyProgress()}catch(e){}
    enhanceFamilyInformationArchitecture(card);
    syncLearningPremiumReport(false).catch(function(){});
    if(legalReady){
      try{performance.mark("family_ui_ready")}catch(e){}
      try{root.dispatchEvent(new CustomEvent("coco:family-ui-ready",{detail:{card:card}}))}catch(e){}
    }
    return true
  }

  function scheduleFamilyLayout(){
    return applyFamilyLayout()
  }

  function clearLearningReportCache(){learningReportCache={uid:"",at:0,model:null,promise:null}}
  function uniqueStrings(values){var seen=Object.create(null),out=[];(values||[]).forEach(function(v){v=clean(v);if(v&&!seen[v]){seen[v]=1;out.push(v)}});return out}
  function recentUsageDays(usage){var now=Date.now(),cut=now-6*86400000,seen=Object.create(null);(usage||[]).forEach(function(row){var raw=row&& (row.usage_date||row.created_at||row.updated_at),d=raw?new Date(raw):null;if(d&&!isNaN(d.getTime())&&d.getTime()>=cut){var key=d.toISOString().slice(0,10);seen[key]=1}});return Object.keys(seen).length}
  function learningSupportName(session,profileRow){if(profileRow&&profileRow.apodo)return capName(profileRow.apodo);if(session&&session.user&&session.user.user_metadata&&session.user.user_metadata.apodo)return capName(session.user.user_metadata.apodo);return"Alumno Coco"}

  function buildLearningReportModel(exportData,name){
    exportData=exportData||{};var concepts=(Array.isArray(exportData.student_concept_memory)?exportData.student_concept_memory:[]).filter(function(x){return x&&clean(x.concept_label)}),observed=concepts.filter(function(x){return Number(x.attempts||0)>0}),strongest=observed.slice().sort(function(a,b){return Number(b.mastery_score||0)-Number(a.mastery_score||0)}).slice(0,3),reinforce=observed.slice().sort(function(a,b){return Number(a.mastery_score||0)-Number(b.mastery_score||0)}).slice(0,3),strategies=(Array.isArray(exportData.learning_strategy_memory)?exportData.learning_strategy_memory:[]).filter(function(x){return x&&clean(x.strategy_key)&&Number(x.evidence_count||0)>0}).sort(function(a,b){var ds=Number(b.success_score||0)-Number(a.success_score||0);return Math.abs(ds)>.001?ds:Number(b.evidence_count||0)-Number(a.evidence_count||0)}).slice(0,3),profile=exportData.student_profile||{},subjects=uniqueStrings(concepts.map(function(x){return x.subject})),attemptRows=Array.isArray(exportData.attempts)?exportData.attempts:[],attempts=attemptRows.length||concepts.reduce(function(sum,x){return sum+Number(x.attempts||0)},0),errors=concepts.reduce(function(sum,x){return sum+Number(x.errors||0)},0),partials=concepts.reduce(function(sum,x){return sum+Number(x.partials||0)},0),independent=concepts.reduce(function(sum,x){return sum+Number(x.independent_successes||0)},0),assisted=concepts.reduce(function(sum,x){return sum+Number(x.assisted_successes||0)},0),activeDays=recentUsageDays(exportData.usage||[]),lead=strongest[0]||null,next=reinforce[0]||null;
    var barSource=observed.slice().sort(function(a,b){return Number(b.attempts||0)-Number(a.attempts||0)}).slice(0,6);
    var bars=barSource.map(function(x){return{label:clean(x.concept_label),sublabel:clean(x.subject)||"Aprendizaje",value:percent(x.mastery_score),detail:Number(x.attempts||0)+" señales observadas"}});
    var panels=[
      {tone:"strength",icon:"★",eyebrow:"TUS FORTALEZAS",title:"Lo que parece estar más consolidado",text:"Según las actividades realizadas hasta ahora.",items:strongest.map(function(x){return{label:clean(x.concept_label),detail:clean(x.subject)||"Aprendizaje",percent:percent(x.mastery_score)}})},
      {tone:"reinforce",icon:"↗",eyebrow:"VAMOS A REFORZAR",title:"Áreas sugeridas para seguir practicando",text:"Son señales de práctica, no etiquetas permanentes.",items:reinforce.map(function(x){return{label:clean(x.concept_label),detail:(clean(x.subject)||"Aprendizaje")+" · "+Number(x.attempts||0)+" intentos",percent:percent(x.mastery_score)}})},
      {tone:"strategy",icon:"💡",eyebrow:"ASÍ PARECE AYUDARLE MÁS",title:"Estrategias que están funcionando",text:"Eterna seguirá ajustando la forma de explicar según la evidencia acumulada.",items:strategies.map(function(x){var score=Number(x.success_score);return{label:strategyName(x.strategy_key),detail:Number(x.evidence_count||0)+" evidencias",percent:isFinite(score)?percent(score):null}})},
      {tone:"activity",icon:"◎",eyebrow:"TU RECORRIDO",title:"Actividad observada",items:[{label:"Aciertos con poca ayuda",value:independent},{label:"Aciertos con apoyo",value:assisted},{label:"Errores registrados",value:errors},{label:"Respuestas parciales",value:partials}]}
    ];
    return{theme:"learning",eyebrow:"APRENDIZAJE · ETERNA",title:"Mapa de fortalezas del aprendizaje",subtitle:"Tareas, explicaciones, preguntas escolares, práctica y preparación de exámenes: una lectura visual de las señales académicas observadas.",personName:capName(name||"Alumno Coco"),personMeta:[profile.school_year||"Curso no indicado",profile.autonomous_community||""].filter(Boolean).join(" · "),hero:{eyebrow:"FORTALEZA DESTACADA",title:lead?"Fortaleza destacada: "+clean(lead.concept_label):"Tu mapa de aprendizaje está empezando",text:lead?"Según las actividades realizadas, esta es la señal de dominio más alta observada hasta ahora. Puede cambiar con nueva práctica.":"Eterna irá completando este mapa a medida que haya más actividades escolares.",percent:lead?percent(lead.mastery_score):null},metrics:[{value:concepts.length,label:"conceptos con señales"},{value:attempts,label:"intentos o señales"},{value:subjects.length,label:"materias trabajadas"},{value:activeDays+"/7",label:"días activos esta semana"}],bars:bars,barEyebrow:"CONCEPTOS OBSERVADOS",barTitle:"Progreso por conceptos",barScale:"Dominio aproximado · 0–100",panels:panels,groups:subjects.length?[{title:"Materias trabajadas",items:subjects}]:[],groupEyebrow:"CONTEXTO ESCOLAR",groupTitle:"Dónde se están generando señales",nextStep:{eyebrow:"PRÓXIMO PASO",title:next?"Reforzar: "+clean(next.concept_label):"Seguir creando señales variadas",text:next?"Una buena próxima práctica sería trabajar este concepto con pasos cortos y una comprobación al final.":"Realiza actividades variadas para que Eterna pueda distinguir fortalezas y áreas para reforzar con más fundamento."},note:"Informe pedagógico y orientativo. Expresa señales observadas según las actividades realizadas hasta ahora; no clasifica al alumno ni describe de forma permanente su manera de aprender."}
  }

  async function getLearningReportModel(force){
    var session=await getSession(),uid=session&&session.user&&session.user.id;if(!uid)return null;var now=Date.now();if(!force&&learningReportCache.uid===uid&&learningReportCache.model&&now-learningReportCache.at<15000)return learningReportCache.model;if(learningReportCache.promise&&learningReportCache.uid===uid)return learningReportCache.promise;learningReportCache.uid=uid;learningReportCache.promise=(async function(){var c=getClient(),both=await Promise.all([api("/v1/export",{method:"GET"}),c?c.from("perfiles").select("apodo").eq("id",uid).maybeSingle():Promise.resolve({data:null})]),r=both[0],profileRow=both[1]&&both[1].data||null,d=await r.json().catch(function(){return{}});if(!r.ok)throw new Error(d.error||"EXPORT");var model=buildLearningReportModel(d,learningSupportName(session,profileRow));learningReportCache.model=model;learningReportCache.at=Date.now();return model})().catch(function(){return null}).finally(function(){learningReportCache.promise=null});return learningReportCache.promise
  }

  function renderLearningPremiumPanel(model){
    var kit=root.CocoFamilyReportKitV16083,panel=document.querySelector("#cocoApp .eternaV159FamilyCard .eternaV160ProgressPanel");if(!kit||!panel||!model)return false;var sig=kit.signature(model);if(panel.dataset.etPremiumReport==="16083"&&panel.dataset.etPremiumSignature===sig)return true;panel.dataset.etPremiumReport="16083";panel.dataset.etPremiumSignature=sig;panel.classList.add("eternaV160StrengthMap");panel.innerHTML=kit.coreHtml(model)+'<div class="cocoV16083InlineActions"><button type="button" data-et-export>Exportar informe</button><button type="button" data-et-learning-whatsapp data-report-share>Compartir por WhatsApp</button></div>';return true
  }
  async function syncLearningPremiumReport(force){var model=await getLearningReportModel(!!force);if(model)renderLearningPremiumPanel(model);return model}
  async function exportReport(button){var kit=root.CocoFamilyReportKitV16083;if(!kit){alert("El generador visual todavía no está listo.");return}var model=await getLearningReportModel(false);if(!model){alert("No se pudo preparar el informe de progreso de Eterna.");return}return kit.export(model,button)}
  async function shareLearningReport(button){var kit=root.CocoFamilyReportKitV16083;if(!kit){alert("El generador visual todavía no está listo.");return}var model=await getLearningReportModel(false);if(!model){alert("No se pudo preparar el informe de progreso de Eterna.");return}return kit.share(model,button)}

  function install(){
    injectStyles();
    document.addEventListener("click",function(event){
      var target=event.target&&event.target.closest?event.target.closest("[data-et-export],[data-et-learning-whatsapp]"):null;
      if(target){
        event.preventDefault();event.stopImmediatePropagation();
        if(target.matches("[data-et-learning-whatsapp]"))shareLearningReport(target);else exportReport(target)
      }
    },true);
    root.addEventListener("coco:family-card-ready",applyFamilyLayout,{passive:true});
    root.addEventListener("coco:family-legal-ready",applyFamilyLayout,{passive:true});
    root.ETERNA_FAMILY_V16070=root.ETERNA_FAMILY_V16069=root.ETERNA_FAMILY_V16068=Object.freeze({
      version:VERSION,
      subscription_first:true,
      canonical_legal_node:true,
      legal_dedupe:false,
      family_polling:false,
      capitalized_report_name:true,
      performance_optimized:true,
      pending_legal_inline_with_trial:true,
      trial_hidden_while_legal_checking:true,
      trial_button_hidden_until_authorized:true,
      prominent_trial_cta:true,
      premium_visual_reports_v16083:true,
      shared_report_model_v16083:true,
      refresh:applyFamilyLayout,
      schedule:scheduleFamilyLayout,
      extra_mutation_observer:false,
      worker_required:"160.13-plan-switch1"
    })
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});else install()
})(window);



/* ETERNA v160.70 · STATE MACHINE DE LANZAMIENTO
 * Sustituye la cadena externa onboarding/family para el funnel Eterna.
 * Estados: SIN_CUENTA → EMAIL_PENDIENTE → EMAIL_CONFIRMADO → PIN → LEGAL → TRIAL → CURSO → LISTA.
 * No usa polling global ni MutationObserver global.
 */
(function(root){
  "use strict";
  if(root.__ETERNA_LAUNCH_STATE_V16070__)return;root.__ETERNA_LAUNCH_STATE_V16070__=true;
  var INTENT="coco_eterna_launch_intent_v16068",PINPASS="coco_eterna_pin_pass_v16068",SCHOOL="coco_eterna_school_v16068",LAST_UID="coco_eterna_last_uid_v16068";
  var INTENT_TTL=24*60*60*1000,currentModal=null,running=false,authPatched=false;
  var CCAA=["Andalucía","Aragón","Asturias","Illes Balears","Canarias","Cantabria","Castilla-La Mancha","Castilla y León","Cataluña","Comunitat Valenciana","Extremadura","Galicia","Comunidad de Madrid","Región de Murcia","Navarra","País Vasco","La Rioja","Ceuta","Melilla"];
  var YEARS={infantil:["Infantil · 3 años","Infantil · 4 años","Infantil · 5 años"],primaria:["1º de Primaria","2º de Primaria","3º de Primaria","4º de Primaria","5º de Primaria","6º de Primaria"],eso:["1º de ESO","2º de ESO","3º de ESO","4º de ESO"],bachillerato:["1º de Bachillerato","2º de Bachillerato"]};
  function clean(v){return String(v==null?"":v).replace(/\s+/g," ").trim()}
  function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[c]})}
  function cfg(){return root.COCO_CONFIG||{}}
  function endpoint(p){var b=String(cfg().eternaEndpoint||"").replace(/\/+$/,"");return b?b+(String(p).charAt(0)==="/"?p:"/"+p):""}
  function client(){if(root.__COCO_SUPABASE_CLIENT)return root.__COCO_SUPABASE_CLIENT;var c=cfg();try{if(root.supabase&&root.supabase.createClient&&c.url&&c.clave)return root.__COCO_SUPABASE_CLIENT=root.supabase.createClient(c.url,c.clave,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}})}catch(e){}return null}
  async function session(){var c=client();if(!c)return null;try{var r=await c.auth.getSession();return r&&r.data&&r.data.session||null}catch(e){return null}}
  function setIntent(source){try{localStorage.setItem(INTENT,JSON.stringify({at:Date.now(),source:source||"web"}));localStorage.removeItem("coco_eterna_resume_after_auth_v1603")}catch(e){}}
  function goCreateAccount(){try{if(root.CocoEternaV160&&typeof root.CocoEternaV160.close==="function")root.CocoEternaV160.close()}catch(e){}var area=document.querySelector("#cocoApp .loginCard")||document.getElementById("cocoApp");if(!area)return false;var controls=area.querySelectorAll("button,a,[role='button']");for(var i=0;i<controls.length;i++){if(/^crear\s+cuenta$/i.test(clean(controls[i].textContent))){try{controls[i].click();return true}catch(e){}}}return false}
  function intent(){try{var d=JSON.parse(localStorage.getItem(INTENT)||"null");if(!d||!d.at||Date.now()-d.at>INTENT_TTL){localStorage.removeItem(INTENT);return null}return d}catch(e){return null}}
  function pinPassKey(uid){return PINPASS+":"+String(uid||"")}
  function syncUserBoundary(s){var uid=s&&s.user&&s.user.id?String(s.user.id):"";if(!uid)return;try{var prev=localStorage.getItem(LAST_UID)||"";if(prev&&prev!==uid)localStorage.removeItem("coco_pin_familia");localStorage.setItem(LAST_UID,uid)}catch(e){}}
  function clearIntent(){try{localStorage.removeItem(INTENT);localStorage.removeItem("coco_eterna_resume_after_auth_v1603")}catch(e){}}
  function emailVerified(s){var u=s&&s.user;return !!(u&&(u.email_confirmed_at||u.confirmed_at||u.user_metadata&&u.user_metadata.email_verified===true))}
  function maskEmail(v){var p=String(v||"").split("@");if(p.length!==2)return v||"tu correo";var n=p[0];return(n.length<3?n.charAt(0)+"***":n.slice(0,2)+"***"+n.slice(-1))+"@"+p[1]}
  async function api(path,options,s){var ss=s||await session(),h=Object.assign({},options&&options.headers||{});if(ss&&ss.access_token)h.Authorization="Bearer "+ss.access_token;return fetch(endpoint(path),Object.assign({},options||{},{headers:h}))}
  async function pinHash(pin){var bytes=new TextEncoder().encode("coco-familia-"+String(pin||"")),d=await crypto.subtle.digest("SHA-256",bytes);return Array.from(new Uint8Array(d)).map(function(x){return x.toString(16).padStart(2,"0")}).join("")}
  function preconnect(){[cfg().url,cfg().eternaEndpoint].forEach(function(raw){if(!raw)return;try{var origin=new URL(raw,location.href).origin;if(document.head.querySelector('link[rel="preconnect"][href="'+origin+'"]'))return;var l=document.createElement("link");l.rel="preconnect";l.href=origin;l.crossOrigin="anonymous";document.head.appendChild(l)}catch(e){}})}
  function inject(){preconnect();if(document.getElementById("eterna-launch-v16068-css"))return;var s=document.createElement("style");s.id="eterna-launch-v16068-css";s.textContent=[
    "#cocoApp #eternaLauncherV159 .eternaLauncherCardV159{cursor:pointer!important;touch-action:manipulation!important}#cocoApp #eternaLauncherV159 .eternaLauncherTrialFinal3{pointer-events:none!important;cursor:default!important}#cocoApp #eternaLauncherV159 .eternaLauncherCtaFinal3{pointer-events:auto!important;cursor:pointer!important;touch-action:manipulation!important;user-select:none!important}.eternaLaunchV16068{position:fixed;inset:0;z-index:2147483600;display:grid;place-items:center;padding:18px;background:rgba(4,25,39,.68);backdrop-filter:blur(5px)}.eternaLaunchV16068Card{width:min(680px,100%);max-height:min(820px,calc(100vh - 36px));overflow:auto;border-radius:24px;background:#fff;padding:24px;color:#294858;box-shadow:0 28px 80px rgba(0,0,0,.3)}",
    ".eternaLaunchV16068Head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;margin-bottom:17px}.eternaLaunchV16068Head small{display:block;color:#3184a7;font-size:9px;font-weight:950;letter-spacing:.09em}.eternaLaunchV16068Head h2{margin:4px 0 4px;color:#123e5b;font-size:25px;line-height:1.05}.eternaLaunchV16068Head p{margin:0;color:#647d8b;font-size:12px;line-height:1.5}.eternaLaunchV16068Close{border:1px solid #d6e7ee;background:#fff;color:#547080;border-radius:12px;width:38px;height:38px;font-size:21px;cursor:pointer}",
    ".eternaLaunchV16068Info{padding:14px 15px;border:1px solid #cce7d8;border-radius:15px;background:#f0faf4;color:#315c49;font-size:12px;line-height:1.55}.eternaLaunchV16068Info strong{display:block;color:#174f39;font-size:14px;margin-bottom:3px}",
    ".eternaLaunchV16068Grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.eternaLaunchV16068 label{display:grid;gap:5px;color:#496878;font-size:10px;font-weight:900}.eternaLaunchV16068 input,.eternaLaunchV16068 select{width:100%;min-height:46px;border:1px solid #cfe2eb;border-radius:11px;background:#fff;padding:9px 11px;color:#294858;font:750 13px inherit;box-sizing:border-box}.eternaLaunchV16068Checks{display:grid;gap:8px;margin-top:12px}.eternaLaunchV16068Check{display:flex!important;grid-template-columns:none!important;flex-direction:row!important;align-items:flex-start;gap:10px!important;padding:11px;border:1px solid #dfeaf0;border-radius:12px;background:#fbfdfe;font-size:10px!important;line-height:1.4}.eternaLaunchV16068Check input{width:20px!important;min-width:20px!important;height:20px!important;min-height:20px!important;padding:0;margin:0}",
    ".eternaLaunchV16068Actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:16px}.eternaLaunchV16068Primary{min-height:52px;padding:12px 18px;border:0;border-radius:13px;background:linear-gradient(180deg,#f47b12,#e66408);color:#fff;font-weight:950;cursor:pointer;box-shadow:0 4px 0 #b64e05,0 10px 22px rgba(230,100,8,.18)}.eternaLaunchV16068Secondary{min-height:46px;padding:10px 14px;border:1px solid #d4e5ec;border-radius:12px;background:#fff;color:#365e72;font-weight:900;cursor:pointer}.eternaLaunchV16068Link{border:0;background:none;color:#287698;text-decoration:underline;font-weight:850;cursor:pointer;padding:7px 0}.eternaLaunchV16068Msg{min-height:18px;margin-top:8px;color:#a04a3c;font-size:10px;font-weight:850}",
    ".eternaLaunchV16068Plans{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px}.eternaLaunchV16068Plan{padding:14px;border:1px solid #d9e8ef;border-radius:15px;background:#f8fbfd}.eternaLaunchV16068Plan b{display:block;color:#173f59}.eternaLaunchV16068Plan strong{display:block;margin:5px 0;color:#173f59;font-size:22px}.eternaLaunchV16068Plan button{min-height:40px;border:1px solid #e4a36b;border-radius:10px;background:#fff7ef;color:#a35418;font-weight:900;cursor:pointer}",
    "@media(max-width:640px){.eternaLaunchV16068{padding:10px}.eternaLaunchV16068Card{padding:18px;border-radius:19px}.eternaLaunchV16068Grid,.eternaLaunchV16068Plans{grid-template-columns:1fr}.eternaLaunchV16068Head h2{font-size:22px}.eternaLaunchV16068Primary{width:100%}}"
  ].join("");document.head.appendChild(s)}
  function closeModal(){if(currentModal){currentModal.remove();currentModal=null}}
  function modal(title,subtitle,html,closable){inject();closeModal();var m=document.createElement("section");m.className="eternaLaunchV16068";m.innerHTML='<div class="eternaLaunchV16068Card"><div class="eternaLaunchV16068Head"><div><small>COCO EN FORMA · ETERNA</small><h2>'+esc(title)+'</h2><p>'+esc(subtitle||"")+'</p></div>'+(closable!==false?'<button type="button" class="eternaLaunchV16068Close" aria-label="Cerrar">×</button>':'')+'</div>'+html+'</div>';document.body.appendChild(m);currentModal=m;var x=m.querySelector(".eternaLaunchV16068Close");if(x)x.onclick=closeModal;return m}
  function msg(m,text,ok){var n=m&&m.querySelector(".eternaLaunchV16068Msg");if(n){n.textContent=text||"";n.style.color=ok?"#26714b":"#a04a3c"}}
  function mark(name){try{performance.mark(name)}catch(e){}}
  function measure(name,a,b){try{performance.measure(name,a,b)}catch(e){}}
  function showEmailGate(email){mark("eterna-email-gate");var m=modal("📧 Revisa tu correo para activar la cuenta","La cuenta se ha creado correctamente.",'<div class="eternaLaunchV16068Info"><strong>Falta confirmar el correo electrónico</strong>Te hemos enviado un correo a <b>'+esc(maskEmail(email))+'</b>. Abre ese correo y pulsa el enlace de confirmación. Después vuelve a Coco en Forma e inicia sesión con el email y la contraseña que acabas de crear.<br><br>Si no lo encuentras, revisa también Spam o Correo no deseado.</div><div class="eternaLaunchV16068Actions"><button class="eternaLaunchV16068Primary" data-resend>Reenviar correo de activación</button><button class="eternaLaunchV16068Secondary" data-home>Volver al inicio</button></div><div class="eternaLaunchV16068Msg"></div>',false);m.querySelector("[data-home]").onclick=function(){location.href=location.origin+"/"};m.querySelector("[data-resend]").onclick=async function(){var b=this;b.disabled=true;try{var c=client(),r=await c.auth.resend({type:"signup",email:email});if(r&&r.error)throw r.error;msg(m,"Correo reenviado. Revisa también Spam o Correo no deseado.",true)}catch(e){msg(m,"No se pudo reenviar el correo. Inténtalo de nuevo.")}finally{b.disabled=false}}}
  async function pinRecord(s){var c=client();try{var r=await c.from("eterna_family_security").select("pin_hash").eq("user_id",s.user.id).maybeSingle();if(r&&r.error)throw r.error;return r&&r.data&&r.data.pin_hash?String(r.data.pin_hash):""}catch(e){return null}}
  async function savePin(s,pin){var hash=await pinHash(pin),c=client(),r=await c.from("eterna_family_security").upsert({user_id:s.user.id,pin_hash:hash,updated_at:new Date().toISOString()},{onConflict:"user_id"});if(r&&r.error)throw r.error;try{localStorage.setItem("coco_pin_familia",hash);sessionStorage.setItem(pinPassKey(s.user.id),"1")}catch(e){}return true}
  function showCreatePin(s){var m=modal("Crea tu PIN familiar","Es la primera vez que entras en Zona Familiar. No tienes que haber recibido ningún PIN: lo eliges tú ahora.",'<div class="eternaLaunchV16068Info"><strong>🔐 Tu primer PIN</strong>Elige 4 cifras que recuerdes. Este PIN protege la Zona Familiar y no se guarda en texto plano.</div><div class="eternaLaunchV16068Grid" style="margin-top:14px"><label>Nuevo PIN<input data-pin1 type="password" inputmode="numeric" maxlength="4" autocomplete="new-password" placeholder="4 cifras"></label><label>Repite el PIN<input data-pin2 type="password" inputmode="numeric" maxlength="4" autocomplete="new-password" placeholder="Repite las 4 cifras"></label></div><div class="eternaLaunchV16068Actions"><button class="eternaLaunchV16068Primary" data-create>Crear PIN y continuar</button></div><div class="eternaLaunchV16068Msg"></div>',false);m.querySelector("[data-create]").onclick=async function(){var a=clean(m.querySelector("[data-pin1]").value).replace(/\D/g,""),b=clean(m.querySelector("[data-pin2]").value).replace(/\D/g,"");if(!/^\d{4}$/.test(a))return msg(m,"El PIN debe tener exactamente 4 cifras.");if(a!==b)return msg(m,"Los dos PIN no coinciden.");this.disabled=true;try{await savePin(s,a);closeModal();await runState()}catch(e){this.disabled=false;msg(m,"No se pudo crear el PIN. Inténtalo otra vez.")}}}
  function showExistingPin(s,hash){var m=modal("Zona Familiar","Introduce tu PIN familiar.",'<label>PIN familiar<input data-pin type="password" inputmode="numeric" maxlength="4" autocomplete="off" placeholder="••••"></label><div class="eternaLaunchV16068Actions"><button class="eternaLaunchV16068Primary" data-enter>Entrar en Zona Familiar</button></div><button class="eternaLaunchV16068Link" data-forgot>¿Has olvidado tu PIN?</button><div class="eternaLaunchV16068Msg"></div>',true);m.querySelector("[data-enter]").onclick=async function(){var p=clean(m.querySelector("[data-pin]").value).replace(/\D/g,"");if(!/^\d{4}$/.test(p))return msg(m,"Escribe las 4 cifras de tu PIN.");if(await pinHash(p)!==hash)return msg(m,"El PIN no es correcto. Inténtalo de nuevo.");try{sessionStorage.setItem(pinPassKey(s.user.id),"1")}catch(e){}closeModal();await runState()};m.querySelector("[data-forgot]").onclick=function(){showRecoverPin(s)}}
  function showRecoverPin(s){var m=modal("Recuperar PIN familiar","Confirma la contraseña de la cuenta y crea un PIN nuevo.",'<label>Contraseña de la cuenta<input data-pass type="password" autocomplete="current-password" placeholder="Tu contraseña"></label><div class="eternaLaunchV16068Grid" style="margin-top:12px"><label>Nuevo PIN<input data-new type="password" inputmode="numeric" maxlength="4" placeholder="4 cifras"></label><label>Repite el PIN<input data-repeat type="password" inputmode="numeric" maxlength="4" placeholder="Repite"></label></div><div class="eternaLaunchV16068Actions"><button class="eternaLaunchV16068Primary" data-save>Cambiar PIN</button></div><button class="eternaLaunchV16068Link" data-forgotpass>También olvidé mi contraseña</button><div class="eternaLaunchV16068Msg"></div>',true);m.querySelector("[data-save]").onclick=async function(){var pass=m.querySelector("[data-pass]").value,a=m.querySelector("[data-new]").value.replace(/\D/g,""),b=m.querySelector("[data-repeat]").value.replace(/\D/g,"");if(!pass)return msg(m,"Escribe la contraseña de la cuenta.");if(!/^\d{4}$/.test(a)||a!==b)return msg(m,"Comprueba que los dos PIN de 4 cifras coinciden.");this.disabled=true;try{var c=client(),auth=await c.auth.signInWithPassword({email:s.user.email,password:pass});if(auth&&auth.error)throw auth.error;await savePin(s,a);msg(m,"PIN actualizado. Continuando…",true);closeModal();await runState()}catch(e){this.disabled=false;msg(m,"No se pudo verificar la contraseña. Compruébala e inténtalo de nuevo.")}};m.querySelector("[data-forgotpass]").onclick=async function(){var b=this;b.disabled=true;try{var c=client(),r=await c.auth.resetPasswordForEmail(s.user.email,{redirectTo:location.origin+"/"});if(r&&r.error)throw r.error;msg(m,"Te hemos enviado un correo para crear una nueva contraseña. Después vuelve a Coco en Forma y recupera tu PIN.",true)}catch(e){msg(m,"No se pudo enviar el correo de recuperación.")}finally{b.disabled=false}}}
  async function legalState(s){try{var r=await api("/v1/legal-consent",{method:"GET",headers:{"Cache-Control":"no-store"}},s),d=await r.json().catch(function(){return{}});if(!r.ok)throw new Error(d.error||"LEGAL");return d}catch(e){return{required:true,accepted:false,temporary_error:true}}}
  async function subscription(s){var c=client();try{var rows=await Promise.all([c.from("perfiles").select("rol").eq("id",s.user.id).maybeSingle(),c.from("eterna_subscriptions").select("*").eq("user_id",s.user.id).maybeSingle()]),profile=rows[0],sub=rows[1];if(profile&&profile.error)throw profile.error;if(sub&&sub.error)throw sub.error;if(profile&&profile.data&&String(profile.data.rol||"").toLowerCase()==="propietario")return{status:"active",master:true};return sub&&sub.data||{status:"inactive"}}catch(e){return{status:"unknown",temporary_error:true}}}
  function activeSub(x){if(!x)return false;if(x.status==="active")return true;if(x.status==="trialing")return !x.trial_end||new Date(x.trial_end).getTime()>Date.now();return false}
  function expiredSubscription(x){if(!x)return false;var status=String(x.status||"").toLowerCase(),plan=String(x.plan||"").toLowerCase(),end=Date.parse(String(x.trial_end||""));return status==="expired"||(status==="trialing"&&(!Number.isFinite(end)||end<=Date.now()))||(plan==="trial"&&status!=="active"&&!activeSub(x))||Boolean(x.trial_end)&&!activeSub(x)}
  function planCards(){return '<div class="eternaLaunchV16068Plans"><div class="eternaLaunchV16068Plan"><b>Plan mensual</b><strong>7,99 € <small>/mes</small></strong><span>Flexibilidad mes a mes.</span><button type="button" data-paid-plan="monthly">Contratar mensual</button></div><div class="eternaLaunchV16068Plan"><b>Plan anual</b><strong>79,99 € <small>/año</small></strong><span>12 meses con el mejor precio.</span><button type="button" data-paid-plan="annual">Contratar anual</button></div></div>'}
  function bindPaidPlans(m,s,legalAccepted){if(!m)return;m.querySelectorAll("[data-paid-plan]").forEach(function(b){b.onclick=function(){if(!legalAccepted){msg(m,"Primero completa la autorización con el botón principal. Después podrás contratar el plan que prefieras.");return}showPurchaseAck(s,b.dataset.paidPlan)}})}
  function showPurchaseAck(s,plan){var annual=plan==="annual",price=annual?"79,99 € / año":"7,99 € / mes",m=modal("Confirmar suscripción",price+" · pago seguro con Stripe.",'<div class="eternaLaunchV16068Info"><strong>'+esc(annual?"Plan anual":"Plan mensual")+'</strong>La suscripción es recurrente hasta cancelación. Puedes gestionarla desde Zona Familiar. Consulta la información de suscripción y desistimiento antes de pagar.</div>'+legalLinks()+'<label class="eternaLaunchV16068Check" style="margin-top:12px"><input data-start-now type="checkbox"><span>Solicito que el servicio comience inmediatamente al completar el pago y entiendo la información sobre desistimiento.</span></label><div class="eternaLaunchV16068Actions"><button class="eternaLaunchV16068Primary" data-pay>Continuar a Stripe</button><button class="eternaLaunchV16068Secondary" data-cancel>Cancelar</button></div><div class="eternaLaunchV16068Msg"></div>',true);m.querySelector("[data-cancel]").onclick=closeModal;m.querySelector("[data-pay]").onclick=async function(){if(!m.querySelector("[data-start-now]").checked)return msg(m,"Marca la confirmación para continuar.");this.disabled=true;try{var ack=await api("/v1/legal-consent",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"purchase_ack",plan:plan,recurring_ack:true,withdrawal_info_ack:true,immediate_service_requested:true})},s),ad=await ack.json().catch(function(){return{}});if(!ack.ok)throw new Error(ad.error||"ACK");var r=await api("/v1/checkout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({plan:plan})},s),d=await r.json().catch(function(){return{}});if(!r.ok||!d.url)throw new Error(d.error||"CHECKOUT");location.href=d.url}catch(e){this.disabled=false;msg(m,"No se pudo abrir el pago. Inténtalo de nuevo.")}}}

  function legalLinks(){return '<div style="margin-top:10px;font-size:9px"><a href="/privacidad-menores.html" target="_blank">Privacidad para menores</a> · <a href="/politica-de-privacidad.html" target="_blank">Privacidad</a> · <a href="/terminos-y-condiciones.html" target="_blank">Términos</a> · <a href="/informacion-ia-eterna.html" target="_blank">Cómo funciona la IA</a></div>'}
  async function confirmLegalAccepted(s){var st=await legalState(s);if(st.temporary_error||st.required&&!st.accepted)throw new Error("LEGAL_NOT_CONFIRMED");return st}
  async function confirmTrialActive(s){var sub=await subscription(s);if(sub.temporary_error||!activeSub(sub))throw new Error("TRIAL_NOT_CONFIRMED");return sub}
  function showAuthorization(s,st){var minor=st.minor!==false,m=modal("Acceso y planes","⭐ Prueba gratuita · 7 días · Sin tarjeta.",'<div class="eternaLaunchV16068Info"><strong>Autorización necesaria</strong>Completa estas confirmaciones una sola vez para activar la prueba de Eterna.</div><div style="margin-top:13px">'+(minor?'<label>Relación con el menor<select data-rel><option value="">Selecciona</option><option value="parent">Padre</option><option value="mother">Madre</option><option value="legal_guardian">Tutor/a legal</option></select></label>':'')+'<div class="eternaLaunchV16068Checks"><label class="eternaLaunchV16068Check"><input data-a type="checkbox"><span>'+(minor?'Confirmo que soy mayor de 18 años y padre, madre o tutor/a legal del menor asociado a esta cuenta y autorizo su uso de Eterna.':'Confirmo que soy mayor de 18 años y titular de esta cuenta.')+'</span></label><label class="eternaLaunchV16068Check"><input data-d type="checkbox"><span>He leído y acepto los Términos y la Política de Privacidad aplicables a Eterna.</span></label><label class="eternaLaunchV16068Check"><input data-ai type="checkbox"><span>Entiendo que Eterna es una inteligencia artificial, puede equivocarse y es una herramienta de apoyo escolar.</span></label></div>'+legalLinks()+'</div><div class="eternaLaunchV16068Actions"><button class="eternaLaunchV16068Primary" data-authorize>Autorizar y empezar prueba gratis</button></div>'+planCards()+'<div class="eternaLaunchV16068Msg"></div>',false);m.querySelector("[data-authorize]").onclick=async function(){var rel=m.querySelector("[data-rel]");if(minor&&(!rel||!rel.value))return msg(m,"Selecciona la relación con el menor.");if(!m.querySelector("[data-a]").checked||!m.querySelector("[data-d]").checked||!m.querySelector("[data-ai]").checked)return msg(m,"Completa las tres confirmaciones para continuar.");this.disabled=true;msg(m,"Registrando autorización…",true);try{var r=await api("/v1/legal-consent",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"accept",relationship:minor?rel.value:"adult_user",terms_accepted:true,privacy_accepted:true,ai_notice_accepted:true,parental_authorization:minor})},s),d=await r.json().catch(function(){return{}});if(!r.ok)throw new Error(d.error||"LEGAL");msg(m,"Comprobando autorización…",true);await confirmLegalAccepted(s);msg(m,"Activando los 7 días gratis…",true);var t=await api("/v1/trial",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}"},s),td=await t.json().catch(function(){return{}});if(!t.ok){if(t.status===409&&td.error==="TRIAL_ALREADY_USED"){closeModal();await runState();return}throw new Error(td.error||"TRIAL")}await confirmTrialActive(s);closeModal();await runState()}catch(e){this.disabled=false;var em=String(e&&e.message||"");msg(m,em==="ADULT_EMAIL_VERIFICATION_REQUIRED"?"Primero confirma el correo electrónico y vuelve a iniciar sesión.":em==="LEGAL_NOT_CONFIRMED"?"La autorización todavía no aparece registrada. No se ha iniciado la prueba; inténtalo de nuevo.":em==="TRIAL_NOT_CONFIRMED"?"La prueba se solicitó, pero aún no podemos confirmar que esté activa. Inténtalo de nuevo en un momento.":"No se pudo completar la activación. Inténtalo de nuevo.")}};bindPaidPlans(m,s,false)}
  function showTrial(s){var m=modal("Empieza tu prueba gratuita","7 días · sin tarjeta · después tú decides si continúas.",'<div class="eternaLaunchV16068Info"><strong>⭐ Prueba gratuita · 7 días</strong>Durante la prueba puedes utilizar Eterna y comprobar si encaja con la forma de estudiar del alumno.</div><div class="eternaLaunchV16068Actions"><button class="eternaLaunchV16068Primary" data-trial>Empezar prueba gratis · 7 días</button></div>'+planCards()+'<div class="eternaLaunchV16068Msg"></div>',false);m.querySelector("[data-trial]").onclick=async function(){this.disabled=true;msg(m,"Activando los 7 días gratis…",true);try{var r=await api("/v1/trial",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}"},s),d=await r.json().catch(function(){return{}});if(!r.ok)throw new Error(d.error||"TRIAL");await confirmTrialActive(s);closeModal();await runState()}catch(e){this.disabled=false;var em=String(e&&e.message||"");msg(m,em==="TRIAL_ALREADY_USED"?"Esta cuenta ya utilizó su prueba gratuita. Puedes elegir un plan para continuar.":em==="TRIAL_NOT_CONFIRMED"?"La prueba se solicitó, pero aún no podemos confirmar que esté activa. Inténtalo de nuevo en un momento.":"No se pudo activar la prueba. Inténtalo de nuevo.")}};bindPaidPlans(m,s,true)}
  async function showExpiredPlans(){closeModal();if(root.CocoEternaV160&&typeof root.CocoEternaV160.openExpiredPlans==="function"){clearIntent();try{await root.CocoEternaV160.openExpiredPlans();return}catch(e){setIntent("expired-retry")}}showTemporaryError("No hemos podido abrir los planes de Eterna. Inténtalo de nuevo.")}
  async function schoolProfile(s){var c=client();try{var r=await c.from("eterna_student_profiles").select("stage,school_year,autonomous_community").eq("user_id",s.user.id).maybeSingle();if(r&&r.error)throw r.error;return r&&r.data||null}catch(e){return{__error:true}}}
  function courseOptions(stage){return (YEARS[stage]||[]).map(function(x){return '<option>'+esc(x)+'</option>'}).join("")}
  function showCourse(s){var m=modal("Configura su contexto escolar","Esto permite que Eterna adapte el nivel y utilice el currículo adecuado.",'<div class="eternaLaunchV16068Grid"><label>Etapa<select data-stage><option value="">Selecciona</option><option value="infantil">Infantil</option><option value="primaria">Primaria</option><option value="eso">ESO</option><option value="bachillerato">Bachillerato</option></select></label><label>Curso<select data-year disabled><option value="">Selecciona primero la etapa</option></select></label></div><label style="margin-top:12px">Comunidad Autónoma<select data-ccaa><option value="">Selecciona</option>'+CCAA.map(function(x){return '<option>'+esc(x)+'</option>'}).join("")+'</select></label><div class="eternaLaunchV16068Actions"><button class="eternaLaunchV16068Primary" data-save>Guardar y empezar</button></div><div class="eternaLaunchV16068Msg"></div>',false),st=m.querySelector("[data-stage]"),yr=m.querySelector("[data-year]");st.onchange=function(){yr.disabled=!st.value;yr.innerHTML=st.value?'<option value="">Selecciona curso</option>'+courseOptions(st.value):'<option value="">Selecciona primero la etapa</option>'};m.querySelector("[data-save]").onclick=async function(){var stage=st.value,year=yr.value,ccaa=m.querySelector("[data-ccaa]").value;if(!stage||!year||!ccaa)return msg(m,"Selecciona etapa, curso y comunidad autónoma.");this.disabled=true;try{var c=client(),r=await c.from("eterna_student_profiles").upsert({user_id:s.user.id,stage:stage,school_year:year,autonomous_community:ccaa,preferred_language:"es",updated_at:new Date().toISOString()},{onConflict:"user_id"});if(r&&r.error)throw r.error;try{localStorage.setItem(SCHOOL,JSON.stringify({stage:stage,school_year:year,autonomous_community:ccaa,at:Date.now()}))}catch(e){}closeModal();ready()}catch(e){this.disabled=false;msg(m,"No se pudo guardar el contexto escolar.")}}}
  function showTemporaryError(text){var m=modal("No hemos podido comprobar tu cuenta",text||"Hay un problema temporal de conexión. No vamos a cambiar ningún dato hasta poder comprobarlo.",'<div class="eternaLaunchV16068Actions"><button class="eternaLaunchV16068Primary" data-retry>Intentar de nuevo</button></div>',true);m.querySelector("[data-retry]").onclick=function(){closeModal();runState()}}
  function ready(){clearIntent();mark("eterna_data_ready");mark("eterna-onboarding-ready");try{measure("eterna-onboarding-total","eterna-onboarding-start","eterna-onboarding-ready")}catch(e){};if(root.CocoEternaV160&&typeof root.CocoEternaV160.open==="function")root.CocoEternaV160.open()}
  async function runState(){if(running||!intent())return;running=true;mark("eterna-onboarding-start");try{var s=await session();if(!s){running=false;return}syncUserBoundary(s);try{localStorage.removeItem("coco_eterna_resume_after_auth_v1603")}catch(e){}if(!emailVerified(s)){showEmailGate(s.user.email);return}var both=await Promise.all([legalState(s),subscription(s)]),legal=both[0],sub=both[1];if(legal.temporary_error||sub.temporary_error){showTemporaryError("No hemos podido comprobar autorización y acceso a Eterna. Tus datos no se han modificado.");return}if(expiredSubscription(sub)){await showExpiredPlans();return}if(activeSub(sub)&&(!legal.required||legal.accepted)){var activeProfile=await schoolProfile(s);if(activeProfile&&activeProfile.__error){showTemporaryError("No hemos podido comprobar el contexto escolar. Inténtalo de nuevo.");return}if(!activeProfile||!activeProfile.stage||!activeProfile.school_year||!activeProfile.autonomous_community){showCourse(s);return}try{localStorage.setItem(SCHOOL,JSON.stringify({stage:activeProfile.stage,school_year:activeProfile.school_year,autonomous_community:activeProfile.autonomous_community,at:Date.now()}))}catch(e){}ready();return}var hash=await pinRecord(s),pass=false;if(hash===null){showTemporaryError("No hemos podido comprobar el PIN familiar. Inténtalo de nuevo dentro de un momento.");return}try{pass=sessionStorage.getItem(pinPassKey(s.user.id))==="1"}catch(e){}if(!hash){showCreatePin(s);return}if(!pass){showExistingPin(s,hash);return}if(legal.required&&!legal.accepted){showAuthorization(s,legal);return}if(!activeSub(sub)){showTrial(s);return}var profile=await schoolProfile(s);if(profile&&profile.__error){showTemporaryError("No hemos podido comprobar el contexto escolar. Inténtalo de nuevo.");return}if(!profile||!profile.stage||!profile.school_year||!profile.autonomous_community){showCourse(s);return}try{localStorage.setItem(SCHOOL,JSON.stringify({stage:profile.stage,school_year:profile.school_year,autonomous_community:profile.autonomous_community,at:Date.now()}))}catch(e){}ready()}finally{running=false}}
  function loginVisible(){var el=document.querySelector("#cocoApp .loginCard");if(!el)return false;try{var st=getComputedStyle(el);return st.display!=="none"&&st.visibility!=="hidden"}catch(e){return true}}
  function normalizeLauncher(){var l=document.getElementById("eternaLauncherV159"),cta=l&&l.querySelector(".eternaLauncherCtaFinal3"),trial=l&&l.querySelector(".eternaLauncherTrialFinal3");if(cta)cta.textContent=loginVisible()?"Probar Eterna gratis 7 días":"Abrir Eterna";if(trial){var b=trial.querySelector("strong"),sp=trial.querySelector("span");if(b)b.textContent="⭐ 7 días gratis";if(sp)sp.textContent="Sin tarjeta ni datos bancarios para empezar."}}
  function patchAuth(){if(authPatched)return;var c=client();if(!c||!c.auth)return;authPatched=true;var original=c.auth.signUp&&c.auth.signUp.bind(c.auth);if(original&&!c.auth.signUp.__eterna16068){var wrapped=function(payload){setIntent("signup");var p=original(payload);return Promise.resolve(p).then(function(r){var u=r&&r.data&&r.data.user,s=r&&r.data&&r.data.session;if(u&&!s)showEmailGate(u.email||payload&&payload.email);else if(s)setTimeout(runState,0);return r})};wrapped.__eterna16068=true;c.auth.signUp=wrapped}try{c.auth.onAuthStateChange(function(event,s){normalizeLauncher();if(s)syncUserBoundary(s);if(s&&intent())setTimeout(runState,0)})}catch(e){}}
  function intercept(){document.addEventListener("click",function(e){var launcher=e.target&&e.target.closest?e.target.closest("#eternaLauncherV159 .eternaLauncherCardV159"):null,cta=e.target&&e.target.closest?e.target.closest("#eternaLauncherV159 .eternaLauncherCtaFinal3"):null;if(launcher){e.preventDefault();e.stopImmediatePropagation();setIntent("home");mark("eterna-cta-click");patchAuth();if(loginVisible()&&cta)goCreateAccount();else runState();return}var trialLink=e.target&&e.target.closest?e.target.closest("a[href*='open=eterna'],a[href*='eterna=1']"):null;if(trialLink)setIntent("landing")},true);var originalAlert=root.alert&&root.alert.bind(root);if(originalAlert)root.alert=function(v){if(intent()&&/^muy\s+bien[!.]?$/i.test(clean(v)))return;return originalAlert(v)}}
  inject();patchAuth();intercept();normalizeLauncher();requestAnimationFrame(normalizeLauncher);var deepLink=false;try{var q=new URLSearchParams(location.search);if(q.get("open")==="eterna"||q.get("eterna")==="1"){deepLink=true;setIntent(q.get("source")||"direct")}}catch(e){}if(intent())session().then(function(s){if(s)runState();else if(deepLink){goCreateAccount();setTimeout(goCreateAccount,260)}});
  root.ETERNA_LAUNCH_STATE_V16070=root.ETERNA_LAUNCH_STATE_V16069=root.ETERNA_LAUNCH_STATE_V16068=Object.freeze({version:"160.70",run:runState,setIntent:setIntent,states:["SIN_CUENTA","EMAIL_PENDIENTE","EMAIL_CONFIRMADO","PIN_SIN_CREAR","PIN_NECESARIO","PIN_OK","AUTORIZACION_PENDIENTE","TRIAL_PENDIENTE","TRIAL_ACTIVO","CURSO_PENDIENTE","ETERNA_LISTA"],global_observer:false});
})(window);
