/* Coco en Forma · PWA manager v160 FINAL3 */
(function(root){
  "use strict";
  var VERSION="160.0.0-final3";
  var SW_TAG="160003";
  var RELOAD_KEY="coco_pwa_controller_reload_v1603";
  root.__COCO_PWA_MANAGER_VERSION__=VERSION;
  function isStandalone(){try{return Boolean((root.matchMedia&&root.matchMedia("(display-mode: standalone)").matches)||root.navigator.standalone===true)}catch(_){return false}}
  function dispatchReady(registration){try{root.dispatchEvent(new CustomEvent("coco:pwa-ready",{detail:{version:VERSION,standalone:isStandalone(),registration:Boolean(registration)}}))}catch(_){}}
  function register(){
    if(!("serviceWorker" in navigator)||location.protocol==="file:"){dispatchReady(null);return}
    if(root.__cocoPwaV1603Booted)return;root.__cocoPwaV1603Booted=true;
    var hadController=Boolean(navigator.serviceWorker.controller);
    navigator.serviceWorker.addEventListener("controllerchange",function(){
      try{if(!hadController||sessionStorage.getItem(RELOAD_KEY)==="1")return;sessionStorage.setItem(RELOAD_KEY,"1")}catch(_){if(!hadController)return}
      setTimeout(function(){location.reload()},80)
    });
    var swUrl=new URL("./sw.js?v="+SW_TAG,document.baseURI).href,scope=new URL("./",document.baseURI).pathname;
    navigator.serviceWorker.register(swUrl,{scope:scope,updateViaCache:"none"}).then(function(registration){
      if(registration.waiting)registration.waiting.postMessage({type:"SKIP_WAITING"});
      registration.addEventListener("updatefound",function(){var worker=registration.installing;if(!worker)return;worker.addEventListener("statechange",function(){if(worker.state==="installed"&&registration.waiting)registration.waiting.postMessage({type:"SKIP_WAITING"})})});
      if(navigator.onLine!==false)try{registration.update()}catch(_){}
      dispatchReady(registration)
    }).catch(function(){dispatchReady(null)})
  }
  root.addEventListener("pageshow",function(event){if(!event.persisted||!("serviceWorker" in navigator))return;navigator.serviceWorker.getRegistration(new URL("./",document.baseURI).href).then(function(registration){if(registration&&navigator.onLine!==false)try{registration.update()}catch(_){}}).catch(function(){})});
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",register,{once:true});else register()
})(window);
