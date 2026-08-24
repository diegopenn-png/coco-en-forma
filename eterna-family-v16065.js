/* ETERNA v160.65 · Zona Familiar: trial + autorización unidos
 * Cuando la autorización está pendiente, la integra dentro de Acceso y planes.
 * El botón separado de inicio de trial se oculta hasta autorizar.
 * Cuando la autorización ya está registrada, vuelve al bloque final como antes.
 * Sin MutationObserver nuevo. No modifica Worker, Stripe, Supabase ni memoria pedagógica.
 */
(function(root){
  "use strict";
  if(root.__ETERNA_FAMILY_V16065__)return;
  root.__ETERNA_FAMILY_V16065__=true;

  var VERSION="160.65-family-onboarding-final";
  var retryTimers=[];

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

  function injectStyles(){
    if(document.getElementById("eterna-family-v16061-css"))return;
    var s=document.createElement("style");s.id="eterna-family-v16061-css";
    s.textContent=[
      "#cocoApp .eternaV16061SubscriptionTop{position:relative;margin:0 0 16px;padding:16px;border:2px solid #f0d09f;border-radius:20px;background:linear-gradient(180deg,#fffaf0,#fff5e5);box-shadow:0 4px 0 rgba(235,201,145,.38)}",
      "#cocoApp .eternaV16061SubscriptionHead{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:10px}",
      "#cocoApp .eternaV16061SubscriptionHead span{display:inline-flex;padding:5px 9px;border-radius:999px;background:#ef6c05;color:#fff;font-size:9px;font-weight:900;letter-spacing:.07em}",
      "#cocoApp .eternaV16061SubscriptionHead h4{width:100%;margin:0;color:#173f59;font-size:20px;line-height:1.08}",
      "#cocoApp .eternaV16061SubscriptionHead p{margin:0;color:#6b7880;font-size:10px;font-weight:750;line-height:1.45}",
      "#cocoApp .eternaV16061SubscriptionTop>.eternaV160TrialActive,#cocoApp .eternaV16061SubscriptionTop>.eternaV160UpgradeWrap,#cocoApp .eternaV16061SubscriptionTop>.eternaV159Buttons{margin-left:0!important;margin-right:0!important}",
      "#cocoApp .eternaV16061TesterNote{margin:0 0 10px;padding:11px 13px;border:1px solid #ffd39d;border-radius:14px;background:#fff8e9;color:#173f59}",
      "#cocoApp .eternaV16061TesterNote b{display:block;font-size:13px}.eternaV16061TesterNote span{display:block;margin-top:3px;color:#6f7f88;font-size:10px;font-weight:750}",
      "#cocoApp .eternaLegalV16058[data-et-family-legal-end='1']{margin-top:18px!important}",
      "#cocoApp .eternaV16061SubscriptionTop .eternaLegalV16058[data-et-family-legal-inline='1']{margin:12px 0!important;background:#fff!important;border-color:#cfe3ec!important;box-shadow:0 2px 0 rgba(200,220,230,.42)!important}",
      "#cocoApp .eternaV16061SubscriptionTop .eternaLegalV16058[data-et-family-legal-inline='1'] .eternaLegalV16058Head h4{font-size:17px!important}",
      "#cocoApp .eternaV16061SubscriptionTop [data-et-trial][data-hidden-by-legal='1']{display:none!important}",
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
    if(existing){bindCreatedPlanButtons(existing);return true}

    var status=card.querySelector(".eternaV159FamilyStatus"),statusText=clean(status&&status.textContent).toLowerCase();
    var trial=directChildren(card,"eternaV160TrialActive")[0]||null;
    var upgrade=directChildren(card,"eternaV160UpgradeWrap")[0]||null;
    var paidButtons=directChildren(card,"eternaV159Buttons").filter(function(n){
      return !!n.querySelector("[data-et-open],[data-et-portal]")
    })[0]||null;

    var wrap=document.createElement("section");
    wrap.className="eternaV16061SubscriptionTop";
    wrap.setAttribute("aria-label","Suscripción Eterna");
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
    return true
  }

  function placeLegal(card){
    if(!card)return false;
    var nodes=Array.prototype.slice.call(card.querySelectorAll(".eternaLegalV16058"));
    if(!nodes.length)return false;

    var keep=nodes.filter(function(n){return n.classList.contains("is-ok")})[0]||nodes[nodes.length-1];
    nodes.forEach(function(n){if(n!==keep)n.remove()});

    var subscription=card.querySelector(".eternaV16061SubscriptionTop");
    var trialButton=subscription&&subscription.querySelector("[data-et-trial]");

    if(!keep.classList.contains("is-ok")&&subscription){
      keep.dataset.etFamilyLegalInline="1";
      keep.removeAttribute("data-et-family-legal-end");

      var upgrade=subscription.querySelector(".eternaV160UpgradeWrap");
      subscription.insertBefore(keep,upgrade||null);

      var accept=keep.querySelector("[data-legal-accept]");
      if(accept)accept.textContent="Autorizar y empezar prueba gratis";

      if(trialButton){
        trialButton.dataset.hiddenByLegal="1";
        trialButton.setAttribute("aria-hidden","true")
      }
    }else{
      keep.removeAttribute("data-et-family-legal-inline");
      keep.dataset.etFamilyLegalEnd="1";
      card.appendChild(keep);

      if(trialButton&&trialButton.dataset.hiddenByLegal==="1"){
        delete trialButton.dataset.hiddenByLegal;
        trialButton.removeAttribute("aria-hidden")
      }
    }
    return true
  }

  function applyFamilyLayout(){
    injectStyles();
    var card=familyCard();if(!card)return false;
    moveSubscriptionFirst(card);
    placeLegal(card);
    return true
  }

  function clearRetries(){retryTimers.forEach(function(id){clearTimeout(id)});retryTimers=[]}
  function scheduleFamilyLayout(){
    clearRetries();
    [0,180,520].forEach(function(ms){
      retryTimers.push(setTimeout(function(){applyFamilyLayout()},ms))
    })
  }

  function progressSnapshot(exportData,strategies){
    exportData=exportData||{};
    var concepts=Array.isArray(exportData.student_concept_memory)?exportData.student_concept_memory.slice():[];
    var strongest=concepts.slice().sort(function(a,b){return Number(b.mastery_score||0)-Number(a.mastery_score||0)}).slice(0,3);
    var reinforce=concepts.slice().sort(function(a,b){return Number(a.mastery_score||0)-Number(b.mastery_score||0)}).slice(0,3);
    var subjects=[],seen={};
    concepts.forEach(function(x){var s=clean(x.subject);if(s&&!seen[s]){seen[s]=1;subjects.push(s)}});
    if(Array.isArray(exportData.mastery))exportData.mastery.forEach(function(x){var s=x&&x.eterna_concepts&&x.eterna_concepts.subject;if(s&&!seen[s]){seen[s]=1;subjects.push(s)}});
    var attempts=Array.isArray(exportData.attempts)?exportData.attempts.length:concepts.reduce(function(sum,x){return sum+Number(x.attempts||0)},0);
    var useful=(strategies||[]).filter(function(x){return Number(x.evidence_count||0)>=2}).slice(0,3);
    return{concepts:concepts,strategies:useful,strongest:strongest,reinforce:reinforce,subjects:subjects,attempts:attempts}
  }

  async function reportSupport(){
    var s=await getSession(),c=getClient();
    var out={name:"Alumno Coco",strategies:[]};
    if(!s||!s.user||!c)return out;
    try{
      var results=await Promise.allSettled([
        c.from("perfiles").select("apodo").eq("id",s.user.id).maybeSingle(),
        c.from("eterna_learning_strategy_memory").select("strategy_key,evidence_count,success_score").eq("user_id",s.user.id).order("success_score",{ascending:false}).limit(12)
      ]);
      if(results[0].status==="fulfilled"&&results[0].value&&results[0].value.data&&results[0].value.data.apodo)out.name=capName(results[0].value.data.apodo);
      else if(s.user.user_metadata&&s.user.user_metadata.apodo)out.name=capName(s.user.user_metadata.apodo);
      if(results[1].status==="fulfilled"&&results[1].value&&Array.isArray(results[1].value.data))out.strategies=results[1].value.data
    }catch(e){
      if(s.user.user_metadata&&s.user.user_metadata.apodo)out.name=capName(s.user.user_metadata.apodo)
    }
    return out
  }

  function reportHtml(exportData,support){
    exportData=exportData||{};support=support||{};
    var s=progressSnapshot(exportData,support.strategies||[]),name=capName(support.name||"Alumno Coco");
    var profile=exportData.student_profile||{},course=profile.school_year||"Curso no indicado",community=profile.autonomous_community||"";
    var strongest=s.strongest,reinforce=s.reinforce,strategies=s.strategies;
    var summary=s.concepts.length?"Según las actividades realizadas, Eterna ya dispone de algunas señales para orientar la práctica. Estas observaciones pueden cambiar a medida que el alumno siga trabajando.":"Todavía hay pocas actividades para elaborar conclusiones sobre el progreso. Este informe irá ganando detalle con la práctica.";
    var recommendation=reinforce.length?"Una buena próxima práctica sería trabajar "+clean(reinforce[0].concept_label||"el concepto que necesita más refuerzo")+" con pasos cortos y una comprobación al final.":"Una buena próxima práctica sería realizar algunas actividades variadas para que Eterna pueda observar qué conceptos conviene reforzar.";
    function list(items,formatter,empty){return items.length?"<ul>"+items.map(function(x){return"<li>"+formatter(x)+"</li>"}).join("")+"</ul>":"<p>"+empty+"</p>"}
    return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Progreso de Eterna · '+esc(name)+'</title><style>'+
      'body{margin:0;background:#eef7fb;color:#173f59;font-family:system-ui,-apple-system,Segoe UI,sans-serif}.page{max-width:850px;margin:28px auto;background:#fff;border-radius:24px;padding:34px;box-shadow:0 18px 50px rgba(23,63,89,.12)}.brand{color:#2a88ad;font-weight:850;font-size:12px;letter-spacing:.08em}.title{font-size:36px;margin:8px 0 2px}.meta{color:#667f8d;margin-bottom:24px}.meta strong{color:#173f59}.summary{padding:16px;border-radius:16px;background:#eef9fd}.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:16px}.box{border:1px solid #d8ebf3;border-radius:16px;padding:15px}.box h2{font-size:16px;margin:0 0 8px}.box p,.box li{font-size:14px;line-height:1.5}.recommend{margin-top:16px;padding:16px;border-radius:16px;background:#fff6e8;border:1px solid #ffddb0}.foot{margin-top:22px;color:#718793;font-size:11px;line-height:1.45}.actions{margin:18px 0}.actions button{border:0;border-radius:12px;background:#173f59;color:#fff;padding:10px 14px;font-weight:800;cursor:pointer}@media(max-width:650px){.page{margin:0;border-radius:0;padding:22px}.grid{grid-template-columns:1fr}.title{font-size:30px}}@media print{body{background:#fff}.page{box-shadow:none;margin:0;max-width:none}.actions{display:none}}'+
      '</style></head><body><main class="page"><div class="brand">COCO EN FORMA · ETERNA</div><h1 class="title">Progreso de Eterna</h1><div class="meta"><strong>'+esc(name)+'</strong> · '+esc(course)+(community?" · "+esc(community):"")+'<br>Informe del '+esc(dateES())+'</div>'+
      '<section class="summary"><strong>Resumen</strong><p>'+esc(summary)+'</p></section><div class="grid">'+
      '<section class="box"><h2>Lo que está practicando</h2>'+list(s.subjects,function(x){return esc(x)},"Todavía no hay suficiente actividad para resumir las materias practicadas.")+'</section>'+
      '<section class="box"><h2>Lo que parece dominar mejor</h2>'+list(strongest,function(x){return esc(x.concept_label)+" · "+percent(x.mastery_score)+"% de dominio estimado"},"Todavía no hay suficientes señales para destacarlo.")+'</section>'+
      '<section class="box"><h2>Lo que conviene seguir practicando</h2>'+list(reinforce,function(x){return esc(x.concept_label)},"Todavía no hay suficientes señales para recomendar un refuerzo concreto.")+'</section>'+
      '<section class="box"><h2>Formas de ayuda que parecen funcionar mejor</h2>'+list(strategies,function(x){return esc(strategyName(x.strategy_key))+" · "+Number(x.evidence_count||0)+" evidencias"},"Eterna seguirá probando distintas formas de ayuda.")+'</section>'+
      '<section class="box"><h2>Actividad</h2><p>Conceptos con señales: <strong>'+s.concepts.length+'</strong><br>Intentos o señales registradas: <strong>'+s.attempts+'</strong></p></section>'+
      '<section class="box"><h2>Cómo interpretar este informe</h2><p>Las observaciones expresan tendencias de las actividades realizadas hasta ahora. No describen de forma permanente al alumno.</p></section>'+
      '</div><section class="recommend"><strong>Recomendación</strong><p>'+esc(recommendation)+'</p></section><div class="actions"><button onclick="window.print()">Imprimir o guardar como PDF</button></div><div class="foot">Eterna utiliza expresiones como “parece ayudarle”, “hasta ahora” y “según las actividades realizadas”. Este informe es pedagógico y orientativo; no constituye una evaluación psicológica, médica ni diagnóstica.</div></main></body></html>'
  }

  async function exportReport(button){
    var original=button.textContent,touch=/iPad|iPhone|Android/i.test(navigator.userAgent||"")||navigator.maxTouchPoints>1,preview=null;
    if(!touch)try{preview=window.open("","_blank")}catch(e){}
    button.disabled=true;button.textContent="Preparando informe…";
    try{
      var both=await Promise.all([api("/v1/export",{method:"GET"}),reportSupport()]);
      var r=both[0],support=both[1],d=await r.json().catch(function(){return{}});
      if(!r.ok)throw new Error(d.error||"EXPORT");
      var html=reportHtml(d,support),filename="progreso-eterna-"+new Date().toISOString().slice(0,10)+".html";
      var blob=new Blob([html],{type:"text/html;charset=utf-8"}),file=null;
      try{file=new File([blob],filename,{type:"text/html"})}catch(e){}
      if(touch&&file&&navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){
        try{await navigator.share({title:"Progreso de Eterna",text:"Informe de progreso pedagógico de Eterna.",files:[file]});button.textContent="Informe compartido ✓"}
        catch(shareErr){if(shareErr&&shareErr.name!=="AbortError")throw shareErr;button.textContent="Listo"}
      }else if(preview&&!preview.closed){
        preview.document.open();preview.document.write(html);preview.document.close();button.textContent="Informe abierto ✓"
      }else{
        var url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url)},60000);button.textContent="Informe descargado ✓"
      }
      setTimeout(function(){button.textContent=original;button.disabled=false},1400)
    }catch(e){
      if(preview&&!preview.closed)preview.close();
      button.disabled=false;button.textContent=original;
      alert("No se pudo preparar el informe de progreso de Eterna.")
    }
  }

  function install(){
    injectStyles();
    document.addEventListener("click",function(event){
      var target=event.target&&event.target.closest?event.target.closest("[data-et-export]"):null;
      if(target){
        event.preventDefault();event.stopImmediatePropagation();
        exportReport(target);return
      }
      var family=event.target&&event.target.closest?event.target.closest(".cocoFamiliaBtn,[data-family-enter],[data-et-trial],[data-et-delete],[data-legal-accept],[data-legal-withdraw]"):null;
      if(family)scheduleFamilyLayout()
    },true);
    if(familyCard())scheduleFamilyLayout();
    root.ETERNA_FAMILY_V16065=Object.freeze({
      version:VERSION,
      subscription_first:true,
      legal_after_strength_map:true,
      legal_dedupe:true,
      capitalized_report_name:true,
      performance_optimized:true,
      pending_legal_inline_with_trial:true,
      trial_button_hidden_until_authorized:true,
      refresh:applyFamilyLayout,
      schedule:scheduleFamilyLayout,
      extra_mutation_observer:false,
      worker_unchanged:"160.4-legal1"
    })
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});else install()
})(window);
