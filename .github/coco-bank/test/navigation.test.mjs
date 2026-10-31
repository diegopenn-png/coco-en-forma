import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {renderApp} from '../src/ui.mjs';
import {action,summary,CATALOG} from '../src/engine.mjs';
const now=Date.parse('2026-10-31T12:00:00Z');
const market={prices:{},rate:{annualPct:2.4,fetchedAt:now},events:[]};
const act=(s,a)=>action(s,market,{requestId:crypto.randomUUID(),...a},now,{parent:true});
const fixture=()=>{let s=act(null,{type:'open_account',name:'Ana <prueba>'});s=act(s,{type:'setup',config:{start:'2026-10-31',end:'2027-01-31',initial:10,salary:150,house:60,car:20,other:15,reserve:20,target:.6,title:'Mi meta',reward:10}});s=act(s,{type:'receive'});s=act(s,{type:'pay_all'});return act(s,{type:'organize'})};
async function harness(state=fixture(),failure=false){
 const handlers={},requests=[],root={innerHTML:'',addEventListener:(k,f)=>handlers[k]=f};const misc={};
 const document={getElementById:id=>id==='app'?root:['modal','status','retry'].includes(id)?(misc[id]??={innerHTML:'',replaceChildren(){}}):null,querySelectorAll:()=>[],querySelector:()=>null,addEventListener(){}};
 let listener;const parent={postMessage(msg){requests.push(msg);if(msg.path==='/state')queueMicrotask(()=>listener({source:parent,data:{reply:true,channel:msg.channel,id:msg.id,...(failure?{error:'Sin conexión'}:{data:{state,summary:summary(state,market,now),market,catalog:CATALOG,serverTime:now,parent:{configured:true}}})}}))}};
 const context={document,parent,console,crypto,structuredClone,Date,Intl,scrollTo(){},scrollY:0,setTimeout:()=>1,clearTimeout(){},addEventListener:(k,f)=>{if(k==='message')listener=f}};context.window=context;
 vm.runInNewContext(renderApp().match(/<script>([\s\S]*)<\/script>/)[1],context);
 await new Promise(r=>setImmediate(r));
 return {root,requests,click:async(attrs)=>{const b={dataset:Object.fromEntries(Object.entries(attrs).filter(([k])=>k.startsWith('data-')).map(([k,v])=>[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase()),v])),hasAttribute:k=>k in attrs};await handlers.click({target:{closest:()=>b}})}};
}
test('home separates account, bills and leftover money and escapes names',async()=>{const h=await harness();assert.match(h.root.innerHTML,/En tu cuenta tienes/);assert.match(h.root.innerHTML,/Ana &lt;prueba&gt;/);assert.match(h.root.innerHTML,/Primero, los gastos/);assert.match(h.root.innerHTML,/Puedes repartir/);assert.equal(h.requests.length,1)});
test('four main destinations and previous-screen navigation never write finances',async()=>{const h=await harness();for(const [section,text] of [['house','Te falta pagar'],['savings','¿Cuánto quieres guardar?'],['investments','Dinero para invertir']]){await h.click({'data-section':section});assert.ok(h.root.innerHTML.includes(text));assert.match(h.root.innerHTML,/data-back/);assert.match(h.root.innerHTML,/Menú principal/)}await h.click({'data-back':''});assert.match(h.root.innerHTML,/¿Cuánto quieres guardar/);await h.click({'data-back':''});assert.match(h.root.innerHTML,/Te falta pagar/);await h.click({'data-back':''});assert.match(h.root.innerHTML,/En tu cuenta tienes/);assert.equal(h.requests.length,1)});
test('menu exits directly without financial writes',async()=>{const h=await harness();await h.click({'data-next':'investments'});assert.match(h.root.innerHTML,/Dinero para invertir/);await h.click({'data-close':''});assert.equal(h.requests.at(-1).close,true);assert.equal(h.requests.filter(x=>x.path==='/action').length,0)});
test('connection errors still offer exit and retry',async()=>{const h=await harness(null,true);assert.match(h.root.innerHTML,/Sin conexión/);assert.match(h.root.innerHTML,/id="retry"/);await h.click({'data-close':''});assert.equal(h.requests.at(-1).close,true)});
test('parental setup and financial operations remain gated',()=>{assert.throws(()=>action(null,market,{type:'setup',requestId:'parent-denied'},now),/PIN parental/);let s=act(null,{type:'open_account',name:'Test'});assert.equal(s.config,null)});
