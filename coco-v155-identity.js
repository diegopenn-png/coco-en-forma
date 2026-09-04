/* Coco en Forma · v160 FINAL4.7 · identidad visual + rendimiento con observación acotada */
(function(root){
  "use strict";
  var VERSION="2026-08-23-v160-final4.7";
  var DATA={
    numeros:{name:"Une los números",description:"Recorre tableros distintos sin repetir casillas: planifica, corrige el camino y entrena la atención visual."},
    calculo:{name:"Cálculo veloz",description:"Combina sumas, restas, tablas, divisiones, porcentajes, medias y operaciones encadenadas según tu nivel."},
    sopa:{name:"Sopa de letras",description:"Busca vocabulario de ciencia, naturaleza, deportes, tecnología y lengua en tableros que cambian cada partida."},
    sudoku:{name:"Sudoku",description:"Completa tableros únicos de 4×4 y 6×6, con tres niveles y pistas limitadas."},
    memoria:{name:"Memoria",description:"Encuentra parejas en colecciones rotatorias de ciencia, naturaleza, arte, deportes, tecnología y aventura."},
    series:{name:"Series lógicas",description:"Descubre patrones aditivos, alternos, geométricos, Fibonacci, potencias y otras familias sin repetir reto."},
    palabras:{name:"Descifra la palabra",description:"Ordena vocabulario cotidiano y académico con pistas graduadas y dificultad adaptada."},
    crucigrama:{name:"Crucigrama",description:"Resuelve cuadrículas variables con conceptos de lengua, ciencia, geografía, matemáticas y cultura escolar."},
    tiempo:{name:"Reto tiempo",description:"Alterna microdesafíos de cálculo, lenguaje, lógica, ciencia y atención con dificultad adaptada."},
    verdadero:{name:"Verdadero o falso",description:"Contrasta afirmaciones de matemáticas, lengua, ciencia, ciudadanía y tecnología, siempre con explicación."},
    cocomed:{name:"Coco Med",description:"Practica anatomía, prevención, nutrición, salud digital y razonamiento clínico con explicación y límites seguros."},
    futbol:{name:"Fútbol",description:"Memoriza secuencias con ritmos variables y chuta a la única zona libre en tres niveles."},
    padel:{name:"Pádel",description:"Crea mixings equilibrados, cambia rondas, pistas, tiempo y puntuación, y consulta clasificaciones e historial."}
  };
  Object.keys(DATA).forEach(function(id){DATA[id].image="./share/"+id+".jpg?v=16007"});
  root.COCO_GAME_IDENTITY_V155=Object.freeze(DATA);root.COCO_VERSION=VERSION;
  var TITLE_TO_ID={};Object.keys(DATA).forEach(function(id){TITLE_TO_ID[DATA[id].name]=id});TITLE_TO_ID["Coco Fútbol"]="futbol";TITLE_TO_ID["Coco Pádel"]="padel";TITLE_TO_ID["Coco Pádel Club"]="padel";TITLE_TO_ID["Reto Tiempo"]="tiempo";
  function idOf(node){if(!node)return"";var id=String(node.dataset&&node.dataset.cocoJuego||node.dataset&&node.dataset.cocoSharePreview||"").trim();if(DATA[id])return id;var title=node.querySelector&&node.querySelector("h3,b");return title&&TITLE_TO_ID[String(title.textContent||"").trim()]||""}
  function imgHtml(id,alt){var d=DATA[id];return d?'<img class="cocoOfficialThumb" src="'+d.image+'" alt="'+String(alt||d.name).replace(/&/g,"&amp;").replace(/"/g,"&quot;")+'" loading="lazy" decoding="async">':""}
  function applyCard(card){var id=idOf(card),d=DATA[id];if(!d)return;card.dataset.cocoJuego=id;var box=card.querySelector(".emoji,.cocoIconoEspecial");if(box){box.classList.add("cocoOfficialThumbBox");var img=box.querySelector("img.cocoOfficialThumb");if(!img||img.getAttribute("src")!==d.image)box.innerHTML=imgHtml(id,d.name)}var desc=card.querySelector(".cocoDescripcion,p.pequeno.apagado");if(desc&&String(desc.textContent||"").trim()!==d.description)desc.textContent=d.description}
  function applyMini(node){var id=idOf(node),d=DATA[id];if(!d)return;node.dataset.cocoJuego=id;var box=node.querySelector(".cocoMiniIcono");if(box){box.classList.add("cocoOfficialThumbBox");var img=box.querySelector("img.cocoOfficialThumb");if(!img||img.getAttribute("src")!==d.image)box.innerHTML=imgHtml(id,d.name)}}
  function applyShare(modal){var title=modal.querySelector("#cocoShareTitle"),id=title&&TITLE_TO_ID[String(title.textContent||"").trim()]||"";if(!DATA[id])return;var box=modal.querySelector(".cocoSharePreview");if(box){box.classList.add("cocoOfficialThumbBox");box.innerHTML=imgHtml(id,DATA[id].name)}var p=modal.querySelector(".cocoShareSheet>p");if(p)p.textContent=DATA[id].description}
  function eternaShareUrlFinal47(){
    var u=new URL(location.origin+"/eterna.html");
    u.searchParams.set("share","16047");
    return u.toString()
  }
  async function shareEternaFinal47(button){
    var url=eternaShareUrlFinal47(),title="Eterna · Tu ayuda escolar personalizada",text="Prueba Eterna gratis durante 7 días. Empieza sin tarjeta ni datos bancarios; al terminar, tú decides si quieres continuar.";
    try{
      if(navigator.share){await navigator.share({title:title,text:text,url:url});return}
      if(navigator.clipboard&&navigator.clipboard.writeText){
        await navigator.clipboard.writeText(url);
        var old=button&&button.textContent;
        if(button)button.textContent="Enlace copiado ✓";
        setTimeout(function(){if(button&&old)button.textContent=old},1200);
        return
      }
      window.prompt("Copia este enlace de Eterna:",url)
    }catch(e){if(!e||e.name!=="AbortError")window.prompt("Copia este enlace de Eterna:",url)}
  }
  function installEternaShareFinal47(){
    var app=document.getElementById("cocoApp");
    if(!app||app.dataset.eternaShareFinal47==="1")return;
    app.dataset.eternaShareFinal47="1";
    app.addEventListener("click",function(event){
      var button=event.target&&event.target.closest?event.target.closest("[data-et-share]"):null;
      if(!button||!app.contains(button))return;
      event.preventDefault();
      event.stopImmediatePropagation();
      shareEternaFinal47(button)
    },true)
  }
  function warmAchievementCardsFinal47(scope){
    if(!scope||scope.nodeType!==1)return;
    var galleries=[];
    if(scope.matches&&scope.matches(".galeriaTarjetasLogro"))galleries.push(scope);
    if(scope.querySelectorAll)scope.querySelectorAll(".galeriaTarjetasLogro").forEach(function(g){galleries.push(g)});
    galleries.forEach(function(gallery){
      if(gallery.dataset.cocoWarmFinal47==="1")return;
      gallery.dataset.cocoWarmFinal47="1";
      var images=gallery.querySelectorAll("img.tarjetaImagenOptimizada");
      for(var i=0;i<images.length&&i<4;i++){
        var img=images[i];
        img.loading="eager";
        img.decoding="async";
        img.setAttribute("fetchpriority",i===0?"high":"low");
        try{if(img.decode)img.decode().catch(function(){})}catch(e){}
      }
    })
  }
  function installPerformanceHintsFinal47(){
    if(document.documentElement.dataset.cocoPerfHintsFinal47==="1")return;
    document.documentElement.dataset.cocoPerfHintsFinal47="1";
    var c=root.COCO_CONFIG||{},urls=[];
    if(c.url)urls.push(String(c.url));
    urls.forEach(function(raw){
      try{
        var origin=new URL(raw,location.href).origin;
        if(document.head.querySelector('link[rel="preconnect"][href="'+origin+'"]'))return;
        var link=document.createElement("link");link.rel="preconnect";link.href=origin;link.crossOrigin="anonymous";document.head.appendChild(link)
      }catch(e){}
    })
  }
  function maskEmail(value){
    var email=String(value||"").trim(),parts=email.split("@");
    if(parts.length!==2)return email;
    var name=parts[0],shown=name.length<=2?name.charAt(0)+"*":name.slice(0,2)+"***"+name.slice(-1);
    return shown+"@"+parts[1]
  }
  function familyClient(){
    if(root.__COCO_SUPABASE_CLIENT)return root.__COCO_SUPABASE_CLIENT;
    var c=root.COCO_CONFIG||{};
    if(!root.supabase||!root.supabase.createClient||!c.url||!c.clave)return null;
    try{return root.__COCO_SUPABASE_CLIENT=(root.__COCO_SUPABASE_CLIENT||root.supabase.createClient(c.url,c.clave,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}}))}catch(e){return null}
  }
  async function familyPinHashFinal46(pin){
    var bytes=new TextEncoder().encode("coco-familia-"+String(pin||""));
    var digest=await crypto.subtle.digest("SHA-256",bytes);
    return Array.from(new Uint8Array(digest)).map(function(x){return x.toString(16).padStart(2,"0")}).join("")
  }
  function familyRecoveryMessage(panel,text,kind){
    var el=panel&&panel.querySelector("[data-family-recover-msg]");if(!el)return;
    el.textContent=String(text||"");el.className="cocoFamilyRecoverMsgV160"+(kind?" "+kind:"")
  }
  function reopenFamilyAfterRecovery(pin){
    try{sessionStorage.setItem("coco_family_pin_auto_v16043",String(pin||""))}catch(e){}
    var close=document.querySelector("#cocoApp .cocoFamilyV129 [data-family-close]");
    var open=document.querySelector("#cocoApp .cocoFamiliaBtn");
    if(close&&open){
      try{close.click()}catch(e){}
      setTimeout(function(){try{open.click()}catch(e){location.reload()}},120)
      return
    }
    setTimeout(function(){location.reload()},300)
  }
  function enhanceFamilyPinRecovery(scope){
    if(!scope||scope.nodeType!==1)return;
    var screens=[];
    if(scope.matches&&scope.matches("#cocoApp .cocoFamilyV129 .cocoFamilyPin,.cocoFamilyV129 .cocoFamilyPin"))screens.push(scope);
    if(scope.querySelectorAll)scope.querySelectorAll("#cocoApp .cocoFamilyV129 .cocoFamilyPin,.cocoFamilyV129 .cocoFamilyPin").forEach(function(x){screens.push(x)});
    screens.forEach(function(screen){
      if(screen.dataset.familyRecoverFinal46==="1")return;
      var enter=screen.querySelector("[data-family-enter]"),pinInput=screen.querySelector("input");
      if(!enter||!pinInput)return;
      screen.dataset.familyRecoverFinal46="1";
      var wrap=document.createElement("div");
      wrap.className="cocoFamilyRecoverV160";
      wrap.innerHTML='<button type="button" class="cocoFamilyRecoverLinkV160" data-family-recover-open>¿Has olvidado el PIN?</button>'+
        '<section class="cocoFamilyRecoverPanelV160" data-family-recover-panel hidden aria-label="Recuperar PIN familiar">'+
          '<div class="cocoFamilyRecoverHeadV160"><div><strong>Recuperar PIN familiar</strong><span data-family-recover-email>Confirma la contraseña de la cuenta para crear un PIN nuevo.</span></div><button type="button" data-family-recover-close aria-label="Cerrar">×</button></div>'+
          '<label>Contraseña de la cuenta<input type="password" autocomplete="current-password" data-family-recover-password placeholder="Tu contraseña"></label>'+
          '<div class="cocoFamilyRecoverPinGridV160"><label>Nuevo PIN<input type="password" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off" data-family-recover-pin placeholder="4 cifras"></label><label>Repite el PIN<input type="password" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off" data-family-recover-confirm placeholder="4 cifras"></label></div>'+
          '<div class="cocoFamilyRecoverMsgV160" data-family-recover-msg aria-live="polite"></div>'+
          '<div class="cocoFamilyRecoverActionsV160"><button type="button" class="cocoFamilyRecoverPrimaryV160" data-family-recover-save>Cambiar PIN</button><button type="button" class="cocoFamilyRecoverSecondaryV160" data-family-recover-password-email>También olvidé mi contraseña</button></div>'+
          '<small>El PIN nunca se guarda en texto. Solo se sustituye su hash asociado a esta cuenta.</small>'+
        '</section>';
      enter.insertAdjacentElement("afterend",wrap);
      var openBtn=wrap.querySelector("[data-family-recover-open]"),panel=wrap.querySelector("[data-family-recover-panel]"),closeBtn=wrap.querySelector("[data-family-recover-close]"),saveBtn=wrap.querySelector("[data-family-recover-save]"),mailBtn=wrap.querySelector("[data-family-recover-password-email]");
      function closePanel(){panel.hidden=true;openBtn.setAttribute("aria-expanded","false");familyRecoveryMessage(panel,"","")}
      openBtn.setAttribute("aria-expanded","false");
      openBtn.onclick=async function(){
        panel.hidden=false;openBtn.setAttribute("aria-expanded","true");
        var cli=familyClient();
        if(!cli){familyRecoveryMessage(panel,"No se pudo conectar con la cuenta. Inténtalo de nuevo.","error");return}
        try{var s=await cli.auth.getSession(),session=s&&s.data&&s.data.session,email=session&&session.user&&session.user.email||"";var e=panel.querySelector("[data-family-recover-email]");if(e)e.textContent=email?"Cuenta: "+maskEmail(email)+" · confirma su contraseña y crea un PIN nuevo.":"Confirma la contraseña de la cuenta y crea un PIN nuevo."}catch(e){}
        setTimeout(function(){var p=panel.querySelector("[data-family-recover-password]");if(p)p.focus()},30)
      };
      closeBtn.onclick=closePanel;
      saveBtn.onclick=async function(){
        var password=String(panel.querySelector("[data-family-recover-password]").value||""),newPin=String(panel.querySelector("[data-family-recover-pin]").value||"").replace(/\D/g,""),confirmPin=String(panel.querySelector("[data-family-recover-confirm]").value||"").replace(/\D/g,"");
        if(!password){familyRecoveryMessage(panel,"Escribe la contraseña de la cuenta.","error");return}
        if(!/^\d{4}$/.test(newPin)){familyRecoveryMessage(panel,"El nuevo PIN debe tener exactamente 4 cifras.","error");return}
        if(newPin!==confirmPin){familyRecoveryMessage(panel,"Los dos PIN no coinciden.","error");return}
        var cli=familyClient();if(!cli){familyRecoveryMessage(panel,"No se pudo conectar con la cuenta.","error");return}
        saveBtn.disabled=true;mailBtn.disabled=true;familyRecoveryMessage(panel,"Verificando la cuenta…","busy");
        try{
          var sr=await cli.auth.getSession(),session=sr&&sr.data&&sr.data.session,uid=session&&session.user&&session.user.id,email=session&&session.user&&session.user.email;
          if(!uid||!email)throw new Error("NO_SESSION");
          var auth=await cli.auth.signInWithPassword({email:email,password:password});
          if(auth&&auth.error)throw auth.error;
          var verified=auth&&auth.data&&auth.data.user;
          if(!verified||verified.id!==uid)throw new Error("ACCOUNT_MISMATCH");
          var digest=await familyPinHashFinal46(newPin);
          var write=await cli.from("eterna_family_security").upsert({user_id:uid,pin_hash:digest,updated_at:new Date().toISOString()},{onConflict:"user_id"});
          if(write&&write.error)throw write.error;
          try{localStorage.setItem("coco_pin_familia",digest)}catch(e){}
          familyRecoveryMessage(panel,"PIN actualizado. Entrando en Zona Familiar…","ok");
          setTimeout(function(){reopenFamilyAfterRecovery(newPin)},500)
        }catch(e){
          familyRecoveryMessage(panel,"No se pudo verificar la contraseña o actualizar el PIN. Comprueba la contraseña e inténtalo otra vez.","error");
          saveBtn.disabled=false;mailBtn.disabled=false
        }
      };
      mailBtn.onclick=async function(){
        var cli=familyClient();if(!cli){familyRecoveryMessage(panel,"No se pudo conectar con la cuenta.","error");return}
        mailBtn.disabled=true;
        try{
          var sr=await cli.auth.getSession(),session=sr&&sr.data&&sr.data.session,email=session&&session.user&&session.user.email;
          if(!email)throw new Error("NO_EMAIL");
          var r=await cli.auth.resetPasswordForEmail(email,{redirectTo:location.origin+"/"});
          if(r&&r.error)throw r.error;
          familyRecoveryMessage(panel,"Te hemos enviado el correo para recuperar la contraseña. Después vuelve aquí y crea un PIN nuevo.","ok")
        }catch(e){familyRecoveryMessage(panel,"No se pudo enviar el correo de recuperación. Inténtalo de nuevo.","error")}finally{mailBtn.disabled=false}
      }
    })
  }
  function process(node){if(!node)return;if(node.nodeType===3)node=node.parentElement;if(!node||node.nodeType!==1)return;enhanceFamilyPinRecovery(node);warmAchievementCardsFinal47(node);if(node.matches&&node.matches(".cocoGameCard"))applyCard(node);if(node.matches&&node.matches(".cocoMiniJuego"))applyMini(node);if(node.matches&&node.matches(".cocoShareModal"))applyShare(node);if(node.querySelectorAll){node.querySelectorAll(".cocoGameCard").forEach(applyCard);node.querySelectorAll(".cocoMiniJuego").forEach(applyMini);node.querySelectorAll(".cocoShareModal").forEach(applyShare)}}
  var style=document.getElementById("coco-v155-identity-css")||document.createElement("style");style.id="coco-v155-identity-css";style.textContent=[
    "#cocoApp .cocoOfficialThumbBox{padding:0!important;overflow:hidden!important;background:#fff!important;aspect-ratio:1200/630!important;min-height:0!important}",
    "#cocoApp .cocoOfficialThumb{display:block!important;width:100%!important;height:100%!important;min-height:inherit!important;object-fit:cover!important;object-position:center!important;border:0!important;border-radius:inherit!important}",
    "#cocoApp .cocoMiniIcono.cocoOfficialThumbBox{width:82px!important;height:44px!important;min-width:82px!important;border-radius:10px!important;border:1px solid #d8eaf3!important}",
    "#cocoApp .cocoSharePreview.cocoOfficialThumbBox{padding:0!important;overflow:hidden!important}",
    "#cocoApp .cocoSharePreview .cocoOfficialThumb{width:100%!important;height:auto!important;aspect-ratio:1200/630!important;object-fit:cover!important}",

    /* Imagen oficial Eterna/Coco musculoso con cerebro visible, siempre desde el repositorio. */
    "body #cocoApp .eternaLauncherVisualFinal3{position:relative!important;display:block!important;width:100%!important;height:auto!important;aspect-ratio:1200/630!important;align-self:center!important;min-width:0!important;min-height:0!important;padding:0!important;overflow:hidden!important;border-radius:22px!important;background-image:url('./share/eterna.png?v=16047')!important;background-size:contain!important;background-position:center!important;background-repeat:no-repeat!important;background-color:#082b70!important;box-shadow:0 14px 30px rgba(13,52,80,.16)!important}",
    "body #cocoApp .eternaLauncherVisualFinal3>.eternaTabletV160{display:none!important}",
    "body #cocoApp .eternaLauncherLoggedInFinal3 .eternaLauncherVisualFinal3{display:block!important;width:100%!important;height:auto!important;aspect-ratio:1200/630!important;min-height:0!important;align-self:center!important;border-radius:18px!important;background-size:contain!important;background-position:center!important;background-color:#082b70!important}",

    /* Escritorio / Safari: en LOGIN se muestra completa la creatividad horizontal.
       No cambia PWA/móvil ni la home ya logueada. */
    "@media(min-width:901px){body #cocoApp .eternaLauncherLoggedOutFinal3 .eternaLauncherVisualFinal3{display:block!important;width:100%!important;min-height:0!important;height:auto!important;aspect-ratio:1200/630!important;align-self:center!important;background-size:contain!important;background-position:center!important;background-color:#082b70!important;border-radius:18px!important}}",

    /* Acabado visual FINAL4.6: uniforme, accesible y sin alterar la arquitectura. */
    "body #cocoApp{--coco-navy:#123f68;--coco-blue:#146da0;--coco-sky:#d7edf6;--coco-orange:#ef6c05;--coco-ink:#173f59;--coco-radius:22px;--coco-shadow:0 8px 24px rgba(22,69,94,.09);-webkit-tap-highlight-color:transparent}",
    "body #cocoApp .eternaLauncherCardV159{overflow:hidden!important;border-radius:24px!important;box-shadow:0 7px 0 rgba(192,224,237,.72),0 16px 34px rgba(22,69,94,.08)!important}",
    "body #cocoApp .eternaLauncherCopyFinal3{display:flex!important;flex-direction:column!important;justify-content:center!important;min-width:0!important}",
    "body #cocoApp .eternaLauncherActionsV159{display:flex!important;flex-wrap:wrap!important;gap:8px!important}",
    "body #cocoApp .eternaLauncherPillV159{white-space:nowrap!important}",
    "@media(min-width:901px){body #cocoApp .eternaLauncherLoggedInFinal3 .eternaLauncherCtaFinal3{display:inline-flex!important;width:auto!important;max-width:max-content!important;min-width:0!important;align-self:flex-start!important;justify-self:start!important;flex:0 0 auto!important;padding:9px 16px!important}body #cocoApp .panelJugador[aria-label='Mis tarjetas de logro'].activa .galeriaTarjetasLogro,body #cocoApp .panelJugador[aria-label='Mis tarjetas de logro'].activa .tarjetaLogro{content-visibility:visible!important}body #cocoApp .tarjetaImagenOptimizada{transform:none!important}}",
    "body #cocoApp button,body #cocoApp [role='button'],body #cocoApp a{touch-action:manipulation;-webkit-tap-highlight-color:transparent}",
    "body #cocoApp button:focus-visible,body #cocoApp [role='button']:focus-visible,body #cocoApp a:focus-visible,body #cocoApp input:focus-visible,body #cocoApp select:focus-visible,body #cocoApp textarea:focus-visible{outline:3px solid rgba(42,167,216,.34)!important;outline-offset:3px!important}",
    "@media(hover:hover) and (pointer:fine){body #cocoApp .eternaLauncherCtaFinal3,body #cocoApp .cocoFamilyRecoverPrimaryV160{transition:transform .16s ease,box-shadow .16s ease!important}body #cocoApp .eternaLauncherCtaFinal3:hover,body #cocoApp .cocoFamilyRecoverPrimaryV160:hover{transform:translateY(-1px)!important}}",
    "@media(prefers-reduced-motion:reduce){body #cocoApp *{scroll-behavior:auto!important;transition-duration:.01ms!important;animation-duration:.01ms!important}}",

    /* Zona Familiar · formato visual opción 2. */
    "body #cocoApp .cocoFamilyV129 .cocoFamilyV129Body,body #cocoApp .cocoFamilyV129 .cocoFamilyBody{background:linear-gradient(180deg,#f5fbff 0%,#ffffff 48%,#f6fbff 100%)!important}",
    "body #cocoApp .cocoFamilyV129 .eternaV159FamilyCard{position:relative!important;margin:8px 0 20px!important;padding:20px!important;border:1px solid #cfe4ee!important;border-top:5px solid #123f68!important;border-radius:24px!important;background:#fff!important;box-shadow:0 10px 28px rgba(22,69,94,.09)!important;color:#17394b!important}",
    "body #cocoApp .cocoFamilyV129 .eternaV160FamilyEyebrow{display:inline-flex!important;margin:0 7px 8px 0!important;padding:6px 10px!important;border-radius:999px!important;background:#123f68!important;color:#fff!important;font-size:9px!important;font-weight:900!important;letter-spacing:.08em!important}",
    "body #cocoApp .cocoFamilyV129 .eternaV159FamilyStatus{vertical-align:middle!important;margin:0 0 8px!important;padding:6px 9px!important;border-radius:999px!important}",
    "body #cocoApp .cocoFamilyV129 .eternaV159FamilyCard>h3{margin:4px 0 6px!important;color:#102f4f!important;font-size:clamp(22px,3vw,30px)!important;line-height:1.05!important}",
    "body #cocoApp .cocoFamilyV129 .eternaV160FamilyScope{max-width:900px!important;margin:0 0 14px!important;color:#5b7484!important;font-size:12px!important;line-height:1.5!important}",
    "body #cocoApp .cocoFamilyV129 .eternaV160FamilyPromo{margin:12px 0 16px!important;padding:12px 14px!important;border:1px solid #d9e9f0!important;border-radius:15px!important;background:#f8fcff!important}",
    "body #cocoApp .cocoFamilyV129 .eternaV160ShareBtn{background:#123f68!important;box-shadow:0 3px 0 #0b2940!important}",
    "body #cocoApp .cocoFamilyV129 .eternaV160TrialActive{margin:14px 0!important;padding:13px 15px!important;border:1px solid #ffd29a!important;border-radius:16px!important;background:linear-gradient(180deg,#fff9ec,#fff4df)!important}",
    "body #cocoApp .cocoFamilyV129 .eternaV160UpgradeWrap{margin:14px 0!important;padding:15px!important;border:1px solid #d6e7ef!important;border-radius:20px!important;background:#f8fcff!important}",
    "body #cocoApp .cocoFamilyV129 .eternaV160PaidPlan{border:1px solid #d2e4ec!important;border-radius:17px!important;background:#fff!important;box-shadow:0 3px 10px rgba(22,69,94,.06)!important}",
    "body #cocoApp .cocoFamilyV129 .eternaV160PaidPlan.is-annual{border:2px solid #ef6c05!important;background:linear-gradient(180deg,#fff,#fff8f1)!important}",
    "body #cocoApp .cocoFamilyV129 .eternaV160PaidPlan.is-annual .badge{background:#fff0df!important;color:#b94e00!important}",
    "body #cocoApp .cocoFamilyV129 .eternaV160ProgressPanel{margin:16px 0!important;padding:15px!important;border:1px solid #d6e7ef!important;border-radius:18px!important;background:#f7fbfe!important}",
    "body #cocoApp .cocoFamilyV129 .eternaV159ParentSettings{margin-top:16px!important;border:1px solid #d6e7ef!important;border-radius:18px!important;background:#fbfdff!important}",
    "body #cocoApp .cocoFamilyV129 .cocoFamilyMapIntroV160{margin:22px 0 12px!important;padding:16px 18px!important;border:1px solid #cfe4ee!important;border-left:5px solid #146da0!important;border-radius:22px!important;background:#fff!important;box-shadow:0 8px 22px rgba(22,69,94,.08)!important}",
    "body #cocoApp .cocoFamilyV129 .cocoFamilyMapIntroV160 span{display:inline-flex!important;margin-bottom:7px!important;padding:6px 10px!important;border-radius:999px!important;background:#146da0!important;color:#fff!important;font-size:9px!important;font-weight:900!important;letter-spacing:.08em!important}",
    "body #cocoApp .cocoFamilyV129 .cocoFamilyMapIntroV160 h3{margin:2px 0 5px!important;color:#102f4f!important;font-size:clamp(21px,3vw,28px)!important}",
    "body #cocoApp .cocoFamilyV129 .cocoFamilyMapIntroV160 p{margin:0!important;color:#607887!important;font-size:12px!important;line-height:1.5!important}",
    "body #cocoApp .cocoFamilyV129 .cocoFamilyHero,body #cocoApp .cocoFamilyV129 .cocoFamilyStats,body #cocoApp .cocoFamilyV129 .cocoFamilyDomains,body #cocoApp .cocoFamilyV129 .cocoFamilyCoverage,body #cocoApp .cocoFamilyV129 .cocoFamilyInsight{border-color:#d7e8f0!important;border-radius:20px!important;background:#fff!important;box-shadow:0 6px 18px rgba(22,69,94,.06)!important}",

    /* Separación correcta del label PIN familiar, input y botón. */
    "body #cocoApp .cocoFamilyV129 .cocoFamilyPin{max-width:560px!important;margin:30px auto!important;padding:10px 12px 20px!important}",
    "body #cocoApp .cocoFamilyV129 .cocoFamilyPin label{display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:12px!important;margin:22px 0 16px!important;padding:0!important;position:static!important;background:transparent!important;border:0!important;color:#173f59!important;font-size:12px!important;font-weight:900!important;line-height:1.25!important}",
    "body #cocoApp .cocoFamilyV129 .cocoFamilyPin label input{display:block!important;width:100%!important;box-sizing:border-box!important;margin:4px 0 0!important;padding:14px 16px!important;min-height:56px!important;border:2px solid #234b61!important;border-radius:15px!important;background:#fff!important;color:#173f59!important;font-size:22px!important;letter-spacing:.28em!important;text-align:center!important;outline:none!important}",
    "body #cocoApp .cocoFamilyV129 .cocoFamilyPin [data-family-enter]{min-height:50px!important;margin-top:7px!important}",

    /* Recuperación de PIN: misma identidad visual, verificación con contraseña de la cuenta. */
    "body #cocoApp .cocoFamilyRecoverV160{display:grid!important;gap:10px!important;margin-top:12px!important}",
    "body #cocoApp .cocoFamilyRecoverLinkV160{justify-self:center!important;border:0!important;background:transparent!important;color:#255f7b!important;text-decoration:underline!important;text-underline-offset:3px!important;font:850 12px inherit!important;cursor:pointer!important;padding:7px 9px!important}",
    "body #cocoApp .cocoFamilyRecoverPanelV160{display:grid!important;gap:12px!important;margin-top:4px!important;padding:16px!important;border:1px solid #cfe4ee!important;border-radius:19px!important;background:linear-gradient(180deg,#fbfeff,#f3faff)!important;box-shadow:0 10px 25px rgba(22,69,94,.08)!important;text-align:left!important}",
    "body #cocoApp .cocoFamilyRecoverPanelV160[hidden]{display:none!important}",
    "body #cocoApp .cocoFamilyRecoverHeadV160{display:flex!important;align-items:flex-start!important;justify-content:space-between!important;gap:12px!important}body #cocoApp .cocoFamilyRecoverHeadV160 strong{display:block!important;color:#123f68!important;font-size:17px!important}body #cocoApp .cocoFamilyRecoverHeadV160 span{display:block!important;margin-top:3px!important;color:#67808d!important;font-size:10.5px!important;font-weight:750!important;line-height:1.4!important}body #cocoApp .cocoFamilyRecoverHeadV160>button{flex:0 0 auto!important;width:38px!important;height:38px!important;border:0!important;border-radius:50%!important;background:#e8f5fa!important;color:#173f59!important;font-size:22px!important;cursor:pointer!important}",
    "body #cocoApp .cocoFamilyRecoverPanelV160 label{display:grid!important;gap:7px!important;margin:0!important;color:#173f59!important;font-size:11px!important;font-weight:900!important}body #cocoApp .cocoFamilyRecoverPanelV160 input{width:100%!important;box-sizing:border-box!important;min-height:48px!important;margin:0!important;padding:11px 13px!important;border:1.5px solid #c7e0eb!important;border-radius:13px!important;background:#fff!important;color:#173f59!important;font-size:16px!important;letter-spacing:normal!important;text-align:left!important}",
    "body #cocoApp .cocoFamilyRecoverPinGridV160{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}body #cocoApp .cocoFamilyRecoverPinGridV160 input{text-align:center!important;letter-spacing:.22em!important;font-size:19px!important}",
    "body #cocoApp .cocoFamilyRecoverActionsV160{display:flex!important;flex-wrap:wrap!important;gap:9px!important}body #cocoApp .cocoFamilyRecoverActionsV160 button{min-height:44px!important;padding:9px 13px!important;border-radius:12px!important;font:900 10.5px inherit!important;cursor:pointer!important}body #cocoApp .cocoFamilyRecoverPrimaryV160{border:0!important;background:#ef6c05!important;color:#fff!important;box-shadow:0 3px 0 #bd5205!important}body #cocoApp .cocoFamilyRecoverSecondaryV160{border:1px solid #c7e0eb!important;background:#fff!important;color:#234f66!important}",
    "body #cocoApp .cocoFamilyRecoverMsgV160{min-height:0!important;color:#657d8a!important;font-size:10.5px!important;font-weight:800!important;line-height:1.4!important}body #cocoApp .cocoFamilyRecoverMsgV160.error{color:#a94141!important}body #cocoApp .cocoFamilyRecoverMsgV160.ok{color:#16805a!important}body #cocoApp .cocoFamilyRecoverMsgV160.busy{color:#1f6f91!important}body #cocoApp .cocoFamilyRecoverPanelV160>small{color:#7a909c!important;font-size:9.5px!important;line-height:1.4!important}",
    "@media(max-width:560px){body #cocoApp .cocoFamilyRecoverPinGridV160{grid-template-columns:1fr!important}body #cocoApp .cocoFamilyRecoverActionsV160{display:grid!important;grid-template-columns:1fr!important}}",

    "@media(max-width:900px){body #cocoApp .eternaLauncherVisualFinal3{display:block!important;width:100%!important;height:auto!important;aspect-ratio:1200/630!important;min-height:0!important;align-self:center!important;background-size:contain!important;background-position:center!important}body #cocoApp .eternaLauncherLoggedInFinal3 .eternaLauncherVisualFinal3{display:block!important;min-height:0!important;aspect-ratio:1200/630!important}body #cocoApp .cocoFamilyV129 .eternaV159FamilyCard{padding:17px!important}}",
    "@media(max-width:620px){body #cocoApp .eternaLauncherVisualFinal3{min-height:0!important;aspect-ratio:1200/630!important;border-radius:17px!important;background-size:contain!important;background-position:center!important}body #cocoApp .eternaLauncherLoggedInFinal3 .eternaLauncherVisualFinal3{min-height:0!important;aspect-ratio:1200/630!important}body #cocoApp .cocoFamilyV129 .eternaV159FamilyCard{padding:14px!important;border-radius:20px!important}body #cocoApp .cocoFamilyV129 .cocoFamilyMapIntroV160{padding:14px!important;border-radius:19px!important}}"
  ].join("");if(!style.parentNode)document.head.appendChild(style);
  var queued=new Set(),raf=0;
  function flush(){raf=0;var list=Array.from(queued);queued.clear();list.forEach(process);root.COCO_VERSION=VERSION}
  function queue(n){if(n)queued.add(n);if(!raf)raf=requestAnimationFrame(flush)}
  function initial(){installPerformanceHintsFinal47();installEternaShareFinal47();var app=document.getElementById("cocoApp");if(app)process(app)}
  function observe(){var app=document.getElementById("cocoApp");if(!app)return;new MutationObserver(function(records){records.forEach(function(r){r.addedNodes.forEach(queue)})}).observe(app,{childList:true,subtree:true})}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",function(){initial();observe()},{once:true});else{initial();observe()}
})(window);
