(function(root){
  "use strict";
  var GENERAL = new Set(["numeros","calculo","palabras","series","memoria","sudoku","sopa","crucigrama","tiempo","verdadero","diferencias","cococorre"]);
  var raf = 0;
  function normalizeText(s){return String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim()}
  function cleanScoreNoise(card){
    card.querySelectorAll(".cocoArcadeCardScore,.cocoScoreCopy").forEach(function(n){n.remove()});
    card.querySelectorAll("p.pequeno").forEach(function(n){
      var t=normalizeText(n.textContent);
      if(/\b(puntos?|pts?)\b/.test(t) && !/partida|reto|dia/.test(t)) n.remove();
    });
    card.querySelectorAll(".pesas").forEach(function(n){
      var next=n.nextElementSibling;
      if(next && /puntos?|pts?/i.test(next.textContent||"")) next.remove();
      n.remove();
    });
  }
  function scoreStatus(card,id){
    var badge=card.querySelector(".cocoLigaBadge");
    if(!badge){
      badge=document.createElement("div");
      var btn=card.querySelector(".btn,.cocoBotonJuego");
      card.insertBefore(badge,btn||null);
    }
    var general=GENERAL.has(id);
    badge.className="cocoLigaBadge c152ScoreStatus";
    badge.dataset.general=general?"yes":"no";
    badge.setAttribute("role","status");
    badge.setAttribute("aria-disabled","true");
    badge.removeAttribute("tabindex");
    badge.innerHTML="<span>"+(general?"🏆":"•")+"</span><b>"+(general?"Puntúa para la clasificación general":"No puntúa para la clasificación general")+"</b>";
  }
  function fixAvailableCard(card,id){
    if(!/^(padel|diferencias|cococorre)$/.test(id)) return;
    card.classList.remove("cocoConstruccion","proximo");
    card.querySelectorAll(".cocoEstadoObra,.cintaObras").forEach(function(n){n.remove()});
    var btn=card.querySelector(".cocoBotonJuego,.btn");
    if(btn){
      if(/construcci|pr[oó]xim/i.test(btn.textContent||"")) btn.textContent=(id==="padel"?"Abrir Coco Pádel":"Jugar");
      btn.disabled=false; btn.removeAttribute("aria-disabled");
    }
    if(id==="padel"){
      var p=card.querySelector(".cocoDescripcion,p.pequeno.apagado");
      if(p && /demuestra todo lo que sabes sobre p[aá]del/i.test(p.textContent||"")) p.textContent="Organiza jugadores, mixings, campeonatos, jornadas y resultados.";
    }
  }
  function fixCards(){
    document.querySelectorAll(".cocoGameCard[data-coco-juego]").forEach(function(card){
      var id=(card.dataset.cocoJuego||"").toLowerCase();
      cleanScoreNoise(card);
      scoreStatus(card,id);
      fixAvailableCard(card,id);
    });
  }
  function fixMiniPadel(){
    document.querySelectorAll("[data-coco-juego='padel']").forEach(function(node){
      node.querySelectorAll(".cocoEstadoObra").forEach(function(n){n.remove()});
    });
    document.querySelectorAll(".cocoMiniJuego,.retoLista").forEach(function(node){
      if(!/p[aá]del/i.test(node.textContent||"")) return;
      node.querySelectorAll(".cocoEstadoObra").forEach(function(n){n.remove()});
      var state=Array.from(node.querySelectorAll("small,span")).find(function(n){return /construcci/i.test(n.textContent||"")});
      if(state) state.textContent="Disponible";
    });
  }
  function fixVersion(){
    document.querySelectorAll("[data-coco-version],.c144Kicker,.c144ModalKicker").forEach(function(n){
      if(/v15[01]\.0/i.test(n.textContent||"")) n.textContent=(n.textContent||"").replace(/v15[01]\.0/ig,"v152.0");
    });
    root.COCO_VERSION="152.0";
  }
  function apply(){raf=0;fixCards();fixMiniPadel();fixVersion()}
  function schedule(){if(!raf)raf=requestAnimationFrame(apply)}
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",schedule,{once:true});else schedule();
  setTimeout(schedule,120);setTimeout(schedule,600);setTimeout(schedule,1800);
})(window);
