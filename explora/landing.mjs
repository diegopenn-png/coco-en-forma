import {currentAccess} from './access.mjs';
async function personalize(){
 const links=[...document.querySelectorAll('a[href="jugar.html"]')];
 try{const access=await currentAccess();
  for(const a of links){a.dataset.defaultLabel ||= a.textContent;a.textContent=access?.master?'Entrar · máster gratis →':access?.credits>0?'Entrar a mi evaluación →':a.dataset.defaultLabel}
  const badge=document.querySelector('.hero .meta span:last-child');
  if(badge)badge.textContent=access?.master?'Acceso máster · gratis e ilimitado':access?.credits>0?'Evaluación ya disponible':'Informe PDF · 15 € para clientes';
 }catch{/* The evaluation page offers an explicit retry if the account check fails. */}
}
window.addEventListener('coco-access-changed',personalize);personalize();
