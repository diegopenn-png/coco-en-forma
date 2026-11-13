import {TERMS_VERSION,NOELIA,occasions} from './catalog.mjs';
import {api,randomKey,safeCheckout} from './shared.mjs';
export function madridToday(now=new Date()){return new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}).format(now)}
export function needsQuote(v){return v.product==='custom'||v.custom||v.food||v.delivery==='shipping'}
export function message(v,reference){return ['*FLORES Y TARTA · FICHA DE ENCARGO*',reference?'Referencia: '+reference:'Solicitud pendiente de confirmar','', 'Producto: '+(v.product==='custom'?'Encargo a medida':'Tarta + ramo de rosas'), 'Importe: '+(needsQuote(v)?'Solicitar presupuesto':'120 € · conjunto de referencia'),'Ocasión: '+v.occasion,'Fecha deseada: '+v.date,'Nombre: '+v.name,'Teléfono: '+v.phone,'Correo: '+v.email,'Destinatario: '+(v.recipient||'Por indicar'),'Entrega: '+({coordinate:'Coordinar con Noelia',pickup:'Recogida acordada',shipping:'Consultar entrega a domicilio'}[v.delivery]||v.delivery),v.address?'Dirección: '+v.address:'','Dedicatoria: '+(v.dedication||'Sin dedicatoria'),'Observaciones: '+(v.notes||'Sin observaciones'),v.food?'Consultar ingredientes, alérgenos o adaptación antes de comprar.':'','','La fecha, la personalización y la entrega quedan sujetas a confirmación de Noelia.','Estado del pago: no confirmado por este mensaje.'].filter(x=>x!==undefined).join('\n')}
export function whatsappURL(v,reference){return 'https://wa.me/'+NOELIA+'?text='+encodeURIComponent(message(v,reference))}
const form=document.getElementById('gift-form');
if(form){
const $=id=>document.getElementById(id),status=$('form-status');let busy=false;
$('date').min=madridToday();
function values(){const v=Object.fromEntries(new FormData(form));for(const k of ['custom','food','agreed','consent'])v[k]=form.elements[k].checked;return v}
function refresh(){const v=values(),quote=needsQuote(v);$('address-field').hidden=v.delivery!=='shipping';$('address').required=v.delivery==='shipping';$('summary-label').textContent=quote?'Tu propuesta a medida':'Tarta + ramo de rosas';$('summary-total').textContent=quote?'A consultar':'120 €';$('summary-note').textContent=quote?'Noelia confirmará composición, entrega y precio antes del pago.':'Entrega y fecha a acordar con Noelia.';$('pay').hidden=quote;$('agreed-row').hidden=quote;}
form.addEventListener('change',refresh);refresh();
for(const a of document.querySelectorAll('[data-occasion]'))a.addEventListener('click',()=>{$('occasion').value=a.dataset.occasion;refresh()});
for(const a of document.querySelectorAll('[data-custom]'))a.addEventListener('click',()=>{$('product').value='custom';$('custom').checked=true;refresh()});
form.addEventListener('submit',async e=>{e.preventDefault();if(busy||!form.reportValidity())return;const v=values();if(!occasions.includes(v.occasion)||v.date<madridToday()){status.textContent='Revisa la ocasión y elige una fecha de hoy en adelante.';return}status.textContent='';
if(e.submitter?.value!=='pay'){window.open(whatsappURL(v),'_blank','noopener,noreferrer');status.textContent='Tu ficha está preparada. Pulsa Enviar en WhatsApp para que llegue a Noelia.';return}
if(needsQuote(v)){status.textContent='Este encargo necesita presupuesto. Envíalo a Noelia por WhatsApp.';return}if(!v.agreed){status.textContent='Antes de pagar, confirma los detalles con Noelia y marca la casilla de confirmación.';$('agreed').focus();return}
busy=true;$('pay').disabled=true;status.textContent='Preparando tu pedido y el pago seguro…';
try{const payload={...v,adult:true,terms:TERMS_VERSION};const fingerprint=JSON.stringify(payload);let last;try{last=JSON.parse(sessionStorage.getItem('coco_gift_request')||'null')}catch{}
const identity=last?.fingerprint===fingerprint?last.identity:{id:crypto.randomUUID(),key:randomKey()};
// Persist the idempotency key before network I/O so retries do not create another order.
sessionStorage.setItem('coco_gift_request',JSON.stringify({fingerprint,identity}));
const r=await api('/orders',{...payload,request_id:identity.id,access_key:identity.key});
localStorage.setItem('coco_gift_last_order',JSON.stringify(identity));sessionStorage.setItem('coco_gift_details',JSON.stringify({id:identity.id,values:v}));
const recovery=$('order-recovery');recovery.hidden=false;recovery.replaceChildren();const a=document.createElement('a');a.href='pedido.html#id='+identity.id+'&key='+identity.key;a.textContent='Tu pedido '+r.order.reference+' está guardado. Consultar o reintentar el pago →';recovery.append(a);
const result=await api('/checkout',identity);if(result.url)safeCheckout(result.url);else location.assign(a.href);
}catch(err){status.textContent=err.message||'No se pudo abrir el pago. Puedes contactar con Noelia por WhatsApp.'}finally{busy=false;$('pay').disabled=false}
});
$('share').addEventListener('click',async()=>{const data={title:'Regalos con flores y tarta · Flores y tarta',url:'https://cocoenforma.com/regalos/'};try{if(navigator.share)await navigator.share(data);else{await navigator.clipboard.writeText(data.url);$('toast').textContent='Enlace copiado';setTimeout(()=>$('toast').textContent='',3000)}}catch(e){if(e.name!=='AbortError'){$('toast').textContent='Enlace: '+data.url;setTimeout(()=>$('toast').textContent='',7000)}}});
}
