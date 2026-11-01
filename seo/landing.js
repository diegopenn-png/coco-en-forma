// Progressive enhancement: all landing content and links work without JavaScript.
(() => {
 'use strict';
 const back=document.querySelector('[data-back]');
 if(back)back.addEventListener('click',e=>{try{if(document.referrer&&new URL(document.referrer).origin===location.origin&&history.length>1){e.preventDefault();history.back();}}catch{}});
 const copy=document.querySelector('[data-copy]'),status=document.querySelector('[data-copy-status]');
 if(copy)copy.addEventListener('click',async()=>{
  const url=document.querySelector('link[rel="canonical"]').href;
  try{await navigator.clipboard.writeText(url);status.textContent='Enlace copiado.';}catch{
   let field=document.querySelector('.copy-fallback');if(!field){field=document.createElement('input');field.className='copy-fallback';field.readOnly=true;field.setAttribute('aria-label','Enlace para copiar');status.after(field);}field.value=url;field.focus();field.select();status.textContent='Selecciona y copia este enlace.';
  }
 });
 const search=document.querySelector('#game-search'),category=document.querySelector('#game-category'),cards=[...document.querySelectorAll('[data-game-card]')],count=document.querySelector('#result-count'),empty=document.querySelector('#empty-results');
 const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 function filter(){const term=normalize(search.value.trim()),cat=category.value;let total=0;for(const card of cards){const visible=(!cat||card.dataset.category===cat)&&normalize(card.textContent).includes(term);card.hidden=!visible;if(visible)total++;}count.textContent=`${total} ${total===1?'propuesta disponible':'propuestas disponibles'}`;empty.hidden=total>0;}
 if(search&&category){document.querySelector('.finder').hidden=false;search.addEventListener('input',filter);category.addEventListener('change',filter);}
})();
