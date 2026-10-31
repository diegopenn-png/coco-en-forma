let config={},busy=false;
export function setNavigation(next){config=next}
export function setNavigationBusy(value){
 busy=Boolean(value);
 document.querySelectorAll('[data-explora-back],[data-explora-home],.top .brand').forEach(a=>{
  a.setAttribute('aria-disabled',String(busy));
  if(busy)a.setAttribute('tabindex','-1');else a.removeAttribute('tabindex');
 });
}
document.querySelectorAll('[data-explora-back],[data-explora-home],.top .brand').forEach(a=>a.addEventListener('click',e=>{
 if(busy){e.preventDefault();return}
 if(a.hasAttribute('data-explora-back')&&config.back){if(config.back()===false)e.preventDefault();return}
 if(config.leave&&config.leave()===false)e.preventDefault();
}));
