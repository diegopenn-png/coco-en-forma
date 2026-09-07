/* Coco en Forma · Reto 2026 placement · v1 */
(function(){
  "use strict";
  if(window.__COCO_RETO_2026_V1__)return;
  window.__COCO_RETO_2026_V1__=true;

  var state={old:null,parent:null,next:null,promo:null,lastMobile:null};

  function byText(root,re){
    var nodes=(root||document).querySelectorAll("h1,h2,h3,h4,p,span,strong,b,div");
    for(var i=0;i<nodes.length;i++){
      var t=String(nodes[i].textContent||"").replace(/\s+/g," ").trim();
      if(t.length<120&&re.test(t))return nodes[i];
    }
    return null;
  }

  function findOldColumn(app,grid){
    var direct=app.querySelector(".marcaHeroe");
    if(direct && !direct.contains(grid)) return direct;

    var hit=byText(app,/activa\s+tu\s+supercerebro/i);
    if(hit){
      var n=hit;
      for(var i=0;n&&i<7;i++,n=n.parentElement){
        if(n.querySelector&&n.querySelector("img")&&!n.querySelector(".cocoGameCard")) return n;
      }
    }

    var imgs=Array.prototype.slice.call(app.querySelectorAll("img")).filter(function(img){
      if(grid.contains(img))return false;
      var r=img.getBoundingClientRect();
      return r.height>180 && r.height>r.width*1.1;
    });
    if(imgs.length){
      var im=imgs[0], p=im.parentElement;
      for(var j=0;p&&j<5;j++,p=p.parentElement){
        if(!p.querySelector(".cocoGameCard")) return p;
      }
    }
    return null;
  }

  function makePromo(){
    var wrap=document.createElement("section");
    wrap.className="cocoReto2026Promo";
    wrap.setAttribute("aria-label","Reto Coco en Forma 2026");
    var img=document.createElement("img");
    img.src="./reto-coco-2026.jpg?v=1609431";
    img.alt="Reto Coco en Forma 2026. Los 3 jugadores con mayor puntuación acumulada al 31 de diciembre de 2026 recibirán un llavero 3D exclusivo de Coco en Forma, impreso con nuestra impresora 3D, y un diploma personalizado de Campeón Coco en Forma 2026.";
    img.decoding="async";
    img.loading="eager";
    wrap.appendChild(img);
    return wrap;
  }

  function ensureStyle(){
    if(document.getElementById("coco-reto-2026-style"))return;
    var s=document.createElement("style");
    s.id="coco-reto-2026-style";
    s.textContent=
      "#cocoApp .cocoReto2026Promo{box-sizing:border-box;margin:0;max-width:100%;}"+
      "#cocoApp .cocoReto2026Promo img{display:block;width:100%;height:auto;border-radius:22px;box-shadow:0 8px 22px rgba(22,56,78,.12);}"+
      "@media(min-width:821px){"+
        "#cocoApp .marcaHeroe{height:auto!important;align-self:start!important;justify-content:flex-start!important;}"+
        "#cocoApp .marcaHeroe>.cocoReto2026Promo{width:100%;max-width:330px;margin:0 auto 16px;}"+
      "}"+
      "@media(max-width:820px){"+
        "#cocoApp .cocoReto2026Promo{width:100%;margin:8px 0 18px;}"+
        "#cocoApp .cocoReto2026Promo img{border-radius:20px;}"+
        "#cocoApp .marcaHeroe{height:auto!important;max-width:none!important;min-width:0!important;width:100%!important;margin:18px 0 0!important;}"+
      "}";
    document.head.appendChild(s);
  }

  function directChildUnder(node,ancestor){
    if(!node||!ancestor)return null;
    var n=node;
    while(n&&n.parentElement!==ancestor)n=n.parentElement;
    return n&&n.parentElement===ancestor?n:null;
  }

  function commonAncestor(a,b){
    if(!a||!b)return null;
    var seen=new Set(),n=a;
    while(n){seen.add(n);n=n.parentElement}
    n=b;while(n){if(seen.has(n))return n;n=n.parentElement}
    return null;
  }

  function place(){
    var app=document.getElementById("cocoApp");
    if(!app)return false;
    var grid=app.querySelector(".cocoGridJuegos");
    if(!grid)return false;

    ensureStyle();

    if(!state.old || !document.documentElement.contains(state.old)){
      state.old=findOldColumn(app,grid);
      if(state.old){
        state.parent=state.old.parentNode;
        state.next=state.old.nextSibling;
      }
    }
    if(!state.old)return false;

    if(!state.promo || !document.documentElement.contains(state.promo)){
      state.promo=makePromo();
    }

    var mobile=window.matchMedia("(max-width:820px)").matches;
    var old=state.old, promo=state.promo;

    if(!mobile){
      if(state.parent && old.parentNode!==state.parent){
        if(state.next && state.next.parentNode===state.parent) state.parent.insertBefore(old,state.next);
        else state.parent.appendChild(old);
      }
      if(promo.parentNode!==old || old.firstChild!==promo) old.insertBefore(promo,old.firstChild);
      state.lastMobile=false;
      return true;
    }

    var gamesWrap=grid.closest(".cocoGruposJuegos")||grid;
    var common=commonAncestor(old,gamesWrap);
    if(!common)return false;
    var gamesBranch=directChildUnder(gamesWrap,common);
    var oldBranch=directChildUnder(old,common);
    if(!gamesBranch||!oldBranch)return false;

    if(promo.parentNode!==common || promo.nextSibling!==gamesBranch){
      common.insertBefore(promo,gamesBranch);
    }
    if(oldBranch!==old && oldBranch.contains(old)){
      if(!oldBranch.querySelector(".cocoGameCard")) common.insertBefore(oldBranch,gamesBranch.nextSibling);
      else common.insertBefore(old,gamesBranch.nextSibling);
    }else{
      common.insertBefore(old,gamesBranch.nextSibling);
    }
    state.lastMobile=true;
    return true;
  }

  [0,80,250,700,1400,2600].forEach(function(ms){setTimeout(place,ms)});
  addEventListener("resize",function(){setTimeout(place,40)},{passive:true});
  addEventListener("orientationchange",function(){setTimeout(place,120)},{passive:true});
  document.addEventListener("visibilitychange",function(){if(!document.hidden)setTimeout(place,60)},{passive:true});
})();