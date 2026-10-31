import {buildItems,summarize} from '../../explora/engine.mjs';
import {makePDF} from '../../.github/coco-eneagrama/pdf.mjs';
export const ENNEAGRAM_PRICE='price_1UWVEXBWXPNbVxJshWAVJxu2';
export const ENNEAGRAM_SERVICE='coco_eneagrama';
export const ENNEAGRAM_TERMS='2026-10-31-v1';
const origins=new Set(['https://cocoenforma.com','https://www.cocoenforma.com']);
const uuid=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const json=(b,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{'Content-Type':'application/json','Cache-Control':'private, no-store'}});
export async function stripeRequest(env,path,fields=null,key=null){
 if(!env.STRIPE_SECRET_KEY)throw Error('Payment configuration unavailable');
 const headers={Authorization:'Bearer '+env.STRIPE_SECRET_KEY,'Stripe-Version':'2026-09-30.endive'};
 if(fields)headers['Content-Type']='application/x-www-form-urlencoded';if(key)headers['Idempotency-Key']=key;
 const r=await fetch('https://api.stripe.com/v1'+path,{method:fields?'POST':'GET',headers,body:fields?new URLSearchParams(fields):undefined,signal:AbortSignal.timeout(15000)});const data=await r.json();if(!r.ok)throw Error('Payment provider rejected operation');return data;
}
export async function enneagramAccess(env,user,db){
 const profiles=await db('perfiles?id=eq.'+user.id+'&select=rol');const master=profiles?.[0]?.rol==='propietario';
 const orders=master?[]:await db('coco_eneagrama_orders?user_id=eq.'+user.id+'&status=eq.paid&run_id=is.null&select=checkout_id');
 return {master,credits:orders?.length||0,amount:1500,currency:'eur',payments_ready:Boolean(env.STRIPE_SECRET_KEY&&env.STRIPE_WEBHOOK_SECRET)};
}
export function paymentMatches(s){return s?.metadata?.service===ENNEAGRAM_SERVICE&&uuid.test(s.metadata.user_id||'')&&s.client_reference_id===s.metadata.user_id&&s.mode==='payment'&&s.payment_status==='paid'&&s.livemode===true&&s.currency==='eur'&&s.amount_total===1500&&s.line_items?.data?.length===1&&s.line_items.data[0].price?.id===ENNEAGRAM_PRICE&&s.line_items.data[0].quantity===1;}
export async function fulfillEnneagram(env,id,db,expectedUser=null,api=stripeRequest){
 if(!/^cs_[a-zA-Z0-9_]{8,250}$/.test(id||''))return false;
 const s=await api(env,'/checkout/sessions/'+id+'?expand[]=line_items&expand[]=payment_intent.latest_charge');
 if(expectedUser&&s.metadata?.user_id!==expectedUser)return false;
 if(!paymentMatches(s))return false;
 const pi=s.payment_intent,charge=pi?.latest_charge;
 if(pi?.status!=='succeeded'||!charge||charge.refunded||charge.amount_refunded>0||charge.disputed)return false;
 await db('coco_eneagrama_orders?on_conflict=checkout_id',{method:'POST',body:{checkout_id:s.id,user_id:s.metadata.user_id,payment_intent:pi.id},headers:{Prefer:'resolution=ignore-duplicates,return=minimal'}});return true;
}
// Called only after the existing webhook has verified Stripe's signature.
export async function onEnneagramEvent(event,env,db,api=stripeRequest){
 const o=event.data?.object||{};
 if(event.type.startsWith('checkout.session.')&&o.metadata?.service===ENNEAGRAM_SERVICE){
  if(['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type))await fulfillEnneagram(env,o.id,db,null,api);
  return true;
 }
 if(['charge.refunded','charge.dispute.created'].includes(event.type)){
  const pi=typeof o.payment_intent==='string'?o.payment_intent:o.payment_intent?.id;
  if(/^pi_[A-Za-z0-9]+$/.test(pi||''))await db('coco_eneagrama_orders?payment_intent=eq.'+pi,{method:'PATCH',body:{status:'revoked'}});
  return true;
 }return false;
}
export function validateReport(body){
 const age=body.age;if(!Number.isInteger(age)||age<6||age>99||!uuid.test(body.run_id||''))return null;
 if(!body.answers||typeof body.answers!=='object'||Array.isArray(body.answers))return null;
 const answers={};for(const q of buildItems(age)){const v=body.answers[q.id];if(v!==undefined){if(!Number.isInteger(v)||v<1||v>5)return null;answers[q.id]=v}}
 const result=summarize(answers,age);return {age,answers,result,alias:String(body.alias||'Mi exploración').slice(0,40),notes:String(body.notes||'').slice(0,350),run_id:body.run_id};
}
export async function handleEnneagram(request,env,user,db,api=stripeRequest){
 const path=new URL(request.url).pathname;const access=await enneagramAccess(env,user,db);
 if(path==='/v1/eneagrama/access'&&request.method==='GET')return json(access);
 if(request.method!=='POST')return json({error:'No encontrado.'},404);
 if(!request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'Formato no admitido.'},415);
 const raw=await request.text();if(raw.length>12000)return json({error:'Petición demasiado grande.'},413);let b;try{b=JSON.parse(raw)}catch{return json({error:'Petición inválida.'},400)}
 if(path==='/v1/eneagrama/checkout'){
  if(access.master)return json({master:true});
  if(!access.payments_ready)return json({error:'El pago no está disponible temporalmente.'},503);
  if(b.adult!==true||b.terms!==ENNEAGRAM_TERMS||!uuid.test(b.request_id||''))return json({error:'Confirma la compra como adulto y las condiciones.'},400);
  const origin=request.headers.get('Origin');const base=(origins.has(origin)?origin:'https://cocoenforma.com')+'/explora/';
  const fields={mode:'payment','line_items[0][price]':ENNEAGRAM_PRICE,'line_items[0][quantity]':'1',success_url:base+'jugar.html?checkout={CHECKOUT_SESSION_ID}',cancel_url:base+'jugar.html?cancelled=1',client_reference_id:user.id,'metadata[user_id]':user.id,'metadata[service]':ENNEAGRAM_SERVICE,'metadata[terms]':ENNEAGRAM_TERMS,'metadata[adult_confirmed]':'true','payment_intent_data[metadata][service]':ENNEAGRAM_SERVICE,'payment_intent_data[metadata][user_id]':user.id,'adaptive_pricing[enabled]':'false',integration_identifier:'coco_eneagrama_yvbnqkfr',locale:'es',customer_email:user.email};
  const s=await api(env,'/checkout/sessions',fields,'eneagrama-'+user.id+'-'+b.request_id);return json({url:s.url});
 }
 if(path==='/v1/eneagrama/reconcile'){
  await fulfillEnneagram(env,b.checkout_id,db,user.id,api);return json(await enneagramAccess(env,user,db));
 }
 if(path==='/v1/eneagrama/report'){
  const data=validateReport(b);if(!data)return json({error:'Revisa los datos del informe.'},400);
  if(!data.result.eligible)return json({error:'Completa al menos cuatro frases de cada tendencia antes de generar el informe. Tu evaluación sigue disponible.'},422);
  const bytes=makePDF(data.result,{alias:data.alias,age:data.age,notes:data.notes});
  const canonical=JSON.stringify({version:2,age:data.age,answers:data.answers});
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(user.id+data.run_id+canonical));const fingerprint=[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
  const claim=await db('rpc/coco_eneagrama_claim_report',{method:'POST',body:{p_user:user.id,p_run:data.run_id,p_fingerprint:fingerprint}});
  if(!claim?.ok)return json({error:'Esta evaluación ya se utilizó o necesita un pago de 15 €. Reintentar el mismo informe no consume otra compra.'},402);
  return new Response(bytes,{headers:{'Content-Type':'application/pdf','Content-Disposition':'attachment; filename="Coco-Eneagrama-informe.pdf"','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
 }
 return json({error:'No encontrado.'},404);
}
