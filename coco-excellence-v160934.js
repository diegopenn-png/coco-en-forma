/* Coco en Forma / ETERNA · v160.93.4 · excellence pass
 * Capa exclusivamente visual y de experiencia. No cambia autenticacion, pagos,
 * puntuaciones, limites diarios, memoria pedagogica ni contratos del Worker.
 */
(function(root){
  "use strict";
  if(root.__COCO_EXCELLENCE_V160934__)return;
  root.__COCO_EXCELLENCE_V160934__=true;

  var VERSION="160.93.4-excellence-pass";
  var scheduled=0,observer=null;
  var GAME={
    numeros:{name:"Une los números",time:"3-5 min",goal:"Une la secuencia completa sin repetir casillas.",steps:["Empieza en el 1","Arrastra sin levantar el dedo","Usa Pista solo si te bloqueas"]},
    calculo:{name:"Cálculo veloz",time:"2-4 min",goal:"Resuelve operaciones con precisión y a tu ritmo.",steps:["Elige un nivel","Escribe cada resultado","Comprueba antes de continuar"]},
    palabras:{name:"Descifra la palabra",time:"3-5 min",goal:"Ordena las letras usando el significado como pista.",steps:["Lee la pista","Toca las letras en orden","Borra o pide una pista si hace falta"]},
    series:{name:"Series lógicas",time:"3-5 min",goal:"Descubre la regla que conecta cada elemento.",steps:["Observa los cambios","Piensa en una regla","Elige el siguiente elemento"]},
    memoria:{name:"Memoria",time:"3-6 min",goal:"Encuentra todas las parejas recordando su posición.",steps:["Gira dos tarjetas","Recuerda lo que aparece","Forma todas las parejas"]},
    sudoku:{name:"Sudoku",time:"4-8 min",goal:"Completa el tablero sin repetir números.",steps:["Mira la fila y la columna","Descarta los números repetidos","Completa primero las casillas seguras"]},
    sopa:{name:"Sopa de letras",time:"3-6 min",goal:"Localiza todas las palabras escondidas.",steps:["Lee la lista","Busca en varias direcciones","Marca cada palabra completa"]},
    crucigrama:{name:"Crucigrama",time:"4-8 min",goal:"Completa las palabras a partir de pistas claras.",steps:["Toca una casilla","Lee su pista","Escribe y revisa los cruces"]},
    tiempo:{name:"Reto tiempo",time:"2-4 min",goal:"Resuelve diez microdesafíos eligiendo un ritmo cómodo.",steps:["Elige tu ritmo","Lee antes de responder","Una pausa no borra tu progreso"]},
    verdadero:{name:"Verdadero o falso",time:"3-5 min",goal:"Decide y aprende con la explicación de cada respuesta.",steps:["Lee la afirmación completa","Elige verdadero o falso","Revisa la explicación"]},
    cocomed:{name:"Coco Med",time:"4-7 min",goal:"Aprende salud con preguntas y explicaciones seguras.",steps:["Elige dificultad","Responde una pregunta","Lee por qué es correcta"]},
    futbol:{name:"Fútbol",time:"2-4 min",goal:"Recuerda las cinco zonas y chuta a la única que faltó.",steps:["Observa cada señal","Recuerda el hueco","Chuta cuando aparezca la indicación"]},
    padel:{name:"Pádel",time:"2-5 min",goal:"Organiza el grupo rápido para pasar antes a la pista.",steps:["Agrega jugadores y niveles","Elige pistas y rondas","Crea y comparte el mixing"],tool:true}
  };
  var TITLE={"Une los numeros":"numeros","Calculo veloz":"calculo","Descifra la palabra":"palabras","Series logicas":"series","Memoria":"memoria","Sudoku":"sudoku","Sopa de letras":"sopa","Crucigrama":"crucigrama","Reto tiempo":"tiempo","Reto Tiempo":"tiempo","Verdadero o falso":"verdadero","Coco Med":"cocomed","Futbol":"futbol","Coco Futbol":"futbol","Padel":"padel","Coco Padel":"padel","Coco Padel Club":"padel"};
  var MODE_EXAMPLES={
    homework:"Ejemplo: No sé cómo empezar el ejercicio 3.",
    ask:"Ejemplo: ¿Por qué hay estaciones del año?",
    review:"Ejemplo: Hice 48 entre 6 y me dio 7.",
    explain:"Ejemplo: Explícame las fracciones desde cero.",
    exam:"Ejemplo: Tengo examen de células el viernes.",
    practice:"Ejemplo: Quiero practicar divisiones con resto."
  };

  function clean(v){return String(v==null?"":v).normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g," ").trim()}
  function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[c]})}
  function gameIdFromCard(card){
    var id=card&&card.getAttribute&&card.getAttribute("data-coco-juego");
    if(id&&GAME[id])return id;
    var title=clean(card&&card.querySelector&&card.querySelector("h3")&&card.querySelector("h3").textContent);
    return TITLE[title]||""
  }
  function gameIdFromOverlay(o){
    var title=clean(o&&o.querySelector&&o.querySelector("#cocoArcadeTitleV132")&&o.querySelector("#cocoArcadeTitleV132").textContent);
    return TITLE[title]||""
  }

  function injectStyles(){
    if(document.getElementById("coco-excellence-v160934-css"))return;
    var s=document.createElement("style");s.id="coco-excellence-v160934-css";
    s.textContent=[
      "#cocoApp .cocoExcellenceMeta{display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap;margin:10px 0 2px}",
      "#cocoApp .cocoExcellenceMeta span{display:inline-flex;align-items:center;min-height:27px;padding:4px 8px;border:1px solid #d9e9f0;border-radius:999px;background:#f8fcfe;color:#527080;font-size:10px;font-weight:850;line-height:1.2}",
      "#cocoApp .cocoGameCard[data-coco-kind='tool']{border-color:#b9dce9!important;background:linear-gradient(180deg,#f7fcff,#eef8fc)!important}",
      "#cocoApp .cocoExToolLabel{display:inline-flex;align-items:center;justify-content:center;align-self:center;margin:0 auto 7px;padding:5px 9px;border-radius:999px;background:#173f59;color:#fff;font-size:9px;font-weight:900;letter-spacing:.05em;text-transform:uppercase}",
      "#cocoApp .cocoExGuide{margin:13px 0;padding:0;border:1px solid #d8e9f1;border-radius:15px;background:#f8fcfe;color:#315d73;overflow:hidden}",
      "#cocoApp .cocoExGuide summary{display:flex;align-items:center;min-height:44px;padding:9px 12px;cursor:pointer;color:#214d65;font-size:11px;font-weight:900;list-style:none}",
      "#cocoApp .cocoExGuide summary::-webkit-details-marker{display:none}#cocoApp .cocoExGuide summary:after{content:'+';margin-left:auto;font-size:18px}#cocoApp .cocoExGuide[open] summary:after{content:'−'}",
      "#cocoApp .cocoExGuide ol{margin:0;padding:0 14px 12px 34px;color:#5a7482;font-size:10.5px;font-weight:750;line-height:1.55}",
      "#cocoApp .cocoExPace{margin:11px 0;padding:11px;border:1px solid #f0d7b5;border-radius:14px;background:#fff9f1}#cocoApp .cocoExPace>b{display:block;color:#70451e;font-size:11px}#cocoApp .cocoExPace>small{display:block;margin-top:2px;color:#98734f;font-size:9.5px;line-height:1.4}",
      "#cocoApp .cocoExPaceButtons{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:8px}#cocoApp .cocoExPace button{min-height:42px;padding:7px;border:1px solid #dfc5a4;border-radius:10px;background:#fff;color:#70451e;font:850 9.5px inherit;cursor:pointer}#cocoApp .cocoExPace button.is-active{border-color:#ef6c05;background:#ef6c05;color:#fff}",
      "#cocoApp .cocoExHealthyEnd{margin:10px 0 0;padding:10px 12px;border:1px solid #bfe4d1;border-radius:13px;background:#f1fbf6;color:#28704f;font-size:10.5px;font-weight:800;line-height:1.45}",
      "#cocoApp .cocoExFamilySummary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:12px 0 15px;padding:12px;border:1px solid #d7e9f0;border-radius:17px;background:linear-gradient(145deg,#f7fcff,#fffaf3)}",
      "#cocoApp .cocoExFamilySummary>div{min-width:0;padding:9px;border-radius:12px;background:#fff}#cocoApp .cocoExFamilySummary b{display:block;color:#173f59;font-size:10.5px}#cocoApp .cocoExFamilySummary span{display:block;margin-top:3px;color:#617b89;font-size:9.5px;font-weight:700;line-height:1.4}",
      "#cocoApp .cocoExFamilyValue{margin:0 0 14px;padding:12px 13px;border:1px solid #efd7b6;border-radius:15px;background:#fff9ef}#cocoApp .cocoExFamilyValue>b{display:block;color:#70451e;font-size:12px}#cocoApp .cocoExFamilyValue ul{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px 16px;margin:8px 0 0;padding:0;list-style:none;color:#7d6248;font-size:9.5px;font-weight:750;line-height:1.4}#cocoApp .cocoExFamilyValue li:before{content:'✓';margin-right:6px;color:#22905f;font-weight:900}",
      "#eternaOverlayV159 .cocoExModeExample{display:block;margin-top:5px;color:#3d7188;font-size:9.5px;font-weight:750;line-height:1.35}",
      "#eternaOverlayV159[data-et-age-band='teen'] .eternaV159Shell{background:#f6f8fa!important}#eternaOverlayV159[data-et-age-band='teen'] .eternaV159Top{background:linear-gradient(135deg,#132f40,#205c76)!important}#eternaOverlayV159[data-et-age-band='teen'] .eternaV160ModeBar,#eternaOverlayV159[data-et-age-band='teen'] .eternaV160Start,#eternaOverlayV159[data-et-age-band='teen'] .eternaV159Bubble{border-radius:14px!important}#eternaOverlayV159[data-et-age-band='teen'] .eternaV160StartIcon,#eternaOverlayV159[data-et-age-band='teen'] .eternaV160ModeIcon{filter:grayscale(1);opacity:.75}#eternaOverlayV159[data-et-age-band='teen'] .eternaV160StartAction{border-radius:12px!important;box-shadow:none!important}",
      "@media(max-width:700px){#cocoApp .cocoExFamilySummary{grid-template-columns:1fr}#cocoApp .cocoExFamilyValue ul{grid-template-columns:1fr}#cocoApp .cocoExPaceButtons{grid-template-columns:1fr}#cocoApp .cocoExPace button{min-height:46px}}",
      "@media(prefers-reduced-motion:reduce){#cocoApp .cocoExGuide,#cocoApp .cocoExPace button{transition:none!important}}"
    ].join("");document.head.appendChild(s)
  }

  function decorateCards(scope){
    var rootNode=scope&&scope.querySelectorAll?scope:document;
    rootNode.querySelectorAll("#cocoApp .cocoGameCard").forEach(function(card){
      var id=gameIdFromCard(card),meta=GAME[id];if(!meta)return;
      if(meta.tool){card.dataset.cocoKind="tool";if(!card.querySelector(".cocoExToolLabel")){var tool=document.createElement("span");tool.className="cocoExToolLabel";tool.textContent="Herramienta para familias y clubes";var h=card.querySelector("h3");if(h)h.parentNode.insertBefore(tool,h)}}
      if(card.querySelector(".cocoExcellenceMeta"))return;
      var box=document.createElement("div");box.className="cocoExcellenceMeta";box.setAttribute("aria-label","Duracion y objetivo");box.innerHTML='<span>⏱ '+esc(meta.time)+'</span><span>🎯 '+esc(meta.goal)+'</span>';
      var desc=card.querySelector(".cocoDescripcion,p.pequeno.apagado");if(desc&&desc.parentNode)desc.parentNode.insertBefore(box,desc.nextSibling)
    })
  }

  function pace(){try{var v=localStorage.getItem("coco_time_pace_v160934");return /^(calm|normal|challenge)$/.test(v||"")?v:"normal"}catch(e){return"normal"}}
  function setPace(v){try{localStorage.setItem("coco_time_pace_v160934",v)}catch(e){}decorateArcade()}
  function decorateArcade(){
    var o=document.querySelector("#cocoApp #cocoArcadeV132.visible,#cocoApp #cocoArcadeV132");if(!o)return;
    var id=gameIdFromOverlay(o),meta=GAME[id],hero=o.querySelector(".cocoArcadeIntro .cocoArcadeHero");
    if(meta&&hero&&!hero.querySelector(".cocoExGuide")){
      var guide=document.createElement("details");guide.className="cocoExGuide";guide.innerHTML='<summary>Cómo se juega · '+esc(meta.goal)+'</summary><ol>'+meta.steps.map(function(step){return'<li>'+esc(step)+'</li>'}).join("")+'</ol>';
      var p=hero.querySelector("p");if(p&&p.parentNode)p.parentNode.insertBefore(guide,p.nextSibling);else hero.insertBefore(guide,hero.firstChild)
    }
    if(id==="tiempo"&&hero&&!hero.querySelector(".cocoExPace")){
      var current=pace(),row=document.createElement("div");row.className="cocoExPace";row.innerHTML='<b>Elige un ritmo saludable</b><small>Tranquilo da más tiempo con puntos ajustados. Normal es el equilibrio recomendado. Reto es opcional.</small><div class="cocoExPaceButtons"><button type="button" data-coco-pace="calm">Tranquilo</button><button type="button" data-coco-pace="normal">Normal</button><button type="button" data-coco-pace="challenge">Reto</button></div>';
      row.querySelectorAll("button").forEach(function(b){b.classList.toggle("is-active",b.dataset.cocoPace===current);b.setAttribute("aria-pressed",b.dataset.cocoPace===current?"true":"false");b.onclick=function(){setPace(b.dataset.cocoPace)}});
      var difficulty=hero.querySelector(".cocoDifficulty");if(difficulty&&difficulty.parentNode)difficulty.parentNode.insertBefore(row,difficulty);else hero.appendChild(row)
    }
    var result=o.querySelector(".cocoArcadeResult");if(result&&!result.querySelector(".cocoExHealthyEnd")){
      var end=document.createElement("p");end.className="cocoExHealthyEnd";end.textContent="Misión terminada. Tu progreso ya está guardado: puedes parar aquí o volver otro día, sin perder nada.";
      var actions=result.querySelector(".cocoArcadeResultActions");if(actions)result.insertBefore(end,actions);else result.appendChild(end)
    }
  }

  function decorateModes(){
    var o=document.getElementById("eternaOverlayV159");if(!o)return;
    o.querySelectorAll("[data-et-modechoice]").forEach(function(button){
      if(button.querySelector(".cocoExModeExample"))return;var mode=button.dataset.etModechoice,copy=MODE_EXAMPLES[mode];if(!copy)return;
      var span=button.querySelector("span");if(span){var ex=document.createElement("em");ex.className="cocoExModeExample";ex.textContent=copy;span.appendChild(ex)}
    })
  }

  function decorateFamily(){
    document.querySelectorAll("#cocoApp .eternaV159FamilyCard").forEach(function(card){
      if(!card.querySelector(".cocoExFamilySummary")){
        var summary=document.createElement("section");summary.className="cocoExFamilySummary";summary.setAttribute("aria-label","Eterna en un vistazo");summary.innerHTML='<div><b>Acceso protegido</b><span>La activación, los controles y el pago pertenecen al adulto.</span></div><div><b>Aprendizaje visible</b><span>Fortalezas, temas practicados y siguiente paso en lenguaje sencillo.</span></div><div><b>Privacidad clara</b><span>Las fotos y el audio se procesan temporalmente y no se guardan por defecto.</span></div>';
        var status=card.querySelector(".eternaV159FamilyStatus");if(status&&status.parentNode)status.parentNode.insertBefore(summary,status.nextSibling);else card.insertBefore(summary,card.firstChild)
      }
      if(!card.querySelector(".cocoExFamilyValue")){
        var value=document.createElement("section");value.className="cocoExFamilyValue";value.innerHTML='<b>Qué obtiene la familia con Eterna</b><ul><li>Seis formas de ayuda escolar</li><li>Preguntas por texto, foto o voz</li><li>Pistas antes de la respuesta final</li><li>Memoria solo de señales académicas</li></ul>';
        var commercial=card.querySelector(".eternaV160FamilyPromo,.eternaV160TrialActive,.eternaV160UpgradeWrap");if(commercial&&commercial.parentNode)commercial.parentNode.insertBefore(value,commercial);else card.appendChild(value)
      }
    })
  }

  function run(){scheduled=0;injectStyles();decorateCards(document);decorateArcade();decorateModes();decorateFamily()}
  function schedule(){if(scheduled)return;scheduled=requestAnimationFrame(run)}
  function boot(){run();var app=document.getElementById("cocoApp")||document.body;if(typeof MutationObserver==="function"){observer=new MutationObserver(schedule);observer.observe(app,{childList:true,subtree:true,attributes:true,attributeFilter:["class","data-et-age-band"]})}document.addEventListener("click",schedule,true)}

  root.CocoExcellenceV160934=Object.freeze({version:VERSION,audit:function(){return{version:VERSION,games:Object.keys(GAME).length,gameGuides:true,healthyEnd:true,timePace:["calm","normal","challenge"],teenPresentation:true,familySummary:true,familyValue:true,noAuthMutation:true,noPaymentMutation:true,noScoreMutation:true}}});
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot()
})(window);
