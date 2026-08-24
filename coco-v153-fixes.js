/* Coco en Forma · v160 FINAL4.27 · alta/PIN/chat corregidos */
(function(root){
  "use strict";
  var GENERAL=new Set(root.COCO_GENERAL_RANKING_IDS_V153||["numeros","calculo","palabras","series","memoria","sudoku","sopa","crucigrama","tiempo","verdadero","futbol"]);
  var RETIRED=new Set(["diferencias","cococorre"]);
  var queued=new Set(),raf=0,familyScheduled=false;

  function normalizeText(s){return String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim()}
  function idOf(node){return String(node&&node.dataset&&node.dataset.cocoJuego||"").toLowerCase()}
  function cleanScoreNoise(card){card.querySelectorAll(".cocoArcadeCardScore,.cocoScoreCopy").forEach(function(n){n.remove()});card.querySelectorAll("p.pequeno").forEach(function(n){var t=normalizeText(n.textContent);if(/\b(puntos?|pts?)\b/.test(t)&&!/partida|reto|dia/.test(t))n.remove()});card.querySelectorAll(".pesas").forEach(function(n){var next=n.nextElementSibling;if(next&&/puntos?|pts?/i.test(next.textContent||""))next.remove();n.remove()})}
  function scoreStatus(card,id){var badge=card.querySelector(".cocoLigaBadge");if(!badge){badge=document.createElement("div");var btn=card.querySelector(".btn,.cocoBotonJuego");card.insertBefore(badge,btn||null)}var general=GENERAL.has(id);badge.className="cocoLigaBadge c153ScoreStatus";badge.dataset.general=general?"yes":"no";badge.setAttribute("role","status");badge.setAttribute("aria-disabled","true");badge.removeAttribute("tabindex");badge.removeAttribute("aria-label");badge.style.cursor="default";badge.innerHTML="<span>"+(general?"🏆":"•")+"</span><b>"+(general?"Puntúa para la clasificación general":"No puntúa para la clasificación general")+"</b>"}
  function fixPadel(card,id){if(id!=="padel")return;card.classList.remove("cocoConstruccion","proximo");card.querySelectorAll(".cocoEstadoObra,.cintaObras").forEach(function(n){n.remove()});var btn=card.querySelector(".cocoBotonJuego,.btn");if(btn){if(/construcci|pr[oó]xim/i.test(btn.textContent||""))btn.textContent="Abrir Coco Pádel";btn.disabled=false;btn.removeAttribute("aria-disabled")}}
  function applyCard(card){var id=idOf(card);if(RETIRED.has(id)){card.remove();return}cleanScoreNoise(card);scoreStatus(card,id);fixPadel(card,id)}
  function processNode(node){if(!node)return;if(node.nodeType===3)node=node.parentElement;if(!node||node.nodeType!==1)return;if(node.matches&&node.matches("[data-coco-juego]")&&RETIRED.has(idOf(node))){node.remove();return}if(node.matches&&node.matches(".cocoGameCard[data-coco-juego]"))applyCard(node);if(node.querySelectorAll){node.querySelectorAll("[data-coco-juego]").forEach(function(n){if(RETIRED.has(idOf(n)))n.remove()});node.querySelectorAll(".cocoGameCard[data-coco-juego]").forEach(applyCard)}}
  function relevantNode(node){
    if(!node||node.nodeType!==1)return false;
    if(node.matches&&node.matches("[data-coco-juego],.cocoGameCard,#retosCard,.retosCard"))return true;
    return !!(node.querySelector&&node.querySelector("[data-coco-juego],.cocoGameCard,#retosCard,.retosCard"))
  }

  function loadFamily(){
    if(root.__ETERNA_FAMILY_V16066_LOADER__)return;
    root.__ETERNA_FAMILY_V16066_LOADER__=true;
    var p=document.createElement("script");
    p.src="./eterna-family-v16066.js?v=16066";
    p.async=true;
    p.dataset.cocoModule="eterna-family-v16066";
    p.onerror=function(){root.__ETERNA_FAMILY_V16066_LOADER__=false};
    document.head.appendChild(p)
  }
  root.__loadEternaFamilyV16066=loadFamily;

  function scheduleFamilyIdle(){
    if(familyScheduled)return;familyScheduled=true;
    if("requestIdleCallback" in root){
      root.requestIdleCallback(loadFamily,{timeout:1800})
    }else{
      setTimeout(loadFamily,1100)
    }
  }

  function loadOnboarding(){
    if(root.__ETERNA_ONBOARDING_V16067_LOADER__)return;
    root.__ETERNA_ONBOARDING_V16067_LOADER__=true;
    var p=document.createElement("script");
    p.src="./eterna-onboarding-v16067.js?v=16067";
    p.async=true;
    p.dataset.cocoModule="eterna-onboarding-v16067";
    p.onload=scheduleFamilyIdle;
    p.onerror=function(){root.__ETERNA_ONBOARDING_V16067_LOADER__=false;scheduleFamilyIdle()};
    document.head.appendChild(p)
  }

  function loadEternaExperience(){
    if(root.__ETERNA_EXPERIENCE_V16067_LOADER__)return;
    root.__ETERNA_EXPERIENCE_V16067_LOADER__=true;
    var s=document.createElement("script");
    s.src="./eterna-experience-v160.js?v=16067";
    s.async=true;
    s.dataset.cocoModule="eterna-experience-v16067";
    s.onload=loadOnboarding;
    s.onerror=function(){root.__ETERNA_EXPERIENCE_V16067_LOADER__=false};
    document.head.appendChild(s)
  }

  function flush(){raf=0;var nodes=Array.from(queued);queued.clear();nodes.forEach(processNode);root.COCO_VERSION="2026-08-24-v160-final4.27"}
  function queue(node){if(node)queued.add(node);if(!raf)raf=requestAnimationFrame(flush)}
  function initial(){var app=document.getElementById("cocoApp");if(app)processNode(app);loadEternaExperience();root.COCO_VERSION="2026-08-24-v160-final4.27"}
  function observe(){var app=document.getElementById("cocoApp");if(!app)return;new MutationObserver(function(records){records.forEach(function(r){r.addedNodes.forEach(function(n){if(relevantNode(n))queue(n)})})}).observe(app,{childList:true,subtree:true})}

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",function(){initial();observe()},{once:true});else{initial();observe()}
})(window);
