(function(root){
  "use strict";
  var VERSION="2026-08-20-v155.0-identidad-unificada";
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
  Object.keys(DATA).forEach(function(id){DATA[id].image="./share/"+id+".jpg?v=15500"});
  root.COCO_GAME_IDENTITY_V155=Object.freeze(DATA);
  root.COCO_VERSION=VERSION;
  var TITLE_TO_ID={};Object.keys(DATA).forEach(function(id){TITLE_TO_ID[DATA[id].name]=id});TITLE_TO_ID["Coco Fútbol"]="futbol";TITLE_TO_ID["Coco Pádel"]="padel";TITLE_TO_ID["Coco Pádel Club"]="padel";TITLE_TO_ID["Reto Tiempo"]="tiempo";
  function idOf(node){
    if(!node)return "";var id=String(node.dataset&&node.dataset.cocoJuego||node.dataset&&node.dataset.cocoSharePreview||"").trim();if(DATA[id])return id;
    var title=node.querySelector&&node.querySelector("h3,b");return title&&TITLE_TO_ID[String(title.textContent||"").trim()]||"";
  }
  function imgHtml(id,alt){var d=DATA[id];return d?'<img class="cocoOfficialThumb" src="'+d.image+'" alt="'+String(alt||d.name).replace(/&/g,"&amp;").replace(/\"/g,"&quot;")+'" loading="lazy" decoding="async">':""}
  function applyCard(card){var id=idOf(card),d=DATA[id];if(!d)return;card.dataset.cocoJuego=id;var box=card.querySelector(".emoji,.cocoIconoEspecial");if(box){box.classList.add("cocoOfficialThumbBox");if(!box.querySelector("img.cocoOfficialThumb")||box.querySelector("img").getAttribute("src")!==d.image)box.innerHTML=imgHtml(id,d.name)}var desc=card.querySelector(".cocoDescripcion,p.pequeno.apagado");if(desc&&String(desc.textContent||"").trim()!==d.description)desc.textContent=d.description}
  function applyMini(node){var id=idOf(node),d=DATA[id];if(!d)return;node.dataset.cocoJuego=id;var box=node.querySelector(".cocoMiniIcono");if(box){box.classList.add("cocoOfficialThumbBox");if(!box.querySelector("img.cocoOfficialThumb")||box.querySelector("img").getAttribute("src")!==d.image)box.innerHTML=imgHtml(id,d.name)}}
  function applyShare(modal){var title=modal.querySelector("#cocoShareTitle"),id=title&&TITLE_TO_ID[String(title.textContent||"").trim()]||"";if(!DATA[id])return;var box=modal.querySelector(".cocoSharePreview");if(box){box.classList.add("cocoOfficialThumbBox");box.innerHTML=imgHtml(id,DATA[id].name)}var p=modal.querySelector(".cocoShareSheet>p");if(p)p.textContent=DATA[id].description}
  function applyAll(){document.querySelectorAll("#cocoApp .cocoGameCard").forEach(applyCard);document.querySelectorAll("#cocoApp .cocoMiniJuego").forEach(applyMini);document.querySelectorAll("#cocoApp .cocoShareModal").forEach(applyShare);root.COCO_VERSION=VERSION}
  var style=document.createElement("style");style.id="coco-v155-identity-css";style.textContent="#cocoApp .cocoOfficialThumbBox{padding:0!important;overflow:hidden!important;background:#fff!important;aspect-ratio:1200/630!important;min-height:0!important}#cocoApp .cocoOfficialThumb{display:block!important;width:100%!important;height:100%!important;min-height:inherit!important;object-fit:cover!important;object-position:center!important;border:0!important;border-radius:inherit!important}#cocoApp .cocoMiniIcono.cocoOfficialThumbBox{width:82px!important;height:44px!important;min-width:82px!important;border-radius:10px!important;border:1px solid #d8eaf3!important}#cocoApp .cocoSharePreview.cocoOfficialThumbBox{padding:0!important;overflow:hidden!important}#cocoApp .cocoSharePreview .cocoOfficialThumb{width:100%!important;height:auto!important;aspect-ratio:1200/630!important;object-fit:cover!important}";document.head.appendChild(style);
  var raf=0;function schedule(){if(raf)return;raf=requestAnimationFrame(function(){raf=0;applyAll()})}
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",schedule,{once:true});else schedule();setTimeout(schedule,120);setTimeout(schedule,700);setTimeout(schedule,1800);
})(window);
