/* ETERNA UI v159.6 lightweight compatibility patch
 * Child-facing cleanup + Safari/iPhone microphone compatibility.
 * No global DOM MutationObserver: keeps Coco responsive.
 * No game, score, auth, Stripe, Supabase or Worker logic is changed.
 */
(function(){
  'use strict';
  if(window.__ETERNA_UI_PATCH_159_6__)return;
  window.__ETERNA_UI_PATCH_159_6__=true;

  var INTERNAL_CODES={
    VERIFIED:1,
    NEEDS_CLARIFICATION:1,
    VERIFICATION_CONFLICT:1,
    BLOCKED_OUT_OF_SCOPE:1,
    BLOCKED_SAFETY:1
  };

  var STATUS_UI={
    verified:{label:'Respuesta verificada',kind:'ok',color:'#2aa36b'},
    needs_clarification:{label:'Eterna necesita comprobar un poco más',kind:'warn',color:'#e69a20'},
    verification_conflict:{label:'Quiero comprobarlo mejor antes de responderte',kind:'warn',color:'#e69a20'},
    blocked_out_of_scope:{label:'Eterna solo responde sobre aprendizaje escolar',kind:'',color:'#4b8fa8'},
    blocked_safety:{label:'Habla ahora con un adulto de confianza',kind:'warn',color:'#c85d5d'},
    meta_instruction:{label:'Escribe tu respuesta directamente',kind:'',color:'#4b8fa8'},
    quota:{label:'Límite diario alcanzado',kind:'warn',color:'#e69a20'}
  };

  function clean(v){return String(v==null?'':v).replace(/\s+/g,' ').trim()}
  function norm(v){return clean(v).toLowerCase()}
  function root(){return document.getElementById('eternaOverlayV159')}

  function hideInternalCodes(scope){
    if(!scope)return;
    var tags=scope.querySelectorAll('.eternaV159Tag');
    for(var i=0;i<tags.length;i++){
      var code=clean(tags[i].textContent).toUpperCase();
      if(INTERNAL_CODES[code]){
        tags[i].hidden=true;
        tags[i].setAttribute('aria-hidden','true');
        tags[i].style.setProperty('display','none','important');
      }
    }
  }

  function latestAssistant(scope){
    if(!scope)return null;
    var rows=scope.querySelectorAll('.eternaV159Msg.assistant');
    return rows.length?rows[rows.length-1]:null;
  }

  function effectiveUi(data){
    if(data&&data.ui_status&&typeof data.ui_status==='object'){
      var ui=data.ui_status;
      if(ui.kind==='meta_instruction')return STATUS_UI.meta_instruction;
      if(ui.label){
        var fallback=STATUS_UI[norm(data.verification_status)]||{};
        return {label:String(ui.label),kind:ui.kind||fallback.kind||'',color:fallback.color||'#4b8fa8'};
      }
    }
    return STATUS_UI[norm(data&&data.verification_status)]||null;
  }

  function applyData(data){
    var scope=root();
    if(!scope)return;
    hideInternalCodes(scope);

    var ui=effectiveUi(data);
    if(ui){
      var label=scope.querySelector('[data-et-status]');
      var dot=scope.querySelector('[data-et-dot]');
      if(label)label.textContent=ui.label;
      if(dot){
        dot.className='eternaV159Dot'+(ui.kind?' '+ui.kind:'');
        dot.style.setProperty('background-color',ui.color,'important');
        dot.style.setProperty('border-color',ui.color,'important');
      }
    }

    var last=latestAssistant(scope);
    var uiKind=data&&data.ui_status&&data.ui_status.kind?String(data.ui_status.kind):'';
    var status=norm(data&&data.verification_status);
    if(last&&(uiKind==='meta_instruction'||status==='blocked_out_of_scope'||status==='blocked_safety')){
      var meta=last.querySelector('.eternaV159Meta');
      if(meta){
        meta.hidden=true;
        meta.setAttribute('aria-hidden','true');
        meta.style.setProperty('display','none','important');
      }
    }
  }

  function scheduleApply(data){
    setTimeout(function(){applyData(data)},0);
    setTimeout(function(){applyData(data)},80);
  }

  /* Read only Eterna chat responses. No document-wide observer is used. */
  if(typeof window.fetch==='function'&&!window.fetch.__eterna1596Wrapped){
    var originalFetch=window.fetch.bind(window);
    var wrapped=async function(){
      var response=await originalFetch.apply(null,arguments);
      try{
        var request=arguments[0];
        var url=typeof request==='string'?request:(request&&request.url)||'';
        if(/\/v1\/chat(?:\?|$)/.test(url)){
          response.clone().json().then(function(data){
            if(!data||typeof data!=='object')return;
            if(data.error==='ETERNA_DAILY_LIMIT')scheduleApply({ui_status:{label:'Límite diario alcanzado',kind:'quota'}});
            else scheduleApply(data);
          }).catch(function(){});
        }
      }catch(e){}
      return response;
    };
    wrapped.__eterna1596Wrapped=true;
    window.fetch=wrapped;
  }

  /* Safari/iPhone may record audio/mp4 while the legacy Eterna frontend names
   * the upload pregunta.webm. Keep the Blob untouched and correct only the
   * filename sent in FormData, so OpenAI receives a matching container name.
   */
  if(typeof FormData!=='undefined'&&FormData.prototype&&
     !FormData.prototype.append.__eterna1596Wrapped){
    var originalAppend=FormData.prototype.append;
    var patchedAppend=function(name,value,filename){
      var finalName=filename;
      try{
        if(name==='audio'&&value instanceof Blob&&filename==='pregunta.webm'){
          var type=String(value.type||'').toLowerCase();
          if(type.indexOf('mp4')>=0||type.indexOf('m4a')>=0)finalName='pregunta.m4a';
          else if(type.indexOf('ogg')>=0)finalName='pregunta.ogg';
          else if(type.indexOf('wav')>=0)finalName='pregunta.wav';
          else if(type.indexOf('mpeg')>=0||type.indexOf('mp3')>=0)finalName='pregunta.mp3';
          else finalName='pregunta.webm';
        }
      }catch(e){}
      if(arguments.length>=3)return originalAppend.call(this,name,value,finalName);
      return originalAppend.call(this,name,value);
    };
    patchedAppend.__eterna1596Wrapped=true;
    FormData.prototype.append=patchedAppend;
  }

  /* Safari is more reliable when MediaRecorder emits small chunks. Apply this
   * only while the Eterna dialog is open, leaving other recorders untouched.
   */
  if(typeof MediaRecorder!=='undefined'&&MediaRecorder.prototype&&
     MediaRecorder.prototype.start&&!MediaRecorder.prototype.start.__eterna1596Wrapped){
    var originalStart=MediaRecorder.prototype.start;
    var patchedStart=function(timeslice){
      try{
        var open=document.querySelector('#eternaOverlayV159.is-open');
        if(open&&arguments.length===0)return originalStart.call(this,250);
      }catch(e){}
      return originalStart.apply(this,arguments);
    };
    patchedStart.__eterna1596Wrapped=true;
    MediaRecorder.prototype.start=patchedStart;
  }


  /* iPhone/Safari: do not force the camera. Removing capture immediately before
   * the existing file input is opened makes iOS offer Photo Library, Take Photo
   * and Browse while preserving the same image-processing flow.
   */
  document.addEventListener('click',function(event){
    try{
      var button=event.target&&event.target.closest?event.target.closest('[data-et-camera]'):null;
      if(!button)return;
      var scope=root();
      if(!scope||!scope.contains(button))return;
      var input=scope.querySelector('[data-et-file]');
      if(input)input.removeAttribute('capture');
    }catch(e){}
  },true);

  /* One tiny initial cleanup, limited strictly to the Eterna overlay. */
  function initial(){hideInternalCodes(root())}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initial,{once:true});
  else setTimeout(initial,0);
})();
