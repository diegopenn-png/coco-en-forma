/* Coco en Forma · v160 FINAL4.29 · rendimiento Safari + Eterna bajo demanda */
(function(root){
  "use strict";
  var GENERAL=new Set(root.COCO_GENERAL_RANKING_IDS_V153||["numeros","calculo","palabras","series","memoria","sudoku","sopa","crucigrama","tiempo","verdadero","futbol"]);
  var RETIRED=new Set(["diferencias","cococorre"]);
  var queued=new Set(),raf=0,eternaPromise=null,replaying=false;
  try{performance.mark("coco_boot_start")}catch(e){}

  function normalizeText(s){return String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim()}
  function idOf(node){return String(node&&node.dataset&&node.dataset.cocoJuego||"").toLowerCase()}
  function cleanScoreNoise(card){card.querySelectorAll(".cocoArcadeCardScore,.cocoScoreCopy").forEach(function(n){n.remove()});card.querySelectorAll("p.pequeno").forEach(function(n){var t=normalizeText(n.textContent);if(/\b(puntos?|pts?)\b/.test(t)&&!/partida|reto|dia/.test(t))n.remove()});card.querySelectorAll(".pesas").forEach(function(n){var next=n.nextElementSibling;if(next&&/puntos?|pts?/i.test(next.textContent||""))next.remove();n.remove()})}
  function scoreStatus(card,id){var badge=card.querySelector(".cocoLigaBadge");if(!badge){badge=document.createElement("div");var btn=card.querySelector(".btn,.cocoBotonJuego");card.insertBefore(badge,btn||null)}var general=GENERAL.has(id);badge.className="cocoLigaBadge c153ScoreStatus";badge.dataset.general=general?"yes":"no";badge.setAttribute("role","status");badge.setAttribute("aria-disabled","true");badge.removeAttribute("tabindex");badge.removeAttribute("aria-label");badge.style.cursor="default";badge.innerHTML="<span>"+(general?"🏆":"•")+"</span><b>"+(general?"Puntúa para la clasificación general":"No puntúa para la clasificación general")+"</b>"}
  function fixPadel(card,id){if(id!=="padel")return;card.classList.remove("cocoConstruccion","proximo");card.querySelectorAll(".cocoEstadoObra,.cintaObras").forEach(function(n){n.remove()});var btn=card.querySelector(".cocoBotonJuego,.btn");if(btn){if(/construcci|pr[oó]xim/i.test(btn.textContent||""))btn.textContent="Abrir Coco Pádel";btn.disabled=false;btn.removeAttribute("aria-disabled")}}
  function applyCard(card){var id=idOf(card);if(RETIRED.has(id)){card.remove();return}cleanScoreNoise(card);scoreStatus(card,id);fixPadel(card,id)}
  function processNode(node){if(!node)return;if(node.nodeType===3)node=node.parentElement;if(!node||node.nodeType!==1)return;if(node.matches&&node.matches("[data-coco-juego]")&&RETIRED.has(idOf(node))){node.remove();return}if(node.matches&&node.matches(".cocoGameCard[data-coco-juego]"))applyCard(node);if(node.querySelectorAll){node.querySelectorAll("[data-coco-juego]").forEach(function(n){if(RETIRED.has(idOf(n)))n.remove()});node.querySelectorAll(".cocoGameCard[data-coco-juego]").forEach(applyCard)}}
  function relevantNode(node){if(!node||node.nodeType!==1)return false;if(node.matches&&node.matches("[data-coco-juego],.cocoGameCard,#retosCard,.retosCard"))return true;return !!(node.querySelector&&node.querySelector("[data-coco-juego],.cocoGameCard,#retosCard,.retosCard"))}

  function loadEternaExperience(){
    if(root.ETERNA_LAUNCH_STATE_V16069||root.ETERNA_EXPERIENCE_V16049)return Promise.resolve(true);
    if(eternaPromise)return eternaPromise;
    eternaPromise=new Promise(function(resolve,reject){
      var s=document.createElement("script");s.src="./eterna-experience-v160.js?v=16069";s.async=true;s.dataset.cocoModule="eterna-experience-v16069";
      s.onload=function(){try{performance.mark("eterna_core_ready")}catch(e){}resolve(true)};
      s.onerror=function(){eternaPromise=null;reject(new Error("ETERNA_LOAD_FAILED"))};document.head.appendChild(s)
    });
    return eternaPromise
  }
  function scheduleEternaIdle(){var run=function(){loadEternaExperience().catch(function(){})};if("requestIdleCallback" in root)root.requestIdleCallback(run,{timeout:1200});else setTimeout(run,700)}
  function installEternaDemandLoader(){
    document.addEventListener("click",function(event){
      if(replaying||root.ETERNA_LAUNCH_STATE_V16069)return;
      var t=event.target&&event.target.closest?event.target.closest("#eternaLauncherV159 .eternaLauncherCtaFinal3,#eternaLauncherV159 .eternaLauncherCardV159"):null;if(!t)return;
      event.preventDefault();event.stopImmediatePropagation();try{performance.mark("eterna_open_click")}catch(e){}
      loadEternaExperience().then(function(){replaying=true;try{t.click()}finally{setTimeout(function(){replaying=false},0)}}).catch(function(){replaying=false})
    },true)
  }

  function flush(){raf=0;var nodes=Array.from(queued);queued.clear();nodes.forEach(processNode);root.COCO_VERSION="2026-08-24-v160-final4.29"}
  function queue(node){if(node)queued.add(node);if(!raf)raf=requestAnimationFrame(flush)}
  function initial(){var app=document.getElementById("cocoApp");if(app)processNode(app);try{performance.mark("coco_home_visible");performance.measure("coco_boot_to_home","coco_boot_start","coco_home_visible")}catch(e){}scheduleEternaIdle();root.COCO_VERSION="2026-08-24-v160-final4.29"}
  function observe(){var app=document.getElementById("cocoApp");if(!app)return;new MutationObserver(function(records){records.forEach(function(r){r.addedNodes.forEach(function(n){if(relevantNode(n))queue(n)})})}).observe(app,{childList:true,subtree:true})}

  installEternaDemandLoader();
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",function(){initial();observe()},{once:true});else{initial();observe()}
})(window);
