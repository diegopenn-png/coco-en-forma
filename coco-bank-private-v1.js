/* Coco Bank private loader. No private interface/data are shipped in the public shell.
 * Server authorization is mandatory; local identity checks only avoid irrelevant requests.
 */
(function(){
 'use strict';if(window.__COCO_BANK_LOADER_V1)return;window.__COCO_BANK_LOADER_V1=true;
 const API='https://coco-bank-private.chatinmobiliario.workers.dev';
 const OWNER='88c250d6-3f3c-4e82-95ea-951dd914949d';
 let client=null,allowed=false,overlay=null,frame=null,channel=null,epoch=0,checking=false,lastCheck=0,observer=null,opening=false,oldOverflow='',previousFocus=null;
 function close(){if(overlay){overlay.remove();document.body.style.overflow=oldOverflow;previousFocus?.focus?.()}overlay=frame=channel=null;opening=false;}
 function revoke(){epoch++;allowed=false;close();document.querySelectorAll('[data-coco-bank-entry]').forEach(n=>n.remove())}
 async function session(){try{return (await client.auth.getSession()).data.session}catch{return null}}
 async function request(path,body){const s=await session();if(!s||s.user?.id!==OWNER){revoke();throw new Error('Inicia sesión con la cuenta autorizada.')}const generation=epoch;
  const r=await fetch(API+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+s.access_token,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(22000)});
  if(r.status===401||r.status===403){revoke();throw new Error('Esta versión está reservada a la cuenta autorizada.')}if(generation!==epoch)throw new Error('La sesión ha cambiado.');
  if(!r.ok){let d;try{d=await r.json()}catch{}throw new Error(d?.error||'No se pudo conectar con Coco Bank.')}
  return path==='/bundle'?r.text():r.json();
 }
 function attach(){if(!allowed)return;const app=document.getElementById('cocoApp');if(!app)return;
  const target=app.querySelector('.panelJugador[aria-label="Mis retos"]')||app.querySelector('.carnet')?.parentElement;
  if(!target||document.querySelector('[data-coco-bank-entry]'))return;
  const entry=document.createElement('section');entry.dataset.cocoBankEntry='true';entry.setAttribute('aria-label','Coco Bank, revisión privada');
  entry.style.cssText='display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;margin:18px 0;padding:20px 22px;background:linear-gradient(110deg,#112b47,#285779);border:1px solid #cba359;border-radius:20px;color:white;box-shadow:0 9px 25px #12324b22;';
  entry.innerHTML='<div><small style="font-size:10px;color:#f5d28a;letter-spacing:1.3px;font-weight:800">SOLO TU CUENTA · REVISIÓN PRIVADA</small><h3 style="margin:6px 0;font-size:24px;color:#fff">Coco Bank</h3><p style="font-size:13px;color:#d4e3ee;margin:0">Tu banco virtual: aprende, invierte y cumple tus metas.</p></div><button type="button" style="border:0;border-radius:12px;padding:14px 20px;background:#edc46e;color:#12304a;font-weight:800;font-size:14px;cursor:pointer">Entrar en Coco Bank →</button>';
  entry.querySelector('button').addEventListener('click',open);target.prepend(entry);
 }
 async function open(){if(!allowed||opening||overlay)return;opening=true;const generation=epoch;
  previousFocus=document.activeElement;oldOverflow=document.body.style.overflow;
  overlay=document.createElement('div');overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Coco Bank');overlay.style.cssText='position:fixed;inset:0;z-index:2147483500;background:#112b47;display:grid;place-items:center;';
  const status=document.createElement('div');status.style.cssText='color:white;text-align:center;font:15px system-ui;padding:25px';status.textContent='Abriendo Coco Bank…';overlay.appendChild(status);document.body.appendChild(overlay);document.body.style.overflow='hidden';
  try{const html=await request('/bundle');if(generation!==epoch||!overlay)return;channel=crypto.randomUUID();frame=document.createElement('iframe');frame.title='Coco Bank · banco virtual privado';frame.setAttribute('sandbox','allow-scripts allow-forms');frame.setAttribute('referrerpolicy','no-referrer');frame.style.cssText='width:100%;height:100%;border:0;position:absolute;inset:0;background:#f5f6fa';frame.srcdoc=html.replace('__BANK_CHANNEL__',channel);overlay.replaceChildren(frame);frame.focus();}
  catch(e){if(overlay){status.textContent=e.message;const b=document.createElement('button');b.textContent='Volver a Coco';b.style.cssText='display:block;margin:20px auto;padding:12px 20px;';b.onclick=close;status.appendChild(b)}}finally{opening=false}
 }
 addEventListener('message',async event=>{
  const d=event.data;if(!allowed||!frame||event.source!==frame.contentWindow||!d?.cocoBank||d.channel!==channel)return;
  if(d.close){close();return}if(!['/state','/action'].includes(d.path)||!Number.isSafeInteger(d.id))return;
  const currentFrame=frame,currentChannel=channel;
  try{const data=await request(d.path,d.path==='/action'?d.body:undefined);if(frame===currentFrame&&channel===currentChannel)currentFrame.contentWindow.postMessage({reply:true,channel:currentChannel,id:d.id,data},'*')}
  catch(e){if(frame===currentFrame&&channel===currentChannel)currentFrame.contentWindow.postMessage({reply:true,channel:currentChannel,id:d.id,error:e.message},'*')}
 });
 async function check(force=false){if(checking||(!force&&Date.now()-lastCheck<45000))return;checking=true;lastCheck=Date.now();
  try{const s=await session();if(s?.user?.id!==OWNER){revoke();return}const generation=epoch;const r=await request('/access');if(generation!==epoch)return;allowed=r.allowed===true;attach();if(allowed&&new URLSearchParams(location.search).get('coco_bank')==='1'){const u=new URL(location.href);u.searchParams.delete('coco_bank');history.replaceState(null,'',u);open();}}
  catch{revoke()}finally{checking=false}
 }
 function boot(){client=window.__COCO_SUPABASE_CLIENT;
  if(!client&&window.supabase?.createClient&&window.COCO_CONFIG?.url&&window.COCO_CONFIG?.clave){client=window.supabase.createClient(window.COCO_CONFIG.url,window.COCO_CONFIG.clave,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});window.__COCO_SUPABASE_CLIENT=client}
  if(!client){setTimeout(boot,800);return}
  client.auth.onAuthStateChange((event,s)=>{if(!s||s.user?.id!==OWNER)revoke();setTimeout(()=>check(true),0)});
  let scheduled=false;observer=new MutationObserver(()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;attach()})});observer.observe(document.getElementById('cocoApp')||document.body,{childList:true,subtree:true});
  check(true);addEventListener('online',()=>check(true));addEventListener('pageshow',()=>check(true));document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')check(true)});
  setInterval(()=>{if(document.visibilityState==='visible')check()},60000);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
