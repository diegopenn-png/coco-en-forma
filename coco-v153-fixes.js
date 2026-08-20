(function(root){
  "use strict";
  var GENERAL=new Set(root.COCO_GENERAL_RANKING_IDS_V153||["numeros","calculo","palabras","series","memoria","sudoku","sopa","crucigrama","tiempo","verdadero","futbol"]);
  var RETIRED=new Set(["diferencias","cococorre"]),raf=0;
  function normalizeText(s){return String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim()}
  function idOf(node){return String(node&&node.dataset&&node.dataset.cocoJuego||"").toLowerCase()}
  function purgeRetired(){document.querySelectorAll("[data-coco-juego]").forEach(function(node){if(RETIRED.has(idOf(node)))node.remove()})}
  function cleanScoreNoise(card){card.querySelectorAll(".cocoArcadeCardScore,.cocoScoreCopy").forEach(function(n){n.remove()});card.querySelectorAll("p.pequeno").forEach(function(n){var t=normalizeText(n.textContent);if(/\b(puntos?|pts?)\b/.test(t)&&!/partida|reto|dia/.test(t))n.remove()});card.querySelectorAll(".pesas").forEach(function(n){var next=n.nextElementSibling;if(next&&/puntos?|pts?/i.test(next.textContent||""))next.remove();n.remove()})}
  function scoreStatus(card,id){var badge=card.querySelector(".cocoLigaBadge");if(!badge){badge=document.createElement("div");var btn=card.querySelector(".btn,.cocoBotonJuego");card.insertBefore(badge,btn||null)}var general=GENERAL.has(id);badge.className="cocoLigaBadge c153ScoreStatus";badge.dataset.general=general?"yes":"no";badge.setAttribute("role","status");badge.setAttribute("aria-disabled","true");badge.removeAttribute("tabindex");badge.removeAttribute("aria-label");badge.style.cursor="default";badge.innerHTML="<span>"+(general?"🏆":"•")+"</span><b>"+(general?"Puntúa para la clasificación general":"No puntúa para la clasificación general")+"</b>"}
  function fixPadel(card,id){if(id!=="padel")return;card.classList.remove("cocoConstruccion","proximo");card.querySelectorAll(".cocoEstadoObra,.cintaObras").forEach(function(n){n.remove()});var btn=card.querySelector(".cocoBotonJuego,.btn");if(btn){if(/construcci|pr[oó]xim/i.test(btn.textContent||""))btn.textContent="Abrir Coco Pádel";btn.disabled=false;btn.removeAttribute("aria-disabled")}}
  function apply(){raf=0;purgeRetired();document.querySelectorAll(".cocoGameCard[data-coco-juego]").forEach(function(card){var id=idOf(card);cleanScoreNoise(card);scoreStatus(card,id);fixPadel(card,id)});root.COCO_VERSION="2026-08-20-v154.0-miniaturas-sociales-oficiales"}
  function schedule(){if(!raf)raf=requestAnimationFrame(apply)}
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",schedule,{once:true});else schedule();setTimeout(schedule,120);setTimeout(schedule,600);setTimeout(schedule,1800);
})(window);
