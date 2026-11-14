/* Coco en Forma · PWA manager v160.100.0 */
(function(root){
  "use strict";
  var VERSION="160.100.0-family-profile-reports";
  var SW_TAG="160118-r1";
  root.__COCO_PWA_MANAGER_VERSION__=VERSION;
  function isStandalone(){try{return Boolean((root.matchMedia&&root.matchMedia("(display-mode: standalone)").matches)||root.navigator.standalone===true)}catch(_){return false}}
  function dispatchReady(registration){try{root.dispatchEvent(new CustomEvent("coco:pwa-ready",{detail:{version:VERSION,standalone:isStandalone(),registration:Boolean(registration)}}))}catch(_){}}
  function register(){
    if(!("serviceWorker" in navigator)||location.protocol==="file:"){dispatchReady(null);return}
    if(root.__COCO_PWA_REGISTRATION_OWNER__||root.__cocoPwaV16043Booted)return;
    root.__COCO_PWA_REGISTRATION_OWNER__="manager-v160100";root.__cocoPwaV16043Booted=true;
    var hadController=Boolean(navigator.serviceWorker.controller),updateRequested=false,reloading=false;
    function reloadForUpdate(){
      if(!hadController||!updateRequested||reloading)return;
      reloading=true;location.reload()
    }
    navigator.serviceWorker.addEventListener("controllerchange",reloadForUpdate);
    var swUrl=new URL("./sw.js?v="+SW_TAG,document.baseURI).href,scope=new URL("./",document.baseURI).pathname;
    navigator.serviceWorker.register(swUrl,{scope:scope,updateViaCache:"none"}).then(function(registration){
      function offerUpdate(worker){
        if(!worker||!hadController||document.querySelector(".cocoV134Update"))return;
        var app=document.getElementById("cocoApp")||document.body,button=document.createElement("button");
        button.type="button";button.className="cocoV134Update";button.textContent="Nueva versión disponible · actualizar";
        button.onclick=function(){
          if(updateRequested)return;
          updateRequested=true;button.disabled=true;
          var waiting=registration.waiting||worker;
          if(waiting.state==="activated"||waiting.state==="redundant"){reloadForUpdate();return}
          try{waiting.postMessage({type:"SKIP_WAITING"})}catch(_){updateRequested=false;button.disabled=false}
        };
        app.appendChild(button)
      }
      offerUpdate(registration.waiting);
      registration.addEventListener("updatefound",function(){var worker=registration.installing;if(!worker)return;worker.addEventListener("statechange",function(){if(worker.state==="installed")offerUpdate(worker)})});
      if(navigator.onLine!==false)try{registration.update()}catch(_){}
      dispatchReady(registration)
    }).catch(function(){dispatchReady(null)})
  }
  root.addEventListener("pageshow",function(event){if(!event.persisted||!("serviceWorker" in navigator))return;navigator.serviceWorker.getRegistration(new URL("./",document.baseURI).href).then(function(registration){if(registration&&navigator.onLine!==false)try{registration.update()}catch(_){}}).catch(function(){})});
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",register,{once:true});else register()
})(window);
