/* Coco Bank public catalogue entry. Every saved game and parental PIN is scoped server-side to the verified account. */
(function(){
 'use strict';if(window.__COCO_BANK_LOADER_V1)return;window.__COCO_BANK_LOADER_V1=true;
 const API='https://coco-bank-private.chatinmobiliario.workers.dev';
 let client=null,allowed=false,userId=null,overlay=null,frame=null,channel=null,epoch=0,checking=false,lastCheck=0,opening=false,oldOverflow='',previousFocus=null,pendingOpen=new URLSearchParams(location.search).get('coco_bank')==='1';
 function close(){if(overlay){overlay.remove();document.body.style.overflow=oldOverflow;previousFocus?.focus?.()}overlay=frame=channel=null;opening=false;}
 function revoke(){epoch++;allowed=false;close()}
 async function session(){try{return (await client.auth.getSession()).data.session}catch{return null}}
 async function request(path,body){const s=await session();if(!s?.user?.id||s.user.id!==userId){revoke();throw Error('Entra con tu cuenta de Coco para guardar tu partida.')}const generation=epoch;
  const r=await fetch(API+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+s.access_token,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(22000)});
  if(r.status===401||r.status===403){revoke();throw Error('Vuelve a entrar con tu cuenta de Coco.')}if(generation!==epoch)throw Error('La sesión ha cambiado.');
  if(!r.ok){let d;try{d=await r.json()}catch{}throw Error(d?.error||'No se pudo conectar con Coco Bank.')}
  return path==='/bundle'?r.text():r.json();
 }
 function attach(){const app=document.getElementById('cocoApp');if(!app)return;
  app.querySelectorAll('.cocoMiniJuego[data-coco-juego="padel"],.cocoGameCard[data-coco-juego="padel"]').forEach(padel=>{
   let entry=Array.from(padel.parentElement.children).find(x=>x.dataset?.cocoBankEntry);
   if(!entry){const mini=padel.classList.contains('cocoMiniJuego');entry=document.createElement(padel.tagName);entry.className=padel.className;entry.dataset.cocoBankEntry='true';entry.dataset.cocoJuego='bank';entry.dataset.cocoExcellence='1';entry.dataset.cocoKind='tool';entry.setAttribute('aria-label','Coco Bank: aprende a ahorrar jugando');
    const img='<img class="cocoOfficialThumb" src="./share/bank-v2.jpg" alt="Coco Bank" loading="lazy" decoding="async">';
    entry.innerHTML=mini?'<span class="cocoMiniIcono cocoOfficialThumbBox">'+img+'</span><span class="cocoExToolLabel">Aprende a cuidar tu dinero</span><b>Coco Bank</b><span class="cocoBankStatus" style="grid-column:2;grid-row:3;align-self:start;width:max-content;max-width:100%;padding:2px 7px;border-radius:999px;background:#e4f8ee;color:#177655;font-size:9.5px;font-weight:900;line-height:1.35">Dinero de juego · 10+</span><div class="cocoExcellenceMeta" aria-label="Tu misión"><span>⏱ A tu ritmo</span><span>🎯 Paga, ahorra o invierte</span></div>':'<div class="emoji cocoOfficialThumbBox">'+img+'</div><h3>Coco Bank</h3><p class="cocoDescripcion">Recibe tu sueldo de juego, paga los gastos y ahorra o invierte. Coco te guía paso a paso.</p><button type="button" class="btn cocoBotonJuego" data-bank-open>Jugar a Coco Bank</button>';
    if(mini){entry.setAttribute('role','button');entry.tabIndex=0;entry.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();entry.click()}})}
   }
   if(padel.nextElementSibling!==entry)padel.after(entry);
  });
 }
 function login(){pendingOpen=true;const email=document.querySelector('#cocoApp input[type="email"]');if(email){let note=document.getElementById('coco-bank-login-note');if(!note){note=document.createElement('p');note.id='coco-bank-login-note';note.setAttribute('role','status');email.parentElement.insertBefore(note,email)}note.textContent='Entra en Coco para jugar a Coco Bank y guardar tu progreso. Si eres menor, pide ayuda a un adulto.';email.scrollIntoView({block:'center',behavior:'smooth'});email.focus({preventScroll:true})}}
 async function open(){if(opening||overlay)return;if(!allowed){await check(true);if(opening||overlay)return;if(!allowed){login();return}}opening=true;pendingOpen=false;const generation=epoch;
  const u=new URL(location.href);if(u.searchParams.has('coco_bank')){u.searchParams.delete('coco_bank');history.replaceState(null,'',u)}
  previousFocus=document.activeElement;oldOverflow=document.body.style.overflow;overlay=document.createElement('div');overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Coco Bank');overlay.style.cssText='position:fixed;inset:0;z-index:2147483500;background:#112b47;display:grid;place-items:center;';
  const status=document.createElement('div');status.style.cssText='color:white;text-align:center;font:16px system-ui;padding:25px';status.textContent='Coco está preparando tu banco…';const back=document.createElement('button');back.textContent='Volver a Coco';back.style.cssText='display:block;margin:20px auto;padding:14px 22px;border:0;border-radius:12px';back.onclick=()=>{epoch++;close()};status.appendChild(back);overlay.appendChild(status);document.body.appendChild(overlay);document.body.style.overflow='hidden';
  try{const html=await request('/bundle');if(generation!==epoch||!overlay)return;channel=crypto.randomUUID();frame=document.createElement('iframe');frame.title='Coco Bank · aprende con dinero de juego';frame.setAttribute('sandbox','allow-scripts allow-forms');frame.setAttribute('referrerpolicy','no-referrer');frame.style.cssText='width:100%;height:100%;border:0;position:absolute;inset:0;background:#f5f6fa';frame.srcdoc=html.replace('__BANK_CHANNEL__',channel);overlay.replaceChildren(frame);frame.focus()}
  catch(e){if(overlay){status.textContent=e.message;status.appendChild(back)}}finally{opening=false}
 }
 // Capture before the catalogue's legacy game handlers; Bank has its own authenticated bridge.
 window.addEventListener('click',event=>{const entry=event.target.closest?.('[data-coco-bank-entry]');if(!entry)return;event.preventDefault();event.stopImmediatePropagation();open()},true);
 addEventListener('message',async event=>{
  const d=event.data;if(!allowed||!frame||event.source!==frame.contentWindow||!d?.cocoBank||d.channel!==channel)return;
  if(d.close){close();return}if(!['/state','/action'].includes(d.path)||!Number.isSafeInteger(d.id))return;
  const currentFrame=frame,currentChannel=channel;
  try{const data=await request(d.path,d.path==='/action'?d.body:undefined);if(frame===currentFrame&&channel===currentChannel)currentFrame.contentWindow.postMessage({reply:true,channel:currentChannel,id:d.id,data},'*')}
  catch(e){if(frame===currentFrame&&channel===currentChannel)currentFrame.contentWindow.postMessage({reply:true,channel:currentChannel,id:d.id,error:e.message},'*')}
 });
 async function check(force=false){if(checking)return checking;if(!force&&Date.now()-lastCheck<45000)return;lastCheck=Date.now();
  checking=(async()=>{try{const s=await session();if(!s?.user?.id){if(userId||allowed)revoke();userId=null;return}if(userId!==s.user.id){revoke();userId=s.user.id}const generation=epoch;const r=await request('/access');if(generation===epoch)allowed=r.allowed===true;}catch{revoke()}})();
  try{await checking}finally{checking=false}if(allowed&&pendingOpen&&!opening&&!overlay)open();
 }
 function boot(){attach();client=window.__COCO_SUPABASE_CLIENT;
  if(!client&&window.supabase?.createClient&&window.COCO_CONFIG?.url&&window.COCO_CONFIG?.clave){client=window.supabase.createClient(window.COCO_CONFIG.url,window.COCO_CONFIG.clave,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});window.__COCO_SUPABASE_CLIENT=client}
  if(!client){setTimeout(boot,800);return}
  client.auth.onAuthStateChange((event,s)=>{if(s?.user?.id!==userId){revoke();userId=s?.user?.id||null}setTimeout(()=>check(true),0)});
  check(true);addEventListener('online',()=>check(true));addEventListener('pageshow',()=>check(true));document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')check(true)});setInterval(()=>{if(document.visibilityState==='visible')check()},60000);
 }
 let scheduled=false;const observer=new MutationObserver(()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;attach()})});
 function start(){observer.observe(document.getElementById('cocoApp')||document.body,{childList:true,subtree:true});boot()}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
