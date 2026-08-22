/* Coco en Forma · v160 FINAL4.5 · identidad visual con observación acotada */
(function(root){
  "use strict";
  var VERSION="2026-08-23-v160-final4.5";
  var DATA={
    numeros:{name:"Une los números",description:"Conecta la secuencia sin repetir casillas. Entrena planificación, atención visual y coordinación."},
    calculo:{name:"Cálculo veloz",description:"Resuelve operaciones a contrarreloj."},
    sopa:{name:"Sopa de letras",description:"Encuentra las palabras escondidas."},
    sudoku:{name:"Sudoku",description:"Completa el tablero sin repetir números."},
    memoria:{name:"Memoria",description:"Encuentra todas las parejas."},
    series:{name:"Series lógicas",description:"Descubre el patrón y sigue la serie."},
    palabras:{name:"Descifra la palabra",description:"Ordena las letras con ayuda de una pista."},
    crucigrama:{name:"Crucigrama",description:"Completa las palabras usando las pistas."},
    tiempo:{name:"Reto tiempo",description:"Responde antes de que se acabe el tiempo."},
    verdadero:{name:"Verdadero o falso",description:"Decide si cada afirmación es correcta."},
    cocomed:{name:"Coco Med",description:"Pon a prueba tus conocimientos sobre salud y aprende con una explicación después de cada respuesta."},
    futbol:{name:"Fútbol",description:"Memoriza las zonas que se iluminan y chuta al espacio que quedó libre."},
    padel:{name:"Pádel",description:"Organiza mixings y campeonatos, registra resultados y sigue la clasificación de tus jugadores."}
  };
  Object.keys(DATA).forEach(function(id){DATA[id].image="./share/"+id+".jpg?v=16005"});
  root.COCO_GAME_IDENTITY_V155=Object.freeze(DATA);root.COCO_VERSION=VERSION;
  var TITLE_TO_ID={};Object.keys(DATA).forEach(function(id){TITLE_TO_ID[DATA[id].name]=id});TITLE_TO_ID["Coco Fútbol"]="futbol";TITLE_TO_ID["Coco Pádel"]="padel";TITLE_TO_ID["Coco Pádel Club"]="padel";TITLE_TO_ID["Reto Tiempo"]="tiempo";
  function idOf(node){if(!node)return"";var id=String(node.dataset&&node.dataset.cocoJuego||node.dataset&&node.dataset.cocoSharePreview||"").trim();if(DATA[id])return id;var title=node.querySelector&&node.querySelector("h3,b");return title&&TITLE_TO_ID[String(title.textContent||"").trim()]||""}
  function imgHtml(id,alt){var d=DATA[id];return d?'<img class="cocoOfficialThumb" src="'+d.image+'" alt="'+String(alt||d.name).replace(/&/g,"&amp;").replace(/"/g,"&quot;")+'" loading="lazy" decoding="async">':""}
  function applyCard(card){var id=idOf(card),d=DATA[id];if(!d)return;card.dataset.cocoJuego=id;var box=card.querySelector(".emoji,.cocoIconoEspecial");if(box){box.classList.add("cocoOfficialThumbBox");var img=box.querySelector("img.cocoOfficialThumb");if(!img||img.getAttribute("src")!==d.image)box.innerHTML=imgHtml(id,d.name)}var desc=card.querySelector(".cocoDescripcion,p.pequeno.apagado");if(desc&&String(desc.textContent||"").trim()!==d.description)desc.textContent=d.description}
  function applyMini(node){var id=idOf(node),d=DATA[id];if(!d)return;node.dataset.cocoJuego=id;var box=node.querySelector(".cocoMiniIcono");if(box){box.classList.add("cocoOfficialThumbBox");var img=box.querySelector("img.cocoOfficialThumb");if(!img||img.getAttribute("src")!==d.image)box.innerHTML=imgHtml(id,d.name)}}
  function applyShare(modal){var title=modal.querySelector("#cocoShareTitle"),id=title&&TITLE_TO_ID[String(title.textContent||"").trim()]||"";if(!DATA[id])return;var box=modal.querySelector(".cocoSharePreview");if(box){box.classList.add("cocoOfficialThumbBox");box.innerHTML=imgHtml(id,DATA[id].name)}var p=modal.querySelector(".cocoShareSheet>p");if(p)p.textContent=DATA[id].description}
  function process(node){if(!node)return;if(node.nodeType===3)node=node.parentElement;if(!node||node.nodeType!==1)return;if(node.matches&&node.matches(".cocoGameCard"))applyCard(node);if(node.matches&&node.matches(".cocoMiniJuego"))applyMini(node);if(node.matches&&node.matches(".cocoShareModal"))applyShare(node);if(node.querySelectorAll){node.querySelectorAll(".cocoGameCard").forEach(applyCard);node.querySelectorAll(".cocoMiniJuego").forEach(applyMini);node.querySelectorAll(".cocoShareModal").forEach(applyShare)}}
  var style=document.getElementById("coco-v155-identity-css")||document.createElement("style");style.id="coco-v155-identity-css";style.textContent=[
    "#cocoApp .cocoOfficialThumbBox{padding:0!important;overflow:hidden!important;background:#fff!important;aspect-ratio:1200/630!important;min-height:0!important}",
    "#cocoApp .cocoOfficialThumb{display:block!important;width:100%!important;height:100%!important;min-height:inherit!important;object-fit:cover!important;object-position:center!important;border:0!important;border-radius:inherit!important}",
    "#cocoApp .cocoMiniIcono.cocoOfficialThumbBox{width:82px!important;height:44px!important;min-width:82px!important;border-radius:10px!important;border:1px solid #d8eaf3!important}",
    "#cocoApp .cocoSharePreview.cocoOfficialThumbBox{padding:0!important;overflow:hidden!important}",
    "#cocoApp .cocoSharePreview .cocoOfficialThumb{width:100%!important;height:auto!important;aspect-ratio:1200/630!important;object-fit:cover!important}",

    /* Imagen oficial Eterna/Coco musculoso con cerebro visible, siempre desde el repositorio. */
    "body #cocoApp .eternaLauncherVisualFinal3{position:relative!important;display:block!important;align-self:stretch!important;min-width:0!important;min-height:300px!important;padding:0!important;overflow:hidden!important;border-radius:22px!important;background-image:url('./share/eterna.png?v=16045')!important;background-size:cover!important;background-position:69% center!important;background-repeat:no-repeat!important;box-shadow:0 14px 30px rgba(13,52,80,.16)!important}",
    "body #cocoApp .eternaLauncherVisualFinal3>.eternaTabletV160{display:none!important}",
    "body #cocoApp .eternaLauncherLoggedInFinal3 .eternaLauncherVisualFinal3{display:block!important;min-height:190px!important;border-radius:18px!important;background-position:68% center!important}",

    /* Escritorio / Safari: en LOGIN se muestra completa la creatividad horizontal.
       No cambia PWA/móvil ni la home ya logueada. */
    "@media(min-width:901px){body #cocoApp .eternaLauncherLoggedOutFinal3 .eternaLauncherVisualFinal3{display:block!important;width:100%!important;min-height:0!important;height:auto!important;aspect-ratio:1200/630!important;align-self:center!important;background-size:contain!important;background-position:center!important;background-color:#082b70!important;border-radius:18px!important}}",

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

    "@media(max-width:900px){body #cocoApp .eternaLauncherVisualFinal3{display:block!important;min-height:235px!important;background-position:68% center!important}body #cocoApp .eternaLauncherLoggedInFinal3 .eternaLauncherVisualFinal3{display:block!important;min-height:190px!important}body #cocoApp .cocoFamilyV129 .eternaV159FamilyCard{padding:17px!important}}",
    "@media(max-width:620px){body #cocoApp .eternaLauncherVisualFinal3{min-height:195px!important;border-radius:17px!important;background-position:68% center!important}body #cocoApp .eternaLauncherLoggedInFinal3 .eternaLauncherVisualFinal3{min-height:175px!important}body #cocoApp .cocoFamilyV129 .eternaV159FamilyCard{padding:14px!important;border-radius:20px!important}body #cocoApp .cocoFamilyV129 .cocoFamilyMapIntroV160{padding:14px!important;border-radius:19px!important}}"
  ].join("");if(!style.parentNode)document.head.appendChild(style);
  var queued=new Set(),raf=0;
  function flush(){raf=0;var list=Array.from(queued);queued.clear();list.forEach(process);root.COCO_VERSION=VERSION}
  function queue(n){if(n)queued.add(n);if(!raf)raf=requestAnimationFrame(flush)}
  function initial(){var app=document.getElementById("cocoApp");if(app)process(app)}
  function observe(){var app=document.getElementById("cocoApp");if(!app)return;new MutationObserver(function(records){records.forEach(function(r){r.addedNodes.forEach(queue)})}).observe(app,{childList:true,subtree:true})}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",function(){initial();observe()},{once:true});else{initial();observe()}
})(window);
