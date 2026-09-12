/* Coco en Forma · Family profile v160.100.0 */
(function(root){
  "use strict";
  if(root.__COCO_FAMILY_FRIENDLY_160100__)return;
  root.__COCO_FAMILY_FRIENDLY_160100__=true;

  var VERSION="160.100.0-account-birth-date";
  var DOB_KEY_PREFIX="coco_birthdate_v1:";
  var pendingCards=new WeakMap();

  function two(value){return String(value).padStart(2,"0")}
  function isoLocalDate(value){return value.getFullYear()+"-"+two(value.getMonth()+1)+"-"+two(value.getDate())}
  function ageFromDob(value,today){
    var match=String(value||"").match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!match)return null;
    var year=Number(match[1]),month=Number(match[2]),day=Number(match[3]),birth=new Date(year,month-1,day);
    if(birth.getFullYear()!==year||birth.getMonth()!==month-1||birth.getDate()!==day)return null;
    today=today instanceof Date?today:new Date();
    var age=today.getFullYear()-year;
    if(today.getMonth()<month-1||(today.getMonth()===month-1&&today.getDate()<day))age--;
    return birth.getTime()<=today.getTime()&&age>=0&&age<=130?age:null
  }
  function cleanInternalLevels(scope){
    (scope||document).querySelectorAll(".eternaV160ModeProgress").forEach(function(node){
      node.textContent=String(node.textContent||"").replace(/\s*[·•]\s*Nivel\s*\d+\b/gi,"").replace(/\s*Nivel\s*\d+\b/gi,"").trim()
    })
  }
  function client(){return root.__COCO_SUPABASE_CLIENT||null}
  function familyCard(value){
    if(value&&value.nodeType===1&&value.matches(".eternaV159FamilyCard"))return value;
    return document.querySelector("#cocoApp .eternaV159FamilyCard[data-et-family-canonical='1'],#cocoApp .eternaV159FamilyCard")
  }
  function localBirthDate(uid){try{return localStorage.getItem(DOB_KEY_PREFIX+uid)||""}catch(e){return""}}
  function rememberBirthDate(uid,value){try{localStorage.setItem(DOB_KEY_PREFIX+uid,value)}catch(e){}}
  function endpoint(path){
    var base=String((root.COCO_CONFIG||{}).eternaEndpoint||"").replace(/\/+$/,"");
    return base?base+path:""
  }
  async function saveCalculatedAge(session,birthDate){
    var url=endpoint("/v1/profile-age");if(!url)throw new Error("ETERNA_ENDPOINT_NOT_CONFIGURED");
    var response=await fetch(url,{method:"POST",headers:{Authorization:"Bearer "+session.access_token,"Content-Type":"application/json"},body:JSON.stringify({birth_date:birthDate})});
    var data=await response.json().catch(function(){return{}});if(!response.ok||data.ok!==true)throw new Error(data.error||"PROFILE_AGE");
    return data
  }
  function courseLabel(profile){
    if(!profile||!profile.school_year)return"Curso actual: pendiente de configurar en Eterna";
    return"Curso actual: "+profile.school_year+(profile.autonomous_community?" · "+profile.autonomous_community:"")
  }
  function updateVisibleAge(age){
    var label=document.querySelector("#cocoApp .cocoFamilyHero span");if(!label)return;
    var text=String(label.textContent||"");
    label.textContent=/\s+·\s+\d+\s+AÑOS\b/i.test(text)?text.replace(/\s+·\s+\d+\s+AÑOS\b/i," · "+age+" AÑOS"):text+" · "+age+" AÑOS"
  }
  function profileSection(profile){
    var section=document.createElement("section");section.className="cocoFamilyProfileV160100";section.dataset.cocoFamilyProfile="160100";
    section.innerHTML='<div class="cocoFamilyProfileV160100Head"><div><span>PERFIL ESCOLAR</span><h3>Edad y curso</h3></div><p>La fecha mantiene la edad al día. Eterna sigue usando el curso actual como referencia académica.</p></div><div class="cocoFamilyProfileV160100Grid"><label>Fecha de nacimiento<input type="date" autocomplete="bday" data-coco-birth-date></label><div class="cocoFamilyProfileV160100Value"><span>Edad calculada</span><output data-coco-calculated-age>—</output></div><div class="cocoFamilyProfileV160100Value is-course"><span>Referencia académica</span><output data-coco-current-course></output></div></div><div class="cocoFamilyProfileV160100Actions"><button type="button" data-coco-save-profile>Guardar perfil</button><span role="status" aria-live="polite" data-coco-profile-status></span></div>';
    section.querySelector("[data-coco-current-course]").textContent=courseLabel(profile);
    return section
  }
  function installStyles(){
    if(document.getElementById("coco-family-profile-v160100-style"))return;
    var style=document.createElement("style");style.id="coco-family-profile-v160100-style";style.textContent=[
      "#cocoApp .cocoFamilyProfileV160100{margin:16px 0;padding:17px;border:1px solid #cfe5ee;border-radius:20px;background:#fff;color:#173f59}",
      "#cocoApp .cocoFamilyProfileV160100Head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:13px}#cocoApp .cocoFamilyProfileV160100Head span{color:#1784b1;font-size:9px;font-weight:950;letter-spacing:.07em}#cocoApp .cocoFamilyProfileV160100Head h3{margin:4px 0 0;font-size:18px}#cocoApp .cocoFamilyProfileV160100Head p{max-width:520px;margin:0;color:#647d89;font-size:10.5px;font-weight:700;line-height:1.45}",
      "#cocoApp .cocoFamilyProfileV160100Grid{display:grid;grid-template-columns:minmax(190px,.7fr) minmax(130px,.45fr) minmax(230px,1fr);gap:10px}#cocoApp .cocoFamilyProfileV160100Grid label,#cocoApp .cocoFamilyProfileV160100Value{display:grid;gap:6px;padding:11px 12px;border:1px solid #dbeaf0;border-radius:15px;background:#f8fcfe;color:#5e7785;font-size:9.5px;font-weight:850}#cocoApp .cocoFamilyProfileV160100Grid input{min-height:42px;width:100%;box-sizing:border-box;padding:7px 9px;border:1px solid #bedbe7;border-radius:10px;background:#fff;color:#173f59;font:850 13px inherit}#cocoApp .cocoFamilyProfileV160100Value output{color:#173f59;font-size:16px;font-weight:950;line-height:1.25}#cocoApp .cocoFamilyProfileV160100Value.is-course output{font-size:12px}",
      "#cocoApp .cocoFamilyProfileV160100Actions{display:flex;align-items:center;gap:10px;margin-top:12px;flex-wrap:wrap}#cocoApp .cocoFamilyProfileV160100Actions button{min-height:42px;padding:9px 14px;border:0;border-radius:12px;background:#173f59;color:#fff;font:900 10.5px inherit;cursor:pointer}#cocoApp .cocoFamilyProfileV160100Actions button:disabled{opacity:.6;cursor:wait}#cocoApp [data-coco-profile-status]{color:#557381;font-size:10px;font-weight:800}",
      "@media(max-width:760px){#cocoApp .cocoFamilyProfileV160100Head{display:grid;gap:7px}#cocoApp .cocoFamilyProfileV160100Grid{grid-template-columns:1fr 1fr}#cocoApp .cocoFamilyProfileV160100Value.is-course{grid-column:1/-1}}",
      "@media(max-width:430px){#cocoApp .cocoFamilyProfileV160100Grid{grid-template-columns:1fr}#cocoApp .cocoFamilyProfileV160100Value.is-course{grid-column:auto}}"
    ].join("");document.head.appendChild(style)
  }
  async function enhanceFamilyProfile(value){
    cleanInternalLevels(document);installStyles();
    var card=familyCard(value);if(!card||card.dataset.etFamilyState!=="ready")return false;
    if(card.querySelector("[data-coco-family-profile='160100']"))return true;
    if(pendingCards.has(card))return pendingCards.get(card);
    var task=(async function(){
      var cli=client();if(!cli||!cli.auth)return false;
      var sessionResult=await cli.auth.getSession(),session=sessionResult&&sessionResult.data&&sessionResult.data.session;
      if(!session||!session.user)return false;
      var profileResult={data:null};try{profileResult=await cli.from("eterna_student_profiles").select("school_year,autonomous_community").eq("user_id",session.user.id).maybeSingle()}catch(e){}
      if(!document.body.contains(card)||card.dataset.etFamilyState!=="ready")return false;
      var section=profileSection(profileResult&&profileResult.data||null),report=card.querySelector(":scope > [data-family-integral-report='1']"),settings=card.querySelector(":scope > .eternaV159ParentSettings");
      card.insertBefore(section,report||settings||null);
      var input=section.querySelector("[data-coco-birth-date]"),ageOutput=section.querySelector("[data-coco-calculated-age]"),button=section.querySelector("[data-coco-save-profile]"),status=section.querySelector("[data-coco-profile-status]");
      input.max=isoLocalDate(new Date());
      var metadata=session.user.user_metadata||{},stored=String(metadata.birth_date||localBirthDate(session.user.id)||"");
      if(ageFromDob(stored)!==null)input.value=stored;
      function refreshAge(){var age=ageFromDob(input.value);ageOutput.textContent=age===null?"—":age+(age===1?" año":" años");return age}
      input.addEventListener("input",refreshAge);input.addEventListener("change",refreshAge);var initialAge=refreshAge();if(initialAge!==null)updateVisibleAge(initialAge);
      try{root.dispatchEvent(new CustomEvent("coco:family-profile-ready",{detail:{card:card,age:initialAge}}))}catch(e){}
      button.addEventListener("click",async function(){
        var birthDate=input.value,age=refreshAge();if(age===null){status.textContent="Revisa la fecha de nacimiento.";input.focus();return}
        button.disabled=true;status.textContent="Guardando…";
        try{
          var authResult=await cli.auth.updateUser({data:{birth_date:birthDate,edad:String(age)}});
          if(authResult&&authResult.error)throw authResult.error;
          rememberBirthDate(session.user.id,birthDate);updateVisibleAge(age);status.textContent="Perfil guardado ✓";
          try{root.dispatchEvent(new CustomEvent("coco:family-profile-updated",{detail:{card:card,birth_date:birthDate,age:age}}))}catch(e){}
          try{var saved=await saveCalculatedAge(session,birthDate);age=Number(saved.age)}catch(syncError){status.textContent="Fecha guardada. La edad se sincronizará al volver a intentarlo."}
        }catch(e){status.textContent="No se pudo guardar. Comprueba la conexión e inténtalo otra vez."}
        finally{button.disabled=false}
      });
      return true
    })().finally(function(){pendingCards.delete(card)});
    pendingCards.set(card,task);return task
  }

  root.addEventListener("coco:family-card-ready",function(event){enhanceFamilyProfile(event&&event.detail&&event.detail.card)},{passive:true});
  root.addEventListener("coco:family-ui-ready",function(event){enhanceFamilyProfile(event&&event.detail&&event.detail.card)},{passive:true});
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",function(){enhanceFamilyProfile()},{once:true});else queueMicrotask(function(){enhanceFamilyProfile()});
  root.CocoFamilyFriendlyV160100=Object.freeze({version:VERSION,ageFromDob:ageFromDob,cleanInternalLevels:cleanInternalLevels,enhance:enhanceFamilyProfile});
})(window);
