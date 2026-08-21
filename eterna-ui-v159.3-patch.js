/* ETERNA UI v159.3 patch
 * Child-facing cleanup only. Internal backend status codes remain internal.
 * Safe additive patch: no game, score, auth, Stripe, Supabase or audio logic is changed.
 */
(function(){
  'use strict';
  if(window.__ETERNA_UI_PATCH_159_3__)return;
  window.__ETERNA_UI_PATCH_159_3__=true;

  const INTERNAL_CODES=new Set([
    'VERIFIED',
    'NEEDS_CLARIFICATION',
    'VERIFICATION_CONFLICT',
    'BLOCKED_OUT_OF_SCOPE',
    'BLOCKED_SAFETY'
  ]);

  const STATUS_UI={
    verified:{label:'Respuesta verificada',kind:'verified',color:'#2aa36b'},
    needs_clarification:{label:'Eterna necesita comprobar un poco más',kind:'clarification',color:'#e69a20'},
    verification_conflict:{label:'Quiero comprobarlo mejor antes de responderte',kind:'conflict',color:'#e69a20'},
    blocked_out_of_scope:{label:'Eterna solo responde sobre aprendizaje escolar',kind:'out_of_scope',color:'#4b8fa8'},
    blocked_safety:{label:'Habla ahora con un adulto de confianza',kind:'safety',color:'#c85d5d'},
    meta_instruction:{label:'Escribe tu respuesta directamente',kind:'meta_instruction',color:'#4b8fa8'}
  };

  const KNOWN_BANNER_LABELS=new Set([
    'Respuesta verificada',
    'Eterna necesita comprobar un poco más',
    'Eterna ha detectado una discrepancia',
    'Quiero comprobarlo mejor antes de responderte',
    'Eterna solo responde sobre aprendizaje escolar',
    'Habla ahora con un adulto de confianza',
    'Escribe tu respuesta directamente'
  ]);

  let lastStatus=null;
  let lastUi=null;
  let scheduled=false;

  function cleanText(value){
    return String(value||'').replace(/\s+/g,' ').trim();
  }

  function normalizeStatus(value){
    return cleanText(value).toLowerCase();
  }

  function findEternaRoot(){
    const field=document.querySelector('input[placeholder*="Escribe algo del cole"],textarea[placeholder*="Escribe algo del cole"]');
    if(field){
      let node=field;
      for(let i=0;i<10&&node;i++,node=node.parentElement){
        const txt=cleanText(node.textContent);
        if(/\bEterna\b/i.test(txt)&&/COCO EN FORMA/i.test(txt))return node;
      }
    }
    return document.body||document.documentElement;
  }

  function inferLatestStatusAndRemoveCodes(root){
    const nodes=root.querySelectorAll('span,div,p,strong,b,small,em');
    let inferred=null;
    nodes.forEach(function(el){
      if(el.tagName==='SCRIPT'||el.tagName==='STYLE')return;
      const code=cleanText(el.textContent).toUpperCase();
      if(!INTERNAL_CODES.has(code))return;

      inferred=code.toLowerCase();
      el.setAttribute('data-eterna-internal-status',code);
      el.setAttribute('aria-hidden','true');
      el.hidden=true;
      el.style.setProperty('display','none','important');
    });
    if(!lastStatus&&inferred)lastStatus=inferred;
  }

  function nodeDepth(el){
    let depth=0;
    for(let n=el;n&&n.parentElement;n=n.parentElement)depth++;
    return depth;
  }

  function findBannerLabel(root){
    const marked=root.querySelector('[data-eterna-status-label="true"]');
    if(marked)return marked;

    const nodes=root.querySelectorAll('span,div,p,strong,b,small');
    let best=null;
    for(const el of nodes){
      const txt=cleanText(el.textContent);
      if(!KNOWN_BANNER_LABELS.has(txt))continue;
      const rect=el.getBoundingClientRect();
      if(rect.width===0&&rect.height===0)continue;
      if(!best||nodeDepth(el)>nodeDepth(best))best=el;
    }
    if(best)best.setAttribute('data-eterna-status-label','true');
    return best;
  }

  function findBannerRow(label){
    if(!label)return null;
    let node=label.parentElement;
    for(let i=0;i<5&&node;i++,node=node.parentElement){
      const txt=cleanText(node.textContent);
      const rect=node.getBoundingClientRect();
      if(txt.length<=120&&rect.width>=180&&rect.height>=20&&rect.height<=100)return node;
    }
    return label.parentElement||label;
  }

  function recolorStatusDot(row,color,label){
    if(!row||!color)return;
    const candidates=row.querySelectorAll('span,i,b,div');
    for(const el of candidates){
      if(el===label||el.contains(label))continue;
      const rect=el.getBoundingClientRect();
      if(rect.width<5||rect.height<5||rect.width>28||rect.height>28)continue;
      const style=getComputedStyle(el);
      const radius=parseFloat(style.borderRadius)||0;
      if(radius>=rect.width/3||style.borderRadius.includes('%')){
        el.style.setProperty('background-color',color,'important');
        el.style.setProperty('border-color',color,'important');
        break;
      }
    }
  }

  function applyStatusBanner(root){
    const effective=(lastUi&&lastUi.kind==='meta_instruction')
      ?STATUS_UI.meta_instruction
      :(lastUi&&lastUi.label?{label:lastUi.label,kind:lastUi.kind||lastStatus,color:(STATUS_UI[lastStatus]||{}).color}:STATUS_UI[lastStatus]);
    if(!effective||!effective.label)return;

    const label=findBannerLabel(root);
    if(!label)return;
    label.textContent=effective.label;
    label.setAttribute('data-eterna-status-label','true');
    const row=findBannerRow(label);
    if(row){
      row.hidden=false;
      row.style.removeProperty('display');
      row.setAttribute('data-eterna-status-kind',effective.kind||'');
      recolorStatusDot(row,effective.color,label);
    }
  }

  function apply(){
    scheduled=false;
    const root=findEternaRoot();
    if(!root)return;
    inferLatestStatusAndRemoveCodes(root);
    applyStatusBanner(root);
  }

  function scheduleApply(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(function(){
      apply();
      setTimeout(apply,60);
    });
  }

  /* Read status from Eterna's own API response without changing the response
   * consumed by the existing app. This lets the top banner follow the latest
   * reply instead of getting stuck on an older warning state.
   */
  if(typeof window.fetch==='function'&&!window.fetch.__eterna1593Wrapped){
    const originalFetch=window.fetch.bind(window);
    const wrapped=async function(){
      const response=await originalFetch.apply(null,arguments);
      try{
        const request=arguments[0];
        const url=typeof request==='string'?request:(request&&request.url)||'';
        if(/\/v1\/chat(?:\?|$)/.test(url)){
          response.clone().json().then(function(data){
            if(!data||typeof data!=='object')return;
            if(data.verification_status)lastStatus=normalizeStatus(data.verification_status);
            if(data.ui_status&&typeof data.ui_status==='object')lastUi=data.ui_status;
            else lastUi=null;
            scheduleApply();
          }).catch(function(){});
        }
      }catch(e){}
      return response;
    };
    wrapped.__eterna1593Wrapped=true;
    window.fetch=wrapped;
  }

  function start(){
    scheduleApply();
    const observer=new MutationObserver(scheduleApply);
    observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
